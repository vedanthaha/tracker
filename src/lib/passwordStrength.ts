export interface Strength {
  score: number; // 0-4
  label: string;
  color: string;
}

const labels: Record<number, { label: string; color: string }> = {
  0: { label: "Too weak", color: "#e07070" },
  1: { label: "Weak", color: "#e07070" },
  2: { label: "Fair", color: "#d4a853" },
  3: { label: "Good", color: "#7eb8e8" },
  4: { label: "Strong", color: "#6fcf8a" },
};

export function getStrength(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // Penalize very short
  if (password.length < 8) score = Math.min(score, 1);
  const meta = labels[score] ?? labels[0]!;
  return { score, label: meta.label, color: meta.color };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter";
  if (!/\d/.test(password)) return "Add at least one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one symbol (e.g. !@#)";
  return null;
}

export const requirements = [
  { test: (p: string) => p.length >= 8, label: "8+ characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Uppercase" },
  { test: (p: string) => /[a-z]/.test(p), label: "Lowercase" },
  { test: (p: string) => /\d/.test(p), label: "Number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Symbol" },
];
