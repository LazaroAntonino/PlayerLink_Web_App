import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../components/onboarding/onboarding.css";

import { OnboardingProgress } from "../components/onboarding/OnboardingProgress.jsx";
import { Step1_Avatar } from "../components/onboarding/Step1_Avatar.jsx";
import { Step2_Games } from "../components/onboarding/Step2_Games.jsx";
import { Step3_Platforms } from "../components/onboarding/Step3_Platforms.jsx";
import { Step4_PlayStyle } from "../components/onboarding/Step4_PlayStyle.jsx";
import { Step5_Preview } from "../components/onboarding/Step5_Preview.jsx";

import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import gameServices from "../services/gameServices.js";
import userServices from "../services/userServices.js";

const LS_KEY = "playerlink_onboarding";
const TOTAL = 5;

const DEFAULT_DATA = {
    nick_name: "",
    photo: "photo1",
    games: [],     // [{ title, image, hours_played }]
    platforms: [],     // ["PC", "PS5", …]
    playStyle: "",
};

/**
 * Comprueba si el perfil del usuario ya está completo para saltar el onboarding.
 * Consideramos "completo" si tiene nick_name distinto de null/Undefinied/"".
 */
const profileIsComplete = (user) => {
    const nick = user?.profile?.nick_name;
    return nick && nick !== "Undefinied" && nick.trim() !== "";
};

// ─────────────────────────────────────────────────────────────────────────────

const Onboarding = () => {
    const navigate = useNavigate();
    const { store, dispatch } = useGlobalReducer();

    // ── Inicializar estado desde localStorage si hay progreso guardado ──
    const [step, setStep] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY));
            return saved?.step ?? 1;
        } catch { return 1; }
    });

    const [onboardingData, setOnboardingData] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(LS_KEY));
            return saved?.data ? { ...DEFAULT_DATA, ...saved.data } : DEFAULT_DATA;
        } catch { return DEFAULT_DATA; }
    });

    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState("");

    // ── Redirigir si no hay sesión ──
    useEffect(() => {
        if (!store.user || store.user === "undefined") {
            navigate("/");
        }
    }, [store.user, navigate]);

    // ── Saltar onboarding si perfil ya está completo ──
    useEffect(() => {
        if (store.user && profileIsComplete(store.user)) {
            navigate("/private");
        }
    }, [store.user, navigate]);

    // ── Persistir progreso en localStorage al cambiar step o datos ──
    useEffect(() => {
        localStorage.setItem(LS_KEY, JSON.stringify({ step, data: onboardingData }));
    }, [step, onboardingData]);

    // ── Actualizar campos del onboardingData (merge parcial) ──
    const handleChange = useCallback((partial) => {
        setOnboardingData(prev => ({ ...prev, ...partial }));
    }, []);

    const goNext = () => setStep(s => Math.min(s + 1, TOTAL));
    const goBack = () => setStep(s => Math.max(s - 1, 1));
    const goTo = (n) => setStep(n);

    // ── Publicar perfil en el backend ──
    const handlePublish = async () => {
        setPublishing(true);
        setPublishError("");

        const user = store.user;
        if (!user?.id) {
            setPublishError("Session not found. Please sign in again.");
            setPublishing(false);
            return;
        }

        // Construir el campo `preferences` en formato estándar: "A, B and C."
        const prefItems = [
            ...onboardingData.platforms,
            onboardingData.playStyle,
        ].filter(Boolean);
        let preferences;
        if (prefItems.length === 0) {
            preferences = "";
        } else if (prefItems.length === 1) {
            preferences = prefItems[0] + ".";
        } else {
            const last = prefItems[prefItems.length - 1];
            const rest = prefItems.slice(0, -1).join(", ");
            preferences = `${rest} and ${last}.`;
        }

        const profilePayload = {
            nick_name: onboardingData.nick_name,
            photo: onboardingData.photo,
            preferences: preferences || null,
        };

        try {
            // PUT si el usuario ya tiene perfil (siempre tras el registro); POST como fallback
            const method = user.profile ? "PUT" : "POST";
            const savedProfile = await userServices.updateProfile(user.id, profilePayload, method);

            // Guardar juegos uno a uno
            for (const game of onboardingData.games) {
                try {
                    await gameServices.postNewGame(savedProfile.id, {
                        title: game.title,
                        image: game.image,
                        hours_played: game.hours_played ?? 0,
                    });
                } catch (gameErr) {
                    console.warn("Error saving game:", game.title, gameErr);
                    // No abortar por un juego fallido
                }
            }

            // Refrescar el store con los datos actualizados
            const updatedUser = await userServices.getUserInfo();
            const parsed = updatedUser?.user ?? JSON.parse(localStorage.getItem("user"));
            dispatch({ type: "refreshUser", payload: parsed });

            // Limpiar onboarding del localStorage
            localStorage.removeItem(LS_KEY);

            navigate("/private");
        } catch (err) {
            console.error("Error in onboarding publish:", err);
            setPublishError(err.message || "Unexpected error. Please try again.");
            setPublishing(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="onboarding-wrapper">
            {/* Logo / título */}
            <a href="/" className="onboarding-logo">PlayerLink</a>

            {/* Barra de progreso */}
            <OnboardingProgress currentStep={step} totalSteps={TOTAL} />

            {/* Card del paso activo */}
            <div className="onboarding-card">
                {step === 1 && (
                    <Step1_Avatar
                        data={onboardingData}
                        onChange={handleChange}
                        onNext={goNext}
                    />
                )}

                {step === 2 && (
                    <Step2_Games
                        data={onboardingData}
                        onChange={handleChange}
                        onNext={goNext}
                        onBack={goBack}
                    />
                )}

                {step === 3 && (
                    <Step3_Platforms
                        data={onboardingData}
                        onChange={handleChange}
                        onNext={goNext}
                        onBack={goBack}
                        onSkip={goNext}
                    />
                )}

                {step === 4 && (
                    <Step4_PlayStyle
                        data={onboardingData}
                        onChange={handleChange}
                        onNext={goNext}
                        onBack={goBack}
                        onSkip={goNext}
                    />
                )}

                {step === 5 && (
                    <Step5_Preview
                        data={onboardingData}
                        onPublish={handlePublish}
                        onGoToStep={goTo}
                        publishing={publishing}
                        publishError={publishError}
                    />
                )}
            </div>
        </div>
    );
};

export default Onboarding;
