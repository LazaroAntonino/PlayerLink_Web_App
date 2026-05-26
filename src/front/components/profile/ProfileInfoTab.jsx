// ProfileInfoTab.jsx
// Pestaña "Info" del perfil — lectura y edición.
// Estructura: 5 secciones temáticas con iconos para una jerarquía visual clara.
//   1. About me  → Bio
//   2. Personal  → Name, Nickname, Age, Gender, Zodiac
//   3. Location & Languages
//   4. Gaming style → Preferences
//   5. Connect → Discord, Steam
//
// Misma estructura en read y edit mode para que el usuario no se pierda.

import PropTypes from "prop-types";
import { GamingPreferencesModal } from "../ProfileModals/GamingPreferencesModal.jsx";
import { LanguageModal } from "../ProfileModals/LanguageModal.jsx";

const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const GENDERS = ["Male", "Female", "Undefined"];

// ─── Helpers ────────────────────────────────────────────────────────────────

const isEmpty = (v) =>
    v == null ||
    v === "" ||
    v === 0 ||
    v === "0" ||
    v === "Undefined" ||
    v === "Undefinied" ||
    (typeof v === "string" && v.trim().length === 0);

/** Lee modo lectura — valor o placeholder */
const ReadValue = ({ value, placeholder = "Not set" }) =>
    isEmpty(value)
        ? <span className="pinfo-empty">{placeholder}</span>
        : <span className="pinfo-value">{value}</span>;

/** Convierte preferencias/idiomas (string formateado o array) en chips */
const renderChips = (raw, accent = false) => {
    const list = Array.isArray(raw)
        ? raw
        : (raw || "")
            .replace(/\.$/, "")
            .split(/, | and /)
            .map(s => s.trim())
            .filter(s => s && s !== "Undefined" && s !== "Undefinied");

    if (list.length === 0) return null;
    return (
        <div className="pinfo-chips">
            {list.map((item, i) => (
                <span key={i} className={`pinfo-chip${accent ? " pinfo-chip--accent" : ""}`}>
                    {item}
                </span>
            ))}
        </div>
    );
};

// ─── Componente ────────────────────────────────────────────────────────────

