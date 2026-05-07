import apiFetch from "./apiFetch";

const url = import.meta.env.VITE_BACKEND_URL;
const searchMatchServices = {};

// Trae la información del usuario logeado
searchMatchServices.getUserInfo = async () => {
  const resp = await apiFetch("/api/private");
  if (!resp.ok) throw Error("Something went wrong getting user information");
  const data = await resp.json();
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
};

// Trae la información de todos los perfiles (admin only after commit 1)
searchMatchServices.getAllProfiles = async () => {
  const resp = await apiFetch("/api/profiles");
  if (!resp.ok) throw Error("Failed to get all profiles");
  return resp.json();
};

// Trae la información de un solo perfil
searchMatchServices.getOneProfile = async (user_id) => {
  const resp = await apiFetch(`/api/profiles/${user_id}`);
  if (!resp.ok) throw Error(`Failed to get profile from ${user_id}`);
  return resp.json();
};

// Traer los matches del user
searchMatchServices.getUserMatchesInfo = async (user_id) => {
  const resp = await apiFetch(`/api/matches/user/${user_id}`);
  if (!resp.ok) throw Error(`Failed to get matches from user ${user_id}`);
  return resp.json();
};

// Trae las estrellas de las reviews de un user
// FIX: parameter renamed from profile.id → userId (must be user_id, not profile.id)
searchMatchServices.getStarsByUser = async (userId) => {
  try {
    const resp = await apiFetch(`/api/reviews_received/${userId}`);
    if (!resp.ok) throw new Error(`Failed to get stars from user ${userId}`);
    const data = await resp.json();
    const reviews = data.reviews_received;
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const totalStars = reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
    return totalStars / reviews.length;
  } catch (error) {
    return 0;
  }
};

// Manda los likes dados por el usuario
searchMatchServices.addLikeSent = async (liker_id, liked_id) => {
  try {
    const resp = await apiFetch(`/api/likes/${liker_id}/${liked_id}`, {
      method: "POST",
    });
    if (!resp.ok) throw new Error("Failed to send a like");
    return resp.json();
  } catch (error) {
    console.error(error);
    return { is_match: false, error: error.message };
  }
};

// Manda los dislikes dados por el usuario
searchMatchServices.addDislikeSent = async (rejector_id, rejected_id) => {
  try {
    const resp = await apiFetch(`/api/rejects/${rejector_id}/${rejected_id}`, {
      method: "POST",
      body: JSON.stringify({ rejector_id, rejected_id }),
    });
    if (!resp.ok) throw new Error("Failed to send a dislike");
    return resp.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Trae los likes recibidos por el usuario logeado
searchMatchServices.getLikesReceived = async (userId) => {
  try {
    const resp = await apiFetch(`/api/likes_received/${userId}`);
    if (!resp.ok) throw new Error("Failed to get likes received");
    return resp.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Trae los dislikes recibidos por el usuario logeado
searchMatchServices.getDislikesReceived = async (userId) => {
  try {
    const resp = await apiFetch(`/api/rejects_received/${userId}`);
    if (!resp.ok) throw new Error("Failed to get dislikes received");
    return resp.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Trae perfiles filtrados (excluye a los que ya se dio like o dislike)
searchMatchServices.getFilteredProfiles = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.append(key, val);
    }
  });
  const qs = params.toString() ? `?${params.toString()}` : "";
  const resp = await apiFetch(
    `/api/profiles/profiles_to_explore/${userId}${qs}`
  );
  if (!resp.ok)
    throw new Error(`Failed to get profiles to explore: ${resp.status}`);
  return resp.json();
};

export default searchMatchServices;
