// Logos de marcas como SVG inline — escalables, sin dependencias externas
// Uso: import { HikvisionLogo } from "@/lib/brand-logos"

export const HikvisionLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="-1">
      HIK
    </text>
    <text x="80" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="300" letterSpacing="-1">
      VISION
    </text>
  </svg>
);

export const HiLookLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 180 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="700" letterSpacing="0">
      HiLook
    </text>
  </svg>
);

export const EzvizLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 160 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="2">
      EZVIZ
    </text>
  </svg>
);

export const TapoLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 130 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="700" letterSpacing="1">
      tapo
    </text>
  </svg>
);

export const TPLinkLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 190 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="800" letterSpacing="2">
      TP-LINK
    </text>
  </svg>
);

export const MarsivalLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="700" letterSpacing="3">
      MARSIVA
    </text>
  </svg>
);

export const CDPLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="4">
      CDP
    </text>
  </svg>
);

export const MustLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 130 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="800" letterSpacing="3">
      MUST
    </text>
  </svg>
);

export const StarlinkLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 50" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="38" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="300" letterSpacing="4">
      STARLINK
    </text>
  </svg>
);

export const ALL_BRANDS = [
  { name: "Hikvision",  Logo: HikvisionLogo },
  { name: "HiLook",    Logo: HiLookLogo },
  { name: "EZVIZ",     Logo: EzvizLogo },
  { name: "Tapo",      Logo: TapoLogo },
  { name: "TP-Link",   Logo: TPLinkLogo },
  { name: "Marsiva",   Logo: MarsivalLogo },
  { name: "CDP",       Logo: CDPLogo },
  { name: "Must",      Logo: MustLogo },
  { name: "Starlink",  Logo: StarlinkLogo },
];
