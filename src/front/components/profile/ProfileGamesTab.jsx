// ProfileGamesTab.jsx
// Pestaña "Games": lista de juegos del usuario con edición de horas y botón
// para añadir un nuevo juego mediante un modal Bootstrap.

import PropTypes from "prop-types";
import Select from "react-select";

export const ProfileGamesTab = ({
    games,
    gameOptions,
    game,
    onGameChange,
    onAddGame,
    onDeleteGame,
    onUpdateHours,
    idOfGameBeingEdited,
    setIdOfGameBeingEdited,
    setGame,
    errorHoursPlayed,
    errorRepeatedGame,
    errorCeroHours,
}) => {
    return (
        <div className="container info-section">
            {/* ── Header + Add game button ── */}
            <div className="row d-flex justify-content-around align-items-center">
                <h2 className="col-lg-6 col-md-12 col-sm-12 mt-3">
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
                    className="btn botonLeaveComment col-lg-4 col-md-12 col-sm-12"
                    data-bs-toggle="modal"
                    data-bs-target="#commentModal"
                >
                    Add a new game
                </button>

                {/* ── Add game modal ── */}
                <div
                    className="modal fade"
                    id="commentModal"
                    tabIndex="-1"
                    aria-hidden="true"
                    aria-labelledby="commentModalLabel"
                >
                    <div className="modal-dialog">
                        <div className="modal-content modal-sci-fi">
                            <div className="modal-header modal-sci-fi-header">
                                <h5
                                    className="modal-title modal-sci-fi-title"
                                    id="commentModalLabel"
                                >
                                    Add a new game
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-sci-fi"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                />
                            </div>

                            <div className="modal-body modal-sci-fi-body">
                                <div className="mb-3">
                                    <label htmlFor="gameName" className="label-sci-fi">
                                        Select a game
                                    </label>
                                    <Select
                                        className="selectorJuegos"
                                        inputId="gameName"
                                        options={gameOptions}
                                        value={
                                            gameOptions.find((opt) => opt.value === game.title) ||
                                            null
                                        }
                                        onChange={(selected) =>
                                            onGameChange({
                                                target: {
                                                    name: "title",
                                                    value: selected?.value || "",
                                                },
                                            })
                                        }
                                        isClearable
                                        isSearchable
                                        placeholder="-- Select a game --"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="hoursPlayed" className="label-sci-fi">
                                        Hours played
                                    </label>
                                    <input
                                        type="number"
                                        className="input-sci-fi"
                                        id="hoursPlayed"
                                        name="hours_played"
                                        value={game.hours_played}
                                        onChange={onGameChange}
                                        placeholder="Eg.: 42"
                                        min="1"
                                        max="10000"
                                    />
                                    {errorHoursPlayed && (
                                        <h6 className="text-danger ms-2 mt-2">{errorHoursPlayed}</h6>
                                    )}
                                    {errorRepeatedGame && (
                                        <h6 className="text-danger ms-2 mt-2">{errorRepeatedGame}</h6>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer modal-sci-fi-footer">
                                <button
                                    type="button"
                                    className="btn-sci-fi-primary"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-sci-fi-primary"
                                    onClick={onAddGame}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Games list ── */}
            <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
                {games && games.length > 0 ? (
                    games.map((el, i) => (
                        <div
                            key={el.id ?? i}
                            className="row gamesbox d-flex align-content-center py-3"
                        >
                            {/* Game title */}
                            <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                                <h6 className="m-0">{el.gameTitle}</h6>
                            </div>

                            {/* Edit hours inline form OR display row */}
                            {idOfGameBeingEdited === el.id ? (
                                <form
                                    className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center"
                                    onSubmit={(e) => onUpdateHours(e, el.id)}
                                >
                                    <div className="row d-flex flex-row justify-content-around align-items-center">
                                        {errorCeroHours && (
                                            <h6 className="me-4 text-danger mt-2 error-hours-font">
                                                {errorCeroHours}
                                            </h6>
                                        )}
                                        <input
                                            className="col-auto input-hours border-2 rounded-2 ms-2"
                                            type="number"
                                            name="hours_played"
                                            value={game.hours_played}
                                            onChange={(e) =>
                                                setGame({ ...game, hours_played: e.target.value })
                                            }
                                            placeholder="Hours"
                                            aria-label="Hours played"
                                        />
                                        <button
                                            type="submit"
                                            className="me-1 fa-solid fa-floppy-disk btn bg-transparent botonesAccionesJuegos btn-save-game col-auto"
                                            aria-label="Save hours"
                                        />
                                        <span
                                            className="ms-1 text-danger botonesAccionesJuegos btn-close-edit-game col-auto"
                                            role="button"
                                            aria-label="Cancel editing hours"
                                            onClick={() => setIdOfGameBeingEdited(0)}
                                        >
                                            X
                                        </span>
                                    </div>
                                </form>
                            ) : (
                                <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                                    <h6 className="m-0 col-4">{el.gameHoursPlayed} hours</h6>
                                    <span
                                        className="text-light botonesAccionesJuegos col-auto fa-solid fa-pencil"
                                        role="button"
                                        aria-label={`Edit hours for ${el.gameTitle}`}
                                        onClick={() => setIdOfGameBeingEdited(el.id)}
                                    />
                                    <span
                                        className="text-danger botonesAccionesJuegos col-auto fa-solid fa-trash"
                                        role="button"
                                        aria-label={`Delete ${el.gameTitle}`}
                                        onClick={() => onDeleteGame(el.id)}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center">No games yet. Add your first game!</p>
                )}
            </div>
        </div>
    );
};

ProfileGamesTab.propTypes = {
    /** User's game list from the store */
    games: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            gameTitle: PropTypes.string,
            gameImage: PropTypes.string,
            gameHoursPlayed: PropTypes.number,
        })
    ),
    /** react-select options derived from availableGames */
    gameOptions: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
    ).isRequired,
    /** Current "add game" form state { title, hours_played, image } */
    game: PropTypes.shape({
        title: PropTypes.string,
        hours_played: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        image: PropTypes.string,
    }).isRequired,
    /** Handles input changes in the add-game form */
    onGameChange: PropTypes.func.isRequired,
    /** Submits the add-game form */
    onAddGame: PropTypes.func.isRequired,
    /** Deletes a game by id */
    onDeleteGame: PropTypes.func.isRequired,
    /** Submits inline hours edit form */
    onUpdateHours: PropTypes.func.isRequired,
    /** ID of the game row currently being inline-edited */
    idOfGameBeingEdited: PropTypes.number.isRequired,
    /** Sets which game row is in edit mode */
    setIdOfGameBeingEdited: PropTypes.func.isRequired,
    /** Sets the game form state (used for inline hours edit) */
    setGame: PropTypes.func.isRequired,
    errorHoursPlayed: PropTypes.string,
    errorRepeatedGame: PropTypes.string,
    errorCeroHours: PropTypes.string,
};

ProfileGamesTab.defaultProps = {
    games: [],
    errorHoursPlayed: "",
    errorRepeatedGame: "",
    errorCeroHours: "",
};
