interface MistDividerProps {
  fillPrimary?: string;
  fillSecondary?: string;
  flip?: boolean;
}

const MistDivider = ({
  fillPrimary = "#343d2a",
  fillSecondary = "#414934",
  flip = false,
}: MistDividerProps) => (
  <div
    className={`absolute ${flip ? "top-0 -mt-1 rotate-180" : "bottom-0 -mb-1"} left-0 w-full h-48 z-50 pointer-events-none`}
  >
    <div
      className="absolute inset-0"
      style={{
        animation: "flow-mist 20s linear infinite alternate",
        willChange: "transform",
      }}
    >
      <svg
        viewBox="0 0 2000 150"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
      >
        <path
          d="M0 100 C 400 150, 600 100, 1000 100 S 1600 50, 2000 100 L 2000 150 L 0 150 Z"
          fill={fillPrimary}
          opacity="0.8"
        />
      </svg>
    </div>
    <div
      className="absolute inset-0"
      style={{
        animation: "flow-mist 30s linear infinite alternate-reverse",
        willChange: "transform",
      }}
    >
      <svg
        viewBox="0 0 2000 150"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
      >
        <path
          d="M0 100 C 350 50, 650 100, 1000 100 S 1700 150, 2000 100 L 2000 150 L 0 150 Z"
          fill={fillSecondary}
          opacity="0.6"
        />
      </svg>
    </div>
  </div>
);

export default MistDivider;
