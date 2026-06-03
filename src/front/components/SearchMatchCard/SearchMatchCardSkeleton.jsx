// Skeleton loader — espeja la estructura fija de SearchMatchCard:
// hero (con zona bio shimmer) · 3 secciones (games, style, languages) · actions.
import './SearchMatchCard.css';

export const SearchMatchCardSkeleton = () => {
  return (
    <div className="smc-stage">
      <div className="smc-card skeleton" aria-busy="true" aria-label="Loading profile...">
        <span className="smc-corner smc-corner--tl" aria-hidden="true" />
        <span className="smc-corner smc-corner--tr" aria-hidden="true" />
        <span className="smc-corner smc-corner--bl" aria-hidden="true" />
        <span className="smc-corner smc-corner--br" aria-hidden="true" />

        {/* ── Hero shimmer — incluye zona bio para que el tamaño coincida
             siempre con la card real cuando el perfil tenga bio.
             smc-hero--with-bio aplica el mismo flex-basis que la card real. ── */}
        <div className="smc-hero smc-hero--with-bio">
          <div className="smc-sk-hero smc-shimmer" />
          <div className="smc-hero-shade" aria-hidden="true" />
          <div className="smc-hero-content">
            <div className="smc-hero-row">
              <div className="smc-sk-line smc-sk-line--title smc-shimmer" />
              <div className="smc-sk-line smc-sk-line--xs smc-shimmer" style={{ width: '60px' }} />
            </div>
            {/* Location */}
            <div className="smc-sk-line smc-sk-line--sub smc-shimmer" />
            {/* Bio shimmer — mirrors .smc-bio: 2 lines, same typography dimensions */}
            <div className="smc-sk-bio" aria-hidden="true">
              <div className="smc-sk-line smc-sk-line--bio smc-shimmer" style={{ width: '90%' }} />
              <div className="smc-sk-line smc-sk-line--bio smc-shimmer" style={{ width: '68%' }} />
            </div>
          </div>
        </div>

        {/* ── Body shimmer — 3 secciones idénticas a la card real ── */}
        <div className="smc-body">

          {/* 1. Top games */}
          <section className="smc-section smc-section--games">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" style={{ width: '55px' }} />
            <div className="smc-sk-game smc-shimmer" />
            <div className="smc-sk-game smc-shimmer" style={{ width: '88%' }} />
            <div className="smc-sk-game smc-shimmer" style={{ width: '76%' }} />
          </section>

          {/* 2. Style */}
          <section className="smc-section">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" style={{ width: '38px' }} />
            <div className="smc-meta-list">
              <div className="smc-sk-chip smc-shimmer" />
              <div className="smc-sk-chip smc-shimmer" style={{ width: '48px' }} />
              <div className="smc-sk-chip smc-shimmer" style={{ width: '72px' }} />
            </div>
          </section>

          {/* 3. Languages */}
          <section className="smc-section">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" style={{ width: '62px' }} />
            <div className="smc-meta-list">
              <div className="smc-sk-chip smc-shimmer" style={{ width: '56px' }} />
              <div className="smc-sk-chip smc-shimmer" />
            </div>
          </section>
        </div>

        {/* ── Actions shimmer ── */}
        <footer className="smc-actions">
          <div className="smc-sk-btn smc-shimmer" />
          <div className="smc-sk-btn smc-shimmer" />
        </footer>
      </div>
    </div>
  );
};