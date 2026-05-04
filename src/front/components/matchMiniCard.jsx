// MatchMiniCard.jsx
import React from 'react';
import './matchMiniCard.css';
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import { useNavigate } from 'react-router-dom';
import { PHOTO_ASSETS, DEFAULT_PHOTO } from "../assets/photoAssets.js";

export const MatchMiniCard = ({ id, nickname, gender, games, age, location, photo }) => {
  const navigate = useNavigate();

  const topThreeGames = Array.isArray(games)
    ? [...games].sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0)).slice(0, 3)
    : [];

  const selectMedal = (gamehours) => {
    const hours = parseInt(gamehours, 10);
    if (isNaN(hours)) return bronzeMedal;
    if (hours >= 2500) return goldMedal;
    if (hours >= 500) return silverMedal;
    return bronzeMedal;
  };

  const photoSrc = photo ? (PHOTO_ASSETS[photo] ?? DEFAULT_PHOTO) : null;
  const initials = (nickname || "??").slice(0, 2).toUpperCase();

  return (
    <div
      className="match-mini-card"
      onClick={() => navigate(`matchDetails/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`matchDetails/${id}`)}
      aria-label={`Ver perfil de ${nickname}`}
    >
      {/* Header */}
      <div className="match-card-header">
        <div className="match-card-avatar-ring">
          {photoSrc ? (
            <img src={photoSrc} alt={nickname} className="match-card-avatar" />
          ) : (
            <div className="match-card-avatar-placeholder">{initials}</div>
          )}
        </div>
        <div className="match-card-user-info">
          <p className="match-card-nickname">{nickname || "—"}</p>
          <div className="match-card-meta">
            {location && (
              <span className="match-card-meta-item">
                <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                {location}
              </span>
            )}
            {gender && gender !== "undefined" && (
              <span className="match-card-meta-item">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                {gender}
              </span>
            )}
            {age && age > 0 && (
              <span className="match-card-meta-item">
                {age} años
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Games */}
      <div className="match-card-games">
        {topThreeGames.length > 0 ? (
          <>
            <span className="match-card-games-label">Top juegos</span>
            {topThreeGames.map((game, i) => (
              <div key={game.id ?? i} className="match-card-game-item">
                {game.gameImage ? (
                  <img
                    src={game.gameImage}
                    alt={game.gameTitle}
                    className="match-card-game-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="match-card-game-img-placeholder"
                  style={{ display: game.gameImage ? 'none' : 'flex' }}
                >
                  <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
                </div>
                <span className="match-card-game-name">{game.gameTitle}</span>
                <img
                  src={selectMedal(game.gameHoursPlayed)}
                  alt="medal"
                  className="match-card-medal"
                  title={`${game.gameHoursPlayed ?? 0}h`}
                />
              </div>
            ))}
          </>
        ) : (
          <div className="match-card-no-games">
            <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
            Sin juegos registrados
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="match-card-footer">
        <span className="match-card-view-btn">
          Ver perfil completo
          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </span>
      </div>
    </div>
  );
}
