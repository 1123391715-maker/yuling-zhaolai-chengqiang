#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成透明底预览图，棋盘格背景展示抠图效果
"""
from PIL import Image
import os

INPUT_DIR = r"F:\AI项目\御灵召来\概念图\分割角色"
OUTPUT_PATH = r"F:\AI项目\御灵召来\概念图\分割角色\preview_all.png"
NAMES = [
    "character_01_hongyi",
    "character_02_qingyi",
    "character_03_huangjin",
    "character_04_wuyaozi",
    "character_05_jiangshi",
    "character_06_daocaoren",
]

def create_checkerboard(size, square=20):
    """创建棋盘格背景"""
    img = Image.new('RGB', size, (255, 255, 255))
    pixels = img.load()
    for y in range(size[1]):
        for x in range(size[0]):
            if (x // square + y // square) % 2 == 0:
                pixels[x, y] = (200, 200, 200)
            else:
                pixels[x, y] = (150, 150, 150)
    return img

def main():
    # 先加载所有图片，统一缩放到合适大小
    images = []
    max_h = 0
    total_w = 0
    margin = 20
    
    for name in NAMES:
        path = os.path.join(INPUT_DIR, f"{name}.png")
        img = Image.open(path)
        # 缩放到高度 300
        ratio = 300 / img.height
        new_w = int(img.width * ratio)
        img = img.resize((new_w, 300), Image.Resampling.LANCZOS)
        images.append(img)
        max_h = max(max_h, img.height)
        total_w += new_w + margin
    
    # 创建棋盘格背景
    canvas_w = total_w - margin + 40
    canvas_h = max_h + 80
    canvas = create_checkerboard((canvas_w, canvas_h), square=30)
    
    # 放置图片
    x = 20
    y = 40
    for img in images:
        canvas.paste(img, (x, y), img)
        x += img.width + margin
    
    canvas.save(OUTPUT_PATH)
    print(f"预览图已保存: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
