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
            onChange({ games: [...data.games, { title: game.title, image: game.image, hours_played: 0 }] });
        }
    };

    const removeChip = (title) => {
        onChange({ games: data.games.filter(g => g.title !== title) });
    };

    const atMax = data.games.length >= MAX_GAMES;
    const canContinue = data.games.length >= 1;

    return (
        <>
            <h2>Tus juegos favoritos</h2>
            <p className="ob-subtitle">Selecciona hasta {MAX_GAMES} juegos que más juegas</p>

            {/* Chips de juegos seleccionados */}
            {data.games.length > 0 && (
                <div className="ob-chips-row">
                    {data.games.map(g => (
                        <span key={g.title} className="ob-chip">
                            {g.title}
                            <button
                                type="button"
                                className="ob-chip-remove"
                                onClick={() => removeChip(g.title)}
                                aria-label={`Quitar ${g.title}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Buscador */}
            <div className="ob-game-search">
                <i className="fa-solid fa-magnifying-glass ob-game-search-icon" />
                <input
                    type="text"
                    className="ob-input"
                    placeholder="Buscar juego..."
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
                            style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}
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
                {data.games.length}/{MAX_GAMES} juegos{atMax ? " — máximo alcanzado" : ""}
            </p>

            <div className="ob-nav">
                <button type="button" className="ob-btn-back" onClick={onBack}>← Atrás</button>
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={onNext}
                    disabled={!canContinue}
                    title={!canContinue ? "Selecciona al menos 1 juego" : ""}
                >
                    Siguiente →
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
