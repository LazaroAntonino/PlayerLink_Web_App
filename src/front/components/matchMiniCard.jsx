// MatchMiniCard.jsx
import React, { useEffect, useState } from 'react';
import './matchMiniCard.css';
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import { useNavigate } from 'react-router-dom';

export const MatchMiniCard = ({ id, nickname, gender, games, age, location }) => {
  useEffect(() => {
    // Selecciona todas las imágenes con data-bs-toggle="popover" y crea un Popover de Bootstrap para cada una
    document
      .querySelectorAll('[data-bs-toggle="popover"]')
      .forEach((el) => {
        // eslint-disable-next-line no-new
        new bootstrap.Popover(el);
      });
  }, []); // Se ejecuta solo al montar

  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate();

  // Dentro del componente (antes del return), calcula los 3 juegos con más horas:
  const topThreeGames = games
    ? [...games]
      .sort((a, b) => b.gameHoursPlayed - a.gameHoursPlayed)
      .slice(0, 3)
    : [];

  const selectMedal = (gamehours) => {
    const hours = parseInt(gamehours, 10);
    if (isNaN(hours)) {
      return bronzeMedal;
    }
    if (hours >= 2500) {
      return goldMedal;
    } else if (hours >= 500) {
      return silverMedal;
    } else {
      return bronzeMedal;
    }
  };

  return (
    <>
      <div
        className="match-card card h-100 w-100 matchCardd"
        onClick={() => navigate(`matchDetails/${id}`)}
      >
        <div className="card-body d-flex flex-column p-3 pb-0">
          <div className="row d-flex align-items-center mb-2">
            <h5 className="col-12 card-title text-truncate mb-0 display-6">{nickname}</h5>
          </div>
          <div className='row d-flex justify-content-around'>
            <div className='col-lg-6 col-md-12 d-flex my-1 align-items-center'>
              <span className='fa-solid fa-location-dot me-2'></span>
              <p className='m-0'>{location}</p>
            </div>
            <div className='col-lg-6 col-md-12 d-flex my-1 align-items-center'>
              <span className="fa-solid fa-user me-2"></span>
              <p className='m-0'>{gender} • {age}</p>
            </div>
          </div>
          <div className="flex-grow-1 overflow-auto align-content-center medalsBox rounded">
            {topThreeGames && topThreeGames.length > 0 ? (
              <div className="col-lg-4 col-md-6 col-lg-12 d-flex flex-row flex-nowrap justify-content-around">
                {topThreeGames.map((el, index) => (
                  <div key={el.id || index} className="d-flex flex-column justify-content-center align-items-center">
                    <img
                      src={el.gameImage}
                      className="img-fluid imagenminicard"
                      style={{ width: '100px', height: '50px', cursor: 'pointer', objectFit: 'cover' }}
                      alt={el.gameTitle}
                    />
                    <img
                      src={selectMedal(el.gameHoursPlayed)}
                      className="img-fluid"
                      style={{ width: '3rem', height: 'auto', cursor: 'pointer' }}
                      alt="Medal"
                      role="button"
                      data-bs-toggle="popover"
                      data-bs-trigger="hover focus"
                      data-bs-container="body"
                      data-bs-placement="bottom"
                      data-bs-content={`${el.gameTitle} — ${el.gameHoursPlayed} horas`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-light mb-0">
                <small>Este usuario no tiene juegos</small>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}