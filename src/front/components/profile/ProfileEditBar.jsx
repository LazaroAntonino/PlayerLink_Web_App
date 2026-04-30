// ProfileEditBar.jsx
// Barra de acciones del modo edición ("Editing profile" con botones Save / Cancel).
// Solo se renderiza cuando isEditing === true — la condición la gestiona el padre.

import PropTypes from "prop-types";

export const ProfileEditBar = ({ onCancel, onSave }) => {
    return (
        <div className="edit-mode-bar">
            <span className="edit-mode-label">
                <i className="fa-solid fa-pencil me-2" aria-hidden="true"></i>
                Editing profile
            </span>
            <div className="edit-mode-actions">
                <button className="edit-cancel-btn" onClick={onCancel} aria-label="Cancel editing">
                    <i className="fa-solid fa-xmark me-1" aria-hidden="true"></i>Cancel
                </button>
                <button className="edit-save-btn" onClick={onSave} aria-label="Save profile changes">
                    <i className="fa-solid fa-floppy-disk me-1" aria-hidden="true"></i>Save
                </button>
            </div>
        </div>
    );
};

ProfileEditBar.propTypes = {
    /** Called when the user clicks "Cancel" */
    onCancel: PropTypes.func.isRequired,
    /** Called when the user clicks "Save" */
    onSave: PropTypes.func.isRequired,
};
