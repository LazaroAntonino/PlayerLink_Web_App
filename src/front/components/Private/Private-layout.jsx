import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Private-sidebar";
import "../Private/private-layout.css";
import { registerSessionExpiredHandler } from "../../services/apiFetch";
import useGlobalReducer from "../../hooks/useGlobalReducer";

export const PrivateLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useGlobalReducer();

  useEffect(() => {
    // Registrar el handler una sola vez al montar el layout privado
    registerSessionExpiredHandler(() => {
      dispatch({ type: "logout" });
      navigate("/?session_expired=1", { replace: true });
    });
  }, []);

  return (
    <div className="private-layout">
      <div className="private-layout-body">
        <Sidebar activePath={location.pathname} />
        <main className="private-content backgroundPrivateLayout">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
