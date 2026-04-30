// Profile.jsx — Orquestador
// Gestiona todo el estado y la lógica de negocio del perfil.
// El renderizado visual está delegado en los sub-componentes de /components/profile/.

import React, { useEffect, useRef, useState } from "react";
import "./Profile.css";

// Hooks y servicios
import useGlobalReducer from "../../hooks/useGlobalReducer";
import userServices from "../../services/userServices.js";
import reviewServices from "../../services/reviewServices.js";
import gameServices from "../../services/gameServices.js";

// Sub-componentes de perfil
import { ProfileLeftPanel } from "../../components/profile/ProfileLeftPanel.jsx";
import { ProfileEditBar } from "../../components/profile/ProfileEditBar.jsx";
import { ProfileTabBar } from "../../components/profile/ProfileTabBar.jsx";
import { ProfileInfoTab } from "../../components/profile/ProfileInfoTab.jsx";
import { ProfileGamesTab } from "../../components/profile/ProfileGamesTab.jsx";
import { ProfileCommentsTab } from "../../components/profile/ProfileCommentsTab.jsx";
import { AvatarPickerModal } from "../../components/profile/AvatarPickerModal.jsx";

// Assets - Avatares
import photo1 from "../../assets/img/profile-pics/profile-pic-1.png";
import photo2 from "../../assets/img/profile-pics/profile-pic-2.png";
import photo3 from "../../assets/img/profile-pics/profile-pic-3.png";
import photo4 from "../../assets/img/profile-pics/profile-pic-4.png";
import photo5 from "../../assets/img/profile-pics/profile-pic-5.png";
import photo6 from "../../assets/img/profile-pics/profile-pic-6.png";
import photo7 from "../../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../../assets/img/profile-pics/profile-pic-9.png";

// Assets - Medallas
import goldMedal from "../../assets/img/medals/gold-medal.png";
import silverMedal from "../../assets/img/medals/silver-medal.png";
import bronzeMedal from "../../assets/img/medals/bronze-medal.png";

import { useNavigate } from "react-router-dom";

// ── Helpers de preferencias/idiomas ─────────────────────────────────────────

/** Convierte un array de strings en "a, b and c." */
const formatPreferences = (prefs) => {
  if (!prefs || prefs.length === 0) return "";
  if (prefs.length === 1) return prefs[0] + ".";
  return prefs.slice(0, -1).join(", ") + " and " + prefs[prefs.length - 1] + ".";
};

/** Convierte "a, b and c." de vuelta en ["a", "b", "c"] */
const parsePreferences = (str) => {
  if (!str) return [];
  return str
    .replace(/\.$/, "")
    .split(/, | and /)
    .map((p) => p.trim())
    .filter(Boolean);
};

// ── Datos estáticos de avatares ──────────────────────────────────────────────

