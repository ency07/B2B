const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

export function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] || ch);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeHtml(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
