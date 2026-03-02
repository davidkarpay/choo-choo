/**
 * trainSvgPaths.ts
 *
 * SVG silhouette templates for train map markers. Generates inline SVG markup
 * for steam and diesel locomotive profiles at small scale, suitable for use
 * inside Leaflet L.divIcon elements.
 *
 * Each SVG uses a viewBox of 0 0 56 28 (steam) or 0 0 52 24 (diesel) and
 * renders a recognizable side-profile silhouette with the train's primary color,
 * ink outlines, and key anatomical features.
 *
 * Part of: Choo-Choo USA — Phase 2
 * See: docs/STYLE_GUIDE.md for visual guidelines
 */

const INK = '#1A1A2E';
const RAIL_SILVER = '#8C8C8C';
const COAL_DARK = '#2E2E38';

/**
 * Generate an inline SVG string for a steam locomotive silhouette.
 * Facing right. Includes: cowcatcher, boiler, bell-shaped smokestack,
 * steam dome, cab with windows, tender, and wheels.
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
  return `<svg viewBox="0 0 56 28" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <!-- Cowcatcher -->
  <polygon points="1,22 5,16 5,24" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <!-- Boiler (main cylindrical body) -->
  <path d="M5,23 L5,13 Q5,8 10,7.5 Q20,6 30,7 L30,23 Z" fill="${primary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Smokebox face -->
  <ellipse cx="6" cy="17" rx="3.5" ry="5" fill="${darkenHex(primary, 0.12)}" stroke="${INK}" stroke-width="1"/>
  <!-- Smokestack (bell shape) -->
  <path d="M9,8 Q9,3 7,1.5 L13,1.5 Q11,3 11,8 Z" fill="${accent}" stroke="${INK}" stroke-width="1.2"/>
  <!-- Stack rim -->
  <rect x="6.5" y="1" width="7" height="1.5" rx="0.5" fill="${darkenHex(accent, 0.1)}" stroke="${INK}" stroke-width="0.7"/>
  <!-- Sand dome -->
  <ellipse cx="16" cy="7.5" rx="2.2" ry="1.6" fill="${darkenHex(primary, 0.05)}" stroke="${INK}" stroke-width="0.8"/>
  <!-- Steam dome -->
  <ellipse cx="22" cy="7" rx="2.8" ry="2" fill="${secondary}" stroke="${INK}" stroke-width="1"/>
  <!-- Bell -->
  <ellipse cx="19" cy="6" rx="1.2" ry="0.8" fill="#F4C542" stroke="${INK}" stroke-width="0.5"/>
  <!-- Cab -->
  <rect x="30" y="6" width="9" height="17" rx="1.5" fill="${secondary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Cab roof -->
  <rect x="29" y="5" width="11" height="2.5" rx="1" fill="${darkenHex(secondary, 0.15)}" stroke="${INK}" stroke-width="1"/>
  <!-- Cab windows -->
  <rect x="31" y="9" width="3" height="4" rx="0.5" fill="#F4C542" stroke="${INK}" stroke-width="0.7"/>
  <rect x="35" y="9" width="3" height="4" rx="0.5" fill="#F4C542" stroke="${INK}" stroke-width="0.7"/>
  <!-- Tender -->
  <rect x="41" y="10" width="13" height="13" rx="1.5" fill="${primary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Tender coal -->
  <rect x="42" y="12" width="5" height="5" rx="0.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.5"/>
  <!-- Headlamp -->
  <circle cx="5" cy="13" r="2" fill="#E8913A" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="5" cy="13" r="0.8" fill="#F4C542"/>
  <!-- Drive wheels (large) -->
  <circle cx="12" cy="24.5" r="3.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="12" cy="24.5" r="2.3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.6"/>
  <circle cx="12" cy="24.5" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="19" cy="24.5" r="3.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="19" cy="24.5" r="2.3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.6"/>
  <circle cx="19" cy="24.5" r="0.8" fill="${RAIL_SILVER}"/>
  <circle cx="26" cy="24.5" r="3.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="1"/>
  <circle cx="26" cy="24.5" r="2.3" fill="none" stroke="${RAIL_SILVER}" stroke-width="0.6"/>
  <circle cx="26" cy="24.5" r="0.8" fill="${RAIL_SILVER}"/>
  <!-- Connecting rod -->
  <line x1="12" y1="23" x2="26" y2="23" stroke="${RAIL_SILVER}" stroke-width="1"/>
  <!-- Pilot wheel -->
  <circle cx="7" cy="25" r="2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="7" cy="25" r="0.6" fill="${RAIL_SILVER}"/>
  <!-- Tender wheels -->
  <circle cx="44" cy="24.5" r="2.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="44" cy="24.5" r="0.7" fill="${RAIL_SILVER}"/>
  <circle cx="50" cy="24.5" r="2.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="50" cy="24.5" r="0.7" fill="${RAIL_SILVER}"/>
</svg>`;
}

/**
 * Generate an inline SVG string for a diesel locomotive silhouette.
 * Facing right. Includes: short hood/nose, cab, long hood, trucks, livery stripe.
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
  return `<svg viewBox="0 0 52 24" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <!-- Underframe -->
  <rect x="2" y="16" width="48" height="3" rx="1" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <!-- Long hood (rear, contains diesel engine) -->
  <rect x="20" y="3" width="29" height="13.5" rx="2" fill="${primary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Radiator grilles -->
  <line x1="28" y1="6" x2="35" y2="6" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="28" y1="8" x2="35" y2="8" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="28" y1="10" x2="35" y2="10" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="28" y1="12" x2="35" y2="12" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="38" y1="6" x2="44" y2="6" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="38" y1="8" x2="44" y2="8" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <line x1="38" y1="10" x2="44" y2="10" stroke="${darkenHex(primary, 0.15)}" stroke-width="0.8"/>
  <!-- Exhaust stack -->
  <rect x="30" y="0.5" width="3" height="3" rx="0.8" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <!-- Cab (between hoods) -->
  <rect x="13" y="1" width="8" height="15.5" rx="1.5" fill="${primary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Cab roof -->
  <rect x="12" y="0" width="10" height="2" rx="1" fill="${darkenHex(primary, 0.15)}" stroke="${INK}" stroke-width="0.8"/>
  <!-- Cab windshield -->
  <rect x="14.5" y="3" width="5" height="5" rx="1" fill="#5B98B5" stroke="${INK}" stroke-width="0.8"/>
  <line x1="17" y1="3" x2="17" y2="8" stroke="${INK}" stroke-width="0.5"/>
  <!-- Side window -->
  <rect x="18" y="4" width="2.5" height="3.5" rx="0.5" fill="#5B98B5" stroke="${INK}" stroke-width="0.5"/>
  <!-- Short hood / nose -->
  <path d="M2,16.5 L2,8 Q2,6 5,5.5 L13,4 L13,16.5 Z" fill="${primary}" stroke="${INK}" stroke-width="1.5"/>
  <!-- Headlamps -->
  <circle cx="3" cy="9" r="1.8" fill="#E8913A" stroke="${INK}" stroke-width="0.7"/>
  <circle cx="3" cy="9" r="0.7" fill="#F4C542"/>
  <circle cx="3" cy="13" r="1.8" fill="#E8913A" stroke="${INK}" stroke-width="0.7"/>
  <circle cx="3" cy="13" r="0.7" fill="#F4C542"/>
  <!-- Number board -->
  <rect x="4" y="5.5" width="5" height="2.5" rx="0.5" fill="#FDF6E3" stroke="${INK}" stroke-width="0.5"/>
  <!-- Livery stripe -->
  <rect x="3" y="12" width="45" height="2" fill="${accent}"/>
  <!-- Handrail -->
  <line x1="5" y1="6" x2="46" y2="6" stroke="${RAIL_SILVER}" stroke-width="0.6"/>
  <!-- Front truck -->
  <rect x="4" y="18.5" width="10" height="2" rx="0.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.7"/>
  <circle cx="6.5" cy="21.5" r="2.2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="6.5" cy="21.5" r="0.6" fill="${RAIL_SILVER}"/>
  <circle cx="11" cy="21.5" r="2.2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="11" cy="21.5" r="0.6" fill="${RAIL_SILVER}"/>
  <!-- Rear truck -->
  <rect x="34" y="18.5" width="12" height="2" rx="0.5" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.7"/>
  <circle cx="37" cy="21.5" r="2.2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="37" cy="21.5" r="0.6" fill="${RAIL_SILVER}"/>
  <circle cx="42" cy="21.5" r="2.2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="42" cy="21.5" r="0.6" fill="${RAIL_SILVER}"/>
  <circle cx="46.5" cy="21.5" r="2.2" fill="${COAL_DARK}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="46.5" cy="21.5" r="0.6" fill="${RAIL_SILVER}"/>
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
