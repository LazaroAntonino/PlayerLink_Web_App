import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../pages/Privateviews/Profile.css";
import reviewServices from "../services/reviewServices";
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import photo1 from "../assets/img/profile-pics/profile-pic-1.png";
import photo2 from "../assets/img/profile-pics/profile-pic-2.png";
import photo3 from "../assets/img/profile-pics/profile-pic-3.png";
import photo4 from "../assets/img/profile-pics/profile-pic-4.png";
import photo5 from "../assets/img/profile-pics/profile-pic-5.png";
import photo6 from "../assets/img/profile-pics/profile-pic-6.png";
import photo7 from "../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../assets/img/profile-pics/profile-pic-9.png";



export const MatchUserDetails = () => {
  const navigate = useNavigate()
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [showModal, setShowModal] = useState(false);
  const [selectedPic, setSelectedPic] = useState("profile-pic-1.png");
  const [rating, setRating] = useState(0);
  const [newComment, setNewComment] = useState({ stars: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const allGames = store.itsMatchInfo?.profile?.games ?? [];
  const topThreeGames = allGames
    .slice()                                      // 1. Copia el array para no mutar el original
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))  // 2. Orden descendente por horas
    .slice(0, 3);


  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate('/')
    } else {
      userServices
        .getUserInfoById(id)
        .then(data => dispatch({ type: "getItsMatchInfo", payload: data }))
        .catch(err => console.error("Failed to load user info:", err));
      reviewServices
        .getAllReviewsReceived(id)
        .then(data => dispatch({ type: "matchReviewsReceived", payload: data }));
    }
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

  // El hook useMemo de React sirve para “memorizar” (cachear) el resultado de una función de cálculo y sólo volver a 
  // ejecutarla cuando cambien unas dependencias que tú le indiques. Se utiliza para optimizar el rendimiento, evitando 
  // cálculos innecesarios en cada renderizado.
  const profile = useMemo(() => {
    const p = store.itsMatchInfo?.profile ?? {};
    return {
      name: p.name ?? "no data",
      nickname: p.nick_name ?? "no data",
      age: p.age ?? "no data",
      gender: p.gender ?? "no data",
      location: p.location ?? "no data",
      zodiac: p.zodiac ?? "no data",
      discord: p.discord ?? "no data",
      steam: p.steam ?? "no data",
      languages: p.languages ?? "no data", // renamed to match API
      gamingPrefs: p.preferences ?? "no data",
      bio: p.bio ?? "no data",
      photo: p.photo ?? "no data"
    };
  }, [store.itsMatchInfo]);

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


  const handleSaveComment = async (e) => {
    e.preventDefault();
    try {
      // 1. Envía la nueva review: userId, recipientId, { stars, comment }
      await reviewServices.postNewReview(
        store.user.id,
        store.itsMatchInfo.id,
        newComment
      );

      // 2. Limpia el estado del formulario
      setNewComment({ stars: 0, comment: "" });

      // 3. Cierra el modal (Bootstrap 5 API)
      const modalEl = document.getElementById("commentModal");
      const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
      modalInstance.hide();

      reviewServices.getAllReviewsReceived(id).then(data => dispatch({ type: "matchReviewsReceived", payload: data }))

    } catch (error) {
      console.error("Error al guardar el comentario:", error);
      // aquí podrías mostrar un alert o toast de error
    }
  };

  const selectPhoto = () => {
    switch (profile.photo) {
      case "photo1": return photo1;
      case "photo2": return photo2;
      case "photo3": return photo3;
      case "photo4": return photo4;
      case "photo5": return photo5;
      case "photo6": return photo6;
      case "photo7": return photo7;
      case "photo8": return photo8;
      case "photo9": return photo9;
      default: return "photo1";
    }
  };

  return (
    <div className="profile-container">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="avatar-section">
          <img
            src={selectPhoto()}
            alt="Profile avatar"
            className="profile-avatar"
          />
        </div>
        <h2>{profile.nickname}</h2>
        <p className="location">{profile.location}</p>

        {/* Medals */}
        <div className="medal-list">
          {topThreeGames.map((el, index) => (
            <div key={el.id ?? index} className="medal-game-card">
              <img
                src={selectMedal(el.gameHoursPlayed)}
                alt={`${el.gameTitle} Medal`}
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

      {/* Right Panel */}
      <div className="right-panel">
        <div className="bio-box">
          <p>{profile.bio}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {['info', 'Games', 'comments'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
          ))}
        </div>

        {/* Info Tab Content */}
        {activeTab === "info" && (
          <div className="info-section container">
            <div className="row">
              <div className="col-md-6">
                <label>Name</label>
                <p>{profile.name}</p>
              </div>
              <div className="col-md-6">
                <label>Nickname</label>
                <p>{profile.nickname}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <label>Age</label>
                <p>{profile.age}</p>
              </div>
              <div className="col-md-4">
                <label>Gender</label>
                <p>{profile.gender}</p>
              </div>
              <div className="col-md-4">
                <label>Zodiac</label>
                <p>{profile.zodiac}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="d-flex align-items-center">

                  <label>Discord</label>
                  <span className="tooltip-wrapper">
                    <i className="ms-2 mt-4 fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div >
                        Want to talk to your match?
                        <br />
                        Use their Discord or Steam
                        <br />
                        info to reach out
                        <br />
                        and start chatting!
                      </div>
                    </span>
                  </span>
                </div>

                <p>{profile.discord}</p>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <label>Steam friend id</label>
                  <span className="tooltip-wrapper">
                    <i className="ms-2 mt-4 fa-solid fa-circle-info fa-xl discord-info-icon"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div >
                        Want to talk to your match?
                        <br />
                        Use their Discord or Steam
                        <br />
                        info to reach out
                        <br />
                        and start chatting!
                      </div>
                    </span>
                  </span>
                </div>
                <p>{profile.steam}</p>
              </div>
              <div className="gaming-prefs-box col-md-6">
                <label>Gaming Preferences</label>
                <p>I'm looking for: {profile.gamingPrefs}</p>
              </div>
              <div className="col-md-6">
                <label>Location</label>
                <p>{profile.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'Games' && (
          <div className="container info-section">

            <div className="row justify-content-start">
              <div className="col-lg-6 col-md-12 col-sm-12 d-flex align-items-center">
                <h2 className="mb-0">Games</h2>
                <span className="tooltip-wrapper ms-2">
                  <i className="fa-solid fa-circle-info fa-xl medals-info-icon"></i>
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
              </div>
            </div>


            <div className="row mt-5 gap-3 justify-content-center gamesbigbox">
              {store.itsMatchInfo?.profile?.games?.length > 0 ? (
                store.itsMatchInfo.profile.games.map((el, i) => (
                  <div key={i} className="col-12 gamesbox d-flex align-items-center py-3">
                    <div className="row w-100 m-0">
                      <div className="col-lg-10 col-md-12 d-flex justify-content-around align-items-center">
                        <h6 className="m-0">{el.gameTitle}</h6>
                        <h6 className="m-0">{el.gameHoursPlayed} hours</h6>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No games available.</p>
              )}
            </div>
          </div>
        )}
        {activeTab === "comments" && <div className="info-section container">
          <div className="row justify-content-around">
            <h3 className="col-1 m-2 mb-4">Comments</h3>
            <div className="col-auto m-2 mb-4">
              <button
                type="button"
                className="btn botonLeaveComment"
                data-bs-toggle="modal"
                data-bs-target="#commentModal"
              >
                Leave a new comment
              </button>
              {/* Modal de nuevo comentario */}
              <div
                className="modal fade"
                id="commentModal"
                tabIndex="-1"
                aria-labelledby="commentModalLabel"
                aria-hidden="true"
              >
                <div className="modal-dialog">
                  <div className="modal-content modal-sci-fi">
                    <div className="modal-header modal-sci-fi-header">
                      <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
                        Leave a new comment
                      </h5>
                      <button
                        type="button"
                        className="btn-close "
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body ">
                      <div className="modal-body modal-sci-fi-body">
                        {/* Rating */}
                        <div className="mb-3 text-warning">
                          <label className="form-label ">Stars</label>
                          <div>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i
                                key={star}
                                className={`fa-star fa-2x ${(hoverRating || newComment.stars) >= star ? "fa-solid" : "fa-regular"
                                  }`}
                                style={{ cursor: "pointer", marginRight: "0.5rem" }}
                                onClick={() =>
                                  setNewComment((prev) => ({ ...prev, stars: star }))
                                }
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment textarea */}
                        <div className="mb-3">
                          <label htmlFor="newComment" className="form-label">
                            Comment
                          </label>
                          <textarea
                            id="newComment"
                            className="form-control"
                            rows="3"
                            value={newComment.comment}
                            onChange={(e) =>
                              setNewComment((prev) => ({ ...prev, comment: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer modal-sci-fi-footer">
                      <button
                        type="button"
                        className="btn btn-sci-fi-primary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-sci-fi-primary"
                        onClick={handleSaveComment}
                        disabled={!newComment.comment.trim() || newComment.stars === 0}
                      >
                        Save comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {store.matchReviewsReceived?.reviews_received?.length > 0 ? (
              store.matchReviewsReceived.reviews_received.map((el) => (
                <div key={el.id} className="review-card">
                  <div className="review-container">
                    <strong>Author:</strong> {el.author_nickname} — {el.stars} ⭐️
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
        </div>}
      </div>
    </div>
  );
};
