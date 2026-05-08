// ProfileGamesTab.jsx
// Pestaña "Games": lista de juegos del usuario con edición de horas y botón
// para añadir un nuevo juego mediante un modal Bootstrap.

import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import Select, { components } from "react-select";

// Opción personalizada del selector: muestra miniatura + nombre del juego
const GameOption = ({ data, ...props }) => (
    <components.Option {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data.image && (
                <img
                    src={data.image}
                    alt={data.label}
                    style={{
                        width: "52px",
                        height: "30px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        flexShrink: 0,
                        border: "1px solid rgba(0,229,255,0.2)",
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                />
            )}
            <span style={{ color: "#fff", fontSize: "0.9rem" }}>{data.label}</span>
        </div>
    </components.Option>
);

const SELECT_STYLES = {
    control: (base, state) => ({
        ...base,
        background: "#0d1220",
        border: `1px solid ${state.isFocused ? "rgba(0,229,255,0.7)" : "rgba(0,229,255,0.3)"}`,
        borderRadius: "8px",
        color: "#fff",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(0,229,255,0.15)" : "none",
        minHeight: "42px",
        "&:hover": { borderColor: "rgba(0,229,255,0.6)" },
    }),
    menu: (base) => ({
        ...base,
        background: "#0d1220",
        border: "1px solid rgba(0,229,255,0.35)",
        borderRadius: "10px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.1)",
        overflow: "hidden",
        zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menuList: (base) => ({
        ...base,
        padding: "4px",
        maxHeight: "280px",
        background: "#0d1220",
    }),
    option: (base, state) => ({
        ...base,
        background: state.isSelected
            ? "rgba(0,229,255,0.15)"
            : state.isFocused
                ? "rgba(0,229,255,0.08)"
                : "transparent",
        color: state.isSelected ? "#00e5ff" : "#e2e2f0",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: "6px",
        transition: "background 0.12s ease",
    }),
    input: (base) => ({ ...base, color: "#fff" }),
    placeholder: (base) => ({ ...base, color: "var(--color-text-muted, #8888aa)" }),
    singleValue: (base) => ({ ...base, color: "#fff" }),
    noOptionsMessage: (base) => ({
        ...base,
        color: "rgba(255,255,255,0.4)",
        background: "#0d1220",
        padding: "12px",
    }),
    dropdownIndicator: (base) => ({ ...base, color: "rgba(0,229,255,0.5)" }),
    clearIndicator: (base) => ({ ...base, color: "rgba(255,255,255,0.4)" }),
    indicatorSeparator: (base) => ({ ...base, background: "rgba(0,229,255,0.15)" }),
};

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
                    className="btn botonLeaveComment col-lg-4 col-md-12 col-sm-12 pl-btn pl-btn--accent"
                    data-bs-toggle="modal"
                    data-bs-target="#commentModal"
                >
                    Add a new game
                </button>

                {/* ── Add game modal — rendered via portal so backdrop-filter doesn't trap it ── */}
                {createPortal(
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
                                            components={{ Option: GameOption }}
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
                                            placeholder="Buscar juego..."
                                            noOptionsMessage={() => "No encontrado"}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            styles={SELECT_STYLES}
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
                                        className="btn-sci-fi-primary pl-btn pl-btn--ghost pl-btn--sm"
                                        data-bs-dismiss="modal"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-sci-fi-primary pl-btn pl-btn--primary pl-btn--sm"
                                        onClick={onAddGame}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* ── Games list ── */}
            <div className="mt-4">
                {games && games.length > 0 ? (
                    games.map((el, i) => (
                        <div key={el.id ?? i} className="game-row">
                            {/* Portada si existe */}
                            {el.gameImage && (
                                <img src={el.gameImage} alt={el.gameTitle} className="game-row-cover" />
                            )}

                            {/* Título */}
                            <span className="game-row-title">{el.gameTitle}</span>

                            {/* Horas o form de edición */}
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
                                        onChange={(e) => setGame({ ...game, hours_played: e.target.value })}
                                        placeholder="Hours"
                                        aria-label="Hours played"
                                    />
                                    <button type="submit" className="game-action-btn game-action-save" aria-label="Save">
                                        <i className="fa-solid fa-floppy-disk"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="game-action-btn game-action-cancel"
                                        onClick={() => setIdOfGameBeingEdited(0)}
                                        aria-label="Cancel"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </form>
                            ) : (
                                <div className="game-row-actions">
                                    <span className="game-row-hours">
                                        {el.gameHoursPlayed != null && el.gameHoursPlayed > 0
                                            ? `${el.gameHoursPlayed.toLocaleString()} h`
                                            : <span style={{ color: 'var(--color-text-muted, #8888aa)', fontStyle: 'italic' }}>No hours set</span>
                                        }
                                    </span>
                                    <button
                                        className="game-action-btn game-action-edit"
                                        onClick={() => setIdOfGameBeingEdited(el.id)}
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
                    <p className="text-center" style={{ color: 'rgba(255,255,255,0.4)', paddingTop: '20px' }}>
                        No games yet. Add your first game!
                    </p>
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
