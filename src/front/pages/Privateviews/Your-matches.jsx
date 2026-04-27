import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import userServices from "../../services/userServices";
import matchServices from "../../services/matchServices";
import { MatchMiniCard } from "../../components/matchMiniCard.jsx"


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
          dispatch({ type: "getAllMatchesInfo", payload: data.matches });
        })
        .finally(() => setLoading(false)); // desactiva loading al finalizar
    }
  }, []);
  // modificar endpoint de get a match con el posit que está pegado al ordenador
  // a la card se le pasa lo necesario, solamente user_id, genero, nombre y juegos, (solo lo necesario!!!!), lo demás lo cogemos con un get_user_info en la página de detalles de ese usuario
  return (
    <div className="container-fluid px-2 px-sm-4">
      <div className="row gy-4 d-flex justify-content-around">

        {loading ? (
          <>
            <div className="spinner-border text-info" role="status">
            </div>
            <h4 className="mt-3 text-center my-2 search-mate-font ">Loading matches...</h4>
          </>
        ) : (
          <>
            {Array.isArray(store.userMatchesInfo) && store.userMatchesInfo.length > 0 ? (
              store.userMatchesInfo.slice().reverse().map((el) => (
                <div
                  key={el.id}
                  className="col-lg-4 col-md-6 col-sm-12"
                >
                  <MatchMiniCard
                    id={el.user_id}
                    nickname={el.nickname}
                    gender={el.gender}
                    games={el.games}
                    age={el.age}
                    location={el.location}
                  />

                </div>

              ))
            ) : (


              <div className="d-flex justify-content-center w-50 mt-5">
                <div
                  className="text-center search-mate-font px-3 py-2 rounded"
                  style={{
                    width: "fit-content",
                    border: "2px solid #00f0ff",
                    color: "#00f0ff",
                    backgroundColor: "#121212"
                  }}
                >
                  <h4 className="  text-center my-2 search-mate-font "> No matches yet! <br />Your perfect gaming buddy might be just one search away!</h4>

                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}