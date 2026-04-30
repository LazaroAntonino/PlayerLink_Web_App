import "../../pages/Privateviews/Search-mate.css";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchMatchCard } from "../../components/SearchMatchCard/SearchMatchCard";
import { SearchMatchCardSkeleton } from "../../components/SearchMatchCard/SearchMatchCardSkeleton";
import { SearchMateEmptyState } from "../../components/SearchMatchCard/SearchMateEmptyState";
import { FilterPanel } from "../../components/explore/FilterPanel";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import searchMatchServices from "../../services/searchMatchServices";
import { ItsMatch } from "../../components/ItsMatch/ItsMatch";

// ── Helpers de persistencia ──────────────────────────────────────────────────
const LS_KEY = "playerlink_explore_filters";

const readStoredFilters = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const countActiveFilters = (f) =>
  Object.values(f).filter(v => v !== "" && v !== null && v !== undefined).length;

export const SearchMate = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(() => {
    // Prioridad: URL params → localStorage → {}
    const fromUrl = Object.fromEntries(searchParams.entries());
    if (Object.keys(fromUrl).length > 0) return fromUrl;
    return readStoredFilters();
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters);

  // ── Modal ItsMatch ────────────────────────────────────────────────────────
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);
  const [matchId, setMatchId] = useState(null);  // para navegar al chat

  // ── Animación de swipe ───────────────────────────────────────────────────
  const [isAnimating, setIsAnimating] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!store.user || store.user === "undefined") navigate("/");
  }, []);

  // ── Persistir filtros en localStorage y URL ──────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(filters));
    const clean = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );
    setSearchParams(clean, { replace: true });
  }, [filters]);

  // ── Cargar perfiles ───────────────────────────────────────────────────────
  const fetchProfiles = useCallback(async (activeFilters) => {
    if (!store.user?.id) return;
    setLoading(true);
    try {
      const data = await searchMatchServices.getFilteredProfiles(store.user.id, activeFilters);

      const matchedIds = store.userMatchesInfo?.map(m => m.user_id || m.id) || [];
      const likedIds = store.likesSent?.map(l => l.id) || [];

      let allProfiles = Array.isArray(data) ? data : (data.profiles ?? []);

      const filteredProfiles = allProfiles.filter(profile => {
        const pid = profile.id || profile.user_id;
        return !matchedIds.includes(pid) && !likedIds.includes(pid);
      });

      dispatch({ type: "getSearchMatchProfiles", payload: filteredProfiles });
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [store.user, store.userMatchesInfo, store.likesSent, dispatch]);

  useEffect(() => {
    fetchProfiles(filters);
  }, [store.user, store.userMatchesInfo, store.likesSent, filters]);

  // ── Reset índice cuando cambie la lista ─────────────────────────────────
  useEffect(() => {
    setCurrentUser(0);
  }, [store.searchMatchProfiles]);


  // ── Avanzar al siguiente perfil ──────────────────────────────────────────
  const advanceToNextProfile = () => {
    setCurrentUser((prev) => prev + 1);
    const remainingProfiles = store.searchMatchProfiles.filter(
      (_, index) => index !== currentUser
    );
    dispatch({ type: "getSearchMatchProfilesFiltered", payload: remainingProfiles });
    setCurrentUser(0);
  };


  //Maneja likes
  // NOTE: SearchMatchCard calls onLike() AFTER its own 420ms exit animation,
  // so we call the API directly — no extra delay needed here.
  const handleLike = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const likedProfile = store.searchMatchProfiles[currentUser];
    if (!store.user?.id || !likedProfile?.user_id) {
      setIsAnimating(false);
      return;
    }

    try {
      const result = await searchMatchServices.addLikeSent(store.user.id, likedProfile.user_id);

      if (result?.is_match && result?.match_profile) {
        // Match detectado — guardar match_id para el botón de chat
        dispatch({ type: "addMatch", payload: result.match_profile });
        setMatchProfile(result.match_profile);
        setMatchId(result.match_id ?? null);
        setShowMatchModal(true);
      } else {
        dispatch({ type: "saveLike", payload: likedProfile });
        advanceToNextProfile();
      }
    } catch (error) {
      console.error("Error en handleLike:", error);
      advanceToNextProfile();
    } finally {
      setIsAnimating(false);
    }
  };






  const handleDislike = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const dislikedProfile = store.searchMatchProfiles[currentUser];
    if (!store.user?.id || !dislikedProfile?.user_id) {
      setIsAnimating(false);
      return;
    }

    try {
      await searchMatchServices.addDislikeSent(store.user.id, dislikedProfile.user_id);
      dispatch({ type: "saveDislike", payload: dislikedProfile });
    } catch (error) {
      console.error("Error sending dislike:", error);
    } finally {
      const remainingProfiles = store.searchMatchProfiles.filter(
        (_, index) => index !== currentUser
      );
      dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
      setCurrentUser(0);
      setIsAnimating(false);
    }
  };


  //Maneja el cierre del modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchProfile(null);
    setMatchId(null);
    dispatch({ type: "getItsMatchInfo", payload: null });

    if (matchProfile) {
      const remainingProfiles = store.searchMatchProfiles.filter(profile => {
        const profileId = profile.id || profile.user_id;
        const matchUserId = matchProfile.id || matchProfile.user_id;
        return profileId !== matchUserId;
      });

      dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
      setCurrentUser(0);
    }
  };


  //Mensaje si tarda al cargar nuevos users
  if (loading) {
    return <SearchMatchCardSkeleton />;
  }

  //Mensaje que muestra si no hay más users (con filtros activos)
  if (!loading && !showMatchModal && currentUser >= (store.searchMatchProfiles?.length || 0)) {
    return (
      <>
        {activeFilterCount > 0 ? (
          <div className="filter-no-results">
            <span className="filter-no-results-icon">🔍</span>
            <p>No hay perfiles con estos filtros</p>
            <button
              className="filter-clear-btn"
              onClick={() => setFilters({})}
            >
              Quitar filtros
            </button>
          </div>
        ) : (
          <SearchMateEmptyState
            playerName={store.user?.profile?.nick_name}
            onAdjustFilters={() => setFilterPanelOpen(true)}
          />
        )}

        <FilterPanel
          filters={filters}
          onApply={(newFilters) => { setFilters(newFilters); setCurrentUser(0); }}
          onClose={() => setFilterPanelOpen(false)}
          isOpen={filterPanelOpen}
        />
      </>
    );
  }

  return (
    <>
      {showMatchModal && matchProfile ? (
        <div className="match-overlay">
          <div className="match-overlay-bg" />
          <div className="match-modal-content">
            <button
              type="button"
              className="btn-close match-modal-close-btn"
              onClick={closeMatchModal}
              aria-label="Close"
            />
            <ItsMatch
              profile={matchProfile}
              myProfile={store.user?.profile}
              matchId={matchId}
              onClose={closeMatchModal}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-center">
            <h1 className="search-mate-font">Search a mate</h1>
          </div>

          {/* ── Barra de filtros activos ───────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div className="active-filters-bar">
              {Object.entries(filters)
                .filter(([, v]) => v !== "" && v !== null && v !== undefined)
                .map(([key, val]) => (
                  <span key={key} className="active-filter-chip">
                    {val}
                    <button
                      aria-label={`Quitar filtro ${key}`}
                      onClick={() => {
                        const next = { ...filters };
                        delete next[key];
                        setFilters(next);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              <button
                className="active-filter-chip"
                style={{ opacity: 0.7 }}
                onClick={() => setFilters({})}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {store.searchMatchProfiles &&
            store.searchMatchProfiles.length > 0 &&
            store.searchMatchProfiles[currentUser] &&
            !isAnimating && (
              <SearchMatchCard
                profile={store.searchMatchProfiles[currentUser]}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            )}
        </>
      )}

      {/* ── FAB filtros ─────────────────────────────────────────────────── */}
      {!showMatchModal && (
        <button
          className="filter-fab"
          onClick={() => setFilterPanelOpen(true)}
          aria-label="Abrir filtros"
        >
          <i className="fa-solid fa-sliders" />
          {activeFilterCount > 0 && (
            <span className="filter-fab-badge">{activeFilterCount}</span>
          )}
        </button>
      )}

      {/* ── Panel de filtros ─────────────────────────────────────────────── */}
      <FilterPanel
        filters={filters}
        onApply={(newFilters) => { setFilters(newFilters); setCurrentUser(0); }}
        onClose={() => setFilterPanelOpen(false)}
        isOpen={filterPanelOpen}
      />
    </>
  );
};
