import { useState, useRef, useEffect } from "react";
import "../../findGames.css";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate, useLocation } from "react-router-dom";
import userServices from "../../services/userServices.js";
import apiFetch from "../../services/apiFetch.js";

const INITIAL_MESSAGE = {
  sender: "bot",
  text: "Hi! I'm your Game Advisor 🎮 I have access to your profile and PlayerLink data. I can recommend games, find compatible players or tell you community stats. What do you want to know?",
};

const QUICK_SUGGESTIONS = [
  "What games do you recommend?",
  "Who is compatible with me?",
  "What are my games?",
  "Fill my profile automatically",
];

export const FindGames = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [profileUpdatedToast, setProfileUpdatedToast] = useState(false);

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const autoMessageSentRef = useRef(false);

  useEffect(() => {
    if (!store.user || store.user === "undefined") navigate("/");
  }, []);

  // Auto-send message if navigated here with state.autoMessage
  useEffect(() => {
    const autoMsg = location.state?.autoMessage;
    if (autoMsg && !autoMessageSentRef.current) {
      autoMessageSentRef.current = true;
      // Small delay so the page mounts fully before sending
      setTimeout(() => sendMessage(autoMsg), 400);
    }
  }, []);

  useEffect(() => {
    const ref = chatScrollRef.current;
    if (ref) ref.scrollTop = ref.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    setError("");
    setShowSuggestions(false);
    const updatedMessages = [...messages, { sender: "user", text }];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/ai/find-games`, {
        method: "POST",
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);

      // Si el bot actualizó el perfil, recargar el store y mostrar toast
      if (data.profile_updated) {
        try {
          const updated = await userServices.getUserInfo();
          dispatch({ type: "getUserInfo", payload: updated.user });
        } catch (_) { /* silencioso */ }
        clearTimeout(toastTimerRef.current);
        setProfileUpdatedToast(true);
        toastTimerRef.current = setTimeout(() => setProfileUpdatedToast(false), 4000);
      }
    } catch (err) {
      const msg = err.message || "Connection error";
      if (msg.includes("503") || msg.includes("not configured")) {
        setError(
          "The AI service is not configured. Please contact the administrator."
        );
      } else if (msg.includes("429")) {
        setError(
          "Too many requests. Please wait a moment and try again."
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setError("");
    setShowSuggestions(true);
  };

  const userGamesCount = store.user?.profile?.games?.length ?? 0;
  const userNick = store.user?.profile?.nick_name || "Player";

  return (
    <div className="fg-page">
      <div className="fg-container">

        {/* ── Toast: perfil actualizado ── */}
        {profileUpdatedToast && (
          <div className="fg-profile-updated-toast" role="alert">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span>Profile updated! Changes have been saved.</span>
            <button onClick={() => setProfileUpdatedToast(false)} aria-label="Close">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="fg-header">
          <div className="fg-header-left">
            <div className="fg-ai-avatar">
              <i className="fa-solid fa-robot" aria-hidden="true"></i>
              <span className="fg-ai-pulse"></span>
            </div>
            <div className="fg-header-info">
              <h1 className="fg-title">Game Advisor</h1>
              <span className="fg-subtitle">
                <span className="fg-online-dot"></span>
                With access to your profile&nbsp;·&nbsp;{userGamesCount} games registered
              </span>
            </div>
          </div>
          <div className="fg-header-actions">
            <button
              className="fg-icon-btn"
              onClick={clearChat}
              title="New conversation"
              aria-label="Clear conversation"
            >
              <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* ── Mensajes ── */}
        <div className="fg-messages" ref={chatScrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`fg-message-row ${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="fg-bot-avatar" aria-hidden="true">
                  <i className="fa-solid fa-robot"></i>
                </div>
              )}
              <div className={`fg-bubble ${msg.sender}`}>{msg.text}</div>
            </div>
          ))}

          {/* Sugerencias rápidas — solo en el estado inicial */}
          {showSuggestions && messages.length === 1 && (
            <div className="fg-suggestions">
              <p className="fg-suggestions-label">Try asking:</p>
              <div className="fg-suggestions-grid">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="fg-suggestion-chip"
                    onClick={() => handleSuggestion(s)}
                    disabled={isLoading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="fg-message-row bot">
              <div className="fg-bot-avatar" aria-hidden="true">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="fg-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="fg-error">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Close error">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* ── Input area ── */}
        <div className="fg-input-area">
          <div className="fg-context-pill">
            <i className="fa-solid fa-database" aria-hidden="true"></i>
            Connected to PlayerLink&nbsp;·&nbsp;Hi, {userNick}
          </div>
          <form className="fg-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="fg-input"
              placeholder="Ask about games, players, community..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={500}
              aria-label="Message for the assistant"
            />
            <button
              type="submit"
              className="fg-send-btn"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
