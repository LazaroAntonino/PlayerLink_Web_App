import PropTypes from "prop-types";

const STEP_LABELS = ["Avatar", "Juegos", "Plataformas", "Estilo", "Preview"];

export const OnboardingProgress = ({ currentStep, totalSteps }) => (
    <div style={{ width: "100%", maxWidth: "560px" }}>
        <div className="ob-progress-bar">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                    key={i}
                    className={
                        "ob-progress-segment" +
                        (i + 1 === currentStep ? " active" : i + 1 < currentStep ? " done" : "")
                    }
                    aria-label={STEP_LABELS[i]}
                />
            ))}
        </div>
        <p className="ob-progress-label">
            Paso {currentStep} de {totalSteps} — {STEP_LABELS[currentStep - 1]}
        </p>
    </div>
);

OnboardingProgress.propTypes = {
    currentStep: PropTypes.number.isRequired,
    totalSteps: PropTypes.number.isRequired,
};
