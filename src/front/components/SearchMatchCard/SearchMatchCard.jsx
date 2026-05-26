import './SearchMatchCard.css';
import { useEffect, useState, useRef } from 'react';
import searchMatchServices from '../../services/searchMatchServices';
import { resolvePhoto } from '../../assets/photoAssets.js';

const SWIPE_THRESHOLD = 80;
const EXIT_ANIMATION_MS = 380;

// Formatea horas para que no rompan el layout con valores grandes:
//   42 → "42h", 1234 → "1.2k h", 50000 → "50k h"
const formatHours = (h) => {
  const n = Number(h) || 0;
  if (n < 1000) return `${n}h`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k h`;
  return `${Math.round(n / 1000)}k h`;
};

export const SearchMatchCard = ({ profile, onLike, onDislike }) => {
  const [animationClass, setAnimationClass] = useState('');
  const [swipeHint, setSwipeHint] = useState(null);
  const [avgStars, setAvgStars] = useState(0);

  const dragRef = useRef({ active: false, startX: 0, currentX: 0 });
  const cardRef = useRef(null);

  const photo = resolvePhoto(profile?.photo);

  useEffect(() => {
    if (!profile?.user_id) return;
    let cancelled = false;
    (async () => {
      try {
        const average = await searchMatchServices.getStarsByUser(profile.user_id);
        if (!cancelled) setAvgStars(Number(average));
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.user_id]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDragStart = (clientX) => {
    dragRef.current = { active: true, startX: clientX, currentX: clientX };
  };

  const onDragMove = (clientX) => {
    if (!dragRef.current.active) return;
    const delta = clientX - dragRef.current.startX;
    dragRef.current.currentX = clientX;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${delta}px) rotate(${delta * 0.06}deg)`;
      cardRef.current.style.transition = 'none';
    }
    if (delta > 40) setSwipeHint('like');
    else if (delta < -40) setSwipeHint('dislike');
    else setSwipeHint(null);
  };

  const onDragEnd = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = dragRef.current.currentX - dragRef.current.startX;
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.transition = '';
    }
    setSwipeHint(null);
    if (delta > SWIPE_THRESHOLD) triggerLike();
    else if (delta < -SWIPE_THRESHOLD) triggerDislike();
  };

  const handleMouseDown = (e) => onDragStart(e.clientX);
  const handleMouseMove = (e) => { if (dragRef.current.active) onDragMove(e.clientX); };
  const handleMouseUp = () => onDragEnd();
  const handleMouseLeave = () => { if (dragRef.current.active) onDragEnd(); };
  const handleTouchStart = (e) => onDragStart(e.touches[0].clientX);
  const handleTouchEnd = () => onDragEnd();

  // Non-passive native touchmove — permite preventDefault para evitar scroll de página
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const onTouchMoveNative = (e) => {
      if (!dragRef.current.active) return;
      e.preventDefault();
      onDragMove(e.touches[0].clientX);
    };
    card.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    return () => card.removeEventListener('touchmove', onTouchMoveNative);
  }, []);

  // ── Like / Dislike triggers ───────────────────────────────────────────────
  const triggerLike = () => {
    setAnimationClass('exiting-right');
    const likeBtn = cardRef.current?.querySelector('.smc-btn-like');
    if (likeBtn) {
      likeBtn.classList.add('pulsing');
      likeBtn.addEventListener('animationend', () => likeBtn.classList.remove('pulsing'), { once: true });
    }
    setTimeout(() => { setAnimationClass(''); onLike(); }, EXIT_ANIMATION_MS);
  };

  const triggerDislike = () => {
    setAnimationClass('exiting-left');
    setTimeout(() => { setAnimationClass(''); onDislike(); }, EXIT_ANIMATION_MS);
  };

  // ── Formatting ────────────────────────────────────────────────────────────
  const parseList = (raw) =>
    raw
      ? raw.replace(/\band\b/g, ',').replace(/\.+$/, '').split(',')
        .map(s => s.trim()).filter(Boolean)
      : [];

  const preferences = parseList(profile?.preferences);
  const languages = parseList(profile?.language);

  const topGames = profile?.games?.length
    ? [...profile.games].sort((a, b) => b.gameHoursPlayed - a.gameHoursPlayed).slice(0, 3)
    : [];

  // Horas máximas para escalar las barras (evita división por 0)
  const maxHours = topGames.length > 0
    ? Math.max(...topGames.map(g => g.gameHoursPlayed || 0), 1)
    : 1;

  return (
    <div className="smc-stage">
      <div
        ref={cardRef}
        className={`smc-card ${animationClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Corner brackets decorativos */}
        <span className="smc-corner smc-corner--tl" aria-hidden="true" />
        <span className="smc-corner smc-corner--tr" aria-hidden="true" />
        <span className="smc-corner smc-corner--bl" aria-hidden="true" />
        <span className="smc-corner smc-corner--br" aria-hidden="true" />

        {/* Swipe stamps */}
        <div className={`smc-stamp smc-stamp--like${swipeHint === 'like' ? ' visible' : ''}`}>
          <i className="fa-solid fa-heart me-2" />LIKE
        </div>
        <div className={`smc-stamp smc-stamp--pass${swipeHint === 'dislike' ? ' visible' : ''}`}>
          NOPE<i className="fa-solid fa-xmark ms-2" />
        </div>

        {/* ── HERO: foto + overlay con identidad ─────────────────────────── */}
        <div className="smc-hero">
          <img
            src={photo}
            alt={profile?.nick_name || 'Avatar'}
            className="smc-hero-img"
            draggable={false}
          />
          <div className="smc-hero-shade" aria-hidden="true" />
          <div className="smc-hero-content">
            <div className="smc-hero-row">
              <h2 className="smc-name" title={profile?.nick_name}>
                {profile?.nick_name || 'Unknown'}
              </h2>
              <div className="smc-stars" aria-label={`${Math.round(avgStars)} of 5 stars`}>
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fa-star smc-star ${i < Math.round(avgStars) ? 'fa-solid' : 'fa-regular'}`}
                  />
                ))}
              </div>
            </div>
            {/* Ubicación — siempre se renderiza para que el hero mantenga la
                misma altura entre perfiles. Si no hay location, placeholder. */}
            <div className="smc-location">
              <i className="fa-solid fa-location-dot smc-loc-icon" aria-hidden="true" />
              <span className="smc-loc-text">
                {profile?.location || "Location not set"}
              </span>
            </div>
          </div>
        </div>

        {/* ── BODY: SIEMPRE 3 secciones (games / platforms / languages) con
             empty state cuando falten datos. Layout idéntico para todos los
             perfiles — la información ya no se reorganiza según contenido. ── */}
        <div className="smc-body">

          {/* 1. Top games */}
          <section className="smc-section smc-section--games">
            <header className="smc-section-head">
              <i className="fa-solid fa-gamepad smc-section-icon" aria-hidden="true" />
              <span className="smc-section-label">Top games</span>
            </header>
            {topGames.length > 0 ? (
              <ul className="smc-games">
                {topGames.map((g, i) => {
                  const pct = Math.max(8, ((g.gameHoursPlayed || 0) / maxHours) * 100);
                  return (
                    <li className="smc-game" key={i}>
                      <span className="smc-game-title">{g.gameTitle}</span>
                      <span className="smc-game-bar">
                        <span
                          className="smc-game-bar-fill"
                          style={{ width: `${pct}%` }}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="smc-game-hours">{formatHours(g.gameHoursPlayed)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="smc-empty-line">No games registered yet</p>
            )}
          </section>

          {/* 2. Style (mix de plataformas + play style + vibes — el campo
               `preferences` del backend es un CSV mixto, así que el label
               "Style" es más fiel a la realidad que "Platforms"). */}
          <section className="smc-section">
            <header className="smc-section-head">
              <i className="fa-solid fa-tags smc-section-icon smc-section-icon--pref" aria-hidden="true" />
              <span className="smc-section-label">Style</span>
            </header>
            {preferences.length > 0 ? (
              <div className="smc-meta-list">
                {preferences.map((p, i) => (
                  <span key={i} className="smc-meta-chip smc-meta-chip--pref">{p}</span>
                ))}
              </div>
            ) : (
              <p className="smc-empty-line">Not set</p>
            )}
          </section>

          {/* 3. Languages */}
          <section className="smc-section">
            <header className="smc-section-head">
              <i className="fa-solid fa-language smc-section-icon smc-section-icon--lang" aria-hidden="true" />
              <span className="smc-section-label">Languages</span>
            </header>
            {languages.length > 0 ? (
              <div className="smc-meta-list">
                {languages.map((l, i) => (
                  <span key={i} className="smc-meta-chip smc-meta-chip--lang">{l}</span>
                ))}
              </div>
            ) : (
              <p className="smc-empty-line">Not set</p>
            )}
          </section>
        </div>

        {/* ── ACCIONES ────────────────────────────────────────────────────── */}
        <footer className="smc-actions">
          <button
            type="button"
            className="smc-btn smc-btn-dislike"
            onClick={triggerDislike}
            aria-label="Dislike profile"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <button
            type="button"
            className="smc-btn smc-btn-like"
            onClick={triggerLike}
            aria-label="Like profile"
          >
            <i className="fa-solid fa-heart" />
          </button>
        </footer>
      </div>
    </div>
  );
};
