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
      // Neutral idle broom
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <!-- Handle -->
        <line x1="12" y1="1" x2="8" y2="7" stroke="#8d5524" stroke-width="2" stroke-linecap="round" />
        <!-- Binding cord -->
        <rect x="6.5" y="7" width="3.5" height="2" rx="0.5" fill="#e74c3c" />
        <!-- Straw bristles -->
        <polygon points="6,9 10.5,9 12,15 4,15" fill="#f1c40f" />
        <line x1="5.5" y1="11" x2="5.5" y2="15" stroke="#d4ac0d" stroke-width="0.8" />
        <line x1="8" y1="10" x2="8" y2="15" stroke="#d4ac0d" stroke-width="0.8" />
        <line x1="10.5" y1="11" x2="10.5" y2="15" stroke="#d4ac0d" stroke-width="0.8" />
        <!-- Pixel eyes -->
        <circle cx="6.5" cy="11.5" r="0.8" fill="#1a1a1a" />
        <circle cx="9.5" cy="11.5" r="0.8" fill="#1a1a1a" />
      </svg>`;

    case 1:
      // Approaching / tilted forward
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <!-- Handle tilted -->
        <line x1="14" y1="2" x2="8" y2="8" stroke="#8d5524" stroke-width="2" stroke-linecap="round" />
        <!-- Binding cord -->
        <rect x="6" y="8" width="4" height="2" rx="0.5" fill="#e67e22" transform="rotate(-15 8 9)" />
        <!-- Bristles leaning -->
        <polygon points="5,9 10,8 11,15 3,14" fill="#f39c12" />
        <!-- Eyes wide eager -->
        <circle cx="6" cy="11.5" r="1.1" fill="#ffffff" />
        <circle cx="6.3" cy="11.5" r="0.6" fill="#c0392b" />
        <circle cx="8.8" cy="11" r="1.1" fill="#ffffff" />
        <circle cx="9.1" cy="11" r="0.6" fill="#c0392b" />
      </svg>`;

    case 2:
      // Sweeping / fast brush motion with dust sparks
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <!-- Handle sweeping -->
        <line x1="13" y1="1" x2="7" y2="7" stroke="#a0522d" stroke-width="2.2" stroke-linecap="round" />
        <rect x="5.5" y="7" width="4" height="2.2" fill="#c0392b" />
        <!-- Bristles flared with sweep curve -->
        <path d="M 5 9 Q 8 8 11 9 L 14 15 Q 8 16 2 14 Z" fill="#f1c40f" />
        <!-- Dust particles -->
        <circle cx="1" cy="13" r="0.8" fill="#e67e22" />
        <circle cx="15" cy="14" r="0.8" fill="#e67e22" />
        <circle cx="14" cy="11" r="0.6" fill="#f39c12" />
        <!-- Excited eyes -->
        <circle cx="6" cy="11" r="1" fill="#000000" />
        <circle cx="9" cy="11" r="1" fill="#000000" />
      </svg>`;

    case 3:
      // Satisfied / sparkling clean
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <!-- Handle -->
        <line x1="11" y1="1" x2="8" y2="7" stroke="#8d5524" stroke-width="2" stroke-linecap="round" />
        <rect x="6.5" y="7" width="3.5" height="2" rx="0.5" fill="#27ae60" />
        <polygon points="6,9 10.5,9 12,15 4,15" fill="#f1c40f" />
        <!-- Happy eyes -->
        <path d="M 5.5 11.5 Q 6.5 10.5 7.5 11.5" stroke="#1a1a1a" stroke-width="0.8" fill="none" />
        <path d="M 8.5 11.5 Q 9.5 10.5 10.5 11.5" stroke="#1a1a1a" stroke-width="0.8" fill="none" />
        <!-- Sparkles -->
        <path d="M 2 4 L 3 5 L 2 6 L 1 5 Z" fill="#2ecc71" />
        <path d="M 13 4 L 14 5 L 13 6 L 12 5 Z" fill="#2ecc71" />
      </svg>`;
  }
}

export function getDustyCloggedSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <line x1="12" y1="1" x2="8" y2="7" stroke="#7f8c8d" stroke-width="2" stroke-linecap="round" />
    <rect x="6.5" y="7" width="3.5" height="2" fill="#8e44ad" />
    <!-- Disheveled purple bristles -->
    <polygon points="5,9 11,9 13,15 3,15" fill="#9b59b6" />
    <!-- X eyes -->
    <path d="M 5.5 11 L 7.5 13 M 7.5 11 L 5.5 13" stroke="#f1c40f" stroke-width="0.9" />
    <path d="M 8.5 11 L 10.5 13 M 10.5 11 L 8.5 13" stroke="#f1c40f" stroke-width="0.9" />
    <ellipse cx="8" cy="14" rx="1.2" ry="0.6" fill="#2c3e50" />
  </svg>`;
}

export function getDustyDisabledSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <line x1="14" y1="3" x2="8" y2="8" stroke="#7f8c8d" stroke-width="1.8" />
    <rect x="6" y="8" width="3.5" height="1.8" fill="#95a5a6" />
    <polygon points="5,9 9.5,9 10,14 4,14" fill="#bdc3c7" />
    <line x1="5.5" y1="11.5" x2="7.5" y2="11.5" stroke="#7f8c8d" stroke-width="0.8" />
    <line x1="8.5" y1="11.5" x2="10.5" y2="11.5" stroke="#7f8c8d" stroke-width="0.8" />
    <text x="11" y="5" font-size="5" fill="#95a5a6" font-family="monospace">z</text>
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
    <!-- Slanted broom handle -->
    <line x1="19" y1="3" x2="11" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
    <!-- Binding cord band -->
    <rect x="9" y="11" width="5" height="2.5" rx="0.8" fill="currentColor" />
    <!-- Flared broom bristles -->
    <path d="M 8.5 13.5 L 14.5 13.5 L 17 21 L 5 21 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
    <line x1="8" y1="16" x2="7.5" y2="21" stroke="currentColor" stroke-width="1.2" />
    <line x1="11.5" y1="15" x2="11.5" y2="21" stroke="currentColor" stroke-width="1.2" />
    <line x1="15" y1="16" x2="15.5" y2="21" stroke="currentColor" stroke-width="1.2" />
  </svg>`;
}
