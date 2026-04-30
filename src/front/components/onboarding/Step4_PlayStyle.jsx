import PropTypes from "prop-types";

const STYLES = [
    { id: "Competitivo", emoji: "🏆", title: "Competitivo", desc: "Vivo para rankear" },
    { id: "Roleplay", emoji: "🎭", title: "Roleplay", desc: "La historia es lo primero" },
    { id: "Casual", emoji: "😎", title: "Casual", desc: "Juego para desconectar" },
    { id: "Speedrun", emoji: "💨", title: "Speedrun", desc: "El tiempo es todo" },
    { id: "Cooperativo", emoji: "🤝", title: "Cooperativo", desc: "En equipo se llega lejos" },
    { id: "Explorador", emoji: "🔍", title: "Explorador", desc: "Cada rincón del mapa" },
];

export const Step4_PlayStyle = ({ data, onChange, onNext, onBack, onSkip }) => {
    const handleSelect = (id) => {
        // Toggle: si ya estaba seleccionado, deselecciona
        onChange({ playStyle: data.playStyle === id ? "" : id });
    };

    return (
        <>
            <h2>Tu estilo de juego</h2>
            <p className="ob-subtitle">¿Cómo describes tu forma de jugar?</p>

            <div className="ob-styles-grid">
                {STYLES.map(({ id, emoji, title, desc }) => (
                    <button
                        key={id}
                        type="button"
                        className={"ob-style-card" + (data.playStyle === id ? " selected" : "")}
                        onClick={() => handleSelect(id)}
                        aria-pressed={data.playStyle === id}
                    >
                        <span className="ob-style-emoji" role="img" aria-label={title}>{emoji}</span>
                        <span className="ob-style-info">
                            <span className="ob-style-title">{title}</span>
                            <span className="ob-style-desc">"{desc}"</span>
                        </span>
                    </button>
                ))}
            </div>

            <div className="ob-nav">
                <button type="button" className="ob-btn-back" onClick={onBack}>← Atrás</button>
                <button type="button" className="ob-btn-skip" onClick={onSkip}>
                    Saltar por ahora
                </button>
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={onNext}
                    disabled={!data.playStyle}
                >
                    Ver preview →
                </button>
            </div>
        </>
    );
};

Step4_PlayStyle.propTypes = {
    data: PropTypes.shape({ playStyle: PropTypes.string }).isRequired,
    onChange: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
};
