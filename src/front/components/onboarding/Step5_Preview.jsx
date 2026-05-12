import PropTypes from "prop-types";
import { PHOTO_ASSETS, DEFAULT_PHOTO } from "../../assets/photoAssets.js";

export const Step5_Preview = ({ data, onPublish, onGoToStep, publishing, publishError }) => {
    const photoSrc = data.photo ? (PHOTO_ASSETS[data.photo] ?? DEFAULT_PHOTO) : DEFAULT_PHOTO;
    const preferences = [...data.platforms, data.playStyle].filter(Boolean);

    return (
        <>
            <h2>Here's how your profile will look!</h2>
            <p className="ob-subtitle">Review everything before publishing. You can always edit it later.</p>

            {/* Preview card */}
            <div className="ob-preview-card">
                <img src={photoSrc} alt="Avatar" className="ob-preview-avatar" />

                <p className="ob-preview-nick">{data.nick_name || "No nick"}</p>

                {/* Juegos */}
                {data.games.length > 0 && (
                    <>
                        <p className="ob-preview-section-title">🎮 Games</p>
                        <div className="ob-preview-chips">
                            {data.games.map(g => (
                                <span key={g.title} className="ob-preview-chip">{g.title}</span>
                            ))}
                        </div>
                    </>
                )}

                {/* Preferencias = plataformas + estilo */}
                {preferences.length > 0 && (
                    <>
                        <p className="ob-preview-section-title">⚙️ Preferences</p>
                        <div className="ob-preview-chips">
                            {preferences.map(p => (
                                <span key={p} className="ob-preview-chip accent">{p}</span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Botones para editar un paso concreto */}
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                Want to change something?
            </p>
            <div className="ob-edit-steps">
                {[
                    { step: 1, label: "✏️ Avatar & Nick" },
                    { step: 2, label: "🎮 Games" },
                    { step: 3, label: "🖥️ Platforms" },
                    { step: 4, label: "🏆 Style" },
                ].map(({ step, label }) => (
                    <button
                        key={step}
                        type="button"
                        className="ob-edit-step-btn"
                        onClick={() => onGoToStep(step)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Publicar */}
            <button
                type="button"
                className="ob-btn-publish"
                onClick={onPublish}
                disabled={publishing}
            >
                {publishing
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
                    : "Publish my profile! 🚀"}
            </button>

            {publishError && (
                <p className="ob-publish-error">{publishError}</p>
            )}
        </>
    );
};

Step5_Preview.propTypes = {
    data: PropTypes.object.isRequired,
    onPublish: PropTypes.func.isRequired,
    onGoToStep: PropTypes.func.isRequired,
    publishing: PropTypes.bool.isRequired,
    publishError: PropTypes.string,
};
