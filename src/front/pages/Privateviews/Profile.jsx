// Profile.jsx
// Componente de perfil de usuario con edición, selección de avatar, medallas de juego y sección de comentarios

import React, { useEffect, useRef, useState } from "react";
import "../../pages/Privateviews/Profile.css";
import Select from 'react-select';                            // Estilos específicos de la vista de perfil

// Hooks y servicios
import useGlobalReducer from "../../hooks/useGlobalReducer";                  // Hook para acceder al store global y dispatch
import userServices from "../../services/userServices.js";                   // Servicios relacionados con usuario (fetch, update)
import reviewServices from "../../services/reviewServices.js";               // Servicios para gestión de reviews (comentarios)
import gameServices from "../../services/gameServices.js"

// Assets - Medallas de juego
import goldMedal from "../../assets/img/medals/gold-medal.png";
import silverMedal from "../../assets/img/medals/silver-medal.png";
import bronzeMedal from "../../assets/img/medals/bronze-medal.png";

// Assets - Avatares de perfil
import photo1 from "../../assets/img/profile-pics/profile-pic-1.png";
import photo2 from "../../assets/img/profile-pics/profile-pic-2.png";
import photo3 from "../../assets/img/profile-pics/profile-pic-3.png";
import photo4 from "../../assets/img/profile-pics/profile-pic-4.png";
import photo5 from "../../assets/img/profile-pics/profile-pic-5.png";
import photo6 from "../../assets/img/profile-pics/profile-pic-6.png";
import photo7 from "../../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../../assets/img/profile-pics/profile-pic-9.png";

//Preferences and Languages Modals

import { GamingPreferencesModal } from "../../components/ProfileModals/GamingPreferencesModal.jsx";
import { LanguageModal } from "../../components/ProfileModals/LanguageModal.jsx";
import { useNavigate } from "react-router-dom";



// tuve que hacer dos const para la puntuación??  PUNTUACIÓN DE LAS MODALES
const formatPreferences = (prefs) => {
  if (!prefs || prefs.length === 0) return '';
  if (prefs.length === 1) return prefs[0] + '.';
  return prefs.slice(0, -1).join(', ') + ' and ' + prefs[prefs.length - 1] + '.';
};
const parsePreferences = (str) => {
  if (!str) return [];
  return str
    .replace(/\.$/, '')                // quitar punto final
    .split(/, | and /)                 // dividir por ", " y " and "
    .map(p => p.trim())               // quitar espacios
    .filter(Boolean);                 // quitar vacíos
};


