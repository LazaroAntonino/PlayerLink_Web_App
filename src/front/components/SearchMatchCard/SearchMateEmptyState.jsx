// SearchMateEmptyState.jsx
// Pantalla vacía cuando no quedan perfiles que explorar.
// Usa exclusivamente variables CSS del design system (index.css :root).

import PropTypes from "prop-types";

export const SearchMateEmptyState = ({ playerName, onAdjustFilters }) => {
    return (
        <div className="empty-state-wrapper" role="status" aria-live="polite">
            {/* Icono gamer (CSS puro, sin imagen externa) */}
            <div className="empty-state-icon" aria-hidden="true">
                <i className="fa-solid fa-gamepad" />
            </div>

            <h2 className="empty-state-title">No more players around</h2>

            <p className="empty-state-subtitle">
                {playerName ? (
                    <>
                        <span className="empty-state-name">{playerName}</span>, you&apos;ve seen everyone nearby.
                    </>
                ) : (
                    "You've seen everyone nearby."
                )}
                <br />
                Come back later or adjust your filters.
            </p>

            <button
                className="empty-state-btn"
                onClick={onAdjustFilters}
                aria-label="Adjust search filters"
            >
                <i className="fa-solid fa-sliders me-2" aria-hidden="true" />
                Adjust filters
            </button>
        </div>
    );
};

SearchMateEmptyState.propTypes = {
    /** Gamer nickname to personalise the message */
    playerName: PropTypes.string,
    /**
     * Hook ready for when filters are implemented.
     * For now it can be a no-op or open a future filters panel.
     */
    onAdjustFilters: PropTypes.func,
};

SearchMateEmptyState.defaultProps = {
    playerName: "",
    onAdjustFilters: () => { },
};
