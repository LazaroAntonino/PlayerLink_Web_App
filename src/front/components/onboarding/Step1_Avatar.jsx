import { useState } from "react";
import PropTypes from "prop-types";
import { PHOTO_ARRAY, PHOTO_ASSETS } from "../../assets/photoAssets.js";

const NICK_MIN = 3;
const NICK_MAX = 20;
const NICK_REGEX = /^\S+$/; // sin espacios

export const Step1_Avatar = ({ data, onChange, onNext }) => {
    const [nickError, setNickError] = useState("");

    const validateNick = (value) => {
        if (value.length < NICK_MIN) return `Mínimo ${NICK_MIN} caracteres`;
        if (value.length > NICK_MAX) return `Máximo ${NICK_MAX} caracteres`;
        if (!NICK_REGEX.test(value)) return "Sin espacios, por favor";
        return "";
    };

    const handleNickChange = (e) => {
        const val = e.target.value;
        onChange({ nick_name: val });
        setNickError(validateNick(val));
    };

    const handleNext = () => {
        const err = validateNick(data.nick_name);
        if (err) { setNickError(err); return; }
        onNext();
    };

    // Iniciales para el avatar por defecto
    const initials = data.nick_name?.trim().slice(0, 2).toUpperCase() || "??";
    const photoSrc = data.photo ? PHOTO_ASSETS[data.photo] : null;

    return (
        <>
            <h2>Elige tu avatar</h2>
            <p className="ob-subtitle">Escoge tu apariencia y elige un nick que te represente</p>

            {/* Preview del avatar seleccionado */}
            <div className="ob-avatar-section">
                {photoSrc ? (
                    <img
                        src={photoSrc}
                        alt="Avatar seleccionado"
                        className="ob-avatar-preview"
                    />
                ) : (
                    <div className="ob-avatar-initials">{initials}</div>
                )}
            </div>

            {/* Grid de avatares */}
            <div className="ob-avatar-grid">
                {PHOTO_ARRAY.map(({ key, file }) => (
                    <button
                        key={key}
                        type="button"
                        className={"ob-avatar-option" + (data.photo === key ? " selected" : "")}
                        onClick={() => onChange({ photo: key })}
                        aria-label={`Avatar ${key}`}
                        aria-pressed={data.photo === key}
                    >
                        <img src={file} alt={key} loading="lazy" />
                    </button>
                ))}
            </div>

            {/* Nick gamer */}
            <div style={{ marginTop: "1.5rem" }}>
                <label htmlFor="ob-nick" className="ob-input-label">
                    Nick gamer
                </label>
                <input
                    id="ob-nick"
                    type="text"
                    className={"ob-input" + (nickError ? " error" : "")}
                    placeholder="Ej: ShadowSniper42"
                    value={data.nick_name}
                    onChange={handleNickChange}
                    maxLength={NICK_MAX}
                    autoComplete="off"
                    spellCheck={false}
                />
                {nickError ? (
                    <p className="ob-error-msg">{nickError}</p>
                ) : (
                    <p className="ob-hint">
                        {data.nick_name.length}/{NICK_MAX} — sin espacios, 3-20 caracteres
                    </p>
                )}
            </div>

            <div className="ob-nav">
                <button
                    type="button"
                    className="ob-btn-next"
                    onClick={handleNext}
                    disabled={!!validateNick(data.nick_name)}
                >
                    Siguiente →
                </button>
            </div>
        </>
    );
};

Step1_Avatar.propTypes = {
    data: PropTypes.shape({ nick_name: PropTypes.string, photo: PropTypes.string }).isRequired,
    onChange: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
};
