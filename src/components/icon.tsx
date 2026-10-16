const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></>,
  chat: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z" />,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="4" y="8" width="16.5" height="11" rx="2" /><circle cx="16" cy="13.5" r="1.2" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
  users: <><circle cx="9" cy="9" r="3.3" /><path d="M3 19.5c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6" /><path d="M15.5 5.9a3.2 3.2 0 0 1 0 6.2M17.5 14.9c1.8.6 3 2.1 3.5 4.6" /></>,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  flag: <path d="M5.5 21V4.5M5.5 5h11l-2 4 2 4h-11" />,
  tag: <><path d="M3.5 12.2V4.5h7.7l9 9-7.7 7.7-9-9Z" /><circle cx="8" cy="9" r="1.3" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.7 0-1 .8-1.6 1.8-1.6h2.2a3.7 3.7 0 0 0 3.7-3.8C20.5 6.8 16.7 3.5 12 3.5Z" /><circle cx="7.8" cy="11" r="1.1" /><circle cx="10.5" cy="7.4" r="1.1" /><circle cx="15" cy="7.8" r="1.1" /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.7" /><path d="m20.5 16-5-5-8.5 8" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  receipt: <><path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5Z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  star: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6L12 4Z" />,
  pin: <><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  share: <><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="m8.7 10.8 6.6-4M8.7 13.2l6.6 4" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></>,
  pencil: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5h11l1-12.5M9 7V4.5h6V7" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  broom: <><path d="M14.5 3.5 11 11" /><path d="M7.5 10.5 14 13.5l-2.5 7c-3.5 0-6.5-1.5-8-3.5l4-6.5Z" /><path d="M8.5 15.5 7 19M11 16l-.8 4" /></>,
  baby: <><circle cx="12" cy="9" r="4.5" /><path d="M10.5 11c.9.6 2.1.6 3 0" /><path d="M6.5 20c1-2.8 3-4.3 5.5-4.3s4.5 1.5 5.5 4.3" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  book: <><path d="M4.5 5.5c2.7-1 5.2-1 7.5.6 2.3-1.6 4.8-1.6 7.5-.6v13c-2.7-1-5.2-1-7.5.6-2.3-1.6-4.8-1.6-7.5-.6v-13Z" /><path d="M12 6.1v13.1" /></>,
  paw: <><circle cx="7" cy="9.5" r="1.8" /><circle cx="10.5" cy="6" r="1.8" /><circle cx="14.5" cy="6" r="1.8" /><circle cx="18" cy="9.5" r="1.8" /><path d="M12.5 11.5c-3 0-5.5 3.4-5.5 5.6 0 1.8 1.6 2.4 3 2 1.2-.4 1.8-.6 2.5-.6s1.3.2 2.5.6c1.4.4 3-.2 3-2 0-2.2-2.5-5.6-5.5-5.6Z" /></>,
  leaf: <><path d="M5 19c0-8 5-13.5 14.5-14 .3 9.5-5.5 14.5-13 14.5" /><path d="M5 19c3-4 6-6.5 9.5-8" /></>,
  scissors: <><circle cx="6.5" cy="7" r="2.5" /><circle cx="6.5" cy="17" r="2.5" /><path d="M8.6 8.4 20 17M8.6 15.6 20 7" /></>,
  needle: <><path d="M18.5 3.5 6 16l-2.5 4.5L8 18l12.5-12.5a1.4 1.4 0 0 0-2-2Z" /><path d="M16 6l2 2" /></>,
  pot: <><path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3Z" /><path d="M2.5 10h19M9 7c0-1 .8-1.5.8-2.5M12.5 7c0-1 .8-1.5.8-2.5" /></>,
  video: <><rect x="3.5" y="6" width="12.5" height="12" rx="2" /><path d="m16 10.5 4.5-2.8v8.6L16 13.5" /></>,
  sparkle: <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  car: <><path d="M5 16.5V12l2-5h10l2 5v4.5" /><path d="M3.5 16.5h17M5 12h14" /><circle cx="8" cy="16.5" r="1.8" /><circle cx="16" cy="16.5" r="1.8" /></>,
  wrench: <path d="M15 4.5a4.5 4.5 0 0 0-4.3 5.8L4.5 16.5a2 2 0 0 0 2.8 2.8l6.2-6.2A4.5 4.5 0 0 0 19.5 9l-2.8 2.8-2.7-.6-.6-2.7L16.2 5.7A4.5 4.5 0 0 0 15 4.5Z" />,
  box: <><path d="M3.5 8 12 4l8.5 4v8.5L12 20.5l-8.5-4V8Z" /><path d="m3.5 8 8.5 4 8.5-4M12 12v8.5" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M3 18.5h18" /></>,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="16" r="2" /></>,
  camera: <><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M21.5 20h-19" />,
};

export function Icon({ name, size = 20, className = "" }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
