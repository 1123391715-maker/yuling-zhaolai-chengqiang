from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / "artifacts/ui_handoff/battle_lower_v1/clean/battle-lower-clean-base.png"
BAGUA_SOURCE = PROJECT / "assets/art/ui/bagua-formation-v3.png"
BACKGROUND_SOURCE = PROJECT / "assets/art/battlefield.webp"
OUTPUT = PROJECT / "assets/art/ui/battle-lower-v1/battle-formation-overlay-v2.png"
QA_PREVIEW = PROJECT / "output/battle-formation-overlay-v2-checker.png"
QA_GAME_PREVIEW = PROJECT / "output/battle-formation-overlay-v2-game-preview.png"


def tint_gold(image: Image.Image, alpha_scale: float = 1.0, alpha_floor: float = 0.0) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32) / 255.0
    source_rgb = rgba[..., :3]
    source_alpha = rgba[..., 3]
    luminance = np.max(source_rgb, axis=2)
    red = 0.76 + luminance * 0.24
    green = 0.38 + luminance * 0.50
    blue = 0.07 + luminance * 0.34
    source_alpha = np.clip((source_alpha - alpha_floor) / max(1e-6, 1.0 - alpha_floor), 0.0, 1.0)
    source_alpha = np.power(source_alpha, 1.18)
    result = np.dstack((red, green, blue, np.clip(source_alpha * alpha_scale, 0.0, 1.0)))
    return Image.fromarray(np.uint8(np.round(result * 255.0)), mode="RGBA")


def tint_bagua_lines(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32) / 255.0
    red, green, blue, source_alpha = [rgba[..., channel] for channel in range(4)]
    # The old asset uses an opaque magenta fill. Keep only its white/cyan line
    # work, then recolor those lines to gold; this prevents a solid gold disc.
    green_line = np.clip((green - 0.24) / 0.70, 0.0, 1.0)
    blue_line = np.clip((blue - 0.34) / 0.58, 0.0, 1.0)
    line_alpha = np.power(green_line * blue_line * source_alpha, 1.10) * 0.62
    luminance = np.maximum.reduce((red, green, blue))
    result = np.dstack(
        (
            0.80 + luminance * 0.20,
            0.43 + luminance * 0.50,
            0.08 + luminance * 0.34,
            np.clip(line_alpha, 0.0, 1.0),
        )
    )
    return Image.fromarray(np.uint8(np.round(result * 255.0)), mode="RGBA")


