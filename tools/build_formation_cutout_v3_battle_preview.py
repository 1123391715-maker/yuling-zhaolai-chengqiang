from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOT = Path(r"C:\Users\admin\AppData\Local\Temp\codex-clipboard-dd16f6f0-0735-449a-99eb-1d32e0d03647.png")
BACKGROUND = ROOT / "assets/art/battlefield.png"
FORMATION = ROOT / "assets/art/ui/battle-lower-v1/battle-formation-cutout-v3.png"
CHARACTERS = ROOT / "artifacts/ui_handoff/battle_lower_v1/characters/trimmed"
HEALTH_FRAME = ROOT / "assets/art/ui/battle-lower-v1/health-bar-frame.png"
HEALTH_FILL = ROOT / "assets/art/ui/battle-lower-v1/health-bar-fill.png"
OUTPUT = ROOT / "output/battle-formation-cutout-v3-battle-preview.png"
LOWER_CROP = ROOT / "output/battle-formation-cutout-v3-lower-preview.png"

CANVAS = (750, 1334)
FORMATION_RECT = (0, 820, 750, 514)

SUPPORTING = [
    ("hero-huangjin.png", 157, 1017, 125),
    ("hero-hongyi.png", 270, 1003, 139),
    ("hero-qingyi.png", 375, 998, 140),
    ("hero-suwen.png", 480, 1003, 140),
    ("hero-xuanya.png", 593, 1017, 137),
]
PROTAGONIST = ("protagonist.png", 375, 1134, 183)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image = image.convert("RGBA")
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def alpha_scale(image: Image.Image, factor: float) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: round(value * factor))
    image.putalpha(alpha)
    return image


def resize_height(image: Image.Image, height: int) -> Image.Image:
    image = image.convert("RGBA")
    return image.resize((max(1, round(image.width * height / image.height)), height), Image.Resampling.LANCZOS)


def paste_character(canvas: Image.Image, path: Path, x: int, foot_y: int, height: int, glow: int = 5) -> None:
    sprite = resize_height(Image.open(path), height)
    left = round(x - sprite.width / 2)
    top = foot_y - sprite.height

    shadow_layer = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow = ImageDraw.Draw(shadow_layer)
    shadow.rectangle((x - sprite.width * .22, foot_y - 2, x + sprite.width * .22, foot_y + 5), fill=(0, 0, 0, 125))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(5))
    canvas.alpha_composite(shadow_layer)

    glow_alpha = sprite.getchannel("A").filter(ImageFilter.GaussianBlur(glow)).point(lambda value: round(value * .18))
    glow_layer = Image.new("RGBA", sprite.size, (224, 174, 72, 0))
    glow_layer.putalpha(glow_alpha)
    canvas.alpha_composite(glow_layer, (left, top))
    canvas.alpha_composite(sprite, (left, top))


def blend_runtime_top(background: Image.Image) -> Image.Image:
    runtime = Image.open(SCREENSHOT).convert("RGBA").resize(CANVAS, Image.Resampling.LANCZOS)
    mask = Image.new("L", CANVAS, 0)
    pixels = mask.load()
    for y in range(CANVAS[1]):
        if y <= 755:
            opacity = 255
        elif y >= 790:
            opacity = 0
        else:
            opacity = round(255 * (790 - y) / 35)
        for x in range(CANVAS[0]):
            pixels[x, y] = opacity
    result = background.copy()
    result.paste(runtime, (0, 0), mask)
    return result


def add_lower_shade(canvas: Image.Image) -> None:
    shade = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    pixels = shade.load()
    for y in range(820, CANVAS[1]):
        t = (y - 820) / (CANVAS[1] - 820)
        alpha = round(20 + 120 * max(0, (t - .28) / .72))
        for x in range(CANVAS[0]):
            pixels[x, y] = (3, 9, 12, alpha)
    canvas.alpha_composite(shade)


def paste_formation(canvas: Image.Image, formation_path: Path, opacity: float, blend_mode: str) -> None:
    x, y, width, height = FORMATION_RECT
    formation = Image.open(formation_path).convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
    formation = alpha_scale(formation, opacity)
    if blend_mode == "screen":
        destination = canvas.crop((x, y, x + width, y + height)).convert("RGB")
        screened = ImageChops.screen(destination, formation.convert("RGB"))
        destination.paste(screened, (0, 0), formation.getchannel("A"))
        canvas.paste(destination.convert("RGBA"), (x, y))
    else:
        canvas.alpha_composite(formation, (x, y))


def paste_health_bar(canvas: Image.Image) -> None:
    fill = Image.open(HEALTH_FILL).convert("RGBA").resize((281, 14), Image.Resampling.LANCZOS)
    frame = Image.open(HEALTH_FRAME).convert("RGBA").resize((320, 21), Image.Resampling.LANCZOS)
    canvas.alpha_composite(fill, (234, 1146))
    canvas.alpha_composite(frame, (215, 1142))

    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    label = "1000 / 1000"
    box = draw.textbbox((0, 0), label, font=font)
    draw.text((375 - (box[2] - box[0]) / 2, 1145), label, font=font, fill=(245, 243, 225, 255), stroke_width=1, stroke_fill=(24, 28, 22, 255))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--formation", type=Path, default=FORMATION)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--lower-crop", type=Path, default=LOWER_CROP)
    parser.add_argument("--formation-opacity", type=float, default=.80)
    parser.add_argument("--formation-blend", choices=("source-over", "screen"), default="source-over")
    parser.add_argument("--support-scale", type=float, default=1.0)
    parser.add_argument("--protagonist-scale", type=float, default=1.0)
    parser.add_argument("--empty-support", default="", help="Comma-separated zero-based support slot indexes")
    args = parser.parse_args()
    empty_support = {int(value) for value in args.empty_support.split(",") if value.strip()}

    background = cover(Image.open(BACKGROUND), CANVAS)
    canvas = blend_runtime_top(background)
    add_lower_shade(canvas)
    paste_formation(canvas, args.formation, args.formation_opacity, args.formation_blend)

    for index, (filename, x, foot_y, height) in enumerate(SUPPORTING):
        if index in empty_support:
            continue
        paste_character(canvas, CHARACTERS / filename, x, foot_y, round(height * args.support_scale))

    filename, x, foot_y, height = PROTAGONIST
    paste_character(canvas, CHARACTERS / filename, x, foot_y, round(height * args.protagonist_scale), glow=7)
    paste_health_bar(canvas)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.lower_crop.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(args.output, quality=96)
    canvas.crop((0, 775, 750, 1200)).convert("RGB").save(args.lower_crop, quality=96)
    print(f"preview={args.output}")
    print(f"lower_crop={args.lower_crop}")


if __name__ == "__main__":
    main()
