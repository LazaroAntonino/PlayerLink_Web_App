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
            {/* ── Sección de avatar ── */}
            <div className="avatar-section">
                <button
                    className="gear-btn"
                    onClick={onOpenAvatarPicker}
                    aria-label="Change avatar"
                >
                    <i className="fa-solid fa-gear" aria-hidden="true"></i>
                </button>
                <img src={photoSrc} alt="User avatar" className="profile-avatar" />
            </div>

            {/* ── Nickname y ubicación ── */}
            <h2>{nickName}</h2>
            <p className="location">{location}</p>

            {/* ── Medallas de los top 3 juegos por horas ── */}
            <div className="medal-list">
                {topThreeGames.map((el, i) => (
                    <div key={el.id ?? i} className="medal-game-card">
                        <img
                            src={selectMedal(el.gameHoursPlayed)}
                            alt={`Medal for ${el.gameTitle}`}
                            className="medal-icon"
                            role="button"
                            data-bs-toggle="popover"
                            data-bs-trigger="hover focus"
                            data-bs-container="body"
                            data-bs-placement="bottom"
                            data-bs-content={`${el.gameTitle} — ${el.gameHoursPlayed} horas`}
                        />
                        <img
                            className="img-fluid gameImg"
                            src={el.gameImage}
                            alt={`Cover of ${el.gameTitle}`}
                        />
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
