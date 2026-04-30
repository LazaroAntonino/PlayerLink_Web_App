import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./chat.css";
import chatServices from "../services/chatServices.js";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { PHOTO_ASSETS, DEFAULT_PHOTO } from "../assets/photoAssets.js";

// ── Skeleton ──────────────────────────────────────────────
const ChatListSkeleton = () => (
    <div className="chat-list">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="chat-skeleton-item">
                <div className="chat-skeleton-avatar skeleton-shimmer" />
                <div className="chat-skeleton-lines">
                    <div className="skeleton-shimmer skeleton-line skeleton-line--medium" />
                    <div className="skeleton-shimmer skeleton-line skeleton-line--short" />
                </div>
            </div>
        ))}
    </div>
);

// ── Helpers ───────────────────────────────────────────────
const formatTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();
    const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    if (isToday) {
        return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

// ── Componente principal ──────────────────────────────────
const Chats = () => {
    const navigate = useNavigate();
    const { store, dispatch } = useGlobalReducer();

    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!store.user?.id) { navigate("/"); return; }

        const load = async () => {
            try {
                const data = await chatServices.getChatPreviews(store.user.id);
                setPreviews(data);
            } catch (err) {
                setError("No se pudo cargar la lista de chats.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [store.user]);

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="chats-page">
            <h1>Mensajes</h1>

            {loading && <ChatListSkeleton />}

            {!loading && error && (
                <p style={{ color: "#ff4466", textAlign: "center" }}>{error}</p>
            )}

            {!loading && !error && previews.length === 0 && (
                <div className="chat-empty">
                    <div className="chat-empty-icon">🎮</div>
                    <p className="chat-empty-title">Aún no tienes chats</p>
                    <p>Consigue matches para empezar a chatear</p>
                    <Link
                        to="/private/search-a-mate"
                        style={{
                            marginTop: "1rem",
                            color: "var(--color-primary)",
                            textDecoration: "underline",
                            fontSize: "0.9rem",
                        }}
                    >
                        Buscar jugadores →
                    </Link>
                </div>
            )}

            {!loading && !error && previews.length > 0 && (
                <div className="chat-list">
                    {previews.map((p) => {
                        const photoSrc = p.photo ? (PHOTO_ASSETS[p.photo] ?? DEFAULT_PHOTO) : null;
                        const initials = (p.nickname || "??").slice(0, 2).toUpperCase();

                        return (
                            <button
                                key={p.match_id}
                                className="chat-list-item"
                                style={{ border: "none", textAlign: "left", width: "100%", background: "none" }}
                                onClick={() => navigate(`/private/chat/${p.match_id}`)}
                            >
                                {photoSrc ? (
                                    <img src={photoSrc} alt={p.nickname} className="chat-list-avatar" />
                                ) : (
                                    <div className="chat-list-avatar-placeholder">{initials}</div>
                                )}

                                <div className="chat-list-info">
                                    <div className="chat-list-nick">{p.nickname}</div>
                                    <div className="chat-list-last">
                                        {p.last_message
                                            ? (p.last_message.sender_id === store.user.id ? "Tú: " : "") +
                                            p.last_message.content
                                            : "Sin mensajes aún"}
                                    </div>
                                </div>

                                <div className="chat-list-meta">
                                    <span className="chat-list-time">
                                        {p.last_message ? formatTime(p.last_message.created_at) : ""}
                                    </span>
                                    {p.unread > 0 && (
                                        <span className="chat-unread-badge">{p.unread}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Chats;
