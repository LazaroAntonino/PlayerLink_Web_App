import PropTypes from "prop-types";

const PLATFORMS = [
    { id: "PC", label: "PC", icon: "🖥️" },
    { id: "PS5", label: "PlayStation 5", icon: "🎮" },
    { id: "Xbox", label: "Xbox Series", icon: "🟢" },
    { id: "Switch", label: "Nintendo Switch", icon: "🕹️" },
    { id: "Mobile", label: "Mobile", icon: "📱" },
    { id: "VR", label: "VR / PC VR", icon: "🥽" },
];

export const Step3_Platforms = ({ data, onChange, onNext, onBack, onSkip }) => {
    const togglePlatform = (id) => {
        const current = data.platforms;
        if (current.includes(id)) {
            onChange({ platforms: current.filter(p => p !== id) });
        } else {
            onChange({ platforms: [...current, id] });
        }
    };

    const canContinue = data.platforms.length >= 1;

    return (
        <>
            <h2>Tus plataformas</h2>
            <p className="ob-subtitle">¿En qué dispositivos juegas? Selecciona todos los que uses</p>

            <div className="ob-platforms-grid">
                {PLATFORMS.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        type="button"
                        className={"ob-platform-card" + (data.platforms.includes(id) ? " selected" : "")}
                        onClick={() => togglePlatform(id)}
                        aria-pressed={data.platforms.includes(id)}
                    >
                        <span className="ob-platform-icon" role="img" aria-label={label}>{icon}</span>
                        <span className="ob-platform-name">{label}</span>
                    </button>
                ))}
            </div>

            {!canContinue && (
                <p className="ob-error-msg" style={{ marginTop: "0.5rem" }}>
                    Selecciona al menos 1 plataforma para continuar
                </p>
            )}

            <div className="ob-nav">
                <button type="button" className="ob-btn-back" onClick={onBack}>← Atrás</button>
                <button type="button" className="ob-btn-skip" onClick={onSkip}>
                    Saltar por ahora
                </button>
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={onNext}
                    disabled={!canContinue}
                >
                    Siguiente →
                </button>
            </div>
        </>
    );
};

Step3_Platforms.propTypes = {
    data: PropTypes.shape({ platforms: PropTypes.arrayOf(PropTypes.string) }).isRequired,
    onChange: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
};
