/**
 * paperGrain.ts
 *
 * Generates a paper grain/noise texture overlay for scenes.
 * Implements the style guide's "subtle paper grain texture overlay
 * to all scenes at 3-5% opacity with multiply blend mode."
 *
 * The texture is generated once and can be reused across scenes
 * as a full-screen overlay.
 *
 * Part of: Choo-Choo USA
 * See: docs/STYLE_GUIDE.md § Backgrounds
 *
 * Dependencies:
 *   - pixi.js: Graphics, RenderTexture, Application, Sprite
 */

import { Graphics, RenderTexture, Sprite, Container, Application } from 'pixi.js';

/**
 * Generate a paper grain noise texture and return it as a Sprite
 * configured with multiply blend mode and low opacity.
 *
 * Args:
 *   app: PixiJS Application (needed for renderer)
 *   width: Texture width
 *   height: Texture height
 *   opacity: Overlay opacity (default 0.04 = 4%)
 *   density: Noise dot density (default 0.15 = 15% of pixels)
 *
 * Returns:
 *   Sprite with the noise texture, ready to addChild to scene
 */
export function createPaperGrainOverlay(
  app: Application,
  width: number,
  height: number,
  opacity = 0.04,
  density = 0.15,
): Sprite {
  const container = new Container();
  const g = new Graphics();

  // Generate noise dots
  const step = 3; // sample every 3px for performance
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      if (Math.random() < density) {
        const brightness = Math.random();
        const alpha = 0.2 + brightness * 0.6;
        const shade = brightness > 0.5 ? 0xFFFFFF : 0x000000;
        g.rect(x, y, step, step);
        g.fill({ color: shade, alpha });
      }
    }
  }

  container.addChild(g);

  // Render to texture
  const texture = RenderTexture.create({ width, height });
  app.renderer.render({ container, target: texture });

  // Cleanup the temporary graphics
  container.destroy({ children: true });

  // Create sprite with the noise texture
  const sprite = new Sprite(texture);
  sprite.alpha = opacity;
  sprite.blendMode = 'multiply';

  return sprite;
}

/**
 * Generate a simpler paper grain overlay using just a Graphics object
 * with scattered semi-transparent dots. Lighter on GPU than the
 * RenderTexture approach, suitable for smaller scenes.
 *
 * Args:
 *   width: Overlay width
 *   height: Overlay height
 *   opacity: Overall alpha (default 0.04)
 *
 * Returns:
 *   Graphics with the grain pattern
 */
export function createSimplePaperGrain(
  width: number,
  height: number,
  opacity = 0.04,
): Graphics {
  const g = new Graphics();
  g.alpha = opacity;

  const dotCount = Math.floor(width * height * 0.003);
  for (let i = 0; i < dotCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 1 + Math.random() * 2;
    const shade = Math.random() > 0.5 ? 0xFFFFFF : 0x1A1A2E;
    g.circle(x, y, r);
    g.fill({ color: shade, alpha: 0.3 + Math.random() * 0.4 });
  }

  return g;
}
