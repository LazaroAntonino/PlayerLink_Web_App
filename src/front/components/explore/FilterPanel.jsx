import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./FilterPanel.css";

// ── Opciones disponibles (basadas en datos reales del modelo) ─────────────
const GAME_OPTIONS = [
    "Valorant", "League of Legends", "CS2", "Fortnite", "Minecraft",
    "Apex Legends", "Overwatch 2", "GTA V", "FIFA 24", "Elden Ring",
    "Call of Duty", "Rocket League", "Among Us", "Genshin Impact",
    "God of War", "Cyberpunk 2077", "Hollow Knight", "Celeste",
];

// preferences almacena plataformas + estilo como CSV ("PC,PS5,Competitivo")
const PLATFORM_OPTIONS = ["PC", "PS5", "Xbox", "Switch", "Mobile", "VR"];
const STYLE_OPTIONS = ["Competitivo", "Casual", "Roleplay", "Speedrun", "Cooperativo", "Explorador"];
const LANGUAGE_OPTIONS = ["Español", "English", "Português", "Français", "Deutsch", "中文", "日本語"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Other"];

// ─────────────────────────────────────────────────────────────────────────────

/**
 * FilterPanel
 * Props:
 *   filters        — objeto con los filtros activos { game, preference, language, location, gender, age_min, age_max }
 *   onApply(filters) — callback cuando el usuario pulsa "Aplicar"
 *   onClose()       — callback para cerrar el panel
 *   isOpen          — boolean
 */
export const FilterPanel = ({ filters, onApply, onClose, isOpen }) => {
    // Estado local — copia de trabajo, solo se envía al padre al pulsar "Aplicar"
    const [draft, setDraft] = useState(filters);
    const panelRef = useRef(null);

    // Sincronizar draft si los filtros externos cambian (ej. reset externo)
    useEffect(() => {
        setDraft(filters);
    }, [filters]);

    // Focus trap y cierre con Escape
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.activeElement;
        panelRef.current?.focus();

        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("keydown", handleKey);
            prev?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const setField = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

    const toggleChip = (key, val) => {
        setDraft(prev => {
            const current = prev[key];
            return { ...prev, [key]: current === val ? "" : val };
        });
    };

    const handleApply = () => {
        // Limpiar campos vacíos antes de enviar
        const clean = Object.fromEntries(
            Object.entries(draft).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        );
        onApply(clean);
        onClose();
    };

    const handleClear = () => {
        const empty = {};
        setDraft(empty);
        onApply(empty);
        onClose();
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* Backdrop */}
            <div
                className="filter-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="filter-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Filters panel"
                ref={panelRef}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="filter-panel-header">
                    <h2 className="filter-panel-title">🎮 Filters</h2>
                    <button
                        className="filter-panel-close"
                        onClick={onClose}
                        aria-label="Close filter panel"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="filter-panel-body">

                    {/* ── JUEGO ─────────────────────────────────── */}
                    <div>
                        <p className="filter-section-label">🎮 Game</p>
                        <div className="filter-chips-grid">
                            {GAME_OPTIONS.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    className={"filter-chip" + (draft.game === g ? " active" : "")}
                                    onClick={() => toggleChip("game", g)}
                                    aria-pressed={draft.game === g}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── PLATAFORMA ────────────────────────────── */}
                    <div>
                        <p className="filter-section-label">🖥️ Platform</p>
                        <div className="filter-chips-grid">
                            {PLATFORM_OPTIONS.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    className={"filter-chip" + (draft.preference === p ? " active" : "")}
                                    onClick={() => toggleChip("preference", p)}
                                    aria-pressed={draft.preference === p}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── ESTILO DE JUEGO ───────────────────────── */}
                    <div>
                        <p className="filter-section-label">🏆 Play Style</p>
                        <div className="filter-chips-grid">
                            {STYLE_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    className={"filter-chip accent" + (draft.preference === s ? " active" : "")}
                                    onClick={() => toggleChip("preference", s)}
                                    aria-pressed={draft.preference === s}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── IDIOMA ────────────────────────────────── */}
                    <div>
                        <p className="filter-section-label">🌐 Language</p>
                        <div className="filter-chips-grid">
                            {LANGUAGE_OPTIONS.map(l => (
                                <button
                                    key={l}
                                    type="button"
                                    className={"filter-chip" + (draft.language === l ? " active" : "")}
                                    onClick={() => toggleChip("language", l)}
                                    aria-pressed={draft.language === l}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── GÉNERO ────────────────────────────────── */}
                    <div>
                        <p className="filter-section-label">👤 Gender</p>
                        <div className="filter-chips-grid">
                            {GENDER_OPTIONS.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    className={"filter-chip" + (draft.gender === g ? " active" : "")}
                                    onClick={() => toggleChip("gender", g)}
                                    aria-pressed={draft.gender === g}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── UBICACIÓN (texto libre) ────────────────── */}
                    <div>
                        <p className="filter-section-label">📍 Location</p>
                        <input
                            type="text"
                            className="filter-text-input"
                            placeholder="E.g.: London, New York, Tokyo..."
                            value={draft.location || ""}
                            onChange={e => setField("location", e.target.value)}
                            aria-label="Filter by location"
                            maxLength={50}
                        />
                    </div>

                    {/* ── EDAD ──────────────────────────────────── */}
                    <div>
                        <p className="filter-section-label">🎂 Age range</p>
                        <div className="filter-age-row">
                            <input
                                type="number"
                                className="filter-age-input"
                                placeholder="Min"
                                min={13}
                                max={99}
                                value={draft.age_min ?? ""}
                                onChange={e => setField("age_min", e.target.value ? Number(e.target.value) : undefined)}
                                aria-label="Minimum age"
                            />
                            <span className="filter-age-sep">—</span>
                            <input
                                type="number"
                                className="filter-age-input"
                                placeholder="Max"
                                min={13}
                                max={99}
                                value={draft.age_max ?? ""}
                                onChange={e => setField("age_max", e.target.value ? Number(e.target.value) : undefined)}
                                aria-label="Maximum age"
                            />
                            <span className="filter-age-sep">years</span>
                        </div>
                    </div>

                </div>{/* end body */}

                {/* Footer */}
                <div className="filter-panel-footer">
                    <button
                        type="button"
                        className="filter-apply-btn"
                        onClick={handleApply}
                    >
                        Apply filters
                    </button>
                    <button
                        type="button"
                        className="filter-clear-btn"
                        onClick={handleClear}
                    >
                        Clear all
                    </button>
                </div>
            </div>
        </>
    );
};

FilterPanel.propTypes = {
    filters: PropTypes.object.isRequired,
    onApply: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
};
