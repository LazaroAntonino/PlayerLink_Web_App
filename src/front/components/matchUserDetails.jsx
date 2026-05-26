// MatchUserDetails — vista del perfil de un match (read-only).
// Usa el mismo lenguaje visual que el Profile propio (.pinfo-*) pero sin
// permitir edición. La pestaña Comments tiene su propio modal en React portal
// (AddCommentModal) coherente con AddGameModal.

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
import { AddCommentModal } from "./profile/AddCommentModal.jsx";

// ── Helpers compartidos con ProfileInfoTab ──────────────────────────────────
const isEmpty = (v) =>
  v == null ||
  v === "" ||
  v === "no data" ||
  v === "undefined" ||
  v === "Undefined" ||
  v === "Undefinied" ||
  v === 0 ||
  v === "0" ||
  (typeof v === "string" && v.trim().length === 0);

const ReadValue = ({ value, placeholder = "Not set" }) =>
  isEmpty(value)
    ? <span className="pinfo-empty">{placeholder}</span>
    : <span className="pinfo-value">{value}</span>;

const parseListField = (raw) =>
  raw
    ? String(raw)
        .replace(/\.$/, "")
        .split(/, | and /)
        .map((s) => s.trim())
        .filter((s) => s && s !== "Undefined" && s !== "Undefinied" && s !== "no data")
    : [];

const ChipList = ({ items, accent = false }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="pinfo-chips">
      {items.map((item, i) => (
        <span key={i} className={`pinfo-chip${accent ? " pinfo-chip--accent" : ""}`}>
          {item}
        </span>
      ))}
    </div>
  );
};

