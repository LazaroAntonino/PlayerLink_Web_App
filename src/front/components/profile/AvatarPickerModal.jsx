// AvatarPickerModal.jsx
// Modal de selección de avatar: muestra la galería de fotos disponibles y
// permite al usuario cambiar su avatar. Solo se renderiza cuando show === true.

import PropTypes from "prop-types";

export const AvatarPickerModal = ({
    show,
    photoArray,
    selectedPhotoKey,
    onSelect,
    onClose,
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Choose your avatar">
            <div className="avatar-modal">
                <h3>Choose Your Avatar</h3>

                <div className="avatar-grid">
                    {photoArray.map(({ key, file }, idx) => (
                        <img
                            key={key}
                            src={file}
                            alt={`Avatar option ${idx + 1}`}
                            className={key === selectedPhotoKey ? "selected" : ""}
                            onClick={() => onSelect(key)}
                            role="button"
                            aria-pressed={key === selectedPhotoKey}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && onSelect(key)}
                        />
                    ))}
                </div>

                <button className="cancel-btn" onClick={onClose} aria-label="Close avatar picker">
                    Cancel
                </button>
            </div>
        </div>
    );
};

AvatarPickerModal.propTypes = {
    /** Controls visibility of the modal */
    show: PropTypes.bool.isRequired,
    /** Array of { key, file } avatar objects */
    photoArray: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            file: PropTypes.string.isRequired,
        })
    ).isRequired,
    /** Key of the currently selected avatar (e.g. "photo1") */
    selectedPhotoKey: PropTypes.string.isRequired,
    /** Called with the selected avatar key */
    onSelect: PropTypes.func.isRequired,
    /** Closes the modal without saving */
    onClose: PropTypes.func.isRequired,
};
