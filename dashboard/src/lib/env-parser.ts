/**
 * Parses raw .env or key=value strings (single-line or multiline) into key-value pairs.
 * Supports:
 * - KEY=value
 * - KEY="quoted value"
 * - KEY='single quoted'
 * - Exported vars: export KEY=value
 * - Multiline bulk paste
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
      const k = line.trim();
      if (k) {
        result.push({ key: k, value: '' });
      }
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
 *   If the pasted text has multiple lines but NO '=' assignments (like a multi-line RSA private key or certificate),
 *   it preserves the multi-line text as the value (converting newlines to '\n' or keeping as single formatted string)
 *   instead of splitting it into separate key rows!
 * - If pasted into the 'key' input (or text contains '=' assignments):
 *   Parses into key=value pairs and splices them into envPairs at target index.
 * Returns true if handled (and caller should preventDefault), false otherwise.
 */
export function handleEnvPaste(
  pastedText: string,
  targetIdx: number,
  setPairs: (updater: (prev: Array<{ key: string; value: string }>) => Array<{ key: string; value: string }>) => void,
  targetField: "key" | "value" = "key"
): boolean {
  if (!pastedText.includes("=") && !pastedText.includes("\n") && !pastedText.includes("\r")) {
    return false;
  }

  // If pasting specifically into VALUE field and there are NO '=' signs (e.g. RSA private key / cert):
  if (targetField === "value" && !pastedText.includes("=")) {
    // If it's a private key or multi-line cert, convert literal newlines to \n or keep trimmed
    const formattedVal = pastedText.trim().replace(/\r?\n/g, "\\n");
    setPairs((prev) =>
      prev.map((item, i) => (i === targetIdx ? { ...item, value: formattedVal } : item))
    );
    return true;
  }

  const parsed = parseEnvText(pastedText);
  if (parsed.length === 0) return false;

  setPairs((prev) => {
    const next = [...prev];
    // Replace the current row at targetIdx with parsed pairs
    next.splice(targetIdx, 1, ...parsed);
    return next;
  });

  return true;
}
