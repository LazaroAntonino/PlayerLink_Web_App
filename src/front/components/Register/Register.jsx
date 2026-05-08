import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import userServices from '../../services/userServices';
import { TermsText } from '../Terms/Terms';
import './Register.css';

// ─── Email-sent screen ───────────────────────────────────────────────────────
const EmailSentScreen = ({ email, onSwitch }) => {
    const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | sent | error

    const handleResend = async () => {
        setResendStatus('sending');
        try {
            await userServices.resendVerification(email);
            setResendStatus('sent');
        } catch {
            setResendStatus('error');
        }
    };

    return (
        <div className="d-flex justify-content-center">
            <div className="card register-card mt-5">
                <div className="card-body text-center px-4 py-5">
                    <i className="fa-solid fa-envelope-circle-check fa-3x mb-3" style={{ color: 'var(--color-primary, #6c63ff)' }} />
                    <h2 className="card-title mb-2">Check your inbox!</h2>
                    <p className="text-muted mb-1">
                        We've sent a verification link to:
                    </p>
                    <p className="fw-semibold mb-4">{email}</p>
                    <p className="text-muted small mb-4">
                        Click the link in the email to activate your account.
                        The link expires in <strong>24 hours</strong>.
                    </p>

                    {resendStatus === 'sent' && (
                        <p className="text-success small mb-3">
                            <i className="fa-solid fa-circle-check me-1" />
                            A new verification email has been sent.
                        </p>
                    )}
                    {resendStatus === 'error' && (
                        <p className="text-danger small mb-3">Something went wrong. Please try again.</p>
                    )}

                    <button
                        type="button"
                        className="btn btn-link text-muted small"
                        onClick={handleResend}
                        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                    >
                        {resendStatus === 'sending'
                            ? <><i className="fa-solid fa-spinner fa-spin me-1" />Sending…</>
                            : "Didn't receive it? Resend email"}
                    </button>

                    <hr className="my-4" />
                    <p className="text-muted small mb-0">
                        Already verified?{' '}
                        <button type="button" onClick={onSwitch} className="btn btn-link p-0 small">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── helpers ────────────────────────────────────────────────────────────────
const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('an uppercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('a number');
    if (!/[@$!%*?&.]/.test(pwd)) errors.push('a special character (@$!%*?&.)');
    return errors;
};

// ─── component ──────────────────────────────────────────────────────────────
export const Register = ({ onSwitch, onSuccess }) => {
    const navigate = useNavigate();
    const { dispatch } = useGlobalReducer();

    const [formData, setFormData] = useState({ email: '', password: '', repeatPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [errorPassword, setErrorPassword] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [termsOpen, setTermsOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [errorTerms, setErrorTerms] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    // ── early return: show email-sent screen ─────────────────────────────────
    if (emailSent) {
        return <EmailSentScreen email={registeredEmail} onSwitch={onSwitch} />;
    }

    // ── handlers ────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            const errs = validatePassword(value);
            setPasswordErrors(errs);
            if (errs.length === 0) setErrorPassword('');
        }
        if (name === 'repeatPassword') {
            setErrorPassword(value !== formData.password ? 'Passwords do not match' : '');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorEmail('');
        setErrorPassword('');
        setErrorTerms('');

        const pwdErrs = validatePassword(formData.password);
        if (pwdErrs.length > 0) {
            setPasswordErrors(pwdErrs);
            setErrorPassword('Password does not meet the requirements.');
            return;
        }
        if (formData.password !== formData.repeatPassword) {
            setErrorPassword('Passwords do not match');
            return;
        }
        if (!termsAccepted) {
            setErrorTerms('You must accept the Terms & Conditions to continue.');
            setTermsOpen(true);
            return;
        }

        setLoading(true);
        try {
            const data = await userServices.register(formData);
            if (data.success && data.email_sent) {
                // Email verification required — show "check your inbox" screen
                setRegisteredEmail(formData.email);
                setEmailSent(true);
            } else if (data.success) {
                // Fallback: server returned a token (e.g. dev mode without mail)
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    const userInfo = await userServices.getUserInfo();
                    const parsedUser = userInfo?.user ?? JSON.parse(localStorage.getItem('user'));
                    dispatch({ type: 'getUserInfo', payload: parsedUser });
                    if (onSuccess) onSuccess();
                    navigate('/onboarding');
                } else {
                    setRegisteredEmail(formData.email);
                    setEmailSent(true);
                }
            } else {
                setErrorEmail(data?.error || 'Email already registered');
            }
        } catch {
            setErrorEmail('Unexpected error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="d-flex justify-content-center">
            <div className="card register-card mt-5">
                <div className="card-body">

                    <div className="d-flex mb-1">
                        <button type="button" className="btn-close btn-close-modal" data-bs-dismiss="modal" aria-label="Close" />
                    </div>

                    <h2 className="card-title text-center">Create an account</h2>
                    <h6 className="card-subtitle mb-3 register-card-subtitle text-end me-4 pe-2">
                        Already have an account?&nbsp;
                        <button type="button" onClick={onSwitch} className="btn btn-link register-card-subtitle ps-1">
                            Sign In
                        </button>
                    </h6>

                    <form onSubmit={handleSubmit}>
                        <div className="mx-4">

                            {/* Email */}
                            <label className="form-label mb-0 mt-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-100 border-0 rounded-2 btn-register-card-border"
                                autoComplete="email"
                                required
                            />
                            {errorEmail && (
                                <p className="text-danger mt-1 register-message-errors">{errorEmail}</p>
                            )}

                            {/* Password */}
                            <label className="form-label mt-2 mb-0">Password</label>
                            <div className="d-flex btn-register-card-border rounded-2">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-100 border-0"
                                    autoComplete="new-password"
                                />
                                <span
                                    className="input-group-text border-0 bg-white"
                                    role="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </span>
                            </div>
                            {passwordErrors.length > 0 && (
                                <p className="text-warning mt-1 register-message-errors">
                                    Password must contain {passwordErrors.join(', ')}.
                                </p>
                            )}

                            {/* Repeat Password */}
                            <label className="form-label mb-0 mt-2">Repeat Password</label>
                            <input
                                type="password"
                                name="repeatPassword"
                                placeholder="Repeat password"
                                value={formData.repeatPassword}
                                onChange={handleChange}
                                className="w-100 rounded-2 btn-register-card-border"
                                autoComplete="new-password"
                            />
                            {errorPassword && (
                                <p className="text-danger mt-1 register-message-errors">{errorPassword}</p>
                            )}

                            {/* ── Terms & Conditions inline ────────────────── */}
                            <div className="register-terms-section">
                                <div className="register-terms-check-row">
                                    <input
                                        type="checkbox"
                                        id="termsCheckbox"
                                        checked={termsAccepted}
                                        onChange={e => {
                                            setTermsAccepted(e.target.checked);
                                            if (e.target.checked) setErrorTerms('');
                                        }}
                                        className="register-terms-checkbox"
                                    />
                                    <label htmlFor="termsCheckbox" className="register-terms-label">
                                        I agree to the&nbsp;
                                        <button
                                            type="button"
                                            className="register-terms-toggle"
                                            onClick={() => setTermsOpen(o => !o)}
                                            aria-expanded={termsOpen}
                                        >
                                            Terms &amp; Conditions
                                            <i
                                                className={`fa-solid fa-chevron-${termsOpen ? 'up' : 'down'} ms-1`}
                                                style={{ fontSize: '0.65rem' }}
                                            />
                                        </button>
                                    </label>
                                </div>

                                {termsOpen && (
                                    <div className="register-terms-body">
                                        <TermsText />
                                    </div>
                                )}

                                {errorTerms && (
                                    <p className="text-danger register-message-errors mt-1">{errorTerms}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-100 rounded-2 mt-3 text-white bg-black btn-register-card-border register-submit-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? <><i className="fa-solid fa-spinner fa-spin me-2" />Creating account…</>
                                    : 'Continue'}
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
