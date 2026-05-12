import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { GAMES_CATALOG } from "../../../data/gamesCatalog.js";

const MAX_GAMES = 5;

export const Step2_Games = ({ data, onChange, onNext, onBack }) => {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return q ? GAMES_CATALOG.filter(g => g.title.toLowerCase().includes(q)) : GAMES_CATALOG;
    }, [query]);

    const isSelected = (title) => data.games.some(g => g.title === title);

    const toggleGame = (game) => {
        if (isSelected(game.title)) {
            onChange({ games: data.games.filter(g => g.title !== game.title) });
        } else {
            if (data.games.length >= MAX_GAMES) return;
            onChange({ games: [...data.games, { title: game.title, image: game.image, hours_played: "" }] });
        }
    };

    const updateHours = (title, value) => {
        const hours = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
        onChange({
            games: data.games.map(g => g.title === title ? { ...g, hours_played: hours } : g),
        });
    };

    const removeChip = (title) => {
        onChange({ games: data.games.filter(g => g.title !== title) });
    };

    const atMax = data.games.length >= MAX_GAMES;
    const canContinue = data.games.length >= 1;

    return (
        <>
            <h2>Your favorite games</h2>
            <p className="ob-subtitle">Select up to {MAX_GAMES} games you play the most</p>

            {/* Chips de juegos seleccionados con campo de horas inline */}
            {data.games.length > 0 && (
                <div className="ob-selected-games">
                    {data.games.map(g => (
                        <div key={g.title} className="ob-game-chip-row">
                            <span className="ob-game-chip-title">
                                <i className="fa-solid fa-gamepad ob-game-chip-icon" />
                                {g.title}
                            </span>
                            <label className="ob-game-chip-hours-label">
                                <input
                                    type="number"
                                    className="ob-game-chip-hours-input"
                                    min="0"
                                    max="99999"
                                    placeholder="0"
                                    value={g.hours_played}
                                    onChange={e => updateHours(g.title, e.target.value)}
                                    aria-label={`Hours in ${g.title}`}
                                />
                                <span className="ob-game-chip-hours-unit">h</span>
                            </label>
                            <button
                                type="button"
                                className="ob-chip-remove"
                                onClick={() => removeChip(g.title)}
                                aria-label={`Remove ${g.title}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Buscador */}
            <div className="ob-game-search">
                <i className="fa-solid fa-magnifying-glass ob-game-search-icon" />
                <input
                    type="text"
                    className="ob-input"
                    placeholder="Search game..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            {/* Lista de juegos */}
            <div className="ob-game-list">
                {filtered.map(game => {
                    const sel = isSelected(game.title);
                    const disabled = !sel && atMax;
                    return (
                        <button
                            key={game.title}
                            type="button"
                            className={"ob-game-item" + (sel ? " selected" : "") + (disabled ? " disabled" : "")}
                            onClick={() => toggleGame(game)}
                            disabled={disabled}
                        >
                            <span className="ob-game-item-check">
                                {sel && <i className="fa-solid fa-check" style={{ fontSize: "0.65rem", color: "#07070f" }} />}
                            </span>
                            {game.title}
                        </button>
                    );
                })}
            </div>

            <p className={"ob-game-counter" + (atMax ? " at-max" : "")}>
                {data.games.length}/{MAX_GAMES} games{atMax ? " — maximum reached" : ""}
            </p>

            <div className="ob-nav">
                <button type="button" className="ob-btn-back" onClick={onBack}>← Back</button>
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={onNext}
                    disabled={!canContinue}
                    title={!canContinue ? "Select at least 1 game" : ""}
                >
                    Next →
                </button>
            </div>

            {!canContinue && (
                <p className="ob-error-msg" style={{ marginTop: "0.25rem" }}>
                    Selecciona al menos 1 juego para continuar
                </p>
            )}
        </>
    );
};

Step2_Games.propTypes = {
    data: PropTypes.shape({ games: PropTypes.array }).isRequired,
    onChange: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
};
