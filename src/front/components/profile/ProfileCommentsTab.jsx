// ProfileCommentsTab.jsx
// Pestaña "Comments": muestra las reviews/valoraciones recibidas por el usuario.
// Incluye barra de distribución de estrellas (5★ ▓▓▓▓ 70 %) y listado individual.

import PropTypes from "prop-types";

/** Genera un color HSL determinístico a partir de un string (nickname) */
const stringToHSL = (str = "") => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 55%)`;
};

/** Mini-avatar con iniciales y color hash */
const ReviewAvatar = ({ nickname }) => {
    const initials = (nickname || "??").slice(0, 2).toUpperCase();
    const bg = stringToHSL(nickname);
    return (
        <div
            className="review-avatar"
            style={{ background: bg }}
            aria-hidden="true"
        >
            {initials}
        </div>
    );
};

/** Barra de distribución de estrellas */
const StarsDistribution = ({ reviews }) => {
    const total = reviews.length;
    const avg = total > 0
        ? (reviews.reduce((acc, r) => acc + r.stars, 0) / total).toFixed(1)
        : 0;

    const dist = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => r.stars === star).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return { star, count, pct };
    });

    return (
        <div className="stars-distribution">
            <div className="stars-dist-summary">
                <span className="stars-dist-avg">{avg}</span>
                <div className="stars-dist-avg-stars">
                    {[...Array(5)].map((_, i) => (
                        <i
                            key={i}
                            className={`fa-star fa-sm ${i < Math.round(avg) ? "fa-solid" : "fa-regular"}`}
                            style={{ color: i < Math.round(avg) ? "#ffd700" : "rgba(255,255,255,0.25)" }}
                            aria-hidden="true"
                        />
                    ))}
                </div>
                <span className="stars-dist-total">{total} review{total !== 1 ? "s" : ""}</span>
            </div>
            <div className="stars-dist-bars">
                {dist.map(({ star, count, pct }) => (
                    <div key={star} className="stars-dist-row">
                        <span className="stars-dist-label">{star}<i className="fa-solid fa-star fa-xs ms-1" style={{ color: "#ffd700" }} aria-hidden="true" /></span>
                        <div className="stars-dist-track">
                            <div
                                className="stars-dist-fill"
                                style={{ width: `${pct}%` }}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                        <span className="stars-dist-count">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ProfileCommentsTab = ({ reviews = [] }) => {
    return (
        <div className="info-section">
            <h3 className="comments-title">Comments</h3>

            {reviews && reviews.length > 0 ? (
                <>
                    <StarsDistribution reviews={reviews} />
                    <div className="comments-list">
                        {reviews.map((el) => (
                            <div key={el.id} className="comment-card">
                                <div className="comment-header">
                                    <ReviewAvatar nickname={el.author_nickname} />
                                    <span className="comment-author">{el.author_nickname}</span>
                                    <span className="comment-stars">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <i
                                                key={i}
                                                className={`fa-${i < el.stars ? "solid" : "regular"} fa-star`}
                                                style={{ color: i < el.stars ? "#ffd700" : "rgba(255,255,255,0.25)" }}
                                                aria-hidden="true"
                                            />
                                        ))}
                                        <span className="comment-stars-num">{el.stars}/5</span>
                                    </span>
                                </div>
                                <p className="comment-text">
                                    <i className="fa-solid fa-comment me-2" style={{ color: "rgba(0,229,255,0.5)" }} aria-hidden="true"></i>
                                    {el.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
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
    reviews: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            author_nickname: PropTypes.string,
            stars: PropTypes.number,
            comment: PropTypes.string,
        })
    ),
};

ReviewAvatar.propTypes = { nickname: PropTypes.string };
StarsDistribution.propTypes = { reviews: PropTypes.array.isRequired };
