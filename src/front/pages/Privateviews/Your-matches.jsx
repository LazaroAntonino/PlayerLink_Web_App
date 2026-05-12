import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import matchServices from "../../services/matchServices";
import { MatchMiniCard } from "../../components/matchMiniCard.jsx"
import "./Your-matches.css"

/** Skeleton card que imita MatchMiniCard durante la carga */
const MatchMiniCardSkeleton = () => (
  <div className="match-skeleton-card" aria-busy="true" aria-label="Loading match...">
    <div className="match-sk-avatar skeleton-shimmer" />
    <div className="match-sk-lines">
      <div className="match-sk-line match-sk-line--title skeleton-shimmer" />
      <div className="match-sk-line match-sk-line--sub skeleton-shimmer" />
      <div className="match-sk-line match-sk-line--sub skeleton-shimmer" style={{ width: "50%" }} />
    </div>
  </div>
);


export const YourMatches = () => {
  const navigate = useNavigate()
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate('/')

    } else {
      matchServices.getAllMatchesInfo(store.user?.id)
        .then(data => {
          dispatch({ type: "getAllMatchesInfo", payload: data.matches ?? [] });
        })
        .catch((err) => {
          console.error("Error loading matches:", err);
          dispatch({ type: "getAllMatchesInfo", payload: [] });
        })
        .finally(() => setLoading(false));
    }
  }, []);
  // modificar endpoint de get a match con el posit que está pegado al ordenador
  // a la card se le pasa lo necesario, solamente user_id, genero, nombre y juegos, (solo lo necesario!!!!), lo demás lo cogemos con un get_user_info en la página de detalles de ese usuario
  return (
    <div className="matches-page-wrapper">
      <div className="matches-page-header">
        <h1 className="matches-page-title pl-page-title">
          <i className="fa-solid fa-handshake me-2" aria-hidden="true"></i>
          Your Matches
        </h1>
        {Array.isArray(store.userMatchesInfo) && store.userMatchesInfo.length > 0 && (
          <p className="matches-page-subtitle">
            {store.userMatchesInfo.length} player{store.userMatchesInfo.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {loading ? (
        <div className="matches-grid">
          {[...Array(6)].map((_, i) => <MatchMiniCardSkeleton key={i} />)}
        </div>
      ) : Array.isArray(store.userMatchesInfo) && store.userMatchesInfo.length > 0 ? (
        <div className="matches-grid">
          {store.userMatchesInfo.slice().reverse().map((el) => (
            <MatchMiniCard
              key={el.id}
              id={el.user_id}
              nickname={el.nickname}
              gender={el.gender}
              games={el.games}
              age={el.age}
              location={el.location}
              photo={el.photo}
            />
          ))}
        </div>
      ) : (
        <div className="matches-empty-state">
          <div className="matches-empty-icon">🎮</div>
          <h4 className="matches-empty-title">No matches yet!</h4>
          <p className="matches-empty-sub">Your perfect gaming buddy might be just one search away!</p>
        </div>
      )}
    </div>
  );
}