// AvatarPickerModal — selector de avatar con flujo "pending → apply" coherente.
// Dos modos:
//   • Preset: galería de 9 avatares predefinidos
//   • Upload: drag & drop / file picker → sube a Cloudinary
// El cambio NO se aplica instantáneamente: el usuario ve un preview grande arriba
// y confirma con "Apply" en el footer (mismo botón para ambos modos).

import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./AvatarPickerModal.css";
import { resolvePhoto } from "../../assets/photoAssets.js";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";

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

    // Preset pending — selección del usuario antes de pulsar Apply
    const [pendingPreset, setPendingPreset] = useState(null);

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | error
    const [uploadError, setUploadError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Bloquear scroll del body mientras el modal está abierto
    useBodyScrollLock(show);

    // Limpiar object URL al desmontar
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Reset state cada vez que el modal se abre/cierra
    useEffect(() => {
        if (!show) {
            setModalTab("preset");
            setPendingPreset(null);
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setUploadStatus("idle");
            setUploadError("");
            setDragOver(false);
        }
    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cerrar con Escape (solo si no está subiendo)
    useEffect(() => {
        if (!show) return;
        const handleKey = (e) => { if (e.key === "Escape" && uploadStatus !== "uploading") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [show, onClose, uploadStatus]);

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

    // ── Apply handler ────────────────────────────────────────────────────────
    const handleApply = async () => {
        if (modalTab === "preset") {
            if (!pendingPreset || pendingPreset === selectedPhotoKey) return;
            onSelect(pendingPreset);
            return;
        }
        // Upload tab
        if (!selectedFile || uploadStatus === "uploading") return;
        setUploadStatus("uploading");
        setUploadError("");
        try {
            await onUpload(selectedFile);
            setUploadStatus("idle");
        } catch (err) {
            setUploadStatus("error");
            setUploadError(err?.message || "Upload failed. Please try again.");
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && uploadStatus !== "uploading") onClose();
    };

    // ── Preview source ───────────────────────────────────────────────────────
    // Prioridad: file upload preview > preset pending > current selected
    const previewSrc =
        modalTab === "upload" && previewUrl
            ? previewUrl
            : modalTab === "preset" && pendingPreset
                ? photoArray.find(p => p.key === pendingPreset)?.file
                : resolvePhoto(selectedPhotoKey);

    const hasPendingChange =
        (modalTab === "preset" && pendingPreset && pendingPreset !== selectedPhotoKey) ||
        (modalTab === "upload" && selectedFile && uploadStatus !== "uploading");

    const isUploading = uploadStatus === "uploading";

    const applyLabel = modalTab === "upload"
        ? (isUploading ? "Uploading…" : "Upload & apply")
        : "Apply";

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
                    <div className="avatar-modal-titles">
                        <h3 className="avatar-modal-title">Your avatar</h3>
                        <p className="avatar-modal-subtitle">Pick a preset or upload your own</p>
                    </div>
                    <button
                        type="button"
                        className="avatar-modal-close"
                        onClick={onClose}
                        aria-label="Close avatar picker"
                        disabled={isUploading}
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                {/* ── Live preview ── */}
                <div className="avatar-preview-section">
                    <div className={`avatar-preview-ring${hasPendingChange ? " is-pending" : ""}`}>
                        <img
                            src={previewSrc}
                            alt="Avatar preview"
                            className="avatar-preview-img-main"
                        />
                        {hasPendingChange && (
                            <span className="avatar-preview-badge" aria-label="Pending change">
                                <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" />
                                New
                            </span>
                        )}
                    </div>
                    <p className="avatar-preview-caption">
                        {hasPendingChange
                            ? <><i className="fa-solid fa-eye me-1" aria-hidden="true" />Preview · not saved yet</>
                            : <><i className="fa-solid fa-check me-1" aria-hidden="true" />Current avatar</>
                        }
                    </p>
                </div>

                {/* ── Tab switcher ── */}
                <div className="avatar-modal-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={modalTab === "preset"}
                        className={`avatar-tab-btn${modalTab === "preset" ? " active" : ""}`}
                        onClick={() => setModalTab("preset")}
                        disabled={isUploading}
                    >
                        <i className="fa-solid fa-grip" aria-hidden="true" />
                        <span>Presets</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={modalTab === "upload"}
                        className={`avatar-tab-btn${modalTab === "upload" ? " active" : ""}`}
                        onClick={() => setModalTab("upload")}
                        disabled={isUploading}
                    >
                        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                        <span>Upload</span>
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="avatar-modal-body">

                    {modalTab === "preset" && (
                        <div className="avatar-grid" role="listbox" aria-label="Available avatars">
                            {photoArray.map(({ key, file }, idx) => {
                                const isCurrent = key === selectedPhotoKey;
                                const isPending = key === pendingPreset;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="option"
                                        aria-selected={isPending || (isCurrent && !pendingPreset)}
                                        aria-label={`Avatar option ${idx + 1}`}
                                        className={
                                            "avatar-grid-item"
                                            + (isCurrent ? " is-current" : "")
                                            + (isPending ? " is-pending" : "")
                                        }
                                        onClick={() => setPendingPreset(key)}
                                        onKeyDown={(e) => e.key === "Enter" && setPendingPreset(key)}
                                    >
                                        <img src={file} alt={`Avatar ${idx + 1}`} />
                                        {isCurrent && !pendingPreset && (
                                            <span className="avatar-grid-badge avatar-grid-badge--current" aria-hidden="true">
                                                <i className="fa-solid fa-check" />
                                            </span>
                                        )}
                                        {isPending && (
                                            <span className="avatar-grid-badge avatar-grid-badge--pending" aria-hidden="true">
                                                <i className="fa-solid fa-bolt" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {modalTab === "upload" && (
                        <div className="avatar-upload-tab">
                            <div
                                className={[
                                    "avatar-dropzone",
                                    dragOver ? "drag-over" : "",
                                    previewUrl ? "has-preview" : "",
                                ].filter(Boolean).join(" ")}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
                                }}
                                onDrop={handleDrop}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                role="button"
                                tabIndex={isUploading ? -1 : 0}
                                aria-label="Click or drag to select a photo"
                                onKeyDown={(e) => e.key === "Enter" && !isUploading && fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="avatar-file-input"
                                    onChange={handleInputChange}
                                    aria-hidden="true"
                                    tabIndex={-1}
                                    disabled={isUploading}
                                />

                                {previewUrl ? (
                                    <div className="avatar-dropzone-content avatar-dropzone-content--has-preview">
                                        <div className="avatar-dropzone-filename" title={selectedFile?.name}>
                                            <i className="fa-solid fa-image me-2" aria-hidden="true" />
                                            <span>{selectedFile?.name || "Selected photo"}</span>
                                        </div>
                                        <span className="avatar-dropzone-action">
                                            <i className="fa-solid fa-rotate me-1" aria-hidden="true" />
                                            Choose a different photo
                                        </span>
                                    </div>
                                ) : (
                                    <div className="avatar-dropzone-content">
                                        <i className="fa-solid fa-cloud-arrow-up avatar-dropzone-icon" aria-hidden="true" />
                                        <p className="avatar-dropzone-title">Drag & drop or click to select</p>
                                        <p className="avatar-dropzone-hint">JPEG, PNG, WebP or GIF · max {MAX_SIZE_MB} MB</p>
                                    </div>
                                )}
                            </div>

                            {uploadError && (
                                <p className="avatar-upload-error" role="alert">
                                    <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                                    {uploadError}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer común ── */}
                <div className="avatar-modal-footer">
                    <button
                        type="button"
                        className="avatar-btn-cancel"
                        onClick={onClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="avatar-btn-apply"
                        onClick={handleApply}
                        disabled={!hasPendingChange || isUploading}
                    >
                        {isUploading
                            ? <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />{applyLabel}</>
                            : <><i className={`fa-solid ${modalTab === "upload" ? "fa-cloud-arrow-up" : "fa-check"}`} aria-hidden="true" />{applyLabel}</>
                        }
                    </button>
                </div>

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
