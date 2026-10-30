import { jsonPointer } from './issues';

type Frame =
  | { kind: 'object'; segment: string | number | null; keys: Set<string>; key: string; expectKey: boolean }
  | { kind: 'array'; segment: string | number | null; index: number };

/** Index just past the closing quote of the string starting at `start`. */
function endOfString(json: string, start: number): number {
  for (let i = start + 1; i < json.length; i++) {
    if (json[i] === '\\') i++;
    else if (json[i] === '"') return i + 1;
  }
  return json.length;
}

/**
 * Returns the JSON Pointer of the first repeated object key, or null.
 * `JSON.parse` keeps the last duplicate silently, so this scans the raw text.
 *
 * `json` must already parse with `JSON.parse`. The scan is iterative and
 * linear in the input length; the pointer is built only when a duplicate is
 * found, so deep nesting cannot make it quadratic.
 */
export function findDuplicateKey(json: string): string | null {
  const stack: Frame[] = [];

  const childSegment = (): string | number | null => {
    const parent = stack[stack.length - 1];
    if (!parent) return null;
    return parent.kind === 'object' ? parent.key : parent.index;
  };

  let i = 0;
  while (i < json.length) {
    const char = json[i];
    const top = stack[stack.length - 1];

    if (char === '{') {
      stack.push({ kind: 'object', segment: childSegment(), keys: new Set(), key: '', expectKey: true });
    } else if (char === '[') {
      stack.push({ kind: 'array', segment: childSegment(), index: 0 });
    } else if (char === '}' || char === ']') {
      stack.pop();
    } else if (char === ',' && top) {
      if (top.kind === 'object') top.expectKey = true;
      else top.index++;
    } else if (char === '"') {
      const end = endOfString(json, i);
      if (top?.kind === 'object' && top.expectKey) {
        // JSON.parse decodes escapes, so "a" and "a" count as the same key.
        const key = JSON.parse(json.slice(i, end)) as string;
        if (top.keys.has(key)) {
          const segments = stack.slice(1).map((frame) => frame.segment as string | number);
          return jsonPointer(...segments, key);
        }
        top.keys.add(key);
        top.key = key;
        top.expectKey = false;
      }
      i = end;
      continue;
    }
    i++;
  }
  return null;
}
