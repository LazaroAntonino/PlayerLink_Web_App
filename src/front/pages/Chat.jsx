import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync, createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import "./chat.css";
import chatServices from "../services/chatServices.js";
import blockServices from "../services/blockServices.js";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { resolvePhoto } from "../assets/photoAssets.js";

const POLL_MS = 4000;
const MAX_CHARS = 500;
const MAX_LINES = 3;
const LINE_HEIGHT = 24; // px aproximado por línea
const PAGE_LIMIT = 30; // mensajes por página

// ── Helpers ───────────────────────────────────────────────
const formatTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

const formatDateLabel = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Ayer";
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

const isSameDay = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
};

// ── Componente principal ──────────────────────────────────
const Chat = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { store, dispatch } = useGlobalReducer();

    const [messages, setMessages] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [otherUser, setOtherUser] = useState(null);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // ── Block state ───────────────────────────────────────────────────────
    const [menuOpen, setMenuOpen] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [blockError, setBlockError] = useState("");

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);
    const pollRef = useRef(null);
    const isTypingRef = useRef(false);
    const messagesAreaRef = useRef(null);

    // Cursor refs — updated on every load, used by polling & load-more
    const latestIdRef = useRef(null);   // highest msg id we have
    const oldestIdRef = useRef(null);   // lowest  msg id we have (for load-more)

    // ── Polling: fetch only NEW messages (after_id) ───────────────────────
    const fetchMessages = useCallback(async () => {
        try {
            if (latestIdRef.current !== null) {
                // Efficient: only fetch messages we don't have yet
                const data = await chatServices.getMessages(matchId, {
                    afterId: latestIdRef.current,
                    limit: PAGE_LIMIT,
                });
                if (data.messages.length > 0) {
                    setMessages(prev => [...prev, ...data.messages]);
                    latestIdRef.current = Math.max(...data.messages.map(m => m.id));
                    // Refresh unread badge
                    const { unread } = await chatServices.getUnreadCount();
                    dispatch({ type: "setUnreadCount", payload: unread });
                }
            } else {
                // Empty conversation — full fetch to detect first incoming message
                const data = await chatServices.getMessages(matchId, { limit: PAGE_LIMIT });
                if (data.messages.length > 0) {
                    setMessages(data.messages);
                    setHasMore(data.has_more);
                    latestIdRef.current = Math.max(...data.messages.map(m => m.id));
                    oldestIdRef.current = data.oldest_id;
                    const { unread } = await chatServices.getUnreadCount();
                    dispatch({ type: "setUnreadCount", payload: unread });
                }
            }
        } catch (err) {
            console.error("Error polling messages:", err);
        }
    }, [matchId, dispatch]);

    // ── Carga inicial ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!store.user?.id) { navigate("/"); return; }

        (async () => {
            try {
                const data = await chatServices.getMessages(matchId, { limit: PAGE_LIMIT });
                setMessages(data.messages);
                setHasMore(data.has_more);

                if (data.messages.length > 0) {
                    latestIdRef.current = Math.max(...data.messages.map(m => m.id));
                    oldestIdRef.current = data.oldest_id;
                }

                // Resolve the other user from chat previews
                const previews = await chatServices.getChatPreviews(store.user.id);
                const me = previews.find(p => String(p.match_id) === String(matchId));
                if (me) setOtherUser({ nickname: me.nickname, photo: me.photo });

                // Update unread badge
                const { unread } = await chatServices.getUnreadCount();
                dispatch({ type: "setUnreadCount", payload: unread });
            } catch (err) {
                setError("No se pudieron cargar los mensajes.");
            } finally {
                setLoading(false);
            }
        })();
    }, [matchId, store.user]);

    // ── Polling ───────────────────────────────────────────────────────────
    useEffect(() => {
        pollRef.current = setInterval(() => {
            if (isTypingRef.current || !document.hasFocus()) return;
            fetchMessages();
        }, POLL_MS);

        return () => clearInterval(pollRef.current);
    }, [fetchMessages]);

    // ── Auto-scroll al último mensaje (solo si el usuario está abajo) ─────
    useEffect(() => {
        if (!messages.length) return;
        const area = messagesAreaRef.current;
        if (!area) return;
        const nearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
        if (nearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ── Cargar mensajes anteriores (paginación hacia arriba) ──────────────
    const handleLoadMore = async () => {
        if (!hasMore || loadingMore || oldestIdRef.current === null) return;
        setLoadingMore(true);

        // Guardar scroll actual para restaurarlo tras prepend
        const area = messagesAreaRef.current;
        const scrollHeightBefore = area?.scrollHeight ?? 0;
        const scrollTopBefore = area?.scrollTop ?? 0;

        try {
            const data = await chatServices.getMessages(matchId, {
                beforeId: oldestIdRef.current,
                limit: PAGE_LIMIT,
            });

            // flushSync forces React to commit DOM synchronously so we can
            // measure the new scrollHeight immediately after — no scroll jump.
            flushSync(() => {
                setMessages(prev => [...data.messages, ...prev]);
                setHasMore(data.has_more);
                if (data.oldest_id !== null) {
                    oldestIdRef.current = data.oldest_id;
                }
            });

            // DOM is already updated here — restore scroll position precisely
            if (area) {
                area.scrollTop = scrollTopBefore + (area.scrollHeight - scrollHeightBefore);
            }
        } catch (err) {
            console.error("Error cargando mensajes anteriores:", err);
            setError("No se pudieron cargar mensajes anteriores.");
        } finally {
            setLoadingMore(false);
        }
    };

    // ── Block handler ─────────────────────────────────────────────────────
    const handleBlock = async () => {
        if (!otherUser) return;
        setBlockLoading(true);
        setBlockError("");
        try {
            // Recuperar el other_user_id del preview almacenado
            const previews = await chatServices.getChatPreviews(store.user.id);
            const preview = previews.find(p => String(p.match_id) === String(matchId));
            if (!preview) throw new Error("No se pudo identificar al usuario");
            await blockServices.blockUser(preview.other_user_id);
            dispatch({ type: "addBlockedUserId", payload: preview.other_user_id });
            // El match ha sido eliminado en el backend → volver a lista de chats
            navigate("/private/chats");
        } catch (err) {
            setBlockError(err.message || "Error al bloquear el usuario");
            setBlockLoading(false);
        }
    };

    // ── Textarea auto-grow ────────────────────────────────────────────────
    const handleTextChange = (e) => {
        const val = e.target.value;
        if (val.length > MAX_CHARS) return;
        setText(val);
        isTypingRef.current = val.length > 0;

        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "auto";
            const maxH = LINE_HEIGHT * MAX_LINES + 16;
            ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
        }
    };

    // ── Enviar mensaje ────────────────────────────────────────────────────
    const handleSend = async () => {
        const content = text.trim();
        if (!content || sending) return;

        setSending(true);
        isTypingRef.current = false;
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        try {
            const newMsg = await chatServices.sendMessage(matchId, content);
            setMessages(prev => [...prev, newMsg]);
            // Actualizar cursor de latest para que el polling no repita este mensaje
            latestIdRef.current = newMsg.id;
        } catch (err) {
            setError(err.message || "No se pudo enviar el mensaje");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Avatar del otro usuario ───────────────────────────────────────────
    const otherPhoto = resolvePhoto(otherUser?.photo);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            <div className="chat-page-wrapper">
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <button
                            className="chat-header-back"
                            onClick={() => navigate("/private/chats")}
                            aria-label="Volver"
                        >
                            <i className="fa-solid fa-arrow-left" />
                        </button>

                        {otherUser && (
                            <img src={otherPhoto} alt={otherUser?.nickname} className="chat-header-avatar" />
                        )}

                        <div className="chat-header-info">
                            <span className="chat-header-nick">
                                {otherUser?.nickname ?? "Cargando..."}
                            </span>
                            <span className="chat-header-status">
                                <i className="fa-solid fa-circle"
                                    style={{ fontSize: "0.45rem", color: "var(--color-success, #00ff88)" }}
                                    aria-hidden="true" />
                                PlayerLink
                            </span>
                        </div>

                        {/* Menú de opciones */}
                        <div className="chat-header-menu-wrapper">
                            <button
                                className="chat-header-menu-btn"
                                onClick={() => setMenuOpen(prev => !prev)}
                                aria-label="Más opciones"
                                aria-expanded={menuOpen}
                            >
                                <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                            </button>

                            {menuOpen && (
                                <>
                                    {/* Overlay invisible para cerrar el dropdown al hacer clic fuera */}
                                    <div
                                        style={{ position: "fixed", inset: 0, zIndex: 199 }}
                                        onClick={() => setMenuOpen(false)}
                                    />
                                    <div className="chat-dropdown">
                                        <button
                                            className="chat-dropdown-item chat-dropdown-item--danger"
                                            onClick={() => { setMenuOpen(false); setShowBlockModal(true); setBlockError(""); }}
                                        >
                                            <i className="fa-solid fa-ban" aria-hidden="true" />
                                            Bloquear usuario
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Messages area */}
                    <div className="chat-messages-area" ref={messagesAreaRef}>
                        {loading && (
                            <div className="chat-status-msg">
                                <i className="fa-solid fa-spinner fa-spin" /> Cargando mensajes...
                            </div>
                        )}

                        {/* Botón "cargar más" — aparece arriba cuando hay páginas anteriores */}
                        {!loading && hasMore && (
                            <div className="chat-load-more-wrapper">
                                <button
                                    className="chat-load-more-btn"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    aria-label="Cargar mensajes anteriores"
                                >
                                    {loadingMore ? (
                                        <><i className="fa-solid fa-spinner fa-spin" /> Cargando...</>
                                    ) : (
                                        <><i className="fa-solid fa-chevron-up" /> Ver mensajes anteriores</>
                                    )}
                                </button>
                            </div>
                        )}

                        {!loading && messages.length === 0 && (
                            <div className="chat-conversation-empty">
                                <div className="chat-conv-empty-icon">👋</div>
                                <p>¡Sois un match!</p>
                                <span>Sé el primero en decir hola a {otherUser?.nickname ?? "tu match"}</span>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            const mine = msg.sender_id === store.user?.id;
                            const showDateSep =
                                idx === 0 ||
                                !isSameDay(messages[idx - 1].created_at, msg.created_at);

                            return (
                                <div key={msg.id}>
                                    {showDateSep && (
                                        <div className="chat-date-separator">
                                            {formatDateLabel(msg.created_at)}
                                        </div>
                                    )}

                                    <div className={`chat-bubble-row ${mine ? "mine" : "theirs"}`}>
                                        <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                                            {msg.content}
                                            <div className="chat-bubble-meta">
                                                <span>{formatTime(msg.created_at)}</span>
                                                {mine && (
                                                    <span
                                                        className="chat-read-icon"
                                                        title={msg.read ? "Leído" : "Enviado"}
                                                    >
                                                        {msg.read ? "✓✓" : "✓"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={bottomRef} />
                    </div>

                    {/* Error bar */}
                    {error && (
                        <div className="chat-error-bar">
                            <span>{error}</span>
                            <button className="chat-error-close" onClick={() => setError("")}>×</button>
                        </div>
                    )}

                    {/* Input bar */}
                    <div className="chat-input-bar">
                        {text.length > 0 && (
                            <div
                                className="chat-char-counter"
                                style={{ color: text.length > 450 ? "var(--color-danger, #ff4d6d)" : "var(--color-text-muted, #8888aa)" }}
                            >
                                {text.length}/{MAX_CHARS}
                            </div>
                        )}
                        <div className="chat-input-row">
                            <textarea
                                ref={textareaRef}
                                className="chat-textarea"
                                placeholder="Escribe un mensaje..."
                                value={text}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                aria-label="Mensaje"
                            />
                            <button
                                className="chat-send-btn"
                                onClick={handleSend}
                                disabled={!text.trim() || sending}
                                aria-label="Enviar"
                            >
                                {sending
                                    ? <i className="fa-solid fa-spinner fa-spin" />
                                    : <i className="fa-solid fa-paper-plane" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ MODAL: Confirmar bloqueo ════════════════════════════════════ */}
            {createPortal(
                <div
                    className={`modal fade ${showBlockModal ? "show d-block" : ""}`}
                    tabIndex="-1"
                    aria-modal="true"
                    role="dialog"
                    style={{ backgroundColor: showBlockModal ? "rgba(0,0,0,0.6)" : "transparent" }}
                    onClick={(e) => { if (e.target === e.currentTarget && !blockLoading) setShowBlockModal(false); }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content modal-sci-fi">
                            <div className="modal-header modal-sci-fi-header">
                                <h5 className="modal-title modal-sci-fi-title">
                                    <i className="fa-solid fa-ban me-2" style={{ color: "#ff4d6d" }} aria-hidden="true" />
                                    Bloquear usuario
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowBlockModal(false)}
                                    aria-label="Cerrar"
                                    disabled={blockLoading}
                                />
                            </div>
                            <div className="modal-body modal-sci-fi-body">
                                <div className="chat-block-warning">
                                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                                    <span>
                                        ¿Bloquear a <strong>{otherUser?.nickname}</strong>? Esta acción eliminará
                                        el match y todos los mensajes entre vosotros. No volverá a aparecer
                                        en tu búsqueda.
                                    </span>
                                </div>
                                {blockError && (
                                    <p className="mt-3 mb-0" style={{ color: "#ff4d6d", fontSize: "0.85rem" }}>
                                        <i className="fa-solid fa-circle-exclamation me-1" aria-hidden="true" />
                                        {blockError}
                                    </p>
                                )}
                            </div>
                            <div className="modal-footer modal-sci-fi-footer">
                                <button
                                    type="button"
                                    className="btn-sci-fi-secondary pl-btn pl-btn--accent"
                                    onClick={() => setShowBlockModal(false)}
                                    disabled={blockLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn-sci-fi-primary pl-btn pl-btn--danger"
                                    onClick={handleBlock}
                                    disabled={blockLoading}
                                >
                                    {blockLoading
                                        ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true" />Bloqueando...</>
                                        : <><i className="fa-solid fa-ban me-1" aria-hidden="true" />Bloquear</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Chat;
