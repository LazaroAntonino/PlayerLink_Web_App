// ProfileGamesTab.jsx
// Pestaña "Games": lista de juegos del usuario con edición inline de horas.
// El modal "Add game" es un componente independiente con React portal.

import PropTypes from "prop-types";
import { AddGameModal } from "./AddGameModal.jsx";

export const ProfileGamesTab = ({
    games,
    gameOptions,
    game,
    onGameChange,
    onAddGame,
    onCancelAddGame,
    onDeleteGame,
    onUpdateHours,
    onCancelEditGame,
    idOfGameBeingEdited,
    setIdOfGameBeingEdited,
    setGame,
    errorHoursPlayed,
    errorRepeatedGame,
    errorCeroHours,
    isAddGameOpen,
    onOpenAddGame,
    onCloseAddGame,
}) => {
    return (
        <div className="info-section">
            {/* ── Header + Add game button ── */}
            <div className="comments-header-row">
                <h2 className="comments-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                    Games{" "}
                    <span className="tooltip-wrapper">
                        <i
                            className="fa-solid fa-circle-info fa-2xs medals-info-icon"
                            aria-hidden="true"
                        ></i>
                        <span className="tooltip-text medal-info-tooltip-text">
                            <strong>Medal Info:</strong>
                            <div>
                                <i className="fa-solid fa-medal mt-1 medal-info-gold" aria-hidden="true"></i>{" "}
                                +2500 hours
                            </div>
                            <div>
                                <i className="fa-solid fa-medal mt-1 medal-info-silver" aria-hidden="true"></i>{" "}
                                +500 hours
                            </div>
                            <div>
                                <i className="fa-solid fa-medal mt-1 medal-info-bronze" aria-hidden="true"></i>{" "}
                                0-500 hours
                            </div>
                        </span>
                    </span>
                </h2>

                <button
                    type="button"
                    className="botonLeaveComment"
                    onClick={onOpenAddGame}
                >
                    <i className="fa-solid fa-plus me-2" aria-hidden="true" />
                    Add a new game
                </button>
            </div>

            {/* ── Add game modal (React portal) ── */}
            <AddGameModal
                isOpen={isAddGameOpen}
                onClose={() => {
                    onCancelAddGame();
                    onCloseAddGame();
                }}
                gameOptions={gameOptions}
                game={game}
                onGameChange={onGameChange}
                onAddGame={onAddGame}
                errorHoursPlayed={errorHoursPlayed}
                errorRepeatedGame={errorRepeatedGame}
            />

            {/* ── Games list ── */}
            <div className="mt-3">
                {games && games.length > 0 ? (
                    games.map((el, i) => (
                        <div key={el.id ?? i} className="game-row">
                            {el.gameImage && (
                                <img src={el.gameImage} alt={el.gameTitle} className="game-row-cover" />
                            )}

                            <span className="game-row-title">{el.gameTitle}</span>

                            {idOfGameBeingEdited === el.id ? (
                                <form className="game-row-edit-form" onSubmit={(e) => onUpdateHours(e, el.id)}>
                                    {errorCeroHours && (
                                        <span className="game-error-text">{errorCeroHours}</span>
                                    )}
                                    <input
                                        className="game-hours-input"
                                        type="number"
                                        name="hours_played"
                                        value={game.hours_played}
                                        onChange={(e) => setGame({ ...game, hours_played: Number(e.target.value) })}
                                        placeholder="Hours"
                                        aria-label="Hours played"
                                        min="1"
                                        max="100000"
                                    />
                                    <button type="submit" className="game-action-btn game-action-save" aria-label="Save hours">
                                        <i className="fa-solid fa-floppy-disk"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="game-action-btn game-action-cancel"
                                        onClick={onCancelEditGame}
                                        aria-label="Cancel edit"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </form>
                            ) : (
                                <div className="game-row-actions">
                                    <span className="game-row-hours">
                                        {el.gameHoursPlayed != null && el.gameHoursPlayed > 0
                                            ? `${el.gameHoursPlayed.toLocaleString()} h`
                                            : <span className="game-row-hours-empty">No hours set</span>
                                        }
                                    </span>
                                    <button
                                        className="game-action-btn game-action-edit"
                                        onClick={() => {
                                            setIdOfGameBeingEdited(el.id);
                                            setGame((prev) => ({ ...prev, hours_played: el.gameHoursPlayed ?? "" }));
                                        }}
                                        aria-label={`Edit ${el.gameTitle}`}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                    <button
                                        className="game-action-btn game-action-delete"
                                        onClick={() => onDeleteGame(el.id)}
                                        aria-label={`Delete ${el.gameTitle}`}
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="comments-empty" style={{ padding: '40px 16px' }}>
                        <i className="fa-solid fa-gamepad comments-empty-icon" aria-hidden="true" />
                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.62)' }}>
                            No games yet
                        </span>
                        <span>Add your first game to get started!</span>
                    </p>
                )}
            </div>
        </div>
    );
};

ProfileGamesTab.propTypes = {
    games: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            gameTitle: PropTypes.string,
            gameImage: PropTypes.string,
            gameHoursPlayed: PropTypes.number,
        })
    ),
    gameOptions: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
    ).isRequired,
    game: PropTypes.shape({
        title: PropTypes.string,
        hours_played: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        image: PropTypes.string,
    }).isRequired,
    onGameChange: PropTypes.func.isRequired,
    onAddGame: PropTypes.func.isRequired,
    onCancelAddGame: PropTypes.func.isRequired,
    onDeleteGame: PropTypes.func.isRequired,
    onUpdateHours: PropTypes.func.isRequired,
    onCancelEditGame: PropTypes.func.isRequired,
    idOfGameBeingEdited: PropTypes.number.isRequired,
    setIdOfGameBeingEdited: PropTypes.func.isRequired,
    setGame: PropTypes.func.isRequired,
    errorHoursPlayed: PropTypes.string,
    errorRepeatedGame: PropTypes.string,
    errorCeroHours: PropTypes.string,
    isAddGameOpen: PropTypes.bool.isRequired,
    onOpenAddGame: PropTypes.func.isRequired,
    onCloseAddGame: PropTypes.func.isRequired,
};

ProfileGamesTab.defaultProps = {
    games: [],
    errorHoursPlayed: "",
    errorRepeatedGame: "",
    errorCeroHours: "",
};
