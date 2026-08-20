import Image from "next/image";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${compact ? "brand-mark--compact" : ""} ${className}`.trim()}>
      <Image src="/brand/parrot-mark.png" alt="" aria-hidden="true" width={64} height={64} priority />
      <span>PEROKIO</span>
    </span>
  );
}
