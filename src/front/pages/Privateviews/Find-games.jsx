import { useState, useRef, useEffect } from "react";
import "../../findGames.css";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate, useLocation } from "react-router-dom";
import userServices from "../../services/userServices.js";
import apiFetch from "../../services/apiFetch.js";

const INITIAL_MESSAGE = {
  sender: "bot",
  text: "¡Hola! Soy tu Game Advisor 🎮 Tengo acceso a tu perfil y a los datos de PlayerLink. Puedo recomendarte juegos, encontrar jugadores compatibles contigo o contarte estadísticas de la comunidad. ¿Qué quieres saber?",
};

const QUICK_SUGGESTIONS = [
  "¿Qué juegos me recomiendas?",
  "¿Quién es compatible conmigo?",
  "¿Cuáles son mis juegos?",
  "Rellena mi perfil automáticamente",
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
      const msg = err.message || "Error de conexión";
      if (msg.includes("503") || msg.includes("not configured")) {
        setError(
          "El servicio de IA no está configurado. Contacta con el administrador."
        );
      } else if (msg.includes("429")) {
        setError(
          "Demasiadas peticiones. Espera un momento e inténtalo de nuevo."
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
  const userNick = store.user?.profile?.nick_name || "Jugador";

  return (
    <div className="fg-page">
      <div className="fg-container">

        {/* ── Toast: perfil actualizado ── */}
        {profileUpdatedToast && (
          <div className="fg-profile-updated-toast" role="alert">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            <span>¡Perfil actualizado! Los cambios ya están guardados.</span>
            <button onClick={() => setProfileUpdatedToast(false)} aria-label="Cerrar">
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
                Con acceso a tu perfil&nbsp;·&nbsp;{userGamesCount} juegos registrados
              </span>
            </div>
          </div>
          <div className="fg-header-actions">
            <button
              className="fg-icon-btn"
              onClick={clearChat}
              title="Nueva conversación"
              aria-label="Limpiar conversación"
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
              <p className="fg-suggestions-label">Prueba preguntando:</p>
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
            <button onClick={() => setError("")} aria-label="Cerrar error">
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        )}

        {/* ── Input area ── */}
        <div className="fg-input-area">
          <div className="fg-context-pill">
            <i className="fa-solid fa-database" aria-hidden="true"></i>
            Conectado a PlayerLink&nbsp;·&nbsp;Hola, {userNick}
          </div>
          <form className="fg-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="fg-input"
              placeholder="Pregunta sobre juegos, matches, comunidad..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={500}
              aria-label="Mensaje para el asistente"
            />
            <button
              type="submit"
              className="fg-send-btn"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Enviar mensaje"
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
