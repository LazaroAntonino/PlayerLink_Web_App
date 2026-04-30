// SearchMatchCardSkeleton.jsx
// Skeleton loader que imita exactamente la estructura visual de SearchMatchCard.
// Usa shimmer CSS puro (sin librerías) para evitar el layout shift durante la carga.

export const SearchMatchCardSkeleton = () => {
    return (
        <div className="d-flex justify-content-center">
            <div className="col">
                <div className="card search-match-card skeleton-card" aria-busy="true" aria-label="Loading profile...">

                    {/* Avatar placeholder */}
                    <div className="d-flex justify-content-center mt-3">
                        <div className="skeleton-avatar skeleton-shimmer" />
                    </div>

                    {/* Nickname placeholder */}
                    <div className="d-flex justify-content-center mt-3">
                        <div className="skeleton-line skeleton-line--title skeleton-shimmer" />
                    </div>

                    {/* Stars row placeholder */}
                    <div className="d-flex justify-content-center gap-2 mt-4 mb-5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton-star skeleton-shimmer" />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="skeleton-divider" />

                    {/* Games rows */}
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="row align-items-center mb-3 px-3">
                            <div className="col">
                                <div className="skeleton-line skeleton-shimmer" />
                            </div>
                            <div className="col text-end">
                                <div className="skeleton-line skeleton-line--short skeleton-shimmer" />
                            </div>
                        </div>
                    ))}

                    <div className="skeleton-divider" />

                    {/* Preferences row */}
                    <div className="d-flex ms-4 mt-2 mb-2">
                        <div className="skeleton-line skeleton-line--medium skeleton-shimmer" />
                    </div>

                    <div className="skeleton-divider" />

                    {/* Language row */}
                    <div className="d-flex justify-content-center mt-2 mb-2">
                        <div className="skeleton-line skeleton-line--short skeleton-shimmer" />
                    </div>

                    <div className="skeleton-divider" />

                    {/* Location row */}
                    <div className="d-flex justify-content-center mt-2 mb-2">
                        <div className="skeleton-line skeleton-line--medium skeleton-shimmer" />
                    </div>

                    <div className="skeleton-divider" style={{ width: '75%' }} />

                    {/* Action buttons placeholder */}
                    <div className="row mt-3 d-flex justify-content-center gap-3 pb-2">
                        <div className="skeleton-btn skeleton-shimmer" />
                        <div className="skeleton-btn skeleton-shimmer" />
                    </div>

                </div>
            </div>
        </div>
    );
};
