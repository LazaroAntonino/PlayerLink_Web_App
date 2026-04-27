import { Link, useNavigate } from 'react-router-dom';
import './SignIn.css';
import { useEffect, useState } from 'react';
import userServices from '../../services/userServices';
import useGlobalReducer from '../../hooks/useGlobalReducer';


export const SignIn = ({ onSwitch, onSuccess }) => {

    const { store, dispatch } = useGlobalReducer()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const [errorLogin, setErrorLogin] = useState(""); //estado para el error de email/contraseña no válido
    const [showPassword, setShowPassword] = useState(false); // estado pra enseñar/esconder contraseña
    const [passwordErrors, setPasswordErrors] = useState([]); //estado para condiciones de la contraseña

    const handleSubmit = async e => {
        e.preventDefault()
        setErrorLogin(""); //quita errores previos

        try {
            const data = await userServices.login(formData)
            if (!data || !data.success) {
                setErrorLogin(data?.error || "Incorrect email or password")
                return
            }
            localStorage.setItem('token', data.token)
            const userInfo = await userServices.getUserInfo()
            // getUserInfo already saves to localStorage; dispatch the parsed object
            const parsedUser = userInfo?.user ?? JSON.parse(localStorage.getItem('user'))
            dispatch({ type: 'getUserInfo', payload: parsedUser })
            if (onSuccess) onSuccess()
            navigate('/private/profile')
        } catch (error) {
            console.error('Login failed', error)
            setErrorLogin("Something went wrong. Please try again.")
        }
    }

    const handleChange = e => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'password') {
            const errors = validatePassword(value);
            setPasswordErrors(errors);
        }
    };


    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push("at least 8 characters");
        if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
        if (!/[0-9]/.test(password)) errors.push("a number");
        if (!/[@$!%*?&.]/.test(password)) errors.push("a special character (@$!%*?&.)");
        return errors;
    };


    return (
        <>

            <div className='d-flex justify-content-center'>
                <div className='card sign-in-card mt-5'>
                    <div className="card-body">
                        <div className="d-flex">
                            <button
                                type="button"
                                className="btn-close btn-close-modal"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => {
                                    setErrorLogin("");
                                    setPasswordErrors([]);
                                    setFormData({ password: "" });
                                    setShowPassword(false);
                                
                                }}
                            ></button>
                        </div>
                        <h2 className="card-title text-center">Sign In</h2>
                        <h6 className="card-subtitle mb-2 sign-in-card-subtitle text-end me-4 pe-2 mb-3">Need an account
                            <button type="button" onClick={onSwitch} className="btn btn-link sign-in-card-subtitle ps-1">Register</button>
                        </h6>

                        <form onSubmit={handleSubmit}>
                            <div className="mx-4">
                                <div>
                                    <label htmlFor="basic-url" className="form-label mb-0 mt-2">Email</label>

                                </div>
                                <input type="email" name="email" placeholder="email" value={formData.email} onChange={handleChange} className='w-100 border-0 rounded-2 border-1 btn-sign-in-card-border' />
                                <div>
                                    <label htmlFor="basic-url" className="form-label mt-3 mb-0">Password</label>
                                </div>
                                <div>
                                    <div className="d-flex btn-register-card-border rounded-2">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-100 border-0 "
                                        />
                                        <span
                                            className="input-group-text border-0 bg-white"

                                            onClick={() => setShowPassword(prev => !prev)}
                                        >
                                            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                        </span>
                                    </div>
                                    {/* Mensaje con las condiciones contraseña que faltan */}
                                    {passwordErrors.length > 0 && (
                                        <h5 className="text-danger mt-2 register-message-errors">
                                            Password must contain {passwordErrors.join(", ")}.
                                        </h5>
                                    )}

                                    <div className="form-text sign-in-password-subtitle" id="basic-addon4">
                                        Forgot your password? It’s ok{" "}
                                        <a
                                            href="#"
                                            data-bs-toggle="modal"
                                            data-bs-target="#forgotPasswordModal"
                                            data-bs-dismiss="modal"
                                        >
                                            click here
                                        </a>
                                    </div>

                                    {errorLogin && <h5 className="text-danger mt-2 sign-in-message-errors">{errorLogin}</h5>}



                                </div>
                                <input type="submit" value="Continue" className='w-100 rounded-2 mt-5 text-white bg-black btn-sign-in-card-border' />
                            </div>
                        </form>
                    </div>
                </div>


                {/* modal del reset */}

            </div>



            <div>



            </div>



        </>
    )
}