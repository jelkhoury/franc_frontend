/**
 * Detect whether a media URL should be played as video (blob .mp4 etc.)
 * rather than audio + Lottie avatar.
 */
export const isVideoMediaUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  // Explicit audio formats → keep Lottie + <audio>
  if (/\.(m4a|mp3|wav|aac|oga|flac)$/i.test(clean)) return false;
  // Explicit video formats
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(clean)) return true;
  // Remote blob/CDN URLs without a clear audio extension → treat as video
  return /^https?:\/\//i.test(url);
};