const PHOTO_ARRAY = [
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

const PHOTO_ASSETS = {
  photo1, photo2, photo3, photo4,
  photo5, photo6, photo7, photo8, photo9,
};

// ── Componente ───────────────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  const url = import.meta.env.VITE_BACKEND_URL;
  const rawgApi = import.meta.env.VITE_RAWG_KEY;

  // ── Estado del perfil ──
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
    photo: "photo1",
  });

  // ── Estado de UI ──
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [notice, setNotice] = useState("");
  const clearNoticeTimerRef = useRef(null);

  // ── Estado de modales de preferencias/idiomas ──
  const [showGamingPreferencesModal, setShowGamingPreferencesModal] = useState(false);
  const [selectedGamingPreferences, setSelectedGamingPreferences] = useState(
    parsePreferences(profile.preferences)
  );
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(
    parsePreferences(profile.languages)
  );

  // ── Estado de juegos ──
  const [availableGames, setAvailableGames] = useState([]);
  const [game, setGame] = useState({ title: "", hours_played: "", image: "" });
  const [idOfGameBeingEdited, setIdOfGameBeingEdited] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorRepeatedGame, setErrorRepeatedGame] = useState("");
  const [errorHoursPlayed, setErrorHoursPlayed] = useState("");
  const [errorCeroHours, setErrorCeroHours] = useState("");

  // ── Datos derivados ──
  const allGames = store.user?.profile?.games ?? [];
  const topThreeGames = [...allGames]
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
    .slice(0, 3);

  const gameOptions = availableGames.map((name) => ({ value: name, label: name }));

  // ── Efectos ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate("/");
      return;
    }
    loadProfile();
    return () => clearTimeout(clearNoticeTimerRef.current);
  }, []);

  // Reinicializar popovers de Bootstrap cuando cambian las medallas
  useEffect(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      const popover = bootstrap.Popover.getInstance(el);
      if (popover) popover.dispose();
    });
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      new bootstrap.Popover(el);
    });
  }, [topThreeGames]);

  // Carga diferida: juegos de RAWG y reviews
  useEffect(() => {
    if (activeTab === "Games" && availableGames.length < 1) {
      fetchGames();
    }
    if (activeTab === "comments") {
      getReviews();
    }
  }, [activeTab]);

  // ── Lógica de negocio ────────────────────────────────────────────────────

  const getReviews = async () => {
    reviewServices
      .getAllReviewsReceived(store.user?.id)
      .then((data) => dispatch({ type: "matchReviewsReceived", payload: data }));
  };

  const fetchGames = async () => {
    try {
      const pageSize = 40;
      const pages = 25;
      let fetched = [];
      for (let page = 1; page <= pages; page++) {
        const resp = await fetch(
          `https://api.rawg.io/api/games?key=${rawgApi}&page_size=${pageSize}&page=${page}`
        );
        if (!resp.ok) throw new Error("Error loading games");
        const data = await resp.json();
        fetched = fetched.concat(data.results.map((g) => g.name));
      }
      setAvailableGames(fetched);
    } catch (err) {
      console.error("RAWG fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await userServices.getUserInfo();
      await dispatch({ type: "getUserInfo", payload: data.user });

      const p = data.user?.profile;
      if (!p) return;

      setProfile({
        name: p.name,
        nick_name: p.nick_name,
        age: p.age,
        gender: p.gender,
        location: p.location,
        zodiac: p.zodiac,
        discord: p.discord,
        steam_id: p.steam,
        languages: p.language,
        preferences: p.preferences,
        bio: p.bio,
        photo: p.photo || "photo1",
      });

      const isIncomplete =
        !p.name || p.name.length < 2 ||
        !p.nick_name || p.nick_name.length < 2 ||
        !p.age || p.age <= 0 ||
        !p.gender || p.gender.length < 2 ||
        !p.location || p.location.length < 2 ||
        !p.zodiac || p.zodiac.length < 2 ||
        !p.discord || p.discord.length < 2 ||
        !p.steam || p.steam.length < 2 ||
        !p.language || p.language.length < 2 ||
        !p.preferences || p.preferences.length < 2 ||
        !p.bio || p.bio.length < 2 ||
        !p.photo || p.photo.length < 2;

      if (isIncomplete) {
        setNotice(
          <h4 className="text-center text-danger">
            <i className="fa-solid fa-triangle-exclamation text-warning fa-xl"></i>
            {" "}Profile incomplete. Remember to complete it to unlock the full potential of PlayerLink.
          </h4>
        );
        clearNoticeTimerRef.current = setTimeout(() => setNotice(""), 10000);
      }
    } catch (error) {
      console.error("Error in loadProfile:", error);
    }
  };

  const handlePicChange = async (photoKey) => {
    try {
      await userServices.changeUserPhoto(store.user.id, { photo: photoKey });
      setProfile((prev) => ({ ...prev, photo: photoKey }));
    } catch (err) {
      console.error("Error changing photo:", err);
    } finally {
      setShowAvatarModal(false);
    }
  };

  const selectPhoto = () => PHOTO_ASSETS[profile.photo] || photo1;

  const selectMedal = (hours) => {
    const h = parseInt(hours, 10) || 0;
    if (h >= 2500) return goldMedal;
    if (h >= 500) return silverMedal;
    return bronzeMedal;
  };

  const updateProfile = async () => {
    const method = store.user.profile ? "PUT" : "POST";
    try {
      const resp = await fetch(`${url}/api/profiles/${store.user.id}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profile),
      });
      if (!resp.ok) throw new Error("Error saving profile");
    } catch (err) {
      console.error("Error in updateProfile:", err);
    }
    await loadProfile();
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleGameFormChange = (e) => {
    const { name, value } = e.target;
    setGame((prev) => ({
      ...prev,
      [name]: name === "hours_played" ? Number(value) : value,
    }));
  };

  const selectGameImage = async (gameTitle) => {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${rawgApi}&search=${gameTitle}`
      );
      const data = await response.json();
      if (!data.results?.length) return null;
      return data.results[0].background_image;
    } catch (error) {
      console.error("Error fetching game image:", error);
      return null;
    }
  };

  const handleAddGame = async () => {
    setErrorRepeatedGame("");
    setErrorHoursPlayed("");

    if (!game.title || game.hours_played <= 0) {
      setErrorHoursPlayed("You must complete all the information");
      return;
    }
    if (store.user.profile.games.some((g) => g.gameTitle === game.title)) {
      setErrorRepeatedGame("This game is already on the list");
      return;
    }
    try {
      const image = await selectGameImage(game.title);
      await gameServices.postNewGame(store.user.profile?.id, { ...game, image });
      await loadProfile();

      const modalEl = document.getElementById("commentModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
      setGame({ title: "", hours_played: "", image: "" });
    } catch (err) {
      console.error("Error adding game:", err);
    }
  };

  const handleDeleteGame = async (game_id) => {
    await gameServices.deleteGameById(game_id);
    await loadProfile();
  };

  const handleUpdateHours = async (e, gameId) => {
    e.preventDefault();
    if (game.hours_played <= 0) {
      setErrorCeroHours("Hours must be more than 0");
      return;
    }
    await gameServices.updateGameInfo(gameId, game.hours_played);
    await loadProfile();
    setIdOfGameBeingEdited(0);
    setGame({ hours_played: 0 });
    setErrorCeroHours("");
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {notice && <div className="alert alert-danger">{notice}</div>}

      <div className="profile-container">
        {/* ── Panel izquierdo ── */}
        <ProfileLeftPanel
          photoSrc={selectPhoto()}
          nickName={profile.nick_name}
          location={profile.location}
          topThreeGames={topThreeGames}
          selectMedal={selectMedal}
          onOpenAvatarPicker={() => setShowAvatarModal(true)}
        />

        {/* ── Panel derecho ── */}
        <div className="right-panel">
          {isEditing && (
            <ProfileEditBar
              onCancel={() => { setIsEditing(false); loadProfile(); }}
              onSave={updateProfile}
            />
          )}

          <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "info" && (
            <ProfileInfoTab
              profile={profile}
              isEditing={isEditing}
              onInputChange={handleInputChange}
              onEditStart={() => setIsEditing(true)}
              showGamingPreferencesModal={showGamingPreferencesModal}
              setShowGamingPreferencesModal={setShowGamingPreferencesModal}
              selectedGamingPreferences={selectedGamingPreferences}
              setSelectedGamingPreferences={setSelectedGamingPreferences}
              showLanguageModal={showLanguageModal}
              setShowLanguageModal={setShowLanguageModal}
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={setSelectedLanguages}
              formatPreferences={formatPreferences}
            />
          )}

          {activeTab === "Games" && (
            <ProfileGamesTab
              games={store.user?.profile?.games}
              gameOptions={gameOptions}
              game={game}
              onGameChange={handleGameFormChange}
              onAddGame={handleAddGame}
              onDeleteGame={handleDeleteGame}
              onUpdateHours={handleUpdateHours}
              idOfGameBeingEdited={idOfGameBeingEdited}
              setIdOfGameBeingEdited={setIdOfGameBeingEdited}
              setGame={setGame}
              errorHoursPlayed={errorHoursPlayed}
              errorRepeatedGame={errorRepeatedGame}
              errorCeroHours={errorCeroHours}
            />
          )}

          {activeTab === "comments" && (
            <ProfileCommentsTab
              reviews={store.matchReviewsReceived?.reviews_received}
            />
          )}
        </div>

        <AvatarPickerModal
          show={showAvatarModal}
          photoArray={PHOTO_ARRAY}
          selectedPhotoKey={profile.photo}
          onSelect={handlePicChange}
          onClose={() => setShowAvatarModal(false)}
        />
      </div>
    </>
  );
};

export default Profile;
