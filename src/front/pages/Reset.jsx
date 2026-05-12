import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx"
import { emailServices } from "../services/emailServices.js"

export const Reset = () => {
	const { store, dispatch } = useGlobalReducer()
	//utilizamos useLocation para poder manejar valores grandes ya que useParams no permite este tipo de valores 
	const location = useLocation();
	//almacenamos en variable queryParams la busqueda realizada que se encuentra en el url
	const queryParams = new URLSearchParams(location.search);
	//extraemos el token del queryPArams
	const token = queryParams.get('token');
	const [password, setPassword] = useState('')
	const [repeatPassword, setRepeatPassword] = useState("");
	const [user, setUser] = useState()
	const navigate = useNavigate()
	const [success, setSuccess] = useState('')
	const [showPassword, setShowPassword] = useState(false); // estado pra enseñar/esconder contraseña
	const [errorPassword, setErrorPassword] = useState(""); // estado para error si la contraseña no es la misma
	const [passwordErrors, setPasswordErrors] = useState([]); //estado para condiciones de la contraseña
	const [noTokenError, setNoTokenError] = useState(!token); // estado para mostrar error si no hay token

	useEffect(() => {
		if (token) {
			//creamos funcion async para que el correcto uso del useEffect 
			const fetchData = async () => {

				//verificamos que el token sea correcto y podemos saber que usuario es el que esta accediendo con la identidad del token
				const resp = await emailServices.checkAuth(token);
				setUser(prev => prev = resp.user)
			}
			fetchData()
		}
	}, [token]);

	const validatePassword = (password) => {
		const errors = [];
		if (password.length < 8) errors.push("at least 8 characters");
		if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
		if (!/[0-9]/.test(password)) errors.push("a number");
		if (!/[@$!%*?&.]/.test(password)) errors.push("a special character (@$!%*?&.)");
		return errors;
	};

	const handlePasswordChange = (e) => {
		const value = e.target.value;
		setPassword(value);

		const errors = validatePassword(value);
		setPasswordErrors(errors);

		if (repeatPassword && value !== repeatPassword) {
			setErrorPassword("Passwords do not match");
		} else {
			setErrorPassword("");
		}
	};

	const handleRepeatPasswordChange = (e) => {
		const value = e.target.value;
		setRepeatPassword(value);

		if (password && value !== password) {
			setErrorPassword("Passwords do not match");
		} else {
			setErrorPassword("");
		}
	};



	const handleSubmit = async (e) => {
		e.preventDefault();

		// comprueba que la contraseña sea mas de 8 caracteres
		if (password.length < 8) {
			setErrorPassword("Password must have at least 8 characters");
			return;
		}


		//comprueba que las contraseñas coinciden
		if (password !== repeatPassword) {
			setErrorPassword("Passwords do not match");
			return;
		}
		setErrorPassword("");

		const resp = await emailServices.updatePassword(password, token)
		if (resp.success) {
			setSuccess(true)
			setTimeout(() => {
				navigate('/');
			}, 3000)
		}
		else {
			setSuccess(false)
		}
	}

	return (

		<>

			<div>
				<div className='d-flex justify-content-center'>
					<div className='card reset-card mt-5'>
						<div className="card-body">
							<h2 className="card-title text-center">Password Change Request</h2>
							<br />

							{noTokenError ? (
								<div className="text-center px-2 py-3">
									<i className="fa-solid fa-circle-xmark fa-2x text-danger mb-3" />
									<p className="text-danger fw-semibold mb-2">The reset link has expired or is invalid.</p>
									<p className="text-muted small mb-3">Please request a new password reset from the login screen.</p>
									<button
										type="button"
										className="btn btn-sm btn-outline-secondary"
										onClick={() => navigate("/")}
									>
										← Back to home
									</button>
								</div>
							) : (
								<form onSubmit={handleSubmit} >
									<div className="mx-4">

										<h5 htmlFor="basic-url" className="form-label mb-2 mt-2">Enter your new password {user && user?.email} </h5>
										<div>
											{/* New Password */}
											<label htmlFor="basic-url" className="form-label mb-0 mt-2">New password</label>
										</div>
										<div className="d-flex btn-reset-card-border rounded-2">

											<input
												type={showPassword ? "text" : "password"}
												onChange={handlePasswordChange}
												value={password}
												placeholder="Enter new password"
												className="w-100 border-0"
											/>
											<span
												className="input-group-text border-0 bg-white"

												onClick={() => setShowPassword(prev => !prev)}
											>
												<i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
											</span>
										</div>

										{/* Confirm Password */}
										<div>
											<label htmlFor="basic-url" className="form-label mt-3 mb-0">Confirm New Password</label>
										</div>
										<div className="d-flex btn-reset-card-border rounded-2">

											<input
												type="password"
												onChange={handleRepeatPasswordChange}
												value={repeatPassword}
												placeholder="Repeat new password"
												className="w-100 border-0"
											/>

										</div>

										{/* Mensaje con las condiciones contraseña que faltan */}
										{passwordErrors.length > 0 && (
											<h5 className="text-warning mt-2 register-message-errors">
												Password must contain {passwordErrors.join(", ")}.
											</h5>
										)}
										{/* Error contraseñas no coinciden */}
										{errorPassword && (
											<h6 className="text-danger mt-2 reset-message-errors">
												{errorPassword}
											</h6>
										)}

										{
											success !== '' ?
												success ?
													<h6 className="text-success mt-3 reset-message-errors">
														Success! Your password has been updated.
													</h6>
													:
													<h6 className="text-danger mt-3 reset-message-errors">
														There was an error. Try it again!
													</h6>
												:
												''
										}

										<input type="submit" value="Continue" className='w-100 rounded-2 mt-5 text-white bg-black btn-reset-card-border' />
									</div>
								</form>
							)}
						</div>
					</div>
				</div>
			</div >
		</>
	);
};