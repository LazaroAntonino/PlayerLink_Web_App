import apiFetch from "./apiFetch";

const url = import.meta.env.VITE_BACKEND_URL;
const reviewServices = {};

reviewServices.getAllReviewsReceived = async (user_id) => {
  const resp = await apiFetch(`/api/reviews_received/${user_id}`);
  if (!resp.ok) throw Error("Something went wrong trying to get reviews info");
  return resp.json();
};

reviewServices.postNewReview = async (userAuthoredId, userReviewedId, reviewData) => {
  const resp = await apiFetch(`/api/reviews/${userAuthoredId}/${userReviewedId}`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
  if (!resp.ok) {
    throw new Error(`Error posting review: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
};

export default reviewServices;
