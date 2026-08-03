from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v4-preview-raw.png"
REFERENCE = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v3.png"
FINAL = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v4-preview.png"
CHECKER = ROOT / "output/battle-formation-cutout-v4-preview-checker.png"


def checkerboard(size: tuple[int, int], tile: int = 24) -> Image.Image:
    board = Image.new("RGBA", size, (48, 52, 58, 255))
    draw = ImageDraw.Draw(board)
    colors = ((48, 52, 58, 255), (76, 81, 89, 255))
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            draw.rectangle(
                (x, y, min(x + tile - 1, size[0] - 1), min(y + tile - 1, size[1] - 1)),
                fill=colors[((x // tile) + (y // tile)) % 2],
            )
    return board


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    reference = Image.open(REFERENCE).convert("RGBA")
    source_bbox = source.getchannel("A").getbbox()
    target_bbox = reference.getchannel("A").getbbox()
    if source_bbox is None or target_bbox is None:
        raise RuntimeError("Missing visible alpha content")

    sprite = source.crop(source_bbox)
    target_w = target_bbox[2] - target_bbox[0]
    target_h = target_bbox[3] - target_bbox[1]
    # Match the approved v3 footprint exactly so the formation's share of the
    # battle screen does not change between previews.
    sprite = sprite.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Remove the remaining lime cast introduced by green-screen glow while
    # preserving white highlights and the faint cool inner accents.
    pixels = sprite.load()
    for py in range(sprite.height):
        for px in range(sprite.width):
            r, g, b, a = pixels[px, py]
            if a and g > r and b < min(r, g) * .62:
                warmed_r = max(r, round(g * .96))
                warmed_g = min(g, round(warmed_r * .90 + 14))
                warmed_b = max(b, round(warmed_r * .18))
                pixels[px, py] = (min(255, warmed_r), min(255, warmed_g), min(255, warmed_b), a)

    canvas = Image.new("RGBA", reference.size, (0, 0, 0, 0))
    x = target_bbox[0]
    y = target_bbox[1]
    canvas.alpha_composite(sprite, (x, y))
    canvas.save(FINAL, optimize=True)

    checker = checkerboard(reference.size)
    checker.alpha_composite(canvas)
    checker.convert("RGB").save(CHECKER, quality=95)
    print(f"final={FINAL}")
    print(f"reference_bbox={target_bbox}")
    print(f"preview_bbox={canvas.getchannel('A').getbbox()}")


if __name__ == "__main__":
    main()
