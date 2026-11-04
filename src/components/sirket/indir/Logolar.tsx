/* Platform logoları: resmî markaların geometrisiyle çizilir (Apple, Windows 11, Android, Google Play). */

export { AppleIcon } from "@/components/site/SocialIcons";

/** Windows 11: dört düz mavi kare. */
export function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#0078D4" d="M2 2h9.5v9.5H2zM12.5 2H22v9.5h-9.5zM2 12.5h9.5V22H2zM12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

/** Android: robot başı (yarım kubbe, iki anten, iki göz). */
export function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="#3DDC84">
        <path d="M1.6 19.2a10.4 10.4 0 0 1 20.8 0z" />
        <rect x="5.1" y="4.6" width="1.35" height="5.4" rx=".68" transform="rotate(-30 5.78 7.3)" />
        <rect x="17.55" y="4.6" width="1.35" height="5.4" rx=".68" transform="rotate(30 18.22 7.3)" />
      </g>
      <circle cx="7.4" cy="14.6" r="1.05" fill="#0b0b0c" />
      <circle cx="16.6" cy="14.6" r="1.05" fill="#0b0b0c" />
    </svg>
  );
}

/** Google Play üçgeni (dört renk). */
export function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#00D7FE" d="M3.6 1.8 13.9 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
      <path fill="#FFCE00" d="m17.3 15.4-3.4-3.4 3.4-3.4 3.9 2.2c1.1.6 1.1 1.8 0 2.4z" />
      <path fill="#FF3A44" d="M17.3 15.4 13.9 12 3.6 22.2c.4.2.9.2 1.4-.1z" />
      <path fill="#00F076" d="M17.3 8.6 5 1.9c-.5-.3-1-.3-1.4-.1L13.9 12z" />
    </svg>
  );
}
