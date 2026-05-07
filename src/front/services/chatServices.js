import apiFetch from "./apiFetch";

const chatServices = {
  /** Fetch last 50 messages for a match (marks incoming as read) */
  getMessages: async (matchId) => {
    const resp = await apiFetch(`/api/chat/messages/${matchId}`);
    if (!resp.ok) throw new Error("Error al obtener mensajes");
    return resp.json();
  },

  /** Send a message to a match */
  sendMessage: async (matchId, content) => {
    const resp = await apiFetch(`/api/chat/messages/${matchId}`, {
      method: "POST",
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
    const resp = await apiFetch(`/api/chat/messages/unread/count`);
    if (!resp.ok) return { unread: 0 };
    return resp.json();
  },

  /** Chat preview list (one row per match: last msg + unread badge) */
  getChatPreviews: async (userId) => {
    const resp = await apiFetch(`/api/chat/preview/${userId}`);
    if (!resp.ok) throw new Error("Error al obtener lista de chats");
    return resp.json();
  },
};

export default chatServices;