export const ProfileInfoTab = ({
    profile,
    isEditing,
    onInputChange,
    onEditStart,
    showGamingPreferencesModal,
    setShowGamingPreferencesModal,
    selectedGamingPreferences,
    setSelectedGamingPreferences,
    showLanguageModal,
    setShowLanguageModal,
    selectedLanguages,
    setSelectedLanguages,
    formatPreferences,
}) => {

    const preferencesChips = renderChips(profile.preferences);
    const languagesChips = renderChips(profile.language, true);

    return (
        <div className="info-section pinfo-root">

            {/* ════════ 1. ABOUT ME ════════ */}
            <section className="pinfo-section">
                <header className="pinfo-section-head">
                    <span className="pinfo-section-icon"><i className="fa-solid fa-feather" /></span>
                    <h3 className="pinfo-section-title">About me</h3>
                </header>

                <div className="pinfo-card pinfo-card--full">
                    {isEditing ? (
                        <>
                            <label className="pinfo-input-label" htmlFor="bio-textarea">Bio</label>
                            <textarea
                                id="bio-textarea"
                                className="pinfo-textarea"
                                rows={4}
                                maxLength={500}
                                value={profile.bio}
                                onChange={(e) => onInputChange("bio", e.target.value)}
                                placeholder="Tell other players a bit about yourself..."
                                aria-label="Bio"
                            />
                            <span className="pinfo-help">
                                {(profile.bio?.length || 0)}/500 characters
                            </span>
                        </>
                    ) : (
                        isEmpty(profile.bio) ? (
                            <p className="pinfo-empty-block">
                                <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                                No bio yet. Tell others what kind of player you are.
                            </p>
                        ) : (
                            <p className="pinfo-bio-text">{profile.bio}</p>
                        )
                    )}
                </div>
            </section>

            {/* ════════ 2. PERSONAL ════════ */}
            <section className="pinfo-section">
                <header className="pinfo-section-head">
                    <span className="pinfo-section-icon"><i className="fa-solid fa-id-card" /></span>
                    <h3 className="pinfo-section-title">Personal</h3>
                </header>

                <div className="pinfo-grid pinfo-grid--2col">
                    {/* Name */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-signature" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Name</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="pinfo-input"
                                    value={profile.name}
                                    onChange={(e) => onInputChange("name", e.target.value)}
                                    maxLength={11}
                                    placeholder="Your real name"
                                    aria-label="Name"
                                />
                            ) : (
                                <ReadValue value={profile.name} placeholder="Add your name" />
                            )}
                        </div>
                    </div>

                    {/* Nickname */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon pinfo-card-icon--accent"><i className="fa-solid fa-user-ninja" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Nickname</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="pinfo-input"
                                    value={profile.nick_name}
                                    onChange={(e) => onInputChange("nick_name", e.target.value)}
                                    maxLength={11}
                                    placeholder="Your gamer tag"
                                    aria-label="Nickname"
                                />
                            ) : (
                                <ReadValue value={profile.nick_name} placeholder="Add your tag" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="pinfo-grid pinfo-grid--3col">
                    {/* Age */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-cake-candles" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Age</span>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="pinfo-input"
                                    value={profile.age || ""}
                                    onChange={(e) => onInputChange("age", +e.target.value)}
                                    max={120}
                                    min={1}
                                    placeholder="Years"
                                    aria-label="Age"
                                />
                            ) : (
                                <ReadValue value={profile.age > 0 ? `${profile.age} years` : null} placeholder="—" />
                            )}
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-venus-mars" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Gender</span>
                            {isEditing ? (
                                <select
                                    className="pinfo-input pinfo-select"
                                    value={profile.gender}
                                    onChange={(e) => onInputChange("gender", e.target.value)}
                                    aria-label="Gender"
                                >
                                    <option value="">— Pick —</option>
                                    {GENDERS.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            ) : (
                                <ReadValue
                                    value={profile.gender !== "Undefined" && profile.gender !== "Undefinied" ? profile.gender : null}
                                    placeholder="—"
                                />
                            )}
                        </div>
                    </div>

                    {/* Zodiac */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-star-and-crescent" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Zodiac</span>
                            {isEditing ? (
                                <select
                                    className="pinfo-input pinfo-select"
                                    value={profile.zodiac}
                                    onChange={(e) => onInputChange("zodiac", e.target.value)}
                                    aria-label="Zodiac sign"
                                >
                                    <option value="">— Pick —</option>
                                    {ZODIAC_SIGNS.map((z) => (
                                        <option key={z} value={z}>{z}</option>
                                    ))}
                                </select>
                            ) : (
                                <ReadValue
                                    value={profile.zodiac && profile.zodiac !== "Undefinied" ? profile.zodiac : null}
                                    placeholder="—"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════ 3. LOCATION & LANGUAGES ════════ */}
            <section className="pinfo-section">
                <header className="pinfo-section-head">
                    <span className="pinfo-section-icon"><i className="fa-solid fa-earth-americas" /></span>
                    <h3 className="pinfo-section-title">Where & Language</h3>
                </header>

                <div className="pinfo-grid pinfo-grid--2col">
                    {/* Location */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-location-dot" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Location</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="pinfo-input"
                                    value={profile.location}
                                    onChange={(e) => onInputChange("location", e.target.value)}
                                    maxLength={20}
                                    placeholder="City, Country"
                                    aria-label="Location"
                                />
                            ) : (
                                <ReadValue value={profile.location} placeholder="Add your city" />
                            )}
                        </div>
                    </div>

                    {/* Languages — chips or modal */}
                    <div className="pinfo-card pinfo-card--col">
                        <div className="pinfo-card-row">
                            <div className="pinfo-card-icon pinfo-card-icon--accent"><i className="fa-solid fa-language" /></div>
                            <div className="pinfo-card-content">
                                <span className="pinfo-card-label">Languages</span>
                                {isEditing ? (
                                    <button
                                        type="button"
                                        className="pinfo-chip-btn"
                                        onClick={() => setShowLanguageModal(true)}
                                    >
                                        <i className="fa-solid fa-pen-to-square me-1" aria-hidden="true" />
                                        {selectedLanguages.length > 0
                                            ? `${selectedLanguages.length} selected`
                                            : "Choose languages"}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        {isEditing ? (
                            selectedLanguages.length > 0 && (
                                <div className="pinfo-chips" style={{ marginTop: 8 }}>
                                    {selectedLanguages.map((l, i) => (
                                        <span key={i} className="pinfo-chip pinfo-chip--accent">{l}</span>
                                    ))}
                                </div>
                            )
                        ) : (
                            languagesChips ?? <span className="pinfo-empty">No languages</span>
                        )}

                        {showLanguageModal && (
                            <LanguageModal
                                selected={selectedLanguages}
                                setSelected={setSelectedLanguages}
                                onSave={() => {
                                    onInputChange("language", formatPreferences(selectedLanguages));
                                    setShowLanguageModal(false);
                                }}
                                onCancel={() => setShowLanguageModal(false)}
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* ════════ 4. GAMING STYLE ════════ */}
            <section className="pinfo-section">
                <header className="pinfo-section-head">
                    <span className="pinfo-section-icon"><i className="fa-solid fa-gamepad" /></span>
                    <h3 className="pinfo-section-title">Gaming style</h3>
                </header>

                <div className="pinfo-card pinfo-card--col">
                    <div className="pinfo-card-row">
                        <div className="pinfo-card-icon"><i className="fa-solid fa-tags" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Preferences</span>
                            {isEditing ? (
                                <button
                                    type="button"
                                    className="pinfo-chip-btn"
                                    onClick={() => setShowGamingPreferencesModal(true)}
                                >
                                    <i className="fa-solid fa-pen-to-square me-1" aria-hidden="true" />
                                    {selectedGamingPreferences.length > 0
                                        ? `${selectedGamingPreferences.length} selected`
                                        : "Choose preferences"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                    {isEditing ? (
                        selectedGamingPreferences.length > 0 && (
                            <div className="pinfo-chips" style={{ marginTop: 8 }}>
                                {selectedGamingPreferences.map((p, i) => (
                                    <span key={i} className="pinfo-chip">{p}</span>
                                ))}
                            </div>
                        )
                    ) : (
                        preferencesChips ?? <span className="pinfo-empty">No preferences set</span>
                    )}

                    {showGamingPreferencesModal && (
                        <GamingPreferencesModal
                            selected={selectedGamingPreferences}
                            setSelected={setSelectedGamingPreferences}
                            onSave={() => {
                                onInputChange("preferences", formatPreferences(selectedGamingPreferences));
                                setShowGamingPreferencesModal(false);
                            }}
                            onCancel={() => setShowGamingPreferencesModal(false)}
                        />
                    )}
                </div>
            </section>

            {/* ════════ 5. CONNECT ════════ */}
            <section className="pinfo-section">
                <header className="pinfo-section-head">
                    <span className="pinfo-section-icon"><i className="fa-solid fa-link" /></span>
                    <h3 className="pinfo-section-title">Connect with me</h3>
                    <span className="pinfo-section-hint">
                        <i className="fa-solid fa-eye me-1" aria-hidden="true" />
                        Visible to your matches
                    </span>
                </header>

                <div className="pinfo-grid pinfo-grid--2col">
                    {/* Discord */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon pinfo-card-icon--discord"><i className="fa-brands fa-discord" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Discord</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="pinfo-input"
                                    value={profile.discord}
                                    onChange={(e) => onInputChange("discord", e.target.value)}
                                    maxLength={30}
                                    placeholder="username#1234"
                                    aria-label="Discord"
                                />
                            ) : (
                                <ReadValue value={profile.discord} placeholder="Add Discord" />
                            )}
                        </div>
                    </div>

                    {/* Steam */}
                    <div className="pinfo-card">
                        <div className="pinfo-card-icon pinfo-card-icon--steam"><i className="fa-brands fa-steam" /></div>
                        <div className="pinfo-card-content">
                            <span className="pinfo-card-label">Steam Friend ID</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="pinfo-input"
                                    value={profile.steam_id}
                                    onChange={(e) => onInputChange("steam_id", e.target.value)}
                                    maxLength={30}
                                    placeholder="7656119xxxxxxxxxx"
                                    aria-label="Steam Friend ID"
                                />
                            ) : (
                                <ReadValue value={profile.steam_id} placeholder="Add Steam ID" />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════ Edit CTA (solo read mode) ════════ */}
            {!isEditing && (
                <div className="pinfo-edit-cta-wrapper">
                    <button
                        className="pinfo-edit-cta"
                        onClick={onEditStart}
                        aria-label="Edit profile"
                    >
                        <i className="fa-solid fa-pencil me-2" aria-hidden="true" />
                        Edit profile
                    </button>
                </div>
            )}
        </div>
    );
};

ProfileInfoTab.propTypes = {
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
    isEditing: PropTypes.bool.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onEditStart: PropTypes.func.isRequired,
    showGamingPreferencesModal: PropTypes.bool.isRequired,
    setShowGamingPreferencesModal: PropTypes.func.isRequired,
    selectedGamingPreferences: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSelectedGamingPreferences: PropTypes.func.isRequired,
    showLanguageModal: PropTypes.bool.isRequired,
    setShowLanguageModal: PropTypes.func.isRequired,
    selectedLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSelectedLanguages: PropTypes.func.isRequired,
    formatPreferences: PropTypes.func.isRequired,
};
