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

/** Muestra el valor de un campo o un placeholder en modo lectura */
const FieldValue = ({ value, emptyText = "Not set" }) => (
    <div className="profile-read-field">
        {value && String(value).trim().length > 0 && value !== "0" && value !== 0
            ? <span className="profile-field-value">{value}</span>
            : <span className="profile-field-empty">{emptyText}</span>
        }
    </div>
);

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
                    <label className="profile-field-label">Bio</label>
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
                        <label className="profile-field-label">{field === "nick_name" ? "Nickname" : "Name"}</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile[field]}
                                onChange={(e) => onInputChange(field, e.target.value)}
                                maxLength={11}
                                aria-label={field === "nick_name" ? "Nickname" : "Name"}
                            />
                        ) : (
                            <FieldValue value={profile[field]} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Age, Gender, Zodiac ── */}
            <div className="row">
                <div className="col-md-4">
                    <label className="profile-field-label">Age</label>
                    {isEditing ? (
                        <input
                            type="number"
                            value={profile.age || ""}
                            onChange={(e) => onInputChange("age", +e.target.value)}
                            max={120}
                            min={1}
                            placeholder="Your age"
                            aria-label="Age"
                        />
                    ) : (
                        <FieldValue value={profile.age > 0 ? profile.age : null} emptyText="Not set" />
                    )}
                </div>

                <div className="col-md-4">
                    <label className="profile-field-label">Gender</label>
                    {isEditing ? (
                        <select
                            value={profile.gender}
                            onChange={(e) => onInputChange("gender", e.target.value)}
                            aria-label="Gender"
                        >
                            <option value="">— Not set —</option>
                            {GENDERS.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    ) : (
                        <FieldValue
                            value={profile.gender && profile.gender !== "Undefined" && profile.gender !== "Undefinied" ? profile.gender : null}
                            emptyText="Not set"
                        />
                    )}
                </div>

                <div className="col-md-4">
                    <label className="profile-field-label">Zodiac</label>
                    {isEditing ? (
                        <select
                            value={profile.zodiac}
                            onChange={(e) => onInputChange("zodiac", e.target.value)}
                            aria-label="Zodiac sign"
                        >
                            <option value="">— Not set —</option>
                            {ZODIAC_SIGNS.map((z) => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    ) : (
                        <FieldValue
                            value={profile.zodiac && profile.zodiac !== "Undefinied" ? profile.zodiac : null}
                            emptyText="Not set"
                        />
                    )}
                </div>
            </div>

            {/* ── Discord & Steam ── */}
            <div className="row">
                {["discord", "steam_id"].map((field) => (
                    <div key={field} className="col-md-6">
                        <label className="profile-field-label d-flex align-items-center gap-2 mt-1 mb-1">
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
                            <FieldValue value={profile[field]} emptyText="Not set" />
                        )}
                    </div>
                ))}

                {/* ── Gaming Preferences ── */}
                <div className="gaming-prefs-box col-md-6">
                    <label className="profile-field-label">Gaming Preferences</label>
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
                        <FieldValue
                            value={
                                profile.preferences &&
                                    profile.preferences.trim().length > 0 &&
                                    profile.preferences !== "Undefinied" &&
                                    profile.preferences !== "Undefined"
                                    ? profile.preferences
                                    : null
                            }
                            emptyText="No preferences selected yet."
                        />
                    )}
                </div>

                {/* ── Location ── */}
                <div className="col-md-6">
                    <label className="profile-field-label">Location</label>
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
                        <FieldValue value={profile.location} emptyText="Not set" />
                    )}
                </div>

                {/* ── Languages ── */}
                <div className="col-md-12">
                    <div className="form-group">
                        <label className="profile-field-label">Languages</label>
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
                                                "language",
                                                formatPreferences(selectedLanguages)
                                            );
                                            setShowLanguageModal(false);
                                        }}
                                        onCancel={() => setShowLanguageModal(false)}
                                    />
                                )}
                            </>
                        ) : (
                            <FieldValue
                                value={profile.language || null}
                                emptyText="No languages selected."
                            />
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
        language: PropTypes.string,
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
