# Pixel Lab API

AI pixel art generation service used for BelayQuest character avatars.

## Key Endpoints
- **Bitforge** (`/v1/generate-image-bitforge`): Style-consistent generation with reference images. Max 200x200. Best for avatars.
- **Pixflux** (`/v1/generate-image-pixflux`): Text-to-pixel-art. Max 400x400.
- **Rotate** (`/v1/rotate`): Multi-angle from single image. 16x16–200x200.
- **Animate-with-skeleton** (`/v1/animate-with-skeleton`): Skeletal animation.
- **Animate-with-text** (`/v1/animate-with-text`): Text-guided animation. 64x64 only.
- **Inpaint** (`/v1/inpaint`): Edit existing sprites. Max 200x200.
- **Balance** (`/v1/balance`): Check credits.

## Auth
Bearer token: `Authorization: Bearer $PIXELLAB_API_KEY`

## Cost
~$0.007–$0.013 per generation depending on resolution and transparency.

## BelayQuest Plan
- 48x48 generation → 3x nearest-neighbor → 144px display
- Bitforge with style reference for cross-character consistency
- Convex server action wraps API (keeps key server-side)
- Onboarding: Name → Avatar → Grades → Gyms → Invite
- Replace existing color-swatch picker (renders nothing currently)

## Bitforge Parameters
- `description` (text prompt), `image_size`, `style_image` (reference)
- `direction`: north/NE/east/SE/south/SW/west/NW
- `detail`: low/medium/highly detailed
- `coverage_percentage`, `no_background`, `isometric`
- `color_image` (palette reference), `init_image` + `init_image_strength`
