const url = import.meta.env.VITE_BACKEND_URL;
const searchMatchServices = {};

// Trae la información del usuario logeado (creo no hace falta)
searchMatchServices.getUserInfo = async () => {
  try {
    const resp = await fetch(url + "/api/private", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw Error("Something went wrong getting user information");
    const data = await resp.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  } catch (error) {
    return error;
  }
};

//Trae la infomación de todos los perfiles
searchMatchServices.getAllProfiles = async () => {
  try {
    const resp = await fetch(url + "/api/profiles");
    if (!resp.ok) throw Error("Failed to get all profiles");
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

//Trae la información de un solo perfil
searchMatchServices.getOneProfile = async (user_id) => {
  try {
    const resp = await fetch(url + `/api/profiles/${user_id}`);
    if (!resp.ok) throw Error(`Failed to get profile from ${user_id}`);
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

//Traer los matches del user
searchMatchServices.getUserMatchesInfo = async (user_id) => {
  try {
    const resp = await fetch(url + `/api/matches/user/${user_id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw Error(`Failed to get matches from user ${user_id}`);
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

// Trae las estrellas de las reviews de un user
searchMatchServices.getStarsByUser = async (userId) => {
  try {
    const resp = await fetch(url + `/api/reviews_received/${userId}`);
    if (!resp.ok) throw new Error(`Failed to get stars from user ${userId}`);
    const data = await resp.json();
    const reviews = data.reviews_received;


    // Calcula la media
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;

    const totalStars = reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
    const average = totalStars / reviews.length;

    return average;
  } catch (error) {
    return 0; // si no hay estrellas en vez de error, retorna 0
  }
};

// Manda los likes dados por el usuario — devuelve { is_match, match_profile?, like }
searchMatchServices.addLikeSent = async (liker_id, liked_id) => {
  try {
    const resp = await fetch(url + `/api/likes/${liker_id}/${liked_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw new Error("Failed to send a like");
    return await resp.json(); // { is_match: bool, match_profile?: {...}, like: {...} }
  } catch (error) {
    console.error(error);
    return { is_match: false, error: error.message };
  }
};

// Manda los dislikes dados por el usuario
searchMatchServices.addDislikeSent = async (rejector_id, rejected_id) => {
  try {
    const resp = await fetch(
      url + `/api/rejects/${rejector_id}/${rejected_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ rejector_id, rejected_id }),
      }
    );
    if (!resp.ok) throw new Error("Failed to send a dislike");
    return await resp.json();
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Trae los likes recibidos por el usuario logeado (creo que no hace falta)
searchMatchServices.getLikesReceived = async (userId) => {
  try {
    const resp = await fetch(url + `/api/likes_received/${userId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw new Error("Failed to get likes received");
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Trae los dislikes recibidos por el usuario logeado (creo que no hace falta)
searchMatchServices.getDislikesReceived = async (userId) => {
  try {
    const resp = await fetch(url + `/api/rejects_received/${userId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw new Error("Failed to get dislikes received");
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Trae perfiles filtrados (excluye a los que ya se dio like o dislike)
searchMatchServices.getFilteredProfiles = async (userId) => {
  try {
    const resp = await fetch(`${url}/api/profiles/profiles_to_explore/${userId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (!resp.ok) throw new Error(`Failed to get profiles to explore: ${resp.status}`);
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error("Error in getFilteredProfiles:", error);
    throw error;
  }
};


export default searchMatchServices;
