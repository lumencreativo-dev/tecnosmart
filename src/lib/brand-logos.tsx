import Image from "next/image";
import React from "react";

// ============================================================================
// LOGOS OFICIALES DE FABRICANTES Y MARCAS GLOBALES — TECNOSMART VZL
// Versiones vectoriales e imágenes de alta resolución en blanco monocromático.
// Adaptadas para estética dark mode y diseño corporativo de alta tecnología.
// ============================================================================

export interface BrandInfo {
  name: string;
  category: string;
  Logo: React.FC<{ className?: string }>;
}

// 1. Hikvision — Vector oficial (Líder mundial en videovigilancia CCTV e IP)
export const HikvisionLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <svg
    viewBox="-0.59919663 -0.59919663 158.69985326 21.17161426"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Hikvision"
  >
    {/* VISION */}
    <path
      d="m 123.11718,0.0091 c -3.76375,-0.125 -7.83367,2.0416 -9.76367,6.1191 -1.1975,2.3013 -2.11125,4.8639 -2.71875,7.3789 -0.055,0.2225 -0.10484,0.4448 -0.15234,0.666 -0.0612,0.3575 -0.0657,0.8164 -0.0332,1.2852 0.14875,1.98 1.90719,4.3735 4.80469,4.5098 l 1.95899,0 0.0215,0 1.45703,0 c 3.7625,0.125 7.83047,-2.0417 9.76172,-6.1192 1.1975,-2.3025 2.11125,-4.8671 2.71875,-7.3808 0.0537,-0.2238 0.1061,-0.4461 0.15234,-0.6661 0.0625,-0.3587 0.067,-0.8164 0.0332,-1.2851 -0.14875,-1.9813 -1.90719,-4.3728 -4.80469,-4.5078 l -1.98242,0 -1.45313,0 z m -64.5332,0.1836 1.53906,19.582 0.95703,0 1.92969,0 0.19922,0 c -0.005,-10e-4 -0.0126,0 -0.0176,0 0.0213,0 0.0425,0 0.0625,0 l 0.11914,0 c 0.61375,-0.019 1.16203,-0.3394 1.48828,-0.8281 l 0.002,0 12.58203,-18.7539 -3.25391,0 -9.01367,13.4609 -1.05664,-13.4609 -5.53711,0 z m 21.10938,0 -7.22071,19.582 5.54297,0 7.21875,-19.582 -5.54101,0 z m 13.00585,0 c -4.97874,0.061 -7.17898,5.5997 -4.45898,9.1484 1.38,1.685 3.35039,3.4323 4.46289,5.2773 0.705,0.9975 -0.049,2.6615 -1.39648,2.6778 l -2.73633,0 -6.05469,0 -0.91015,2.4785 11.13085,0 c 4.3625,-0.013 7.31422,-5.1498 4.38672,-9.0898 -1.35125,-1.9963 -3.49422,-3.3586 -4.76172,-5.3086 -0.75375,-1.0175 0.004,-2.6876 1.36524,-2.7051 l 2.82226,0 5.35938,0 0.91211,-2.4785 -10.1211,0 z m 13.95704,0 -7.2168,19.582 5.54102,0 7.21874,-19.582 -5.54296,0 z m 29.91796,0 -7.25,19.582 2.85547,0 4.9961,-13.4961 0.0254,0.2422 4.48828,12.1211 c 0.26875,0.6375 0.88633,1.094 1.61133,1.1328 l 2.61133,0 7.25195,-19.582 -2.85547,0 -4.90039,13.2343 -5.2168,-13.2343 -0.76172,0 -2.85547,0 z m -12.1914,1.8418 c 1.045,0.08 1.875,0.9591 1.875,2.0254 l 0,0 c 0.008,0.2625 -0.0373,0.5215 -0.13477,0.7578 l -3.66211,9.9726 c -0.73875,1.9138 -2.45609,3.0865 -4.49609,3.1465 l -0.54102,0 c -1.045,-0.08 -1.875,-0.9591 -1.875,-2.0254 l 0,0 c -0.008,-0.2625 0.038,-0.5247 0.13672,-0.7597 L 119.3457,5.179 c 0.74,-1.9138 2.4575,-3.0838 4.5,-3.1426 l 0.53711,0 z"
    />
    {/* HIK */}
    <path
      d="M 7.2207,0.1927 0,19.7747 l 5.88476,0 3.45313,-9.3652 7.00586,0 -3.45313,9.3652 4.59766,0 c 0.7775,0 1.44554,-0.4908 1.71679,-1.1758 0.003,-0.01 0.006,-0.013 0.01,-0.018 l 6.7793,-18.3887 -5.88477,0 -2.7793,7.5391 -7.00586,0 2.7793,-7.5391 -5.88281,0 z m 22.51367,0 -7.21875,19.582 5.88281,0 7.21875,-19.582 -0.16992,0 -5.54101,0 -0.17188,0 z m 9.88672,0 -7.21875,19.582 5.88281,0 2.76758,-7.5098 1.4707,-1.1289 3.90235,7.5664 0.002,-0.01 c 0.005,0.01 0.007,0.013 0.01,0.018 0.32,0.6638 1.02257,1.1014 1.79882,1.0489 -0.0137,0 -0.0287,0.01 -0.0449,0.01 l 4.9961,0 -6.21485,-12.0508 9.80274,-7.5274 -4.39649,0 -9.58984,7.3633 2.71484,-7.3633 -5.88281,0 z"
    />
  </svg>
);

