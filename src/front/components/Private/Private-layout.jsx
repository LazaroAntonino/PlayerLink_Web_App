import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Private-sidebar";
import "../Private/private-layout.css"

export const PrivateLayout = () => {
  const location = useLocation();

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
