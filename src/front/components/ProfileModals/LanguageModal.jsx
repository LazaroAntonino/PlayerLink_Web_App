import React from "react";
import ReactDOM from "react-dom";
import "./ProfileModals.css";

const languages = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Italian", "Japanese", "Korean", "Chinese", "Mandalorian",
  "Thalassian", "Klingon", "Sindarin", "Renegade", "Orcish"
];

export const LanguageModal = ({ selected, setSelected, onSave, onCancel }) => {
  const toggleLanguage = (language) => {
    setSelected((prev) => {
      if (prev.includes(language)) return prev.filter((item) => item !== language);
      if (prev.length < 5) return [...prev, language];
      return prev;
    });
  };

  const modal = (
    <div className="pl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pl-modal-box">
        {/* Header */}
        <div className="pl-modal-header">
          <span className="pl-modal-title">Languages</span>
          <span className="pl-modal-counter">{selected.length}/5 selected</span>
          <button className="pl-modal-close" onClick={onCancel} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="pl-modal-subtitle">Choose up to 5 languages you speak</p>

        {/* Options grid */}
        <div className="pl-checkbox-grid">
          {languages.map((language) => {
            const isChecked = selected.includes(language);
            const isDisabled = !isChecked && selected.length >= 5;
            return (
              <label
                key={language}
                className={`pl-chip${isChecked ? " pl-chip--active" : ""}${isDisabled ? " pl-chip--disabled" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggleLanguage(language)}
                  className="pl-chip-input"
                />
                {isChecked && <i className="fa-solid fa-check pl-chip-check" aria-hidden="true"></i>}
                {language}
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pl-modal-footer">
          <button className="pl-btn pl-btn--ghost pl-btn--sm" onClick={onCancel}>Cancel</button>
          <button className="pl-btn pl-btn--primary" onClick={onSave}>
            <i className="fa-solid fa-check me-2"></i>Save languages
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};