// 2. Dahua Technology — Logotipo oficial en blanco monocromático (Videovigilancia & IA)
export const DahuaLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/dahua-white.png"
    alt="Dahua Technology"
    width={220}
    height={65}
    className={`${className} object-contain`}
  />
);

// 3. HiLook — Vector oficial (Línea de seguridad Hikvision)
export const HiLookLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <svg
    viewBox="0 0 1918.2 512"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="HiLook"
  >
    <path d="M763.1 439.7V512H597.3v-.2H525V.2h72.3v439.5zM1594.7.1h72.3v511.7h-72.3z" />
    <path d="M1918.2 511.8H1820l-165.1-204.6h97.8zm-16.6-387.5h-98l-146.8 182.9h95.9z" />
    <path d="M351.3.2v511.6H279V289.9H72.3v221.9H0V.2h72.3v217.3H279V.2zm45 123.6h72.3v388.1h-72.3zm0-123.8h72.3v81h-72.3z" />
    <path d="M1159.8 285.2h-63c-14.4-55.2-63.3-95.8-121.5-95.8-58.1 0-107.1 40.6-121.5 95.8h-63C806.3 194.7 883 126 975.3 126s169.1 68.7 184.5 159.2m0 67.6c-15.5 90.4-92.2 159-184.5 159s-168.9-68.6-184.4-159h63c14.5 55.2 63.4 95.7 121.5 95.7s107-40.6 121.5-95.7z" />
    <path d="M1034.9 318.9c0 12.5-3.7 24.2-9.9 33.9-10.7 16.5-28.9 27.4-49.6 27.4s-38.9-10.9-49.6-27.4c-6.3-9.7-9.9-21.4-9.9-33.9s3.6-24.1 9.9-33.7c10.7-16.6 28.9-27.5 49.6-27.5 20.8 0 39 10.9 49.7 27.5 6.1 9.7 9.8 21.2 9.8 33.7m531 33.9c-15.5 90.4-92.2 159-184.5 159s-168.9-68.6-184.4-159h63c14.5 55.2 63.4 95.7 121.5 95.7s107-40.6 121.5-95.7zm.1-67.6h-63c-14.4-55.2-63.3-95.8-121.5-95.8-58.1 0-107.1 40.6-121.5 95.8h-63c15.5-90.5 92.2-159.2 184.5-159.2s169 68.7 184.5 159.2" />
    <path d="M1441 318.9c0 12.5-3.7 24.2-9.9 33.9-10.7 16.5-28.9 27.4-49.6 27.4s-38.9-10.9-49.6-27.4c-6.3-9.7-9.9-21.4-9.9-33.9s3.6-24.1 9.9-33.7c10.7-16.6 28.9-27.5 49.6-27.5 20.8 0 39 10.9 49.7 27.5 6.2 9.7 9.8 21.2 9.8 33.7" />
  </svg>
);

