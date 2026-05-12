import "./private-sidebar.css";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import profileicon from "../../assets/img/icons/icon-profile.png";
import searchicon from "../../assets/img/icons/icon-search-a-mate.png";
import matchicon from "../../assets/img/icons/icon-your-mates.png";
import findicon from "../../assets/img/icons/icon-find-games.png";
import settingsicon from "../../assets/img/icons/icon-settings.png";
import messageicon from "../../assets/img/icons/icon-message.png";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import chatServices from "../../services/chatServices.js";

export const Sidebar = ({ activePath }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  // ── Polling del badge de mensajes no leídos ──
  useEffect(() => {
    if (!store.user?.id) return;

    const fetchUnread = async () => {
      try {
        const { unread } = await chatServices.getUnreadCount();
        dispatch({ type: "setUnreadCount", payload: unread });
      } catch { /* silencioso */ }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [store.user?.id]);

  const links = [
    { to: "/private/profile", icon: profileicon, label: "Profile" },
    { to: "/private/search-a-mate", icon: searchicon, label: "Search a mate" },
    { to: "/private/your-matches", icon: matchicon, label: "Your matches" },
    { to: "/private/chats", icon: messageicon, label: "Messages", isChat: true },
    { to: "/private/find-games", icon: findicon, label: "Find games" },
    { to: "/private/settings", icon: settingsicon, label: "Settings" },
  ];

  const handleLogout = () => {
    dispatch({ type: 'logout' })
    navigate('/')
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        <i className="fa-solid fa-bars"></i>
      </button>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/" className="sidebar-logo-link" onClick={() => setOpen(false)}>
          Player<span className="sidebar-logo-highlight">Link</span>
        </Link>
        <div className="sidebar-divider" />
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => {
              // Also highlight Messages when inside an individual chat (/private/chat/:id)
              const isChat = link.isChat && window.location.pathname.startsWith("/private/chat");
              return `sidebar-button ${isActive || isChat ? "active" : ""}`;
            }}
            onClick={() => setOpen(false)}
          >
            <span className="sidebar-icon">
              <img className="Privateicons" src={link.icon} alt={link.label} />
            </span>
            <span className="sidebar-text">
              {link.label}
              {link.isChat && store.unreadCount > 0 && (
                <span className="sidebar-badge">{store.unreadCount}</span>
              )}
            </span>
          </NavLink>
        ))}
        <button onClick={handleLogout} className="sidebar-button logout">
          <span className="sidebar-icon">
            <i className="fa-solid fa-right-from-bracket"></i>
          </span>
          <span className="sidebar-text">Log out</span>
        </button>
      </div>
    </>
  );
};
