(function (root) {
  'use strict';

  var YL = root.YL = root.YL || {};
  var A = YL.Art;
  var C = YL.COLORS;
  var W = YL.W || 750;
  var H = YL.H || 1334;
  function uiFontFamily(size) {
    if (YL.uiFontFamily) return YL.uiFontFamily(size);
    return Number(size) >= 22 ? (YL.UI_FONT_TITLE_FAMILY || '"MaShanZheng","Microsoft YaHei","PingFang SC",sans-serif') : (YL.UI_FONT_BODY_FAMILY || '"Microsoft YaHei","PingFang SC",sans-serif');
  }
  var CANONICAL_HOME_LAYOUT = (YL.UI_LAYOUT && YL.UI_LAYOUT.home) || {};
  var HOME_LAYOUT = {
    profile: { x: 33, y: 40, w: 226, h: 84 },
    resources: { y: 40, w: 70, h: 42, xs: [520, 598, 676] },
    chapter: { x: 190, y: 405, w: 370, h: 80 },
    chapterPrev: { x: 136, y: 420, w: 42, h: 52 },
    chapterNext: { x: 572, y: 420, w: 42, h: 52 },
    progress: { x: 221, y: 924, w: 307, h: 34 },
    enter: { x: 257, y: 970, w: 236, h: 60 },
    // 主线与宗门共享一张紧凑任务卡，固定在底部导航上沿的左下角。
    taskGuide: CANONICAL_HOME_LAYOUT.taskGuide || { x: 18, y: 1070, w: 200, h: 86 },
    firstChargeEntry: { x: 31, y: 141, w: 214, h: 58 },
    summonEventEntry: { x: 31, y: 207, w: 214, h: 58 },
    firstChargeOffer: {
      // 首充效果图是窄幅居中的长弹窗；保留外部暗场，给主视觉和底部价格牌留出呼吸。
      x: 100, y: 38, w: 550, h: 1256,
      close: { x: 604, y: 62, w: 44, h: 44 },
      // 三个日期都是“预览页签”，已领取或尚未开放时也允许切换查看奖励。
      dayTabs: [
        { x: 132, y: 190, w: 150, h: 56 },
        { x: 300, y: 190, w: 150, h: 56 },
        { x: 468, y: 190, w: 150, h: 56 }
      ],
      action: { x: 154, y: 1118, w: 442, h: 100 }
    },
    nav: { y: 1148, h: 186, centers: [75, 225, 375, 525, 675] }
  };

  // 女魃全身素材本身带有较大的透明边距；UI 统一取有效身形区域，避免在卡片、详情和首充主视觉中显得偏小。
  var HERO_UI_SOURCE_CROPS = {
    nuba: { x: 300, y: 255, w: 430, h: 730 }
  };

  function heroUiSourceCrop(def, img) {
    var crop = def && HERO_UI_SOURCE_CROPS[def.id];
    if (!crop || !imageReady(img)) return null;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    if (iw < crop.x + crop.w || ih < crop.y + crop.h) return null;
    return crop;
  }
  var SUMMON_EVENT_LAYOUT = {
    // 返回控件按原视觉稿放在底部详情面板左下角，不再占用顶部标题区。
    back: { x: 20, y: 1162, w: 120, h: 132 },
    panel: { x: 22, y: 348, w: 706, h: 684 },
    cards: { x: 43, y: 376, w: 160, h: 153, gapX: 8, gapY: 7, cols: 4, viewportY: 376, viewportH: 638 },
    detail: { x: 22, y: 1034, w: 706, h: 278 },
    action: { x: 225, y: 1218, w: 300, h: 74 }
  };
  var SUMMON_EVENT_CARDS = [
    { id: '1-1', type: 'stage', condition: '通关 1-1', label: '请灵符', amount: '×10' },
    { id: '1-2', type: 'stage', condition: '通关 1-2', label: '请灵符', amount: '×10' },
    { id: '1-3', type: 'stage', condition: '通关 1-3', label: '请灵符', amount: '×10' }
  ];
  for (var summonChapter = 2; summonChapter <= 20; summonChapter++) {
    SUMMON_EVENT_CARDS.push({
      id: 'chapter-' + summonChapter,
      type: 'chapter',
      chapter: summonChapter,
      condition: '通关第' + summonChapter + '章',
      label: '请灵符',
      amount: '×10'
    });
  }
  // 请灵台先交付可验收的静态页面：场景是独立不透明底图，所有功能文字、数字、
  // 保底和按钮状态留在代码。后续替换完整“庭院 + 平铺法阵”底图时不改变任何交互坐标。
  var RECRUIT_LAYOUT = {
    title: { x: 20, y: 27, w: 170, h: 35 },
    resources: [
      { x: 356, y: 28, w: 114, h: 40 },
      { x: 478, y: 28, w: 114, h: 40 },
      { x: 600, y: 28, w: 124, h: 40 }
    ],
    info: { x: 198, y: 22, w: 48, h: 48 },
    record: { x: 640, y: 98, w: 84, h: 96 },
    pity: { x: 70, y: 875, w: 610, h: 114 },
    single: { x: 74, y: 1002, w: 282, h: 98 },
    ten: { x: 394, y: 1002, w: 282, h: 98 },
    currency: { x: 235, y: 1110, w: 280, h: 38 },
    // 与千抽页共用左下角返回箭头的点击范围，适配微信竖屏单手操作。
    back: { x: 20, y: 1162, w: 120, h: 132 }
  };
  // 请灵演出是独立覆盖层：十连采用 3-4-3 的法阵卡阵，避免沿用列表式或九宫格式排布。
  // 所有卡背、翻转、品质框和详情面板均由 Canvas 绘制，正式演出资源到位后可逐项替换。
  var RECRUIT_REVEAL_LAYOUT = {
    panel: { x: 22, y: 92, w: 706, h: 1018 },
    close: { x: 154, y: 1018, w: 442, h: 72 },
    singleCard: { x: 255, y: 238, w: 240, h: 334 },
    detail: { x: 58, y: 116, w: 634, h: 938 },
    detailButton: { x: 132, y: 952, w: 486, h: 72 }
  };
  // 原图为 724 × 2172 的长轴场景。这里按 750 宽等比绘制，所有地点、题签和点击区
  // 都在代码中定义，后续替换场景或调整功能时不用重新出一张带文字的总装图。
  var SECT_MAP = {
    artH: 2250,
    viewportBottom: HOME_LAYOUT.nav.y,
    // 宗门首屏固定落在地图底端；按当前游戏一次实际手势的移动距离，
    // 向上回看 200 个画布逻辑像素（约等于屏幕 100px）。
    defaultScroll: 'bottom',
    maxUpwardScroll: 200,
    cloudCover: { y: 76, h: 350 },
    locations: [
      // hit 是入口在原始长图坐标中的视觉框范围，点击区与画面标注保持一致。
      { id: 'townSoul', name: '镇魂阁', sub: '主线关卡', x: 540, y: 750, w: 206, h: 180, hit: { x: 78, y: 570, w: 594, h: 390 }, action: 'stageHome' },
      { id: 'spiritHall', name: '百灵居', sub: '建木共鸣 · 养成御灵', x: 198, y: 2025, w: 210, h: 150, hit: { x: 240, y: 1900, w: 270, h: 280 }, action: 'heroes' },
      { id: 'summon', name: '请灵台', sub: '持请灵符招募', x: 535, y: 1570, w: 205, h: 190, hit: { x: 232, y: 1420, w: 275, h: 320 }, action: 'recruit' },
      { id: 'talisman', name: '符箓坊', sub: '后续开放', x: 185, y: 1162, w: 188, h: 148, hit: { x: 42, y: 1000, w: 666, h: 340 }, action: 'locked' }
    ]
  };
  function imageReady(img) {
    return !!(img && (img.width || img.naturalWidth));
  }

  function cover(ctx, img, x, y, w, h) {
    if (!imageReady(img)) return false;
    var iw = img.width || img.naturalWidth;
    var ih = img.height || img.naturalHeight;
    var scale = Math.max(w / iw, h / ih);
    var sw = w / scale;
    var sh = h / scale;
    ctx.drawImage(img, (iw - sw) * .5, (ih - sh) * .5, sw, sh, x, y, w, h);
    return true;
  }

  function text(ctx, value, x, y, size, color, align, weight) {
    ctx.save();
    ctx.font = (weight || '700') + ' ' + size + 'px ' + uiFontFamily(size);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,.76)';
    ctx.shadowBlur = size >= 25 ? 7 : 3;
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function wrapTextLines(ctx, value, maxWidth, size, maxLines) {
    var chars = String(value == null ? '' : value).split('');
    var lines = [], line = '';
    for (var i = 0; i < chars.length; i += 1) {
      var candidate = line + chars[i];
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = chars[i];
      } else {
        line = candidate;
      }
    }
    if (line || !lines.length) lines.push(line);
    if (lines.length <= maxLines) return lines;
    // 仍然超出最大行数时，保留固定区域内的末行并加省略号，绝不覆盖图标或边框。
    lines = lines.slice(0, maxLines);
    var last = lines[maxLines - 1];
    while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
    return lines;
  }

  function fittedTextBox(ctx, value, rect, options) {
    options = options || {};
    var maxSize = options.maxSize || 14;
    var minSize = options.minSize || 9;
    var maxLines = options.maxLines || 1;
    var chosenSize = minSize;
    var lines = [String(value == null ? '' : value)];
    for (var size = maxSize; size >= minSize; size -= .5) {
      ctx.font = (options.weight || '900') + ' ' + size + 'px ' + uiFontFamily(size);
      var candidate = wrapTextLines(ctx, value, rect.w, size, maxLines);
      var widest = candidate.reduce(function (max, line) { return Math.max(max, ctx.measureText(line).width); }, 0);
      if (candidate.length <= maxLines && widest <= rect.w + .5) {
        chosenSize = size;
        lines = candidate;
        break;
      }
      chosenSize = size;
      lines = candidate;
    }
    var lineHeight = Math.min(options.lineHeight || chosenSize * 1.12, rect.h / Math.max(1, lines.length));
    var firstY = rect.y + (rect.h - lineHeight * lines.length) * .5 + lineHeight * .5;
    lines.forEach(function (line, index) {
      text(ctx, line, rect.x + rect.w * .5, firstY + index * lineHeight, chosenSize, options.color || '#f1dfb8', 'center', options.weight || '900');
    });
  }

  function clipCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  function simpleFrame(ctx, x, y, w, h, radius, alpha) {
    ctx.save();
    A.rr(ctx, x, y, w, h, radius, 'rgba(6,17,23,' + (alpha == null ? .88 : alpha) + ')', '#bd8b36', 3);
    A.rr(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(4, radius - 5), null, 'rgba(255,225,151,.42)', 1.5);
    ctx.restore();
  }

  function drawFirstChargeAsset(ctx, img, x, y, w, h, alpha) {
    if (!imageReady(img)) return false;
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawDiamond(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#d9fff8';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-5.5, -5.5, 11, 11);
    ctx.restore();
  }

  function drawCoin(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = '#efc15b';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#e6bd5a';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff0ab'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#8d6224';
    ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawEnergy(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = '#f6df69';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#f6df69';
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 11); ctx.lineTo(x - 8, y + 2); ctx.lineTo(x - 1, y + 2);
    ctx.lineTo(x - 4, y + 12); ctx.lineTo(x + 10, y - 4); ctx.lineTo(x + 3, y - 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawResources(ctx) {
    var layout = HOME_LAYOUT.resources;
    var entries = [
      { value: '218', icon: function (x, y) { drawDiamond(ctx, x, y, '#54d5c3'); } },
      { value: '1,280', icon: function (x, y) { drawCoin(ctx, x, y); } },
      { value: '37/60', icon: function (x, y) { drawEnergy(ctx, x, y); } }
    ];
    for (var i = 0; i < entries.length; i++) {
      var x = layout.xs[i];
      simpleFrame(ctx, x, layout.y, layout.w, layout.h, 14, .9);
      entries[i].icon(x + 18, layout.y + layout.h * .5);
      text(ctx, entries[i].value, x + 36, layout.y + layout.h * .5 + 1, i === 1 ? 18 : 17, '#fff3cd', 'left', '900');
    }
  }

  function drawPortrait(ctx, game, x, y, r) {
    ctx.save();
    ctx.shadowColor = '#57d7bf';
    ctx.shadowBlur = 13;
    ctx.fillStyle = '#11242b';
    ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#67dcc9'; ctx.lineWidth = 3; ctx.stroke();
    clipCircle(ctx, x, y, r - 3);
    var img = game.assets && game.assets.taoistMain;
    if (imageReady(img)) {
      var iw = img.width || img.naturalWidth;
      var ih = img.height || img.naturalHeight;
      // 只取已有透明阵主图的上半身，避免缩入头像时变成不可读的全身小人。
      ctx.drawImage(img, iw * .21, ih * .05, iw * .58, ih * .51, x - r, y - r, r * 2, r * 2);
    } else {
      var grad = ctx.createLinearGradient(x, y - r, x, y + r);
      grad.addColorStop(0, '#293b4d'); grad.addColorStop(1, '#0a1218');
      ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      text(ctx, '阵', x, y + 1, 25, '#f4ddb0', 'center', '900');
    }
    ctx.restore();
  }

  function drawProfile(ctx, game) {
    var box = HOME_LAYOUT.profile;
    simpleFrame(ctx, box.x, box.y, box.w, box.h, 22, .91);
    drawPortrait(ctx, game, box.x + 45, box.y + box.h * .5, 34);
    text(ctx, '清玄', box.x + 90, box.y + 32, 27, '#fff0bd', 'left', '900');
    text(ctx, '阵主·炼气三层', box.x + 90, box.y + 55, 16, '#bad1c9', 'left', '700');
    A.rr(ctx, box.x + 90, box.y + 67, 126, 6, 3, 'rgba(40,71,70,.9)');
    A.rr(ctx, box.x + 90, box.y + 67, 83, 6, 3, '#57cbb9');
  }

  function drawChapterTag(ctx, game) {
    var tag = HOME_LAYOUT.chapter;
    var stage = game.getSelectedStage ? game.getSelectedStage() : null;
    var stageCount = game.stageCount ? game.stageCount() : 1;
    var stageIndex = game.selectedStageIndex || 0;
    var pulse = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (.5 + .5 * Math.sin((game.time || 0) * 2.25));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(82,204,185,' + (.035 + pulse * .025) + ')';
    A.rr(ctx, tag.x - 8, tag.y - 8, tag.w + 16, tag.h + 16, 24, ctx.fillStyle);
    ctx.restore();
    simpleFrame(ctx, tag.x, tag.y, tag.w, tag.h, 20, .86);
    ctx.save();
    ctx.strokeStyle = 'rgba(216,173,85,.68)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tag.x + 20, tag.y + 24); ctx.lineTo(tag.x + 72, tag.y + 24);
    ctx.moveTo(tag.x + tag.w - 20, tag.y + 24); ctx.lineTo(tag.x + tag.w - 72, tag.y + 24);
    ctx.stroke();
    ctx.restore();
    text(ctx, stage && stage.volume || '第一卷·幽野村', tag.x + tag.w * .5, tag.y + 27, 24, '#f5d783', 'center', '900');
    text(ctx, (stage && stage.id || '1-1') + ' ' + (stage && stage.name || '纸人夜叩门'), tag.x + tag.w * .5, tag.y + 57, 31, '#fff0bd', 'center', '900');
    drawChapterArrow(ctx, HOME_LAYOUT.chapterPrev, -1, stageIndex > 0);
    drawChapterArrow(ctx, HOME_LAYOUT.chapterNext, 1, stageIndex < stageCount - 1);
  }

  function drawChapterArrow(ctx, box, direction, enabled) {
    ctx.save();
    A.rr(ctx, box.x, box.y, box.w, box.h, 13, enabled ? 'rgba(7,21,27,.90)' : 'rgba(7,16,20,.48)', enabled ? '#bc8b38' : 'rgba(123,137,132,.42)', 2);
    ctx.strokeStyle = enabled ? '#f4d37d' : '#788481';
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var cx = box.x + box.w * .5, cy = box.y + box.h * .5;
    ctx.beginPath();
    // direction -1 为上一关（←），direction 1 为下一关（→）。
    ctx.moveTo(cx - direction * 5, cy - 10);
    ctx.lineTo(cx + direction * 6, cy);
    ctx.lineTo(cx - direction * 5, cy + 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawProgress(ctx, game) {
    var p = HOME_LAYOUT.progress;
    var stage = game.getSelectedStage ? game.getSelectedStage() : null;
    var stageCount = game.stageCount ? game.stageCount() : 1;
    var stageIndex = (game.selectedStageIndex || 0) + 1;
    simpleFrame(ctx, p.x, p.y, p.w, p.h, 15, .86);
    text(ctx, '建议战力  ' + (stage && stage.recommendedPower || 1000) + '   /   本卷  ' + stageIndex + ' / ' + stageCount, p.x + p.w * .5, p.y + p.h * .5 + 1, 16, '#d6e6dd', 'center', '700');
  }

  function drawEnterButton(ctx, game) {
    var box = HOME_LAYOUT.enter;
    var hover = game.pointer && game.pointer.down && hitRect(game.pointer.x, game.pointer.y, box);
    var gradient = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    gradient.addColorStop(0, hover ? '#bd6b37' : '#a4572e');
    gradient.addColorStop(1, hover ? '#72341e' : '#613016');
    ctx.save();
    ctx.shadowColor = 'rgba(236,173,76,' + (hover ? .60 : .35) + ')';
    ctx.shadowBlur = hover ? 20 : 9;
    A.rr(ctx, box.x, box.y, box.w, box.h, 18, gradient, '#f1ce79', 3);
    A.rr(ctx, box.x + 5, box.y + 5, box.w - 10, box.h - 10, 14, null, 'rgba(255,239,189,.42)', 1.5);
    ctx.restore();
    text(ctx, '入卷镇魂', box.x + box.w * .5, box.y + box.h * .5 + 1, 26, '#fff0bd', 'center', '900');
  }

  function drawNavGlyph(ctx, type, x, y, active, locked) {
    var color = active ? '#96f5df' : locked ? '#647472' : '#e2bd64';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (active) {
      ctx.fillStyle = 'rgba(68,194,172,.72)';
      ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aaf7e8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#b8fff2'; ctx.lineWidth = 3;
    }
    if (type === 'main') {
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
    } else if (type === 'heroes') {
      ctx.beginPath(); ctx.arc(x, y - 8, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y + 11, 13, Math.PI * 1.16, Math.PI * 1.84); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 14, y + 18); ctx.lineTo(x - 19, y + 25); ctx.moveTo(x + 14, y + 18); ctx.lineTo(x + 19, y + 25); ctx.stroke();
    } else if (type === 'sect') {
      // 宗门：门楼与屋脊；和城防的城楼区分为开门、双檐的观感。
      ctx.beginPath();
      ctx.moveTo(x - 19, y - 1); ctx.lineTo(x, y - 18); ctx.lineTo(x + 19, y - 1);
      ctx.moveTo(x - 15, y + 1); ctx.lineTo(x + 15, y + 1);
      ctx.moveTo(x - 12, y + 2); ctx.lineTo(x - 12, y + 18);
      ctx.moveTo(x + 12, y + 2); ctx.lineTo(x + 12, y + 18);
      ctx.moveTo(x - 16, y + 18); ctx.lineTo(x + 16, y + 18);
      ctx.moveTo(x - 4, y + 18); ctx.lineTo(x - 4, y + 7);
      ctx.moveTo(x + 4, y + 18); ctx.lineTo(x + 4, y + 7);
      ctx.stroke();
    } else if (type === 'runes') {
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 10, y + 11); ctx.lineTo(x + 10, y - 11); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
    } else if (type === 'wall') {
      ctx.strokeRect(x - 15, y - 6, 30, 19);
      ctx.beginPath(); ctx.moveTo(x - 18, y - 7); ctx.lineTo(x - 11, y - 15); ctx.lineTo(x - 3, y - 7); ctx.lineTo(x + 5, y - 15); ctx.lineTo(x + 13, y - 7); ctx.lineTo(x + 18, y - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 7, y + 13); ctx.lineTo(x - 7, y + 4); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x + 7, y + 13); ctx.stroke();
    } else {
      ctx.beginPath();
      for (var i = 0; i < 8; i++) {
        var a = -Math.PI * .5 + i * Math.PI / 4;
        var radius = i % 2 ? 8 : 18;
        var px = x + Math.cos(a) * radius;
        var py = y + Math.sin(a) * radius;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    if (locked) {
      ctx.fillStyle = '#1a2729';
      ctx.strokeStyle = '#7f938c'; ctx.lineWidth = 1.5;
      A.rr(ctx, x + 12, y + 10, 14, 12, 3, '#1a2729', '#7f938c', 1.5);
      ctx.beginPath(); ctx.arc(x + 19, y + 10, 5, Math.PI, 0); ctx.stroke();
    }
    ctx.restore();
  }

  function drawNav(ctx, page) {
    var nav = HOME_LAYOUT.nav;
    ctx.save();
    var gradient = ctx.createLinearGradient(0, nav.y, 0, H);
    gradient.addColorStop(0, 'rgba(5,16,22,.93)');
    gradient.addColorStop(1, 'rgba(3,10,15,.98)');
    ctx.fillStyle = gradient; ctx.fillRect(0, nav.y, W, nav.h);
    ctx.strokeStyle = 'rgba(205,156,60,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(42, nav.y); ctx.lineTo(W - 42, nav.y); ctx.stroke();
    ctx.restore();
    var entries = [
      { id: 'main', label: '主线', active: page === 'main' },
      { id: 'heroes', label: '御灵', active: page === 'heroes' },
      { id: 'sect', label: '宗门', active: page === 'sect' },
      { id: 'wall', label: '城防', locked: true },
      { id: 'stories', label: '异闻', locked: true }
    ];
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      drawNavGlyph(ctx, entry.id, nav.centers[i], nav.y + 63, entry.active, entry.locked);
      text(ctx, entry.label, nav.centers[i], nav.y + 128, 21, entry.active ? '#fff0bd' : entry.locked ? '#72827e' : '#d6e6dd', 'center', '900');
    }
  }

  function hitRect(x, y, box) {
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  }

  function drawToast(ctx, game) {
    if (!game.homeNoticeUntil || game.homeNoticeUntil <= game.time) return;
    var opacity = Math.min(1, Math.max(0, game.homeNoticeUntil - game.time)) * .9;
    var recruit = game.homePage === 'recruit';
    var detail = game.homePage === 'heroDetail';
    var width = recruit ? 350 : detail ? 320 : 220;
    var x = (W - width) * .5;
    // 请灵页的操作区在下方，提示固定放在法阵和保底之间，不能遮住单双抽按钮。
    // 养成页固定在属性面板上沿，避免挡住数值预览或升级按钮。
    var y = recruit ? 832 : detail ? 864 : 1054;
    ctx.save();
    ctx.globalAlpha = opacity;
    simpleFrame(ctx, x, y, width, 44, 15, .92);
    text(ctx, game.homeNotice || '暂未开放', W * .5, y + 22, 18, '#f4ddb0', 'center', '900');
    ctx.restore();
  }

  function taskGuideView(game) {
    var guideStep = game && game.progression && game.progression.profile && game.progression.profile.guideStep;
    if (guideStep === 'stage-1-1' || guideStep === 'summon-event-open' || guideStep === 'summon-event-claim' || guideStep === 'summon-event-return' || guideStep === 'recruit') return null;
    var status = game && game.progression && game.progression.taskGuideStatus ? game.progression.taskGuideStatus() : null;
    if (!status) return null;
    if (status.allComplete) {
      var definitions = YL.TASK_GUIDE_DEFINITIONS || [];
      var last = definitions[definitions.length - 1];
      return {
        status: status,
        task: { title: '本卷任务完成', desc: '新的宗门委托即将开启', max: definitions.length, reward: last && last.reward },
        current: definitions.length,
        max: definitions.length,
        complete: false,
        allComplete: true
      };
    }
    return { status: status, task: status.task, current: status.current, max: status.max, complete: status.complete, allComplete: false };
  }

  function drawTaskGuide(ctx, game) {
    var view = taskGuideView(game);
    if (!view || (firstChargeOfferActive(game))) return;
    var box = HOME_LAYOUT.taskGuide;
    var panel = game.assets && (view.complete ? game.assets.taskGuidePanelClaimable : game.assets.taskGuidePanelIncomplete);
    if (!imageReady(panel)) panel = game.assets && game.assets.taskGuidePanel;
    ctx.save();
    ctx.translate(box.x, box.y);
    if (imageReady(panel)) {
      ctx.drawImage(panel, 0, 0, box.w, box.h);
    } else {
      // 资源加载失败时只作运行时兜底；正常交付路径使用透明任务卡成品。
      simpleFrame(ctx, 0, 0, box.w, box.h, 18, .92);
    }

    var reward = view.task.reward || {};
    var content = box.content || {};
    var icon = content.icon || { x: 34, y: 39, size: 32 };
    var rewardAmount = content.rewardAmount || { x: 34, y: 75 };
    var description = content.description || { x: 64, y: 23, w: 106, h: 28, maxLines: 2, maxSize: 14, minSize: 9 };
    var progress = content.progress || { x: 142, y: 52, w: 36, h: 22 };
    var rewardIcon = reward.asset && game.assets && game.assets[reward.asset];
    var iconX = icon.x, iconY = icon.y;
    if (imageReady(rewardIcon)) {
      ctx.save();
      ctx.shadowColor = view.complete ? '#8eeeff' : '#50d8c4';
      ctx.shadowBlur = view.complete ? 11 : 7;
      ctx.drawImage(rewardIcon, iconX - icon.size * .5, iconY - icon.size * .5, icon.size, icon.size);
      ctx.restore();
    } else {
      drawDiamond(ctx, iconX, iconY, view.complete ? '#8eeeff' : '#51d6be');
    }
    if (!view.allComplete) text(ctx, '×' + (reward.amount || 0), rewardAmount.x, rewardAmount.y, 11, '#fff0bd', 'center', '900');

    // 任务卡只保留一行描述和纯文本进度；卡框本身承担未完成/可领取的视觉状态。
    fittedTextBox(ctx, view.allComplete ? '本卷任务完成' : view.task.desc, description, {
      maxSize: description.maxSize || 14,
      minSize: description.minSize || 9,
      maxLines: description.maxLines || 2,
      color: '#f1dfb8',
      weight: '900'
    });
    text(ctx, view.current + '/' + view.max, progress.x + progress.w * .5, progress.y + progress.h * .5, 12, view.complete ? '#9eeeff' : '#d9ceb0', 'center', '900');
    ctx.restore();
  }

  function drawGuidePrompt(ctx, game, y) {
    // 有强引导目标时，提示文字由遮罩层统一承担，避免两份文案抢占注意力。
    if (YL.TutorialUI && YL.TutorialUI.isActive && YL.TutorialUI.isActive(game)) return;
    // 常驻任务卡已经承担主线/宗门的引导提示，避免旧版横条与成品任务卡叠在一起。
    if ((game.homePage === 'main' || game.homePage === 'sect') && taskGuideView(game) && !firstChargeOfferActive(game)) return;
    var step = game.progression && game.progression.profile && game.progression.profile.guideStep;
    var prompt = {
      'stage-1-1': '镇魂引导：击退诡物，守住城墙',
      recruit: '引导：请灵十次，回应新的御灵',
      grow: '引导：前往御灵，升级任意一位主灵',
      'stage-1-2': '引导：继续镇魂，已解锁二倍速',
      star: '引导：使用同名本体，完成御灵显灵',
      'stage-1-3': '引导：村门夜禁，准备迎战精英诡物',
      'first-charge': '首充敕令：女魃愿以旱仪相助',
      'chapter-2-preview': '第二卷预览：自动术法已解锁'
    }[step];
    if (!prompt) return;
    simpleFrame(ctx, 86, y, 578, 44, 14, .9);
    text(ctx, prompt, W * .5, y + 22, 18, '#c9eee1', 'center', '900');
  }

  function firstChargeStatus(game) {
    return game && game.progression && game.progression.firstChargeStatus ? game.progression.firstChargeStatus() : null;
  }

  function firstChargeEntryActive(game) {
    var status = firstChargeStatus(game);
    var stageComplete = game && game.progression && game.progression.hasCompletedStage && game.progression.hasCompletedStage('1-3');
    return !!(stageComplete && status && status.unlocked && (!status.purchased || !status.complete));
  }

  function firstChargeOfferActive(game) {
    return !!(game && game.firstChargeModal && firstChargeEntryActive(game));
  }

  function drawFirstChargeEntry(ctx, game) {
    if (!firstChargeEntryActive(game) || firstChargeOfferActive(game)) return;
    var box = HOME_LAYOUT.firstChargeEntry, status = firstChargeStatus(game);
    var available = status && status.canClaim;
    var top = available ? '三日首充 · 今日可领' : status && status.purchased ? '三日首充 · 明日再领' : '首充敕令 · 女魃入队';
    ctx.save();
    ctx.shadowColor = available ? '#60e5d1' : '#df9d4a'; ctx.shadowBlur = available ? 12 : 8;
    A.rr(ctx, box.x, box.y, box.w, box.h, 16, available ? '#145f5c' : '#5b2b2a', '#f0c66d', 2.5);
    ctx.restore();
    text(ctx, top, box.x + 18, box.y + 22, 18, '#fff0c6', 'left', '900');
    text(ctx, status && status.purchased ? '第 ' + (status.nextDay + 1) + ' 日' : '￥6', box.x + 18, box.y + 43, 16, available ? '#9df5e1' : '#ffd485', 'left', '900');
    text(ctx, '›', box.x + box.w - 22, box.y + 31, 30, '#fff0c6', 'center', '900');
  }

  function firstChargeDayName(day) {
    return ['首日', '第二日', '第三日'][day] || ('第 ' + (day + 1) + ' 日');
  }

  // 领取资格始终按真实时间推进；玩家切换日期只改变“看哪一天的奖励”，不会提前发奖。
  function firstChargePreviewDay(game, status) {
    var selected = Math.floor(Number(game && game.firstChargePreviewDay));
    if (selected >= 0 && selected <= 2) return selected;
    return status && status.purchased ? Math.min(2, status.claimDay >= 0 ? status.claimDay : status.nextDay) : 0;
  }

  function firstChargeActionState(status, game, selectedDay) {
    // 价格牌只保留短文案；演示说明与状态提示放在牌下，避免长句破坏美术按钮。
    if (status.canPurchase) return { text: '￥6', detail: '支付成功后立即领取首日奖励', enabled: true };
    var claimed = status.purchased && game && game.progression && game.progression.profile.firstChargeDaysClaimed[selectedDay];
    if (claimed) return { text: '已领取', detail: firstChargeDayName(selectedDay) + '奖励已领取', enabled: false };
    if (status.canClaim && status.claimDay === selectedDay) return { text: '领取', detail: firstChargeDayName(selectedDay) + '奖励已开放', enabled: true };
    if (status.complete) return { text: '已领取', detail: '三日奖励已全部领取', enabled: false };
    return { text: '未开放', detail: firstChargeDayName(selectedDay) + '可领取', enabled: false };
  }

  function firstChargeRewardItems(reward) {
    var items = [];
    // 首充中的角色奖励按“橙色大头像”展示；角色名和头像随奖励数据走。
    if (reward.hero) {
      var rewardDef = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.hero];
      var rewardName = rewardDef ? rewardDef.name : reward.hero;
      var rewardAvatar = reward.hero === 'nuba' ? 'firstChargeRoleAvatarNuba' : 'firstChargeRoleAvatarSuwen';
      items.push({ type: '灵', name: rewardName, amount: '×1', quality: 'orange', color: '#f0a44f', avatarAsset: rewardAvatar });
    }
    if (reward.lingyun) items.push({ type: '灵', name: '灵蕴', amount: '×' + reward.lingyun, quality: 'blue', color: '#67d9f0', asset: 'firstChargeRewardLingyun' });
    if (reward.talisman) items.push({ type: '符', name: '请灵符', amount: '×' + reward.talisman, quality: 'orange', color: '#f0a44f', asset: 'firstChargeRewardTalisman' });
    // 同名本体卡沿用首充角色头像，避免第三日回退成“本体”文字占位。
    if (reward.contract) {
      var contractDef = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS.nuba;
      items.push({ type: '本体', name: (contractDef ? contractDef.name : '女魃') + '本体卡', amount: '×' + reward.contract, quality: 'orange', color: '#f0a44f', avatarAsset: 'firstChargeRoleAvatarNuba' });
    }
    return items;
  }

  // 三日首充：标题 -> 女魃主视觉（最大） -> 小奖励 -> 购买/领取动作。
  // 这套布局和状态都由代码绘制，正式资源替换时不影响支付、领取和入口逻辑。
  function drawFirstChargeReward(ctx, game, x, y, w, h, item) {
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(20,52,59,.98)');
    bg.addColorStop(1, 'rgba(5,18,27,.98)');
    // 先绘制可替换底色，再叠加独立透明品质框；框体本身不带图标、文字或数量。
    A.rr(ctx, x, y, w, h, 16, bg, null, 0);
    var quality = item.quality || 'green';
    var frameKey = 'firstChargeItemFrame' + quality.charAt(0).toUpperCase() + quality.slice(1);
    var frame = game.assets && game.assets[frameKey];
    drawFirstChargeAsset(ctx, frame, x, y, w, h);
    ctx.save();
    var halo = ctx.createRadialGradient(x + w * .5, y + 32, 2, x + w * .5, y + 32, 36);
    halo.addColorStop(0, item.color); halo.addColorStop(1, 'rgba(7,17,25,0)');
    ctx.globalAlpha = .58; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x + w * .5, y + 32, 36, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    var avatar = item.avatarAsset && game.assets && game.assets[item.avatarAsset];
    var avatarDrawn = false;
    if (imageReady(avatar)) {
      var avatarW = avatar.width || avatar.naturalWidth, avatarH = avatar.height || avatar.naturalHeight;
      var avatarZoom = item.avatarAsset === 'firstChargeRoleAvatarNuba' ? 1.18 : 1;
      var avatarScale = Math.min((w - 18) / avatarW, 82 / avatarH) * avatarZoom;
      var avatarDrawW = avatarW * avatarScale, avatarDrawH = avatarH * avatarScale;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, 82); ctx.clip();
      drawFirstChargeAsset(ctx, avatar, x + (w - avatarDrawW) * .5, y + 1 + (82 - avatarDrawH) * .5, avatarDrawW, avatarDrawH);
      ctx.restore();
      avatarDrawn = true;
    }
    var icon = item.asset && game.assets && game.assets[item.asset];
    if (!avatarDrawn && imageReady(icon)) {
      var iw = icon.width || icon.naturalWidth, ih = icon.height || icon.naturalHeight;
       var scale = Math.min((w - 18) / iw, 72 / ih), dw = iw * scale, dh = ih * scale;
       drawFirstChargeAsset(ctx, icon, x + (w - dw) * .5, y + 4 + (72 - dh) * .5, dw, dh);
    } else if (!avatarDrawn) {
      text(ctx, item.type, x + w * .5, y + 33, 27, '#fff0c6', 'center', '900');
    }
    text(ctx, item.name, x + w * .5, y + 86, 16, '#fff4d0', 'center', '900');
    text(ctx, item.amount, x + w * .5, y + 110, 17, item.color, 'center', '900');
  }

  function drawFirstChargeHero(ctx, game, def, x, y, w, h) {
    var img = game.assets && game.assets[def && def.sprite];
    // The reference has no rectangular portrait card. Use only a soft
    // water-colour halo and the transparent standee itself.
    ctx.save();
    var water = ctx.createRadialGradient(x + w * .5, y + h * .56, 16, x + w * .5, y + h * .56, w * .56);
    water.addColorStop(0, 'rgba(77,231,218,.20)');
    water.addColorStop(.55, 'rgba(30,130,145,.10)');
    water.addColorStop(1, 'rgba(5,18,28,0)');
    ctx.fillStyle = water;
    ctx.beginPath(); ctx.ellipse(x + w * .5, y + h * .56, w * .5, h * .48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.globalAlpha = .68; ctx.strokeStyle = 'rgba(108,241,235,.72)'; ctx.lineWidth = 3;
    for (var ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.ellipse(x + w * .5, y + h * .72, w * (.34 + ring * .07), h * (.09 + ring * .018), 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }
    ctx.restore();
    if (imageReady(img)) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      // 默认使用 contain；女魃改用有效身形源框，保留完整身形的同时与其他角色保持视觉高度。
      var sourceCrop = heroUiSourceCrop(def, img);
      var sourceX = sourceCrop ? sourceCrop.x : 0, sourceY = sourceCrop ? sourceCrop.y : 0;
      var sourceW = sourceCrop ? sourceCrop.w : iw, sourceH = sourceCrop ? sourceCrop.h : ih;
      var scale = Math.min((w - 20) / sourceW, (h - 12) / sourceH);
      var dw = sourceW * scale, dh = sourceH * scale;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      if (sourceCrop) ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, x + (w - dw) * .5, y + (h - dh) * .5 - 5, dw, dh);
      else drawFirstChargeAsset(ctx, img, x + (w - dw) * .5, y + (h - dh) * .5 - 5, dw, dh);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFirstChargeOffer(ctx, game) {
    if (!firstChargeOfferActive(game)) return;
    var box = HOME_LAYOUT.firstChargeOffer;
    var def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS.nuba;
    var status = firstChargeStatus(game);
    var day = firstChargePreviewDay(game, status);
    var reward = status.rewards[day];
    var actionState = firstChargeActionState(status, game, day);
    var action = actionState.text;
    var actionEnabled = actionState.enabled;
    ctx.save();
    ctx.fillStyle = 'rgba(1,7,12,.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    var panel = game.assets && game.assets.firstChargePanel;
    if (imageReady(panel)) {
      ctx.save();
      ctx.shadowColor = 'rgba(65,220,202,.3)'; ctx.shadowBlur = 22;
      ctx.drawImage(panel, box.x, box.y, box.w, box.h);
      ctx.restore();
    } else {
      simpleFrame(ctx, box.x, box.y, box.w, box.h, 28, .985);
    }
    var header = game.assets && game.assets.firstChargeHeaderOrnament;
    drawFirstChargeAsset(ctx, header, box.x + 56, box.y - 10, box.w - 112, 153);
    text(ctx, '首充敕令', W * .5, box.y + 54, 43, '#f5d787', 'center', '900');
    text(ctx, '三日首充 · 每日一礼', W * .5, box.y + 91, 20, '#77ead5', 'center', '900');
    A.rr(ctx, box.close.x, box.close.y, box.close.w, box.close.h, 20, 'rgba(19,34,42,.92)', '#d8b160', 2);
    text(ctx, '×', box.close.x + box.close.w * .5, box.close.y + box.close.h * .5 + 1, 28, '#fff0c6', 'center', '900');
    for (var tab = 0; tab < 3; tab++) {
      var tabBox = box.dayTabs[tab], claimed = status.purchased && game.progression.profile.firstChargeDaysClaimed[tab];
      var tabAsset = tab === day ? game.assets.firstChargeTabActive : game.assets.firstChargeTabInactive;
      if (!drawFirstChargeAsset(ctx, tabAsset, tabBox.x, tabBox.y, tabBox.w, tabBox.h)) {
        A.rr(ctx, tabBox.x, tabBox.y, tabBox.w, tabBox.h, 15, tab === day ? '#1b746d' : '#182c35', tab === day ? '#8cf2da' : '#8d7643', 2);
      }
      text(ctx, '第' + (tab + 1) + '日' + (claimed ? ' · 已领' : ''), tabBox.x + tabBox.w * .5, tabBox.y + tabBox.h * .5 + 1, 17, tab === day ? '#effff1' : '#e8d39a', 'center', '900');
    }
    var side = game.assets && game.assets.firstChargeSideOrnament;
    drawFirstChargeAsset(ctx, side, box.x + box.w - 34, box.y + 208, 52, 153, .94);
    if (def) {
      var heroX = box.x + 52, heroY = box.y + 270, heroW = box.w - 104, heroH = 500;
      drawFirstChargeHero(ctx, game, def, heroX, heroY, heroW, heroH);
      var heroPlate = game.assets && game.assets.firstChargeHeroNameplate;
      if (!drawFirstChargeAsset(ctx, heroPlate, W * .5 - 142, box.y + 742, 284, 60)) {
        A.rr(ctx, W * .5 - 142, box.y + 742, 284, 56, 18, 'rgba(3,12,18,.76)', '#e7bc64', 2);
      }
      text(ctx, '核心御灵 · 女魃', W * .5, box.y + 772, 23, '#fff0c6', 'center', '900');
    }
    text(ctx, '混沌 · 灾厄群攻 · 以裂日天仪焚裂敌阵', W * .5, box.y + 832, 19, '#d6c8dc', 'center', '900');
    text(ctx, firstChargeDayName(day) + '奖励预览', W * .5, box.y + 878, 22, '#f2d383', 'center', '900');
    var items = firstChargeRewardItems(reward);
    var rewardGap = 14, rewardW = 164, rewardH = 136;
    var rewardStart = (W - (items.length * rewardW + Math.max(0, items.length - 1) * rewardGap)) * .5;
    for (var rewardIndex = 0; rewardIndex < items.length; rewardIndex++) {
      var item = items[rewardIndex];
      drawFirstChargeReward(ctx, game, rewardStart + rewardIndex * (rewardW + rewardGap), box.y + 908, rewardW, rewardH, item);
    }
    var pressed = (game.firstChargeButtonPressedUntil || 0) > game.time;
    var buttonAsset = !actionEnabled ? game.assets.firstChargeButtonDisabled : pressed ? game.assets.firstChargeButtonPressed : game.assets.firstChargeButtonNormal;
    if (!drawFirstChargeAsset(ctx, buttonAsset, box.action.x, box.action.y, box.action.w, box.action.h)) {
      A.rr(ctx, box.action.x, box.action.y, box.action.w, box.action.h, 22, actionEnabled ? '#b86a21' : '#3a4548', actionEnabled ? '#ffdd7b' : '#7d8986', 3);
      A.rr(ctx, box.action.x + 5, box.action.y + 5, box.action.w - 10, box.action.h - 10, 18, null, actionEnabled ? 'rgba(255,246,181,.55)' : 'rgba(255,255,255,.18)', 1.4);
    }
    text(ctx, action, W * .5, box.action.y + 43, action === '￥6' ? 42 : 25, actionEnabled ? '#fff7d0' : '#b8c0bd', 'center', '900');
    text(ctx, actionState.detail || '', W * .5, box.action.y + 82, 15, '#e5d6a4', 'center', '700');
    text(ctx, '演示环境：点击仅模拟支付成功，不发起真实支付', W * .5, box.action.y + 125, 15, '#aabbb8', 'center', '700');
    drawFirstChargeAsset(ctx, game.assets && game.assets.firstChargeBottomOrnament, box.x + 7, box.y + 1209, box.w - 14, 38, .96);
  }

  function drawSummonEventEntry(ctx, game) {
    if (!game || game.homePage !== 'main' || game.summonEventModal) return;
    var box = HOME_LAYOUT.summonEventEntry;
    ctx.save();
    ctx.shadowColor = '#df8e3f'; ctx.shadowBlur = 10;
    A.rr(ctx, box.x, box.y, box.w, box.h, 16, 'rgba(85,35,27,.94)', '#f0c66d', 2.5);
    ctx.restore();
    var emblem = game.assets && game.assets.summonEventEmblem;
    if (!drawFirstChargeAsset(ctx, emblem, box.x + 7, box.y + 5, 48, 48)) {
      A.rr(ctx, box.x + 9, box.y + 9, 40, 40, 12, '#a54d2d', '#ffd98b', 1.5);
    }
    text(ctx, '千抽盛典', box.x + 64, box.y + 22, 18, '#fff0c6', 'left', '900');
    text(ctx, '请灵符 · 关卡福利', box.x + 64, box.y + 43, 14, '#ffd485', 'left', '900');
    text(ctx, '›', box.x + box.w - 21, box.y + 31, 30, '#fff0c6', 'center', '900');
  }

  function summonEventContentHeight() {
    var layout = SUMMON_EVENT_LAYOUT.cards;
    var rows = Math.ceil(SUMMON_EVENT_CARDS.length / layout.cols);
    return rows * layout.h + Math.max(0, rows - 1) * layout.gapY;
  }

  function summonEventScrollLimit() {
    var layout = SUMMON_EVENT_LAYOUT.cards;
    return Math.max(0, summonEventContentHeight() - layout.viewportH);
  }

  function clampSummonEventScroll(game) {
    var requested = Number(game && game.summonEventScroll);
    if (!isFinite(requested)) requested = 0;
    return Math.max(0, Math.min(summonEventScrollLimit(), requested));
  }

  function summonEventCardRect(index, scroll) {
    var layout = SUMMON_EVENT_LAYOUT.cards;
    var col = index % layout.cols, row = Math.floor(index / layout.cols);
    return { x: layout.x + col * (layout.w + layout.gapX), y: layout.y + row * (layout.h + layout.gapY) - (Number(scroll) || 0), w: layout.w, h: layout.h };
  }

  function summonEventTaskComplete(game, card) {
    var progression = game && game.progression;
    var profile = progression && progression.profile;
    if (!profile || !card) return false;
    var completed = profile.completedStages || {};
    if (card.type === 'stage') {
      if (completed[card.id]) return true;
      // 兼容活动改版前已经完成的前三关存档。
      return !!(profile.taskGuideProgress && Number(profile.taskGuideProgress['stage-' + card.id]) >= 1);
    }
    var prefix = String(card.chapter) + '-';
    for (var stageId in completed) {
      if (completed[stageId] && String(stageId).indexOf(prefix) === 0) return true;
    }
    return false;
  }

  function summonEventCardStatus(game, index) {
    var card = SUMMON_EVENT_CARDS[index];
    if (!card) return 'locked';
    if (game && game.summonEventClaimed && game.summonEventClaimed[index]) return 'claimed';
    return summonEventTaskComplete(game, card) ? 'claimable' : 'locked';
  }

  function summonEventCardLabel(card) {
    return (card && card.label || '请灵符') + ' ' + (card && card.amount || '×10');
  }

  function summonEventCardHeader(card) {
    return card && card.condition || '任务条件';
  }

  function summonEventClaimedCount(game) {
    var claimed = game && game.summonEventClaimed || {}, count = 0;
    for (var key in claimed) if (claimed[key]) count++;
    return count;
  }

  function summonEventTicketImage(game) {
    // 千抽页的奖励是请灵符卷轴，优先使用首充页的独立透明资源，避免被结果页的小方符替代。
    return game.assets && (game.assets.firstChargeRewardTalisman || game.assets.resultRewardTalisman);
  }

  function drawSummonEventRewardIcon(ctx, game, x, y, w, h, alpha, card) {
    var img = summonEventTicketImage(game);
    if (imageReady(img)) {
      ctx.save();
      if (alpha != null) ctx.globalAlpha = alpha;
      // 每项奖励统一为 10 个请灵符；数量由文字表达，图标只绘制一次，
      // 避免把“数量堆叠”误看成点击后又叠了一层实际道具图。
      ctx.drawImage(img, x + w * .05, y, w * .9, h);
      ctx.restore();
      return true;
    }
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = '#e7b85c'; ctx.strokeStyle = '#fff1b0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + w * .5, y); ctx.lineTo(x + w, y + h * .16); ctx.lineTo(x + w * .82, y + h); ctx.lineTo(x + w * .18, y + h); ctx.lineTo(0 + x, y + h * .16); ctx.closePath(); ctx.fill(); ctx.stroke();
    text(ctx, '符', x + w * .5, y + h * .55, Math.min(25, w * .45), '#6e301f', 'center', '900');
    ctx.restore();
    return false;
  }

  function drawSummonEventCard(ctx, game, index, selected, scroll) {
    var card = SUMMON_EVENT_CARDS[index], rect = summonEventCardRect(index, scroll);
    var status = summonEventCardStatus(game, index);
    var assetKey = status === 'claimable' ? 'summonEventRewardCardClaimable' : status === 'claimed' ? 'summonEventRewardCardClaimed' : 'summonEventRewardCardLocked';
    var asset = game.assets && game.assets[assetKey];
    if (!drawFirstChargeAsset(ctx, asset, rect.x, rect.y, rect.w, rect.h)) {
      simpleFrame(ctx, rect.x, rect.y, rect.w, rect.h, 14, status === 'locked' ? .62 : .9);
    }
    if (selected) {
      ctx.save(); ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 2.5; ctx.shadowColor = '#ffe284'; ctx.shadowBlur = 12;
      ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6); ctx.restore();
    }
    // 验收稿要求固定信息层级：任务条件在图标上方，奖励文本在图标下方，
    // 三种状态统一使用同一块状态牌，避免“可领取/已领取/未达成”各占不同位置。
    text(ctx, summonEventCardHeader(card), rect.x + rect.w * .5, rect.y + 24, 18, status === 'locked' ? '#c9b58c' : '#ffe3a0', 'center', '900');
    drawSummonEventRewardIcon(ctx, game, rect.x + rect.w * .5 - 38, rect.y + 31, 76, 78, status === 'locked' ? .62 : .98, card);
    text(ctx, summonEventCardLabel(card), rect.x + rect.w * .5, rect.y + 119, 17, status === 'locked' ? '#bba988' : '#fff1c1', 'center', '900');
    drawSummonEventStatusPill(ctx, game, rect, status);
  }

  function drawSummonEventStatusPill(ctx, game, rect, status) {
    var x = rect.x + 12, y = rect.y + 128, w = rect.w - 24, h = 22;
    var fill = status === 'claimable' ? 'rgba(99,43,17,.94)' : status === 'claimed' ? 'rgba(25,68,44,.94)' : 'rgba(37,35,30,.94)';
    var stroke = status === 'claimable' ? '#ffd66d' : status === 'claimed' ? '#79d798' : '#8e8064';
    var color = status === 'claimable' ? '#fff1b1' : status === 'claimed' ? '#b9ffd0' : '#bdb39d';
    A.rr(ctx, x, y, w, h, 8, fill, stroke, status === 'claimable' ? 1.8 : 1.2);
    if (status === 'locked') {
      var seal = game.assets && game.assets.summonEventLockedSeal;
      drawFirstChargeAsset(ctx, seal, x + 7, y + 2, 18, 19, .86);
      text(ctx, '未达成', x + w * .5 + 8, y + 17, 15, color, 'center', '900');
    } else {
      text(ctx, status === 'claimed' ? '已领取' : '可领取', x + w * .5, y + 17, 15, color, 'center', '900');
    }
  }

  function drawSummonEventDetailTicket(ctx, game, x, y, w, h, flip) {
    var img = summonEventTicketImage(game);
    if (!imageReady(img)) return false;
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      drawFirstChargeAsset(ctx, img, 0, 0, w, h, .96);
    } else {
      drawFirstChargeAsset(ctx, img, x, y, w, h, .96);
    }
    ctx.restore();
    return true;
  }

  function drawSummonEventReturnArrow(ctx, game) {
    // 原视觉稿的返回入口是详情面板左下角的厚重金色回形箭头。
    var arrowAsset = game && game.assets && game.assets.summonEventReturnArrow;
    if (imageReady(arrowAsset)) {
      drawFirstChargeAsset(ctx, arrowAsset, 20, 1174, 120, 112, .98);
      return;
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff9b28';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#4a1c0d';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(103, 1260);
    ctx.bezierCurveTo(67, 1260, 48, 1245, 48, 1220);
    ctx.bezierCurveTo(48, 1198, 65, 1184, 92, 1184);
    ctx.stroke();
    ctx.strokeStyle = '#e9a743';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(103, 1260);
    ctx.bezierCurveTo(67, 1260, 48, 1245, 48, 1220);
    ctx.bezierCurveTo(48, 1198, 65, 1184, 92, 1184);
    ctx.stroke();
    ctx.strokeStyle = '#ffe59a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(101, 1257);
    ctx.bezierCurveTo(72, 1257, 55, 1242, 55, 1220);
    ctx.bezierCurveTo(55, 1203, 69, 1191, 89, 1191);
    ctx.stroke();
    ctx.fillStyle = '#4a1c0d';
    ctx.beginPath();
    ctx.moveTo(28, 1220);
    ctx.lineTo(72, 1190);
    ctx.lineTo(62, 1216);
    ctx.lineTo(82, 1247);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f0b64d';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#f0b64d';
    ctx.beginPath();
    ctx.moveTo(35, 1220);
    ctx.lineTo(70, 1197);
    ctx.lineTo(61, 1219);
    ctx.lineTo(75, 1240);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSummonEvent(ctx, game) {
    var layout = SUMMON_EVENT_LAYOUT, selected = Math.max(0, Math.min(SUMMON_EVENT_CARDS.length - 1, Number(game.summonEventSelected) || 0));
    var selectedCard = SUMMON_EVENT_CARDS[selected];
    var selectedStatus = summonEventCardStatus(game, selected);
    // 千抽页必须由动态卡片层绘制。旧版先铺整张 reference 截图，再绘制实际道具图标，
    // 点击任务后会形成“静态图标 + 实际图标”的重影；reference 资源仅保留作历史视觉稿。
    var backdrop = game.assets && game.assets.summonEventBackdrop;
    if (imageReady(backdrop)) {
      cover(ctx, backdrop, 0, 0, W, 452);
      ctx.fillStyle = '#2a1112'; ctx.fillRect(0, 432, W, H - 432);
      var lowerShade = ctx.createLinearGradient(0, 330, 0, 650);
      lowerShade.addColorStop(0, 'rgba(30,8,8,.04)'); lowerShade.addColorStop(1, 'rgba(37,12,12,.97)');
      ctx.fillStyle = lowerShade; ctx.fillRect(0, 326, W, 350);
    } else if (!cover(ctx, game.assets && game.assets.homeArchiveBook, 0, 0, W, H)) {
      ctx.fillStyle = '#140b0d'; ctx.fillRect(0, 0, W, H);
    }
    ctx.save(); ctx.fillStyle = 'rgba(8,4,7,.22)'; ctx.fillRect(0, 0, W, 395); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(255,155,54,.24)'; ctx.shadowBlur = 24;
    A.rr(ctx, 13, 10, W - 26, H - 20, 26, 'rgba(36,16,15,.24)', '#8c5b2d', 2.5); ctx.restore();
    var titleOrnament = game.assets && game.assets.summonEventTitleOrnament;
    drawFirstChargeAsset(ctx, titleOrnament, 28, 60, 526, 138, .92);
    var title = game.assets && game.assets.summonEventTitle;
    if (!drawFirstChargeAsset(ctx, title, 42, 72, 506, 128)) text(ctx, '千抽请灵符盛典', 295, 136, 37, '#ffdc7b', 'center', '900');
    var hero = game.assets && game.assets.summonEventHeroHongyi;
    if (imageReady(hero)) {
      var hw = 286, hh = 394;
      drawFirstChargeAsset(ctx, hero, 464, 0, hw, hh, .96);
    }
    A.rr(ctx, 80, 220, 440, 50, 11, 'rgba(34,10,9,.9)', '#bd7a31', 2);
    drawFirstChargeAsset(ctx, game.assets && game.assets.summonEventTopOrnamentGold, 132, 216, 336, 58, .8);
    ctx.save();
    ctx.shadowColor = '#ffad3b'; ctx.shadowBlur = 8;
    text(ctx, '完成关卡条件，领取请灵符 ×10', 300, 251, 20, '#ffe6a5', 'center', '900');
    ctx.restore();
    var panel = game.assets && game.assets.summonEventPanel;
    if (!drawFirstChargeAsset(ctx, panel, layout.panel.x, layout.panel.y, layout.panel.w, layout.panel.h, .86)) simpleFrame(ctx, layout.panel.x, layout.panel.y, layout.panel.w, layout.panel.h, 24, .9);
    drawFirstChargeAsset(ctx, game.assets && game.assets.summonEventHangingPendantPair, 26, 340, 72, 118, .58);
    drawFirstChargeAsset(ctx, game.assets && game.assets.summonEventSidePendant, 650, 430, 54, 170, .52);
    drawFirstChargeAsset(ctx, game.assets && game.assets.summonEventCornerOrnamentRightTop, 614, 432, 103, 110, .58);
    drawFirstChargeAsset(ctx, game.assets && game.assets.summonEventCornerOrnamentLeftBottom, 22, 936, 96, 98, .45);
    var eventScroll = clampSummonEventScroll(game);
    ctx.save();
    ctx.beginPath();
    ctx.rect(30, layout.cards.viewportY, W - 60, layout.cards.viewportH);
    ctx.clip();
    for (var index = 0; index < SUMMON_EVENT_CARDS.length; index++) drawSummonEventCard(ctx, game, index, index === selected, eventScroll);
    ctx.restore();
    var scrollLimit = summonEventScrollLimit();
    if (scrollLimit > 0) {
      var trackY = layout.cards.viewportY + 8, trackH = layout.cards.viewportH - 16;
      var thumbH = Math.max(54, trackH * layout.cards.viewportH / summonEventContentHeight());
      var thumbY = trackY + (trackH - thumbH) * (eventScroll / scrollLimit);
      ctx.save();
      ctx.fillStyle = 'rgba(19,8,8,.62)'; ctx.fillRect(716, trackY, 7, trackH);
      ctx.fillStyle = '#d8a34f'; ctx.fillRect(716, thumbY, 7, thumbH);
      ctx.restore();
    }
    var detail = game.assets && game.assets.summonEventDetailPanel;
    if (!drawFirstChargeAsset(ctx, detail, layout.detail.x, layout.detail.y, layout.detail.w, layout.detail.h, .96)) simpleFrame(ctx, layout.detail.x, layout.detail.y, layout.detail.w, layout.detail.h, 18, .93);
    drawSummonEventDetailTicket(ctx, game, 66, 1048, 106, 136, false);
    drawSummonEventDetailTicket(ctx, game, 626, 1048, 106, 136, true);
    var claimedCount = summonEventClaimedCount(game), totalCount = SUMMON_EVENT_CARDS.length;
    text(ctx, summonEventCardHeader(selectedCard), W * .5, 1088, 24, '#f4d58d', 'center', '900');
    text(ctx, summonEventCardLabel(selectedCard), W * .5, 1122, 34, '#fff0bd', 'center', '900');
    text(ctx, selectedStatus === 'claimable' ? '达成条件可领取' : selectedStatus === 'claimed' ? '奖励已领取' : '完成对应关卡后解锁', W * .5, 1155, 17, selectedStatus === 'claimable' ? '#a4ffd2' : '#d2c5a8', 'center', '900');
    text(ctx, '已领取数量 ' + claimedCount + ' / ' + totalCount, W * .5, 1182, 19, '#f0d078', 'center', '900');
    drawSummonEventReturnArrow(ctx, game);
    var enabled = selectedStatus === 'claimable', pressed = (game.summonEventButtonPressedUntil || 0) > game.time;
    var buttonKey = !enabled ? 'summonEventButtonDisabled' : pressed ? 'summonEventButtonPressed' : 'summonEventButtonNormal';
    var button = game.assets && game.assets[buttonKey];
    if (!drawFirstChargeAsset(ctx, button, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) A.rr(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, 18, enabled ? '#9b4e24' : '#3b403a', enabled ? '#ffd577' : '#7d847a', 2);
    text(ctx, enabled ? '立即领取' : selectedStatus === 'claimed' ? '已领取' : '未达成', layout.action.x + layout.action.w * .5, layout.action.y + 35, 22, enabled ? '#fff2c3' : '#afb5ab', 'center', '900');
    drawToast(ctx, game);
  }

  function drawSectHeader(ctx, game) {
    var shade = ctx.createLinearGradient(0, 0, 0, 178);
    shade.addColorStop(0, 'rgba(2,10,17,.86)');
    shade.addColorStop(1, 'rgba(2,10,17,0)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 178);
    drawProfile(ctx, game);
    drawResources(ctx);
    text(ctx, '建木宗门', W * .5, 71, 30, '#f3d27c', 'center', '900');
    text(ctx, '沿枝而上 · 诸殿待启', W * .5, 104, 16, '#abd8d0', 'center', '700');
  }

  function sectScrollLimit() {
    return Math.max(0, SECT_MAP.artH - SECT_MAP.viewportBottom);
  }

  function sectScrollMin() {
    return Math.max(0, sectScrollLimit() - SECT_MAP.maxUpwardScroll);
  }

  function sectScrollDefault() {
    if (SECT_MAP.defaultScroll === 'bottom') return sectScrollLimit();
    return Math.max(sectScrollMin(), Math.min(sectScrollLimit(), Number(SECT_MAP.defaultScroll) || 0));
  }

  function clampSectScroll(game) {
    var limit = sectScrollLimit();
    var requested = Number(game.sectScroll);
    if (!isFinite(requested)) requested = sectScrollDefault();
    game.sectScroll = Math.max(sectScrollMin(), Math.min(limit, requested));
    return game.sectScroll;
  }

  function drawSectLocation(ctx, location, scroll, time) {
    var y = location.y - scroll;
    if (y < 162 || y > HOME_LAYOUT.nav.y - 34) return;
    var unlocked = location.action !== 'locked';
    var showEntrancePoint = location.id !== 'spiritHall' && location.id !== 'summon';
    var pulse = .5 + .5 * Math.sin((time || 0) * 2.1 + location.y * .01);
    var side = location.x > W * .5 ? -1 : 1;
    var badgeX = location.x + side * 33;
    var labelX = badgeX + side * 73;
    ctx.save();
    if (showEntrancePoint) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = unlocked ? 'rgba(56,212,194,' + (.10 + pulse * .07) + ')' : 'rgba(145,151,141,.07)';
      ctx.beginPath(); ctx.arc(location.x, y, 46 + pulse * 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.shadowColor = unlocked ? '#54dfd0' : '#6f7773'; ctx.shadowBlur = unlocked ? 15 : 0;
      ctx.fillStyle = unlocked ? '#51d7c2' : '#56615e';
      ctx.beginPath(); ctx.arc(location.x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d8f5e9'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    var labelW = location.sub.indexOf('敬请') >= 0 ? 190 : 146;
    var panelX = side > 0 ? labelX - 10 : labelX - labelW + 10;
    simpleFrame(ctx, panelX, y - 36, labelW, 60, 13, .83);
    text(ctx, location.name, panelX + labelW * .5, y - 13, 20, unlocked ? '#ffe4a1' : '#acb1a7', 'center', '900');
    text(ctx, location.sub, panelX + labelW * .5, y + 11, 13, unlocked ? '#bfe5dc' : '#78837f', 'center', '700');
  }

  function drawSectScrollHint(ctx, scroll) {
    // 默认已经在底端，不再放一个会误导玩家继续上滑的常驻提示。
    if (scroll < sectScrollLimit() - 8) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (scroll - sectScrollMin()) / 36 + .25);
      text(ctx, '下滑查看上方', W * .5, 1090, 15, '#b5d8d1', 'center', '700');
      ctx.strokeStyle = '#7ee1d4'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(W * .5 - 7, 1084); ctx.lineTo(W * .5, 1091); ctx.lineTo(W * .5 + 7, 1084); ctx.stroke();
      ctx.restore();
    }
  }

  function drawSectCloudCover(ctx, game) {
    var cover = SECT_MAP.cloudCover;
    var cloud = game && game.assets && game.assets.sectCloudCover;
    ctx.save();
    if (imageReady(cloud)) {
      // 用户确认的静态视觉稿作为唯一运行时云层。透明羽化已经做进资源，
      // 这里不再用矩形 clip，避免在场景中留下横向横幅边界。
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = .82;
      ctx.drawImage(cloud, -24, cover.y, W + 48, cover.h);
    } else {
      // 资源加载失败时保留原来的 Canvas 雾效作为降级，不影响宗门页可用性。
      var shade = ctx.createLinearGradient(0, cover.y + 42, 0, cover.y + cover.h - 36);
      shade.addColorStop(0, 'rgba(151,205,211,0)');
      shade.addColorStop(.22, 'rgba(151,205,211,.48)');
      shade.addColorStop(.64, 'rgba(100,164,177,.27)');
      shade.addColorStop(1, 'rgba(50,108,128,0)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, cover.y, W, cover.h);
      ctx.globalCompositeOperation = 'lighter';
      var puffs = [
        { x: 92, y: cover.y + 92, r: 86 }, { x: 238, y: cover.y + 54, r: 112 },
        { x: 414, y: cover.y + 108, r: 104 }, { x: 588, y: cover.y + 66, r: 128 },
        { x: 728, y: cover.y + 126, r: 88 }
      ];
      for (var i = 0; i < puffs.length; i++) {
        var puff = puffs[i];
        var gradient = ctx.createRadialGradient(puff.x, puff.y, 4, puff.x, puff.y, puff.r);
        gradient.addColorStop(0, 'rgba(185,224,224,.22)');
        gradient.addColorStop(.72, 'rgba(121,188,198,.10)');
        gradient.addColorStop(1, 'rgba(121,188,198,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawSect(ctx, game) {
    var scroll = clampSectScroll(game);
    var img = game.assets && game.assets.sectMapNight;
    if (imageReady(img)) ctx.drawImage(img, 0, -scroll, W, SECT_MAP.artH);
    else { ctx.fillStyle = '#071822'; ctx.fillRect(0, 0, W, H); }
    var lowerShade = ctx.createLinearGradient(0, 880, 0, HOME_LAYOUT.nav.y);
    lowerShade.addColorStop(0, 'rgba(2,9,15,0)'); lowerShade.addColorStop(1, 'rgba(2,9,15,.58)');
    ctx.fillStyle = lowerShade; ctx.fillRect(0, 880, W, HOME_LAYOUT.nav.y - 880);
    for (var i = 0; i < SECT_MAP.locations.length; i++) drawSectLocation(ctx, SECT_MAP.locations[i], scroll, game.time);
    // 云雾盖在上方暂未接入的建筑与题签之上，但标题/资源栏随后单独绘制保持清晰。
    drawSectCloudCover(ctx, game);
    drawSectHeader(ctx, game);
    drawSectScrollHint(ctx, scroll);
    drawNav(ctx, 'sect');
    drawFirstChargeEntry(ctx, game);
    drawTaskGuide(ctx, game);
    drawToast(ctx, game);
    drawFirstChargeOffer(ctx, game);
  }

  function drawRecruitEmblem(ctx, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(86,223,205,.45)'; ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(10,38,43,.92)';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9ae53'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = '#63d5c7'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(0, 0, radius - 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f0c669';
    for (var i = 0; i < 8; i++) {
      var angle = -Math.PI * .5 + i * Math.PI / 4;
      var px = Math.cos(angle) * (radius - 10), py = Math.sin(angle) * (radius - 10);
      ctx.beginPath(); ctx.arc(px, py, 2.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#91f2de'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(-7, -7); ctx.lineTo(7, 7);
    ctx.moveTo(7, -7); ctx.lineTo(-7, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawRecruitRewardIcon(ctx, img, x, y, fallback) {
    ctx.save();
    if (imageReady(img)) {
      ctx.drawImage(img, x - 15, y - 15, 30, 30);
    } else if (fallback === 'lingyun') {
      ctx.shadowColor = '#4be4d0'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#44cfc0'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d1fff3'; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (fallback === 'spiritSeed') {
      ctx.shadowColor = '#83f0d2'; ctx.shadowBlur = 9;
      var seed = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, 13);
      seed.addColorStop(0, '#efffd1'); seed.addColorStop(.38, '#79dfb7'); seed.addColorStop(1, '#217b73');
      ctx.fillStyle = seed;
      ctx.beginPath();
      ctx.moveTo(x, y - 13); ctx.bezierCurveTo(x + 9, y - 7, x + 8, y + 7, x, y + 13);
      ctx.bezierCurveTo(x - 8, y + 7, x - 9, y - 7, x, y - 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e5ffe4'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,210,.9)'; ctx.lineWidth = 1;
      for (var petal = 0; petal < 5; petal++) {
        var angle = -Math.PI * .5 + petal * Math.PI * 2 / 5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6); ctx.stroke();
      }
    } else {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.55);
      A.rr(ctx, -7, -13, 14, 26, 3, '#d8a74b', '#fff0ad', 1.3);
      ctx.strokeStyle = '#773b1b'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.moveTo(-3, 7); ctx.lineTo(3, 7); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawRecruitResource(ctx, game, box, kind, label) {
    var frame = game.assets.recruitResourceFrame;
    if (imageReady(frame)) ctx.drawImage(frame, box.x, box.y, box.w, box.h);
    else simpleFrame(ctx, box.x, box.y, box.w, box.h, 15, .87);
    var asset = kind === 'lingyun' ? game.assets.resultRewardLingyun : kind === 'talisman' ? game.assets.resultRewardTalisman : null;
    drawRecruitRewardIcon(ctx, asset, box.x + 20, box.y + box.h * .5, kind);
    text(ctx, label, box.x + 41, box.y + box.h * .5 + 1, 14, '#fff0bd', 'left', '900');
    text(ctx, '+', box.x + box.w - 19, box.y + box.h * .5 + 1, 20, '#f4d587', 'center', '900');
  }

  function drawRecruitRecord(ctx, game, box) {
    var cx = box.x + box.w * .5, cy = box.y + 34;
    ctx.save();
    if (imageReady(game.assets.recruitRecordFrame)) ctx.drawImage(game.assets.recruitRecordFrame, box.x + 14, box.y + 6, 56, 57);
    else {
      ctx.shadowColor = 'rgba(239,186,82,.4)'; ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(19,26,27,.91)'; ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d4a84e'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.translate(cx, cy); ctx.rotate(.46);
    A.rr(ctx, -8, -15, 16, 30, 3, '#d6ac59', '#fff0ad', 1.3);
    ctx.strokeStyle = '#69351e'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.moveTo(-4, 7); ctx.lineTo(4, 7); ctx.stroke();
    ctx.restore();
    text(ctx, '记录', cx, box.y + 76, 17, '#f4d587', 'center', '900');
  }

  function drawRecruitPity(ctx, game, box) {
    if (imageReady(game.assets.recruitPityPanel)) ctx.drawImage(game.assets.recruitPityPanel, box.x, box.y, box.w, box.h);
    else simpleFrame(ctx, box.x, box.y, box.w, box.h, 18, .9);
    ctx.strokeStyle = 'rgba(87,221,204,.32)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(box.x + 42, box.y + 54); ctx.lineTo(box.x + box.w - 42, box.y + 54); ctx.stroke();
    var pity = game.progression && game.progression.profile ? game.progression.profile.recruitPity || 0 : 0;
    text(ctx, '灵品御灵保底', box.x + 250, box.y + 31, 19, '#f2d480', 'center', '900');
    text(ctx, pity + ' / 10', box.x + 382, box.y + 31, 19, '#a9f2e1', 'center', '900');
    // 两侧莲花装饰约占各 145px，圆点只使用中间深色安全区，避免压到边框与花纹。
    var dotInset = 145;
    var dotGap = (box.w - dotInset * 2) / 9;
    for (var i = 0; i < 10; i++) {
      var x = box.x + dotInset + i * dotGap;
      ctx.save();
      ctx.fillStyle = 'rgba(5,17,21,.92)'; ctx.strokeStyle = 'rgba(203,159,69,.76)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, box.y + 82, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (i < pity) { ctx.fillStyle = '#67ded0'; ctx.beginPath(); ctx.arc(x, box.y + 82, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawRecruitButton(ctx, game, box, variant, label, cost) {
    var jade = variant === 'jade';
    var frame = jade ? game.assets.recruitButtonSingle : game.assets.recruitButtonTen;
    if (imageReady(frame)) ctx.drawImage(frame, box.x, box.y, box.w, box.h);
    else {
      var gradient = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
      if (jade) { gradient.addColorStop(0, '#1b706e'); gradient.addColorStop(1, '#103637'); }
      else { gradient.addColorStop(0, '#9a6823'); gradient.addColorStop(1, '#513311'); }
      ctx.save();
      ctx.shadowColor = jade ? 'rgba(60,214,196,.42)' : 'rgba(241,177,65,.42)'; ctx.shadowBlur = 13;
      A.rr(ctx, box.x, box.y, box.w, box.h, 16, gradient, jade ? '#7ee8d7' : '#efc66d', 3);
      A.rr(ctx, box.x + 6, box.y + 6, box.w - 12, box.h - 12, 11, null, jade ? 'rgba(204,255,244,.35)' : 'rgba(255,235,178,.35)', 1.4);
      ctx.restore();
    }
    text(ctx, label, box.x + box.w * .5, box.y + 40, 28, '#fff0bd', 'center', '900');
    drawRecruitRewardIcon(ctx, null, box.x + box.w * .5 - 44, box.y + 74, 'talisman');
    text(ctx, '请灵符 ×' + cost, box.x + box.w * .5 - 22, box.y + 74, 17, '#d2eee6', 'left', '700');
  }

  function drawRecruitBack(ctx, game, box) {
    if (imageReady(game.assets.recruitBackButton)) {
      ctx.drawImage(game.assets.recruitBackButton, box.x, box.y, box.w, box.h);
      return;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(10,31,38,.94)'; ctx.strokeStyle = '#d5a34b'; ctx.lineWidth = 2;
    A.rr(ctx, box.x, box.y, box.w, box.h, 12, 'rgba(10,31,38,.94)', '#d5a34b', 2);
    ctx.fillStyle = '#f2d37c';
    ctx.beginPath(); ctx.moveTo(box.x + 38, box.y + 10); ctx.lineTo(box.x + 20, box.y + box.h * .5); ctx.lineTo(box.x + 38, box.y + box.h - 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawRecruit(ctx, game) {
    var img = game.assets && game.assets.recruitSceneNight;
    if (imageReady(img)) ctx.drawImage(img, 0, 0, W, H);
    else { ctx.fillStyle = '#071827'; ctx.fillRect(0, 0, W, H); }
    var shade = ctx.createLinearGradient(0, 0, 0, 180);
    shade.addColorStop(0, 'rgba(2,9,18,.54)'); shade.addColorStop(1, 'rgba(2,9,18,0)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, 180);
    var title = RECRUIT_LAYOUT.title;
    if (imageReady(game.assets.recruitTitleFrame)) ctx.drawImage(game.assets.recruitTitleFrame, title.x, title.y, title.w, title.h);
    drawRecruitEmblem(ctx, title.x + 25, title.y + 18, 14);
    text(ctx, '请灵台', title.x + 49, title.y + 19, 22, '#f4d58a', 'left', '900');
    var info = RECRUIT_LAYOUT.info;
    ctx.save(); ctx.fillStyle = 'rgba(21,27,27,.92)'; ctx.beginPath(); ctx.arc(info.x + 22, info.y + 22, 18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e5b75d'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    text(ctx, '！', info.x + 22, info.y + 23, 22, '#fff0bd', 'center', '900');

    var profile = game.progression && game.progression.profile || {};
    drawRecruitResource(ctx, game, RECRUIT_LAYOUT.resources[0], 'lingyun', '灵蕴  ' + (profile.lingyun == null ? 0 : profile.lingyun));
    drawRecruitResource(ctx, game, RECRUIT_LAYOUT.resources[1], 'talisman', '请灵符  ' + (profile.talisman == null ? 0 : profile.talisman));
    drawRecruitResource(ctx, game, RECRUIT_LAYOUT.resources[2], 'spiritSeed', '灵种总  ' + (profile.spiritSeed == null ? 0 : profile.spiritSeed));
    drawRecruitRecord(ctx, game, RECRUIT_LAYOUT.record);
    drawRecruitPity(ctx, game, RECRUIT_LAYOUT.pity);
    drawRecruitButton(ctx, game, RECRUIT_LAYOUT.single, 'jade', '请灵一次', '1');
    drawRecruitButton(ctx, game, RECRUIT_LAYOUT.ten, 'gold', '请灵十次', '10');
    text(ctx, '◇  获取请灵符  ◇', W * .5, 1130, 18, '#e8c66d', 'center', '900');
    drawSummonEventReturnArrow(ctx, game);
    drawGuidePrompt(ctx, game, 1244);
    drawToast(ctx, game);
    drawRecruitReveal(ctx, game);
  }

  function recruitCardBox(index, count) {
    if (count === 1) return RECRUIT_REVEAL_LAYOUT.singleCard;
    var row = index < 3 ? 0 : index < 7 ? 1 : 2;
    var countInRow = row === 1 ? 4 : 3;
    var firstIndex = row === 0 ? 0 : row === 1 ? 3 : 7;
    var cardW = 150, cardH = 188, gap = row === 1 ? 10 : 12;
    var totalW = countInRow * cardW + (countInRow - 1) * gap;
    return {
      x: (W - totalW) * .5 + (index - firstIndex) * (cardW + gap),
      y: [188, 401, 614][row], w: cardW, h: cardH
    };
  }

  function recruitQualityTier(def) {
    if (!def) return 0;
    return Number(def.qualityTier) || 0;
  }

  function recruitRevealState(reveal) {
    if (!reveal || !reveal.rewards) return reveal;
    var count = reveal.rewards.length, i;
    if (!Array.isArray(reveal.revealed) || reveal.revealed.length !== count) {
      reveal.revealed = [];
      for (i = 0; i < count; i++) reveal.revealed.push(count === 1);
    }
    if (!Array.isArray(reveal.revealAt)) reveal.revealAt = [];
    if (!Array.isArray(reveal.detailQueue)) reveal.detailQueue = [];
    if (reveal.detailCursor == null) reveal.detailCursor = 0;
    if (reveal.activeDetail == null) reveal.activeDetail = -1;
    return reveal;
  }

  function recruitRevealReadyToClose(reveal) {
    if (!reveal || !reveal.rewards) return false;
    recruitRevealState(reveal);
    for (var i = 0; i < reveal.revealed.length; i++) if (!reveal.revealed[i]) return false;
    return reveal.activeDetail < 0 && reveal.detailCursor >= reveal.detailQueue.length;
  }

  function drawRecruitRune(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(Math.PI / 4); ctx.strokeRect(-17, -17, 34, 34);
    ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.moveTo(0, -34); ctx.lineTo(0, 34); ctx.stroke();
    ctx.restore();
  }

  function drawRecruitCardBack(ctx, def, box, reward) {
    var x = -box.w * .5, y = -box.h * .5;
    var quality = reward && reward.kind === 'spiritSeed' ? ((YL.SPIRIT_SEED_PACKAGING && YL.SPIRIT_SEED_PACKAGING[reward.seedId] || {}).color || '#e7c75d') : def && def.qualityColor || '#5a8293';
    var inner = ctx.createLinearGradient(x, y, x + box.w, y + box.h);
    inner.addColorStop(0, '#173846'); inner.addColorStop(.55, '#102331'); inner.addColorStop(1, '#091620');
    ctx.save();
    ctx.shadowColor = quality; ctx.shadowBlur = 18;
    A.rr(ctx, x, y, box.w, box.h, 16, inner, quality, 3);
    ctx.restore();
    A.rr(ctx, x + 8, y + 8, box.w - 16, box.h - 16, 12, null, 'rgba(235,246,224,.44)', 1.4);
    drawRecruitRune(ctx, 0, -8, quality);
    text(ctx, reward && reward.kind === 'spiritSeed' ? '材料' : (def && def.quality || '待定'), 0, box.h * .5 - 30, 17, '#f6df9d', 'center', '900');
    text(ctx, '待揭示', 0, box.h * .5 - 8, 16, '#b6dfd6', 'center', '700');
  }

  function drawRecruitSeedCardFace(ctx, reward, box) {
    var x = -box.w * .5, y = -box.h * .5;
    var packaging = YL.SPIRIT_SEED_PACKAGING && YL.SPIRIT_SEED_PACKAGING[reward.seedId] || { name: '灵种', color: '#e7c75d' };
    var bg = ctx.createLinearGradient(x, y, x + box.w, y + box.h);
    bg.addColorStop(0, 'rgba(56,54,27,.98)'); bg.addColorStop(1, 'rgba(19,25,24,.99)');
    ctx.save(); ctx.shadowColor = packaging.color; ctx.shadowBlur = 18;
    A.rr(ctx, x, y, box.w, box.h, 16, bg, packaging.color, 3); ctx.restore();
    A.rr(ctx, x + 8, y + 8, box.w - 16, box.h - 16, 12, null, 'rgba(255,244,189,.44)', 1.4);
    drawRecruitRewardIcon(ctx, null, 0, -22, 'spiritSeed');
    text(ctx, '灵种', 0, 20, 15, '#f6df9d', 'center', '900');
    text(ctx, packaging.name, 0, 48, 19, '#fff0bd', 'center', '900');
    text(ctx, '×' + (reward.amount || 0), 0, 76, 18, '#9df2d7', 'center', '900');
  }

  function drawRecruitCardFace(ctx, game, reward, def, box) {
    var x = -box.w * .5, y = -box.h * .5;
    var quality = def && def.qualityColor || '#5a8293';
    var bg = ctx.createLinearGradient(x, y, x + box.w, y + box.h);
    bg.addColorStop(0, 'rgba(28,54,65,.98)'); bg.addColorStop(1, 'rgba(7,18,27,.99)');
    ctx.save(); ctx.shadowColor = quality; ctx.shadowBlur = 16;
    A.rr(ctx, x, y, box.w, box.h, 16, bg, quality, 3); ctx.restore();
    drawGrowthPortrait(ctx, game, def, x + 8, y + 8, box.w - 16, box.h - 62, 12);
    var factionBoxW = Math.min(112, box.w - 26);
    A.rr(ctx, x + 10, y + 12, factionBoxW, 24, 8, factionColor(def), 'rgba(255,242,187,.82)', 1);
    text(ctx, factionName(def), x + 10 + factionBoxW * .5, y + 24, box.w >= 200 ? 14 : 10, '#fff8d6', 'center', '900');
    A.rr(ctx, x + 10, y + box.h - 50, box.w - 20, 25, 9, quality, 'rgba(255,232,168,.76)', 1);
    text(ctx, def.quality, 0, y + box.h - 37, 14, '#fff5d2', 'center', '900');
    text(ctx, def.name, 0, y + box.h - 14, 21, '#fff0bd', 'center', '900');
    if (reward.newlyOwned) text(ctx, '新', x + box.w - 19, y + 19, 15, '#fff6cf', 'center', '900');
  }

  function drawRecruitCard(ctx, game, reward, index, reveal) {
    var isSeed = reward && reward.kind === 'spiritSeed';
    var def = !isSeed && YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.id];
    if (!isSeed && !def) return;
    var box = recruitCardBox(index, reveal.rewards.length);
    var openAt = reveal.revealAt[index], progress = 1;
    if (openAt != null) progress = Math.max(0, Math.min(1, (game.time - openAt) / .28));
    var isFlipping = !!reveal.revealed[index] && progress < 1;
    var showFace = !!reveal.revealed[index] && (!isFlipping || progress >= .5);
    var squash = isFlipping ? Math.max(.055, Math.abs(1 - progress * 2)) : 1;
    ctx.save();
    ctx.translate(box.x + box.w * .5, box.y + box.h * .5);
    ctx.scale(squash, 1);
    if (showFace) {
      if (isSeed) drawRecruitSeedCardFace(ctx, reward, box);
      else drawRecruitCardFace(ctx, game, reward, def, box);
    } else drawRecruitCardBack(ctx, def, box, reward);
    ctx.restore();
  }

  function drawRecruitDetail(ctx, game, reveal) {
    var reward = reveal.rewards[reveal.activeDetail];
    var def = reward && YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.id];
    if (!def) return;
    var preview = !!reveal.previewDetail;
    var box = RECRUIT_REVEAL_LAYOUT.detail;
    ctx.save(); ctx.fillStyle = 'rgba(1,8,14,.9)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    simpleFrame(ctx, box.x, box.y, box.w, box.h, 28, .99);
    text(ctx, preview ? '御灵详情' : (def.quality + '御灵降临'), W * .5, 160, 31, '#f5d788', 'center', '900');
    text(ctx, preview ? (reward.newlyOwned ? '新御灵已收录' : '已收录御灵 · 获得同名本体卡') : '首次请灵收录', W * .5, 196, 17, '#aee9dd', 'center', '700');
    ctx.save(); ctx.shadowColor = def.qualityColor; ctx.shadowBlur = 32;
    ctx.fillStyle = def.qualityColor; ctx.beginPath(); ctx.arc(W * .5, 437, 231, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    drawGrowthPortrait(ctx, game, def, 118, 224, 514, 428, 28);
    A.rr(ctx, 238, 676, 274, 42, 14, def.qualityColor, '#ffe9a4', 2);
    text(ctx, def.quality + ' · ' + (def.factionName || '未定阵营') + ' · ' + def.role, W * .5, 697, 19, '#fff4d2', 'center', '900');
    text(ctx, def.name, W * .5, 755, 46, '#fff0bd', 'center', '900');
    text(ctx, preview && !reward.newlyOwned ? '已收录御灵可继续使用同名本体卡与灵种养成' : '已自动加入建木共鸣，随御灵一同守卫城墙', W * .5, 805, 18, '#bcebdc', 'center', '700');
    var skill = def.skills && def.skills[0];
    if (skill) {
      A.rr(ctx, 108, 838, 534, 70, 16, 'rgba(13,39,45,.96)', 'rgba(119,235,214,.56)', 1.5);
      text(ctx, skill.kind + ' · ' + skill.name, 138, 862, 20, '#f5d787', 'left', '900');
      text(ctx, skill.desc, W * .5, 889, 15, '#c3ded5', 'center', '700');
    }
    var last = preview || reveal.detailCursor >= reveal.detailQueue.length - 1;
    A.rr(ctx, RECRUIT_REVEAL_LAYOUT.detailButton.x, RECRUIT_REVEAL_LAYOUT.detailButton.y, RECRUIT_REVEAL_LAYOUT.detailButton.w, RECRUIT_REVEAL_LAYOUT.detailButton.h, 19, '#176a67', '#78e8d4', 3);
    text(ctx, preview ? '返回请灵结果' : (last ? (reveal.rewards.length === 1 ? '收下御灵' : '继续查看结果') : '下一位御灵'), W * .5, 988, 27, '#effff8', 'center', '900');
  }

  // 请灵结果灰盒：十连不再自动按顺序翻牌。点击哪张只翻哪张；卡阵外空白处一次性翻开所有未翻卡。
  function drawRecruitReveal(ctx, game) {
    var reveal = game.recruitReveal;
    if (!reveal || !reveal.rewards || !reveal.rewards.length) return;
    recruitRevealState(reveal);
    if (reveal.activeDetail >= 0) { drawRecruitDetail(ctx, game, reveal); return; }
    ctx.save(); ctx.fillStyle = 'rgba(2,9,15,.86)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    var panel = RECRUIT_REVEAL_LAYOUT.panel;
    simpleFrame(ctx, panel.x, panel.y, panel.w, panel.h, 28, .98);
    text(ctx, reveal.rewards.length > 1 ? '十连请灵结果' : '请灵回应', W * .5, 139, 32, '#f4d789', 'center', '900');
    var unopened = 0;
    for (var i = 0; i < reveal.rewards.length; i++) if (!reveal.revealed[i]) unopened++;
    text(ctx, unopened ? '点击卡牌翻开 · 点击空白处全部揭晓' : '请灵结果已全部揭晓', W * .5, 169, 17, unopened ? '#bcebdc' : '#f2d37c', 'center', '700');
    for (i = 0; i < reveal.rewards.length; i++) drawRecruitCard(ctx, game, reveal.rewards[i], i, reveal);
    if (recruitRevealReadyToClose(reveal)) {
      A.rr(ctx, RECRUIT_REVEAL_LAYOUT.close.x, RECRUIT_REVEAL_LAYOUT.close.y, RECRUIT_REVEAL_LAYOUT.close.w, RECRUIT_REVEAL_LAYOUT.close.h, 19, '#176a67', '#78e8d4', 3);
      text(ctx, reveal.rewards.length === 1 ? '确定' : '收下结果', W * .5, 1054, 27, '#effff8', 'center', '900');
    }
  }

  function recruitRevealAction(game, x, y) {
    var reveal = game && game.recruitReveal;
    if (!reveal || !reveal.rewards || !reveal.rewards.length) return null;
    recruitRevealState(reveal);
    if (reveal.activeDetail >= 0) return hitRect(x, y, RECRUIT_REVEAL_LAYOUT.detailButton) ? 'recruitRevealDetailNext' : null;
    if (recruitRevealReadyToClose(reveal) && hitRect(x, y, RECRUIT_REVEAL_LAYOUT.close)) return 'recruitRevealClose';
    var touchedCard = false;
    for (var i = 0; i < reveal.rewards.length; i++) {
      if (hitRect(x, y, recruitCardBox(i, reveal.rewards.length))) {
        touchedCard = true;
        if (!reveal.revealed[i]) return 'recruitRevealCard:' + i;
        var reward = reveal.rewards[i], def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.id];
        return recruitRevealReadyToClose(reveal) && recruitQualityTier(def) >= 2 ? 'recruitRevealPreview:' + i : 'recruitRevealCardOpen';
      }
    }
    if (!touchedCard) {
      for (i = 0; i < reveal.revealed.length; i++) if (!reveal.revealed[i]) return 'recruitRevealAll';
    }
    return null;
  }

  // 百灵居与御灵养成在首版完全由 Canvas 代码绘制。人物立绘仍复用当前游戏已有透明角色资源，
  // 但底板、标签、数值、按钮和建木共鸣效果均非视觉稿切片，便于先验收功能与交互。
  var GROWTH_LAYOUT = {
    header: { y: 0, h: 115 },
    core: { x: 20, y: 122, w: 710, h: 452 },
    preResonance: { x: 20, y: 122, w: 710, h: 420 },
    filter: { x: 32, y: 589, w: 686, h: 70 },
    cardsTop: 674,
    cardW: 170,
    cardH: 194,
    cardGap: 8,
    cardX: 21,
    cardYGap: 202,
    actions: {
      y: 142, h: 50,
      recruit: { x: 40, y: 142, w: 58, h: 50 },
      recruitSingle: { x: 40, y: 142, w: 58, h: 50 },
      formation: { x: 106, y: 142, w: 58, h: 50 }
    },
    detailBack: { x: 20, y: 21, w: 106, h: 54 },
    detailSkills: { y: 570, size: 68, centers: [270, 375, 480] },
    detailSkillTip: { x: 28, y: 150, w: 694, h: 1018, tabY: 1085, tabW: 310, starX: 38, rogueX: 402, tabH: 64 },
    detailTabs: { y: 802, w: 302, h: 52, levelX: 55, starX: 393 },
    detailButton: { x: 141, y: 1203, w: 468, h: 76 },
    coreReplace: { x: 50, y: 224, w: 650, h: 860, rowX: 82, rowY: 352, rowW: 586, rowH: 92, rowGap: 104, cancel: { x: 238, y: 1000, w: 274, h: 58 } }
  };

  function formatNumber(value) {
    value = Math.max(0, Math.floor(Number(value) || 0));
    return value >= 10000 ? (value / 10000).toFixed(value >= 100000 ? 0 : 1) + '万' : String(value);
  }

  function growthProfile(game) {
    return game.progression && game.progression.profile || { lingyun: 0, talisman: 0, spiritSeed: 0, spiritSeeds: {}, coreHeroIds: [], heroes: {} };
  }

  function drawGrowthResource(ctx, game, x, y, width, type, value) {
    simpleFrame(ctx, x, y, width, 40, 14, .88);
    var asset = type === 'lingyun' ? game.assets.resultRewardLingyun : type === 'talisman' ? game.assets.resultRewardTalisman : null;
    drawRecruitRewardIcon(ctx, asset, x + 19, y + 20, type);
    text(ctx, formatNumber(value), x + 39, y + 21, 17, '#fff0bd', 'left', '900');
  }

  function drawFactionSeedStrip(ctx, game) {
    var profile = growthProfile(game), seeds = profile.spiritSeeds || {}, ids = YL.SPIRIT_SEED_IDS || ['hongchen', 'wanyao', 'huangquan', 'universal'];
    var packaging = YL.SPIRIT_SEED_PACKAGING || {}, boxW = 166, gap = 7, startX = (W - (ids.length * boxW + (ids.length - 1) * gap)) * .5;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], faction = packaging[id] || { name: id, color: '#6edac7' }, value = seeds[id] || 0;
      var x = startX + i * (boxW + gap);
      A.rr(ctx, x, 77, boxW, 28, 8, 'rgba(7,24,30,.9)', faction.color, 1.2);
      text(ctx, faction.name + '  ' + formatNumber(value), x + boxW * .5, 91, 11, '#e7f5dc', 'center', '900');
    }
  }

  function drawGrowthHeader(ctx, game, title, showRecruit, showSeedStrip) {
    var profile = growthProfile(game);
    var shade = ctx.createLinearGradient(0, 0, 0, GROWTH_LAYOUT.header.h);
    shade.addColorStop(0, '#07121e'); shade.addColorStop(1, 'rgba(8,20,28,.2)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, GROWTH_LAYOUT.header.h);
    if (showRecruit) {
      drawRecruitEmblem(ctx, 43, 48, 19);
      text(ctx, title, 74, 49, 30, '#f5d787', 'left', '900');
      ctx.save(); ctx.fillStyle = 'rgba(12,24,31,.9)'; ctx.strokeStyle = '#d8ad54'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(187, 48, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, '！', 187, 50, 20, '#fff1c3', 'center', '900');
    } else {
      simpleFrame(ctx, GROWTH_LAYOUT.detailBack.x, GROWTH_LAYOUT.detailBack.y, GROWTH_LAYOUT.detailBack.w, GROWTH_LAYOUT.detailBack.h, 18, .93);
      text(ctx, '←', 50, 48, 31, '#f7d880', 'center', '900');
      text(ctx, title, 138, 49, 30, '#f5d787', 'left', '900');
    }
    drawGrowthResource(ctx, game, 410, 27, 100, 'lingyun', profile.lingyun);
    drawGrowthResource(ctx, game, 516, 27, 100, 'talisman', profile.talisman);
    drawGrowthResource(ctx, game, 622, 27, 104, 'spiritSeed', profile.spiritSeed);
    if (showSeedStrip !== false) drawFactionSeedStrip(ctx, game);
  }

  function drawGrowthPortrait(ctx, game, def, x, y, w, h, radius) {
    ctx.save();
    A.rr(ctx, x, y, w, h, radius || 14, '#132431');
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 3, y + 3, w - 6, h - 6, Math.max(4, (radius || 14) - 4));
    else ctx.rect(x + 3, y + 3, w - 6, h - 6);
    ctx.clip();
    var img = game.assets && game.assets[def.sprite];
    if (imageReady(img)) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      var sourceCrop = heroUiSourceCrop(def, img);
      var sourceX = sourceCrop ? sourceCrop.x : 0, sourceY = sourceCrop ? sourceCrop.y : 0;
      var sourceW = sourceCrop ? sourceCrop.w : iw, sourceH = sourceCrop ? sourceCrop.h : ih;
      var scale = Math.max(w / sourceW, h / sourceH);
      var sw = w / scale, sh = h / scale;
      ctx.drawImage(img, sourceX + (sourceW - sw) * .5, sourceY + Math.max(0, (sourceH - sh) * .22), sw, Math.min(sourceH, sh), x, y, w, h);
    } else {
      var grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, def.qualityColor); grad.addColorStop(1, '#102331');
      ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
      text(ctx, def.name, x + w * .5, y + h * .5, Math.min(30, w * .32), '#fff0bd', 'center', '900');
    }
    ctx.restore();
  }

  function factionName(def) {
    return def && def.factionName || '未定阵营';
  }

  function factionColor(def) {
    return def && def.factionColor || '#6edac7';
  }

  function factionGlyph(def) {
    var name = factionName(def);
    return name === '未定阵营' ? '阵' : name.charAt(0);
  }

  function drawFactionBadge(ctx, def, x, y, radius, size) {
    var color = factionColor(def);
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    text(ctx, factionGlyph(def), x, y, size || Math.max(10, radius * .9), '#fff8d6', 'center', '900');
  }

  function drawMoonGlyph(ctx, x, y, size, active) {
    var radius = size * .34;
    ctx.save();
    ctx.lineWidth = Math.max(1.5, size * .075);
    ctx.strokeStyle = active ? '#8fe9dd' : '#536466';
    ctx.fillStyle = active ? '#8fe9dd' : 'rgba(0,0,0,0)';
    ctx.shadowColor = active ? '#45d6c3' : 'transparent';
    ctx.shadowBlur = active ? size * .36 : 0;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * .18, Math.PI * 1.82);
    if (active) ctx.stroke();
    else ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * .15, y - size * .09, radius * .94, Math.PI * .58, Math.PI * 1.42);
    ctx.stroke();
    ctx.restore();
  }

  function drawSunGlyph(ctx, x, y, size, active) {
    var radius = size * .25;
    ctx.save();
    ctx.lineWidth = Math.max(1.5, size * .07);
    ctx.strokeStyle = active ? '#ffcf69' : '#6c6860';
    ctx.fillStyle = active ? '#ffd36b' : 'rgba(0,0,0,0)';
    ctx.shadowColor = active ? '#ff9f3f' : 'transparent';
    ctx.shadowBlur = active ? size * .42 : 0;
    for (var ray = 0; ray < 8; ray++) {
      var angle = ray * Math.PI / 4, inner = size * .34, outer = size * .46;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawGrowthGlyph(ctx, x, y, size, phase, active) {
    if (phase === 0) text(ctx, active ? '★' : '☆', x, y, size, active ? '#ffd36b' : '#5b6969', 'center', '900');
    else if (phase === 1) drawMoonGlyph(ctx, x, y, size, active);
    else drawSunGlyph(ctx, x, y, size, active);
  }

  // 五颗一组的外显轨道：1—5 星、6—10 月、11—15 日；后一阶段会保留前一阶段的空心形状。
  function drawGrowthStars(ctx, x, y, star, size) {
    size = size || 18;
    star = Math.max(1, Math.min(15, Number(star) || 1));
    var phase = Math.floor((star - 1) / 5), within = ((star - 1) % 5) + 1;
    ctx.save();
    if (star >= 15) { ctx.shadowColor = '#ff9f3f'; ctx.shadowBlur = size * .75; }
    for (var i = 0; i < 5; i++) {
      // 进入新阶段时，已解锁格切换为新图形，未解锁格保留上一阶段的空心图形。
      drawGrowthGlyph(ctx, x + i * (size + 5), y, size, i < within ? phase : Math.max(0, phase - 1), i < within);
    }
    ctx.restore();
  }

  function drawCoreNode(ctx, game, view, x, y, active) {
    var def = view.def, state = view.state;
    ctx.save();
    ctx.shadowColor = def.elementColor; ctx.shadowBlur = active ? 15 : 6;
    A.rr(ctx, x - 66, y - 59, 132, 118, 18, 'rgba(7,18,25,.90)', def.qualityColor, active ? 3 : 2);
    ctx.restore();
    drawGrowthPortrait(ctx, game, def, x - 38, y - 51, 76, 67, 12);
    drawFactionBadge(ctx, def, x + 46, y - 43, 15, 11);
    text(ctx, def.name, x, y + 26, 20, '#f9df9a', 'center', '900');
    text(ctx, 'Lv.' + (view.level || state.level), x, y + 48, 16, '#baf4e5', 'center', '700');
  }

  function drawJianmuCore(ctx, game, x, y, radius, resonance) {
    ctx.save();
    var halo = ctx.createRadialGradient(x, y, 12, x, y, radius);
    halo.addColorStop(0, 'rgba(111,247,223,.44)'); halo.addColorStop(.45, 'rgba(37,160,145,.14)'); halo.addColorStop(1, 'rgba(8,20,28,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(92,236,211,.55)'; ctx.lineWidth = 3;
    for (var ring = 0; ring < 3; ring++) { ctx.beginPath(); ctx.arc(x, y, 54 + ring * 16, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#62d9c3'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (var i = 0; i < 8; i++) {
      var angle = -Math.PI * .5 + i * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.quadraticCurveTo(x + Math.cos(angle) * 25, y - 12, x + Math.cos(angle) * 52, y + Math.sin(angle) * 42); ctx.stroke();
    }
    ctx.fillStyle = '#143f40'; ctx.beginPath(); ctx.arc(x, y, 51, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e1b967'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    text(ctx, '共鸣等级', x, y - 13, 16, '#f7dc90', 'center', '900');
    text(ctx, 'Lv.' + resonance, x, y + 15, 28, '#a8f3df', 'center', '900');
    text(ctx, 'i', x, y + 37, 16, '#f6d37a', 'center', '900');
  }

  function heroCardBox(index) {
    var col = index % 4, row = Math.floor(index / 4);
    return { x: GROWTH_LAYOUT.cardX + col * (GROWTH_LAYOUT.cardW + GROWTH_LAYOUT.cardGap), y: GROWTH_LAYOUT.cardsTop + row * GROWTH_LAYOUT.cardYGap, w: GROWTH_LAYOUT.cardW, h: GROWTH_LAYOUT.cardH };
  }

  // 背包只展示已经拥有的御灵；未获得的定义与未配置的未来位置都保留为空背景，
  // 不用“待获得 / 待请灵”卡片占据列表空间。
  function ownedHeroIds(game) {
    var profile = growthProfile(game), allIds = YL.GROWTH_HERO_IDS || [], owned = [], i, id;
    for (i = 0; i < allIds.length; i++) {
      id = allIds[i];
      if (profile.heroes[id] && profile.heroes[id].owned) owned.push(id);
    }
    return owned;
  }

  function resonanceUnlocked(game) {
    return ownedHeroIds(game).length >= (YL.GROWTH_CORE_SLOT_COUNT || 5);
  }

  function drawPreResonanceHero(ctx, game, id, box) {
    var def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[id];
    var view = game.heroGrowthView && game.heroGrowthView(id);
    if (!def || !view || !view.state.owned) return;
    var state = view.state;
    var gradient = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    gradient.addColorStop(0, def.qualityColor);
    gradient.addColorStop(.24, '#173b45');
    gradient.addColorStop(1, '#091923');
    ctx.save();
    ctx.shadowColor = def.elementColor;
    ctx.shadowBlur = 12;
    A.rr(ctx, box.x, box.y, box.w, box.h, 18, gradient, '#e7c56f', 2.5);
    A.rr(ctx, box.x + 5, box.y + 5, box.w - 10, box.h - 10, 14, 'rgba(3,15,22,.12)', 'rgba(255,241,190,.35)', 1);
    ctx.restore();
    drawGrowthPortrait(ctx, game, def, box.x + 10, box.y + 28, box.w - 20, 116, 12);
    A.rr(ctx, box.x + 9, box.y + 8, 52, 21, 7, def.qualityColor, 'rgba(255,245,204,.55)', 1);
    text(ctx, def.quality, box.x + 35, box.y + 18, 12, '#fff2c2', 'center', '900');
    drawFactionBadge(ctx, def, box.x + box.w - 18, box.y + 19, 12, 10);
    text(ctx, def.name, box.x + box.w * .5, box.y + 171, 22, '#fff0bd', 'center', '900');
    text(ctx, 'Lv.' + view.level + '  ·  ' + (def.role || '御灵'), box.x + box.w * .5, box.y + 198, 15, '#b8ebdc', 'center', '700');
    drawGrowthStars(ctx, box.x + box.w * .5 - 38, box.y + 224, state.star, 14);
  }

  function drawPreResonanceOverview(ctx, game, visibleIds) {
    var panel = GROWTH_LAYOUT.preResonance;
    var count = Math.min(4, visibleIds.length);
    simpleFrame(ctx, panel.x, panel.y, panel.w, panel.h, 24, .86);
    text(ctx, '御灵总览', W * .5, panel.y + 34, 27, '#f0d084', 'center', '900');
    text(ctx, '已收录御灵 · 自动驻守城墙', W * .5, panel.y + 63, 16, '#b7e5d7', 'center', '700');
    ctx.save();
    ctx.strokeStyle = 'rgba(222,184,100,.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panel.x + 46, panel.y + 85);
    ctx.lineTo(panel.x + panel.w - 46, panel.y + 85);
    ctx.stroke();
    ctx.restore();
    if (!count) {
      text(ctx, '尚未收录御灵', W * .5, panel.y + 220, 22, '#bdc9c0', 'center', '900');
      text(ctx, '请灵后可查看角色详情', W * .5, panel.y + 254, 16, '#91aaa1', 'center', '700');
    } else {
      var cardW = count === 4 ? 151 : count === 3 ? 174 : 210;
      var gap = count === 4 ? 14 : 18;
      var startX = (W - (count * cardW + (count - 1) * gap)) * .5;
      for (var i = 0; i < count; i++) {
        drawPreResonanceHero(ctx, game, visibleIds[i], { x: startX + i * (cardW + gap), y: panel.y + 106, w: cardW, h: 244 });
      }
    }
    text(ctx, '点击下方角色卡，查看等级、星级与技能', W * .5, panel.y + 389, 16, '#9fbab0', 'center', '700');
  }

  function drawHeroCard(ctx, game, id, index, showResonance) {
    var box = heroCardBox(index), def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[id];
    if (!def) return;
    var view = game.heroGrowthView && game.heroGrowthView(id);
    if (!view) return;
    var state = view.state;
    if (!state.owned) return;
    ctx.save();
    var gradient = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    gradient.addColorStop(0, def.qualityColor); gradient.addColorStop(.26, '#153946'); gradient.addColorStop(1, '#081821');
    A.rr(ctx, box.x, box.y, box.w, box.h, 14, gradient, '#edcc75', 2.5);
    A.rr(ctx, box.x + 5, box.y + 5, box.w - 10, box.h - 10, 11, 'rgba(4,15,21,.12)', 'rgba(255,239,182,.3)', 1);
    ctx.restore();
    drawGrowthPortrait(ctx, game, def, box.x + 8, box.y + 26, box.w - 16, 103, 10);
    A.rr(ctx, box.x + 7, box.y + 6, 54, 22, 7, def.qualityColor, 'rgba(255,245,204,.55)', 1);
    text(ctx, def.quality, box.x + 34, box.y + 17, 13, '#fff2c2', 'center', '900');
    drawFactionBadge(ctx, def, box.x + box.w - 17, box.y + 18, 12, 10);
    text(ctx, 'Lv.' + view.level, box.x + box.w - 8, box.y + 143, 15, '#fbebbb', 'right', '900');
    text(ctx, def.name, box.x + box.w * .5, box.y + 150, 23, '#fff0bd', 'center', '900');
    text(ctx, def.factionName || '', box.x + box.w * .5, box.y + 17, 11, '#a9d6c9', 'center', '700');
    drawGrowthStars(ctx, box.x + 40, box.y + 171, state.star, 15);
    var badgeText = showResonance ? (view.isCore ? '主灵' : '共鸣') : '御灵';
    var badgeFill = showResonance && view.isCore ? 'rgba(16,99,93,.96)' : 'rgba(50,71,81,.96)';
    var badgeStroke = showResonance && view.isCore ? '#68ddca' : '#7b9a9a';
    A.rr(ctx, box.x + 45, box.y + 178, 80, 20, 8, badgeFill, badgeStroke, 1);
    text(ctx, badgeText, box.x + 85, box.y + 189, 13, '#e4f6ee', 'center', '900');
  }

  function drawHeroes(ctx, game) {
    var profile = growthProfile(game), ids = YL.GROWTH_HERO_IDS || [], visibleIds = ownedHeroIds(game);
    var ownedCount = visibleIds.length, showResonance = resonanceUnlocked(game);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#122838'); bg.addColorStop(.52, '#0a1a24'); bg.addColorStop(1, '#07131b');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    drawGrowthHeader(ctx, game, '百灵居', true);
    var core = GROWTH_LAYOUT.core;
    if (showResonance) {
      simpleFrame(ctx, core.x, core.y, core.w, core.h, 24, .82);
      text(ctx, '建木共鸣', W * .5, core.y + 32, 26, '#f0d084', 'center', '900');
      var resonance = game.progression ? game.progression.resonanceLevel() : 1;
      drawJianmuCore(ctx, game, W * .5, core.y + 260, 136, resonance);
      var positions = [
        { x: 375, y: core.y + 112 }, { x: 145, y: core.y + 215 }, { x: 145, y: core.y + 375 },
        { x: 605, y: core.y + 215 }, { x: 605, y: core.y + 375 }
      ];
      for (var i = 0; i < profile.coreHeroIds.length && i < positions.length; i++) {
        var view = game.heroGrowthView && game.heroGrowthView(profile.coreHeroIds[i]);
        if (view) drawCoreNode(ctx, game, view, positions[i].x, positions[i].y, true);
      }
    } else {
      drawPreResonanceOverview(ctx, game, visibleIds);
    }
    simpleFrame(ctx, GROWTH_LAYOUT.filter.x, GROWTH_LAYOUT.filter.y, GROWTH_LAYOUT.filter.w, GROWTH_LAYOUT.filter.h, 18, .9);
    text(ctx, '已收录  ' + ownedCount + ' / 30', W * .5, GROWTH_LAYOUT.filter.y + 23, 22, '#f4d78a', 'center', '900');
    var factions = ['全部', '红尘', '万妖', '黄泉', '九霄', '混沌'];
    var factionColors = ['#6ee7d3', '#d4a84f', '#8bc36b', '#ef6b43', '#77c8e8', '#c46cff'];
    for (var e = 0; e < factions.length; e++) {
      var ex = 110 + e * 106;
      ctx.save(); ctx.fillStyle = e === 0 ? 'rgba(34,128,120,.88)' : 'rgba(20,35,39,.9)'; ctx.strokeStyle = factionColors[e]; ctx.lineWidth = e === 0 ? 2.5 : 1.5; ctx.beginPath(); ctx.arc(ex, GROWTH_LAYOUT.filter.y + 50, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, factions[e], ex, GROWTH_LAYOUT.filter.y + 51, e === 0 ? 16 : 12, e === 0 ? '#e4fff6' : '#d9c788', 'center', '900');
    }
    for (var c = 0; c < visibleIds.length; c++) drawHeroCard(ctx, game, visibleIds[c], c, showResonance);
    drawGrowthActions(ctx, game, showResonance);
    // 操作入口已收进共鸣面板左上角，避免挤压御灵列表。
    if (!showResonance) drawGuidePrompt(ctx, game, 1006);
    drawToast(ctx, game);
    drawNav(ctx, 'heroes');
  }

  function drawGrowthActions(ctx, game, showResonance) {
    var actions = GROWTH_LAYOUT.actions;
    var boxes = showResonance
      ? [{ box: actions.recruit, kind: 'recruit' }, { box: actions.formation, kind: 'formation' }]
      : [{ box: actions.recruitSingle, kind: 'recruit' }];
    for (var i = 0; i < boxes.length; i++) {
      var item = boxes[i], box = item.box, recruit = item.kind === 'recruit';
      ctx.save();
      ctx.shadowColor = recruit ? 'rgba(87,224,202,.32)' : 'rgba(233,184,82,.36)';
      ctx.shadowBlur = 12;
      A.rr(ctx, box.x, box.y, box.w, box.h, 12,
        recruit ? '#173e42' : '#563b20',
        recruit ? '#6edac7' : '#e2b85e', 2.2);
      ctx.restore();
      var cx = box.x + box.w * .5, cy = box.y + box.h * .5;
      if (recruit) {
        drawRecruitEmblem(ctx, cx, cy, 15);
      } else {
        ctx.save();
        ctx.strokeStyle = '#ffe5a2'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 17, cy - 5); ctx.lineTo(cx, cy - 18); ctx.lineTo(cx + 17, cy - 5);
        ctx.moveTo(cx - 13, cy - 4); ctx.lineTo(cx - 13, cy + 15); ctx.lineTo(cx + 13, cy + 15); ctx.lineTo(cx + 13, cy - 4);
        ctx.moveTo(cx - 4, cy + 15); ctx.lineTo(cx - 4, cy + 2); ctx.lineTo(cx + 4, cy + 2); ctx.lineTo(cx + 4, cy + 15);
        ctx.stroke();
        ctx.restore();
      }
      text(ctx, recruit ? '请灵' : '布阵', cx, box.y + box.h + 19, 16, recruit ? '#d5fff1' : '#ffe8ad', 'center', '900');
    }
  }

  function drawDetailBackdrop(ctx, game, def, showResonance) {
    var gradient = ctx.createLinearGradient(0, 90, 0, 760);
    gradient.addColorStop(0, '#15314a'); gradient.addColorStop(.55, '#0b1d2b'); gradient.addColorStop(1, '#07151c');
    ctx.fillStyle = gradient; ctx.fillRect(0, 90, W, 670);
    if (showResonance) {
      ctx.save(); ctx.globalAlpha = .42; ctx.strokeStyle = '#3fd8c3'; ctx.lineWidth = 2;
      for (var r = 0; r < 4; r++) { ctx.beginPath(); ctx.arc(W * .5, 590, 95 + r * 52, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke(); }
      ctx.restore();
    }
    ctx.save(); ctx.shadowColor = def.elementColor; ctx.shadowBlur = 28; ctx.fillStyle = 'rgba(21,60,66,.72)'; ctx.beginPath(); ctx.ellipse(W * .5, 636, 225, 44, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    drawGrowthPortrait(ctx, game, def, 170, 122, 410, 514, 34);
  }

  function drawStatLine(ctx, x, y, width, label, now, next) {
    A.rr(ctx, x, y, width, 38, 10, 'rgba(10,29,35,.82)', 'rgba(215,166,75,.34)', 1);
    text(ctx, label, x + 38, y + 20, 17, '#f2d186', 'left', '900');
    text(ctx, now, x + width * .55, y + 20, 18, '#f9e5ac', 'center', '900');
    if (next != null) {
      text(ctx, '→', x + width * .69, y + 20, 22, '#e4c36d', 'center', '900');
      text(ctx, next, x + width - 38, y + 20, 18, '#79e6b5', 'center', '900');
    }
  }

  function heroSkillBox(index) {
    var layout = GROWTH_LAYOUT.detailSkills, size = layout.size;
    return { x: layout.centers[index] - size * .5, y: layout.y - size * .5, w: size, h: size };
  }

  function drawHeroSkills(ctx, game, def) {
    var skills = def.skills || [];
    var levels = game.progression && game.progression.skillLevels ? game.progression.skillLevels(def.id) : { basic: 1, combo: 1, ultimate: 1 };
    var skillKeys = ['basic', 'combo', 'ultimate'];
    var colors = { '普攻': '#46c7bd', '连携': '#d7a74e', '大招': '#ba67e4' };
    for (var i = 0; i < 3; i++) {
      var skill = skills[i], box = heroSkillBox(i);
      if (!skill) continue;
      var color = colors[skill.kind] || '#68d8c2';
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 12;
      A.rr(ctx, box.x, box.y, box.w, box.h, 18, 'rgba(7,23,31,.92)', color, 2.5);
      A.rr(ctx, box.x + 5, box.y + 5, box.w - 10, box.h - 10, 14, 'rgba(12,48,55,.72)', 'rgba(255,241,184,.30)', 1);
      ctx.restore();
      text(ctx, skill.icon, box.x + box.w * .5, box.y + 27, 25, '#fff0bb', 'center', '900');
      A.rr(ctx, box.x + 10, box.y + 42, box.w - 20, 17, 7, 'rgba(5,15,20,.84)', color, 1);
      text(ctx, 'Lv.' + (levels[skillKeys[i]] || skill.level || 1), box.x + box.w * .5, box.y + 51, 13, '#eafff4', 'center', '900');
    }
  }

  function drawWrappedText(ctx, value, x, y, width, size, color, maxLines, align) {
    ctx.save();
    ctx.font = '700 ' + size + 'px ' + uiFontFamily(size);
    var paragraphs = String(value || '').replace(/\r/g, '').split('\n'), line = '', lines = [], i, p, chars, candidate;
    for (p = 0; p < paragraphs.length; p++) {
      chars = paragraphs[p].split('');
      line = '';
      for (i = 0; i < chars.length; i++) {
        candidate = line + chars[i];
        if (ctx.measureText(candidate).width > width && line) { lines.push(line); line = chars[i]; }
        else line = candidate;
      }
      if (line) lines.push(line);
    }
    ctx.restore();
    for (i = 0; i < lines.length && i < (maxLines || 3); i++) text(ctx, lines[i], x, y + i * (size + 10), size, color, align || 'center', '700');
  }

  function rogueUpgradesForSkill(skill) {
    var ids = skill && skill.rogueUpgradeIds || [], source = YL.ROGUE_UPGRADES || [], result = [], i, j;
    for (i = 0; i < ids.length; i++) {
      for (j = 0; j < source.length; j++) {
        if (source[j] && source[j].id === ids[i]) { result.push(source[j]); break; }
      }
    }
    return result;
  }

  function rogueLevelText(value) {
    var lines = String(value || '').replace(/\r/g, '').split('\n'), clean = [], i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('生效角色：') === 0 || lines[i].indexOf('生效技能：') === 0) continue;
      clean.push(lines[i]);
    }
    return clean.join(' ');
  }

  function drawSkillStarDetails(ctx, state, skill, skillKey, heroId) {
    var star = Math.max(1, Math.min(15, Number(state && state.star) || 1)), allNodes = YL.STAR_SKILL_NODES || [], nodes = [], node, effect, y, active, i;
    var heroEffects = YL.HERO_STAR_EFFECTS && YL.HERO_STAR_EFFECTS[heroId] || {};
    var skillEffects = heroEffects[skillKey] || {};
    for (i = 0; i < allNodes.length; i++) {
      if (allNodes[i] && allNodes[i].skill === skillKey) nodes.push(allNodes[i]);
    }
    text(ctx, '显灵升星效果', W * .5, 567, 27, '#f2d184', 'center', '900');
    text(ctx, '当前星级 ' + star + ' / 15 · 以下为本技能的具体效果', W * .5, 600, 18, '#b7dfd2', 'center', '700');
    if (!nodes.length) {
      A.rr(ctx, 50, 636, 650, 140, 16, 'rgba(12,36,42,.90)', 'rgba(193,165,97,.48)', 1.5);
      text(ctx, '该技能暂无升星效果', W * .5, 688, 25, '#f2d184', 'center', '900');
      text(ctx, '当前星级不会改变该技能。', W * .5, 728, 18, '#b7c9c3', 'center', '700');
      return;
    }
    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      effect = skillEffects[node.star] || node;
      y = 620 + i * 102;
      active = star >= node.star;
      A.rr(ctx, 50, y, 650, 92, 14, active ? 'rgba(20,85,78,.82)' : 'rgba(18,34,40,.88)', active ? '#69dcca' : 'rgba(191,165,99,.42)', active ? 2 : 1);
      A.rr(ctx, 66, y + 21, 120, 40, 10, active ? '#1d7168' : '#273239', active ? '#81ead6' : '#6d7d7e', 1);
      text(ctx, node.star + ' 星', 126, y + 41, 20, active ? '#effff6' : '#afc0ba', 'center', '900');
      text(ctx, effect.label, 218, y + 30, 21, active ? '#f5dfa0' : '#d4cfb0', 'left', '900');
      drawWrappedText(ctx, effect.desc, 218, y + 58, 420, 18, active ? '#74ead2' : '#839692', 2, 'left');
      text(ctx, active ? '生效中' : '未激活', 682, y + 41, 18, active ? '#7de8d1' : '#82908e', 'right', '900');
    }
  }

  function drawRogueUpgradeDetail(ctx, upgrade, x, y, w) {
    var levels = upgrade.levels || [], h = Math.max(120, 56 + levels.length * 55), i, rowY;
    A.rr(ctx, x, y, w, h, 14, 'rgba(12,36,42,.91)', 'rgba(102,218,198,.55)', 1.5);
    text(ctx, upgrade.name, x + 24, y + 27, 22, '#f6d884', 'left', '900');
    text(ctx, '随机效果 · ' + levels.length + ' 级', x + w - 20, y + 27, 17, '#83e3d0', 'right', '700');
    for (i = 0; i < levels.length; i++) {
      rowY = y + 58 + i * 55;
      text(ctx, 'Lv.' + (i + 1), x + 24, rowY, 17, '#f1cf7d', 'left', '900');
      drawWrappedText(ctx, rogueLevelText(levels[i]), x + 82, rowY, w - 108, 17, '#dfebe5', 2, 'left');
    }
    return h;
  }

  function drawSkillRogueDetails(ctx, skill) {
    var upgrades = rogueUpgradesForSkill(skill), y = 608, i, h;
    text(ctx, '战斗内随机强化', W * .5, 567, 27, '#76e5d2', 'center', '900');
    if (skill.rogueStatus) text(ctx, '以下配置已保留，' + skill.rogueStatus + '进入当前城墙关卡牌池', W * .5, 600, 18, '#e0c886', 'center', '700');
    else text(ctx, '局内抽取后立即生效，不写入局外养成存档', W * .5, 600, 18, '#b7dfd2', 'center', '700');
    if (!upgrades.length) {
      A.rr(ctx, 50, 636, 650, 140, 16, 'rgba(12,36,42,.90)', 'rgba(193,165,97,.48)', 1.5);
      text(ctx, '暂无关联随机强化', W * .5, 688, 25, '#f2d184', 'center', '900');
      text(ctx, '后续接入战斗牌池后将在这里展示。', W * .5, 728, 18, '#b7c9c3', 'center', '700');
      return;
    }
    for (i = 0; i < upgrades.length; i++) {
      h = drawRogueUpgradeDetail(ctx, upgrades[i], 50, y, 650);
      y += h + 14;
    }
  }

  function drawSkillTipTabs(ctx, game) {
    var layout = GROWTH_LAYOUT.detailSkillTip, tab = game.heroSkillDetailTab === 'rogue' ? 'rogue' : 'star';
    function tabButton(x, label, active, color) {
      A.rr(ctx, x, layout.tabY, layout.tabW, layout.tabH, 16, active ? color : '#263439', active ? '#fff0a5' : '#778a87', active ? 2.5 : 1.2);
      text(ctx, label, x + layout.tabW * .5, layout.tabY + 30, 21, active ? '#fff3c5' : '#c0d0ca', 'center', '900');
    }
    tabButton(layout.starX, '升星效果', tab === 'star', '#80612d');
    tabButton(layout.rogueX, '随机效果', tab === 'rogue', '#166c67');
  }

  function drawHeroSkillTip(ctx, game, def) {
    var index = game.heroSkillTipIndex;
    if (index == null || !def.skills || !def.skills[index]) return;
    var skill = def.skills[index], state = game.progression && game.progression.getHero(def.id), layout = GROWTH_LAYOUT.detailSkillTip;
    var colors = { '普攻': '#46c7bd', '连携': '#d7a74e', '大招': '#ba67e4' };
    var color = colors[skill.kind] || '#68d8c2';
    ctx.save();
    ctx.fillStyle = 'rgba(2,10,15,.70)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    simpleFrame(ctx, layout.x, layout.y, layout.w, layout.h, 25, .985);
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(W * .5, 252, 45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10242b'; ctx.beginPath(); ctx.arc(W * .5, 252, 38, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    text(ctx, skill.icon, W * .5, 252, 40, '#fff0bb', 'center', '900');
    A.rr(ctx, 255, 307, 240, 36, 12, 'rgba(10,36,42,.94)', color, 1.5);
    var skillLevels = game.progression && game.progression.skillLevels ? game.progression.skillLevels(def.id) : { basic: 1, combo: 1, ultimate: 1 };
    var skillKey = index === 0 ? 'basic' : index === 1 ? 'combo' : 'ultimate';
    text(ctx, skill.kind + '  Lv.' + (skillLevels[skillKey] || skill.level || 1), W * .5, 326, 20, '#f9e4a2', 'center', '900');
    text(ctx, skill.name, W * .5, 373, 36, '#ffe6a3', 'center', '900');
    text(ctx, '基础技能效果', W * .5, 420, 20, color, 'center', '900');
    drawWrappedText(ctx, skill.desc, W * .5, 454, 590, 21, '#e5f0e9', 2);
    ctx.save(); ctx.strokeStyle = 'rgba(222,184,100,.48)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(82, 524); ctx.lineTo(668, 524); ctx.stroke(); ctx.restore();
    if (game.heroSkillDetailTab === 'rogue') drawSkillRogueDetails(ctx, skill);
    else drawSkillStarDetails(ctx, state, skill, skillKey, def.id);
    drawSkillTipTabs(ctx, game);
    text(ctx, '点击页签查看详情 · 点击弹窗外关闭', W * .5, 1162, 17, '#a8bdb5', 'center', '700');
  }

  function drawHeroDetail(ctx, game) {
    var id = game.selectedHeroId || 'hongyi';
    var view = game.heroGrowthView && game.heroGrowthView(id);
    if (!view) { drawHeroes(ctx, game); return; }
    var def = view.def, state = view.state, stats = view.stats, tab = game.heroGrowthTab || 'level';
    var showResonance = resonanceUnlocked(game);
    ctx.fillStyle = '#07131b'; ctx.fillRect(0, 0, W, H);
    drawDetailBackdrop(ctx, game, def, showResonance);
    drawGrowthHeader(ctx, game, '御灵养成', false, false);
    A.rr(ctx, 28, 95, 68, 30, 9, def.qualityColor, '#ffe6a2', 1.5);
    text(ctx, def.quality, 62, 110, 17, '#fff2cf', 'center', '900');
    text(ctx, def.name, 112, 112, 37, '#ffe7a3', 'left', '900');
    drawFactionBadge(ctx, def, 242, 109, 19, 14);
    text(ctx, (def.factionName || '未定阵营') + '（' + (def.factionSubtitle || '') + '） · ' + def.role, 31, 150, 19, '#d3e8df', 'left', '700');
    drawGrowthStars(ctx, 46, 183, state.star, 25);
    simpleFrame(ctx, 157, 650, 436, 58, 18, .94);
    drawHeroSkills(ctx, game, def);
    var critRate = Math.round((stats.critRate == null ? .05 : stats.critRate) * 100);
    text(ctx, '战力  ' + formatNumber((stats.damage || 0) * 10 + (stats.hp || 0) + critRate * 60), 204, 679, 25, '#f2d486', 'left', '900');
    text(ctx, !showResonance ? 'Lv.' + view.level : (view.isCore ? '主灵  Lv.' + view.level : '共鸣  Lv.' + view.level), 561, 679, 23, '#a6f1dc', 'right', '900');
    simpleFrame(ctx, 27, 720, 696, 58, 16, .92);
    var statItems = [ ['攻击', stats.damage || 0], ['生命', stats.hp || 0], ['攻速', (stats.attackInterval ? (1 / stats.attackInterval).toFixed(2) : '1.00')], ['暴击率', critRate + '%'] ];
    for (var s = 0; s < statItems.length; s++) {
      var statCenter = 27 + (s + .5) * (696 / statItems.length);
      text(ctx, statItems[s][0] + '  ' + statItems[s][1], statCenter, 750, 20, '#f0d58d', 'center', '900');
    }
    var tabs = GROWTH_LAYOUT.detailTabs;
    var selectedLevel = tab === 'level';
    A.rr(ctx, tabs.levelX, tabs.y, tabs.w, tabs.h, 14, selectedLevel ? '#176a67' : '#10242b', selectedLevel ? '#71e3d1' : '#9b7834', 2);
    A.rr(ctx, tabs.starX, tabs.y, tabs.w, tabs.h, 14, !selectedLevel ? '#5c246d' : '#10242b', !selectedLevel ? '#e17ff2' : '#9b7834', 2);
    text(ctx, '灵蕴升级', tabs.levelX + tabs.w * .5, tabs.y + 27, 24, selectedLevel ? '#e6fff7' : '#d4c687', 'center', '900');
    text(ctx, '显灵升星', tabs.starX + tabs.w * .5, tabs.y + 27, 24, !selectedLevel ? '#ffe2ff' : '#d4c687', 'center', '900');
    simpleFrame(ctx, 27, 872, 696, 433, 24, .95);
    if (selectedLevel) {
      var nextLevel = Math.min(view.maxLevel, view.level + 1);
      text(ctx, 'Lv.' + view.level, 264, 931, 38, '#f5d88c', 'center', '900');
      text(ctx, '→', W * .5, 931, 44, '#ffe29a', 'center', '900');
      text(ctx, 'Lv.' + nextLevel, 490, 931, 38, '#7ce7bd', 'center', '900');
      if (showResonance && !view.isCore) {
        text(ctx, '共鸣御灵无需单独升级', W * .5, 985, 25, '#d9c58d', 'center', '900');
        text(ctx, '当前等级取五位主灵最低等级 Lv.' + view.resonanceLevel, W * .5, 1018, 18, '#b8e8dc', 'center', '700');
        text(ctx, '可替换任意一位主灵，其他御灵继续共享最低等级', W * .5, 1085, 17, '#a1bbb5', 'center', '700');
        A.rr(ctx, GROWTH_LAYOUT.detailButton.x, GROWTH_LAYOUT.detailButton.y, GROWTH_LAYOUT.detailButton.w, GROWTH_LAYOUT.detailButton.h, 20, '#80612d', '#f0d07b', 3);
        text(ctx, '入驻建木灵位', W * .5, 1242, 31, '#fff2c6', 'center', '900');
      } else {
        var nextDamage = Math.round((stats.damage || 0) * 1.08), nextHp = Math.round((stats.hp || 0) * 1.08);
        drawStatLine(ctx, 112, 974, 526, '攻击', stats.damage || 0, nextDamage);
        drawStatLine(ctx, 112, 1021, 526, '生命', stats.hp || 0, nextHp);
        drawStatLine(ctx, 112, 1068, 526, '暴击率', critRate + '%（暴伤150%）');
        drawRecruitRewardIcon(ctx, game.assets.resultRewardLingyun, 310, 1146, 'lingyun');
        text(ctx, '灵蕴  ' + view.nextLevelCost, 333, 1148, 21, '#f6d682', 'left', '900');
        A.rr(ctx, GROWTH_LAYOUT.detailButton.x, GROWTH_LAYOUT.detailButton.y, GROWTH_LAYOUT.detailButton.w, GROWTH_LAYOUT.detailButton.h, 20, '#1a746f', '#72e7d3', 3);
        text(ctx, '升 1 级', W * .5, 1242, 32, '#effff8', 'center', '900');
      }
    } else {
      var currentStage = view.starStage || { name: '星', index: state.star, total: 5 };
      var nextStar = Math.min(view.maxStar, state.star + 1);
      var nextStage = game.progression && game.progression.starStage ? game.progression.starStage(nextStar) : currentStage;
      var currentMultiplier = game.progression && game.progression.statMultiplier ? game.progression.statMultiplier(def.id) : 1;
      var nextMultiplier = view.nextStarMultiplier || currentMultiplier;
      var starStatRatio = currentMultiplier > 0 ? nextMultiplier / currentMultiplier : 1;
      drawGrowthStars(ctx, 218, 940, state.star, 34);
      text(ctx, '→', W * .5, 940, 38, '#ffe29a', 'center', '900');
      drawGrowthStars(ctx, 446, 940, nextStar, 34);
      text(ctx, currentStage.name + '相 ' + currentStage.index + '/5 · ' + state.star + '/15 星', 280, 895, 15, '#d6d4a9', 'center', '900');
      text(ctx, nextStar > state.star ? nextStage.name + '相 ' + nextStage.index + '/5 · ' + nextStar + '/15 星' : '已达最终星级', 470, 895, 15, '#a7edd5', 'center', '900');
      var starCost = view.nextStarCost || { contracts: 0, spiritSeed: 0 };
      var contractNeed = starCost.contracts || 0;
      var seedNeed = starCost.spiritSeed || 0;
      var contractReady = state.contracts >= contractNeed;
      var seedSpecificBalance = view.spiritSeedSpecificBalance == null ? 0 : view.spiritSeedSpecificBalance;
      var seedUniversalBalance = view.spiritSeedUniversalBalance == null ? 0 : view.spiritSeedUniversalBalance;
      var seedBalance = view.spiritSeedUsableBalance == null ? (view.spiritSeedBalance == null ? 0 : view.spiritSeedBalance) : view.spiritSeedUsableBalance;
      var seedFactionName = view.spiritSeedFactionName || starCost.spiritSeedFactionName || '对应阵营';
      var seedReady = seedBalance >= seedNeed;
      text(ctx, def.name + '本体卡  ' + state.contracts + ' / ' + contractNeed, W * .5, 1030, 23, contractReady ? '#bdf2df' : '#ef7b70', 'center', '900');
      if (seedNeed > 0) {
        drawRecruitRewardIcon(ctx, null, 292, 1088, 'spiritSeed');
        var seedText = starCost.spiritSeedFaction === 'universal'
          ? '万灵种  ' + seedUniversalBalance + ' / ' + seedNeed
          : seedFactionName + '  ' + seedSpecificBalance + ' + 万灵种  ' + seedUniversalBalance + ' / ' + seedNeed;
        text(ctx, seedText, 316, 1090, 17, seedReady ? '#f6d682' : '#ef7b70', 'left', '900');
      } else {
        text(ctx, '本阶段仅消耗同名本体卡', W * .5, 1090, 19, contractReady ? '#f6d682' : '#ef7b70', 'center', '900');
      }
      drawStatLine(ctx, 112, 1118, 526, '攻击', stats.damage || 0, Math.round((stats.damage || 0) * starStatRatio));
      drawStatLine(ctx, 112, 1160, 526, '生命', stats.hp || 0, Math.round((stats.hp || 0) * starStatRatio));
      var enabled = contractReady && seedReady && state.star < view.maxStar;
      A.rr(ctx, GROWTH_LAYOUT.detailButton.x, GROWTH_LAYOUT.detailButton.y, GROWTH_LAYOUT.detailButton.w, GROWTH_LAYOUT.detailButton.h, 20, enabled ? '#6b2878' : '#303438', enabled ? '#e38cf1' : '#7b7b7b', 3);
      text(ctx, state.star >= view.maxStar ? '已达星级上限' : '升 至 ' + Math.min(view.maxStar, state.star + 1) + ' 星', W * .5, 1242, 31, enabled ? '#fff0ff' : '#aaa8a3', 'center', '900');
    }
    drawToast(ctx, game);
    drawHeroSkillTip(ctx, game, def);
    drawCoreReplaceModal(ctx, game);
  }

  function coreReplaceRow(index) {
    var layout = GROWTH_LAYOUT.coreReplace;
    return { x: layout.rowX, y: layout.rowY + index * layout.rowGap, w: layout.rowW, h: layout.rowH };
  }

  function drawCoreReplaceModal(ctx, game) {
    if (!game.coreReplaceCandidateId) return;
    var profile = growthProfile(game), incoming = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[game.coreReplaceCandidateId];
    if (!incoming) return;
    var layout = GROWTH_LAYOUT.coreReplace;
    ctx.save(); ctx.fillStyle = 'rgba(2,9,14,.78)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    simpleFrame(ctx, layout.x, layout.y, layout.w, layout.h, 28, .985);
    text(ctx, '选择要替换的主灵', W * .5, layout.y + 54, 31, '#f4d887', 'center', '900');
    text(ctx, incoming.name + ' 将入驻建木灵位；助战角色不占灵位', W * .5, layout.y + 92, 17, '#bce8dc', 'center', '700');
    var coreIds = profile.coreHeroIds || [];
    for (var i = 0; i < coreIds.length && i < 5; i++) {
      var id = coreIds[i], def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[id], row = coreReplaceRow(i);
      if (!def) continue;
      A.rr(ctx, row.x, row.y, row.w, row.h, 18, 'rgba(13,42,48,.96)', def.qualityColor || '#7bdcc8', 2);
      drawGrowthPortrait(ctx, game, def, row.x + 12, row.y + 9, 74, 74, 12);
      text(ctx, '主灵 ' + (i + 1) + ' · ' + def.name, row.x + 110, row.y + 32, 22, '#fff0bd', 'left', '900');
      var state = profile.heroes[id] || {};
      text(ctx, 'Lv.' + (state.level || 1) + ' · 点击替换', row.x + 110, row.y + 64, 17, '#9de9d8', 'left', '700');
      text(ctx, '替换', row.x + row.w - 32, row.y + 46, 20, '#f6d783', 'right', '900');
    }
    A.rr(ctx, layout.cancel.x, layout.cancel.y, layout.cancel.w, layout.cancel.h, 16, '#26373b', '#849b96', 2);
    text(ctx, '暂不调整', W * .5, layout.cancel.y + layout.cancel.h * .5, 21, '#d1dfda', 'center', '900');
  }

  function draw(game, ctx) {
    if (game.homePage === 'summonEvent') {
      drawSummonEvent(ctx, game);
      return;
    }
    if (game.homePage === 'sect') {
      drawSect(ctx, game);
      return;
    }
    if (game.homePage === 'recruit') {
      drawRecruit(ctx, game);
      return;
    }
    if (game.homePage === 'heroes') {
      drawHeroes(ctx, game);
      return;
    }
    if (game.homePage === 'heroDetail') {
      drawHeroDetail(ctx, game);
      return;
    }
    if (!cover(ctx, game.assets && game.assets.homeArchiveBook, 0, 0, W, H)) {
      ctx.fillStyle = C.ink || '#07111d'; ctx.fillRect(0, 0, W, H);
    }
    drawProfile(ctx, game);
    drawResources(ctx);
    drawChapterTag(ctx, game);
    drawProgress(ctx, game);
    drawEnterButton(ctx, game);
    drawGuidePrompt(ctx, game, 1060);
    drawTaskGuide(ctx, game);
    drawToast(ctx, game);
    drawNav(ctx, 'main');
    drawFirstChargeEntry(ctx, game);
    drawSummonEventEntry(ctx, game);
    drawFirstChargeOffer(ctx, game);
  }

  function locationAt(game, x, y) {
    var scroll = clampSectScroll(game);
    for (var i = SECT_MAP.locations.length - 1; i >= 0; i--) {
      var item = SECT_MAP.locations[i];
      var cy = item.y - scroll;
      var box = item.hit || { x: item.x - item.w * .5, y: item.y - item.h * .5, w: item.w, h: item.h };
      if (x >= box.x && x <= box.x + box.w && y >= box.y - scroll && y <= box.y + box.h - scroll) return item;
    }
    return null;
  }

  function sectLocationRect(game, id) {
    var scroll = clampSectScroll(game);
    for (var i = 0; i < SECT_MAP.locations.length; i++) {
      var item = SECT_MAP.locations[i];
      if (item.id !== id) continue;
      var box = item.hit || { x: item.x - item.w * .5, y: item.y - item.h * .5, w: item.w, h: item.h };
      return { x: box.x, y: box.y - scroll, w: box.w, h: box.h };
    }
    return null;
  }

  function hit(game, x, y) {
    var tutorialAction = YL.TutorialUI && YL.TutorialUI.homeAction && YL.TutorialUI.homeAction(game, x, y);
    if (tutorialAction) return tutorialAction;
    var page = game && game.homePage || 'main';
    if (page === 'summonEvent') {
      if (hitRect(x, y, SUMMON_EVENT_LAYOUT.back)) return 'summonEventClose';
      var eventScroll = clampSummonEventScroll(game);
      for (var eventCard = 0; eventCard < SUMMON_EVENT_CARDS.length; eventCard++) {
        var eventRect = summonEventCardRect(eventCard, eventScroll);
        if (hitRect(x, y, eventRect) && y >= SUMMON_EVENT_LAYOUT.cards.viewportY && y <= SUMMON_EVENT_LAYOUT.cards.viewportY + SUMMON_EVENT_LAYOUT.cards.viewportH) {
          game.summonEventDrag = { x: x, y: y, scroll: eventScroll, moved: false };
          return 'summonEventCard:' + eventCard;
        }
      }
      if (y >= SUMMON_EVENT_LAYOUT.cards.viewportY && y <= SUMMON_EVENT_LAYOUT.cards.viewportY + SUMMON_EVENT_LAYOUT.cards.viewportH) {
        game.summonEventDrag = { x: x, y: y, scroll: eventScroll, moved: false };
      }
      if (hitRect(x, y, SUMMON_EVENT_LAYOUT.action)) return 'summonEventClaim';
      return null;
    }
    if ((page === 'main' || page === 'sect') && firstChargeOfferActive(game)) {
      if (hitRect(x, y, HOME_LAYOUT.firstChargeOffer.close)) return 'firstChargeClose';
      for (var tab = 0; tab < HOME_LAYOUT.firstChargeOffer.dayTabs.length; tab++) {
        if (hitRect(x, y, HOME_LAYOUT.firstChargeOffer.dayTabs[tab])) return 'firstChargePreview:' + tab;
      }
      if (hitRect(x, y, HOME_LAYOUT.firstChargeOffer.action)) {
        var offerStatus = firstChargeStatus(game);
        return offerStatus && offerStatus.canPurchase ? 'firstChargePurchase' : offerStatus && offerStatus.canClaim ? 'firstChargeClaimDay' : null;
      }
      return null;
    }
    if ((page === 'main' || page === 'sect') && !firstChargeOfferActive(game)) {
      var taskView = taskGuideView(game);
      if (taskView && !taskView.allComplete && hitRect(x, y, HOME_LAYOUT.taskGuide)) {
        return taskView.complete ? 'taskGuideClaim' : 'taskGuideGo:' + taskView.task.id;
      }
    }
    if ((page === 'main' || page === 'sect') && firstChargeEntryActive(game) && hitRect(x, y, HOME_LAYOUT.firstChargeEntry)) {
      return 'firstChargeOpen';
    }
    if (page === 'main' && hitRect(x, y, HOME_LAYOUT.summonEventEntry)) return 'summonEventOpen';
    if (page === 'recruit' && game.recruitReveal) return recruitRevealAction(game, x, y);
    // 请灵台、角色养成是二级功能页，底部没有主界面导航；只接收本页组件的热区。
    var standalone = page === 'recruit' || page === 'heroDetail';
    if (!standalone && y >= HOME_LAYOUT.nav.y && y <= H) {
      var index = Math.min(4, Math.max(0, Math.floor(x / (W / 5))));
      return ['stageHome', 'heroes', 'sect', 'locked', 'locked'][index];
    }
    if (page === 'heroDetail') {
      if (game.coreReplaceCandidateId) {
        var coreIds = growthProfile(game).coreHeroIds || [];
        for (var coreIndex = 0; coreIndex < coreIds.length && coreIndex < 5; coreIndex++) {
          if (hitRect(x, y, coreReplaceRow(coreIndex))) return 'coreReplace:' + coreIds[coreIndex];
        }
        if (hitRect(x, y, GROWTH_LAYOUT.coreReplace.cancel)) return 'coreReplaceCancel';
        return null;
      }
      if (game.heroSkillTipIndex != null) {
        if (hitRect(x, y, { x: GROWTH_LAYOUT.detailSkillTip.starX, y: GROWTH_LAYOUT.detailSkillTip.tabY, w: GROWTH_LAYOUT.detailSkillTip.tabW, h: GROWTH_LAYOUT.detailSkillTip.tabH })) return 'heroSkillTipTab:star';
        if (hitRect(x, y, { x: GROWTH_LAYOUT.detailSkillTip.rogueX, y: GROWTH_LAYOUT.detailSkillTip.tabY, w: GROWTH_LAYOUT.detailSkillTip.tabW, h: GROWTH_LAYOUT.detailSkillTip.tabH })) return 'heroSkillTipTab:rogue';
        if (hitRect(x, y, GROWTH_LAYOUT.detailSkillTip)) return null;
        return 'heroSkillTipClose';
      }
      for (var skillIndex = 0; skillIndex < 3; skillIndex++) {
        if (hitRect(x, y, heroSkillBox(skillIndex))) return 'heroSkill:' + skillIndex;
      }
      if (hitRect(x, y, GROWTH_LAYOUT.detailBack)) return 'heroBack';
      if (hitRect(x, y, { x: GROWTH_LAYOUT.detailTabs.levelX, y: GROWTH_LAYOUT.detailTabs.y, w: GROWTH_LAYOUT.detailTabs.w, h: GROWTH_LAYOUT.detailTabs.h })) return 'heroLevelTab';
      if (hitRect(x, y, { x: GROWTH_LAYOUT.detailTabs.starX, y: GROWTH_LAYOUT.detailTabs.y, w: GROWTH_LAYOUT.detailTabs.w, h: GROWTH_LAYOUT.detailTabs.h })) return 'heroStarTab';
      if (hitRect(x, y, GROWTH_LAYOUT.detailButton)) {
        var detailView = game.heroGrowthView && game.heroGrowthView(game.selectedHeroId);
        if ((game.heroGrowthTab || 'level') === 'level' && detailView && resonanceUnlocked(game) && !detailView.isCore) return 'coreReplaceOpen';
        return (game.heroGrowthTab || 'level') === 'star' ? 'heroStar' : 'heroUpgrade';
      }
      return null;
    }
    if (page === 'recruit') {
      if (hitRect(x, y, RECRUIT_LAYOUT.back)) return 'recruitBack';
      if (hitRect(x, y, RECRUIT_LAYOUT.info)) return 'recruitInfo';
      if (hitRect(x, y, RECRUIT_LAYOUT.record)) return 'recruitRecord';
      if (hitRect(x, y, RECRUIT_LAYOUT.single)) return 'recruitSingle';
      if (hitRect(x, y, RECRUIT_LAYOUT.ten)) return 'recruitTen';
      if (hitRect(x, y, RECRUIT_LAYOUT.currency)) return 'recruitCurrency';
      return null;
    }
    if (page === 'heroes') {
      var showResonance = resonanceUnlocked(game);
      if (hitRect(x, y, showResonance ? GROWTH_LAYOUT.actions.recruit : GROWTH_LAYOUT.actions.recruitSingle)) return 'recruit';
      if (showResonance && hitRect(x, y, GROWTH_LAYOUT.actions.formation)) return 'formation';
      var ids = ownedHeroIds(game);
      for (var cardIndex = 0; cardIndex < ids.length; cardIndex++) {
        if (hitRect(x, y, heroCardBox(cardIndex))) return 'hero:' + ids[cardIndex];
      }
      return null;
    }
    if (page === 'sect') {
      var location = locationAt(game, x, y);
      if (location) {
        game.sectDrag = { x: x, y: y, scroll: clampSectScroll(game), moved: false };
        return location.action;
      }
      game.sectDrag = { x: x, y: y, scroll: clampSectScroll(game), moved: false };
      return null;
    }
    if (hitRect(x, y, HOME_LAYOUT.enter)) return 'enter';
    if (hitRect(x, y, HOME_LAYOUT.chapterPrev)) return 'prevStage';
    if (hitRect(x, y, HOME_LAYOUT.chapterNext)) return 'nextStage';
    return null;
  }

  function move(game, x, y) {
    if (!game) return false;
    if (game.homePage === 'summonEvent' && game.summonEventDrag) {
      var eventDrag = game.summonEventDrag;
      var eventDelta = y - eventDrag.y;
      if (Math.abs(eventDelta) > 7) eventDrag.moved = true;
      game.summonEventScroll = Math.max(0, Math.min(summonEventScrollLimit(), eventDrag.scroll - eventDelta));
      return true;
    }
    if (game.homePage !== 'sect' || !game.sectDrag) return false;
    var drag = game.sectDrag;
    var delta = y - drag.y;
    if (Math.abs(delta) > 7) drag.moved = true;
    game.sectScroll = Math.max(sectScrollMin(), Math.min(sectScrollLimit(), drag.scroll - delta));
    return true;
  }

  function up(game) {
    if (game && game.homePage === 'summonEvent') {
      var eventMoved = !!(game.summonEventDrag && game.summonEventDrag.moved);
      game.summonEventDrag = null;
      return eventMoved;
    }
    if (!game || game.homePage !== 'sect') return false;
    var moved = !!(game.sectDrag && game.sectDrag.moved);
    game.sectDrag = null;
    return moved;
  }

  YL.HomeUI = {
    draw: draw,
    hit: hit,
    move: move,
    up: up,
    layout: HOME_LAYOUT,
    // 强引导只读取现有正式热区，避免为引导维护第二份坐标。
    tutorialLayout: {
      home: HOME_LAYOUT,
      recruit: RECRUIT_LAYOUT,
      summonEvent: SUMMON_EVENT_LAYOUT,
      growth: GROWTH_LAYOUT,
      heroCardBox: heroCardBox
    },
    heroListIds: ownedHeroIds,
    recruitCardBox: recruitCardBox,
    recruitRevealAction: recruitRevealAction,
    recruitRevealReadyToClose: recruitRevealReadyToClose,
    sectScrollDefault: sectScrollDefault,
    sectScrollMin: sectScrollMin,
    sectScrollLimit: sectScrollLimit,
    sectLocationRect: sectLocationRect,
    summonEventTaskAt: function (index) { return SUMMON_EVENT_CARDS[index] || null; },
    summonEventTaskStatus: summonEventCardStatus,
    summonEventTaskCount: function () { return SUMMON_EVENT_CARDS.length; },
    summonEventScrollLimit: summonEventScrollLimit,
    recruitQualityTier: recruitQualityTier
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
