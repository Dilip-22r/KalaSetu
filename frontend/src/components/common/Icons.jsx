function SvgIcon({ children, size = 18, strokeWidth = 1.9, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return <SvgIcon {...props}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></SvgIcon>;
}

export function SearchIcon(props) {
  return <SvgIcon {...props}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></SvgIcon>;
}

export function MessageIcon(props) {
  return <SvgIcon {...props}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></SvgIcon>;
}

export function BellIcon(props) {
  return <SvgIcon {...props}><path d="M15 18H9" /><path d="M18 16V11a6 6 0 1 0-12 0v5L4 18h16z" /></SvgIcon>;
}

export function UserIcon(props) {
  return <SvgIcon {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></SvgIcon>;
}

export function LogoutIcon(props) {
  return <SvgIcon {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></SvgIcon>;
}

export function SparkIcon(props) {
  return <SvgIcon {...props}><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z" /></SvgIcon>;
}

export function EditIcon(props) {
  return <SvgIcon {...props}><path d="M3 21h4.5L19 9.5 14.5 5 3 16.5z" /><path d="m13.5 6 4.5 4.5" /></SvgIcon>;
}

export function TrashIcon(props) {
  return <SvgIcon {...props}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v6" /><path d="M14 11v6" /></SvgIcon>;
}

export function HeartIcon(props) {
  return <SvgIcon {...props}><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" /></SvgIcon>;
}

export function CalendarIcon(props) {
  return <SvgIcon {...props}><path d="M7 3v3" /><path d="M17 3v3" /><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16" /></SvgIcon>;
}

export function PinIcon(props) {
  return <SvgIcon {...props}><path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" /><circle cx="12" cy="10" r="2.5" /></SvgIcon>;
}

export function PaletteIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3c5 0 9 3.5 9 8 0 3-2.5 5-5 5h-1.2a1.8 1.8 0 0 0-1.8 1.8A2.2 2.2 0 0 1 10.8 20H10c-4.4 0-8-3.6-8-8 0-5 4.5-9 10-9Z" />
      <circle cx="7.5" cy="11" r=".8" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r=".8" fill="currentColor" stroke="none" />
    </SvgIcon>
  );
}

export function AlertIcon(props) {
  return <SvgIcon {...props}><path d="M12 4 3.5 19h17z" /><path d="M12 9v4" /><path d="M12 16h.01" /></SvgIcon>;
}

export function ImageIcon(props) {
  return <SvgIcon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 15-4.5-4.5L8 19" /></SvgIcon>;
}

export function ReplyIcon(props) {
  return <SvgIcon {...props}><path d="m9 8-5 4 5 4" /><path d="M4 12h8a6 6 0 0 1 6 6" /></SvgIcon>;
}

export function CloseIcon(props) {
  return <SvgIcon {...props}><path d="M6 6 18 18" /><path d="M18 6 6 18" /></SvgIcon>;
}

export function CheckIcon(props) {
  return <SvgIcon {...props}><path d="m5 12 4 4L19 6" /></SvgIcon>;
}
