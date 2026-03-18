"use client";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

interface StrengthInfo {
  level: StrengthLevel;
  score: number; // 0-4
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthInfo {
  if (!password) {
    return { level: "empty", score: 0, label: "", color: "" };
  }

  let score = 0;

  // Criterios de fortaleza
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalizar a 0-4
  const normalizedScore = Math.min(4, score);

  const levels: Record<number, Omit<StrengthInfo, "score">> = {
    0: { level: "weak", label: "Muy débil", color: "bg-error" },
    1: { level: "weak", label: "Débil", color: "bg-error/70" },
    2: { level: "fair", label: "Regular", color: "bg-warning" },
    3: { level: "good", label: "Buena", color: "bg-warning" },
    4: { level: "strong", label: "Fuerte ✓", color: "bg-tertiary" },
  };

  return {
    ...levels[normalizedScore],
    score: normalizedScore,
  };
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);

  if (strength.level === "empty") return null;

  const labelColors: Record<StrengthLevel, string> = {
    empty: "",
    weak: "text-error",
    fair: "text-warning",
    good: "text-warning",
    strong: "text-tertiary",
  };

  return (
    <div className="mt-2">
      {/* Barras de fortaleza */}
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-0.75 flex-1 rounded-full transition-all duration-300 ${
              bar <= strength.score
                ? strength.color
                : "bg-primary-muted"
            }`}
          />
        ))}
      </div>
      {/* Etiqueta */}
      <span
        className={`text-[11px] font-medium ${labelColors[strength.level]}`}
      >
        {strength.label}
      </span>
    </div>
  );
}
