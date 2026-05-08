function safeJSONParse(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === "undefined") return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Error al parsear ${key}:`, e);
    return fallback;
  }
}

export const initialStore = () => {
  return {
    user: safeJSONParse("user", null),
    userMatchesInfo: null,
    itsMatchInfo: safeJSONParse("itsMatchInfo", null),
    likesSent: safeJSONParse("likesSent", []),
    dislikesSent: safeJSONParse("dislikesSent", []),
    starsByUser: null,
    searchMatchProfiles: safeJSONParse("searchMatchProfiles", []),
    matchReviewsReceived: null,
    unreadCount: 0,
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "addMatch": {
      const updatedMatches = store.userMatchesInfo
        ? [...store.userMatchesInfo, action.payload]
        : [action.payload];
      // Guarda en localStorage si quieres persistir
      localStorage.setItem("userMatchesInfo", JSON.stringify(updatedMatches));
      return {
        ...store,
        userMatchesInfo: updatedMatches,
      };
    }

    case "getSearchMatchProfilesFiltered":
      localStorage.setItem(
        "searchMatchProfiles",
        JSON.stringify(action.payload)
      );
      return {
        ...store,
        searchMatchProfiles: action.payload,
      };
    case "saveLike":
      const updatedLikes = [...store.likesSent, action.payload];
      localStorage.setItem("likesSent", JSON.stringify(updatedLikes));
      return {
        ...store,
        likesSent: updatedLikes,
      };

    case "saveDislike": {
      const updatedDislikes = [...store.dislikesSent, action.payload];
      localStorage.setItem("dislikesSent", JSON.stringify(updatedDislikes));
      return {
        ...store,
        dislikesSent: updatedDislikes,
      };
    }

    case "getSearchMatchProfiles":
      // console.log("Reducer - getSearchMatchProfiles payload:", action.payload);
      localStorage.setItem(
        "searchMatchProfiles",
        JSON.stringify(action.payload)
      ); // Guarda en localStorage
      return {
        ...store,
        searchMatchProfiles: action.payload,
      };

    case "getStarsByUser":
      return {
        ...store,
        starsByUser: action.payload,
      };

    case "getItsMatchInfo":
      return {
        ...store,
        itsMatchInfo: action.payload,
      };

    case "getAllMatchesInfo":
      return {
        ...store,
        userMatchesInfo: action.payload,
      };
    case "logout":
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("likesSent");
      localStorage.removeItem("dislikesSent");
      localStorage.removeItem("searchMatchProfiles");
      localStorage.removeItem("profile");
      localStorage.removeItem("itsMatchInfo");
      localStorage.removeItem("playerlink_onboarding");

      return {
        user: null,
        userMatchesInfo: null,
        itsMatchInfo: null,
        likesSent: [],
        dislikesSent: [],
        starsByUser: null,
        searchMatchProfiles: [],
        matchReviewsReceived: null,
        unreadCount: 0,
      };

    case "matchReviewsReceived":
      return {
        ...store,
        matchReviewsReceived: action.payload,
      };

    case "setUnreadCount":
      return {
        ...store,
        unreadCount: action.payload,
      };

    case "getUserInfo": {
      // Ensure we always store a plain object, never a raw JSON string
      const userPayload =
        typeof action.payload === "string"
          ? safeJSONParse("user", action.payload)
          : action.payload;
      localStorage.setItem("user", JSON.stringify(userPayload));
      // Clear stale session data so each LOGIN starts fresh
      localStorage.removeItem("likesSent");
      localStorage.removeItem("dislikesSent");
      localStorage.removeItem("searchMatchProfiles");
      return {
        ...store,
        user: userPayload,
        likesSent: [],
        dislikesSent: [],
        searchMatchProfiles: [],
      };
    }

    // Refresca solo store.user (usada en loadProfile) sin tocar el estado de sesión
    case "refreshUser": {
      const userPayload =
        typeof action.payload === "string"
          ? safeJSONParse("user", action.payload)
          : action.payload;
      localStorage.setItem("user", JSON.stringify(userPayload));
      return {
        ...store,
        user: userPayload,
      };
    }
    default:
      return store;
  }
}
