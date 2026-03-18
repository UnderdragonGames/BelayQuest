#!/usr/bin/env python3
"""
Normalize an AI-generated sprite sheet into a clean uniform grid.

Two modes:
  --mode grid   (default): Divide source into known grid, trim bg, repack uniformly
  --mode detect : Auto-detect sprites via connected components

Grid mode is more reliable for AI-generated sheets with known layout.
"""

import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage


def grid_extract(img_array, dist_map, rows, cols, threshold, padding_pct=0.02):
    """Extract sprites by dividing image into a known grid."""
    h, w = img_array.shape[:2]
    cell_w = w / cols
    cell_h = h / rows

    bboxes = []
    for r in range(rows):
        for c in range(cols):
            x1 = int(c * cell_w)
            y1 = int(r * cell_h)
            x2 = int((c + 1) * cell_w)
            y2 = int((r + 1) * cell_h)

            # Add small inward padding to avoid picking up adjacent sprites
            pad_x = int(cell_w * padding_pct)
            pad_y = int(cell_h * padding_pct)
            x1 += pad_x
            y1 += pad_y
            x2 -= pad_x
            y2 -= pad_y

            bboxes.append((x1, y1, x2 - 1, y2 - 1))

    return bboxes


def detect_extract(img_array, dist_map, threshold, min_dim=100, dilation=30):
    """Auto-detect sprites via connected components with dilation + merge."""
    mask = dist_map > threshold
    structure = ndimage.generate_binary_structure(2, 2)
    dilated = ndimage.binary_dilation(mask, structure=structure, iterations=dilation)
    labeled, num_features = ndimage.label(dilated, structure=structure)
    print(f"  Raw components: {num_features}")

    slices = ndimage.find_objects(labeled)
    bboxes = []
    for s in slices:
        if s is None:
            continue
        y_slice, x_slice = s
        w = x_slice.stop - x_slice.start
        h = y_slice.stop - y_slice.start
        if w >= min_dim and h >= min_dim:
            bboxes.append([x_slice.start, y_slice.start, x_slice.stop - 1, y_slice.stop - 1])

    print(f"  After size filter: {len(bboxes)}")

    # Merge nearby small sprites (handles disconnected icons like footprints)
    # A sprite is "small" if both dimensions are less than half the median
    widths = [b[2] - b[0] for b in bboxes]
    heights = [b[3] - b[1] for b in bboxes]
    med_w = np.median(widths)
    med_h = np.median(heights)
    merge_dist = max(med_w, med_h) * 0.15  # merge if gap < 15% of typical sprite size

    merged = True
    while merged:
        merged = False
        i = 0
        while i < len(bboxes):
            bi = bboxes[i]
            wi = bi[2] - bi[0]
            hi = bi[3] - bi[1]
            is_small_i = wi < med_w * 0.7 or hi < med_h * 0.7

            j = i + 1
            while j < len(bboxes):
                bj = bboxes[j]
                wj = bj[2] - bj[0]
                hj = bj[3] - bj[1]
                is_small_j = wj < med_w * 0.7 or hj < med_h * 0.7

                # Only merge if at least one is small
                if not (is_small_i or is_small_j):
                    j += 1
                    continue

                # Check proximity: gap between bounding boxes
                gap_x = max(0, max(bi[0], bj[0]) - min(bi[2], bj[2]))
                gap_y = max(0, max(bi[1], bj[1]) - min(bi[3], bj[3]))
                gap = max(gap_x, gap_y)

                if gap < merge_dist:
                    # Merge j into i
                    bi[0] = min(bi[0], bj[0])
                    bi[1] = min(bi[1], bj[1])
                    bi[2] = max(bi[2], bj[2])
                    bi[3] = max(bi[3], bj[3])
                    bboxes.pop(j)
                    merged = True
                else:
                    j += 1
            i += 1

    print(f"  After merging nearby: {len(bboxes)}")

    # Convert to tuples
    bboxes = [(b[0], b[1], b[2], b[3]) for b in bboxes]

    # Sort top-to-bottom, left-to-right
    avg_height = np.mean([b[3] - b[1] for b in bboxes])
    centers = [(i, (b[0] + b[2]) // 2, (b[1] + b[3]) // 2) for i, b in enumerate(bboxes)]
    centers.sort(key=lambda c: c[2])

    rows = []
    current_row = [centers[0]]
    for c in centers[1:]:
        if abs(c[2] - current_row[0][2]) < avg_height * 0.4:
            current_row.append(c)
        else:
            rows.append(current_row)
            current_row = [c]
    rows.append(current_row)

    sorted_indices = []
    for row in rows:
        row.sort(key=lambda c: c[1])
        sorted_indices.extend([c[0] for c in row])

    return [bboxes[i] for i in sorted_indices]


def normalize_spritesheet(
    input_path,
    output_path=None,
    cell_size=64,
    out_cols=6,
    bg_color=(37, 25, 17),
    threshold=45,
    mode="grid",
    src_rows=6,
    src_cols=6,
):
    input_path = Path(input_path)
    if output_path is None:
        output_path = input_path.parent / f"{input_path.stem}_normalized.png"

    print(f"Loading {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    img_array = np.array(img)
    print(f"  Size: {img.width}x{img.height}")

    # Vectorized distance from background color
    diff = img_array[:, :, :3].astype(np.float32) - np.array(bg_color, dtype=np.float32)
    dist_map = np.sqrt(np.sum(diff ** 2, axis=2))

    print(f"Extracting sprites (mode={mode})...")
    if mode == "grid":
        bboxes = grid_extract(img_array, dist_map, src_rows, src_cols, threshold)
    else:
        bboxes = detect_extract(img_array, dist_map, threshold)

    print(f"  Sprites: {len(bboxes)}")

    for i, (x1, y1, x2, y2) in enumerate(bboxes):
        w, h = x2 - x1 + 1, y2 - y1 + 1
        print(f"  [{i:2d}] {w:3d}x{h:3d} at ({x1}, {y1})")

    # Build output
    num_sprites = len(bboxes)
    num_rows = (num_sprites + out_cols - 1) // out_cols
    out_w = out_cols * cell_size + (out_cols - 1)
    out_h = num_rows * cell_size + (num_rows - 1)
    print(f"\nOutput: {out_cols}x{num_rows} grid, {cell_size}px cells = {out_w}x{out_h}px")

    output = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    sprites_dir = input_path.parent / f"{input_path.stem}_sprites"
    sprites_dir.mkdir(exist_ok=True)

    for i, (x1, y1, x2, y2) in enumerate(bboxes):
        # Crop with bg → transparent
        sprite_data = img_array[y1:y2+1, x1:x2+1].copy()
        sprite_dist = dist_map[y1:y2+1, x1:x2+1]
        sprite_data[sprite_dist <= threshold, 3] = 0

        sprite = Image.fromarray(sprite_data)

        # Trim transparent edges
        bbox = sprite.getbbox()
        if bbox:
            sprite = sprite.crop(bbox)
        else:
            # Entirely transparent cell — skip
            print(f"  [{i}] empty cell, skipping")
            continue

        # Save individual at original res
        sprite.save(sprites_dir / f"sprite_{i:02d}.png")

        # Scale to fit cell, nearest-neighbor for pixel art
        sw, sh = sprite.size
        scale = min(cell_size / sw, cell_size / sh)
        new_w = max(1, round(sw * scale))
        new_h = max(1, round(sh * scale))
        sprite_resized = sprite.resize((new_w, new_h), Image.NEAREST)

        # Center in cell
        col = i % out_cols
        row = i // out_cols
        cell_x = col * (cell_size + 1)
        cell_y = row * (cell_size + 1)
        offset_x = (cell_size - new_w) // 2
        offset_y = (cell_size - new_h) // 2
        output.paste(sprite_resized, (cell_x + offset_x, cell_y + offset_y), sprite_resized)

    output.save(output_path)
    print(f"\nSaved: {output_path}")
    print(f"Sprites: {sprites_dir}/")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Normalize a sprite sheet")
    parser.add_argument("input", help="Input sprite sheet image")
    parser.add_argument("-o", "--output", help="Output path (default: input_normalized.png)")
    parser.add_argument("--cell-size", type=int, default=128, help="Output cell size in pixels")
    parser.add_argument("--cols", type=int, default=6, help="Output columns")
    parser.add_argument("--src-rows", type=int, default=6, help="Source grid rows (grid mode)")
    parser.add_argument("--src-cols", type=int, default=6, help="Source grid cols (grid mode)")
    parser.add_argument("--threshold", type=int, default=45, help="BG color distance threshold")
    parser.add_argument("--bg", default="37,25,17", help="Background color as R,G,B")
    parser.add_argument("--mode", choices=["grid", "detect"], default="grid",
                        help="Detection mode: grid (known layout) or detect (auto)")

    args = parser.parse_args()
    bg = tuple(int(x) for x in args.bg.split(","))

    normalize_spritesheet(
        args.input,
        output_path=args.output,
        cell_size=args.cell_size,
        out_cols=args.cols,
        bg_color=bg,
        threshold=args.threshold,
        mode=args.mode,
        src_rows=args.src_rows,
        src_cols=args.src_cols,
    )
