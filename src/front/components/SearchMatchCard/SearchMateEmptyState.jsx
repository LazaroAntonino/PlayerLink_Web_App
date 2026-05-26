// Pantalla vacía cuando no quedan perfiles que explorar.
// Usa exclusivamente variables CSS del design system (index.css :root).

import PropTypes from "prop-types";

export const SearchMateEmptyState = ({ playerName }) => {
    return (
        <div className="empty-state-wrapper" role="status" aria-live="polite">
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
                Come back later — new players join every day.
            </p>
        </div>
    );
};

SearchMateEmptyState.propTypes = {
    playerName: PropTypes.string,
};

SearchMateEmptyState.defaultProps = {
    playerName: "",
};
