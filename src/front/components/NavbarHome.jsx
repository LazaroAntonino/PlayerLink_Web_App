
import logoApp from "../assets/img/logos/logo-app.png";
import './navbarHome.css'
import '../components/ResetPassword/ResetPassword.css'
import { Register } from "./Register/Register";
import { SignIn } from "./SignIn/SignIn";
import { ResetPassword } from "../components/ResetPassword/ResetPassword"
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";


export const NavbarHome = () => {

  const [showSignIn, setShowSignIn] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { store, dispatch } = useGlobalReducer();

  // Detectar redirección por sesión expirada y abrir modal de login automáticamente
  useEffect(() => {
    if (searchParams.get("session_expired") === "1") {
      setSessionExpiredMsg(true);
      setShowSignIn(true);
      setTimeout(() => {
        const el = document.getElementById("startModal");
        if (el && window.bootstrap) {
          window.bootstrap.Modal.getOrCreateInstance(el).show();
        }
      }, 150);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const closeStartModal = () => {
    setSessionExpiredMsg(false);
    const el = document.getElementById("startModal");
    if (el && window.bootstrap) {
      const modal = window.bootstrap.Modal.getInstance(el);
      if (modal) modal.hide();
    }
  };

  // Para que siempre se muestre Sing-In el primero
  useEffect(() => {
    const modalElement = document.getElementById("exampleModal");
    function handleShow() { setShowSignIn(true); }
    if (modalElement) modalElement.addEventListener("show.bs.modal", handleShow);
    return () => {
      if (modalElement) modalElement.removeEventListener("show.bs.modal", handleShow);
    };
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-black navbar-home-font border-bottom ">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <a className="navbar-brand" href="#" />
            <img src={logoApp} alt="App Logo" className="d-inline-block align-text-top logo-navbar-home"></img>
            <a className="navbar-brand navbar-home-font navbar-home-font-shadow " href="#">PLAYERLINK</a>
          </div>
          <button className="navbar-toggler border-2 navbar-home-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse navbar-home-collapse border-2 navbar-home-toggler" id="navbarNav">
            <div className="d-flex align-items-center justify-content-around ms-5">
              <ul className="navbar-nav">
                <div className="d-flex justify-content-around align-self-center">
                  <li className="nav-item">
                    <a className="nav-link navbar-home-font me-5" href="#howitworks">How It Works</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link active navbar-home-font me-5" aria-current="page" href="#bestpractices">Best Practices</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link navbar-home-font me-5" href="#aboutus">About Us</a>
                  </li>
                </div>
                <li className="nav-item">
                  <div className="navbar-home-start-container">
                    <button
                      type="button" className="btn navbar-home-font navbar-home-btn pulsate-bck" data-bs-toggle="modal" data-bs-target="#startModal" onClick={() => store.user && store.user !== "undefined" && navigate('/private/profile')}>
                      START
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* modal START body */}
      <div className="modal fade" id="startModal" tabIndex="-1" aria-labelledby="startModalLabel" aria-hidden="true" data-bs-backdrop="false">
        <div className="modal-dialog">
          <div className="modal-content modal-home">
            <div className="modal-header border-0 mt-5">
              <div className="modal-body d-flex flex-column">
                {/* Aviso de sesión expirada */}
                {sessionExpiredMsg && (
                  <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert">
                    <span>⚠️</span>
                    <span>Your session has expired. Please sign in again.</span>
                  </div>
                )}
                <div>
                  {showSignIn ? (
                    <SignIn onSwitch={() => setShowSignIn(false)} onSuccess={closeStartModal} />
                  ) : (
                    <Register onSwitch={() => setShowSignIn(true)} onSuccess={closeStartModal} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* modal RESET password body */}
      <div>
        <div className="modal fade" id="forgotPasswordModal" tabIndex="-1" aria-labelledby="forgotPasswordModal" aria-hidden="true" data-bs-backdrop="false">
          <div className="modal-dialog">
            <div className="modal-content modal-home">
              <div className="modal-header border-0 mt-5">
                <div className="modal-body d-flex">
                  <ResetPassword />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
