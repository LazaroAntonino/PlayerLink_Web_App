import apiFetch from "./apiFetch";

const chatServices = {
  /**
   * Fetch messages for a match.
   *
   * Options (all optional):
   *   beforeId {number} – load messages older than this ID (load-more / pagination)
   *   afterId  {number} – load messages newer than this ID (polling)
   *   limit    {number} – page size, default 30, server caps at 50
   *
   * Returns: { messages: [...], has_more: bool, oldest_id: number|null }
   */
  getMessages: async (matchId, { beforeId = null, afterId = null, limit = 30 } = {}) => {
    const params = new URLSearchParams({ limit });
    if (beforeId !== null) params.set("before_id", beforeId);
    if (afterId  !== null) params.set("after_id",  afterId);

    const resp = await apiFetch(`/api/chat/messages/${matchId}?${params}`);
    if (!resp.ok) throw new Error("Error al obtener mensajes");
    return resp.json(); // { messages, has_more, oldest_id }
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
