import apiFetch from "./apiFetch";

const searchMatchServices = {};

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
    });
    if (!resp.ok) throw new Error("Failed to send a dislike");
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
