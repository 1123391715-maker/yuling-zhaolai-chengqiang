from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v3-raw.png"
FINAL = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v3.png"
CHECKER = ROOT / "output/battle-formation-cutout-v3-checker.png"
DARK_PREVIEW = ROOT / "output/battle-formation-cutout-v3-dark-preview.png"

CANVAS_SIZE = (887, 684)
CONTENT_LIMIT = (847, 620)
TOP_MARGIN = 18


def fit_transparent_sprite(source: Image.Image) -> Image.Image:
    source = source.convert("RGBA")
    bbox = source.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("The source image has no visible pixels.")

    sprite = source.crop(bbox)
    scale = min(CONTENT_LIMIT[0] / sprite.width, CONTENT_LIMIT[1] / sprite.height)
    target = (round(sprite.width * scale), round(sprite.height * scale))
    sprite = sprite.resize(target, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = (CANVAS_SIZE[0] - sprite.width) // 2
    y = TOP_MARGIN
    canvas.alpha_composite(sprite, (x, y))
    return canvas


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
    sprite = fit_transparent_sprite(Image.open(SOURCE))
    FINAL.parent.mkdir(parents=True, exist_ok=True)
    CHECKER.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(FINAL, optimize=True)

    checker = checkerboard(CANVAS_SIZE)
    checker.alpha_composite(sprite)
    checker.convert("RGB").save(CHECKER, quality=95)

    dark = Image.new("RGBA", CANVAS_SIZE, (8, 18, 24, 255))
    dark.alpha_composite(sprite)
    dark.convert("RGB").save(DARK_PREVIEW, quality=95)

    alpha = sprite.getchannel("A")
    alpha_min, alpha_max = alpha.getextrema()
    visible = sum(1 for value in alpha.getdata() if value > 0)
    total = CANVAS_SIZE[0] * CANVAS_SIZE[1]
    print(f"final={FINAL}")
    print(f"size={sprite.size}, mode={sprite.mode}, alpha={alpha_min}..{alpha_max}")
    print(f"visible_pixels={visible}/{total} ({visible / total:.1%})")
    print(f"alpha_bbox={alpha.getbbox()}")


if __name__ == "__main__":
    main()
