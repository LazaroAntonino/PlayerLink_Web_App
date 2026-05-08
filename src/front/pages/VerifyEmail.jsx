import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import userServices from "../services/userServices.js";
import "./verifyEmail.css";

// ─────────────────────────────────────────────────────────────────────────────
// States:  loading | success | error | resent
// ─────────────────────────────────────────────────────────────────────────────

export const VerifyEmail = () => {
    const [searchParams]                = useSearchParams();
    const navigate                      = useNavigate();
    const { dispatch }                  = useGlobalReducer();

    const [status, setStatus]           = useState("loading"); // loading | success | error
    const [errorMsg, setErrorMsg]       = useState("");
    const [resendEmail, setResendEmail] = useState("");
    const [resendStatus, setResendStatus] = useState("idle"); // idle | sending | sent | error

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setErrorMsg("No verification token found in the URL.");
            setStatus("error");
            return;
        }

        (async () => {
            try {
                const data = await userServices.verifyEmail(token);
                if (data?.success && data?.token) {
                    localStorage.setItem("token", data.token);
                    const userInfo = await userServices.getUserInfo();
                    const parsedUser =
                        userInfo?.user ?? JSON.parse(localStorage.getItem("user"));
                    dispatch({ type: "getUserInfo", payload: parsedUser });
                    setStatus("success");
                    // Navigate after a brief success flash
                    setTimeout(() => navigate("/onboarding"), 1800);
                } else {
                    setErrorMsg(data?.error || "Invalid or expired verification link.");
                    setStatus("error");
                }
            } catch {
                setErrorMsg("Network error. Please try again.");
                setStatus("error");
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleResend = async () => {
        if (!resendEmail) return;
        setResendStatus("sending");
        try {
            await userServices.resendVerification(resendEmail);
            setResendStatus("sent");
        } catch {
            setResendStatus("error");
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="verify-email-page">
            <div className="verify-email-card">

                {/* ── Loading ────────────────────────────────────── */}
                {status === "loading" && (
                    <>
                        <i className="fa-solid fa-circle-notch fa-spin verify-email-icon" />
                        <h2 className="verify-email-title">Verifying your email…</h2>
                        <p className="verify-email-subtitle">Please wait a moment.</p>
                    </>
                )}

                {/* ── Success ────────────────────────────────────── */}
                {status === "success" && (
                    <>
                        <i className="fa-solid fa-circle-check verify-email-icon verify-email-icon--success" />
                        <h2 className="verify-email-title">Email verified!</h2>
                        <p className="verify-email-subtitle">
                            Your account is active. Taking you to the app…
                        </p>
                    </>
                )}

                {/* ── Error ──────────────────────────────────────── */}
                {status === "error" && (
                    <>
                        <i className="fa-solid fa-circle-xmark verify-email-icon verify-email-icon--error" />
                        <h2 className="verify-email-title">Verification failed</h2>
                        <p className="verify-email-subtitle">{errorMsg}</p>

                        <div className="verify-email-resend">
                            <p className="verify-email-resend-label">
                                Need a new link? Enter your email:
                            </p>
                            <div className="verify-email-resend-row">
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={resendEmail}
                                    onChange={e => setResendEmail(e.target.value)}
                                    className="verify-email-input"
                                />
                                <button
                                    type="button"
                                    className="verify-email-btn"
                                    onClick={handleResend}
                                    disabled={
                                        !resendEmail ||
                                        resendStatus === "sending" ||
                                        resendStatus === "sent"
                                    }
                                >
                                    {resendStatus === "sending" ? (
                                        <i className="fa-solid fa-spinner fa-spin" />
                                    ) : (
                                        "Resend"
                                    )}
                                </button>
                            </div>
                            {resendStatus === "sent" && (
                                <p className="verify-email-resend-ok">
                                    <i className="fa-solid fa-circle-check me-1" />
                                    New verification email sent!
                                </p>
                            )}
                            {resendStatus === "error" && (
                                <p className="verify-email-resend-fail">
                                    Something went wrong. Please try again.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            className="verify-email-home-btn"
                            onClick={() => navigate("/")}
                        >
                            Back to Home
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};
