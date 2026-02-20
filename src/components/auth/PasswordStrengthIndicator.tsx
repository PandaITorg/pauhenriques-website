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
    0: { level: "weak", label: "Muy débil", color: "bg-red-500" },
    1: { level: "weak", label: "Débil", color: "bg-red-400" },
    2: { level: "fair", label: "Regular", color: "bg-amber-400" },
    3: { level: "good", label: "Buena", color: "bg-yellow-400" },
    4: { level: "strong", label: "Fuerte ✓", color: "bg-[#a4ac85]" },
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
    weak: "text-red-400",
    fair: "text-amber-400",
    good: "text-yellow-400",
    strong: "text-[#a4ac85]",
  };

  return (
    <div className="mt-2">
      {/* Barras de fortaleza */}
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
              bar <= strength.score
                ? strength.color
                : "bg-[rgba(166,138,99,0.15)]"
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
