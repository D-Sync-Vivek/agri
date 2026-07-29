import { ThermometerIcon, DropletIcon, SunIcon, WindIcon, GaugeIcon } from "./icons";

interface IconProps {
  size?: number;
}

// Generic leaf/disease icon — reuses your outline style. Add more as needed.
export const LeafIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 20c0-8 5-14 15-15-1 10-7 15-15 15Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15c3-3 6-5 9-8" strokeLinecap="round" />
  </svg>
);

// Keyword -> icon lookup. Falls back to LeafIcon (disease) or GaugeIcon (generic).
// Backend can eventually replace this by returning an `icon` field directly,
// removing the need to guess from text.
const KEYWORD_ICON_MAP: { pattern: RegExp; Icon: (p: IconProps) => JSX.Element }[] = [
  { pattern: /wind|storm|netting|structure/i, Icon: WindIcon },
  { pattern: /rain|water|irrigat|humid|moisture/i, Icon: DropletIcon },
  { pattern: /heat|sun|temperature|dry/i, Icon: SunIcon },
  { pattern: /monitor|check|inspect/i, Icon: GaugeIcon },
  { pattern: /frost|cold/i, Icon: ThermometerIcon },
];

export function getPrecautionIcon(text: string, size = 18) {
  const match = KEYWORD_ICON_MAP.find((m) => m.pattern.test(text));
  const Icon = match ? match.Icon : LeafIcon;
  return <Icon size={size} />;
}

export function getDiseaseIcon(_name: string, size = 18) {
  // All diseases render with the leaf icon for now. If the backend starts
  // returning a per-risk `icon` field, swap this for a direct lookup.
  return <LeafIcon size={size} />;
}

