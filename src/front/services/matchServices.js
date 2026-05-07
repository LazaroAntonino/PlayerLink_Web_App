import apiFetch from "./apiFetch";

const matchServices = {};

matchServices.getAllMatchesInfo = async (user_id) => {
  const resp = await apiFetch(`/api/matches/user/${user_id}`);
  if (!resp.ok) throw Error("Something went wrong trying to get matches info");
  return resp.json();
};

export default matchServices;