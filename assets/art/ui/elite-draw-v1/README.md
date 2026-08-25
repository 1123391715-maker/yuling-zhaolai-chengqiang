# 精英掉落「煞签显现」V2 资源包

本目录是“击杀精英怪后摇出 1～5 根煞签，直接展示强化结果”的美术资源包。资源遵循“概念图用于确认，运行时使用独立透明素材”的接入边界。

## 交付内容

| 文件 | 用途 | 状态 |
|---|---|---|
| `preview/elite-draw-key-visual-v1.png` | 竖屏整体验收图，只用于确认构图、材质与层级 | 视觉确认稿，不直接进运行时 |
| `elite-draw-sign-tube-v1.png` | 黑漆铜箍签筒、朱砂封口与青焰 | 可接入 |
| `elite-draw-seal-burst-v1.png` | 朱砂印、青焰环、符纸碎光结果特效 | 可接入 |
| `elite-draw-frame-v1.png` | 墨玉结果卡框、金色双线与四角云纹 | 可接入；优先按九宫格处理 |
| `../../vfx/elite-draw-v1/tube-shake-v2/processed-final/sheet-transparent.png` | 2×4 大签筒内成束竹签摇动序列帧 | 已接入运行时 |
| `../../vfx/elite-draw-v1/seal-burst/sheet-transparent.png` | 2×3 朱砂封印序列帧 | 已接入运行时 |
| `../../vfx/elite-draw-v1/sign-eject-v2/processed-final/sheet-transparent.png` | 2×4 扁平竹片出筒、旋转、横向落定序列帧 | 已接入运行时 |

## 运行时必须代码绘制

- `精英掉落 · 煞签显现`
- `本次摇出 1～5 根煞签`
- 强化名称、数值、短描述
- `强化已生效`
- `继续战斗`

这样可以保证中文准确、动态数据可读，并避免生图文字在小屏上变形。强化横条复用强化预览中的 `talisman-row-common / rare / legendary`，动态绑定本次已经生效的强化；结果横条需要支持 1/2/3/4/5 条布局，少于 5 条时按布局规则重新居中。

## 来源与处理

- `tube-shake-v2/raw-source.png`、`sign-eject-v2/raw-source.png`、`seal-burst/raw-source.png` 是纯 `#FF00FF` 背景的生成源，仅供追溯和重新处理。
- `*/processed-final/sheet-transparent.png` 是经 `generate2dsprite.py process` 处理的透明序列帧。
- 发布 PNG 均为 RGBA 序列帧；已检查透明 Alpha、输出边缘无不透明像素、无空帧。签筒部分源帧的青焰接近源格边缘，已确认处理后未被裁切。
- 源文件与中间产物保留，方便后续做 2x/3x、九宫格切片或重新抠边。

## 接入顺序

1. `0.45s` 入场后播放 `tube-shake-v2/sheet-transparent.png` 循环约 `3.6s`，签筒内成束竹签随筒身同步摇晃。
2. 摇定后短暂停顿并播放 `seal-burst/sheet-transparent.png`，表达定签。
3. 播放 `sign-eject-v2/sheet-transparent.png`，按结果数量复用 1～5 根扁平竹片，飞出后横向排列。
4. 竹片逐根淡出、放大，接管为强化预览横条；横条动态绑定强化名称、描述、品质和“已生效”。
5. 在目标手机尺寸回归 1/2/3/4/5 条布局、返回战斗和资源缺失降级，不把整张 preview 作为全屏背景。
