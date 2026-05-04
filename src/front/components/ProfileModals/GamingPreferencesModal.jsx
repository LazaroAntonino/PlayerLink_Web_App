import React from "react";
import ReactDOM from "react-dom";
import "./ProfileModals.css";

const options = [
  "Tryhard", "Chill", "Adventurer", "Pro", "Competitive", "Creative",
  "MOBA", "PMA", "Designer", "Conversational", "Strategic", "Emotional",
  "Excited", "Horror", "Online Cooperative", "Co-op Campaign", "Survival",
  "Construction", "God mode"
];

export const GamingPreferencesModal = ({ selected, setSelected, onSave, onCancel }) => {
  const toggleOption = (option) => {
    setSelected((prev) => {
      if (prev.includes(option)) return prev.filter((item) => item !== option);
      if (prev.length < 5) return [...prev, option];
      return prev;
    });
  };

  const modal = (
    <div className="pl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pl-modal-box">
        {/* Header */}
        <div className="pl-modal-header">
          <span className="pl-modal-title">Gaming Preferences</span>
          <span className="pl-modal-counter">{selected.length}/5 selected</span>
          <button className="pl-modal-close" onClick={onCancel} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="pl-modal-subtitle">Choose up to 5 tags that describe your gaming style</p>

        {/* Options grid */}
        <div className="pl-checkbox-grid">
          {options.map((option) => {
            const isChecked = selected.includes(option);
            const isDisabled = !isChecked && selected.length >= 5;
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

        {/* Footer */}
        <div className="pl-modal-footer">
          <button className="pl-btn pl-btn--ghost pl-btn--sm" onClick={onCancel}>Cancel</button>
          <button className="pl-btn pl-btn--primary" onClick={onSave}>
            <i className="fa-solid fa-check me-2"></i>Save preferences
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

