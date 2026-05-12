import PropTypes from "prop-types";

const STYLES = [
    { id: "Competitivo", emoji: "🏆", title: "Competitive", desc: "I live to climb the ranks" },
    { id: "Roleplay", emoji: "🎭", title: "Roleplay", desc: "Story comes first" },
    { id: "Casual", emoji: "😎", title: "Casual", desc: "Gaming to unwind" },
    { id: "Speedrun", emoji: "💨", title: "Speedrun", desc: "Time is everything" },
    { id: "Cooperativo", emoji: "🤝", title: "Co-op", desc: "Teamwork makes the dream work" },
    { id: "Explorador", emoji: "🔍", title: "Explorer", desc: "Every corner of the map" },
];

export const Step4_PlayStyle = ({ data, onChange, onNext, onBack, onSkip }) => {
    const handleSelect = (id) => {
        // Toggle: si ya estaba seleccionado, deselecciona
        onChange({ playStyle: data.playStyle === id ? "" : id });
    };

    return (
        <>
            <h2>Your play style</h2>
            <p className="ob-subtitle">How would you describe the way you play?</p>

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
                <button type="button" className="ob-btn-back" onClick={onBack}>← Back</button>
                <button type="button" className="ob-btn-skip" onClick={onSkip}>
                    Skip for now
                </button>
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={onNext}
                    disabled={!data.playStyle}
                >
                    Preview →
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