const Profile = () => {
  // Acceso al store global y dispatch para actualizar datos
  const navigate = useNavigate()
  const [availableGames, setAvailableGames] = useState([]);
  const [game, setGame] = useState({ title: '', hours_played: '', image: '' });
  const [loading, setLoading] = useState(true);
  const { store, dispatch } = useGlobalReducer();
  const url = import.meta.env.VITE_BACKEND_URL;   // URL base del backend
  const rawgApi = import.meta.env.VITE_RAWG_KEY;
  const gameOptions = availableGames.map(name => ({ value: name, label: name }));
  const [idOfGameBeingEdited, setIdOfGameBeingEdited] = useState(0);

  // Estados locales
  const [activeTab, setActiveTab] = useState("info");                    // Pestaña activa (info, activity, comments)
  const [isEditing, setIsEditing] = useState(false);                       // Modo edición on/off
  const [changer, setChanger] = useState(false);
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);                       // Mostrar modal de avatar
  const [profile, setProfile] = useState({
    name: " ",
    nick_name: "",
    age: 0,
    gender: "undefined",
    location: " ",
    zodiac: " ",
    discord: " ",
    steam_id: " ",
    languages: " ",
    preferences: " ",
    bio: " ",
    photo: "photo1"
  });
  const clearNoticeTimerRef = useRef(null); // Para limpiar el notice después de 10 segundos
  // Estados de Modales languages y Gaming preferences
  const [showGamingPreferencesModal, setShowGamingPreferencesModal] = useState(false);
  const [selectedGamingPreferences, setSelectedGamingPreferences] = useState(
    parsePreferences(profile.preferences)
  );
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(
    parsePreferences(profile.languages) // reutilizo parse para la puntuación.
  );

  //estados para los errores de juego repetido y horas
  const [errorRepeatedGame, setErrorRepeatedGame] = useState("")
  const [errorHoursPlayed, setErrorHoursPlayed] = useState("")
  const [errorCeroHours, setErrorCeroHours] = useState("")

  // Opciones para selects
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const genders = ["Male", "Female", "Undefined"];

  let allGames = store.user?.profile?.games ? store.user.profile.games : [];
  const topThreeGames = allGames
    .slice() // Copia para no mutar original
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
    .slice(0, 3);


  // Mapeo avatars: filename -> clave interna
  const picMap = {
    "profile-pic-1.png": "photo1",
    "profile-pic-2.png": "photo2",
    "profile-pic-3.png": "photo3",
    "profile-pic-4.png": "photo4",
    "profile-pic-5.png": "photo5",
    "profile-pic-6.png": "photo6",
    "profile-pic-7.png": "photo7",
    "profile-pic-8.png": "photo8",
    "profile-pic-9.png": "photo9",
  };

  const photoArray = [
    { key: "photo1", file: photo1 },
    { key: "photo2", file: photo2 },
    { key: "photo3", file: photo3 },
    { key: "photo4", file: photo4 },
    { key: "photo5", file: photo5 },
    { key: "photo6", file: photo6 },
    { key: "photo7", file: photo7 },
    { key: "photo8", file: photo8 },
    { key: "photo9", file: photo9 },
  ];
  const photoAssets = { photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9 };

  // Carga inicial de perfil y reviews recibidos
  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate('/');
      return;
    }
    loadProfile();
    return () => {
      clearTimeout(clearNoticeTimerRef.current);
    };
  }, []);



  useEffect(() => {
    // Limpiar popovers anteriores (evita duplicados o errores)
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
      const popover = bootstrap.Popover.getInstance(el);
      if (popover) popover.dispose();
    });

    // Inicializar popovers actuales
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
      new bootstrap.Popover(el);
    });
  }, [topThreeGames]); // 🔥 Se reinicia solo cuando topThreeGames cambia

  useEffect(() => {
    // fetchGames()
    if (activeTab === "Games" && availableGames.length < 1) {
      fetchGames()
    }
    if (activeTab === "comments") {
      getReviews();
    }
  }, [activeTab]);

  const getReviews = async () => {
    reviewServices.getAllReviewsReceived(store.user?.id)
      .then(data => dispatch({ type: "matchReviewsReceived", payload: data }));
  }
  const fetchGames = async () => {
    try {
      const pageSize = 40; // max permitido por petición
      const pages = 25;    // para aproximarnos a ~1000 títulos
      let allGames = [];

      for (let page = 1; page <= pages; page++) {
        const resp = await fetch(
          `https://api.rawg.io/api/games?key=${rawgApi}&page_size=${pageSize}&page=${page}`
        );
        if (!resp.ok) throw new Error('Error cargando juegos');
        const data = await resp.json();
        allGames = allGames.concat(data.results.map((g) => g.name));
      }
      setAvailableGames(allGames);
      console.log(allGames)
    } catch (err) {
      console.error('RAWG fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userServices.getUserInfo();
      await dispatch({ type: 'getUserInfo', payload: data.user });

      const profile = data.user?.profile;
      if (!profile) return;

      setProfile({
        name: profile.name,
        nick_name: profile.nick_name,
        age: profile.age,
        gender: profile.gender,
        location: profile.location,
        zodiac: profile.zodiac,
        discord: profile.discord,
        steam_id: profile.steam,
        languages: profile.language,
        preferences: profile.preferences,
        bio: profile.bio,
        photo: profile.photo || 'photo1',
      });

      const isIncomplete =
        !profile.name || profile.name.length < 2 ||
        !profile.nick_name || profile.nick_name.length < 2 ||
        !profile.age || profile.age <= 0 ||
        !profile.gender || profile.gender.length < 2 ||
        !profile.location || profile.location.length < 2 ||
        !profile.zodiac || profile.zodiac.length < 2 ||
        !profile.discord || profile.discord.length < 2 ||
        !profile.steam || profile.steam.length < 2 ||
        !profile.language || profile.language.length < 2 ||
        !profile.preferences || profile.preferences.length < 2 ||
        !profile.bio || profile.bio.length < 2 ||
        !profile.photo || profile.photo.length < 2;


      if (isIncomplete) {
        setNotice(
          <h4 className="text-center text-danger">

            <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i> Profile incomplete. Remember to complete it to unlock the full potential of PlayerLink.
          </h4>
        );

        clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 10000);
      }

    } catch (error) {
      console.error('Error en loadProfile:', error);
    }
  };

  // Cambiar avatar en backend y estado local
  const handlePicChange = async (photoKey) => {
    try {
      await userServices.changeUserPhoto(store.user.id, { photo: photoKey });
      setProfile(prev => ({ ...prev, photo: photoKey }));
    } catch (err) {
      console.error('Error al cambiar foto:', err);
    } finally {
      setShowModal(false);
    }
  };


  // Seleccionar asset de avatar
  const selectPhoto = () => photoAssets[profile.photo] || photo1;

  // Seleccionar medalla según horas
  const selectMedal = (hours) => {
    const h = parseInt(hours, 10) || 0;
    if (h >= 2500) return goldMedal;
    if (h >= 500) return silverMedal;
    return bronzeMedal;
  };

  // Crear o actualizar perfil
  const updateProfile = async () => {
    if (store.user.profile) {
      try {
        const resp = await fetch(url + `/api/profiles/${store.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(profile),
        });
        if (!resp.ok) throw new Error('Error al guardar perfil');
      } catch (err) {
        console.error('Error en updateProfile:', err);
      }
    } else {
      try {
        const resp = await fetch(url + `/api/profiles/${store.user?.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(profile),
        });
        if (!resp.ok) throw new Error('Error al guardar perfil');
      } catch (err) {
        console.error('Error en updateProfile:', err);
      }
    }
    await loadProfile();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGame((prev) => ({
      ...prev,
      [name]: name === "hours_played" ? Number(value) : value,
    }));
  };


  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };


  const selectGameImage = async (gameTitle) => {
    try {
      const response = await fetch(`https://api.rawg.io/api/games?key=${rawgApi}&search=${gameTitle}`);
      const data = await response.json();

      if (data.results.length === 0) {
        console.warn("No se encontraron resultados para:", gameTitle);
        return null;
      }

      const game = data.results[0];
      console.log("Nombre:", game.name);
      console.log("Portada:", game.background_image);
      return game.background_image
    } catch (error) {
      console.error("Error al obtener la imagen del juego:", error);
      return null;
    }
  };
  const handleAdd = async () => {

    setErrorRepeatedGame('');
    setErrorHoursPlayed('');

    if (game.title.length <= 0 || game.hours_played <= 0) {
      setErrorHoursPlayed('Your must complete all the information')
      return;
    }
    if (store.user.profile.games.some(g => g.gameTitle === game.title)) {
      setErrorRepeatedGame('This game is already on the list')
      return;
    }
    try {
      const image = await selectGameImage(game.title);
      console.log("La imagen es:", image);

      const newGame = {
        ...game,
        image
      };
      console.log("Enviando:", newGame);
      await gameServices.postNewGame(store.user.profile?.id, newGame);
      allGames = store.user?.profile?.games ? store.user.profile.games : [];
      await loadProfile();

      // Cerrar modal y limpiar
      const modalEl = document.getElementById('commentModal');
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      setGame({ title: '', hours_played: '', image: '' });
    } catch (err) {
      console.error('Error añadiendo el juego o recargando perfil:', err);
    }
  };


  const handleDeleteGame = async (game_id) => {
    await gameServices.deleteGameById(game_id);
    await loadProfile();
  }

  const handleSubmit = async (e, gameId) => {
    e.preventDefault()
    const hours = game.hours_played

    if (hours <= 0) {
      setErrorCeroHours('Hours must be more than 0')
      return;
    }
    await gameServices.updateGameInfo(gameId, hours)
    await loadProfile()
    setIdOfGameBeingEdited(0)
    setGame({
      hours_played: 0,
    });

    setErrorCeroHours("")

  }
  return (
    <>
      {notice && <div className="alert alert-danger">{notice}</div>}
      <div className="profile-container">

        {/* PANEL IZQUIERDO: Avatar y Medallas */}
        <div className="left-panel">
          <div className="avatar-section">

            <button className="gear-btn" onClick={() => setShowModal(true)}>
              <i className="fa-solid fa-gear"></i>
            </button>
            <img src={selectPhoto()} alt="Avatar" className="profile-avatar" />


          </div>
          <h2>{profile.nick_name}</h2>
          <p className="location">{profile.location}</p>
          <div className="medal-list">
            {topThreeGames.map((el, i) => (
              <div key={el.id || i} className="medal-game-card">
                <img
                  src={selectMedal(el.gameHoursPlayed)}
                  alt="Medal"
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
                  alt={`Portada de ${el.gameTitle}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: Bio, Tabs e Info */}
        <div className="right-panel">

          {/* Edit mode action bar */}
          {isEditing && (
            <div className="edit-mode-bar">
              <span className="edit-mode-label">
                <i className="fa-solid fa-pencil me-2"></i>Editing profile
              </span>
              <div className="edit-mode-actions">
                <button className="edit-cancel-btn" onClick={() => { setIsEditing(false); loadProfile(); }}>
                  <i className="fa-solid fa-xmark me-1"></i>Cancel
                </button>
                <button className="edit-save-btn" onClick={updateProfile}>
                  <i className="fa-solid fa-floppy-disk me-1"></i>Save
                </button>
              </div>
            </div>
          )}

          <div className="tabs">
            {['info', 'Games', 'comments'].map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
          {activeTab === 'info' && (
            <div className="info-section container">
              {/* Bio — first field so it's near the rest when editing */}
              <div className="row">
                <div className="col-12">
                  <label>Bio</label>
                  {isEditing ? (
                    <textarea
                      className="form-control textareastyle"
                      rows={3}
                      value={profile.bio}
                      onChange={e => handleInputChange('bio', e.target.value)}
                    />
                  ) : (
                    <p className="bio-static-text">{profile.bio || "No bio yet."}</p>
                  )}
                </div>
              </div>
              {/* Nombre y Nickname */}
              <div className="row">
                {['name', 'nick_name'].map((f, i) => (
                  <div key={i} className="col-md-6">
                    <label>{f === 'nick_name' ? 'Nickname' : 'Name'}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile[f]}
                        onChange={e => handleInputChange(f, e.target.value)}
                        maxLength={11}
                      />
                    ) : (
                      <p>{profile[f]}</p>
                    )}
                  </div>
                ))}
              </div>
              {/* Age, Gender, Zodiac */}
              <div className="row">
                <div className="col-md-4">
                  <label>Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.age}
                      onChange={e => handleInputChange('age', +e.target.value)}
                      max={120}
                      min={1}
                    />
                  ) : (
                    <p>{profile.age}</p>
                  )}
                </div>
                <div className="col-md-4">
                  <label>Gender</label>
                  {isEditing ? (
                    <select
                      value={profile.gender}
                      onChange={e => handleInputChange('gender', e.target.value)}
                    >
                      {genders.map((g, idx) => <option key={idx}>{g}</option>)}
                    </select>
                  ) : (
                    <p>{profile.gender}</p>
                  )}
                </div>
                <div className="col-md-4">
                  <label>Zodiac</label>
                  {isEditing ? (
                    <select
                      value={profile.zodiac}
                      onChange={e => handleInputChange('zodiac', e.target.value)}
                    >
                      {zodiacSigns.map((z, idx) => <option key={idx}>{z}</option>)}
                    </select>
                  ) : (
                    <p>{profile.zodiac}</p>
                  )}
                </div>
              </div>
              {/* Contacto y preferencias */}
              <div className="row">
                {['discord', 'steam_id'].map((f, i) => (
                  <div key={i} className="col-md-6">


                    <label className="d-flex align-items-center gap-2 mt-1 mb-1">{f === 'steam_id' ? 'Steam Friend ID' : 'Discord'}
                      <div>
                        <span className="tooltip-wrapper">
                          <i className="fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                          <span className="tooltip-text discord-info-tooltip-text">
                            <strong>Connect with your matches</strong>
                            <div>
                              The Discord or Steam info<br />
                              in your profile will be <br />
                              used by your matches<br />
                              to reach out to you.
                            </div>
                          </span>
                        </span>

                      </div>

                    </label>

                    {isEditing ? (
                      <input
                        type="text"
                        value={profile[f]}
                        onChange={e => handleInputChange(f, e.target.value)}
                        maxLength={30}
                      />
                    ) : (
                      <p>{profile[f]}</p>
                    )}
                  </div>
                ))}
                {/* MODAL DE PREFERENCES----------------------- */}
                <div className="gaming-prefs-box col-md-6">
                  <label>Gaming Preferences</label>
                  {isEditing ? (
                    <>
                      <div className="section-container">
                        <button
                          onClick={() => setShowGamingPreferencesModal(true)}
                          className="section-button"
                        >
                          Select Preferences
                        </button>
                        <p> {selectedGamingPreferences.length > 0
                          ? formatPreferences(selectedGamingPreferences)
                          : "No preferences selected yet."}</p>
                      </div>

                      {showGamingPreferencesModal && (
                        <GamingPreferencesModal
                          selected={selectedGamingPreferences}
                          setSelected={setSelectedGamingPreferences}
                          onSave={() => {
                            // Guarda las preferencias como string...
                            handleInputChange('preferences', formatPreferences(selectedGamingPreferences));
                            setShowGamingPreferencesModal(false);
                          }}
                          onCancel={() => setShowGamingPreferencesModal(false)}
                        />
                      )}
                    </>
                  ) : (
                    <p>
                      {profile.preferences && profile.preferences.trim().length > 0
                        ? profile.preferences
                        : "No preferences selected yet."}

                    </p>
                  )}
                </div>

                <div className="col-md-6">
                  <label>Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      maxLength={20}
                      minLength={4}
                    />
                  ) : (
                    <p>{profile.location}</p>
                  )}
                </div>
                <div className="col-md-12">
                  <div className="form-group">
                    <label className="" >Languages</label>
                    {isEditing ? (
                      <>
                        <div className="section-container">
                          <button
                            onClick={() => setShowLanguageModal(true)}
                            className="section-button"
                          >
                            Select Languages
                          </button>
                          <p style={{ minHeight: "38px" }}>
                            {selectedLanguages.length > 0
                              ? formatPreferences(selectedLanguages)
                              : "No languages selected."}
                          </p>
                        </div>

                        {showLanguageModal && (
                          <LanguageModal
                            selected={selectedLanguages}
                            setSelected={setSelectedLanguages}
                            onSave={() => {
                              handleInputChange(
                                "languages",
                                formatPreferences(selectedLanguages)
                              );
                              setShowLanguageModal(false);
                            }}
                            onCancel={() => setShowLanguageModal(false)}
                          />
                        )}
                      </>
                    ) : (
                      <p style={{ minHeight: "38px" }}> {/* no me gusta usar style así, pero no quería interferir */}
                        {profile.languages ? profile.languages : "No languages selected."}
                      </p>
                    )}
                  </div>
                </div>


              </div>
              <div className="row mt-3">
                <div className="col text-left">
                  {!isEditing && (
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                      <i className="fa-solid fa-pencil me-2"></i>Edit profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'Games' && (
            <div className="container info-section">
              <div className="row d-flex justify-content-around align-items-center">
                <h2 className="col-lg-6 col-md-12 col-sm-12 mt-3">

                  Games{" "}
                  <span className="tooltip-wrapper">
                    <i className="fa-solid fa-circle-info fa-2xs medals-info-icon"></i>
                    <span className="tooltip-text medal-info-tooltip-text">
                      <strong>Medal Info:</strong>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-gold"></i> +2500 hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-silver"></i> +500 hours
                      </div>
                      <div>
                        <i className="fa-solid fa-medal mt-1 medal-info-bronze"></i> 0-500 hours
                      </div>
                    </span>
                  </span>
                </h2>
                <button
                  type="button"
                  className="btn botonLeaveComment col-lg-4 col-md-12 col-sm-12"
                  data-bs-toggle="modal"
                  data-bs-target="#commentModal"
                >
                  Add a new game
                </button>

                <div className="modal fade" id="commentModal" tabIndex="-1" aria-hidden="true">
                  <div className="modal-dialog">
                    <div className="modal-content modal-sci-fi">
                      <div className="modal-header modal-sci-fi-header">
                        <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
                          Add a new game
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-sci-fi"
                          data-bs-dismiss="modal"
                          aria-label="Cerrar"
                        />
                      </div>
                      <div className="modal-body modal-sci-fi-body">
                        <div className="mb-3">
                          <label htmlFor="gameName" className="label-sci-fi">Select a game</label>
                          <Select
                            className="selectorJuegos"
                            options={gameOptions}
                            value={gameOptions.find(opt => opt.value === game.title) || null}
                            onChange={(selected) =>
                              handleChange({ target: { name: 'title', value: selected?.value || "" } })
                            }
                            isClearable
                            isSearchable
                            placeholder="-- Select a game --"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="hoursPlayed" className="label-sci-fi">Hours played</label>
                          <input
                            type="number"
                            className="input-sci-fi"
                            id="hoursPlayed"
                            name="hours_played"
                            value={game.hours_played}
                            onChange={handleChange}
                            placeholder="Eg.: 42"
                            min="1"
                            max="10000"
                          />
                          {errorHoursPlayed && <h6 className="text-danger ms-2 mt-2 ">{errorHoursPlayed}</h6>}
                          {errorRepeatedGame && <h6 className="text-danger ms-2 mt-2 ">{errorRepeatedGame}</h6>}

                        </div>
                      </div>
                      <div className="modal-footer modal-sci-fi-footer">
                        <button
                          type="button"
                          className="btn-sci-fi-primary"
                          data-bs-dismiss="modal"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-sci-fi-primary"
                          onClick={handleAdd}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-5 gap-3 d-flez justify-content-center gamesbigbox p-2">
                {store.user.profile?.games ? store.user.profile.games.map((el, i) => (
                  <div key={i} className="row gamesbox d-flex align-content-center py-3">
                    <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                      <h6 className="m-0">{el.gameTitle}</h6>


                    </div>
                    {idOfGameBeingEdited === el.id ?

                      <form className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center" onSubmit={(e) => handleSubmit(e, el.id)}>

                        <div className="row d-flex flex-row justify-content-around align-items-center">

                          {errorCeroHours && <h6 className="me-4 text-danger mt-2 error-hours-font">{errorCeroHours}</h6>}

                          <input className="col-auto input-hours border-2 rounded-2 ms-2" type="number" name="hours_played" value={game.hours_played} onChange={(e) => setGame({ ...game, hours_played: e.target.value })} placeholder="Hours" />
                          <button type="submit" className="me-1 fa-solid fa-solid fa-floppy-disk btn bg-transparent botonesAccionesJuegos btn-save-game col-auto" />
                          <span className="ms-1 text-danger botonesAccionesJuegos btn-close-edit-game col-auto col-auto" onClick={() => setIdOfGameBeingEdited(0)}>X</span>

                        </div>


                      </form>
                      :
                      <div className="d-flex justify-content-around col-lg-6 col-md-12 col-sm-12 align-items-center">
                        <h6 className="m-0 col-4">{el.gameHoursPlayed} hours</h6>
                        <span className="text-light botonesAccionesJuegos col-auto fa-solid fa-pencil" onClick={() => setIdOfGameBeingEdited(el.id)}></span>
                        <span className="text-danger botonesAccionesJuegos col-auto fa-solid fa-trash" onClick={() => handleDeleteGame(el.id)}></span>
                      </div>
                    }
                  </div>
                )) : <p>No games yet</p>}
              </div>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="info-section container">
              <div className="row justify-content-around">
                <h3 className="col-1 m-2 mb-4">Comments</h3>
                <div className="col-auto m-2 mb-4"></div>
              </div>
              <div className="row">
                {store.matchReviewsReceived?.reviews_received?.length > 0 ? (
                  store.matchReviewsReceived?.reviews_received.map(el => (
                    <div key={el.id} className="review-card">
                      <div className="review-container">
                        Author: {el.author_nickname} — {el.stars} ⭐️
                        <p className="m-0 border-0 review-box">
                          <span className="fa-solid fa-comment mx-2"></span>
                          {el.comment}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Modal de selección de avatar */}
        {showModal && (
          <div className="modal-overlay">
            <div className="avatar-modal">
              <h3>Choose Your Avatar</h3>
              <div className="avatar-grid">
                {photoArray.map(({ key, file }, idx) => {
                  const isSelected = key === profile.photo;

                  return (
                    <img
                      key={idx}
                      src={file}
                      alt={`Avatar ${idx + 1}`}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handlePicChange(key)}
                    />
                  );
                })}
              </div>




              <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
