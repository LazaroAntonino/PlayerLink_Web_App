import './SearchMatchCard.css';
import { useEffect, useState, useRef, useCallback, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import searchMatchServices from '../../services/searchMatchServices';
import { resolvePhoto } from '../../assets/photoAssets.js';

const SWIPE_THRESHOLD = 80;
const EXIT_ANIMATION_MS = 380;

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
  // WHY: track exit timer so it can be cleared if component unmounts before it fires
  const exitTimerRef = useRef(null);
  // WHY: stable ref to trigger functions so onDragEnd can be memoized without circular deps
  const triggerLikeRef = useRef(null);
  const triggerDislikeRef = useRef(null);

  // WHY: useId generates a unique, stable, per-instance prefix — prevents aria-labelledby ID
  //      collisions when two cards coexist in the DOM during swipe exit animations
  const uid = useId();
  const labelGames = `${uid}-games`;
  const labelStyle = `${uid}-style`;
  const labelLanguages = `${uid}-languages`;

  const photo = useMemo(() => resolvePhoto(profile?.photo), [profile?.photo]);

  // WHY: clean up any in-flight exit timer to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!profile?.user_id) return;
    let cancelled = false;
    (async () => {
      try {
        const average = await searchMatchServices.getStarsByUser(profile.user_id);
        // WHY: Number(null) === 0, but Number("bad") === NaN — guard so stars never render corrupted
        if (!cancelled) setAvgStars(Number(average) || 0);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.user_id]);

  // ── Drag handlers — useCallback prevents 9 new function allocations per drag re-render ──
  const onDragStart = useCallback((clientX) => {
    dragRef.current = { active: true, startX: clientX, currentX: clientX };
  }, []);

  const onDragMove = useCallback((clientX) => {
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
  }, []);

  const onDragEnd = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = dragRef.current.currentX - dragRef.current.startX;
    setSwipeHint(null);

    if (delta > SWIPE_THRESHOLD) {
      // WHY: clear inline styles immediately so CSS exit animation class takes full control
      if (cardRef.current) { cardRef.current.style.transform = ''; cardRef.current.style.transition = ''; }
      triggerLikeRef.current?.();
    } else if (delta < -SWIPE_THRESHOLD) {
      if (cardRef.current) { cardRef.current.style.transform = ''; cardRef.current.style.transition = ''; }
      triggerDislikeRef.current?.();
    } else {
      // WHY: spring-back transition on aborted drag — snapping instantly feels broken on mobile
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)';
        cardRef.current.style.transform = '';
        cardRef.current.addEventListener('transitionend', () => {
          if (cardRef.current) cardRef.current.style.transition = '';
        }, { once: true });
      }
    }
  }, []);

  // WHY: stable wrappers for synthetic event handlers — no new allocation on drag re-renders
  // handleMouseUp/Leave delegate directly to the stable onDragEnd — no wrapper needed
  const handleMouseDown = useCallback((e) => onDragStart(e.clientX), [onDragStart]);
  const handleMouseMove = useCallback((e) => { if (dragRef.current.active) onDragMove(e.clientX); }, [onDragMove]);
  const handleTouchStart = useCallback((e) => onDragStart(e.touches[0].clientX), [onDragStart]);

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

  // ── Like / Dislike ──────────────────────────────────────────────────────────
  const triggerLike = useCallback(() => {
    setAnimationClass('exiting-right');
    const likeBtn = cardRef.current?.querySelector('.smc-btn-like');
    if (likeBtn) {
      likeBtn.classList.add('pulsing');
      likeBtn.addEventListener('animationend', () => likeBtn.classList.remove('pulsing'), { once: true });
    }
    // WHY: store ref so cleanup effect can cancel if component unmounts before 380ms
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => { setAnimationClass(''); onLike(); }, EXIT_ANIMATION_MS);
  }, [onLike]);

  const triggerDislike = useCallback(() => {
    setAnimationClass('exiting-left');
    // WHY: same leak guard as triggerLike
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => { setAnimationClass(''); onDislike(); }, EXIT_ANIMATION_MS);
  }, [onDislike]);

  // WHY: keep refs in sync so the memoized onDragEnd always calls the latest trigger version
  triggerLikeRef.current = triggerLike;
  triggerDislikeRef.current = triggerDislike;

  // ── Formatting — memoized to avoid regex + sort on every drag re-render ──────
  const parseList = useCallback((raw) =>
    raw
      ? raw.replace(/\band\b/g, ',').replace(/\.+$/, '').split(',')
        .map(s => s.trim()).filter(Boolean)
      : []
    , []);

  const preferences = useMemo(() => parseList(profile?.preferences), [parseList, profile?.preferences]);
  const languages = useMemo(() => parseList(profile?.language), [parseList, profile?.language]);

  const topGames = useMemo(() =>
    profile?.games?.length
      // WHY: filter out 0-hour entries — they are bad data and produce "0h" visual clutter
      ? [...profile.games].filter(g => (g.gameHoursPlayed || 0) > 0)
        .sort((a, b) => b.gameHoursPlayed - a.gameHoursPlayed).slice(0, 3)
      : []
    , [profile?.games]);

  const maxHours = useMemo(() =>
    topGames.length > 0
      ? Math.max(...topGames.map(g => g.gameHoursPlayed || 0), 1)
      : 1
    , [topGames]);

  const bio = useMemo(() => profile?.bio?.trim() || '', [profile?.bio]);
  // WHY: computed once here — used in both the aria-label string and the icon loop
  const roundedStars = Math.round(avgStars);

  return (
    <div className="smc-stage">
      <div
        ref={cardRef}
        // WHY: no trailing space when animationClass is '' — avoids DOM noise
        className={`smc-card${animationClass ? ` ${animationClass}` : ''}`}
        role="article"
        aria-label={`Player profile: ${profile?.nick_name || 'Unknown'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        // WHY: onDragEnd is already stable (useCallback []) — no wrapper needed
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={handleTouchStart}
        // WHY: same — onDragEnd's internal guard handles the not-active case
        onTouchEnd={onDragEnd}
      >
        {/* Corner brackets decorativos */}
        <span className="smc-corner smc-corner--tl" aria-hidden="true" />
        <span className="smc-corner smc-corner--tr" aria-hidden="true" />
        <span className="smc-corner smc-corner--bl" aria-hidden="true" />
        <span className="smc-corner smc-corner--br" aria-hidden="true" />

        {/* Swipe stamps — aria-hidden: visual-only affordance, no AT value */}
        <div className={`smc-stamp smc-stamp--like${swipeHint === 'like' ? ' visible' : ''}`} aria-hidden="true">
          <i className="fa-solid fa-heart smc-stamp-icon" />LIKE
        </div>
        <div className={`smc-stamp smc-stamp--pass${swipeHint === 'dislike' ? ' visible' : ''}`} aria-hidden="true">
          NOPE<i className="fa-solid fa-xmark smc-stamp-icon smc-stamp-icon--right" />
        </div>

        {/* ── HERO ───────────────────────────────────────────────────────────
             La bio vive aquí dentro, en el overlay del hero.
             El hero tiene min-height fija y crece con la bio gracias a
             flex-shrink:0 + height:auto cuando hay bio.
             overflow:hidden del hero corta cualquier exceso sin scroll.
        ─────────────────────────────────────────────────────────────────── */}
        <div className={`smc-hero${bio ? ' smc-hero--with-bio' : ''}`}>
          <img
            src={photo}
            // WHY: hero image is decorative — the card's aria-label already identifies the player
            alt=""
            className="smc-hero-img"
            draggable={false}
            // WHY: defer decode off the main thread; prevents blocking first paint on large images
            loading="lazy"
            decoding="async"
          />
          <div className="smc-hero-shade" aria-hidden="true" />
          <div className="smc-hero-content">
            <div className="smc-hero-row">
              {/* WHY: title tooltip is inaccessible on touch and redundant when text is visible */}
              <h2 className="smc-name">
                {profile?.nick_name || 'Unknown'}
              </h2>
              {/* WHY: role="img" required — without it aria-label is ignored on a <div> by most screen readers */}
              <div
                className="smc-stars"
                role="img"
                aria-label={roundedStars > 0 ? `${roundedStars} of 5 stars` : 'Not yet rated'}
              >
                {[...Array(5)].map((_, i) => (
                  // WHY: aria-hidden — the parent role="img" owns the label; individual icons produce noise
                  <i
                    key={i}
                    aria-hidden="true"
                    className={`fa-star smc-star ${i < roundedStars ? 'fa-solid' : 'fa-regular'}`}
                  />
                ))}
              </div>
            </div>

            <div className="smc-location">
              <i className="fa-solid fa-location-dot smc-loc-icon" aria-hidden="true" />
              <span className="smc-loc-text">
                {profile?.location || 'Location not set'}
              </span>
            </div>

            {/* Bio — solo si existe. Clamp hard por CSS, overflow:hidden del
                hero se encarga del resto. Nunca empuja el body. */}
            {bio && (
              <p className="smc-bio">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────────
             flex:1 absorbe todo el espacio restante tras hero + actions.
             Nunca cambia de tamaño por la bio (que está en el hero).
        ─────────────────────────────────────────────────────────────────── */}
        <div className="smc-body">

          {/* 1. Top games */}
          <section className="smc-section smc-section--games" aria-labelledby={labelGames}>
            <header className="smc-section-head">
              <i className="fa-solid fa-gamepad smc-section-icon" aria-hidden="true" />
              <span className="smc-section-label" id={labelGames}>Top games</span>
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

          {/* 2. Style */}
          <section className="smc-section" aria-labelledby={labelStyle}>
            <header className="smc-section-head">
              <i className="fa-solid fa-tags smc-section-icon smc-section-icon--pref" aria-hidden="true" />
              <span className="smc-section-label" id={labelStyle}>Style</span>
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
          <section className="smc-section" aria-labelledby={labelLanguages}>
            <header className="smc-section-head">
              <i className="fa-solid fa-language smc-section-icon smc-section-icon--lang" aria-hidden="true" />
              <span className="smc-section-label" id={labelLanguages}>Languages</span>
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

        {/* ── ACCIONES ─────────────────────────────────────────────────────── */}
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

// WHY: PropTypes catch wrong-shaped data in development before it silently corrupts the UI
SearchMatchCard.propTypes = {
  profile: PropTypes.shape({
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nick_name: PropTypes.string,
    photo: PropTypes.string,
    bio: PropTypes.string,
    location: PropTypes.string,
    preferences: PropTypes.string,
    language: PropTypes.string,
    games: PropTypes.arrayOf(PropTypes.shape({
      gameTitle: PropTypes.string,
      gameHoursPlayed: PropTypes.number,
    })),
  }),
  onLike: PropTypes.func.isRequired,
  onDislike: PropTypes.func.isRequired,
};