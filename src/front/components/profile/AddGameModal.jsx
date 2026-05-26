// AddGameModal.jsx
// Modal para añadir un nuevo juego al perfil — React portal en document.body
// para evitar stacking-context issues con backdrop-filter de contenedores padre.
// Coherente con GamingPreferencesModal y LanguageModal.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import Select, { components } from "react-select";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

// Opción personalizada del selector: thumbnail + nombre
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
        minHeight: "44px",
        "&:hover": { borderColor: "rgba(0,229,255,0.6)" },
    }),
    menu: (base) => ({
        ...base,
        background: "#0d1220",
        border: "1px solid rgba(0,229,255,0.35)",
        borderRadius: "10px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.1)",
        overflow: "hidden",
        zIndex: 10000,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    menuList: (base) => ({
        ...base,
        padding: "4px",
        maxHeight: "260px",
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

export const AddGameModal = ({
    isOpen,
    onClose,
    gameOptions,
    game,
    onGameChange,
    onAddGame,
    errorHoursPlayed,
    errorRepeatedGame,
}) => {
    // Bloquear scroll del body mientras el modal está abierto
    useBodyScrollLock(isOpen);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modal = (
        <div
            className="pl-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Add a new game"
        >
            <div className="pl-modal-box add-game-modal">
                <div className="pl-modal-header">
                    <span className="pl-modal-title">
                        <i className="fa-solid fa-gamepad me-2" aria-hidden="true" />
                        Add a new game
                    </span>
                    <button className="pl-modal-close" onClick={onClose} aria-label="Close">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <p className="pl-modal-subtitle">Pick a game and the hours you've played</p>

                <div className="add-game-body">
                    <div className="add-game-field">
                        <label htmlFor="gameName" className="add-game-label">Game</label>
                        <Select
                            inputId="gameName"
                            options={gameOptions}
                            components={{ Option: GameOption }}
                            value={gameOptions.find((opt) => opt.value === game.title) || null}
                            onChange={(selected) =>
                                onGameChange({
                                    target: { name: "title", value: selected?.value || "" },
                                })
                            }
                            isClearable
                            isSearchable
                            placeholder="Search game..."
                            noOptionsMessage={() => "Not found"}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={SELECT_STYLES}
                        />
                    </div>

                    <div className="add-game-field">
                        <label htmlFor="hoursPlayed" className="add-game-label">Hours played</label>
                        <input
                            type="number"
                            className="add-game-input"
                            id="hoursPlayed"
                            name="hours_played"
                            value={game.hours_played}
                            onChange={onGameChange}
                            placeholder="E.g. 42"
                            min="1"
                            max="100000"
                            aria-describedby={errorHoursPlayed || errorRepeatedGame ? "add-game-error" : undefined}
                        />
                        {(errorHoursPlayed || errorRepeatedGame) && (
                            <p id="add-game-error" className="add-game-error" role="alert">
                                <i className="fa-solid fa-circle-exclamation me-1" aria-hidden="true" />
                                {errorHoursPlayed || errorRepeatedGame}
                            </p>
                        )}
                    </div>
                </div>

                <div className="pl-modal-footer">
                    <button className="pl-btn pl-btn--ghost pl-btn--sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="pl-btn pl-btn--primary" onClick={onAddGame}>
                        <i className="fa-solid fa-plus me-2" aria-hidden="true" />
                        Add game
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

AddGameModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    gameOptions: PropTypes.array.isRequired,
    game: PropTypes.shape({
        title: PropTypes.string,
        hours_played: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        image: PropTypes.string,
    }).isRequired,
    onGameChange: PropTypes.func.isRequired,
    onAddGame: PropTypes.func.isRequired,
    errorHoursPlayed: PropTypes.string,
    errorRepeatedGame: PropTypes.string,
};
