/**
 * apiFetch — wrapper centralizado sobre fetch que:
 *  1. Añade automáticamente el Authorization header con el token almacenado
 *  2. Si recibe un 401 (token expirado o inválido), limpia la sesión y
 *     redirige al usuario a /login con un mensaje explicativo
 *
 * Uso:  import apiFetch from "../services/apiFetch";
 *       const data = await apiFetch("/api/private");
 */

const BASE = import.meta.env.VITE_BACKEND_URL;

// Callback que el layout privado registra para poder hacer dispatch(logout)
// Se asigna desde el componente que tiene acceso al contexto global
let _onSessionExpired = null;
export const registerSessionExpiredHandler = (fn) => {
  _onSessionExpired = fn;
};

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  // Token expirado o inválido → logout automático
  if (response.status === 401) {
    _handleSessionExpired();
    // Lanzar error para que el caller lo capture si es necesario
    throw new SessionExpiredError("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }

  return response;
};

function _handleSessionExpired() {
  // 1. Limpiar localStorage
  [
    "token", "user", "likesSent", "dislikesSent",
    "searchMatchProfiles", "profile", "itsMatchInfo",
    "playerlink_onboarding", "playerlink_explore_filters",
    "userMatchesInfo",
  ].forEach((key) => localStorage.removeItem(key));

  // 2. Disparar callback del store (si está registrado)
  if (_onSessionExpired) {
    _onSessionExpired();
  }

  // 3. Redirigir al login con mensaje
  const loginUrl = "/?session_expired=1";
  if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/reset")) {
    window.location.href = loginUrl;
  }
}

// Error personalizado para identificar fácilmente la causa
export class SessionExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export default apiFetch;