export const MatchUserDetails = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("info");

  // Add Comment modal
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);

  // Block / Report
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
    .slice()
    .sort((a, b) => (b.gameHoursPlayed ?? 0) - (a.gameHoursPlayed ?? 0))
    .slice(0, 3);

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate("/");
      return;
    }
    userServices
      .getUserInfoById(id)
      .then((data) => dispatch({ type: "getItsMatchInfo", payload: data }))
      .catch((err) => console.error("Failed to load user info:", err));
    reviewServices
      .getAllReviewsReceived(id)
      .then((data) => dispatch({ type: "matchReviewsReceived", payload: data }));
  }, []);

  const profile = useMemo(() => {
    const p = store.itsMatchInfo?.profile ?? {};
    return {
      name: p.name,
      nickname: p.nick_name,
      age: p.age,
      gender: p.gender,
      location: p.location,
      zodiac: p.zodiac,
      discord: p.discord,
      steam: p.steam,
      languages: p.language,
      gamingPrefs: p.preferences,
      bio: p.bio,
      photo: p.photo,
    };
  }, [store.itsMatchInfo]);

  const preferencesItems = parseListField(profile.gamingPrefs);
  const languagesItems = parseListField(profile.languages);

  const selectMedal = (gamehours) => {
    const hours = parseInt(gamehours, 10);
    if (isNaN(hours)) return bronzeMedal;
    if (hours >= 2500) return goldMedal;
    if (hours >= 500) return silverMedal;
    return bronzeMedal;
  };

  // ── Block / Report handlers ─────────────────────────────────────────────
  const handleBlock = async () => {
    setBlockLoading(true);
    setBlockError("");
    try {
      await blockServices.blockUser(store.itsMatchInfo?.id);
      dispatch({ type: "addBlockedUserId", payload: store.itsMatchInfo?.id });
      navigate("/private/your-matches");
    } catch (err) {
      setBlockError(err.message || "Error blocking user");
      setBlockLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    setReportError("");
    try {
      await blockServices.reportUser(store.itsMatchInfo?.id, reportReason);
      setReportSuccess(true);
    } catch (err) {
      setReportError(err.message || "Error sending report");
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

  // ── Save comment ────────────────────────────────────────────────────────
  const handleSaveComment = async ({ stars, comment }) => {
    await reviewServices.postNewReview(store.user.id, store.itsMatchInfo.id, { stars, comment });
    setIsAddCommentOpen(false);
    const data = await reviewServices.getAllReviewsReceived(id);
    dispatch({ type: "matchReviewsReceived", payload: data });
  };

  return (
    <div className="profile-container">
      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="left-panel">
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

        {!isEmpty(profile.location) && (
          <p className="left-location">
            <i className="fa-solid fa-location-dot me-1" aria-hidden="true"></i>
            {profile.location}
          </p>
        )}

        {topThreeGames.length > 0 && (
          <>
            <div className="left-section-divider"><span>Top Games</span></div>
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
                    <img className="game-cover-img" src={el.gameImage} alt={`Cover of ${el.gameTitle}`} />
                  ) : (
                    <div className="game-cover-placeholder">
                      <i className="fa-solid fa-gamepad" aria-hidden="true"></i>
                    </div>
                  )}
                  <span className="medal-game-title" title={el.gameTitle}>{el.gameTitle}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Block / Report */}
        <div className="block-report-zone">
          <button
            className="btn-block-user"
            onClick={() => { setShowBlockModal(true); setBlockError(""); }}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" /> Block user
          </button>
          <button
            className="btn-report-user"
            onClick={() => { setShowReportModal(true); setReportError(""); setReportSuccess(false); }}
          >
            <i className="fa-solid fa-flag" aria-hidden="true" /> Report user
          </button>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="right-panel">
        <div className="tabs" role="tablist">
          {["info", "Games", "comments"].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── INFO TAB (read-only, mismas secciones que ProfileInfoTab) ── */}
        {activeTab === "info" && (
          <div className="info-section pinfo-root">

            <section className="pinfo-section">
              <header className="pinfo-section-head">
                <span className="pinfo-section-icon"><i className="fa-solid fa-feather" /></span>
                <h3 className="pinfo-section-title">About</h3>
              </header>
              <div className="pinfo-card pinfo-card--full">
                {isEmpty(profile.bio) ? (
                  <p className="pinfo-empty-block">
                    <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                    {profile.nickname || "This player"} hasn't written a bio yet.
                  </p>
                ) : (
                  <p className="pinfo-bio-text">{profile.bio}</p>
                )}
              </div>
            </section>

            <section className="pinfo-section">
              <header className="pinfo-section-head">
                <span className="pinfo-section-icon"><i className="fa-solid fa-id-card" /></span>
                <h3 className="pinfo-section-title">Personal</h3>
              </header>

              <div className="pinfo-grid pinfo-grid--2col">
                <div className="pinfo-card">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-signature" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Name</span>
                    <ReadValue value={profile.name} />
                  </div>
                </div>
                <div className="pinfo-card">
                  <div className="pinfo-card-icon pinfo-card-icon--accent"><i className="fa-solid fa-user-ninja" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Nickname</span>
                    <ReadValue value={profile.nickname} />
                  </div>
                </div>
              </div>

              <div className="pinfo-grid pinfo-grid--3col">
                <div className="pinfo-card">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-cake-candles" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Age</span>
                    <ReadValue value={profile.age > 0 ? `${profile.age} years` : null} placeholder="—" />
                  </div>
                </div>
                <div className="pinfo-card">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-venus-mars" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Gender</span>
                    <ReadValue value={profile.gender} placeholder="—" />
                  </div>
                </div>
                <div className="pinfo-card">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-star-and-crescent" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Zodiac</span>
                    <ReadValue value={profile.zodiac} placeholder="—" />
                  </div>
                </div>
              </div>
            </section>

            <section className="pinfo-section">
              <header className="pinfo-section-head">
                <span className="pinfo-section-icon"><i className="fa-solid fa-earth-americas" /></span>
                <h3 className="pinfo-section-title">Where & Language</h3>
              </header>

              <div className="pinfo-grid pinfo-grid--2col">
                <div className="pinfo-card">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-location-dot" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Location</span>
                    <ReadValue value={profile.location} />
                  </div>
                </div>
                <div className="pinfo-card pinfo-card--col">
                  <div className="pinfo-card-row">
                    <div className="pinfo-card-icon pinfo-card-icon--accent"><i className="fa-solid fa-language" /></div>
                    <div className="pinfo-card-content">
                      <span className="pinfo-card-label">Languages</span>
                    </div>
                  </div>
                  {languagesItems.length > 0
                    ? <ChipList items={languagesItems} accent />
                    : <span className="pinfo-empty">Not set</span>}
                </div>
              </div>
            </section>

            <section className="pinfo-section">
              <header className="pinfo-section-head">
                <span className="pinfo-section-icon"><i className="fa-solid fa-gamepad" /></span>
                <h3 className="pinfo-section-title">Gaming style</h3>
              </header>

              <div className="pinfo-card pinfo-card--col">
                <div className="pinfo-card-row">
                  <div className="pinfo-card-icon"><i className="fa-solid fa-tags" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Preferences</span>
                  </div>
                </div>
                {preferencesItems.length > 0
                  ? <ChipList items={preferencesItems} />
                  : <span className="pinfo-empty">Not set</span>}
              </div>
            </section>

            <section className="pinfo-section">
              <header className="pinfo-section-head">
                <span className="pinfo-section-icon"><i className="fa-solid fa-link" /></span>
                <h3 className="pinfo-section-title">Connect</h3>
                <span className="pinfo-section-hint">
                  <i className="fa-solid fa-handshake me-1" aria-hidden="true" />
                  Reach out to play together
                </span>
              </header>

              <div className="pinfo-grid pinfo-grid--2col">
                <div className="pinfo-card">
                  <div className="pinfo-card-icon pinfo-card-icon--discord"><i className="fa-brands fa-discord" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Discord</span>
                    <ReadValue value={profile.discord} />
                  </div>
                </div>
                <div className="pinfo-card">
                  <div className="pinfo-card-icon pinfo-card-icon--steam"><i className="fa-brands fa-steam" /></div>
                  <div className="pinfo-card-content">
                    <span className="pinfo-card-label">Steam Friend ID</span>
                    <ReadValue value={profile.steam} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── GAMES TAB (read-only) ── */}
        {activeTab === "Games" && (
          <div className="info-section">
            <div className="comments-header-row">
              <h3 className="comments-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                Games{" "}
                <span className="tooltip-wrapper">
                  <i className="fa-solid fa-circle-info fa-2xs medals-info-icon" aria-hidden="true"></i>
                  <span className="tooltip-text medal-info-tooltip-text">
                    <strong>Medal Info:</strong>
                    <div><i className="fa-solid fa-medal medal-info-gold" aria-hidden="true"></i> +2500 hours</div>
                    <div><i className="fa-solid fa-medal medal-info-silver" aria-hidden="true"></i> +500 hours</div>
                    <div><i className="fa-solid fa-medal medal-info-bronze" aria-hidden="true"></i> 0-500 hours</div>
                  </span>
                </span>
              </h3>
            </div>

            <div className="mt-3">
              {allGames.length > 0 ? (
                allGames.map((el, i) => (
                  <div key={el.id ?? i} className="game-row">
                    {el.gameImage ? (
                      <img src={el.gameImage} alt={el.gameTitle} className="game-row-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="game-cover-placeholder"
                      style={{ display: el.gameImage ? "none" : "flex", width: "64px", height: "38px", borderRadius: "7px", flexShrink: 0 }}
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
                      <img
                        src={selectMedal(el.gameHoursPlayed)}
                        alt="Medal"
                        className="medal-icon"
                        style={{ width: 28, height: 28 }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="comments-empty" style={{ padding: '40px 16px' }}>
                  <i className="fa-solid fa-gamepad comments-empty-icon" aria-hidden="true" />
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.62)' }}>No games yet</span>
                  <span>{profile.nickname || "This player"} hasn't added games.</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── COMMENTS TAB ── */}
        {activeTab === "comments" && (
          <div className="info-section">
            <div className="comments-header-row">
              <h3 className="comments-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                Comments
              </h3>
              <button
                type="button"
                className="botonLeaveComment"
                onClick={() => setIsAddCommentOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" aria-hidden="true" />
                Leave a comment
              </button>
            </div>

            <AddCommentModal
              isOpen={isAddCommentOpen}
              onClose={() => setIsAddCommentOpen(false)}
              onSubmit={handleSaveComment}
              targetNickname={profile.nickname}
            />

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
                            className={`fa-${i < el.stars ? "solid" : "regular"} fa-star`}
                            style={{ color: i < el.stars ? "#ffd700" : "rgba(255,255,255,0.2)" }}
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

      {/* ══ MODAL: Confirmar bloqueo ══════════════════════════════════════════ */}
      {createPortal(
        <div
          className={`modal fade ${showBlockModal ? "show d-block" : ""}`}
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
          style={{ backgroundColor: showBlockModal ? "rgba(0,0,0,0.6)" : "transparent" }}
          onClick={(e) => { if (e.target === e.currentTarget && !blockLoading) setShowBlockModal(false); }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-sci-fi">
              <div className="modal-header modal-sci-fi-header">
                <h5 className="modal-title modal-sci-fi-title">
                  <i className="fa-solid fa-ban me-2" style={{ color: "#ff4d6d" }} aria-hidden="true" />
                  Block user
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBlockModal(false)}
                  aria-label="Close"
                  disabled={blockLoading}
                />
              </div>
              <div className="modal-body modal-sci-fi-body">
                <div className="block-modal-warning">
                  <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                  <span>
                    Block <strong>{profile.nickname}</strong>? This will remove the match and
                    all messages between you. {profile.nickname} will no longer appear in your
                    search, and you won't appear in theirs.
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
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-sci-fi-primary pl-btn pl-btn--danger"
                  onClick={handleBlock}
                  disabled={blockLoading}
                >
                  {blockLoading
                    ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true" />Blocking…</>
                    : <><i className="fa-solid fa-ban me-1" aria-hidden="true" />Block</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══ MODAL: Denuncia ══════════════════════════════════════════ */}
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
                  Report user
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseReportModal}
                  aria-label="Close"
                  disabled={reportLoading}
                />
              </div>
              <div className="modal-body modal-sci-fi-body">
                {reportSuccess ? (
                  <div className="report-success-msg">
                    <i className="fa-solid fa-circle-check" aria-hidden="true" />
                    <p>Your report has been submitted. Our team will review it shortly.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="label-sci-fi mb-2 d-block">Reason for report</label>
                      <select
                        className="report-reason-select"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        disabled={reportLoading}
                      >
                        <option value="">Select a reason…</option>
                        <option value="Inappropriate behaviour">Inappropriate behaviour</option>
                        <option value="Harassment or intimidation">Harassment or intimidation</option>
                        <option value="Spam or advertising">Spam or advertising</option>
                        <option value="Offensive profile content">Offensive profile content</option>
                        <option value="Identity impersonation">Identity impersonation</option>
                        <option value="Other">Other</option>
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
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-sci-fi-secondary pl-btn pl-btn--accent"
                      onClick={handleCloseReportModal}
                      disabled={reportLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-sci-fi-primary pl-btn pl-btn--primary"
                      onClick={handleReport}
                      disabled={reportLoading || !reportReason.trim()}
                    >
                      {reportLoading
                        ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true" />Sending…</>
                        : <><i className="fa-solid fa-paper-plane me-1" aria-hidden="true" />Send report</>
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
    </div>
  );
};
