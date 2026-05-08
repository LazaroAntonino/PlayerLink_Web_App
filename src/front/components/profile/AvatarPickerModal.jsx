// AvatarPickerModal.jsx
// Modal with two tabs:
//   • "Choose Avatar" — pick from the preset gallery (9 local images)
//   • "Upload Photo"  — drag & drop or click to upload a real photo to Cloudinary
//
// Props:
//   show            {bool}     — controls visibility
//   photoArray      {Array}    — [{ key, file }] preset avatars
//   selectedPhotoKey {string}  — currently active key (or Cloudinary URL)
//   onSelect        {function} — called with preset key on preset selection
//   onUpload        {function} — async (file: File) => void  (throws on error)
//   onClose         {function} — close the modal

import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./AvatarPickerModal.css";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const AvatarPickerModal = ({
    show,
    photoArray,
    selectedPhotoKey,
    onSelect,
    onUpload,
    onClose,
}) => {
    const [modalTab, setModalTab] = useState("preset");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | error
    const [uploadError, setUploadError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Clean up object URL to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Reset all upload state every time the modal is closed
    useEffect(() => {
        if (!show) {
            setModalTab("preset");
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setUploadStatus("idle");
            setUploadError("");
            setDragOver(false);
        }
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!show) return null;

    // ── File validation ───────────────────────────────────────────────────────
    const validateAndSetFile = (file) => {
        if (!file) return;
        setUploadError("");

        if (!ALLOWED_TYPES.has(file.type)) {
            setUploadError("Only JPEG, PNG, WebP or GIF images are allowed.");
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setUploadError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setUploadStatus("idle");
    };

    const handleInputChange = (e) => validateAndSetFile(e.target.files[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        validateAndSetFile(e.dataTransfer.files[0]);
    };

    // ── Upload handler ────────────────────────────────────────────────────────
    const handleUploadClick = async () => {
        if (!selectedFile || uploadStatus === "uploading") return;
        setUploadStatus("uploading");
        setUploadError("");
        try {
            await onUpload(selectedFile);
            // onUpload is expected to close the modal on success.
            // If we still reach here, reset to idle gracefully.
            setUploadStatus("idle");
        } catch (err) {
            setUploadStatus("error");
            setUploadError(err?.message || "Upload failed. Please try again.");
        }
    };

    // ── Overlay click to close ────────────────────────────────────────────────
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className="avatar-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Change your avatar"
            onClick={handleOverlayClick}
        >
            <div className="avatar-modal">

                {/* ── Header ── */}
                <div className="avatar-modal-header">
                    <h3 className="avatar-modal-title">Change Avatar</h3>
                    <button
                        type="button"
                        className="avatar-modal-close"
                        onClick={onClose}
                        aria-label="Close avatar picker"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {/* ── Tab switcher ── */}
                <div className="avatar-modal-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={modalTab === "preset"}
                        className={`avatar-tab-btn${modalTab === "preset" ? " active" : ""}`}
                        onClick={() => setModalTab("preset")}
                    >
                        <i className="fa-solid fa-images" aria-hidden="true" />
                        Choose Avatar
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={modalTab === "upload"}
                        className={`avatar-tab-btn${modalTab === "upload" ? " active" : ""}`}
                        onClick={() => setModalTab("upload")}
                    >
                        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                        Upload Photo
                    </button>
                </div>

                {/* ══ Preset tab ════════════════════════════════════════════ */}
                {modalTab === "preset" && (
                    <div
                        className="avatar-grid"
                        role="listbox"
                        aria-label="Available avatars"
                    >
                        {photoArray.map(({ key, file }, idx) => (
                            <button
                                key={key}
                                type="button"
                                role="option"
                                aria-selected={key === selectedPhotoKey}
                                aria-label={`Avatar option ${idx + 1}`}
                                className={`avatar-grid-item${key === selectedPhotoKey ? " selected" : ""}`}
                                onClick={() => onSelect(key)}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && onSelect(key)}
                            >
                                <img src={file} alt={`Avatar ${idx + 1}`} />
                                {key === selectedPhotoKey && (
                                    <span className="avatar-check" aria-hidden="true">
                                        <i className="fa-solid fa-check" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ══ Upload tab ════════════════════════════════════════════ */}
                {modalTab === "upload" && (
                    <div className="avatar-upload-tab">

                        {/* Drop zone */}
                        <div
                            className={[
                                "avatar-dropzone",
                                dragOver ? "drag-over" : "",
                                previewUrl ? "has-preview" : "",
                            ].filter(Boolean).join(" ")}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Click or drag to select a photo"
                            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                        >
                            {/* Hidden native input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="avatar-file-input"
                                onChange={handleInputChange}
                                aria-hidden="true"
                                tabIndex={-1}
                            />

                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview of selected photo"
                                    className="avatar-preview-img"
                                />
                            ) : (
                                <div className="avatar-dropzone-placeholder" aria-hidden="true">
                                    <i className="fa-solid fa-cloud-arrow-up" />
                                    <p>Drag &amp; drop or click to select</p>
                                    <span>JPEG, PNG, WebP or GIF · max {MAX_SIZE_MB} MB</span>
                                </div>
                            )}
                        </div>

                        {/* Change file shortcut */}
                        {previewUrl && (
                            <button
                                type="button"
                                className="avatar-change-file-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <i className="fa-solid fa-rotate me-1" aria-hidden="true" />
                                Choose a different photo
                            </button>
                        )}

                        {/* Validation / upload error */}
                        {uploadError && (
                            <p className="avatar-upload-error" role="alert">
                                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                                {uploadError}
                            </p>
                        )}

                        {/* Upload CTA */}
                        <button
                            type="button"
                            className="avatar-upload-btn"
                            onClick={handleUploadClick}
                            disabled={!selectedFile || uploadStatus === "uploading"}
                        >
                            {uploadStatus === "uploading" ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                                    Upload Photo
                                </>
                            )}
                        </button>

                    </div>
                )}

            </div>
        </div>
    );
};

AvatarPickerModal.propTypes = {
    show: PropTypes.bool.isRequired,
    photoArray: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            file: PropTypes.string.isRequired,
        })
    ).isRequired,
    selectedPhotoKey: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
    /** Async function (file: File) => void. Should throw on failure. */
    onUpload: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

