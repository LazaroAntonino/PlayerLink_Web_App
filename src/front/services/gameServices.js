import apiFetch from "./apiFetch";

const gameServices = {
  postNewGame: async (profileId, form) => {
    const resp = await apiFetch(`/api/games/${profileId}`, {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        hours_played: form.hours_played,
        image: form.image,
      }),
    });
    if (!resp.ok) throw new Error("Something went wrong trying to post game info");
    return resp.json();
  },

  deleteGameById: async (game_id) => {
    const resp = await apiFetch(`/api/games/${game_id}`, { method: "DELETE" });
    if (!resp.ok) throw new Error("Something went wrong trying to delete game");
    return resp.json();
  },

  updateGameInfo: async (game_id, hours) => {
    const resp = await apiFetch(`/api/games/hours/${game_id}`, {
      method: "PUT",
      body: JSON.stringify({ hours_played: hours }),
    });
    if (!resp.ok) throw new Error("Something went wrong trying to update game");
    return resp.json();
  },
};

export default gameServices;
