import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Sidebar } from "./Private-sidebar";
import "../Private/private-layout.css";
import { registerSessionExpiredHandler } from "../../services/apiFetch";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const PrivateLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();
  const mainRef = useRef(null);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      dispatch({ type: "logout" });
      navigate("/?session_expired=1", { replace: true });
    });
  }, []);

  // Dispara la animación de entrada en cada cambio de ruta
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove("page-enter");
    // Forzar reflow para reiniciar la animación
    void el.offsetWidth;
    el.classList.add("page-enter");
  }, [location.pathname]);

  return (
    <div className="private-layout">
      <div className="private-layout-body">
        <Sidebar activePath={location.pathname} />
        <main ref={mainRef} className="private-content backgroundPrivateLayout page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
