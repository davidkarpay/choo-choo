/**
 * trainSvgPaths.ts
 *
 * SVG silhouette templates for train map markers. Generates inline SVG markup
 * for steam and diesel locomotive profiles at small scale, suitable for use
 * inside Leaflet L.divIcon elements.
 *
 * Each SVG uses a viewBox of 0 0 60 32 (steam) or 0 0 56 26 (diesel) and
 * renders a recognizable side-profile silhouette with the train's primary color,
 * ink outlines, and key anatomical features. Proportions are exaggerated for
 * readability at map zoom levels.
 *
 * Part of: Choo-Choo USA — Phase 2
 * See: docs/STYLE_GUIDE.md for visual guidelines
 */

const INK = '#1A1A2E';
const RAIL_SILVER = '#8C8C8C';
const COAL_DARK = '#2E2E38';

/**
 * Generate an inline SVG string for a steam locomotive silhouette.
 * Facing right. Features exaggerated smokestack, curved boiler, large wheels,
 * cowcatcher, cab, and tender for maximum recognizability at small sizes.
 *
 * Args:
 *   primary: Hex color string for the body (e.g., '#C45B3E')
 *   secondary: Hex color string for cab/dome
 *   accent: Hex color string for smokestack/details
 *
 * Returns:
 *   SVG markup string
 */
export function steamSvg(primary: string, secondary: string, accent: string): string {
  return `<svg viewBox="-2 -4 64 38" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <!-- Cowcatcher (prominent V-wedge) -->
  <polygon points="0,25 6,18 6,27" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1.2"/>
  <!-- Boiler (curved cylinder shape — the dominant feature) -->
  <path d="M6,27 L6,16 Q6,9 12,7 Q22,4 32,6 L32,27 Z" fill="${primary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Boiler highlight (curved top edge for 3D cylinder feel) -->
  <path d="M8,13 Q18,4 30,6.5" fill="none" stroke="${lightenHex(primary, 0.2)}" stroke-width="1" opacity="0.5"/>
  <!-- Smokebox face (round front) -->
  <ellipse cx="7" cy="20" rx="4.5" ry="6" fill="${darkenHex(primary, 0.12)}" stroke="${INK}" stroke-width="1.2"/>
  <line x1="4" y1="20" x2="10" y2="20" stroke="${INK}" stroke-width="0.8"/>
  <line x1="7" y1="16" x2="7" y2="24" stroke="${INK}" stroke-width="0.8"/>
  <!-- Smokestack (TALL bell shape — the most iconic feature) -->
  <path d="M10,8 Q10,1 7.5,-2.5 L14.5,-2.5 Q12,1 12,8 Z" fill="${accent}" stroke="${INK}" stroke-width="1.5"/>
  <rect x="7" y="-3.5" width="8" height="2" rx="0.8" fill="${darkenHex(accent, 0.1)}" stroke="${INK}" stroke-width="1"/>
  <!-- Sand dome -->
  <ellipse cx="17" cy="7" rx="2.8" ry="2" fill="${darkenHex(primary, 0.05)}" stroke="${INK}" stroke-width="1"/>
  <!-- Steam dome (prominent) -->
  <ellipse cx="24" cy="6" rx="3.5" ry="2.5" fill="${secondary}" stroke="${INK}" stroke-width="1.2"/>
  <!-- Bell -->
  <ellipse cx="20.5" cy="5" rx="1.5" ry="1" fill="#F4C542" stroke="${INK}" stroke-width="0.6"/>
  <!-- Cab (taller than boiler) -->
  <rect x="32" y="4" width="10" height="23" rx="2" fill="${secondary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Cab roof -->
  <rect x="31" y="2.5" width="12" height="3" rx="1.2" fill="${darkenHex(secondary, 0.15)}" stroke="${INK}" stroke-width="1.2"/>
  <!-- Cab windows (golden glow) -->
  <rect x="33.5" y="8" width="3.5" height="5" rx="0.8" fill="#F4C542" stroke="${INK}" stroke-width="0.8"/>
  <rect x="37.5" y="8" width="3.5" height="5" rx="0.8" fill="#F4C542" stroke="${INK}" stroke-width="0.8"/>
  <!-- Headlamp (bright) -->
  <circle cx="5.5" cy="14" r="2.5" fill="#E8913A" stroke="${INK}" stroke-width="1"/>
  <circle cx="5.5" cy="14" r="1" fill="#F4C542"/>
  <!-- Tender -->
  <rect x="44" y="9" width="14" height="18" rx="2" fill="${primary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Tender coal -->
  <rect x="45.5" y="11" width="6" height="6" rx="0.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.6"/>
  <!-- Drive wheels (LARGE — 3 big visible wheels) -->
  <circle cx="13" cy="28.5" r="4.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1.2"/>
  <circle cx="13" cy="28.5" r="3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.8"/>
  <circle cx="13" cy="28.5" r="1" fill="${RAIL_SILVER}"/>
  <circle cx="21" cy="28.5" r="4.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1.2"/>
  <circle cx="21" cy="28.5" r="3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.8"/>
  <circle cx="21" cy="28.5" r="1" fill="${RAIL_SILVER}"/>
  <circle cx="29" cy="28.5" r="4.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1.2"/>
  <circle cx="29" cy="28.5" r="3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.8"/>
  <circle cx="29" cy="28.5" r="1" fill="${RAIL_SILVER}"/>
  <!-- Connecting rod -->
  <line x1="13" y1="27" x2="29" y2="27" stroke="${RAIL_SILVER}" stroke-width="1.2"/>
  <!-- Pilot wheel (small) -->
  <circle cx="8" cy="29" r="2.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="8" cy="29" r="0.7" fill="${RAIL_SILVER}"/>
  <!-- Tender wheels -->
  <circle cx="48" cy="28.5" r="3" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="48" cy="28.5" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="55" cy="28.5" r="3" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="55" cy="28.5" r="0.8" fill="${RAIL_SILVER}"/>
</svg>`;
}

