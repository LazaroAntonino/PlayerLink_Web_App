// ProfileInfoTab.jsx
// Pestaña "Info" del perfil: muestra y edita los campos del usuario.
// En modo lectura muestra los valores; en modo edición muestra inputs/selects.
// Los modales de preferencias e idiomas también viven aquí porque forman
// parte visual de esta sección.

import PropTypes from "prop-types";
import { GamingPreferencesModal } from "../ProfileModals/GamingPreferencesModal.jsx";
import { LanguageModal } from "../ProfileModals/LanguageModal.jsx";

const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const GENDERS = ["Male", "Female", "Undefined"];

export const ProfileInfoTab = ({
    profile,
    isEditing,
    onInputChange,
    onEditStart,
    // Gaming Preferences modal
    showGamingPreferencesModal,
    setShowGamingPreferencesModal,
    selectedGamingPreferences,
    setSelectedGamingPreferences,
    // Language modal
    showLanguageModal,
    setShowLanguageModal,
    selectedLanguages,
    setSelectedLanguages,
    // Helpers
    formatPreferences,
}) => {
    return (
        <div className="info-section container">

            {/* ── Bio ── */}
            <div className="row">
                <div className="col-12">
                    <label>Bio</label>
                    {isEditing ? (
                        <textarea
                            className="form-control textareastyle"
                            rows={3}
                            value={profile.bio}
                            onChange={(e) => onInputChange("bio", e.target.value)}
                            aria-label="Bio"
                        />
                    ) : (
                        <p className="bio-static-text">{profile.bio || "No bio yet."}</p>
                    )}
                </div>
            </div>

            {/* ── Name & Nickname ── */}
            <div className="row">
                {["name", "nick_name"].map((field) => (
                    <div key={field} className="col-md-6">
                        <label>{field === "nick_name" ? "Nickname" : "Name"}</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile[field]}
                                onChange={(e) => onInputChange(field, e.target.value)}
                                maxLength={11}
                                aria-label={field === "nick_name" ? "Nickname" : "Name"}
                            />
                        ) : (
                            <p>{profile[field]}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Age, Gender, Zodiac ── */}
            <div className="row">
                <div className="col-md-4">
                    <label>Age</label>
                    {isEditing ? (
                        <input
                            type="number"
                            value={profile.age}
                            onChange={(e) => onInputChange("age", +e.target.value)}
                            max={120}
                            min={1}
                            aria-label="Age"
                        />
                    ) : (
                        <p>{profile.age}</p>
                    )}
                </div>

                <div className="col-md-4">
                    <label>Gender</label>
                    {isEditing ? (
                        <select
                            value={profile.gender}
                            onChange={(e) => onInputChange("gender", e.target.value)}
                            aria-label="Gender"
                        >
                            {GENDERS.map((g) => (
                                <option key={g}>{g}</option>
                            ))}
                        </select>
                    ) : (
                        <p>{profile.gender}</p>
                    )}
                </div>

                <div className="col-md-4">
                    <label>Zodiac</label>
                    {isEditing ? (
                        <select
                            value={profile.zodiac}
                            onChange={(e) => onInputChange("zodiac", e.target.value)}
                            aria-label="Zodiac sign"
                        >
                            {ZODIAC_SIGNS.map((z) => (
                                <option key={z}>{z}</option>
                            ))}
                        </select>
                    ) : (
                        <p>{profile.zodiac}</p>
                    )}
                </div>
            </div>

            {/* ── Discord & Steam ── */}
            <div className="row">
                {["discord", "steam_id"].map((field) => (
                    <div key={field} className="col-md-6">
                        <label className="d-flex align-items-center gap-2 mt-1 mb-1">
                            {field === "steam_id" ? "Steam Friend ID" : "Discord"}
                            <span className="tooltip-wrapper">
                                <i
                                    className="fa-solid fa-circle-info fa-xl discord-info-icon"
                                    aria-hidden="true"
                                ></i>
                                <span className="tooltip-text discord-info-tooltip-text">
                                    <strong>Connect with your matches</strong>
                                    <div>
                                        The Discord or Steam info
                                        <br />
                                        in your profile will be <br />
                                        used by your matches
                                        <br />
                                        to reach out to you.
                                    </div>
                                </span>
                            </span>
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile[field]}
                                onChange={(e) => onInputChange(field, e.target.value)}
                                maxLength={30}
                                aria-label={field === "steam_id" ? "Steam Friend ID" : "Discord"}
                            />
                        ) : (
                            <p>{profile[field]}</p>
                        )}
                    </div>
                ))}

                {/* ── Gaming Preferences ── */}
                <div className="gaming-prefs-box col-md-6">
                    <label>Gaming Preferences</label>
                    {isEditing ? (
                        <>
                            <div className="section-container">
                                <button
                                    className="section-button"
                                    onClick={() => setShowGamingPreferencesModal(true)}
                                >
                                    Select Preferences
                                </button>
                                <p>
                                    {selectedGamingPreferences.length > 0
                                        ? formatPreferences(selectedGamingPreferences)
                                        : "No preferences selected yet."}
                                </p>
                            </div>
                            {showGamingPreferencesModal && (
                                <GamingPreferencesModal
                                    selected={selectedGamingPreferences}
                                    setSelected={setSelectedGamingPreferences}
                                    onSave={() => {
                                        onInputChange(
                                            "preferences",
                                            formatPreferences(selectedGamingPreferences)
                                        );
                                        setShowGamingPreferencesModal(false);
                                    }}
                                    onCancel={() => setShowGamingPreferencesModal(false)}
                                />
                            )}
                        </>
                    ) : (
                        <p>
                            {profile.preferences && profile.preferences.trim().length > 0
                                ? profile.preferences
                                : "No preferences selected yet."}
                        </p>
                    )}
                </div>

                {/* ── Location ── */}
                <div className="col-md-6">
                    <label>Location</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => onInputChange("location", e.target.value)}
                            maxLength={20}
                            minLength={4}
                            aria-label="Location"
                        />
                    ) : (
                        <p>{profile.location}</p>
                    )}
                </div>

                {/* ── Languages ── */}
                <div className="col-md-12">
                    <div className="form-group">
                        <label>Languages</label>
                        {isEditing ? (
                            <>
                                <div className="section-container">
                                    <button
                                        className="section-button"
                                        onClick={() => setShowLanguageModal(true)}
                                    >
                                        Select Languages
                                    </button>
                                    <p style={{ minHeight: "38px" }}>
                                        {selectedLanguages.length > 0
                                            ? formatPreferences(selectedLanguages)
                                            : "No languages selected."}
                                    </p>
                                </div>
                                {showLanguageModal && (
                                    <LanguageModal
                                        selected={selectedLanguages}
                                        setSelected={setSelectedLanguages}
                                        onSave={() => {
                                            onInputChange(
                                                "languages",
                                                formatPreferences(selectedLanguages)
                                            );
                                            setShowLanguageModal(false);
                                        }}
                                        onCancel={() => setShowLanguageModal(false)}
                                    />
                                )}
                            </>
                        ) : (
                            <p style={{ minHeight: "38px" }}>
                                {profile.languages ? profile.languages : "No languages selected."}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Edit button (view mode only) ── */}
            <div className="row mt-3">
                <div className="col text-left">
                    {!isEditing && (
                        <button className="edit-btn" onClick={onEditStart} aria-label="Edit profile">
                            <i className="fa-solid fa-pencil me-2" aria-hidden="true"></i>Edit profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

ProfileInfoTab.propTypes = {
    /** All profile field values */
    profile: PropTypes.shape({
        name: PropTypes.string,
        nick_name: PropTypes.string,
        age: PropTypes.number,
        gender: PropTypes.string,
        location: PropTypes.string,
        zodiac: PropTypes.string,
        discord: PropTypes.string,
        steam_id: PropTypes.string,
        languages: PropTypes.string,
        preferences: PropTypes.string,
        bio: PropTypes.string,
    }).isRequired,
    /** Whether the form is in edit mode */
    isEditing: PropTypes.bool.isRequired,
    /** Updates a single field in the profile state */
    onInputChange: PropTypes.func.isRequired,
    /** Activates edit mode */
    onEditStart: PropTypes.func.isRequired,
    // ── Gaming Preferences modal ──
    showGamingPreferencesModal: PropTypes.bool.isRequired,
    setShowGamingPreferencesModal: PropTypes.func.isRequired,
    selectedGamingPreferences: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSelectedGamingPreferences: PropTypes.func.isRequired,
    // ── Language modal ──
    showLanguageModal: PropTypes.bool.isRequired,
    setShowLanguageModal: PropTypes.func.isRequired,
    selectedLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSelectedLanguages: PropTypes.func.isRequired,
    /** Converts a preferences array to a display string */
    formatPreferences: PropTypes.func.isRequired,
};
