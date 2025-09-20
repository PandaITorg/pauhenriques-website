const MistDivider = () => (
  <div className="absolute bottom-0 left-0 w-full h-48 z-50 pointer-events-none -mb-1">
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
          fill="#343d2a"
          opacity="0.8"
        ></path>
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
          fill="#414934"
          opacity="0.6"
        ></path>
      </svg>
    </div>
  </div>
);

export default MistDivider;
