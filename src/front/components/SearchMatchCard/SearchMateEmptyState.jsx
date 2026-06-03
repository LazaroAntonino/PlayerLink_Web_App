// Pantalla vacía cuando no quedan perfiles que explorar.
// Usa exclusivamente variables CSS del design system (index.css :root).

import PropTypes from "prop-types";
import './SearchMatchCard.css';

// WHY: onRefresh as a prop instead of window.location.reload() — parent decides
//      the correct action (API refetch, router navigation, state reset, etc.)
export const SearchMateEmptyState = ({ playerName = "", onRefresh }) => {
    return (
        // WHY: role="status" already implies aria-live="polite" — duplicate removed
        <div className="empty-state-wrapper" role="status">
            <div className="empty-state-icon" aria-hidden="true">
                <i className="fa-solid fa-gamepad" />
            </div>

            <h2 className="empty-state-title">No more players around</h2>

            {/* WHY: two <p> tags instead of <br> inside <p> — screen readers pause at paragraph boundaries */}
            <p className="empty-state-subtitle">
                {playerName ? (
                    <>
                        <span className="empty-state-name">{playerName}</span>, you&apos;ve seen everyone nearby.
                    </>
                ) : (
                    "You've seen everyone nearby."
                )}
            </p>
            <p className="empty-state-subtitle">
                Come back later — new players join every day.
            </p>

            {onRefresh && (
                <button
                    type="button"
                    className="empty-state-btn"
                    onClick={onRefresh}
                    aria-label="Refresh to find new players"
                >
                    <i className="fa-solid fa-rotate-right" aria-hidden="true" style={{ marginRight: '0.5rem' }} />
                    Refresh
                </button>
            )}
        </div>
    );
};

SearchMateEmptyState.propTypes = {
    playerName: PropTypes.string,
    // WHY: optional — if parent doesn't supply a refresh action, button is hidden rather than broken
    onRefresh: PropTypes.func,
};
