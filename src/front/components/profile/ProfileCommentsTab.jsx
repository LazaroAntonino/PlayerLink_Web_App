// ProfileCommentsTab.jsx
// Pestaña "Comments": muestra las reviews/valoraciones recibidas por el usuario.

import PropTypes from "prop-types";

export const ProfileCommentsTab = ({ reviews }) => {
    return (
        <div className="info-section container">
            <div className="row justify-content-around">
                <h3 className="col-1 m-2 mb-4">Comments</h3>
                <div className="col-auto m-2 mb-4"></div>
            </div>

            <div className="row">
                {reviews && reviews.length > 0 ? (
                    reviews.map((el) => (
                        <div key={el.id} className="review-card">
                            <div className="review-container">
                                <span>
                                    Author: {el.author_nickname} — {el.stars} ⭐️
                                </span>
                                <p className="m-0 border-0 review-box">
                                    <span
                                        className="fa-solid fa-comment mx-2"
                                        aria-hidden="true"
                                    ></span>
                                    {el.comment}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No comments yet.</p>
                )}
            </div>
        </div>
    );
};

ProfileCommentsTab.propTypes = {
    /** Array of review objects received by this user */
    reviews: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            author_nickname: PropTypes.string,
            stars: PropTypes.number,
            comment: PropTypes.string,
        })
    ),
};

ProfileCommentsTab.defaultProps = {
    reviews: [],
};
