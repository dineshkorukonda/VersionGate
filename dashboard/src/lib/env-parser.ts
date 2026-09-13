/**
 * Parses raw .env or key=value strings (single-line or multiline) into key-value pairs.
 * Supports:
 * - KEY=value
 * - KEY="quoted value"
 * - KEY='single quoted'
 * - Exported vars: export KEY=value
 * - Multiline bulk paste of KEY=VAL lines
 */
export function parseEnvText(text: string): Array<{ key: string; value: string }> {
  const lines = text.split(/\r?\n/);
  const result: Array<{ key: string; value: string }> = [];

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('export ')) {
      line = line.slice(7).trim();
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      // Do NOT turn arbitrary text lines without '=' into KEY rows!
      // Only keep if it's a valid environment variable name pattern (e.g. MY_VAR) and single line
      continue;
    }

    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();

    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }

    if (key) {
      result.push({ key, value: val });
    }
  }

  return result;
}

/**
 * Handles paste event on key or value input:
 * - If pasted into the 'value' input:
 *   Always preserves the pasted text inside that row's VALUE field!
 *   If it's multi-line (e.g. RSA private key), joins newlines cleanly as '\n'.
 * - If pasted into the 'key' input:
 *   If text contains '=' (like KEY=VAL or a full .env file), parses it into separate key/value rows.
 *   If text contains NO '=' (like someone pasting a multi-line value by mistake, or an RSA key into KEY),
 *   it will NOT split lines into dozens of empty key rows.
 * Returns true if handled (and caller should preventDefault), false otherwise.
 */
export function handleEnvPaste(
  pastedText: string,
  targetIdx: number,
  setPairs: (updater: (prev: Array<{ key: string; value: string }>) => Array<{ key: string; value: string }>) => void,
  targetField: "key" | "value" = "key"
): boolean {
  // If pasted specifically into VALUE field:
  if (targetField === "value") {
    // If it has newlines, format newlines as literal \n so it stays single-line safe
    if (pastedText.includes("\n") || pastedText.includes("\r")) {
      const formattedVal = pastedText.trim().replace(/\r?\n/g, "\\n");
      setPairs((prev) =>
        prev.map((item, i) => (i === targetIdx ? { ...item, value: formattedVal } : item))
      );
      return true;
    }
    // Standard single line paste into value can use default browser paste
    return false;
  }

  // If pasted into KEY field:
  // Only intercept if the text actually has KEY=VAL pairs (contains '=')
  if (pastedText.includes("=")) {
    const parsed = parseEnvText(pastedText);
    if (parsed.length > 0) {
      setPairs((prev) => {
        const next = [...prev];
        next.splice(targetIdx, 1, ...parsed);
        return next;
      });
      return true;
    }
  }

  // If text has newlines but NO '=' (e.g. user accidentally pasted private key into KEY field):
  // Don't shred it into 30 rows! Instead, put the multiline content into the VALUE of this row!
  if (pastedText.includes("\n") || pastedText.includes("\r")) {
    const formattedVal = pastedText.trim().replace(/\r?\n/g, "\\n");
    setPairs((prev) =>
      prev.map((item, i) => (i === targetIdx ? { ...item, value: formattedVal } : item))
    );
    return true;
  }

  return false;
}
