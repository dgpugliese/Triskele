import Image from "next/image";

const ICON_SIZES = {
  sm: 24, // tight footer chrome
  md: 32, // top bar
  lg: 40, // marketing header
} as const;

export function BrandMark({
  size = "md",
  className = "",
  alt = "Triskele",
}: {
  size?: keyof typeof ICON_SIZES;
  className?: string;
  alt?: string;
}) {
  const px = ICON_SIZES[size];
  return (
    <Image
      src="/icon-96.png"
      width={px}
      height={px}
      alt={alt}
      className={className}
      priority
    />
  );
}

const LOCKUP_HEIGHTS = {
  sm: 28, // top bar mobile
  md: 36, // top bar desktop
  lg: 48, // marketing header desktop
} as const;

// Source aspect ratio: 2172 × 724 → width = height * 3.
const LOCKUP_RATIO = 3;

/**
 * Horizontal "icon + Triskele Vault" wordmark lockup. Use this anywhere the
 * brand name would otherwise be set as type next to the mark, so spacing
 * and tracking stay consistent with the brand sheet.
 */
export function BrandLockup({
  size = "md",
  className = "",
  alt = "Triskele Vault",
}: {
  size?: keyof typeof LOCKUP_HEIGHTS;
  className?: string;
  alt?: string;
}) {
  const h = LOCKUP_HEIGHTS[size];
  const w = Math.round(h * LOCKUP_RATIO);
  return (
    <Image
      src="/lockup-512.png"
      width={w}
      height={h}
      alt={alt}
      className={className}
      priority
    />
  );
}
