import React, { useEffect, useState } from 'react';
import './Settings.css';
import userServices from "../../services/userServices"
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx"
import { useNavigate } from 'react-router-dom';
import { ProfileConditions } from '../../components/ProfileConditions/ProfileConditions.jsx';
import { ResetPassword } from '../../components/ResetPassword/ResetPassword.jsx';



const SettingsView = () => {
  const navigate = useNavigate()
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [show2FAModal, setShow2FAModal] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [email, setEmail] = useState({
    actualEmail: '',
    email: '',
    confirmedEmail: ''
  })
  const [password, setPassword] = useState({
    actualPassword: '',
    password: '',
    confirmedPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false); // estado para ver/ocultar la contraseña actual
  const [showNewPassword, setShowNewPassword] = useState(false); // estado para ver/ocultar la contraseña nueva
  const [errorPassword, setErrorPassword] = useState(""); // estado para error si la contraseña no es la misma
  const [passwordErrors, setPasswordErrors] = useState([]); //estado para condiciones de la contraseña

  const [correctPassword, setCorrectPassword] = useState("") //estado para mensaje si la conrtaseña se cambió correctamente
  const [emailVerification, setEmailVerification] = useState("") //estado para mensaje de verificación enviado
  const [sameEmail, setSameEmail] = useState("") // estado para mensaje de que el email sea el mismo
  const [emailChanged, setEmailChanged] = useState("") //estado para mensaje email cambiado correctamente
  const [errorEmailChange, setErrorEmailChange] = useState("") //estado mensaje error en el cambio de contraseña

  const { store, dispatch } = useGlobalReducer();

  useEffect(() => {
    if (!store.user || store.user === "undefined") {
      navigate('/')
    }
  }, []);

  const submitEmailChange = async (e) => {
    e.preventDefault();
    setSameEmail("");
    setEmailChanged("");
    setErrorEmailChange("");

    if (email.email !== email.confirmedEmail) {
      setSameEmail("Emails must be the same");
      return;
    }

    if (email.actualEmail !== store.user.email) {
      setSameEmail("Your current email is incorrect");
      return;
    }

    try {
      const resp = await userServices.changeUserEmail(store.user?.id, email.email);

      if (!resp.ok) {
        setErrorEmailChange("Something happened, looks like this email already exists");
        return;
      }

      setSameEmail("");
      setErrorEmailChange("");
      setEmailChanged("Email updated successfully");

      setTimeout(() => {
        setShowEmailModal(false);
        setEmail({ actualEmail: '', email: "", confirmedEmail: "" });
        setEmailChanged("");
        dispatch({ type: 'logout' });
        navigate('/');
      }, 3000);

    } catch (error) {
      setErrorEmailChange("Failed to change the email. Please try again");
    }
  };



  const closeChangeEmailModal = () => {
    setShowEmailModal(false);
    setEmail({ actualEmail: '', email: "", confirmedEmail: "" });
    setSameEmail("");
    setEmailChanged("");
  };

  const deleteAccount = async (userId) => {
    const resp = await userServices.deleteAccount(userId);

    if (!resp.ok) {
      alert(resp.error || "Failed to delete account");
      return;
    }

    alert("Account deleted successfully");

    setTimeout(() => {
      setShowDeleteModal(false);
      dispatch({ type: 'logout' });
      navigate('/');
    }, 3000);
  };


  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setErrorPassword("");
    setCorrectPassword("");
    if (password.actualPassword === password.password) {
      setErrorPassword("Passwords are the same");
      return;
    }
    if (password.password.length <= 0) {
      setErrorPassword("Passwords must contain data");
      return;
    }
    if (password.password !== password.confirmedPassword) {
      setErrorPassword("Passwords do not match");
      return;
    }

    try {
      const resp = await userServices.changeUserPassword(
        store.user?.id,
        password.password,
        password.actualPassword
      );

      if (!resp.ok) {
        setErrorPassword(data?.msg || "Error changing password");
        return;
      }

      setCorrectPassword("Password changed successfully");

      // Esperar 3 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        closeChangePasswordModal();
        dispatch({ type: 'logout' });
        navigate('/');
      }, 3000);

    } catch (error) {
      setErrorPassword("Failed to change password. Please try again.");
    }
  };

  const closeChangePasswordModal = () => {
    setShowPasswordModal(false);
    setShowPassword(false); // ojo cerrado
    setShowNewPassword(false)
    setPassword({ password: "", confirmedPassword: "" }); // limpia inputs
    setErrorPassword(""); // limpia error
    setCorrectPassword(""); // limpia mensaje éxito
  };


  const handleChange = e => {
    setEmail({
      ...email,
      [e.target.name]: e.target.value
    })
    setPassword({
      ...password,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    const errors = [];
    const pwd = password.password;

    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("an uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("a lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("a number");
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push("a special character");

    setPasswordErrors(errors);
  }, [password.password]);

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>

      <div className="settings-section">
        <button className="settings-btn" onClick={() => setShowEmailModal(true)}>Change Email</button>
        <button className="settings-btn" onClick={() => setShowPasswordModal(true)}>Change Password</button>
        {/* <button className="settings-btn" onClick={() => setShow2FAModal(true)}>Enable 2FA</button> */}
      </div>

      <div className="settings-warning">
        <h3>Delete Account</h3>
        <p>If you delete your account, all your data will be permanently erased after 30 days.</p>
        <div className="warning-buttons">
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
        </div>
      </div>

      {/* Modales del diaaabloo */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Change Email</h3>
            <form onSubmit={submitEmailChange}>
              <input type="actualEmail" placeholder="Email" name="actualEmail" value={email.actualEmail} onChange={handleChange} />
              <input type="email" placeholder="New Email" name="email" value={email.email} onChange={handleChange} />
              <input type="email" placeholder="Confirm New Email" name="confirmedEmail" value={email.confirmedEmail} onChange={handleChange} />
              {sameEmail && <h6 className="text-danger mt-1">{sameEmail}</h6>}
              {emailChanged && <h6 className="text-success mt-1">{emailChanged}</h6>}
              {errorEmailChange && <h6 className="text-danger mt-1">{errorEmailChange}</h6>}
              <div className="modal-actions">
                <button type="button" onClick={closeChangeEmailModal}>Cancel</button>
                <button className="confirm-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Change Password</h3>
            <form onSubmit={submitPasswordChange}>
              <div className='d-flex'>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Actual Password"
                    name="actualPassword"
                    value={password.actualPassword}
                    className='settings-change-password-input'
                    onChange={handleChange}

                  />
                  <i
                    onClick={() => setShowPassword(prev => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showPassword ? "fa-eye-slash" : "fa-eye"}`}

                  ></i>
                </div>

              </div>
              <div className='d-flex'>
                <div style={{ position: 'relative', width: '100%' }}>

                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    name="password"
                    value={password.password}
                    className="settings-change-password-input"
                    onChange={handleChange} />
                  <i
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className={`fa-solid setting-change-password-eye-icon ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}

                  ></i>

                </div>

              </div>

              {/* Mensaje con las condiciones contraseña que faltan */}
              {passwordErrors.length > 0 && (
                <h5 className="text-warning mt-2 register-message-errors">
                  Password must contain {passwordErrors.join(", ")}.
                </h5>
              )}

              <input type="password" placeholder="Confirm New Password" name="confirmedPassword" value={password.confirmedPassword} onChange={handleChange} />
              {errorPassword && <h6 className="text-danger mt-1">{errorPassword}</h6>}
              {correctPassword && <h6 className="text-success mt-1">{correctPassword}</h6>}

              <div className="modal-actions">
                <button type="button" onClick={closeChangePasswordModal}>Cancel</button>
                <button className="confirm-btn">Update</button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* {show2FAModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Enable 2-Factor Authentication</h3>
            <p>Enter your phone or email for verification.</p>
            <input type="text" placeholder="Phone or Email" />
            <div className="modal-actions">
              <button onClick={() => setShow2FAModal(false)}>Cancel</button>
              <button className="confirm-btn">Continue</button>
            </div>
          </div>
        </div>
      )} */}


      {/* Take a Break modal 
      {showBreakModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Take a Break</h3>
            <p>Take a break means that you are not completely sure to delete your account. You may re-activate your account by logging in as usual.</p>
            <p>To improve the user experience, please take 1 minute to leave a comment about why you want to take a break.</p>
            <textarea placeholder="Your comment (optional)" rows="4"></textarea>
            <div className="modal-actions">
              <button onClick={() => setShowBreakModal(false)}>Cancel</button>
              <button className="confirm-btn">Confirm</button>
            </div>
          </div>
        </div>
      )}
      */}

      {/* Delete Account modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <h3>Are you sure?</h3>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>No</button>
              <button className="confirm-btn" onClick={() => deleteAccount(store.user?.id)}>Yes</button>
            </div>
          </div>
        </div>
      )}


    </div>


  );
};

export default SettingsView;
