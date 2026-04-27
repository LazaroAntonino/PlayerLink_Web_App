import "../../pages/Privateviews/Search-mate.css";
import { useEffect, useState } from "react";
import { SearchMatchCard } from "../../components/SearchMatchCard/SearchMatchCard";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import searchMatchServices from "../../services/searchMatchServices";
import { ItsMatch } from "../../components/ItsMatch/ItsMatch";
import { useNavigate } from "react-router-dom";

export const SearchMate = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // Para el modal del match y el componente match
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchProfile, setMatchProfile] = useState(null);

  //Para quitar el retarto 
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate('/')
    }
  }, [])


  //Carga los perfiles 

  useEffect(() => {
    if (!store.user || !store.user.id) return;

    const getProfiles = async () => {
      setLoading(true);
      try {
        const data = await searchMatchServices.getFilteredProfiles(store.user.id);

        // IDs de perfiles ya match o liked
        const matchedIds = store.userMatchesInfo?.map(m => m.user_id || m.id) || [];
        const likedIds = store.likesSent?.map(l => l.id) || [];

        let allProfiles = [];
        if (Array.isArray(data)) {
          allProfiles = data;
        } else if (data.profiles && Array.isArray(data.profiles)) {
          allProfiles = data.profiles;
        }

        // Filtra perfiles que NO estén en matchedIds ni likedIds
        const filteredProfiles = allProfiles.filter(profile => {
          const profileId = profile.id || profile.user_id;
          return (
            !matchedIds.includes(profileId) &&
            !likedIds.includes(profileId)
          );
        });

        dispatch({ type: "getSearchMatchProfiles", payload: filteredProfiles });
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfiles();
  }, [store.user, store.userMatchesInfo, store.likesSent, dispatch]);



  // Resetear currentUser si cambia la lista de perfiles
  useEffect(() => {
    setCurrentUser(0);
  }, [store.searchMatchProfiles]);


  // Factorizar avance para no repetir lógica
  const advanceToNextProfile = () => {
    setCurrentUser((prev) => prev + 1);
    const remainingProfiles = store.searchMatchProfiles.filter(
      (_, index) => index !== currentUser
    );
    dispatch({ type: "getSearchMatchProfilesFiltered", payload: remainingProfiles });
    setCurrentUser(0);
  };


  //Maneja likes
  const handleLike = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(async () => {
      const likedProfile = store.searchMatchProfiles[currentUser];
      if (!store.user?.id || !likedProfile?.user_id) {
        setIsAnimating(false);
        return;
      }

      try {
        const result = await searchMatchServices.addLikeSent(store.user.id, likedProfile.user_id);

        if (result?.is_match && result?.match_profile) {
          // Match detectado directamente desde la respuesta del like — sin llamada extra
          dispatch({ type: "addMatch", payload: result.match_profile });
          setMatchProfile(result.match_profile);
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
    }, 500);
  };






  const handleDislike = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setTimeout(async () => {
      const dislikedProfile = store.searchMatchProfiles[currentUser];
      // Use user.id (not profile.id) — reject endpoints expect user IDs
      if (!store.user?.id || !dislikedProfile?.user_id) return;

      try {
        await searchMatchServices.addDislikeSent(
          store.user.id,
          dislikedProfile.user_id
        );
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
    }, 500);
  };


  //Maneja el cierre del modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchProfile(null);
    dispatch({ type: "getItsMatchInfo", payload: null });

    if (matchProfile) {
      const remainingProfiles = store.searchMatchProfiles.filter(profile => {
        const profileId = profile.id || profile.user_id;
        const matchId = matchProfile.id || matchProfile.user_id;
        return profileId !== matchId;
      });

      dispatch({ type: "getSearchMatchProfiles", payload: remainingProfiles });
      setCurrentUser(0);
    }
  };


  //Mensaje si tarda al cargar nuevos users
  if (loading && showLoadingMessage) {
    return (
      <h2>
        <div className="spinner align-self-center search-mate-font"></div> Loading new players. Thank you for your patience{" "}
        {store.user?.profile?.nick_name || "player"}
      </h2>
    );
  }

  //Mensaje que muestra si no hay más users
  if (!loading && !showMatchModal && currentUser >= (store.searchMatchProfiles?.length || 0)) {
    return (
      <h2 className="text-center mt-5 search-mate-font">
        Sorry {store.user?.profile?.nick_name || "player"}, there are no more players around. Try later!
      </h2>
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
              onClose={closeMatchModal}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-center">
            <h1 className="search-mate-font">
              Search a mate
            </h1>
          </div>

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
    </>
  );
};
