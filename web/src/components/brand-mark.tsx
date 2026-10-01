export function BrandMark({ className = "h-9 w-9 rounded-xl text-sm" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`brand-mark inline-flex shrink-0 items-center justify-center font-display font-extrabold text-white shadow-[0_6px_18px_rgba(31,91,255,0.35)] ${className}`}
    >
      PW
    </span>
  );
}
