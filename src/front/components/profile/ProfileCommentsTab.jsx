// ProfileCommentsTab.jsx
// Pestaña "Comments": muestra las reviews/valoraciones recibidas por el usuario.

import PropTypes from "prop-types";

export const ProfileCommentsTab = ({ reviews }) => {
    return (
        <div className="info-section">
            <h3 className="comments-title">Comments</h3>

            {reviews && reviews.length > 0 ? (
                <div className="comments-list">
                    {reviews.map((el) => (
                        <div key={el.id} className="comment-card">
                            <div className="comment-header">
                                <span className="comment-author">
                                    <i className="fa-solid fa-user me-2" aria-hidden="true"></i>
                                    {el.author_nickname}
                                </span>
                                <span className="comment-stars">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <i
                                            key={i}
                                            className={`fa-${i < el.stars ? 'solid' : 'regular'} fa-star`}
                                            style={{ color: i < el.stars ? '#ffd700' : 'rgba(255,255,255,0.2)' }}
                                            aria-hidden="true"
                                        />
                                    ))}
                                    <span className="comment-stars-num">{el.stars}/5</span>
                                </span>
                            </div>
                            <p className="comment-text">
                                <i className="fa-solid fa-comment me-2" style={{ color: 'rgba(0,229,255,0.4)' }} aria-hidden="true"></i>
                                {el.comment}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="comments-empty">
                    <i className="fa-regular fa-comment-dots comments-empty-icon" aria-hidden="true"></i>
                    <p>No comments yet.</p>
                    <span>Get matches and let them know how well you played!</span>
                </div>
            )}
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
