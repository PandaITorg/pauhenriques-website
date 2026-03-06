interface ProductPlaceholderProps {
  className?: string;
}

const ProductPlaceholder = ({ className = "" }: ProductPlaceholderProps) => (
  <div
    className={`flex flex-col items-center justify-center bg-tertiary/30 text-text-inverted/40 ${className}`}
  >
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-2 opacity-50"
    >
      <path
        d="M32 8C32 8 24 20 24 32C24 40 28 48 32 52C36 48 40 40 40 32C40 20 32 8 32 8Z"
        fill="currentColor"
      />
      <path
        d="M20 24C20 24 28 28 32 36C28 28 20 24 20 24Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M44 24C44 24 36 28 32 36C36 28 44 24 44 24Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 52V58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
    <span className="text-xs font-medium">Imagen no disponible</span>
  </div>
);

export default ProductPlaceholder;
