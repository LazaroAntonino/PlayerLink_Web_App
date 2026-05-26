// Skeleton loader — espeja la estructura fija de la SearchMatchCard:
// hero photo + 3 secciones (games, platforms, languages) + actions.
import './SearchMatchCard.css';

export const SearchMatchCardSkeleton = () => {
  return (
    <div className="smc-stage">
      <div className="smc-card skeleton" aria-busy="true" aria-label="Loading profile...">
        <span className="smc-corner smc-corner--tl" aria-hidden="true" />
        <span className="smc-corner smc-corner--tr" aria-hidden="true" />
        <span className="smc-corner smc-corner--bl" aria-hidden="true" />
        <span className="smc-corner smc-corner--br" aria-hidden="true" />

        {/* Hero shimmer */}
        <div className="smc-hero">
          <div className="smc-sk-hero smc-shimmer" />
          <div className="smc-hero-shade" aria-hidden="true" />
          <div className="smc-hero-content">
            <div className="smc-hero-row">
              <div className="smc-sk-line smc-sk-line--title smc-shimmer" />
              <div className="smc-sk-line smc-sk-line--xs smc-shimmer" />
            </div>
            <div className="smc-sk-line smc-sk-line--sub smc-shimmer" />
          </div>
        </div>

        {/* Body shimmer — 3 secciones idénticas a la card real */}
        <div className="smc-body">
          <section className="smc-section smc-section--games">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" />
            <div className="smc-sk-game smc-shimmer" />
            <div className="smc-sk-game smc-shimmer" />
            <div className="smc-sk-game smc-shimmer" />
          </section>

          <section className="smc-section">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" />
            <div className="smc-meta-list">
              <div className="smc-sk-chip smc-shimmer" />
              <div className="smc-sk-chip smc-shimmer" style={{ width: '48px' }} />
              <div className="smc-sk-chip smc-shimmer" style={{ width: '70px' }} />
            </div>
          </section>

          <section className="smc-section">
            <div className="smc-sk-line smc-sk-line--xs smc-shimmer" />
            <div className="smc-meta-list">
              <div className="smc-sk-chip smc-shimmer" style={{ width: '56px' }} />
              <div className="smc-sk-chip smc-shimmer" />
            </div>
          </section>
        </div>

        {/* Actions shimmer */}
        <footer className="smc-actions">
          <div className="smc-sk-btn smc-shimmer" />
          <div className="smc-sk-btn smc-shimmer" />
        </footer>
      </div>
    </div>
  );
};
