import React from "react";
import ReactDOM from "react-dom";
import "./ProfileModals.css";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

// IMPORTANTE: este modal edita el campo `preferences` del perfil, que es un CSV
// mixto. El onboarding alimenta este campo con plataformas (Step3) + play style
// (Step4), así que las opciones aquí DEBEN incluir todo lo que onboarding pueda
// generar — de lo contrario "5 selected" no coincidiría con 5 chips marcados.
//
// Estructura de opciones:
//   • Platforms  → coinciden 1:1 con Step3_Platforms (PC, PS5, Xbox, Switch, Mobile, VR)
//   • Play style → coinciden 1:1 con Step4_PlayStyle (Competitivo, Roleplay, Casual…)
//   • Extras     → tags adicionales útiles para describir el estilo de juego
const OPTION_GROUPS = [
  {
    title: "Platforms",
    icon: "fa-solid fa-tower-broadcast",
    options: ["PC", "PS5", "Xbox", "Switch", "Mobile", "VR"],
  },
  {
    title: "Play style",
    icon: "fa-solid fa-trophy",
    options: ["Competitivo", "Casual", "Roleplay", "Speedrun", "Cooperativo", "Explorador"],
  },
  {
    title: "Vibes",
    icon: "fa-solid fa-sparkles",
    options: [
      "Tryhard", "Chill", "Adventurer", "Pro", "Creative",
      "MOBA", "Strategic", "Conversational", "Horror", "Survival",
    ],
  },
];

const MAX_SELECTED = 5;

export const GamingPreferencesModal = ({ selected, setSelected, onSave, onCancel }) => {
  useBodyScrollLock(true);

  const toggleOption = (option) => {
    setSelected((prev) => {
      if (prev.includes(option)) return prev.filter((item) => item !== option);
      if (prev.length < MAX_SELECTED) return [...prev, option];
      return prev;
    });
  };

  const modal = (
    <div className="pl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pl-modal-box">
        {/* Header */}
        <div className="pl-modal-header">
          <span className="pl-modal-title">Gaming Preferences</span>
          <span className="pl-modal-counter">{selected.length}/{MAX_SELECTED} selected</span>
          <button className="pl-modal-close" onClick={onCancel} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="pl-modal-subtitle">Choose up to {MAX_SELECTED} tags that describe how you play</p>

        {/* Grouped options */}
        <div className="pl-modal-groups">
          {OPTION_GROUPS.map((group) => (
            <div key={group.title} className="pl-group">
              <h4 className="pl-group-title">
                <i className={group.icon} aria-hidden="true" />
                <span>{group.title}</span>
              </h4>
              <div className="pl-checkbox-grid pl-checkbox-grid--inline">
                {group.options.map((option) => {
                  const isChecked = selected.includes(option);
                  const isDisabled = !isChecked && selected.length >= MAX_SELECTED;
                  return (
                    <label
                      key={option}
                      className={`pl-chip${isChecked ? " pl-chip--active" : ""}${isDisabled ? " pl-chip--disabled" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => toggleOption(option)}
                        className="pl-chip-input"
                      />
                      {isChecked && <i className="fa-solid fa-check pl-chip-check" aria-hidden="true"></i>}
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pl-modal-footer">
          <button className="pl-btn pl-btn--ghost pl-btn--sm" onClick={onCancel}>Cancel</button>
          <button className="pl-btn pl-btn--primary" onClick={onSave}>
            <i className="fa-solid fa-check me-2"></i>Save
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