def cover(image: Image.Image, width: int, height: int) -> Image.Image:
    scale = max(width / image.width, height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS
    )
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def main() -> None:
    full_visual = Image.open(SOURCE).convert("RGB")
    source = full_visual.crop((0, 1090, full_visual.width, full_visual.height))
    rgb = np.asarray(source, dtype=np.float32) / 255.0
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    value = np.max(rgb, axis=2)
    minimum = np.min(rgb, axis=2)
    saturation = np.divide(value - minimum, np.maximum(value, 1e-6))

    # Gold/bronze formation pixels have both red and green clearly above blue.
    # The two advantages are multiplied so neutral stone does not survive.
    red_advantage = np.clip((red - blue - 0.035) / 0.36, 0.0, 1.0)
    green_advantage = np.clip((green - blue - 0.015) / 0.25, 0.0, 1.0)
    warm_colour = np.sqrt(red_advantage * green_advantage)
    brightness = np.clip((value - 0.16) / 0.62, 0.0, 1.0)
    colourfulness = np.clip((saturation - 0.10) / 0.52, 0.0, 1.0)
    score = warm_colour * (0.38 + 0.62 * brightness) * (0.42 + 0.58 * colourfulness)

    # The approved formation occupies the upper 430 px of the 887 x 684 slice.
    # A soft lower cutoff prevents warm stones and the reserved UI floor from
    # entering the transparent overlay.
    height, width = score.shape
    yy, xx = np.mgrid[0:height, 0:width]
    lower_fade = np.clip((415.0 - yy) / 28.0, 0.0, 1.0)
    ellipse = ((xx - width * 0.5) / (width * 0.58)) ** 2 + ((yy - 215.0) / 300.0) ** 2
    formation_region = np.clip((1.18 - ellipse) / 0.18, 0.0, 1.0) * lower_fade
    formation_region[(xx > 760) & (yy > 300)] = 0.0
    formation_region[(xx < 120) & (yy > 330)] = 0.0
    score *= formation_region

    alpha = np.clip((score - 0.085) / 0.54, 0.0, 1.0)
    alpha = np.power(alpha, 0.82)
    alpha_image = Image.fromarray(np.uint8(np.round(alpha * 255.0)), mode="L")
    alpha_image = alpha_image.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.65))

    source_rgba = source.convert("RGBA")
    source_rgba.putalpha(alpha_image)
    extracted_gold = tint_gold(source_rgba)

    glow_alpha = alpha_image.filter(ImageFilter.GaussianBlur(5.5)).point(lambda value: round(value * 0.40))
    glow = Image.new("RGBA", source.size, (255, 158, 38, 0))
    glow.putalpha(glow_alpha)

    bagua = Image.open(BAGUA_SOURCE).convert("RGBA")
    bagua_bbox = bagua.getchannel("A").getbbox()
    if bagua_bbox:
        bagua = bagua.crop(bagua_bbox)
    bagua = tint_bagua_lines(bagua).resize((690, 370), Image.Resampling.LANCZOS)

    rgba = Image.new("RGBA", source.size, (0, 0, 0, 0))
    rgba.alpha_composite(bagua, (99, 52))
    rgba.alpha_composite(glow)
    rgba.alpha_composite(extracted_gold)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(OUTPUT, optimize=True)

    checker = np.zeros((height, width, 3), dtype=np.uint8)
    tile = 32
    light = ((xx // tile + yy // tile) % 2) == 0
    checker[light] = (58, 62, 68)
    checker[~light] = (31, 35, 40)
    preview = Image.fromarray(checker, mode="RGB").convert("RGBA")
    preview.alpha_composite(rgba)
    QA_PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(QA_PREVIEW, quality=92)

    game_preview = Image.new("RGBA", (750, 1334), (3, 9, 14, 255))
    battlefield_source = Image.open(BACKGROUND_SOURCE).convert("RGBA")
    game_preview.alpha_composite(cover(battlefield_source, 750, 1334), (0, 0))
    game_preview.alpha_composite(cover(battlefield_source, 750, 960), (0, 0))
    darkening = Image.new("RGBA", game_preview.size, (0, 0, 0, 0))
    dark_pixels = np.zeros((514, 750, 4), dtype=np.uint8)
    for row in range(514):
        t = row / 513.0
        if t <= 0.55:
            opacity = (t / 0.55) * 0.12
        elif t <= 0.72:
            opacity = 0.12 + ((t - 0.55) / 0.17) * 0.18
        else:
            opacity = 0.30 + ((t - 0.72) / 0.28) * 0.48
        dark_pixels[row, :, :] = (3, 9, 12, round(opacity * 255))
    darkening.alpha_composite(Image.fromarray(dark_pixels, mode="RGBA"), (0, 820))
    game_preview.alpha_composite(darkening)
    game_preview.alpha_composite(rgba.resize((750, 514), Image.Resampling.LANCZOS), (0, 820))
    game_preview.convert("RGB").save(QA_GAME_PREVIEW, quality=92)

    final_alpha = np.asarray(rgba.getchannel("A"))
    opaque = int(np.count_nonzero(final_alpha >= 245))
    visible = int(np.count_nonzero(final_alpha > 8))
    print(f"saved={OUTPUT}")
    print(f"size={rgba.width}x{rgba.height} visible={visible} opaque={opaque}")
    print(f"corner_alpha={[int(final_alpha[0, 0]), int(final_alpha[0, -1]), int(final_alpha[-1, 0]), int(final_alpha[-1, -1])]}")
    print(f"qa_preview={QA_PREVIEW}")
    print(f"qa_game_preview={QA_GAME_PREVIEW}")


if __name__ == "__main__":
    main()
