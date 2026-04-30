// ProfileLeftPanel.jsx
// Panel izquierdo del perfil: avatar, nickname, ubicación y medallas de los top 3 juegos.
// Este componente es puramente visual: no gestiona estado propio relevante.

import PropTypes from "prop-types";

export const ProfileLeftPanel = ({
    photoSrc,
    nickName,
    location,
    topThreeGames,
    selectMedal,
    onOpenAvatarPicker,
}) => {
    return (
        <div className="left-panel">
            {/* ── Avatar con ring de gradiente ── */}
            <div className="left-avatar-wrapper">
                <div className="left-avatar-ring">
                    <img src={photoSrc} alt="User avatar" className="left-avatar-img" />
                </div>
                <button
                    className="left-gear-btn"
                    onClick={onOpenAvatarPicker}
                    aria-label="Change avatar"
                >
                    <i className="fa-solid fa-gear" aria-hidden="true"></i>
                </button>
            </div>

            {/* ── Nickname y ubicación ── */}
            <h2 className="left-nickname">{nickName || "—"}</h2>

            {location && location.trim().length > 1 && (
                <p className="left-location">
                    <i className="fa-solid fa-location-dot me-1" aria-hidden="true"></i>
                    {location}
                </p>
            )}

            {/* ── Separador de sección ── */}
            {topThreeGames.length > 0 && (
                <div className="left-section-divider">
                    <span>Top Games</span>
                </div>
            )}

            {/* ── Medallas ── */}
            <div className="medal-list">
                {topThreeGames.map((el, i) => (
                    <div key={el.id ?? i} className="medal-game-card">
                        {/* Icono de medalla con tooltip de horas */}
                        <span
                            className="medal-hours-tooltip"
                            data-tooltip={`${el.gameHoursPlayed ?? 0} h`}
                        >
                            <img
                                src={selectMedal(el.gameHoursPlayed)}
                                alt={`Medal for ${el.gameTitle}`}
                                className="medal-icon"
                            />
                        </span>

                        {/* Portada o placeholder */}
                        {el.gameImage ? (
                            <img
                                className="game-cover-img"
                                src={el.gameImage}
                                alt={`Cover of ${el.gameTitle}`}
                            />
                        ) : (
                            <div className="game-cover-placeholder">
                                <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
                            </div>
                        )}

                        {/* Nombre del juego */}
                        <span className="medal-game-title" title={el.gameTitle}>
                            {el.gameTitle}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

ProfileLeftPanel.propTypes = {
    /** Resolved image src for the user's current avatar */
    photoSrc: PropTypes.string.isRequired,
    /** Gamer nickname to display */
    nickName: PropTypes.string,
    /** Location string */
    location: PropTypes.string,
    /** Top 3 games sorted by hours played */
    topThreeGames: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            gameTitle: PropTypes.string,
            gameImage: PropTypes.string,
            gameHoursPlayed: PropTypes.number,
        })
    ).isRequired,
    /** Returns the medal image src given hours played */
    selectMedal: PropTypes.func.isRequired,
    /** Opens the avatar picker modal */
    onOpenAvatarPicker: PropTypes.func.isRequired,
};

ProfileLeftPanel.defaultProps = {
    nickName: "",
    location: "",
};