// 4. Starlink — SpaceX Internet Satelital (Emblema orbital & tipografía oficial)
export const StarlinkLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/starlink-white.png"
    alt="Starlink"
    width={200}
    height={50}
    className={`${className} object-contain`}
  />
);

// 5. TP-Link / Omada — Redes, switches & routers profesionales
export const TPLinkLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/tplink_omada-white.png"
    alt="TP-Link Omada"
    width={240}
    height={50}
    className={`${className} object-contain`}
  />
);

// 6. EZVIZ — Hogar inteligente & cámaras Wi-Fi de alta resolución
export const EzvizLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/ezviz-white.png"
    alt="EZVIZ"
    width={220}
    height={50}
    className={`${className} object-contain`}
  />
);

// 7. Tapo — Ecosistema inteligente & domótica (TP-Link)
export const TapoLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/tapo-white.png"
    alt="Tapo"
    width={180}
    height={50}
    className={`${className} object-contain`}
  />
);

// 8. Ubiquiti / UniFi — Infraestructura de red empresarial & Wi-Fi de alta densidad
export const UbiquitiLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/unifi-white.png"
    alt="Ubiquiti UniFi"
    width={220}
    height={50}
    className={`${className} object-contain`}
  />
);

// 9. MikroTik — Routers de alto rendimiento & balanceo de carga
export const MikrotikLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/mikrotik-white.png"
    alt="MikroTik RouterBOARD"
    width={220}
    height={50}
    className={`${className} object-contain`}
  />
);

// 10. CDP (Chicago Digital Power) — UPS, reguladores de voltaje & protectores eléctricos
export const CDPLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/cdp-white.png"
    alt="Chicago Digital Power (CDP)"
    width={200}
    height={50}
    className={`${className} object-contain`}
  />
);

// 11. Marsriva — Mini UPS inteligentes para routers, Starlink & respaldo continuo
export const MarsrivaLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/marsriva-white.png"
    alt="Marsriva Smart Mini UPS"
    width={200}
    height={50}
    className={`${className} object-contain`}
  />
);

// 12. MUST Energy — Inversores solares, sistemas de energía ininterrumpida & baterías
export const MustLogo = ({ className = "h-7 w-auto" }: { className?: string }) => (
  <Image
    src="/brands/partners/must-white.png"
    alt="MUST Energy & Power"
    width={200}
    height={50}
    className={`${className} object-contain`}
  />
);

// ============================================================================
// LISTA MAESTRA DE MARCAS AUTORIZADAS Y DESPLEGADAS POR TECNOSMART
// ============================================================================
export const ALL_BRANDS: BrandInfo[] = [
  { name: "Starlink", category: "Conectividad Satelital", Logo: StarlinkLogo },
  { name: "Hikvision", category: "Videovigilancia CCTV & IP", Logo: HikvisionLogo },
  { name: "Dahua", category: "Seguridad Inteligente & IA", Logo: DahuaLogo },
  { name: "HiLook", category: "Sistemas de Seguridad", Logo: HiLookLogo },
  { name: "TP-Link Omada", category: "Redes & Cableado Estructurado", Logo: TPLinkLogo },
  { name: "Ubiquiti UniFi", category: "Wi-Fi Empresarial & Enlaces", Logo: UbiquitiLogo },
  { name: "MikroTik", category: "Routing & Balanceo de Tráfico", Logo: MikrotikLogo },
  { name: "EZVIZ", category: "Cámaras Wi-Fi & Sensores", Logo: EzvizLogo },
  { name: "Tapo", category: "Domótica & Automatización", Logo: TapoLogo },
  { name: "CDP Energy", category: "Protección Eléctrica & UPS", Logo: CDPLogo },
  { name: "Marsriva", category: "Mini UPS para Starlink y Routers", Logo: MarsrivaLogo },
  { name: "MUST Power", category: "Inversores & Energía Solar", Logo: MustLogo },
];
