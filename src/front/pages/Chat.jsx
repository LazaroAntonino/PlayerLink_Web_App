import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./chat.css";
import chatServices from "../services/chatServices.js";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { PHOTO_ASSETS, DEFAULT_PHOTO } from "../assets/photoAssets.js";

const POLL_MS = 4000;
const MAX_CHARS = 500;
const MAX_LINES = 3;
const LINE_HEIGHT = 24; // px aproximado por línea

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
    const [otherUser, setOtherUser] = useState(null);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);
    const pollRef = useRef(null);
    const isTypingRef = useRef(false);
    const messagesAreaRef = useRef(null);

    // ── Fetch messages ────────────────────────────────────────
    const fetchMessages = useCallback(async () => {
        try {
            const data = await chatServices.getMessages(matchId);
            setMessages(data);

            // Actualizar badge global con el nuevo unread real
            const { unread } = await chatServices.getUnreadCount();
            dispatch({ type: "setUnreadCount", payload: unread });
        } catch (err) {
            console.error("Error polling messages:", err);
        }
    }, [matchId, dispatch]);

    // ── Carga inicial ─────────────────────────────────────────
    useEffect(() => {
        if (!store.user?.id) { navigate("/"); return; }
        // NOTE: store.userMatchesInfo guard removed — chat fetches its own data
        // and the guard caused an infinite spinner when the store hadn't loaded matches yet.

        (async () => {
            try {
                const data = await chatServices.getMessages(matchId);
                setMessages(data);

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
                setLoading(false);  // always hide spinner, success or error
            }
        })();
    }, [matchId, store.user]);

    // ── Polling ───────────────────────────────────────────────
    useEffect(() => {
        pollRef.current = setInterval(() => {
            // No hacer polling si el usuario está escribiendo o la ventana no tiene foco
            if (isTypingRef.current || !document.hasFocus()) return;
            fetchMessages();
        }, POLL_MS);

        return () => clearInterval(pollRef.current);
    }, [fetchMessages]);

    // ── Scroll al último mensaje ──────────────────────────────
    // Only auto-scroll when the user is already near the bottom
    // (avoids interrupting reading of older messages during polling)
    useEffect(() => {
        if (!messages.length) return;
        const area = messagesAreaRef.current;
        if (!area) return;
        const nearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 120;
        if (nearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ── Textarea auto-grow ────────────────────────────────────
    const handleTextChange = (e) => {
        const val = e.target.value;
        if (val.length > MAX_CHARS) return;
        setText(val);
        isTypingRef.current = val.length > 0;

        // Auto-resize
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "auto";
            const maxH = LINE_HEIGHT * MAX_LINES + 16;
            ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
        }
    };

    // ── Enviar mensaje ────────────────────────────────────────
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

    // ── Avatar del otro ───────────────────────────────────────
    const otherPhoto = otherUser?.photo
        ? (PHOTO_ASSETS[otherUser.photo] ?? DEFAULT_PHOTO)
        : null;
    const otherInitials = (otherUser?.nickname || "??").slice(0, 2).toUpperCase();

    // ── Render ────────────────────────────────────────────────
    return (
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

                    {otherPhoto ? (
                        <img src={otherPhoto} alt={otherUser?.nickname} className="chat-header-avatar" />
                    ) : (
                        <div className="chat-header-avatar-placeholder">{otherInitials}</div>
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
                </div>

                {/* Messages area */}
                <div className="chat-messages-area" ref={messagesAreaRef}>
                    {loading && (
                        <div className="chat-status-msg">
                            <i className="fa-solid fa-spinner fa-spin" /> Cargando mensajes...
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
                            style={{ color: text.length > 450 ? "var(--color-danger, #ff4d6d)" : "rgba(255,255,255,0.3)" }}
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
    );
};

export default Chat;
