import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./chat.css";
import chatServices from "../services/chatServices.js";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { resolvePhoto } from "../assets/photoAssets.js";

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
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
};

// ── Item individual (componente interno) ─────────────────
const ChatListItemJSX = ({ p, navigate, userId }) => {
    const photoSrc = resolvePhoto(p.photo);

    return (
        <button
            className={`chat-list-item ${p.unread > 0 ? "has-unread" : ""}`}
            onClick={() => navigate(`/private/chat/${p.match_id}`)}
        >
            <img src={photoSrc} alt={p.nickname} className="chat-list-avatar" />

            <div className="chat-list-info">
                <div className="chat-list-nick">{p.nickname}</div>
                <div className="chat-list-last">
                    {p.last_message
                        ? (p.last_message.sender_id === userId ? "You: " : "") +
                        p.last_message.content
                        : "No messages yet"}
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
                setError("Could not load chat list.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.user?.id]);

    const withMsg = previews.filter(p => p.last_message);
    const withoutMsg = previews.filter(p => !p.last_message);

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="chats-page">
            <div className="chats-glass-container">

                {/* Header */}
                <div className="chats-header">
                    <h1 className="pl-page-title">
                        <i className="fa-solid fa-message me-2" aria-hidden="true"></i>
                        Messages
                    </h1>
                </div>

                {/* Contenido */}
                <div className="chats-list-wrapper">
                    {loading && <ChatListSkeleton />}

                    {!loading && error && (
                        <div className="chats-error">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    {!loading && !error && previews.length === 0 && (
                        <div className="chat-empty">
                            <div className="chat-empty-icon">🎮</div>
                            <p className="chat-empty-title">No chats yet</p>
                            <p className="chat-empty-subtitle">
                                Get matches to start chatting
                            </p>
                            <Link to="/private/search-a-mate" className="chat-empty-link">
                                Find players →
                            </Link>
                        </div>
                    )}

                    {!loading && !error && previews.length > 0 && (
                        <div className="chat-list">
                            {withMsg.length > 0 && (
                                <>
                                    <div className="chat-section-label">Active conversations</div>
                                    {withMsg.map(p => (
                                        <ChatListItemJSX
                                            key={p.match_id}
                                            p={p}
                                            navigate={navigate}
                                            userId={store.user.id}
                                        />
                                    ))}
                                </>
                            )}

                            {withoutMsg.length > 0 && (
                                <>
                                    <div className="chat-section-label" style={{ marginTop: withMsg.length ? "12px" : "0" }}>
                                        No messages yet
                                    </div>
                                    {withoutMsg.map(p => (
                                        <ChatListItemJSX
                                            key={p.match_id}
                                            p={p}
                                            navigate={navigate}
                                            userId={store.user.id}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chats;
