# BelayQuest

## Pixel Art UI System

### Sprite Assets
- Source: `StonebaseUISheet_v07` TexturePacker pack
- Definition file: `/Users/Julian/Documents/underdragon/BelayQuest/StonebaseUISheet_v07/StonebaseUISheet.tpsheet`
- Converted assets: `assets/images/ui/` (lossless webp)
- Icons: `assets/images/icons/` (128px webp, rendered via `PixelIcon` component)

### TexturePacker .tpsheet Format
```
SpriteName;x;y;width;height; pivotX;pivotY; borderLeft;borderRight;borderTop;borderBottom
```
The border values define **9-slice regions** — the non-stretchable edges. Only the center region stretches. Always read these values from the .tpsheet before slicing or scaling a sprite.

### Rendering Pixel Art in React Native
- **Never stretch raw pixel sprites** — bilinear interpolation blurs them
- **Pre-scale with nearest-neighbor** before placing in the app:
  ```sh
  magick source.png -filter point -resize 300% output.png
  ```
  Then convert to webp. Render at natural size (no runtime scaling).
- Standard scale factor: **3x** (e.g., 16px source → 48px rendered)

### 9-Slice Sprites (Scalable Frames/Banners)
For sprites with 9-slice borders (e.g., `PergamentHeader`, `ParchmentFrameDecoratedA`):

1. Read the border values from `.tpsheet`
2. Pre-scale the entire sprite 3x with nearest-neighbor
3. Slice into **left cap**, **stretchable middle**, **right cap** using the border values × 3
4. Render as a flex row: `<Image cap /><Image mid resizeMode="stretch" /><Image cap />`

Example — `PergamentHeader` (61×19, borders: L=29 R=29 T=8 B=10):
- Left cap: 29px → 87px at 3x
- Middle: 3px → 9px at 3x (stretches to fill)
- Right cap: 29px → 87px at 3x

### Existing Components
| Component | File | Purpose |
|-----------|------|---------|
| `PixelIcon` | `components/PixelIcon.tsx` | Renders icons from `assets/images/icons/` |
| `ParchmentPanel` | `components/ParchmentPanel.tsx` | Styled container with parchment colors + borders |
| `Avatar` | `components/Avatar.tsx` | Character portrait (placeholder; DiceBear planned) |
| `XpBar` | `components/XpBar.tsx` | RPG progress bar |
| `SectionHeader` | `components/SectionHeader.tsx` | 9-slice PergamentHeader banner |

### Theme
- Colors defined in `lib/theme.ts`
- Font: `VT323` (pixel font, loaded in `app/_layout.tsx`)
- Palette: dark brown bg, parchment text, gold primary, forest green XP

## Deployment

### EAS Build & Submit
```sh
eas build --platform ios --profile production    # full native build
eas submit --platform ios --profile production   # submit to TestFlight
```

### OTA Updates (EAS Update)
JS-only changes can be pushed without a full native rebuild:
```sh
eas update --branch production --message "description of changes"
```
- Channels: `development`, `preview`, `production` (mapped in `eas.json`)
- Runtime version policy: `appVersion` — OTA updates only apply to builds with the same `version` in `app.json`
- Any change that adds/removes native modules requires a full `eas build`

### Sentry
- Sentry plugin is configured in `app.json` but uses a placeholder DSN (`SENTRY_DSN_PLACEHOLDER`)
- Source map upload is disabled (`SENTRY_DISABLE_AUTO_UPLOAD=true`) until a real auth token is configured
- To enable: replace the DSN placeholder in `eas.json` env blocks and add `SENTRY_AUTH_TOKEN`

## Testing

Tests live in `__tests__/` mirroring the source structure:
- `__tests__/lib/` — pure function tests (Vitest)
- `__tests__/convex/` — backend tests (Vitest + convex-test)
- `__tests__/components/` — component tests (Jest + RNTL)

```sh
npm test               # full suite
npm run test:convex    # Vitest only (lib + convex)
npm run test:components # Jest only (components)
```

Key patterns: data-driven `it.each()` tables, explicit test names, no snapshots. See `TESTING.md` for full details.
