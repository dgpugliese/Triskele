import Image from "next/image";

const SIZES = {
  sm: 24, // inline footer / tight chrome
  md: 32, // top bar
  lg: 40, // marketing header
} as const;

export function BrandMark({
  size = "md",
  className = "",
  alt = "Triskele",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  alt?: string;
}) {
  const px = SIZES[size];
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
