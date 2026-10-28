import Image from "next/image";
import { Icon } from "@/components/icons";

const BRAND_LOGOS: Record<string, string> = {
  Toyota: "toyota",
  Honda: "honda",
  Suzuki: "suzuki",
  Daihatsu: "daihatsu",
  Mitsubishi: "mitsubishi",
  Nissan: "nissan",
  Hyundai: "hyundai",
  Wuling: "wuling",
  Kia: "kia",
  Mazda: "mazda",
  BMW: "bmw",
  "Mercedes-Benz": "mercedes-benz",
  BYD: "byd",
  Chery: "chery",
  MG: "mg",
  Ford: "ford",
  Chevrolet: "chevrolet",
  Isuzu: "isuzu",
  Lexus: "lexus",
  Peugeot: "peugeot",
  Volkswagen: "volkswagen",
  Volvo: "volvo",
  Subaru: "subaru",
  Tesla: "tesla",
};

export function BrandLogo({ brand }: { brand: string }) {
  const slug = BRAND_LOGOS[brand];
  return (
    <span className="brand-logo-plate" aria-hidden="true">
      {slug ? (
        <Image
          src={`/images/brands/${slug}.png`}
          alt=""
          width={72}
          height={40}
          sizes="72px"
          className="brand-logo-image"
        />
      ) : (
        <Icon name="car" className="h-6 w-6 text-slate-400" />
      )}
    </span>
  );
}

// Body types use different profiles rather than reusing one generic silhouette.
const SHAPES: Record<
  string,
  { body: string; windows: string; details?: string; backWheel?: number }
> = {
  SUV: {
    body: "M8 29h8l9-16h37l14 14 12 3v10H8Z",
    windows: "M25 27l6-10h13v10Zm23-10h12l10 10H48Z",
    details: "M25 9h34M48 30v9M80 33h6",
  },
  MPV: {
    body: "M7 29h7l9-17h43l14 15 9 4v9H7Z",
    windows: "M23 27l5-11h14v11Zm23-11h16l10 11H46Z",
    details: "M46 30v9M14 31h7M57 31h5",
    backWheel: 74,
  },
  Sedan: {
    body: "M6 29l17-3 13-13h22l15 13 16 4v10H6Z",
    windows: "M30 26l9-9h9v9Zm22-9h4l11 9H52Z",
    details: "M50 29v10M75 30h10",
  },
  Hatchback: {
    body: "M12 29l8-2 12-15h31l8 15 11 4v9H12Z",
    windows: "M28 26l8-10h12v10Zm24-10h8l5 10H52Z",
    details: "M52 29v10M18 31h4M74 33h5",
    backWheel: 69,
  },
  Listrik: {
    body: "M7 31l15-5 14-13h24l14 14 13 4v9H7Z",
    windows: "M29 26l10-9h10v9Zm24-9h5l10 9H53Z",
    details: "m46 29-4 6h6l-4 6M15 31h7M76 31h8",
  },
  Wagon: {
    body: "M6 29l11-2 10-14h36l11 13 14 4v10H6Z",
    windows: "M24 26l7-9h13v9Zm24-9h12l9 9H48Z",
    details: "M48 29v10M65 12h5M79 32h6",
    backWheel: 73,
  },
  Coupe: {
    body: "M6 32l16-5 17-14h14l21 15 14 3v9H6Z",
    windows: "M30 27l12-10h9l15 10Z",
    details: "M55 30v9M58 31h4M78 32h7",
  },
  Van: {
    body: "M9 40V13l4-3h51l14 18 8 3v9Z",
    windows: "M17 15h19v12H17Zm23 0h20l9 12H40Z",
    details: "M40 30v9M61 30h4M79 33h5",
    backWheel: 72,
  },
  Pickup: {
    body: "M7 40V18h29l13 13h34V23h6v17Z",
    windows: "M14 23h18l8 8H14Z",
    details: "M44 33v7M52 27h29M54 31v6",
    backWheel: 73,
  },
};
export function BodyShape({ type }: { type: string }) {
  const shape = SHAPES[type] || SHAPES.SUV;
  return (
    <svg
      viewBox="0 0 96 52"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={shape.body} fill="var(--accent-soft)" />
      <path d={shape.windows} fill="var(--panel)" />
      {shape.details ? <path d={shape.details} /> : null}
      <circle cx="25" cy="40" r="6" fill="var(--panel)" />
      <circle cx={shape.backWheel || 71} cy="40" r="6" fill="var(--panel)" />
      <circle cx="25" cy="40" r="2" />
      <circle cx={shape.backWheel || 71} cy="40" r="2" />
    </svg>
  );
}
