/**
 * Runtime SVG sprite generator for Dusty.
 * Generates compact SVG data URIs for editor gutter animations and UI icons.
 * Zero external image dependencies needed.
 */

function encodeSvg(svg: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

export function getDustyFrameSvg(frame: 0 | 1 | 2 | 3): string {
  switch (frame) {
    case 0:
      // Neutral idle
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <rect x="2" y="5" width="8" height="7" rx="3" fill="#e74c3c" />
        <circle cx="5" cy="8" r="1.5" fill="#ffffff" />
        <circle cx="5" cy="8" r="0.75" fill="#2c3e50" />
        <circle cx="8" cy="8" r="1.5" fill="#ffffff" />
        <circle cx="8" cy="8" r="0.75" fill="#2c3e50" />
        <path d="M 10 9 Q 13 8 14 10" stroke="#7f8c8d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <circle cx="4" cy="12" r="1" fill="#34495e" />
        <circle cx="8" cy="12" r="1" fill="#34495e" />
      </svg>`;

    case 1:
      // Approaching / nozzle extended
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <rect x="1" y="5" width="8" height="7" rx="3" fill="#e67e22" />
        <circle cx="4" cy="8" r="1.6" fill="#ffffff" />
        <circle cx="5" cy="8" r="0.8" fill="#c0392b" />
        <circle cx="7" cy="8" r="1.6" fill="#ffffff" />
        <circle cx="8" cy="8" r="0.8" fill="#c0392b" />
        <path d="M 9 8 Q 12 7 15 8" stroke="#95a5a6" stroke-width="2" fill="none" stroke-linecap="round" />
        <polygon points="14,6 16,8 14,10" fill="#e74c3c" />
        <circle cx="3" cy="12" r="1" fill="#34495e" />
        <circle cx="7" cy="12" r="1" fill="#34495e" />
      </svg>`;

    case 2:
      // Chomping / vacuuming swirl
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <rect x="2" y="4" width="8" height="8" rx="3" fill="#c0392b" />
        <circle cx="5" cy="7" r="1.8" fill="#f39c12" />
        <circle cx="5.5" cy="7" r="0.9" fill="#000000" />
        <circle cx="8" cy="7" r="1.8" fill="#f39c12" />
        <circle cx="8.5" cy="7" r="0.9" fill="#000000" />
        <ellipse cx="6.5" cy="10" rx="2" ry="1.2" fill="#000000" />
        <path d="M 10 9 L 15 9" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="15" cy="9" r="1.2" fill="#f1c40f" />
        <circle cx="3.5" cy="12" r="1.2" fill="#2c3e50" />
        <circle cx="7.5" cy="12" r="1.2" fill="#2c3e50" />
      </svg>`;

    case 3:
      // Satisfied / exhaust puff
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <circle cx="1" cy="7" r="1" fill="#bdc3c7" opacity="0.8" />
        <circle cx="0.5" cy="9" r="0.7" fill="#bdc3c7" opacity="0.6" />
        <rect x="3" y="5" width="8" height="7" rx="3" fill="#27ae60" />
        <path d="M 5 7 Q 6 6 7 7" stroke="#ffffff" stroke-width="1" fill="none" stroke-linecap="round" />
        <path d="M 8 7 Q 9 6 10 7" stroke="#ffffff" stroke-width="1" fill="none" stroke-linecap="round" />
        <path d="M 6 9 Q 7.5 10.5 9 9" stroke="#ffffff" stroke-width="1" fill="none" stroke-linecap="round" />
        <path d="M 11 9 Q 13 8.5 14 10" stroke="#7f8c8d" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <circle cx="5" cy="12" r="1" fill="#34495e" />
        <circle cx="9" cy="12" r="1" fill="#34495e" />
      </svg>`;
  }
}

export function getDustyCloggedSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="4" width="9" height="8" rx="3" fill="#8e44ad" />
    <path d="M 4 7 L 6 9 M 6 7 L 4 9" stroke="#f1c40f" stroke-width="1.2" stroke-linecap="round" />
    <path d="M 7 7 L 9 9 M 9 7 L 7 9" stroke="#f1c40f" stroke-width="1.2" stroke-linecap="round" />
    <ellipse cx="6.5" cy="11" rx="1.5" ry="0.6" fill="#2c3e50" />
    <path d="M 11 8 Q 13 7 14 9" stroke="#9b59b6" stroke-width="2" stroke-linecap="round" fill="none" />
    <circle cx="14" cy="9" r="1.5" fill="#e74c3c" />
    <circle cx="4" cy="12" r="1" fill="#2c3e50" />
    <circle cx="8" cy="12" r="1" fill="#2c3e50" />
  </svg>`;
}

export function getDustyDisabledSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <rect x="2" y="5" width="8" height="7" rx="3" fill="#7f8c8d" />
    <line x1="4" y1="8" x2="6" y2="8" stroke="#bdc3c7" stroke-width="1" />
    <line x1="7" y1="8" x2="9" y2="8" stroke="#bdc3c7" stroke-width="1" />
    <path d="M 10 9 Q 12 9 13 11" stroke="#95a5a6" stroke-width="1.2" fill="none" />
    <circle cx="4" cy="12" r="1" fill="#34495e" />
    <circle cx="8" cy="12" r="1" fill="#34495e" />
    <text x="10" y="5" font-size="5" fill="#bdc3c7" font-family="monospace">z</text>
  </svg>`;
}

export function getDustyFrameUri(frame: 0 | 1 | 2 | 3): string {
  return encodeSvg(getDustyFrameSvg(frame));
}

export function getDustyCloggedUri(): string {
  return encodeSvg(getDustyCloggedSvg());
}

export function getDustyDisabledUri(): string {
  return encodeSvg(getDustyDisabledSvg());
}

export function getDustyActivityBarSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <rect x="4" y="7" width="11" height="10" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
    <circle cx="8" cy="11" r="1.5" fill="currentColor" />
    <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    <path d="M 15 12 C 18 10 19 14 21 14" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
    <circle cx="7" cy="17" r="1.2" fill="currentColor" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
  </svg>`;
}
