// AddCommentModal.jsx
// Modal para dejar una reseña al match — React portal, coherente con AddGameModal.
// Estructura: rating de 1-5 estrellas + textarea para el comentario.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

export const AddCommentModal = ({
    isOpen,
    onClose,
    onSubmit,
    targetNickname,
    initialStars = 0,
    initialComment = "",
}) => {
    const [stars, setStars] = useState(initialStars);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Bloquear scroll del body mientras el modal está abierto
    useBodyScrollLock(isOpen);

    // Reset interno cada vez que el modal se abre
    useEffect(() => {
        if (isOpen) {
            setStars(initialStars);
            setHoverRating(0);
            setComment(initialComment);
            setError("");
            setIsSubmitting(false);
        }
    }, [isOpen, initialStars, initialComment]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === "Escape" && !isSubmitting) onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose, isSubmitting]);

    if (!isOpen) return null;

    const canSubmit = stars > 0 && comment.trim().length > 0 && !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        setError("");
        try {
            await onSubmit({ stars, comment: comment.trim() });
        } catch (err) {
            setError(err?.message || "Could not save the comment. Please try again.");
            setIsSubmitting(false);
        }
    };

    const modal = (
        <div
            className="pl-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Leave a comment"
        >
            <div className="pl-modal-box add-comment-modal">
                <div className="pl-modal-header">
                    <span className="pl-modal-title">
                        <i className="fa-solid fa-comment-dots me-2" aria-hidden="true" />
                        Leave a comment
                    </span>
                    <button
                        className="pl-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                        disabled={isSubmitting}
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <p className="pl-modal-subtitle">
                    Rate your experience playing with
                    {targetNickname ? <strong> {targetNickname}</strong> : " this player"}
                </p>

                <div className="add-comment-body">
                    {/* Rating */}
                    <div className="add-comment-field">
                        <label className="add-comment-label" htmlFor="add-comment-stars">Rating</label>
                        <div
                            id="add-comment-stars"
                            className="add-comment-stars"
                            role="radiogroup"
                            aria-label="Rating from 1 to 5 stars"
                        >
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isActive = (hoverRating || stars) >= star;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`add-comment-star${isActive ? " is-active" : ""}`}
                                        onClick={() => setStars(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                        aria-pressed={stars === star}
                                        disabled={isSubmitting}
                                    >
                                        <i className={`fa-star ${isActive ? "fa-solid" : "fa-regular"}`} aria-hidden="true" />
                                    </button>
                                );
                            })}
                            <span className="add-comment-stars-value">
                                {stars > 0 ? `${stars}/5` : "Pick a rating"}
                            </span>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="add-comment-field">
                        <label className="add-comment-label" htmlFor="add-comment-text">Comment</label>
                        <textarea
                            id="add-comment-text"
                            className="add-comment-textarea"
                            rows={4}
                            maxLength={500}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience playing with this gamer..."
                            disabled={isSubmitting}
                        />
                        <span className="add-comment-help">{comment.length}/500 characters</span>
                    </div>

                    {error && (
                        <p className="add-comment-error" role="alert">
                            <i className="fa-solid fa-circle-exclamation me-1" aria-hidden="true" />
                            {error}
                        </p>
                    )}
                </div>

                <div className="pl-modal-footer">
                    <button
                        className="pl-btn pl-btn--ghost pl-btn--sm"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="pl-btn pl-btn--primary"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {isSubmitting
                            ? <><i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />Saving…</>
                            : <><i className="fa-solid fa-paper-plane me-2" aria-hidden="true" />Save comment</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

AddCommentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    targetNickname: PropTypes.string,
    initialStars: PropTypes.number,
    initialComment: PropTypes.string,
};
