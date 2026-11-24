// Minimal line icons. Only where they carry meaning.
type P = { size?: number; className?: string };

export const BagIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const MenuIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M3 8h18M3 16h18" />
  </svg>
);

export const CloseIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);

export const SearchIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 5 5" />
  </svg>
);

export const ChevronLeft = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const ChevronRight = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const CheckIcon = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** iOS Safari share glyph (square with up arrow) */
export const ShareIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M7 10H5v11h14V10h-2" />
  </svg>
);

export const PlusSquareIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const Mark = ({ size = 40, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
    <path
      d="M 10 61.2 L 30 33.2 L 50 61.2 L 70 33.2 L 90 61.2 M 10 80.4 L 30 52.4 L 50 80.4 L 70 52.4 L 90 80.4 M 10 42 L 30 14 L 50 42 L 70 14 L 90 42"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="square"
    />
  </svg>
);