/**
 * Generate an inline SVG string for a diesel locomotive silhouette.
 * Facing right. Features prominent cab, tapered nose, long hood,
 * livery stripe, and wheel trucks for recognizable diesel profile.
 *
 * Args:
 *   primary: Hex color string for the body
 *   secondary: Hex color string for cab details
 *   accent: Hex color string for livery stripe
 *
 * Returns:
 *   SVG markup string
 */
export function dieselSvg(primary: string, secondary: string, accent: string): string {
  return `<svg viewBox="0 0 56 28" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <!-- Underframe -->
  <rect x="2" y="18" width="52" height="3" rx="1" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <!-- Long hood (rear, diesel engine housing) -->
  <rect x="22" y="4" width="31" height="14.5" rx="2.5" fill="${primary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Radiator grilles -->
  <line x1="30" y1="7" x2="38" y2="7" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="30" y1="9.5" x2="38" y2="9.5" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="30" y1="12" x2="38" y2="12" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="30" y1="14.5" x2="38" y2="14.5" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="41" y1="7" x2="48" y2="7" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="41" y1="9.5" x2="48" y2="9.5" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <line x1="41" y1="12" x2="48" y2="12" stroke="${darkenHex(primary, 0.18)}" stroke-width="1"/>
  <!-- Exhaust stack -->
  <rect x="33" y="1" width="4" height="4" rx="1" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <!-- Cab (TALL, prominent — taller than hood) -->
  <rect x="14" y="0" width="9" height="18.5" rx="2" fill="${primary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Cab roof (overhangs) -->
  <rect x="13" y="-1" width="11" height="2.5" rx="1.2" fill="${darkenHex(primary, 0.15)}" stroke="${INK}" stroke-width="1"/>
  <!-- Cab windshield (large, blue) -->
  <rect x="15.5" y="3" width="6" height="6" rx="1.2" fill="#5B98B5" stroke="${INK}" stroke-width="1"/>
  <line x1="18.5" y1="3" x2="18.5" y2="9" stroke="${INK}" stroke-width="0.6"/>
  <!-- Side window -->
  <rect x="20" y="4.5" width="3" height="4" rx="0.8" fill="#5B98B5" stroke="${INK}" stroke-width="0.6"/>
  <!-- Short hood / nose (tapered) -->
  <path d="M2,18.5 L2,9 Q2,7 5,6.5 L14,5 L14,18.5 Z" fill="${primary}" stroke="${INK}" stroke-width="1.8"/>
  <!-- Headlamps (dual, prominent) -->
  <circle cx="3.5" cy="9.5" r="2.2" fill="#E8913A" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="3.5" cy="9.5" r="0.9" fill="#F4C542"/>
  <circle cx="3.5" cy="14.5" r="2.2" fill="#E8913A" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="3.5" cy="14.5" r="0.9" fill="#F4C542"/>
  <!-- Number board -->
  <rect x="5" y="6.5" width="6" height="3" rx="0.8" fill="#FDF6E3" stroke="${INK}" stroke-width="0.6"/>
  <!-- Livery stripe (bold, colored) -->
  <rect x="3" y="14" width="49" height="2.5" fill="${accent}"/>
  <!-- Handrail -->
  <line x1="5.5" y1="7" x2="50" y2="7" stroke="${RAIL_SILVER}" stroke-width="0.7"/>
  <!-- Front truck -->
  <rect x="4" y="20.5" width="12" height="2.5" rx="0.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="7" cy="24" r="2.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="7" cy="24" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="12.5" cy="24" r="2.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="12.5" cy="24" r="0.8" fill="${RAIL_SILVER}"/>
  <!-- Rear truck -->
  <rect x="36" y="20.5" width="14" height="2.5" rx="0.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="39.5" cy="24" r="2.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="39.5" cy="24" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="45" cy="24" r="2.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="45" cy="24" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="50" cy="24" r="2.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="50" cy="24" r="0.8" fill="${RAIL_SILVER}"/>
</svg>`;
}

/**
 * Darken a hex color string by a fraction. Returns a hex string.
 */
function darkenHex(hex: string, amount: number): string {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((c >> 16) & 0xFF) * (1 - amount)) | 0;
  const g = Math.max(0, ((c >> 8) & 0xFF) * (1 - amount)) | 0;
  const b = Math.max(0, (c & 0xFF) * (1 - amount)) | 0;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Lighten a hex color string by a fraction. Returns a hex string.
 */
function lightenHex(hex: string, amount: number): string {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((c >> 16) & 0xFF) * (1 + amount)) | 0;
  const g = Math.min(255, ((c >> 8) & 0xFF) * (1 + amount)) | 0;
  const b = Math.min(255, (c & 0xFF) * (1 + amount)) | 0;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
