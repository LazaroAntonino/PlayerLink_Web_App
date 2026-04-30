const BASE = import.meta.env.VITE_BACKEND_URL;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const chatServices = {
  /** Fetch last 50 messages for a match (marks incoming as read) */
  getMessages: async (matchId) => {
    const resp = await fetch(`${BASE}/api/chat/messages/${matchId}`, {
      headers: headers(),
    });
    if (!resp.ok) throw new Error("Error al obtener mensajes");
    return resp.json();
  },

  /** Send a message to a match */
  sendMessage: async (matchId, content) => {
    const resp = await fetch(`${BASE}/api/chat/messages/${matchId}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error || "Error al enviar mensaje");
    }
    return resp.json();
  },

  /** Total unread count across all matches */
  getUnreadCount: async () => {
    const resp = await fetch(`${BASE}/api/chat/messages/unread/count`, {
      headers: headers(),
    });
    if (!resp.ok) return { unread: 0 };
    return resp.json();
  },

  /** Chat preview list (one row per match: last msg + unread badge) */
  getChatPreviews: async (userId) => {
    const resp = await fetch(`${BASE}/api/chat/preview/${userId}`, {
      headers: headers(),
    });
    if (!resp.ok) throw new Error("Error al obtener lista de chats");
    return resp.json();
  },
};

export default chatServices;
