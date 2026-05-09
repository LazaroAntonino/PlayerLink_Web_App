/**
 * Shared photo asset registry used by Profile and the Onboarding wizard.
 * Import PHOTO_ARRAY for UI grids and PHOTO_ASSETS for key → src lookups.
 */
import photo1 from "./img/profile-pics/profile-pic-1.png";
import photo2 from "./img/profile-pics/profile-pic-2.png";
import photo3 from "./img/profile-pics/profile-pic-3.png";
import photo4 from "./img/profile-pics/profile-pic-4.png";
import photo5 from "./img/profile-pics/profile-pic-5.png";
import photo6 from "./img/profile-pics/profile-pic-6.png";
import photo7 from "./img/profile-pics/profile-pic-7.png";
import photo8 from "./img/profile-pics/profile-pic-8.png";
import photo9 from "./img/profile-pics/profile-pic-9.png";

/**
 * IMPORTANT: key format matches Profile.jsx's PHOTO_ASSETS exactly ("photo1"…"photo9").
 * The `photo` field stored in the backend uses these keys.
 * PHOTO_ARRAY uses `file` (not `src`) to match Profile.jsx's AvatarPickerModal contract.
 */

/** Ordered list used to render the avatar picker grid */
export const PHOTO_ARRAY = [
  { key: "photo1", file: photo1 },
  { key: "photo2", file: photo2 },
  { key: "photo3", file: photo3 },
  { key: "photo4", file: photo4 },
  { key: "photo5", file: photo5 },
  { key: "photo6", file: photo6 },
  { key: "photo7", file: photo7 },
  { key: "photo8", file: photo8 },
  { key: "photo9", file: photo9 },
];

/** Map from string key → imported asset URL for direct <img src> use */
export const PHOTO_ASSETS = {
  photo1, photo2, photo3, photo4,
  photo5, photo6, photo7, photo8, photo9,
};

/** Fallback when no photo key is stored */
export const DEFAULT_PHOTO = photo1;

/**
 * Resolves any photo value stored in profile.photo to a usable <img src>.
 *
 * Two cases:
 *   1. Cloudinary / external URL  (starts with "http") → use as-is
 *   2. Preset key ("photo1"…"photo9")                  → map to imported asset
 *
 * Falls back to DEFAULT_PHOTO if the value is empty or unrecognised.
 *
 * @param {string|null|undefined} photo - The raw value from profile.photo
 * @returns {string} A resolved image src ready to pass to <img src>
 */
export const resolvePhoto = (photo) => {
  if (!photo) return DEFAULT_PHOTO;
  if (photo.startsWith("http")) return photo;
  return PHOTO_ASSETS[photo] ?? DEFAULT_PHOTO;
};
