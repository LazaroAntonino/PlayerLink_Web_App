const url = import.meta.env.VITE_BACKEND_URL;
const reviewServices = {};

reviewServices.getAllReviewsReceived = async (user_id) => {
  try {
    const resp = await fetch(url + `/api/reviews_received/${user_id}`);
    if (!resp.ok)
      throw Error("Something went wrong traying to get matches info");
    const data = await resp.json();
    return data;
  } catch (error) {
    return error;
  }
};

// services/reviewServices.js
reviewServices.postNewReview = async (
  userAuthoredId,
  userReviewedId,
  reviewData
) => {
  try {
    const resp = await fetch(
      `${url}/api/reviews/${userAuthoredId}/${userReviewedId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      }
    );

    if (!resp.ok) {
      throw new Error(
        `Error posting review: ${resp.status} ${resp.statusText}`
      );
    }

    const result = await resp.json();
    return result;
  } catch (error) {
    console.error("postNewReview:", error);
    // Lanzamos de nuevo para que el caller (handleSaveComment) pueda mostrar un error si lo desea
    throw error;
  }
};

export default reviewServices;
