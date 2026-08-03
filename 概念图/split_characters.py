#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分割 character-atlas.png 为6个透明底角色图
"""
from PIL import Image, ImageFilter
import numpy as np
import os

# 输入输出
INPUT_PATH = r"C:\Users\admin\.workbuddy\clipboard-images\clipboard-2026-07-02T06-33-20-397Z-248e1ddf.jpg"
OUTPUT_DIR = r"F:\AI项目\御灵召来\概念图\分割角色"
NAMES = [
    "character_01_hongyi",      # 红衣 火
    "character_02_qingyi",      # 青衣 水
    "character_03_huangjin",    # 黄巾 土
    "character_04_wuyaozi",     # 五谷袋子/幽灵
    "character_05_jiangshi",    # 小僵尸
    "character_06_daocaoren",   # 稻草人/符咒师
]

def detect_grid_lines(img_np):
    """检测深色背景上的金色/浅色网格分隔线位置"""
    h, w = img_np.shape[:2]
    gray = np.mean(img_np, axis=2)
    
    # 检测横向分隔线：中间区域亮度突增的行
    mid_y = h // 2
    row_scan = gray[max(0, mid_y-50):min(h, mid_y+50), :]
    row_mean = np.mean(row_scan, axis=1)
    # 找最亮的行
    y_offset = np.argmax(row_mean)
    y_line = max(0, mid_y-50) + y_offset
    
    # 检测纵向分隔线
    mid_x1 = w // 3
    mid_x2 = 2 * w // 3
    col_scan1 = gray[:, max(0, mid_x1-30):min(w, mid_x1+30)]
    col_scan2 = gray[:, max(0, mid_x2-30):min(w, mid_x2+30)]
    col_mean1 = np.mean(col_scan1, axis=0)
    col_mean2 = np.mean(col_scan2, axis=0)
    x1_line = max(0, mid_x1-30) + np.argmax(col_mean1)
    x2_line = max(0, mid_x2-30) + np.argmax(col_mean2)
    
    return y_line, x1_line, x2_line

def flood_fill_background(bg_mask, corners):
    """从角落开始flood fill，只保留连通的背景"""
    from scipy import ndimage
    h, w = bg_mask.shape
    visited = np.zeros_like(bg_mask, dtype=bool)
    
    # 四个角开始
    queue = []
    for cy, cx in corners:
        cy = max(0, min(h-1, cy))
        cx = max(0, min(w-1, cx))
        if bg_mask[cy, cx] and not visited[cy, cx]:
            queue.append((cy, cx))
            visited[cy, cx] = True
    
    # BFS flood fill
    while queue:
        y, x = queue.pop(0)
        for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
            ny, nx = y+dy, x+dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg_mask[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))
    
    return visited

def remove_background(img):
    """使用颜色距离 + flood fill去除深色背景，保留角色"""
    from scipy import ndimage
    
    # 转为RGBA
    img = img.convert("RGBA")
    data = np.array(img)
    rgb = data[:, :, :3] if data.shape[2] == 4 else data
    h, w = rgb.shape[:2]
    
    # 计算亮度
    brightness = 0.299 * rgb[:,:,0] + 0.587 * rgb[:,:,1] + 0.114 * rgb[:,:,2]
    
    # 从边缘采样多个背景色点
    edge_samples = []
    border = 8
    edge_samples.append(rgb[border:border+5, border:border+5, :].reshape(-1, 3))
    edge_samples.append(rgb[border:border+5, -border-5:-border, :].reshape(-1, 3))
    edge_samples.append(rgb[-border-5:-border, border:border+5, :].reshape(-1, 3))
    edge_samples.append(rgb[-border-5:-border, -border-5:-border, :].reshape(-1, 3))
    edge_samples = np.vstack(edge_samples).astype(np.float32)
    
    # 背景色：取边缘样本的中位数（更抗噪）
    bg_color = np.median(edge_samples, axis=0)
    
    # 计算每个像素到背景色的距离
    color_dist = np.linalg.norm(rgb - bg_color, axis=2)
    
    # 背景判定：颜色接近背景 且 亮度不高
    # 颜色距离阈值根据图像自适应：取边缘样本距离的95分位数
    dist_samples = np.linalg.norm(edge_samples - bg_color, axis=1)
    dist_thresh = max(25, np.percentile(dist_samples, 95) * 1.5)
    
    bg_mask = (color_dist < dist_thresh) & (brightness < 120)
    
    # 从四个角flood fill，只保留连通的背景
    corners = [(2, 2), (2, w-3), (h-3, 2), (h-3, w-3)]
    connected_bg = flood_fill_background(bg_mask, corners)
    
    # 前景 = 非连通背景
    foreground = ~connected_bg
    
    # 形态学处理：填补角色内部小空洞
    foreground = ndimage.binary_fill_holes(foreground)
    # 轻微闭运算连接断裂边缘
    foreground = ndimage.binary_closing(foreground, iterations=1)
    
    # 创建alpha通道
    alpha = foreground.astype(np.uint8) * 255
    alpha_img = Image.fromarray(alpha, mode='L')
    # 边缘羽化1像素
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1))
    
    # 应用alpha
    img.putalpha(alpha_img)
    
    return img

def crop_with_margin(img, box, margin=20):
    """按box裁剪，并添加边距"""
    x1, y1, x2, y2 = box
    x1 = max(0, x1 - margin)
    y1 = max(0, y1 - margin)
    x2 = min(img.width, x2 + margin)
    y2 = min(img.height, y2 + margin)
    return img.crop((x1, y1, x2, y2))

def crop_inner(img, box, shrink=15):
    """按box裁剪，并向内收缩去掉边框"""
    x1, y1, x2, y2 = box
    # 向内收缩
    x1 = min(x2 - 1, x1 + shrink)
    y1 = min(y2 - 1, y1 + shrink)
    x2 = max(x1 + 1, x2 - shrink)
    y2 = max(y1 + 1, y2 - shrink)
    return img.crop((x1, y1, x2, y2))

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    img = Image.open(INPUT_PATH)
    img_np = np.array(img)
    h, w = img_np.shape[:2]
    
    print(f"图片尺寸: {w}x{h}")
    
    # 检测网格线
    y_line, x1_line, x2_line = detect_grid_lines(img_np)
    print(f"检测到的分隔线: 横向 y={y_line}, 纵向 x1={x1_line}, x2={x2_line}")
    
    # 6个区域
    boxes = [
        (0, 0, x1_line, y_line),           # 左上: 红衣
        (x1_line, 0, x2_line, y_line),     # 中上: 青衣
        (x2_line, 0, w, y_line),           # 右上: 黄巾
        (0, y_line, x1_line, h),           # 左下: 五谷袋子
        (x1_line, y_line, x2_line, h),     # 中下: 小僵尸
        (x2_line, y_line, w, h),           # 右下: 稻草人
    ]
    
    for i, (box, name) in enumerate(zip(boxes, NAMES)):
        print(f"处理 {name}...")
        cropped = crop_inner(img, box, shrink=12)
        transparent = remove_background(cropped)
        
        # 自动裁剪透明边缘
        bbox = transparent.getbbox()
        if bbox:
            transparent = transparent.crop(bbox)
        
        output_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        transparent.save(output_path)
        print(f"  已保存: {output_path} ({transparent.width}x{transparent.height})")
    
    print("完成！")

if __name__ == "__main__":
    main()
