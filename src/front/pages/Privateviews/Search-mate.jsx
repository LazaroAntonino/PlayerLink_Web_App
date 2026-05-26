import "../../pages/Privateviews/Search-mate.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SearchMatchCard } from "../../components/SearchMatchCard/SearchMatchCard";
import { SearchMatchCardSkeleton } from "../../components/SearchMatchCard/SearchMatchCardSkeleton";
import { SearchMateEmptyState } from "../../components/SearchMatchCard/SearchMateEmptyState";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import searchMatchServices from "../../services/searchMatchServices";
import { ItsMatch } from "../../components/ItsMatch/ItsMatch";

export const SearchMate = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  // Refs para acceder a likesSent/matchesInfo actualizados sin deps reactivos
  const likesSentRef = useRef(store.likesSent);
  const matchesInfoRef = useRef(store.userMatchesInfo);
  useEffect(() => { likesSentRef.current = store.likesSent; }, [store.likesSent]);
  useEffect(() => { matchesInfoRef.current = store.userMatchesInfo; }, [store.userMatchesInfo]);

  const [currentUser, setCurrentUser] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal ItsMatch
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);
  const [matchId, setMatchId] = useState(null);

  // Animación de swipe (evita doble disparo durante exit anim)
  const [isAnimating, setIsAnimating] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!store.user || store.user === "undefined") navigate("/");
  }, []);

  // Cargar perfiles candidatos
  const fetchProfiles = useCallback(async () => {
    if (!store.user?.id) return;
    setLoading(true);
    try {
      const data = await searchMatchServices.getProfiles(store.user.id);
      const matchedIds = matchesInfoRef.current?.map(m => m.user_id) || [];
      const likedIds = likesSentRef.current?.map(l => l.user_id) || [];

      const allProfiles = Array.isArray(data) ? data : (data.profiles ?? []);
      const filteredProfiles = allProfiles.filter(profile =>
        !matchedIds.includes(profile.user_id) && !likedIds.includes(profile.user_id)
      );

      dispatch({ type: "getSearchMatchProfiles", payload: filteredProfiles });
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [store.user?.id, dispatch]);

  useEffect(() => {
    fetchProfiles();
  }, [store.user?.id, store.userMatchesInfo]);

  // Avanzar al siguiente perfil
  const advanceToNextProfile = () => {
    const remainingProfiles = store.searchMatchProfiles.filter(
      (_, index) => index !== currentUser
    );
    dispatch({ type: "getSearchMatchProfilesFiltered", payload: remainingProfiles });
    setCurrentUser(0);
  };

  // SearchMatchCard ya espera 380ms (exit anim) antes de llamar onLike/onDislike,
  // así que llamamos a la API directamente.
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
        dispatch({ type: "saveLike", payload: likedProfile });
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
      dispatch({ type: "getSearchMatchProfilesFiltered", payload: remainingProfiles });
      setCurrentUser(0);
      setIsAnimating(false);
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchProfile(null);
    setMatchId(null);
    dispatch({ type: "getItsMatchInfo", payload: null });

    if (matchProfile) {
      const remainingProfiles = store.searchMatchProfiles.filter(profile =>
        profile.user_id !== matchProfile.user_id
      );
      dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
      setCurrentUser(0);
    }
  };

  // Skeleton mientras carga (excepto cuando hay modal de match abierto)
  if (loading && !showMatchModal) {
    return <SearchMatchCardSkeleton />;
  }

  // No quedan perfiles
  if (!loading && !showMatchModal && currentUser >= (store.searchMatchProfiles?.length || 0)) {
    return (
      <SearchMateEmptyState playerName={store.user?.profile?.nick_name} />
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
        <div className="search-mate-wrapper">
          <h1 className="search-mate-title">Search a mate</h1>

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
        </div>
      )}
    </>
  );
};
