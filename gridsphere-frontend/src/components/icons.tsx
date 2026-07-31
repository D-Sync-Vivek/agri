interface IconProps {
  size?: number;
}

export const HomeIcon = ({ size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DevicesIcon = ({ size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="10" rx="2" />
    <path d="M8 20h8M12 14v6" strokeLinecap="round" />
  </svg>
);

export const ProfileIcon = ({ size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c1.3-3.6 4-5.5 7-5.5s5.7 1.9 7 5.5" strokeLinecap="round" />
  </svg>
);

export const ThermometerIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M12 14.5V5a2 2 0 1 0-4 0v9.5a3.5 3.5 0 1 0 4 0Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DropletIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" strokeLinejoin="round" />
  </svg>
);

export const SunIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path
      strokeLinecap="round"
      d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
    />
  </svg>
);

export const WindIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M3 8h10a2.5 2.5 0 1 0-2-4M3 16h14a2.5 2.5 0 1 1-2 4M3 12h17a2.5 2.5 0 1 0-2-4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GaugeIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15a8 8 0 1 1 16 0" strokeLinecap="round" />
    <path d="M12 15l4-5" strokeLinecap="round" />
  </svg>
);

export const CompassIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" strokeLinejoin="round" />
  </svg>
);

export const LeafIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 20C6 11 12 4 20 4c0 8-7 14-16 14Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 20c2-4 5-7 9-9" strokeLinecap="round" />
  </svg>
);

export const CloudIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7.1 9.5 4 4 0 0 0 7 18Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RainIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path
      d="M7 15h9a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.6 6.5 4 4 0 0 0 7 15Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 18v2M13 18v2M17 18v2" strokeLinecap="round" />
  </svg>
);

export const WifiOffIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 2l20 20" strokeLinecap="round" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12.5a10 10 0 0 1 3.5-2.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 9.02c2.8.1 5.5 1.2 7.5 3.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 9a15 15 0 0 1 4-2.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 6.2a15 15 0 0 1 6.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const AdminIcon = ({ size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 11v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);