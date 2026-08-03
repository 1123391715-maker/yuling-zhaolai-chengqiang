from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROLE_LAYOUT = [
    {"id": "huangjin", "file": "hero-huangjin.png", "x": 226, "foot_y": 1350, "height": 148},
    {"id": "hongyi", "file": "hero-hongyi.png", "x": 333, "foot_y": 1322, "height": 164},
    {"id": "qingyi", "file": "hero-qingyi.png", "x": 444, "foot_y": 1310, "height": 166},
    {"id": "suwen", "file": "hero-suwen.png", "x": 555, "foot_y": 1322, "height": 166},
    {"id": "xuanya", "file": "hero-xuanya.png", "x": 664, "foot_y": 1350, "height": 162},
]

PROTAGONIST_LAYOUT = {
    "id": "protagonist",
    "file": "protagonist.png",
    "x": 444,
    "foot_y": 1480,
    "height": 216,
}


def trim_alpha(image: Image.Image, padding: int = 8) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Image has no visible pixels")
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def resize_to_height(image: Image.Image, target_height: int) -> Image.Image:
    width = max(1, round(image.width * target_height / image.height))
    return image.resize((width, target_height), Image.Resampling.LANCZOS)


def paste_sprite(
    canvas: Image.Image,
    sprite: Image.Image,
    center_x: int,
    foot_y: int,
    glow_radius: int,
    shadow_width_ratio: float = 0.58,
) -> dict[str, int]:
    left = round(center_x - sprite.width / 2)
    top = foot_y - sprite.height

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_w = max(18, round(sprite.width * shadow_width_ratio))
    shadow_h = max(6, round(sprite.height * 0.055))
    shadow_draw.ellipse(
        (
            center_x - shadow_w // 2,
            foot_y - shadow_h // 2,
            center_x + shadow_w // 2,
            foot_y + shadow_h // 2,
        ),
        fill=(0, 0, 0, 105),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(3, shadow_h // 2)))
    canvas.alpha_composite(shadow)

    alpha = sprite.getchannel("A")
    glow_alpha = alpha.filter(ImageFilter.GaussianBlur(glow_radius)).point(lambda value: value * 0.24)
    glow = Image.new("RGBA", sprite.size, (214, 164, 65, 0))
    glow.putalpha(glow_alpha)
    canvas.alpha_composite(glow, (left, top))
    canvas.alpha_composite(sprite, (left, top))

    return {"x": left, "y": top, "w": sprite.width, "h": sprite.height, "anchor_x": center_x, "anchor_y": foot_y}


def find_health_bar_bbox(image: Image.Image) -> list[int]:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(int(image.height * 0.78), image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            if g > 105 and g > r * 1.28 and g > b * 1.08:
                xs.append(x)
                ys.append(y)
    if not xs:
        return [255, 1515, 377, 42]
    return [min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1]


def lock_approved_upper(root: Path, generated: Image.Image, lock_height: int) -> Image.Image:
    approved = Image.open(root / "references" / "approved-battle-visual.png").convert("RGBA")
    if approved.size != generated.size:
        raise ValueError(f"Approved visual size {approved.size} does not match generated base {generated.size}")
    result = generated.copy()
    result.paste(approved.crop((0, 0, approved.width, lock_height)), (0, 0))
    return result


def build_health_bar_assets(root: Path, fill_bbox: list[int]) -> dict[str, str]:
    slice_dir = root / "slices" / "healthbar"
    slice_dir.mkdir(parents=True, exist_ok=True)

    frame_source = Image.open(
        root.parents[2] / "assets" / "art" / "ui" / "hud-progress-ornament-v3.png"
    ).convert("RGBA")
    frame = trim_alpha(frame_source, padding=4)
    frame_path = slice_dir / "health-bar-frame.png"
    frame.save(frame_path, optimize=True)

    _, _, width, height = fill_bbox
    gradient = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = gradient.load()
    for y in range(height):
        t = y / max(1, height - 1)
        r = round(84 * (1 - t) + 62 * t)
        g = round(218 * (1 - t) + 176 * t)
        b = round(132 * (1 - t) + 102 * t)
        for x in range(width):
            pixels[x, y] = (r, g, b, 255)
    radius = max(2, height // 2)
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=radius, fill=255)
    fill = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fill.paste(gradient, (0, 0), mask)
    ImageDraw.Draw(fill).rounded_rectangle(
        (0, 0, width - 1, height - 1), radius=radius, outline=(27, 74, 47, 255), width=2
    )
    fill_path = slice_dir / "health-bar-fill.png"
    fill.save(fill_path, optimize=True)
    return {"frame": str(frame_path), "fill": str(fill_path)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    args = parser.parse_args()

    root: Path = args.root
    character_dir = root / "characters"
    trimmed_dir = character_dir / "trimmed"
    preview_dir = root / "preview"
    annotation_dir = root / "annotations"
    trimmed_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    annotation_dir.mkdir(parents=True, exist_ok=True)

    slice_dir = root / "slices"
    slice_dir.mkdir(parents=True, exist_ok=True)

    base_path = root / "clean" / "battle-lower-clean-base.png"
    base = Image.open(base_path).convert("RGBA")
    base = lock_approved_upper(root, base, lock_height=1090)
    base.convert("RGB").save(base_path, quality=96)
    canvas = base.copy()

    layout_records: list[dict[str, object]] = []

    for role in ROLE_LAYOUT:
        source = Image.open(character_dir / str(role["file"])).convert("RGBA")
        trimmed = trim_alpha(source)
        trimmed.save(trimmed_dir / str(role["file"]), optimize=True)
        resized = resize_to_height(trimmed, int(role["height"]))
        bounds = paste_sprite(canvas, resized, int(role["x"]), int(role["foot_y"]), glow_radius=5)
        layout_records.append({**role, **bounds, "layer": 20})

    protagonist_source = Image.open(character_dir / str(PROTAGONIST_LAYOUT["file"])).convert("RGBA")
    protagonist_trimmed = trim_alpha(protagonist_source)
    protagonist_trimmed.save(trimmed_dir / str(PROTAGONIST_LAYOUT["file"]), optimize=True)
    protagonist_resized = resize_to_height(protagonist_trimmed, int(PROTAGONIST_LAYOUT["height"]))
    protagonist_bounds = paste_sprite(
        canvas,
        protagonist_resized,
        int(PROTAGONIST_LAYOUT["x"]),
        int(PROTAGONIST_LAYOUT["foot_y"]),
        glow_radius=7,
        shadow_width_ratio=0.62,
    )
    layout_records.append({**PROTAGONIST_LAYOUT, **protagonist_bounds, "layer": 30})

    preview_path = preview_dir / "battle-lower-final-composite.png"
    canvas.convert("RGB").save(preview_path, quality=96)

    health_bar_bbox = find_health_bar_bbox(base)
    health_bar_group = [254, 1519, 378, 28]
    reserved_top = health_bar_group[1] + health_bar_group[3] + 8
    formation_overlay_source = root.parents[2] / "assets/art/ui/battle-lower-v1/battle-formation-overlay-v2.png"
    if not formation_overlay_source.exists():
        raise FileNotFoundError(
            "Generate the transparent formation overlay first with "
            "tools/extract_battle_formation_alpha.py"
        )
    Image.open(formation_overlay_source).convert("RGBA").save(
        slice_dir / "battle-formation-overlay-v2.png", optimize=True
    )
    health_bar_assets = build_health_bar_assets(root, health_bar_bbox)
    spec = {
        "version": 1,
        "coordinateSpace": {"width": base.width, "height": base.height, "origin": "top-left"},
        "lockedRegion": {"x": 0, "y": 0, "w": base.width, "h": 1090},
        "editableLowerRegion": {"x": 0, "y": 1090, "w": base.width, "h": base.height - 1090},
        "healthBarGroup": {"x": health_bar_group[0], "y": health_bar_group[1], "w": health_bar_group[2], "h": health_bar_group[3]},
        "healthBarFill": {"x": health_bar_bbox[0], "y": health_bar_bbox[1], "w": health_bar_bbox[2], "h": health_bar_bbox[3]},
        "reservedBlankUiRegion": {"x": 0, "y": reserved_top, "w": base.width, "h": base.height - reserved_top},
        "sprites": layout_records,
        "slices": {
            "battleFormationOverlay": "slices/battle-formation-overlay-v2.png",
            "healthBarFrame": "slices/healthbar/health-bar-frame.png",
            "healthBarFill": "slices/healthbar/health-bar-fill.png",
            "healthBarSourceAssets": health_bar_assets,
            "characters": "characters/trimmed/*.png",
        },
        "rules": {
            "spriteAnchor": "bottom-center",
            "supportingLayer": 20,
            "protagonistLayer": 30,
            "formationOverlayLayer": 10,
            "healthBarLayer": 40,
            "belowHealthBar": "reserved; do not bake skill cards, resource bar, or gear button",
        },
    }
    (annotation_dir / "battle-lower-layout.json").write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    annotated = canvas.copy()
    overlay = Image.new("RGBA", annotated.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for item in layout_records:
        x, y, w, h = int(item["x"]), int(item["y"]), int(item["w"]), int(item["h"])
        draw.rectangle((x, y, x + w, y + h), outline=(64, 210, 255, 230), width=2)
        ax, ay = int(item["anchor_x"]), int(item["anchor_y"])
        draw.line((ax - 7, ay, ax + 7, ay), fill=(255, 90, 90, 255), width=2)
        draw.line((ax, ay - 7, ax, ay + 7), fill=(255, 90, 90, 255), width=2)
    rx, ry, rw, rh = spec["reservedBlankUiRegion"].values()
    draw.rectangle((rx, ry, rx + rw - 1, ry + rh - 1), outline=(255, 210, 70, 230), width=3)
    annotated.alpha_composite(overlay)
    annotated.convert("RGB").save(annotation_dir / "battle-lower-layout-overlay.png", quality=95)

    print(json.dumps({"preview": str(preview_path), "layout": str(annotation_dir / "battle-lower-layout.json")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
