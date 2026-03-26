interface SkeletonProps {
  className?: string;
  variant?: "line" | "circle" | "card";
}

const variantClasses = {
  line: "h-4 w-full rounded",
  circle: "h-12 w-12 rounded-full",
  card: "h-48 w-full rounded-xl",
} as const;

export default function Skeleton({
  className = "",
  variant = "line",
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-elevated ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}
