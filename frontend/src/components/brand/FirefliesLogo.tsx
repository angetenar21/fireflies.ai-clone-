export function FirefliesLogo({
  className = "",
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="Fireflies Logo"
        className={`shrink-0 ${showWordmark ? 'h-6 w-6' : 'h-8 w-8'}`}
      />
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight text-ff-text">
          fireflies.ai
        </span>
      ) : null}
    </span>
  );
}
