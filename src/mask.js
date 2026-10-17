const REPLACEMENT = '[redacted]';

const TOKEN_SHAPES = [
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bxai-[A-Za-z0-9]{20,}\b/g,
  /\bAIza[A-Za-z0-9_-]{20,}\b/g,
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgho_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
];

export function maskSecrets(text) {
  let out = String(text ?? '');
  for (const re of TOKEN_SHAPES) {
    out = out.replace(re, REPLACEMENT);
  }
  out = out.replace(/\bBearer\s+[A-Za-z0-9._\-+=/]{12,}/gi, `Bearer ${REPLACEMENT}`);
  out = out.replace(
    /\b(token[s]?|secret|password|passwd|api[_-]?key|access[_-]?key|private[_-]?key)(\s*[=:]\s*['"]?)[^\s'"]{8,}/gi,
    `$1$2${REPLACEMENT}`,
  );
  return out;
}

export { REPLACEMENT as MASK };
