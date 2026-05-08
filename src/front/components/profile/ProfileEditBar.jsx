// ProfileEditBar.jsx
// Barra de acciones del modo edición ("Editing profile" con botones Save / Cancel).
// Solo se renderiza cuando isEditing === true — la condición la gestiona el padre.

import PropTypes from "prop-types";

export const ProfileEditBar = ({ onCancel, onSave, isSaving = false, saveError = "" }) => {
    return (
        <div className="edit-mode-bar">
            <span className="edit-mode-label">
                <i className="fa-solid fa-pencil me-2" aria-hidden="true"></i>
                Editing profile
            </span>
            {saveError && (
                <span className="edit-mode-error" role="alert">
                    <i className="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
                    {saveError}
                </span>
            )}
            <div className="edit-mode-actions">
                <button className="edit-cancel-btn pl-btn pl-btn--ghost pl-btn--sm" onClick={onCancel} disabled={isSaving} aria-label="Cancel editing">
                    <i className="fa-solid fa-xmark me-1" aria-hidden="true"></i>Cancel
                </button>
                <button className="edit-save-btn pl-btn pl-btn--primary pl-btn--sm" onClick={onSave} disabled={isSaving} aria-label="Save profile changes">
                    {isSaving
                        ? <><i className="fa-solid fa-spinner fa-spin me-1" aria-hidden="true"></i>Saving…</>
                        : <><i className="fa-solid fa-floppy-disk me-1" aria-hidden="true"></i>Save</>
                    }
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
    /** Whether the save request is in flight */
    isSaving: PropTypes.bool,
    /** Error message to show if save failed */
    saveError: PropTypes.string,
};
