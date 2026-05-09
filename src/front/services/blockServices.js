/**
 * blockServices — Bloqueos y denuncias
 *
 * Todos los métodos lanzan un Error con mensaje legible si la respuesta
 * no es ok, para que los componentes puedan mostrar el error directamente.
 */
import apiFetch from "./apiFetch";

const blockServices = {};

/**
 * Bloquea a un usuario.
 * El backend también elimina el Match existente (si lo hay).
 */
blockServices.blockUser = async (blocked_id) => {
  const resp = await apiFetch(`/api/block/${blocked_id}`, { method: "POST" });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error || "Error al bloquear el usuario");
  }
  return resp.json();
};

/**
 * Desbloquea a un usuario previamente bloqueado.
 */
blockServices.unblockUser = async (blocked_id) => {
  const resp = await apiFetch(`/api/block/${blocked_id}`, { method: "DELETE" });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error || "Error al desbloquear el usuario");
  }
  return resp.json();
};

/**
 * Devuelve la lista de usuarios bloqueados por el usuario autenticado.
 * Respuesta: { blocked_users: [{ id, blocker_id, blocked_id, created_at }] }
 */
blockServices.getMyBlocks = async () => {
  const resp = await apiFetch("/api/blocks");
  if (!resp.ok) throw new Error("Error al obtener los usuarios bloqueados");
  return resp.json();
};

/**
 * Denuncia a un usuario.
 * @param {number} reported_id
 * @param {string} reason  — texto del motivo (max 500 chars)
 */
blockServices.reportUser = async (reported_id, reason) => {
  const resp = await apiFetch(`/api/report/${reported_id}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.error || "Error al enviar la denuncia");
  }
  return resp.json();
};

export default blockServices;
