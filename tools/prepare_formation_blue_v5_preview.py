from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-blue-v5-preview-raw.png"
REFERENCE = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v3.png"
FINAL = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-blue-v5-preview.png"
CHECKER = ROOT / "output/battle-formation-blue-v5-preview-checker.png"


def checkerboard(size: tuple[int, int], tile: int = 24) -> Image.Image:
    board = Image.new("RGBA", size, (45, 50, 58, 255))
    draw = ImageDraw.Draw(board)
    colors = ((45, 50, 58, 255), (73, 79, 89, 255))
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

    target_w = target_bbox[2] - target_bbox[0]
    target_h = target_bbox[3] - target_bbox[1]
    sprite = source.crop(source_bbox).resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", reference.size, (0, 0, 0, 0))
    canvas.alpha_composite(sprite, (target_bbox[0], target_bbox[1]))
    canvas.save(FINAL, optimize=True)

    checker = checkerboard(reference.size)
    checker.alpha_composite(canvas)
    checker.convert("RGB").save(CHECKER, quality=95)
    print(f"final={FINAL}")
    print(f"reference_bbox={target_bbox}")
    print(f"preview_bbox={canvas.getchannel('A').getbbox()}")


if __name__ == "__main__":
    main()
