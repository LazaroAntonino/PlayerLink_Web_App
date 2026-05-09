import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import userServices from "../services/userServices";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../pages/Privateviews/Profile.css";
import reviewServices from "../services/reviewServices";
import blockServices from "../services/blockServices";
import goldMedal from "../assets/img/medals/gold-medal.png";
import silverMedal from "../assets/img/medals/silver-medal.png";
import bronzeMedal from "../assets/img/medals/bronze-medal.png";
import { resolvePhoto } from "../assets/photoAssets.js";



export const MatchUserDetails = () => {
  const navigate = useNavigate()
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("info");
  const [newComment, setNewComment] = useState({ stars: 0, comment: "" });
  const [hoverRating, setHoverRating] = useState(0);

  // ── Block / Report state ─────────────────────────────────────────────────
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
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


  // ── Block handler ────────────────────────────────────────────────────────
  const handleBlock = async () => {
    setBlockLoading(true);
    setBlockError("");
    try {
      await blockServices.blockUser(store.itsMatchInfo?.id);
      dispatch({ type: "addBlockedUserId", payload: store.itsMatchInfo?.id });
      // El match ha sido eliminado en el backend → volver a la lista de matches
      navigate("/private/your-matches");
    } catch (err) {
      setBlockError(err.message || "Error al bloquear el usuario");
      setBlockLoading(false);
    }
  };

  // ── Report handler ───────────────────────────────────────────────────────
  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    setReportError("");
    try {
      await blockServices.reportUser(store.itsMatchInfo?.id, reportReason);
      setReportSuccess(true);
    } catch (err) {
      setReportError(err.message || "Error al enviar la denuncia");
    } finally {
      setReportLoading(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportReason("");
    setReportError("");
    setReportSuccess(false);
  };

  const handleSaveComment = async () => {
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

  // Helper: campos vacíos o "no data" muestran "Not set"
  const FieldValue = ({ value }) => {
    const isEmpty = !value || value === "no data" || value === "undefined" || value === "0" || value === 0;
    return isEmpty
      ? <span className="profile-field-empty">Not set</span>
      : <span className="profile-field-value">{value}</span>;
  };

  return (
    <div className="profile-container">
      {/* ── Left Panel ── */}
      <div className="left-panel">
        {/* Avatar */}
        <div className="left-avatar-wrapper">
          <div className="left-avatar-ring">
            <img
              src={resolvePhoto(profile.photo)}
              alt="Profile avatar"
              className="left-avatar-img"
            />
          </div>
        </div>

        <h2 className="left-nickname">{profile.nickname || "—"}</h2>

        {profile.location && profile.location !== "no data" && (
          <p className="left-location">
            <i className="fa-solid fa-location-dot me-1" aria-hidden="true"></i>
            {profile.location}
          </p>
        )}

        {/* Separador + Medallas */}
        {topThreeGames.length > 0 && (
          <>
            <div className="left-section-divider">
              <span>Top Games</span>
            </div>

            <div className="medal-list">
              {topThreeGames.map((el, index) => (
                <div key={el.id ?? index} className="medal-game-card">
                  <span
                    className="medal-hours-tooltip"
                    data-tooltip={`${el.gameHoursPlayed ?? 0} h`}
                  >
                    <img
                      src={selectMedal(el.gameHoursPlayed)}
                      alt={`${el.gameTitle} Medal`}
                      className="medal-icon"
                    />
                  </span>
                  {el.gameImage ? (
                    <img
                      className="game-cover-img"
                      src={el.gameImage}
                      alt={`Portada de ${el.gameTitle}`}
                    />
                  ) : (
                    <div className="game-cover-placeholder">
                      <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
                    </div>
                  )}
                  <span className="medal-game-title" title={el.gameTitle}>
                    {el.gameTitle}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Bloquear / Denunciar ── */}
        <div className="block-report-zone">
          <button
            className="btn-block-user"
            onClick={() => { setShowBlockModal(true); setBlockError(""); }}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" />
            Bloquear usuario
          </button>
          <button
            className="btn-report-user"
            onClick={() => { setShowReportModal(true); setReportError(""); setReportSuccess(false); }}
          >
            <i className="fa-solid fa-flag" aria-hidden="true" />
            Denunciar usuario
          </button>
        </div>
      </div>

      {/* ══ MODAL: Confirmar bloqueo ══════════════════════════════════════════ */}
      {createPortal(
        <div
          className={`modal fade ${showBlockModal ? "show d-block" : ""}`}
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: showBlockModal ? "rgba(0,0,0,0.6)" : "transparent" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBlockModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-sci-fi">
              <div className="modal-header modal-sci-fi-header">
                <h5 className="modal-title modal-sci-fi-title">
                  <i className="fa-solid fa-ban me-2" style={{ color: "#ff4d6d" }} aria-hidden="true" />
                  Bloquear usuario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBlockModal(false)}
                  aria-label="Cerrar"
                  disabled={blockLoading}
                />
              </div>
              <div className="modal-body modal-sci-fi-body">
                <div className="block-modal-warning">
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                  <span>
                    ¿Bloquear a <strong>{profile.nickname}</strong>? Esta acción eliminará el match y
                    todos los mensajes entre vosotros. {profile.nickname} no aparecerá en tu
                    búsqueda y tú tampoco en la suya.
                  </span>
                </div>
                {blockError && (
                  <p className="mt-3 mb-0" style={{ color: "#ff4d6d", fontSize: "0.85rem" }}>
                    <i className="fa-solid fa-circle-exclamation me-1" aria-hidden="true" />
                    {blockError}
                  </p>
                )}
              </div>
              <div className="modal-footer modal-sci-fi-footer">
                <button
                  type="button"
                  className="btn-sci-fi-secondary pl-btn pl-btn--accent"
                  onClick={() => setShowBlockModal(false)}
                  disabled={blockLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-sci-fi-primary pl-btn pl-btn--danger"
                  onClick={handleBlock}
                  disabled={blockLoading}
                >
                  {blockLoading
                    ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true" />Bloqueando...</>
                    : <><i className="fa-solid fa-ban me-1" aria-hidden="true" />Bloquear</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ MODAL: Denunciar usuario ══════════════════════════════════════════ */}
      {createPortal(
        <div
          className={`modal fade ${showReportModal ? "show d-block" : ""}`}
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: showReportModal ? "rgba(0,0,0,0.6)" : "transparent" }}
          onClick={(e) => { if (e.target === e.currentTarget && !reportLoading) handleCloseReportModal(); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-sci-fi">
              <div className="modal-header modal-sci-fi-header">
                <h5 className="modal-title modal-sci-fi-title">
                  <i className="fa-solid fa-flag me-2" style={{ color: "#ffa200" }} aria-hidden="true" />
                  Denunciar usuario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseReportModal}
                  aria-label="Cerrar"
                  disabled={reportLoading}
                />
              </div>
              <div className="modal-body modal-sci-fi-body">
                {reportSuccess ? (
                  <div className="report-success-msg">
                    <i className="fa-solid fa-circle-check" aria-hidden="true" />
                    <p>Tu denuncia ha sido enviada. Nuestro equipo la revisará en breve.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="label-sci-fi mb-2 d-block">Motivo de la denuncia</label>
                      <select
                        className="report-reason-select"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        disabled={reportLoading}
                      >
                        <option value="">Selecciona un motivo…</option>
                        <option value="Comportamiento inapropiado">Comportamiento inapropiado</option>
                        <option value="Acoso o intimidación">Acoso o intimidación</option>
                        <option value="Spam o publicidad">Spam o publicidad</option>
                        <option value="Contenido ofensivo en el perfil">Contenido ofensivo en el perfil</option>
                        <option value="Suplantación de identidad">Suplantación de identidad</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    {reportError && (
                      <p className="mb-0" style={{ color: "#ff4d6d", fontSize: "0.85rem" }}>
                        <i className="fa-solid fa-circle-exclamation me-1" aria-hidden="true" />
                        {reportError}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer modal-sci-fi-footer">
                {reportSuccess ? (
                  <button
                    type="button"
                    className="btn-sci-fi-primary pl-btn pl-btn--primary"
                    onClick={handleCloseReportModal}
                  >
                    Cerrar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-sci-fi-secondary pl-btn pl-btn--accent"
                      onClick={handleCloseReportModal}
                      disabled={reportLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-sci-fi-primary pl-btn pl-btn--primary"
                      onClick={handleReport}
                      disabled={reportLoading || !reportReason.trim()}
                    >
                      {reportLoading
                        ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true" />Enviando...</>
                        : <><i className="fa-solid fa-paper-plane me-1" aria-hidden="true" />Enviar denuncia</>
                      }
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div className="right-panel">
        {/* Tabs */}
        <div className="tabs">
          {['info', 'Games', 'comments'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Info Tab ── */}
        {activeTab === "info" && (
          <div className="info-section container">

            {/* Bio */}
            {profile.bio && profile.bio !== "no data" && (
              <div className="row mb-2">
                <div className="col-12">
                  <label className="profile-field-label">Bio</label>
                  <div className="profile-read-field" style={{ minHeight: '60px', alignItems: 'flex-start', padding: '12px 14px' }}>
                    <span className="profile-field-value" style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {profile.bio}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6">
                <label className="profile-field-label">Name</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.name} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="profile-field-label">Nickname</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.nickname} />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <label className="profile-field-label">Age</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.age} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="profile-field-label">Gender</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.gender} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="profile-field-label">Zodiac</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.zodiac} />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <label className="profile-field-label d-flex align-items-center gap-2 mt-1 mb-1">
                  Discord
                  <span className="tooltip-wrapper">
                    <i className="ms-1 fa-solid fa-circle-info discord-info-icon" aria-hidden="true"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div>Use their Discord or Steam<br />info to reach out!</div>
                    </span>
                  </span>
                </label>
                <div className="profile-read-field">
                  <FieldValue value={profile.discord} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="profile-field-label d-flex align-items-center gap-2 mt-1 mb-1">
                  Steam Friend ID
                  <span className="tooltip-wrapper">
                    <i className="ms-1 fa-solid fa-circle-info discord-info-icon" aria-hidden="true"></i>
                    <span className="tooltip-text discord-info-tooltip-text">
                      <strong>Connect with your match</strong>
                      <div>Use their Discord or Steam<br />info to reach out!</div>
                    </span>
                  </span>
                </label>
                <div className="profile-read-field">
                  <FieldValue value={profile.steam} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="profile-field-label">Gaming Preferences</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.gamingPrefs} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="profile-field-label">Location</label>
                <div className="profile-read-field">
                  <FieldValue value={profile.location} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Games Tab ── */}
        {activeTab === 'Games' && (
          <div className="info-section">
            <div className="d-flex align-items-center gap-2 mb-3">
              <h3 className="comments-title mb-0" style={{ border: 'none', paddingBottom: 0 }}>Games</h3>
              <span className="tooltip-wrapper">
                <i className="fa-solid fa-circle-info medals-info-icon" aria-hidden="true"></i>
                <span className="tooltip-text medal-info-tooltip-text">
                  <strong>Medal Info:</strong>
                  <div><i className="fa-solid fa-medal medal-info-gold" aria-hidden="true"></i> +2500 hours</div>
                  <div><i className="fa-solid fa-medal medal-info-silver" aria-hidden="true"></i> +500 hours</div>
                  <div><i className="fa-solid fa-medal medal-info-bronze" aria-hidden="true"></i> 0-500 hours</div>
                </span>
              </span>
            </div>

            {store.itsMatchInfo?.profile?.games?.length > 0 ? (
              store.itsMatchInfo.profile.games.map((el, i) => (
                <div key={i} className="game-row">
                  {el.gameImage ? (
                    <img
                      src={el.gameImage}
                      alt={el.gameTitle}
                      className="game-row-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="game-cover-placeholder"
                    style={{ display: el.gameImage ? 'none' : 'flex', width: '52px', height: '30px' }}
                  >
                    <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
                  </div>
                  <span className="game-row-title">{el.gameTitle}</span>
                  <div className="game-row-actions">
                    <span className="game-row-hours">
                      {el.gameHoursPlayed != null && el.gameHoursPlayed > 0
                        ? `${el.gameHoursPlayed.toLocaleString()} h`
                        : <span className="game-row-hours-empty">—</span>
                      }
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="match-ud-games-empty">
                No games available.
              </p>
            )}
          </div>
        )}

        {/* ── Comments Tab ── */}
        {activeTab === "comments" && (
          <div className="info-section">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
              <h3 className="comments-title mb-0" style={{ border: 'none', paddingBottom: 0 }}>Comments</h3>
              <button
                type="button"
                className="botonLeaveComment pl-btn pl-btn--accent pl-btn--sm"
                data-bs-toggle="modal"
                data-bs-target="#commentModal"
              >
                Leave a comment
              </button>
            </div>

            {/* ── Modal nuevo comentario — portal para escapar el backdrop-filter ── */}
            {createPortal(
              <div
                className="modal fade"
                id="commentModal"
                tabIndex="-1"
                aria-labelledby="commentModalLabel"
                aria-hidden="true"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content modal-sci-fi">
                    <div className="modal-header modal-sci-fi-header">
                      <h5 className="modal-title modal-sci-fi-title" id="commentModalLabel">
                        Leave a comment
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      />
                    </div>

                    <div className="modal-body modal-sci-fi-body">
                      {/* Rating */}
                      <div className="mb-4">
                        <label className="label-sci-fi">Rating</label>
                        <div className="d-flex gap-2 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fa-star fa-xl ${(hoverRating || newComment.stars) >= star ? "fa-solid" : "fa-regular"}`}
                              style={{
                                cursor: "pointer",
                                color: (hoverRating || newComment.stars) >= star ? '#ffd700' : 'rgba(255,255,255,0.25)',
                                transition: 'color 0.15s'
                              }}
                              onClick={() => setNewComment((prev) => ({ ...prev, stars: star }))}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="mb-2">
                        <label htmlFor="newComment" className="label-sci-fi">Comment</label>
                        <textarea
                          id="newComment"
                          className="input-sci-fi"
                          rows="3"
                          style={{ resize: 'none', minHeight: '90px' }}
                          placeholder="Share your experience with this player..."
                          value={newComment.comment}
                          onChange={(e) => setNewComment((prev) => ({ ...prev, comment: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="modal-footer modal-sci-fi-footer">
                      <button
                        type="button"
                        className="btn-sci-fi-secondary pl-btn pl-btn--danger"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-sci-fi-primary pl-btn pl-btn--primary"
                        onClick={handleSaveComment}
                        disabled={!newComment.comment.trim() || newComment.stars === 0}
                      >
                        <i className="fa-solid fa-floppy-disk me-1" aria-hidden="true"></i>
                        Save comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Reviews list */}
            {store.matchReviewsReceived?.reviews_received?.length > 0 ? (
              <div className="comments-list">
                {store.matchReviewsReceived.reviews_received.map((el) => (
                  <div key={el.id} className="comment-card">
                    <div className="comment-header">
                      <span className="comment-author">
                        <i className="fa-solid fa-user me-2" aria-hidden="true"></i>
                        {el.author_nickname}
                      </span>
                      <span className="comment-stars">
                        {Array.from({ length: 5 }, (_, i) => (
                          <i
                            key={i}
                            className={`fa-${i < el.stars ? 'solid' : 'regular'} fa-star`}
                            style={{ color: i < el.stars ? '#ffd700' : 'rgba(255,255,255,0.2)' }}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="comment-stars-num">{el.stars}/5</span>
                      </span>
                    </div>
                    <p className="comment-text">
                      <i className="fa-solid fa-comment me-2" style={{ color: 'rgba(0,229,255,0.4)' }} aria-hidden="true"></i>
                      {el.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="comments-empty">
                <i className="fa-regular fa-comment-dots comments-empty-icon" aria-hidden="true"></i>
                <p>No comments yet.</p>
                <span>Be the first to leave a comment!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
