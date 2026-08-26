(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};
  var A = YL.Art, C = YL.COLORS, W = YL.W, H = YL.H;

  function uiFontFamily(size) {
    if (YL.uiFontFamily) return YL.uiFontFamily(size);
    return Number(size) >= 22 ? (YL.UI_FONT_TITLE_FAMILY || '"MaShanZheng","Microsoft YaHei","PingFang SC",sans-serif') : (YL.UI_FONT_BODY_FAMILY || '"Microsoft YaHei","PingFang SC",sans-serif');
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
  function distance(ax, ay, bx, by) { return Math.sqrt(dist2(ax, ay, bx, by)); }
  function inRect(x, y, rect) { return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h; }
  function choice(list) { return list[(Math.random() * list.length) | 0]; }
  function removeFrom(list, item) { var i = list.indexOf(item); if (i >= 0) list.splice(i, 1); }
  function battleTuning() { return YL.BATTLE_TUNING || {}; }
  function skillTuning() { return YL.SKILL_TUNING || {}; }
  function heroSkillConfig(type) {
    var tuning = skillTuning();
    if (tuning.heroes && tuning.heroes[type]) return tuning.heroes[type];
    return tuning[type] || {};
  }
  function valueOr(value, fallback) { return value == null ? fallback : value; }
  function formatClock(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function formatAmount(value) {
    value = Math.max(0, Math.round(value || 0));
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function localQaMode() {
    if (!root.location || !root.location.search) return '';
    var host = root.location.hostname || '';
    if (host !== '127.0.0.1' && host !== 'localhost') return '';
    var match = /[?&]qa=([^&]+)/.exec(root.location.search);
    return match ? decodeURIComponent(match[1]) : '';
  }
  function spellCost(key) {
    return SPELL_META[key] && SPELL_META[key].cost || 1;
  }
  function spiritLampTuning() {
    var tuning = battleTuning();
    return tuning.spiritLamp || tuning.lamp || {};
  }
  function eliteDrawTuning() {
    return battleTuning().eliteDraw || {};
  }
  function enemyDensityTuning() {
    var tuning = battleTuning();
    return tuning.enemy && tuning.enemy.density || {};
  }
  function cover(ctx, img, x, y, w, h) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var scale = Math.max(w / iw, h / ih), sw = w / scale, sh = h / scale;
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
    return true;
  }
  function drawVfxFrame(ctx, img, cols, rows, frame, row, x, y, w, h, rotation, alpha) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var sw = iw / cols, sh = ih / rows, inset = 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(
      img, frame * sw + inset, row * sh + inset, sw - inset * 2, sh - inset * 2,
      -w / 2, -h / 2, w, h
    );
    ctx.restore();
    return true;
  }
  function drawCenteredImage(ctx, img, x, y, w, h, rotation, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'screen';
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, tmp = list[i];
      list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  var HERO_META = {
    hongyi: {
      name: '红衣', role: '范围灼烧', color: C.fire, sprite: 'heroHongyi', icon: 0,
      attack: ['火羽伤害 +25%', '火羽附加持续灼烧', '火羽命中产生爆燃'],
      passive: ['灼烧时间 +2 秒', '灼烧敌人死亡时传火', '灼烧可叠加并扩大范围'],
      ultimate: ['焚火阵伤害 +35%', '焚火阵范围 +30%', '焚火阵连续爆发三次']
      , name: '红衣', role: '焚火术士',
      attack: ['火球术：50% ATK 伤害', '命中灼烧：15% ATK/s，3秒', '弹道速度 350px/s'],
      passive: ['余烬：每个灼烧敌人 ATK +8%', '最多 5 层，共 +40%', '灼烧不叠加，取更高伤害'],
      ultimate: ['焚天火雨：全场 100% ATK', '全体灼烧：30% ATK/s，4秒', '释放时自身无敌 0.3 秒']
    },
    xuanya: {
      name: '玄鸦', role: '精英猎杀', color: '#d9c7a6', sprite: 'heroXuanya', icon: 4,
      attack: ['鸦影刃：远程飞刃命中目标', '飞刃返程形成扫击轨迹', '强化后返程可额外命中敌人'],
      passive: ['鸦痕：残血敌人被标记', '玄鸦优先收割鸦痕目标', '击杀鸦痕目标触发追命鸦刃'],
      ultimate: ['夜幕收割：连续斩击高威胁目标', '施加破绽，提高后续伤害', '不包含大招局内强化']
    },
    huangjin: {
      name: '黄巾', role: '重鼓镇场', color: C.gold, sprite: 'heroHuangjin', icon: 6,
      attack: ['镇岳鼓波：每轮连续两道震波', '第二道震波轻微击退', '两道结束后短暂蓄力'],
      passive: ['重鼓：每第 3 轮鼓波变强', '重鼓伤害更高并短暂减速', '重鼓有明显击退但不常驻控场'],
      ultimate: ['山岳护城：获得城防护盾', '阵前敌人短暂减速', '大招只救场，不持续控怪']
    },
    suwen: {
      name: '素问', role: '治疗守护', color: C.jade, sprite: 'heroSuwen', icon: 7,
      attack: ['灵灯伤害 +25%', '灵灯命中为最低血御灵治疗', '灵灯弹射一次并治疗两人'],
      passive: ['治疗量 +25%', '治疗附加短时护盾', '魂归结束时治疗全队'],
      ultimate: ['回春术治疗量 +35%', '回春术覆盖全队', '回春术令一名魂归御灵提前返场']
    },
    qingyi: {
      name: '青衣', role: '照破辅助', color: '#f7e6a3', sprite: 'heroQingyi', icon: 2,
      attack: ['青灯照影：60% ATK 落灯伤害', '命中施加照破，使目标受到御灵伤害提高', '目标死亡时仍按锁定落点结算'],
      passive: ['符灯同辉：御灵命中照破目标获得辉光', '辉光满后触发短时对照破目标增伤', '同辉不是全队常驻光环'],
      ultimate: ['万灯归阵：全场青灯照破', '所有御灵短暂获得同辉增伤', '不包含大招局内强化']
    }
  };

  var BOARD_H = 960;
  // 城墙战斗最小验证模式：角色固定站位，御灵自动普攻，阵主支持点击手动普攻。
  // 技能、强化、角色生命、移动与魂归暂时停用。
  var WALL_MODE = true;
  // Wall Mode uses a visual "defense line" instead of the old abstract breach
  // center point. Enemies damage the wall only when their foot point reaches
  // this line, so they no longer appear to attack empty air above the formation.
  var WALL_DEFENSE_LINE_Y = 930;
  // 召唤引导仍使用脚点触发；首个攻击引导另用敌人头顶越过进度框的触发点。
  var WALL_TUTORIAL_PROGRESS_TRIGGER_Y = 150;
  var WALL_TUTORIAL_ATTACK_HEAD_TRIGGER_Y = 132;
  // 技能教学要等第五波怪潮真正推进过战场中线，避免空场解锁呼风。
  var WALL_TUTORIAL_SKILL_PRESSURE_TRIGGER_Y = 500;
  var WALL_BREACH_Y = WALL_DEFENSE_LINE_Y; // legacy name for older score/targeting helpers
  var WALL_EMERGENCY_TARGET_DISTANCE = 180;
  var WALL_EMERGENCY_TARGET_SECONDS = 1.6;
  // Approved 887 x 1774 battle visual, adapted to the 750 x 1334 game canvas.
  // The lower scene starts at y=1090 in the approved visual and fills the
  // remaining screen. All character anchors use bottom-center coordinates.
  var BATTLE_LOWER_ART = {
    formationOverlay: { x: 0, y: 820, w: 750, h: 514 },
    protagonist: { x: 375, y: 1162, w: 139, h: 163 },
    healthFrame: { x: 215, y: 1178, w: 320, h: 21 },
    healthFill: { x: 234, y: 1182, w: 281, h: 14 },
    reservedBlankTop: 1206
  };
  var WALL_HERO_STYLE = {
    huangjin: { scale: .69 },
    hongyi: { scale: .73 },
    qingyi: { scale: .74 },
    suwen: { scale: .74 },
    xuanya: { scale: .73 },
    // 女魃立绘原图四周留白明显；这里按可见身形校准到与其他御灵接近的显示高度。
    nuba: { scale: 1.02 }
  };
  // 女魃全身素材带有较大透明边距；布阵卡片/网格按有效身形裁剪，使其与其他御灵视觉大小一致。
  var FORMATION_HERO_SOURCE_CROPS = {
    nuba: { x: 300, y: 255, w: 430, h: 730 }
  };
  function drawFormationHeroSprite(ctx, img, centerX, baseY, maxW, maxH, type, alpha) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var crop = FORMATION_HERO_SOURCE_CROPS[type];
    var sx = crop ? crop.x : 0, sy = crop ? crop.y : 0;
    var sw = crop ? crop.w : iw, sh = crop ? crop.h : ih;
    var scale = Math.min(maxW / sw, maxH / sh);
    var w = sw * scale, h = sh * scale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(img, sx, sy, sw, sh, centerX - w / 2, baseY - h, w, h);
    ctx.restore();
    return true;
  }
  var WALL_HERO_ORDER = ['hongyi', 'huangjin', 'xuanya', 'qingyi', 'nuba', 'suwen'];
  var WALL_UNLOCKED_HERO_TYPES = ['huangjin', 'hongyi', 'xuanya'];
  var WALL_DEFAULT_FORMATION_GRIDS = [1, 2, 3];
  // Single source of truth for Wall Mode combat sockets. Formation order,
  // battle placement, range preview and return/swap logic all resolve through
  // these five indices.
  var WALL_COMBAT_SLOTS = [
    { x: 164, y: 1045 },
    { x: 269, y: 999 },
    { x: 377, y: 1003 },
    { x: 487, y: 999 },
    { x: 589, y: 1048 }
  ];
  // 1-2「御灵守备」原型：阵位不再是静态炮台，而是五个不可手动操作的守备区。
  // 御灵只会在自己的区间内自动前压接敌、回撤；阵主始终留在后方持续输出。
  // 阵型固定为「前二、后三」：2 / 4 号魂位在前线，1 / 3 / 5 号魂位守后。
  // 这是战斗站位，不改变布阵页的卡牌/阵位编号与上阵顺序。
  var SPIRIT_LINE_HOME_SLOTS = [
    { x: 86, y: 790 }, { x: 230, y: 660 }, { x: 375, y: 800 },
    { x: 520, y: 660 }, { x: 664, y: 790 }
  ];
  // 1-2 原型只开放三名初始御灵；他们由布阵结果决定落在哪个魂位，进场即参战。
  var SPIRIT_LINE_STARTER_TYPES = ['huangjin', 'hongyi', 'xuanya'];
  // 首关召唤沿用城墙阵位：左二红衣、中间黄巾、第四位玄鸦。
  var WALL_FIRST_STAGE_STARTER_TYPES = ['hongyi', 'huangjin', 'xuanya'];
  var SPIRIT_LINE_MIN_Y = 520;
  var SPIRIT_LINE_MAX_Y = 828;
  // 仅供 1-2「御灵守备」V2 使用。这里不覆写旧关卡的角色参数或攻击逻辑。
  // 玩家看到的攻速统一按“攻击次数/秒”表达；内部仍换算为攻击间隔进行计时。
  var SPIRIT_LINE_V2_HERO_CONFIG = {
    // 基础局留出动作辨识空间；数值不靠提高基础攻速堆叠，强化后再突破节奏上限。
    huangjin: { attackType: 'melee', attackSpeed: .60, attackRange: 160, search: 210, multiplier: .85, block: 2, windup: .22, ultimate: 40, scale: .74 },
    xuanya: { attackType: 'melee', attackSpeed: .98, attackRange: 150, search: 200, multiplier: 1.15, block: 1, windup: .20, ultimate: 35, scale: .76 },
    hongyi: { attackType: 'ranged', attackSpeed: .92, attackRange: 850, search: 900, multiplier: .50, block: 0, windup: .22, ultimate: 40, scale: .76 }
  };
  // Fixed-position combat uses these radii for targeting, range display and UI text.
  var WALL_HERO_ATTACK_RANGE = {
    huangjin: 580,
    hongyi: 900,
    qingyi: 850,
    suwen: 800,
    xuanya: 850,
    nuba: 900
  };
  var WALL_ALLOWED_ROGUE_UPGRADES = ['E01', 'E13', 'E11', 'E02', 'E03', 'E14', 'E16', 'E04', 'E07', 'E17', 'E18', 'E08', 'N01', 'N02', 'N03', 'N04'];
  var WALL_ULTIMATE_UNLOCK_REQUIRED = 4;
  var WALL_ULTIMATE_UNLOCK_UPGRADES = { huangjin: 'E02', hongyi: 'E04', xuanya: 'E08', qingyi: 'Q05', suwen: 'E10', nuba: 'N03' };
  var SPIRIT_LINE_V2_ULTIMATE_UPGRADES = { huangjin: 'V2H03', xuanya: 'V2X03', hongyi: 'V2R03' };
  var SPIRIT_LINE_V2_ULTIMATE_ENHANCEMENT_UPGRADES = { huangjin: 'V2H04', xuanya: 'V2X04', hongyi: 'V2R04' };
  function isWallUltimateUnlockUpgrade(upgrade) {
    return !!(upgrade && (upgrade.ultimateUnlock || WALL_ULTIMATE_UNLOCK_UPGRADES[upgrade.hero] === upgrade.id));
  }
  var EXCLUSIVE_UPGRADE_EFFECT_INFO = {
    E01: { skill: '镇岳震波', kind: '普攻' },
    E02: { skill: '山岳护城', kind: '大招' },
    E03: { skill: '焚符火羽', kind: '普攻' },
    E04: { skill: '焚天火雨', kind: '大招' },
    E14: { skill: '焚符火羽', kind: '普攻' },
    E16: { skill: '业火莲心', kind: '天赋' },
    Q01: { skill: '青灯照影', kind: '普攻' },
    Q02: { skill: '青灯照影', kind: '普攻' },
    Q03: { skill: '符灯同辉', kind: '天赋' },
    Q04: { skill: '符灯同辉', kind: '天赋' },
    Q05: { skill: '万灯归阵', kind: '大招' },
    E07: { skill: '鸦影刃', kind: '普攻' },
    E17: { skill: '回旋鸦刃', kind: '普攻' },
    E18: { skill: '鸦痕追命', kind: '天赋' },
    E08: { skill: '夜幕收割', kind: '大招' },
    E09: { skill: '太素星针', kind: '普攻' },
    E20: { skill: '太素星针', kind: '普攻' },
    E21: { skill: '问命归一', kind: '天赋' },
    E22: { skill: '问命归一', kind: '天赋' },
    E10: { skill: '天命星陨', kind: '大招' },
    N01: { skill: '玄旱落仪', kind: '普攻' },
    N02: { skill: '天仪共鸣', kind: '连携' },
    N03: { skill: '赤地无疆', kind: '大招' },
    N04: { skill: '覆日天门', kind: '大招' },
    E11: { skill: '山岳回响', kind: '天赋' },
    E12: { skill: '裂地聚阵', kind: '天赋' },
    E13: { skill: '重鼓', kind: '天赋' },
    V2H01: { skill: '撼地', kind: '普攻' },
    V2H02: { skill: '镇甲', kind: '连携' },
    V2X01: { skill: '断魄横斩', kind: '普攻' },
    V2X02: { skill: '饮血残阵', kind: '连携' },
    V2R01: { skill: '火羽连珠', kind: '普攻' },
    V2R02: { skill: '贯日符', kind: '连携' },
    V2H03: { skill: '岳镇八荒', kind: '大招' },
    V2X03: { skill: '百鬼夜行', kind: '大招' },
    V2R03: { skill: '焚天火雨', kind: '大招' },
    V2H04: { skill: '岳镇八荒', kind: '大招' },
    V2X04: { skill: '百鬼夜行', kind: '大招' },
    V2R04: { skill: '焚天火雨', kind: '大招' }
  };
  var HUANGJIN_PREVIEW_MODES = [
    { id: 'base', label: '\u57fa\u7840', upgrade: null },
    { id: 'range', label: '扩音', upgrade: 'E01' },
    { id: 'heavy', label: '重鼓', upgrade: 'E13' },
    { id: 'echo', label: '回响', upgrade: 'E11' }
  ];
  var HUANGJIN_PREVIEW_UI = { x: 145, y: 520, w: 460, h: 48 };
  var WALL_ENEMY_LANES = [72, 158, 244, 330, 420, 506, 592, 678];
  // 呼风是救场击退，不应该把敌人吹回 HUD 外或远离御灵射程。
  // 否则活敌仍留在 enemies 列表里，waveQueue 已空时会卡住波次结算。
  var WALL_WIND_MIN_VISIBLE_Y = 180;
  var WALL_ENEMY_ROUTES = [
    [{ x: 68, y: 45 }, { x: 120, y: 210 }, { x: 142, y: 440 }, { x: 174, y: 685 }],
    [{ x: 150, y: 35 }, { x: 132, y: 195 }, { x: 205, y: 410 }, { x: 232, y: 690 }],
    [{ x: 242, y: 30 }, { x: 270, y: 205 }, { x: 256, y: 475 }, { x: 298, y: 705 }],
    [{ x: 330, y: 25 }, { x: 350, y: 185 }, { x: 338, y: 460 }, { x: 354, y: 710 }],
    [{ x: 420, y: 25 }, { x: 400, y: 190 }, { x: 424, y: 460 }, { x: 396, y: 710 }],
    [{ x: 506, y: 30 }, { x: 480, y: 205 }, { x: 500, y: 475 }, { x: 462, y: 705 }],
    [{ x: 592, y: 35 }, { x: 620, y: 195 }, { x: 555, y: 410 }, { x: 520, y: 690 }],
    [{ x: 678, y: 45 }, { x: 630, y: 210 }, { x: 608, y: 440 }, { x: 576, y: 685 }]
  ];
  function wallHeroPlacement(type, slot) {
    var style = WALL_HERO_STYLE[type] || { scale: .72 };
    var position = WALL_COMBAT_SLOTS[clamp(slot || 0, 0, WALL_COMBAT_SLOTS.length - 1)];
    return {
      x: position.x,
      y: position.y,
      scale: style.scale
    };
  }
  var GRID_COLS = [W * .10, W * .30, W * .50, W * .70, W * .90];
  var GRID_ROWS = [BOARD_H * .65, BOARD_H * .78, BOARD_H * .90];
  var GRID_ROW_NAMES = ['前排', '中排', '后排'];
  var ANCHORS = [];
  for (var gridRow = 0; gridRow < GRID_ROWS.length; gridRow++) {
    for (var gridCol = 0; gridCol < GRID_COLS.length; gridCol++) {
      ANCHORS.push({
        x: GRID_COLS[gridCol], y: GRID_ROWS[gridRow],
        row: gridRow, col: gridCol,
        name: GRID_ROW_NAMES[gridRow] + '·' + (gridCol + 1)
      });
    }
  }
  var SOUL_SLOTS = [
    { x: 74, y: 1118 }, { x: 146, y: 1118 }, { x: 74, y: 1224 },
    { x: 146, y: 1224 }, { x: 218, y: 1224 }
  ];
  var DEFAULT_HERO_STATS = {
    hongyi: {
      slot: 1, hp: 450, block: 1, search: 900, range: 900, move: 50,
      damage: 100, attackInterval: 1.11, attackMultiplier: 1,
      attackType: 'ranged', projectile: 350, attackWindup: .3, attackRecovery: .35,
      defenseStat: 15, ultimate: 18, scale: .70
    },
    xuanya: {
      slot: 3, hp: 560, block: 2, search: 850, range: 850, move: 14,
      damage: 76, attackInterval: .82, attackMultiplier: 1,
      attackType: 'ranged', projectile: 560, attackWindup: .2, attackRecovery: .34,
      ultimate: 13, scale: .72
    },
    huangjin: {
      slot: 2, hp: 1000, block: 3, search: 580, range: 580, move: 50,
      damage: 60, attackInterval: 2.20, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .22, attackRecovery: .42,
      defenseStat: 60, ultimate: 14, scale: .75
    },
    suwen: {
      slot: 3, hp: 470, block: 1, search: 800, range: 800, move: 88,
      damage: 34, attackInterval: 1.20, attackMultiplier: 1,
      attackType: 'ranged', projectile: 620, ultimate: 14, scale: .68
    },
    qingyi: {
      slot: 0, hp: 600, block: 1, search: 850, range: 850, move: 80,
      damage: 50, attackInterval: 1.25, attackMultiplier: 1,
      attackType: 'ranged', projectile: 520, attackWindup: .28, attackRecovery: .35,
      defenseStat: 35, ultimate: 13, scale: .69
    }
  };
  HERO_META = {
    hongyi: {
      name: '红衣', faction: '鬼族', factionName: '黄泉', factionSubtitle: '鬼', quality: '灵', job: '输出', role: '焚火术士',
      color: C.fire, sprite: 'heroHongyi', icon: 0
    },
    xuanya: {
      name: '玄鸦', faction: '妖族', factionName: '万妖', factionSubtitle: '妖', quality: '灵', job: '输出', role: '鸦痕收割',
      color: '#d9c7a6', sprite: 'heroXuanya', icon: 4
    },
    huangjin: {
      name: '黄巾', faction: '人族', factionName: '红尘', factionSubtitle: '人', quality: '凡', job: '坦克', role: '重鼓镇场',
      color: C.gold, sprite: 'heroHuangjin', icon: 6
    },
    suwen: {
      name: '素问', faction: '神', factionName: '九霄', factionSubtitle: '仙·佛·道', quality: '凡', job: '输出', role: '太素星使',
      color: C.jade, sprite: 'heroSuwen', icon: 7
    },
    nuba: {
      name: '女魃', faction: '魔', factionName: '混沌', factionSubtitle: '旱神', quality: '绝', job: '输出', role: '灾厄群攻',
      color: '#c7ad7e', sprite: 'heroNuba', icon: 3
    },
    qingyi: {
      name: '青衣', faction: '修士', factionName: '九霄', factionSubtitle: '仙·佛·道', quality: '绝', job: '辅助', role: '照破辅助',
      color: '#f7e6a3', sprite: 'heroQingyi', icon: 2
    }
  };

  DEFAULT_HERO_STATS = {
    hongyi: {
      slot: 1, hp: 450, block: 1, search: 900, range: 900, move: 14,
      damage: 100, attackInterval: 1.11, attackMultiplier: 1,
      attackType: 'ranged', projectile: 350, attackWindup: .30, attackRecovery: .35,
      defenseStat: 15, ultimate: 18, scale: .56
    },
    xuanya: {
      slot: 3, hp: 720, block: 2, search: 850, range: 850, move: 14,
      damage: 78, attackInterval: .87, attackMultiplier: 1,
      attackType: 'ranged', projectile: 560, attackWindup: .18, attackRecovery: .28,
      defenseStat: 28, ultimate: 15, scale: .58
    },
    huangjin: {
      slot: 2, hp: 1000, block: 3, search: 580, range: 580, move: 22,
      damage: 60, attackInterval: 2.20, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .22, attackRecovery: .42,
      defenseStat: 60, ultimate: 14, scale: .60
    },
    suwen: {
      slot: 3, hp: 520, block: 1, search: 800, range: 800, move: 14,
      damage: 82, attackInterval: 1.18, attackMultiplier: .9,
      attackType: 'ranged', projectile: 620, attackWindup: .26, attackRecovery: .34,
      defenseStat: 20, ultimate: 17, scale: .56
    },
    nuba: {
      slot: 4, hp: 680, block: 1, search: 900, range: 900, move: 14,
      damage: 128, attackInterval: 1.18, attackMultiplier: 1,
      attackType: 'ranged', projectile: 0, attackWindup: .30, attackRecovery: .40,
      defenseStat: 18, ultimate: 19, scale: 1.02
    },
    qingyi: {
      slot: 0, hp: 600, block: 1, search: 850, range: 850, move: 14,
      damage: 50, attackInterval: 1.25, attackMultiplier: 1,
      attackType: 'ranged', projectile: 520, attackWindup: .28, attackRecovery: .35,
      defenseStat: 35, ultimate: 13, scale: .56
    }
  };

  // 战斗内部仍使用旧 faction key 以兼容既有技能判定；所有新 UI 文案统一走最终五阵营包装。
  var DISPLAY_FACTION_NAMES = { '人族': '红尘', '妖族': '万妖', '鬼族': '黄泉', '修士': '九霄', '神': '九霄', '魔': '混沌' };
  function displayFactionName(faction) { return DISPLAY_FACTION_NAMES[faction] || faction || '未定阵营'; }

  var UPGRADE_TYPE_LABELS = { common: '通用', faction: '阵营', exclusive: '专属' };
  var RARITY_LABELS = { common: '普通', rare: '稀有', legendary: '传说' };
  var RARITY_COLORS = { common: '#d7e2d2', rare: '#7de7ff', legendary: '#ffd36e' };
  var FACTION_COLORS = { '人族': C.gold, '修士': '#f7e6a3', '妖族': '#d9c7a6', '鬼族': C.fire, '神': C.jade, '魔': '#c46cff' };
  var FORMATION_ICON = {
    faction: { '人族': 0, '修士': 1, '妖族': 2, '鬼族': 3, '神': 4, '魔': 3 },
    job: { '坦克': 5, '战士': 6, '输出': 7, '辅助': 8 },
    monster: 9, recommend: 10, start: 11, empty: 12, filter: 13, star: 14, check: 15
  };
  var FORMATION_CARD_TYPES = WALL_HERO_ORDER.slice();
  // 布阵与战斗均为同一条防线：只保留一排五个阵位。
  var FORMATION_GRID = { x: 64, y: 430, w: 622, h: 230, cols: 5, rows: 1 };
  var FORMATION_CARD_AREA = { x: 26, y: 836, w: 698, h: 296 };
  var FORMATION_START = { x: 170, y: 1192, w: 410, h: 104 };
  // 复用千抽页左下角返回箭头的尺寸与位置，适配微信竖屏单手点击。
  var FORMATION_BACK = { x: 20, y: 1174, w: 120, h: 112 };

  var SPELL_KEYS = ['wind', 'rain', 'empty'];
  var SPELL_META = {
    wind: {
      name: '呼风', icon: 0, color: '#b8f4ff', cost: 2, cooldown: 12,
      push: 170, elitePush: 120, bossPush: 60, freeze: .25,
      desc: ['横扫战场，将敌人沿来路大幅击退。', '救场技：怪物压近阵前时手动释放。']
    },
    rain: {
      name: '唤雨', icon: 1, color: '#8fdfff', cost: 3, cooldown: 18,
      duration: 6, vulnerable: .15, slowMultiplier: .88,
      desc: ['战场落雨持续 6 秒，敌人受到御灵伤害 +15%。', '雨中敌人轻微减速，适合配合御灵爆发。']
    },
    empty: {
      name: '未装载', icon: 2, color: '#6f7d82', cost: 0, disabled: true,
      desc: ['第三个主角技能槽暂未装载。']
    }
  };
  var SPELL_POS = {
    wind: { x: 436, y: 1262 },
    rain: { x: 540, y: 1262 },
    empty: { x: 644, y: 1262 }
  };
  // 初版城墙战斗只展示已经交付的主角技能；未交付技能保留配置，暂不进入玩家操作面板。
  var WALL_VISIBLE_SPELL_KEYS = ['wind'];
  var AUTO_CAST_BUTTON = { x: 718, y: 1262, r: 30 };
  var TALISMAN_BUTTON = { x: 684, y: 386, w: 54, h: 66 };
  // Generated panel aspect is 849:1421. Keep this exact ratio at runtime so
  // its circular close mount and bronze edging never stretch on tall screens.
  var TALISMAN_MODAL = { x: 72, y: 118, w: 606, h: 1014 };
  var TALISMAN_MODAL_CLOSE = { offsetX: -57, offsetY: 148, radius: 23, hitRadius: 34 };
  var TALISMAN_ROWS = { x: 112, y: 422, w: 526, h: 164, step: 176, visible: 3 };
  // 精英掉落演出：先让玩家看懂“大签筒 + 筒内竹签”，再进入出签和强化横条。
  var ELITE_DRAW_TIMING = {
    introEnd: .45,
    shakeEnd: 4.05,
    pauseEnd: 4.45,
    ejectEnd: 5.25,
    revealEnd: 6.35
  };
  var WALL_RUNE_DROP_LIFE = 12;
  var WALL_RUNE_LONG_PRESS = .18;
  var WALL_RUNE_SHELF = { x: 680, y: 468, w: 58, h: 214, slot: 48 };
  var WALL_RUNE_TYPES = {
    emberBell: {
      name: '余烬铃', short: '烬', color: '#ff7a35', rarity: '火',
      desc: '装载御灵造成的持续伤害 +20%。持续伤害累计跳 6 次时，在目标处爆出一次小范围余烬。',
      effect: '持续伤害 +20%；6 跳小爆燃'
    },
    breakPearl: {
      name: '破界珠', short: '破', color: '#ffd36e', rarity: '金',
      desc: '装载御灵连续命中同一敌人会蓄势，第 5 次命中额外造成 +40% 伤害，然后重新计数。',
      effect: '同目标第 5 击 +40%'
    },
    swiftFeather: {
      name: '疾羽坠', short: '羽', color: '#9ef8ff', rarity: '风',
      desc: '装载御灵每进行 4 次普攻，会追加一次 50% ATK 的灵羽打击。',
      effect: '每 4 次普攻追加 50% ATK'
    }
  };
  var WALL_RUNE_TYPE_ORDER = ['emberBell', 'breakPearl', 'swiftFeather'];
  var WALL_FIXED_RUNE_DROPS = {
    2: 'emberBell',
    4: 'swiftFeather',
    6: 'breakPearl'
  };
  var SPIRIT_LAMP_MAX = 5;
  var SPIRIT_LAMP_INTERVAL = 15;
  var SPIRIT_LAMP_X = [128, 210, 292, 374, 456, 538, 620];
  var SPIRIT_LAMP_Y = 908;
  // Generated card-frame sheet: common blue, rare amber, legendary crimson.
  // All card slots share a 220:505 aspect ratio. These source windows are
  // deliberately narrowed to that same ratio so the printed circular icon
  // socket stays circular instead of being stretched into an oval.
  var UPGRADE_CARD_FRAME_CROPS = {
    common: { x: 138, y: 25, w: 379, h: 870 },
    rare: { x: 631, y: 15, w: 401, h: 920 },
    legendary: { x: 1142, y: 14, w: 402, h: 922 }
  };
  var UPGRADE_CARD_FRAME_DRAW_OFFSETS = {
    common: { y: 0, h: 0 },
    rare: { y: 0, h: 28 },
    legendary: { y: 0, h: 28 }
  };
  // Card frame color is now gameplay-readable:
  // 普攻 = blue/common frame, 天赋/被动 = yellow/rare frame, 大招/必杀 = red/legendary frame.
  // Keep upgrade.rarity untouched for drop/power tuning; frameRarity is visual only.
  var UPGRADE_CARD_KIND_FRAMES = { '普攻': 'common', '天赋': 'rare', '连携': 'rare', '被动': 'rare', '大招': 'legendary', '必杀': 'legendary' };
  var UPGRADE_CARD_FRAME_COLORS = { common: C.blue, rare: C.gold, legendary: C.fire };
  // Title, footer, star strips, seals and rune strips cut from the approved UI art.
  var UPGRADE_CARD_ORNAMENT_CROPS = {
    title: { x: 100, y: 102, w: 1050, h: 275 },
    footer: { x: 175, y: 755, w: 965, h: 205 },
    stars: [
      { x: 82, y: 535, w: 355, h: 140 },
      { x: 468, y: 535, w: 355, h: 140 },
      { x: 855, y: 535, w: 360, h: 140 }
    ],
    seals: [
      { x: 1222, y: 105, w: 110, h: 145 },
      { x: 1222, y: 300, w: 110, h: 145 },
      { x: 1222, y: 455, w: 110, h: 145 }
    ],
    runes: [
      { x: 1365, y: 102, w: 105, h: 430 },
      { x: 1365, y: 545, w: 105, h: 390 }
    ]
  };
  var UPGRADE_CARD_WIDTH = 220;
  var UPGRADE_CARD_HEIGHT = 505;
  var UPGRADE_CARD_TOP = 314;
  var UPGRADE_CARD_GAP = 15;
  var UPGRADE_REWARDED_ACTIONS = {
    refresh: { x: 74, y: 1008, w: 276, h: 70 },
    all: { x: 400, y: 1008, w: 276, h: 70 }
  };
  // Printed title/icon/tag plates are not geometrically centred in every
  // generated frame. Keep one shared anchor for all card content so it can be
  // tuned by quality without pulling the star, title, icon and tag apart.
  // Positive x moves the whole content group to the right (canvas pixels).
  var UPGRADE_CARD_CONTENT_OFFSETS = {
    common: { x: 2 },
    rare: { x: 18 },
    legendary: { x: 1 }
  };
  // Approved visual tuning from the in-game drag editor. These are source
  // defaults; browser edits are saved as replacements on top of them.
  var UPGRADE_CARD_UI_TUNING = {
    common: {
      stars: { x: -3, y: 12 }, title: { x: -2, y: 11 },
      tag: { x: -2, y: 5 }, desc: { x: -1, y: 23 }
    },
    rare: {
      stars: { x: -24, y: 16 }, title: { x: -20, y: 18 },
      icon: { x: -21, y: -3 }, tag: { x: -20, y: 12 },
      desc: { x: -15, y: 32 }
    },
    legendary: {
      stars: { x: -3, y: 18 }, title: { x: -4, y: 10 },
      icon: { x: -3, y: -2 }, tag: { x: -7, y: 0 }
    }
  };
  // Bump the key when source defaults change, so an earlier editor session
  // cannot accidentally re-apply its offsets over the approved layout.
  var UPGRADE_CARD_EDITOR_STORAGE = 'yl-upgrade-card-layout-v4';

  function gridColumnFromX(x) {
    var best = 0, bestDistance = Infinity;
    for (var i = 0; i < GRID_COLS.length; i++) {
      var distanceToColumn = Math.abs(x - GRID_COLS[i]);
      if (distanceToColumn < bestDistance) { bestDistance = distanceToColumn; best = i; }
    }
    return best;
  }

  function gridRowFromY(y) {
    if (y < GRID_ROWS[0] - 56) return -1;
    if (y < (GRID_ROWS[0] + GRID_ROWS[1]) * .5) return 0;
    if (y < (GRID_ROWS[1] + GRID_ROWS[2]) * .5) return 1;
    return 2;
  }

  function upgradeCardSlot(index, count) {
    var totalWidth = count * UPGRADE_CARD_WIDTH + Math.max(0, count - 1) * UPGRADE_CARD_GAP;
    return {
      x: (W - totalWidth) * .5 + index * (UPGRADE_CARD_WIDTH + UPGRADE_CARD_GAP),
      y: UPGRADE_CARD_TOP,
      w: UPGRADE_CARD_WIDTH,
      h: UPGRADE_CARD_HEIGHT
    };
  }

  function upgradeCardFrameRarity(card) {
    return UPGRADE_CARD_FRAME_CROPS[card && card.frameRarity]
      ? card.frameRarity
      : UPGRADE_CARD_FRAME_CROPS[card && card.rarity] ? card.rarity : 'common';
  }

  function Game(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options || {};
    this.platform = this.options.platform || 'web';
    this.wx = this.options.wx;
    this.audio = new YL.AudioBus(this.platform);
    this.bgmTrack = null;
    this.assets = {};
    this.loaded = 0;
    this.loadTotal = 0;
    this.state = 'loading';
    this.last = 0;
    this.time = 0;
    this.screenW = W;
    this.screenH = H;
    this.dpr = 1;
    this.pointer = { x: W / 2, y: H / 2, down: false };
    this.dragSoul = null;
    this.dragDeploy = null;
    this.dragOrigin = null;
    this.spellPress = null;
    this.heroPress = null;
    this.protagonistManualAttackCd = 0;
    this.protagonistAttackFlash = 0;
    this.protagonistAttackCount = 0;
    this.protagonistCastTime = 0;
    this.protagonistCastMax = 0;
    this.runePress = null;
    this.dragRune = null;
    this.runeDrops = [];
    this.runeInventory = [];
    this.runeInfoUid = null;
    this.runeInfoTime = 0;
    this.runeDropCounter = 0;
    this.waveRuneDropOffered = false;
    this.inspectedHeroId = null;
    this.spellHelpKey = null;
    this.spellHelpTime = 0;
    this.spellAuto = true;
    this.speed = 1;
    this.paused = false;
    this.infoOverlay = null;
    this.talismanHeroId = null;
    this.talismanScroll = 0;
    this.talismanOverlayWasPaused = false;
    this.formationSlots = [];
    this.formationMode = 'battle';
    this.formationSelected = null;
    this.formationMoveFrom = null;
    this.formationNotice = '';
    this.formationNoticeTime = 0;
    this.selectedStageIndex = 0;
    this.stageWaveConfig = null;
    this.firstStageTutorial = null;
    this.battleResult = null;
    this.resultNotice = '';
    this.resultNoticeUntil = 0;
    this.firstChargeModal = false;
    // 仅为当前弹窗的预览页签；奖励领取资格仍由 Progression 的真实时间状态决定。
    this.firstChargePreviewDay = 0;
    // 千抽盛典的任务进度与领取状态跟随局外档案；滚动位置只属于当前页面实例。
    this.summonEventSelected = 0;
    this.summonEventClaimed = {};
    this.summonEventScroll = 0;
    this.summonEventDrag = null;
    this.summonEventButtonPressedUntil = 0;
    this.summonEventReturnPage = 'main';
    this.recruitReturnPage = 'sect';
    this.qaMode = localQaMode();
    this.progression = new YL.Progression({ platform: this.platform, wx: this.wx });
    // 成长页 QA 使用独立夹具，不覆盖玩家本机档案。
    if (this.qaMode === 'first-stage-tutorial') {
      // 独立灰盒夹具：从登录直接进入首关引导，不读取也不写入玩家本机存档。
      this.progression.volatile = true;
      this.progression.profile.guideStep = 'stage-1-1';
      this.selectedStageIndex = 0;
    } else if (this.qaMode === 'heroes' || this.qaMode === 'heroes-pre5' || this.qaMode === 'hero-detail' || this.qaMode === 'hero-star') {
      this.progression.profile = this.progression.fixture();
      if (this.qaMode === 'heroes-pre5') {
        this.progression.profile.heroes.suwen.owned = false;
        this.progression.profile.coreHeroIds = ['hongyi', 'huangjin', 'xuanya', 'qingyi'];
      }
      this.progression.volatile = true;
    } else if (this.qaMode === 'recruit-fixture') {
      // 独立灰盒夹具：验证首次请灵，不读取也不写入玩家本机存档。
      this.progression.volatile = true;
      this.progression.profile.talisman = 10;
      this.progression.profile.guideStep = 'recruit';
    } else if (this.qaMode === 'first-charge-fixture') {
      // 独立灰盒夹具：验证 1-3 后首充演示的直达、领取与第二卷跳转。
      this.progression.volatile = true;
      this.progression.profile.guideStep = 'first-charge';
      this.progression.profile.completedStages['1-3'] = true;
      this.firstChargeModal = true;
    } else if (this.qaMode === 'first-charge-day2-fixture') {
      // 独立灰盒夹具：验证购买后的第 2 日领取，不等待真实 24 小时。
      this.progression.volatile = true;
      this.progression.profile.firstChargePurchased = true;
      this.progression.profile.firstChargeStartAt = Date.now() - 86400001;
      this.progression.profile.firstChargeDaysClaimed = [true, false, false];
      this.progression.profile.completedStages['1-3'] = true;
      this.progression.profile.guideStep = 'chapter-2-preview';
      this.firstChargeModal = true;
      this.firstChargePreviewDay = 1;
    } else if (this.qaMode === 'first-charge-wait-day2-fixture') {
      // 已领首日但未满 24 小时：用于验收“第二日可领取”的禁用按钮文案。
      this.progression.volatile = true;
      this.progression.profile.firstChargePurchased = true;
      this.progression.profile.firstChargeStartAt = Date.now();
      this.progression.profile.firstChargeDaysClaimed = [true, false, false];
      this.progression.profile.completedStages['1-3'] = true;
      this.progression.profile.guideStep = 'chapter-2-preview';
      this.firstChargeModal = true;
      this.firstChargePreviewDay = 1;
    } else if (this.qaMode === 'first-charge-wait-day3-fixture') {
      // 已领前两日且未满第 3 天：用于验收“第三日可领取”的禁用按钮文案。
      this.progression.volatile = true;
      this.progression.profile.firstChargePurchased = true;
      this.progression.profile.firstChargeStartAt = Date.now() - 86400001;
      this.progression.profile.firstChargeDaysClaimed = [true, true, false];
      this.progression.profile.guideStep = 'chapter-2-preview';
      this.firstChargeModal = true;
      this.firstChargePreviewDay = 2;
    } else if (this.qaMode === 'elite-draw-fixture') {
      // 独立灰盒夹具：直开精英掉落结果弹窗，不读取也不写入玩家本机存档。
      this.progression.volatile = true;
      this.progression.profile.guideStep = 'guide-complete';
    } else if (this.qaMode === 'summon-event') {
      // 独立灰盒夹具：直接打开千抽活动页，不改变玩家本机存档。
      this.progression.volatile = true;
      this.progression.profile.completedStages['1-1'] = true;
      this.progression.profile.completedStages['1-2'] = true;
      this.progression.profile.completedStages['1-3'] = true;
      this.progression.profile.completedStages['2-1'] = true;
      this.progression.profile.guideStep = 'guide-complete';
    }
    this.assetsLoadFinished = false;
    this.cardUiTuning = this.loadCardUiTuning();
    this.cardEditor = { enabled: false, drag: null, dirty: false };
    this.huangjinPreviewMode = 'base';
    this.huangjinPreviewFreeze = 0;
    this.shake = 0;
    this.idSeed = 1;
    this.boundLoop = this.loop.bind(this);
  }

  Game.prototype.start = function () {
    this.resize();
    this.bindInput();
    this.loadAssets();
    this.raf(this.boundLoop);
  };

  Game.prototype.resize = function () {
    if (this.platform === 'wechat' && this.wx) {
      var info = this.wx.getSystemInfoSync();
      this.screenW = info.windowWidth; this.screenH = info.windowHeight;
      this.dpr = Math.min(2, info.pixelRatio || 1);
    } else {
      this.screenW = root.innerWidth || W; this.screenH = root.innerHeight || H;
      this.dpr = 1;
    }
    this.canvas.width = Math.floor(W * this.dpr);
    this.canvas.height = Math.floor(H * this.dpr);
  };

  Game.prototype.raf = function (fn) {
    var r = root.requestAnimationFrame || (this.wx && this.wx.requestAnimationFrame);
    if (r) r(fn); else setTimeout(function () { fn(Date.now()); }, 16);
  };

  Game.prototype.makeImage = function () {
    if (this.canvas.createImage) return this.canvas.createImage();
    if (typeof Image !== 'undefined') return new Image();
    return null;
  };

  Game.prototype.finishAssetLoad = function () {
    if (this.assetsLoadFinished) return;
    this.assetsLoadFinished = true;
    if (this.qaMode === 'result-win' || this.qaMode === 'result-failure') this.openQaResultPreview(this.qaMode === 'result-win');
    else if (this.qaMode === 'elite-draw-fixture') this.openQaEliteDrawPreview();
    else if (this.qaMode === 'sect') this.openSectHome();
    else if (this.qaMode === 'recruit' || this.qaMode === 'recruit-fixture') this.openRecruitHome();
    else if (this.qaMode === 'first-charge-fixture' || this.qaMode === 'first-charge-day2-fixture' || this.qaMode === 'first-charge-wait-day2-fixture' || this.qaMode === 'first-charge-wait-day3-fixture') this.openStageHome();
    else if (this.qaMode === 'summon-event') this.openSummonEvent('main');
    else if (this.qaMode === 'heroes' || this.qaMode === 'heroes-pre5') this.openHeroesHome();
    else if (this.qaMode === 'hero-detail' || this.qaMode === 'hero-star') this.openHeroDetail('hongyi', this.qaMode === 'hero-star' ? 'star' : 'level');
    // 默认档案验收入口：用于检查首位御灵的 1 星初始状态，不套用高等级 QA 夹具。
    else if (this.qaMode === 'hero-default') this.openHeroDetail('huangjin', 'level');
    else this.state = 'login';
  };

  Game.prototype.loadAssets = function () {
    var self = this, keys = Object.keys(YL.ASSETS);
    this.loadTotal = keys.length;
    keys.forEach(function (key) {
      var img = self.makeImage();
      if (!img) { self.loaded++; return; }
      img.onload = function () { self.loaded++; if (self.loaded >= self.loadTotal) self.finishAssetLoad(); };
      img.onerror = function () {
        self.loaded++;
        if (root.console && root.console.warn) root.console.warn('[御灵召来] 资源加载失败: ' + key + ' -> ' + YL.ASSETS[key]);
        if (self.loaded >= self.loadTotal) self.finishAssetLoad();
      };
      img.src = YL.ASSETS[key];
      self.assets[key] = img;
    });
    this._loadingStartedAt = Date.now();
    setTimeout(function () { if (self.state === 'loading') self.finishAssetLoad(); }, 60000);
  };

  Game.prototype.mapPoint = function (p) {
    if (YL.UI && YL.UI.mapPoint) {
      if (this.platform === 'wechat') return YL.UI.mapPoint(p.clientX, p.clientY, { width: this.screenW, height: this.screenH });
      var rect = this.canvas.getBoundingClientRect();
      return YL.UI.mapPoint(p.clientX, p.clientY, rect);
    }
    if (this.platform === 'wechat') return { x: p.clientX / this.screenW * W, y: p.clientY / this.screenH * H };
    var fallbackRect = this.canvas.getBoundingClientRect();
    return { x: (p.clientX - fallbackRect.left) / fallbackRect.width * W, y: (p.clientY - fallbackRect.top) / fallbackRect.height * H };
  };

  Game.prototype.bindInput = function () {
    var self = this;
    function start(e) {
      var p = e.touches ? e.touches[0] : e; if (!p) return;
      var q = self.mapPoint(p);
      self.pointer.x = q.x; self.pointer.y = q.y; self.pointer.down = true;
      self.onDown(q.x, q.y);
      if (e.preventDefault) e.preventDefault();
    }
    function move(e) {
      var p = e.touches ? e.touches[0] : e; if (!p) return;
      var q = self.mapPoint(p);
      self.pointer.x = q.x; self.pointer.y = q.y;
      self.onMove(q.x, q.y);
      if (e.preventDefault) e.preventDefault();
    }
    function end(e) {
      var p = e.changedTouches ? e.changedTouches[0] : e;
      var q = p ? self.mapPoint(p) : self.pointer;
      self.pointer.down = false; self.onUp(q.x, q.y);
      if (e.preventDefault) e.preventDefault();
    }
    if (this.platform === 'wechat' && this.wx) {
      this.wx.onTouchStart(start); this.wx.onTouchMove(move); this.wx.onTouchEnd(end);
    } else {
      this.canvas.addEventListener('pointerdown', start, { passive: false });
      root.addEventListener('pointermove', move, { passive: false });
      root.addEventListener('pointerup', end, { passive: false });
      root.addEventListener('resize', function () { self.resize(); });
      root.addEventListener('keydown', function (e) {
        if ((e.key === 'u' || e.key === 'U') && self.state === 'battle' && self.phase === 'cards') {
          self.cardEditor.enabled = !self.cardEditor.enabled;
          self.cardEditor.drag = null;
          if (e.preventDefault) e.preventDefault();
        } else if (WALL_MODE && self.debugHuangjinPreviewControls && self.state === 'battle' && /^[1-5]$/.test(e.key)) {
          self.setHuangjinPreviewMode(HUANGJIN_PREVIEW_MODES[parseInt(e.key, 10) - 1].id);
          if (e.preventDefault) e.preventDefault();
        }
      });
      if (root.document) root.document.addEventListener('visibilitychange', function () {
        if (root.document.hidden && self.state === 'battle') self.paused = true;
      });
    }
  };

  Game.prototype.loadCardUiTuning = function () {
    if (!root.localStorage) return {};
    try {
      var value = root.localStorage.getItem(UPGRADE_CARD_EDITOR_STORAGE);
      return value ? JSON.parse(value) : {};
    } catch (e) { return {}; }
  };

  Game.prototype.saveCardUiTuning = function () {
    if (!root.localStorage) return false;
    try {
      root.localStorage.setItem(UPGRADE_CARD_EDITOR_STORAGE, JSON.stringify(this.cardUiTuning || {}));
      this.cardEditor.dirty = false;
      return true;
    } catch (e) { return false; }
  };

  Game.prototype.cardUiOffset = function (rarity, part) {
    var group = this.cardUiTuning && this.cardUiTuning[rarity];
    var point = group && group[part];
    if (!point) {
      var defaults = UPGRADE_CARD_UI_TUNING[rarity];
      point = defaults && defaults[part];
    }
    return {
      x: point && isFinite(point.x) ? point.x : 0,
      y: point && isFinite(point.y) ? point.y : 0
    };
  };

  Game.prototype.setCardUiOffset = function (rarity, part, x, y) {
    if (!this.cardUiTuning) this.cardUiTuning = {};
    if (!this.cardUiTuning[rarity]) this.cardUiTuning[rarity] = {};
    this.cardUiTuning[rarity][part] = { x: Math.round(x), y: Math.round(y) };
    this.cardEditor.dirty = true;
  };

  Game.prototype.upgradeCardAnchors = function (card, slot) {
    var rarity = upgradeCardFrameRarity(card);
    var base = UPGRADE_CARD_CONTENT_OFFSETS[rarity] || { x: 0 };
    var contentX = slot.x + slot.w * .5 + base.x;
    var stars = this.cardUiOffset(rarity, 'stars');
    var title = this.cardUiOffset(rarity, 'title');
    var icon = this.cardUiOffset(rarity, 'icon');
    var tag = this.cardUiOffset(rarity, 'tag');
    var desc = this.cardUiOffset(rarity, 'desc');
    return {
      rarity: rarity,
      stars: { x: contentX + stars.x, y: slot.y + 45 + stars.y },
      title: { x: contentX + title.x, y: slot.y + 84 + title.y },
      icon: { x: contentX + icon.x, y: slot.y + 171 + icon.y },
      tag: { x: contentX + tag.x, y: slot.y + 230 + tag.y },
      desc: { x: contentX + desc.x, y: slot.y + 307 + desc.y }
    };
  };

  Game.prototype.cardEditorButtonAt = function (x, y) {
    if (!this.cardEditor.enabled || y < 284 || y > 332) return null;
    if (x >= 18 && x < 82) return 'save';
    if (x >= 88 && x < 152) return 'copy';
    if (x >= 158 && x < 222) return 'reset';
    if (x >= 228 && x < 292) return 'close';
    return null;
  };

  Game.prototype.copyCardUiTuning = function () {
    var text = '/* 粘贴到 game-wall.js 的 UPGRADE_CARD_UI_TUNING */\n' + JSON.stringify(this.cardUiTuning || {}, null, 2);
    var self = this;
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(text).then(function () {
        self.message = 'UI 坐标已复制'; self.messageTime = 1.5;
      }, function () { if (root.prompt) root.prompt('复制以下 UI 配置：', text); });
    } else if (root.prompt) root.prompt('复制以下 UI 配置：', text);
  };

  Game.prototype.onCardEditorDown = function (x, y) {
    var button = this.cardEditorButtonAt(x, y);
    if (button) {
      if (button === 'toggle' || button === 'close') {
        this.cardEditor.enabled = button === 'toggle' ? !this.cardEditor.enabled : false;
        this.cardEditor.drag = null;
      } else if (button === 'save') this.saveCardUiTuning();
      else if (button === 'copy') this.copyCardUiTuning();
      else if (button === 'reset') {
        this.cardUiTuning = {};
        this.cardEditor.dirty = false;
        try { if (root.localStorage) root.localStorage.removeItem(UPGRADE_CARD_EDITOR_STORAGE); } catch (e) {}
      }
      return true;
    }
    if (!this.cardEditor.enabled) return false;
    var parts = [
      { id: 'stars', w: 130, h: 48 }, { id: 'title', w: 188, h: 42 },
      { id: 'icon', w: 104, h: 104 }, { id: 'tag', w: 144, h: 42 },
      { id: 'desc', w: 184, h: 164 }
    ];
    for (var i = this.pendingCards.length - 1; i >= 0; i--) {
      var card = this.pendingCards[i], anchors = this.upgradeCardAnchors(card, upgradeCardSlot(i, this.pendingCards.length));
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p], point = anchors[part.id];
        if (x >= point.x - part.w * .5 && x <= point.x + part.w * .5 && y >= point.y - part.h * .5 && y <= point.y + part.h * .5) {
          this.cardEditor.drag = { rarity: anchors.rarity, part: part.id, x: x, y: y };
          return true;
        }
      }
    }
    return true;
  };

  Game.prototype.onMove = function (x, y) {
    if (this.state === 'title' && YL.HomeUI && YL.HomeUI.move && YL.HomeUI.move(this, x, y)) return;
    var drag = this.cardEditor && this.cardEditor.drag;
    if (drag) {
      var offset = this.cardUiOffset(drag.rarity, drag.part);
      this.setCardUiOffset(drag.rarity, drag.part, offset.x + x - drag.x, offset.y + y - drag.y);
      drag.x = x; drag.y = y;
      return;
    }
    if (this.dragRune) {
      this.dragRune.x = x; this.dragRune.y = y;
      return;
    }
    if (this.runePress && this.pointer.down) {
      var moved = dist2(x, y, this.runePress.x, this.runePress.y) > 12 * 12;
      var held = this.time - this.runePress.start >= WALL_RUNE_LONG_PRESS;
      if (moved || held) {
        var rune = this.runeByUid(this.runePress.uid);
        if (rune) this.startRuneDrag(rune, x, y);
      }
    }
  };

  Game.prototype.onDown = function (x, y) {
    this.audio.unlock();
    // 首波攻击教学要求“点击界面”即可攻击；战场点击优先交给主角，避免引导遮罩先把首次点按拦掉。
    if (this.state === 'battle' && this.isFirstStageTutorialAttackGuideActive && this.isFirstStageTutorialAttackGuideActive() &&
      this.phase === 'wave' && this.battlefieldAimPointAt(x, y)) {
      this.showProtagonistAimClick(x, y);
      var tutorialAttackFiredBeforeBlock = this.fireProtagonistTalismanAt(x, y);
      if (tutorialAttackFiredBeforeBlock) this.registerFirstStageTutorialAttack();
      return;
    }
    if (YL.TutorialUI && YL.TutorialUI.blocksGameInput && YL.TutorialUI.blocksGameInput(this, x, y)) {
      this.homeNotice = '请点击高亮位置继续';
      this.homeNoticeUntil = this.time + 1.2;
      this.message = '请点击高亮位置继续';
      this.messageTime = 1.2;
      this.audio.tone('hurt');
      return;
    }
    if (this.state === 'login') {
      if (y > 1030 && y < 1165) {
        this.audio.tone('bell');
        if (this.shouldStartFirstStageTutorial()) this.beginBattle();
        else this.openStageHome();
      }
      return;
    }
    if (this.state === 'title') {
      var homeAction = YL.HomeUI && YL.HomeUI.hit ? YL.HomeUI.hit(this, x, y) : (y > 1030 && y < 1165 ? 'enter' : null);
      if (homeAction === 'tutorialBlocked') {
        this.homeNotice = '请点击高亮位置继续';
        this.homeNoticeUntil = this.time + 1.2;
        this.audio.tone('hurt');
      } else if (homeAction === 'enter') {
        this.audio.tone('bell');
        this.taskGuideChallengeActive = null;
        this.openFormation();
      } else if (homeAction === 'sect') {
        this.audio.tone('bell');
        this.openSectHome();
      } else if (homeAction === 'stageHome') {
        this.audio.tone('bell');
        this.openStageHome();
      } else if (homeAction === 'prevStage' || homeAction === 'nextStage') {
        this.selectStage(homeAction === 'prevStage' ? -1 : 1);
      } else if (homeAction === 'recruit') {
        this.audio.tone('bell');
        this.openRecruitHome(this.homePage === 'heroes' ? 'heroes' : 'sect');
      } else if (homeAction === 'heroes') {
        this.audio.tone('bell');
        this.openHeroesHome();
      } else if (homeAction === 'formation') {
        this.audio.tone('bell');
        this.openFormation('default');
      } else if (homeAction && homeAction.indexOf('hero:') === 0) {
        this.audio.tone('bell');
        this.openHeroDetail(homeAction.slice(5));
      } else if (homeAction === 'heroBack') {
        this.audio.tone('bell');
        this.openHeroesHome();
      } else if (homeAction === 'heroLevelTab') {
        this.audio.tone('bell');
        this.heroGrowthTab = 'level';
      } else if (homeAction === 'heroStarTab') {
        this.audio.tone('bell');
        this.heroGrowthTab = 'star';
      } else if (homeAction === 'heroUpgrade') {
        this.audio.tone('bell');
        this.tryHeroLevelUpgrade(this.selectedHeroId);
      } else if (homeAction === 'coreReplaceOpen') {
        this.audio.tone('bell');
        this.coreReplaceCandidateId = this.selectedHeroId;
      } else if (homeAction === 'coreReplaceCancel') {
        this.audio.tone('bell');
        this.coreReplaceCandidateId = null;
      } else if (homeAction && homeAction.indexOf('coreReplace:') === 0) {
        this.audio.tone('bell');
        var replaced = this.progression && this.progression.replaceCoreHero(homeAction.slice(12), this.coreReplaceCandidateId);
        this.coreReplaceCandidateId = null;
        this.homeNotice = replaced && replaced.ok ? '建木灵位替换成功' : replaced && replaced.reason || '替换失败';
        this.homeNoticeUntil = this.time + 2;
      } else if (homeAction === 'heroStar') {
        this.audio.tone('bell');
        this.tryHeroStarUpgrade(this.selectedHeroId);
      } else if (homeAction && homeAction.indexOf('heroSkill:') === 0) {
        this.audio.tone('bell');
        this.heroSkillTipIndex = clamp(parseInt(homeAction.slice(10), 10) || 0, 0, 2);
        this.heroSkillDetailTab = 'star';
      } else if (homeAction && homeAction.indexOf('heroSkillTipTab:') === 0) {
        this.audio.tone('bell');
        this.heroSkillDetailTab = homeAction.slice(16) === 'rogue' ? 'rogue' : 'star';
      } else if (homeAction === 'heroSkillTipClose') {
        this.audio.tone('bell');
        this.heroSkillTipIndex = null;
        this.heroSkillDetailTab = null;
      } else if (homeAction === 'recruitBack') {
        this.audio.tone('bell');
        if (this.recruitReturnPage === 'heroes') this.openHeroesHome();
        else if (this.recruitReturnPage === 'main') this.openStageHome();
        else this.openSectHome();
      } else if (homeAction === 'recruitInfo') {
        this.audio.tone('bell');
        this.homeNotice = '请灵规则说明待接入';
        this.homeNoticeUntil = this.time + 1.8;
      } else if (homeAction === 'recruitRecord') {
        this.audio.tone('bell');
        this.homeNotice = this.progression && this.progression.profile.recruitHistory.length
          ? '已记录 ' + this.progression.profile.recruitHistory.length + ' 次请灵结果'
          : '尚未进行请灵';
        this.homeNoticeUntil = this.time + 1.8;
      } else if (homeAction === 'recruitSingle' || homeAction === 'recruitTen') {
        this.audio.tone('bell');
        this.tryRecruit(homeAction === 'recruitTen' ? 10 : 1);
      } else if (homeAction && homeAction.indexOf('recruitRevealCard:') === 0) {
        this.audio.tone('bell');
        this.revealRecruitCard(parseInt(homeAction.slice(18), 10));
      } else if (homeAction && homeAction.indexOf('recruitRevealPreview:') === 0) {
        this.audio.tone('bell');
        this.previewRecruitDetail(parseInt(homeAction.slice(21), 10));
      } else if (homeAction === 'recruitRevealAll') {
        this.audio.tone('bell');
        this.revealAllRecruitCards();
      } else if (homeAction === 'recruitRevealDetailNext') {
        this.audio.tone('bell');
        this.advanceRecruitDetail();
      } else if (homeAction === 'recruitRevealClose') {
        this.audio.tone('bell');
        this.recruitReveal = null;
        if (this.progression && this.progression.profile.guideStep === 'grow') this.openHeroesHome();
        else if (this.progression && this.progression.profile.coreReplaceGuidePending) this.openHeroesHome();
      } else if (homeAction === 'recruitCurrency') {
        this.audio.tone('bell');
        this.homeNotice = '请灵符获取途径待接入';
        this.homeNoticeUntil = this.time + 1.8;
      } else if (homeAction === 'summonEventOpen') {
        this.audio.tone('bell');
        this.openSummonEvent(this.homePage || 'main');
      } else if (homeAction === 'summonEventClose') {
        this.audio.tone('bell');
        this.closeSummonEvent();
      } else if (homeAction && homeAction.indexOf('summonEventCard:') === 0) {
        this.audio.tone('bell');
        this.summonEventSelected = clamp(parseInt(homeAction.slice(16), 10) || 0, 0, YL.HomeUI && YL.HomeUI.summonEventTaskCount ? YL.HomeUI.summonEventTaskCount() - 1 : 21);
      } else if (homeAction === 'summonEventClaim') {
        this.audio.tone('bell');
        var eventIndex = this.summonEventSelected;
        var eventStatus = YL.HomeUI && YL.HomeUI.summonEventTaskStatus ? YL.HomeUI.summonEventTaskStatus(this, eventIndex) : 'locked';
        if (eventStatus === 'claimable' && this.progression) {
          var eventGranted = this.progression.grant('talisman', 10);
          this.summonEventClaimed[eventIndex] = true;
          if (!this.progression.profile.summonEventClaimed) this.progression.profile.summonEventClaimed = {};
          this.progression.profile.summonEventClaimed[eventIndex] = true;
          this.progression.save();
          if (eventIndex === 0 && this.progression.profile.guideStep === 'summon-event-claim') this.progression.setGuideStep('summon-event-return');
          this.summonEventButtonPressedUntil = this.time + .16;
          this.homeNotice = '领取成功 · 请灵符 ×' + eventGranted;
          this.homeNoticeUntil = this.time + 2.2;
        } else if (eventStatus === 'claimed') {
          this.homeNotice = '该任务奖励已领取';
          this.homeNoticeUntil = this.time + 1.6;
        } else {
          this.homeNotice = '完成任务条件后可领取';
          this.homeNoticeUntil = this.time + 1.6;
        }
      } else if (homeAction === 'taskGuideClaim') {
        this.audio.tone('bell');
        var taskReceipt = this.claimTaskGuideReward();
        if (taskReceipt && taskReceipt.ok) this.audio.playSfx('uiTap') || this.audio.tone('win');
      } else if (homeAction && homeAction.indexOf('taskGuideGo:') === 0) {
        this.audio.tone('bell');
        this.openTaskGuideTask(homeAction.slice(12));
      } else if (homeAction === 'firstChargeOpen') {
        this.audio.tone('bell');
        this.openFirstChargeOffer();
      } else if (homeAction === 'firstChargeClose') {
        this.audio.tone('bell');
        this.firstChargeModal = false;
      } else if (homeAction && homeAction.indexOf('firstChargePreview:') === 0) {
        this.audio.tone('bell');
        this.firstChargePreviewDay = clamp(parseInt(homeAction.slice(19), 10) || 0, 0, 2);
      } else if (homeAction === 'firstChargePurchase') {
        this.audio.tone('bell');
        this.firstChargeButtonPressedUntil = this.time + .16;
        this.purchaseFirstChargeMock();
      } else if (homeAction === 'firstChargeClaimDay') {
        this.audio.tone('bell');
        this.firstChargeButtonPressedUntil = this.time + .16;
        this.claimFirstChargeDay();
      } else if (homeAction === 'locked') {
        this.audio.tone('bell');
        this.homeNotice = '暂未开放';
        this.homeNoticeUntil = this.time + 1.45;
      }
      return;
    }
    if (this.state === 'formation') {
      this.onFormationDown(x, y);
      return;
    }
    if (this.state === 'result') {
      if (this.battleResult) {
        if (x >= 89 && x <= 359 && y >= 1181 && y <= 1272) {
          this.requestResultAdDouble();
        } else if (x >= 391 && x <= 661 && y >= 1181 && y <= 1272) {
          this.audio.playSfx('uiTap') || this.audio.tone('bell');
          var receipt = this.claimBattleResultRewards();
          if (this.battleResult.win && this.battleResult.stageId === '1-1') this.openStageHome();
          else if (this.battleResult.win && this.battleResult.stageId === '1-2') this.openStageHome();
          // 1-3 后直达三日首充界面；若暂不购买，主线和宗门保留常驻入口。
          else if (this.battleResult.win && this.battleResult.stageId === '1-3') {
            this.openStageHome();
            this.openFirstChargeOffer();
          }
          else this.openStageHome();
          if (receipt) {
            this.homeNotice = receipt;
            this.homeNoticeUntil = this.time + 2.4;
          }
        }
      } else if (y > 1080 && y < 1205) {
        this.audio.tone('bell'); this.openFormation();
      }
      return;
    }
    if (this.state !== 'battle') return;
    if (this.isFirstStageTutorialActive() && this.firstStageTutorial.summonAvailable && !this.firstStageTutorial.summoned &&
      inRect(x, y, this.firstStageTutorialSummonRect())) {
      this.summonFirstStageTutorialHeroes();
      return;
    }
    if (this.phase === 'eliteDraw') {
      var eliteDrawState = this.eliteDrawState;
      if (eliteDrawState && eliteDrawState.t >= ELITE_DRAW_TIMING.revealEnd && inRect(x, y, eliteDrawState.continueRect)) this.closeEliteDraw();
      return;
    }
    if (this.isNubaRescuePauseActive()) {
      if (inRect(x, y, this.nubaRescue.continueRect)) this.advanceNubaRescueDialogue();
      return;
    }
    if (this.infoOverlay === 'talismans') { this.onTalismanDown(x, y); return; }
    if (this.infoOverlay) { this.infoOverlay = null; this.inspectedHeroId = null; return; }
    var huangjinPreviewMode = this.debugHuangjinPreviewControls ? this.huangjinPreviewModeAt(x, y) : null;
    if (huangjinPreviewMode) {
      this.setHuangjinPreviewMode(huangjinPreviewMode);
      return;
    }
    // 技能引导暂停时仍允许点按当前高亮的呼风图标；普通暂停状态继续保持不可操作。
    if (this.paused && this.isFirstStageTutorialActive() && this.firstStageTutorial.skillUnlocked && !this.firstStageTutorial.skillCast) {
      var pausedTutorialSpellKey = this.spellKeyAt(x, y);
      if (pausedTutorialSpellKey && this.phase === 'wave') {
        this.spellPress = { key: pausedTutorialSpellKey, start: this.time, long: false };
        return;
      }
    }
    if (this.paused && !this.isSpiritAccessoryTutorialGuidePauseActive()) {
      if (x > 225 && x < 525 && y > 735 && y < 835) {
        this.paused = false;
        this.audio.tone('bell');
      } else if (x > 225 && x < 525 && y > 845 && y < 937) {
        this.audio.tone('hurt');
        this.openStageHome();
      }
      return;
    }
    if (WALL_MODE && this.phase === 'wave') {
      var runeDrop = this.runeDropAt(x, y);
      if (runeDrop) {
        this.collectRuneDrop(runeDrop);
        return;
      }
      var runeBadge = this.runeBadgeAt(x, y);
      if (runeBadge) {
        this.runePress = { uid: runeBadge.uid, start: this.time, x: x, y: y };
        return;
      }
      var runeSlot = this.runeShelfSlotAt(x, y);
      if (runeSlot) {
        this.runePress = { uid: runeSlot.uid, start: this.time, x: x, y: y };
        return;
      }
      if (this.runeInfoUid) {
        this.runeInfoUid = null;
        this.runeInfoTime = 0;
        return;
      }
    }
    if (this.phase === 'cards') {
      if (!this.cardEditor.enabled && inRect(x, y, UPGRADE_REWARDED_ACTIONS.refresh)) { this.requestUpgradeRefresh(); return; }
      if (!this.cardEditor.enabled && inRect(x, y, UPGRADE_REWARDED_ACTIONS.all)) { this.requestUpgradeAll(); return; }
      if (this.onCardEditorDown(x, y)) return;
      if (this.cardEditor.enabled) return;
      for (var ci = 0; ci < this.pendingCards.length; ci++) {
        var cardSlot = upgradeCardSlot(ci, this.pendingCards.length);
        if (x >= cardSlot.x && x <= cardSlot.x + cardSlot.w && y >= cardSlot.y && y <= cardSlot.y + cardSlot.h) { this.pickCard(ci); return; }
      }
      return;
    }
    if (x >= 24 && x <= 90 && y >= 130 && y <= 205) {
      this.infoOverlay = 'monster';
      this.audio.tone('bell');
      return;
    }
    if (this.autoCastButtonAt(x, y)) {
      this.spellAuto = !this.spellAuto;
      this.message = '道士术法：' + (this.spellAuto ? '自动释放' : '手动释放');
      this.messageTime = 2;
      this.audio.tone('bell');
      return;
    }
    var action = this.sideActionAt(x, y);
    if (action >= 0) {
      if (action === 0) this.paused = true;
      else if (action === 1) this.infoOverlay = 'data';
      else if (action === 2) {
        if (!this.speedUnlocked()) {
          this.message = '通过 1-1 后解锁二倍速';
          this.messageTime = 2;
          this.audio.tone('hurt');
        } else this.cycleBattleSpeed();
      }
      else if (action === 3) this.openTalismanOverlay();
      return;
    }
    var spellKey = this.spellKeyAt(x, y);
    if (spellKey && this.phase === 'wave') {
      this.spellPress = { key: spellKey, start: this.time, long: false };
      return;
    }
    if (this.battlefieldAimPointAt(x, y)) {
      this.showProtagonistAimClick(x, y);
      this.fireProtagonistTalismanAt(x, y);
      return;
    }
    if (this.isDeploymentOpen()) {
      for (var deployed = 0; deployed < this.heroes.length; deployed++) {
        var deployedHero = this.heroes[deployed];
        if (deployedHero.alive && dist2(x, y, deployedHero.x, deployedHero.y - 28) < 58 * 58) {
          this.dragDeploy = deployedHero;
          this.dragOrigin = { x: deployedHero.x, y: deployedHero.y };
          this.audio.tone('shoot');
          return;
        }
      }
    }
    var pressedHero = this.heroAtPoint(x, y);
    if (pressedHero) {
      this.heroPress = { id: pressedHero.id, start: this.time, x: x, y: y, long: false };
      return;
    }
    this.dragSoul = null;
  };

  Game.prototype.onUp = function (x, y) {
    if (this.state === 'title' && YL.HomeUI && YL.HomeUI.up) {
      YL.HomeUI.up(this, x, y);
      return;
    }
    if (this.state === 'formation') return;
    if (this.state !== 'battle') return;
    if (this.phase === 'eliteDraw') {
      this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
      this.runePress = null; this.dragRune = null;
      return;
    }
    if (this.cardEditor && this.cardEditor.drag) {
      this.cardEditor.drag = null;
      this.saveCardUiTuning();
      return;
    }
    if (this.dragRune) {
      this.finishRuneDrag(x, y);
      return;
    }
    if (this.runePress) {
      var pressedRune = this.runeByUid(this.runePress.uid);
      this.runePress = null;
      if (pressedRune) this.showRuneInfo(pressedRune);
      return;
    }
    if (this.phase === 'cards') {
      this.spellPress = null; this.dragDeploy = null; this.dragSoul = null; this.runePress = null; this.dragRune = null;
      return;
    }
    if (this.spellPress) {
      var press = this.spellPress;
      var isLong = press.long || this.time - press.start >= .45;
      this.spellPress = null;
      if (isLong) {
        this.showSpellHelp(press.key, 1.8);
      } else if (this.spellKeyAt(x, y) === press.key) {
        if (this.spellAuto) {
          this.message = '当前为自动释放 · 点底部「自」切到手动';
          this.messageTime = 2;
          this.audio.tone('shoot');
        } else this.castSpell(press.key, true);
      }
      return;
    }
    if (this.heroPress) {
      this.heroPress = null;
      return;
    }
    if (this.dragDeploy) {
      var deployHero = this.dragDeploy;
      if (WALL_MODE) {
        var targetSlot = deployHero.soulSlot || 0, bestWallSlot = Infinity;
        for (var wallSlot = 0; wallSlot < WALL_COMBAT_SLOTS.length; wallSlot++) {
          var wallPoint = WALL_COMBAT_SLOTS[wallSlot];
          var wallDistance = dist2(x, y, wallPoint.x, wallPoint.y - 28);
          if (wallDistance < bestWallSlot) { bestWallSlot = wallDistance; targetSlot = wallSlot; }
        }
        if (bestWallSlot < 112 * 112 && targetSlot !== deployHero.soulSlot) {
          var previousSlot = deployHero.soulSlot || 0;
          var occupyingWallHero = null;
          for (var wh = 0; wh < this.heroes.length; wh++) {
            if (this.heroes[wh] !== deployHero && this.heroes[wh].soulSlot === targetSlot) {
              occupyingWallHero = this.heroes[wh];
              break;
            }
          }
          if (occupyingWallHero) {
            occupyingWallHero.soulSlot = previousSlot;
            occupyingWallHero.anchorIndex = 10 + previousSlot;
            occupyingWallHero.soulAnchorIndex = occupyingWallHero.anchorIndex;
            var oldPlacement = wallHeroPlacement(occupyingWallHero.type, previousSlot);
            occupyingWallHero.x = oldPlacement.x; occupyingWallHero.y = oldPlacement.y;
          }
          deployHero.soulSlot = targetSlot;
          deployHero.anchorIndex = 10 + targetSlot;
          deployHero.soulAnchorIndex = deployHero.anchorIndex;
          var newPlacement = wallHeroPlacement(deployHero.type, targetSlot);
          deployHero.x = newPlacement.x; deployHero.y = newPlacement.y;
          deployHero.target = null;
          this.message = deployHero.name + ' 已换到第 ' + (targetSlot + 1) + ' 阵位';
          this.messageTime = 2;
          this.burst(deployHero.x, deployHero.y, HERO_META[deployHero.type].color, 16);
          this.audio.tone('bell');
        } else {
          var snapPlacement = wallHeroPlacement(deployHero.type, deployHero.soulSlot || 0);
          deployHero.x = snapPlacement.x; deployHero.y = snapPlacement.y;
        }
        this.dragDeploy = null;
        this.dragOrigin = null;
        return;
      }
      var bestGrid = Infinity, targetGrid = deployHero.anchorIndex;
      for (var grid = 0; grid < ANCHORS.length; grid++) {
        var gridDistance = dist2(x, y, ANCHORS[grid].x, ANCHORS[grid].y);
        if (gridDistance < bestGrid) { bestGrid = gridDistance; targetGrid = grid; }
      }
      if (bestGrid < 82 * 82 && targetGrid !== deployHero.anchorIndex) {
        if (this.isSoulAnchorReserved(targetGrid, deployHero)) {
          deployHero.x = ANCHORS[deployHero.anchorIndex].x;
          deployHero.y = ANCHORS[deployHero.anchorIndex].y;
          this.dragDeploy = null;
          this.dragOrigin = null;
          this.message = '魂位已锁定 · 不能占用其他御灵的初始魂位';
          this.messageTime = 2.2;
          this.audio.tone('hurt');
          return;
        }
        var priorGrid = deployHero.anchorIndex;
        var occupyingHero = this.heroForAnchor(targetGrid);
        if (occupyingHero && occupyingHero !== deployHero) {
          occupyingHero.anchorIndex = priorGrid;
          occupyingHero.x = ANCHORS[priorGrid].x;
          occupyingHero.y = ANCHORS[priorGrid].y;
        }
        deployHero.anchorIndex = targetGrid;
        deployHero.x = ANCHORS[targetGrid].x;
        deployHero.y = ANCHORS[targetGrid].y;
        deployHero.target = null;
        this.message = deployHero.name + ' 已部署到 ' + ANCHORS[targetGrid].name;
        this.messageTime = 2;
        this.burst(deployHero.x, deployHero.y, HERO_META[deployHero.type].color, 16);
        this.audio.tone('bell');
      } else {
        deployHero.x = ANCHORS[deployHero.anchorIndex].x;
        deployHero.y = ANCHORS[deployHero.anchorIndex].y;
      }
      this.dragDeploy = null;
      this.dragOrigin = null;
      return;
    }
    this.dragSoul = null;
  };

  Game.prototype.isDeploymentOpen = function () {
    return this.state === 'battle' && this.phase === 'wave' && this.intermission > 0 && !this.enemies.length;
  };

  Game.prototype.heroAtSoulSlot = function (slot) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].soulSlot === slot) return this.heroes[i];
    return null;
  };

  Game.prototype.autoCastButtonAt = function (x, y) {
    if (!this.autoCastUnlocked()) return false;
    return dist2(x, y, AUTO_CAST_BUTTON.x, AUTO_CAST_BUTTON.y) < AUTO_CAST_BUTTON.r * AUTO_CAST_BUTTON.r;
  };

  Game.prototype.autoCastUnlocked = function () {
    var stage = this.getSelectedStage && this.getSelectedStage();
    var step = this.progression && this.progression.profile && this.progression.profile.guideStep;
    return !!(stage && stage.id === '2-1' && (step === 'chapter-2-preview' || step === 'guide-complete'));
  };

  Game.prototype.huangjinPreviewModeAt = function (x, y) {
    if (!WALL_MODE || x < HUANGJIN_PREVIEW_UI.x || x > HUANGJIN_PREVIEW_UI.x + HUANGJIN_PREVIEW_UI.w ||
      y < HUANGJIN_PREVIEW_UI.y || y > HUANGJIN_PREVIEW_UI.y + HUANGJIN_PREVIEW_UI.h) return null;
    var localX = x - HUANGJIN_PREVIEW_UI.x;
    var index = clamp(Math.floor(localX / (HUANGJIN_PREVIEW_UI.w / HUANGJIN_PREVIEW_MODES.length)), 0, HUANGJIN_PREVIEW_MODES.length - 1);
    return HUANGJIN_PREVIEW_MODES[index].id;
  };

  Game.prototype.huangjinUpgradeLevel = function (upgradeId) {
    var level = this.rogueLevel(upgradeId);
    for (var i = 0; i < HUANGJIN_PREVIEW_MODES.length; i++) {
      var mode = HUANGJIN_PREVIEW_MODES[i];
      if (mode.id === this.huangjinPreviewMode && mode.upgrade === upgradeId) return Math.max(level, 3);
    }
    return level;
  };

  Game.prototype.setHuangjinPreviewMode = function (modeId) {
    var previewMode = null;
    for (var modeIndex = 0; modeIndex < HUANGJIN_PREVIEW_MODES.length; modeIndex++) {
      if (HUANGJIN_PREVIEW_MODES[modeIndex].id === modeId) previewMode = HUANGJIN_PREVIEW_MODES[modeIndex];
    }
    if (!previewMode) return;
    this.huangjinPreviewMode = modeId;
    this.huangjinPreviewFreeze = 1.1;
    var previewHero = null;
    for (var i = 0; i < (this.heroes || []).length; i++) {
      var hero = this.heroes[i];
      if (hero.type !== 'huangjin') continue;
      previewHero = hero;
      hero.attackCd = 0;
      hero.attackWindup = 0;
      hero.pendingTarget = null;
      hero.attackCount = modeId === 'heavy' ? 1 : 0;
    }
    if (previewHero && this.zones) {
      for (var zoneIndex = this.zones.length - 1; zoneIndex >= 0; zoneIndex--) {
        if (this.zones[zoneIndex].type === 'huangjinWallWave' || this.zones[zoneIndex].type === 'huangjinWallSeal' ||
          this.zones[zoneIndex].type === 'huangjinCrack' || this.zones[zoneIndex].type === 'huangjinHeart') this.zones.splice(zoneIndex, 1);
      }
      var previewTargetX = 375;
      var previewTargetY = 720;
      var previewStartX = previewHero.x;
      var previewStartY = previewHero.y - 58;
      var previewAngle = Math.atan2(previewTargetY - previewStartY, previewTargetX - previewStartX);
      var previewWaveRange = 580 + (modeId === 'range' ? 70 : 0);
      var previewMainHalfAngle = (modeId === 'heavy' ? 40 : 34) * Math.PI / 360;
      var previewDirections = [previewAngle];
      for (var directionIndex = 0; directionIndex < previewDirections.length; directionIndex++) {
        var directionAngle = previewDirections[directionIndex];
        var isSideWave = previewDirections.length > 1 && directionIndex !== 1;
        this.zones.push({
          type: 'huangjinWallWave',
          form: modeId === 'heavy' ? 3 : 1,
          x: previewStartX, y: previewStartY,
          tx: previewStartX + Math.cos(directionAngle) * previewWaveRange,
          ty: previewStartY + Math.sin(directionAngle) * previewWaveRange,
          range: previewWaveRange,
          halfAngle: isSideWave ? .20 : previewMainHalfAngle,
          side: isSideWave,
          angle: directionAngle, life: 1.05, maxLife: 1.05, age: 0, preview: true,
          alpha: isSideWave ? .68 : 1
        });
      }
      if (modeId === 'echo') {
        this.zones.push({
          type: 'huangjinWallSeal',
          x: previewStartX + Math.cos(previewAngle) * previewWaveRange,
          y: previewStartY + Math.sin(previewAngle) * previewWaveRange - 4,
          r: 126, life: 1.05, maxLife: 1.05, age: 0, preview: true
        });
      }
    }
    this.message = '黄巾普攻样板 · ' +
      (modeId === 'base' ? '基础镇岳鼓波' : previewMode.label + '三星');
    this.messageTime = 2.2;
    this.audio.tone('bell');
  };

  Game.prototype.sideActionAt = function (x, y) {
    if (x < 684 || x > 738) return -1;
    var ys = [128, 214, 300, TALISMAN_BUTTON.y];
    for (var i = 0; i < ys.length; i++) if (y >= ys[i] && y <= ys[i] + 66) return i;
    return -1;
  };

  Game.prototype.spellKeyAt = function (x, y) {
    if (this.isFirstStageTutorialActive() && !this.firstStageTutorial.skillUnlocked) return null;
    var visibleSpellKeys = this.visibleProtagonistSpellKeys();
    for (var i = 0; i < visibleSpellKeys.length; i++) {
      var key = visibleSpellKeys[i], pos = SPELL_POS[key], meta = SPELL_META[key];
      if (!meta || meta.disabled) continue;
      if (pos && dist2(x, y, pos.x, pos.y) < 36 * 36) return key;
    }
    return null;
  };

  Game.prototype.visibleProtagonistSpellKeys = function () {
    if (!WALL_MODE) return SPELL_KEYS.slice();
    // 1-1 只教学呼风；进入 1-2 后解锁唤雨，并沿用到后续城墙关。
    var stage = this.getSelectedStage && this.getSelectedStage();
    if (stage && stage.id !== '1-1') return ['wind', 'rain'];
    return WALL_VISIBLE_SPELL_KEYS.slice();
  };

  Game.prototype.showSpellHelp = function (key, duration) {
    this.spellHelpKey = key;
    this.spellHelpTime = duration || 1.2;
  };

  Game.prototype.heroAtPoint = function (x, y) {
    for (var i = this.heroes.length - 1; i >= 0; i--) {
      var hero = this.heroes[i];
      if (!hero.alive) continue;
      if (dist2(x, y, hero.x, hero.y - 36) < 64 * 64) return hero;
    }
    return null;
  };

  Game.prototype.runeType = function (type) {
    return WALL_RUNE_TYPES[type] || WALL_RUNE_TYPES.emberBell;
  };

  Game.prototype.runeForHero = function (hero) {
    if (!hero || !this.runeInventory) return null;
    for (var i = 0; i < this.runeInventory.length; i++) {
      var rune = this.runeInventory[i];
      if (rune && rune.equippedHeroId === hero.id) return rune;
    }
    return null;
  };

  Game.prototype.runeShelfItems = function () {
    var result = [];
    if (!this.runeInventory) return result;
    for (var i = 0; i < this.runeInventory.length; i++) {
      var rune = this.runeInventory[i];
      if (rune && !rune.equippedHeroId) result.push(rune);
    }
    return result;
  };

  Game.prototype.runeByUid = function (uid) {
    if (!uid || !this.runeInventory) return null;
    for (var i = 0; i < this.runeInventory.length; i++) if (this.runeInventory[i].uid === uid) return this.runeInventory[i];
    return null;
  };

  Game.prototype.runeShelfSlotAt = function (x, y) {
    if (!WALL_MODE || !this.runeInventory || !this.runeInventory.length) return null;
    var shelf = WALL_RUNE_SHELF;
    if (x < shelf.x - 10 || x > shelf.x + shelf.w + 10 || y < shelf.y - 10 || y > shelf.y + shelf.h + 10) return null;
    var shelfItems = this.runeShelfItems();
    var visible = Math.min(4, shelfItems.length);
    for (var i = 0; i < visible; i++) {
      var cy = shelf.y + 24 + i * shelf.slot;
      if (dist2(x, y, shelf.x + shelf.w / 2, cy) <= 25 * 25) return shelfItems[i];
    }
    return null;
  };

  Game.prototype.runeShelfDropAt = function (x, y) {
    if (!WALL_MODE || !this.runeInventory || !this.runeInventory.length) return false;
    var shelf = WALL_RUNE_SHELF;
    var visible = Math.max(1, Math.min(4, this.runeShelfItems().length));
    var panelH = Math.max(58, visible * shelf.slot + 12);
    return x >= shelf.x - 12 && x <= shelf.x + shelf.w + 12 && y >= shelf.y - 18 && y <= shelf.y + panelH + 18;
  };

  Game.prototype.runeBadgeAt = function (x, y) {
    if (!WALL_MODE || !this.runeInventory || !this.runeInventory.length) return null;
    for (var i = this.heroes.length - 1; i >= 0; i--) {
      var hero = this.heroes[i];
      if (!hero || !hero.alive) continue;
      var rune = this.runeForHero(hero);
      if (!rune) continue;
      var pos = this.equippedRuneBadgePosition(hero);
      if (dist2(x, y, pos.x, pos.y) <= 26 * 26) return rune;
    }
    return null;
  };

  Game.prototype.runeDropAt = function (x, y) {
    if (!WALL_MODE || !this.runeDrops || !this.runeDrops.length) return null;
    for (var i = this.runeDrops.length - 1; i >= 0; i--) {
      var drop = this.runeDrops[i];
      if (drop && dist2(x, y, drop.x, drop.y) <= 34 * 34) return drop;
    }
    return null;
  };

  Game.prototype.heroAtRuneDropTarget = function (x, y) {
    for (var i = this.heroes.length - 1; i >= 0; i--) {
      var hero = this.heroes[i];
      if (!hero || !hero.alive) continue;
      if (dist2(x, y, hero.x, hero.y - 78) <= 78 * 78 || dist2(x, y, hero.x, hero.y - 36) <= 66 * 66) return hero;
    }
    return null;
  };

  Game.prototype.nextRuneType = function () {
    var order = WALL_RUNE_TYPE_ORDER;
    var index = Math.abs((this.runeDropCounter || 0) + (this.wave || 0) + (this.kills || 0)) % order.length;
    return order[index];
  };

  Game.prototype.spawnRuneDrop = function (x, y, type) {
    var stage = this.getSelectedStage && this.getSelectedStage();
    // 1-1 是纯引导关，灵饰从后续关卡开始出现；保留后续关卡的正式掉落逻辑。
    if (!WALL_MODE || this.isSpiritLineMode() || stage && stage.id === '1-1') return null;
    this.runeDrops = this.runeDrops || [];
    if (this.runeDrops.length >= 3) return null;
    var runeType = type || this.nextRuneType();
    var drop = {
      id: 'runeDrop' + (this.idSeed++),
      type: runeType,
      x: clamp(x == null ? W / 2 : x, 55, W - 82),
      y: clamp(y == null ? 610 : y, 170, 860),
      life: WALL_RUNE_DROP_LIFE,
      maxLife: WALL_RUNE_DROP_LIFE,
      pulse: Math.random() * Math.PI * 2
    };
    this.runeDropCounter = (this.runeDropCounter || 0) + 1;
    this.runeDrops.push(drop);
    this.burst(drop.x, drop.y, this.runeType(runeType).color, 10);
    this.audio.playSfx('runeDrop');
    return drop;
  };

  Game.prototype.isSpiritAccessoryTutorialGuidePauseActive = function () {
    var tutorial = this.spiritAccessoryTutorial;
    return !!(this.paused && tutorial && (tutorial.phase === 'pickup' || tutorial.phase === 'equip'));
  };

  Game.prototype.shouldOfferWaveRuneDrop = function () {
    var stage = this.getSelectedStage && this.getSelectedStage();
    if (!WALL_MODE || this.isSpiritLineMode() || stage && stage.id === '1-1' ||
      this.externalSkillPreview || this.waveRuneDropOffered) return false;
    if (this.wave >= this.waveMax) return false;
    var wave = this.wave || 1;
    return !!WALL_FIXED_RUNE_DROPS[wave];
  };

  Game.prototype.collectRuneDrop = function (drop) {
    if (!drop) return false;
    this.runeDrops = this.runeDrops || [];
    var index = this.runeDrops.indexOf(drop);
    if (index >= 0) this.runeDrops.splice(index, 1);
    this.runeInventory = this.runeInventory || [];
    var uid = 'rune' + (this.idSeed++);
    this.runeInventory.push({ uid: uid, type: drop.type, equippedHeroId: null });
    if (this.spiritAccessoryTutorial && this.spiritAccessoryTutorial.dropId === drop.id) {
      this.spiritAccessoryTutorial.phase = 'equip';
      this.spiritAccessoryTutorial.runeUid = uid;
    }
    var meta = this.runeType(drop.type);
    this.message = '获得灵饰：' + meta.name + ' · 从右侧灵饰栏拖到御灵头顶装备';
    this.messageTime = 3;
    this.floatText(drop.x, drop.y - 42, meta.name, meta.color, 20, { life: .9, bold: true, rise: 18 });
    this.burst(drop.x, drop.y, meta.color, 22);
    this.audio.playSfx('runePickup') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.updateRuneDrops = function (dt) {
    if (!this.runeDrops || !this.runeDrops.length || this.paused || this.infoOverlay) return;
    for (var i = this.runeDrops.length - 1; i >= 0; i--) {
      var drop = this.runeDrops[i];
      drop.life = drop.maxLife || WALL_RUNE_DROP_LIFE;
    }
  };

  Game.prototype.startRuneDrag = function (rune, x, y) {
    if (!rune) return false;
    this.dragRune = { uid: rune.uid, x: x, y: y, fromHeroId: rune.equippedHeroId || null };
    this.heroPress = null;
    this.spellPress = null;
    this.audio.playSfx('uiTap') || this.audio.tone('shoot');
    return true;
  };

  Game.prototype.equipRuneToHero = function (rune, hero) {
    if (!rune || !hero) return false;
    var old = this.runeForHero(hero);
    if (old && old.uid !== rune.uid) old.equippedHeroId = null;
    rune.equippedHeroId = hero.id;
    var meta = this.runeType(rune.type);
    this.runeInfoUid = null;
    this.runeInfoTime = 0;
    this.message = meta.name + ' 已装备给 ' + hero.name + (old && old.uid !== rune.uid ? '，旧灵饰已回到栏内' : '');
    this.messageTime = 2.4;
    this.floatText(hero.x, hero.y - 126, meta.name, meta.color, 18, { life: .8, bold: true, rise: 16 });
    this.burst(hero.x, hero.y - 58, meta.color, 14);
    this.audio.playSfx('runeEquip') || this.audio.tone('bell');
    if (this.spiritAccessoryTutorial && this.spiritAccessoryTutorial.runeUid === rune.uid) {
      this.spiritAccessoryTutorial.phase = 'complete';
      this.paused = false;
      if (this.progression && this.progression.completeSpiritAccessoryGuide) this.progression.completeSpiritAccessoryGuide();
      this.message = '灵饰已生效 · 继续镇魂';
      this.messageTime = 2.4;
    }
    return true;
  };

  Game.prototype.unequipRune = function (rune) {
    if (!rune || !rune.equippedHeroId) return false;
    var hero = this.getHero(rune.equippedHeroId);
    var meta = this.runeType(rune.type);
    rune.equippedHeroId = null;
    this.runeInfoUid = null;
    this.runeInfoTime = 0;
    this.message = meta.name + ' 已卸载，保留在灵饰栏';
    this.messageTime = 2;
    if (hero) {
      this.floatText(hero.x, hero.y - 120, '卸下 ' + meta.name, meta.color, 16, { life: .75, bold: true, rise: 14 });
      this.burst(hero.x, hero.y - 58, meta.color, 8);
    }
    this.audio.playSfx('uiTap') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.finishRuneDrag = function (x, y) {
    var drag = this.dragRune;
    this.dragRune = null;
    this.runePress = null;
    if (!drag) return false;
    var rune = this.runeByUid(drag.uid);
    if (!rune) return false;
    var hero = this.heroAtRuneDropTarget(x, y);
    if (hero) return this.equipRuneToHero(rune, hero);
    if (this.runeShelfDropAt(x, y)) return this.unequipRune(rune) || true;
    return true;
  };

  Game.prototype.showRuneInfo = function (rune) {
    rune = typeof rune === 'string' ? this.runeByUid(rune) : rune;
    if (!rune) return false;
    if (this.runeInfoUid === rune.uid) {
      this.runeInfoUid = null;
      this.runeInfoTime = 0;
      return true;
    }
    this.runeInfoUid = rune.uid;
    this.runeInfoTime = 9999;
    this.audio.playSfx('uiTap') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.applyRuneBeforeDamage = function (source, enemy, options) {
    if (!WALL_MODE || !source || !enemy || !source.alive || options && options.noRune) return 1;
    var rune = this.runeForHero(source);
    if (!rune || rune.type !== 'breakPearl' || options && options.dot) return 1;
    if (source.runeBreakTargetId !== enemy.id) {
      source.runeBreakTargetId = enemy.id;
      source.runeBreakStacks = 0;
    }
    source.runeBreakStacks = (source.runeBreakStacks || 0) + 1;
    if (source.runeBreakStacks >= 5) {
      source.runeBreakStacks = 0;
      this.zones.push({ type: 'ring', x: enemy.x, y: enemy.y - 18, r: 58, color: this.runeType(rune.type).color, life: .38, maxLife: .38 });
      this.floatText(enemy.x, enemy.y - 82, '破阵', this.runeType(rune.type).color, 19, { life: .75, bold: true, impact: true });
      return 1.4;
    }
    return 1;
  };

  Game.prototype.onRuneDotTick = function (enemy, source) {
    if (!WALL_MODE || !enemy || enemy.dead || !source || !source.alive) return;
    var rune = this.runeForHero(source);
    if (!rune || rune.type !== 'emberBell') return;
    source.runeEmberTicks = (source.runeEmberTicks || 0) + 1;
    if (source.runeEmberTicks < 6) return;
    source.runeEmberTicks = 0;
    var damage = this.heroAttackPower(source) * .32;
    this.damageArea(enemy.x, enemy.y, 70, damage, source, null, { impact: true, noRune: true });
    this.zones.push({ type: 'emberBurst', x: enemy.x, y: enemy.y, r: 70, color: this.runeType(rune.type).color, life: .42, maxLife: .42 });
    this.floatText(enemy.x, enemy.y - 76, '余烬', this.runeType(rune.type).color, 18, { life: .7, bold: true, impact: true });
  };

  Game.prototype.findRuneSwiftTarget = function (hero, target, aim) {
    if (target && !target.dead) return target;
    var ax = aim && aim.x != null ? aim.x : hero.x;
    var ay = aim && aim.y != null ? aim.y : hero.y - 120;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d > (hero.attackRange || 800) + 40) continue;
      var score = dist2(enemy.x, enemy.y, ax, ay) + d * 12;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.onRuneBasicAttack = function (hero, target, aim, attackPower) {
    if (!WALL_MODE || !hero || !hero.alive) return;
    var rune = this.runeForHero(hero);
    if (!rune || rune.type !== 'swiftFeather') return;
    hero.runeSwiftCount = (hero.runeSwiftCount || 0) + 1;
    if (hero.runeSwiftCount < 4) return;
    hero.runeSwiftCount = 0;
    var swiftTarget = this.findRuneSwiftTarget(hero, target, aim);
    if (!swiftTarget) return;
    var meta = this.runeType(rune.type);
    var sx = hero.x, sy = hero.y - 70;
    this.damageEnemy(swiftTarget, Math.max(1, (attackPower || this.heroAttackPower(hero)) * .5), hero, {
      impact: true,
      noRune: true
    });
    this.zones.push({ type: 'slash', x: sx, y: sy, tx: swiftTarget.x, ty: swiftTarget.y - 18, color: meta.color, life: .30, maxLife: .30 });
    this.zones.push({ type: 'starImpact', x: swiftTarget.x, y: swiftTarget.y - 18, r: 34, color: meta.color, life: .30, maxLife: .30 });
    this.floatText(swiftTarget.x, swiftTarget.y - 78, '疾羽', meta.color, 17, { life: .65, bold: true });
  };

  Game.prototype.updateSpellPress = function () {
    if (!this.spellPress || !this.pointer.down) return;
    if (this.time - this.spellPress.start >= .45) {
      this.spellPress.long = true;
      this.showSpellHelp(this.spellPress.key, .35);
    }
  };

  Game.prototype.updateHeroPress = function () {
    if (!this.heroPress || !this.pointer.down || this.infoOverlay || this.dragDeploy || this.spellPress || this.runePress || this.dragRune) return;
    if (dist2(this.pointer.x, this.pointer.y, this.heroPress.x, this.heroPress.y) > 34 * 34) {
      this.heroPress = null;
      return;
    }
    if (this.time - this.heroPress.start >= .45) {
      var hero = this.getHero(this.heroPress.id);
      this.heroPress = null;
      if (!hero || !hero.alive) return;
      this.inspectedHeroId = hero.id;
      this.infoOverlay = 'hero';
      this.audio.tone('bell');
    }
  };

  Game.prototype.openFormation = function (mode) {
    var defaultMode = mode === 'default';
    // 城墙版的战斗入口仍然保持自动驻守；只有从御灵页进入的“布阵”才打开阵容编辑页。
    if (WALL_MODE && !defaultMode) {
      var stage = this.getSelectedStage(), step = this.progression && this.progression.profile.guideStep;
      var requiredStep = stage && 'stage-' + stage.id;
      if (step && step.indexOf('stage-') === 0 && step !== requiredStep) {
        this.homeNotice = '请先完成当前引导';
        this.homeNoticeUntil = this.time + 1.8;
        return;
      }
      if (step === 'recruit' || step === 'grow' || step === 'star') {
        this.homeNotice = step === 'recruit' ? '前往请灵台，回应新的御灵' : '先完成御灵养成引导';
        this.homeNoticeUntil = this.time + 2;
        return;
      }
      this.beginBattle();
      return;
    }
    this.formationMode = defaultMode ? 'default' : 'battle';
    this.state = 'formation';
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.dragSoul = null;
    this.dragDeploy = null;
    this.spellPress = null;
    this.formationSlots = defaultMode ? this.defaultFormationSlots() : [];
    this.formationSelected = null;
    this.formationMoveFrom = null;
    this.formationNotice = defaultMode
      ? (this.formationSlots.length ? '当前默认阵容 · 可调整后保存' : '点击下方卡牌设置默认阵容')
      : '点击下方卡牌上阵御灵';
    this.formationNoticeTime = 2.2;
  };

  Game.prototype.defaultFormationSlots = function () {
    var profile = this.progression && this.progression.profile || {};
    var saved = Array.isArray(profile.defaultFormation) ? profile.defaultFormation : [];
    var slots = [], usedTypes = [], usedGrids = [];
    for (var i = 0; i < saved.length && slots.length < SOUL_SLOTS.length; i++) {
      var item = saved[i] || {}, type = item.type, gridIndex = Number(item.gridIndex);
      if (!this.isFormationHeroUnlocked(type) || usedTypes.indexOf(type) >= 0 || !isFinite(gridIndex) || gridIndex < 0 || gridIndex >= FORMATION_GRID.cols || usedGrids.indexOf(gridIndex) >= 0) continue;
      usedTypes.push(type);
      usedGrids.push(gridIndex);
      slots.push({ type: type, gridIndex: Math.floor(gridIndex) });
    }
    var roster = this.configuredRoster ? this.configuredRoster() : [];
    for (var r = 0; r < roster.length && slots.length < SOUL_SLOTS.length; r++) {
      var rosterType = roster[r];
      if (!this.isFormationHeroUnlocked(rosterType) || usedTypes.indexOf(rosterType) >= 0) continue;
      var preferred = WALL_DEFAULT_FORMATION_GRIDS[r];
      var fallback = usedGrids.indexOf(preferred) >= 0 ? -1 : preferred;
      if (fallback < 0 || fallback >= FORMATION_GRID.cols) {
        for (var grid = 0; grid < FORMATION_GRID.cols; grid++) {
          if (usedGrids.indexOf(grid) < 0) { fallback = grid; break; }
        }
      }
      if (fallback < 0) continue;
      usedTypes.push(rosterType);
      usedGrids.push(fallback);
      slots.push({ type: rosterType, gridIndex: fallback });
    }
    return slots;
  };

  Game.prototype.saveDefaultFormation = function () {
    if (!this.progression || !this.progression.profile) return;
    this.progression.profile.defaultFormation = this.formationSlots.slice(0, SOUL_SLOTS.length).map(function (slot) {
      return { type: slot.type, gridIndex: slot.gridIndex };
    });
    this.progression.save();
    this.setFormationNotice('默认阵容已保存', 2.2);
    this.audio.tone('win');
  };

  Game.prototype.openSummonEvent = function (returnPage) {
    this.state = 'title';
    this.homePage = 'summonEvent';
    this.summonEventReturnPage = returnPage === 'sect' ? 'sect' : 'main';
    this.summonEventSelected = 0;
    this.summonEventClaimed = this.progression && this.progression.profile && this.progression.profile.summonEventClaimed || {};
    this.summonEventScroll = 0;
    this.summonEventDrag = null;
    this.summonEventReferenceMode = false;
    this.summonEventButtonPressedUntil = 0;
    this.firstChargeModal = false;
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
    if (this.progression && this.progression.profile.guideStep === 'summon-event-open') this.progression.setGuideStep('summon-event-claim');
  };

  Game.prototype.closeSummonEvent = function () {
    var returnPage = this.summonEventReturnPage === 'sect' ? 'sect' : 'main';
    if (this.progression && this.progression.profile.guideStep === 'summon-event-return') {
      this.progression.setGuideStep('recruit');
      returnPage = 'main';
    }
    if (returnPage === 'sect') this.openSectHome();
    else this.openStageHome();
  };

  Game.prototype.openStageHome = function () {
    this.state = 'title';
    this.homePage = 'main';
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.dragSoul = null;
    this.dragDeploy = null;
    this.spellPress = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
  };

  Game.prototype.isFirstStageTutorialBattle = function (formationSlots) {
    var stage = this.getSelectedStage && this.getSelectedStage();
    var step = this.progression && this.progression.profile && this.progression.profile.guideStep;
    return !!(stage && stage.id === '1-1' && step === 'stage-1-1' && (!this.qaMode || this.qaMode === 'first-stage-tutorial') && !this.externalSkillPreview &&
      (!formationSlots || !formationSlots.length));
  };

  Game.prototype.shouldStartFirstStageTutorial = function () {
    return this.isFirstStageTutorialBattle();
  };

  Game.prototype.isFirstStageTutorialActive = function () {
    return !!(this.firstStageTutorial && this.firstStageTutorial.active);
  };

  Game.prototype.isFirstStageTutorialAttackGuideActive = function () {
    return !!(this.isFirstStageTutorialActive() && this.firstStageTutorial.attackGuideActive &&
      !this.firstStageTutorial.attackGuideDone);
  };

  Game.prototype.isFirstStageTutorialGuidePauseActive = function () {
    var tutorial = this.firstStageTutorial;
    return !!(this.isFirstStageTutorialAttackGuideActive() ||
      (this.isFirstStageTutorialActive() && tutorial && tutorial.summonAvailable && !tutorial.summoned) ||
      (this.isFirstStageTutorialActive() && tutorial && tutorial.skillUnlocked && !tutorial.skillCast));
  };

  Game.prototype.firstStageTutorialAttackGuideReady = function () {
    if (!this.isFirstStageTutorialActive() || this.wave !== 1 || this.firstStageTutorial.attackGuideDone ||
      this.firstStageTutorial.attackGuideActive) return false;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      if (this.wallEnemyHeadY(enemy) >= WALL_TUTORIAL_ATTACK_HEAD_TRIGGER_Y) return true;
    }
    return false;
  };

  Game.prototype.activateFirstStageTutorialAttackGuide = function () {
    if (!this.firstStageTutorialAttackGuideReady()) return false;
    this.firstStageTutorial.attackGuideActive = true;
    this.paused = true;
    this.message = '';
    this.messageTime = 0;
    return true;
  };

  Game.prototype.registerFirstStageTutorialAttack = function () {
    var tutorial = this.firstStageTutorial;
    if (!this.isFirstStageTutorialAttackGuideActive()) return false;
    // 首次有效点按即完成主角攻击教学：符纸已发射后立即解除遮罩和战场暂停。
    tutorial.attackGuideClicks = 1;
    tutorial.attackGuideActive = false;
    tutorial.attackGuideDone = true;
    this.paused = false;
    this.message = '主角攻击已掌握 · 怪潮继续袭来';
    this.messageTime = 1.8;
    return true;
  };

  Game.prototype.firstStageTutorialSummonRect = function () {
    // 召唤教学点击主角本体：主角绘制使用底部中心锚点，焦点框覆盖完整身形并留出少量边距。
    var protagonist = BATTLE_LOWER_ART.protagonist;
    return {
      x: protagonist.x - protagonist.w * .5 - 24,
      y: protagonist.y - protagonist.h - 12,
      w: protagonist.w + 48,
      h: protagonist.h + 24
    };
  };

  Game.prototype.firstStageTutorialSummonGuideReady = function () {
    var tutorial = this.firstStageTutorial;
    if (!this.isFirstStageTutorialActive() || !tutorial || this.wave < 2 || !tutorial.attackGuideDone ||
      tutorial.summoned || tutorial.summonAvailable) return false;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      if (this.wallEnemyFootY(enemy) >= WALL_TUTORIAL_PROGRESS_TRIGGER_Y) return true;
    }
    return false;
  };

  Game.prototype.activateFirstStageTutorialSummonGuide = function () {
    if (!this.firstStageTutorialSummonGuideReady()) return false;
    this.firstStageTutorial.summonAvailable = true;
    this.paused = true;
    this.message = '';
    this.messageTime = 0;
    return true;
  };

  Game.prototype.firstStageTutorialSkillGuideReady = function () {
    var tutorial = this.firstStageTutorial;
    if (!this.isFirstStageTutorialActive() || !tutorial || this.wave < 5 || !tutorial.summoned ||
      tutorial.skillUnlocked || tutorial.skillCast) return false;
    for (var i = 0; i < (this.enemies || []).length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      if (this.wallEnemyFootY(enemy) >= WALL_TUTORIAL_SKILL_PRESSURE_TRIGGER_Y) return true;
    }
    return false;
  };

  Game.prototype.activateFirstStageTutorialSkillGuide = function () {
    if (!this.firstStageTutorialSkillGuideReady()) return false;
    this.firstStageTutorial.skillUnlocked = true;
    this.spiritLampLit = this.spiritLampMax;
    this.spellCd.wind = 0;
    this.paused = true;
    this.message = '';
    this.messageTime = 0;
    return true;
  };

  Game.prototype.firstStageTutorialSpellRect = function (key) {
    var pos = SPELL_POS[key] || SPELL_POS.wind;
    return { x: pos.x - 38, y: pos.y - 38, w: 76, h: 76 };
  };

  Game.prototype.summonFirstStageTutorialHeroes = function () {
    var tutorial = this.firstStageTutorial;
    if (!tutorial || tutorial.summoned) return false;
    for (var i = 0; i < WALL_FIRST_STAGE_STARTER_TYPES.length; i++) {
      var type = WALL_FIRST_STAGE_STARTER_TYPES[i];
      var stats = this.configuredHeroStats(type);
      var slot = clamp(stats.slot == null ? i : stats.slot, 0, WALL_COMBAT_SLOTS.length - 1) | 0;
      var hero = this.makeHero(type, slot, stats);
      hero.attackCd = 0;
      this.heroes.push(hero);
      this.burst(hero.x, hero.y - 42, HERO_META[type].color, 18);
    }
    tutorial.summoned = true;
    tutorial.summonAvailable = false;
    this.paused = false;
    this.refreshUpgradeDerivedStats(false);
    this.message = '三名初始御灵已入场 · 自动镇守城墙';
    this.messageTime = 2.6;
    this.audio.playSfx('summonReveal') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.openFirstChargeOffer = function () {
    var status = this.progression && this.progression.firstChargeStatus && this.progression.firstChargeStatus();
    if (!status || !status.unlocked) {
      this.firstChargeModal = false;
      this.homeNotice = '完成 1-3 后解锁首充礼包';
      this.homeNoticeUntil = this.time + 1.8;
      return false;
    }
    this.firstChargePreviewDay = status && status.purchased
      ? Math.min(2, status.claimDay >= 0 ? status.claimDay : status.nextDay)
      : 0;
    this.firstChargeModal = true;
    if (this.progression && !this.progression.profile.firstChargeGuideViewed) {
      this.progression.markFirstChargeGuideViewed();
      this.progression.markTaskGuide('first-charge', 1);
      if (this.progression.profile.guideStep === 'first-charge') {
        this.progression.setGuideStep('chapter-2-preview');
        this.selectedStageIndex = 3;
      }
    }
    return true;
  };

  Game.prototype.openSectHome = function () {
    this.state = 'title';
    this.homePage = 'sect';
    this.sectScroll = YL.HomeUI && YL.HomeUI.sectScrollDefault
      ? YL.HomeUI.sectScrollDefault()
      : 1102;
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.dragSoul = null;
    this.dragDeploy = null;
    this.spellPress = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
  };

  Game.prototype.openTaskGuideTask = function (taskId) {
    if (taskId === 'stage-1-1' || taskId === 'stage-1-2' || taskId === 'stage-1-3') {
      this.selectedStageIndex = taskId === 'stage-1-1' ? 0 : taskId === 'stage-1-2' ? 1 : 2;
      this.openStageHome();
      this.taskGuideChallengeActive = taskId === 'stage-1-2' || taskId === 'stage-1-3' ? taskId : null;
      return;
    }
    if (taskId === 'recruit') {
      this.openRecruitHome();
      return;
    }
    if (taskId === 'grow' || taskId === 'star') {
      this.openHeroesHome();
      return;
    }
    if (taskId === 'first-charge') {
      this.openStageHome();
      this.openFirstChargeOffer();
    }
  };

  Game.prototype.claimTaskGuideReward = function () {
    var result = this.progression && this.progression.claimTaskGuide();
    this.homeNotice = result && result.ok
      ? '任务完成 · ' + result.reward.name + ' ×' + result.granted
      : result && result.reason || '任务领取失败';
    this.homeNoticeUntil = this.time + 2.2;
    return result;
  };

  // 请灵台当前只交付静态版式与同一入口路由；请灵扣符、保底存档、记录和结果页在后续状态机接入。
  Game.prototype.openRecruitHome = function (returnPage) {
    this.state = 'title';
    this.homePage = 'recruit';
    this.recruitReturnPage = returnPage === 'heroes' ? 'heroes' : returnPage === 'main' ? 'main' : 'sect';
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.dragSoul = null;
    this.dragDeploy = null;
    this.spellPress = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
    this.recruitReveal = null;
  };

  // 百灵居是主界面导航的一页；请灵台仍是从宗门或本页按钮进入的独立功能页。
  Game.prototype.openHeroesHome = function () {
    this.state = 'title';
    this.homePage = 'heroes';
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.heroGrowthTab = null;
    this.heroSkillTipIndex = null;
    this.heroSkillDetailTab = null;
    this.coreReplaceCandidateId = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
  };

  Game.prototype.openHeroDetail = function (type, tab) {
    if (!this.progression || !this.progression.isOwned(type)) {
      this.openHeroesHome();
      return;
    }
    this.state = 'title';
    this.homePage = 'heroDetail';
    this.selectedHeroId = type;
    this.heroGrowthTab = tab === 'star' ? 'star' : 'level';
    this.heroSkillTipIndex = null;
    this.heroSkillDetailTab = null;
    this.sectDrag = null;
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.homeNotice = '';
    this.homeNoticeUntil = 0;
  };

  Game.prototype.stageList = function () {
    return YL.STAGE_CONFIG && YL.STAGE_CONFIG.length
      ? YL.STAGE_CONFIG
      : [{ id: '1-1', volume: '第一卷·幽野村', name: '纸人夜叩门', recommendedPower: 1000, waves: YL.WAVE_CONFIG || [] }];
  };

  Game.prototype.stageCount = function () {
    return this.stageList().length;
  };

  Game.prototype.getSelectedStage = function () {
    var stages = this.stageList();
    this.selectedStageIndex = clamp(this.selectedStageIndex || 0, 0, stages.length - 1);
    return stages[this.selectedStageIndex];
  };

  Game.prototype.selectStage = function (delta) {
    var previous = this.selectedStageIndex || 0;
    var next = clamp(previous + delta, 0, this.stageCount() - 1);
    var step = this.progression && this.progression.profile.guideStep || 'stage-1-1';
    var maxIndex = (step === 'chapter-2-preview' || step === 'guide-complete') ? 3 : (step === 'stage-1-2' ? 1 : (step === 'stage-1-3' || step === 'first-charge' ? 2 : 0));
    if (next > maxIndex) {
      this.homeNotice = '完成当前引导后解锁';
      this.homeNoticeUntil = this.time + 1.6;
      this.audio.tone('hurt');
      return;
    }
    this.selectedStageIndex = next;
    if (previous === this.selectedStageIndex) {
      this.audio.tone('hurt');
      return;
    }
    this.audio.tone('shoot');
  };

  Game.prototype.battleSpeedPreference = function () {
    var profile = this.progression && this.progression.profile;
    return clamp(profile && profile.battleSpeed || 1, 1, 2) | 0;
  };

  Game.prototype.setBattleSpeed = function (value) {
    var next = clamp(Number(value) || 1, 1, 2) | 0;
    this.speed = next;
    if (this.progression && this.progression.profile) {
      this.progression.profile.battleSpeed = next;
      this.progression.save();
    }
    return next;
  };

  Game.prototype.cycleBattleSpeed = function () {
    return this.setBattleSpeed(this.speed >= 2 ? 1 : 2);
  };

  Game.prototype.speedUnlocked = function () {
    var step = this.progression && this.progression.profile && this.progression.profile.guideStep || 'stage-1-1';
    return step !== 'stage-1-1' && step !== 'recruit' && step !== 'grow';
  };

  Game.prototype.formationCardTypes = function () {
    var roster = this.configuredRoster(), seen = {}, result = [];
    for (var i = 0; i < FORMATION_CARD_TYPES.length; i++) {
      if (HERO_META[FORMATION_CARD_TYPES[i]]) { result.push(FORMATION_CARD_TYPES[i]); seen[FORMATION_CARD_TYPES[i]] = true; }
    }
    for (var r = 0; r < roster.length; r++) {
      if (HERO_META[roster[r]] && !seen[roster[r]]) { result.push(roster[r]); seen[roster[r]] = true; }
    }
    return result.slice(0, SOUL_SLOTS.length);
  };

  Game.prototype.formationUnlockedHeroTypes = function () {
    var heroTune = battleTuning().hero || {};
    var source = heroTune.unlocked && heroTune.unlocked.length ? heroTune.unlocked : WALL_UNLOCKED_HERO_TYPES;
    var seen = {}, result = [];
    for (var i = 0; i < source.length; i++) {
      var type = source[i];
      if (HERO_META[type] && !seen[type]) {
        seen[type] = true;
        result.push(type);
      }
    }
    return result;
  };

  Game.prototype.isFormationHeroUnlocked = function (type) {
    if (this.progression && !this.progression.isOwned(type)) return false;
    // 默认阵容服务于御灵页的五人编组，不受战斗白名单限制；战斗模式仍沿用原规则。
    if (this.formationMode === 'default') return true;
    if (!WALL_MODE) return true;
    return this.formationUnlockedHeroTypes().indexOf(type) >= 0;
  };

  Game.prototype.formationMaxSlots = function () {
    if (this.formationMode === 'default') {
      var ownedCount = 0;
      for (var i = 0; i < FORMATION_CARD_TYPES.length; i++) {
        if (this.progression && this.progression.isOwned(FORMATION_CARD_TYPES[i])) ownedCount++;
      }
      return Math.min(SOUL_SLOTS.length, Math.max(1, ownedCount));
    }
    if (!WALL_MODE) return SOUL_SLOTS.length;
    return Math.min(SOUL_SLOTS.length, Math.max(1, this.formationUnlockedHeroTypes().length));
  };

  Game.prototype.formationCardRect = function (index) {
    var count = this.formationCardTypes().length;
    var w = count > 5 ? 112 : (count > 4 ? 128 : 150), gap = count > 5 ? 6 : (count > 4 ? 10 : 18);
    var total = count * w + (count - 1) * gap;
    return { x: (W - total) / 2 + index * (w + gap), y: 874, w: w, h: 230 };
  };

  Game.prototype.formationCellRect = function (index) {
    var col = index % FORMATION_GRID.cols, row = (index / FORMATION_GRID.cols) | 0;
    var cw = FORMATION_GRID.w / FORMATION_GRID.cols, ch = FORMATION_GRID.h / FORMATION_GRID.rows;
    return { x: FORMATION_GRID.x + col * cw, y: FORMATION_GRID.y + row * ch, w: cw, h: ch };
  };

  Game.prototype.formationCellCenter = function (index) {
    var rect = this.formationCellRect(index);
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h * .74 };
  };

  // 女魃原始立绘的透明留白比其他御灵更宽；返回布阵页相对原始 sprite 的等效显示缩放倍数。
  Game.prototype.formationPortraitScale = function (type, deployed) {
    var crop = FORMATION_HERO_SOURCE_CROPS[type];
    if (crop) return deployed ? 1.82 : 1.42;
    return deployed ? 1 : .78;
  };

  Game.prototype.formationGridIndexAt = function (x, y) {
    if (!inRect(x, y, FORMATION_GRID)) return -1;
    var cw = FORMATION_GRID.w / FORMATION_GRID.cols, ch = FORMATION_GRID.h / FORMATION_GRID.rows;
    var col = clamp(Math.floor((x - FORMATION_GRID.x) / cw), 0, FORMATION_GRID.cols - 1);
    var row = clamp(Math.floor((y - FORMATION_GRID.y) / ch), 0, FORMATION_GRID.rows - 1);
    return row * FORMATION_GRID.cols + col;
  };

  Game.prototype.formationSlotForType = function (type) {
    for (var i = 0; i < this.formationSlots.length; i++) if (this.formationSlots[i].type === type) return this.formationSlots[i];
    return null;
  };

  Game.prototype.formationSlotForGrid = function (gridIndex) {
    for (var i = 0; i < this.formationSlots.length; i++) if (this.formationSlots[i].gridIndex === gridIndex) return this.formationSlots[i];
    return null;
  };

  Game.prototype.formationDefaultGrid = function (type, slot) {
    if (WALL_MODE) {
      for (var d = 0; d < WALL_DEFAULT_FORMATION_GRIDS.length; d++) {
        var grid = WALL_DEFAULT_FORMATION_GRIDS[d];
        if (grid >= 0 && grid < FORMATION_GRID.cols && !this.formationSlotForGrid(grid)) return grid;
      }
    }
    var preferred = WALL_HERO_ORDER.indexOf(type);
    if (preferred < 0) preferred = clamp(slot || 0, 0, FORMATION_GRID.cols - 1);
    if (!this.formationSlotForGrid(preferred)) return preferred;
    for (var i = 0; i < FORMATION_GRID.cols; i++) if (!this.formationSlotForGrid(i)) return i;
    return -1;
  };

  Game.prototype.setFormationNotice = function (text, time) {
    this.formationNotice = text;
    this.formationNoticeTime = time || 1.8;
  };

  Game.prototype.toggleFormationHero = function (type) {
    var existing = this.formationSlotForType(type), meta = HERO_META[type];
    if (!meta) return;
    if (existing) {
      removeFrom(this.formationSlots, existing);
      if (this.formationSelected === type) {
        this.formationSelected = null;
        this.formationMoveFrom = null;
      }
      this.setFormationNotice(meta.name + ' 已下阵');
      this.audio.tone('shoot');
      return;
    }
    if (!this.isFormationHeroUnlocked(type)) {
      this.setFormationNotice('未获得', 1.5);
      this.audio.tone('hurt');
      return;
    }
    var maxSlots = this.formationMaxSlots();
    if (this.formationSlots.length >= maxSlots) {
      this.setFormationNotice('最多上阵 ' + maxSlots + ' 名御灵', 1.5);
      this.audio.tone('hurt');
      return;
    }
    if (this.formationSlots.length >= SOUL_SLOTS.length) {
      this.setFormationNotice('最多上阵 5 名御灵');
      this.audio.tone('hurt');
      return;
    }
    var gridIndex = this.formationDefaultGrid(type, this.formationSlots.length);
    if (gridIndex < 0) return;
    this.formationSlots.push({ type: type, gridIndex: gridIndex });
    this.formationSelected = type;
    this.formationMoveFrom = null;
    this.setFormationNotice(meta.name + ' 上阵：第 ' + (gridIndex + 1) + ' 位');
    this.audio.tone('bell');
  };

  Game.prototype.onFormationDown = function (x, y) {
    if (inRect(x, y, FORMATION_BACK)) {
      this.audio.tone('bell');
      if (this.formationMode === 'default') this.openHeroesHome();
      else this.openStageHome();
      return;
    }
    var cardTypes = this.formationCardTypes();
    for (var i = 0; i < cardTypes.length; i++) {
      if (inRect(x, y, this.formationCardRect(i))) {
        this.toggleFormationHero(cardTypes[i]);
        return;
      }
    }
    var gridIndex = this.formationGridIndexAt(x, y);
    if (gridIndex >= 0) {
      var occupant = this.formationSlotForGrid(gridIndex);
      if (this.formationMoveFrom == null) {
        if (!occupant) {
          this.setFormationNotice('请先点击要调整的御灵', 1.4);
          this.audio.tone('hurt');
          return;
        }
        this.formationSelected = occupant.type;
        this.formationMoveFrom = gridIndex;
        this.setFormationNotice(HERO_META[occupant.type].name + ' 已选中，点击目标阵位换位', 2);
        this.audio.tone('shoot');
        return;
      }

      var moving = this.formationSlotForGrid(this.formationMoveFrom);
      if (!moving) {
        this.formationSelected = null;
        this.formationMoveFrom = null;
        return;
      }
      if (moving.gridIndex === gridIndex) {
        this.formationSelected = null;
        this.formationMoveFrom = null;
        this.setFormationNotice('已取消换位', 1.2);
        this.audio.tone('shoot');
        return;
      }

      var movingFrom = moving.gridIndex;
      moving.gridIndex = gridIndex;
      if (occupant) occupant.gridIndex = movingFrom;
      this.formationSelected = moving.type;
      this.formationMoveFrom = null;
      this.setFormationNotice(
        occupant
          ? HERO_META[moving.type].name + ' 与 ' + HERO_META[occupant.type].name + ' 已换位'
          : HERO_META[moving.type].name + ' 移至第 ' + (gridIndex + 1) + ' 位',
        1.8
      );
      this.audio.tone('bell');
      return;
    }
    if (inRect(x, y, FORMATION_START)) {
      if (this.formationMode === 'default') {
        this.saveDefaultFormation();
        return;
      }
      if (!this.formationSlots.length) {
        this.setFormationNotice('至少选择 1 名御灵才能开阵', 2);
        this.audio.tone('hurt');
        return;
      }
      this.audio.tone('bell');
      this.beginBattle(this.formationSlots);
    }
  };

  Game.prototype.baseConfiguredHeroStats = function (type) {
    var base = DEFAULT_HERO_STATS[type] || {}, tune = battleTuning().hero || {};
    var custom = tune.stats && tune.stats[type] || {};
    var stats = {}, k;
    for (k in base) stats[k] = base[k];
    for (k in custom) stats[k] = custom[k];
    // 城墙版御灵不承受敌方伤害，固定保留一项可读的输出属性：
    // 所有御灵默认 5% 暴击率，暴击伤害为 150%。后续可由单角色配置覆写。
    stats.critRate = stats.critRate == null ? .05 : clamp(Number(stats.critRate) || 0, 0, .95);
    stats.critMultiplier = stats.critMultiplier == null ? 1.5 : Math.max(1, Number(stats.critMultiplier) || 1.5);
    return stats;
  };

  Game.prototype.applyPermanentGrowth = function (type, stats) {
    if (!this.progression) return stats;
    var state = this.progression.getHero(type);
    if (!state) return stats;
    var multiplier = this.progression.statMultiplier(type);
    // 只放大持久的生命和伤害；攻速、暴击与技能 CD 保持角色基础节奏。
    if (stats.hp != null) stats.hp = Math.max(1, Math.round(stats.hp * multiplier));
    if (stats.damage != null) stats.damage = Math.max(1, Math.round(stats.damage * multiplier));
    stats.star = state.star;
    stats.starLevel = state.star;
    stats.growthLevel = this.progression.effectiveLevel(type);
    return stats;
  };

  Game.prototype.configuredHeroStats = function (type) {
    return this.applyPermanentGrowth(type, this.baseConfiguredHeroStats(type));
  };

  Game.prototype.heroGrowthView = function (type) {
    var progression = this.progression;
    var def = progression && progression.getHeroDef(type);
    var state = progression && progression.getHero(type);
    if (!def || !state) return null;
    var stats = this.configuredHeroStats(type);
    var seedUsage = progression.spiritSeedUsage(type);
    var starCost = progression.starRequirementForHero(type);
    return {
      def: def,
      state: state,
      isCore: progression.isCore(type),
      level: progression.effectiveLevel(type),
      resonanceLevel: progression.resonanceLevel(),
      stats: stats,
      skillLevels: progression.skillLevels(type),
      starSkillNodes: progression.starSkillNodes(state.star),
      starStage: progression.starStage(state.star),
      spiritSeedFaction: seedUsage.seedId,
      spiritSeedFactionName: seedUsage.seedName,
      spiritSeedBalance: seedUsage.usableBalance,
      spiritSeedSpecificBalance: seedUsage.specificBalance,
      spiritSeedUniversalBalance: seedUsage.universalBalance,
      spiritSeedUsableBalance: seedUsage.usableBalance,
      nextStarMultiplier: state.star < YL.GROWTH_MAX_STAR ? progression.statMultiplierAtStar(type, state.star + 1) : progression.statMultiplier(type),
      nextLevelCost: progression.levelCost(state.level),
      nextStarCost: starCost,
      maxLevel: YL.GROWTH_MAX_LEVEL,
      maxStar: YL.GROWTH_MAX_STAR
    };
  };

  Game.prototype.tryHeroLevelUpgrade = function (type) {
    var result = this.progression && this.progression.tryUpgradeLevel(type);
    if (result && result.ok) this.progression.markTaskGuide('grow', 1);
    if (result && result.ok && this.progression.profile.guideStep === 'grow') {
      this.progression.setGuideStep('stage-1-2');
      this.selectedStageIndex = 1;
    }
    this.homeNotice = result && result.ok ? '灵蕴升级成功' : result && result.reason || '升级失败';
    this.homeNoticeUntil = this.time + 1.8;
    return result;
  };

  Game.prototype.tryHeroStarUpgrade = function (type) {
    var result = this.progression && this.progression.tryUpgradeStar(type);
    if (result && result.ok) this.progression.markTaskGuide('star', 1);
    if (result && result.ok && this.progression.profile.guideStep === 'star') {
      this.progression.setGuideStep('stage-1-3');
      this.selectedStageIndex = 2;
    }
    this.homeNotice = result && result.ok ? '显灵升星成功' : result && result.reason || '升星失败';
    this.homeNoticeUntil = this.time + 1.8;
    return result;
  };

  // 招募演出状态只服务于当前一次结果，不写入存档；拥有、灵契和保底仍由 Progression 先完成结算。
  Game.prototype.isNewPurpleRecruitReward = function (reward) {
    if (!reward || reward.kind === 'spiritSeed') return false;
    var def = reward && YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.id];
    return !!(reward && reward.newlyOwned && def && Number(def.qualityTier) >= 2);
  };

  Game.prototype.initializeRecruitReveal = function (result, count) {
    var i, single = count === 1;
    result.revealed = [];
    result.revealAt = [];
    result.detailQueue = [];
    result.detailCursor = 0;
    result.activeDetail = -1;
    result.detailReadyAt = 0;
    for (i = 0; i < result.rewards.length; i++) {
      result.revealed.push(single);
      result.revealAt.push(single ? this.time : null);
      if (single && this.isNewPurpleRecruitReward(result.rewards[i])) result.detailQueue.push(i);
    }
    if (result.detailQueue.length) result.detailReadyAt = this.time + .42;
    return result;
  };

  Game.prototype.queueRecruitDetail = function (index, delay) {
    var reveal = this.recruitReveal;
    if (!reveal || !reveal.rewards || !this.isNewPurpleRecruitReward(reveal.rewards[index])) return false;
    if (!Array.isArray(reveal.detailQueue)) reveal.detailQueue = [];
    if (reveal.detailQueue.indexOf(index) >= 0) return false;
    reveal.detailQueue.push(index);
    if (reveal.activeDetail == null || reveal.activeDetail < 0) {
      reveal.detailReadyAt = Math.max(reveal.detailReadyAt || 0, this.time + (delay == null ? .36 : delay));
    }
    return true;
  };

  Game.prototype.revealRecruitCard = function (index) {
    var reveal = this.recruitReveal;
    if (!reveal || reveal.activeDetail >= 0 || !reveal.rewards || index < 0 || index >= reveal.rewards.length || reveal.revealed[index]) return false;
    reveal.revealed[index] = true;
    reveal.revealAt[index] = this.time;
    this.queueRecruitDetail(index, .38);
    return true;
  };

  Game.prototype.revealAllRecruitCards = function () {
    var reveal = this.recruitReveal;
    if (!reveal || reveal.activeDetail >= 0 || !reveal.rewards) return false;
    var changed = false, i;
    for (i = 0; i < reveal.rewards.length; i++) {
      if (!reveal.revealed[i]) {
        reveal.revealed[i] = true;
        // 仅做 0~75ms 的视觉错峰，输入与结果在同一次点击中同时完成。
        reveal.revealAt[i] = this.time + (i % 4) * .025;
        changed = true;
      }
      this.queueRecruitDetail(i, .56);
    }
    if (changed && reveal.detailQueue.length && reveal.activeDetail < 0) reveal.detailReadyAt = this.time + .56;
    return changed;
  };

  // 首次获得的稀有御灵会自动展示；已拥有的上品/绝品则在结算完成后允许点正面卡复看详情。
  Game.prototype.previewRecruitDetail = function (index) {
    var reveal = this.recruitReveal;
    if (!reveal || reveal.activeDetail >= 0 || !reveal.rewards || !reveal.revealed[index]) return false;
    var reward = reveal.rewards[index];
    if (!reward || reward.kind === 'spiritSeed') return false;
    var def = YL.GROWTH_HERO_DEFS && YL.GROWTH_HERO_DEFS[reward.id];
    if (!def || Number(def.qualityTier) < 2) return false;
    for (var i = 0; i < reveal.revealed.length; i++) if (!reveal.revealed[i]) return false;
    if ((reveal.detailCursor || 0) < (reveal.detailQueue || []).length) return false;
    reveal.previewDetail = true;
    reveal.activeDetail = index;
    return true;
  };

  Game.prototype.updateRecruitReveal = function () {
    var reveal = this.recruitReveal;
    if (!reveal || reveal.activeDetail >= 0 || !reveal.detailQueue || reveal.detailCursor >= reveal.detailQueue.length) return;
    if (this.time >= (reveal.detailReadyAt || 0)) reveal.activeDetail = reveal.detailQueue[reveal.detailCursor];
  };

  Game.prototype.advanceRecruitDetail = function () {
    var reveal = this.recruitReveal;
    if (!reveal || reveal.activeDetail < 0) return false;
    if (reveal.previewDetail) {
      reveal.previewDetail = false;
      reveal.activeDetail = -1;
      return true;
    }
    reveal.activeDetail = -1;
    reveal.detailCursor++;
    if (reveal.detailCursor < reveal.detailQueue.length) reveal.detailReadyAt = this.time + .14;
    return true;
  };

  Game.prototype.tryRecruit = function (count) {
    var result = this.progression && this.progression.tryRecruit(count);
    if (!result || !result.ok) {
      this.homeNotice = result && result.reason || '请灵失败';
      this.homeNoticeUntil = this.time + 1.8;
      return result;
    }
    this.recruitReveal = this.initializeRecruitReveal(result, count === 10 ? 10 : 1);
    if (this.progression.profile.guideStep === 'recruit') this.progression.setGuideStep('grow');
    this.homeNotice = result.spiritSeedGain ? '请灵完成：角色与灵种奖励已结算' : '请灵完成：角色与灵契已结算';
    this.homeNoticeUntil = this.time + 2;
    return result;
  };

  Game.prototype.purchaseFirstChargeMock = function () {
    var result = this.progression && this.progression.purchaseFirstChargeMock();
    // Demo 点击仅模拟支付成功后的领取；真实微信支付接入后从支付回调进入同一条链路。
    if (result && result.ok) {
      this.firstChargeModal = false;
      this.openStageHome();
    }
    this.homeNotice = result && result.ok ? '首日奖励已领取：' + result.reward.label : result && result.reason || '领取失败';
    this.homeNoticeUntil = this.time + 2;
    return result;
  };

  Game.prototype.claimFirstChargeDay = function () {
    var result = this.progression && this.progression.claimFirstChargeDay();
    if (result && result.ok) this.firstChargeModal = false;
    this.homeNotice = result && result.ok ? '第 ' + (result.dayIndex + 1) + ' 日奖励已领取：' + result.reward.label : result && result.reason || '领取失败';
    this.homeNoticeUntil = this.time + 2;
    return result;
  };

  // 保留旧 QA/调用点的兼容别名。
  Game.prototype.claimFirstChargeMock = function () {
    return this.purchaseFirstChargeMock();
  };

  Game.prototype.claimBattleResultRewards = function () {
    var result = this.battleResult;
    if (!result || result.rewardsClaimed || !this.progression) return '';
    var doubled = result.adMultiplierState === 'claimed';
    var summary = [], i;
    for (i = 0; i < result.rewards.length; i++) {
      var reward = result.rewards[i];
      var amount = reward.amount * (doubled && reward.doubleEligible ? 2 : 1);
      this.progression.grant(reward.id, amount, reward.faction);
      summary.push((reward.name || reward.id) + ' +' + amount);
    }
    result.rewardsClaimed = true;
    if (result.win && this.progression) {
      this.progression.markStageCompleted(result.stageId);
      this.progression.markTaskGuide('stage-' + result.stageId, 1);
      if (result.stageId === '1-1') this.progression.setGuideStep('summon-event-open');
      else if (result.stageId === '1-2') {
        this.selectedStageIndex = 2;
        this.progression.setGuideStep('stage-1-3');
      }
      else if (result.stageId === '1-3') {
        this.progression.profile.firstNubaRescueComplete = true;
        this.selectedStageIndex = 3;
        this.progression.setGuideStep('first-charge');
      }
    }
    return summary.length ? '已获得 ' + summary.join('  ') : '';
  };

  Game.prototype.configuredRoster = function () {
    var tune = battleTuning().hero || {};
    var roster = tune.roster && tune.roster.length ? tune.roster.slice() : ['huangjin'];
    var result = [], type;
    for (var i = 0; i < roster.length && result.length < SOUL_SLOTS.length; i++) {
      if (HERO_META[roster[i]] && (!this.progression || this.progression.isOwned(roster[i]))) result.push(roster[i]);
    }
    // 请灵/首充获得的御灵不需要“上阵”：自动进入城墙守备名单。
    for (i = 0; i < WALL_HERO_ORDER.length && result.length < SOUL_SLOTS.length; i++) {
      type = WALL_HERO_ORDER[i];
      if (HERO_META[type] && result.indexOf(type) < 0 && (!this.progression || this.progression.isOwned(type))) result.push(type);
    }
    return result.length ? result : ['huangjin'];
  };

  Game.prototype.isSpiritLineMode = function () {
    var stage = this.getSelectedStage && this.getSelectedStage();
    return !!(WALL_MODE && stage && stage.battleMode === 'spirit-line-v2');
  };

  Game.prototype.spiritLineXpTuning = function () {
    var stage = this.getSelectedStage && this.getSelectedStage();
    var config = stage && stage.xpProgression || {};
    var firstNeed = Math.max(1, valueOr(config.firstNeed, 64));
    return {
      firstNeed: firstNeed,
      growth: Math.max(1.05, valueOr(config.growth, 1.52)),
      maxNeed: Math.max(firstNeed, valueOr(config.maxNeed, 720))
    };
  };

  Game.prototype.isStaticWallMode = function () {
    return !!(WALL_MODE && !this.isSpiritLineMode());
  };

  Game.prototype.spiritLineHome = function (hero) {
    return hero && hero.lineHome ? hero.lineHome : this.heroSoulAnchor(hero);
  };

  Game.prototype.spiritLineSectorForX = function (x) {
    return clamp(Math.floor((x / Math.max(1, W)) * SPIRIT_LINE_HOME_SLOTS.length), 0, SPIRIT_LINE_HOME_SLOTS.length - 1) | 0;
  };

  Game.prototype.isSpiritLineHeroUnlocked = function (type) {
    var hero = this.heroByType(type);
    return !!(hero && hero.lineUnlocked);
  };

  Game.prototype.configuredHeroGridIndex = function (stats, slot) {
    if (stats && stats.gridIndex != null) return clamp(Math.floor(stats.gridIndex), 0, ANCHORS.length - 1);
    if (stats && (stats.row != null || stats.col != null)) {
      var row = clamp(Math.floor(stats.row == null ? 2 : stats.row), 0, GRID_ROWS.length - 1);
      var col = clamp(Math.floor(stats.col == null ? slot : stats.col), 0, GRID_COLS.length - 1);
      return row * GRID_COLS.length + col;
    }
    return clamp(10 + slot, 0, ANCHORS.length - 1);
  };

  Game.prototype.makeHero = function (type, slot, stats) {
    var gridIndex = this.configuredHeroGridIndex(stats, slot);
    var anchor = ANCHORS[gridIndex], meta = HERO_META[type];
    var attack = YL.HERO_ATTACK_CONFIG && YL.HERO_ATTACK_CONFIG[type] || {};
    var skill = heroSkillConfig(type);
    var attackType = stats.attackType || attack.type || 'melee';
    var windup = clamp(stats.attackWindup || attack.windup || (attackType === 'ranged' ? .24 : .22), .2, .3);
    var hero = {
      id: this.idSeed++, type: type, name: meta.name, role: meta.role,
      faction: meta.faction, job: meta.job,
      starLevel: Math.max(1, stats.starLevel || stats.star || stats.stars || 1),
      soulSlot: slot, soulAnchorIndex: gridIndex, anchorIndex: gridIndex, x: anchor.x, y: anchor.y,
      hp: stats.hp, maxHp: stats.hp, shield: 0, defense: stats.defense || 0,
      defenseStat: stats.defenseStat || 0, defenseStacks: 0, survivalTime: 0,
      baseHp: stats.hp, baseDamage: stats.damage, baseDefenseStat: stats.defenseStat || 0,
      baseBlock: stats.block, baseAttackInterval: stats.attackInterval || attack.interval || 1,
      baseUltimateMax: stats.ultimate, baseProjectileSpeed: stats.projectile == null ? (attack.projectileSpeed || 0) : stats.projectile,
      block: stats.block, search: stats.search, attackRange: stats.range == null ? attack.range : stats.range,
      moveSpeed: stats.move, damage: stats.damage,
      critRate: stats.critRate == null ? .05 : stats.critRate,
      critMultiplier: stats.critMultiplier == null ? 1.5 : stats.critMultiplier,
      attackInterval: stats.attackInterval || attack.interval || 1,
      attackMultiplier: stats.attackMultiplier == null ? (attack.multiplier == null ? 1 : attack.multiplier) : stats.attackMultiplier,
      attackType: attackType, attackFacing: 1,
      attackWindupDuration: windup,
      projectileSpeed: stats.projectile == null ? (attack.projectileSpeed || 0) : stats.projectile, alive: true, respawn: 0,
      soulReturn: null,
      respawnMax: 8, invuln: 1.2, target: null, attackCd: Math.random() * .4,
      attackWindup: 0, pendingTarget: null,
      ultimateCd: stats.ultimate, ultimatePrevCd: stats.ultimate, ultimateMax: stats.ultimate,
      ultimateUnlocked: false,
      healCd: type === 'qingyi' || type === 'suwen' ? valueOr(skill.passive && skill.passive.cooldown, type === 'suwen' ? 6 : 3) : 2.5, attackCount: 0, flash: 0, hitReact: 0, attackAnim: 0, attackDuration: .38, hitHold: 0, shieldFlash: 0,
      attackRecoveryDuration: stats.attackRecovery || (attackType === 'ranged' ? .36 : .3),
      skillReadyFlash: 0, skillCastFlash: 0,
      wallBarrierTime: 0, wallBarrierShield: 0, wallBarrierReduction: .25,
      holyShieldTime: 0, holyShield: 0,
      hongyiSigils: 0, hongyiBurnSigilTicks: 0, hongyiLotusFlash: 0,
      hongyiBurnSigilCooldown: 0,
      nubaCastTime: 0, nubaCastDuration: 0, nubaSigil: null, nubaResonanceFlash: 0,
      spiritLineV2: false,
      spiritLineVolley: 0, spiritLineLanceFlash: 0,
      spiritLineShieldTime: 0, spiritLineShieldBurstReady: false,
      spiritLineXuanyaEmpoweredTime: 0, spiritLineXuanyaEmpoweredFlash: 0,
      xuanyaSoulStacks: 0, xuanyaEmpoweredBlade: 0, xuanyaSoulLastGainTime: -999,
      suwenFocusTarget: null, suwenFocusCount: 0, suwenFocusReady: 0,
      suwenFocusRetain: 0, suwenStoredFocusCount: 0, suwenStoredFocusTarget: null,
      suwenFocusLockTarget: null, suwenFocusLockTime: 0,
      suwenLastNeedleTarget: null, suwenCarryStars: 0,
      scale: stats.scale || .72, blocked: [], damageDone: 0, healingDone: 0,
      blockedTotal: 0, deaths: 0, upgrades: { attack: 0, passive: 0, ultimate: 0 }
    };
    if (this.isSpiritLineMode()) {
      var lineSlot = clamp(slot || 0, 0, SPIRIT_LINE_HOME_SLOTS.length - 1) | 0;
      var lineHome = SPIRIT_LINE_HOME_SLOTS[lineSlot];
      var lineStarter = SPIRIT_LINE_STARTER_TYPES.indexOf(type) >= 0;
      var spiritLineV2 = SPIRIT_LINE_V2_HERO_CONFIG[type] || null;
      hero.lineSlot = lineSlot;
      hero.lineHome = { x: lineHome.x, y: lineHome.y };
      hero.lineUnlocked = lineStarter;
      hero.lineLocked = !lineStarter;
      hero.x = lineHome.x;
      hero.y = lineHome.y;
      hero.scale = (spiritLineV2 && spiritLineV2.scale) || (WALL_HERO_STYLE[type] || { scale: hero.scale }).scale;
      // 新版三英雄只在本原型内覆盖：黄巾顶线、玄鸦近战收割、红衣后方输出。
      hero.spiritLineV2 = !!spiritLineV2;
      if (spiritLineV2) {
        hero.attackType = spiritLineV2.attackType;
        hero.attackRange = spiritLineV2.attackRange;
        hero.search = spiritLineV2.search;
        hero.attackMultiplier = spiritLineV2.multiplier;
        hero.baseAttackInterval = hero.attackInterval = 1 / spiritLineV2.attackSpeed;
        hero.attackWindupDuration = spiritLineV2.windup;
        hero.baseUltimateMax = hero.ultimateMax = hero.ultimateCd = hero.ultimatePrevCd = spiritLineV2.ultimate;
        hero.block = hero.baseBlock = spiritLineV2.block;
      } else {
        hero.block = hero.baseBlock = type === 'huangjin' ? 2 : 1;
        hero.search = Math.max(100, stats.search || hero.attackRange || 240);
        hero.attackRange = Math.max(90, stats.range == null ? hero.attackRange : stats.range);
      }
      hero.moveSpeed = Math.max(52, stats.move || hero.moveSpeed || 58);
      hero.respawnMax = 15;
      hero.alive = lineStarter;
      hero.hp = lineStarter ? hero.maxHp : 0;
      hero.respawn = 0;
      hero.invuln = lineStarter ? 1.2 : 0;
    } else if (WALL_MODE) {
      var wallPlacement = wallHeroPlacement(type, slot);
      hero.anchorIndex = 10 + clamp(slot, 0, 4);
      hero.soulAnchorIndex = hero.anchorIndex;
      hero.x = wallPlacement.x;
      hero.y = wallPlacement.y;
      hero.scale = wallPlacement.scale;
      hero.hp = hero.maxHp = 1;
      hero.block = hero.baseBlock = 0;
      hero.search = WALL_HERO_ATTACK_RANGE[type] || hero.attackRange || 240;
      hero.attackRange = hero.search;
      hero.moveSpeed = 0;
      hero.attackType = 'ranged';
      hero.projectileSpeed = Math.max(460, hero.projectileSpeed || 0);
      hero.ultimateMax = valueOr(skill.ultimate && skill.ultimate.cooldown, stats.ultimate || 14);
      hero.ultimateCd = hero.ultimateMax;
      hero.healCd = 9999;
      hero.invuln = 9999;
    }
    return hero;
  };

  Game.prototype.beginBattle = function (formationSlots) {
    this.state = 'battle'; this.phase = 'wave'; this.paused = false; this.infoOverlay = null; this.inspectedHeroId = null;
    this.battleResult = null;
    this.resultNotice = '';
    this.resultNoticeUntil = 0;
    var selectedStage = this.getSelectedStage();
    this.firstStageTutorial = this.isFirstStageTutorialBattle(formationSlots)
      ? { active: true, summoned: false, summonAvailable: false, skillUnlocked: false, skillCast: false,
        attackGuideActive: false, attackGuideClicks: 0, attackGuideDone: false }
      : null;
    this.stageWaveConfig = selectedStage.waves && selectedStage.waves.length ? selectedStage.waves : (YL.WAVE_CONFIG || []);
    // 仅本机 QA：仍调用同一套 beginBattle / updateBattle / endBattle，
    // 只是把关卡波次截为首波，避免为了验证结算页重复跑十波。
    if (this.qaMode === 'one-wave') this.stageWaveConfig = this.stageWaveConfig.slice(0, 1);
    this.wave = 1; this.waveMax = this.stageWaveConfig.length || 20; this.speed = this.battleSpeedPreference(); this.gameTime = 0;
    this.baseMax = 1000; this.baseHp = this.baseMax; this.score = 0; this.coins = 0;
    this.wallShield = 0; this.wallShieldFlash = 0;
    this.kills = 0; this.totalDamage = 0; this.totalHealing = 0; this.idSeed = 1;
    this.level = 1; this.xp = 0;
    this.spiritLineXp = this.spiritLineXpTuning();
    this.xpNeed = this.isSpiritLineMode() ? this.spiritLineXp.firstNeed : 1;
    this.pendingLevels = 0; this.upgradeCount = 0;
    this.rogueLevels = {}; this.upgradeAcquireOrder = []; this.waveReviveUsed = false; this.baseBaseMax = 1000;
    this.talismanHeroId = null; this.talismanScroll = 0; this.talismanOverlayWasPaused = false;
    this.runeDrops = []; this.runeInventory = []; this.runePress = null; this.dragRune = null;
    this.runeInfoUid = null; this.runeInfoTime = 0; this.runeDropCounter = 0; this.waveRuneDropOffered = false;
    this.spiritAccessoryTutorial = selectedStage && selectedStage.id === '1-2' && this.progression && !this.progression.profile.spiritAccessoryGuideComplete
      ? { phase: 'waiting', dropId: null, runeUid: null }
      : null;
    this.nubaRescue = selectedStage && selectedStage.id === '1-3' && this.progression && !this.progression.profile.firstNubaRescueComplete
      ? { active: false, complete: false, dialogueIndex: -1, threatEnemyId: null, heroId: null,
        continueRect: { x: 176, y: 1088, w: 398, h: 72 } }
      : null;
    this.spellDiscountWave = 0; this.killHealCounter = 0;
    this.nextWaveShowcase = null; this.activeWaveShowcase = null;
    this.waveKills = 0; this.waveProgress = 0; this.waveProgressFlash = 0;
    this.enemies = []; this.projectiles = []; this.particles = []; this.floaters = []; this.zones = [];
    this.pendingCards = []; this.waveQueue = []; this.intermission = 0;
    this.upgradeAdRefreshUsed = false; this.upgradeAdAllUsed = false; this.rewardedVideoBusy = null;
    this.eliteDrawOffers = 0; this.eliteDrawQueue = []; this.eliteDrawState = null;
    this.skillVignette = null;
    this.waveBanner = 2.2;
    this.message = this.isSpiritLineMode() ? '阵主镇守后方 · 击败诡物获得灵识' : (WALL_MODE ? '' : '布阵完成 · 魂位已锁定');
    this.messageTime = WALL_MODE && !this.isSpiritLineMode() ? 0 : 5;
    var lampTune = spiritLampTuning();
    this.spiritLampMax = valueOr(lampTune.max, SPIRIT_LAMP_MAX);
    this.spiritLampInterval = valueOr(lampTune.interval, SPIRIT_LAMP_INTERVAL);
    this.spiritLampLit = this.firstStageTutorial ? 0 : clamp(valueOr(lampTune.initial, 1), 0, this.spiritLampMax) | 0;
    this.spiritLampTimer = 0; this.spiritLampPulse = 0; this.spiritLampHit = 0;
    this.spellCd = { wind: 0, rain: 0, empty: 0 };
    this.spellMax = {
      wind: valueOr(SPELL_META.wind.cooldown, 12),
      rain: valueOr(SPELL_META.rain.cooldown, 18),
      empty: 0
    };
    this.spellDamage = { wind: 0, rain: 0, empty: 0 };
    this.protagonistRainTime = 0; this.protagonistRainMax = 0;
    // 1-2 的阵主是稳定连射的重符炮台：比御灵更连续，但不以密集弹幕抢走角色技能焦点。
    this.protagonistAttackCd = this.isSpiritLineMode() ? 1.05 : 0;
    this.protagonistManualAttackCd = 0;
    this.protagonistAttackFlash = 0;
    this.protagonistAttackCount = 0;
    this.protagonistCastTime = 0;
    this.protagonistCastMax = 0;
    this.protagonistDamageLevel = 0;
    this.protagonistRateLevel = 0;
    this.protagonistPierceLevel = 0;
    this.spellAuto = this.autoCastUnlocked(); this.spellPress = null; this.spellHelpKey = null; this.spellHelpTime = 0;
    this.heroes = [];
    var layout = formationSlots && formationSlots.length ? formationSlots.slice(0, SOUL_SLOTS.length) : null;
    if (layout) layout.sort(function (a, b) { return a.gridIndex - b.gridIndex; });
    var roster = this.firstStageTutorial ? [] : (layout || this.configuredRoster().map(function (type) { return { type: type, gridIndex: null }; }));
    for (var r = 0; r < roster.length; r++) {
      var type = roster[r].type || roster[r], stats = this.configuredHeroStats(type);
      if (roster[r].gridIndex != null) stats.gridIndex = clamp(roster[r].gridIndex | 0, 0, ANCHORS.length - 1);
      // 城墙模式的魂位必须保留布阵格编号。不能按已上阵角色数量重新压缩，
      // 否则单独上阵到第 3 位的角色会在开战后被重排到第 1 位。
      var slot = layout
        ? clamp(roster[r].gridIndex == null ? r : roster[r].gridIndex, 0, SOUL_SLOTS.length - 1) | 0
        : clamp(stats.slot == null ? r : stats.slot, 0, SOUL_SLOTS.length - 1) | 0;
      this.heroes.push(this.makeHero(type, slot, stats));
    }
    this.refreshUpgradeDerivedStats(true);
    this.startWave(1);
    if (selectedStage && selectedStage.id === '1-2') {
      // 二倍速由 TutorialUI 的弱引导手指提示承载；不再叠加底部文字，确保“只有手指点击”。
      this.message = '';
      this.messageTime = 0;
    }
    // 守备原型不在开局发牌；阵主先独自清理首批诡物，灵识升级后再出现召来/强化选择。
  };

  Game.prototype.isNubaRescuePauseActive = function () {
    return !!(this.paused && this.nubaRescue && this.nubaRescue.active && !this.nubaRescue.complete);
  };

  Game.prototype.activateNubaRescue = function () {
    var rescue = this.nubaRescue;
    if (!rescue || rescue.active || rescue.complete || this.wave < this.waveMax) return false;
    var threat = this.getEnemy(rescue.threatEnemyId);
    if (!threat || threat.dead) return false;
    var realPressure = this.wallEnemyFootY(threat) >= 720 || this.baseHp <= this.baseMax * .65;
    if (!realPressure) return false;
    threat.hp = Math.max(threat.hp, threat.maxHp * .22);
    var stats = this.configuredHeroStats('nuba');
    stats.star = 15; stats.starLevel = 15;
    stats.damage = Math.max(stats.damage || 1, 220);
    var hero = this.makeHero('nuba', 4, stats);
    hero.starLevel = 15;
    hero.assist = true;
    hero.temporary = true;
    hero.rescueAssist = true;
    hero.name = '女魃·助战';
    hero.ultimateUnlocked = true;
    hero.ultimateCd = 0;
    this.heroes.push(hero);
    rescue.heroId = hero.id;
    rescue.active = true;
    rescue.dialogueIndex = 0;
    this.rogueLevels.N01 = 3;
    this.rogueLevels.N02 = 3;
    this.rogueLevels.N03 = 3;
    this.rogueLevels.N04 = 3;
    this.refreshUpgradeDerivedStats(false);
    this.paused = true;
    this.audio.playSfx('summonReveal') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.advanceNubaRescueDialogue = function () {
    var rescue = this.nubaRescue;
    if (!rescue || !rescue.active || rescue.complete) return false;
    if (rescue.dialogueIndex < 1) {
      rescue.dialogueIndex++;
      this.audio.tone('bell');
      return true;
    }
    rescue.complete = true;
    rescue.active = false;
    this.paused = false;
    var hero = this.getHero(rescue.heroId);
    if (hero) {
      hero.ultimateUnlocked = true;
      hero.ultimateCd = 0;
      this.castWallHeroUltimate(hero);
    }
    this.message = '女魃以满级试用强化助战 · 本局结束后不保留';
    this.messageTime = 4;
    return true;
  };

  Game.prototype.drawNubaRescueDialogue = function (ctx) {
    var rescue = this.nubaRescue;
    if (!rescue || !rescue.active || rescue.complete) return;
    var line = rescue.dialogueIndex === 0
      ? '女魃：呵呵，这就顶不住了吗？'
      : '女魃：退后些，莫要把你伤着了';
    ctx.save();
    ctx.fillStyle = 'rgba(2,8,13,.64)'; ctx.fillRect(0, 0, W, H);
    A.rr(ctx, 54, 904, 642, 282, 24, 'rgba(16,29,31,.98)', '#d7c38a', 3);
    A.text(ctx, '剧情助战 · 不占建木灵位', W / 2, 947, 21, '#d7c38a', 'center', '900');
    A.text(ctx, line, W / 2, 1016, 22, '#fff0c7', 'center', '900');
    A.rr(ctx, rescue.continueRect.x, rescue.continueRect.y, rescue.continueRect.w, rescue.continueRect.h, 18, '#7a5530', '#f2d28b', 2.5);
    A.text(ctx, rescue.dialogueIndex === 0 ? '继续' : '应战', W / 2, rescue.continueRect.y + rescue.continueRect.h / 2, 25, '#fff4d0', 'center', '900');
    ctx.restore();
  };

  // 仅由 localhost 的 ?qa=result-win / ?qa=result-failure 触发：这是版式/点击夹具，
  // 不替代真实战斗数据验收；真实数据由 ?qa=one-wave 走 endBattle() 生成。
  Game.prototype.openQaResultPreview = function (win) {
    if (win == null) win = true;
    var layout = [
      { type: 'huangjin', gridIndex: 1 },
      { type: 'hongyi', gridIndex: 2 },
      { type: 'xuanya', gridIndex: 3 }
    ];
    this.beginBattle(layout);
    var fixtureDamage = [36780, 28960, 13840];
    for (var i = 0; i < this.heroes.length; i++) this.heroes[i].damageDone = fixtureDamage[i] || 0;
    this.totalDamage = (win ? 58420 : 0) + fixtureDamage.reduce(function (sum, value) { return sum + value; }, 0);
    this.gameTime = win ? 166 : 137;
    this.kills = win ? 58 : 37;
    this.baseHp = win ? 630 : 0;
    this.wave = win ? this.waveMax : Math.max(1, this.waveMax - 3);
    this.waveQueue = [];
    this.enemies = [];
    this.waveBanner = 0;
    this.messageTime = 0;
    this.battleResult = this.captureBattleResult(win);
    this.state = 'result';
    this.win = win;
  };

  // 仅由 localhost 的 ?qa=elite-draw-fixture 触发：用于检查煞签结果层版式与点击回战。
  Game.prototype.openQaEliteDrawPreview = function () {
    this.beginBattle();
    this.state = 'battle';
    this.phase = 'wave';
    this.offerEliteDraw({ name: '镇魂甲尸', wave: 3 });
    if (this.eliteDrawState) this.eliteDrawState.t = ELITE_DRAW_TIMING.revealEnd;
  };

  Game.prototype.startWave = function (number) {
    this.wave = number; this.phase = 'wave'; this.waveBanner = 1.65; this.spawnTimer = .35;
    this.enemyClusterLane = (Math.random() * (WALL_MODE ? WALL_ENEMY_LANES.length : GRID_COLS.length)) | 0;
    this.wallEnemyLaneBag = [];
    this.waveQueue = []; this.waveKills = 0; this.waveProgress = 0; this.waveProgressFlash = 0; this.waveUpgradeOffered = false; this.waveRuneDropOffered = false;
    this.bossAppearPlayed = false;
    this.waveReviveUsed = false; this.spellDiscountWave = 0;
    for (var resetHero = 0; resetHero < this.heroes.length; resetHero++) this.heroes[resetHero].firstHitGuardUsed = false;
    var selectedStage = this.getSelectedStage();
    var fallback = { spawnInterval: Math.max(.34, .65 - number * .012), enemies: { wisp: 4 + Math.floor(number * .55) } };
    var source = this.stageWaveConfig && this.stageWaveConfig[number - 1] ? this.stageWaveConfig[number - 1] : fallback;
    var config = {}, configKey;
    for (configKey in source) config[configKey] = source[configKey];
    config.stage = selectedStage.id;
    this.currentWaveConfig = config;
    if (config.sequence && config.sequence.length) {
      for (var seq = 0; seq < config.sequence.length; seq++) {
        var step = config.sequence[seq] || {};
        if (step.gap) {
          this.waveQueue.push({ type: 'gap', delay: Math.max(.1, step.gap) });
          continue;
        }
        var sequenceAmount = Math.max(0, Math.floor(step.count || 0));
        for (var sq = 0; sq < sequenceAmount; sq++) {
          this.waveQueue.push({ type: step.type || 'wisp', elite: !!step.elite, mini: !!step.mini });
        }
      }
    } else {
      var types = ['wisp', 'jiangshi', 'armored', 'swift'];
      for (var ti = 0; ti < types.length; ti++) {
        var type = types[ti], amount = Math.max(0, Math.floor(config.enemies[type] || 0));
        for (var ai = 0; ai < amount; ai++) this.waveQueue.push({ type: type, elite: false, mini: false });
      }
      shuffle(this.waveQueue);
    }
    var bosses = Math.max(0, Math.floor(config.enemies.boss || 0));
    for (var bi = 0; bi < bosses; bi++) this.waveQueue.push({ type: 'boss', elite: true, mini: !!config.miniBoss });
    this.waveTotal = 0;
    for (var totalIndex = 0; totalIndex < this.waveQueue.length; totalIndex++) {
      // Boss 是末波独立压轴，不占小怪计数；进度条在 Boss 出场前就能到满。
      if (this.waveQueue[totalIndex].type !== 'gap' && this.waveQueue[totalIndex].type !== 'boss') this.waveTotal++;
    }
    this.waveClearSfxPlayed = false;
    // Boss 先留在队尾，等最后一波小怪清空、最后一次强化结算后再播出场音效并生成。
    this.audio.playSfx('waveStart');
    this.activeWaveShowcase = this.nextWaveShowcase;
    this.nextWaveShowcase = null;
    if (this.activeWaveShowcase) {
      this.message = '新强化演练：' + this.activeWaveShowcase.name;
      this.messageTime = 2.2;
    }
  };

  Game.prototype.pickEnemyLane = function () {
    if (WALL_MODE) {
      if (!this.wallEnemyLaneBag || !this.wallEnemyLaneBag.length) {
        this.wallEnemyLaneBag = [];
        for (var wallLane = 0; wallLane < WALL_ENEMY_LANES.length; wallLane++) this.wallEnemyLaneBag.push(wallLane);
        shuffle(this.wallEnemyLaneBag);
      }
      return this.wallEnemyLaneBag.pop();
    }
    var density = enemyDensityTuning();
    var lanes = GRID_COLS;
    if (this.enemyClusterLane == null || Math.random() < (density.clusterLaneChangeChance == null ? .14 : density.clusterLaneChangeChance)) {
      this.enemyClusterLane = (Math.random() * lanes.length) | 0;
    }
    if (Math.random() > (density.clusterChance == null ? 0 : density.clusterChance)) {
      return (Math.random() * lanes.length) | 0;
    }
    var roll = Math.random();
    var sameChance = density.sameLaneChance == null ? .62 : density.sameLaneChance;
    var adjacentChance = density.adjacentLaneChance == null ? .33 : density.adjacentLaneChance;
    if (roll < sameChance) return this.enemyClusterLane;
    if (roll < sameChance + adjacentChance) {
      var dir = Math.random() < .5 ? -1 : 1;
      return clamp(this.enemyClusterLane + dir, 0, lanes.length - 1) | 0;
    }
    return (Math.random() * lanes.length) | 0;
  };

  Game.prototype.nextSpawnPackSize = function () {
    var density = enemyDensityTuning();
    if (Math.random() >= (density.packChance == null ? 0 : density.packChance)) return 1;
    var min = Math.max(1, density.packMin || 2), max = Math.max(min, density.packMax || min);
    return min + ((Math.random() * (max - min + 1)) | 0);
  };

  Game.prototype.wallEnemyFootOffset = function (enemy) {
    var scale = (enemy && enemy.size ? enemy.size : 1) *
      (enemy && enemy.type === 'boss' ? 1.1 : enemy && enemy.type === 'armored' ? 1.06 : 1);
    return (enemy && enemy.type === 'boss' ? 58 : 36) * scale;
  };

  Game.prototype.wallEnemyFootY = function (enemy) {
    return enemy.y + this.wallEnemyFootOffset(enemy);
  };

  Game.prototype.wallEnemyHeadY = function (enemy) {
    if (!enemy) return Infinity;
    var scale = enemy.size || 1;
    var headOffset = enemy.type === 'boss' ? 44 :
      (enemy.type === 'armored' || enemy.type === 'jiangshi' ? 25 : 18);
    return enemy.y - headOffset * scale;
  };

  Game.prototype.wallEnemyBreachCenterY = function (enemy) {
    return WALL_DEFENSE_LINE_Y - this.wallEnemyFootOffset(enemy);
  };

  Game.prototype.wallEnemyDistanceToDefense = function (enemy) {
    return WALL_DEFENSE_LINE_Y - this.wallEnemyFootY(enemy);
  };

  Game.prototype.wallEnemyMoveSpeedMultiplier = function (enemy) {
    var mult = 1;
    if (enemy.slow > 0) mult *= .55;
    if ((enemy.huangjinSuppressTime || 0) > 0 && (enemy.huangjinSuppressStacks || 0) > 0) {
      var huangjinAttack = heroSkillConfig('huangjin').attack || {};
      mult *= Math.max(.1, 1 - Math.min(
        valueOr(huangjinAttack.suppressMaxStacks, 3),
        enemy.huangjinSuppressStacks || 0
      ) * valueOr(huangjinAttack.suppressSlowPerStack, .05));
    }
    if ((enemy.huangjinGatherSlow || 0) > 0) {
      var huangjinPassive = heroSkillConfig('huangjin').passive || {};
      mult *= valueOr(huangjinPassive.gatherSlowMultiplier, .80);
    }
    if ((enemy.huangjinHeavySlow || 0) > 0) {
      var heavyAttack = heroSkillConfig('huangjin').attack || {};
      mult *= valueOr(heavyAttack.heavySlowMultiplier, .75);
    }
    if ((enemy.spiritLineBloodSlow || 0) > 0) {
      mult *= enemy.spiritLineBloodSlowMultiplier == null ? .80 : enemy.spiritLineBloodSlowMultiplier;
    }
    if ((this.protagonistRainTime || 0) > 0) {
      mult *= valueOr(SPELL_META.rain && SPELL_META.rain.slowMultiplier, .88);
    }
    return mult;
  };

  Game.prototype.isWallEmergencyEnemy = function (enemy, extraDistance) {
    if (!enemy || enemy.dead) return false;
    var distanceToDefense = this.wallEnemyDistanceToDefense(enemy);
    if (enemy.breaking || distanceToDefense <= 0) return true;
    var distanceLimit = WALL_EMERGENCY_TARGET_DISTANCE + Math.max(0, extraDistance || 0);
    if (distanceToDefense <= distanceLimit) return true;
    var projectedSpeed = Math.max(0, enemy.speed || 0) * this.wallEnemyMoveSpeedMultiplier(enemy);
    return projectedSpeed * WALL_EMERGENCY_TARGET_SECONDS >= distanceToDefense;
  };

  Game.prototype.findWallEmergencyTarget = function (hero, options) {
    if (!WALL_MODE || !hero) return null;
    options = options || {};
    var originX = options.originX == null ? hero.x : options.originX;
    var originY = options.originY == null ? hero.y : options.originY;
    var searchRange = Math.max(48, options.range == null ? (hero.attackRange || 80) : options.range);
    var extraDistance = options.extraDistance || 0;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!this.isWallEmergencyEnemy(enemy, extraDistance)) continue;
      if (distance(originX, originY, enemy.x, enemy.y) > searchRange + 24) continue;
      var distanceToDefense = Math.max(0, this.wallEnemyDistanceToDefense(enemy));
      var attacking = enemy.breaking || this.wallEnemyFootY(enemy) >= WALL_DEFENSE_LINE_Y;
      var hpRatio = enemy.hp / Math.max(1, enemy.maxHp || enemy.hp || 1);
      var score = (attacking ? -10000000 : 0) + distanceToDefense * 1000 + hpRatio * 100 + Math.abs(hero.x - enemy.x) * .25;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.makeWallEnemyPath = function (enemy, routeIndex) {
    var route = WALL_ENEMY_ROUTES[clamp(routeIndex || 0, 0, WALL_ENEMY_ROUTES.length - 1)] || WALL_ENEMY_ROUTES[0];
    var offset = enemy.wallRouteOffsetX || 0;
    var path = [];
    for (var i = 0; i < route.length; i++) {
      var influence = 1 - i / Math.max(1, route.length + 1);
      path.push({
        x: clamp(route[i].x + offset * influence + (Math.random() * 2 - 1) * 6, 35, W - 35),
        y: route[i].y
      });
    }
    var last = route[route.length - 1];
    path.push({
      x: clamp(last.x + offset * .25, 45, W - 45),
      y: this.wallEnemyBreachCenterY(enemy)
    });
    return path;
  };

  Game.prototype.advanceWallEnemyAlongPath = function (enemy, dt, speed) {
    var path = enemy.wallPath;
    if (!path || !path.length) {
      enemy.y = Math.min(this.wallEnemyBreachCenterY(enemy), enemy.y + speed * dt);
      return;
    }
    var target = path[clamp(enemy.wallPathIndex || 0, 0, path.length - 1)];
    var dx = target.x - enemy.x, dy = target.y - enemy.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var step = speed * dt;
    if (Math.abs(dx) > 2) enemy.attackFacing = dx >= 0 ? 1 : -1;
    if (d <= step) {
      enemy.x = target.x; enemy.y = target.y;
      enemy.wallPathIndex = Math.min(path.length - 1, (enemy.wallPathIndex || 0) + 1);
    } else {
      enemy.x += dx / d * step;
      enemy.y += dy / d * step;
    }
  };

  Game.prototype.spawnEnemy = function (config) {
    var type = config.type, elite = !!config.elite, mini = !!config.mini;
    if (config.countInWave) this.waveTotal = Math.max(0, this.waveTotal || 0) + 1;
    var density = enemyDensityTuning();
    var laneIndex = this.pickEnemyLane();
    var data = {
      wisp: { name: '符纸游魂', hp: 115, speed: 55, damage: 13, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 },
      jiangshi: { name: '镇魂甲尸', hp: 620, speed: 38, damage: 45, rate: 1.33, range: 66, size: .92, xp: 26, coin: 18 },
      boss: { name: '纸扎魇主', hp: 6800, speed: 28, damage: 105, rate: 1.54, range: 96, size: 1.22, xp: 260, coin: 180 },
      swift: { name: '符纸游魂', hp: 115, speed: 55, damage: 13, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 },
      armored: { name: '镇魂甲尸', hp: 620, speed: 38, damage: 45, rate: 1.33, range: 66, size: .92, xp: 26, coin: 18 }
    }[type] || { name: '符纸游魂', hp: 115, speed: 55, damage: 13, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 };
    var scale = type === 'boss' ? 1 : 1 + (this.wave - 1) * .035;
    var elitePower = elite && type !== 'jiangshi';
    var eliteVisual = elite || type === 'jiangshi';
    var eliteScale = elitePower ? 1.65 : 1;
    if (mini) eliteScale *= .62;
    var waveHpScale = valueOr(this.currentWaveConfig && this.currentWaveConfig.enemyHpScale, 1);
    var bossHpScale = type === 'boss' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.bossHpScale, 1) : 1;
    var waveDamageScale = valueOr(this.currentWaveConfig && this.currentWaveConfig.enemyDamageScale, 1);
    var waveEliteHpScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteHpScale, 1) : 1;
    var waveEliteDamageScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteDamageScale, 1) : 1;
    var waveEliteAttackRateScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteAttackRateScale, 1) : 1;
    var eliteDraw = eliteDrawTuning();
    var eligibleTypes = eliteDraw.eligibleTypes || ['jiangshi'];
    var eliteRewardEligible = WALL_MODE && !this.isSpiritLineMode() && !this.isFirstStageTutorialActive() && eliteDraw.enabled !== false &&
      this.wave >= valueOr(eliteDraw.minWave, 3) && type !== 'boss' && !mini && eligibleTypes.indexOf(type) >= 0;
    var hp = data.hp * scale * eliteScale * waveHpScale * waveEliteHpScale * bossHpScale;
    var enemyTuning = battleTuning().enemy || {};
    // 1-2 的紧凑交战节奏不能扩散到旧关卡；旧城墙关继续使用全局基础调参。
    if (this.isSpiritLineMode && this.isSpiritLineMode() && enemyTuning.spiritLineV2) enemyTuning = enemyTuning.spiritLineV2;
    var speedOverrides = enemyTuning.speed || {};
    var baseSpeed = speedOverrides[type] == null ? data.speed : speedOverrides[type];
    var sizeOverrides = enemyTuning.sizeScale || {};
    var attackRateOverrides = enemyTuning.attackRate || {};
    var typeSizeScale = sizeOverrides[type] == null ? 1 : sizeOverrides[type];
    var eliteSizeScale = eliteVisual && type !== 'boss' ? (sizeOverrides.elite == null ? 1.08 : sizeOverrides.elite) : 1;
    var jitter = density.xJitter || 0;
    var laneXs = WALL_MODE ? WALL_ENEMY_LANES : GRID_COLS;
    var spawnX = clamp(laneXs[laneIndex] + (Math.random() * 2 - 1) * jitter, 35, W - 35);
    var spawnY = -(Math.random() * (density.yJitter || 0));
    var enemy = {
      id: this.idSeed++, type: type, x: spawnX, y: spawnY, gridCol: laneIndex,
      name: data.name,
      hp: hp, maxHp: hp, speed: baseSpeed * (elitePower ? 1.05 : 1),
      damage: data.damage * (type === 'boss' ? 1 : 1 + (this.wave - 1) * .018) * waveDamageScale * waveEliteDamageScale,
      attackRate: (attackRateOverrides[type] == null ? data.rate : attackRateOverrides[type]) * waveEliteAttackRateScale,
      attackType: 'melee', attackRange: data.range,
      attackCd: Math.random() * .5, size: data.size * typeSizeScale * eliteSizeScale,
      xp: data.xp * (elitePower ? 2 : 1), coin: data.coin * (elitePower ? 2 : 1),
      elite: eliteVisual, eliteRewardEligible: eliteRewardEligible, mini: mini, blocker: null, breaking: false, dead: false,
      slow: 0, freeze: 0, burn: 0, burnDps: 0, burnTick: 0, hit: 0, age: 0, hpBarTime: 0,
      rowPause: 0, nextRowStop: 0, redFlash: 0, soulExplosionGuard: false,
      summonCd: type === 'boss' ? 6 : 999, summonAnim: 0, attackAnim: 0,
      attackWindup: 0, attackWindupDuration: type === 'wisp' ? .22 : 0, pendingHero: null,
      attackDuration: type === 'boss' ? .75 : type === 'wisp' ? .34 : .5,
      hitHold: 0, attackFacing: 1, moving: false, wallAttackWindup: 0,
      wallRouteOffsetX: spawnX - laneXs[laneIndex], wallPathIndex: 0, wallPath: null
    };
    if (type === 'boss' && this.currentWaveConfig && this.currentWaveConfig.rescueThreat && this.nubaRescue && !this.nubaRescue.complete) {
      enemy.nubaRescueThreat = true;
      this.nubaRescue.threatEnemyId = enemy.id;
    }
    if (WALL_MODE) enemy.wallPath = this.makeWallEnemyPath(enemy, laneIndex);
    if (this.isSpiritLineMode()) {
      enemy.lineSector = clamp(Math.floor(laneIndex / Math.max(1, WALL_ENEMY_LANES.length) * SPIRIT_LINE_HOME_SLOTS.length), 0, SPIRIT_LINE_HOME_SLOTS.length - 1) | 0;
      // 甲尸作为原型中的远程压制单位：进入守备区射程后攻击御灵，不替代近战阻挡规则。
      if (type === 'jiangshi') {
        enemy.attackType = 'ranged';
        enemy.attackRange = 210;
        enemy.attackWindupDuration = .28;
      }
    }
    this.enemies.push(enemy);
  };

  Game.prototype.getHero = function (id) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].id === id) return this.heroes[i];
    return null;
  };

  Game.prototype.heroByType = function (type) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].type === type) return this.heroes[i];
    return null;
  };

  Game.prototype.heroExclusiveUpgradeCount = function (heroOrType) {
    var type = typeof heroOrType === 'string' ? heroOrType : heroOrType && heroOrType.type;
    if (!type) return 0;
    var source = YL.ROGUE_UPGRADES || [], count = 0;
    for (var i = 0; i < source.length; i++) {
      var upgrade = source[i];
      if (!upgrade || upgrade.type !== 'exclusive' || upgrade.hero !== type || isWallUltimateUnlockUpgrade(upgrade)) continue;
      count += this.rogueLevel(upgrade.id);
    }
    return count;
  };

  Game.prototype.isHeroUltimateUnlocked = function (hero) {
    if (!hero) return false;
    if (this.isSpiritLineMode() && hero.spiritLineV2) {
      var v2UnlockId = SPIRIT_LINE_V2_ULTIMATE_UPGRADES[hero.type];
      return !!hero.ultimateUnlocked || !!(v2UnlockId && this.rogueLevel(v2UnlockId) > 0);
    }
    var unlockId = WALL_ULTIMATE_UNLOCK_UPGRADES[hero.type];
    if (WALL_MODE && unlockId) return !!hero.ultimateUnlocked || this.rogueLevel(unlockId) > 0;
    return !!hero.ultimateUnlocked || !!(hero.upgrades && hero.upgrades.ultimate > 0);
  };

  Game.prototype.syncHeroUltimateUnlocks = function () {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      var unlocked = this.isHeroUltimateUnlocked(hero);
      hero.ultimateUnlocked = unlocked;
      if (!unlocked) {
        hero.ultimateCd = hero.ultimateMax;
        hero.ultimatePrevCd = hero.ultimateMax;
        hero.skillReadyFlash = 0;
      } else {
        hero.ultimateCd = Math.min(hero.ultimateCd == null ? hero.ultimateMax : hero.ultimateCd, hero.ultimateMax);
      }
    }
  };

  Game.prototype.canOfferUltimateUnlock = function (upgrade) {
    if (!WALL_MODE || !isWallUltimateUnlockUpgrade(upgrade)) return true;
    var hero = this.heroByType(upgrade.hero);
    return !!(hero && !this.isHeroUltimateUnlocked(hero) && this.heroExclusiveUpgradeCount(hero) >= WALL_ULTIMATE_UNLOCK_REQUIRED);
  };

  Game.prototype.canOfferSpiritLineV2Ultimate = function (upgrade) {
    if (!upgrade || !upgrade.spiritLineV2Ultimate) return true;
    var hero = this.heroByType(upgrade.hero);
    if (!hero) return false;
    // 红色 0 星是觉醒解锁牌；红色 1—3 星只在对应大招已经解锁后进入该角色牌池。
    if (upgrade.ultimateEnhancement) return this.isHeroUltimateUnlocked(hero);
    return !this.isHeroUltimateUnlocked(hero) && this.heroExclusiveUpgradeCount(hero) >= WALL_ULTIMATE_UNLOCK_REQUIRED;
  };

  Game.prototype.spiritLineV2UltimateEnhancementLevel = function (heroOrType) {
    var type = typeof heroOrType === 'string' ? heroOrType : heroOrType && heroOrType.type;
    var upgradeId = type && SPIRIT_LINE_V2_ULTIMATE_ENHANCEMENT_UPGRADES[type];
    return upgradeId ? this.spiritLineV2Level(upgradeId) : 0;
  };

  Game.prototype.getEnemy = function (id) {
    for (var i = 0; i < this.enemies.length; i++) if (this.enemies[i].id === id) return this.enemies[i];
    return null;
  };

  Game.prototype.heroAnchor = function (hero) { return ANCHORS[hero.anchorIndex]; };

  Game.prototype.heroSoulAnchor = function (hero) {
    var index = hero.soulAnchorIndex == null ? hero.anchorIndex : hero.soulAnchorIndex;
    return ANCHORS[index] || ANCHORS[hero.anchorIndex] || ANCHORS[10 + (hero.soulSlot || 0)];
  };

  Game.prototype.isSoulAnchorReserved = function (anchorIndex, owner) {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (hero !== owner && hero.soulAnchorIndex === anchorIndex) return true;
    }
    return false;
  };

  Game.prototype.heroForSoulAnchor = function (anchorIndex) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].soulAnchorIndex === anchorIndex) return this.heroes[i];
    return null;
  };

  Game.prototype.enemyFitsHeroRows = function (hero, enemy) {
    var heroGrid = this.heroAnchor(hero);
    var enemyRow = gridRowFromY(enemy.y);
    if (enemyRow > heroGrid.row) return false;
    if (hero.attackType === 'melee') return enemyRow === heroGrid.row || enemyRow === heroGrid.row - 1;
    return true;
  };

  Game.prototype.isTargetEngageable = function (hero, enemy) {
    if (!enemy || enemy.dead) return false;
    return distance(hero.x, hero.y, enemy.x, enemy.y) <= hero.attackRange + 24;
  };

  Game.prototype.acquireTarget = function (hero) {
    var best = null, bestScore = Infinity;
    var searchRange = WALL_MODE
      ? Math.max(48, hero.attackRange || 80)
      : (hero.search == null ? 820 : hero.search);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d > searchRange) continue;
      var score = WALL_MODE
        ? (WALL_DEFENSE_LINE_Y - this.wallEnemyFootY(enemy)) + Math.abs(hero.x - enemy.x) * .32
        : d - (914 - enemy.y) * .12;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.acquireWallHeroTarget = function (hero) {
    var emergency = this.findWallEmergencyTarget(hero, hero && hero.type === 'huangjin'
      ? { originX: hero.x, originY: hero.y - 58, range: hero.attackRange }
      : null);
    if (emergency) return emergency;
    return hero.type === 'huangjin'
      ? this.acquireWallHuangjinTarget(hero)
      : hero.type === 'xuanya' ? this.acquireWallXuanyaTarget(hero)
        : hero.type === 'suwen' ? this.acquireWallSuwenTarget(hero)
          : hero.type === 'nuba' ? (this.densestEnemy() || this.acquireTarget(hero))
            : this.acquireTarget(hero);
  };

  Game.prototype.isWallReleaseTargetValid = function (hero, enemy) {
    if (!hero || !enemy || enemy.dead) return false;
    if (hero.type === 'huangjin') {
      return distance(hero.x, hero.y - 58, enemy.x, enemy.y) <= (hero.attackRange || 0) + 12;
    }
    return distance(hero.x, hero.y, enemy.x, enemy.y) <= (hero.attackRange || 0) + 24;
  };

  Game.prototype.resolveWallAttackReleaseTarget = function (hero, pendingTargetId) {
    var emergency = this.findWallEmergencyTarget(hero, hero && hero.type === 'huangjin'
      ? { originX: hero.x, originY: hero.y - 58, range: hero.attackRange }
      : null);
    if (emergency) return emergency;
    var pending = this.getEnemy(pendingTargetId);
    if (this.isWallReleaseTargetValid(hero, pending)) return pending;
    return this.acquireWallHeroTarget(hero);
  };

  Game.prototype.prepareProjectileFreeFlight = function (projectile, target, maxDistance) {
    if (!projectile) return projectile;
    var aimX = target && target.x != null ? target.x : projectile.aimX;
    var aimY = target && target.y != null ? target.y : projectile.aimY;
    var dx = (aimX == null ? projectile.x : aimX) - projectile.x;
    var dy = (aimY == null ? projectile.y - 1 : aimY) - projectile.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    projectile.freeVx = dx / d;
    projectile.freeVy = dy / d;
    projectile.maxDistance = Math.max(80, maxDistance || projectile.maxDistance || 900);
    projectile.distanceTraveled = projectile.distanceTraveled || 0;
    projectile.retargetRadius = projectile.retargetRadius || Math.min(360, Math.max(220, projectile.maxDistance * .42));
    return projectile;
  };

  Game.prototype.advanceProjectileFreeFlight = function (projectile, dt) {
    if (!projectile || projectile.freeVx == null || projectile.freeVy == null) return false;
    var speed = Math.max(1, projectile.speed || 460);
    var step = speed * dt;
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x += projectile.freeVx * step;
    projectile.y += projectile.freeVy * step;
    projectile.distanceTraveled = (projectile.distanceTraveled || 0) + step;
    return projectile.life > 0 &&
      projectile.distanceTraveled < (projectile.maxDistance || 900) &&
      projectile.x > -90 && projectile.x < W + 90 &&
      projectile.y > -130 && projectile.y < H + 130;
  };

  Game.prototype.segmentDistanceSquared = function (px, py, ax, ay, bx, by) {
    var abx = bx - ax, aby = by - ay;
    var len2 = abx * abx + aby * aby;
    if (len2 <= .0001) return dist2(px, py, ax, ay);
    var t = ((px - ax) * abx + (py - ay) * aby) / len2;
    t = clamp(t, 0, 1);
    var cx = ax + abx * t, cy = ay + aby * t;
    return dist2(px, py, cx, cy);
  };

  Game.prototype.findFreeFlightProjectileHit = function (projectile) {
    if (!projectile) return null;
    var excluded = {};
    for (var ex = 0; ex < (projectile.hitIds || []).length; ex++) excluded[projectile.hitIds[ex]] = true;
    var ax = projectile.prevX == null ? projectile.x : projectile.prevX;
    var ay = projectile.prevY == null ? projectile.y : projectile.prevY;
    var bx = projectile.x, by = projectile.y;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || excluded[enemy.id]) continue;
      var hitRadius = Math.max(20, (projectile.r || 6) + 15 + (enemy.size || 1) * 16);
      var d2 = this.segmentDistanceSquared(enemy.x, enemy.y, ax, ay, bx, by);
      if (d2 <= hitRadius * hitRadius && d2 < bestScore) {
        bestScore = d2;
        best = enemy;
      }
    }
    return best;
  };

  Game.prototype.wallUntargetedAimPoint = function (hero) {
    if (hero && typeof hero.pendingTargetX === 'number' && typeof hero.pendingTargetY === 'number' &&
      isFinite(hero.pendingTargetX) && isFinite(hero.pendingTargetY)) {
      return { x: hero.pendingTargetX, y: hero.pendingTargetY };
    }
    var facing = hero && hero.attackFacing ? hero.attackFacing : 1;
    var range = Math.max(240, hero && hero.attackRange || 800);
    return { x: clamp((hero ? hero.x : W / 2) + facing * range * .18, 35, W - 35), y: (hero ? hero.y : H) - range };
  };

  Game.prototype.updateHuangjinPassive = function (hero, dt) {
    var passive = heroSkillConfig('huangjin').passive || {};
    var interval = valueOr(passive.interval, 10);
    var maxStacks = valueOr(passive.maxStacks, 5);
    var defensePerStack = valueOr(passive.defensePerStack, .08);
    hero.survivalTime = (hero.survivalTime || 0) + dt;
    var nextStacks = Math.min(maxStacks, Math.floor(hero.survivalTime / interval));
    if (nextStacks > (hero.defenseStacks || 0)) {
      hero.defenseStacks = nextStacks;
      this.floatText(hero.x, hero.y - 122, '不动如山 +' + Math.round(nextStacks * defensePerStack * 100) + '%', C.gold, 20, {
        life: 1.1, bold: true, rise: 20
      });
      this.burst(hero.x, hero.y - 38, C.gold, 12);
    }
  };

  Game.prototype.clearHuangjinWall = function (hero, removeRemainingShield) {
    if (removeRemainingShield && hero.wallBarrierShield > 0) {
      hero.shield = Math.max(0, hero.shield - hero.wallBarrierShield);
    }
    hero.wallBarrierShield = 0;
    hero.wallBarrierTime = 0;
  };

  Game.prototype.updateHuangjinWall = function (hero, dt) {
    if (hero.wallBarrierTime > 0) {
      hero.wallBarrierTime -= dt;
      if (hero.wallBarrierTime <= 0 || hero.wallBarrierShield <= 0) {
        this.clearHuangjinWall(hero, hero.wallBarrierShield > 0);
      }
    }
  };

  Game.prototype.heroDefenseReduction = function (hero) {
    if (hero.defenseStat > 0) {
      var huangjinPassive = heroSkillConfig('huangjin').passive || {};
      var maxStacks = valueOr(huangjinPassive.maxStacks, 5);
      var defensePerStack = valueOr(huangjinPassive.defensePerStack, .08);
      var stat = hero.defenseStat * (1 + Math.min(maxStacks, hero.defenseStacks || 0) * defensePerStack);
      return clamp(stat / (stat + 100), 0, .75);
    }
    return clamp(hero.defense || 0, 0, .65);
  };

  Game.prototype.countBurningEnemies = function () {
    var count = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead && this.enemies[i].burn > 0) count++;
    }
    return count;
  };

  Game.prototype.hongyiEmberStacks = function () {
    var hero = this.heroByType('hongyi');
    return hero ? Math.max(0, hero.hongyiSigils || 0) : 0;
  };

  Game.prototype.heroStarLevel = function (hero) {
    return Math.max(1, Math.floor(hero && (hero.starLevel || hero.star || hero.stars || 1) || 1));
  };

  Game.prototype.heroAttackPower = function (hero) {
    return hero.damage;
  };

  // 女魃不使用“累计普攻次数”作为连携门槛：场上存在裂日天仪时，下一次普攻直接读取旧仪。
  // 这样普攻负责布置可见形态，连携负责改变下一次落点与攻击轨迹，强化只放大这条关系。
  Game.prototype.nubaStarLevel = function (hero) {
    return this.heroStarLevel(hero);
  };

  Game.prototype.nubaCreateSigil = function (hero, x, y, damage, options) {
    options = options || {};
    var attack = heroSkillConfig('nuba').attack || {};
    var star = this.nubaStarLevel(hero);
    var n01 = this.rogueLevel('N01');
    var radius = valueOr(attack.fieldRadius, 112);
    var damageMultiplier = n01 >= 1 ? 1.20 : 1;
    if (n01 >= 1 || star >= 3) radius += n01 * 6 + (star >= 3 ? 18 : 0);
    if (star >= 8 || n01 >= 2) radius = Math.max(radius, valueOr(attack.upgradedFieldRadius, 130));
    var fallDelay = valueOr(options.fallDelay, attack.fallDelay || .38);
    var duration = valueOr(options.duration, attack.fieldDuration || 2.6);
    var zone = {
      type: 'nubaSigil', x: clamp(x, 44, W - 44), y: clamp(y, 178, WALL_DEFENSE_LINE_Y - 42),
      r: radius, hero: hero.id, damage: damage * damageMultiplier, tickDamage: damage * damageMultiplier * valueOr(attack.fieldTickDamageAtk, .24) / Math.max(.01, valueOr(attack.damageAtk, .92)),
      tickInterval: valueOr(attack.fieldTickInterval, .82), tick: valueOr(attack.fieldTickInterval, .82),
      delay: fallDelay, life: fallDelay + duration, maxLife: fallDelay + duration, age: 0, fired: false,
      dualRing: star >= 8 || n01 >= 2, sidePillars: n01 >= 3,
      gate: n01 >= 3, remember: options.remember !== false, color: '#d7c38a'
    };
    this.zones.push(zone);
    if (zone.remember) hero.nubaSigil = zone;
    return zone;
  };

  Game.prototype.fireNubaSigil = function (zone) {
    if (!zone || zone.fired) return;
    zone.fired = true;
    var hero = this.getHero(zone.hero);
    if (!hero) return;
    this.damageArea(zone.x, zone.y, zone.r, zone.damage, hero, null, { impact: true, noRune: true });
    if (zone.dualRing) this.damageArea(zone.x, zone.y, zone.r + 34, zone.damage * .34, hero, null, { impact: true, noRune: true });
    this.zones.push({ type: 'nubaPillar', x: zone.x, y: zone.y, r: zone.r, hero: hero.id, damage: 0, delay: 0, life: .48, maxLife: .48, age: 0, fired: true, color: '#d7c38a' });
    if (zone.sidePillars) {
      for (var side = -1; side <= 1; side += 2) {
        this.zones.push({
          type: 'nubaPillar', x: zone.x + side * Math.min(54, zone.r * .46), y: zone.y + 8,
          r: zone.r * .46, hero: hero.id, damage: zone.damage * .30, delay: .10, life: .58, maxLife: .58,
          age: 0, fired: false, color: '#d7c38a'
        });
      }
    }
    this.zones.push({ type: 'ring', x: zone.x, y: zone.y, r: zone.r, color: '#d7c38a', life: .28, maxLife: .28 });
    this.burst(zone.x, zone.y - 8, '#d7c38a', zone.dualRing ? 15 : 9);
  };

  Game.prototype.triggerNubaResonance = function (hero, oldZone, aim) {
    if (!hero || !oldZone || oldZone.life <= 0 || oldZone.resonated) return false;
    if (oldZone.type === 'nubaSigil' && !oldZone.fired) this.fireNubaSigil(oldZone);
    oldZone.resonated = true;
    oldZone.life = Math.min(oldZone.life, .20);
    if (hero.nubaSigil === oldZone) hero.nubaSigil = null;
    var attack = heroSkillConfig('nuba').attack || {};
    var n02 = this.rogueLevel('N02');
    var star = this.nubaStarLevel(hero);
    var startX = oldZone.x, startY = oldZone.y - 4;
    var endX = clamp(aim.x, 44, W - 44), endY = clamp(aim.y - 10, 178, WALL_DEFENSE_LINE_Y - 42);
    var midX = (startX + endX) * .5, midY = (startY + endY) * .5;
    var dx = endX - startX, dy = endY - startY, length = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / length, ny = dx / length;
    var branch = n02 >= 2 || star >= 5;
    var gate = n02 >= 3 || star >= 13;
    var life = .56;
    this.zones.push({
      type: 'nubaResonance', x: startX, y: startY, tx: endX, ty: endY,
      branchA: branch ? { x: midX + nx * 56, y: midY + ny * 56 } : null,
      branchB: branch ? { x: midX - nx * 56, y: midY - ny * 56 } : null,
      hitWidth: valueOr(attack.resonanceWidth, 28) + (star >= 13 ? 8 : 0),
      damage: this.heroAttackPower(hero) * valueOr(attack.resonanceLineDamageAtk, .72) * (n02 >= 1 ? 1.25 : 1),
      burstDamage: this.heroAttackPower(hero) * valueOr(attack.resonanceBurstDamageAtk, .46),
      hero: hero.id, delay: .10, life: life, maxLife: life, age: 0, fired: false, gate: gate,
      color: '#d7c38a'
    });
    hero.nubaResonanceFlash = .58;
    this.floatText(endX, endY - 66, gate ? '覆日天门' : '天仪共鸣', '#e6d49b', 18, { life: .72, bold: true, rise: 14 });
    this.burst(endX, endY - 8, '#d7c38a', branch ? 12 : 7);
    return true;
  };

  Game.prototype.releaseNubaAttack = function (hero, target, aim) {
    var attack = heroSkillConfig('nuba').attack || {};
    var damage = this.heroAttackPower(hero) * hero.attackMultiplier * valueOr(attack.damageAtk, .92);
    if (hero.nubaSigil && hero.nubaSigil.life > 0) this.triggerNubaResonance(hero, hero.nubaSigil, aim);
    this.nubaCreateSigil(hero, aim.x, aim.y - 12, damage);
    hero.nubaCastDuration = valueOr(attack.castAnimDuration, .34);
    hero.nubaCastTime = hero.nubaCastDuration;
    this.burst(hero.x, hero.y - 74, '#d7c38a', 8);
  };

  Game.prototype.castNubaUltimate = function (hero, enemies, ultimate, atk) {
    var center = this.densestEnemy() || this.highestThreatEnemy();
    if (!center) return false;
    this.beginWallUltimateMoment(hero, '赤地无疆！', '#d7c38a');
    var n04 = this.rogueLevel('N04');
    var star = this.nubaStarLevel(hero);
    var lane = n04 >= 3 || star >= 15;
    var radius = lane ? valueOr(ultimate.laneRadius, 390) : valueOr(ultimate.radius, 226);
    var fieldDuration = valueOr(ultimate.fieldDuration, 4);
    var centerDamage = atk * valueOr(ultimate.centerDamageAtk, 1.8);
    this.damageArea(center.x, center.y, radius, centerDamage, hero, null, { impact: true, skill: true, noSkillPush: true, noRune: true });
    this.zones.push({ type: 'nubaUltimate', x: center.x, y: center.y, r: radius, hero: hero.id, lane: lane, life: .95, maxLife: .95, age: 0, color: '#d7c38a' });
    this.zones.push({
      type: 'nubaField', x: center.x, y: center.y, r: radius, hero: hero.id, lane: lane,
      life: fieldDuration, maxLife: fieldDuration, age: 0, tick: valueOr(ultimate.fieldTickInterval, .80),
      tickInterval: valueOr(ultimate.fieldTickInterval, .80), moving: n04 >= 2 || star >= 15,
      damage: atk * valueOr(ultimate.fieldTickDamageAtk, .42), color: '#d7c38a'
    });
    var count = Math.max(1, valueOr(ultimate.pillarCount, 5));
    for (var pillar = 0; pillar < count; pillar++) {
      var px = lane ? 72 + pillar * (W - 144) / Math.max(1, count - 1) : center.x + Math.cos(-Math.PI / 2 + pillar * Math.PI * 2 / count) * radius * .56;
      var py = lane ? center.y + Math.sin(pillar * 1.4) * 32 : center.y + Math.sin(-Math.PI / 2 + pillar * Math.PI * 2 / count) * radius * .30;
      var pillarDelay = valueOr(ultimate.pillarDelay, .16) + pillar * valueOr(ultimate.pillarSpacing, .16);
      this.zones.push({
        type: 'nubaPillar', x: px, y: py, r: valueOr(ultimate.pillarRadius, 74), hero: hero.id,
        damage: atk * valueOr(ultimate.pillarDamageAtk, .55), delay: pillarDelay, life: pillarDelay + .52,
        maxLife: pillarDelay + .52, age: 0, fired: false, skill: true, color: '#d7c38a'
      });
    }
    if (n04 >= 2) {
      for (var sigil = 0; sigil < 3; sigil++) {
        var sigilX = center.x + (sigil - 1) * 86;
        var autoSigil = this.nubaCreateSigil(hero, sigilX, center.y + 28, atk * .42, { remember: false, duration: 1.65, fallDelay: .18 });
        autoSigil.gate = n04 >= 3 || star >= 15;
      }
    }
    if (hero.nubaSigil && hero.nubaSigil.life > 0) this.triggerNubaResonance(hero, hero.nubaSigil, center);
    hero.nubaCastDuration = valueOr(ultimate.castDuration, .92);
    hero.nubaCastTime = hero.nubaCastDuration;
    this.burst(center.x, center.y - 12, '#d7c38a', lane ? 32 : 24);
    this.shake = Math.max(this.shake, valueOr(ultimate.shake, 10));
    return true;
  };

  Game.prototype.hongyiStarLevel = function (hero) {
    return this.heroStarLevel(hero);
  };

  Game.prototype.hongyiSigilRequirement = function (hero) {
    var passive = heroSkillConfig('hongyi').passive || {};
    return valueOr(passive.sigilsRequired, 5);
  };

  Game.prototype.addHongyiSigils = function (hero, amount, reason) {
    if (!hero || hero.type !== 'hongyi' || amount <= 0) return 0;
    var required = this.hongyiSigilRequirement(hero);
    var before = clamp(hero.hongyiSigils || 0, 0, required);
    var after = clamp(before + amount, 0, required);
    hero.hongyiSigils = after;
    if (after > before) {
      hero.hongyiLotusFlash = .32;
      this.burst(hero.x, hero.y - 58, C.fire, reason === 'burn' ? 4 : 7);
      if (after >= required && before < required) {
        this.floatText(hero.x, hero.y - 130, '赤莲火羽', C.fire, 22, { life: .85, bold: true, rise: 18 });
        this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 36, r: 34, color: C.fire, life: .55 });
      }
    }
    return after - before;
  };

  Game.prototype.consumeHongyiSigilsForLotus = function (hero) {
    if (!hero || hero.type !== 'hongyi') return false;
    var required = this.hongyiSigilRequirement(hero);
    if ((hero.hongyiSigils || 0) < required) return false;
    hero.hongyiSigils = 0;
    hero.hongyiBurnSigilTicks = 0;
    hero.hongyiLotusFlash = .5;
    this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 44, r: 48, color: C.fire, life: .62 });
    return true;
  };

  Game.prototype.onHongyiBurnTick = function (enemy, source) {
    // Only the main fire-feather hit generates a sigil in the current build.
  };

  Game.prototype.xuanyaStarLevel = function (hero) {
    return this.heroStarLevel(hero);
  };

  Game.prototype.xuanyaMarkThreshold = function (hero) {
    var attack = heroSkillConfig('xuanya').attack || {};
    var threshold = valueOr(attack.markThreshold, .35);
    if (this.rogueLevel('E18') >= 2) threshold = Math.max(threshold, valueOr(attack.upgradedMarkThreshold, .45));
    return threshold;
  };

  Game.prototype.xuanyaMarkDuration = function (hero) {
    var attack = heroSkillConfig('xuanya').attack || {};
    var duration = this.xuanyaStarLevel(hero) >= 3
      ? valueOr(attack.starMarkDuration, 3.5)
      : valueOr(attack.markDuration, 3);
    return duration;
  };

  Game.prototype.xuanyaExecuteDamageBonus = function () {
    return 0;
  };

  Game.prototype.xuanyaMarkDamageBonus = function (hero) {
    var attack = heroSkillConfig('xuanya').attack || {};
    return this.rogueLevel('E18') >= 2 ? valueOr(attack.markDamageBonus, .25) : 0;
  };

  Game.prototype.xuanyaChaseDamageAtk = function (hero) {
    var attack = heroSkillConfig('xuanya').attack || {};
    return valueOr(attack.chaseDamageAtk, .70);
  };

  Game.prototype.xuanyaFollowupRadius = function (hero) {
    var attack = heroSkillConfig('xuanya').attack || {};
    var radius = valueOr(attack.followupRadius, 260);
    return radius;
  };

  Game.prototype.consumeXuanyaSoulStacks = function (hero) {
    if (!hero || hero.type !== 'xuanya' || this.xuanyaStarLevel(hero) < 5) return 0;
    var attack = heroSkillConfig('xuanya').attack || {};
    var maxStacks = valueOr(attack.soulMaxStacks, 3);
    var stacks = clamp(hero.xuanyaSoulStacks || 0, 0, maxStacks);
    if (stacks > 0) {
      hero.xuanyaSoulStacks = 0;
      this.floatText(hero.x, hero.y - 132, '残羽索魂 x' + stacks, HERO_META[hero.type].color, 18, { life: .8, bold: true, rise: 18 });
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 42, r: 34 + stacks * 4, color: HERO_META[hero.type].color, life: .48 });
    }
    return stacks;
  };

  Game.prototype.gainXuanyaSoul = function (enemy, killOptions) {
    if (!enemy || !(enemy.xuanyaMark > 0) || killOptions && killOptions.noXuanyaSoul) return;
    var hero = this.heroByType('xuanya');
    if (!hero || this.xuanyaStarLevel(hero) < 5) return;
    if (hero.xuanyaSoulLastGainTime === this.gameTime) return;
    var attack = heroSkillConfig('xuanya').attack || {};
    var maxStacks = valueOr(attack.soulMaxStacks, 3);
    var before = clamp(hero.xuanyaSoulStacks || 0, 0, maxStacks);
    hero.xuanyaSoulStacks = clamp(before + 1, 0, maxStacks);
    hero.xuanyaSoulLastGainTime = this.gameTime;
    if (hero.xuanyaSoulStacks > before) {
      this.floatText(hero.x, hero.y - 126, '索魂 +' + hero.xuanyaSoulStacks, HERO_META[hero.type].color, 17, { life: .75, bold: true, rise: 16 });
      this.burst(hero.x, hero.y - 50, HERO_META[hero.type].color, 5);
    }
  };

  Game.prototype.consumeXuanyaEmpoweredBlade = function (hero) {
    if (!hero || hero.type !== 'xuanya' || this.xuanyaStarLevel(hero) < 7 || !hero.xuanyaEmpoweredBlade) return false;
    hero.xuanyaEmpoweredBlade = 0;
    return true;
  };

  Game.prototype.applyXuanyaMark = function (enemy, hero, showText) {
    if (!enemy || enemy.dead || !hero || hero.type !== 'xuanya') return;
    enemy.xuanyaMark = Math.max(enemy.xuanyaMark || 0, this.xuanyaMarkDuration(hero));
    enemy.xuanyaMarkSource = hero.id;
    this.zones.push({ type: 'xuanMark', x: enemy.x, y: enemy.y - 42, r: 28, color: HERO_META[hero.type].color, life: .44, maxLife: .44 });
    if (showText) this.floatText(enemy.x, enemy.y - 72, '鸦痕', HERO_META[hero.type].color, 18, { life: .7, bold: true, rise: 14 });
  };

  Game.prototype.applyBurn = function (enemy, source, duration, dps) {
    if (!enemy || enemy.dead) return;
    if (source && source.faction === '鬼族') dps *= 1 + this.upgradeValue('F07', [.15, .30, .45], 0);
    if (WALL_MODE && source) {
      var burnRune = this.runeForHero(source);
      if (burnRune && burnRune.type === 'emberBell') dps *= 1.20;
    }
    enemy.burn = Math.max(enemy.burn || 0, duration || 0);
    if ((enemy.burnDps || 0) <= dps) {
      enemy.burnDps = dps;
      enemy.burnSource = source ? source.id : null;
    }
    enemy.burnTick = enemy.burnTick > 0 ? Math.min(enemy.burnTick, .5) : .5;
  };

  Game.prototype.updateHongyiPassive = function (hero, dt) {
    var required = this.hongyiSigilRequirement(hero);
    hero.hongyiSigils = clamp(hero.hongyiSigils || 0, 0, required);
    hero.hongyiLotusFlash = Math.max(0, (hero.hongyiLotusFlash || 0) - (dt || 0));
    hero.hongyiBurnSigilCooldown = Math.max(0, (hero.hongyiBurnSigilCooldown || 0) - (dt || 0));
  };

  Game.prototype.updateQingyiPassive = function (hero, dt) {
    dt = dt || 0;
    if (!hero || hero.type !== 'qingyi') return;
    dt = dt || 0;
    hero.qingyiGlow = Math.max(0, hero.qingyiGlow || 0);
    hero.qingyiGlowFlash = Math.max(0, (hero.qingyiGlowFlash || 0) - dt);
  };

  Game.prototype.qingyiExposeDuration = function () {
    var attack = heroSkillConfig('qingyi').attack || {};
    return this.rogueLevel('Q01') >= 2
      ? valueOr(attack.upgradedMarkDuration, 5.5)
      : valueOr(attack.markDuration, 4);
  };

  Game.prototype.qingyiExposeBonus = function (enemy) {
    var attack = heroSkillConfig('qingyi').attack || {};
    var bonus = this.rogueLevel('Q01') >= 1
      ? valueOr(attack.upgradedMarkDamageBonus, .12)
      : valueOr(attack.markDamageBonus, .08);
    if (this.rogueLevel('Q01') >= 3 && enemy && (enemy.elite || enemy.type === 'boss')) {
      bonus += valueOr(attack.eliteMarkDamageBonus, .04);
    }
    return bonus;
  };

  Game.prototype.applyQingyiExpose = function (enemy, hero, duration, options) {
    if (!enemy || enemy.dead || !hero || hero.type !== 'qingyi') return false;
    options = options || {};
    var finalDuration = duration == null ? this.qingyiExposeDuration() : duration;
    enemy.qingyiExposeTime = Math.max(enemy.qingyiExposeTime || 0, finalDuration);
    enemy.qingyiExposeBonus = Math.max(enemy.qingyiExposeBonus || 0, this.qingyiExposeBonus(enemy));
    enemy.qingyiExposeSource = hero.id;
    if (options.text !== false) {
      this.floatText(enemy.x, enemy.y - 74, options.propagated ? '连照' : '照破', HERO_META[hero.type].color, 17, { life: .65, bold: true, rise: 12 });
    }
    this.zones.push({ type: 'qingyiMark', x: enemy.x, y: enemy.y - 42, r: options.propagated ? 24 : 30, color: HERO_META[hero.type].color, life: .44, maxLife: .44 });
    return true;
  };

  Game.prototype.findQingyiLampTarget = function (x, y, radius, preferredId) {
    var preferred = preferredId ? this.getEnemy(preferredId) : null;
    if (preferred && !preferred.dead && dist2(preferred.x, preferred.y - 18, x, y - 18) <= radius * radius) return preferred;
    var best = null, bestDistance = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var d2 = dist2(enemy.x, enemy.y - 18, x, y - 18);
      if (d2 <= radius * radius && d2 < bestDistance) { bestDistance = d2; best = enemy; }
    }
    return best;
  };

  Game.prototype.releaseQingyiLamp = function (hero, target, damage, aim) {
    if (!hero) return;
    var attack = heroSkillConfig('qingyi').attack || {};
    var aimX = aim && aim.x != null ? aim.x : (target ? target.x : hero.x);
    var aimY = aim && aim.y != null ? aim.y : (target ? target.y : hero.y - 220);
    var fallDelay = valueOr(attack.fallDelay, .38);
    var fallOffset = valueOr(attack.fallStartOffset, 180);
    this.projectiles.push({
      type: 'qingyi',
      hero: hero.id,
      target: target ? target.id : null,
      x: aimX, y: aimY - fallOffset,
      prevX: aimX, prevY: aimY - fallOffset,
      aimX: aimX, aimY: aimY,
      damage: damage,
      color: HERO_META[hero.type].color,
      r: 8,
      life: fallDelay + .75,
      age: 0,
      fallDelay: fallDelay,
      maxFallDelay: fallDelay,
      fallStartOffset: fallOffset,
      hitRadius: valueOr(attack.hitRadius, 46),
      primary: true
    });
    this.zones.push({ type: 'qingyiLampWarn', x: aimX, y: aimY - 18, r: valueOr(attack.hitRadius, 46), color: HERO_META[hero.type].color, life: fallDelay, maxLife: fallDelay });
  };

  Game.prototype.updateQingyiFallingLamp = function (projectile, dt) {
    if (!projectile) return true;
    projectile.fallDelay = Math.max(0, (projectile.fallDelay || 0) - dt);
    var progress = 1 - clamp(projectile.fallDelay / Math.max(.01, projectile.maxFallDelay || .38), 0, 1);
    projectile.prevX = projectile.x; projectile.prevY = projectile.y;
    projectile.x = projectile.aimX;
    projectile.y = projectile.aimY - (projectile.fallStartOffset || 180) * (1 - progress);
    if (projectile.fallDelay > 0) return false;
    var hero = this.getHero(projectile.hero);
    var hit = this.findQingyiLampTarget(projectile.aimX, projectile.aimY, projectile.hitRadius || 46, projectile.target);
    if (hit && hero) {
      this.applyQingyiProjectileImpact(hero, hit, projectile);
      this.burst(hit.x, hit.y - 18, projectile.color, 7);
    } else {
      this.zones.push({ type: 'holyHit', x: projectile.aimX, y: projectile.aimY - 18, angle: -Math.PI / 2, r: projectile.hitRadius || 46, color: projectile.color, life: .22, maxLife: .22, miss: true });
      this.burst(projectile.aimX, projectile.aimY - 18, projectile.color, 3);
    }
    return true;
  };

  Game.prototype.propagateQingyiExpose = function (hero, sourceEnemy, baseDuration) {
    var level = this.rogueLevel('Q02');
    if (!hero || !sourceEnemy || level < 1) return;
    var attack = heroSkillConfig('qingyi').attack || {};
    var radius = valueOr(attack.propagateRadius, 210);
    var count = level >= 2 ? 2 : 1;
    var duration = Math.max(.5, baseDuration * valueOr(attack.propagateDurationRatio, .5));
    var targets = [];
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy === sourceEnemy || (enemy.qingyiExposeTime || 0) > 0) continue;
      var d2 = dist2(enemy.x, enemy.y, sourceEnemy.x, sourceEnemy.y);
      if (d2 <= radius * radius) targets.push({ enemy: enemy, d2: d2 });
    }
    targets.sort(function (a, b) { return a.d2 - b.d2; });
    for (var t = 0; t < targets.length && t < count; t++) {
      this.applyQingyiExpose(targets[t].enemy, hero, duration, { propagated: true });
      this.zones.push({ type: 'qingyiLink', x: sourceEnemy.x, y: sourceEnemy.y - 42, tx: targets[t].enemy.x, ty: targets[t].enemy.y - 42, color: HERO_META[hero.type].color, life: .36, maxLife: .36 });
    }
    if (!targets.length && level >= 3) {
      var residualLife = valueOr(attack.residualDuration, 1);
      this.zones.push({
        type: 'qingyiResidualLamp',
        hero: hero.id,
        x: sourceEnemy.x, y: sourceEnemy.y - 18,
        r: Math.min(radius, 150),
        duration: duration,
        touched: {},
        life: residualLife, maxLife: residualLife
      });
    }
  };

  Game.prototype.qingyiGlowRequirement = function () {
    var passive = heroSkillConfig('qingyi').passive || {};
    return this.rogueLevel('Q03') >= 1
      ? valueOr(passive.upgradedGlowRequired, 5)
      : valueOr(passive.glowRequired, 6);
  };

  Game.prototype.triggerQingyiSynergy = function (qingyi, triggerHero) {
    if (!qingyi || !triggerHero || !triggerHero.alive) return;
    var passive = heroSkillConfig('qingyi').passive || {};
    var duration = valueOr(passive.synergyDuration, 3) + (this.rogueLevel('Q03') >= 2 ? 1 : 0);
    qingyi.qingyiGlow = 0;
    qingyi.qingyiGlowFlash = .6;
    triggerHero.qingyiSynergyTime = Math.max(triggerHero.qingyiSynergyTime || 0, duration);
    triggerHero.qingyiSynergySource = qingyi.id;
    triggerHero.qingyiSynergyBurstReady = this.rogueLevel('Q03') >= 3;
    triggerHero.qingyiSynergyFlash = .55;
    this.floatText(triggerHero.x, triggerHero.y - 126, '同辉', HERO_META[qingyi.type].color, 21, { life: .85, bold: true, rise: 16 });
    this.zones.push({ type: 'ring', x: triggerHero.x, y: triggerHero.y - 38, r: 30, color: HERO_META[qingyi.type].color, life: .62, maxLife: .62 });
    if (triggerHero.id !== qingyi.id) {
      this.zones.push({ type: 'qingyiLink', x: qingyi.x, y: qingyi.y - 62, tx: triggerHero.x, ty: triggerHero.y - 62, color: HERO_META[qingyi.type].color, life: .48, maxLife: .48 });
    }
    if (this.rogueLevel('Q04') >= 1 && (this.baseHp || 0) / Math.max(1, this.baseMax || 1) < valueOr(passive.wallHealThreshold, .5)) {
      this.healWall(this.heroAttackPower(qingyi) * valueOr(passive.wallHealAtk, .8), qingyi, {
        overflowToShield: this.rogueLevel('Q04') >= 2,
        shieldRatio: valueOr(passive.overflowShieldRatio, .5)
      });
    }
  };

  Game.prototype.gainQingyiGlow = function (source, enemy, options) {
    if (!source || !source.alive || !enemy || enemy.dead || options && options.noQingyiGlow) return;
    if ((enemy.qingyiExposeTime || 0) <= 0 || (enemy.qingyiGlowCd || 0) > 0) return;
    var qingyi = this.getHero(enemy.qingyiExposeSource);
    if (!qingyi || !qingyi.alive || qingyi.type !== 'qingyi') return;
    var passive = heroSkillConfig('qingyi').passive || {};
    enemy.qingyiGlowCd = valueOr(passive.targetGlowCooldown, .25);
    qingyi.qingyiGlow = Math.min(this.qingyiGlowRequirement(), (qingyi.qingyiGlow || 0) + 1);
    qingyi.qingyiGlowFlash = .35;
    if (qingyi.qingyiGlow >= this.qingyiGlowRequirement()) this.triggerQingyiSynergy(qingyi, source);
  };

  Game.prototype.qingyiWallShieldSpeedMultiplier = function () {
    if (this.rogueLevel('Q04') < 3 || (this.wallShield || 0) <= 0) return 1;
    var passive = heroSkillConfig('qingyi').passive || {};
    return 1 + valueOr(passive.shieldAttackSpeedBonus, .08);
  };

  Game.prototype.healingReceivedMultiplier = function (hero, source) {
    if (WALL_MODE) return 1;
    if (!hero || !hero.alive || hero.type === 'qingyi') return 1;
    var aura = heroSkillConfig('qingyi').aura || {};
    var auraRange = valueOr(aura.range, 300);
    var healBonus = valueOr(aura.healBonus, .25);
    for (var i = 0; i < this.heroes.length; i++) {
      var priest = this.heroes[i];
      if (!priest.alive || priest.type !== 'qingyi' || priest.id === hero.id) continue;
      if (distance(priest.x, priest.y, hero.x, hero.y) <= auraRange) return 1 + healBonus;
    }
    return 1;
  };

  Game.prototype.addHolyShield = function (hero, amount, duration) {
    if (!hero || !hero.alive || amount <= 0) return;
    if (hero.holyShield > 0) hero.shield = Math.max(0, hero.shield - hero.holyShield);
    hero.holyShield = amount;
    hero.holyShieldTime = duration || 4;
    hero.shield += amount;
    hero.shieldFlash = .35;
    this.floatText(hero.x, hero.y - 112, '圣盾 +' + Math.round(amount), '#f7e6a3', 18, { life: .9, bold: true, rise: 18 });
  };

  Game.prototype.updateHolyShield = function (hero, dt) {
    if (hero.holyShieldTime > 0) {
      hero.holyShieldTime -= dt;
      if (hero.holyShieldTime <= 0 && hero.holyShield > 0) {
        hero.shield = Math.max(0, hero.shield - hero.holyShield);
        hero.holyShield = 0;
      }
    }
  };

  Game.prototype.hasHuangjinWallReduction = function (hero) {
    for (var i = 0; i < this.heroes.length; i++) {
      var guard = this.heroes[i];
      if (guard.type === 'huangjin' && guard.alive && guard.wallBarrierTime > 0 && guard.wallBarrierShield > 0 &&
        gridColumnFromX(guard.x) === gridColumnFromX(hero.x)) return true;
    }
    return false;
  };

  Game.prototype.updateWallHeroes = function (dt) {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      var wallPlacement = wallHeroPlacement(hero.type, hero.soulSlot || 0);
      hero.alive = true;
      hero.x = wallPlacement.x;
      hero.y = wallPlacement.y;
      hero.scale = wallPlacement.scale;
      var wallBaseRange = WALL_HERO_ATTACK_RANGE[hero.type] || hero.attackRange || 240;
      if (hero.type === 'huangjin') {
        var huangjinRangeLevel = this.huangjinUpgradeLevel('E01');
        var huangjinAttackRange = heroSkillConfig('huangjin').attack || {};
        hero.attackRange = wallBaseRange + (huangjinRangeLevel >= 1 ? valueOr(huangjinAttackRange.rangeBonus, 70) : 0);
      } else hero.attackRange = wallBaseRange;
      hero.search = hero.attackRange;
      hero.walking = false;
      hero.flash = Math.max(0, (hero.flash || 0) - dt);
      hero.redFlash = Math.max(0, (hero.redFlash || 0) - dt);
      hero.skillReadyFlash = Math.max(0, (hero.skillReadyFlash || 0) - dt);
      hero.skillCastFlash = Math.max(0, (hero.skillCastFlash || 0) - dt);
      hero.nubaCastTime = Math.max(0, (hero.nubaCastTime || 0) - dt);
      hero.nubaResonanceFlash = Math.max(0, (hero.nubaResonanceFlash || 0) - dt);
      hero.qingyiSynergyFlash = Math.max(0, (hero.qingyiSynergyFlash || 0) - dt);
      hero.qingyiSynergyTime = Math.max(0, (hero.qingyiSynergyTime || 0) - dt);
      if (hero.qingyiSynergyTime <= 0) hero.qingyiSynergyBurstReady = false;
      hero.hitReact = 0;
      hero.hitHold = Math.max(0, (hero.hitHold || 0) - dt);
      if (hero.hitHold <= 0) hero.attackAnim = Math.max(0, (hero.attackAnim || 0) - dt);
      if (hero.type === 'hongyi') this.updateHongyiPassive(hero, dt);
      if (hero.type === 'suwen') this.updateSuwenPassive(hero, dt);
      if (hero.type === 'qingyi') this.updateQingyiPassive(hero, dt);
      var ultimateUnlocked = this.isHeroUltimateUnlocked(hero);
      var previousUltimateCd = hero.ultimateCd;
      if (ultimateUnlocked) {
        hero.ultimateCd = Math.max(-0.2, (hero.ultimateCd || 0) - dt);
        if (previousUltimateCd > 0 && hero.ultimateCd <= 0) hero.skillReadyFlash = .2;
      } else {
        hero.ultimateCd = hero.ultimateMax;
        hero.ultimatePrevCd = hero.ultimateMax;
      }
      hero.attackCd -= dt * this.qingyiWallShieldSpeedMultiplier();
      if (hero.attackWindup > 0) {
        hero.attackWindup -= dt;
        if (hero.attackWindup <= 0) {
          var pending = this.resolveWallAttackReleaseTarget(hero, hero.pendingTarget);
          if (pending) {
            hero.target = pending.id;
            hero.attackFacing = pending.x >= hero.x ? 1 : -1;
            this.releaseHeroAttack(hero, pending);
          } else {
            this.releaseHeroAttack(hero, null);
          }
          hero.pendingTarget = null;
          hero.pendingTargetX = null;
          hero.pendingTargetY = null;
        }
        continue;
      }
      var target = this.acquireWallHeroTarget(hero);
      hero.target = target ? target.id : null;
      if (target) {
        hero.attackFacing = target.x >= hero.x ? 1 : -1;
        if (hero.attackCd <= 0) this.heroAttack(hero, target);
      }
      if (ultimateUnlocked && hero.ultimateCd <= 0) this.castHeroUltimate(hero);
    }
  };

  Game.prototype.acquireSpiritLineTarget = function (hero) {
    if (!hero || !hero.lineUnlocked || !hero.alive) return null;
    var emergency = this.acquireSpiritLineBreachTarget(hero);
    if (emergency) return emergency;
    var best = null, bestScore = Infinity;
    var sector = hero.lineSlot == null ? this.spiritLineSectorForX(hero.x) : hero.lineSlot;
    var range = Math.max(100, hero.search || hero.attackRange || 260);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.lineSector !== sector) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d > range) continue;
      // 优先处理最接近城防的敌人；同一守备区内保留明确的前线压力。
      var score = this.wallEnemyDistanceToDefense(enemy) * .85 + d * .15;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.isSpiritLineBreachThreat = function (enemy) {
    if (!enemy || enemy.dead) return false;
    var enemyTuning = battleTuning().enemy || {};
    var v2Tuning = enemyTuning.spiritLineV2 || {};
    var response = v2Tuning.breachResponse || {};
    var warningDistance = response.warningDistance == null ? 72 : response.warningDistance;
    return !!enemy.breaking || this.wallEnemyFootY(enemy) >= WALL_DEFENSE_LINE_Y - warningDistance;
  };

  Game.prototype.acquireSpiritLineBreachTarget = function (hero) {
    if (!hero || !hero.lineUnlocked || !hero.alive) return null;
    var enemyTuning = battleTuning().enemy || {};
    var v2Tuning = enemyTuning.spiritLineV2 || {};
    var response = v2Tuning.breachResponse || {};
    var emergencyRange = hero.attackType === 'melee'
      ? Math.max(hero.search || 0, response.meleeSearch || 360)
      : Math.max(hero.search || 0, hero.attackRange || 0);
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!this.isSpiritLineBreachThreat(enemy)) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d > emergencyRange) continue;
      // 越接近城门越优先；距离只用于避免角色无意义横穿整条战线。
      var score = this.wallEnemyDistanceToDefense(enemy) * .82 + d * .18;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.updateSpiritLineHeroes = function (dt) {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      hero.flash = Math.max(0, (hero.flash || 0) - dt);
      hero.redFlash = Math.max(0, (hero.redFlash || 0) - dt);
      hero.hitReact = Math.max(0, (hero.hitReact || 0) - dt);
      hero.shieldFlash = Math.max(0, (hero.shieldFlash || 0) - dt);
      hero.hitHold = Math.max(0, (hero.hitHold || 0) - dt);
      if (hero.hitHold <= 0) hero.attackAnim = Math.max(0, (hero.attackAnim || 0) - dt);
      hero.skillReadyFlash = Math.max(0, (hero.skillReadyFlash || 0) - dt);
      hero.skillCastFlash = Math.max(0, (hero.skillCastFlash || 0) - dt);
      hero.invuln = Math.max(0, (hero.invuln || 0) - dt);
      if (!hero.lineUnlocked) continue;

      if (!hero.alive) {
        this.updateSoulReturn(hero, dt);
        hero.respawn -= dt;
        if (hero.respawn <= 0) this.respawnHero(hero);
        continue;
      }
      if (hero.spiritLineV2) this.updateSpiritLineV2HeroState(hero, dt);
      else if (hero.type === 'hongyi') this.updateHongyiPassive(hero, dt);
      hero.attackCd -= dt;
      hero.blocked = [];
      for (var b = 0; b < this.enemies.length; b++) {
        if (this.enemies[b].blocker === hero.id && !this.enemies[b].dead) hero.blocked.push(this.enemies[b].id);
      }

      var ultimateUnlocked = this.isHeroUltimateUnlocked(hero);
      if (ultimateUnlocked) hero.ultimateCd = Math.max(-.2, (hero.ultimateCd || 0) - dt);
      else hero.ultimateCd = hero.ultimateMax;

      if (hero.attackWindup > 0) {
        hero.attackWindup -= dt;
        if (hero.attackWindup <= 0) {
          var pending = this.getEnemy(hero.pendingTarget);
          if (pending && (pending.lineSector === hero.lineSlot || this.isSpiritLineBreachThreat(pending)) && this.isTargetEngageable(hero, pending)) this.releaseHeroAttack(hero, pending);
          else hero.attackAnim = hero.attackRecoveryDuration || .28;
          hero.pendingTarget = null;
        }
        continue;
      }

      var home = this.spiritLineHome(hero);
      var target = this.acquireSpiritLineTarget(hero);
      hero.target = target ? target.id : null;
      hero.walking = false;
      if (target) {
        var d = distance(hero.x, hero.y, target.x, target.y);
        var desiredRange = hero.attackType === 'melee' ? Math.min(92, hero.attackRange) : hero.attackRange;
        if (d > desiredRange - 8) {
          // 近战只会向前顶住怪物；远程只可小幅前压，始终保留阵主与城防后的空间。
          var dx = target.x - hero.x, dy = target.y - hero.y;
          var step = hero.moveSpeed * dt;
          var nextX = hero.x + dx / Math.max(1, d) * step;
          var nextY = hero.y + dy / Math.max(1, d) * step;
          var sectorW = W / SPIRIT_LINE_HOME_SLOTS.length;
          var minX = hero.lineSlot * sectorW + 18;
          var maxX = (hero.lineSlot + 1) * sectorW - 18;
          hero.x = clamp(nextX, minX, maxX);
          // 守备区只允许有限前压：交战线整体前推，但不会演化成玩家需要频繁微操的跑图。
          var forwardLimit = home.y - (hero.attackType === 'melee' ? 150 : 72);
          hero.y = clamp(nextY, forwardLimit, SPIRIT_LINE_MAX_Y);
          hero.attackFacing = dx >= 0 ? 1 : -1;
          hero.walking = true;
        } else if (hero.attackCd <= 0) {
          this.heroAttack(hero, target);
        }
      } else {
        var hd = distance(hero.x, hero.y, home.x, home.y);
        if (hd > 3) {
          var hs = Math.min(hd, hero.moveSpeed * .72 * dt);
          hero.x += (home.x - hero.x) / hd * hs;
          hero.y += (home.y - hero.y) / hd * hs;
        }
      }
      if (ultimateUnlocked && hero.ultimateCd <= 0) this.castWallHeroUltimate(hero);
    }
  };

  Game.prototype.updateHeroes = function (dt) {
    if (this.isSpiritLineMode()) { this.updateSpiritLineHeroes(dt); return; }
    if (WALL_MODE) { this.updateWallHeroes(dt); return; }
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      hero.flash = Math.max(0, hero.flash - dt);
      hero.redFlash = Math.max(0, (hero.redFlash || 0) - dt);
      hero.hitReact = Math.max(0, (hero.hitReact || 0) - dt);
      hero.shieldFlash = Math.max(0, (hero.shieldFlash || 0) - dt);
      hero.hitHold = Math.max(0, (hero.hitHold || 0) - dt);
      if (hero.hitHold <= 0) hero.attackAnim = Math.max(0, hero.attackAnim - dt);
      hero.skillReadyFlash = Math.max(0, (hero.skillReadyFlash || 0) - dt);
      hero.skillCastFlash = Math.max(0, (hero.skillCastFlash || 0) - dt);
      hero.invuln = Math.max(0, hero.invuln - dt);
      hero.attackBuffTime = Math.max(0, (hero.attackBuffTime || 0) - dt);
      if (!hero.alive) {
        this.updateSoulReturn(hero, dt);
        hero.respawn -= dt;
        if (hero.respawn <= 0) this.respawnHero(hero);
        continue;
      }
      if (hero.type === 'huangjin') this.updateHuangjinPassive(hero, dt);
      if (hero.type === 'hongyi') this.updateHongyiPassive(hero, dt);
      this.updateHuangjinWall(hero, dt);
      this.updateHolyShield(hero, dt);
      hero.attackCd -= dt * (hero.attackBuffTime > 0 ? 1.12 : 1);
      var ultimateUnlocked = this.isHeroUltimateUnlocked(hero);
      var previousUltimateCd = hero.ultimateCd;
      if (ultimateUnlocked) {
        hero.ultimateCd -= dt;
        if (previousUltimateCd > 0 && hero.ultimateCd <= 0) hero.skillReadyFlash = .15;
        hero.ultimatePrevCd = previousUltimateCd;
      } else {
        hero.ultimateCd = hero.ultimateMax;
        hero.ultimatePrevCd = hero.ultimateMax;
      }
      hero.healCd -= dt;
      hero.blocked = [];
      for (var e = 0; e < this.enemies.length; e++) if (this.enemies[e].blocker === hero.id && !this.enemies[e].dead) hero.blocked.push(this.enemies[e].id);
      if (hero.attackWindup > 0) {
        hero.attackWindup -= dt;
        if (hero.attackWindup <= 0) {
          var pending = this.getEnemy(hero.pendingTarget);
          if (pending && this.isTargetEngageable(hero, pending)) this.releaseHeroAttack(hero, pending);
          else hero.attackAnim = hero.attackRecoveryDuration || .28;
          hero.pendingTarget = null;
        }
        continue;
      }

      var home = this.heroAnchor(hero);
      var target = this.acquireTarget(hero);
      hero.target = target ? target.id : null;
      hero.walking = false;
      var heroTune = battleTuning().hero || {};
      var pressLimitY = hero.attackType === 'ranged' ? (heroTune.rangedPressY || 620) : (heroTune.meleePressY || 440);
      if (target) {
        var d = distance(hero.x, hero.y, target.x, target.y);
        if (d > hero.attackRange - 8) {
          var dx = target.x - hero.x, dy = target.y - hero.y;
          var step = hero.moveSpeed * dt;
          if (step > d) step = d;
          hero.x = clamp(hero.x + dx / d * step, 40, 700);
          var ny = hero.y + dy / d * step;
          hero.y = clamp(ny, pressLimitY, 905);
          hero.attackFacing = dx >= 0 ? 1 : -1;
          hero.walking = true;
        } else if (hero.attackCd <= 0) this.heroAttack(hero, target);
      } else {
        var hd = distance(hero.x, hero.y, home.x, home.y);
        if (hd > 6) {
          var hs = Math.min(hd, hero.moveSpeed * .6 * dt);
          hero.x += (home.x - hero.x) / hd * hs;
          hero.y += (home.y - hero.y) / hd * hs;
          hero.y = clamp(hero.y, pressLimitY, 905);
        }
      }
      if (hero.type === 'suwen' && hero.healCd <= 0) {
        var suwenPassive = heroSkillConfig('suwen').passive || {};
        var marked = this.highestThreatEnemy();
        if (marked) {
          marked.suwenMarked = valueOr(suwenPassive.markDuration, 5);
          marked.markDamageTaken = valueOr(suwenPassive.damageTaken, .15);
          this.floatText(marked.x, marked.y - 92, '问命签', HERO_META[hero.type].color, 19, { life: .9, bold: true });
          this.zones.push({ type: 'ring', x: marked.x, y: marked.y, r: 28, color: HERO_META[hero.type].color, life: .6 });
        }
        hero.healCd = valueOr(suwenPassive.cooldown, 6);
      }
      if (hero.type === 'qingyi') this.updateQingyiPassive(hero);
      if (ultimateUnlocked && hero.ultimateCd <= 0) this.castHeroUltimate(hero);
    }
  };

  Game.prototype.updateSoulReturn = function (hero, dt) {
    var anchor = this.isSpiritLineMode() ? this.spiritLineHome(hero) : this.heroSoulAnchor(hero);
    if (!anchor) return;
    if (!hero.soulReturn) {
      hero.x = anchor.x; hero.y = anchor.y;
      return;
    }
    hero.soulReturn.t += dt;
    var p = clamp(hero.soulReturn.t / Math.max(.01, hero.soulReturn.duration || .55), 0, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    hero.x = hero.soulReturn.fromX + (anchor.x - hero.soulReturn.fromX) * ease;
    hero.y = hero.soulReturn.fromY + (anchor.y - hero.soulReturn.fromY) * ease - Math.sin(p * Math.PI) * 34;
    if (p >= 1) {
      hero.soulReturn = null;
      hero.x = anchor.x; hero.y = anchor.y;
    }
  };

  Game.prototype.syncBlocks = function () {
    var i, enemy, hero, d;
    for (i = 0; i < this.enemies.length; i++) {
      enemy = this.enemies[i];
      if (enemy.blocker) {
        hero = this.getHero(enemy.blocker);
        if (!hero || !hero.alive) enemy.blocker = null;
        else if (distance(enemy.x, enemy.y, hero.x, hero.y) > 250) enemy.blocker = null;
      }
    }
    for (i = 0; i < this.heroes.length; i++) {
      hero = this.heroes[i]; if (!hero.alive) continue;
      var capacity = Math.max(0, hero.block || 0);
      var current = 0;
      for (var count = 0; count < this.enemies.length; count++) if (this.enemies[count].blocker === hero.id) current++;
      if (current >= capacity) continue;
      var candidates = [];
      for (var j = 0; j < this.enemies.length; j++) {
        enemy = this.enemies[j];
        if (enemy.dead || enemy.blocker || enemy.breaking) continue;
        d = distance(enemy.x, enemy.y, hero.x, hero.y);
        if (d <= 180) candidates.push({ enemy: enemy, d: d });
      }
      candidates.sort(function (a, b) { return a.d - b.d; });
      for (var c = 0; c < candidates.length && current < capacity; c++) {
        candidates[c].enemy.blocker = hero.id; current++; hero.blockedTotal++;
        this.burst(candidates[c].enemy.x, candidates[c].enemy.y, HERO_META[hero.type].color, 5);
        if (hero.faction === '人族' && this.rogueLevel('F02') > 0 && this.activeWaveShowcase &&
          this.activeWaveShowcase.id === 'F02' && !this.activeWaveShowcase.shown) {
          this.activeWaveShowcase.shown = true;
          this.floatText(candidates[c].enemy.x, candidates[c].enemy.y - 88, '人族集火', C.gold, 22, { life: 1, bold: true, impact: true });
          this.zones.push({ type: 'targetMark', x: candidates[c].enemy.x, y: candidates[c].enemy.y, r: 34, color: C.gold, life: 1, maxLife: 1 });
        }
      }
    }
  };

  Game.prototype.syncSpiritLineBlocks = function () {
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.attackType === 'ranged') continue;
      if (enemy.blocker) {
        var oldHero = this.getHero(enemy.blocker);
        if (!oldHero || !oldHero.alive || !oldHero.lineUnlocked || oldHero.lineSlot !== enemy.lineSector || distance(enemy.x, enemy.y, oldHero.x, oldHero.y) > 155) enemy.blocker = null;
      }
    }
    for (var h = 0; h < this.heroes.length; h++) {
      var hero = this.heroes[h];
      if (!hero.lineUnlocked || !hero.alive) continue;
      var occupied = 0;
      for (var e = 0; e < this.enemies.length; e++) if (!this.enemies[e].dead && this.enemies[e].blocker === hero.id) occupied++;
      if (occupied >= Math.max(1, hero.block || 1)) continue;
      var candidate = null, candidateD = Infinity;
      for (var c = 0; c < this.enemies.length; c++) {
        var target = this.enemies[c];
        if (!target || target.dead || target.blocker || target.attackType === 'ranged' || target.lineSector !== hero.lineSlot) continue;
        var d = distance(target.x, target.y, hero.x, hero.y);
        if (d <= 132 && d < candidateD) { candidate = target; candidateD = d; }
      }
      if (candidate) {
        candidate.blocker = hero.id;
        hero.blockedTotal++;
        this.burst(candidate.x, candidate.y, HERO_META[hero.type].color, 5);
      }
    }
  };

  Game.prototype.protagonistAttackOrigin = function () {
    var r = BATTLE_LOWER_ART.protagonist;
    return { x: r.x, y: r.y - 76 };
  };

  Game.prototype.showProtagonistAimClick = function (x, y) {
    if (!isFinite(x) || !isFinite(y)) return false;
    this.zones.push({ type: 'protagonistAimClick', x: x, y: y, r: 22, life: .34, maxLife: .34, age: 0 });
    return true;
  };

  Game.prototype.battlefieldAimPointAt = function (x, y) {
    if (!WALL_MODE || this.phase !== 'wave') return false;
    var tutorialAttack = this.isFirstStageTutorialAttackGuideActive && this.isFirstStageTutorialAttackGuideActive();
    var minAimY = tutorialAttack ? 118 : 220;
    if (x < 24 || x > W - 24 || y < minAimY || y > WALL_DEFENSE_LINE_Y + 12) return false;
    if (this.sideActionAt(x, y) >= 0) return false;
    return true;
  };

  Game.prototype.findProtagonistTarget = function () {
    var target = null, score = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var next = this.wallEnemyDistanceToDefense(enemy) + Math.abs(enemy.x - W / 2) * .08;
      if (next < score) { score = next; target = enemy; }
    }
    return target;
  };

  Game.prototype.protagonistAttackInterval = function () {
    return Math.max(.72, 1.05 * Math.pow(.84, this.protagonistRateLevel || 0));
  };

  Game.prototype.launchProtagonistSigil = function (target, damage, manual) {
    if (!target || target.dead) return false;
    var origin = this.protagonistAttackOrigin();
    var originX = origin.x, originY = origin.y;
    var shot = {
      x: originX, y: originY, prevX: originX, prevY: originY,
      target: target.id, hero: null, type: 'protagonistSigil',
      speed: 760, damage: damage, cosmetic: false, color: '#8ff4ff', r: 8,
      life: 2.1, age: 0, primary: true, maxDistance: 1040, manual: !!manual
    };
    this.prepareProjectileFreeFlight(shot, target, 1040);
    this.projectiles.push(shot);
    this.protagonistAttackFlash = .18;
    this.zones.push({ type: 'ring', x: originX, y: originY - 11, r: 23, color: '#8ff4ff', life: .22, maxLife: .22 });
    this.audio.tone('shoot');
    return true;
  };

  Game.prototype.launchProtagonistTalisman = function (aimX, aimY, damage, manual) {
    var origin = this.protagonistAttackOrigin();
    var dx = aimX - origin.x, dy = aimY - origin.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(d) || d < 1) return false;
    var dirX = dx / d, dirY = dy / d;
    var shot = {
      x: origin.x, y: origin.y, prevX: origin.x, prevY: origin.y,
      target: null, hero: null, type: 'protagonistTalisman',
      speed: 900, damage: damage, cosmetic: false, color: '#8ff4ff', r: 10,
      life: 2.1, age: 0, primary: true, maxDistance: 1460,
      freeVx: dirX, freeVy: dirY, dirX: dirX, dirY: dirY,
      distanceTraveled: 0, manual: !!manual, hitIds: []
    };
    this.projectiles.push(shot);
    this.protagonistAttackFlash = .22;
    this.protagonistCastMax = .62;
    this.protagonistCastTime = this.protagonistCastMax;
    this.zones.push({ type: 'ring', x: origin.x, y: origin.y - 11, r: 23, color: '#8ff4ff', life: .22, maxLife: .22 });
    this.audio.tone('shoot');
    return true;
  };

  Game.prototype.fireProtagonistTalismanAt = function (aimX, aimY) {
    if (!WALL_MODE || this.phase !== 'wave') return false;
    var attackGuideActive = this.isFirstStageTutorialAttackGuideActive && this.isFirstStageTutorialAttackGuideActive();
    if (!attackGuideActive && (this.protagonistManualAttackCd || 0) > 0) {
      return false;
    }
    var origin = this.protagonistAttackOrigin();
    var dx = aimX - origin.x, dy = aimY - origin.y;
    if (!isFinite(dx) || !isFinite(dy) || Math.sqrt(dx * dx + dy * dy) < 1) return false;
    var damage = 89 * (1 + (this.protagonistDamageLevel || 0) * .28);
    // 首波教学点按必须即时响应；普通战斗仍沿用正式手动攻击冷却。
    this.protagonistManualAttackCd = attackGuideActive ? 0 : this.protagonistAttackInterval();
    this.protagonistAttackCount = (this.protagonistAttackCount || 0) + 1;
    if (this.isFirstStageTutorialActive()) {
      return this.launchProtagonistTalisman(aimX, aimY, damage, true);
    }
    return this.launchProtagonistTalisman(aimX, aimY, damage, true);
  };

  Game.prototype.updateProtagonistAutoAttack = function (dt) {
    if (!this.isSpiritLineMode()) return;
    this.protagonistAttackCd = Math.max(-.2, (this.protagonistAttackCd || 0) - dt);
    if (this.protagonistAttackCd > 0) return;
    var target = this.findProtagonistTarget();
    if (!target) return;
    // 基础频率从 1.2 秒提高到 1.05 秒，同时下调单符伤害，维持开局 DPS，
    // 让阵主看起来稳定输出而不是突然变成主屏幕弹幕。
    var damage = 89 * (1 + (this.protagonistDamageLevel || 0) * .28);
    var interval = this.protagonistAttackInterval();
    this.protagonistAttackCd = interval;
    this.launchProtagonistSigil(target, damage, false);
  };

  Game.prototype.blockingHero = function (enemy) {
    return enemy && enemy.blocker ? this.getHero(enemy.blocker) : null;
  };

  Game.prototype.isBlockedByFaction = function (enemy, faction) {
    var blocker = this.blockingHero(enemy);
    return !!(blocker && blocker.alive && blocker.faction === faction);
  };

  Game.prototype.heroAttack = function (hero, target) {
    hero.pendingTarget = target.id;
    hero.pendingTargetX = target.x;
    hero.pendingTargetY = target.y;
    hero.attackFacing = target.x >= hero.x ? 1 : -1;
    hero.attackWindup = hero.attackWindupDuration;
    hero.attackRecoveryDuration = hero.attackRecoveryDuration || (hero.attackType === 'ranged' ? .38 : .34);
    hero.attackDuration = hero.attackRecoveryDuration;
    hero.attackAnim = 0;
    hero.attackCd = hero.attackInterval;
    hero.flash = .12;
    if (hero.attackType === 'ranged') {
      this.zones.push({
        type: 'charge', x: hero.x + hero.attackFacing * 27, y: hero.y - 54,
        r: 16, color: HERO_META[hero.type].color, life: hero.attackWindupDuration,
        maxLife: hero.attackWindupDuration,
        vfxRow: hero.type === 'hongyi' ? 0 : hero.type === 'suwen' ? 1 : 2
      });
    }
  };

  Game.prototype.releaseHeroAttack = function (hero, target) {
    hero.attackAnim = hero.attackRecoveryDuration || .34;
    hero.hitHold = .06;
    var level = hero.upgrades.attack;
    var attackPower = this.heroAttackPower(hero);
    var damage = attackPower * hero.attackMultiplier * (1 + level * .25);
    hero.attackCount++;
    if (hero.type === 'xuanya') {
      if ((target.elite || target.type === 'boss') && level >= 2) damage *= 1.35;
      if (hero.upgrades.passive >= 1 && hero.attackCount % 4 === 0) damage *= 2;
      this.damageEnemy(target, damage, hero, { impact: true });
      if (level >= 3 && !target.dead) this.damageEnemy(target, damage * .55, hero);
      if (hero.upgrades.passive >= 3 && target.type !== 'boss' && target.hp < target.maxHp * .15) this.damageEnemy(target, target.hp + 1, hero);
      this.zones.push({ type: 'meleeSlash', heroType: hero.type, x: hero.x, y: hero.y - 30, angle: Math.atan2(target.y - hero.y, target.x - hero.x), r: 82, color: '#f6e7c0', life: .50, maxLife: .50, age: 0, vfxRow: 0 });
    } else if (hero.type === 'huangjin') {
      var huangjinAttack = heroSkillConfig('huangjin').attack || {};
      damage = this.heroAttackPower(hero) * hero.attackMultiplier;
      this.damageEnemy(target, damage, hero, { impact: true });
      if (Math.random() < valueOr(huangjinAttack.knockbackChance, .3) && !target.dead) {
        target.blocker = null;
        target.y = Math.max(0, target.y - valueOr(huangjinAttack.knockbackDistance, 62));
        target.hit = Math.max(target.hit || 0, .16);
        target.redFlash = .1;
        this.floatText(target.x, target.y - 64, '击退', C.gold, 18, { bold: true, rise: 18 });
        this.burst(target.x, target.y - 10, C.gold, 10);
      }
    } else {
      var hongyiAttack = heroSkillConfig('hongyi').attack || {};
      this.projectiles.push({
        x: hero.x, y: hero.y - 34, target: target.id, hero: hero.id, type: hero.type,
        speed: (hero.type === 'hongyi' || hero.type === 'qingyi') ? hero.projectileSpeed : hero.projectileSpeed * .8,
        damage: damage, color: HERO_META[hero.type].color,
        burnDuration: hero.type === 'hongyi' ? valueOr(hongyiAttack.burnDuration, 3) : 0,
        burnDps: hero.type === 'hongyi' ? attackPower * valueOr(hongyiAttack.burnDpsAtk, .10) : 0,
        r: hero.type === 'hongyi' ? 9 : 7, life: 2.4, age: 0,
        vfxRow: hero.type === 'hongyi' ? 0 : hero.type === 'suwen' ? 1 : 2,
        prevX: hero.x, prevY: hero.y - 34
      });
      this.burst(hero.x + hero.attackFacing * 24, hero.y - 48, HERO_META[hero.type].color, 5);
    }
    this.audio.tone('shoot');
  };

  Game.prototype.updateProjectiles = function (dt) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i], target = this.getEnemy(p.target);
      if ((p.launchDelay || 0) > 0) {
        p.launchDelay = Math.max(0, p.launchDelay - dt);
        continue;
      }
      if (this.isSpiritLineMode() && p.spiritLineV2) {
        if (this.updateSpiritLineV2Projectile(p, dt)) this.projectiles.splice(i, 1);
        continue;
      }
      // 阵主手动发出的符纸只沿初始方向飞行，不追踪目标；
      // 用线段碰撞避免高速符纸穿过小型诡物。
      if (p.type === 'protagonistTalisman') {
        p.life -= dt; p.age = (p.age || 0) + dt;
        if (!this.advanceProjectileFreeFlight(p, dt)) {
          this.projectiles.splice(i, 1);
          continue;
        }
        var talismanHit = this.findFreeFlightProjectileHit(p);
        if (talismanHit) {
          this.projectileHit(p, talismanHit);
          this.projectiles.splice(i, 1);
        }
        continue;
      }
      // 1-2 灵脉模式保留旧的自动追踪符箓逻辑；它与战场点击符纸分开。
      if (p.type === 'protagonistSigil') {
        p.life -= dt; p.age = (p.age || 0) + dt;
        if (!target || target.dead || p.life <= 0) { this.projectiles.splice(i, 1); continue; }
        var sigilDistance = distance(p.x, p.y, target.x, target.y);
        if (sigilDistance <= p.speed * dt + 12) {
          this.projectileHit(p, target);
          this.projectiles.splice(i, 1);
        } else {
          var sigilStep = p.speed * dt;
          p.prevX = p.x; p.prevY = p.y;
          p.x += (target.x - p.x) / sigilDistance * sigilStep;
          p.y += (target.y - p.y) / sigilDistance * sigilStep;
        }
        continue;
      }
      if (WALL_MODE && p.curveDelay != null) {
        p.curveDelay -= dt;
        if (p.curveDelay <= 0) {
          var curveTarget = this.getEnemy(p.curveTarget);
          if (curveTarget && !curveTarget.dead) {
            p.target = curveTarget.id;
            target = curveTarget;
          }
          p.curveDelay = null;
          p.curveTarget = null;
        }
      }
      p.life -= dt; p.age = (p.age || 0) + dt;
      if (WALL_MODE && p.type === 'qingyi' && p.fallDelay != null) {
        if (this.updateQingyiFallingLamp(p, dt) || p.life <= 0) this.projectiles.splice(i, 1);
        continue;
      }
      if (WALL_MODE && this.isSuwenNeedleProjectile(p.type) && p.fallDelay != null) {
        if (this.updateSuwenFallingNeedle(p, dt) || p.life <= 0) this.projectiles.splice(i, 1);
        continue;
      }
      if ((!target || target.dead) && WALL_MODE) {
        if (!this.advanceProjectileFreeFlight(p, dt)) {
          this.projectiles.splice(i, 1);
          continue;
        }
        if (this.isHongyiProjectile && this.isHongyiProjectile(p.type)) this.emitHongyiProjectileTrail(p, dt);
        var freeHit = this.findFreeFlightProjectileHit(p);
        if (freeHit) {
          this.projectileHit(p, freeHit);
          this.projectiles.splice(i, 1);
        }
        continue;
      }
      if (!target || target.dead || p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      var d = distance(p.x, p.y, target.x, target.y);
      if (d <= p.speed * dt + 12) {
        this.projectileHit(p, target);
        this.projectiles.splice(i, 1);
      } else {
        var flyStep = p.speed * dt;
        var flyVx = (target.x - p.x) / d, flyVy = (target.y - p.y) / d;
        p.prevX = p.x; p.prevY = p.y;
        p.x += flyVx * flyStep;
        p.y += flyVy * flyStep;
        if (WALL_MODE) {
          p.freeVx = flyVx;
          p.freeVy = flyVy;
          p.distanceTraveled = (p.distanceTraveled || 0) + flyStep;
        }
        if (this.isHongyiProjectile && this.isHongyiProjectile(p.type)) this.emitHongyiProjectileTrail(p, dt);
      }
    }
  };

  Game.prototype.projectileHit = function (p, target) {
    var hero = this.getHero(p.hero);
    if (p.type === 'protagonistSigil' || p.type === 'protagonistTalisman') {
      this.zones.push({ type: 'orbImpact', x: target.x, y: target.y - 20, r: 46, vfxRow: 2, life: .28, maxLife: .28, age: 0 });
      if (!p.cosmetic) this.damageEnemy(target, p.damage, null, { impact: true });
      if (!p.cosmetic && (this.protagonistPierceLevel || 0) > 0) {
        var side = null, sideD = Infinity;
        for (var si = 0; si < this.enemies.length; si++) {
          var other = this.enemies[si];
          if (!other || other.dead || other.id === target.id) continue;
          var d = distance(other.x, other.y, target.x, target.y);
          if (d <= 104 && d < sideD) { side = other; sideD = d; }
        }
        if (side) {
          this.damageEnemy(side, p.damage * (.35 + (this.protagonistPierceLevel || 0) * .10), null, { impact: true });
          this.zones.push({ type: 'ring', x: side.x, y: side.y - 20, r: 28, color: '#8ff4ff', life: .24, maxLife: .24 });
        }
      }
      this.burst(target.x, target.y, '#8ff4ff', 7);
      return;
    }
    if (!hero) return;
    this.zones.push({
      type: 'orbImpact', x: target.x, y: target.y - 20, r: p.type === 'hongyi' ? 62 : 54,
      vfxRow: p.vfxRow || 0, life: .34, maxLife: .34, age: 0
    });
    this.damageEnemy(target, p.damage, hero, { impact: true });
    if (p.type === 'hongyi') {
      var hongyiAttack = heroSkillConfig('hongyi').attack || {};
      this.applyBurn(target, hero,
        p.burnDuration || valueOr(hongyiAttack.burnDuration, 3),
        p.burnDps || this.heroAttackPower(hero) * valueOr(hongyiAttack.burnDpsAtk, .10)
      );
      if (hero.upgrades.attack >= 3) this.damageArea(target.x, target.y, 62, p.damage * .55, hero, 'burn');
    } else if (p.type === 'qingyi') {
      this.zones.push({ type: 'ring', x: target.x, y: target.y, r: 18, color: HERO_META[hero.type].color, life: .38 });
    } else if (p.type === 'suwen') {
      if (hero.upgrades.attack >= 2) {
        var ally = this.lowestHealthHero();
        if (ally) this.healHero(ally, p.damage * .72, hero);
      }
      if (hero.upgrades.attack >= 3) {
        var second = this.secondLowestHealthHero();
        if (second) this.healHero(second, p.damage * .55, hero);
        this.damageArea(target.x, target.y, 48, p.damage * .5, hero, null);
      }
    }
    this.burst(target.x, target.y, p.color, 7);
  };

  Game.prototype.beginSkillMoment = function (hero) {
    var skillNames = {
      hongyi: '焚天火雨！', xuanya: '夜幕收割！', huangjin: '山岳护城！',
      suwen: '回春术！', qingyi: '群体治愈！'
    };
    var color = HERO_META[hero.type].color;
    hero.skillCastFlash = .15;
    hero.skillReadyFlash = .15;
    this.skillVignette = { color: color, life: .3, maxLife: .3 };
    this.floatText(hero.x, hero.y - 142, skillNames[hero.type] || '必杀！', color, 38, {
      life: 1, bold: true, rise: 16
    });
  };

  Game.prototype.beginWallUltimateMoment = function (hero, label, color) {
    color = color || (HERO_META[hero.type] && HERO_META[hero.type].color) || C.gold;
    hero.skillCastFlash = .22;
    hero.skillReadyFlash = .22;
    this.skillVignette = { color: color, life: .36, maxLife: .36 };
    this.floatText(hero.x, hero.y - 142, label || '御灵大招！', color, 36, {
      life: 1, bold: true, rise: 16
    });
  };

  Game.prototype.spiritLineV2UltimateTargets = function (hero, radius, allSectors) {
    var list = [];
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || (!allSectors && enemy.lineSector !== hero.lineSlot)) continue;
      if (distance(hero.x, hero.y, enemy.x, enemy.y) <= radius) list.push(enemy);
    }
    list.sort(function (a, b) {
      var eliteA = a.type === 'boss' ? 3 : a.elite ? 2 : 1;
      var eliteB = b.type === 'boss' ? 3 : b.elite ? 2 : 1;
      return eliteB - eliteA || a.y - b.y;
    });
    return list;
  };

  Game.prototype.castSpiritLineV2Ultimate = function (hero) {
    if (!hero || !hero.alive) return;
    var ultimateLevel = this.spiritLineV2UltimateEnhancementLevel(hero);
    var triggerRadius = hero.type === 'hongyi' ? 1100 : hero.type === 'huangjin' ? 260 : 210;
    var targets = this.spiritLineV2UltimateTargets(hero, triggerRadius, hero.type === 'hongyi');
    var priority = targets[0];
    var hasElite = !!(priority && (priority.elite || priority.type === 'boss'));
    var denseCount = 0, denseTarget = priority;
    if (hero.type === 'hongyi') {
      for (var densityIndex = 0; densityIndex < targets.length; densityIndex++) {
        var densitySource = targets[densityIndex], nearby = 0;
        for (var densityOther = 0; densityOther < targets.length; densityOther++) {
          if (dist2(densitySource.x, densitySource.y, targets[densityOther].x, targets[densityOther].y) <= 360 * 360) nearby++;
        }
        if (nearby > denseCount) { denseCount = nearby; denseTarget = densitySource; }
      }
    }
    if (!priority || (!hasElite && hero.type !== 'hongyi' && targets.length < 3) || (hero.type === 'hongyi' && !hasElite && denseCount < 6)) {
      hero.ultimateCd = .6;
      return;
    }
    var atk = this.heroAttackPower(hero);
    if (hero.type === 'huangjin') {
      this.beginWallUltimateMoment(hero, '岳镇八荒！', C.gold);
      this.damageArea(priority.x, priority.y, 260, atk * 1.50, hero, null, { impact: true, skill: true, noSkillPush: true, noRune: true });
      for (var h = 0; h < this.enemies.length; h++) {
        var stunned = this.enemies[h];
        if (!stunned || stunned.dead || dist2(stunned.x, stunned.y, priority.x, priority.y) > 260 * 260) continue;
        stunned.freeze = Math.max(stunned.freeze || 0, 1.2);
        if (ultimateLevel >= 1) stunned.spiritLineV2StunDamageTaken = Math.max(stunned.spiritLineV2StunDamageTaken || 0, 1.2);
      }
      hero.shield = Math.min(atk * 1.8, Math.max(hero.shield || 0, atk * 1.5));
      hero.spiritLineShieldTime = 6;
      hero.spiritLineShieldBurstReady = true;
      hero.shieldFlash = .55;
      this.zones.push({ type: 'ring', x: priority.x, y: priority.y, r: 260, color: C.gold, life: .64, maxLife: .64 });
      if (ultimateLevel >= 2) {
        this.zones.push({
          type: 'spiritLineUltimateAftershock', x: priority.x, y: priority.y, r: 260,
          damage: atk * .70, hero: hero.id, seal: ultimateLevel >= 3,
          life: 1.2, maxLife: 1.2, fired: false
        });
      }
    } else if (hero.type === 'xuanya') {
      this.beginWallUltimateMoment(hero, '百鬼夜行！', '#f6e7c0');
      var strikeCount = ultimateLevel >= 1 ? 7 : 5;
      var strikeInterval = 1.4 / Math.max(1, strikeCount - 1);
      var facing = Math.atan2(priority.y - hero.y, priority.x - hero.x);
      for (var x = 0; x < strikeCount; x++) {
        var strikeLife = .10 + x * strikeInterval;
        this.zones.push({ type: 'spiritLineUltimateStrike', x: hero.x, y: hero.y - 32, r: 128, hero: hero.id, damage: atk * .60, life: strikeLife, maxLife: strikeLife, fired: false, step: x, steps: strikeCount });
        if (ultimateLevel >= 2) {
          this.zones.push({ type: 'spiritLineUltimateOuterStrike', x: hero.x, y: hero.y - 32, innerR: 150, outerR: 198, hero: hero.id, damage: atk * .35, life: strikeLife, maxLife: strikeLife, fired: false, step: x, steps: strikeCount });
        }
      }
      if (ultimateLevel >= 3) {
        this.zones.push({
          type: 'spiritLineUltimateCrescent', x: hero.x, y: hero.y - 32,
          tx: hero.x + Math.cos(facing) * 120, ty: hero.y - 32 + Math.sin(facing) * 120,
          hitWidth: 22, hero: hero.id, damage: atk, life: 1.58, maxLife: 1.58, fired: false
        });
      }
    } else if (hero.type === 'hongyi') {
      this.beginWallUltimateMoment(hero, '焚天火雨！', C.fire);
      var center = denseTarget || priority;
      if (!center) { hero.ultimateCd = .6; return; }
      var meteorCount = 8 + (ultimateLevel >= 1 ? 2 : 0);
      var trackingCount = hasElite && ultimateLevel >= 2 ? Math.min(4, meteorCount) : 0;
      for (var r = 0; r < meteorCount; r++) {
        var followElite = r < trackingCount;
        var impactCenter = followElite ? priority : center;
        var spread = followElite ? (r === 0 ? 0 : 16 + r * 8) : (r === 0 ? 0 : 36 + (r % 3) * 22);
        var a = r * 2.399;
        this.zones.push({
          type: 'delayedFire', x: impactCenter.x + Math.cos(a) * spread, y: impactCenter.y + Math.sin(a) * spread,
          r: 74, damage: atk * .50, hero: hero.id, life: .28 + r * .075, maxLife: .28 + r * .075,
          fired: false, skill: true, noSkillPush: true, noBurn: true, noScreenShake: true,
          followTarget: followElite ? priority.id : null,
          finalMeteor: ultimateLevel >= 3 && r === meteorCount - 1
        });
      }
    }
    hero.ultimateCd = hero.ultimateMax;
    hero.skillCastFlash = .55;
    hero.attackAnim = .55;
    this.audio.playSfx(hero.type === 'hongyi' ? 'ultimateHongyi' : hero.type === 'huangjin' ? 'ultimateHuangjin' : 'ultimateXuanya') || this.audio.tone('bell');
  };

  Game.prototype.castWallHeroUltimate = function (hero) {
    if (!hero || !hero.alive) return;
    if (!this.isHeroUltimateUnlocked(hero)) { hero.ultimateCd = hero.ultimateMax; return; }
    if (this.isSpiritLineMode() && hero.spiritLineV2) {
      this.castSpiritLineV2Ultimate(hero);
      return;
    }
    var enemies = [];
    for (var i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i] && !this.enemies[i].dead) enemies.push(this.enemies[i]);
    }
    if (!enemies.length) {
      hero.ultimateCd = 1;
      return;
    }

    var color = (HERO_META[hero.type] && HERO_META[hero.type].color) || C.gold;
    var ultimate = heroSkillConfig(hero.type).ultimate || {};
    var atk = this.heroAttackPower(hero);

    if (hero.type === 'hongyi') {
      this.beginWallUltimateMoment(hero, '焚天火雨！', C.fire);
      hero.invuln = Math.max(hero.invuln || 0, valueOr(ultimate.invuln, .3));
      var fireRainLife = valueOr(ultimate.effectLife, 1);
      this.zones.push({ type: 'fireRain', x: W / 2, y: BOARD_H * .47, r: valueOr(ultimate.effectRadius, 520), life: fireRainLife, maxLife: fireRainLife, color: C.fire });
      for (var rain = 0; rain < enemies.length; rain++) {
        var burningEnemy = enemies[rain];
        if (!burningEnemy || burningEnemy.dead) continue;
        var wasBurning = burningEnemy.burn > 0;
        var rainDamage = atk * valueOr(ultimate.damageAtk, 1);
        if (wasBurning) rainDamage += atk * valueOr(ultimate.burningBonusAtk, .45);
        this.damageEnemy(burningEnemy, rainDamage, hero, { impact: true, skill: true });
        this.applyBurn(burningEnemy, hero, valueOr(ultimate.burnDuration, 4), atk * valueOr(ultimate.burnDpsAtk, .16));
      }
      this.shake = Math.max(this.shake, valueOr(ultimate.shake, 9));
    } else if (hero.type === 'huangjin') {
      this.beginWallUltimateMoment(hero, '山岳护城！', C.gold);
      var duration = valueOr(ultimate.duration, 5);
      var shieldCap = Math.max(1, (this.baseMax || 1000) * .35);
      var shieldTarget = (this.baseMax || 1000) * valueOr(ultimate.wallShieldMaxHp, .18);
      var shieldAdd = Math.max(0, Math.min(shieldTarget, shieldCap - (this.wallShield || 0)));
      if (shieldAdd > 0) {
        this.wallShield = (this.wallShield || 0) + shieldAdd;
        this.wallShieldFlash = .48;
        this.floatText(BATTLE_LOWER_ART.healthFrame.x + BATTLE_LOWER_ART.healthFrame.w / 2, BATTLE_LOWER_ART.healthFrame.y - 38, '护城 +' + Math.round(shieldAdd), '#9eefff', 20, { life: .9, bold: true, rise: 18 });
      }
      hero.wallBarrierTime = duration;
      hero.wallBarrierShield = shieldAdd;
      hero.wallBarrierReduction = 0;
      for (var guardIndex = 0; guardIndex < enemies.length; guardIndex++) {
        var guardEnemy = enemies[guardIndex];
        guardEnemy.huangjinHeavySlow = Math.max(guardEnemy.huangjinHeavySlow || 0, valueOr(ultimate.slowDuration, 2.2));
        guardEnemy.freeze = Math.max(guardEnemy.freeze || 0, .12);
      }
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 42, r: valueOr(ultimate.effectRadius, 260), color: C.gold, life: .95, maxLife: .95, hero: hero.id });
      this.shake = Math.max(this.shake, valueOr(ultimate.shake, 6));
    } else if (hero.type === 'xuanya') {
      var target = this.highestThreatEnemy();
      if (!target) { hero.ultimateCd = 1; return; }
      this.beginWallUltimateMoment(hero, '夜幕收割！', color);
      target.flaw = Math.max(target.flaw || 0, valueOr(ultimate.flawDuration, 4));
      target.flawDamageTaken = Math.max(target.flawDamageTaken || 0, valueOr(ultimate.flawDamageTaken, .18));
      target.armorBreak = Math.max(target.armorBreak || 0, valueOr(ultimate.flawDuration, 4));
      target.skillDamageTaken = Math.max(target.skillDamageTaken || 0, valueOr(ultimate.flawDamageTaken, .18));
      var hits = valueOr(ultimate.hits, 3);
      for (var hit = 0; hit < hits && target && !target.dead; hit++) {
        this.releaseXuanyaInstantBlade(hero, hero.x + (hit - 1) * 20, hero.y - 64 - hit * 8, target, atk * valueOr(ultimate.damageAtk, .75), 'xuanyaChase', {
          color: '#f6e7c0', bright: true, canSplit: false, canPierce: false, canChase: false
        });
      }
      var sideTargets = [];
      var sideRadius = valueOr(ultimate.sideTargetRadius, 260);
      for (var side = 0; side < enemies.length; side++) {
        var sideEnemy = enemies[side];
        if (!sideEnemy || sideEnemy.dead || sideEnemy === target) continue;
        if (dist2(target.x, target.y, sideEnemy.x, sideEnemy.y) <= sideRadius * sideRadius) sideTargets.push(sideEnemy);
      }
      sideTargets.sort(function (a, b) {
        return (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp));
      });
      var sideCount = valueOr(ultimate.sideTargets, 2);
      for (var s = 0; s < sideTargets.length && s < sideCount; s++) {
        this.releaseXuanyaInstantBlade(hero, hero.x, hero.y - 58 - s * 12, sideTargets[s], atk * valueOr(ultimate.sideTargetDamageAtk, .70), 'xuanyaChase', {
          color: '#d9c7a6', bright: true, canSplit: false, canPierce: false, canChase: false
        });
      }
      this.shake = Math.max(this.shake, valueOr(ultimate.shake, 5));
    } else if (hero.type === 'suwen') {
      var centerEnemy = this.highestThreatEnemy() || this.densestEnemy();
      if (!centerEnemy) { hero.ultimateCd = 1; return; }
      this.beginWallUltimateMoment(hero, '天命星陨！', color);
      var radius = valueOr(ultimate.radius, 135);
      this.zones.push({ type: 'ring', x: centerEnemy.x, y: centerEnemy.y, r: radius, color: color, life: valueOr(ultimate.effectLife, 1.05), maxLife: valueOr(ultimate.effectLife, 1.05) });
      var starTargets = [];
      for (var si = 0; si < enemies.length; si++) {
        var starTarget = enemies[si];
        if (!starTarget.dead && dist2(centerEnemy.x, centerEnemy.y, starTarget.x, starTarget.y) <= radius * radius) starTargets.push(starTarget);
      }
      starTargets.sort(function (a, b) {
        var priorityA = (a.type === 'boss' ? 3 : a.elite ? 2 : 1) * 100000 + a.hp;
        var priorityB = (b.type === 'boss' ? 3 : b.elite ? 2 : 1) * 100000 + b.hp;
        return priorityB - priorityA;
      });
      var maxStarTargets = valueOr(ultimate.maxTargets, 6);
      var starDamage = atk * valueOr(ultimate.damageAtk, .30) * valueOr(ultimate.hits, 5);
      for (var starIndex = 0; starIndex < starTargets.length && starIndex < maxStarTargets; starIndex++) {
        var selectedStarTarget = starTargets[starIndex];
        selectedStarTarget.armorBreak = Math.max(selectedStarTarget.armorBreak || 0, valueOr(ultimate.breakDuration, 5));
        selectedStarTarget.skillDamageTaken = Math.max(selectedStarTarget.skillDamageTaken || 0, valueOr(ultimate.skillDamageTaken, .10));
        this.damageEnemy(selectedStarTarget, starDamage, hero, { impact: true, skill: true });
        this.zones.push({ type: 'starImpact', x: selectedStarTarget.x, y: selectedStarTarget.y - 18, r: 42, color: color, life: .36, maxLife: .36 });
      }
      this.shake = Math.max(this.shake, valueOr(ultimate.shake, 5));
    } else if (hero.type === 'nuba') {
      if (!this.castNubaUltimate(hero, enemies, ultimate, atk)) { hero.ultimateCd = 1; return; }
    } else if (hero.type === 'qingyi') {
      this.beginWallUltimateMoment(hero, '万灯归阵！', '#9ef8ff');
      var exposeDuration = valueOr(ultimate.exposeDuration, 5);
      var exposeBonus = valueOr(ultimate.exposeDamageBonus, .15);
      for (var qi = 0; qi < enemies.length; qi++) {
        var exposedEnemy = enemies[qi];
        exposedEnemy.qingyiExposeTime = Math.max(exposedEnemy.qingyiExposeTime || 0, exposeDuration);
        exposedEnemy.qingyiExposeBonus = Math.max(exposedEnemy.qingyiExposeBonus || 0, exposeBonus);
        exposedEnemy.qingyiExposeSource = hero.id;
        this.zones.push({ type: 'qingyiMark', x: exposedEnemy.x, y: exposedEnemy.y - 42, r: 32, color: '#9ef8ff', life: .52, maxLife: .52 });
      }
      hero.qingyiGlow = 0;
      hero.qingyiGlowFlash = .6;
      var synergyDuration = valueOr(ultimate.synergyDuration, 3.5);
      for (var allyIndex = 0; allyIndex < this.heroes.length; allyIndex++) {
        var ally = this.heroes[allyIndex];
        if (!ally || !ally.alive) continue;
        ally.qingyiSynergyTime = Math.max(ally.qingyiSynergyTime || 0, synergyDuration);
        ally.qingyiSynergySource = hero.id;
        ally.qingyiSynergyBurstReady = this.rogueLevel('Q03') >= 3;
        ally.qingyiSynergyFlash = .55;
        if (ally.id !== hero.id) this.zones.push({ type: 'qingyiLink', x: hero.x, y: hero.y - 62, tx: ally.x, ty: ally.y - 62, color: '#9ef8ff', life: .48, maxLife: .48 });
      }
      this.zones.push({ type: 'ring', x: W / 2, y: 730, r: valueOr(ultimate.effectRadius, 620), color: '#9ef8ff', life: valueOr(ultimate.effectLife, 1.05), maxLife: valueOr(ultimate.effectLife, 1.05) });
      this.shake = Math.max(this.shake, valueOr(ultimate.shake, 3));
    }

    var nubaCooldownFactor = hero.type === 'nuba'
      ? (this.rogueLevel('N04') >= 1 ? .85 : 1) * (this.nubaStarLevel(hero) >= 10 ? .90 : 1)
      : 1;
    hero.ultimateCd = hero.ultimateMax * nubaCooldownFactor;
    hero.flash = .18;
    hero.attackAnim = .55;
    var wallUltimateSfx = hero.type === 'hongyi' ? 'ultimateHongyi' : hero.type === 'huangjin' ? 'ultimateHuangjin' : hero.type === 'xuanya' ? 'ultimateXuanya' : null;
    if (wallUltimateSfx) this.audio.playSfx(wallUltimateSfx) || this.audio.tone('bell');
    else this.audio.tone('bell');
    this.shake = Math.max(this.shake, 4);
  };

  Game.prototype.castHeroUltimate = function (hero) {
    if (!hero || !hero.alive) return;
    if (!this.isHeroUltimateUnlocked(hero)) { hero.ultimateCd = hero.ultimateMax; return; }
    if (WALL_MODE) {
      this.castWallHeroUltimate(hero);
      return;
    }
    var level = hero.upgrades.ultimate, factor = 1 + level * .35;
    if (hero.type === 'hongyi') {
      if (!this.enemies.length) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var hongyiUltimate = heroSkillConfig('hongyi').ultimate || {};
      var hongyiAtk = this.heroAttackPower(hero);
      hero.invuln = Math.max(hero.invuln, valueOr(hongyiUltimate.invuln, .3));
      var fireRainLife = valueOr(hongyiUltimate.effectLife, .75);
      this.zones.push({ type: 'fireRain', x: W / 2, y: BOARD_H * .48, r: valueOr(hongyiUltimate.effectRadius, 520), life: fireRainLife, maxLife: fireRainLife, color: C.fire });
      for (var rain = this.enemies.length - 1; rain >= 0; rain--) {
        var burningEnemy = this.enemies[rain];
        if (burningEnemy.dead) continue;
        this.damageEnemy(burningEnemy, hongyiAtk * valueOr(hongyiUltimate.damageAtk, 2.5) * factor, hero, { impact: true, skill: true });
        this.applyBurn(burningEnemy, hero, valueOr(hongyiUltimate.burnDuration, 4), hongyiAtk * valueOr(hongyiUltimate.burnDpsAtk, .10));
      }
      this.shake = Math.max(this.shake, valueOr(hongyiUltimate.shake, 9));
    } else if (hero.type === 'qingyi') {
      this.beginSkillMoment(hero);
      var qingyiUltimate = heroSkillConfig('qingyi').ultimate || {};
      var qingyiHeal = this.heroAttackPower(hero) * valueOr(qingyiUltimate.healAtk, 2.5) * factor;
      for (var qi = 0; qi < this.heroes.length; qi++) {
        var ally = this.heroes[qi];
        if (!ally.alive) continue;
        var receivedHeal = qingyiHeal * this.healingReceivedMultiplier(ally, hero);
        this.healHero(ally, qingyiHeal, hero);
        this.addHolyShield(ally, receivedHeal * valueOr(qingyiUltimate.shieldRatio, .6), valueOr(qingyiUltimate.shieldDuration, 4));
      }
      this.zones.push({ type: 'heal', x: W / 2, y: 720, r: valueOr(qingyiUltimate.effectRadius, 210), color: HERO_META[hero.type].color, life: valueOr(qingyiUltimate.effectLife, 1.05) });
      this.shake = Math.max(this.shake, valueOr(qingyiUltimate.shake, 3));
    } else if (hero.type === 'huangjin') {
      this.beginSkillMoment(hero);
      if (hero.wallBarrierShield > 0) this.clearHuangjinWall(hero, true);
      var huangjinUltimate = heroSkillConfig('huangjin').ultimate || {};
      var shieldAmount = hero.maxHp * valueOr(huangjinUltimate.shieldMaxHp, .3);
      hero.shield += shieldAmount;
      hero.shieldFlash = .45;
      hero.wallBarrierShield = shieldAmount;
      hero.wallBarrierTime = valueOr(huangjinUltimate.duration, 6);
      hero.wallBarrierReduction = valueOr(huangjinUltimate.reduction, .25);
      hero.invuln = Math.max(hero.invuln, valueOr(huangjinUltimate.invuln, .15));
      this.floatText(hero.x, hero.y - 116, '山岳护城', C.gold, 24, { life: 1, bold: true, rise: 18 });
      this.zones.push({ type: 'guard', x: hero.x, y: hero.y, r: valueOr(huangjinUltimate.effectRadius, 128), color: C.gold, life: hero.wallBarrierTime, hero: hero.id });
    } else if (hero.type === 'xuanya') {
      var target = this.highestThreatEnemy();
      if (!target) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var hits = 2 + level;
      for (var h = 0; h < hits; h++) this.damageEnemy(target, 75 * factor, hero, h === 0 ? { impact: true, skill: true } : null);
      if (level >= 2) target.armorBreak = 5;
      if (level >= 3) hero.invuln = 1.4;
      hero.x = clamp(target.x + (Math.random() * 50 - 25), 60, 690);
      hero.y = clamp(target.y + 42, 180, 885);
      this.zones.push({ type: 'slash', x: hero.x - 70, y: hero.y, tx: target.x + 70, ty: target.y - 50, color: '#f6e7c0', life: .5 });
    } else {
      this.beginSkillMoment(hero);
      var amount = 95 * factor;
      var targetHero = this.lowestHealthHero();
      if (level >= 2) {
        for (var k = 0; k < this.heroes.length; k++) if (this.heroes[k].alive) this.healHero(this.heroes[k], amount * .72, hero);
      } else if (targetHero) this.healHero(targetHero, amount, hero);
      if (level >= 3) {
        var returning = this.soonestReturningHero();
        if (returning) returning.respawn = Math.max(.4, returning.respawn - 3);
      }
      this.zones.push({ type: 'heal', x: 375, y: 720, r: 150, color: C.jade, life: 1.2 });
    }
    hero.ultimateCd = hero.type === 'huangjin' ? hero.ultimateMax : hero.ultimateMax * (1 - Math.min(.24, level * .08));
    hero.flash = .18; hero.attackAnim = .55; this.audio.tone('bell'); this.shake = 4;
  };

  // 1-2 新版三英雄：基础攻击和默认连携独立于旧城墙技能树。
  // 所有局内强化都只读取 V2 专属牌，避免旧黄巾控场、红衣灼烧、玄鸦飞刀逻辑串入试验关。
  Game.prototype.spiritLineV2Level = function (id) {
    return this.isSpiritLineMode() ? this.rogueLevel(id) : 0;
  };

  Game.prototype.spiritLineV2TargetsInCone = function (hero, target, radius, angleDegrees) {
    if (!hero || !target) return [];
    var dx = target.x - hero.x, dy = target.y - hero.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    var minDot = Math.cos((angleDegrees || 90) * Math.PI / 360);
    var list = [];
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.lineSector !== hero.lineSlot) continue;
      var ex = enemy.x - hero.x, ey = enemy.y - hero.y;
      var d = Math.sqrt(ex * ex + ey * ey) || 1;
      if (d > radius) continue;
      if ((ex * ux + ey * uy) / d < minDot) continue;
      list.push({ enemy: enemy, distance: d });
    }
    list.sort(function (a, b) { return a.distance - b.distance; });
    return list;
  };

  Game.prototype.spiritLineV2ChooseTargets = function (hero, firstTarget, count, independent) {
    var list = [], used = {}, candidates = [];
    if (firstTarget && !firstTarget.dead) {
      list.push(firstTarget);
      used[firstTarget.id] = true;
    }
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.lineSector !== hero.lineSlot || used[enemy.id]) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d <= hero.attackRange + 80) candidates.push({ enemy: enemy, score: this.wallEnemyDistanceToDefense(enemy) + d * .08 });
    }
    candidates.sort(function (a, b) { return a.score - b.score; });
    for (var j = 0; list.length < count && j < candidates.length; j++) {
      if (!independent && list.length) { list.push(list[0]); continue; }
      list.push(candidates[j].enemy);
    }
    while (list.length < count && firstTarget) list.push(firstTarget);
    return list;
  };

  Game.prototype.addSpiritLineV2HuangjinShield = function (hero, amount) {
    if (!hero || amount <= 0) return;
    var hadShield = hero.shield > .5 && hero.spiritLineShieldTime > 0;
    var cap = this.heroAttackPower(hero) * 1.8;
    hero.shield = Math.min(cap, Math.max(0, hero.shield || 0) + amount);
    hero.spiritLineShieldTime = 6;
    hero.spiritLineShieldBurstReady = true;
    hero.shieldFlash = .42;
    if (this.spiritLineV2Level('V2H02') >= 2) {
      this.damageArea(hero.x, hero.y - 20, 70, this.heroAttackPower(hero) * .35, hero, null, { impact: true, noRune: true });
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 24, r: 70, color: '#f4c85b', life: .32, maxLife: .32 });
      this.floatText(hero.x, hero.y - 112, hadShield ? '镇甲刷新' : '镇甲生成', C.gold, 17, { life: .65, bold: true, rise: 12 });
    }
  };

  Game.prototype.finishSpiritLineV2HuangjinShield = function (hero) {
    if (!hero || !hero.spiritLineShieldBurstReady) return;
    hero.spiritLineShieldBurstReady = false;
    if (this.spiritLineV2Level('V2H02') < 3) return;
    this.damageArea(hero.x, hero.y - 20, 90, this.heroAttackPower(hero) * .45, hero, null, { impact: true, noRune: true });
    this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 22, r: 90, color: '#f4c85b', life: .48, maxLife: .48 });
    this.floatText(hero.x, hero.y - 118, '镇甲爆开', C.gold, 18, { life: .72, bold: true, rise: 14 });
  };

  Game.prototype.updateSpiritLineV2HeroState = function (hero, dt) {
    if (hero.type === 'huangjin') {
      hero.spiritLineShieldTime = Math.max(0, (hero.spiritLineShieldTime || 0) - dt);
      if (hero.spiritLineShieldTime <= 0 && hero.spiritLineShieldBurstReady) {
        hero.shield = 0;
        this.finishSpiritLineV2HuangjinShield(hero);
      } else if (hero.spiritLineShieldTime > 0 && hero.shield <= .5 && hero.spiritLineShieldBurstReady) {
        this.finishSpiritLineV2HuangjinShield(hero);
        hero.spiritLineShieldTime = 0;
      }
    } else if (hero.type === 'xuanya') {
      hero.spiritLineXuanyaEmpoweredTime = Math.max(0, (hero.spiritLineXuanyaEmpoweredTime || 0) - dt);
      hero.spiritLineXuanyaEmpoweredFlash = Math.max(0, (hero.spiritLineXuanyaEmpoweredFlash || 0) - dt);
    } else if (hero.type === 'hongyi') {
      hero.spiritLineLanceFlash = Math.max(0, (hero.spiritLineLanceFlash || 0) - dt);
    }
  };

  Game.prototype.releaseSpiritLineV2Attack = function (hero, target) {
    if (!hero || !target || target.dead) return;
    hero.attackCount = (hero.attackCount || 0) + 1;
    var attackPower = this.heroAttackPower(hero);
    var angle = Math.atan2(target.y - hero.y, target.x - hero.x);

    if (hero.type === 'huangjin') {
      var shielded = hero.shield > .5 && hero.spiritLineShieldTime > 0;
      var huangjinDamage = attackPower * (.85 + (this.spiritLineV2Level('V2H01') >= 1 ? .25 : 0) + (shielded && this.spiritLineV2Level('V2H02') >= 1 ? .25 : 0));
      var huangjinTargets = this.spiritLineV2TargetsInCone(hero, target, 160, 90);
      var huangjinDealt = 0;
      for (var h = 0; h < huangjinTargets.length; h++) {
        huangjinDealt += this.damageEnemy(huangjinTargets[h].enemy, huangjinDamage, hero, { impact: true, noRune: true }) || 0;
      }
      if (huangjinDealt > 0) this.addSpiritLineV2HuangjinShield(hero, huangjinDealt * .25);
      this.zones.push({ type: 'meleeSlash', x: hero.x, y: hero.y - 28, angle: angle, r: 86, color: C.gold, life: .38, maxLife: .38, age: 0, vfxRow: 1 });
      if (this.spiritLineV2Level('V2H01') >= 2) {
        this.zones.push({ type: 'spiritLineAftershock', x: target.x, y: target.y - 16, r: 72, damage: attackPower * .50, hero: hero.id, angle: angle, life: .50, maxLife: .50, fired: false });
        this.zones.push({ type: 'ring', x: target.x, y: target.y - 16, r: 72, color: C.gold, life: .50, maxLife: .50 });
      }
      this.audio.tone('shoot');
      return;
    }

    if (hero.type === 'xuanya') {
      var empowered = hero.spiritLineXuanyaEmpoweredTime > 0;
      hero.spiritLineXuanyaEmpoweredTime = 0;
      var xuanDamage = attackPower * (this.spiritLineV2Level('V2X01') >= 1 ? 1.20 : 1) * (empowered ? 1.50 : 1);
      var xuanAngle = this.spiritLineV2Level('V2X01') >= 2 ? 165 : 120;
      var xuanTargets = this.spiritLineV2TargetsInCone(hero, target, 150, xuanAngle);
      var killed = [], hits = 0;
      for (var x = 0; x < xuanTargets.length; x++) {
        var xuanEnemy = xuanTargets[x].enemy;
        var xuanDealt = this.damageEnemy(xuanEnemy, xuanDamage, hero, { impact: true, noRune: true }) || 0;
        if (xuanDealt > 0) this.healHero(hero, xuanDealt * .15, hero);
        hits++;
        if (xuanEnemy.dead) killed.push({ x: xuanEnemy.x, y: xuanEnemy.y });
      }
      if (killed.length) {
        hero.spiritLineXuanyaEmpoweredTime = 4;
        hero.spiritLineXuanyaEmpoweredFlash = .55;
        this.floatText(hero.x, hero.y - 116, '饮血 · 追斩', '#ff866f', 18, { life: .70, bold: true, rise: 13 });
      }
      this.zones.push({ type: 'meleeSlash', x: hero.x, y: hero.y - 30, angle: angle, r: 118, color: empowered ? '#ff8d72' : '#f6e7c0', life: .42, maxLife: .42, age: 0, vfxRow: 0 });
      if (this.spiritLineV2Level('V2X01') >= 3 && hits >= 3) {
        var crescentX = hero.x + Math.cos(angle) * 86;
        var crescentY = hero.y - 28 + Math.sin(angle) * 86;
        this.zones.push({ type: 'spiritLineCrescent', x: crescentX, y: crescentY, r: 72, damage: attackPower * .80, hero: hero.id, life: .14, maxLife: .14, fired: false });
        this.zones.push({ type: 'xuanSlash', x: hero.x, y: hero.y - 30, tx: crescentX, ty: crescentY, color: '#f6e7c0', life: .30, maxLife: .30, primary: false, bright: true, age: 0 });
      }
      if (this.spiritLineV2Level('V2X02') >= 1) {
        for (var k = 0; k < killed.length; k++) this.spawnSpiritLineV2BloodZone(hero, killed[k].x, killed[k].y);
      }
      this.audio.tone('shoot');
      return;
    }

    // 红衣：每轮基础三羽，四枚符印累计满后追加贯日符。没有基础灼烧/火区。
    var redLevel = this.spiritLineV2Level('V2R01');
    var featherCount = redLevel >= 1 ? 4 : 3;
    var independent = redLevel >= 2;
    var redTargets = this.spiritLineV2ChooseTargets(hero, target, featherCount, independent);
    for (var r = 0; r < redTargets.length; r++) {
      var redTarget = redTargets[r];
      this.launchSpiritLineV2HongyiProjectile(hero, redTarget, attackPower * .45, {
        lastFeather: redLevel >= 3 && r === redTargets.length - 1,
        speed: 620, delay: r * .08,
        color: C.fire
      });
    }
    hero.spiritLineVolley = (hero.spiritLineVolley || 0) + 1;
    var lanceNeed = this.spiritLineV2Level('V2R02') >= 1 ? 3 : 4;
    if (hero.spiritLineVolley >= lanceNeed) {
      hero.spiritLineVolley = 0;
      hero.spiritLineLanceFlash = .48;
      this.launchSpiritLineV2HongyiProjectile(hero, target, attackPower * .70, {
        lance: true,
        speed: 760,
        color: '#ffd46e',
        maxDistance: 930,
        sideFeathers: this.spiritLineV2Level('V2R02') >= 2,
        finishSplash: this.spiritLineV2Level('V2R02') >= 3
      });
      this.floatText(hero.x, hero.y - 116, '贯日符', '#ffd46e', 20, { life: .72, bold: true, rise: 14 });
    }
    this.zones.push({ type: 'xuanCast', x: hero.x, y: hero.y - 58, r: 23, color: C.fire, life: .20, maxLife: .20 });
    this.audio.tone('shoot');
  };

  Game.prototype.launchSpiritLineV2HongyiProjectile = function (hero, target, damage, options) {
    if (!hero || !target || target.dead) return;
    options = options || {};
    var startX = options.startX == null ? hero.x : options.startX;
    var startY = options.startY == null ? hero.y - 48 : options.startY;
    var projectile = {
      x: startX, y: startY, prevX: startX, prevY: startY,
      target: target.id, hero: hero.id, type: 'hongyiFan', spiritLineV2: true,
      spiritLineKind: options.lance ? 'lance' : 'feather', speed: options.speed || 620,
      damage: damage, color: options.color || C.fire, r: options.lance ? 8 : 6,
      hitWidth: options.lance ? 12 : 8, life: 2.2, age: 0, primary: true,
      launchDelay: Math.max(0, options.delay || 0),
      lastFeather: !!options.lastFeather, sideFeathers: !!options.sideFeathers,
      finishSplash: !!options.finishSplash, maxDistance: options.maxDistance || hero.attackRange,
      hitIds: [], aimX: target.x, aimY: target.y
    };
    this.prepareProjectileFreeFlight(projectile, target, projectile.maxDistance);
    this.projectiles.push(projectile);
  };

  Game.prototype.spawnSpiritLineV2MeteorScatter = function (hero, x, y) {
    if (!hero) return;
    for (var i = 0; i < 6; i++) {
      var angle = -Math.PI / 2 + i * Math.PI / 3;
      var aim = { x: x + Math.cos(angle) * 175, y: y + Math.sin(angle) * 175, dead: false };
      this.launchSpiritLineV2HongyiProjectile(hero, aim, this.heroAttackPower(hero) * .40, {
        startX: x, startY: y, speed: 760, color: '#ffb45c', maxDistance: 180
      });
    }
    this.floatText(x, y - 74, '坠天散羽', '#ffd46e', 18, { life: .7, bold: true, rise: 12 });
  };

  Game.prototype.spiritLineV2ProjectileHits = function (projectile) {
    var hits = [], seen = {}, ax = projectile.prevX == null ? projectile.x : projectile.prevX;
    var ay = projectile.prevY == null ? projectile.y : projectile.prevY;
    var bx = projectile.x, by = projectile.y;
    for (var known = 0; known < (projectile.hitIds || []).length; known++) seen[projectile.hitIds[known]] = true;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || seen[enemy.id]) continue;
      // 碰撞半径严格贴合羽刃 / 符枪宽度，避免出现特效没擦到却受击的情况。
      var hitRadius = Math.max(9, (projectile.hitWidth || projectile.r || 6) + (enemy.size || 1) * 9);
      var d2 = this.segmentDistanceSquared(enemy.x, enemy.y - 18, ax, ay, bx, by);
      if (d2 <= hitRadius * hitRadius) hits.push(enemy);
    }
    hits.sort(function (a, b) {
      return dist2(a.x, a.y, ax, ay) - dist2(b.x, b.y, ax, ay);
    });
    return hits;
  };

  Game.prototype.spawnSpiritLineV2BloodZone = function (hero, x, y) {
    if (!hero) return;
    var level = this.spiritLineV2Level('V2X02');
    if (level < 1) return;
    var radius = 54 * (level >= 2 ? 1.20 : 1);
    this.zones.push({
      type: 'spiritLineBloodZone', x: x, y: y - 16, r: radius, hero: hero.id,
      tick: 0, life: 1.5, maxLife: 1.5, damage: this.heroAttackPower(hero) * .30,
      slowMultiplier: level >= 2 ? .65 : .80, explode: level >= 3, fired: false
    });
    this.zones.push({ type: 'ring', x: x, y: y - 16, r: radius, color: '#c65d58', life: 1.5, maxLife: 1.5 });
  };

  Game.prototype.updateSpiritLineV2Projectile = function (projectile, dt) {
    projectile.life -= dt;
    projectile.age = (projectile.age || 0) + dt;
    if (projectile.life <= 0 || !this.advanceProjectileFreeFlight(projectile, dt)) {
      this.finishSpiritLineV2Projectile(projectile);
      return true;
    }
    this.emitHongyiProjectileTrail(projectile, dt);
    var hits = this.spiritLineV2ProjectileHits(projectile);
    for (var i = 0; i < hits.length; i++) {
      var enemy = hits[i];
      projectile.hitIds.push(enemy.id);
      this.damageEnemy(enemy, projectile.damage, this.getHero(projectile.hero), { impact: true, noRune: true });
      this.zones.push({ type: 'orbImpact', x: enemy.x, y: enemy.y - 20, r: projectile.spiritLineKind === 'lance' ? 54 : 38, vfxRow: 0, life: .25, maxLife: .25, age: 0, hongyi: true });
      if (projectile.lastFeather) {
        this.damageArea(enemy.x, enemy.y, 55, this.heroAttackPower(this.getHero(projectile.hero)) * .35, this.getHero(projectile.hero), null, { impact: true, noRune: true });
        this.zones.push({ type: 'ring', x: enemy.x, y: enemy.y - 16, r: 55, color: C.fire, life: .28, maxLife: .28 });
      }
      if (projectile.sideFeathers) {
        var owner = this.getHero(projectile.hero);
        if (owner) {
          var dx = projectile.freeVx || 0, dy = projectile.freeVy || -1;
          var px = -dy, py = dx;
          for (var side = -1; side <= 1; side += 2) {
            var sideAim = { x: enemy.x + px * side * 72 + dx * 64, y: enemy.y + py * side * 72 + dy * 64, id: enemy.id, dead: false };
            this.launchSpiritLineV2HongyiProjectile(owner, sideAim, this.heroAttackPower(owner) * .35, { speed: 680, color: '#ff994c', maxDistance: 150 });
          }
        }
      }
      if (projectile.spiritLineKind !== 'lance') return true;
      if (enemy.elite || enemy.type === 'boss') projectile.finishSplash = true;
    }
    return false;
  };

  Game.prototype.finishSpiritLineV2Projectile = function (projectile) {
    if (!projectile || projectile.finished) return;
    projectile.finished = true;
    if (projectile.spiritLineKind !== 'lance' || !projectile.finishSplash) return;
    var owner = this.getHero(projectile.hero);
    if (!owner) return;
    this.damageArea(projectile.x, projectile.y, 90, this.heroAttackPower(owner) * .60, owner, null, { impact: true, noRune: true });
    this.zones.push({ type: 'ring', x: projectile.x, y: projectile.y, r: 90, color: '#ffd46e', life: .42, maxLife: .42 });
  };

  Game.prototype.releaseHeroAttack = function (hero, target) {
    hero.attackAnim = hero.attackRecoveryDuration || .34;
    hero.hitHold = .06;
    if (this.isSpiritLineMode() && hero.spiritLineV2) {
      this.releaseSpiritLineV2Attack(hero, target);
      return;
    }
    if (WALL_MODE) {
      var wallAim = target || this.wallUntargetedAimPoint(hero);
      if (hero.type === 'huangjin') {
        this.releaseWallHuangjinAttack(hero, wallAim);
        this.onRuneBasicAttack(hero, wallAim && wallAim.id ? wallAim : null, wallAim, this.heroAttackPower(hero));
        return;
      }
      if (hero.type === 'nuba') {
        this.releaseNubaAttack(hero, target, wallAim);
        this.onRuneBasicAttack(hero, target && target.id ? target : null, wallAim, this.heroAttackPower(hero));
        this.audio.tone('shoot');
        return;
      }
      hero.attackCount = (hero.attackCount || 0) + 1;
      var wallAttackPower = this.heroAttackPower(hero);
      var wallDamage = Math.max(1, wallAttackPower * hero.attackMultiplier);
      var wallColor = HERO_META[hero.type].color;
      var wallIsHongyi = hero.type === 'hongyi';
      var wallHongyiAttack = wallIsHongyi ? (heroSkillConfig('hongyi').attack || {}) : {};
      var wallHongyiPassive = wallIsHongyi ? (heroSkillConfig('hongyi').passive || {}) : {};
      var wallHongyiLotus = wallIsHongyi && (hero.hongyiSigils || 0) >= this.hongyiSigilRequirement(hero);
      if (wallHongyiLotus) {
        this.consumeHongyiSigilsForLotus(hero);
        wallDamage = Math.max(1, wallAttackPower * (this.hongyiStarLevel(hero) >= 7
          ? valueOr(wallHongyiPassive.starLotusDamageAtk, 1.8)
          : valueOr(wallHongyiPassive.lotusDamageAtk, 1.5)));
        wallColor = '#ff5a30';
      }
      if (hero.type === 'xuanya') {
        if (target && !target.dead) {
          var empoweredBlade = this.consumeXuanyaEmpoweredBlade(hero);
          var xuanProjectile = {
            x: hero.x, y: hero.y - 52,
            prevX: hero.x, prevY: hero.y - 52,
            target: target.id, hero: hero.id,
            type: 'xuanya',
            speed: Math.max(680, hero.projectileSpeed || 0),
            damage: wallDamage,
            color: wallColor,
            r: empoweredBlade ? 12 : 9,
            life: 2.2, age: 0,
            primary: true, canSplit: true, canPierce: true, canChase: true,
            empowered: empoweredBlade,
            aimX: wallAim.x, aimY: wallAim.y
          };
          this.prepareProjectileFreeFlight(xuanProjectile, wallAim, hero.attackRange || 850);
          this.projectiles.push(xuanProjectile);
          this.zones.push({ type: 'xuanCast', x: hero.x, y: hero.y - 62, r: empoweredBlade ? 34 : 24, color: wallColor, life: .24, maxLife: .24 });
        } else {
          this.pushXuanyaSlash(hero.x, hero.y - 52, wallAim.x, wallAim.y - 18, 'xuanya', { primary: true, color: wallColor });
        }
        this.onRuneBasicAttack(hero, target, wallAim, wallAttackPower);
        this.audio.tone('shoot');
        return;
      }
      if (hero.type === 'suwen') {
        var suwenFocus = !!hero.suwenFocusReady;
        this.releaseSuwenFallingNeedle(hero, target, wallDamage, {
          type: 'suwenNeedle', primary: true, focus: suwenFocus,
          aimX: wallAim.x, aimY: wallAim.y,
          color: wallColor
        });
        this.onRuneBasicAttack(hero, target, wallAim, wallAttackPower);
        this.burst(hero.x + hero.attackFacing * 10, hero.y - 72, wallColor, suwenFocus ? 8 : 4);
        this.audio.tone('shoot');
        return;
      }
      if (hero.type === 'qingyi') {
        var qingyiAttack = heroSkillConfig('qingyi').attack || {};
        this.releaseQingyiLamp(hero, target, wallAttackPower * valueOr(qingyiAttack.damageAtk, .6), wallAim);
        this.onRuneBasicAttack(hero, target, wallAim, wallAttackPower);
        this.burst(hero.x + hero.attackFacing * 10, hero.y - 72, wallColor, 4);
        this.audio.tone('shoot');
        return;
      }
      if (wallIsHongyi) {
        this.releaseWallHongyiFanAttack(hero, target, wallAim, wallDamage, wallHongyiLotus);
        this.onRuneBasicAttack(hero, target, wallAim, wallAttackPower);
        this.burst(hero.x + hero.attackFacing * 18, hero.y - 54, wallColor, this.rogueLevel('E14') >= 1 ? 7 : 4);
        this.audio.tone('shoot');
        return;
      }
      var wallProjectile = {
        x: hero.x, y: hero.y - 48, target: target ? target.id : null, hero: hero.id,
        type: wallHongyiLotus ? 'hongyiLotus' : hero.type,
        speed: Math.max(460, hero.projectileSpeed || 0), damage: wallDamage, color: wallColor,
        burnDuration: wallIsHongyi ? valueOr(wallHongyiAttack.burnDuration, 2) : 0,
        burnDps: wallIsHongyi ? wallAttackPower * valueOr(wallHongyiAttack.burnDpsAtk, .20) : 0,
        r: wallIsHongyi ? (wallHongyiLotus ? 14 : 9) : 6,
        life: 2.4, age: 0, primary: true, canSplit: false,
        lotus: wallHongyiLotus,
        splashEnabled: true,
        vfxRow: hero.type === 'hongyi' ? 0 : hero.type === 'suwen' ? 1 : 2,
        prevX: hero.x, prevY: hero.y - 48,
        aimX: wallAim.x, aimY: wallAim.y
      };
      this.prepareProjectileFreeFlight(wallProjectile, wallAim, hero.attackRange || 800);
      this.projectiles.push(wallProjectile);
      this.onRuneBasicAttack(hero, target, wallAim, wallAttackPower);
      this.burst(hero.x + hero.attackFacing * 18, hero.y - 54, wallColor, 4);
      this.audio.tone('shoot');
      return;
    }
    var attackPower = this.heroAttackPower(hero);
    var damage = attackPower * hero.attackMultiplier;
    hero.attackCount++;
    if (hero.faction === '妖族' && this.rogueLevel('F06') > 0 && hero.attackCount % 3 === 0) {
      damage += attackPower * this.upgradeValue('F06', [.40, .65, .90], 0);
      this.floatText(hero.x, hero.y - 122, '野性连击', HERO_META[hero.type].color, 20, { life: .75, bold: true });
      if (this.rogueLevel('F06') >= 3) this.damageArea(target.x, target.y, 64, attackPower * .40, hero, null, { impact: true });
    }
    if (hero.type === 'xuanya') {
      var xuanAttack = heroSkillConfig('xuanya').attack || {};
      if (target.hp / Math.max(1, target.maxHp) < valueOr(xuanAttack.executeThreshold, .35)) {
        damage *= 1 + valueOr(xuanAttack.executeDamageBonus, .20);
      }
      if (this.rogueLevel('E07') > 0 && hero.attackCount % 4 === 0) {
        damage += attackPower * this.upgradeValue('E07', [.60, 1.00, 1.40], 0);
      }
      this.damageEnemy(target, damage, hero, { impact: true });
      if (this.rogueLevel('E07') >= 3) this.damageArea(target.x, target.y, 70, attackPower * .55, hero, null, { impact: true });
      if (!target.dead) {
        target.bleed = Math.max(target.bleed || 0, valueOr(xuanAttack.bleedDuration, 2));
        target.bleedDps = Math.max(target.bleedDps || 0, attackPower * valueOr(xuanAttack.bleedDpsAtk, .12));
        target.bleedSource = hero.id;
      }
      this.zones.push({ type: 'meleeSlash', x: hero.x, y: hero.y - 30, angle: Math.atan2(target.y - hero.y, target.x - hero.x), r: 54, color: '#f6e7c0', life: .40, maxLife: .40, age: 0, vfxRow: 0 });
    } else if (hero.type === 'huangjin') {
      var huangjinAttack = heroSkillConfig('huangjin').attack || {};
      this.damageEnemy(target, damage, hero, { impact: true });
      var bashAngle = Math.atan2(target.y - hero.y, target.x - hero.x);
      this.zones.push({ type: 'meleeSlash', x: hero.x, y: hero.y - 24, angle: bashAngle, r: 82, color: C.gold, life: .42, maxLife: .42, age: 0, vfxRow: 1 });
      this.zones.push({ type: 'shieldBashImpact', x: target.x, y: target.y - 12, angle: bashAngle, r: 72, color: C.gold, life: .34, maxLife: .34, age: 0 });
      this.impactPause(.045, 0);
      var e01Level = this.rogueLevel('E01');
      if (e01Level >= 1) {
        var secondary = null, secondaryDistance = 96 * 96;
        for (var shieldIndex = 0; shieldIndex < this.enemies.length; shieldIndex++) {
          var shieldTarget = this.enemies[shieldIndex];
          if (shieldTarget.dead || shieldTarget === target) continue;
          var shieldDistance = dist2(target.x, target.y, shieldTarget.x, shieldTarget.y);
          if (shieldDistance < secondaryDistance && distance(hero.x, hero.y, shieldTarget.x, shieldTarget.y) <= hero.attackRange + 90) {
            secondaryDistance = shieldDistance; secondary = shieldTarget;
          }
        }
        if (secondary) {
          this.damageEnemy(secondary, attackPower, hero, { impact: true });
          this.burst(secondary.x, secondary.y - 18, C.gold, 8);
        }
      }
      if (e01Level >= 3 && hero.attackCount % 3 === 0) {
        this.damageArea(target.x, target.y, 105, attackPower * .80, hero, null, { impact: true });
        for (var stunIndex = 0; stunIndex < this.enemies.length; stunIndex++) {
          var stunTarget = this.enemies[stunIndex];
          if (!stunTarget.dead && dist2(target.x, target.y, stunTarget.x, stunTarget.y) <= 105 * 105) {
            stunTarget.freeze = Math.max(stunTarget.freeze || 0, .4);
          }
        }
        this.zones.push({ type: 'shieldQuake', x: target.x, y: target.y, r: 105, color: C.gold, life: .5, maxLife: .5 });
        this.floatText(target.x, target.y - 78, '地裂盾击', C.gold, 21, { life: .8, bold: true, impact: true });
      }
      var knockChance = e01Level >= 2 ? .55 : valueOr(huangjinAttack.knockbackChance, .3);
      if (Math.random() < knockChance && !target.dead) {
        target.blocker = null;
        target.y = Math.max(0, target.y - valueOr(huangjinAttack.knockbackDistance, 62));
        target.hit = Math.max(target.hit || 0, .16);
        target.redFlash = .1;
        this.floatText(target.x, target.y - 64, '击退', C.gold, 18, { bold: true, rise: 18 });
        this.burst(target.x, target.y - 10, C.gold, 10);
      }
    } else {
      var hongyiAttack = heroSkillConfig('hongyi').attack || {};
      var projectileRadius = hero.type === 'hongyi' ? 9 : 7;
      if (hero.type === 'hongyi' && hero.emberStacks >= valueOr(heroSkillConfig('hongyi').passive && heroSkillConfig('hongyi').passive.maxBurningStacks, 5)) {
        projectileRadius *= valueOr(heroSkillConfig('hongyi').passive && heroSkillConfig('hongyi').passive.fullStackProjectileScale, 1.2);
      }
      this.projectiles.push({
        x: hero.x, y: hero.y - 34, target: target.id, hero: hero.id, type: hero.type,
        speed: hero.projectileSpeed,
        damage: damage, color: HERO_META[hero.type].color,
        burnDuration: hero.type === 'hongyi' ? valueOr(hongyiAttack.burnDuration, 3) : 0,
        burnDps: hero.type === 'hongyi' ? attackPower * valueOr(hongyiAttack.burnDpsAtk, .10) : 0,
        r: projectileRadius, life: 2.4, age: 0, primary: true, canSplit: true,
        vfxRow: hero.type === 'hongyi' ? 0 : hero.type === 'suwen' ? 1 : 2,
        prevX: hero.x, prevY: hero.y - 34
      });
      this.burst(hero.x + hero.attackFacing * 24, hero.y - 48, HERO_META[hero.type].color, 5);
    }
    this.audio.tone('shoot');
  };

  Game.prototype.huangjinControlScale = function (enemy) {
    if (!enemy) return 1;
    var attack = heroSkillConfig('huangjin').attack || {};
    var fatigue = clamp(enemy.huangjinControlFatigue || 0, 0, valueOr(attack.controlFatigueMaxStacks, 3));
    return Math.max(
      valueOr(attack.controlFatigueMinScale, .25),
      1 - fatigue * valueOr(attack.controlFatiguePerStack, .28)
    );
  };

  Game.prototype.addHuangjinControlFatigue = function (enemy, amount) {
    if (!enemy || enemy.dead) return;
    var attack = heroSkillConfig('huangjin').attack || {};
    enemy.huangjinControlFatigue = Math.min(
      valueOr(attack.controlFatigueMaxStacks, 3),
      (enemy.huangjinControlFatigue || 0) + (amount == null ? 1 : amount)
    );
    enemy.huangjinControlFatigueTime = valueOr(attack.controlFatigueDuration, 2.6);
  };

  Game.prototype.wallHuangjinKnockback = function (enemy, distanceValue, stunDuration) {
    if (!enemy || enemy.dead) return;
    var scaledDistance = Math.max(0, distanceValue || 0);
    enemy.blocker = null;
    enemy.y = Math.max(0, enemy.y - scaledDistance);
    enemy.hit = Math.max(enemy.hit || 0, .18);
    enemy.redFlash = .12;
    if (stunDuration > 0) enemy.freeze = Math.max(enemy.freeze || 0, stunDuration);
  };

  Game.prototype.huangjinGatherRadius = function () {
    var passive = heroSkillConfig('huangjin').passive || {};
    return this.rogueLevel('E12') >= 2
      ? valueOr(passive.upgradedGatherRadius, 170)
      : valueOr(passive.gatherRadius, 140);
  };

  Game.prototype.triggerHuangjinGather = function (hero, centerEnemy) {
    if (!hero || !centerEnemy || centerEnemy.dead) return;
    if (this.rogueLevel('E12') < 1) return;
    var passive = heroSkillConfig('huangjin').passive || {};
    var radius = this.huangjinGatherRadius();
    var pullDistance = valueOr(passive.gatherPullDistance, 45);
    var gatherLevel = this.rogueLevel('E12');
    this.zones.push({ type: 'huangjinWallSeal', x: centerEnemy.x, y: centerEnemy.y - 4, r: radius, life: .58, maxLife: .58 });
    this.burst(centerEnemy.x, centerEnemy.y - 8, C.gold, 12);
    this.floatText(centerEnemy.x, centerEnemy.y - 62, '聚山', C.gold, 17, { life: .62, bold: true, rise: 12 });
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy === centerEnemy) continue;
      var d2 = dist2(enemy.x, enemy.y, centerEnemy.x, centerEnemy.y);
      if (d2 > radius * radius) continue;
      var d = Math.sqrt(d2) || 1;
      var pull = Math.min(pullDistance, Math.max(0, d - 18)) * this.huangjinControlScale(enemy);
      enemy.x = clamp(enemy.x + (centerEnemy.x - enemy.x) / d * pull, 28, W - 28);
      enemy.y = Math.min(this.wallEnemyBreachCenterY(enemy), enemy.y + (centerEnemy.y - enemy.y) / d * pull);
      if (pull > 0) this.addHuangjinControlFatigue(enemy, .75);
      enemy.hit = Math.max(enemy.hit || 0, .12);
      enemy.redFlash = Math.max(enemy.redFlash || 0, .08);
      if (gatherLevel >= 2) enemy.huangjinGatherSlow = Math.max(enemy.huangjinGatherSlow || 0, valueOr(passive.gatherSlowDuration, 1));
    }
    if (gatherLevel >= 3) {
      this.zones.push({
        type: 'huangjinHeart',
        hero: hero.id,
        x: centerEnemy.x, y: centerEnemy.y,
        r: radius,
        suppressBonus: valueOr(passive.heartSuppressBonus, 1),
        life: valueOr(passive.heartDuration, 1),
        maxLife: valueOr(passive.heartDuration, 1)
      });
    }
  };

  Game.prototype.triggerHuangjinSuppressPeak = function (hero, enemy) {
    if (!hero || !enemy || enemy.dead) return;
    var passive = heroSkillConfig('huangjin').passive || {};
    var attack = heroSkillConfig('huangjin').attack || {};
    enemy.huangjinGatherCd = valueOr(passive.gatherCooldown, 4);
    if (this.rogueLevel('E12') >= 1) {
      this.triggerHuangjinGather(hero, enemy);
    } else {
      enemy.huangjinHeavySlow = Math.max(enemy.huangjinHeavySlow || 0, valueOr(attack.suppressPeakSlowDuration, 1));
      this.burst(enemy.x, enemy.y - 8, C.gold, 7);
      this.floatText(enemy.x, enemy.y - 62, '沉重', C.gold, 17, { life: .62, bold: true, rise: 12 });
    }
  };

  Game.prototype.addHuangjinSuppress = function (enemy, hero, amount, options) {
    if (!enemy || enemy.dead || !hero || hero.type !== 'huangjin') return 0;
    options = options || {};
    var attack = heroSkillConfig('huangjin').attack || {};
    var maxStacks = valueOr(attack.suppressMaxStacks, 3);
    var before = clamp(enemy.huangjinSuppressStacks || 0, 0, maxStacks);
    var after = clamp(before + Math.max(1, amount || 1), 0, maxStacks);
    enemy.huangjinSuppressStacks = after;
    var duration = valueOr(attack.suppressDuration, 4)
      + (this.rogueLevel('E13') >= 1 ? valueOr(attack.heavySuppressDurationBonus, 1) : 0);
    enemy.huangjinSuppressTime = Math.max(enemy.huangjinSuppressTime || 0, duration);
    enemy.huangjinSuppressSource = hero.id;
    if (options.text !== false && after > before) {
      this.floatText(enemy.x, enemy.y - 58, '压阵 ' + after, C.gold, 15, { life: .58, bold: true, rise: 10 });
    }
    if (after >= maxStacks && (enemy.huangjinGatherCd || 0) <= 0) {
      this.triggerHuangjinSuppressPeak(hero, enemy);
    }
    return after - before;
  };

  Game.prototype.huangjinHeartSuppressBonus = function (enemy, hero) {
    if (!enemy || !hero) return 0;
    var bonus = 0;
    for (var i = 0; i < this.zones.length; i++) {
      var zone = this.zones[i];
      if (!zone || zone.type !== 'huangjinHeart' || zone.life <= 0) continue;
      if (zone.hero !== hero.id) continue;
      if (dist2(enemy.x, enemy.y, zone.x, zone.y) <= zone.r * zone.r) bonus = Math.max(bonus, zone.suppressBonus || 1);
    }
    return bonus;
  };

  Game.prototype.acquireWallHuangjinTarget = function (hero) {
    var best = null, bestScore = Infinity;
    var startX = hero.x, startY = hero.y - 58;
    for (var i = 0; i < this.enemies.length; i++) {
      var candidate = this.enemies[i];
      if (candidate.dead || distance(startX, startY, candidate.x, candidate.y) > hero.attackRange) continue;
      var score = Math.max(0, this.wallEnemyDistanceToDefense(candidate)) * 100 + Math.abs(hero.x - candidate.x) * .35;
      if (score < bestScore) { bestScore = score; best = candidate; }
    }
    return best;
  };

  Game.prototype.acquireWallXuanyaTarget = function (hero) {
    var best = null, bestScore = Infinity;
    var searchRange = Math.max(48, hero.attackRange || 80);
    var hasMarkedTarget = false;
    for (var markScan = 0; markScan < this.enemies.length; markScan++) {
      var markedEnemy = this.enemies[markScan];
      if (!markedEnemy || markedEnemy.dead || !(markedEnemy.xuanyaMark > 0)) continue;
      if (distance(hero.x, hero.y, markedEnemy.x, markedEnemy.y) <= searchRange) { hasMarkedTarget = true; break; }
    }
    for (var i = 0; i < this.enemies.length; i++) {
      var candidate = this.enemies[i];
      if (!candidate || candidate.dead) continue;
      var d = distance(hero.x, hero.y, candidate.x, candidate.y);
      if (d > searchRange) continue;
      var hpRatio = candidate.hp / Math.max(1, candidate.maxHp);
      var score;
      if (hasMarkedTarget) {
        if (!(candidate.xuanyaMark > 0)) continue;
        score = hpRatio * 100000 + (WALL_DEFENSE_LINE_Y - this.wallEnemyFootY(candidate)) * 25 + d * .25;
      } else if (this.rogueLevel('E18') >= 1) {
        score = hpRatio * 100000 + d * .25;
      } else {
        score = (WALL_DEFENSE_LINE_Y - this.wallEnemyFootY(candidate)) + Math.abs(hero.x - candidate.x) * .32;
      }
      if (score < bestScore) { bestScore = score; best = candidate; }
    }
    return best;
  };

  Game.prototype.findXuanyaFollowupTarget = function (x, y, excludedIds, radius) {
    var excluded = {}, best = null, bestScore = Infinity;
    for (var ex = 0; ex < (excludedIds || []).length; ex++) excluded[excludedIds[ex]] = true;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || excluded[enemy.id]) continue;
      var d2 = dist2(x, y, enemy.x, enemy.y);
      if (d2 > radius * radius) continue;
      var hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
      var score = hpRatio * 100000 + d2 * .01;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  };

  Game.prototype.findXuanyaPierceTarget = function (target, projectile, excludedIds, radius) {
    var targets = this.findXuanyaPierceTargets(target, projectile, excludedIds, radius, 1, 90);
    return targets.length ? targets[0] : null;
  };

  Game.prototype.findXuanyaPierceTargets = function (target, projectile, excludedIds, radius, maxTargets, lateralLimit) {
    var result = [];
    if (!target || !projectile) return result;
    var excluded = {};
    for (var ex = 0; ex < (excludedIds || []).length; ex++) excluded[excludedIds[ex]] = true;
    var vx = projectile.freeVx, vy = projectile.freeVy;
    if (vx == null || vy == null) {
      var dx = projectile.x - (projectile.prevX == null ? projectile.x - 1 : projectile.prevX);
      var dy = projectile.y - (projectile.prevY == null ? projectile.y : projectile.prevY);
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      vx = dx / d; vy = dy / d;
    }
    var maxRadius = radius || this.xuanyaFollowupRadius(this.getHero(projectile.hero));
    var lateralMax = lateralLimit == null ? 90 : lateralLimit;
    var candidates = [];
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || excluded[enemy.id]) continue;
      var exx = enemy.x - target.x, eyy = enemy.y - target.y;
      var forward = exx * vx + eyy * vy;
      if (forward <= 8 || forward > maxRadius) continue;
      var lateral = Math.abs(exx * vy - eyy * vx);
      if (lateral > lateralMax) continue;
      var hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
      candidates.push({ enemy: enemy, score: lateral * 120 + forward + hpRatio * 140 });
    }
    candidates.sort(function (a, b) { return a.score - b.score; });
    var count = Math.max(1, maxTargets || 1);
    for (var pick = 0; pick < candidates.length && result.length < count; pick++) result.push(candidates[pick].enemy);
    return result;
  };

  Game.prototype.performWallHuangjinWave = function (hero, data) {
    if (!hero) return 0;
    data = data || {};
    var huangjinAttack = heroSkillConfig('huangjin').attack || {};
    var totalAngle = valueOr(data.halfAngleDegrees, valueOr(huangjinAttack.halfAngleDegrees, 34)) * Math.PI / 180;
    var waveRange = data.range || hero.attackRange;
    var attackPower = Math.max(1, this.heroAttackPower(hero));
    var damageAtk = data.damageAtk == null
      ? valueOr(huangjinAttack.damageAtk, .35)
      : data.damageAtk;
    var knockbackDistance = data.knockbackDistance == null ? 0 : Math.max(0, data.knockbackDistance);
    var directions = [{ angle: data.angle, halfAngle: totalAngle * .5, damage: 1, knockback: knockbackDistance > 0 ? 1 : 0, side: false }];

    var waveDuration = data.duration || (data.echo ? .42 : .46);
    this.zones.push({
      type: 'huangjinWallHit',
      hero: hero.id,
      x: data.startX, y: data.startY,
      range: waveRange,
      directions: directions,
      damage: attackPower * damageAtk * (data.damageScale || 1),
      knockback: knockbackDistance,
      applySuppress: false,
      slowDuration: data.slowDuration || 0,
      slowMultiplier: data.slowMultiplier || 0,
      postHit: data.postHit || null,
      hitCount: 0,
      mainWave: !data.echo,
      touched: {},
      life: waveDuration, maxLife: waveDuration, age: 0
    });

    for (var vfxIndex = 0; vfxIndex < directions.length; vfxIndex++) {
      var vfxDirection = directions[vfxIndex];
      this.zones.push({
        type: 'huangjinWallWave',
        form: data.form || (data.heavy ? 3 : 1),
        x: data.startX, y: data.startY,
        tx: data.startX + Math.cos(vfxDirection.angle) * waveRange,
        ty: data.startY + Math.sin(vfxDirection.angle) * waveRange,
        range: waveRange,
        halfAngle: vfxDirection.halfAngle,
        side: vfxDirection.side,
        angle: vfxDirection.angle,
        life: waveDuration, maxLife: waveDuration, age: 0,
        alpha: data.alpha == null ? (data.echo ? .56 : 1) : data.alpha
      });
    }
    return 0;
  };

  Game.prototype.releaseWallHuangjinAttack = function (hero, target) {
    var startX = hero.x;
    var startY = hero.y - 58;
    var angle = Math.atan2(target.y - startY, target.x - startX);
    hero.attackCount = (hero.attackCount || 0) + 1;
    var rangeLevel = this.huangjinUpgradeLevel('E01');
    var heavyLevel = this.huangjinUpgradeLevel('E13');
    var echoLevel = this.huangjinUpgradeLevel('E11');
    var huangjinAttack = heroSkillConfig('huangjin').attack || {};
    var heavyEvery = heavyLevel >= 1
      ? valueOr(huangjinAttack.heavyEveryUpgraded, 2)
      : valueOr(huangjinAttack.heavyEvery, 3);
    var isHeavy = hero.attackCount % Math.max(1, heavyEvery) === 0;
    var self = this;

    function queueWave(delay, data) {
      data.startX = startX;
      data.startY = startY;
      data.angle = angle;
      data.range = hero.attackRange;
      if (delay > 0) {
        self.zones.push({ type: 'huangjinEcho', hero: hero.id, life: delay, maxLife: delay, fired: false, data: data });
      } else {
        self.performWallHuangjinWave(hero, data);
      }
    }

    function queueResonance(delay, damageAtk, radius, label) {
      var rx = startX + Math.cos(angle) * hero.attackRange;
      var ry = startY + Math.sin(angle) * hero.attackRange;
      self.zones.push({
        type: 'huangjinResonance',
        hero: hero.id,
        x: rx, y: ry,
        r: radius,
        damageAtk: damageAtk,
        label: label || '山岳回响',
        life: delay, maxLife: delay, age: 0, fired: false
      });
    }

    queueWave(0, {
      damageAtk: valueOr(huangjinAttack.damageAtk, .35),
      knockbackDistance: 0,
      halfAngleDegrees: valueOr(huangjinAttack.halfAngleDegrees, 34),
      form: 1
    });

    var secondDamageAtk = isHeavy
      ? valueOr(huangjinAttack.heavyDamageAtk, .70)
      : valueOr(huangjinAttack.secondWaveDamageAtk, .35);
    if (rangeLevel >= 2) secondDamageAtk += valueOr(huangjinAttack.secondWaveBonusAtk, .25);
    var secondWave = {
      damageAtk: secondDamageAtk,
      knockbackDistance: isHeavy
        ? valueOr(huangjinAttack.heavyKnockbackDistance, 16)
        : valueOr(huangjinAttack.secondKnockbackDistance, 8),
      halfAngleDegrees: isHeavy ? 40 : valueOr(huangjinAttack.halfAngleDegrees, 34),
      form: isHeavy ? 3 : 1,
      heavy: isHeavy,
      slowDuration: isHeavy
        ? valueOr(huangjinAttack.heavySlowDuration, 1) + (heavyLevel >= 2 ? valueOr(huangjinAttack.heavySlowDurationBonus, .5) : 0)
        : 0,
      slowMultiplier: valueOr(huangjinAttack.heavySlowMultiplier, .75)
    };
    if (isHeavy && heavyLevel >= 3) {
      secondWave.postHit = {
        minTargets: valueOr(huangjinAttack.heavyExtraHitMinTargets, 3),
        delay: valueOr(huangjinAttack.heavyExtraHitDelay, .12),
        radius: valueOr(huangjinAttack.heavyExtraHitRadius, 118),
        damageAtk: valueOr(huangjinAttack.heavyExtraHitDamageAtk, .35),
        knockbackDistance: 6,
        label: '短震'
      };
    }
    queueWave(valueOr(huangjinAttack.comboWaveDelay, .18), secondWave);

    if (rangeLevel >= 3) {
      queueWave(valueOr(huangjinAttack.thirdWaveDelay, .36), {
        damageAtk: valueOr(huangjinAttack.thirdWaveDamageAtk, .25),
        knockbackDistance: 0,
        halfAngleDegrees: 28,
        form: 1,
        echo: true,
        alpha: .62
      });
    }

    if (echoLevel >= 1) {
      var resonanceRadius = valueOr(huangjinAttack.resonanceRadius, 105) *
        (echoLevel >= 2 ? valueOr(huangjinAttack.resonanceRadiusScale, 1.20) : 1);
      queueResonance(valueOr(huangjinAttack.resonanceDelay, .48), valueOr(huangjinAttack.resonanceDamageAtk, .30), resonanceRadius, '山岳回响');
      if (echoLevel >= 3) {
        queueResonance(
          valueOr(huangjinAttack.resonanceDelay, .48) + valueOr(huangjinAttack.resonanceSecondDelay, .28),
          valueOr(huangjinAttack.resonanceSecondDamageAtk, .20),
          resonanceRadius,
          '二段回响'
        );
      }
    }

    if (isHeavy) this.floatText(hero.x, hero.y - 128, '重鼓', C.gold, 22, { life: .75, bold: true, rise: 14 });
    this.impactPause(isHeavy ? .04 : .02, 0);
    this.audio.playSfx('huangjinDrumWave') || this.audio.tone('shoot');
  };

  Game.prototype.releaseWallHongyiFanAttack = function (hero, target, aim, baseDamage, lotus) {
    if (!hero) return;
    var attack = heroSkillConfig('hongyi').attack || {};
    var level = this.rogueLevel('E14');
    var startX = hero.x;
    var startY = hero.y - 48;
    var aimX = aim && aim.x != null ? aim.x : (target ? target.x : hero.x);
    var aimY = aim && aim.y != null ? aim.y : (target ? target.y : hero.y - (hero.attackRange || 900));
    var dx = aimX - startX;
    var dy = aimY - startY;
    var baseAngle = Math.atan2(dy, dx);
    var fanAngle = valueOr(attack.fanAngle, .16);
    var sideDamageAtk = level >= 2
      ? valueOr(attack.fanSideDamageUpgradedAtk, .45)
      : valueOr(attack.fanSideDamageAtk, .35);
    var secondDamageAtk = valueOr(attack.fanSecondWaveDamageAtk, .30);
    var sideBurnScale = valueOr(attack.fanSideBurnScale, .65);
    var maxDistance = hero.attackRange || 900;
    var self = this;

    function launch(angleOffset, damageScale, primary, delay, curveToTarget, isLotusCenter) {
      var angle = baseAngle + angleOffset;
      var projectileAim = {
        x: startX + Math.cos(angle) * maxDistance,
        y: startY + Math.sin(angle) * maxDistance
      };
      var useDirectTarget = primary && target && !target.dead;
      var projectile = {
        x: startX, y: startY, prevX: startX, prevY: startY,
        target: useDirectTarget ? target.id : null,
        hero: hero.id,
        type: isLotusCenter ? 'hongyiLotus' : (primary ? 'hongyi' : 'hongyiFan'),
        speed: Math.max(460, hero.projectileSpeed || 0),
        damage: Math.max(1, baseDamage * damageScale),
        color: isLotusCenter ? '#ff5a30' : C.fire,
        burnDuration: valueOr(attack.burnDuration, 3),
        burnDps: self.heroAttackPower(hero) * valueOr(attack.burnDpsAtk, .15) * (primary ? 1 : sideBurnScale),
        r: isLotusCenter ? 14 : (primary ? 9 : 7),
        life: 2.4, age: 0,
        primary: !!primary,
        canSplit: false,
        lotus: !!isLotusCenter,
        splashEnabled: !!primary,
        vfxRow: 0,
        aimX: projectileAim.x, aimY: projectileAim.y,
        launchDelay: Math.max(0, delay || 0)
      };
      self.prepareProjectileFreeFlight(projectile, projectileAim, maxDistance);
      if (curveToTarget && target && !target.dead) {
        projectile.curveTarget = target.id;
        projectile.curveDelay = valueOr(attack.fanCurveDelay, .18);
      }
      self.projectiles.push(projectile);
    }

    if (level < 1) {
      launch(0, 1, true, 0, false, lotus);
      return;
    }

    launch(-fanAngle, sideDamageAtk, false, 0, level >= 2, false);
    launch(0, 1, true, 0, false, lotus);
    launch(fanAngle, sideDamageAtk, false, 0, level >= 2, false);

    if (level >= 3) {
      var secondDelay = valueOr(attack.fanSecondWaveDelay, .18);
      var secondAngle = fanAngle * .72;
      launch(-secondAngle, secondDamageAtk, false, secondDelay, level >= 2, false);
      launch(0, secondDamageAtk, false, secondDelay, !!target, false);
      launch(secondAngle, secondDamageAtk, false, secondDelay, level >= 2, false);
    }
  };

  Game.prototype.isHongyiProjectile = function (type) {
    return type === 'hongyi' || type === 'hongyiLotus' || type === 'hongyiFan' ||
      type === 'hongyiPierce' || type === 'hongyiEmber';
  };

  Game.prototype.emitHongyiProjectileTrail = function (projectile, dt) {
    if (!projectile || !this.isHongyiProjectile(projectile.type) || (projectile.launchDelay || 0) > 0) return;
    var prevX = projectile.prevX == null ? projectile.x : projectile.prevX;
    var prevY = projectile.prevY == null ? projectile.y : projectile.prevY;
    var dx = projectile.x - prevX;
    var dy = projectile.y - prevY;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < .5) {
      dx = projectile.freeVx || 0;
      dy = projectile.freeVy || -1;
      len = Math.sqrt(dx * dx + dy * dy) || 1;
    }
    var ux = dx / len, uy = dy / len;
    var angle = Math.atan2(uy, ux);
    var sideX = -uy, sideY = ux;
    var isLotus = !!projectile.lotus || projectile.type === 'hongyiLotus';
    var isFan = projectile.type === 'hongyiFan';
    var rate = isLotus ? 58 : (isFan ? 34 : 44);
    projectile.hongyiTrailEmit = (projectile.hongyiTrailEmit || 0) + dt * rate;
    var count = Math.min(5, Math.floor(projectile.hongyiTrailEmit));
    projectile.hongyiTrailEmit -= count;
    var cap = 260;
    for (var i = 0; i < count && this.particles.length < cap; i++) {
      var t = count <= 1 ? Math.random() : (i + Math.random() * .6) / count;
      var back = (isLotus ? 28 : 20) + Math.random() * (isFan ? 14 : 24);
      var side = (Math.random() - .5) * (isLotus ? 20 : 13);
      var life = (isLotus ? .34 : .25) + Math.random() * (isLotus ? .18 : .15);
      this.particles.push({
        kind: 'hongyiTrail',
        x: prevX + dx * t - ux * back + sideX * side,
        y: prevY + dy * t - uy * back + sideY * side,
        vx: -ux * (34 + Math.random() * 42) + sideX * (Math.random() - .5) * 34,
        vy: -uy * (34 + Math.random() * 42) + sideY * (Math.random() - .5) * 34 - (18 + Math.random() * 18),
        life: life, max: life,
        size: (isLotus ? 13 : 8) + Math.random() * (isFan ? 4 : 8),
        stretch: isLotus ? 2.1 : (isFan ? 1.55 : 1.85),
        angle: angle + (Math.random() - .5) * .32,
        color: isLotus ? '#ffdf73' : '#ff8b36'
      });
    }
    var sparkChance = (isLotus ? 22 : 14) * dt;
    while (sparkChance > 0 && Math.random() < Math.min(1, sparkChance) && this.particles.length < cap) {
      sparkChance -= 1;
      var sparkBack = 8 + Math.random() * 24;
      var sparkSide = (Math.random() - .5) * (isLotus ? 30 : 20);
      var sparkLife = .24 + Math.random() * .24;
      this.particles.push({
        kind: 'hongyiSpark',
        x: projectile.x - ux * sparkBack + sideX * sparkSide,
        y: projectile.y - uy * sparkBack + sideY * sparkSide,
        vx: -ux * (40 + Math.random() * 90) + sideX * (Math.random() - .5) * 80,
        vy: -uy * (30 + Math.random() * 70) + sideY * (Math.random() - .5) * 70 - 36,
        life: sparkLife, max: sparkLife,
        size: (isLotus ? 2.8 : 2) + Math.random() * (isLotus ? 3.2 : 2.6),
        color: Math.random() < .32 ? '#fff2a6' : (isLotus ? '#ffb33e' : '#ff6635')
      });
    }
  };

  Game.prototype.emitHongyiHitParticles = function (x, y, projectile) {
    if (!projectile || !this.isHongyiProjectile(projectile.type)) return;
    var prevX = projectile.prevX == null ? projectile.x : projectile.prevX;
    var prevY = projectile.prevY == null ? projectile.y : projectile.prevY;
    var angle = Math.atan2(y - prevY, x - prevX);
    if (!isFinite(angle)) angle = projectile.freeVx != null ? Math.atan2(projectile.freeVy, projectile.freeVx) : -Math.PI / 2;
    var ux = Math.cos(angle), uy = Math.sin(angle);
    var sideX = -uy, sideY = ux;
    var isLotus = !!projectile.lotus || projectile.type === 'hongyiLotus';
    var isFan = projectile.type === 'hongyiFan';
    var count = isLotus ? 26 : (isFan ? 12 : 18);
    var cap = 280;
    for (var i = 0; i < count && this.particles.length < cap; i++) {
      var spread = (Math.random() - .5) * Math.PI * (isLotus ? 1.45 : 1.1);
      var speed = (isLotus ? 145 : 105) + Math.random() * (isLotus ? 150 : 120);
      var a = angle + Math.PI + spread;
      var life = .30 + Math.random() * (isLotus ? .34 : .24);
      this.particles.push({
        kind: 'hongyiHitSpark',
        x: x + sideX * (Math.random() - .5) * 20,
        y: y + sideY * (Math.random() - .5) * 14,
        vx: Math.cos(a) * speed + ux * 28,
        vy: Math.sin(a) * speed - 48,
        life: life, max: life,
        size: (isLotus ? 3.2 : 2.4) + Math.random() * (isLotus ? 4.2 : 3.2),
        color: Math.random() < .24 ? '#fff5bc' : (Math.random() < .58 ? '#ff973a' : '#ff4e2d')
      });
    }
    for (var glow = 0; glow < (isLotus ? 5 : 3) && this.particles.length < cap; glow++) {
      var glowLife = .22 + Math.random() * .16;
      this.particles.push({
        kind: 'hongyiTrail',
        x: x - ux * (6 + glow * 4) + sideX * (Math.random() - .5) * 24,
        y: y - uy * (6 + glow * 4) + sideY * (Math.random() - .5) * 18,
        vx: -ux * (20 + Math.random() * 40) + sideX * (Math.random() - .5) * 48,
        vy: -uy * (20 + Math.random() * 40) - 28,
        life: glowLife, max: glowLife,
        size: (isLotus ? 20 : 14) + Math.random() * 10,
        stretch: isLotus ? 1.6 : 1.35,
        angle: angle + Math.PI + (Math.random() - .5) * .8,
        color: isLotus ? '#ffdf73' : '#ff8b36'
      });
    }
  };

  Game.prototype.hongyiSplashStats = function (projectile, wasBurning) {
    var attack = heroSkillConfig('hongyi').attack || {};
    var passive = heroSkillConfig('hongyi').passive || {};
    var level = this.rogueLevel('E03');
    var isLotus = !!(projectile && (projectile.lotus || projectile.type === 'hongyiLotus'));
    var radius = isLotus ? valueOr(passive.lotusSplashRadius, 90) : 0;
    var damageAtk = isLotus ? valueOr(passive.lotusSplashDamageAtk, 1.30) : 0;
    if (!isLotus && level >= 1) {
      radius = valueOr(attack.splashRadius, 80);
      damageAtk = valueOr(attack.splashDamageAtk, .40);
    }
    if (!isLotus && level >= 2 && wasBurning) {
      radius = valueOr(attack.burningSplashRadius, 100);
    }
    if (isLotus && wasBurning) radius *= 1 + valueOr(passive.lotusBurningRadiusBonus, .15);
    if (projectile && projectile.splashEnabled === false) damageAtk = 0;
    return { radius: radius, damageAtk: damageAtk, isLotus: isLotus };
  };

  Game.prototype.hongyiLotusFireStats = function (hero) {
    hero = hero || this.heroByType('hongyi');
    var passive = heroSkillConfig('hongyi').passive || {};
    var level = this.rogueLevel('E16');
    return {
      duration: valueOr(passive.lotusFireDuration, 3) + (this.hongyiStarLevel(hero) >= 7 ? valueOr(passive.lotusFireStarDurationBonus, .3) : 0),
      radius: valueOr(passive.lotusFireRadius, 82),
      burnDpsAtk: valueOr(passive.lotusFireBurnDpsAtk, .20),
      petals: level >= 1,
      wave: level >= 2,
      fusion: level >= 3,
      forwardScale: valueOr(passive.lotusPetalForwardScale, 1.15),
      sideScale: valueOr(passive.lotusPetalSideScale, 1.05),
      waveInterval: valueOr(passive.lotusWaveInterval, 1),
      waveDamageAtk: valueOr(passive.lotusWaveDamageAtk, .14),
      waveLengthScale: valueOr(passive.lotusWaveLengthScale, 1.55),
      waveWidthScale: valueOr(passive.lotusWaveWidthScale, .36),
      fusionRadiusScale: valueOr(passive.lotusFusionRadiusScale, 1.35),
      fusionMaxDuration: valueOr(passive.lotusFusionMaxDuration, 5),
      fusionDamageAtk: valueOr(passive.lotusFusionDamageAtk, .45),
      platformDpsScale: valueOr(passive.lotusPlatformDpsScale, 1.43)
    };
  };

  Game.prototype.hongyiLotusZoneContains = function (zone, enemy) {
    if (!zone || !enemy) return false;
    var dx = enemy.x - zone.x;
    var dy = enemy.y - zone.y;
    if (!zone.lotusPetals) return dx * dx + dy * dy <= zone.r * zone.r;
    var angle = zone.forwardAngle == null ? -Math.PI / 2 : zone.forwardAngle;
    var forward = dx * Math.cos(angle) + dy * Math.sin(angle);
    var side = -dx * Math.sin(angle) + dy * Math.cos(angle);
    var forwardRadius = zone.r * (forward >= 0 ? (zone.forwardScale || 1.15) : 1);
    var sideRadius = zone.r * (zone.sideScale || 1.05);
    return (forward * forward) / Math.max(1, forwardRadius * forwardRadius) +
      (side * side) / Math.max(1, sideRadius * sideRadius) <= 1;
  };

  Game.prototype.pickHongyiLotusWaveTarget = function (zone) {
    var best = null;
    var bestScore = -Infinity;
    var searchRadius = zone.r * 2.2;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var distanceScore = distance(zone.x, zone.y, enemy.x, enemy.y);
      if (distanceScore > searchRadius) continue;
      var nearby = 0;
      for (var j = 0; j < this.enemies.length; j++) {
        var other = this.enemies[j];
        if (!other || other.dead) continue;
        if (dist2(enemy.x, enemy.y, other.x, other.y) <= 95 * 95) nearby++;
      }
      var score = nearby * 1000 - distanceScore;
      if (score > bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  };

  Game.prototype.pulseHongyiLotusPetal = function (zone, hero) {
    if (!zone || !hero || !zone.lotusWave) return;
    var target = this.pickHongyiLotusWaveTarget(zone);
    if (!target) return;
    var angle = Math.atan2(target.y - zone.y, target.x - zone.x);
    var length = zone.r * (zone.waveLengthScale || 1.55);
    var width = zone.r * (zone.waveWidthScale || .36);
    var endX = zone.x + Math.cos(angle) * length;
    var endY = zone.y + Math.sin(angle) * length;
    var damage = this.heroAttackPower(hero) * (zone.waveDamageAtk || .14);
    zone.waveAngle = angle;
    zone.waveLife = .55;
    zone.waveMaxLife = .55;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      if (this.segmentDistanceSquared(enemy.x, enemy.y, zone.x, zone.y, endX, endY) > width * width) continue;
      this.damageEnemy(enemy, damage, hero, { impact: true, noHongyiSigil: true });
      if (!enemy.dead) this.applyBurn(enemy, hero, 1.1, zone.burnDps || damage);
    }
    this.zones.push({
      type: 'lotusPetalPulse', x: zone.x, y: zone.y, tx: endX, ty: endY,
      r: width, color: C.fire, life: .44, maxLife: .44
    });
  };

  Game.prototype.createHongyiLotusFireZone = function (hero, x, y, forwardAngle) {
    if (!hero) return null;
    var stats = this.hongyiLotusFireStats(hero);
    if (stats.fusion) {
      for (var i = 0; i < this.zones.length; i++) {
        var existing = this.zones[i];
        if (!existing || existing.type !== 'soulFire' || !existing.lotus || existing.lotusPlatform || existing.hero !== hero.id) continue;
        if (distance(existing.x, existing.y, x, y) > (existing.r + stats.radius) * .72) continue;
        existing.x = (existing.x + x) * .5;
        existing.y = (existing.y + y) * .5;
        existing.r = Math.min(stats.radius * stats.fusionRadiusScale, Math.max(existing.r, stats.radius) * stats.fusionRadiusScale);
        existing.life = Math.min(stats.fusionMaxDuration, Math.max(existing.life, stats.duration));
        existing.maxLife = Math.max(existing.maxLife || 0, existing.life);
        existing.lotusPetals = true;
        existing.lotusWave = true;
        existing.lotusPlatform = true;
        existing.forwardAngle = forwardAngle;
        existing.forwardScale = stats.forwardScale;
        existing.sideScale = stats.sideScale;
        existing.waveInterval = stats.waveInterval;
        existing.waveDamageAtk = stats.waveDamageAtk;
        existing.waveLengthScale = stats.waveLengthScale;
        existing.waveWidthScale = stats.waveWidthScale;
        existing.waveCooldown = Math.min(existing.waveCooldown || stats.waveInterval, .35);
        existing.burnDps = this.heroAttackPower(hero) * stats.burnDpsAtk * stats.platformDpsScale;
        existing.touched = {};
        this.damageArea(existing.x, existing.y, existing.r, this.heroAttackPower(hero) * stats.fusionDamageAtk, hero, 'burn', {
          impact: true,
          noHongyiSigil: true,
          burnDuration: 1.1,
          burnDps: existing.burnDps
        });
        this.zones.push({
          type: 'lotusFusionBurst', x: existing.x, y: existing.y, r: existing.r,
          color: C.fire, life: .68, maxLife: .68
        });
        this.floatText(existing.x, existing.y - 88, '业火莲台', C.fire, 22, { life: .9, bold: true, impact: true });
        this.shake = Math.max(this.shake, 5);
        return existing;
      }
    }
    var zone = {
      type: 'soulFire', x: x, y: y, r: stats.radius,
      color: C.fire, life: stats.duration, maxLife: stats.duration,
      hero: hero.id, tick: 0, touched: {}, burnDuration: 1.1,
      burnDps: this.heroAttackPower(hero) * stats.burnDpsAtk,
      lotus: true,
      lotusPetals: stats.petals,
      lotusWave: stats.wave,
      lotusPlatform: false,
      forwardAngle: forwardAngle,
      forwardScale: stats.forwardScale,
      sideScale: stats.sideScale,
      waveInterval: stats.waveInterval,
      waveDamageAtk: stats.waveDamageAtk,
      waveLengthScale: stats.waveLengthScale,
      waveWidthScale: stats.waveWidthScale,
      waveCooldown: stats.waveInterval
    };
    this.zones.push(zone);
    return zone;
  };

  Game.prototype.applyHongyiProjectileImpact = function (hero, target, projectile, wasBurning) {
    if (!hero || !target) return;
    var attackPower = this.heroAttackPower(hero);
    var attack = heroSkillConfig('hongyi').attack || {};
    var level = this.rogueLevel('E03');
    var isLotus = !!(projectile && (projectile.lotus || projectile.type === 'hongyiLotus'));
    var stats = this.hongyiSplashStats(projectile, wasBurning);
    if (!target.dead) {
      this.applyBurn(target, hero,
        projectile && projectile.burnDuration || valueOr(attack.burnDuration, 3),
        projectile && projectile.burnDps || attackPower * valueOr(attack.burnDpsAtk, .15)
      );
    }
    if (projectile && projectile.primary && !isLotus) this.addHongyiSigils(hero, 1, 'hit');

    if (stats.damageAtk > 0) {
      for (var splashIndex = 0; splashIndex < this.enemies.length; splashIndex++) {
        var splashTarget = this.enemies[splashIndex];
        if (splashTarget.dead || splashTarget === target) continue;
        if (dist2(target.x, target.y, splashTarget.x, splashTarget.y) <= stats.radius * stats.radius) {
          this.damageEnemy(splashTarget, attackPower * stats.damageAtk, hero, { impact: true, noHongyiSigil: true });
          if (isLotus) this.applyBurn(splashTarget, hero, valueOr(attack.burnDuration, 3), attackPower * valueOr(attack.burnDpsAtk, .15) * .65);
        }
      }
      this.zones.push({
        type: 'emberBurst',
        x: target.x, y: target.y,
        r: stats.radius, color: isLotus ? '#ff5a30' : C.fire,
        life: isLotus ? .50 : .38, maxLife: isLotus ? .50 : .38,
        lotus: isLotus
      });
    }

    if (!isLotus && projectile && projectile.primary && level >= 2 && wasBurning) {
      var spreadTargets = this.findProjectileTargets(
        target.x, target.y, [target.id],
        valueOr(attack.burnSpreadTargets, 2),
        valueOr(attack.burningSplashRadius, 100),
        true
      );
      var inheritedDuration = Math.max(.6, (target.burn || valueOr(attack.burnDuration, 3)) * valueOr(attack.burnSpreadDurationRatio, .60));
      for (var spreadIndex = 0; spreadIndex < spreadTargets.length; spreadIndex++) {
        this.applyBurn(spreadTargets[spreadIndex], hero, inheritedDuration, attackPower * valueOr(attack.burnDpsAtk, .15));
        this.zones.push({
          type: 'burnSpreadLink',
          x: target.x, y: target.y - 18,
          tx: spreadTargets[spreadIndex].x, ty: spreadTargets[spreadIndex].y - 18,
          color: C.fire, life: .30, maxLife: .30
        });
      }
    }

    if (isLotus) {
      var forwardAngle = projectile && projectile.freeVx != null
        ? Math.atan2(projectile.freeVy, projectile.freeVx)
        : Math.atan2(target.y - hero.y, target.x - hero.x);
      this.createHongyiLotusFireZone(hero, target.x, target.y, forwardAngle);
      if (this.hongyiStarLevel(hero) >= 6) {
        var passive = heroSkillConfig('hongyi').passive || {};
        this.zones.push({
          type: 'hongyiSoulEcho', x: target.x, y: target.y - 10, r: 46,
          target: target.id, hero: hero.id,
          damage: attackPower * valueOr(passive.soulEchoDamageAtk, .30),
          color: C.fire, life: .28, maxLife: .28, fired: false
        });
      }
      this.floatText(target.x, target.y - 78, '赤莲火羽', C.fire, 20, { life: .78, bold: true, impact: true });
    }

  };

  Game.prototype.isXuanyaBladeProjectile = function (type) {
    return type === 'xuanya' || type === 'xuanyaPierce' || type === 'xuanyaRicochet' || type === 'xuanyaReturn' || type === 'xuanyaChase';
  };

  Game.prototype.pushXuanyaSlash = function (fromX, fromY, toX, toY, type, options) {
    options = options || {};
    var isReturn = type === 'xuanyaReturn';
    var bright = isReturn || type === 'xuanyaChase' || type === 'xuanyaOverflow' || options.empowered || options.bright;
    this.zones.push({
      type: 'xuanSlash',
      x: fromX, y: fromY,
      tx: toX, ty: toY,
      slashType: type || 'xuanya',
      primary: !!options.primary,
      empowered: !!options.empowered,
      bright: bright,
      color: options.color || (bright ? '#f6e7c0' : '#d9c7a6'),
      life: isReturn ? .42 : (bright ? .30 : .22),
      maxLife: isReturn ? .42 : (bright ? .30 : .22),
      curve: options.curve,
      age: 0
    });
  };

  Game.prototype.pushXuanyaBoomerangReturn = function (fromX, fromY, toX, toY, options) {
    options = options || {};
    var dx = toX - fromX, dy = toY - fromY;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / d, ny = dx / d;
    var curve = options.curve == null ? 96 : options.curve;
    this.zones.push({
      type: 'xuanBoomerang',
      x: fromX, y: fromY,
      tx: toX, ty: toY,
      cx: (fromX + toX) / 2 + nx * curve,
      cy: (fromY + toY) / 2 + ny * curve - 30,
      color: options.color || '#f6e7c0',
      empowered: !!options.empowered,
      life: options.life || .56,
      maxLife: options.life || .56,
      age: 0
    });
  };

  Game.prototype.pushXuanyaPierceTrail = function (fromX, fromY, vx, vy, length, options) {
    options = options || {};
    var d = Math.sqrt(vx * vx + vy * vy) || 1;
    vx /= d; vy /= d;
    var trailLength = Math.max(60, length || 220);
    this.zones.push({
      type: 'xuanPierceTrail',
      x: fromX, y: fromY,
      tx: fromX + vx * trailLength,
      ty: fromY + vy * trailLength,
      color: options.color || '#f6e7c0',
      empowered: !!options.empowered,
      life: options.life || .24,
      maxLife: options.life || .24,
      age: 0
    });
  };

  Game.prototype.pushXuanyaBladePath = function (fromX, fromY, vx, vy, forwardLength, toX, toY, options) {
    options = options || {};
    var d = Math.sqrt(vx * vx + vy * vy) || 1;
    vx /= d; vy /= d;
    var length = Math.max(42, forwardLength || 80);
    this.zones.push({
      type: 'xuanBladePath',
      x: fromX, y: fromY,
      mx: fromX + vx * length,
      my: fromY + vy * length,
      tx: toX, ty: toY,
      color: options.color || HERO_META.xuanya.color,
      empowered: !!options.empowered,
      pierce: !!options.pierce,
      returnEnabled: options.returnEnabled !== false,
      hero: options.hero || null,
      pierceDamage: options.pierceDamage || 0,
      returnDamage: options.returnDamage || 0,
      pierceWidth: options.pierceWidth || 24,
      returnWidth: options.returnWidth || 24,
      phaseCut: options.returnEnabled === false ? 1 : (options.pierce ? .42 : .24),
      pierceTouched: {},
      returnTouched: {},
      returnTextShown: false,
      life: options.life || .66,
      maxLife: options.life || .66,
      age: 0
    });
  };

  Game.prototype.damageXuanyaBladePath = function (hero, fromX, fromY, toX, toY, damage, excludedIds, options) {
    if (!hero || damage <= 0) return [];
    options = options || {};
    var excluded = {};
    for (var ex = 0; ex < (excludedIds || []).length; ex++) excluded[excludedIds[ex]] = true;
    var width = Math.max(18, options.width || 76);
    var hit = [];
    var angle = Math.atan2(toY - fromY, toX - fromX);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || excluded[enemy.id]) continue;
      var hitRadius = width + (enemy.size || 1) * 12;
      if (this.segmentDistanceSquared(enemy.x, enemy.y - 18, fromX, fromY, toX, toY) > hitRadius * hitRadius) continue;
      hit.push(enemy);
    }
    hit.sort(function (a, b) {
      return distance(fromX, fromY, a.x, a.y - 18) - distance(fromX, fromY, b.x, b.y - 18);
    });
    for (var h = 0; h < hit.length; h++) {
      var target = hit[h];
      this.damageEnemy(target, damage, hero, {
        impact: true,
        noXuanyaSoul: true,
        noXuanyaChain: true
      });
      this.zones.push({
        type: 'xuanImpact', x: target.x, y: target.y - 18,
        angle: angle,
        r: options.impactRadius || 44,
        color: options.color || HERO_META[hero.type].color,
        life: .26, maxLife: .26
      });
    }
    return hit;
  };

  Game.prototype.xuanyaBladePathPoint = function (z, progress) {
    progress = clamp(progress, 0, 1);
    var hasBladeReturn = z.returnEnabled !== false;
    var phaseCut = z.phaseCut || (hasBladeReturn ? (z.pierce ? .42 : .24) : 1);
    if (!hasBladeReturn || progress <= phaseCut) {
      var outT = clamp(progress / Math.max(.01, phaseCut), 0, 1);
      var easedOut = 1 - Math.pow(1 - outT, 2);
      return {
        x: z.x + (z.mx - z.x) * easedOut,
        y: z.y + (z.my - z.y) * easedOut,
        angle: Math.atan2(z.my - z.y, z.mx - z.x),
        phase: 'pierce'
      };
    }
    var backT = clamp((progress - phaseCut) / Math.max(.01, 1 - phaseCut), 0, 1);
    var easedBack = backT * backT * (3 - 2 * backT);
    return {
      x: z.mx + (z.tx - z.mx) * easedBack,
      y: z.my + (z.ty - z.my) * easedBack,
      angle: Math.atan2(z.ty - z.my, z.tx - z.mx),
      phase: 'return'
    };
  };

  Game.prototype.updateXuanyaBladePathZone = function (z, prevProgress, nextProgress) {
    if (!z || !z.hero) return;
    var hero = this.getHero(z.hero);
    if (!hero) return;
    var prev = this.xuanyaBladePathPoint(z, prevProgress);
    var next = this.xuanyaBladePathPoint(z, nextProgress);
    var phase = next.phase;
    var damage = phase === 'return' ? z.returnDamage : z.pierceDamage;
    if (!damage || damage <= 0) return;
    var touched = phase === 'return' ? z.returnTouched : z.pierceTouched;
    var bladeRadius = phase === 'return' ? (z.returnWidth || 24) : (z.pierceWidth || 24);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || touched[enemy.id]) continue;
      var hitRadius = Math.max(10, bladeRadius + (enemy.size || 1) * 10);
      if (this.segmentDistanceSquared(enemy.x, enemy.y - 18, prev.x, prev.y, next.x, next.y) > hitRadius * hitRadius) continue;
      touched[enemy.id] = true;
      this.damageEnemy(enemy, damage, hero, {
        impact: true,
        noXuanyaSoul: true,
        noXuanyaChain: true
      });
      this.zones.push({
        type: 'xuanImpact', x: enemy.x, y: enemy.y - 18,
        angle: next.angle,
        r: phase === 'return' ? 42 : 38,
        color: z.color || HERO_META[hero.type].color,
        life: .24, maxLife: .24
      });
      if (phase === 'return' && !z.returnTextShown) {
        z.returnTextShown = true;
        this.floatText(enemy.x, enemy.y - 72, '回旋鸦刃', HERO_META[hero.type].color, 17, { life: .7, bold: true });
      } else if (phase !== 'return' && !z.pierceTextShown) {
        z.pierceTextShown = true;
        this.floatText(enemy.x, enemy.y - 72, '裂羽穿心', HERO_META[hero.type].color, 17, { life: .7, bold: true });
      }
    }
  };

  Game.prototype.releaseXuanyaInstantBlade = function (hero, fromX, fromY, target, damage, type, options) {
    if (!hero || !target || target.dead) return;
    options = options || {};
    var startX = fromX == null ? hero.x : fromX;
    var startY = fromY == null ? hero.y - 52 : fromY;
    var endX = target.x;
    var endY = target.y - 18;
    var dx = endX - startX, dy = endY - startY;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var slashType = type || 'xuanya';
    this.pushXuanyaSlash(startX, startY, endX, endY, slashType, options);
    this.applyXuanyaProjectileImpact(hero, target, {
      x: startX, y: startY,
      prevX: startX, prevY: startY,
      target: target.id,
      hero: hero.id,
      type: slashType,
      damage: damage,
      color: options.color || HERO_META[hero.type].color,
      primary: !!options.primary,
      canSplit: options.canSplit !== false,
      canPierce: options.canPierce !== false,
      canChase: options.canChase !== false,
      empowered: !!options.empowered,
      hitIds: options.hitIds || null,
      freeVx: dx / d,
      freeVy: dy / d
    });
  };

  Game.prototype.applyXuanyaProjectileImpact = function (hero, target, projectile) {
    if (!hero || !target) return;
    var xuanAttack = heroSkillConfig('xuanya').attack || {};
    var attackPower = this.heroAttackPower(hero);
    var primaryBlade = !!(projectile && projectile.primary && projectile.type === 'xuanya');
    var wasMarked = target.xuanyaMark > 0;
    var damage = Math.max(1, projectile.damage || attackPower);
    var xuanAlreadyHitIds = projectile && projectile.hitIds ? projectile.hitIds.slice() : [];
    if (xuanAlreadyHitIds.indexOf(target.id) < 0) xuanAlreadyHitIds.push(target.id);
    if (primaryBlade) {
      // 7 星“命尽归鸦”的 140% 是基础倍率替换值；裂羽、残血、鸦痕等增伤继续叠乘。
      var baseAtk = projectile.empowered ? valueOr(xuanAttack.empoweredBladeBaseAtk, 1.40) : 1;
      damage = attackPower * baseAtk;
      var soulStacks = this.consumeXuanyaSoulStacks(hero);
      if (soulStacks > 0) damage += attackPower * soulStacks * valueOr(xuanAttack.soulDamageAtkPerStack, .20);
    }
    if (wasMarked) {
      damage *= 1 + this.xuanyaMarkDamageBonus(hero);
    }

    var hitAngle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
    this.zones.push({
      type: 'xuanImpact', x: target.x, y: target.y - 18, angle: hitAngle,
      r: projectile.type === 'xuanyaChase' ? 58 : (projectile.empowered ? 56 : 46),
      color: HERO_META[hero.type].color, life: .32, maxLife: .32
    });
    this.damageEnemy(target, damage, hero, { impact: true, noXuanyaSoul: !primaryBlade });
    var killedByPrimaryMarkedBlade = primaryBlade && wasMarked && target.dead;
    var hpRatioAfter = target.hp / Math.max(1, target.maxHp);

    if (primaryBlade && this.rogueLevel('E18') >= 1 && !target.dead && hpRatioAfter <= this.xuanyaMarkThreshold(hero)) {
      this.applyXuanyaMark(target, hero, !wasMarked);
    }

    var xuanBladeVx = projectile.freeVx == null ? (target.x - projectile.x) : projectile.freeVx;
    var xuanBladeVy = projectile.freeVy == null ? (target.y - 18 - projectile.y) : projectile.freeVy;
    var xuanBladeVD = Math.sqrt(xuanBladeVx * xuanBladeVx + xuanBladeVy * xuanBladeVy) || 1;
    xuanBladeVx /= xuanBladeVD; xuanBladeVy /= xuanBladeVD;
    if (primaryBlade && projectile.canPierce !== false) {
      var e07Level = this.rogueLevel('E07');
      var e17Level = this.rogueLevel('E17');
      var hasPierce = e07Level >= 1;
      var hasReturn = e17Level >= 1;
      var forwardDistance = 0;
      if (hasPierce) {
        forwardDistance = e07Level >= 3
          ? valueOr(xuanAttack.e07PierceDistance3, 340)
          : e07Level >= 2
            ? valueOr(xuanAttack.e07PierceDistance2, 260)
            : valueOr(xuanAttack.e07PierceDistance, 180);
      } else if (hasReturn) {
        forwardDistance = valueOr(xuanAttack.returnForwardDistance, 120);
      }
      if (forwardDistance > 0) {
        var forwardEndX = target.x + xuanBladeVx * forwardDistance;
        var forwardEndY = target.y - 18 + xuanBladeVy * forwardDistance;
        this.pushXuanyaBladePath(target.x, target.y - 18, xuanBladeVx, xuanBladeVy, forwardDistance, hero.x, hero.y - 52, {
          color: HERO_META[hero.type].color,
          empowered: projectile.empowered,
          pierce: hasPierce,
          returnEnabled: hasReturn,
          hero: hero.id,
          pierceDamage: hasPierce ? attackPower * (e07Level >= 3
            ? valueOr(xuanAttack.e07PierceDamageAtk3, .70)
            : e07Level >= 2
              ? valueOr(xuanAttack.e07PierceDamageAtk2, .55)
              : valueOr(xuanAttack.e07PierceDamageAtk, .40)) : 0,
          returnDamage: hasReturn ? attackPower * (e17Level >= 3
            ? valueOr(xuanAttack.returnDamageAtk3, .65)
            : e17Level >= 2
              ? valueOr(xuanAttack.returnDamageAtk2, .50)
              : valueOr(xuanAttack.returnDamageAtk, .35)) : 0,
          pierceWidth: valueOr(xuanAttack.piercePathWidth, 24),
          returnWidth: e17Level >= 3 ? valueOr(xuanAttack.returnPathWidth3, 32) : valueOr(xuanAttack.returnPathWidth, 24),
          life: hasReturn ? .74 : .38
        });
      }
    }

    if (this.xuanyaStarLevel(hero) >= 6 && wasMarked && !target.dead) {
      var splashDamage = attackPower * valueOr(xuanAttack.starSplashDamageAtk, .25);
      for (var splash = 0; splash < this.enemies.length; splash++) {
        var splashTarget = this.enemies[splash];
        if (!splashTarget || splashTarget.dead || splashTarget === target) continue;
        if (dist2(target.x, target.y, splashTarget.x, splashTarget.y) <= 58 * 58) {
          this.damageEnemy(splashTarget, splashDamage, hero, { impact: true, noXuanyaChain: true, noXuanyaSoul: true });
        }
      }
    }

    if (killedByPrimaryMarkedBlade && projectile.canChase !== false && this.rogueLevel('E18') >= 3) {
      var chaseRadius = this.xuanyaFollowupRadius(hero) + 80;
      var chaseTarget = this.findXuanyaFollowupTarget(target.x, target.y, [target.id], chaseRadius);
      if (chaseTarget) {
        this.releaseXuanyaInstantBlade(hero, target.x, target.y - 18, chaseTarget, attackPower * this.xuanyaChaseDamageAtk(hero), 'xuanyaChase', {
          color: '#f6e7c0', canSplit: false, canPierce: false, canChase: false
        });
        this.floatText(target.x, target.y - 72, '追命', HERO_META[hero.type].color, 20, { life: .75, bold: true, impact: true });
      }
    }

    if (killedByPrimaryMarkedBlade && this.xuanyaStarLevel(hero) >= 7) {
      hero.xuanyaEmpoweredBlade = 1;
      this.floatText(hero.x, hero.y - 132, '命尽归鸦', HERO_META[hero.type].color, 19, { life: .85, bold: true, rise: 18 });
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y - 42, r: 40, color: HERO_META[hero.type].color, life: .55 });
    }
  };

  Game.prototype.isSuwenNeedleProjectile = function (type) {
    return type === 'suwen' || type === 'suwenNeedle' || type === 'suwenSmall';
  };

  Game.prototype.isEnemyAbnormalForSuwen = function (enemy) {
    return !!(enemy && !enemy.dead && (enemy.suwenStarStacks || 0) > 0);
  };

  Game.prototype.applyQingyiProjectileImpact = function (hero, target, projectile) {
    if (!hero || !target) return;
    var qingyiAttack = heroSkillConfig('qingyi').attack || {};
    var attackPower = this.heroAttackPower(hero);
    this.zones.push({
      type: 'holyHit',
      x: projectile.aimX || target.x, y: (projectile.aimY || target.y) - 18, angle: -Math.PI / 2,
      r: valueOr(qingyiAttack.hitRadius, 46), color: HERO_META[hero.type].color,
      life: .38, maxLife: .38
    });
    this.damageEnemy(target, Math.max(1, projectile.damage || attackPower * valueOr(qingyiAttack.damageAtk, .6)), hero, { impact: true });
    if (!target.dead) {
      var duration = this.qingyiExposeDuration();
      this.applyQingyiExpose(target, hero, duration);
      this.propagateQingyiExpose(hero, target, duration);
    }
  };

  Game.prototype.suwenStarLevel = function (hero) {
    return this.heroStarLevel(hero);
  };

  Game.prototype.suwenMaxStacks = function (hero) {
    var attack = heroSkillConfig('suwen').attack || {};
    return this.suwenStarLevel(hero) >= 3
      ? valueOr(attack.starMaxStacks, 6)
      : valueOr(attack.maxStacks, 5);
  };

  Game.prototype.suwenStackDuration = function (hero) {
    var attack = heroSkillConfig('suwen').attack || {};
    return this.suwenStarLevel(hero) >= 3
      ? valueOr(attack.starStackDuration, 4.5)
      : valueOr(attack.stackDuration, 4);
  };

  Game.prototype.suwenStackDamageBonus = function (hero) {
    var attack = heroSkillConfig('suwen').attack || {};
    return this.rogueLevel('E09') >= 2
      ? valueOr(attack.upgradedStackDamageBonus, .08)
      : valueOr(attack.stackDamageBonus, .06);
  };

  Game.prototype.suwenFocusRequired = function () {
    var passive = heroSkillConfig('suwen').passive || {};
    return this.rogueLevel('E21') >= 2
      ? valueOr(passive.upgradedFocusRequired, 2)
      : valueOr(passive.focusRequired, 3);
  };

  Game.prototype.addSuwenStarStacks = function (enemy, hero, amount, options) {
    if (!enemy || enemy.dead || !hero || hero.type !== 'suwen' || amount <= 0) return 0;
    options = options || {};
    var maxStacks = this.suwenMaxStacks(hero);
    var before = clamp(enemy.suwenStarStacks || 0, 0, maxStacks);
    var after = clamp(before + amount, 0, maxStacks);
    enemy.suwenStarStacks = after;
    enemy.suwenStarTime = Math.max(enemy.suwenStarTime || 0, this.suwenStackDuration(hero));
    enemy.suwenStarSource = hero.id;
    if (after > before || options.flash) {
      this.zones.push({ type: 'starMark', x: enemy.x, y: enemy.y - 42, r: 26 + after * 2, color: HERO_META[hero.type].color, life: .44, maxLife: .44 });
      if (options.text !== false) this.floatText(enemy.x, enemy.y - 78, '星蚀 ' + after, HERO_META[hero.type].color, 16, { life: .62, bold: true, rise: 10 });
    }
    return after - before;
  };

  Game.prototype.setSuwenStarStacksAtLeast = function (enemy, hero, amount) {
    if (!enemy || enemy.dead || !hero || hero.type !== 'suwen') return;
    var maxStacks = this.suwenMaxStacks(hero);
    var before = clamp(enemy.suwenStarStacks || 0, 0, maxStacks);
    var target = clamp(amount || 0, 0, maxStacks);
    if (before < target) this.addSuwenStarStacks(enemy, hero, target - before, { flash: true });
    else if (before > 0) enemy.suwenStarTime = Math.max(enemy.suwenStarTime || 0, this.suwenStackDuration(hero));
  };

  Game.prototype.findSuwenNeedleFallbackTarget = function (x, y, radius, excludedId) {
    var best = null, bestScore = Infinity;
    var r = Math.max(24, radius || 42);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead || enemy.id === excludedId) continue;
      var d2 = dist2(x, y, enemy.x, enemy.y);
      if (d2 > r * r) continue;
      if (d2 < bestScore) { bestScore = d2; best = enemy; }
    }
    return best;
  };

  Game.prototype.hasSuwenEmergencyTarget = function (hero) {
    var searchRange = Math.max(48, hero && hero.attackRange || 800);
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      if (this.wallEnemyFootY(enemy) >= WALL_DEFENSE_LINE_Y - 58 &&
        distance(hero.x, hero.y, enemy.x, enemy.y) <= searchRange) return true;
    }
    return false;
  };

  Game.prototype.acquireWallSuwenTarget = function (hero) {
    var searchRange = Math.max(48, hero.attackRange || 800);
    var lock = this.getEnemy(hero.suwenFocusLockTarget);
    if (this.rogueLevel('E22') >= 3 && hero.suwenFocusLockTime > 0 && lock && !lock.dead &&
      !this.hasSuwenEmergencyTarget(hero) && distance(hero.x, hero.y, lock.x, lock.y) <= searchRange) {
      return lock;
    }
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.enemies.length; i++) {
      var candidate = this.enemies[i];
      if (!candidate || candidate.dead) continue;
      var d = distance(hero.x, hero.y, candidate.x, candidate.y);
      if (d > searchRange) continue;
      var stacks = candidate.suwenStarStacks || 0;
      var urgent = Math.max(0, this.wallEnemyFootY(candidate) - (WALL_DEFENSE_LINE_Y - 90));
      var bossBonus = candidate.type === 'boss' ? -26000 : candidate.elite ? -15000 : 0;
      var focusBonus = candidate.id === hero.suwenFocusTarget ? -18000 : 0;
      var score = (WALL_DEFENSE_LINE_Y - this.wallEnemyFootY(candidate)) * 18 + d * .18 - stacks * 9000 + bossBonus + focusBonus - urgent * 900;
      if (score < bestScore) { bestScore = score; best = candidate; }
    }
    return best;
  };

  Game.prototype.updateSuwenPassive = function (hero, dt) {
    hero.suwenFocusRetain = Math.max(0, (hero.suwenFocusRetain || 0) - (dt || 0));
    hero.suwenFocusLockTime = Math.max(0, (hero.suwenFocusLockTime || 0) - (dt || 0));
    var focus = this.getEnemy(hero.suwenFocusTarget);
    if (focus && !focus.dead && distance(hero.x, hero.y, focus.x, focus.y) <= (hero.attackRange || 800) + 36) return;
    if ((hero.suwenFocusCount || 0) > 0 && this.rogueLevel('E22') >= 1) {
      var passive = heroSkillConfig('suwen').passive || {};
      hero.suwenStoredFocusCount = hero.suwenFocusCount || 0;
      hero.suwenStoredFocusTarget = hero.suwenFocusTarget;
      hero.suwenFocusRetain = valueOr(passive.focusRetainDuration, 1.5);
    }
    hero.suwenFocusTarget = null;
    hero.suwenFocusCount = 0;
    hero.suwenFocusReady = 0;
  };

  Game.prototype.releaseSuwenFallingNeedle = function (hero, target, damage, options) {
    if (!hero) return;
    options = options || {};
    var attack = heroSkillConfig('suwen').attack || {};
    var aimX = options.aimX != null ? options.aimX : (target ? target.x : hero.x);
    var aimY = options.aimY != null ? options.aimY : (target ? target.y : hero.y - 260);
    var delay = options.delay == null ? valueOr(attack.fallDelay, .32) : options.delay;
    var p = {
      x: aimX, y: aimY - 190, prevX: aimX, prevY: aimY - 230,
      target: target ? target.id : null, originalTarget: target ? target.id : null,
      hero: hero.id, type: options.type || 'suwenNeedle',
      damage: damage || this.heroAttackPower(hero) * valueOr(attack.damageAtk, .90),
      color: options.color || HERO_META[hero.type].color,
      r: options.r || 7, life: Math.max(1.0, delay + .45), age: 0,
      primary: !!options.primary, focus: !!options.focus, noStack: !!options.noStack,
      smallNeedle: !!options.smallNeedle,
      fallDelay: delay, maxFallDelay: Math.max(.01, delay),
      aimX: aimX, aimY: aimY, hitRadius: options.hitRadius || valueOr(attack.hitRadius, 42),
      vfxRow: 1
    };
    this.projectiles.push(p);
    this.zones.push({ type: 'starMark', x: aimX, y: aimY - 36, r: options.focus ? 38 : 28, color: HERO_META[hero.type].color, life: delay + .12, maxLife: delay + .12 });
  };

  Game.prototype.updateSuwenFallingNeedle = function (projectile, dt) {
    if (!projectile || projectile.fallDelay == null) return false;
    projectile.fallDelay -= dt;
    var progress = 1 - clamp(projectile.fallDelay / Math.max(.01, projectile.maxFallDelay || .32), 0, 1);
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x = projectile.aimX;
    projectile.y = projectile.aimY - 190 * (1 - progress);
    if (projectile.fallDelay > 0 && projectile.life > 0) return false;
    var target = this.getEnemy(projectile.originalTarget);
    if (!target || target.dead) target = this.findSuwenNeedleFallbackTarget(projectile.aimX, projectile.aimY, projectile.hitRadius, projectile.originalTarget);
    if (target) {
      projectile.x = target.x; projectile.y = target.y - 18;
      this.projectileHit(projectile, target);
    } else {
      this.zones.push({ type: 'starImpact', x: projectile.aimX, y: projectile.aimY - 18, r: 26, color: projectile.color, life: .22, maxLife: .22, miss: true });
      this.burst(projectile.aimX, projectile.aimY - 18, projectile.color, 3);
    }
    return true;
  };

  Game.prototype.applySuwenFocusAfterPrimaryHit = function (hero, target, inherited) {
    if (!hero || !target || target.dead) return;
    var required = this.suwenFocusRequired(hero);
    if (inherited) {
      hero.suwenFocusCount = Math.max(1, hero.suwenStoredFocusCount || 0) + 1;
      hero.suwenStoredFocusCount = 0;
      hero.suwenStoredFocusTarget = null;
      hero.suwenFocusRetain = 0;
    } else if (hero.suwenFocusTarget === target.id) {
      hero.suwenFocusCount = (hero.suwenFocusCount || 0) + 1;
    } else {
      hero.suwenFocusCount = 1;
    }
    hero.suwenFocusTarget = target.id;
    if (hero.suwenFocusCount >= required) {
      hero.suwenFocusReady = 1;
      hero.suwenFocusCount = required;
      this.floatText(hero.x, hero.y - 128, '问命针', HERO_META[hero.type].color, 18, { life: .72, bold: true, rise: 14 });
    }
  };

  Game.prototype.applySuwenProjectileImpact = function (hero, target, projectile) {
    if (!hero || !target) return;
    var suwenAttack = heroSkillConfig('suwen').attack || {};
    var suwenPassive = heroSkillConfig('suwen').passive || {};
    var attackPower = this.heroAttackPower(hero);
    var primary = !!projectile.primary;
    var focus = !!projectile.focus;
    var smallNeedle = !!projectile.smallNeedle || projectile.type === 'suwenSmall';
    var stacksBefore = target.suwenStarStacks || 0;
    var hitAngle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
    this.zones.push({
      type: 'starImpact',
      x: target.x, y: target.y - 18, angle: hitAngle,
      r: focus ? 68 : (smallNeedle ? 34 : 50),
      color: HERO_META[hero.type].color,
      life: focus ? .42 : .34, maxLife: focus ? .42 : .34,
      focus: focus
    });

    var damageAtk;
    if (focus) {
      damageAtk = this.rogueLevel('E21') >= 1
        ? valueOr(suwenPassive.upgradedFocusDamageAtk, 1.80)
        : valueOr(suwenPassive.focusDamageAtk, 1.50);
      if (this.suwenStarLevel(hero) >= 7) {
        damageAtk += stacksBefore * valueOr(suwenPassive.starPerStackBonusAtk, .08);
        if (stacksBefore >= this.suwenMaxStacks(hero)) damageAtk += valueOr(suwenPassive.starFullStackBonusAtk, .30);
      }
      if (target.elite || target.type === 'boss') {
        damageAtk *= 1 + (this.suwenStarLevel(hero) >= 4
          ? valueOr(suwenPassive.starEliteBossBonus, .35)
          : valueOr(suwenPassive.eliteBossBonus, .25));
      }
    } else if (smallNeedle) {
      damageAtk = valueOr(suwenAttack.smallNeedleDamageAtk, .40);
    } else {
      damageAtk = valueOr(suwenAttack.damageAtk, .90);
      if (this.rogueLevel('E09') >= 1) damageAtk *= 1.20;
    }

    this.damageEnemy(target, Math.max(1, attackPower * damageAtk), hero, { impact: true, noSuwenStarBonus: focus });

    if (!target.dead) {
      var inheritedFocus = false;
      var extraStacks = 0;
      if (primary && !focus && this.rogueLevel('E22') >= 2 && hero.suwenFocusRetain > 0 && (hero.suwenStoredFocusCount || 0) > 0) {
        inheritedFocus = true;
        extraStacks += 1;
      }
      if (primary && !focus && this.suwenStarLevel(hero) >= 5 && hero.suwenLastNeedleTarget && hero.suwenLastNeedleTarget !== target.id) {
        var oldTarget = this.getEnemy(hero.suwenLastNeedleTarget);
        if (oldTarget && !oldTarget.dead && (oldTarget.suwenStarStacks || 0) > 0) {
          oldTarget.suwenStarTime = Math.max(oldTarget.suwenStarTime || 0, this.suwenStackDuration(hero) + valueOr(suwenPassive.starCarryDuration, 1.5));
          if ((oldTarget.suwenStarStacks || 0) >= valueOr(suwenPassive.starCarryMinStacks, 3)) hero.suwenCarryStars = Math.max(hero.suwenCarryStars || 0, valueOr(suwenPassive.starCarryBonusStacks, 1));
        }
      }
      if (primary && !focus && (hero.suwenCarryStars || 0) > 0) {
        extraStacks += hero.suwenCarryStars;
        hero.suwenCarryStars = 0;
      }

      if (!projectile.noStack && !smallNeedle && !focus) {
        this.addSuwenStarStacks(target, hero, 1 + extraStacks, { flash: true });
      } else if (focus) {
        if (stacksBefore > 0) {
          target.suwenStarTime = Math.max(target.suwenStarTime || 0, this.suwenStackDuration(hero));
          this.zones.push({ type: 'starMark', x: target.x, y: target.y - 42, r: 30 + stacksBefore * 2, color: HERO_META[hero.type].color, life: .42, maxLife: .42 });
        }
        if (this.rogueLevel('E21') >= 3) this.setSuwenStarStacksAtLeast(target, hero, valueOr(suwenPassive.forceMinStacks, 3));
      }

      if (primary && !focus) this.applySuwenFocusAfterPrimaryHit(hero, target, inheritedFocus);
      if (primary) hero.suwenLastNeedleTarget = target.id;
    }

    if (focus) {
      hero.suwenFocusReady = 0;
      hero.suwenFocusCount = 0;
      hero.suwenFocusTarget = target.dead ? null : target.id;
      if (!target.dead && this.rogueLevel('E22') >= 3) {
        hero.suwenFocusLockTarget = target.id;
        hero.suwenFocusLockTime = valueOr(suwenPassive.focusLockDuration, 2);
      }
      if (!target.dead && this.suwenStarLevel(hero) >= 6) {
        var spreadTarget = this.findSuwenNeedleFallbackTarget(target.x, target.y, 220, target.id);
        if (spreadTarget) {
          this.addSuwenStarStacks(spreadTarget, hero, valueOr(suwenPassive.starSpreadStacks, 1), { flash: true });
          this.zones.push({ type: 'starLink', x: target.x, y: target.y - 18, tx: spreadTarget.x, ty: spreadTarget.y - 18, color: HERO_META[hero.type].color, life: .26, maxLife: .26 });
        }
      }
      this.floatText(target.x, target.y - 82, '问命针', HERO_META[hero.type].color, 20, { life: .78, bold: true, impact: true });
      return;
    }

    if (!primary || smallNeedle) return;

    var stacksAfter = target.dead ? stacksBefore : (target.suwenStarStacks || 0);
    if (this.rogueLevel('E09') >= 3 && stacksBefore >= 3) {
      this.damageEnemy(target, attackPower * valueOr(suwenAttack.inboneDamageAtk, .35), hero, { impact: true, noSuwenMechanic: true });
      this.floatText(target.x, target.y - 76, '星针入骨', HERO_META[hero.type].color, 17, { life: .7, bold: true });
    }
    if (this.rogueLevel('E20') >= 1) {
      var smallChance = this.rogueLevel('E20') >= 2 ? valueOr(suwenAttack.smallNeedleChanceUpgraded, .40) : valueOr(suwenAttack.smallNeedleChance, .25);
      if (this.rogueLevel('E20') >= 3 && stacksAfter >= 5) smallChance = 1;
      if (Math.random() < smallChance) {
        this.releaseSuwenFallingNeedle(hero, target.dead ? null : target, attackPower * valueOr(suwenAttack.smallNeedleDamageAtk, .40), {
          type: 'suwenSmall', smallNeedle: true, noStack: true, delay: .12,
          aimX: target.x, aimY: target.y, hitRadius: valueOr(suwenAttack.hitRadius, 42)
        });
        this.floatText(target.x, target.y - 72, '坠星连针', HERO_META[hero.type].color, 17, { life: .68, bold: true });
      }
    }
  };

  Game.prototype.projectileHit = function (p, target) {
    if (p.type === 'protagonistSigil' || p.type === 'protagonistTalisman') {
      this.zones.push({ type: 'orbImpact', x: target.x, y: target.y - 20, r: 46, vfxRow: 2, life: .28, maxLife: .28, age: 0 });
      this.damageEnemy(target, p.damage, null, { impact: true });
      if ((this.protagonistPierceLevel || 0) > 0) {
        var side = null, sideD = Infinity;
        for (var si = 0; si < this.enemies.length; si++) {
          var other = this.enemies[si];
          if (!other || other.dead || other.id === target.id) continue;
          var d = distance(other.x, other.y, target.x, target.y);
          if (d <= 104 && d < sideD) { side = other; sideD = d; }
        }
        if (side) {
          this.damageEnemy(side, p.damage * (.35 + (this.protagonistPierceLevel || 0) * .10), null, { impact: true });
          this.zones.push({ type: 'ring', x: side.x, y: side.y - 20, r: 28, color: '#8ff4ff', life: .24, maxLife: .24 });
        }
      }
      this.burst(target.x, target.y, '#8ff4ff', 7);
      return;
    }
    var hero = this.getHero(p.hero);
    if (!hero) return;
    var wasBurning = target.burn > 0;
    if (WALL_MODE) {
      if (this.isXuanyaBladeProjectile(p.type)) {
        this.applyXuanyaProjectileImpact(hero, target, p);
        this.burst(target.x, target.y - 18, p.color, p.type === 'xuanyaChase' ? 10 : 6);
        return;
      }
      if (p.type === 'qingyi') {
        this.applyQingyiProjectileImpact(hero, target, p);
        this.burst(target.x, target.y - 18, p.color, 6);
        return;
      }
      if (this.isSuwenNeedleProjectile(p.type)) {
        this.applySuwenProjectileImpact(hero, target, p);
        this.burst(target.x, target.y - 18, p.color, p.type === 'suwenEcho' ? 5 : 7);
        return;
      }
      var hongyiHit = this.isHongyiProjectile(p.type);
      this.zones.push({
        type: 'orbImpact', x: target.x, y: target.y - 20, r: hongyiHit ? (p.lotus ? 76 : 54) : 44,
        vfxRow: p.vfxRow || 0, life: .28, maxLife: .28, age: 0,
        hongyi: hongyiHit, lotus: !!p.lotus
      });
      if (hongyiHit) this.emitHongyiHitParticles(target.x, target.y - 20, p);
      this.damageEnemy(target, p.damage, hero, { impact: true });
      if (hongyiHit) this.applyHongyiProjectileImpact(hero, target, p, wasBurning);
      this.burst(target.x, target.y, p.color, 6);
      return;
    }
    this.zones.push({
      type: 'orbImpact', x: target.x, y: target.y - 20, r: p.type === 'hongyi' ? 62 : 54,
      vfxRow: p.vfxRow || 0, life: .34, maxLife: .34, age: 0
    });
    this.damageEnemy(target, p.damage, hero, { impact: true });
    if (p.type === 'hongyi' || p.type === 'hongyiEmber') {
      var hongyiAttack = heroSkillConfig('hongyi').attack || {};
      this.applyBurn(target, hero,
        p.burnDuration || valueOr(hongyiAttack.burnDuration, 3),
        p.burnDps || this.heroAttackPower(hero) * valueOr(hongyiAttack.burnDpsAtk, .10)
      );
      var e03Level = this.rogueLevel('E03');
      if (p.primary && e03Level >= 1) {
        for (var splashIndex = 0; splashIndex < this.enemies.length; splashIndex++) {
          var splashTarget = this.enemies[splashIndex];
          if (splashTarget.dead || splashTarget === target) continue;
          if (dist2(target.x, target.y, splashTarget.x, splashTarget.y) <= 55 * 55) {
            this.damageEnemy(splashTarget, this.heroAttackPower(hero) * .35, hero, { impact: true });
          }
        }
        this.zones.push({ type: 'emberBurst', x: target.x, y: target.y, r: 55, color: C.fire, life: .38, maxLife: .38 });
      }
      if (p.primary && p.canSplit !== false && e03Level >= 2) {
        var emberTargets = this.findProjectileTargets(target.x, target.y, [target.id], 2, 230, true);
        for (var emberIndex = 0; emberIndex < emberTargets.length; emberIndex++) {
          this.launchSecondaryProjectile(hero, target.x, target.y - 18, emberTargets[emberIndex], this.heroAttackPower(hero) * .25, 'hongyiEmber', {
            color: C.fire, r: 6, vfxRow: 0, burnDuration: 2,
            burnDps: this.heroAttackPower(hero) * valueOr(hongyiAttack.burnDpsAtk, .10), canSplit: false
          });
        }
        if (emberTargets.length) this.floatText(target.x, target.y - 72, '鬼火分裂', C.fire, 18, { life: .7, bold: true });
      }
    } else if (p.type === 'qingyi') {
      this.zones.push({ type: 'ring', x: target.x, y: target.y, r: 18, color: HERO_META[hero.type].color, life: .38 });
    } else if (p.type === 'suwen') {
      var abnormal = target.burn > 0 || target.bleed > 0 || target.flaw > 0 || target.armorBreak > 0 || target.suwenMarked > 0;
      var e09Level = this.rogueLevel('E09');
      var canPierce = e09Level >= 3 || abnormal;
      var excluded = [target.id], pierceTarget = null;
      if (canPierce) {
        var pierceTargets = this.findProjectileTargets(target.x, target.y, excluded, 1, 190, false);
        if (pierceTargets.length) {
          pierceTarget = pierceTargets[0]; excluded.push(pierceTarget.id);
          this.launchSecondaryProjectile(hero, target.x, target.y - 18, pierceTarget, p.damage * .65, 'suwenPierce', {
            color: HERO_META[hero.type].color, r: 5, vfxRow: 1
          });
        }
      }
      if (e09Level > 0 && (abnormal || e09Level >= 3 || hero.forceStarRicochet)) {
        var echoTargets = this.findProjectileTargets(pierceTarget ? pierceTarget.x : target.x, pierceTarget ? pierceTarget.y : target.y, excluded, 1, 220, false);
        if (echoTargets.length) {
          var echoDamage = this.heroAttackPower(hero) * (e09Level >= 2 ? .70 : .45);
          this.launchSecondaryProjectile(hero, pierceTarget ? pierceTarget.x : target.x, (pierceTarget ? pierceTarget.y : target.y) - 18, echoTargets[0], echoDamage, 'suwenEcho', {
            color: '#d8fff3', r: 6, vfxRow: 1
          });
          this.floatText(target.x, target.y - 74, '星针弹射', HERO_META[hero.type].color, 18, { life: .7, bold: true });
        }
        hero.forceStarRicochet = 0;
      }
    }
    this.burst(target.x, target.y, p.color, 7);
  };

  Game.prototype.findProjectileTargets = function (x, y, excludedIds, count, radius, preferUnburned) {
    var excluded = {}, candidates = [];
    for (var ex = 0; ex < (excludedIds || []).length; ex++) excluded[excludedIds[ex]] = true;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (enemy.dead || excluded[enemy.id]) continue;
      var d = dist2(x, y, enemy.x, enemy.y);
      if (d > radius * radius) continue;
      candidates.push({ enemy: enemy, score: d + (preferUnburned && enemy.burn > 0 ? radius * radius : 0) });
    }
    candidates.sort(function (a, b) { return a.score - b.score; });
    var result = [];
    for (var c = 0; c < candidates.length && result.length < count; c++) result.push(candidates[c].enemy);
    return result;
  };

  Game.prototype.launchSecondaryProjectile = function (hero, x, y, target, damage, type, options) {
    if (!hero || !target || target.dead) return;
    options = options || {};
    var projectile = {
      x: x, y: y, prevX: x, prevY: y, target: target.id, hero: hero.id, type: type,
      speed: hero.projectileSpeed * 1.05, damage: damage, color: options.color || HERO_META[hero.type].color,
      burnDuration: options.burnDuration || 0, burnDps: options.burnDps || 0,
      r: options.r || 6, life: 2.2, age: 0, vfxRow: options.vfxRow || 0,
      primary: false, canSplit: options.canSplit !== false,
      canPierce: options.canPierce !== false, canChase: options.canChase !== false,
      aimX: target.x, aimY: target.y
    };
    this.prepareProjectileFreeFlight(projectile, target, hero.attackRange || 800);
    this.projectiles.push(projectile);
  };

  Game.prototype.beginSkillMoment = function (hero) {
    var skillNames = {
      hongyi: '焚天火雨！', xuanya: '夜幕收割！', huangjin: '山岳护城！',
      suwen: '太素星落！', qingyi: '群体治愈！'
    };
    var color = HERO_META[hero.type].color;
    hero.skillCastFlash = .15;
    hero.skillReadyFlash = .15;
    this.skillVignette = { color: color, life: .3, maxLife: .3 };
    this.floatText(hero.x, hero.y - 142, skillNames[hero.type] || '御灵技！', color, 38, {
      life: 1, bold: true, rise: 16
    });
  };

  Game.prototype.castHeroUltimate = function (hero) {
    if (!hero || !hero.alive) return;
    if (!this.isHeroUltimateUnlocked(hero)) { hero.ultimateCd = hero.ultimateMax; return; }
    if (WALL_MODE) {
      this.castWallHeroUltimate(hero);
      return;
    }
    if (hero.type === 'hongyi') {
      if (!this.enemies.length) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var hongyiUltimate = heroSkillConfig('hongyi').ultimate || {};
      var hongyiAtk = this.heroAttackPower(hero);
      hero.invuln = Math.max(hero.invuln, valueOr(hongyiUltimate.invuln, .3));
      var fireRainLife = valueOr(hongyiUltimate.effectLife, .75);
      this.zones.push({ type: 'fireRain', x: W / 2, y: BOARD_H * .48, r: valueOr(hongyiUltimate.effectRadius, 520), life: fireRainLife, maxLife: fireRainLife, color: C.fire });
      for (var rain = this.enemies.length - 1; rain >= 0; rain--) {
        var burningEnemy = this.enemies[rain];
        if (burningEnemy.dead) continue;
        var wasBurning = burningEnemy.burn > 0;
        var rainDamage = hongyiAtk * valueOr(hongyiUltimate.damageAtk, .35);
        if (wasBurning) rainDamage += hongyiAtk * valueOr(hongyiUltimate.burningBonusAtk, .25);
        this.damageEnemy(burningEnemy, rainDamage, hero, { impact: true, skill: true });
        this.applyBurn(burningEnemy, hero, valueOr(hongyiUltimate.burnDuration, 4), hongyiAtk * valueOr(hongyiUltimate.burnDpsAtk, .10));
      }
      this.shake = Math.max(this.shake, valueOr(hongyiUltimate.shake, 9));
    } else if (hero.type === 'qingyi') {
      this.beginSkillMoment(hero);
      var qingyiUltimate = heroSkillConfig('qingyi').ultimate || {};
      var qingyiHeal = this.heroAttackPower(hero) * valueOr(qingyiUltimate.healAtk, 2.5);
      for (var qi = 0; qi < this.heroes.length; qi++) {
        var ally = this.heroes[qi];
        if (!ally.alive) continue;
        var receivedHeal = qingyiHeal * this.healingReceivedMultiplier(ally, hero);
        this.healHero(ally, qingyiHeal, hero);
        this.addHolyShield(ally, receivedHeal * valueOr(qingyiUltimate.shieldRatio, .6), valueOr(qingyiUltimate.shieldDuration, 4));
      }
      this.zones.push({ type: 'heal', x: W / 2, y: 720, r: valueOr(qingyiUltimate.effectRadius, 210), color: HERO_META[hero.type].color, life: valueOr(qingyiUltimate.effectLife, 1.05) });
      this.shake = Math.max(this.shake, valueOr(qingyiUltimate.shake, 3));
    } else if (hero.type === 'huangjin') {
      this.beginSkillMoment(hero);
      if (hero.wallBarrierShield > 0) this.clearHuangjinWall(hero, true);
      var huangjinUltimate = heroSkillConfig('huangjin').ultimate || {};
      var shieldAmount = hero.maxHp * valueOr(huangjinUltimate.shieldMaxHp, .3);
      hero.shield += shieldAmount;
      hero.shieldFlash = .45;
      hero.wallBarrierShield = shieldAmount;
      hero.wallBarrierTime = valueOr(huangjinUltimate.duration, 6);
      hero.wallBarrierReduction = valueOr(huangjinUltimate.reduction, .25);
      hero.invuln = Math.max(hero.invuln, valueOr(huangjinUltimate.invuln, .15));
      this.floatText(hero.x, hero.y - 116, '山岳护城', C.gold, 24, { life: 1, bold: true, rise: 18 });
      this.zones.push({ type: 'guard', x: hero.x, y: hero.y, r: valueOr(huangjinUltimate.effectRadius, 128), color: C.gold, life: hero.wallBarrierTime, hero: hero.id });
    } else if (hero.type === 'xuanya') {
      var target = this.highestThreatEnemy();
      if (!target) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var xuanyaUltimate = heroSkillConfig('xuanya').ultimate || {};
      var hits = valueOr(xuanyaUltimate.hits, 3);
      for (var h = 0; h < hits; h++) this.damageEnemy(target, this.heroAttackPower(hero) * valueOr(xuanyaUltimate.damageAtk, .8), hero, h === 0 ? { impact: true, skill: true } : { skill: true });
      target.flaw = valueOr(xuanyaUltimate.flawDuration, 4);
      target.flawDamageTaken = valueOr(xuanyaUltimate.flawDamageTaken, .20);
      hero.x = clamp(target.x + (Math.random() * 50 - 25), 60, 690);
      hero.y = clamp(target.y + 42, 180, 885);
      this.zones.push({ type: 'slash', x: hero.x - 70, y: hero.y, tx: target.x + 70, ty: target.y - 50, color: '#f6e7c0', life: .5 });
    } else if (hero.type === 'suwen') {
      var centerEnemy = this.densestEnemy() || this.highestThreatEnemy();
      if (!centerEnemy) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var suwenUltimate = heroSkillConfig('suwen').ultimate || {};
      var radius = valueOr(suwenUltimate.radius, 135);
      var totalDamage = this.heroAttackPower(hero) * valueOr(suwenUltimate.damageAtk, .18) * valueOr(suwenUltimate.hits, 5);
      this.zones.push({ type: 'ring', x: centerEnemy.x, y: centerEnemy.y, r: radius, color: HERO_META[hero.type].color, life: valueOr(suwenUltimate.effectLife, 1.05) });
      var starTargets = [];
      for (var si = 0; si < this.enemies.length; si++) {
        var starTarget = this.enemies[si];
        if (!starTarget.dead && dist2(centerEnemy.x, centerEnemy.y, starTarget.x, starTarget.y) <= radius * radius) {
          starTargets.push(starTarget);
        }
      }
      starTargets.sort(function (a, b) {
        var priorityA = (a.type === 'boss' ? 3 : a.elite ? 2 : 1) * 100000 + a.hp;
        var priorityB = (b.type === 'boss' ? 3 : b.elite ? 2 : 1) * 100000 + b.hp;
        return priorityB - priorityA;
      });
      var maxStarTargets = valueOr(suwenUltimate.maxTargets, 6);
      for (var starIndex = 0; starIndex < starTargets.length && starIndex < maxStarTargets; starIndex++) {
        var selectedStarTarget = starTargets[starIndex];
        selectedStarTarget.armorBreak = Math.max(selectedStarTarget.armorBreak || 0, valueOr(suwenUltimate.breakDuration, 5));
        selectedStarTarget.skillDamageTaken = Math.max(selectedStarTarget.skillDamageTaken || 0, valueOr(suwenUltimate.skillDamageTaken, .10));
        this.damageEnemy(selectedStarTarget, totalDamage, hero, { impact: true, skill: true });
      }
      this.shake = Math.max(this.shake, valueOr(suwenUltimate.shake, 5));
    }
    hero.ultimateCd = hero.ultimateMax;
    hero.flash = .18; hero.attackAnim = .55; this.audio.tone('bell'); this.shake = Math.max(this.shake, 4);
  };

  Game.prototype.spiritLineRangedTarget = function (enemy) {
    if (!enemy || enemy.attackType !== 'ranged') return null;
    var best = null, bestD = Infinity;
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (!hero.lineUnlocked || !hero.alive || hero.lineSlot !== enemy.lineSector) continue;
      var d = distance(enemy.x, enemy.y, hero.x, hero.y);
      if (d <= (enemy.attackRange || 180) && d < bestD) { best = hero; bestD = d; }
    }
    return best;
  };

  Game.prototype.updateSpiritLineEnemyAction = function (enemy, dt) {
    if (enemy.attackWindup > 0) {
      enemy.attackWindup -= dt;
      if (enemy.attackWindup <= 0) {
        var pendingHero = this.getHero(enemy.pendingHero);
        enemy.pendingHero = null;
        if (pendingHero && pendingHero.alive && pendingHero.lineUnlocked && distance(enemy.x, enemy.y, pendingHero.x, pendingHero.y) <= (enemy.attackRange || 66) + 24) {
          this.damageHero(pendingHero, enemy.damage, enemy);
          enemy.hitHold = .035;
          enemy.attackAnim = enemy.attackDuration;
        }
      }
      return;
    }
    var targetHero = null;
    if (enemy.blocker) {
      targetHero = this.getHero(enemy.blocker);
      if (!targetHero || !targetHero.alive || !targetHero.lineUnlocked || targetHero.lineSlot !== enemy.lineSector || distance(enemy.x, enemy.y, targetHero.x, targetHero.y) > 155) {
        enemy.blocker = null;
        targetHero = null;
      }
    }
    if (!targetHero) targetHero = this.spiritLineRangedTarget(enemy);

    if (targetHero) {
      enemy.breaking = false;
      var targetDistance = distance(enemy.x, enemy.y, targetHero.x, targetHero.y);
      var attackRange = enemy.attackRange || 66;
      if (targetDistance <= attackRange) {
        if (enemy.attackCd <= 0) {
          enemy.attackCd = enemy.attackRate;
          if (enemy.attackWindupDuration > 0) {
            enemy.pendingHero = targetHero.id;
            enemy.attackWindup = enemy.attackWindupDuration;
            enemy.attackAnim = 0;
          } else {
            this.damageHero(targetHero, enemy.damage, enemy);
            enemy.hitHold = .035;
            enemy.attackAnim = enemy.attackDuration;
          }
        }
      } else if (enemy.freeze <= 0 && enemy.blocker) {
        // 被近战阻挡的敌人只向阻挡者贴近；远程不会追逐，射程外继续沿路前进。
        var d = Math.max(1, targetDistance), step = enemy.speed * this.wallEnemyMoveSpeedMultiplier(enemy) * dt;
        enemy.x += (targetHero.x - enemy.x) / d * step;
        enemy.y += (targetHero.y - enemy.y) / d * step;
        enemy.moving = true;
      } else if (!enemy.blocker && enemy.freeze <= 0) {
        this.advanceWallEnemyAlongPath(enemy, dt, enemy.speed * this.wallEnemyMoveSpeedMultiplier(enemy));
        enemy.moving = true;
      }
      return;
    }

    if (this.wallEnemyFootY(enemy) >= WALL_DEFENSE_LINE_Y) {
      enemy.breaking = true;
      enemy.y = this.wallEnemyBreachCenterY(enemy);
      if (enemy.attackCd <= 0) {
        this.applyWallDamage(enemy.damage, enemy.x, WALL_DEFENSE_LINE_Y);
        enemy.attackCd = enemy.attackRate;
        enemy.attackAnim = enemy.attackDuration;
        if (this.baseHp <= 0) { this.baseHp = 0; this.endBattle(false); }
      }
    } else if (enemy.freeze <= 0) {
      enemy.breaking = false;
      this.advanceWallEnemyAlongPath(enemy, dt, enemy.speed * this.wallEnemyMoveSpeedMultiplier(enemy));
      enemy.moving = true;
    }
  };

  Game.prototype.updateWallEnemies = function (dt) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var enemy = this.enemies[i];
      if (enemy.dead) { this.enemies.splice(i, 1); continue; }
      enemy.age += dt;
      enemy.hit = Math.max(0, (enemy.hit || 0) - dt);
      enemy.redFlash = Math.max(0, (enemy.redFlash || 0) - dt);
      enemy.hpBarTime = Math.max(0, (enemy.hpBarTime || 0) - dt);
      enemy.hitHold = Math.max(0, (enemy.hitHold || 0) - dt);
      enemy.attackAnim = Math.max(0, (enemy.attackAnim || 0) - dt);
      enemy.attackCd -= dt;
      enemy.moving = false;
      enemy.slow = Math.max(0, (enemy.slow || 0) - dt);
      enemy.freeze = Math.max(0, (enemy.freeze || 0) - dt);
      if (enemy.spiritLineV2StunDamageTaken) enemy.spiritLineV2StunDamageTaken = Math.max(0, enemy.spiritLineV2StunDamageTaken - dt);
      if (enemy.armorBreak) enemy.armorBreak = Math.max(0, enemy.armorBreak - dt);
      if (enemy.flaw) enemy.flaw = Math.max(0, enemy.flaw - dt);
      if (enemy.skillDamageTaken && !enemy.armorBreak) enemy.skillDamageTaken = 0;
      if (enemy.suwenMarked) {
        enemy.suwenMarked = Math.max(0, enemy.suwenMarked - dt);
        if (enemy.suwenMarked <= 0) enemy.markDamageTaken = 0;
      }
      if (enemy.suwenStarTime) {
        enemy.suwenStarTime = Math.max(0, enemy.suwenStarTime - dt);
        if (enemy.suwenStarTime <= 0) {
          enemy.suwenStarStacks = 0;
          enemy.suwenStarSource = null;
        }
      }
      if (enemy.xuanyaMark) {
        enemy.xuanyaMark = Math.max(0, enemy.xuanyaMark - dt);
        if (enemy.xuanyaMark <= 0) enemy.xuanyaMarkSource = null;
      }
      if (enemy.qingyiExposeTime) {
        enemy.qingyiExposeTime = Math.max(0, enemy.qingyiExposeTime - dt);
        if (enemy.qingyiExposeTime <= 0) {
          enemy.qingyiExposeBonus = 0;
          enemy.qingyiExposeSource = null;
        }
      }
      if (enemy.qingyiGlowCd) enemy.qingyiGlowCd = Math.max(0, enemy.qingyiGlowCd - dt);
      if (enemy.huangjinSuppressTime) {
        enemy.huangjinSuppressTime = Math.max(0, enemy.huangjinSuppressTime - dt);
        if (enemy.huangjinSuppressTime <= 0) {
          enemy.huangjinSuppressStacks = 0;
          enemy.huangjinSuppressSource = null;
        }
      }
      if (enemy.huangjinGatherCd) enemy.huangjinGatherCd = Math.max(0, enemy.huangjinGatherCd - dt);
      if (enemy.huangjinGatherSlow) enemy.huangjinGatherSlow = Math.max(0, enemy.huangjinGatherSlow - dt);
      if (enemy.huangjinHeavySlow) enemy.huangjinHeavySlow = Math.max(0, enemy.huangjinHeavySlow - dt);
      if (enemy.spiritLineBloodSlow) enemy.spiritLineBloodSlow = Math.max(0, enemy.spiritLineBloodSlow - dt);
      if (enemy.huangjinControlFatigueTime) {
        enemy.huangjinControlFatigueTime = Math.max(0, enemy.huangjinControlFatigueTime - dt);
        if (enemy.huangjinControlFatigueTime <= 0) enemy.huangjinControlFatigue = 0;
      }
      if (enemy.hongyiLotusFire) {
        enemy.hongyiLotusFire = Math.max(0, enemy.hongyiLotusFire - dt);
        if (enemy.hongyiLotusFire <= 0) enemy.hongyiLotusSource = null;
      }
      if (enemy.bleed > 0) {
        enemy.bleed -= dt;
        enemy.bleedTick = (enemy.bleedTick || .5) - dt;
        if (enemy.bleedTick <= 0) {
          enemy.bleedTick = .5;
          this.damageEnemy(enemy, (enemy.bleedDps || 0) * .5, this.getHero(enemy.bleedSource), { dot: true });
          if (enemy.dead) continue;
        }
      }
      if (enemy.burn > 0) {
        enemy.burn -= dt;
        enemy.burnTick = (enemy.burnTick || .5) - dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = .5;
          var wallBurnSource = this.getHero(enemy.burnSource);
          this.damageEnemy(enemy, (enemy.burnDps || 0) * .5, wallBurnSource, { dot: true });
          this.onHongyiBurnTick(enemy, wallBurnSource);
          this.onRuneDotTick(enemy, wallBurnSource);
          if (enemy.dead) continue;
        }
      }
      if (enemy.hpLag == null) enemy.hpLag = enemy.hp;
      else if (enemy.hpLag > enemy.hp) {
        enemy.hpLag += (enemy.hp - enemy.hpLag) * Math.min(1, dt * 7.5);
      }
      if (this.isSpiritLineMode()) {
        this.updateSpiritLineEnemyAction(enemy, dt);
        if (this.state !== 'battle') return;
        continue;
      }
      if (enemy.nubaRescueThreat && this.nubaRescue && !this.nubaRescue.complete) {
        enemy.slow = 0; enemy.freeze = 0; enemy.huangjinSuppressTime = 0; enemy.huangjinSuppressStacks = 0;
        enemy.huangjinGatherSlow = 0; enemy.huangjinHeavySlow = 0; enemy.blocker = null;
      }
      if (this.wallEnemyFootY(enemy) >= WALL_DEFENSE_LINE_Y) {
        var justReachedWall = !enemy.breaking;
        enemy.breaking = true;
        enemy.y = this.wallEnemyBreachCenterY(enemy);
        if (justReachedWall) {
          enemy.wallAttackWindup = 0;
          enemy.attackCd = Math.max(enemy.attackCd, .3);
        }
        if (enemy.wallAttackWindup > 0) {
          enemy.wallAttackWindup -= dt;
          if (enemy.wallAttackWindup > 0) continue;
          enemy.attackCd = enemy.attackRate;
          this.applyWallDamage(enemy.damage, enemy.x, WALL_DEFENSE_LINE_Y);
          if (this.baseHp <= 0) { this.baseHp = 0; this.endBattle(false); return; }
        } else if (enemy.attackCd <= 0) {
          enemy.wallAttackWindup = Math.max(.24, enemy.attackDuration * .45);
          enemy.attackAnim = enemy.attackDuration;
        }
      } else {
        enemy.breaking = false;
        enemy.wallAttackWindup = 0;
        if (enemy.freeze > 0) continue;
        var wallEnemySpeed = enemy.speed * this.wallEnemyMoveSpeedMultiplier(enemy);
        this.advanceWallEnemyAlongPath(enemy, dt, wallEnemySpeed);
        enemy.moving = true;
      }
    }
  };

  Game.prototype.updateEnemies = function (dt) {
    if (WALL_MODE) { this.updateWallEnemies(dt); return; }
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var enemy = this.enemies[i];
      if (enemy.dead) { this.enemies.splice(i, 1); continue; }
      enemy.age += dt; enemy.hit = Math.max(0, enemy.hit - dt);
      enemy.hpBarTime = Math.max(0, (enemy.hpBarTime || 0) - dt);
      enemy.redFlash = Math.max(0, (enemy.redFlash || 0) - dt);
      enemy.hitHold = Math.max(0, (enemy.hitHold || 0) - dt);
      enemy.moving = false;
      enemy.hpLagHold = Math.max(0, (enemy.hpLagHold || 0) - dt);
      if (enemy.hpLag == null) enemy.hpLag = enemy.hp;
      else if (enemy.hpLag < enemy.hp) enemy.hpLag = enemy.hp;
      else if (enemy.hpLag > enemy.hp && enemy.hpLagHold <= 0) {
        enemy.hpLag += (enemy.hp - enemy.hpLag) * Math.min(1, dt * 7.5);
        if (enemy.hpLag - enemy.hp < .8) enemy.hpLag = enemy.hp;
      }
      if (enemy.hitHold <= 0) enemy.attackAnim = Math.max(0, enemy.attackAnim - dt);
      enemy.summonAnim = Math.max(0, enemy.summonAnim - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.freeze = Math.max(0, enemy.freeze - dt);
      if (enemy.armorBreak) enemy.armorBreak = Math.max(0, enemy.armorBreak - dt);
      if (enemy.flaw) enemy.flaw = Math.max(0, enemy.flaw - dt);
      if (enemy.skillDamageTaken && !enemy.armorBreak) enemy.skillDamageTaken = 0;
      if (enemy.suwenMarked) {
        enemy.suwenMarked = Math.max(0, enemy.suwenMarked - dt);
        if (enemy.suwenMarked <= 0) enemy.markDamageTaken = 0;
      }
      if (enemy.suwenStarTime) {
        enemy.suwenStarTime = Math.max(0, enemy.suwenStarTime - dt);
        if (enemy.suwenStarTime <= 0) {
          enemy.suwenStarStacks = 0;
          enemy.suwenStarSource = null;
        }
      }
      if (enemy.xuanyaMark) {
        enemy.xuanyaMark = Math.max(0, enemy.xuanyaMark - dt);
        if (enemy.xuanyaMark <= 0) enemy.xuanyaMarkSource = null;
      }
      if (enemy.hongyiLotusFire) {
        enemy.hongyiLotusFire = Math.max(0, enemy.hongyiLotusFire - dt);
        if (enemy.hongyiLotusFire <= 0) enemy.hongyiLotusSource = null;
      }
      if (enemy.bleed > 0) {
        enemy.bleed -= dt;
        enemy.bleedTick = (enemy.bleedTick || .5) - dt;
        if (enemy.bleedTick <= 0) {
          enemy.bleedTick = .5;
          this.damageEnemy(enemy, (enemy.bleedDps || 0) * .5, this.getHero(enemy.bleedSource), { dot: true });
          if (enemy.dead) continue;
        }
      }
      if (enemy.burn > 0) {
        enemy.burn -= dt; enemy.burnTick -= dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = .5;
          var source = this.getHero(enemy.burnSource);
          this.damageEnemy(enemy, enemy.burnDps * .5, source, { dot: true });
          this.onHongyiBurnTick(enemy, source);
          this.onRuneDotTick(enemy, source);
          if (!enemy.dead && source && source.faction === '鬼族' && this.rogueLevel('F07') >= 3 && Math.random() < .10) {
            this.damageEnemy(enemy, enemy.burnDps * .5, source, { dot: true });
            this.onHongyiBurnTick(enemy, source);
            this.onRuneDotTick(enemy, source);
          }
          if (enemy.dead) continue;
        }
      }
      if (enemy.type === 'boss') {
        enemy.summonCd -= dt;
        if (enemy.summonCd <= 0 && this.enemies.length < 30) {
          enemy.summonCd = 8; enemy.summonAnim = .65;
          for (var summon = 0; summon < 6 && this.enemies.length < 34; summon++) {
            this.spawnEnemy({ type: 'wisp', elite: false, countInWave: true });
          }
          if (enemy.hp < enemy.maxHp * .3 && this.enemies.length < 34) {
            this.spawnEnemy({ type: 'jiangshi', elite: false, countInWave: true });
          }
        }
      }
      enemy.attackCd -= dt;

      if (enemy.attackWindup > 0) {
        enemy.attackWindup -= dt;
        if (enemy.attackWindup <= 0) {
          var pendingHero = this.getHero(enemy.pendingHero);
          enemy.pendingHero = null;
          if (pendingHero && pendingHero.alive && distance(enemy.x, enemy.y, pendingHero.x, pendingHero.y) <= (enemy.attackRange || 66) + 28) {
            enemy.attackFacing = pendingHero.x >= enemy.x ? 1 : -1;
            this.damageHero(pendingHero, enemy.damage, enemy);
            enemy.hitHold = enemy.type === 'wisp' ? .055 : .035;
            enemy.attackAnim = enemy.attackDuration;
          } else {
            enemy.attackAnim = Math.min(enemy.attackDuration || .5, .18);
          }
        }
        continue;
      }

      var enemyMeleeRange = enemy.attackRange || 66;
      var targetHero = null;
      if (enemy.blocker) {
        targetHero = this.getHero(enemy.blocker);
        if (!targetHero || !targetHero.alive || distance(enemy.x, enemy.y, targetHero.x, targetHero.y) > 250) {
          enemy.blocker = null;
          targetHero = null;
        }
      }
      if (!targetHero && !enemy.bypassed) targetHero = this.nearestHeroWithCapacity(enemy, 520);

      if (targetHero) {
        enemy.breaking = false;
          if (Math.abs(targetHero.x - enemy.x) > 2) enemy.attackFacing = targetHero.x >= enemy.x ? 1 : -1;
        var targetDistance = distance(enemy.x, enemy.y, targetHero.x, targetHero.y);
        if (targetDistance <= enemyMeleeRange) {
          if (enemy.attackCd <= 0) {
            enemy.attackCd = enemy.attackRate;
            if (enemy.attackWindupDuration > 0) {
              enemy.pendingHero = targetHero.id;
              enemy.attackWindup = enemy.attackWindupDuration;
              enemy.attackAnim = 0;
            } else {
              this.damageHero(targetHero, enemy.damage, enemy);
              enemy.hitHold = .035;
              enemy.attackAnim = enemy.attackDuration;
            }
          }
        } else if (enemy.freeze <= 0 && targetDistance > 0) {
          var slowFactor = enemy.slow > 0 ? .52 : 1;
          var moveStep = enemy.speed * slowFactor * dt;
          enemy.x = clamp(enemy.x + (targetHero.x - enemy.x) / targetDistance * moveStep, 20, 730);
          enemy.y = clamp(enemy.y + (targetHero.y - enemy.y) / targetDistance * moveStep, -90, 914);
          enemy.moving = true;
        }
      } else if (enemy.y >= 914) {
        enemy.breaking = true; enemy.blocker = null;
        if (enemy.attackCd <= 0) {
          var baseDamage = enemy.damage * (1 - this.upgradeValue('U08', [.10, .18], 0));
          this.baseHp -= baseDamage; enemy.attackCd = enemy.attackRate; enemy.attackAnim = enemy.attackDuration;
          enemy.hitHold = enemy.type === 'wisp' ? .05 : .035;
          this.spiritLampHit = .35;
          this.floatText(enemy.x, 900, '-' + Math.round(baseDamage) + ' 阵界', C.danger, 22);
          this.localHitFeedback(enemy.x, 914, C.danger, { radius: 32, particles: 8, heavy: true });
          this.audio.playSfx('wallHitHeavy') || this.audio.tone('hurt');
          if (this.baseHp <= 0) { this.baseHp = 0; this.endBattle(false); return; }
        }
      } else if (enemy.freeze <= 0) {
        if (!this.hasHeroBlockCapacity()) enemy.bypassed = true;
        enemy.breaking = true; enemy.blocker = null;
        var slow = enemy.slow > 0 ? .52 : 1;
        enemy.y = Math.min(914, enemy.y + enemy.speed * slow * dt);
        enemy.moving = true;
      }
    }
  };

  Game.prototype.softCollisionRadius = function (unit, kind) {
    if (kind === 'hero') {
      var heroScale = Math.max(.82, unit.scale || 1);
      var base = unit.type === 'huangjin' ? 35 : unit.type === 'xuanya' ? 30 : 28;
      return base * heroScale;
    }
    var enemyScale = unit.size || 1;
    if (unit.type === 'boss') return 50 * enemyScale;
    return (unit.elite ? 31 : 24) * enemyScale;
  };

  Game.prototype.softSeparatePair = function (a, b, minDist, aWeight, bWeight, xScale, yScale, relax) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < .01) {
      var angle = (((a.id || 1) * 97 + (b.id || 2) * 57) % 628) / 100;
      dx = Math.cos(angle); dy = Math.sin(angle); d = 1;
    }
    if (d >= minDist) return;
    var overlap = (minDist - d) * relax;
    var nx = dx / d, ny = dy / d;
    a.x -= nx * overlap * aWeight * xScale;
    a.y -= ny * overlap * aWeight * yScale;
    b.x += nx * overlap * bWeight * xScale;
    b.y += ny * overlap * bWeight * yScale;
  };

  Game.prototype.resolveSoftCollisions = function (dt) {
    var relax = clamp(dt * 12, .08, .34);
    var liveHeroes = [], liveEnemies = [];
    for (var i = 0; i < this.heroes.length; i++) {
      if (this.heroes[i].alive) liveHeroes.push(this.heroes[i]);
    }
    for (var e = 0; e < this.enemies.length; e++) {
      if (!this.enemies[e].dead) liveEnemies.push(this.enemies[e]);
    }

    for (var h1 = 0; h1 < liveHeroes.length; h1++) {
      for (var h2 = h1 + 1; h2 < liveHeroes.length; h2++) {
        var heroA = liveHeroes[h1], heroB = liveHeroes[h2];
        var hrA = this.softCollisionRadius(heroA, 'hero'), hrB = this.softCollisionRadius(heroB, 'hero');
        this.softSeparatePair(heroA, heroB, (hrA + hrB) * .76, .5, .5, 1, .72, relax);
      }
    }

    for (var ee1 = 0; ee1 < liveEnemies.length; ee1++) {
      for (var ee2 = ee1 + 1; ee2 < liveEnemies.length; ee2++) {
        var enemyA = liveEnemies[ee1], enemyB = liveEnemies[ee2];
        var erA = this.softCollisionRadius(enemyA, 'enemy'), erB = this.softCollisionRadius(enemyB, 'enemy');
        this.softSeparatePair(enemyA, enemyB, (erA + erB) * .56, .5, .5, .82, .24, relax * .68);
      }
    }

    for (var hh = 0; hh < liveHeroes.length; hh++) {
      var hero = liveHeroes[hh], heroR = this.softCollisionRadius(hero, 'hero');
      for (var ee = 0; ee < liveEnemies.length; ee++) {
        var enemy = liveEnemies[ee], enemyR = this.softCollisionRadius(enemy, 'enemy');
        var isBlockedContact = enemy.blocker === hero.id;
        var keep = isBlockedContact ? .58 : .64;
        this.softSeparatePair(hero, enemy, (heroR + enemyR) * keep, .24, .76, 1, .56, relax * .86);
      }
    }

    var heroTune = battleTuning().hero || {};
    for (var ch = 0; ch < liveHeroes.length; ch++) {
      var minHeroY = liveHeroes[ch].attackType === 'ranged' ? (heroTune.rangedPressY || 620) : (heroTune.meleePressY || 440);
      liveHeroes[ch].x = clamp(liveHeroes[ch].x, 32, W - 32);
      liveHeroes[ch].y = clamp(liveHeroes[ch].y, minHeroY, 914);
    }
    for (var ce = 0; ce < liveEnemies.length; ce++) {
      liveEnemies[ce].x = clamp(liveEnemies[ce].x, 24, W - 24);
      liveEnemies[ce].y = clamp(liveEnemies[ce].y, -100, 914);
    }
  };

  Game.prototype.nearestHeroWithin = function (enemy, radius) {
    var best = null, bestD = radius;
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (!hero.alive) continue;
      var d = distance(enemy.x, enemy.y, hero.x, hero.y);
      if (d <= bestD) { bestD = d; best = hero; }
    }
    return best;
  };

  Game.prototype.nearestHeroWithCapacity = function (enemy, radius) {
    var best = null, bestScore = Infinity;
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (!hero.alive) continue;
      var capacity = Math.max(0, hero.block || 0);
      var blocked = 0;
      for (var j = 0; j < this.enemies.length; j++) {
        if (!this.enemies[j].dead && this.enemies[j].blocker === hero.id) blocked++;
      }
      if (blocked >= capacity) continue;
      var d = distance(enemy.x, enemy.y, hero.x, hero.y);
      if (d > radius) continue;
      var grid = this.heroAnchor(hero);
      var lanePenalty = Math.abs((grid && grid.col || 0) - (enemy.gridCol || 0)) * 44;
      var rowPenalty = (grid && grid.row || 0) * 130;
      var guardBonus = hero.type === 'huangjin' ? -95 : 0;
      var capacityBonus = Math.min(4, capacity) * -12;
      var score = d + lanePenalty + rowPenalty + guardBonus + capacityBonus;
      if (score < bestScore) { bestScore = score; best = hero; }
    }
    return best;
  };

  Game.prototype.hasHeroBlockCapacity = function () {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (!hero.alive) continue;
      var capacity = Math.max(0, hero.block || 0);
      var blocked = 0;
      for (var j = 0; j < this.enemies.length; j++) {
        if (!this.enemies[j].dead && this.enemies[j].blocker === hero.id) blocked++;
      }
      if (blocked < capacity) return true;
    }
    return false;
  };

  Game.prototype.outgoingDamageMultiplier = function (source, enemy, options) {
    var mult = 1;
    options = options || {};
    if (this.rogueLevel('U10') > 0) mult *= 1 + Math.min(5, this.distinctFactionCount()) * .06;
    if (options.skill) mult *= 1 + this.upgradeValue('U07', [.10, .18, .26], 0);
    if (enemy && this.isBlockedByFaction(enemy, '人族')) mult *= 1 + this.upgradeValue('F02', [.12, .20, .28], 0);
    if (enemy && enemy.markDamageTaken) mult *= 1 + enemy.markDamageTaken;
    if (enemy && (enemy.qingyiExposeTime || 0) > 0 && source && !options.noQingyiExposeBonus) {
      mult *= 1 + (enemy.qingyiExposeBonus || valueOr((heroSkillConfig('qingyi').attack || {}).markDamageBonus, .08));
    }
    if (enemy && (enemy.qingyiExposeTime || 0) > 0 && source && (source.qingyiSynergyTime || 0) > 0 && !options.noQingyiSynergyBonus) {
      mult *= 1 + valueOr((heroSkillConfig('qingyi').passive || {}).synergyDamageBonus, .10);
    }
    if (enemy && (this.protagonistRainTime || 0) > 0 && source && !options.noProtagonistRainBonus) {
      mult *= 1 + valueOr(SPELL_META.rain && SPELL_META.rain.vulnerable, .15);
    }
    if (enemy && source && source.type === 'suwen' && (enemy.suwenStarStacks || 0) > 0 && !options.noSuwenStarBonus) {
      mult *= 1 + Math.min(this.suwenMaxStacks(source), enemy.suwenStarStacks || 0) * this.suwenStackDamageBonus(source);
    }
    if (enemy && enemy.flaw > 0 && source && (source.job === '战士' || source.job === '坦克')) {
      mult *= 1 + (enemy.flawDamageTaken || .20);
    }
    if (enemy && enemy.skillDamageTaken && options.skill) mult *= 1 + enemy.skillDamageTaken;
    if (source) {
      if (source.faction === '神' && options.skill) mult *= 1 + this.upgradeValue('F09', [.18, .30, .42], 0);
    }
    return mult;
  };

  Game.prototype.damageHero = function (hero, amount, enemy) {
    if (!hero.alive || hero.invuln > 0) return;
    var reduction = this.heroDefenseReduction(hero);
    var damage = amount * (1 - reduction);
    if (this.hasHuangjinWallReduction(hero)) damage *= (1 - (hero.wallBarrierReduction || .25));
    if (this.rogueLevel('U10') > 0) damage *= 1 - Math.min(5, this.distinctFactionCount()) * .04;
    if (this.rogueLevel('U02') >= 3 && !hero.firstHitGuardUsed) {
      hero.firstHitGuardUsed = true;
      damage *= .70;
      this.floatText(hero.x, hero.y - 112, '护身符甲', C.gold, 18, { life: .8, bold: true });
    }
    if (hero.shield > 0) {
      var absorbed = Math.min(hero.shield, damage);
      hero.shield -= absorbed; damage -= absorbed;
      if (absorbed > 0) hero.shieldFlash = .28;
      if (hero.holyShield > 0) hero.holyShield = Math.max(0, hero.holyShield - absorbed);
      if (hero.wallBarrierTime > 0 && hero.wallBarrierShield > 0) {
        hero.wallBarrierShield = Math.max(0, hero.wallBarrierShield - absorbed);
        if (hero.wallBarrierShield <= 0) this.clearHuangjinWall(hero, false);
      }
    }
    hero.hp -= damage; hero.flash = .16; hero.redFlash = .18; hero.hitReact = .18;
    this.impactPause(.025, 0);
    this.localHitFeedback(hero.x, hero.y - 42, C.danger, { radius: 30, particles: 6 });
    if (enemy && enemy.type === 'wisp') {
      var clawAngle = Math.atan2(hero.y - enemy.y, hero.x - enemy.x);
      this.zones.push({
        type: 'wispClawHit',
        x: hero.x, y: hero.y - 36, angle: clawAngle,
        r: 54, color: C.blue, life: .26, maxLife: .26
      });
      this.burst(hero.x, hero.y - 42, C.blue, 5);
    }
    if (damage > 0) this.floatText(hero.x, hero.y - 80, '-' + Math.round(damage), '#ff9b8b', 20, { impact: true, bold: damage > 60, rise: 28 });
    if (hero.hp <= 0) this.soulReturn(hero);
  };

  Game.prototype.applyWallDamage = function (amount, x, y) {
    var incoming = Math.max(0, amount || 0);
    if (this.isFirstStageTutorialActive() && !this.firstStageTutorial.summoned) incoming *= .04;
    var absorbed = 0;
    if ((this.wallShield || 0) > 0) {
      absorbed = Math.min(this.wallShield, incoming);
      this.wallShield -= absorbed;
      incoming -= absorbed;
      if (absorbed > 0) {
        this.wallShieldFlash = .38;
        this.floatText(x, y - 48, '护盾 -' + Math.round(absorbed), '#9eefff', 18, { life: .7, bold: true, rise: 20 });
      }
    }
    if (incoming > 0) {
      this.baseHp -= incoming;
      this.floatText(x, y - 26, '-' + Math.round(incoming) + ' 城防', C.danger, 21);
    }
    this.spiritLampHit = .35;
    this.localHitFeedback(x, y, incoming > 0 ? C.danger : '#9eefff', {
      radius: incoming > 0 ? 32 : 26,
      particles: incoming > 0 ? 7 : 5,
      heavy: incoming > 0
    });
    this.audio.playSfx(incoming > Math.max(60, (this.baseMax || 1000) * .08) ? 'wallHitHeavy' : 'wallHitLight') || this.audio.tone('hurt');
    return { damage: incoming, absorbed: absorbed };
  };

  Game.prototype.healWall = function (amount, source, options) {
    options = options || {};
    var finalAmount = Math.max(0, amount || 0);
    var missing = Math.max(0, (this.baseMax || 0) - (this.baseHp || 0));
    var actual = Math.min(finalAmount, missing);
    var overflow = Math.max(0, finalAmount - actual);
    var shield = 0;
    if (actual > 0) {
      this.baseHp = Math.min(this.baseMax, this.baseHp + actual);
      this.floatText(BATTLE_LOWER_ART.healthFrame.x + BATTLE_LOWER_ART.healthFrame.w / 2, BATTLE_LOWER_ART.healthFrame.y - 18, '+' + Math.round(actual) + ' 城防', '#86f3be', 19, { life: .8, bold: true, rise: 18 });
    }
    if (options.overflowToShield && overflow > 0) {
      var shieldCap = Math.max(80, (this.baseMax || 1000) * valueOr(options.shieldCapRatio, .35));
      var addable = Math.max(0, shieldCap - (this.wallShield || 0));
      shield = Math.min(addable, overflow * valueOr(options.shieldRatio, 1));
      if (shield > 0) {
        this.wallShield = (this.wallShield || 0) + shield;
        this.wallShieldFlash = .48;
        this.floatText(BATTLE_LOWER_ART.healthFrame.x + BATTLE_LOWER_ART.healthFrame.w / 2, BATTLE_LOWER_ART.healthFrame.y - 38, '护盾 +' + Math.round(shield), '#9eefff', 18, { life: .8, bold: true, rise: 18 });
      }
    }
    if (actual > 0 || shield > 0) {
      this.totalHealing += actual + shield;
      if (source) source.healingDone += actual + shield;
      this.spiritLampHit = .35;
      this.burst(BATTLE_LOWER_ART.healthFrame.x + BATTLE_LOWER_ART.healthFrame.w / 2, BATTLE_LOWER_ART.healthFrame.y, '#86f3be', 6);
    }
    return { actual: actual, overflow: overflow, shield: shield };
  };

  Game.prototype.soulReturn = function (hero) {
    var deathX = hero.x, deathY = hero.y;
    var soulAnchor = this.isSpiritLineMode() ? this.spiritLineHome(hero) : this.heroSoulAnchor(hero);
    hero.hp = 0; hero.alive = false; hero.respawn = hero.respawnMax; hero.deaths++;
    hero.anchorIndex = hero.soulAnchorIndex == null ? hero.anchorIndex : hero.soulAnchorIndex;
    hero.soulReturn = { fromX: deathX, fromY: deathY, t: 0, duration: .55 };
    if (this.rogueLevel('U09') > 0 && !this.waveReviveUsed) {
      this.waveReviveUsed = true;
      hero.respawn = 3;
      hero.reviveHpRatio = .35;
      this.floatText(hero.x, hero.y - 130, '天命重燃', C.gold, 24, { life: 1.2, bold: true });
    }
    hero.target = null; hero.pendingTarget = null; hero.attackWindup = 0; hero.attackAnim = 0; hero.hitHold = 0; hero.walking = false;
    hero.blocked = []; hero.shield = 0; hero.holyShield = 0; hero.holyShieldTime = 0;
    if (hero.type === 'huangjin') this.clearHuangjinWall(hero, false);
    for (var i = 0; i < this.enemies.length; i++) if (this.enemies[i].blocker === hero.id) this.enemies[i].blocker = null;
    this.message = hero.name + '魂归 · 返回初始魂位等待复活';
    this.messageTime = 2.6;
    this.soulFireBurst(deathX, deathY, HERO_META[hero.type].color, 34, 1.15);
    this.impactPause(.08, 7);
    if (soulAnchor) this.zones.push({ type: 'respawn', x: soulAnchor.x, y: soulAnchor.y, r: 22, color: HERO_META[hero.type].color, life: .9 });
    this.audio.tone('hurt');
  };

  Game.prototype.respawnHero = function (hero) {
    if (!this.isSpiritLineMode() && !ANCHORS[hero.soulAnchorIndex]) hero.soulAnchorIndex = hero.anchorIndex;
    if (!this.isSpiritLineMode()) hero.anchorIndex = hero.soulAnchorIndex;
    var anchor = this.isSpiritLineMode() ? this.spiritLineHome(hero) : this.heroSoulAnchor(hero);
    hero.x = anchor.x; hero.y = anchor.y; hero.hp = hero.reviveHpRatio ? Math.max(1, hero.maxHp * hero.reviveHpRatio) : hero.maxHp;
    hero.reviveHpRatio = 0; hero.shield = 45; hero.holyShield = 0; hero.holyShieldTime = 0;
    hero.soulReturn = null;
    hero.alive = true; hero.invuln = .8; hero.respawn = 0; hero.target = null;
    this.pushEnemies(hero.x, hero.y, 125, 72, .45);
    this.burst(hero.x, hero.y, HERO_META[hero.type].color, 30);
    this.zones.push({ type: 'respawn', x: hero.x, y: hero.y, r: 18, color: HERO_META[hero.type].color, life: .8 });
    if (hero.type === 'suwen' && hero.upgrades.passive >= 3) {
      for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].alive) this.healHero(this.heroes[i], 55, hero);
    }
    this.message = hero.name + (this.isSpiritLineMode() ? '归阵 · 重返守备区' : '归阵 · ' + ANCHORS[hero.anchorIndex].name);
    this.messageTime = 1.8; this.audio.tone('bell');
  };

  Game.prototype.damageEnemy = function (enemy, amount, source, options) {
    if (!enemy || enemy.dead) return 0;
    options = options || {};
    var blockerBeforeHit = this.blockingHero(enemy);
    var qingyiExposedBefore = (enemy.qingyiExposeTime || 0) > 0;
    var qingyiLightBurstReady = !!(source && source.qingyiSynergyBurstReady && (source.qingyiSynergyTime || 0) > 0 && !options.noQingyiLightBurst);
    var critical = !!(source && !options.noCrit && Math.random() < clamp(Number(source.critRate) || 0, 0, .95));
    var criticalMultiplier = critical ? Math.max(1, Number(source.critMultiplier) || 1.5) : 1;
    var final = amount * this.outgoingDamageMultiplier(source, enemy, options) * criticalMultiplier * (enemy.armorBreak ? 1.25 : 1) *
      ((enemy.spiritLineV2StunDamageTaken || 0) > 0 ? 1.15 : 1) *
      this.applyRuneBeforeDamage(source, enemy, options);
    var previousHp = enemy.hp;
    if (enemy.hpLag == null) enemy.hpLag = previousHp;
    enemy.hp -= final;
    if (enemy.nubaRescueThreat && this.nubaRescue && !this.nubaRescue.complete && enemy.hp <= 0) enemy.hp = 1;
    enemy.hpLag = Math.max(enemy.hpLag, previousHp);
    enemy.hpBarTime = 3;
    enemy.hpLagHold = options.impact || options.skill ? .12 : .05;
    enemy.hitDuration = options.skill ? .20 : (options.impact ? .17 : .12);
    enemy.hit = enemy.hitDuration;
    if (options.impact || options.skill) {
      enemy.redFlash = .16;
      var dx = source ? enemy.x - source.x : 0, dy = source ? enemy.y - source.y : -1;
      var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var recoil = options.skill ? 24 : 15;
      enemy.recoilX = dx / d * recoil;
      enemy.recoilY = dy / d * recoil * .45;
      this.impactPause(options.skill ? .045 : .025, 0);
      this.localHitFeedback(enemy.x, enemy.y - 18, options.skill && source ? HERO_META[source.type].color : '#fff0c7', {
        radius: options.skill ? 34 : 24,
        particles: options.skill ? 14 : 8,
        skill: !!options.skill,
        heavy: !!options.skill
      });
      var hitSfx = source && source.type === 'hongyi' ? 'hongyiFireHit' :
        source && source.type === 'huangjin' ? 'huangjinDrumWave' :
          source && source.type === 'xuanya' ? 'xuanyaBladeHit' : 'enemyHit';
      this.audio.playSfx(hitSfx);
    }
    if (critical && (options.impact || options.skill)) this.floatText(enemy.x, enemy.y - 82, '暴击 ×' + criticalMultiplier.toFixed(1), '#ffe28b', 18, { life: .58, bold: true, rise: 14 });
    if (options.skill && !options.noSkillPush && !(enemy.nubaRescueThreat && this.nubaRescue && !this.nubaRescue.complete)) {
      enemy.blocker = null;
      enemy.y = Math.max(0, enemy.y - (enemy.type === 'boss' ? 28 : 56));
    }
    this.totalDamage += final;
    if (source) { source.damageDone += final; }
    if (options.impact || options.skill) {
      this.floatText(enemy.x, enemy.y - 48, '-' + Math.round(final), options.skill ? '#fff2a8' : '#fff7df', 25, { impact: true, bold: true });
    } else if (Math.random() < .25 || final > 110) {
      this.floatText(enemy.x, enemy.y - 45, '-' + Math.round(final), final > 110 ? '#ffe17b' : '#f7e4bc', final > 110 ? 26 : 19);
    }
    if (qingyiExposedBefore && source && !options.noQingyiGlow) this.gainQingyiGlow(source, enemy, options);
    if (enemy.hp <= 0) {
      options.blockerBeforeHit = blockerBeforeHit ? blockerBeforeHit.id : null;
      this.killEnemy(enemy, source, options);
    }
    if (!enemy.dead && qingyiExposedBefore && qingyiLightBurstReady) {
      var qingyiBurstSource = this.getHero(source.qingyiSynergySource);
      if (qingyiBurstSource && qingyiBurstSource.alive) {
        source.qingyiSynergyBurstReady = false;
        var qingyiPassive = heroSkillConfig('qingyi').passive || {};
        this.damageEnemy(enemy, this.heroAttackPower(qingyiBurstSource) * valueOr(qingyiPassive.lightBurstAtk, .30), qingyiBurstSource, {
          impact: true,
          noQingyiGlow: true,
          noQingyiLightBurst: true,
          noQingyiExposeBonus: true,
          noQingyiSynergyBonus: true
        });
        this.zones.push({ type: 'qingyiBurst', x: enemy.x, y: enemy.y - 22, r: 44, color: HERO_META[qingyiBurstSource.type].color, life: .38, maxLife: .38 });
      }
    }
    return final;
  };

  Game.prototype.killEnemy = function (enemy, source, killOptions) {
    if (enemy.dead) return;
    killOptions = killOptions || {};
    var hongyiChainOwner = enemy.burn > 0 ? this.getHero(enemy.burnSource) : null;
    var hongyiChainGeneration = Math.max(0, killOptions.hongyiChainGeneration || 0);
    var humanBlocker = killOptions.blockerBeforeHit ? this.getHero(killOptions.blockerBeforeHit) : this.blockingHero(enemy);
    if (!humanBlocker || humanBlocker.faction !== '人族') humanBlocker = null;
    enemy.dead = true; this.kills++; this.coins += Math.round(enemy.coin); this.score += Math.round(enemy.xp * 12);
    // V2 血阵只在阵内敌人死亡时结算一次爆散；爆散击杀不会再触发新的血阵爆散。
    if (this.isSpiritLineMode()) {
      for (var bloodZoneIndex = 0; bloodZoneIndex < this.zones.length; bloodZoneIndex++) {
        var bloodZone = this.zones[bloodZoneIndex];
        if (!bloodZone || bloodZone.type !== 'spiritLineBloodZone' || !bloodZone.explode || bloodZone.fired) continue;
        if (dist2(enemy.x, enemy.y - 16, bloodZone.x, bloodZone.y) > bloodZone.r * bloodZone.r) continue;
        bloodZone.fired = true;
        bloodZone.life = 0;
        var bloodOwner = this.getHero(bloodZone.hero);
        if (bloodOwner) {
          this.damageArea(bloodZone.x, bloodZone.y, bloodZone.r, this.heroAttackPower(bloodOwner) * .60, bloodOwner, null, { impact: true, noRune: true });
          this.zones.push({ type: 'ring', x: bloodZone.x, y: bloodZone.y, r: bloodZone.r, color: '#ff8678', life: .38, maxLife: .38 });
        }
      }
    }
    this.gainXuanyaSoul(enemy, killOptions);
    this.waveKills = Math.max(0, this.waveKills || 0) + 1;
    this.waveProgressFlash = .28;
    this.gainXp(enemy.xp);
    if (this.rogueLevel('U06') > 0 && this.kills % 10 === 0) {
      var healRatio = this.upgradeValue('U06', [.02, .035], 0);
      for (var healIndex = 0; healIndex < this.heroes.length; healIndex++) {
        var healTarget = this.heroes[healIndex];
        if (healTarget.alive) this.healHero(healTarget, healTarget.maxHp * healRatio, null);
      }
    }
    if (source && source.faction === '妖族' && this.rogueLevel('F05') >= 3) {
      source.attackBuffTime = Math.max(source.attackBuffTime || 0, 3);
    }
    if (source && source.faction === '鬼族' && enemy.burn > 0 && this.rogueLevel('F08') > 0 && !killOptions.noSoulExplosion) {
      var f08Level = this.rogueLevel('F08');
      var soulRadius = f08Level >= 2 ? 105 : 82;
      var soulDamage = this.heroAttackPower(source) * (f08Level >= 2 ? .80 : .45);
      this.damageArea(enemy.x, enemy.y, soulRadius, soulDamage, source, null, { impact: true, noSoulExplosion: true });
      this.zones.push({ type: 'soulBurst', x: enemy.x, y: enemy.y, r: soulRadius, color: C.fire, life: .46, maxLife: .46 });
      this.floatText(enemy.x, enemy.y - 72, '魂爆', C.fire, 20, { life: .75, bold: true, impact: true });
      if (f08Level >= 2) {
        this.zones.push({ type: 'soulFire', x: enemy.x, y: enemy.y, r: 92, color: C.fire, life: 1, maxLife: 1, hero: source.id, tick: 0, touched: {} });
      }
    }
    if (hongyiChainOwner && hongyiChainOwner.type === 'hongyi' && this.rogueLevel('E03') >= 3 && !killOptions.noHongyiChain) {
      var hongyiAttack = heroSkillConfig('hongyi').attack || {};
      var maxGenerations = Math.max(1, valueOr(hongyiAttack.chainExplosionMaxGenerations, 2));
      if (hongyiChainGeneration < maxGenerations) {
        var chainDamageAtk = hongyiChainGeneration === 0
          ? valueOr(hongyiAttack.chainExplosionAtk, .70)
          : valueOr(hongyiAttack.chainExplosionSecondAtk, .35);
        var chainRadius = valueOr(hongyiAttack.chainExplosionRadius, 95);
        this.damageArea(enemy.x, enemy.y, chainRadius, this.heroAttackPower(hongyiChainOwner) * chainDamageAtk, hongyiChainOwner, null, {
          impact: true,
          noHongyiSigil: true,
          noSoulExplosion: true,
          hongyiChainGeneration: hongyiChainGeneration + 1
        });
        this.zones.push({
          type: 'emberBurst', x: enemy.x, y: enemy.y, r: chainRadius,
          color: C.fire, life: .46, maxLife: .46,
          chainGeneration: hongyiChainGeneration + 1
        });
        this.floatText(enemy.x, enemy.y - 72, hongyiChainGeneration === 0 ? '连环焚灭' : '次代爆燃', C.fire, 18, {
          life: .72, bold: true, impact: true
        });
      }
    }
    if (humanBlocker && this.rogueLevel('F02') >= 3) {
      var humanColumn = gridColumnFromX(humanBlocker.x);
      var formationShield = humanBlocker.maxHp * .05;
      for (var guardIndex = 0; guardIndex < this.heroes.length; guardIndex++) {
        var guardedHero = this.heroes[guardIndex];
        if (!guardedHero.alive || gridColumnFromX(guardedHero.x) !== humanColumn) continue;
        guardedHero.shield += formationShield;
        guardedHero.shieldFlash = .32;
        this.floatText(guardedHero.x, guardedHero.y - 112, '军势盾 +' + Math.round(formationShield), C.gold, 16, { life: .7, rise: 14 });
      }
    }
    var deathColor = enemy.type === 'boss' ? C.fire : enemy.type === 'wisp' ? C.blue : (enemy.elite ? '#ce83dc' : C.gold);
    var deathCount = enemy.type === 'boss' ? 46 : enemy.type === 'wisp' ? 12 : enemy.elite ? 16 : 9;
    var deathScale = enemy.type === 'boss' ? 1.35 : enemy.type === 'wisp' ? .72 : enemy.elite ? .88 : .68;
    this.soulFireBurst(enemy.x, enemy.y, deathColor, deathCount, deathScale, { soft: true });
    if (enemy.type !== 'boss') this.audio.playSfx('enemyDie');
    this.impactPause(enemy.type === 'boss' ? .12 : .045, enemy.type === 'boss' ? 14 : 0);
    if (enemy.type === 'boss') { this.shake = 14; this.audio.tone('win'); }
    if (enemy.eliteRewardEligible && this.phase === 'wave') {
      var eliteDraw = eliteDrawTuning();
      var maxOffers = Math.max(0, Math.floor(valueOr(eliteDraw.maxOffersPerBattle, 3)));
      if (this.eliteDrawOffers < maxOffers) {
        this.eliteDrawOffers++;
        this.eliteDrawQueue = this.eliteDrawQueue || [];
        this.eliteDrawQueue.push({ name: enemy.name, wave: this.wave, x: enemy.x, y: enemy.y });
      }
    }
  };

  Game.prototype.healHero = function (hero, amount, source) {
    if (!hero || !hero.alive) return 0;
    var finalAmount = amount * this.healingReceivedMultiplier(hero, source);
    var missing = Math.max(0, hero.maxHp - hero.hp);
    var actual = Math.min(finalAmount, missing);
    hero.hp += actual; this.totalHealing += actual;
    if (source) source.healingDone += actual;
    var overflow = Math.max(0, finalAmount - actual);
    var qingyiShieldRatio = 0;
    if (qingyiShieldRatio > 0 && overflow > 0) {
      hero.shield += overflow * qingyiShieldRatio;
      hero.shieldFlash = .32;
      hero.holyShield = Math.max(hero.holyShield || 0, overflow * qingyiShieldRatio);
      hero.holyShieldTime = Math.max(hero.holyShieldTime || 0, 4);
    }
    if (actual > 0) this.floatText(hero.x, hero.y - 90, '+' + Math.round(actual), '#86f3be', 20);
    if (overflow > 0 && qingyiShieldRatio > 0) this.floatText(hero.x, hero.y - 112, '盾 +' + Math.round(overflow * qingyiShieldRatio), '#f7e6a3', 18);
    this.burst(hero.x, hero.y - 25, C.jade, 6);
    return actual;
  };

  Game.prototype.lowestHealthHero = function () {
    var best = null, ratio = 2;
    for (var i = 0; i < this.heroes.length; i++) {
      var h = this.heroes[i]; if (!h.alive) continue;
      var r = h.hp / h.maxHp;
      if (r < ratio) { ratio = r; best = h; }
    }
    return best;
  };

  Game.prototype.lowestWoundedHero = function () {
    var best = null, ratio = 2;
    for (var i = 0; i < this.heroes.length; i++) {
      var h = this.heroes[i];
      if (!h.alive || h.hp >= h.maxHp) continue;
      var r = h.hp / h.maxHp;
      if (r < ratio) { ratio = r; best = h; }
    }
    return best;
  };

  Game.prototype.secondLowestHealthHero = function () {
    var alive = this.heroes.filter(function (h) { return h.alive; });
    alive.sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; });
    return alive[1] || alive[0] || null;
  };

  Game.prototype.soonestReturningHero = function () {
    var best = null;
    for (var i = 0; i < this.heroes.length; i++) {
      var h = this.heroes[i];
      if (!h.alive && (!best || h.respawn < best.respawn)) best = h;
    }
    return best;
  };

  Game.prototype.densestEnemy = function () {
    var best = null, bestCount = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i], count = 0;
      for (var j = 0; j < this.enemies.length; j++) if (dist2(e.x, e.y, this.enemies[j].x, this.enemies[j].y) < 120 * 120) count++;
      if (count > bestCount) { bestCount = count; best = e; }
    }
    return best;
  };

  Game.prototype.highestThreatEnemy = function () {
    var best = null, score = -1;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i], value = e.y + e.hp / e.maxHp * 80 + (e.elite ? 160 : 0) + (e.type === 'boss' ? 300 : 0);
      if (value > score) { score = value; best = e; }
    }
    return best;
  };

  Game.prototype.damageArea = function (x, y, radius, damage, source, effect, options) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      if (!e.dead && dist2(x, y, e.x, e.y) <= radius * radius) {
        this.damageEnemy(e, damage, source, options);
        if (effect === 'burn') {
          var hongyiAttack = heroSkillConfig('hongyi').attack || {};
          var burnDuration = options && options.burnDuration || valueOr(hongyiAttack.burnDuration, 3);
          var burnDps = options && options.burnDps || (source && source.type === 'hongyi' ? this.heroAttackPower(source) * valueOr(hongyiAttack.burnDpsAtk, .10) : 22);
          this.applyBurn(e, source, burnDuration, burnDps);
        }
        if (effect === 'slow') e.slow = Math.max(e.slow, 3.2);
      }
    }
  };

  Game.prototype.pushEnemies = function (x, y, radius, amount, freeze) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i], d = distance(x, y, e.x, e.y);
      if (d < radius && e.type !== 'boss') {
        e.y = Math.max(135, e.y - amount); e.blocker = null;
        if (freeze) e.freeze = Math.max(e.freeze, freeze);
      }
    }
  };

  Game.prototype.updateSpellCooldowns = function (dt) {
    for (var i = 0; i < SPELL_KEYS.length; i++) {
      var key = SPELL_KEYS[i];
      this.spellCd[key] = Math.max(0, this.spellCd[key] - dt);
    }
  };

  Game.prototype.updateSpiritLamps = function (dt) {
    this.spiritLampPulse = Math.max(0, (this.spiritLampPulse || 0) - dt);
    this.spiritLampHit = Math.max(0, (this.spiritLampHit || 0) - dt);
    if ((this.spiritLampLit || 0) >= (this.spiritLampMax || SPIRIT_LAMP_MAX)) {
      this.spiritLampTimer = 0;
      return;
    }
    this.spiritLampTimer += dt;
    var intervalBoost = 1 + this.upgradeValue('U05', [.15, .25, .35], 0);
    var interval = Math.max(.5, (this.spiritLampInterval || SPIRIT_LAMP_INTERVAL) / intervalBoost);
    while (this.spiritLampTimer >= interval && this.spiritLampLit < this.spiritLampMax) {
      this.spiritLampTimer -= interval;
      this.spiritLampLit++;
      this.spiritLampPulse = .45;
      if (this.spiritLampLit >= (this.spiritLampMax || SPIRIT_LAMP_MAX)) this.audio.playSfx('energyFull') || this.audio.tone('bell');
      else this.audio.tone('bell');
    }
  };

  Game.prototype.spellCostFor = function (key) {
    if (!SPELL_META[key] || SPELL_META[key].disabled) return 0;
    var cost = spellCost(key);
    if (this.rogueLevel('U05') >= 3 && !this.spellDiscountWave) cost = Math.max(1, cost - 1);
    return cost;
  };

  Game.prototype.hasSpiritLamps = function (key) {
    if (!SPELL_META[key] || SPELL_META[key].disabled) return false;
    return (this.spiritLampLit || 0) >= this.spellCostFor(key);
  };

  Game.prototype.spendSpiritLamps = function (key, manual) {
    if (!SPELL_META[key] || SPELL_META[key].disabled) return false;
    var baseCost = spellCost(key);
    var cost = this.spellCostFor(key);
    if ((this.spiritLampLit || 0) < cost) {
      if (manual) {
        this.message = SPELL_META[key].name + ' 需要 ' + cost + ' 点灵气';
        this.messageTime = 1.6;
        this.audio.tone('shoot');
      }
      return false;
    }
    this.spiritLampLit = Math.max(0, this.spiritLampLit - cost);
    if (cost < baseCost) this.spellDiscountWave = 1;
    this.spiritLampPulse = .55;
    return true;
  };

  Game.prototype.updateProtagonistSkillEffects = function (dt) {
    this.protagonistRainTime = Math.max(0, (this.protagonistRainTime || 0) - dt);
    if (this.protagonistRainTime <= 0) this.protagonistRainMax = 0;
  };

  Game.prototype.pushWallEnemyBack = function (enemy, amount) {
    if (!enemy || enemy.dead || amount <= 0) return;
    enemy.breaking = false;
    enemy.wallAttackWindup = 0;
    enemy.attackCd = Math.max(enemy.attackCd || 0, .25);
    var remaining = amount;
    var path = enemy.wallPath;
    if (!path || !path.length) {
      enemy.y = clamp(enemy.y - remaining, -90, this.wallEnemyBreachCenterY(enemy));
      return;
    }
    var guard = 0;
    while (remaining > .01 && guard++ < 8) {
      var currentIndex = clamp(enemy.wallPathIndex || 0, 0, path.length - 1);
      var previousIndex = Math.max(0, currentIndex - 1);
      var previous = path[previousIndex] || path[0];
      var dx = previous.x - enemy.x, dy = previous.y - enemy.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < .01) {
        enemy.wallPathIndex = previousIndex;
        if (previousIndex <= 0) break;
        continue;
      }
      if (d <= remaining) {
        enemy.x = previous.x;
        enemy.y = previous.y;
        enemy.wallPathIndex = previousIndex;
        remaining -= d;
        if (previousIndex <= 0) break;
      } else {
        enemy.x += dx / d * remaining;
        enemy.y += dy / d * remaining;
        remaining = 0;
      }
    }
    enemy.x = clamp(enemy.x, 24, W - 24);
    enemy.y = clamp(enemy.y, WALL_WIND_MIN_VISIBLE_Y, this.wallEnemyBreachCenterY(enemy));
    if (path && path.length) {
      var nextPathIndex = path.length - 1;
      for (var p = 0; p < path.length; p++) {
        if (path[p].y > enemy.y + 1) { nextPathIndex = p; break; }
      }
      enemy.wallPathIndex = clamp(nextPathIndex, 0, path.length - 1);
    }
  };

  Game.prototype.castProtagonistWind = function (manual) {
    var meta = SPELL_META.wind;
    if (!this.enemies.length) {
      if (manual) { this.message = '呼风需要场上有敌人'; this.messageTime = 1.6; }
      return false;
    }
    if (!this.spendSpiritLamps('wind', manual)) return false;
    var affected = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var push = enemy.type === 'boss'
        ? valueOr(meta.bossPush, 60)
        : enemy.elite
          ? valueOr(meta.elitePush, 120)
          : valueOr(meta.push, 170);
      this.pushWallEnemyBack(enemy, push);
      enemy.freeze = Math.max(enemy.freeze || 0, valueOr(meta.freeze, .25));
      enemy.hit = Math.max(enemy.hit || 0, .18);
      enemy.hitHold = Math.max(enemy.hitHold || 0, .06);
      this.burst(enemy.x, enemy.y - 12, meta.color, enemy.type === 'boss' ? 3 : 5);
      affected++;
    }
    this.zones.push({ type: 'protagonistWind', x: W / 2, y: WALL_DEFENSE_LINE_Y + 22, tx: W / 2, ty: 120, color: meta.color, life: .62, maxLife: .62 });
    this.floatText(W / 2, 912, '呼风', meta.color, 26, { life: .9, bold: true, rise: 18 });
    this.spellCd.wind = this.spellMax.wind = valueOr(meta.cooldown, 12);
    this.spellDamage.wind = (this.spellDamage.wind || 0) + affected;
    this.skillVignette = { color: meta.color, life: .25, maxLife: .25 };
    this.audio.playSfx('spellWind') || this.audio.tone('shoot');
    this.shake = Math.max(this.shake, 5);
    return true;
  };

  Game.prototype.castProtagonistRain = function (manual) {
    var meta = SPELL_META.rain;
    if (!this.enemies.length) {
      if (manual) { this.message = '唤雨需要场上有敌人'; this.messageTime = 1.6; }
      return false;
    }
    if (!this.spendSpiritLamps('rain', manual)) return false;
    var duration = valueOr(meta.duration, 6);
    this.protagonistRainTime = Math.max(this.protagonistRainTime || 0, duration);
    this.protagonistRainMax = duration;
    this.zones.push({ type: 'protagonistRain', x: W / 2, y: BOARD_H / 2, r: 540, color: meta.color, life: duration, maxLife: duration });
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      enemy.hit = Math.max(enemy.hit || 0, .08);
      if (i % 2 === 0) this.burst(enemy.x, enemy.y - 22, meta.color, 2);
    }
    this.floatText(W / 2, 560, '唤雨 · 易伤', meta.color, 24, { life: 1, bold: true, rise: 14 });
    this.spellCd.rain = this.spellMax.rain = valueOr(meta.cooldown, 18);
    this.spellDamage.rain = (this.spellDamage.rain || 0) + 1;
    this.skillVignette = { color: meta.color, life: .35, maxLife: .35 };
    this.audio.playSfx('spellRain') || this.audio.tone('bell');
    this.shake = Math.max(this.shake, 2.5);
    return true;
  };

  Game.prototype.canAutoCastSpell = function (key) {
    if (WALL_MODE) return false;
    if (!this.hasSpiritLamps(key)) return false;
    if (key === 'wind') return this.enemies.length >= 6 || this.baseHp < this.baseMax * .45;
    if (key === 'rain') return this.enemies.length >= 3;
    return false;
  };

  Game.prototype.castSpell = function (key, manual) {
    if (this.isFirstStageTutorialActive() && !this.firstStageTutorial.skillUnlocked) return false;
    if (!SPELL_META[key] || SPELL_META[key].disabled) return false;
    if (this.spellCd[key] > 0) {
      if (manual) {
        this.message = SPELL_META[key].name + ' 冷却中 ' + this.spellCd[key].toFixed(1) + 's';
        this.messageTime = 1.6;
        this.audio.tone('shoot');
      }
      return false;
    }
    var casted = key === 'wind' ? this.castProtagonistWind(manual) : key === 'rain' ? this.castProtagonistRain(manual) : false;
    if (!casted) return false;
    if (this.isFirstStageTutorialActive() && key === 'wind') {
      this.firstStageTutorial.skillCast = true;
      this.paused = false;
    }
    this.message = SPELL_META[key].name + ' · 手动释放';
    this.messageTime = 1.6;
    return true;
  };

  Game.prototype.castAutoSpells = function (dt) {
    this.updateSpellCooldowns(dt);
    if (!this.spellAuto) return;
    for (var i = 0; i < SPELL_KEYS.length; i++) {
      var key = SPELL_KEYS[i];
      if (this.spellCd[key] <= 0 && this.canAutoCastSpell(key) && this.castSpell(key, false)) return;
    }
  };

  Game.prototype.gainXp = function (amount) {
    this.xp += amount || 0;
    if (!this.isSpiritLineMode()) return;
    // 1-2 的牌由灵识升级驱动，而不是由开局或清波触发。
    // 怪潮加密后，首级需要约 8 只游魂，后续门槛逐级拉高，避免选牌连续打断战斗。
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level++;
      this.pendingLevels++;
      var xpTuning = this.spiritLineXp || this.spiritLineXpTuning();
      this.xpNeed = Math.min(xpTuning.maxNeed, Math.ceil(this.xpNeed * xpTuning.growth));
    }
    if (this.phase === 'wave' && this.pendingLevels > 0) {
      this.pendingLevels--;
      this.message = '灵识升阶 · 选择一张符策';
      this.messageTime = 3;
      this.offerSpiritLineCards();
    }
  };

  Game.prototype.updateWaveProgress = function (dt) {
    var total = Math.max(1, this.waveTotal || 1);
    var target = clamp(this.waveKills || 0, 0, total);
    if (this.waveProgress == null) this.waveProgress = target;
    this.waveProgress += (target - this.waveProgress) * Math.min(1, dt * 10);
    if (Math.abs(target - this.waveProgress) < .02) this.waveProgress = target;
    this.waveProgressFlash = Math.max(0, (this.waveProgressFlash || 0) - dt);
  };

  Game.prototype.totalUpgrade = function (hero) {
    return hero.upgrades.attack + hero.upgrades.passive + hero.upgrades.ultimate;
  };

  Game.prototype.cardCandidates = function (hero) {
    var list = [];
    if (hero.upgrades.attack < 3) list.push('attack');
    if (hero.upgrades.passive < 3) list.push('passive');
    if (hero.upgrades.ultimate < 3) list.push('ultimate');
    return list;
  };

  Game.prototype.hasAvailableUpgradeCards = function () {
    for (var i = 0; i < this.heroes.length; i++) if (this.cardCandidates(this.heroes[i]).length) return true;
    return false;
  };

  Game.prototype.makeCard = function (hero, line) {
    var level = hero.upgrades[line], meta = HERO_META[hero.type];
    var lineNames = { attack: '普攻', passive: '被动', ultimate: '必杀' };
    return {
      hero: hero.id, line: line, heroName: hero.name, role: hero.role,
      title: lineNames[line] + ' · ' + (level + 1) + '阶',
      desc: meta[line][level], color: meta.color, icon: meta.icon
    };
  };

  Game.prototype.makeSpiritLineUnlockCard = function (hero) {
    return {
      upgradeId: 'line-unlock-' + hero.type,
      special: 'spiritUnlock', unlockHero: hero.type,
      type: 'exclusive', rarity: 'rare', frameRarity: 'rare', maxLevel: 1,
      hero: hero.id, portraitHero: hero.id, portraitType: hero.type,
      heroName: hero.name, role: '召来 · 初始御灵', tag: '召来',
      effectHeroName: hero.name, effectSkillName: '守备降临', effectSkillKind: '召来',
      title: '召来' + hero.name,
      desc: hero.name + '降临第 ' + (hero.lineSlot + 1) + ' 守备区，自动接敌；可阻挡 1 名近战敌人。',
      color: HERO_META[hero.type].color, icon: HERO_META[hero.type].icon
    };
  };

  Game.prototype.makeSpiritLineProtagonistCard = function (kind) {
    var values = {
      damage: { title: '破煞符', desc: '阵主符箓伤害 +28%。', tag: '阵主', skill: '镇煞符矢' },
      rate: { title: '连书符', desc: '阵主符箓发射间隔缩短 16%。', tag: '阵主', skill: '镇煞符矢' },
      pierce: { title: '裂灵符', desc: '阵主符箓命中后额外溅射附近 1 名敌人，造成 45% 伤害。', tag: '阵主', skill: '镇煞符矢' }
    }[kind];
    var level = kind === 'damage' ? this.protagonistDamageLevel : kind === 'rate' ? this.protagonistRateLevel : this.protagonistPierceLevel;
    return {
      upgradeId: 'line-main-' + kind,
      special: 'protagonistUpgrade', protagonistKind: kind,
      type: 'exclusive', rarity: 'common', frameRarity: 'common', maxLevel: 3,
      hero: null, portraitHero: null, portraitType: null,
      heroName: '阵主', role: '阵主 · 普攻', tag: values.tag,
      effectHeroName: '阵主', effectSkillName: values.skill, effectSkillKind: '普攻',
      title: values.title + (level ? ' +' + (level + 1) : ''), desc: values.desc,
      color: '#8ff4ff', icon: 1
    };
  };

  Game.prototype.unlockSpiritLineHero = function (type, card) {
    var hero = this.heroByType(type);
    if (!hero || hero.lineUnlocked) return;
    var home = this.spiritLineHome(hero);
    hero.lineUnlocked = true;
    hero.lineLocked = false;
    hero.alive = true;
    hero.hp = hero.maxHp;
    hero.x = home.x; hero.y = home.y;
    hero.invuln = 1.2;
    hero.attackCd = .35;
    this.upgradeCount++;
    if (!this.isSpiritLineMode()) this.level = this.upgradeCount;
    this.burst(hero.x, hero.y - 36, HERO_META[type].color, 26);
    this.zones.push({ type: 'respawn', x: hero.x, y: hero.y, r: 44, color: HERO_META[type].color, life: .9 });
    this.floatText(hero.x, hero.y - 126, hero.name + ' · 降临守备区', HERO_META[type].color, 22, { life: 1.2, bold: true, rise: 18 });
    this.message = hero.name + '已召来 · 守备区开始接敌';
    this.messageTime = 3;
    this.audio.playSfx('upgradeRare') || this.audio.tone('bell');
  };

  Game.prototype.offerSpiritLineCards = function () {
    this.phase = 'cards';
    this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
    var cards = [], used = {};
    function add(game, list) {
      list = shuffle(list.slice());
      for (var x = 0; x < list.length; x++) if (!used[list[x].id]) {
        used[list[x].id] = true; cards.push(game.makeUpgradeCard(list[x])); return true;
      }
      return false;
    }
    // 1-2 的角色全部随布阵进场：牌池没有“召来”，只由阵主和当前三名御灵构成。
    var exclusive = this.availableUpgradeList('exclusive');
    while (cards.length < 2 && add(this, exclusive)) {}
    var mainKinds = shuffle(['damage', 'rate', 'pierce']);
    for (var m = 0; m < mainKinds.length && cards.length < 3; m++) {
      var kind = mainKinds[m], level = kind === 'damage' ? this.protagonistDamageLevel : kind === 'rate' ? this.protagonistRateLevel : this.protagonistPierceLevel;
      if (level < 3) cards.push(this.makeSpiritLineProtagonistCard(kind));
    }
    while (cards.length < 3 && add(this, exclusive)) {}
    if (!cards.length && this.wave >= this.waveMax && this.currentWaveConfig && this.currentWaveConfig.enemies && this.currentWaveConfig.enemies.boss) {
      cards = [this.makeFinalWaveFallbackCard()];
    }
    if (!cards.length) { this.phase = 'wave'; return; }
    this.pendingCards = cards.slice(0, 3);
    this.audio.playSfx('uiCardOpen') || this.audio.tone('bell');
  };

  Game.prototype.offerCards = function () {
    if (this.isSpiritLineMode()) { this.offerSpiritLineCards(); return; }
    this.phase = 'cards'; this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
    var heroes = this.heroes.slice().filter(function (h) {
      return h.upgrades.attack < 3 || h.upgrades.passive < 3 || h.upgrades.ultimate < 3;
    });
    if (!heroes.length) { this.pendingLevels = 0; this.phase = 'wave'; return; }
    heroes.sort(function (a, b) {
      var ta = a.upgrades.attack + a.upgrades.passive + a.upgrades.ultimate;
      var tb = b.upgrades.attack + b.upgrades.passive + b.upgrades.ultimate;
      return ta - tb;
    });
    var cards = [], used = {};
    if (heroes.length) {
      var least = heroes[0], firstLine = choice(this.cardCandidates(least));
      cards.push(this.makeCard(least, firstLine)); used[least.id + ':' + firstLine] = true;
    }
    var pool = shuffle(heroes.slice());
    while (cards.length < 3 && pool.length) {
      var hero = pool.shift(), lines = shuffle(this.cardCandidates(hero));
      for (var i = 0; i < lines.length; i++) {
        var key = hero.id + ':' + lines[i];
        if (!used[key]) { cards.push(this.makeCard(hero, lines[i])); used[key] = true; break; }
      }
    }
    var guard = 0;
    while (cards.length < 3 && guard++ < 40) {
      var anyHero = choice(heroes), options = this.cardCandidates(anyHero), line = choice(options);
      var anyKey = anyHero.id + ':' + line;
      if (!used[anyKey]) { cards.push(this.makeCard(anyHero, line)); used[anyKey] = true; }
    }
    this.pendingCards = cards;
    this.audio.playSfx('uiCardOpen') || this.audio.tone('bell');
  };

  Game.prototype.pickCard = function (index) {
    var card = this.pendingCards[index], hero = card && this.getHero(card.hero);
    if (!hero) return;
    hero.upgrades[card.line]++; this.upgradeCount++;
    this.message = hero.name + ' · ' + card.title + '：' + card.desc; this.messageTime = 3;
    this.burst(SOUL_SLOTS[hero.soulSlot].x, SOUL_SLOTS[hero.soulSlot].y - 25, card.color, 20);
    this.pendingCards = [];
    this.level = 1 + this.upgradeCount;
    this.phase = 'wave';
  };

  Game.prototype.rogueLevel = function (id) {
    return this.rogueLevels && this.rogueLevels[id] || 0;
  };

  // A talisman is counted once per acquired upgrade, not once per star.
  // This list deliberately mirrors the actual application rules below so the
  // battle badge and detail panel never claim an upgrade affects the wrong hero.
  Game.prototype.activeTalismanUpgrades = function (hero) {
    if (!hero) return [];
    var source = YL.ROGUE_UPGRADES || [], list = [], order = this.upgradeAcquireOrder || [];
    for (var i = 0; i < source.length; i++) {
      var upgrade = source[i], level = this.rogueLevel(upgrade.id);
      if (!upgrade || upgrade.disabled || !level) continue;
      if (upgrade.type === 'common' ||
        (upgrade.type === 'faction' && upgrade.faction === hero.faction) ||
        (upgrade.type === 'exclusive' && upgrade.hero === hero.type)) {
        list.push({ upgrade: upgrade, level: level, sourceIndex: i, acquiredAt: order.indexOf(upgrade.id) });
      }
    }
    list.sort(function (a, b) {
      var ai = a.acquiredAt < 0 ? -1000 - a.sourceIndex : a.acquiredAt;
      var bi = b.acquiredAt < 0 ? -1000 - b.sourceIndex : b.acquiredAt;
      return bi - ai;
    });
    return list;
  };

  Game.prototype.talismanCountForHero = function (hero) {
    return this.activeTalismanUpgrades(hero).length;
  };

  Game.prototype.talismanBadgeCountForHero = function (hero) {
    if (!hero) return 0;
    if (WALL_MODE) return this.heroExclusiveUpgradeCount(hero);
    return this.talismanCountForHero(hero);
  };

  Game.prototype.openTalismanOverlay = function () {
    if (!this.heroes || !this.heroes.length) return;
    this.talismanOverlayWasPaused = !!this.paused;
    this.talismanHeroId = this.getHero(this.talismanHeroId) ? this.talismanHeroId : this.heroes[0].id;
    this.talismanScroll = 0;
    this.infoOverlay = 'talismans';
    this.paused = true;
    this.audio.tone('bell');
  };

  Game.prototype.closeTalismanOverlay = function () {
    this.infoOverlay = null;
    this.talismanScroll = 0;
    this.paused = !!this.talismanOverlayWasPaused;
    this.talismanOverlayWasPaused = false;
    this.audio.tone('bell');
  };

  Game.prototype.onTalismanDown = function (x, y) {
    var panel = TALISMAN_MODAL;
    var closeX = panel.x + panel.w + TALISMAN_MODAL_CLOSE.offsetX;
    var closeY = panel.y + TALISMAN_MODAL_CLOSE.offsetY;
    if (!inRect(x, y, panel) || dist2(x, y, closeX, closeY) <= TALISMAN_MODAL_CLOSE.hitRadius * TALISMAN_MODAL_CLOSE.hitRadius) {
      this.closeTalismanOverlay();
      return;
    }
    var heroes = this.heroes || [], tabStart = W / 2 - (heroes.length - 1) * 58;
    for (var i = 0; i < heroes.length; i++) {
      var tabX = tabStart + i * 116;
      if (dist2(x, y, tabX, 343) <= 47 * 47) {
        this.talismanHeroId = heroes[i].id;
        this.talismanScroll = 0;
        this.audio.tone('shoot');
        return;
      }
    }
    var selected = this.getHero(this.talismanHeroId) || heroes[0];
    var total = this.talismanCountForHero(selected);
    var maxScroll = Math.max(0, total - TALISMAN_ROWS.visible);
    if (y >= 1002 && y <= 1066) {
      if (x < W / 2 - 10) this.talismanScroll = Math.max(0, this.talismanScroll - 1);
      else this.talismanScroll = Math.min(maxScroll, this.talismanScroll + 1);
      this.audio.tone('shoot');
    }
  };

  Game.prototype.upgradeValue = function (id, values, fallback) {
    var level = this.rogueLevel(id);
    if (!level) return fallback || 0;
    return values[Math.min(level, values.length) - 1];
  };

  Game.prototype.hasHeroType = function (type) {
    for (var i = 0; i < this.heroes.length; i++) {
      if (this.heroes[i].type !== type) continue;
      if (this.isSpiritLineMode() && !this.heroes[i].lineUnlocked) continue;
      return true;
    }
    return false;
  };

  Game.prototype.hasFaction = function (faction) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].faction === faction) return true;
    return false;
  };

  Game.prototype.distinctFactionCount = function () {
    var map = {}, count = 0;
    for (var i = 0; i < this.heroes.length; i++) {
      var faction = this.heroes[i].faction;
      if (faction && !map[faction]) { map[faction] = true; count++; }
    }
    return count;
  };

  Game.prototype.refreshUpgradeDerivedStats = function (initial) {
    var oldBaseMax = this.baseMax || this.baseBaseMax || 1000;
    var baseMaxMult = 1 + this.upgradeValue('U08', [.15, .25], 0) + (this.rogueLevel('U03') >= 3 ? .10 : 0);
    this.baseMax = Math.round((this.baseBaseMax || 1000) * baseMaxMult);
    if (initial) this.baseHp = this.baseMax;
    else this.baseHp = clamp(this.baseHp + Math.max(0, this.baseMax - oldBaseMax), 0, this.baseMax);

    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      var hpRatio = hero.maxHp ? hero.hp / hero.maxHp : 1;
      var hpMult = 1 + this.upgradeValue('U03', [.12, .22, .30], 0);
      var atkMult = 1 + this.upgradeValue('U01', [.10, .18, .25], 0);
      var defMult = 1 + this.upgradeValue('U02', [.12, .22, .32], 0);
      var speedMult = 1 + this.upgradeValue('U04', [.08, .14, .20], 0) + (this.rogueLevel('U01') >= 3 ? .05 : 0);
      var cdReduction = this.rogueLevel('U07') >= 3 ? .10 : 0;

      if (hero.faction === '人族') defMult += this.upgradeValue('F01', [.20, .35, .45], 0);
      if (hero.faction === '妖族') speedMult += this.upgradeValue('F05', [.12, .22, .32], 0);
      if (hero.faction === '修士') cdReduction += this.upgradeValue('F03', [.08, .14, .20], 0);

      hero.maxHp = Math.max(1, Math.round(hero.baseHp * hpMult));
      hero.hp = hero.alive ? clamp(hero.maxHp * hpRatio, 1, hero.maxHp) : 0;
      hero.damage = hero.baseDamage * atkMult;
      hero.defenseStat = hero.baseDefenseStat * defMult;
      hero.block = hero.baseBlock + (hero.faction === '人族' && this.rogueLevel('F01') >= 3 ? 1 : 0);
      hero.attackInterval = Math.max(.35, hero.baseAttackInterval / Math.max(.25, speedMult));
      hero.projectileSpeed = hero.baseProjectileSpeed * (this.rogueLevel('U04') >= 3 ? 1.10 : 1);
      hero.ultimateMax = Math.max(4, hero.baseUltimateMax * (1 - Math.min(.45, cdReduction)));
      hero.ultimateCd = Math.min(hero.ultimateCd, hero.ultimateMax);
    }
    if (WALL_MODE && typeof this.syncHeroUltimateUnlocks === 'function') this.syncHeroUltimateUnlocks();
  };

  Game.prototype.availableUpgradeList = function (preferredType) {
    var source = YL.ROGUE_UPGRADES || [], list = [];
    for (var i = 0; i < source.length; i++) {
      var upgrade = source[i];
      if (!upgrade || upgrade.disabled) continue;
      // 1-2 使用独立的新版三英雄牌池；其余关卡继续只看已批准的旧 Wall Mode 牌。
      if (this.isSpiritLineMode()) {
        if (!upgrade.spiritLineV2) continue;
        if (upgrade.spiritLineV2Ultimate && !this.canOfferSpiritLineV2Ultimate(upgrade)) continue;
      } else if (upgrade.spiritLineV2) {
        continue;
      }
      if (WALL_MODE && !upgrade.spiritLineV2 && WALL_ALLOWED_ROGUE_UPGRADES.indexOf(upgrade.id) < 0) continue;
      if (WALL_MODE && isWallUltimateUnlockUpgrade(upgrade) && !this.canOfferUltimateUnlock(upgrade)) continue;
      if (WALL_MODE && upgrade.ultimateEnhancement) {
        var enhancementHero = this.heroByType(upgrade.hero);
        if (!enhancementHero || !this.isHeroUltimateUnlocked(enhancementHero)) continue;
      }
      if (preferredType && upgrade.type !== preferredType) continue;
      if (this.rogueLevel(upgrade.id) >= (upgrade.maxLevel || 1)) continue;
      if (upgrade.type === 'faction' && !this.hasFaction(upgrade.faction)) continue;
      if (upgrade.type === 'exclusive' && !this.hasHeroType(upgrade.hero)) continue;
      list.push(upgrade);
    }
    return list;
  };

  Game.prototype.hasAvailableUpgradeCards = function () {
    if (this.isSpiritLineMode()) {
      return this.availableUpgradeList('exclusive').length > 0 ||
        this.protagonistDamageLevel < 3 || this.protagonistRateLevel < 3 || this.protagonistPierceLevel < 3;
    }
    if (this.availableUpgradeList().length > 0) return true;
    // 关底即使已抽完常规牌池，也必须保留一次末波强化决策，
    // 否则小怪清空后 Boss 会直接出场，破坏关卡收束节奏。
    return !!(this.wave >= this.waveMax && this.currentWaveConfig && this.currentWaveConfig.enemies && this.currentWaveConfig.enemies.boss && !this.waveUpgradeOffered);
  };

  Game.prototype.makeFinalWaveFallbackCard = function () {
    return {
      upgradeId: 'final-wave-bastion', special: 'finalWaveUpgrade', type: 'common', rarity: 'rare',
      frameRarity: 'rare', maxLevel: 1, hero: null, portraitHero: null, portraitType: null,
      heroName: '阵法', role: '末波强化 · 稳阵', tag: '城防', effectHeroName: '阵法',
      effectSkillName: '镇魂余烬', effectSkillKind: '城防', title: '末波·镇魂余烬',
      desc: '城门获得一次额外护持，随后迎战关底 Boss。', color: C.gold, icon: 1
    };
  };

  Game.prototype.heroForUpgrade = function (upgrade) {
    if (upgrade.hero) {
      for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].type === upgrade.hero) return this.heroes[i];
    }
    if (upgrade.faction) {
      for (var j = 0; j < this.heroes.length; j++) if (this.heroes[j].faction === upgrade.faction) return this.heroes[j];
    }
    return this.heroes[0] || null;
  };

  Game.prototype.makeUpgradeCard = function (upgrade) {
    var nextLevel = this.rogueLevel(upgrade.id) + 1;
    var hero = this.heroForUpgrade(upgrade);
    var effectInfo = upgrade.type === 'exclusive' ? (EXCLUSIVE_UPGRADE_EFFECT_INFO[upgrade.id] || {}) : {};
    var effectHeroName = upgrade.type === 'exclusive'
      ? (hero ? hero.name : HERO_META[upgrade.hero] ? HERO_META[upgrade.hero].name : '御灵')
      : '';
    var effectSkillName = effectInfo.skill || (hero ? hero.role : '专属技能');
    var effectSkillKind = effectInfo.kind || '专属';
    var frameRarity = upgrade.type === 'exclusive'
      ? (UPGRADE_CARD_KIND_FRAMES[effectSkillKind] || (UPGRADE_CARD_FRAME_CROPS[upgrade.rarity] ? upgrade.rarity : 'common'))
      : (UPGRADE_CARD_FRAME_CROPS[upgrade.rarity] ? upgrade.rarity : 'common');
    var color = upgrade.type === 'faction' ? (FACTION_COLORS[upgrade.faction] || C.gold) :
      upgrade.type === 'exclusive' ? (UPGRADE_CARD_FRAME_COLORS[frameRarity] || (hero ? HERO_META[hero.type].color : C.jade)) :
        (RARITY_COLORS[upgrade.rarity] || C.jade);
    return {
      upgradeId: upgrade.id,
      type: upgrade.type,
      rarity: upgrade.rarity,
      frameRarity: frameRarity,
      maxLevel: upgrade.maxLevel || 1,
      hero: hero && upgrade.type === 'exclusive' ? hero.id : null,
      portraitHero: hero ? hero.id : null,
      portraitType: hero ? hero.type : upgrade.hero,
      heroName: upgrade.type === 'common' ? '全队' : upgrade.type === 'faction' ? displayFactionName(upgrade.faction) : (hero ? hero.name : '御灵'),
      role: (UPGRADE_TYPE_LABELS[upgrade.type] || '强化') + ' · ' + (RARITY_LABELS[upgrade.rarity] || ''),
      tag: upgrade.type === 'exclusive' ? effectSkillKind : (UPGRADE_TYPE_LABELS[upgrade.type] || '强化'),
      effectHeroName: effectHeroName,
      effectSkillName: effectSkillName,
      effectSkillKind: effectSkillKind,
      title: upgrade.name,
      desc: upgrade.levels[Math.min(nextLevel, upgrade.levels.length) - 1],
      color: color,
      icon: hero ? HERO_META[hero.type].icon : 1
    };
  };

  Game.prototype.buildUpgradeCards = function (excludedIds) {
    var cards = [], used = {}, excluded = {};
    for (var excludedIndex = 0; excludedIndex < (excludedIds || []).length; excludedIndex++) excluded[excludedIds[excludedIndex]] = true;
    function addCard(game, pool) {
      pool = shuffle(pool.slice());
      for (var i = 0; i < pool.length; i++) {
        if (!used[pool[i].id] && !excluded[pool[i].id]) {
          used[pool[i].id] = true;
          cards.push(game.makeUpgradeCard(pool[i]));
          return true;
        }
      }
      return false;
    }

    addCard(this, this.availableUpgradeList('common'));
    var buildPool = this.availableUpgradeList('faction').concat(this.availableUpgradeList('exclusive'));
    while (cards.length < 3 && addCard(this, buildPool)) {}
    var allPool = this.availableUpgradeList();
    while (cards.length < 3 && addCard(this, allPool)) {}

    // 牌池不足三张时才允许回落到旧牌，仍保证同一轮不重复。
    excluded = {};
    while (cards.length < 3 && addCard(this, allPool)) {}
    return cards;
  };

  Game.prototype.offerCards = function () {
    if (this.isSpiritLineMode()) { this.offerSpiritLineCards(); return; }
    this.phase = 'cards'; this.pendingLevels = 0;
    this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
    var cards = this.buildUpgradeCards();

    if (!cards.length) { this.phase = 'wave'; return; }
    this.pendingCards = cards;
    this.audio.playSfx('uiCardOpen') || this.audio.tone('bell');
  };

  Game.prototype.eliteDrawCount = function () {
    var weights = eliteDrawTuning().countWeights || [
      { count: 1, weight: 5 }, { count: 2, weight: 25 },
      { count: 3, weight: 40 }, { count: 4, weight: 25 },
      { count: 5, weight: 5 }
    ];
    var total = 0, i;
    for (i = 0; i < weights.length; i++) total += Math.max(0, Number(weights[i].weight) || 0);
    if (!total) return 1;
    var roll = Math.random() * total;
    for (i = 0; i < weights.length; i++) {
      roll -= Math.max(0, Number(weights[i].weight) || 0);
      if (roll < 0) return clamp(Math.floor(Number(weights[i].count) || 1), 1, 5);
    }
    return 1;
  };

  Game.prototype.makeEliteDrawCards = function (count) {
    var pool = shuffle(this.availableUpgradeList().slice()), cards = [], used = {};
    for (var i = 0; i < pool.length && cards.length < count; i++) {
      var upgrade = pool[i];
      if (!upgrade || used[upgrade.id]) continue;
      used[upgrade.id] = true;
      cards.push(this.makeUpgradeCard(upgrade));
    }
    return cards;
  };

  Game.prototype.offerEliteDraw = function (source) {
    if (this.isSpiritLineMode() || !source || this.phase !== 'wave') return false;
    var requestedCount = this.eliteDrawCount();
    var cards = this.makeEliteDrawCards(requestedCount);
    if (!cards.length) return false;
    this.phase = 'eliteDraw';
    this.pendingCards = [];
    this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
    this.eliteDrawState = {
      cards: cards,
      count: cards.length,
      requestedCount: requestedCount,
      source: source,
      t: 0,
      continueRect: { x: 210, y: 1154, w: 300, h: 76 }
    };
    // 煞签不是待选牌：创建结果后立即调用同一套强化生效逻辑。
    for (var i = 0; i < cards.length; i++) this.applyRogueUpgrade(cards[i], { silent: true, skipShowcase: true });
    this.message = '精英已伏 · 煞签显现';
    this.messageTime = 0;
    this.audio.playSfx('upgradeRare') || this.audio.tone('bell');
    return true;
  };

  Game.prototype.closeEliteDraw = function () {
    if (this.phase !== 'eliteDraw') return;
    this.eliteDrawState = null;
    this.phase = 'wave';
    this.message = '强化已生效 · 继续镇守';
    this.messageTime = 2;
    this.audio.playSfx('uiTap') || this.audio.tone('bell');
  };

  Game.prototype.updateEliteDraw = function (dt) {
    if (!this.eliteDrawState) return;
    this.eliteDrawState.t = Math.min(ELITE_DRAW_TIMING.revealEnd, this.eliteDrawState.t + dt);
  };

  Game.prototype.affectedHeroesForUpgrade = function (upgrade) {
    var list = [];
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (upgrade.type === 'common') list.push(hero);
      else if (upgrade.type === 'faction' && hero.faction === upgrade.faction) list.push(hero);
      else if (upgrade.type === 'exclusive' && hero.type === upgrade.hero) list.push(hero);
    }
    return list;
  };

  Game.prototype.applyUpgradeImmediatePulse = function (upgrade, card) {
    var affected = this.affectedHeroesForUpgrade(upgrade);
    var strong = upgrade.rarity === 'legendary';
    var ultimateUnlock = isWallUltimateUnlockUpgrade(upgrade);
    var text = upgrade.type === 'common' ? '全队生效' : upgrade.type === 'faction' ? displayFactionName(upgrade.faction) + '生效' : '专属生效';
    this.skillVignette = { color: card.color, life: .32, maxLife: .32 };
    this.waveProgressFlash = .55;

    for (var i = 0; i < affected.length; i++) {
      var hero = affected[i];
      if (!hero) continue;
      this.burst(hero.x, hero.y - 40, card.color, strong ? 22 : 14);
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y, r: strong ? 48 : 34, color: card.color, life: .65 });
      this.floatText(hero.x, hero.y - 122, text, card.color, strong ? 22 : 18, { life: .9, bold: true, rise: 18 });

      if (upgrade.id === 'U01' || upgrade.id === 'U04' || upgrade.id === 'F05' || upgrade.id === 'F06' ||
        upgrade.id === 'F07' || upgrade.id === 'F08' || upgrade.id === 'E03' || upgrade.id === 'E14' || upgrade.id === 'E16' || upgrade.id === 'E07' || upgrade.id === 'E17' || upgrade.id === 'E18' || upgrade.id === 'E09' || upgrade.id === 'E20' || upgrade.id === 'E21' || upgrade.id === 'E22' ||
        upgrade.id === 'Q01' || upgrade.id === 'Q02' || upgrade.id === 'Q03' || upgrade.id === 'Q04' ||
        upgrade.id === 'E01' || upgrade.id === 'E11' || upgrade.id === 'E12' || upgrade.id === 'E13') {
        hero.attackCd = 0;
        hero.attackBuffTime = Math.max(hero.attackBuffTime || 0, strong ? 5 : 3.5);
      }
      if (!ultimateUnlock && (upgrade.id === 'U02' || upgrade.id === 'F01' || upgrade.id === 'F04' || upgrade.id === 'E02' ||
        upgrade.id === 'U10')) {
        var shield = hero.maxHp * (strong ? .18 : .10);
        hero.shield += shield;
        hero.shieldFlash = .32;
        this.floatText(hero.x, hero.y - 98, '盾 +' + Math.round(shield), '#f7e6a3', 17, { life: .9, rise: 16 });
      }
      if (upgrade.id === 'U03' || upgrade.id === 'U06') {
        this.healHero(hero, hero.maxHp * (strong ? .18 : .12), null);
      }
      if (!ultimateUnlock && (upgrade.id === 'F03' || upgrade.id === 'F09' || upgrade.id === 'E04' ||
        upgrade.id === 'E03' || upgrade.id === 'F07' || upgrade.id === 'F08' || upgrade.id === 'E08' || upgrade.id === 'E10')) {
        hero.ultimateCd = Math.max(0, hero.ultimateCd - (strong ? 5 : 3));
        hero.skillReadyFlash = .25;
      }
      if (upgrade.id === 'U07') {
        hero.ultimateCd = Math.max(0, hero.ultimateCd - hero.ultimateMax * .25);
        hero.skillReadyFlash = .25;
      }
      if (upgrade.id === 'F06' && hero.faction === '妖族') hero.attackCount = 2;
      if (upgrade.id === 'E01' && hero.type === 'huangjin') {
        hero.attackCd = 0;
      }
      if (upgrade.id === 'E11' && hero.type === 'huangjin') {
        hero.attackCd = 0;
        hero.attackCount = this.rogueLevel('E11') >= 2 ? 2 : 3;
      }
      if ((upgrade.id === 'Q01' || upgrade.id === 'Q02') && hero.type === 'qingyi') hero.attackCd = 0;
      if ((upgrade.id === 'Q03' || upgrade.id === 'Q04') && hero.type === 'qingyi') {
        hero.qingyiGlow = Math.max(hero.qingyiGlow || 0, this.qingyiGlowRequirement() - 1);
        hero.qingyiGlowFlash = .45;
      }
      if (upgrade.id === 'E16' && hero.type === 'hongyi') {
        this.updateHongyiPassive(hero, 0);
      }
      if ((upgrade.id === 'E09' || upgrade.id === 'E20' || upgrade.id === 'E21' || upgrade.id === 'E22') && hero.type === 'suwen') {
        hero.attackCd = 0;
      }
    }

    if (upgrade.id === 'U05') {
      this.spiritLampLit = clamp((this.spiritLampLit || 0) + 1, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
      this.spiritLampPulse = .55;
      this.floatText(W / 2, 1120, '灵气 +1', C.gold, 24, { life: 1, bold: true, rise: 20 });
    }
    if (upgrade.id === 'U08') {
      var recover = this.baseMax * .12;
      this.baseHp = clamp(this.baseHp + recover, 0, this.baseMax);
      this.spiritLampHit = .35;
      this.floatText(W / 2, 1040, '阵法 +' + Math.round(recover), C.jade, 22, { life: 1, bold: true, rise: 18 });
    }
    if (upgrade.id === 'U09') {
      this.floatText(W / 2, 720, '本波首次魂归将自动复燃', C.gold, 22, { life: 1.2, bold: true, rise: 18 });
    }
  };

  Game.prototype.applyRogueUpgrade = function (card, options) {
    options = options || {};
    var silent = !!options.silent;
    if (card && card.special === 'spiritUnlock') {
      this.unlockSpiritLineHero(card.unlockHero, card);
      return;
    }
    if (card && card.special === 'protagonistUpgrade') {
      var statKey = card.protagonistKind === 'damage' ? 'protagonistDamageLevel' : card.protagonistKind === 'rate' ? 'protagonistRateLevel' : 'protagonistPierceLevel';
      this[statKey] = Math.min(3, (this[statKey] || 0) + 1);
      this.upgradeCount++;
      if (!this.isSpiritLineMode()) this.level = this.upgradeCount;
      this.burst(W / 2, 1070, '#8ff4ff', 20);
      this.floatText(W / 2, 1010, card.title, '#8ff4ff', 22, { life: 1.1, bold: true, rise: 18 });
      if (!silent) {
        this.message = card.title + '：' + card.desc;
        this.messageTime = 3;
        this.audio.playSfx('upgradeCommon') || this.audio.tone('bell');
      }
      return;
    }
    var upgrades = YL.ROGUE_UPGRADES || [], upgrade = null;
    for (var i = 0; i < upgrades.length; i++) if (upgrades[i].id === card.upgradeId) { upgrade = upgrades[i]; break; }
    if (!upgrade) return;
    var previous = this.rogueLevel(upgrade.id);
    var next = Math.min((upgrade.maxLevel || 1), previous + 1);
    this.rogueLevels[upgrade.id] = next;
    if (!previous) {
      this.upgradeAcquireOrder = this.upgradeAcquireOrder || [];
      this.upgradeAcquireOrder.push(upgrade.id);
    }
    this.upgradeCount++;
    if (!this.isSpiritLineMode()) this.level = this.upgradeCount;
    this.refreshUpgradeDerivedStats(false);
    if (!silent) this.audio.playSfx(upgrade.rarity === 'legendary' ? 'upgradeLegendary' : upgrade.rarity === 'rare' ? 'upgradeRare' : 'upgradeCommon');

    var anchorHero = this.heroForUpgrade(upgrade);
    if (isWallUltimateUnlockUpgrade(upgrade) && anchorHero) {
      anchorHero.ultimateUnlocked = true;
      anchorHero.ultimateCd = anchorHero.ultimateMax;
      anchorHero.ultimatePrevCd = anchorHero.ultimateMax;
      anchorHero.skillReadyFlash = .35;
    }
    var bx = anchorHero ? anchorHero.x : W / 2, by = anchorHero ? anchorHero.y - 40 : 720;
    this.burst(bx, by, card.color, upgrade.rarity === 'legendary' ? 34 : 20);
    this.floatText(bx, by - 50, card.title, card.color, upgrade.rarity === 'legendary' ? 28 : 22, { life: 1.2, bold: true, rise: 22 });
    this.applyUpgradeImmediatePulse(upgrade, card);
    if (!options.skipShowcase && upgrade.p0) this.nextWaveShowcase = { id: upgrade.id, name: upgrade.name, level: next, shown: false };
    if (!silent) {
      this.message = card.title + '：' + card.desc;
      this.messageTime = 3;
    }
  };

  Game.prototype.pickCard = function (index) {
    var card = this.pendingCards[index];
    if (!card) return;
    this.applyRogueUpgrade(card);
    this.pendingCards = [];
    this.phase = 'wave';
    if (this.isSpiritLineMode() && this.pendingLevels > 0) {
      this.pendingLevels--;
      this.offerSpiritLineCards();
    }
  };

  Game.prototype.updateZones = function (dt) {
    for (var i = this.zones.length - 1; i >= 0; i--) {
      var zone = this.zones[i];
      if (zone.followTarget && zone.life > 0) {
        var followTarget = this.getEnemy(zone.followTarget);
        if (followTarget && !followTarget.dead) {
          zone.x = followTarget.x;
          zone.y = followTarget.y - 16;
        }
      }
      var previousZoneProgress = 1 - zone.life / Math.max(.01, zone.maxLife || 1);
      zone.life -= dt; zone.age = (zone.age || 0) + dt;
      var currentZoneProgress = 1 - zone.life / Math.max(.01, zone.maxLife || 1);
      if (zone.type === 'spiritLineAftershock' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var aftershockHero = this.getHero(zone.hero);
        if (aftershockHero) {
          var aftershockHit = false;
          for (var aftershockIndex = 0; aftershockIndex < this.enemies.length; aftershockIndex++) {
            var aftershockEnemy = this.enemies[aftershockIndex];
            if (!aftershockEnemy || aftershockEnemy.dead || dist2(aftershockEnemy.x, aftershockEnemy.y, zone.x, zone.y) > zone.r * zone.r) continue;
            aftershockHit = true;
            this.damageEnemy(aftershockEnemy, zone.damage, aftershockHero, { impact: true, noRune: true });
          }
          this.zones.push({ type: 'ring', x: zone.x, y: zone.y, r: zone.r, color: C.gold, life: .34, maxLife: .34 });
          if (aftershockHit && this.spiritLineV2Level('V2H01') >= 3) {
            var shardDx = Math.cos(zone.angle + Math.PI / 2) * 42;
            var shardDy = Math.sin(zone.angle + Math.PI / 2) * 42;
            for (var shard = -1; shard <= 1; shard += 2) {
              this.zones.push({ type: 'spiritLineShard', x: zone.x + shardDx * shard, y: zone.y + shardDy * shard, r: 42, damage: this.heroAttackPower(aftershockHero) * .35, hero: aftershockHero.id, life: .12, maxLife: .12, fired: false });
              this.zones.push({ type: 'ring', x: zone.x + shardDx * shard, y: zone.y + shardDy * shard, r: 42, color: C.gold, life: .28, maxLife: .28 });
            }
          }
        }
      }
      if (zone.type === 'spiritLineShard' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var shardHero = this.getHero(zone.hero);
        if (shardHero) this.damageArea(zone.x, zone.y, zone.r, zone.damage, shardHero, null, { impact: true, noRune: true });
      }
      if (zone.type === 'spiritLineCrescent' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var crescentHero = this.getHero(zone.hero);
        if (crescentHero) this.damageArea(zone.x, zone.y, zone.r, zone.damage, crescentHero, null, { impact: true, noRune: true });
      }
      if (zone.type === 'spiritLineUltimateStrike' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var strikeHero = this.getHero(zone.hero);
        if (strikeHero) {
          this.damageArea(zone.x, zone.y, zone.r, zone.damage, strikeHero, null, { impact: true, skill: true, noSkillPush: true, noRune: true });
          this.zones.push({ type: 'spiritLineUltimateRing', x: zone.x, y: zone.y, r: zone.r, color: '#f6e7c0', life: .26, maxLife: .26, clockwise: true, step: zone.step, steps: zone.steps });
        }
      }
      if (zone.type === 'spiritLineUltimateOuterStrike' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var outerHero = this.getHero(zone.hero);
        if (outerHero) {
          for (var outerIndex = 0; outerIndex < this.enemies.length; outerIndex++) {
            var outerEnemy = this.enemies[outerIndex];
            if (!outerEnemy || outerEnemy.dead) continue;
            var outerDistance = distance(zone.x, zone.y, outerEnemy.x, outerEnemy.y - 18);
            if (outerDistance < zone.innerR || outerDistance > zone.outerR) continue;
            this.damageEnemy(outerEnemy, zone.damage, outerHero, { impact: true, skill: true, noSkillPush: true, noRune: true });
          }
          this.zones.push({ type: 'spiritLineUltimateRing', x: zone.x, y: zone.y, innerR: zone.innerR, r: zone.outerR, color: '#8878d8', life: .26, maxLife: .26, clockwise: false, step: zone.step, steps: zone.steps });
        }
      }
      if (zone.type === 'spiritLineUltimateCrescent' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var crescentOwner = this.getHero(zone.hero);
        if (crescentOwner) {
          for (var crescentIndex = 0; crescentIndex < this.enemies.length; crescentIndex++) {
            var crescentTarget = this.enemies[crescentIndex];
            if (!crescentTarget || crescentTarget.dead) continue;
            var crescentRadius = Math.max(10, (zone.hitWidth || 20) + (crescentTarget.size || 1) * 8);
            if (this.segmentDistanceSquared(crescentTarget.x, crescentTarget.y - 18, zone.x, zone.y, zone.tx, zone.ty) > crescentRadius * crescentRadius) continue;
            this.damageEnemy(crescentTarget, zone.damage, crescentOwner, { impact: true, skill: true, noSkillPush: true, noRune: true });
          }
          this.zones.push({ type: 'xuanSlash', x: zone.x, y: zone.y, tx: zone.tx, ty: zone.ty, color: '#fff0a8', life: .34, maxLife: .34, bright: true, age: 0 });
        }
      }
      if (zone.type === 'spiritLineUltimateAftershock' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var aftershockUltimateHero = this.getHero(zone.hero);
        if (aftershockUltimateHero) {
          for (var ultimateAftershockIndex = 0; ultimateAftershockIndex < this.enemies.length; ultimateAftershockIndex++) {
            var ultimateAftershockEnemy = this.enemies[ultimateAftershockIndex];
            if (!ultimateAftershockEnemy || ultimateAftershockEnemy.dead || dist2(ultimateAftershockEnemy.x, ultimateAftershockEnemy.y - 18, zone.x, zone.y) > zone.r * zone.r) continue;
            this.damageEnemy(ultimateAftershockEnemy, zone.damage, aftershockUltimateHero, { impact: true, skill: true, noSkillPush: true, noRune: true });
            if (zone.seal && !ultimateAftershockEnemy.dead && (ultimateAftershockEnemy.elite || ultimateAftershockEnemy.type === 'boss')) {
              this.zones.push({ type: 'spiritLineUltimateSeal', x: ultimateAftershockEnemy.x, y: ultimateAftershockEnemy.y - 16, r: 82, damage: this.heroAttackPower(aftershockUltimateHero) * .90, hero: aftershockUltimateHero.id, life: .18, maxLife: .18, fired: false });
            }
          }
          this.zones.push({ type: 'spiritLineUltimateRing', x: zone.x, y: zone.y, r: zone.r, color: C.gold, life: .42, maxLife: .42, clockwise: true });
        }
      }
      if (zone.type === 'spiritLineUltimateSeal' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var sealHero = this.getHero(zone.hero);
        if (sealHero) {
          this.damageArea(zone.x, zone.y, zone.r, zone.damage, sealHero, null, { impact: true, skill: true, noSkillPush: true, noRune: true });
          this.zones.push({ type: 'huangjinWallSeal', x: zone.x, y: zone.y, r: zone.r, life: .46, maxLife: .46 });
        }
      }
      if (zone.type === 'spiritLineBloodZone') {
        var bloodHero = this.getHero(zone.hero);
        zone.tick = (zone.tick || 0) - dt;
        if (bloodHero && zone.life > 0 && zone.tick <= 0) {
          zone.tick += .25;
          for (var bloodIndex = 0; bloodIndex < this.enemies.length; bloodIndex++) {
            var bloodEnemy = this.enemies[bloodIndex];
            if (!bloodEnemy || bloodEnemy.dead || dist2(bloodEnemy.x, bloodEnemy.y - 16, zone.x, zone.y) > zone.r * zone.r) continue;
            bloodEnemy.spiritLineBloodSlow = Math.max(bloodEnemy.spiritLineBloodSlow || 0, .35);
            bloodEnemy.spiritLineBloodSlowMultiplier = zone.slowMultiplier || .80;
            this.damageEnemy(bloodEnemy, zone.damage * .25, bloodHero, { impact: false, noRune: true });
          }
        }
      }
      if (zone.type === 'xuanBladePath') {
        this.updateXuanyaBladePathZone(zone, previousZoneProgress, currentZoneProgress);
      }
      if (zone.type === 'huangjinEcho' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        this.performWallHuangjinWave(this.getHero(zone.hero), zone.data || {});
      }
      if (zone.type === 'huangjinWallHit') {
        var wallHitOwner = this.getHero(zone.hero);
        var wallHitProgress = clamp((zone.age || 0) / Math.max(.01, zone.maxLife || .46), 0, 1);
        var wallHitReach = zone.range * (1 - Math.pow(1 - wallHitProgress, 2));
        for (var wallHitIndex = 0; wallHitIndex < this.enemies.length; wallHitIndex++) {
          var wallHitEnemy = this.enemies[wallHitIndex];
          if (wallHitEnemy.dead || zone.touched[wallHitEnemy.id]) continue;
          var wallHitDx = wallHitEnemy.x - zone.x;
          var wallHitDy = wallHitEnemy.y - zone.y;
          var wallHitDistance = Math.sqrt(wallHitDx * wallHitDx + wallHitDy * wallHitDy);
          if (wallHitDistance > wallHitReach || wallHitDistance > zone.range) continue;
          var wallHitDamageScale = 0;
          var wallHitKnockbackScale = 0;
          var wallHitMainDirection = false;
          for (var wallDirectionIndex = 0; wallDirectionIndex < zone.directions.length; wallDirectionIndex++) {
            var wallDirection = zone.directions[wallDirectionIndex];
            var wallHitDot = wallHitDistance < 1
              ? 1
              : (wallHitDx * Math.cos(wallDirection.angle) + wallHitDy * Math.sin(wallDirection.angle)) / wallHitDistance;
            if (wallHitDot < Math.cos(wallDirection.halfAngle)) continue;
            wallHitDamageScale = Math.max(wallHitDamageScale, wallDirection.damage);
            wallHitKnockbackScale = Math.max(wallHitKnockbackScale, wallDirection.knockback);
            if (!wallDirection.side) wallHitMainDirection = true;
          }
          if (wallHitDamageScale <= 0) continue;
          zone.touched[wallHitEnemy.id] = true;
          zone.hitCount = (zone.hitCount || 0) + 1;
          var wallDamage = zone.damage * wallHitDamageScale;
          this.damageEnemy(wallHitEnemy, wallDamage, wallHitOwner, { impact: true });
          if (!wallHitEnemy.dead && wallHitKnockbackScale > 0) {
            this.wallHuangjinKnockback(wallHitEnemy, zone.knockback * wallHitKnockbackScale, 0);
          }
          if (!wallHitEnemy.dead && zone.slowDuration > 0 && wallHitMainDirection) {
            wallHitEnemy.huangjinHeavySlow = Math.max(wallHitEnemy.huangjinHeavySlow || 0, zone.slowDuration);
          }
          this.burst(wallHitEnemy.x, wallHitEnemy.y - 8, C.gold, 5);
        }
        if (zone.life <= 0 && zone.postHit && !zone.postHitFired) {
          zone.postHitFired = true;
          if ((zone.hitCount || 0) >= (zone.postHit.minTargets || 1)) {
            this.zones.push({
              type: 'huangjinResonance',
              hero: zone.hero,
              x: zone.x + Math.cos(zone.directions[0].angle) * zone.range * .58,
              y: zone.y + Math.sin(zone.directions[0].angle) * zone.range * .58,
              r: zone.postHit.radius || 110,
              damageAtk: zone.postHit.damageAtk || .30,
              knockbackDistance: zone.postHit.knockbackDistance || 0,
              label: zone.postHit.label || '短震',
              life: zone.postHit.delay || .1,
              maxLife: zone.postHit.delay || .1,
              age: 0,
              fired: false
            });
          }
        }
      }
      if (zone.type === 'huangjinCrack') {
        var crackHero = this.getHero(zone.hero);
        for (var crackIndex = 0; crackIndex < this.enemies.length; crackIndex++) {
          var crackEnemy = this.enemies[crackIndex];
          if (!crackEnemy || crackEnemy.dead || zone.touched[crackEnemy.id]) continue;
          if (dist2(crackEnemy.x, crackEnemy.y, zone.x, zone.y) > zone.r * zone.r) continue;
          zone.touched[crackEnemy.id] = true;
          this.addHuangjinSuppress(crackEnemy, crackHero, 1);
          this.burst(crackEnemy.x, crackEnemy.y - 5, C.gold, 4);
        }
      }
      if (zone.type === 'huangjinResonance' && !zone.fired && zone.life <= 0) {
        zone.fired = true;
        var resonanceHero = this.getHero(zone.hero);
        var resonanceDamage = resonanceHero ? this.heroAttackPower(resonanceHero) * (zone.damageAtk || .3) : 0;
        if (resonanceHero && resonanceDamage > 0) this.damageArea(zone.x, zone.y, zone.r, resonanceDamage, resonanceHero, null, { impact: true });
        if (resonanceHero && zone.knockbackDistance > 0) {
          for (var resonanceIndex = 0; resonanceIndex < this.enemies.length; resonanceIndex++) {
            var resonanceEnemy = this.enemies[resonanceIndex];
            if (!resonanceEnemy || resonanceEnemy.dead) continue;
            if (dist2(resonanceEnemy.x, resonanceEnemy.y, zone.x, zone.y) <= zone.r * zone.r) {
              this.wallHuangjinKnockback(resonanceEnemy, zone.knockbackDistance, 0);
            }
          }
        }
        this.zones.push({ type: 'huangjinWallSeal', x: zone.x, y: zone.y - 4, r: zone.r, life: .46, maxLife: .46 });
        this.burst(zone.x, zone.y - 8, C.gold, 13);
        if (zone.label) this.floatText(zone.x, zone.y - 62, zone.label, C.gold, 17, { life: .62, bold: true, rise: 12 });
      }
      if (zone.type === 'qingyiResidualLamp' && !zone.fired) {
        var residualHero = this.getHero(zone.hero);
        for (var residualIndex = 0; residualIndex < this.enemies.length; residualIndex++) {
          var residualEnemy = this.enemies[residualIndex];
          if (!residualEnemy || residualEnemy.dead || zone.touched[residualEnemy.id]) continue;
          if (dist2(residualEnemy.x, residualEnemy.y - 18, zone.x, zone.y) > zone.r * zone.r) continue;
          zone.touched[residualEnemy.id] = true;
          zone.fired = true;
          if (residualHero) this.applyQingyiExpose(residualEnemy, residualHero, zone.duration || 2, { propagated: true });
          this.burst(residualEnemy.x, residualEnemy.y - 18, residualHero ? HERO_META[residualHero.type].color : '#9ef8ff', 5);
          zone.life = Math.min(zone.life, .18);
          break;
        }
      }
      if (zone.type === 'nubaSigil' && zone.life > 0) {
        var nubaSigilHero = this.getHero(zone.hero);
        zone.delay = (zone.delay || 0) - dt;
        if (!zone.fired && zone.delay <= 0) this.fireNubaSigil(zone);
        if (zone.fired && nubaSigilHero && zone.tick != null) {
          zone.tick -= dt;
          if (zone.tick <= 0) {
            zone.tick += Math.max(.18, zone.tickInterval || .82);
            this.damageArea(zone.x, zone.y, zone.r * .88, zone.tickDamage || 0, nubaSigilHero, null, { impact: false, noRune: true });
          }
        }
      }
      if (zone.type === 'nubaPillar' && !zone.fired) {
        zone.delay = (zone.delay || 0) - dt;
        if (zone.delay <= 0) {
          zone.fired = true;
          var nubaPillarHero = this.getHero(zone.hero);
          if (nubaPillarHero && zone.damage > 0) this.damageArea(zone.x, zone.y, zone.r, zone.damage, nubaPillarHero, null, { impact: true, skill: !!zone.skill, noSkillPush: !!zone.skill, noRune: true });
          this.burst(zone.x, zone.y - 10, '#d7c38a', zone.skill ? 14 : 8);
          if (zone.skill) this.impactPause(.035, 3);
        }
      }
      if (zone.type === 'nubaField' && zone.life > 0) {
        var nubaFieldHero = this.getHero(zone.hero);
        if (zone.moving && nubaFieldHero) {
          var nubaMovingTarget = this.densestEnemy();
          if (nubaMovingTarget) { zone.x = nubaMovingTarget.x; zone.y = nubaMovingTarget.y; }
        }
        zone.tick = (zone.tick || 0) - dt;
        if (nubaFieldHero && zone.tick <= 0) {
          zone.tick += Math.max(.20, zone.tickInterval || .80);
          this.damageArea(zone.x, zone.y, zone.r, zone.damage, nubaFieldHero, null, { impact: false, skill: true, noSkillPush: true, noRune: true });
          this.zones.push({ type: 'nubaPillar', x: zone.x, y: zone.y, r: Math.min(96, zone.r * .30), hero: zone.hero, damage: 0, delay: 0, life: .30, maxLife: .30, age: 0, fired: true, skill: true, color: '#d7c38a' });
        }
      }
      if (zone.type === 'nubaResonance' && !zone.fired) {
        zone.delay = (zone.delay || 0) - dt;
        if (zone.delay <= 0) {
          zone.fired = true;
          var resonanceNubaHero = this.getHero(zone.hero);
          var resonanceHits = {};
          if (resonanceNubaHero) {
            for (var nubaResIndex = 0; nubaResIndex < this.enemies.length; nubaResIndex++) {
              var nubaResEnemy = this.enemies[nubaResIndex];
              if (!nubaResEnemy || nubaResEnemy.dead) continue;
              var resRadius = Math.max(10, (zone.hitWidth || 28) + (nubaResEnemy.size || 1) * 7);
              var onMainResonance = this.segmentDistanceSquared(nubaResEnemy.x, nubaResEnemy.y - 18, zone.x, zone.y, zone.tx, zone.ty) <= resRadius * resRadius;
              var onBranchResonance = false;
              if (zone.branchA) onBranchResonance = this.segmentDistanceSquared(nubaResEnemy.x, nubaResEnemy.y - 18, (zone.x + zone.tx) * .5, (zone.y + zone.ty) * .5, zone.branchA.x, zone.branchA.y) <= resRadius * resRadius;
              if (!onBranchResonance && zone.branchB) onBranchResonance = this.segmentDistanceSquared(nubaResEnemy.x, nubaResEnemy.y - 18, (zone.x + zone.tx) * .5, (zone.y + zone.ty) * .5, zone.branchB.x, zone.branchB.y) <= resRadius * resRadius;
              if (!onMainResonance && !onBranchResonance) continue;
              resonanceHits[nubaResEnemy.id] = true;
              this.damageEnemy(nubaResEnemy, zone.damage, resonanceNubaHero, { impact: true, noRune: true });
            }
            if (zone.gate) {
              this.damageArea(zone.tx, zone.ty, 82, zone.burstDamage, resonanceNubaHero, null, { impact: true, skill: true, noSkillPush: true, noRune: true });
              this.zones.push({ type: 'nubaPillar', x: zone.tx, y: zone.ty, r: 82, hero: zone.hero, damage: 0, delay: 0, life: .48, maxLife: .48, age: 0, fired: true, skill: true, color: '#d7c38a' });
              this.zones.push({ type: 'nubaField', x: zone.tx, y: zone.ty, r: 122, hero: zone.hero, life: 1.12, maxLife: 1.12, age: 0, tick: .42, tickInterval: .42, damage: zone.burstDamage * .22, color: '#d7c38a' });
            }
            this.burst(zone.tx, zone.ty - 8, '#d7c38a', zone.gate ? 20 : 10);
          }
        }
      }
      if (zone.type === 'delayedFire' && !zone.fired && zone.life <= .05) {
        zone.fired = true;
        var delayedFireHero = this.getHero(zone.hero);
        this.damageArea(zone.x, zone.y, zone.r, zone.damage, delayedFireHero, zone.noBurn ? null : 'burn', zone.skill ? { impact: true, skill: true, noSkillPush: !!zone.noSkillPush } : null);
        if (zone.finalMeteor && delayedFireHero) this.spawnSpiritLineV2MeteorScatter(delayedFireHero, zone.x, zone.y);
        this.burst(zone.x, zone.y, C.fire, 24);
        if (!zone.noScreenShake) this.shake = 5;
      }
      if (zone.type === 'hongyiSoulEcho' && !zone.fired && zone.life <= .05) {
        zone.fired = true;
        var echoTarget = this.getEnemy(zone.target);
        var echoHero = this.getHero(zone.hero);
        if (echoTarget && !echoTarget.dead && echoHero) {
          this.damageEnemy(echoTarget, zone.damage, echoHero, { impact: true, noHongyiSigil: true });
          this.floatText(echoTarget.x, echoTarget.y - 76, '灼魂回响', C.fire, 17, { life: .65, bold: true });
        }
        this.burst(zone.x, zone.y, C.fire, 10);
      }
      if (zone.type === 'soulFire' && zone.life > 0) {
        if (zone.lotusWave) {
          zone.waveCooldown = (zone.waveCooldown == null ? zone.waveInterval || 1 : zone.waveCooldown) - dt;
          zone.waveLife = Math.max(0, (zone.waveLife || 0) - dt);
          if (zone.waveCooldown <= 0) {
            zone.waveCooldown += zone.waveInterval || 1;
            this.pulseHongyiLotusPetal(zone, this.getHero(zone.hero));
          }
        }
        zone.tick = (zone.tick || 0) - dt;
        if (zone.tick <= 0) {
          zone.tick = .20;
          var fireOwner = this.getHero(zone.hero);
          for (var fireIndex = 0; fireIndex < this.enemies.length; fireIndex++) {
            var fireTarget = this.enemies[fireIndex];
            if (fireTarget.dead) continue;
            var insideFire = zone.lotus
              ? this.hongyiLotusZoneContains(zone, fireTarget)
              : dist2(zone.x, zone.y, fireTarget.x, fireTarget.y) <= zone.r * zone.r;
            if (!insideFire || (!zone.lotus && zone.touched[fireTarget.id])) continue;
            if (!zone.lotus) zone.touched[fireTarget.id] = true;
            var zoneBurnDps = zone.burnDps || (fireOwner ? this.heroAttackPower(fireOwner) * .08 : 8);
            this.applyBurn(fireTarget, fireOwner, zone.lotus ? .75 : (zone.burnDuration || 2), zoneBurnDps);
            if (zone.lotus && fireOwner && fireOwner.type === 'hongyi') {
              fireTarget.hongyiLotusFire = Math.max(fireTarget.hongyiLotusFire || 0, zone.life || .8);
              fireTarget.hongyiLotusSource = fireOwner.id;
            }
            if (!zone.lotus || Math.random() < .24) this.burst(fireTarget.x, fireTarget.y - 12, C.fire, zone.lotusPlatform ? 7 : 5);
          }
        }
      }
      if (zone.type === 'guard' && zone.life > 0) {
        var guardian = this.getHero(zone.hero);
        if (guardian && guardian.alive && guardian.upgrades.ultimate >= 3) this.damageArea(guardian.x, guardian.y, zone.r, 16 * dt, guardian, null);
      }
      if (zone.life <= 0) {
        if (zone.type === 'nubaSigil') {
          var expiredNubaHero = this.getHero(zone.hero);
          if (expiredNubaHero && expiredNubaHero.nubaSigil === zone) expiredNubaHero.nubaSigil = null;
        }
        this.zones.splice(i, 1);
      }
    }
  };

  Game.prototype.impactPause = function (duration, shake) {
    if (this.paused || this.phase === 'cards' || this.phase === 'eliteDraw') return;
    var speedScale = Math.max(1, this.speed || 1);
    this.hitStop = Math.max(this.hitStop || 0, (duration || .04) * speedScale);
    if (shake) this.shake = Math.max(this.shake || 0, shake);
  };

  Game.prototype.soulFireBurst = function (x, y, color, count, scale, options) {
    scale = scale || 1;
    options = options || {};
    var soft = !!options.soft;
    var fireColor = color || C.gold;
    var radius = soft ? (34 + 18 * Math.min(1.6, scale)) : (scale > 1.2 ? 86 : 56);
    var zoneLife = soft ? (.42 + .08 * scale) : (.72 + .16 * scale);
    this.zones.push({
      type: 'deathSoulFire', x: x, y: y - 14, r: radius, color: fireColor,
      life: zoneLife, maxLife: zoneLife, age: 0, soft: soft
    });
    for (var i = 0; i < count && this.particles.length < 220; i++) {
      var spread = Math.random() * Math.PI * 2;
      var lift = soft ? 36 + Math.random() * 58 : 72 + Math.random() * 120;
      var drift = soft ? 8 + Math.random() * 30 : 18 + Math.random() * 62;
      var life = soft ? .32 + Math.random() * .34 : .55 + Math.random() * .62;
      var speedScale = scale * (soft ? .72 : 1);
      this.particles.push({
        kind: 'soulFire',
        x: x + Math.cos(spread) * Math.random() * radius * .28,
        y: y - 8 + Math.sin(spread) * Math.random() * radius * .18,
        vx: Math.cos(spread) * drift * speedScale,
        vy: -lift * speedScale,
        life: life, max: life,
        size: (soft ? 2 + Math.random() * 4.5 : 4 + Math.random() * 9) * scale,
        color: fireColor,
        soft: soft
      });
    }
  };

  Game.prototype.burst = function (x, y, color, count) {
    for (var i = 0; i < count && this.particles.length < 180; i++) {
      var life = .35 + Math.random() * .55, angle = Math.random() * Math.PI * 2, speed = 35 + Math.random() * 130;
      this.particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30, life: life, max: life, size: 2 + Math.random() * 5, color: color });
    }
  };

  Game.prototype.localHitFeedback = function (x, y, color, options) {
    options = options || {};
    var life = valueOr(options.life, .22);
    var radius = valueOr(options.radius, options.skill ? 34 : 24);
    this.zones.push({
      type: 'hitFlash',
      x: x, y: y,
      r: radius,
      color: color || C.danger,
      life: life,
      maxLife: life,
      heavy: !!options.heavy
    });
    this.burst(x, y, color || C.danger, valueOr(options.particles, options.skill ? 12 : 6));
  };

  Game.prototype.floatText = function (x, y, value, color, size, options) {
    if (this.floaters.length >= 40) this.floaters.shift();
    options = options || {};
    var life = options.life || 1;
    this.floaters.push({
      x: x, y: y, value: value, color: color, size: size || 20,
      life: life, max: life, impact: !!options.impact, bold: !!options.bold,
      rise: options.rise == null ? 34 : options.rise
    });
  };

  Game.prototype.updateEffects = function (dt) {
    this.updateRuneDrops(dt);
    if (this.spellHelpTime > 0) {
      this.spellHelpTime -= dt;
      if (this.spellHelpTime <= 0) this.spellHelpKey = null;
    }
    if (this.skillVignette) {
      this.skillVignette.life -= dt;
      if (this.skillVignette.life <= 0) this.skillVignette = null;
    }
    this.wallShieldFlash = Math.max(0, (this.wallShieldFlash || 0) - dt);
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i]; p.life -= dt;
      if (p.kind === 'soulFire') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(.20, dt);
        p.vy -= 12 * dt;
      } else if (p.kind === 'hongyiTrail') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(.18, dt);
        p.vy -= 24 * dt;
        p.angle = (p.angle || 0) + Math.sin((p.max - p.life) * 9) * .018;
      } else if (p.kind === 'hongyiSpark' || p.kind === 'hongyiHitSpark') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(.55, dt);
        p.vy += (p.kind === 'hongyiHitSpark' ? 85 : 28) * dt;
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt;
      }
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (var j = this.floaters.length - 1; j >= 0; j--) {
      var f = this.floaters[j]; f.life -= dt; f.y -= (f.rise == null ? 34 : f.rise) * dt;
      if (f.life <= 0) this.floaters.splice(j, 1);
    }
  };

  Game.prototype.updateBattle = function (dt) {
    if (this.phase === 'cards') return;
    if (this.phase === 'eliteDraw') { this.updateEliteDraw(dt); return; }
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.waveBanner = Math.max(0, this.waveBanner - dt);
    this.shake = Math.max(0, this.shake - dt * 18);
    this.updateEffects(dt);
    this.protagonistManualAttackCd = Math.max(0, (this.protagonistManualAttackCd || 0) - dt);
    this.protagonistAttackFlash = Math.max(0, (this.protagonistAttackFlash || 0) - dt);
    this.protagonistCastTime = Math.max(0, (this.protagonistCastTime || 0) - dt);
    this.updateSpellPress();
    this.updateHeroPress();
    if (this.paused || this.infoOverlay) return;
    if (WALL_MODE && this.huangjinPreviewFreeze > 0) {
      this.huangjinPreviewFreeze = Math.max(0, this.huangjinPreviewFreeze - dt);
      this.updateZones(dt);
      return;
    }
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return;
    }
    this.updateWaveProgress(dt);
    if (WALL_MODE) {
      this.updateSpiritLamps(dt);
      this.updateSpellCooldowns(dt);
      this.updateProtagonistSkillEffects(dt);
    } else this.updateSpiritLamps(dt);
    this.gameTime += dt;
    var hasLiveWaveEnemies = this.enemies.some(function (enemy) { return enemy && !enemy.dead; });
    var holdBossForFinalUpgrade = this.waveQueue.length && this.spawnTimer <= 0 &&
      this.waveQueue[0].type === 'boss' && !this.waveUpgradeOffered && this.hasAvailableUpgradeCards();
    if (holdBossForFinalUpgrade) {
      // 留在本帧末尾，让下方的末波强化分支先打开选牌层。
      this.spawnTimer = 0;
    } else if (this.waveQueue.length && this.spawnTimer <= 0 && this.waveQueue[0].type === 'gap') {
      var gapStep = this.waveQueue.shift();
      this.spawnTimer = Math.max(.1, gapStep.delay || .5);
    } else if (this.waveQueue.length && this.spawnTimer <= 0) {
      var density = enemyDensityTuning();
      var maxAlive = density.maxAlive || 38;
      if (this.waveQueue[0] && this.waveQueue[0].type === 'boss' && !this.bossAppearPlayed) {
        this.bossAppearPlayed = true;
        this.audio.playSfx('bossAppear');
      }
      var packSize = this.waveQueue[0] && this.waveQueue[0].type === 'boss' ? 1 : this.nextSpawnPackSize();
      for (var spawn = 0; spawn < packSize && this.waveQueue.length && this.waveQueue[0].type !== 'gap' && this.enemies.length < maxAlive; spawn++) {
        this.spawnEnemy(this.waveQueue.shift());
      }
      var baseInterval = this.currentWaveConfig && this.currentWaveConfig.spawnInterval || .55;
      this.spawnTimer = Math.max(density.minSpawnInterval || .12, baseInterval * (density.spawnIntervalScale || 1));
    } else this.spawnTimer -= dt;
    this.updateHeroes(dt);
    if (this.phase === 'cards') return;
    if (this.isSpiritLineMode()) this.syncSpiritLineBlocks();
    else if (!WALL_MODE) this.syncBlocks();
    if (this.isSpiritLineMode()) this.updateProtagonistAutoAttack(dt);
    this.updateEnemies(dt);
    if (this.activateNubaRescue()) return;
    if (this.activateFirstStageTutorialAttackGuide()) return;
    if (this.activateFirstStageTutorialSummonGuide()) return;
    if (this.activateFirstStageTutorialSkillGuide()) return;
    if (this.phase === 'cards') return;
    if (this.state !== 'battle') return;
    if (!WALL_MODE) this.resolveSoftCollisions(dt);
    this.updateProjectiles(dt);
    if (this.phase === 'cards') return;
    this.updateZones(dt);
    if (this.phase === 'cards') return;
    if (this.phase === 'wave' && this.eliteDrawQueue && this.eliteDrawQueue.length) {
      var eliteSource = this.eliteDrawQueue.shift();
      if (this.offerEliteDraw(eliteSource)) return;
    }
    if (!WALL_MODE) this.castAutoSpells(dt);
    if (this.phase === 'cards') return;
    // 末波 Boss 不计入怪物数量：先把小怪清空，展示最后一次强化，
    // 玩家选完后再让队尾 Boss 出场，避免强化与 Boss 同时出现。
    var bossWaitingAlone = this.phase === 'wave' && !this.enemies.some(function (enemy) { return enemy && !enemy.dead; }) && this.waveQueue.length &&
      this.waveQueue.every(function (entry) { return entry && entry.type === 'boss'; });
    if (bossWaitingAlone && !this.waveUpgradeOffered && this.hasAvailableUpgradeCards()) {
      this.waveUpgradeOffered = true;
      this.pendingLevels = 0;
      this.waveProgress = Math.max(1, this.waveTotal || 1);
      this.waveProgressFlash = .45;
      this.message = '小怪肃清：选择最后一项御灵强化，随后迎战 Boss';
      this.messageTime = 3;
      this.offerCards();
      return;
    }
    if (!this.waveQueue.length && !this.enemies.length && this.phase === 'wave') {
      if (!this.waveClearSfxPlayed) {
        this.waveClearSfxPlayed = true;
        this.audio.playSfx('waveClear');
      }
      if (this.wave >= this.waveMax) this.endBattle(true);
      else if (WALL_MODE && this.shouldOfferWaveRuneDrop()) {
        this.waveRuneDropOffered = true;
        var waveRuneDrop = this.spawnRuneDrop(W / 2 + (Math.random() * 140 - 70), 600 + Math.random() * 90, WALL_FIXED_RUNE_DROPS[this.wave]);
        if (waveRuneDrop && this.spiritAccessoryTutorial && this.spiritAccessoryTutorial.phase === 'waiting') {
          this.spiritAccessoryTutorial.phase = 'pickup';
          this.spiritAccessoryTutorial.dropId = waveRuneDrop.id;
          this.paused = true;
        }
        this.message = '战场掉落灵饰 · 点击问号拾取';
        this.messageTime = 3;
        return;
      }
      else if (!this.isSpiritLineMode() && !this.externalSkillPreview &&
        (!this.isFirstStageTutorialActive() || (this.heroes && this.heroes.length > 0)) &&
        !this.waveUpgradeOffered && this.hasAvailableUpgradeCards()) {
        this.waveUpgradeOffered = true;
        this.pendingLevels = 0;
        this.waveProgress = Math.max(1, this.waveTotal || 1);
        this.waveProgressFlash = .45;
        this.message = '本波净化完成：选择一项御灵强化';
        this.messageTime = 3;
        this.offerCards();
        return;
      }
      else if (this.intermission <= 0) {
        this.intermission = 3;
        this.message = WALL_MODE ? '本波肃清 · 城防整备' : '布阵阶段：拖动御灵到任意空格';
        this.messageTime = 3;
      }
    }
    if (this.intermission > 0) {
      this.intermission -= dt;
      if (this.intermission <= 0 && this.state === 'battle') this.startWave(this.wave + 1);
    }
  };

  Game.prototype.resultRewardsFor = function (stage, win) {
    var source = stage && stage.resultRewards && stage.resultRewards[win ? 'success' : 'failure'];
    if (!source || !source.length) return [];
    return source.map(function (reward) {
      return {
        id: reward.id,
        name: reward.name,
        amount: Math.max(0, Math.round(reward.amount || 0)),
        doubleEligible: !!reward.doubleEligible
      };
    });
  };

  Game.prototype.openLocalRewardedVideo = function () {
    var doc = root.document;
    if (!doc || !doc.body || !doc.createElement) return Promise.resolve(false);
    var source = this.options && this.options.rewardedVideoSrc || 'assets/video/ad.mp4';
    // 平台子路径部署时相对路径会 404，按页面 base 解析为绝对地址
    if (!/^(?:data:|blob:|https?:|file:)/i.test(source)) {
      try { source = new URL(source, (doc.baseURI || doc.location.href)).href; } catch (e) {}
    }
    return new Promise(function (resolve) {
      var completed = false, settled = false;
      var overlay = doc.createElement('div');
      overlay.setAttribute('data-yuling-rewarded-video', 'true');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;color:#fff;font-family:sans-serif;';
      var title = doc.createElement('div');
      title.textContent = '观看完整视频后，关闭即可领取奖励';
      title.style.cssText = 'font-size:20px;font-weight:700;color:#f5dda0;';
      var video = doc.createElement('video');
      video.src = source;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.style.cssText = 'width:min(92vw,720px);max-height:72vh;background:#000;border:2px solid #b98a3d;border-radius:12px;';
      var status = doc.createElement('div');
      status.textContent = '未看完退出不会获得奖励';
      status.style.cssText = 'font-size:16px;color:#d6d6d6;';
      var close = doc.createElement('button');
      close.textContent = '退出（不领取）';
      close.style.cssText = 'min-width:240px;padding:14px 24px;border-radius:12px;border:2px solid #e1bd68;background:#654521;color:#fff5d2;font-size:18px;font-weight:700;cursor:pointer;';
      overlay.appendChild(title); overlay.appendChild(video); overlay.appendChild(status); overlay.appendChild(close);
      doc.body.appendChild(overlay);
      function finish(watched) {
        if (settled) return;
        settled = true;
        doc.removeEventListener('visibilitychange', onVisibility);
        video.pause();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(!!watched);
      }
      function onVisibility() {
        if (doc.hidden) video.pause();
        else if (!completed) {
          var resumed = video.play();
          if (resumed && resumed.catch) resumed.catch(function () {});
        }
      }
      video.addEventListener('ended', function () {
        completed = true;
        status.textContent = '播放完成，请关闭领取奖励';
        status.style.color = '#9ff1c6';
        close.textContent = '关闭并领取';
      });
      video.addEventListener('error', function () {
        status.textContent = '视频加载失败，本次不发放奖励';
        status.style.color = '#ff9b91';
      });
      close.addEventListener('click', function () { finish(completed); });
      doc.addEventListener('visibilitychange', onVisibility);
      var started = video.play();
      if (started && started.catch) started.catch(function () { status.textContent = '点击视频上的播放键开始观看'; });
    });
  };

  Game.prototype.requestRewardedVideo = function (key) {
    if (this.rewardedVideoBusy) return Promise.resolve(false);
    this.rewardedVideoBusy = key;
    var self = this, request;
    try {
      request = this.options && typeof this.options.showRewardedAd === 'function'
        ? this.options.showRewardedAd({ placement: key })
        : this.openLocalRewardedVideo();
      if (!request || typeof request.then !== 'function') throw new Error('rewarded video provider must return a Promise');
    } catch (error) {
      this.rewardedVideoBusy = null;
      return Promise.resolve(false);
    }
    return request.then(function (watched) {
      self.rewardedVideoBusy = null;
      return watched === true;
    }).catch(function () {
      self.rewardedVideoBusy = null;
      return false;
    });
  };

  Game.prototype.requestUpgradeRefresh = function () {
    if (this.phase !== 'cards' || this.upgradeAdRefreshUsed || this.rewardedVideoBusy) return false;
    var self = this, previousIds = (this.pendingCards || []).map(function (card) { return card.upgradeId; });
    this.requestRewardedVideo('upgrade-refresh').then(function (watched) {
      if (!watched || self.phase !== 'cards') {
        self.message = watched ? '当前已不在强化选择界面' : '视频未完整观看，本次不刷新';
        self.messageTime = 2.4;
        return;
      }
      var refreshed = self.buildUpgradeCards(previousIds);
      if (!refreshed.length) return;
      self.pendingCards = refreshed;
      self.upgradeAdRefreshUsed = true;
      self.audio.playSfx('uiCardOpen') || self.audio.tone('bell');
    });
    return true;
  };

  Game.prototype.requestUpgradeAll = function () {
    if (this.phase !== 'cards' || this.upgradeAdAllUsed || this.rewardedVideoBusy) return false;
    var self = this;
    this.requestRewardedVideo('upgrade-all').then(function (watched) {
      if (!watched || self.phase !== 'cards') {
        self.message = watched ? '当前已不在强化选择界面' : '视频未完整观看，本次不发放全选奖励';
        self.messageTime = 2.4;
        return;
      }
      var cards = (self.pendingCards || []).slice();
      self.upgradeAdAllUsed = true;
      for (var i = 0; i < cards.length; i++) self.applyRogueUpgrade(cards[i], { skipShowcase: true });
      self.pendingCards = [];
      self.phase = 'wave';
      self.message = '三项强化已全部生效';
      self.messageTime = 2.8;
    });
    return true;
  };

  Game.prototype.captureBattleResult = function (win) {
    var heroes = (this.heroes || []).slice().sort(function (a, b) { return (a.soulSlot || 0) - (b.soulSlot || 0); });
    var heroDamage = 0, rows = [], i;
    for (i = 0; i < heroes.length; i++) heroDamage += Math.max(0, heroes[i].damageDone || 0);
    rows.push({ id: 'protagonist', type: 'protagonist', name: '阵主', damage: Math.max(0, (this.totalDamage || 0) - heroDamage), hero: null });
    for (i = 0; i < heroes.length && i < 5; i++) {
      rows.push({
        id: 'hero-' + heroes[i].id,
        type: heroes[i].type,
        name: heroes[i].name || (HERO_META[heroes[i].type] && HERO_META[heroes[i].type].name) || '御灵',
        damage: Math.max(0, heroes[i].damageDone || 0),
        hero: heroes[i]
      });
    }
    while (rows.length < 6) rows.push({ id: 'empty-' + rows.length, type: 'empty', name: '未出战', damage: 0, hero: null });
    var totalDamage = 0;
    for (i = 0; i < rows.length; i++) totalDamage += rows[i].damage;
    for (i = 0; i < rows.length; i++) rows[i].ratio = totalDamage > 0 ? rows[i].damage / totalDamage : 0;
    var stage = this.getSelectedStage();
    return {
      win: !!win,
      stageId: stage.id,
      reachedWave: this.wave,
      waveMax: this.waveMax,
      durationSeconds: this.gameTime,
      kills: this.kills,
      baseHp: this.baseHp,
      baseMax: this.baseMax,
      damageRows: rows,
      totalDamage: totalDamage,
      rewards: this.resultRewardsFor(stage, win),
      adMultiplierState: 'available',
      rewardsClaimed: false
    };
  };

  Game.prototype.requestResultAdDouble = function () {
    var result = this.battleResult;
    if (!result || result.adMultiplierState === 'claimed' || result.adMultiplierState === 'watching') return;
    var self = this;
    result.adMultiplierState = 'watching';
    return this.requestRewardedVideo('result-double').then(function (watched) {
      result.adMultiplierState = watched ? 'claimed' : 'available';
      self.resultNotice = watched ? '双倍奖励已生效' : '视频未完整观看，奖励未翻倍';
      self.resultNoticeUntil = self.time + 2.2;
      self.audio.tone(watched ? 'bell' : 'hurt');
    });
  };

  Game.prototype.endBattle = function (win) {
    if (this.state !== 'battle') return;
    this.finalScore = Math.round(this.score + this.baseHp * 2 + this.upgradeCount * 80 + (win ? 2500 : 0));
    this.rewardXp = Math.max(20, Math.round(this.wave * 12 + this.kills * 1.5));
    this.battleResult = this.captureBattleResult(win);
    this.state = 'result'; this.win = win;
    this.audio.playSfx(win ? 'victory' : 'defeat') || this.audio.tone(win ? 'win' : 'hurt');
  };

  Game.prototype.loop = function (timestamp) {
    var now = timestamp || Date.now(), dt = this.last ? (now - this.last) / 1000 : .016;
    this.last = now; dt = Math.min(.034, Math.max(.001, dt));
    this.syncBgm();
    if (!(this.state === 'battle' && (this.phase === 'cards' || this.phase === 'eliteDraw'))) this.time += dt;
    if (this.state === 'formation' && this.formationNoticeTime > 0) this.formationNoticeTime = Math.max(0, this.formationNoticeTime - dt);
    if (this.state === 'title') this.updateRecruitReveal();
    if (this.state === 'battle') {
      var steps = (this.paused || this.phase === 'cards' || this.phase === 'eliteDraw') ? 1 : (this.speed || 1);
      for (var i = 0; i < steps; i++) this.updateBattle(dt);
    }
    this.render();
    this.raf(this.boundLoop);
  };

  Game.prototype.syncBgm = function () {
    var track = this.state === 'login' || this.state === 'title' ? 'main' : 'battle';
    if (track === this.bgmTrack) return;
    this.bgmTrack = track;
    this.audio.setMusic(track);
  };

  Game.prototype.render = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (this.state === 'loading') this.drawLoading(ctx);
    else if (this.state === 'login') this.drawLogin(ctx);
    else if (this.state === 'title') this.drawTitle(ctx);
    else if (this.state === 'formation') this.drawFormation(ctx);
    else if (this.state === 'battle') this.drawBattle(ctx);
    else this.drawResult(ctx);
  };

  Game.prototype.drawLoading = function (ctx) {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 560); ctx.rotate(this.time * 1.6);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 1.5); ctx.stroke(); ctx.restore();
    A.text(ctx, '正在铺开五灵阵…', W / 2, 690, 30, C.paper);
    A.bar(ctx, 175, 750, 400, 18, this.loaded, Math.max(1, this.loadTotal), C.jade);
  };

  Game.prototype.drawLogin = function (ctx) {
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }
    var fade = ctx.createLinearGradient(0, 0, 0, 540);
    fade.addColorStop(0, 'rgba(4,12,22,.92)'); fade.addColorStop(1, 'rgba(4,12,22,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 560);
    A.text(ctx, '御 灵 召 来', W / 2, 165, 72, '#f7d58c', 'center', '900');
    A.button(ctx, 145, 1035, 460, 118, '开始游戏', true, '#bd5a2e');
    if (YL.TutorialUI && YL.TutorialUI.draw) YL.TutorialUI.draw(this, ctx);
  };

  Game.prototype.drawTitle = function (ctx) {
    if (YL.HomeUI && YL.HomeUI.draw) {
      YL.HomeUI.draw(this, ctx);
      if (YL.TutorialUI && YL.TutorialUI.draw) YL.TutorialUI.draw(this, ctx);
      return;
    }
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }
    var fade = ctx.createLinearGradient(0, 0, 0, 540);
    fade.addColorStop(0, 'rgba(4,12,22,.92)'); fade.addColorStop(1, 'rgba(4,12,22,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 560);
    A.text(ctx, '御 灵 召 来', W / 2, 165, 72, '#f7d58c', 'center', '900');
    A.button(ctx, 145, 1035, 460, 118, '开始游戏', true, '#bd5a2e');
  };

  Game.prototype.drawFormationIcon = function (ctx, index, x, y, size, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (this.assets.formationIcons && (this.assets.formationIcons.width || this.assets.formationIcons.naturalWidth)) {
      A.atlasCell(ctx, this.assets.formationIcons, 4, 4, index, x - size / 2, y - size / 2, size, size, true);
    } else {
      ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(12,24,31,.94)'; ctx.fill();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.stroke();
      A.text(ctx, index === FORMATION_ICON.check ? '✓' : '印', x, y + 1, size * .34, C.gold);
    }
    ctx.restore();
  };

  Game.prototype.drawFormationBackButton = function (ctx) {
    var box = FORMATION_BACK, arrow = this.assets && this.assets.summonEventReturnArrow;
    if (arrow && (arrow.width || arrow.naturalWidth)) {
      ctx.drawImage(arrow, box.x, box.y, box.w, box.h);
      return;
    }
    // 资源未加载时保留与千抽页一致的厚重金色回形箭头降级样式。
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff9b28'; ctx.shadowBlur = 18;
    ctx.strokeStyle = '#4a1c0d'; ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(box.x + 83, box.y + 86);
    ctx.bezierCurveTo(box.x + 47, box.y + 86, box.x + 28, box.y + 71, box.x + 28, box.y + 46);
    ctx.bezierCurveTo(box.x + 28, box.y + 24, box.x + 45, box.y + 10, box.x + 72, box.y + 10);
    ctx.stroke();
    ctx.strokeStyle = '#e9a743'; ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(box.x + 83, box.y + 86);
    ctx.bezierCurveTo(box.x + 47, box.y + 86, box.x + 28, box.y + 71, box.x + 28, box.y + 46);
    ctx.bezierCurveTo(box.x + 28, box.y + 24, box.x + 45, box.y + 10, box.x + 72, box.y + 10);
    ctx.stroke();
    ctx.strokeStyle = '#ffe59a'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(box.x + 81, box.y + 83);
    ctx.bezierCurveTo(box.x + 52, box.y + 83, box.x + 35, box.y + 68, box.x + 35, box.y + 46);
    ctx.bezierCurveTo(box.x + 35, box.y + 29, box.x + 49, box.y + 17, box.x + 69, box.y + 17);
    ctx.stroke();
    ctx.fillStyle = '#4a1c0d';
    ctx.beginPath();
    ctx.moveTo(box.x + 8, box.y + 46); ctx.lineTo(box.x + 52, box.y + 16); ctx.lineTo(box.x + 42, box.y + 42); ctx.lineTo(box.x + 62, box.y + 73);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f0b64d'; ctx.lineWidth = 4; ctx.fillStyle = '#f0b64d';
    ctx.beginPath();
    ctx.moveTo(box.x + 15, box.y + 46); ctx.lineTo(box.x + 50, box.y + 23); ctx.lineTo(box.x + 41, box.y + 45); ctx.lineTo(box.x + 55, box.y + 66);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawFormationTop = function (ctx) {
    var selectedStage = this.getSelectedStage();
    A.rr(ctx, 208, 28, 334, 68, 10, 'rgba(22,18,14,.82)', 'rgba(219,168,76,.74)', 3);
    A.text(ctx, '幽 野 村  ' + selectedStage.id, W / 2, 63, 30, C.paper, 'center', '900');
    A.rr(ctx, 28, 72, 98, 108, 18, 'rgba(8,17,25,.80)', 'rgba(219,168,76,.62)', 3);
    this.drawFormationIcon(ctx, FORMATION_ICON.monster, 77, 118, 62);
    A.text(ctx, '怪物详情', 77, 164, 15, C.paper);

    A.rr(ctx, 515, 52, 190, 48, 9, 'rgba(8,17,25,.76)', 'rgba(219,168,76,.45)', 2);
    var traits = ['鬼族', '修士', '人族', '妖族'];
    for (var i = 0; i < traits.length; i++) {
      this.drawFormationIcon(ctx, FORMATION_ICON.faction[traits[i]], 545 + i * 43, 76, 34);
    }
    A.text(ctx, '关卡特性', 610, 124, 15, '#a9cfc2');
  };

  Game.prototype.drawFormationGrid = function (ctx) {
    var g = FORMATION_GRID, cw = g.w / g.cols, ch = g.h / g.rows;
    ctx.save();
    A.rr(ctx, g.x - 8, g.y - 10, g.w + 16, g.h + 20, 8, 'rgba(18,55,57,.18)', 'rgba(89,236,210,.22)', 2);
    var glow = ctx.createRadialGradient(W / 2, g.y + g.h * .52, 20, W / 2, g.y + g.h * .52, 360);
    glow.addColorStop(0, 'rgba(102,255,221,.16)');
    glow.addColorStop(.55, 'rgba(54,179,174,.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(g.x - 40, g.y - 55, g.w + 80, g.h + 105);
    ctx.strokeStyle = 'rgba(113,239,214,.70)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(72,230,215,.48)';
    ctx.shadowBlur = 8;
    for (var c = 0; c <= g.cols; c++) {
      var x = g.x + c * cw;
      ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke();
    }
    for (var r = 0; r <= g.rows; r++) {
      var y = g.y + r * ch;
      ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(208,254,240,.34)';
    ctx.lineWidth = 1.2;
    for (var i = 0; i < g.rows * g.cols; i++) {
      var rect = this.formationCellRect(i), center = this.formationCellCenter(i), cx = center.x, cy = center.y;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 14, cy); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 14, cy); ctx.closePath();
      ctx.stroke();
      if (!this.formationSlotForGrid(i)) this.drawFormationIcon(ctx, FORMATION_ICON.empty, cx, cy, 28, .34);
    }
    ctx.restore();
  };

  Game.prototype.drawFormationRosterOnGrid = function (ctx) {
    for (var i = 0; i < this.formationSlots.length; i++) {
      var slot = this.formationSlots[i], meta = HERO_META[slot.type], center = this.formationCellCenter(slot.gridIndex);
      var selected = this.formationSelected === slot.type;
      ctx.save();
      ctx.shadowColor = meta.color; ctx.shadowBlur = selected ? 22 : 10;
      ctx.strokeStyle = selected ? '#fff3bd' : meta.color;
      ctx.lineWidth = selected ? 4 : 2.5;
      ctx.beginPath(); ctx.ellipse(center.x, center.y - 4, 52, 18, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      drawFormationHeroSprite(ctx, this.assets[meta.sprite], center.x, center.y + 26, slot.type === 'huangjin' ? 118 : 110, 142, slot.type, 1);
      A.rr(ctx, center.x - 36, center.y + 31, 72, 24, 12, 'rgba(9,17,23,.86)', meta.color, 2);
      A.text(ctx, meta.name, center.x, center.y + 44, 15, C.white);
      if (selected) this.drawFormationIcon(ctx, FORMATION_ICON.check, center.x + 46, center.y - 60, 32);
    }
  };

  Game.prototype.drawFormationTeamBar = function (ctx) {
    A.rr(ctx, 46, 716, 658, 72, 12, 'rgba(11,16,20,.80)', 'rgba(219,168,76,.48)', 2);
    A.text(ctx, '御灵  ' + this.formationSlots.length + ' / 5', 118, 752, 24, C.paper);
    A.rr(ctx, 60, 727, 148, 44, 10, 'rgba(11,16,20,.86)', null, 0);
    A.text(ctx, '御灵  ' + this.formationSlots.length + ' / ' + this.formationMaxSlots(), 118, 752, 24, C.paper);
    var counts = {};
    for (var i = 0; i < this.formationSlots.length; i++) {
      var faction = HERO_META[this.formationSlots[i].type].faction;
      counts[faction] = (counts[faction] || 0) + 1;
    }
    var factions = ['人族', '修士', '妖族', '鬼族', '神'];
    for (var f = 0; f < factions.length; f++) {
      var x = 225 + f * 62;
      this.drawFormationIcon(ctx, FORMATION_ICON.faction[factions[f]], x, 752, 40, counts[factions[f]] ? 1 : .34);
      if (counts[factions[f]]) A.text(ctx, counts[factions[f]], x + 21, 769, 14, C.gold);
    }
    this.drawFormationIcon(ctx, FORMATION_ICON.filter, 626, 752, 42, .72);
    A.text(ctx, '筛选', 670, 752, 18, '#8aa39a');
  };

  Game.prototype.drawFormationHeroCard = function (ctx, type, index) {
    var meta = HERO_META[type], rect = this.formationCardRect(index);
    var selected = this.formationSelected === type, deployed = !!this.formationSlotForType(type);
    ctx.save();
    var border = deployed ? meta.color : 'rgba(219,168,76,.48)';
    A.rr(ctx, rect.x, rect.y, rect.w, rect.h, 8, deployed ? 'rgba(24,32,34,.96)' : 'rgba(16,22,28,.92)', selected ? '#fff1b6' : border, selected ? 4 : 2);
    A.rr(ctx, rect.x + 7, rect.y + 7, rect.w - 14, rect.h - 14, 6, null, 'rgba(255,239,187,.18)', 1);
    var portraitTop = rect.y + 48;
    ctx.save();
    A.rr(ctx, rect.x + 15, portraitTop, rect.w - 30, 104, 8, 'rgba(5,13,19,.88)', null, 0);
    ctx.beginPath();
    A.pathRoundRect(ctx, rect.x + 15, portraitTop, rect.w - 30, 104, 8);
    ctx.clip();
    A.spriteImage(ctx, this.assets[meta.sprite], rect.x + rect.w / 2, rect.y + 176, rect.w * .86, 146, deployed ? 1 : .78);
    ctx.restore();
    this.drawFormationIcon(ctx, FORMATION_ICON.faction[meta.faction], rect.x + 25, rect.y + 27, 38);
    this.drawFormationIcon(ctx, FORMATION_ICON.job[meta.job], rect.x + 28, rect.y + rect.h - 39, 34);
    A.rr(ctx, rect.x + rect.w - 52, rect.y + 14, 42, 24, 7, 'rgba(8,13,18,.86)', 'rgba(219,168,76,.44)', 1);
    A.text(ctx, '1级', rect.x + rect.w - 31, rect.y + 27, 14, C.white);
    A.text(ctx, meta.name, rect.x + rect.w / 2, rect.y + 170, 20, C.paper);
    A.text(ctx, (meta.factionName || meta.faction) + ' · ' + meta.job, rect.x + rect.w / 2, rect.y + 198, 14, '#9fb5ad');
    this.drawFormationIcon(ctx, FORMATION_ICON.star, rect.x + rect.w / 2, rect.y + rect.h - 33, 30, .9);
    if (deployed) {
      A.rr(ctx, rect.x + rect.w - 42, rect.y + rect.h - 46, 32, 32, 16, 'rgba(17,61,45,.88)', '#c8ffd7', 2);
      A.text(ctx, '✓', rect.x + rect.w - 26, rect.y + rect.h - 29, 22, '#dfffd8');
    }
    ctx.restore();
  };

  Game.prototype.drawFormationHeroCard = function (ctx, type, index) {
    var meta = HERO_META[type], rect = this.formationCardRect(index);
    if (!meta) return;
    var selected = this.formationSelected === type;
    var deployed = !!this.formationSlotForType(type);
    var unlocked = this.isFormationHeroUnlocked(type);
    var border = !unlocked ? 'rgba(126,135,138,.38)' : deployed ? meta.color : 'rgba(219,168,76,.48)';
    var fill = !unlocked ? 'rgba(11,14,17,.84)' : deployed ? 'rgba(24,32,34,.96)' : 'rgba(16,22,28,.92)';
    ctx.save();
    A.rr(ctx, rect.x, rect.y, rect.w, rect.h, 8, fill, selected ? '#fff1b6' : border, selected ? 4 : 2);
    A.rr(ctx, rect.x + 7, rect.y + 7, rect.w - 14, rect.h - 14, 6, null, unlocked ? 'rgba(255,239,187,.18)' : 'rgba(180,190,190,.10)', 1);
    var portraitTop = rect.y + 48;
    ctx.save();
    A.rr(ctx, rect.x + 15, portraitTop, rect.w - 30, 104, 8, 'rgba(5,13,19,.88)', null, 0);
    ctx.beginPath();
    A.pathRoundRect(ctx, rect.x + 15, portraitTop, rect.w - 30, 104, 8);
    ctx.clip();
    var cardAlpha = unlocked ? (deployed ? 1 : .78) : .25;
    drawFormationHeroSprite(ctx, this.assets[meta.sprite], rect.x + rect.w / 2, rect.y + 176, rect.w * .86, 146, type, cardAlpha);
    ctx.restore();
    this.drawFormationIcon(ctx, FORMATION_ICON.faction[meta.faction], rect.x + 25, rect.y + 27, 38, unlocked ? 1 : .28);
    this.drawFormationIcon(ctx, FORMATION_ICON.job[meta.job], rect.x + 28, rect.y + rect.h - 39, 34, unlocked ? 1 : .28);
    A.rr(ctx, rect.x + rect.w - 52, rect.y + 14, 42, 24, 7, 'rgba(8,13,18,.86)', unlocked ? 'rgba(219,168,76,.44)' : 'rgba(126,135,138,.34)', 1);
    A.text(ctx, '1级', rect.x + rect.w - 31, rect.y + 27, 14, unlocked ? C.white : '#7f8b8d');
    A.text(ctx, meta.name, rect.x + rect.w / 2, rect.y + 170, 20, unlocked ? C.paper : '#889295');
    A.text(ctx, (meta.factionName || meta.faction) + ' · ' + meta.job, rect.x + rect.w / 2, rect.y + 198, 14, unlocked ? '#9fb5ad' : '#697476');
    this.drawFormationIcon(ctx, FORMATION_ICON.star, rect.x + rect.w / 2, rect.y + rect.h - 33, 30, unlocked ? .9 : .22);
    if (deployed) {
      A.rr(ctx, rect.x + rect.w - 42, rect.y + rect.h - 46, 32, 32, 16, 'rgba(17,61,45,.88)', '#c8ffd7', 2);
      A.text(ctx, '✓', rect.x + rect.w - 26, rect.y + rect.h - 29, 22, '#dfffd8');
    }
    if (!unlocked) {
      A.rr(ctx, rect.x, rect.y, rect.w, rect.h, 8, 'rgba(7,9,12,.48)', 'rgba(126,135,138,.30)', 2);
      A.rr(ctx, rect.x + 20, rect.y + 88, rect.w - 40, 42, 12, 'rgba(7,10,13,.78)', 'rgba(180,190,190,.42)', 1.5);
      A.text(ctx, '未获得', rect.x + rect.w / 2, rect.y + 112, 22, '#c2c9c6', 'center', '800');
    }
    ctx.restore();
  };

  Game.prototype.drawFormationCards = function (ctx) {
    A.panel(ctx, FORMATION_CARD_AREA.x, FORMATION_CARD_AREA.y, FORMATION_CARD_AREA.w, FORMATION_CARD_AREA.h, .95);
    A.text(ctx, '御 灵 册', 92, 858, 24, C.paper);
    A.text(ctx, '卡牌上阵 / 点击阵位角色换位', 270, 858, 16, '#9fb5ad');
    var types = this.formationCardTypes();
    for (var i = 0; i < types.length; i++) this.drawFormationHeroCard(ctx, types[i], i);
  };

  Game.prototype.drawFormationStart = function (ctx) {
    var active = this.formationSlots.length > 0;
    var defaultMode = this.formationMode === 'default';
    var r = FORMATION_START;
    ctx.save();
    var grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, active ? '#d99949' : '#44505a');
    grad.addColorStop(1, active ? '#8a421f' : '#27313a');
    A.rr(ctx, r.x, r.y, r.w, r.h, 18, grad, active ? '#ffe3a2' : '#70787a', 4);
    ctx.shadowColor = active ? 'rgba(255,197,92,.72)' : 'rgba(0,0,0,0)';
    ctx.shadowBlur = active ? 18 + Math.sin(this.time * 5) * 5 : 0;
    this.drawFormationIcon(ctx, FORMATION_ICON.start, r.x + 58, r.y + r.h / 2, 58, active ? 1 : .45);
    A.text(ctx, defaultMode ? (active ? '保存阵容' : '请先上阵') : (active ? '开始镇魂' : '请先上阵'), r.x + r.w / 2 + 22, r.y + r.h / 2 + 2, 38, active ? C.white : '#b8c0bd', 'center', '900');
    ctx.restore();
    A.rr(ctx, 608, 1206, 98, 74, 13, 'rgba(9,18,25,.78)', 'rgba(219,168,76,.46)', 2);
    this.drawFormationIcon(ctx, FORMATION_ICON.recommend, 657, 1232, 44, .82);
    A.text(ctx, defaultMode ? '默认阵容' : '推荐阵容', 657, 1269, 15, '#b8c9c2');
  };

  Game.prototype.drawFormation = function (ctx) {
    if (!cover(ctx, this.assets.battlefield, 0, 0, W, 820)) {
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#102232'); bg.addColorStop(.52, '#16251f'); bg.addColorStop(1, '#07111d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(3,10,17,.24)'; ctx.fillRect(0, 0, W, 820);
    var bottom = ctx.createLinearGradient(0, 720, 0, H);
    bottom.addColorStop(0, 'rgba(5,12,18,.18)');
    bottom.addColorStop(.24, 'rgba(6,12,18,.88)');
    bottom.addColorStop(1, '#050b11');
    ctx.fillStyle = bottom; ctx.fillRect(0, 720, W, H - 720);
    this.drawFormationTop(ctx);
    this.drawFormationGrid(ctx);
    this.drawFormationRosterOnGrid(ctx);
    this.drawFormationTeamBar(ctx);
    this.drawFormationCards(ctx);
    this.drawFormationStart(ctx);
    this.drawFormationBackButton(ctx);
    if (this.formationNoticeTime > 0 && this.formationNotice) {
      A.rr(ctx, 98, 796, 554, 42, 16, 'rgba(8,16,22,.84)', 'rgba(219,168,76,.38)', 2);
      A.text(ctx, this.formationNotice, W / 2, 817, 18, C.paper);
    }
  };

  Game.prototype.drawBattle = function (ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    var battlefieldReady = cover(ctx, this.assets.battlefield, 0, 0, W, WALL_MODE ? H : 960);
    if (WALL_MODE && battlefieldReady) cover(ctx, this.assets.battlefield, 0, 0, W, 960);
    if (!battlefieldReady) {
      var bg = ctx.createLinearGradient(0, 0, 0, WALL_MODE ? H : 960); bg.addColorStop(0, '#142a36'); bg.addColorStop(1, '#19251e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, WALL_MODE ? H : 960);
    }
    ctx.fillStyle = 'rgba(5,13,18,.2)'; ctx.fillRect(0, 0, W, 960);
    if (WALL_MODE) this.drawApprovedBattleFormationOverlay(ctx);
    this.drawGuardAreas(ctx);
    this.drawZones(ctx, false);
    var drawables = [], i;
    for (i = 0; i < this.enemies.length; i++) drawables.push({ y: this.enemies[i].y, kind: 'enemy', value: this.enemies[i] });
    for (i = 0; i < this.heroes.length; i++) {
      if (this.heroes[i].alive) drawables.push({ y: this.heroes[i].y, kind: 'hero', value: this.heroes[i] });
      else if (this.heroes[i].respawn > 0) drawables.push({ y: this.heroes[i].y, kind: 'soul', value: this.heroes[i] });
    }
    drawables.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < drawables.length; i++) {
      if (drawables[i].kind === 'enemy') { A.enemy(ctx, drawables[i].value, this.time, this.assets); this.drawEnemyBar(ctx, drawables[i].value); }
      else if (drawables[i].kind === 'soul') this.drawSoulReturnGhost(ctx, drawables[i].value);
      else {
        this.drawHeroStatusBack(ctx, drawables[i].value);
        A.hero(ctx, drawables[i].value, this.time, this.assets);
        this.drawHeroStatusFront(ctx, drawables[i].value);
        this.drawHeroBar(ctx, drawables[i].value);
      }
    }
    this.drawProjectiles(ctx); this.drawEffects(ctx); this.drawZones(ctx, true); this.drawRuneDrops(ctx);
    this.drawTopHud(ctx);
    if (this.waveBanner > 0) this.drawWaveBanner(ctx);
    if (this.messageTime > 0) {
      A.rr(ctx, 72, 875, 606, 48, 18, 'rgba(7,15,20,.82)', 'rgba(219,168,76,.55)', 2);
      A.text(ctx, this.message, W / 2, 899, 20, C.paper);
    }
    ctx.restore();
    if (WALL_MODE) this.drawApprovedBattleLowerForeground(ctx);
    if (WALL_MODE) this.drawFirstStageTutorialSummonButton(ctx);
    if (this.autoCastUnlocked()) this.drawAutoCastButton(ctx);
    this.drawSkillVignette(ctx);
    this.drawSideRail(ctx);
    if (WALL_MODE) { this.drawRuneShelf(ctx); this.drawRuneDrag(ctx); }
    if (WALL_MODE && this.debugHuangjinPreviewControls) this.drawHuangjinPreviewControls(ctx);
    this.drawSpellHelp(ctx);
    if (!WALL_MODE) this.drawBottomFormation(ctx);
    if (this.phase === 'cards') this.drawCards(ctx);
    if (this.phase === 'eliteDraw') this.drawEliteDraw(ctx);
    // 首关攻击/召唤引导只冻结战斗画面，不打开常规“阵法暂歇”菜单；引导暗幕与提示由 TutorialUI 绘制。
    if (this.paused && !this.isFirstStageTutorialGuidePauseActive() && !this.isSpiritAccessoryTutorialGuidePauseActive() && !this.isNubaRescuePauseActive()) this.drawPause(ctx);
    if (this.infoOverlay) this.drawInfo(ctx);
    this.drawNubaRescueDialogue(ctx);
    if (YL.TutorialUI && YL.TutorialUI.draw) YL.TutorialUI.draw(this, ctx);
  };

  Game.prototype.drawSkillVignette = function (ctx) {
    if (!this.skillVignette) return;
    var vignette = this.skillVignette;
    var alpha = clamp(vignette.life / vignette.maxLife, 0, 1) * .48;
    var corners = [[0, 0], [W, 0], [0, BOARD_H], [W, BOARD_H]];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, BOARD_H); ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < corners.length; i++) {
      var gradient = ctx.createRadialGradient(corners[i][0], corners[i][1], 0, corners[i][0], corners[i][1], 300);
      gradient.addColorStop(0, vignette.color + 'bb');
      gradient.addColorStop(1, vignette.color + '00');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, BOARD_H);
    }
    ctx.restore();
  };

  Game.prototype.drawTopHud = function (ctx) {
    var stage = this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave;
    ctx.save();
    var fade = ctx.createLinearGradient(0, 0, 0, 150);
    fade.addColorStop(0, 'rgba(2,9,16,.68)');
    fade.addColorStop(1, 'rgba(2,9,16,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 150);
    ctx.restore();
    A.text(ctx, '幽野村 ' + stage, W / 2, 28, 29, C.white, 'center', '900');
    A.text(ctx, '第 ' + this.wave + ' / ' + this.waveMax + ' 波', W / 2, 61, 21, C.paper);
    var total = Math.max(1, this.waveTotal || 1);
    var killed = clamp(Math.round(this.waveProgress == null ? (this.waveKills || 0) : this.waveProgress), 0, total);
    var progressColor = (this.waveProgressFlash || 0) > 0 ? '#a8ffe0' : C.jade;
    var p = clamp(killed / total, 0, 1);
    ctx.save();
    var trackX = 217, trackY = 92, trackW = 316, trackH = 17;
    A.rr(ctx, trackX, trackY, trackW, trackH, 9, 'rgba(39,25,17,.72)', 'rgba(250,205,105,.62)', 2);
    if (p > 0) {
      var fill = ctx.createLinearGradient(trackX, trackY, trackX + trackW, trackY);
      fill.addColorStop(0, '#ff9b32');
      fill.addColorStop(.72, '#ffc143');
      fill.addColorStop(1, progressColor);
      A.rr(ctx, trackX + 3, trackY + 3, Math.max(6, (trackW - 6) * p), trackH - 6, 6, fill);
      var tipX = trackX + 3 + (trackW - 6) * p;
      ctx.shadowColor = '#fff0a0'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fff4b0'; ctx.beginPath(); ctx.arc(tipX, trackY + trackH / 2, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    var ornament = this.assets.hudProgressOrnament;
    if (ornament && (ornament.width || ornament.naturalWidth)) {
      var oiw = ornament.width || ornament.naturalWidth, oih = ornament.height || ornament.naturalHeight;
      ctx.drawImage(ornament, 0, oih * .36, oiw, oih * .22, 145, 74, 460, 56);
    } else {
      ctx.strokeStyle = 'rgba(219,168,76,.82)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(157, 100); ctx.lineTo(205, 100); ctx.moveTo(545, 100); ctx.lineTo(593, 100); ctx.stroke();
    }
    ctx.restore();
    if (!WALL_MODE) {
      A.text(ctx, 'LV.' + this.upgradeCount, 174, 101, 18, C.gold, 'center', '900');
      A.text(ctx, 'LV.' + (this.upgradeCount + 1), 576, 101, 18, C.gold, 'center', '900');
    }
    A.text(ctx, killed + ' / ' + total, W / 2, 124, 15, C.paper);
  };

  Game.prototype.drawSpiritLampWall = function (ctx) {
    var lit = clamp(this.spiritLampLit || 0, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
    var hit = clamp((this.spiritLampHit || 0) / .35, 0, 1);
    var pulse = clamp((this.spiritLampPulse || 0) / .55, 0, 1);
    ctx.save();
    ctx.strokeStyle = hit > 0 ? 'rgba(255,96,70,.85)' : 'rgba(219,168,76,.48)';
    ctx.lineWidth = 3 + hit * 3;
    ctx.beginPath();
    ctx.moveTo(80, SPIRIT_LAMP_Y + 20);
    ctx.lineTo(670, SPIRIT_LAMP_Y + 20);
    ctx.stroke();
    for (var i = 0; i < SPIRIT_LAMP_X.length; i++) {
      var x = SPIRIT_LAMP_X[i], y = SPIRIT_LAMP_Y + (hit > 0 ? Math.sin(this.time * 48 + i) * 4 * hit : 0);
      var on = i < lit;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = on ? 1 : .46;
      ctx.strokeStyle = on ? C.gold : 'rgba(166,154,122,.55)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 33); ctx.stroke();
      A.rr(ctx, -19, 12, 38, 13, 6, on ? 'rgba(108,55,22,.95)' : 'rgba(37,43,45,.85)', on ? C.gold : '#65706d', 2);
      ctx.beginPath(); ctx.ellipse(0, 12, 20, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#5b2c14' : '#1d292d'; ctx.fill();
      ctx.strokeStyle = on ? '#f5c36e' : '#65706d'; ctx.stroke();
      if (on) {
        var flame = .85 + .15 * Math.sin(this.time * 8 + i * .7);
        ctx.shadowColor = hit > 0 ? C.danger : C.gold; ctx.shadowBlur = 16 + pulse * 16;
        ctx.fillStyle = hit > 0 ? '#ff6c4e' : '#ffd66b';
        ctx.beginPath();
        ctx.moveTo(0, -15 * flame);
        ctx.quadraticCurveTo(-9, -2, 0, 8);
        ctx.quadraticCurveTo(9, -2, 0, -15 * flame);
        ctx.fill();
        ctx.fillStyle = '#fff3ba';
        ctx.beginPath(); ctx.arc(0, 2, 4 + pulse * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    A.text(ctx, '七星灵灯防线', W / 2, SPIRIT_LAMP_Y + 50, 15, hit > 0 ? '#ff9a7e' : '#f6d18a');
    ctx.restore();
  };

  Game.prototype.drawGuardAreas = function (ctx) {
    if (this.isSpiritLineMode()) {
      ctx.save();
      for (var s = 0; s < SPIRIT_LINE_HOME_SLOTS.length; s++) {
        var home = SPIRIT_LINE_HOME_SLOTS[s];
        var hero = null;
        for (var h = 0; h < this.heroes.length; h++) if (this.heroes[h].lineSlot === s) { hero = this.heroes[h]; break; }
        var color = hero ? HERO_META[hero.type].color : '#8ff4ff';
        // 守备扇区仍参与寻敌与移动判定，但不在正式战斗画面绘制调试分界虚线。
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = color; ctx.globalAlpha = hero && hero.lineUnlocked ? .56 : .22;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(home.x, home.y + 18, 47, 16, 0, 0, Math.PI * 2); ctx.stroke();
        if (hero && !hero.lineUnlocked) {
          ctx.fillStyle = 'rgba(4,13,20,.58)';
          ctx.beginPath(); ctx.arc(home.x, home.y - 34, 24, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = color; ctx.globalAlpha = .56; ctx.lineWidth = 1.6; ctx.stroke();
          A.text(ctx, '待召来', home.x, home.y - 34, 13, '#dbe9dd', 'center', '900');
        }
      }
      ctx.restore();
      return;
    }
    return;
    // 战斗界面不再显示阵位格子、连线和前/中/后排文字；交互逻辑仍保留。
    return;
    ctx.save();
    var deploymentOpen = this.isDeploymentOpen();
    if (deploymentOpen || this.dragDeploy) {
      for (var lane = 0; lane < GRID_COLS.length; lane++) {
        ctx.strokeStyle = 'rgba(116,205,190,.12)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(GRID_COLS[lane], 125); ctx.lineTo(GRID_COLS[lane], 905); ctx.stroke();
      }
    }
    for (var i = 0; i < ANCHORS.length; i++) {
      var anchor = ANCHORS[i], hero = this.heroForAnchor(i);
      var soulOwner = this.heroForSoulAnchor(i);
      var soulLocked = !!(soulOwner && soulOwner !== hero);
      var selected = this.dragDeploy && this.dragDeploy.anchorIndex === i;
      if (!deploymentOpen && !this.dragDeploy && !hero && !soulLocked) continue;
      var cellColor = hero ? HERO_META[hero.type].color : (soulLocked ? HERO_META[soulOwner.type].color : '#9ca9a2');
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y - 30);
      ctx.lineTo(anchor.x + 59, anchor.y);
      ctx.lineTo(anchor.x, anchor.y + 30);
      ctx.lineTo(anchor.x - 59, anchor.y);
      ctx.closePath();
      ctx.fillStyle = hero ? cellColor + (deploymentOpen ? '28' : '18') : (soulLocked ? cellColor + (deploymentOpen ? '18' : '10') : 'rgba(8,18,24,' + (deploymentOpen ? '.42' : '.23') + ')');
      ctx.fill();
      ctx.strokeStyle = selected ? '#fff3bb' : cellColor + (soulLocked ? '66' : (deploymentOpen ? 'a8' : '48'));
      ctx.lineWidth = selected ? 5 : 2;
      if (!hero) ctx.setLineDash([7, 7]); else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (deploymentOpen && !hero) A.text(ctx, soulLocked ? '魂' : '+', anchor.x, anchor.y, soulLocked ? 17 : 21, soulLocked ? cellColor : 'rgba(226,219,190,.55)');
    }
    for (var row = 0; row < GRID_ROWS.length; row++) {
      A.text(ctx, GRID_ROW_NAMES[row], 32, GRID_ROWS[row] - 42, 13, deploymentOpen ? C.gold : 'rgba(200,210,200,.45)');
    }
    ctx.restore();
  };

  Game.prototype.heroForAnchor = function (anchorIndex) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].anchorIndex === anchorIndex) return this.heroes[i];
    return null;
  };

  Game.prototype.drawHeroBar = function (ctx, hero) {
    if (WALL_MODE && !this.isSpiritLineMode()) return;
    var barY = hero.y - 94;
    A.bar(ctx, hero.x - 46, barY, 92, 9, hero.hp, hero.maxHp, C.jade, '#15171a');
    var shield = Math.max(0, hero.shield || 0);
    if (shield > 0) {
      var shieldP = clamp(shield / Math.max(1, hero.maxHp), 0, 1);
      var flash = clamp((hero.shieldFlash || 0) / .45, 0, 1);
      var shieldW = Math.max(10, Math.min(34, 92 * shieldP));
      var sx = hero.x + 46 - shieldW, sy = barY;
      ctx.save();
      ctx.shadowColor = '#72dfff';
      ctx.shadowBlur = 8 + flash * 12;
      A.rr(ctx, sx, sy, shieldW, 9, 5, 'rgba(8,42,58,.82)', 'rgba(125,225,255,.72)', 1);
      var g = ctx.createLinearGradient(sx, sy, sx + shieldW, sy);
      g.addColorStop(0, '#57d7ff');
      g.addColorStop(1, '#d7fbff');
      A.rr(ctx, sx + 2, sy + 2, Math.max(4, shieldW - 4), 5, 3, g);
      if (flash > 0) A.rr(ctx, sx - 2, sy - 2, shieldW + 4, 13, 7, 'rgba(180,246,255,' + (.18 * flash) + ')');
      ctx.restore();
    }
    A.skillCooldown(ctx, hero, hero.x + 59, barY + 4, this.time);
    if (this.rogueLevel('U09') > 0 && !this.waveReviveUsed && hero.alive) {
      var soulPulse = .72 + Math.sin(this.time * 5 + hero.id) * .18;
      ctx.save(); ctx.globalAlpha = soulPulse; ctx.shadowColor = C.gold; ctx.shadowBlur = 12;
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hero.x - 58, barY + 4, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff1a8'; ctx.beginPath(); ctx.arc(hero.x - 58, barY + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    var blocked = 0;
    for (var i = 0; i < this.enemies.length; i++) if (this.enemies[i].blocker === hero.id) blocked++;
    A.text(ctx, blocked + '/' + hero.block, hero.x + 43, barY + 17, 14, '#f5d477');
  };

  Game.prototype.drawHeroInspectRange = function (ctx, hero) {
    if (!hero) return;
    var color = HERO_META[hero.type].color || C.gold;
    var range = Math.max(48, hero.attackRange || 80);
    if (WALL_MODE) {
      var target = this.getEnemy(hero.target);
      var pulseWall = .5 + .5 * Math.sin(this.time * 7);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 11 + pulseWall * 8;
      ctx.lineWidth = 2.2 + pulseWall;
      ctx.setLineDash([13, 10]);
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y, range, range, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = .08 + pulseWall * .04;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y, range, range, 0, 0, Math.PI * 2);
      ctx.fill();

      if (hero.type === 'huangjin') {
        var startX = hero.x, startY = hero.y - 58;
        var baseAngle = target ? Math.atan2(target.y - startY, target.x - startX) : -Math.PI / 2;
        var rangeLevel = this.huangjinUpgradeLevel('E01');
        var half = ([42, 44, 46, 48][rangeLevel] || 42) * Math.PI / 360;
        var directions = [{ angle: baseAngle, half: half, alpha: .20 }];
        for (var di = 0; di < directions.length; di++) {
          var dir = directions[di];
          ctx.globalAlpha = dir.alpha + pulseWall * .05;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.arc(startX, startY, range, dir.angle - dir.half, dir.angle + dir.half);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = .72;
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.arc(startX, startY, range, dir.angle - dir.half, dir.angle + dir.half);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        A.text(ctx, '索敌范围 ' + Math.round(range / 150 * 10) / 10 + ' 格 · 扇形命中', hero.x, Math.min(H - 42, hero.y + 132), 17, color);
      } else if (target) {
        var hitRadius = 34, hitLabel = '单体命中';
        if (hero.type === 'hongyi') {
          var lotusReady = (hero.hongyiSigils || 0) >= this.hongyiSigilRequirement(hero);
          var hongyiPreviewStats = this.hongyiSplashStats({ lotus: lotusReady, splashEnabled: true }, target.burn > 0);
          hitRadius = lotusReady ? hongyiPreviewStats.radius : this.rogueLevel('E03') >= 1 ? hongyiPreviewStats.radius : 34;
          hitLabel = lotusReady ? '赤莲火区' : this.rogueLevel('E03') >= 1 ? '业火爆燃' : '火羽命中';
        } else if (hero.type === 'qingyi') {
          hitRadius = valueOr((heroSkillConfig('qingyi').attack || {}).hitRadius, 46);
          hitLabel = '青灯照破';
        } else if (hero.type === 'suwen') {
          hitRadius = valueOr((heroSkillConfig('suwen').attack || {}).hitRadius, 42);
          hitLabel = hero.suwenFocusReady ? '问命落针' : '星蚀落针';
        } else if (hero.type === 'xuanya') {
          var xuanPreviewAttack = heroSkillConfig('xuanya').attack || {};
          if (this.rogueLevel('E18') >= 3) {
            hitRadius = valueOr(xuanPreviewAttack.followupRadius, 260);
          } else if (this.rogueLevel('E07') >= 1 || this.rogueLevel('E17') >= 1) {
            hitRadius = this.rogueLevel('E17') >= 3
              ? valueOr(xuanPreviewAttack.returnPathWidth3, 112)
              : this.rogueLevel('E07') >= 1
                ? valueOr(xuanPreviewAttack.piercePathWidth, 78)
                : valueOr(xuanPreviewAttack.returnPathWidth, 82);
          } else hitRadius = 46;
          hitLabel = this.rogueLevel('E18') >= 3 ? '追命搜索' : this.rogueLevel('E07') >= 1 && this.rogueLevel('E17') >= 1 ? '穿刺+返回路径' : this.rogueLevel('E07') >= 1 ? '穿刺路径' : this.rogueLevel('E17') >= 1 ? '返回路径' : '飞刃命中';
        }
        ctx.globalAlpha = hero.type === 'xuanya' && (this.rogueLevel('E17') >= 1 || this.rogueLevel('E18') >= 3 || this.rogueLevel('E07') >= 1) ? .10 : .16;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(target.x, target.y - 18, hitRadius, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = .85;
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(target.x, target.y - 18, hitRadius, 0, Math.PI * 2); ctx.stroke();
        if (hero.type === 'xuanya' && (this.rogueLevel('E07') >= 1 || this.rogueLevel('E17') >= 1)) {
          var previewE07 = this.rogueLevel('E07');
          var previewE17 = this.rogueLevel('E17');
          var returnWidth = previewE17 >= 3
            ? valueOr((heroSkillConfig('xuanya').attack || {}).returnPathWidth3, 112)
            : previewE07 >= 1
              ? valueOr((heroSkillConfig('xuanya').attack || {}).piercePathWidth, 78)
              : valueOr((heroSkillConfig('xuanya').attack || {}).returnPathWidth, 82);
          var xuanVx = target.x - hero.x;
          var xuanVy = target.y - 18 - (hero.y - 52);
          var xuanVD = Math.sqrt(xuanVx * xuanVx + xuanVy * xuanVy) || 1;
          var xuanPierceLen = previewE07 >= 3
            ? valueOr((heroSkillConfig('xuanya').attack || {}).e07PierceDistance3, 340)
            : previewE07 >= 2
              ? valueOr((heroSkillConfig('xuanya').attack || {}).e07PierceDistance2, 260)
              : previewE07 >= 1
                ? valueOr((heroSkillConfig('xuanya').attack || {}).e07PierceDistance, 180)
                : valueOr((heroSkillConfig('xuanya').attack || {}).returnForwardDistance, 120);
          var previewEndX = target.x + xuanVx / xuanVD * xuanPierceLen;
          var previewEndY = target.y - 18 + xuanVy / xuanVD * xuanPierceLen;
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = .20;
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(3, returnWidth * .20);
          ctx.shadowColor = color;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(target.x, target.y - 18);
          ctx.lineTo(previewEndX, previewEndY);
          ctx.stroke();
          if (previewE17 >= 1) {
            ctx.globalAlpha = .14;
            ctx.beginPath();
            ctx.moveTo(previewEndX, previewEndY);
            ctx.lineTo(hero.x, hero.y - 52);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
        A.text(ctx, '索敌范围 ' + Math.round(range / 150 * 10) / 10 + ' 格 · ' + hitLabel, hero.x, Math.min(H - 42, hero.y + 132), 17, color);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        A.text(ctx, '索敌范围 ' + Math.round(range / 150 * 10) / 10 + ' 格', hero.x, Math.min(H - 42, hero.y + 132), 17, color);
      }
      ctx.restore();
      return;
    }
    var ry = WALL_MODE ? range : Math.max(24, range * .42);
    var pulse = .5 + .5 * Math.sin(this.time * 7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.lineWidth = 3 + pulse * 1.5;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.ellipse(hero.x, hero.y, range, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = .18 + pulse * .08;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(hero.x, hero.y, range, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    A.text(ctx, '攻击范围 ' + Math.round(range / 150 * 10) / 10 + ' 格', hero.x, hero.y + ry + 34, 17, color);
    ctx.restore();
  };

  Game.prototype.drawEnemyBar = function (ctx, enemy) {
    if (!enemy || (enemy.hpBarTime || 0) <= 0) return;
    var width = enemy.type === 'boss' ? 145 : 66, y = enemy.y - (enemy.type === 'boss' ? 145 : 78) * enemy.size;
    var barH = enemy.type === 'boss' ? 12 : 7;
    var hp = clamp(enemy.hp, 0, enemy.maxHp);
    var lag = clamp(enemy.hpLag == null ? hp : enemy.hpLag, 0, enemy.maxHp);
    var hpP = enemy.maxHp ? hp / enemy.maxHp : 0;
    var lagP = enemy.maxHp ? lag / enemy.maxHp : 0;
    var x = enemy.x - width / 2;
    ctx.save();
    A.rr(ctx, x, y, width, barH, barH / 2, '#171118', 'rgba(240,213,153,.36)', 1);
    if (lagP > 0) A.rr(ctx, x + 2, y + 2, Math.max(3, (width - 4) * lagP), Math.max(2, barH - 4), Math.max(1, (barH - 4) / 2), 'rgba(255,196,82,.70)');
    if (hpP > 0) {
      var fill = enemy.elite ? '#c96dd9' : C.red;
      var g = ctx.createLinearGradient(x, y, x + width, y);
      g.addColorStop(0, fill);
      g.addColorStop(1, enemy.elite ? '#f0a9ff' : C.fire);
      A.rr(ctx, x + 2, y + 2, Math.max(3, (width - 4) * hpP), Math.max(2, barH - 4), Math.max(1, (barH - 4) / 2), g);
    }
    ctx.restore();
    if (enemy.burn > 0) {
      ctx.save(); ctx.shadowColor = C.fire; ctx.shadowBlur = 8; ctx.fillStyle = '#ffb447';
      ctx.beginPath(); ctx.arc(enemy.x - width / 2 - 9, y + 3, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (enemy.xuanyaMark > 0) {
      ctx.save(); ctx.shadowColor = '#d9c7a6'; ctx.shadowBlur = 9; ctx.fillStyle = 'rgba(20,15,28,.92)'; ctx.strokeStyle = '#f3d996'; ctx.lineWidth = 1.5;
      ctx.translate(enemy.x + width / 2 + 10, y + 3);
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-2, -5); ctx.lineTo(-8, 0); ctx.lineTo(-2, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if ((enemy.suwenStarStacks || 0) > 0) {
      ctx.save(); ctx.shadowColor = '#47d8b1'; ctx.shadowBlur = 9; ctx.fillStyle = 'rgba(216,255,243,.92)'; ctx.strokeStyle = '#47d8b1'; ctx.lineWidth = 1.3;
      ctx.translate(enemy.x + width / 2 + (enemy.xuanyaMark > 0 ? 24 : 10), y + 3);
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(2, -2); ctx.lineTo(7, 0); ctx.lineTo(2, 2);
      ctx.lineTo(0, 7); ctx.lineTo(-2, 2); ctx.lineTo(-7, 0); ctx.lineTo(-2, -2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b272c';
      ctx.font = '900 10px ' + uiFontFamily(10);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.min(9, enemy.suwenStarStacks || 0)), 0, 0);
      ctx.restore();
    }
    if ((enemy.qingyiExposeTime || 0) > 0) {
      var exposeOffset = (enemy.xuanyaMark > 0 ? 24 : 0) + ((enemy.suwenStarStacks || 0) > 0 ? 24 : 0);
      ctx.save(); ctx.shadowColor = '#9ef8ff'; ctx.shadowBlur = 10; ctx.fillStyle = 'rgba(9,42,54,.92)'; ctx.strokeStyle = '#9ef8ff'; ctx.lineWidth = 1.3;
      ctx.translate(enemy.x + width / 2 + 10 + exposeOffset, y + 3);
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eaffff';
      ctx.beginPath(); ctx.ellipse(0, -1, 2.6, 5.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if ((enemy.huangjinSuppressStacks || 0) > 0) {
      var suppressOffset = (enemy.xuanyaMark > 0 ? 24 : 0) + ((enemy.suwenStarStacks || 0) > 0 ? 24 : 0) + ((enemy.qingyiExposeTime || 0) > 0 ? 24 : 0);
      ctx.save(); ctx.shadowColor = C.gold; ctx.shadowBlur = 9; ctx.fillStyle = 'rgba(48,35,10,.92)'; ctx.strokeStyle = '#ffd45f'; ctx.lineWidth = 1.3;
      ctx.translate(enemy.x + width / 2 + 10 + suppressOffset, y + 3);
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe8a0';
      ctx.font = '900 10px ' + uiFontFamily(10);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.min(9, enemy.huangjinSuppressStacks || 0)), 0, 0);
      ctx.restore();
    }
    if (this.rogueLevel('F02') > 0 && this.isBlockedByFaction(enemy, '人族')) {
      ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.globalAlpha = .75 + .2 * Math.sin(this.time * 7);
      ctx.strokeRect(enemy.x - width / 2 - 4, y - 4, width + 8, (enemy.type === 'boss' ? 12 : 7) + 8); ctx.restore();
    }
  };

  Game.prototype.drawSoulReturnGhost = function (ctx, hero) {
    var color = HERO_META[hero.type].color, img = this.heroSprite(hero);
    var max = Math.max(.1, hero.respawnMax || 8);
    var progress = clamp(1 - hero.respawn / max, 0, 1);
    var pulse = .55 + Math.sin(this.time * 7 + hero.id) * .16;
    ctx.save();
    ctx.globalAlpha = .58 + pulse * .18;
    ctx.shadowColor = color; ctx.shadowBlur = 22;
    ctx.globalCompositeOperation = 'screen';
    ctx.beginPath(); ctx.arc(hero.x, hero.y - 34, 26 + pulse * 8, 0, Math.PI * 2);
    ctx.fillStyle = color + '33'; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = .46;
    A.spriteImage(ctx, img, hero.x, hero.y, 58, 76, .72);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(hero.x, hero.y - 78, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,235,218,.32)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hero.x, hero.y - 78, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    A.text(ctx, Math.max(0, hero.respawn).toFixed(1), hero.x, hero.y - 74, 14, '#fff2c9');
    A.text(ctx, '魂归', hero.x, hero.y - 108, 15, color);
  };

  Game.prototype.drawWallUltimateCooldown = function (ctx, hero) {
    if (!WALL_MODE || !hero || !hero.alive || !this.isHeroUltimateUnlocked(hero)) return;
    var meta = HERO_META[hero.type] || {};
    var color = meta.color || C.gold;
    var maxCd = Math.max(.01, hero.ultimateMax || 1);
    var remaining = clamp(hero.ultimateCd == null ? maxCd : hero.ultimateCd, 0, maxCd);
    var progress = clamp(1 - remaining / maxCd, 0, 1);
    var ready = remaining <= .05;
    var flash = clamp((hero.skillReadyFlash || 0) / .35, 0, 1);
    var pulse = .5 + .5 * Math.sin(this.time * (ready ? 5.8 : 3.2) + hero.id * .77);
    var cx = hero.x;
    var cy = hero.y + 42;
    var rx = hero.type === 'huangjin' ? 58 : 52;
    var ry = hero.type === 'huangjin' ? 19 : 17;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(3,8,12,.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 4, ry + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ready ? 'rgba(255,234,172,.46)' : 'rgba(168,178,176,.22)';
    ctx.lineWidth = ready ? 3.2 : 2.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (progress > .001) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = ready ? C.gold : color;
      ctx.shadowBlur = ready ? 16 + pulse * 10 + flash * 16 : 8 + progress * 8;
      ctx.strokeStyle = ready ? 'rgba(255,239,174,.96)' : color;
      ctx.lineWidth = ready ? 5.2 + pulse * 1.2 + flash * 3 : 4.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    }

    if (ready) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = color;
      ctx.shadowBlur = 18 + pulse * 12 + flash * 18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6 + pulse * 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 7 + pulse * 3, ry + 4 + pulse * 1.8, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (var spark = 0; spark < 3; spark++) {
        var a = this.time * 2.4 + spark * Math.PI * 2 / 3 + hero.id;
        var sx = cx + Math.cos(a) * (rx + 2);
        var sy = cy + Math.sin(a) * (ry + 2);
        ctx.fillStyle = spark % 2 ? '#fff4be' : color;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4 + pulse * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var label = ready ? '大' : String(Math.ceil(remaining));
    var badgeX = cx;
    var badgeY = cy + ry + 14;
    var badgeR = ready ? 13 : 14;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = ready ? color : 'rgba(0,0,0,.7)';
    ctx.shadowBlur = ready ? 12 + pulse * 8 : 4;
    ctx.fillStyle = ready ? 'rgba(69,38,13,.94)' : 'rgba(5,12,16,.86)';
    ctx.strokeStyle = ready ? '#ffe7a2' : 'rgba(219,168,76,.76)';
    ctx.lineWidth = ready ? 2.2 : 1.7;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    A.text(ctx, label, badgeX, badgeY + (ready ? 1 : 0), ready ? 15 : 14, ready ? '#fff4be' : C.white, 'center', '900');
    ctx.restore();
  };

  Game.prototype.drawHeroStatusBack = function (ctx, hero) {
    if (!hero || !hero.alive) return;
    if (WALL_MODE) this.drawWallUltimateCooldown(ctx, hero);
    var shield = Math.max(0, hero.shield || 0);
    if (shield <= 0) return;
    var ratio = clamp(shield / Math.max(1, hero.maxHp), 0, 1);
    var flash = clamp((hero.shieldFlash || 0) / .45, 0, 1);
    var pulse = .5 + .5 * Math.sin(this.time * 6.4 + hero.id);
    var visibleRatio = Math.max(.16, ratio);
    var w = 118 + visibleRatio * 46 + flash * 28 + pulse * 8;
    var h = 108 + visibleRatio * 42 + flash * 24 + pulse * 7;
    var alpha = .34 + visibleRatio * .16 + flash * .32 + pulse * .05;
    if (!drawCenteredImage(ctx, this.assets.statusShieldAura, hero.x, hero.y - 35, w, h, Math.sin(this.time * 1.7 + hero.id) * .04, alpha, 'screen')) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * .7;
      ctx.strokeStyle = '#8ee7ff';
      ctx.fillStyle = 'rgba(88,189,233,.13)';
      ctx.shadowColor = '#8ee7ff';
      ctx.shadowBlur = 14 + flash * 20;
      ctx.lineWidth = 2 + flash * 3;
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y - 34, w * .28, h * .34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };

  Game.prototype.drawHeroStatusFront = function (ctx, hero) {
    if (!hero || !hero.alive) return;
    var reduced = this.hasHuangjinWallReduction(hero);
    if (reduced) {
      var dragon = this.assets.statusGuardDragon;
      var base = this.time * 2.35 + hero.id * .73;
      for (var i = 0; i < 2; i++) {
        var a = base + i * Math.PI;
        var orbitX = hero.x + Math.cos(a) * (38 + i * 5);
        var orbitY = hero.y - 48 + Math.sin(a) * 18;
        var front = Math.sin(a) > -0.18;
        var size = i ? 42 : 52;
        drawCenteredImage(ctx, dragon, orbitX, orbitY, size, size, a + Math.PI * .42, front ? .58 : .28, 'screen');
      }
    }
    var shield = Math.max(0, hero.shield || 0);
    if (shield > 0) {
      var ratio = clamp(shield / Math.max(1, hero.maxHp), 0, 1);
      var flash = clamp((hero.shieldFlash || 0) / .45, 0, 1);
      var pulse = .5 + .5 * Math.sin(this.time * 7.6 + hero.id);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(142,231,255,' + (.24 + ratio * .18 + flash * .50 + pulse * .05) + ')';
      ctx.lineWidth = 2 + flash * 3;
      ctx.shadowColor = '#8ee7ff';
      ctx.shadowBlur = 10 + flash * 18 + pulse * 5;
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y - 36, 43 + ratio * 16 + flash * 13, 51 + ratio * 18 + flash * 17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (hero.spiritLineV2) this.drawSpiritLineV2Status(ctx, hero);
    else if (hero.type === 'hongyi') this.drawHongyiSigils(ctx, hero);
    if (hero.type === 'qingyi') this.drawQingyiGlow(ctx, hero);
    if (hero.type === 'nuba') this.drawNubaStatus(ctx, hero);
    this.drawEquippedRuneBadge(ctx, hero);
    this.drawTalismanCountBadge(ctx, hero);
  };

  Game.prototype.drawSpiritLineV2Status = function (ctx, hero) {
    ctx.save();
    if (hero.type === 'hongyi') {
      var sigilTotal = this.spiritLineV2Level('V2R02') >= 1 ? 3 : 4;
      var filled = clamp(hero.spiritLineVolley || 0, 0, sigilTotal);
      var pulse = clamp((hero.spiritLineLanceFlash || 0) / .48, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < sigilTotal; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / sigilTotal + this.time * .5;
        var sx = hero.x + Math.cos(a) * 28;
        var sy = hero.y - 58 + Math.sin(a) * 14;
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(a + Math.PI / 2);
        ctx.globalAlpha = i < filled ? .92 : .22;
        ctx.fillStyle = i < filled ? '#ffb14f' : '#6c2e22';
        ctx.strokeStyle = '#ffe5a0'; ctx.lineWidth = 1.4;
        ctx.shadowColor = '#ff6a32'; ctx.shadowBlur = i < filled ? 10 + pulse * 12 : 2;
        ctx.beginPath(); ctx.moveTo(0, -8 - pulse * 2); ctx.lineTo(5, 0); ctx.lineTo(0, 8 + pulse * 2); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    } else if (hero.type === 'xuanya' && (hero.spiritLineXuanyaEmpoweredTime || 0) > 0) {
      var glow = clamp(hero.spiritLineXuanyaEmpoweredTime / 4, .18, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .38 + glow * .36;
      ctx.strokeStyle = '#ff8678'; ctx.lineWidth = 2.2;
      ctx.shadowColor = '#ff5e55'; ctx.shadowBlur = 13;
      ctx.beginPath(); ctx.ellipse(hero.x, hero.y - 16, 38, 14, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffe0ca'; ctx.font = '900 13px ' + uiFontFamily(13); ctx.textAlign = 'center';
      ctx.fillText('追斩', hero.x, hero.y - 72);
    } else if (hero.type === 'huangjin' && hero.shield > .5 && hero.spiritLineShieldTime > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .36 + .16 * Math.sin(this.time * 7);
      ctx.strokeStyle = '#e8c56c'; ctx.lineWidth = 2;
      ctx.shadowColor = '#f3cf75'; ctx.shadowBlur = 11;
      ctx.beginPath(); ctx.ellipse(hero.x, hero.y - 34, 37, 44, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawHongyiSigils = function (ctx, hero) {
    var required = Math.max(1, this.hongyiSigilRequirement(hero));
    var count = clamp(hero.hongyiSigils || 0, 0, required);
    if (!count && !hero.hongyiLotusFlash) return;
    var full = count >= required;
    var flash = clamp((hero.hongyiLotusFlash || 0) / .5, 0, 1);
    var base = this.time * (full ? 4.2 : 2.15) + hero.id * .77;
    var sigilSprite = this.assets.hongyiSigil;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < required; i++) {
      var angle = base + i * Math.PI * 2 / required;
      var front = Math.sin(angle) > -0.18;
      var filled = i < count;
      var alpha = filled ? (front ? .90 : .45) : .14;
      if (full) alpha += .08 * Math.sin(this.time * 10 + i);
      var sx = hero.x + Math.cos(angle) * (34 + flash * 5);
      var sy = hero.y - 54 + Math.sin(angle) * 17;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.shadowColor = filled ? '#ff8a36' : 'rgba(255,138,54,.45)';
      ctx.shadowBlur = filled ? (12 + flash * 12) : 4;
      if (sigilSprite && (sigilSprite.width || sigilSprite.naturalWidth)) {
        var sigilW = filled ? 18 + flash * 3 : 15;
        var sigilH = filled ? 30 + flash * 5 : 25;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(sigilSprite, -sigilW / 2, -sigilH / 2, sigilW, sigilH);
        ctx.restore();
        continue;
      }
      ctx.fillStyle = filled ? (full ? '#ffd46e' : '#ff7d31') : 'rgba(120,54,34,.55)';
      ctx.strokeStyle = filled ? '#fff1b2' : 'rgba(255,190,100,.32)';
      ctx.lineWidth = filled ? 1.7 : 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -10 - flash * 2);
      ctx.lineTo(7, -2);
      ctx.lineTo(4, 10 + flash * 2);
      ctx.lineTo(-4, 10 + flash * 2);
      ctx.lineTo(-7, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (filled) {
        ctx.fillStyle = '#fff4bb';
        ctx.beginPath(); ctx.arc(0, -1, 2.4 + flash * 1.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (full) {
      if (drawCenteredImage(ctx, this.assets.hongyiSigilRing, hero.x, hero.y - 54, 44 + flash * 10, 44 + flash * 10, this.time * 1.6, .74 + flash * .18, 'screen')) {
        ctx.restore();
        return;
      }
      ctx.strokeStyle = 'rgba(255,215,105,' + (.42 + .18 * Math.sin(this.time * 8)) + ')';
      ctx.lineWidth = 2.5 + flash * 2;
      ctx.shadowColor = '#ff6134';
      ctx.shadowBlur = 16 + flash * 18;
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y - 54, 42 + flash * 8, 22 + flash * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawQingyiGlow = function (ctx, hero) {
    var required = Math.max(1, this.qingyiGlowRequirement ? this.qingyiGlowRequirement() : 6);
    var count = clamp(hero.qingyiGlow || 0, 0, required);
    var flash = clamp((hero.qingyiGlowFlash || 0) / .6, 0, 1);
    var synergy = clamp((hero.qingyiSynergyTime || 0) / 4, 0, 1);
    if (!count && !flash && !synergy) return;
    var base = this.time * 2.4 + hero.id * .61;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (synergy > 0) {
      ctx.strokeStyle = 'rgba(158,248,255,' + (.35 + synergy * .28) + ')';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#9ef8ff'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.ellipse(hero.x, hero.y - 42, 48 + flash * 8, 30 + flash * 6, 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (var i = 0; i < required; i++) {
      var angle = base + i * Math.PI * 2 / required;
      var filled = i < count;
      var alpha = filled ? .82 : .16;
      var sx = hero.x + Math.cos(angle) * (31 + flash * 4);
      var sy = hero.y - 58 + Math.sin(angle) * 14;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = filled ? '#9ef8ff' : 'rgba(158,248,255,.35)';
      ctx.shadowBlur = filled ? 12 + flash * 10 : 4;
      ctx.fillStyle = filled ? '#dfffff' : 'rgba(43,112,128,.58)';
      ctx.beginPath(); ctx.arc(0, 0, filled ? 3.8 : 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  Game.prototype.drawNubaStatus = function (ctx, hero) {
    var sigil = hero.nubaSigil;
    var resonance = clamp((hero.nubaResonanceFlash || 0) / .58, 0, 1);
    if (!sigil && !resonance) return;
    var pulse = .5 + .5 * Math.sin(this.time * 7.4 + hero.id);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(215,195,138,' + (.28 + resonance * .48 + pulse * .06) + ')';
    ctx.lineWidth = 2 + resonance * 2;
    ctx.shadowColor = '#d7c38a'; ctx.shadowBlur = 10 + resonance * 14;
    ctx.beginPath(); ctx.ellipse(hero.x, hero.y - 54, 35 + resonance * 12, 16 + resonance * 5, 0, 0, Math.PI * 2); ctx.stroke();
    if (sigil && sigil.life > 0) {
      var orbit = this.time * 2.2 + hero.id * .6;
      var sx = hero.x + Math.cos(orbit) * 29, sy = hero.y - 55 + Math.sin(orbit) * 12;
      ctx.fillStyle = '#e9dca7'; ctx.beginPath(); ctx.arc(sx, sy, 4 + pulse * 1.4, 0, Math.PI * 2); ctx.fill();
      this.drawUpgradeText(ctx, '仪', sx, sy + 1, 11, '#241c20', 'center', '900');
    }
    if (resonance) {
      ctx.strokeStyle = 'rgba(255,244,190,' + (.42 + resonance * .38) + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(hero.x, hero.y - 54, 46 + (1 - resonance) * 12, -Math.PI * .72, Math.PI * .08); ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawTalismanCountBadge = function (ctx, hero) {
    var count = this.talismanBadgeCountForHero(hero);
    if (!count) return;
    var size = 34, x = hero.x + 34, y = hero.y + 4;
    if (x + size / 2 > W - 12) x = hero.x - 34;
    var readyForUltimateUnlock = WALL_MODE && !this.isHeroUltimateUnlocked(hero) && count >= WALL_ULTIMATE_UNLOCK_REQUIRED;
    var img = this.assets.talismanCountBadge;
    ctx.save();
    ctx.shadowColor = readyForUltimateUnlock ? 'rgba(255,240,160,.95)' : 'rgba(255,198,74,.72)';
    ctx.shadowBlur = readyForUltimateUnlock ? 13 + Math.sin(this.time * 6) * 4 : 7;
    if (img && (img.width || img.naturalWidth)) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = '#efd176'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9c5e20'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (readyForUltimateUnlock) {
      ctx.strokeStyle = '#fff0a6';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    this.drawUpgradeText(ctx, String(Math.min(99, count)), x, y + 1, 18, '#3b240f', 'center', '900');
  };

  Game.prototype.drawRuneGlyph = function (ctx, type, x, y, r, active) {
    var meta = this.runeType(type);
    var color = meta.color || C.gold;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 16 : 8;
    ctx.fillStyle = active ? 'rgba(16,28,33,.95)' : 'rgba(7,16,22,.92)';
    ctx.strokeStyle = active ? '#fff0b8' : color;
    ctx.lineWidth = active ? 3 : 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (type === 'emberBell') {
      ctx.lineWidth = Math.max(2, r * .12);
      ctx.beginPath(); ctx.arc(0, 2, r * .42, Math.PI * .08, Math.PI * .92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * .32, -r * .15); ctx.quadraticCurveTo(0, -r * .62, r * .32, -r * .15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r * .45); ctx.quadraticCurveTo(-r * .22, -r * .05, 0, r * .28); ctx.quadraticCurveTo(r * .18, .02, 0, -r * .45); ctx.fill();
    } else if (type === 'breakPearl') {
      ctx.lineWidth = Math.max(2, r * .10);
      ctx.beginPath(); ctx.arc(0, 0, r * .42, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * .52, 0); ctx.lineTo(r * .52, 0); ctx.moveTo(0, -r * .52); ctx.lineTo(0, r * .52); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * .18, -r * .18); ctx.lineTo(r * .20, r * .18); ctx.moveTo(r * .18, -r * .18); ctx.lineTo(-r * .20, r * .18); ctx.stroke();
    } else {
      ctx.lineWidth = Math.max(2, r * .11);
      ctx.beginPath(); ctx.moveTo(-r * .58, r * .15); ctx.quadraticCurveTo(-r * .04, -r * .54, r * .58, -r * .34); ctx.quadraticCurveTo(r * .18, -r * .05, r * .48, r * .36); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * .30, r * .04); ctx.lineTo(r * .32, -r * .26); ctx.moveTo(-r * .08, r * .20); ctx.lineTo(r * .42, r * .02); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff4c8';
    ctx.font = '900 ' + Math.max(12, r * .62) + 'px ' + uiFontFamily(Math.max(12, r * .62));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(meta.short || '?', 0, r * .08);
    ctx.restore();
  };

  Game.prototype.drawRuneDrops = function (ctx) {
    if (!WALL_MODE || !this.runeDrops || !this.runeDrops.length) return;
    for (var i = 0; i < this.runeDrops.length; i++) {
      var drop = this.runeDrops[i];
      var meta = this.runeType(drop.type);
      var ratio = clamp(drop.life / Math.max(.01, drop.maxLife || WALL_RUNE_DROP_LIFE), 0, 1);
      var bob = Math.sin(this.time * 5 + drop.pulse) * 5;
      var alpha = ratio < .25 ? .45 + .45 * Math.sin(this.time * 18) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = meta.color; ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(8,18,24,.88)';
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(drop.x, drop.y + bob, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6c8';
      ctx.font = '900 30px ' + uiFontFamily(30);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', drop.x, drop.y + bob + 1);
      ctx.restore();
    }
  };

  Game.prototype.drawRuneShelf = function (ctx) {
    if (!WALL_MODE || !this.runeInventory || !this.runeInventory.length) return;
    var shelf = WALL_RUNE_SHELF;
    var visible = Math.min(4, this.runeInventory.length);
    var panelH = Math.max(58, visible * shelf.slot + 12);
    ctx.save();
    A.rr(ctx, shelf.x, shelf.y, shelf.w, panelH, 16, 'rgba(5,13,20,.78)', 'rgba(219,168,76,.42)', 2);
    A.text(ctx, '挂', shelf.x + shelf.w / 2, shelf.y - 10, 12, C.gold, 'center', '900');
    for (var i = 0; i < visible; i++) {
      var rune = this.runeInventory[i];
      var cy = shelf.y + 24 + i * shelf.slot;
      var meta = this.runeType(rune.type);
      var dragging = this.dragRune && this.dragRune.uid === rune.uid;
      ctx.globalAlpha = dragging ? .42 : 1;
      this.drawRuneGlyph(ctx, rune.type, shelf.x + shelf.w / 2, cy, 20, this.runeInfoUid === rune.uid);
      ctx.globalAlpha = 1;
      if (rune.equippedHeroId) {
        ctx.save();
        ctx.strokeStyle = meta.color;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shelf.x + shelf.w / 2, cy, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    if (this.runeInventory.length > visible) A.text(ctx, '+' + (this.runeInventory.length - visible), shelf.x + shelf.w / 2, shelf.y + panelH - 6, 12, C.gold, 'center', '900');
    ctx.restore();
    this.drawRuneInfoTooltip(ctx);
  };

  Game.prototype.drawRuneShelf = function (ctx) {
    if (!WALL_MODE || !this.runeInventory || !this.runeInventory.length) return;
    var shelfItems = this.runeShelfItems();
    var showDropTarget = !!this.dragRune;
    if (!shelfItems.length && !showDropTarget) return;
    var shelf = WALL_RUNE_SHELF;
    var visible = Math.max(showDropTarget ? 1 : 0, Math.min(4, shelfItems.length));
    var panelH = Math.max(58, visible * shelf.slot + 12);
    ctx.save();
    A.rr(ctx, shelf.x, shelf.y, shelf.w, panelH, 16, 'rgba(5,13,20,.72)', 'rgba(219,168,76,.34)', 2);
    for (var i = 0; i < Math.min(4, shelfItems.length); i++) {
      var rune = shelfItems[i];
      var cy = shelf.y + 24 + i * shelf.slot;
      var dragging = this.dragRune && this.dragRune.uid === rune.uid;
      ctx.globalAlpha = dragging ? .42 : 1;
      this.drawRuneGlyph(ctx, rune.type, shelf.x + shelf.w / 2, cy, 20, this.runeInfoUid === rune.uid);
      ctx.globalAlpha = 1;
    }
    if (!shelfItems.length && showDropTarget) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(219,168,76,.62)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(shelf.x + shelf.w / 2, shelf.y + 24, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (shelfItems.length > 4) A.text(ctx, '+' + (shelfItems.length - 4), shelf.x + shelf.w / 2, shelf.y + panelH - 6, 12, C.gold, 'center', '900');
    ctx.restore();
    this.drawRuneInfoTooltip(ctx);
  };

  Game.prototype.drawRuneInfoTooltip = function (ctx) {
    var rune = this.runeByUid(this.runeInfoUid);
    if (!rune || this.runeInfoTime <= 0) return;
    var meta = this.runeType(rune.type);
    var hero = rune.equippedHeroId ? this.getHero(rune.equippedHeroId) : null;
    var x = 330, y = 468, w = 330, h = 136;
    ctx.save();
    A.rr(ctx, x, y, w, h, 18, 'rgba(6,15,21,.92)', meta.color, 2);
    this.drawRuneGlyph(ctx, rune.type, x + 42, y + 42, 25, true);
    A.text(ctx, meta.name + ' · ' + meta.rarity, x + 82, y + 30, 20, C.gold, 'left', '900');
    A.text(ctx, hero ? ('已装载：' + hero.name) : '未装载 · 拖到御灵头顶', x + 82, y + 58, 15, hero ? '#a8ffe0' : '#9db1aa', 'left', '700');
    this.wrapUpgradeText(ctx, meta.desc, x + w / 2, y + 92, w - 32, 15, C.paper);
    ctx.restore();
  };

  Game.prototype.drawRuneInfoTooltip = function (ctx) {
    var rune = this.runeByUid(this.runeInfoUid);
    if (!rune || this.runeInfoTime <= 0) return;
    var meta = this.runeType(rune.type);
    var x = 330, y = 468, w = 330, h = 118;
    ctx.save();
    A.rr(ctx, x, y, w, h, 18, 'rgba(6,15,21,.92)', meta.color, 2);
    this.drawRuneGlyph(ctx, rune.type, x + 42, y + 42, 25, true);
    A.text(ctx, meta.name + ' · ' + meta.rarity, x + 82, y + 34, 20, C.gold, 'left', '900');
    this.wrapUpgradeText(ctx, meta.desc, x + w / 2, y + 72, w - 32, 15, C.paper);
    ctx.restore();
  };

  Game.prototype.drawRuneDrag = function (ctx) {
    if (!WALL_MODE || !this.dragRune) return;
    var rune = this.runeByUid(this.dragRune.uid);
    if (!rune) return;
    var target = this.heroAtRuneDropTarget(this.dragRune.x, this.dragRune.y);
    var meta = this.runeType(rune.type);
    ctx.save();
    if (target) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = meta.color;
      ctx.shadowColor = meta.color; ctx.shadowBlur = 16;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(target.x, target.y - 78, 46 + Math.sin(this.time * 10) * 3, 0, Math.PI * 2); ctx.stroke();
    }
    this.drawRuneGlyph(ctx, rune.type, this.dragRune.x, this.dragRune.y, 27, true);
    A.text(ctx, target ? '松手装载' : '拖到御灵头顶', this.dragRune.x, this.dragRune.y + 42, 13, target ? '#d9ffe8' : '#d7e2d2', 'center', '900');
    ctx.restore();
  };

  Game.prototype.equippedRuneBadgePosition = function (hero) {
    var x = hero.x + 42;
    var y = hero.y - 124;
    if (x > W - 28) x = hero.x - 42;
    if (x < 28) x = hero.x + 42;
    return { x: x, y: y };
  };

  Game.prototype.drawEquippedRuneBadge = function (ctx, hero) {
    var rune = this.runeForHero(hero);
    if (!rune) return;
    var pos = this.equippedRuneBadgePosition(hero);
    this.drawRuneGlyph(ctx, rune.type, pos.x, pos.y, 21, this.runeInfoUid === rune.uid);
  };

  Game.prototype.drawProjectiles = function (ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      if ((p.launchDelay || 0) > 0) continue;
      if (p.type === 'protagonistSigil' || p.type === 'protagonistTalisman') {
        var sigilAngle = p.dirX != null && p.dirY != null
          ? Math.atan2(p.dirY, p.dirX)
          : Math.atan2(p.y - (p.prevY == null ? p.y - 1 : p.prevY), p.x - (p.prevX == null ? p.x : p.prevX));
        var sigilPulse = .82 + Math.sin((p.age || 0) * 16) * .10;
        // 阵主符纸先用轻量代码绘制：尺寸克制、低亮度，避免抢过怪物和御灵的战斗反馈。
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = .82;
        ctx.translate(p.x, p.y);
        ctx.rotate(sigilAngle);
        var paperW = 26 * sigilPulse, paperH = 14 * sigilPulse;
        ctx.shadowColor = 'rgba(119,204,214,.28)'; ctx.shadowBlur = 3;
        ctx.fillStyle = '#d8c79f';
        ctx.strokeStyle = '#7c5b32';
        ctx.lineWidth = 1.2;
        ctx.fillRect(-paperW / 2, -paperH / 2, paperW, paperH);
        ctx.strokeRect(-paperW / 2, -paperH / 2, paperW, paperH);
        ctx.globalAlpha = .62;
        ctx.strokeStyle = '#a44736';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-paperW * .22, -paperH * .28); ctx.lineTo(paperW * .22, -paperH * .28);
        ctx.moveTo(-paperW * .28, 0); ctx.lineTo(paperW * .28, 0);
        ctx.moveTo(-paperW * .20, paperH * .28); ctx.lineTo(paperW * .20, paperH * .28);
        ctx.stroke();
        ctx.globalAlpha = .28;
        ctx.strokeStyle = '#8ff4ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-paperW * .72, 0); ctx.lineTo(-paperW * 1.55, 0); ctx.stroke();
        ctx.restore();
        continue;
      }
      if (this.isXuanyaBladeProjectile && this.isXuanyaBladeProjectile(p.type)) {
        var targetEnemy = this.getEnemy(p.target);
        var bladeAngle = targetEnemy
          ? Math.atan2(targetEnemy.y - p.y, targetEnemy.x - p.x)
          : Math.atan2(p.y - (p.prevY == null ? p.y - 1 : p.prevY), p.x - (p.prevX == null ? p.x : p.prevX));
        var bladePulse = .75 + Math.sin((p.age || 0) * 18) * .15;
        var xuanBright = p.type === 'xuanyaChase' || p.empowered;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = xuanBright ? 'rgba(255,232,160,.78)' : 'rgba(217,199,166,.58)';
        ctx.lineWidth = xuanBright ? 5 : 3.5;
        ctx.shadowColor = xuanBright ? '#f8e9a2' : '#0b0710';
        ctx.shadowBlur = xuanBright ? 18 : 14;
        ctx.beginPath(); ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(bladeAngle);
        ctx.fillStyle = xuanBright ? 'rgba(255,237,174,.86)' : 'rgba(17,13,24,.92)';
        ctx.beginPath();
        ctx.moveTo((p.empowered ? 30 : 24) * bladePulse, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-22, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,221,132,.88)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(22 * bladePulse, 0); ctx.stroke();
        ctx.strokeStyle = 'rgba(36,28,48,.86)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(-6, 0, 13, -.9, .9); ctx.stroke();
        ctx.restore();
        continue;
      }
      if (this.isHongyiProjectile && this.isHongyiProjectile(p.type)) {
        var fireTarget = this.getEnemy(p.target);
        var fireAngle = fireTarget
          ? Math.atan2(fireTarget.y - p.y, fireTarget.x - p.x)
          : Math.atan2(p.y - (p.prevY == null ? p.y - 1 : p.prevY), p.x - (p.prevX == null ? p.x : p.prevX));
        var firePulse = .86 + Math.sin((p.age || 0) * 18) * .12;
        var lotusShot = !!p.lotus || p.type === 'hongyiLotus';
        var fireSprite = lotusShot
          ? this.assets.hongyiFirePetal
          : (p.type === 'hongyiFan' ? this.assets.hongyiFanFeather : this.assets.hongyiFireFeather);
        var fireDrawn = false;
        if (fireSprite && (fireSprite.width || fireSprite.naturalWidth)) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = lotusShot ? 'rgba(255,221,118,.42)' : 'rgba(255,138,54,.34)';
          ctx.lineWidth = lotusShot ? 4.5 : 3;
          ctx.shadowColor = lotusShot ? '#ffdf73' : C.fire;
          ctx.shadowBlur = lotusShot ? 18 : 12;
          ctx.beginPath();
          ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();
          var fireW = lotusShot ? 58 : (p.type === 'hongyiFan' ? 58 : 76);
          var fireH = lotusShot ? 68 : (p.type === 'hongyiFan' ? 32 : 38);
          var fireRotation = lotusShot ? fireAngle + Math.PI / 2 : fireAngle;
          var ghostStep = lotusShot ? 18 : (p.type === 'hongyiFan' ? 13 : 16);
          for (var ghost = 3; ghost >= 1; ghost--) {
            var ghostAlpha = (lotusShot ? .18 : .14) / ghost;
            var ghostScale = 1 + ghost * (lotusShot ? .09 : .06);
            drawCenteredImage(
              ctx, fireSprite,
              p.x - Math.cos(fireAngle) * ghostStep * ghost,
              p.y - Math.sin(fireAngle) * ghostStep * ghost + Math.sin((p.age || 0) * 18 + ghost) * 1.4,
              fireW * firePulse * ghostScale,
              fireH * firePulse * ghostScale,
              fireRotation,
              ghostAlpha,
              'screen'
            );
          }
          fireDrawn = drawCenteredImage(ctx, fireSprite, p.x, p.y, fireW * firePulse, fireH * firePulse, fireRotation, .96, 'screen');
        }
        if (fireDrawn) continue;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = lotusShot ? 'rgba(255,221,118,.74)' : 'rgba(255,138,54,.58)';
        ctx.lineWidth = lotusShot ? 7 : 4;
        ctx.shadowColor = lotusShot ? '#ffdf73' : C.fire;
        ctx.shadowBlur = lotusShot ? 24 : 17;
        ctx.beginPath(); ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(fireAngle);
        var glow = ctx.createRadialGradient(0, 0, 2, 0, 0, lotusShot ? 34 : 24);
        glow.addColorStop(0, 'rgba(255,245,176,.94)');
        glow.addColorStop(.42, lotusShot ? 'rgba(255,82,45,.78)' : 'rgba(255,138,54,.68)');
        glow.addColorStop(1, 'rgba(130,24,12,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, (lotusShot ? 34 : 24) * firePulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = lotusShot ? 'rgba(255,78,42,.96)' : 'rgba(255,129,42,.94)';
        ctx.beginPath();
        ctx.moveTo((lotusShot ? 30 : 23) * firePulse, 0);
        ctx.quadraticCurveTo(4, -(lotusShot ? 17 : 12), -22, -7);
        ctx.quadraticCurveTo(-9, 0, -22, 7);
        ctx.quadraticCurveTo(4, lotusShot ? 17 : 12, (lotusShot ? 30 : 23) * firePulse, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,244,197,.92)';
        ctx.lineWidth = lotusShot ? 2.6 : 1.8;
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo((lotusShot ? 28 : 21) * firePulse, 0); ctx.stroke();
        if (lotusShot) {
          ctx.strokeStyle = 'rgba(255,215,116,.86)';
          ctx.lineWidth = 1.8;
          for (var petal = 0; petal < 3; petal++) {
            var pa = (petal - 1) * .48;
            ctx.beginPath();
            ctx.ellipse(0, 0, 23 * firePulse, 8, pa, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
        continue;
      }
      if (p.type === 'qingyi') {
        if (p.fallDelay != null) {
          var lampDropProgress = 1 - clamp((p.fallDelay || 0) / Math.max(.01, p.maxFallDelay || .38), 0, 1);
          var lampPulse = .82 + Math.sin((p.age || 0) * 18) * .16;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(158,248,255,.72)';
          ctx.lineWidth = 3.6;
          ctx.shadowColor = '#9ef8ff';
          ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 44); ctx.lineTo(p.x, p.y + 18); ctx.stroke();
          ctx.translate(p.x, p.y);
          var lampGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
          lampGlow.addColorStop(0, 'rgba(236,255,255,.96)');
          lampGlow.addColorStop(.36, 'rgba(158,248,255,.68)');
          lampGlow.addColorStop(1, 'rgba(158,248,255,0)');
          ctx.fillStyle = lampGlow;
          ctx.beginPath(); ctx.arc(0, 0, 25 * lampPulse, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,246,194,.82)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, 0, 8 * lampPulse, 15 * lampPulse, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = 'rgba(255,252,225,.90)';
          ctx.beginPath(); ctx.arc(0, -4 + lampDropProgress * 4, 4.5 * lampPulse, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          continue;
        }
        var holyTarget = this.getEnemy(p.target);
        var holyAngle = holyTarget
          ? Math.atan2(holyTarget.y - p.y, holyTarget.x - p.x)
          : Math.atan2(p.y - (p.prevY == null ? p.y - 1 : p.prevY), p.x - (p.prevX == null ? p.x : p.prevX));
        var holyPulse = .82 + Math.sin((p.age || 0) * 15) * .16;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,246,194,.58)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f7e6a3';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(holyAngle);
        var holyGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
        holyGlow.addColorStop(0, 'rgba(255,255,238,.96)');
        holyGlow.addColorStop(.35, 'rgba(247,230,163,.72)');
        holyGlow.addColorStop(1, 'rgba(247,230,163,0)');
        ctx.fillStyle = holyGlow;
        ctx.beginPath(); ctx.arc(0, 0, 24 * holyPulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,244,.92)';
        ctx.beginPath(); ctx.ellipse(4, 0, 12 * holyPulse, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,244,255,.72)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 15 * holyPulse, -1.1, 1.25); ctx.stroke();
        ctx.restore();
        continue;
      }
      if (this.isSuwenNeedleProjectile && this.isSuwenNeedleProjectile(p.type)) {
        if (p.fallDelay != null) {
          var dropProgress = 1 - clamp((p.fallDelay || 0) / Math.max(.01, p.maxFallDelay || .32), 0, 1);
          var dropPulse = .82 + Math.sin((p.age || 0) * 20) * .14;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = p.focus ? 'rgba(255,252,205,.82)' : 'rgba(132,242,255,.68)';
          ctx.lineWidth = p.focus ? 4.5 : (p.smallNeedle ? 2.3 : 3.2);
          ctx.shadowColor = p.focus ? '#fff2a8' : '#47d8b1';
          ctx.shadowBlur = p.focus ? 20 : 15;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 36); ctx.lineTo(p.x, p.y + 18); ctx.stroke();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = p.focus ? 'rgba(255,250,197,.96)' : 'rgba(114,242,255,.92)';
          ctx.beginPath();
          ctx.moveTo((p.focus ? 30 : 23) * dropPulse, 0);
          ctx.lineTo(-12, -5);
          ctx.lineTo(-19, 0);
          ctx.lineTo(-12, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          continue;
        }
        var needleTarget = this.getEnemy(p.target);
        var needleAngle = needleTarget
          ? Math.atan2(needleTarget.y - p.y, needleTarget.x - p.x)
          : Math.atan2(p.y - (p.prevY == null ? p.y - 1 : p.prevY), p.x - (p.prevX == null ? p.x : p.prevX));
        var needlePulse = .8 + Math.sin((p.age || 0) * 22) * .14;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.type === 'suwenEcho' ? 'rgba(216,255,243,.66)' : 'rgba(132,242,255,.62)';
        ctx.lineWidth = p.type === 'suwenPierce' ? 3.5 : 2.5;
        ctx.shadowColor = p.type === 'suwenEcho' ? '#d8fff3' : '#47d8b1';
        ctx.shadowBlur = p.type === 'suwenEcho' ? 16 : 14;
        ctx.beginPath(); ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.translate(p.x, p.y);
        ctx.rotate(needleAngle);
        ctx.fillStyle = p.type === 'suwenEcho' ? 'rgba(216,255,243,.94)' : 'rgba(114,242,255,.92)';
        ctx.beginPath();
        ctx.moveTo(24 * needlePulse, 0);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,238,.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(22 * needlePulse, 0); ctx.stroke();
        for (var starPoint = 0; starPoint < 4; starPoint++) {
          var sa = starPoint * Math.PI / 2 + (p.age || 0) * 6;
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * 10, Math.sin(sa) * 4, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        continue;
      }
      ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = 18;
      ctx.strokeStyle = p.color; ctx.lineWidth = p.r * .9; ctx.globalAlpha = .42;
      ctx.beginPath(); ctx.moveTo(p.prevX == null ? p.x : p.prevX, p.prevY == null ? p.y : p.prevY); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + Math.sin((p.age || 0) * 18) * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff4ce'; ctx.lineWidth = 2; ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, (p.age || 0) * 8, (p.age || 0) * 8 + Math.PI * 1.15); ctx.stroke();
      ctx.restore();
      var orbFrame = 1 + Math.floor((p.age || 0) * 12) % 2;
      var orbSize = p.type === 'hongyi' ? 88 : 76;
      drawVfxFrame(ctx, this.assets.rangedOrbsVfx, 4, 3, orbFrame, p.vfxRow || 0, p.x, p.y, orbSize, orbSize, 0, .95);
    }
  };

  Game.prototype.drawZones = function (ctx, foreground) {
    foreground = !!foreground;
    for (var i = 0; i < this.zones.length; i++) {
      var z = this.zones[i], alpha = clamp(z.life * 2, 0, 1);
      if (z.type === 'guard') continue;
      var foregroundZone = z.type === 'hitFlash' ||
        z.type === 'meleeSlash' || z.type === 'shieldBashImpact' ||
        z.type === 'wispClawHit' || z.type === 'orbImpact' ||
        z.type === 'protagonistAimClick' ||
        z.type === 'xuanImpact' || z.type === 'xuanMark' || z.type === 'xuanCast' || z.type === 'xuanSlash' || z.type === 'xuanBoomerang' || z.type === 'xuanPierceTrail' || z.type === 'xuanBladePath' || z.type === 'xuanLink' ||
        z.type === 'holyHit' || z.type === 'holyLink' || z.type === 'holyShield' ||
        z.type === 'qingyiMark' || z.type === 'qingyiLink' || z.type === 'qingyiBurst' || z.type === 'burnSpreadLink' ||
        z.type === 'starImpact' || z.type === 'starMark' || z.type === 'starLink' || z.type === 'starBurst' ||
        z.type === 'nubaPillar' || z.type === 'nubaResonance';
      if (foregroundZone !== foreground) continue;
      ctx.save(); ctx.globalAlpha = alpha;
      if (z.type === 'nubaSigil' || z.type === 'nubaField' || z.type === 'nubaUltimate') {
        var nubaProgress = clamp(1 - z.life / Math.max(.01, z.maxLife || 1), 0, 1);
        var nubaRadius = z.r || 120;
        var nubaGradient = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, nubaRadius);
        nubaGradient.addColorStop(0, z.type === 'nubaUltimate' ? 'rgba(234,218,166,.28)' : 'rgba(215,195,138,.18)');
        nubaGradient.addColorStop(.38, 'rgba(38,31,45,.30)');
        nubaGradient.addColorStop(1, 'rgba(21,18,37,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = nubaGradient;
        ctx.beginPath(); ctx.arc(z.x, z.y, nubaRadius * (z.lane ? 1 : .92), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(215,195,138,' + (z.type === 'nubaUltimate' ? (.64 + .20 * Math.sin(this.time * 8)) : (.42 + .12 * Math.sin(this.time * 6))) + ')';
        ctx.lineWidth = z.type === 'nubaUltimate' ? 5 : 3;
        ctx.shadowColor = '#d7c38a'; ctx.shadowBlur = z.type === 'nubaUltimate' ? 22 : 12;
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 16, nubaRadius, nubaRadius * .30, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.setLineDash(z.type === 'nubaSigil' && !z.fired ? [9, 7] : []);
        ctx.beginPath(); ctx.arc(z.x, z.y, nubaRadius * (.62 + nubaProgress * .16), this.time * 1.2, this.time * 1.2 + Math.PI * 1.65); ctx.stroke();
        ctx.setLineDash([]);
        if (z.type === 'nubaUltimate') {
          ctx.strokeStyle = 'rgba(234,218,166,.58)'; ctx.lineWidth = 4;
          for (var nubaArc = 0; nubaArc < 3; nubaArc++) {
            var nubaArcAngle = this.time * (nubaArc % 2 ? -.55 : .55) + nubaArc * 2.1;
            ctx.beginPath(); ctx.arc(z.x, z.y, nubaRadius * (.38 + nubaArc * .13), nubaArcAngle, nubaArcAngle + Math.PI * .46); ctx.stroke();
          }
          if (z.lane) {
            ctx.strokeStyle = 'rgba(215,195,138,.24)'; ctx.lineWidth = 12;
            ctx.beginPath(); ctx.moveTo(54, z.y); ctx.lineTo(W - 54, z.y); ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'nubaPillar') {
        var pillarMax = Math.max(.01, z.maxLife || .5);
        var pillarProgress = clamp(1 - z.life / pillarMax, 0, 1);
        var pillarDelayProgress = z.fired ? 1 : clamp(1 - (z.delay || 0) / Math.max(.01, (z.delay || 0) + .22), 0, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = z.fired ? 'rgba(239,228,183,' + (.82 * (1 - pillarProgress * .45)) + ')' : 'rgba(215,195,138,' + (.58 + pillarDelayProgress * .24) + ')';
        ctx.shadowColor = '#d7c38a'; ctx.shadowBlur = z.fired ? 24 : 13;
        ctx.lineWidth = z.fired ? 6 : 3;
        ctx.setLineDash(z.fired ? [] : [8, 7]);
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 13, (z.r || 70) * (.62 + pillarDelayProgress * .38), (z.r || 70) * .20, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        if (z.fired) {
          var pillarHeight = (z.r || 70) * (1.15 + (1 - pillarProgress) * .38);
          for (var pillarRay = -2; pillarRay <= 2; pillarRay++) {
            ctx.globalAlpha *= .48;
            ctx.beginPath(); ctx.moveTo(z.x + pillarRay * 10, z.y + 4); ctx.lineTo(z.x + pillarRay * 5, z.y - pillarHeight); ctx.stroke();
          }
          ctx.globalAlpha *= .9;
          ctx.fillStyle = 'rgba(234,218,166,.38)';
          ctx.beginPath(); ctx.arc(z.x, z.y - pillarHeight * .70, Math.max(8, (z.r || 70) * .18), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'nubaResonance') {
        var resonanceProgress = clamp(1 - z.life / Math.max(.01, z.maxLife || .56), 0, 1);
        var resonanceAlpha = Math.sin(Math.PI * resonanceProgress) * .95;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(230,212,155,' + resonanceAlpha + ')';
        ctx.lineWidth = (z.hitWidth || 28) * .16 + 5;
        ctx.shadowColor = '#d7c38a'; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.quadraticCurveTo((z.x + z.tx) * .5, Math.min(z.y, z.ty) - 44, z.tx, z.ty); ctx.stroke();
        if (z.branchA) {
          ctx.strokeStyle = 'rgba(215,195,138,' + (resonanceAlpha * .72) + ')'; ctx.lineWidth = 4;
          var branchMidX = (z.x + z.tx) * .5, branchMidY = (z.y + z.ty) * .5;
          ctx.beginPath(); ctx.moveTo(branchMidX, branchMidY); ctx.lineTo(z.branchA.x, z.branchA.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(branchMidX, branchMidY); ctx.lineTo(z.branchB.x, z.branchB.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(246,235,188,' + (resonanceAlpha * .86) + ')';
        ctx.beginPath(); ctx.arc(z.tx, z.ty, 8 + resonanceProgress * 13, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'hitFlash') {
        var hitMax = Math.max(.01, z.maxLife || .22);
        var hitProgress = 1 - z.life / hitMax;
        var hitAlpha = clamp(z.life / hitMax, 0, 1);
        var hitColor = z.color || C.danger;
        ctx.globalAlpha = hitAlpha;
        ctx.globalCompositeOperation = 'lighter';
        var hitGlow = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r * (1.1 + hitProgress * .45));
        hitGlow.addColorStop(0, 'rgba(255,244,214,' + (.52 * hitAlpha) + ')');
        hitGlow.addColorStop(.36, hitColor === C.danger ? 'rgba(255,78,54,' + (.42 * hitAlpha) + ')' : 'rgba(130,236,255,' + (.34 * hitAlpha) + ')');
        hitGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hitGlow;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + hitProgress * .45), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = hitColor === C.danger ? 'rgba(255,118,82,' + (.86 * hitAlpha) + ')' : 'rgba(166,242,255,' + (.74 * hitAlpha) + ')';
        ctx.lineWidth = z.heavy ? 4 : 2.5;
        ctx.shadowColor = hitColor;
        ctx.shadowBlur = z.heavy ? 14 : 9;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.58 + hitProgress * .50), 0, Math.PI * 2); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'protagonistAimClick') {
        var aimClickProgress = clamp(1 - z.life / Math.max(.01, z.maxLife || .34), 0, 1);
        var aimClickAlpha = 1 - aimClickProgress;
        var aimClickRadius = z.r * (.38 + aimClickProgress * 1.08);
        ctx.globalCompositeOperation = 'lighter';
        var aimClickGlow = ctx.createRadialGradient(z.x, z.y, 1, z.x, z.y, aimClickRadius * 1.55);
        aimClickGlow.addColorStop(0, 'rgba(255,248,204,' + (.92 * aimClickAlpha) + ')');
        aimClickGlow.addColorStop(.28, 'rgba(144,245,255,' + (.68 * aimClickAlpha) + ')');
        aimClickGlow.addColorStop(1, 'rgba(72,178,218,0)');
        ctx.fillStyle = aimClickGlow;
        ctx.beginPath(); ctx.arc(z.x, z.y, aimClickRadius * 1.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(192,252,255,' + (.94 * aimClickAlpha) + ')';
        ctx.lineWidth = 3.5 - aimClickProgress * 1.5;
        ctx.shadowColor = '#8ff4ff'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(z.x, z.y, aimClickRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,235,167,' + (.86 * aimClickAlpha) + ')';
        ctx.lineWidth = 2;
        for (var aimRay = 0; aimRay < 4; aimRay++) {
          var aimAngle = aimRay * Math.PI / 2 + Math.PI / 4;
          var aimInner = aimClickRadius * .72, aimOuter = aimClickRadius * (1.22 - aimClickProgress * .12);
          ctx.beginPath();
          ctx.moveTo(z.x + Math.cos(aimAngle) * aimInner, z.y + Math.sin(aimAngle) * aimInner);
          ctx.lineTo(z.x + Math.cos(aimAngle) * aimOuter, z.y + Math.sin(aimAngle) * aimOuter);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'spiritLineUltimateRing') {
        var ultimateRingProgress = 1 - z.life / Math.max(.01, z.maxLife || .26);
        var outerRadius = z.r || 120;
        var innerRadius = z.innerR || Math.max(0, outerRadius - 13);
        var ringDirection = z.clockwise === false ? -1 : 1;
        var ringAngle = this.time * ringDirection * 8 + (z.step || 0) * .42;
        var ringAlpha = Math.sin(Math.PI * clamp(ultimateRingProgress, 0, 1));
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = z.color === C.gold
          ? 'rgba(255,223,110,' + (.90 * ringAlpha) + ')'
          : z.clockwise === false
            ? 'rgba(158,138,255,' + (.82 * ringAlpha) + ')'
            : 'rgba(246,231,192,' + (.90 * ringAlpha) + ')';
        ctx.lineWidth = z.innerR ? 7 : 9;
        ctx.shadowColor = z.color || '#f6e7c0';
        ctx.shadowBlur = z.innerR ? 20 : 26;
        for (var ringArc = 0; ringArc < 3; ringArc++) {
          var arcStart = ringAngle + ringArc * Math.PI * 2 / 3;
          ctx.beginPath();
          ctx.arc(z.x, z.y, outerRadius, arcStart, arcStart + Math.PI * .46);
          ctx.stroke();
          if (z.innerR) {
            ctx.globalAlpha *= .72;
            ctx.beginPath();
            ctx.arc(z.x, z.y, innerRadius, arcStart + .13, arcStart + Math.PI * .42);
            ctx.stroke();
            ctx.globalAlpha = alpha;
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'spiritLineUltimateSeal') {
        var sealPreviewProgress = clamp((z.age || 0) / Math.max(.01, z.maxLife || .18), 0, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,216,92,' + (.78 * (1 - sealPreviewProgress)) + ')';
        ctx.lineWidth = 4; ctx.shadowColor = C.gold; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.35 + sealPreviewProgress * .50), 0, Math.PI * 2); ctx.stroke();
        A.text(ctx, '封', z.x, z.y + 8, 32, '#ffe38a', 'center', '900');
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'deathSoulFire') {
        var soulProgress = 1 - z.life / Math.max(.01, z.maxLife || .72);
        var soulSoft = !!z.soft;
        var glowAlpha = soulSoft ? .42 : .78;
        var soulGlow = ctx.createRadialGradient(z.x, z.y, 3, z.x, z.y, z.r * (1.02 + soulProgress * .22));
        soulGlow.addColorStop(0, 'rgba(255,232,142,' + glowAlpha + ')');
        soulGlow.addColorStop(.34, 'rgba(100,222,235,' + (glowAlpha * .42) + ')');
        soulGlow.addColorStop(.72, 'rgba(255,130,48,' + (glowAlpha * .18) + ')');
        soulGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = soulGlow; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + soulProgress * .16), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,116,' + ((soulSoft ? .34 : .75) * (1 - soulProgress)) + ')';
        ctx.lineWidth = (soulSoft ? 2 : 3) + soulProgress * (soulSoft ? 3 : 6); ctx.shadowColor = z.color || C.gold; ctx.shadowBlur = soulSoft ? 10 : 18;
        ctx.beginPath(); ctx.ellipse(z.x, z.y + (soulSoft ? 12 : 18), z.r * (.82 + soulProgress * .22), z.r * (.14 + soulProgress * .05), 0, 0, Math.PI * 2); ctx.stroke();
        for (var soul = 0; soul < (soulSoft ? 4 : 7); soul++) {
          var a = soul * 1.2 + this.time * (soulSoft ? 1.5 : 2.1);
          var sx = z.x + Math.cos(a) * z.r * (.18 + soulProgress * (.26 + (soulSoft ? .08 : .26)));
          var sy = z.y - soulProgress * (soulSoft ? 34 : 56) + Math.sin(a * 1.3) * (soulSoft ? 8 : 14);
          ctx.fillStyle = soul % 2 ? 'rgba(129,236,255,' + (soulSoft ? .38 : .62) + ')' : 'rgba(255,210,106,' + (soulSoft ? .42 : .66) + ')';
          ctx.beginPath(); ctx.ellipse(sx, sy, (soulSoft ? 3.5 : 6) + soulProgress * (soulSoft ? 2.5 : 4), (soulSoft ? 8 : 14) + soulProgress * (soulSoft ? 5 : 10), a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'fire' || z.type === 'delayedFire' || z.type === 'hongyiSoulEcho' || z.type === 'soulFire' || z.type === 'soulBurst' || z.type === 'emberBurst' || z.type === 'lotusFusionBurst') {
        if (z.type === 'emberBurst') {
          var emberProgress = 1 - z.life / Math.max(.01, z.maxLife || .38);
          var emberFrame = clamp(Math.floor(emberProgress * 8), 0, 7);
          if (drawVfxFrame(ctx, this.assets.hongyiEmberBurstSheet, 8, 1, emberFrame, 0, z.x, z.y, z.r * 2.05, z.r * 2.05, 0, alpha)) {
            ctx.restore();
            continue;
          }
        }
        var hongyiLotusAssetDrawn = false;
        if (z.type === 'soulFire' && z.lotus) {
          var lotusImage = z.lotusPlatform
            ? this.assets.hongyiLotusPlatform
            : (z.lotusPetals ? this.assets.hongyiLotusFivePetal : this.assets.hongyiLotusFire);
          var lotusSize = z.r * (z.lotusPlatform ? 2.15 : (z.lotusPetals ? 2.08 : 2.0));
          hongyiLotusAssetDrawn = drawCenteredImage(ctx, lotusImage, z.x, z.y, lotusSize, lotusSize, z.lotusPlatform ? this.time * .08 : 0, alpha * .88, 'screen');
        }
        if (!hongyiLotusAssetDrawn) {
          var fire = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
          fire.addColorStop(0, z.lotus ? 'rgba(255,239,156,.90)' : 'rgba(255,221,112,.82)');
          fire.addColorStop(.5, z.lotus ? 'rgba(255,72,48,.56)' : 'rgba(245,91,35,.5)');
          fire.addColorStop(1, 'rgba(120,24,14,0)');
          ctx.fillStyle = fire; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        }
        if (z.type === 'delayedFire' && !z.fired) {
          var warning = clamp(z.life / Math.max(.01, z.maxLife || 1), 0, 1);
          ctx.strokeStyle = '#ffd67d'; ctx.lineWidth = 3 + (1 - warning) * 5;
          ctx.shadowColor = C.fire; ctx.shadowBlur = 12;
          ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + warning * .28), 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        if (z.type === 'lotusFusionBurst') {
          var fusionProgress = 1 - z.life / Math.max(.01, z.maxLife || .68);
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,226,116,' + (.92 * (1 - fusionProgress)) + ')';
          ctx.lineWidth = 10 - fusionProgress * 5;
          ctx.shadowColor = '#ff5a30';
          ctx.shadowBlur = 24;
          for (var fusionRay = 0; fusionRay < 6; fusionRay++) {
            var fusionAngle = fusionRay * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(
              z.x + Math.cos(fusionAngle) * z.r * .20,
              z.y + Math.sin(fusionAngle) * z.r * .20
            );
            ctx.lineTo(
              z.x + Math.cos(fusionAngle) * z.r * (.72 + fusionProgress * .25),
              z.y + Math.sin(fusionAngle) * z.r * (.72 + fusionProgress * .25)
            );
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        if (z.type === 'soulFire' && !hongyiLotusAssetDrawn) {
          ctx.strokeStyle = 'rgba(255,190,74,.8)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + .08 * Math.sin(this.time * 12)), 0, Math.PI * 2); ctx.stroke();
          if (z.lotusPetals) {
            var lotusProgress = 1 - z.life / Math.max(.01, z.maxLife || 3);
            ctx.strokeStyle = 'rgba(255,229,145,' + (.55 + .25 * Math.sin(this.time * 8)) + ')';
            ctx.lineWidth = z.lotusPlatform ? 4 : 2.5;
            ctx.shadowColor = '#ff5a30'; ctx.shadowBlur = 16;
            var petalOffsets = [0, -.56, .56, -1.08, 1.08];
            var lotusFacing = z.forwardAngle == null ? -Math.PI / 2 : z.forwardAngle;
            for (var lotusPetal = 0; lotusPetal < petalOffsets.length; lotusPetal++) {
              var lotusAngle = lotusFacing + petalOffsets[lotusPetal] + Math.sin(lotusProgress * Math.PI) * .10;
              ctx.save();
              ctx.translate(z.x, z.y);
              ctx.rotate(lotusAngle);
              ctx.beginPath();
              ctx.ellipse(
                z.r * (lotusPetal === 0 ? .48 : .36),
                0,
                z.r * (lotusPetal === 0 ? .34 : .27),
                z.r * (z.lotusPlatform ? .13 : .10),
                0, 0, Math.PI * 2
              );
              ctx.stroke();
              ctx.restore();
            }
            if (z.lotusPlatform) {
              ctx.strokeStyle = 'rgba(255,243,174,.86)';
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.62 + .04 * Math.sin(this.time * 10)), 0, Math.PI * 2); ctx.stroke();
            }
          }
        }
      } else if (z.type === 'lotusPetalPulse') {
        var petalPulseProgress = 1 - z.life / Math.max(.01, z.maxLife || .44);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,204,92,' + (.88 * (1 - petalPulseProgress)) + ')';
        ctx.lineWidth = Math.max(8, z.r * (1.35 - petalPulseProgress * .45));
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ff5a30';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.tx, z.ty);
        ctx.stroke();
        ctx.lineCap = 'butt';
      } else if (z.type === 'huangjinWallWave') {
        var wallWaveProgress = clamp((z.age || 0) / Math.max(.01, z.maxLife || .5), 0, 1);
        var wallWaveEase = 1 - Math.pow(1 - wallWaveProgress, 2);
        var wallWaveRange = z.range == null ? distance(z.x, z.y, z.tx, z.ty) : z.range;
        var wallWaveReach = Math.max(1, wallWaveRange * wallWaveEase);
        var wallWaveHalfAngle = z.halfAngle == null ? .70 : z.halfAngle;
        var wallWaveImage = z.form >= 3 ? this.assets.huangjinWallShockwaveFan : this.assets.huangjinWallShockwaveBasic;
        var wallWavePulse = clamp(wallWaveProgress / .12, 0, 1) * (1 - wallWaveProgress * .72);
        var wallWaveWidth = Math.max(24, 2 * wallWaveReach * Math.tan(wallWaveHalfAngle));
        var wallWaveHeight = Math.max(24, wallWaveReach);
        var wallWaveDrawn = false;
        if (wallWaveImage && (wallWaveImage.width || wallWaveImage.naturalWidth)) {
          ctx.save();
          ctx.translate(z.x, z.y);
          ctx.rotate((z.angle || -Math.PI / 2) + Math.PI / 2);
          ctx.globalAlpha *= .88 * wallWavePulse * (z.alpha == null ? 1 : z.alpha);
          ctx.globalCompositeOperation = z.side ? 'lighter' : 'screen';
          if (z.side) {
            ctx.shadowColor = '#ffd45f';
            ctx.shadowBlur = 16;
          }
          ctx.drawImage(wallWaveImage, -wallWaveWidth / 2, -wallWaveHeight, wallWaveWidth, wallWaveHeight);
          ctx.restore();
          wallWaveDrawn = true;
        }
        if (!wallWaveDrawn) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,216,92,' + (.86 * wallWavePulse) + ')';
          ctx.lineWidth = z.form >= 3 ? 15 : 9;
          ctx.shadowColor = C.gold; ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(z.x, z.y, wallWaveReach, (z.angle || -Math.PI / 2) - wallWaveHalfAngle, (z.angle || -Math.PI / 2) + wallWaveHalfAngle);
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (z.type === 'huangjinWallSeal') {
        var wallSealProgress = clamp((z.age || 0) / Math.max(.01, z.maxLife || .72), 0, 1);
        var wallSealPulse = Math.sin(Math.PI * wallSealProgress);
        var wallSealScale = .62 + wallSealProgress * .58;
        var wallSealDrawn = drawCenteredImage(
          ctx, this.assets.huangjinWallSuppressSeal, z.x, z.y,
          238 * wallSealScale, 305 * wallSealScale, 0,
          .92 * wallSealPulse, 'screen'
        );
        if (!wallSealDrawn) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,211,82,' + (.9 * wallSealPulse) + ')';
          ctx.lineWidth = 12; ctx.shadowColor = C.gold; ctx.shadowBlur = 22;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.5 + wallSealProgress * .5), 0, Math.PI * 2); ctx.stroke();
          A.text(ctx, '镇', z.x, z.y + 4, 72, '#ffd45f', 'center', '900');
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (z.type === 'huangjinCrack') {
        var crackProgress = clamp((z.age || 0) / Math.max(.01, z.maxLife || .5), 0, 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,217,92,' + (.72 * (1 - crackProgress)) + ')';
        ctx.lineWidth = 4;
        ctx.shadowColor = C.gold; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 10, z.r * (.85 + crackProgress * .18), z.r * (.20 + crackProgress * .06), 0, 0, Math.PI * 2); ctx.stroke();
        for (var hcrack = -2; hcrack <= 2; hcrack++) {
          var crackAngle = -Math.PI / 2 + hcrack * .42;
          ctx.beginPath();
          ctx.moveTo(z.x, z.y + 10);
          ctx.lineTo(z.x + Math.cos(crackAngle) * z.r * (.45 + crackProgress * .34), z.y + 10 + Math.sin(crackAngle) * z.r * (.18 + crackProgress * .20));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'huangjinHeart') {
        var heartProgress = clamp((z.age || 0) / Math.max(.01, z.maxLife || 1), 0, 1);
        var heartAlpha = .30 * (1 - heartProgress);
        ctx.globalCompositeOperation = 'lighter';
        var heartGlow = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
        heartGlow.addColorStop(0, 'rgba(255,232,130,' + (heartAlpha * 1.2) + ')');
        heartGlow.addColorStop(.55, 'rgba(196,132,42,' + heartAlpha + ')');
        heartGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = heartGlow; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,223,112,' + (.62 * (1 - heartProgress)) + ')';
        ctx.lineWidth = 3; ctx.shadowColor = C.gold; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.78 + heartProgress * .18), 0, Math.PI * 2); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'shieldBashImpact') {
        var bashProgress = 1 - z.life / Math.max(.01, z.maxLife || .42);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,227,135,' + (.9 * (1 - bashProgress)) + ')';
        ctx.lineWidth = 10 - bashProgress * 5; ctx.shadowColor = z.color || C.gold; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 24, z.r * (.55 + bashProgress * .55), z.r * (.18 + bashProgress * .08), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,248,210,' + (.82 * (1 - bashProgress)) + ')';
        ctx.lineWidth = 4;
        for (var crack = -2; crack <= 2; crack++) {
          var ca = (z.angle || -Math.PI / 2) + crack * .32;
          ctx.beginPath();
          ctx.moveTo(z.x, z.y + 18);
          ctx.lineTo(z.x + Math.cos(ca) * z.r * (.45 + bashProgress * .42), z.y + 18 + Math.sin(ca) * z.r * (.20 + bashProgress * .25));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'wispClawHit') {
        var clawProgress = 1 - z.life / Math.max(.01, z.maxLife || .26);
        var clawFrame = Math.min(3, Math.floor(clawProgress * 4));
        var clawSprite = this.assets.enemyWispAttackVfx;
        var clawDrawn = drawVfxFrame(
          ctx, clawSprite, 4, 1, clawFrame, 0,
          z.x, z.y - 14, z.r * 3.0, z.r * 3.0, z.angle || -Math.PI / 2, alpha
        );
        if (!clawDrawn) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.shadowColor = z.color || C.blue;
          ctx.shadowBlur = 18;
          ctx.fillStyle = 'rgba(106,220,255,' + (.26 * (1 - clawProgress)) + ')';
          ctx.beginPath(); ctx.ellipse(z.x, z.y + 8, z.r * (.36 + clawProgress * .34), z.r * (.18 + clawProgress * .16), 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(211,255,255,' + (.18 * (1 - clawProgress)) + ')';
          ctx.beginPath(); ctx.arc(z.x, z.y - 12, z.r * (.18 + clawProgress * .22), 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (z.type === 'xuanBladePath') {
        var bladePathProgress = 1 - z.life / Math.max(.01, z.maxLife || .66);
        bladePathProgress = clamp(bladePathProgress, 0, 1);
        var hasBladeReturn = z.returnEnabled !== false;
        var phaseCut = hasBladeReturn ? (z.pierce ? .42 : .24) : 1;
        var pathX, pathY, pathAngle, pathPrevX, pathPrevY;
        if (!hasBladeReturn || bladePathProgress <= phaseCut) {
          var outT = clamp(bladePathProgress / Math.max(.01, phaseCut), 0, 1);
          var easedOut = 1 - Math.pow(1 - outT, 2);
          var prevOut = clamp(outT - .08, 0, 1);
          var easedPrevOut = 1 - Math.pow(1 - prevOut, 2);
          pathX = z.x + (z.mx - z.x) * easedOut;
          pathY = z.y + (z.my - z.y) * easedOut;
          pathPrevX = z.x + (z.mx - z.x) * easedPrevOut;
          pathPrevY = z.y + (z.my - z.y) * easedPrevOut;
          pathAngle = Math.atan2(z.my - z.y, z.mx - z.x);
        } else {
          var backT = clamp((bladePathProgress - phaseCut) / Math.max(.01, 1 - phaseCut), 0, 1);
          var easedBack = backT * backT * (3 - 2 * backT);
          var prevBack = clamp(backT - .075, 0, 1);
          var easedPrevBack = prevBack * prevBack * (3 - 2 * prevBack);
          pathX = z.mx + (z.tx - z.mx) * easedBack;
          pathY = z.my + (z.ty - z.my) * easedBack;
          pathPrevX = z.mx + (z.tx - z.mx) * easedPrevBack;
          pathPrevY = z.my + (z.ty - z.my) * easedPrevBack;
          pathAngle = Math.atan2(z.ty - z.my, z.tx - z.mx);
        }
        var pathAlpha = Math.sin(Math.PI * bladePathProgress);
        var pathPulse = .80 + Math.sin(this.time * 20) * .12;
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = z.empowered ? '#f8e9a2' : '#0b0710';
        ctx.shadowBlur = z.empowered ? 20 : 15;
        ctx.strokeStyle = z.empowered ? 'rgba(255,232,160,' + (.58 * pathAlpha) + ')' : 'rgba(217,199,166,' + (.38 * pathAlpha) + ')';
        ctx.lineWidth = z.empowered ? 4.8 : 3.4;
        ctx.beginPath();
        ctx.moveTo(pathPrevX, pathPrevY);
        ctx.lineTo(pathX, pathY);
        ctx.stroke();
        ctx.save();
        ctx.translate(pathX, pathY);
        ctx.rotate(pathAngle);
        ctx.fillStyle = z.empowered ? 'rgba(255,237,174,' + (.92 * pathAlpha) + ')' : 'rgba(17,13,24,' + (.96 * pathAlpha) + ')';
        ctx.beginPath();
        ctx.moveTo((z.empowered ? 30 : 24) * pathPulse, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-22, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,221,132,' + (.88 * pathAlpha) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(22 * pathPulse, 0);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(36,28,48,' + (.86 * pathAlpha) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-6, 0, 13, -.9, .9);
        ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanPierceTrail') {
        var pierceProgress = 1 - z.life / Math.max(.01, z.maxLife || .24);
        pierceProgress = clamp(pierceProgress, 0, 1);
        var psx = z.x, psy = z.y, ptx = z.tx, pty = z.ty;
        var pdx = ptx - psx, pdy = pty - psy;
        var pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        var pnx = -pdy / pd, pny = pdx / pd;
        var headT = clamp(pierceProgress * 1.25, 0, 1);
        var tailT = clamp(headT - .42, 0, 1);
        var tailX = psx + pdx * tailT, tailY = psy + pdy * tailT;
        var headX = psx + pdx * headT, headY = psy + pdy * headT;
        var pierceAlpha = Math.sin(Math.PI * clamp(pierceProgress, 0, 1));
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = '#f6e7c0';
        ctx.shadowBlur = z.empowered ? 28 : 22;
        ctx.strokeStyle = 'rgba(8,6,14,' + (.55 * pierceAlpha) + ')';
        ctx.lineWidth = z.empowered ? 15 : 12;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,239,184,' + (.90 * pierceAlpha) + ')';
        ctx.lineWidth = z.empowered ? 6 : 4.6;
        ctx.beginPath();
        ctx.moveTo(tailX + pnx * 2, tailY + pny * 2);
        ctx.lineTo(headX + pnx * 2, headY + pny * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,248,214,' + (.84 * pierceAlpha) + ')';
        ctx.save();
        ctx.translate(headX, headY);
        ctx.rotate(Math.atan2(pdy, pdx));
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-10, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanBoomerang') {
        var boomProgress = 1 - z.life / Math.max(.01, z.maxLife || .56);
        boomProgress = clamp(boomProgress, 0, 1);
        var bx0 = z.x, by0 = z.y, bcx = z.cx, bcy = z.cy, bx1 = z.tx, by1 = z.ty;
        var q0x = bx0 + (bcx - bx0) * boomProgress;
        var q0y = by0 + (bcy - by0) * boomProgress;
        var q1x = bcx + (bx1 - bcx) * boomProgress;
        var q1y = bcy + (by1 - bcy) * boomProgress;
        var boomX = q0x + (q1x - q0x) * boomProgress;
        var boomY = q0y + (q1y - q0y) * boomProgress;
        var tangentX = q1x - q0x, tangentY = q1y - q0y;
        var boomAngle = Math.atan2(tangentY, tangentX);
        var boomAlpha = Math.sin(Math.PI * boomProgress);
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = z.empowered ? '#fff5c8' : '#f6e7c0';
        ctx.shadowBlur = z.empowered ? 32 : 26;
        ctx.strokeStyle = 'rgba(9,7,17,' + (.58 * boomAlpha) + ')';
        ctx.lineWidth = z.empowered ? 18 : 15;
        ctx.beginPath();
        ctx.moveTo(bx0, by0);
        ctx.quadraticCurveTo(bcx, bcy, boomX, boomY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,241,188,' + (.90 * boomAlpha) + ')';
        ctx.lineWidth = z.empowered ? 7 : 5.5;
        ctx.beginPath();
        ctx.moveTo(bx0, by0);
        ctx.quadraticCurveTo(bcx, bcy, boomX, boomY);
        ctx.stroke();
        ctx.save();
        ctx.translate(boomX, boomY);
        ctx.rotate(boomAngle + Math.sin(this.time * 24) * .18);
        ctx.fillStyle = z.empowered ? 'rgba(255,248,205,.96)' : 'rgba(255,235,164,.94)';
        ctx.strokeStyle = 'rgba(27,18,38,.88)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.quadraticCurveTo(6, -14, -18, -7);
        ctx.quadraticCurveTo(-8, 0, -18, 7);
        ctx.quadraticCurveTo(6, 14, 26, 0);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,225,.92)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 18, -.95, .95);
        ctx.stroke();
        ctx.restore();
        for (var boomFeather = 0; boomFeather < 5; boomFeather++) {
          var bt = Math.max(0, boomProgress - boomFeather * .055);
          var fq0x = bx0 + (bcx - bx0) * bt;
          var fq0y = by0 + (bcy - by0) * bt;
          var fq1x = bcx + (bx1 - bcx) * bt;
          var fq1y = bcy + (by1 - bcy) * bt;
          var featherX = fq0x + (fq1x - fq0x) * bt;
          var featherY = fq0y + (fq1y - fq0y) * bt;
          ctx.fillStyle = 'rgba(28,20,39,' + ((.42 - boomFeather * .055) * boomAlpha) + ')';
          ctx.beginPath();
          ctx.ellipse(featherX, featherY, 4, 11, boomAngle + boomFeather * .42, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanSlash') {
        var slashProgress = 1 - z.life / Math.max(.01, z.maxLife || .24);
        var sx = z.x, sy = z.y, tx = z.tx, ty = z.ty;
        var sdx = tx - sx, sdy = ty - sy;
        var sd = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
        var snx = -sdy / sd, sny = sdx / sd;
        var slashBright = z.bright || z.slashType === 'xuanyaChase' || z.slashType === 'xuanyaOverflow' || z.empowered;
        var isReturnSlash = z.slashType === 'xuanyaReturn';
        var slashWidth = isReturnSlash ? 8 : (slashBright ? 7 : z.slashType === 'xuanyaRicochet' ? 5 : 4);
        var slashAlpha = Math.sin(Math.PI * clamp(slashProgress, 0, 1));
        var curveOffset = isReturnSlash ? (z.curve || 76) : (z.slashType === 'xuanyaRicochet' ? 34 : 0);
        var cx = (sx + tx) / 2 + snx * curveOffset;
        var cy = (sy + ty) / 2 + sny * curveOffset - (isReturnSlash ? 24 : 0);
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = isReturnSlash ? '#fff1b8' : (slashBright ? '#f8e9a2' : '#0b0710');
        ctx.shadowBlur = isReturnSlash ? 30 : (slashBright ? 22 : 18);
        ctx.strokeStyle = 'rgba(8,6,14,' + (.72 * slashAlpha) + ')';
        ctx.lineWidth = slashWidth + 7;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (z.slashType === 'xuanyaRicochet' || isReturnSlash) ctx.quadraticCurveTo(cx, cy, tx, ty);
        else ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.strokeStyle = isReturnSlash ? 'rgba(255,247,203,' + (.96 * slashAlpha) + ')' : (slashBright ? 'rgba(255,239,184,' + (.92 * slashAlpha) + ')' : 'rgba(217,199,166,' + (.72 * slashAlpha) + ')');
        ctx.lineWidth = slashWidth;
        ctx.beginPath();
        ctx.moveTo(sx + snx * 3, sy + sny * 3);
        if (z.slashType === 'xuanyaRicochet' || isReturnSlash) ctx.quadraticCurveTo(cx + snx * 8, cy + sny * 8, tx + snx * 3, ty + sny * 3);
        else ctx.lineTo(tx + snx * 3, ty + sny * 3);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,248,217,' + (.56 * slashAlpha) + ')';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx - snx * 5, sy - sny * 5);
        if (z.slashType === 'xuanyaRicochet' || isReturnSlash) ctx.quadraticCurveTo(cx - snx * 6, cy - sny * 6, tx - snx * 5, ty - sny * 5);
        else ctx.lineTo(tx - snx * 5, ty - sny * 5);
        ctx.stroke();
        var featherCount = isReturnSlash ? 7 : (slashBright ? 5 : 3);
        ctx.fillStyle = isReturnSlash ? 'rgba(255,244,190,' + (.58 * slashAlpha) + ')' : (slashBright ? 'rgba(255,232,150,' + (.50 * slashAlpha) + ')' : 'rgba(24,18,34,' + (.62 * slashAlpha) + ')');
        for (var slashFeather = 0; slashFeather < featherCount; slashFeather++) {
          var ft = (slashFeather + .5) / featherCount;
          var arcLift = isReturnSlash ? Math.sin(Math.PI * ft) * curveOffset : 0;
          var fx = sx + sdx * ft + snx * ((slashFeather % 2 ? 10 : -8) + arcLift);
          var fy = sy + sdy * ft + sny * ((slashFeather % 2 ? 10 : -8) + arcLift) - (isReturnSlash ? Math.sin(Math.PI * ft) * 24 : 0);
          ctx.save();
          ctx.translate(fx, fy);
          ctx.rotate(Math.atan2(sdy, sdx) + .55);
          ctx.beginPath();
          ctx.ellipse(0, 0, slashBright ? 4 : 3, slashBright ? 13 : 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanCast') {
        var castProgress = 1 - z.life / Math.max(.01, z.maxLife || .24);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(217,199,166,' + (.78 * (1 - castProgress * .35)) + ')';
        ctx.lineWidth = 2.5 + castProgress * 3;
        ctx.shadowColor = '#0b0710'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * (1 + castProgress * .36), z.r * (.45 + castProgress * .18), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(18,13,25,' + (.34 * (1 - castProgress)) + ')';
        for (var castFeather = 0; castFeather < 5; castFeather++) {
          var castAngle = castFeather * Math.PI * .4 + this.time * 2.8;
          ctx.beginPath();
          ctx.ellipse(z.x + Math.cos(castAngle) * z.r * .55, z.y + Math.sin(castAngle) * z.r * .25, 3, 10, castAngle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanImpact') {
        var xuanImpactProgress = 1 - z.life / Math.max(.01, z.maxLife || .32);
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(z.x, z.y);
        ctx.rotate((z.angle || 0) + Math.PI * .22);
        ctx.shadowColor = '#f7e3a4'; ctx.shadowBlur = 18;
        for (var slash = -1; slash <= 1; slash++) {
          ctx.strokeStyle = slash === 0 ? 'rgba(255,239,190,.92)' : 'rgba(32,25,44,.82)';
          ctx.lineWidth = slash === 0 ? 4 : 7;
          ctx.beginPath();
          ctx.moveTo(-z.r * (.72 + slash * .08), slash * 10);
          ctx.lineTo(z.r * (.78 - slash * .05), slash * -7);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(217,199,166,' + (.46 * (1 - xuanImpactProgress)) + ')';
        for (var feather = 0; feather < 4; feather++) {
          var fa = feather * 1.7 + this.time * 4;
          ctx.beginPath();
          ctx.ellipse(Math.cos(fa) * z.r * .34, Math.sin(fa) * z.r * .18, 4, 11, fa, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanMark') {
        var markProgress = 1 - z.life / Math.max(.01, z.maxLife || .44);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,224,150,' + (.85 * (1 - markProgress * .35)) + ')';
        ctx.lineWidth = 3; ctx.shadowColor = '#d9c7a6'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + markProgress * .28), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(18,13,25,' + (.64 * (1 - markProgress * .2)) + ')';
        ctx.beginPath();
        ctx.moveTo(z.x + z.r * .42, z.y);
        ctx.lineTo(z.x - z.r * .12, z.y - z.r * .26);
        ctx.lineTo(z.x - z.r * .46, z.y);
        ctx.lineTo(z.x - z.r * .12, z.y + z.r * .26);
        ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'qingyiMark') {
        var qingyiMarkProgress = 1 - z.life / Math.max(.01, z.maxLife || .44);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(158,248,255,' + (.88 * (1 - qingyiMarkProgress * .42)) + ')';
        ctx.lineWidth = 3; ctx.shadowColor = '#9ef8ff'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + qingyiMarkProgress * .32), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(229,255,255,' + (.36 * (1 - qingyiMarkProgress * .2)) + ')';
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * .14, z.r * .40, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'xuanLink') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(217,199,166,.66)';
        ctx.lineWidth = 4; ctx.shadowColor = '#0e0a15'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.tx, z.ty); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,238,176,.42)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(z.x, z.y - 5); ctx.lineTo(z.tx, z.ty - 5); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'holyHit') {
        var holyProgress = 1 - z.life / Math.max(.01, z.maxLife || .38);
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(z.x, z.y);
        ctx.rotate(z.angle || 0);
        var holyHitGlow = ctx.createRadialGradient(0, 0, 3, 0, 0, z.r * (1 + holyProgress * .45));
        holyHitGlow.addColorStop(0, 'rgba(255,255,232,.88)');
        holyHitGlow.addColorStop(.42, 'rgba(247,230,163,.42)');
        holyHitGlow.addColorStop(1, 'rgba(247,230,163,0)');
        ctx.fillStyle = holyHitGlow;
        ctx.beginPath(); ctx.arc(0, 0, z.r * (1 + holyProgress * .18), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,250,220,' + (.84 * (1 - holyProgress)) + ')';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#f7e6a3'; ctx.shadowBlur = 20;
        for (var holyRay = -2; holyRay <= 2; holyRay++) {
          ctx.beginPath();
          ctx.moveTo(-z.r * .36, holyRay * 7);
          ctx.lineTo(z.r * (.58 + holyProgress * .24), holyRay * -5);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'holyLink' || z.type === 'qingyiLink' || z.type === 'burnSpreadLink') {
        var holyLinkProgress = 1 - z.life / Math.max(.01, z.maxLife || .34);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = z.type === 'burnSpreadLink'
          ? 'rgba(255,112,48,' + (.76 * (1 - holyLinkProgress * .2)) + ')'
          : z.type === 'qingyiLink'
            ? 'rgba(158,248,255,' + (.62 * (1 - holyLinkProgress * .2)) + ')'
            : 'rgba(255,246,194,' + (.62 * (1 - holyLinkProgress * .2)) + ')';
        ctx.lineWidth = z.type === 'burnSpreadLink' ? 5 : 4;
        ctx.shadowColor = z.type === 'burnSpreadLink' ? '#ff5a30' : z.type === 'qingyiLink' ? '#9ef8ff' : '#f7e6a3';
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.quadraticCurveTo((z.x + z.tx) / 2, Math.min(z.y, z.ty) - 52, z.tx, z.ty); ctx.stroke();
        ctx.strokeStyle = z.type === 'burnSpreadLink'
          ? 'rgba(255,210,96,' + (.46 * (1 - holyLinkProgress)) + ')'
          : 'rgba(130,239,255,' + (.42 * (1 - holyLinkProgress)) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(z.x, z.y + 5); ctx.quadraticCurveTo((z.x + z.tx) / 2 + 18, Math.min(z.y, z.ty) - 42, z.tx, z.ty + 2); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'qingyiBurst') {
        var qingyiBurstProgress = 1 - z.life / Math.max(.01, z.maxLife || .38);
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(z.x, z.y);
        ctx.shadowColor = '#9ef8ff'; ctx.shadowBlur = 22;
        ctx.strokeStyle = 'rgba(158,248,255,' + (.9 * (1 - qingyiBurstProgress)) + ')';
        ctx.lineWidth = 5 + qingyiBurstProgress * 5;
        ctx.beginPath(); ctx.arc(0, 0, z.r * (.55 + qingyiBurstProgress * .52), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(231,255,255,' + (.20 * (1 - qingyiBurstProgress)) + ')';
        ctx.beginPath(); ctx.arc(0, 0, z.r * (.28 + qingyiBurstProgress * .30), 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'holyShield') {
        var shieldProgress = 1 - z.life / Math.max(.01, z.maxLife || .62);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(158,239,255,' + (.82 * (1 - shieldProgress * .55)) + ')';
        ctx.lineWidth = 4 + shieldProgress * 5; ctx.shadowColor = '#9eefff'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * (1 + shieldProgress * .34), z.r * .22, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,246,194,' + (.54 * (1 - shieldProgress)) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(z.x, z.y - 8, z.r * (.28 + shieldProgress * .18), Math.PI * .15, Math.PI * .85); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'starImpact') {
        var starProgress = 1 - z.life / Math.max(.01, z.maxLife || .34);
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(z.x, z.y);
        ctx.rotate(z.angle || 0);
        ctx.shadowColor = '#47d8b1'; ctx.shadowBlur = 18;
        ctx.strokeStyle = 'rgba(139,248,255,' + (.88 * (1 - starProgress)) + ')';
        ctx.lineWidth = 3;
        for (var starRay = 0; starRay < 6; starRay++) {
          var rayAngle = starRay * Math.PI / 3 + starProgress * .8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rayAngle) * z.r * .15, Math.sin(rayAngle) * z.r * .15);
          ctx.lineTo(Math.cos(rayAngle) * z.r * (.72 + starProgress * .25), Math.sin(rayAngle) * z.r * (.72 + starProgress * .25));
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(216,255,243,' + (.58 * (1 - starProgress)) + ')';
        ctx.beginPath(); ctx.arc(0, 0, z.r * (.26 + starProgress * .18), 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'starMark') {
        var starMarkProgress = 1 - z.life / Math.max(.01, z.maxLife || .44);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(135,247,255,' + (.82 * (1 - starMarkProgress * .38)) + ')';
        ctx.lineWidth = 2.5; ctx.shadowColor = '#47d8b1'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.68 + starMarkProgress * .28), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(216,255,243,' + (.7 * (1 - starMarkProgress * .2)) + ')';
        ctx.beginPath();
        ctx.moveTo(z.x, z.y - z.r * .58);
        ctx.lineTo(z.x + z.r * .14, z.y - z.r * .12);
        ctx.lineTo(z.x + z.r * .58, z.y);
        ctx.lineTo(z.x + z.r * .14, z.y + z.r * .12);
        ctx.lineTo(z.x, z.y + z.r * .58);
        ctx.lineTo(z.x - z.r * .14, z.y + z.r * .12);
        ctx.lineTo(z.x - z.r * .58, z.y);
        ctx.lineTo(z.x - z.r * .14, z.y - z.r * .12);
        ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'starLink') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(132,242,255,.68)';
        ctx.lineWidth = 3; ctx.shadowColor = z.color || '#47d8b1'; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.tx, z.ty); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,238,.5)'; ctx.lineWidth = 1.2;
        ctx.setLineDash([7, 8]);
        ctx.beginPath(); ctx.moveTo(z.x, z.y - 4); ctx.lineTo(z.tx, z.ty - 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'starBurst') {
        var burstProgress = 1 - z.life / Math.max(.01, z.maxLife || .46);
        ctx.globalCompositeOperation = 'lighter';
        var starBurstGlow = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.r * (1 + burstProgress * .25));
        starBurstGlow.addColorStop(0, 'rgba(216,255,243,.78)');
        starBurstGlow.addColorStop(.34, 'rgba(71,216,177,.42)');
        starBurstGlow.addColorStop(1, 'rgba(71,216,177,0)');
        ctx.fillStyle = starBurstGlow;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + burstProgress * .16), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(139,248,255,' + (.76 * (1 - burstProgress)) + ')';
        ctx.lineWidth = 4; ctx.shadowColor = '#47d8b1'; ctx.shadowBlur = 22;
        for (var burstRay = 0; burstRay < 12; burstRay++) {
          var ba = burstRay * Math.PI / 6 + burstProgress * 1.2;
          ctx.beginPath();
          ctx.moveTo(z.x + Math.cos(ba) * z.r * .18, z.y + Math.sin(ba) * z.r * .18);
          ctx.lineTo(z.x + Math.cos(ba) * z.r * (.82 + burstProgress * .32), z.y + Math.sin(ba) * z.r * (.82 + burstProgress * .32));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'shieldQuake' || z.type === 'targetMark') {
        var zoneProgress = 1 - z.life / Math.max(.01, z.maxLife || .5);
        ctx.strokeStyle = z.color || C.gold; ctx.shadowColor = z.color || C.gold; ctx.shadowBlur = 16;
        ctx.lineWidth = z.type === 'shieldQuake' ? 8 : 4;
        ctx.setLineDash(z.type === 'targetMark' ? [8, 6] : []);
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.55 + zoneProgress * .55), 0, Math.PI * 2); ctx.stroke();
        if (z.type === 'targetMark') {
          ctx.beginPath(); ctx.moveTo(z.x - z.r, z.y); ctx.lineTo(z.x + z.r, z.y);
          ctx.moveTo(z.x, z.y - z.r); ctx.lineTo(z.x, z.y + z.r); ctx.stroke();
        }
        ctx.setLineDash([]);
      } else if (z.type === 'protagonistWind') {
        var windProgress = 1 - z.life / Math.max(.01, z.maxLife || .62);
        var windEase = 1 - Math.pow(1 - clamp(windProgress, 0, 1), 2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.shadowColor = z.color || '#b8f4ff';
        ctx.shadowBlur = 20;
        for (var windLine = -1; windLine <= 1; windLine++) {
          var offset = windLine * 96;
          var sweepY = z.y + (z.ty - z.y) * windEase + windLine * 8;
          var alphaWind = Math.sin(Math.PI * clamp(windProgress, 0, 1)) * (windLine === 0 ? .82 : .54);
          ctx.strokeStyle = 'rgba(184,244,255,' + alphaWind + ')';
          ctx.lineWidth = windLine === 0 ? 16 : 10;
          ctx.beginPath();
          ctx.moveTo(60 + offset * .18, sweepY + 44);
          ctx.bezierCurveTo(210 + offset, sweepY - 12, 535 - offset, sweepY + 28, 700 - offset * .16, sweepY - 34);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,245,' + (alphaWind * .46) + ')';
          ctx.lineWidth = windLine === 0 ? 4 : 3;
          ctx.beginPath();
          ctx.moveTo(90 + offset * .12, sweepY + 26);
          ctx.bezierCurveTo(250 + offset, sweepY - 36, 520 - offset, sweepY + 6, 665 - offset * .12, sweepY - 48);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'protagonistRain') {
        var rainProgress = 1 - z.life / Math.max(.01, z.maxLife || 6);
        var rainAlpha = Math.min(.62, .22 + z.life / Math.max(.01, z.maxLife || 6) * .28);
        ctx.globalCompositeOperation = 'screen';
        var rainTint = ctx.createLinearGradient(0, 90, 0, BOARD_H);
        rainTint.addColorStop(0, 'rgba(70,172,255,' + (.04 * rainAlpha) + ')');
        rainTint.addColorStop(.55, 'rgba(98,202,255,' + (.10 * rainAlpha) + ')');
        rainTint.addColorStop(1, 'rgba(20,84,120,0)');
        ctx.fillStyle = rainTint;
        ctx.fillRect(0, 90, W, BOARD_H - 90);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(174,239,255,' + (.48 * rainAlpha) + ')';
        ctx.lineWidth = 2;
        ctx.shadowColor = z.color || '#8fdfff';
        ctx.shadowBlur = 8;
        for (var drop = 0; drop < 42; drop++) {
          var rx = (drop * 67 + (this.time * 92) % 820) % 820 - 35;
          var ry = 96 + ((drop * 83 + this.time * 360) % 780);
          ctx.beginPath();
          ctx.moveTo(rx - 8, ry - 18);
          ctx.lineTo(rx + 6, ry + 22);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(143,223,255,' + (.42 * rainAlpha) + ')';
        ctx.lineWidth = 2.5;
        for (var ripple = 0; ripple < 6; ripple++) {
          var rp = (rainProgress * 1.8 + ripple * .17) % 1;
          var rr = 34 + rp * 120;
          var ra = (1 - rp) * .32 * rainAlpha;
          ctx.strokeStyle = 'rgba(143,223,255,' + ra + ')';
          ctx.beginPath();
          ctx.ellipse(80 + ripple * 118, 690 + Math.sin(ripple * 1.7) * 70, rr, rr * .22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'fireRain') {
        var pulse = 1 - z.life / Math.max(.01, z.maxLife || .75);
        var rain = ctx.createRadialGradient(z.x, z.y, 80, z.x, z.y, z.r);
        rain.addColorStop(0, 'rgba(255,227,128,.40)');
        rain.addColorStop(.42, 'rgba(246,92,34,.30)');
        rain.addColorStop(1, 'rgba(94,18,10,0)');
        ctx.fillStyle = rain; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,194,85,.70)';
        ctx.lineWidth = 5; ctx.shadowColor = C.fire; ctx.shadowBlur = 18;
        for (var ray = 0; ray < 18; ray++) {
          var rx = 55 + ((ray * 73 + pulse * 260) % 640);
          var ry = 95 + ((ray * 41 + pulse * 180) % 700);
          ctx.beginPath(); ctx.moveTo(rx - 22, ry - 58); ctx.lineTo(rx + 18, ry + 48); ctx.stroke();
        }
      } else if (z.type === 'orbImpact') {
        var impactScale = 1 + (z.age || 0) / Math.max(.01, z.maxLife || .34) * .65;
        if (z.hongyi) {
          var hongyiImpactProgress = 1 - z.life / Math.max(.01, z.maxLife || .28);
          var hongyiImpactFrame = clamp(Math.floor(hongyiImpactProgress * 6), 0, 5);
          if (drawVfxFrame(
            ctx, this.assets.hongyiFireHitSheet, 6, 1, hongyiImpactFrame, 0,
            z.x, z.y, z.r * 1.45 * impactScale, z.r * 1.45 * impactScale, 0, alpha
          )) {
            ctx.restore();
            continue;
          }
        }
        drawVfxFrame(
          ctx, this.assets.rangedOrbsVfx, 4, 3, 3, z.vfxRow || 0,
          z.x, z.y, z.r * 2 * impactScale, z.r * 2 * impactScale, 0, alpha
        );
      } else if (z.type === 'meleeSlash') {
        var slashFrame = Math.min(3, Math.floor((z.age || 0) / Math.max(.01, (z.maxLife || .36) / 4)));
        var slashSprite = z.heroType === 'huangjin' ? this.assets.heroAttackHuangjinBash : this.assets.meleeSlashesVfx;
        var slashDrawn = z.heroType === 'huangjin'
          ? drawVfxFrame(ctx, slashSprite, 4, 1, slashFrame, 0, z.x, z.y - 8, z.r * 1.55, z.r * 1.55, z.angle || 0, alpha)
          : drawVfxFrame(
            ctx, slashSprite, 4, 2, slashFrame, z.vfxRow || 0,
            z.x, z.y, z.r * 2.2, z.r * 2.2, z.angle + Math.PI / 4, alpha
          );
        if (!slashDrawn && z.heroType === 'huangjin') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.shadowColor = z.color || C.gold; ctx.shadowBlur = 18;
          ctx.fillStyle = 'rgba(255,214,94,' + (.24 * alpha) + ')';
          ctx.beginPath(); ctx.ellipse(z.x, z.y + 20, z.r * .72, z.r * .20, 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        } else if (!slashDrawn) {
          ctx.strokeStyle = z.color || C.paper; ctx.lineWidth = 8; ctx.shadowColor = z.color || C.paper; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r, z.angle - .72, z.angle + .72); ctx.stroke();
          ctx.strokeStyle = '#fff5d2'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 3, z.angle - .58, z.angle + .58); ctx.stroke();
        }
      } else if (z.type === 'charge') {
        drawVfxFrame(
          ctx, this.assets.rangedOrbsVfx, 4, 3, 0, z.vfxRow || 0,
          z.x, z.y, z.r * 4, z.r * 4, 0, alpha
        );
        ctx.strokeStyle = z.color || C.jade; ctx.lineWidth = 5; ctx.shadowColor = z.color || C.jade; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r + (1 - alpha) * 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = z.color || C.jade; ctx.beginPath(); ctx.arc(z.x, z.y, 5 + alpha * 4, 0, Math.PI * 2); ctx.fill();
      } else if (z.type === 'qingyiLampWarn' || z.type === 'qingyiResidualLamp') {
        var lampProgress = 1 - z.life / Math.max(.01, z.maxLife || 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = z.type === 'qingyiResidualLamp'
          ? 'rgba(158,248,255,' + (.72 * (1 - lampProgress * .35)) + ')'
          : 'rgba(247,230,163,' + (.62 * (1 - lampProgress * .2)) + ')';
        ctx.lineWidth = z.type === 'qingyiResidualLamp' ? 4 : 3;
        ctx.shadowColor = '#9ef8ff'; ctx.shadowBlur = 14;
        ctx.setLineDash(z.type === 'qingyiLampWarn' ? [8, 6] : []);
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.88 + lampProgress * .12), 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        if (z.type === 'qingyiResidualLamp') {
          ctx.fillStyle = 'rgba(99,232,255,' + (.12 * (1 - lampProgress * .45)) + ')';
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (z.type === 'ring' || z.type === 'respawn' || z.type === 'guard' || z.type === 'heal') {
        ctx.strokeStyle = z.color || C.gold; ctx.lineWidth = z.type === 'heal' ? 12 : 7; ctx.shadowColor = z.color || C.gold; ctx.shadowBlur = 14;
        var radius = z.r + (1 - alpha) * 55;
        ctx.beginPath(); ctx.arc(z.x, z.y, radius, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeStyle = z.color || C.blue; ctx.lineWidth = z.type === 'wave' ? 18 : 9; ctx.shadowColor = z.color || C.blue; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.tx, z.ty); ctx.stroke();
      }
      ctx.restore();
    }
  };

  Game.prototype.drawEffects = function (ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (p.kind === 'soulFire') {
        var soulAlpha = clamp(p.life / p.max, 0, 1);
        if (p.soft) soulAlpha *= .78;
        ctx.save();
        ctx.globalAlpha = soulAlpha;
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin((p.max - p.life) * 9 + i) * .22);
        ctx.shadowColor = p.color || C.gold; ctx.shadowBlur = p.soft ? 10 : 16;
        var flame = ctx.createRadialGradient(0, -p.size * .55, 1, 0, 0, p.size * 1.55);
        flame.addColorStop(0, p.soft ? 'rgba(255,248,192,.72)' : 'rgba(255,248,192,.95)');
        flame.addColorStop(.36, p.soft ? 'rgba(255,176,64,.48)' : 'rgba(255,176,64,.74)');
        flame.addColorStop(.68, p.soft ? 'rgba(83,218,238,.22)' : 'rgba(83,218,238,.38)');
        flame.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flame;
        ctx.beginPath(); ctx.ellipse(0, 0, p.size * (p.soft ? .58 : .72), p.size * 1.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        continue;
      }
      if (p.kind === 'hongyiTrail') {
        var trailAlpha = clamp(p.life / p.max, 0, 1);
        var trailProgress = 1 - trailAlpha;
        ctx.save();
        ctx.globalAlpha = trailAlpha * .78;
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.shadowColor = p.color || C.fire;
        ctx.shadowBlur = 12 + p.size * .5;
        var trailGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.size * 1.45);
        trailGrad.addColorStop(0, 'rgba(255,247,178,.84)');
        trailGrad.addColorStop(.34, 'rgba(255,139,54,.56)');
        trailGrad.addColorStop(.72, 'rgba(255,54,30,.22)');
        trailGrad.addColorStop(1, 'rgba(255,38,18,0)');
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.ellipse(
          0, 0,
          p.size * (p.stretch || 1.6) * (1 + trailProgress * .18),
          p.size * .56 * (1 - trailProgress * .28),
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
        continue;
      }
      if (p.kind === 'hongyiSpark' || p.kind === 'hongyiHitSpark') {
        var sparkAlpha = clamp(p.life / p.max, 0, 1);
        ctx.save();
        ctx.globalAlpha = sparkAlpha;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.color || C.fire;
        ctx.fillStyle = p.color || C.fire;
        ctx.shadowColor = p.color || C.fire;
        ctx.shadowBlur = p.kind === 'hongyiHitSpark' ? 10 : 7;
        ctx.lineWidth = Math.max(1.2, p.size * .58);
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * .018, p.y - p.vy * .018);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (.75 + sparkAlpha * .35), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var j = 0; j < this.floaters.length; j++) {
      var f = this.floaters[j]; ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
      var floatProgress = 1 - f.life / f.max;
      var floatScale = f.impact ? 1 + .3 * Math.sin(Math.min(1, floatProgress * 3.2) * Math.PI) : 1;
      ctx.save(); ctx.translate(f.x, f.y); ctx.scale(floatScale, floatScale);
      A.text(ctx, f.value, 0, 0, f.size, f.color, 'center', f.bold ? '900' : '700');
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  Game.prototype.drawWaveBanner = function (ctx) {
    var alpha = clamp(this.waveBanner * 1.3, 0, 1), boss = this.wave >= this.waveMax;
    ctx.save(); ctx.globalAlpha = alpha;
    A.panel(ctx, 155, 210, 440, 96, .84);
    A.text(ctx, boss ? (this.wave === 20 ? '终 局 · 纸 扎 迎 亲' : '中 段 · 凶 煞 现 形') : '诡 潮 · 第 ' + this.wave + ' 波', W / 2, 247, 32, boss ? '#ff9d65' : C.paper);
    A.text(ctx, boss ? '首领来袭' : '观察来路 · 提前安排魂位', W / 2, 279, 19, C.jade);
    ctx.restore();
  };

  Game.prototype.drawSideRail = function (ctx) {
    this.drawMonsterButton(ctx);
    var buttons = [
      { y: 128, title: this.paused ? '继续' : '暂停', sub: formatClock(this.gameTime), type: 'pause' },
      { y: 214, title: '数据', sub: '', type: 'data' },
      { y: 300, title: '倍速', sub: this.speedUnlocked() ? 'X' + (clamp(this.speed || 1, 1, 2) | 0) : '待解锁', type: 'speed' },
      { y: TALISMAN_BUTTON.y, title: WALL_MODE ? '强化' : '符箓', sub: '', type: 'talisman' }
    ];
    for (var i = 0; i < buttons.length; i++) this.drawSideButton(ctx, 684, buttons[i].y, 54, 66, buttons[i]);
  };

  Game.prototype.drawHuangjinPreviewControls = function (ctx) {
    var r = HUANGJIN_PREVIEW_UI;
    ctx.save();
    A.rr(ctx, r.x, r.y, r.w, r.h, 14, 'rgba(7,14,18,.88)', 'rgba(219,168,76,.68)', 2);
    var segmentWidth = r.w / HUANGJIN_PREVIEW_MODES.length;
    for (var i = 0; i < HUANGJIN_PREVIEW_MODES.length; i++) {
      var mode = HUANGJIN_PREVIEW_MODES[i];
      var selected = this.huangjinPreviewMode === mode.id;
      var segmentX = r.x + i * segmentWidth;
      if (selected) A.rr(ctx, segmentX + 3, r.y + 4, segmentWidth - 6, r.h - 8, 10, 'rgba(190,126,42,.86)', '#ffe19a', 2);
      if (i > 0) {
        ctx.strokeStyle = 'rgba(219,168,76,.36)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(segmentX, r.y + 8); ctx.lineTo(segmentX, r.y + r.h - 8); ctx.stroke();
      }
      A.text(ctx, mode.label, segmentX + segmentWidth / 2, r.y + r.h / 2 + 1, 16, selected ? '#fff6d5' : '#b7c4bc', 'center', selected ? '900' : '700');
    }
    A.text(ctx, '\u9ec4\u5dfe\u666e\u653b\u6837\u677f \u00b7 \u5355\u9879\u4e09\u661f\u9884\u89c8', r.x + r.w / 2, r.y - 12, 15, '#f0cd78');
    ctx.restore();
  };

  Game.prototype.drawMonsterButton = function (ctx) {
    ctx.save();
    A.rr(ctx, 22, 132, 64, 70, 15, 'rgba(9,18,25,.78)', 'rgba(219,168,76,.58)', 3);
    this.drawHudControlIcon(ctx, 0, 54, 160, 50);
    ctx.restore();
    A.text(ctx, '怪物', 54, 190, 14, C.paper);
  };

  Game.prototype.drawHudControlIcon = function (ctx, index, x, y, size) {
    if (this.assets.hudControlIcons && (this.assets.hudControlIcons.width || this.assets.hudControlIcons.naturalWidth)) {
      var img = this.assets.hudControlIcons;
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      var sw = iw / 5, crop = Math.min(sw, ih);
      var sx = index * sw + (sw - crop) / 2, sy = (ih - crop) / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, sx, sy, crop, crop, x - size / 2, y - size / 2, size, size);
      ctx.restore();
      return true;
    }
    return false;
  };

  Game.prototype.drawSideButton = function (ctx, x, y, w, h, cfg) {
    var active = cfg.type !== 'pause' || !this.paused;
    ctx.save();
    A.rr(ctx, x, y, w, h, 14, 'rgba(10,18,25,.82)', active ? 'rgba(219,168,76,.62)' : 'rgba(88,96,98,.62)', 3);
    if (cfg.type === 'pause') {
      if (!this.drawHudControlIcon(ctx, 1, x + w / 2, y + 24, 42)) {
        ctx.fillStyle = C.paper;
        ctx.fillRect(x + 17, y + 13, 6, 18); ctx.fillRect(x + 31, y + 13, 6, 18);
      }
      A.text(ctx, cfg.sub, x + w / 2, y + 48, 12, '#ff8b76');
    } else if (cfg.type === 'data') {
      if (!this.drawHudControlIcon(ctx, 2, x + w / 2, y + 25, 42)) {
        var bx = x + 14, by = y + 39;
        ctx.fillStyle = C.jade;
        ctx.fillRect(bx, by - 14, 6, 14); ctx.fillRect(bx + 11, by - 25, 6, 25); ctx.fillRect(bx + 22, by - 19, 6, 19);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx - 2, by + 2); ctx.lineTo(bx + 33, by + 2); ctx.stroke();
      }
      A.text(ctx, cfg.title, x + w / 2, y + 54, 13, C.paper);
    } else if (cfg.type === 'talisman') {
      var talisman = this.assets.talismanControl;
      if (talisman && (talisman.width || talisman.naturalWidth)) {
        ctx.drawImage(talisman, x + 6, y + 2, 42, 42);
      } else {
        ctx.beginPath(); ctx.arc(x + w / 2, y + 24, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#15242a'; ctx.fill(); ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke();
        this.drawUpgradeText(ctx, '符', x + w / 2, y + 25, 18, C.gold, 'center', '900');
      }
      A.text(ctx, cfg.title, x + w / 2, y + 54, 13, C.paper);
    } else {
      this.drawSpeedButtonFace(ctx, x, y, w, h);
      A.text(ctx, cfg.title, x + w / 2, y + 52, 13, C.paper);
    }
    ctx.restore();
  };

  Game.prototype.drawSpeedButtonFace = function (ctx, x, y, w, h) {
    var speed = clamp(this.speed || 1, 1, 2) | 0;
    var cx = x + w / 2, cy = y + 25;
    var xGlyph = this.assets.hudSpeedGlyphX;
    var nGlyph = this.assets['hudSpeedGlyph' + speed];
    var drewBase = this.drawSpeedBaseIcon(ctx, cx, cy, 42);
    if (!drewBase) {
      ctx.save();
      ctx.shadowColor = '#dba84c'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8,17,23,.86)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,218,127,.84)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }

    if (xGlyph && nGlyph && (xGlyph.width || xGlyph.naturalWidth) && (nGlyph.width || nGlyph.naturalWidth)) {
      this.drawSpeedGlyph(ctx, xGlyph, cx - 8, cy + 17, 18, 22);
      this.drawSpeedGlyph(ctx, nGlyph, cx + 10, cy + 17, 22, 19);
    } else {
      A.text(ctx, 'X' + speed, cx, cy + 16, 17, '#ffe6a3', 'center', '900');
    }
  };

  Game.prototype.drawSpeedBaseIcon = function (ctx, x, y, size) {
    var img = this.assets.hudSpeedBase;
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var crop = Math.min(iw, ih);
    var sx = (iw - crop) / 2, sy = (ih - crop) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, sx, sy, crop, crop, x - size / 2, y - size / 2, size, size);
    ctx.restore();
    return true;
  };

  Game.prototype.drawSpeedGlyph = function (ctx, img, x, y, maxH, maxW) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var scale = Math.min(maxW / iw, maxH / ih);
    var dw = iw * scale, dh = ih * scale;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'rgba(255,214,102,.75)';
    ctx.shadowBlur = 5;
    ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    ctx.restore();
    return true;
  };

  Game.prototype.drawSpellHelp = function (ctx) {
    if (!this.spellHelpKey) return;
    var meta = SPELL_META[this.spellHelpKey];
    if (!meta) return;
    ctx.save();
    A.panel(ctx, 230, 560, 420, 190, .94);
    this.drawProtagonistSpellGlyph(ctx, this.spellHelpKey, 280, 620, 29, true);
    A.text(ctx, meta.name, 350, 603, 28, meta.color, 'left');
    A.text(ctx, '手动点击释放    消耗 ' + this.spellCostFor(this.spellHelpKey) + ' 灵气    CD ' + valueOr(meta.cooldown, 0) + 's', 350, 638, 17, C.paper, 'left');
    for (var i = 0; i < meta.desc.length; i++) A.text(ctx, meta.desc[i], 350, 680 + i * 28, 18, '#b9c9c3', 'left');
    A.text(ctx, '短按图标立即释放', 440, 730, 17, C.jade);
    ctx.restore();
  };

  Game.prototype.heroSprite = function (hero) { return this.assets[HERO_META[hero.type].sprite]; };

  Game.prototype.drawApprovedBattleFormationOverlay = function (ctx) {
    var r = BATTLE_LOWER_ART.formationOverlay;
    var ground = ctx.createLinearGradient(0, r.y, 0, H);
    ground.addColorStop(0, 'rgba(3,9,12,0)');
    ground.addColorStop(.55, 'rgba(3,9,12,.12)');
    ground.addColorStop(.72, 'rgba(3,9,12,.30)');
    ground.addColorStop(1, 'rgba(3,9,12,.78)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, r.y, W, H - r.y);

    var img = this.assets.battleFormationOverlay;
    if (img && (img.width || img.naturalWidth)) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = .88;
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
      ctx.restore();
      return true;
    }
    return false;
  };

  Game.prototype.drawApprovedBattleLowerProtagonist = function (ctx) {
    var r = BATTLE_LOWER_ART.protagonist;
    var castSheet = this.assets.protagonistCastSheet;
    var castReady = castSheet && (castSheet.width || castSheet.naturalWidth) && (this.protagonistCastTime || 0) > 0;
    var img = castReady ? castSheet : this.assets.taoistMain;
    if (!img || !(img.width || img.naturalWidth)) return false;
    ctx.save();
    ctx.shadowColor = 'rgba(224,177,84,.56)';
    ctx.shadowBlur = 8;
    if (castReady) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      var sw = iw / 3, sh = ih / 2, inset = 4;
      var scale = Math.min(r.w / (sw - inset * 2), r.h / (sh - inset * 2));
      var dw = (sw - inset * 2) * scale, dh = (sh - inset * 2) * scale;
      var progress = 1 - clamp(this.protagonistCastTime / Math.max(.001, this.protagonistCastMax || .62), 0, 1);
      var frame = Math.min(5, Math.floor(progress * 6));
      var col = frame % 3, row = Math.floor(frame / 3);
      ctx.drawImage(img, col * sw + inset, row * sh + inset, sw - inset * 2, sh - inset * 2,
        r.x - dw / 2, r.y - dh, dw, dh);
    } else {
      A.spriteImage(ctx, img, r.x, r.y, r.w, r.h, 1);
    }
    ctx.restore();
    return true;
  };

  Game.prototype.drawApprovedBattleLowerHealth = function (ctx) {
    var frameRect = BATTLE_LOWER_ART.healthFrame;
    var fillRect = BATTLE_LOWER_ART.healthFill;
    var frame = this.assets.battleLowerHealthFrame;
    var fill = this.assets.battleLowerHealthFill;
    var ratio = clamp(this.baseMax ? this.baseHp / this.baseMax : 0, 0, 1);
    if (fill && (fill.width || fill.naturalWidth) && ratio > 0) {
      var iw = fill.width || fill.naturalWidth;
      var ih = fill.height || fill.naturalHeight;
      ctx.drawImage(fill, 0, 0, iw * ratio, ih, fillRect.x, fillRect.y, fillRect.w * ratio, fillRect.h);
    }
    if (frame && (frame.width || frame.naturalWidth)) {
      ctx.drawImage(frame, frameRect.x, frameRect.y, frameRect.w, frameRect.h);
    } else {
      A.bar(ctx, frameRect.x, frameRect.y, frameRect.w, frameRect.h, this.baseHp, this.baseMax, '#6fdf45', 'rgba(21,30,19,.82)');
    }
    if ((this.wallShield || 0) > 0) {
      var shieldRatio = clamp((this.wallShield || 0) / Math.max(1, this.baseMax || 1), 0, 1);
      var flash = clamp((this.wallShieldFlash || 0) / .48, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = '#9eefff';
      ctx.shadowBlur = 10 + flash * 10;
      A.rr(ctx, fillRect.x, fillRect.y - 7, Math.max(4, fillRect.w * shieldRatio), 5, 3, 'rgba(107,226,255,.72)', 'rgba(222,255,255,.62)', 1);
      A.text(ctx, '盾 ' + Math.ceil(this.wallShield), frameRect.x + frameRect.w + 18, frameRect.y + 11, 12, '#9eefff', 'left', '900');
      ctx.restore();
    }
    A.text(ctx, Math.ceil(this.baseHp) + ' / ' + this.baseMax, frameRect.x + frameRect.w / 2, frameRect.y + frameRect.h / 2, 15, C.white, 'center', '900');
  };

  Game.prototype.drawApprovedBattleLowerForeground = function (ctx) {
    if (!this.drawApprovedBattleLowerProtagonist(ctx)) this.drawTaoistCore(ctx);
    this.drawApprovedBattleLowerHealth(ctx);
    this.drawSpellDock(ctx);
  };

  Game.prototype.drawFirstStageTutorialSummonButton = function (ctx) {
    // 召唤教学现在由 TutorialUI 罩住主角并提示点击，不再在主角身上叠加独立按钮。
  };

  Game.prototype.drawEndpointGround = function (ctx) {
    var top = 914;
    ctx.save();
    var g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, 'rgba(5,12,18,.18)');
    g.addColorStop(.18, 'rgba(5,12,18,.82)');
    g.addColorStop(.52, 'rgba(5,12,18,.94)');
    g.addColorStop(1, '#030910');
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, H - top);

    var glow = ctx.createRadialGradient(W / 2, 1105, 24, W / 2, 1105, 285);
    glow.addColorStop(0, 'rgba(67,176,220,.25)');
    glow.addColorStop(.48, 'rgba(20,75,106,.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 925, W, 300);

    ctx.strokeStyle = 'rgba(91,189,220,.20)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(28, 1048); ctx.lineTo(722, 1048); ctx.stroke();

    var sideShade = ctx.createLinearGradient(0, 970, W, 970);
    sideShade.addColorStop(0, 'rgba(0,0,0,.42)');
    sideShade.addColorStop(.22, 'rgba(0,0,0,0)');
    sideShade.addColorStop(.78, 'rgba(0,0,0,0)');
    sideShade.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = sideShade;
    ctx.fillRect(0, 914, W, 420);
    ctx.restore();
  };

  Game.prototype.drawFormationCutout = function (ctx) {
    var img = this.assets.baguaFormation;
    if (!img || !(img.width || img.naturalWidth)) return false;
    ctx.save();
    ctx.globalAlpha = .82;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(img, 145, 1034, 460, 210);
    ctx.restore();
    return true;
  };

  Game.prototype.drawTaoistStandee = function (ctx) {
    var img = this.assets.taoistMain;
    if (!img || !(img.width || img.naturalWidth)) return false;
    var pulse = .5 + .5 * Math.sin(this.time * 2.4);
    ctx.save();
    ctx.shadowColor = 'rgba(125,220,255,.82)';
    ctx.shadowBlur = 10 + pulse * 5;
    A.spriteImage(ctx, img, W / 2, 1219, 128, 180, 1);
    ctx.restore();
    return true;
  };

  Game.prototype.drawSpiritLampCutouts = function (ctx) {
    var img = this.assets.spiritLampStates;
    var fallbackImg = this.assets.spiritLamp;
    var lit = clamp(this.spiritLampLit || 0, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
    var hit = clamp((this.spiritLampHit || 0) / .35, 0, 1);
    var pulse = clamp((this.spiritLampPulse || 0) / .55, 0, 1);
    var xs = [68, 169, 270, 375, 480, 581, 682];
    var baseYs = [1016, 1008, 1001, 998, 1001, 1008, 1016];
    var scales = [.90, .85, .81, .78, .81, .85, .90];
    ctx.save();
    if (hit > 0) {
      ctx.fillStyle = 'rgba(255,70,45,' + (.16 * hit) + ')';
      ctx.fillRect(0, 922, W, 100);
    }
    ctx.strokeStyle = hit > 0 ? 'rgba(255,120,90,.72)' : 'rgba(219,168,76,.42)';
    ctx.lineWidth = 3 + hit * 3;
    ctx.beginPath();
    ctx.moveTo(xs[0], baseYs[0] - 28);
    for (var c = 1; c < xs.length; c++) {
      var midX = (xs[c - 1] + xs[c]) / 2;
      var midY = Math.max(baseYs[c - 1], baseYs[c]) - 12;
      ctx.quadraticCurveTo(midX, midY, xs[c], baseYs[c] - 28);
    }
    ctx.stroke();
    for (var i = 0; i < xs.length; i++) {
      var on = i < lit;
      var x = xs[i], y = baseYs[i] + (hit > 0 ? Math.sin(this.time * 54 + i) * 4 * hit : 0);
      var w = 90 * scales[i], h = 116 * scales[i];
      ctx.save();
      // The generated unlit bowl is already dark. Keep it mostly opaque so the
      // seven-lamp defensive line remains readable against the night ground.
      ctx.globalAlpha = on ? 1 : .88;
      if (on) {
        ctx.shadowColor = hit > 0 ? '#ff765d' : '#ffd272';
        ctx.shadowBlur = 18 + pulse * 18 + (i === lit - 1 ? 10 : 0);
      }
      if (img && (img.width || img.naturalWidth)) {
        var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
        var sw = iw / 2, state = on ? 0 : 1;
        ctx.drawImage(img, state * sw, 0, sw, ih, x - w / 2, y - h, w, h);
      } else if (fallbackImg && (fallbackImg.width || fallbackImg.naturalWidth)) {
        A.spriteImage(ctx, fallbackImg, x, y, w, h, on ? 1 : .38);
      } else {
        ctx.translate(x, y - 38);
        A.rr(ctx, -18, 24, 36, 12, 6, on ? '#713414' : '#1d292d', on ? C.gold : '#65706d', 2);
        ctx.beginPath(); ctx.ellipse(0, 25, 20, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = on ? '#5b2c14' : '#192428'; ctx.fill(); ctx.stroke();
        if (on) {
          ctx.fillStyle = '#ffd66b';
          ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(-7, 6, 0, 15); ctx.quadraticCurveTo(7, 6, 0, -10); ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.restore();
  };

  Game.prototype.drawBottomFormation = function (ctx) {
    this.drawEndpointGround(ctx);
    this.drawFormationCutout(ctx);
    if (!this.drawTaoistStandee(ctx)) this.drawTaoistCore(ctx);
    this.drawSpiritLampCutouts(ctx);
    A.bar(ctx, 205, 1027, 340, 20, this.baseHp, this.baseMax, '#6fdf45', 'rgba(21,30,19,.82)', Math.ceil(this.baseHp) + ' / ' + this.baseMax);
    if (WALL_MODE) {
      A.rr(ctx, 160, 1248, 430, 48, 18, 'rgba(6,14,20,.82)', 'rgba(219,168,76,.62)', 2);
      A.text(ctx, '城墙迎敌 · 御灵自动普攻', W / 2, 1273, 18, C.paper);
      return;
    }
    this.drawSpellDock(ctx);
    return;
    if (this.isDeploymentOpen() || this.dragSoul) {
      for (var h = 0; h < this.heroes.length; h++) this.drawSoulGhost(ctx, this.heroes[h]);
      A.text(ctx, '魂位', 146, 1040, 15, C.gold);
    }
    if (this.dragSoul) {
      var origin = SOUL_SLOTS[this.dragSoul.soulSlot];
      ctx.save(); ctx.strokeStyle = HERO_META[this.dragSoul.type].color; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y - 25); ctx.lineTo(this.pointer.x, this.pointer.y); ctx.stroke(); ctx.restore();
    }
    if (this.dragDeploy && this.dragOrigin) {
      ctx.save(); ctx.strokeStyle = HERO_META[this.dragDeploy.type].color; ctx.lineWidth = 5; ctx.setLineDash([12, 8]);
      ctx.beginPath(); ctx.moveTo(this.dragOrigin.x, this.dragOrigin.y - 30); ctx.lineTo(this.pointer.x, this.pointer.y); ctx.stroke(); ctx.restore();
    }
  };

  Game.prototype.drawSoulGhost = function (ctx, hero) {
    var slot = SOUL_SLOTS[hero.soulSlot], color = HERO_META[hero.type].color, img = this.heroSprite(hero);
    var r = 30, cx = slot.x, cy = slot.y - 25;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = hero.alive ? 'rgba(21,39,43,.78)' : 'rgba(55,24,37,.88)'; ctx.fill();
    ctx.clip();
    A.spriteImage(ctx, img, cx, cy + 34, 60, 72, hero.alive ? .42 : .78);
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = this.dragSoul === hero ? '#fff0b0' : color; ctx.lineWidth = this.dragSoul === hero ? 6 : 3; ctx.stroke();
    return;
    A.text(ctx, hero.name, slot.x, slot.y + 14, 12, C.paper);
    if (hero.alive) A.text(ctx, '在场', slot.x, slot.y + 30, 11, '#83cbb9');
    else A.text(ctx, Math.max(0, hero.respawn).toFixed(1) + 's', slot.x, slot.y + 30, 11, '#ff9b8b');
  };

  Game.prototype.drawTaoistCore = function (ctx) {
    var img = this.assets.title;
    var x = 380, y = 1152;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.time * .22);
    ctx.strokeStyle = 'rgba(219,168,76,.52)';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); ctx.lineTo(Math.cos(a) * 88, Math.sin(a) * 88); ctx.stroke();
      ctx.save(); ctx.translate(Math.cos(a) * 105, Math.sin(a) * 105); ctx.rotate(a);
      for (var l = 0; l < 3; l++) {
        ctx.beginPath(); ctx.moveTo(-10, -7 + l * 7); ctx.lineTo(10, -7 + l * 7); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y - 10, 58, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#101a21'; ctx.fillRect(x - 60, y - 70, 120, 126);
    if (img && (img.width || img.naturalWidth)) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      ctx.drawImage(img, iw * .11, ih * .46, iw * .5, ih * .48, x - 61, y - 95, 122, 178);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y - 10, 62, 0, Math.PI * 2); ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
    A.text(ctx, '御灵师', x, y + 68, 16, C.paper);
  };

  Game.prototype.drawProtagonistSpellGlyph = function (ctx, key, x, y, r, active) {
    var meta = SPELL_META[key] || {};
    var color = meta.color || C.gold;
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = active ? 'lighter' : 'source-over';
    ctx.strokeStyle = active ? '#f5ffff' : color;
    ctx.fillStyle = active ? color : 'rgba(160,170,170,.58)';
    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 10 : 0;
    if (key === 'wind') {
      ctx.lineWidth = Math.max(2, r * .15);
      for (var w = -1; w <= 1; w++) {
        ctx.beginPath();
        ctx.moveTo(-r * .72, -r * .25 + w * r * .28);
        ctx.bezierCurveTo(-r * .20, -r * .55 + w * r * .22, r * .45, -r * .05 + w * r * .18, r * .64, -r * .34 + w * r * .18);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(r * .32, r * .18, r * .23, -Math.PI * .25, Math.PI * 1.35);
      ctx.stroke();
    } else if (key === 'rain') {
      ctx.lineWidth = Math.max(1.5, r * .10);
      for (var d = -1; d <= 1; d++) {
        ctx.beginPath();
        ctx.moveTo(d * r * .34, -r * .70);
        ctx.quadraticCurveTo(d * r * .18 - r * .14, -r * .12, d * r * .04, r * .44);
        ctx.quadraticCurveTo(d * r * .18 + r * .16, r * .18, d * r * .34, -r * .70);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = Math.max(2, r * .14);
      ctx.strokeStyle = 'rgba(190,200,198,.65)';
      ctx.beginPath();
      ctx.moveTo(-r * .42, 0);
      ctx.lineTo(r * .42, 0);
      ctx.moveTo(0, -r * .42);
      ctx.lineTo(0, r * .42);
      ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawSpellDock = function (ctx) {
    if (this.isFirstStageTutorialActive() && !this.firstStageTutorial.skillUnlocked) return;
    var lit = clamp(this.spiritLampLit || 0, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
    var max = this.spiritLampMax || SPIRIT_LAMP_MAX;
    var pulse = clamp((this.spiritLampPulse || 0) / .55, 0, 1);
    var intervalBoost = 1 + this.upgradeValue('U05', [.15, .25, .35], 0);
    var interval = Math.max(.5, (this.spiritLampInterval || SPIRIT_LAMP_INTERVAL) / intervalBoost);
    var charge = lit < max ? clamp((this.spiritLampTimer || 0) / interval, 0, 1) : 0;
    A.rr(ctx, 14, 1228, 310, 86, 16, 'rgba(6,14,20,.84)', 'rgba(219,168,76,.62)', 3);
    A.text(ctx, '灵气', 58, 1252, 18, C.paper);
    A.text(ctx, lit + ' / ' + max, 58, 1284, 25, C.white, 'center', '900');
    var barX = 96, barY = 1248, gap = 6;
    var segW = Math.min(34, (210 - Math.max(0, max - 1) * gap) / Math.max(1, max));
    for (var l = 0; l < max; l++) {
      var sx = barX + l * (segW + gap);
      var on = l < lit;
      var filling = !on && l === lit && charge > 0;
      ctx.save();
      if (on || filling) {
        ctx.shadowColor = C.gold;
        ctx.shadowBlur = 8 + pulse * 10;
      }
      A.rr(ctx, sx, barY, segW, 18, 6, 'rgba(15,24,28,.92)', on ? 'rgba(255,218,110,.86)' : 'rgba(111,125,121,.62)', 1.5);
      if (on || filling) {
        var fillRatio = on ? 1 : charge;
        var fill = ctx.createLinearGradient(sx, barY, sx + segW, barY);
        fill.addColorStop(0, '#62e8ff');
        fill.addColorStop(.55, '#ffe37a');
        fill.addColorStop(1, '#fff6c8');
        A.rr(ctx, sx + 2, barY + 2, Math.max(3, (segW - 4) * fillRatio), 14, 5, fill);
      }
      ctx.restore();
    }
    A.text(ctx, lit >= max ? '已满' : '充能中', 202, 1285, 13, lit >= max ? C.gold : '#93cfd5');

    var visibleSpellKeys = this.visibleProtagonistSpellKeys();
    for (var i = 0; i < visibleSpellKeys.length; i++) {
      var key = visibleSpellKeys[i], meta = SPELL_META[key], pos = SPELL_POS[key];
      var disabled = !meta || meta.disabled;
      var enough = !disabled && this.hasSpiritLamps(key);
      var cd = !disabled && this.spellMax[key] > 0 ? clamp(this.spellCd[key] / this.spellMax[key], 0, 1) : 0;
      var ready = !disabled && enough && this.spellCd[key] <= 0;
      var color = disabled ? '#6f7d82' : meta.color;
      ctx.save();
      if (ready) {
        ctx.shadowColor = color; ctx.shadowBlur = 18 + Math.sin(this.time * 10) * 5;
        ctx.strokeStyle = '#fff4c6'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 34 + Math.sin(this.time * 8) * 2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.shadowColor = color;
      ctx.shadowBlur = ready ? 13 : 3;
      ctx.fillStyle = disabled ? 'rgba(14,20,24,.82)' : 'rgba(9,18,24,.92)';
      ctx.strokeStyle = ready ? '#fff1b8' : enough ? color : 'rgba(118,130,130,.72)';
      ctx.lineWidth = ready ? 3 : 2;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 31, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();

      this.drawProtagonistSpellGlyph(ctx, key, pos.x, pos.y, 22, ready);

      if (cd > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.arc(pos.x, pos.y, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cd);
        ctx.closePath();
        ctx.fillStyle = 'rgba(3,8,13,.76)';
        ctx.fill();
        A.text(ctx, Math.ceil(this.spellCd[key]), pos.x, pos.y + 1, 18, C.white, 'center', '900');
        ctx.restore();
      } else if (!ready && !disabled) {
        ctx.save();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 31, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(3,8,13,.50)';
        ctx.fill();
        ctx.restore();
      }

      A.text(ctx, meta.name, pos.x, pos.y + 43, 12, ready ? '#d9ffe8' : disabled ? '#6f7d82' : '#9ca7a3');
      if (!disabled) A.text(ctx, '耗' + this.spellCostFor(key), pos.x + 29, pos.y - 24, 12, ready ? C.gold : '#77827e');
    }
  };

  Game.prototype.drawAutoCastButton = function (ctx) {
    var x = AUTO_CAST_BUTTON.x, y = AUTO_CAST_BUTTON.y, r = AUTO_CAST_BUTTON.r;
    ctx.save();
    if (!this.drawHudControlIcon(ctx, 4, x, y, r * 2.1)) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = this.spellAuto ? 'rgba(21,97,76,.92)' : 'rgba(31,39,43,.92)';
      ctx.fill();
      ctx.strokeStyle = this.spellAuto ? C.jade : '#7b8581';
      ctx.lineWidth = 3; ctx.stroke();
    }
    if (this.spellAuto) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.time * 2.2);
      ctx.strokeStyle = '#e5ffe8'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r + 6, -.65, .65); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r + 6, Math.PI - .65, Math.PI + .65); ctx.stroke();
      ctx.restore();
    }
    A.text(ctx, '自', x, y - 2, 24, this.spellAuto ? C.white : '#aab3af');
    A.text(ctx, this.spellAuto ? '自动' : '手动', x, y + 36, 12, this.spellAuto ? C.jade : C.gold);
    ctx.restore();
  };

  Game.prototype.drawHeroPortrait = function (ctx, hero, x, y, radius) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#101b22'; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    A.spriteImage(ctx, this.heroSprite(hero), x, y + radius, radius * 1.7, radius * 2.15, 1);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, Math.PI * 2); ctx.strokeStyle = HERO_META[hero.type].color; ctx.lineWidth = 4; ctx.stroke();
  };

  Game.prototype.drawTalismanDescription = function (ctx, value, x, y, maxWidth, color) {
    var chars = String(value || '').split(''), line = '', lines = [];
    ctx.save(); ctx.font = '700 15px ' + uiFontFamily(15);
    for (var i = 0; i < chars.length; i++) {
      var next = line + chars[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line); line = chars[i];
        if (lines.length === 2) break;
      } else line = next;
    }
    if (line && lines.length < 2) lines.push(line);
    ctx.restore();
    for (var j = 0; j < lines.length; j++) this.drawUpgradeText(ctx, lines[j], x, y + j * 22, 15, color, 'left', '700');
  };

  Game.prototype.drawTalismanRow = function (ctx, entry, rowIndex, x, y, w, h) {
    var upgrade = entry.upgrade, rarity = upgrade.rarity || 'common';
    var assetKey = rarity === 'legendary' ? 'talismanRowLegendary' : rarity === 'rare' ? 'talismanRowRare' : 'talismanRowCommon';
    var img = this.assets[assetKey];
    var colors = rarity === 'legendary' ? { title: '#fff0c6', body: '#ffe4bd', tag: '#fff1d2', star: '#fff2ab' } :
      rarity === 'rare' ? { title: '#fff0cb', body: '#f7e4bf', tag: '#fff0cb', star: '#ffe59a' } :
      { title: '#e8fbff', body: '#d7edf0', tag: '#d9f7ff', star: '#d8f6ff' };
    if (img && (img.width || img.naturalWidth)) ctx.drawImage(img, x, y, w, h);
    else A.rr(ctx, x, y, w, h, 18, 'rgba(16,28,34,.95)', rarity === 'legendary' ? '#c14a34' : rarity === 'rare' ? '#d89a30' : '#6fbad0', 3);

    var iconX = x + 75, iconY = y + h / 2, iconSize = 86;
    ctx.save(); ctx.beginPath(); ctx.arc(iconX, iconY, 36, 0, Math.PI * 2); ctx.clip();
    if (this.assets.spellIcons && (this.assets.spellIcons.width || this.assets.spellIcons.naturalWidth)) {
      A.atlasCell(ctx, this.assets.spellIcons, 3, 1, rowIndex % 3, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, false);
    } else {
      ctx.fillStyle = rarity === 'legendary' ? '#c14531' : rarity === 'rare' ? '#c4872c' : '#2b8da6'; ctx.fill();
    }
    ctx.restore();

    var maxStars = Math.min(3, Math.max(1, upgrade.maxLevel || 1));
    for (var star = 0; star < maxStars; star++) {
      var starImg = star < entry.level ? this.assets.upgradeStarFilled : this.assets.upgradeStarEmpty;
      var sx = x + 132 + star * 19;
      if (starImg && (starImg.width || starImg.naturalWidth)) ctx.drawImage(starImg, sx, y + 13, 18, 18);
      else this.drawUpgradeText(ctx, star < entry.level ? '\u2605' : '\u2606', sx + 9, y + 23, 15, colors.star, 'center', '900');
    }
    this.drawUpgradeText(ctx, upgrade.name, x + 132, y + 53, 21, colors.title, 'left', '900');
    var tag = UPGRADE_TYPE_LABELS[upgrade.type] || '强化';
    this.drawUpgradeText(ctx, tag, x + w - 52, y + 53, 14, colors.tag, 'center', '900');
    this.drawTalismanDescription(ctx, upgrade.levels[Math.max(0, entry.level - 1)] || '', x + 132, y + 89, w - 158, colors.body);
  };

  Game.prototype.drawTalismanOverlay = function (ctx) {
    var panel = TALISMAN_MODAL, img = this.assets.talismanModalPanel;
    ctx.save();
    if (img && (img.width || img.naturalWidth)) ctx.drawImage(img, panel.x, panel.y, panel.w, panel.h);
    else A.panel(ctx, panel.x, panel.y, panel.w, panel.h, .98);
    this.drawUpgradeText(ctx, WALL_MODE ? '已选强化' : '符箓总览', W / 2, panel.y + 106, 32, '#4a2d0c', 'center', '900');

    var closeX = panel.x + panel.w + TALISMAN_MODAL_CLOSE.offsetX, closeY = panel.y + TALISMAN_MODAL_CLOSE.offsetY;
    ctx.save(); ctx.fillStyle = 'rgba(9,17,23,.92)'; ctx.beginPath(); ctx.arc(closeX, closeY, TALISMAN_MODAL_CLOSE.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9ab51'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#f5d995'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(closeX - 7, closeY - 7); ctx.lineTo(closeX + 7, closeY + 7); ctx.moveTo(closeX + 7, closeY - 7); ctx.lineTo(closeX - 7, closeY + 7); ctx.stroke(); ctx.restore();

    var heroes = this.heroes || [], selected = this.getHero(this.talismanHeroId) || heroes[0];
    if (selected) this.talismanHeroId = selected.id;
    var tabStart = W / 2 - (heroes.length - 1) * 58;
    for (var i = 0; i < heroes.length; i++) {
      var tx = tabStart + i * 116, active = selected && heroes[i].id === selected.id;
      ctx.save();
      if (active) { ctx.shadowColor = '#f6c85d'; ctx.shadowBlur = 14; }
      this.drawHeroPortrait(ctx, heroes[i], tx, 343, active ? 40 : 34);
      if (active) { ctx.beginPath(); ctx.arc(tx, 343, 46, 0, Math.PI * 2); ctx.strokeStyle = '#ffdc78'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.restore();
    }

    var list = this.activeTalismanUpgrades(selected), maxScroll = Math.max(0, list.length - TALISMAN_ROWS.visible);
    this.talismanScroll = clamp(this.talismanScroll || 0, 0, maxScroll) | 0;
    this.drawUpgradeText(ctx, selected ? (selected.name + (WALL_MODE ? ' · 已选强化 ' : ' · 生效符箓 ') + list.length + ' 条') : '暂无御灵', W / 2, 394, 17, '#553717', 'center', '900');
    if (!list.length) {
      this.drawUpgradeText(ctx, '尚未获得对该御灵生效的强化', W / 2, 648, 22, '#725b3d', 'center', '900');
      this.drawUpgradeText(ctx, '完成一波战斗后，选择强化即可在此查看', W / 2, 685, 16, '#8c775d', 'center', '700');
    } else {
      for (var row = 0; row < TALISMAN_ROWS.visible; row++) {
        var entry = list[this.talismanScroll + row];
        if (entry) this.drawTalismanRow(ctx, entry, this.talismanScroll + row, TALISMAN_ROWS.x, TALISMAN_ROWS.y + row * TALISMAN_ROWS.step, TALISMAN_ROWS.w, TALISMAN_ROWS.h);
      }
    }
    var canPrev = this.talismanScroll > 0, canNext = this.talismanScroll < maxScroll;
    this.drawUpgradeText(ctx, canPrev ? '‹  上一条' : '‹  到顶', 272, 1018, 17, canPrev ? '#e1a94a' : '#8c775d', 'center', '900');
    this.drawUpgradeText(ctx, (this.talismanScroll + 1) + '/' + Math.max(1, list.length), W / 2, 1018, 16, '#6b4d2d', 'center', '900');
    this.drawUpgradeText(ctx, canNext ? '下一条  ›' : '到底  ›', 478, 1018, 17, canNext ? '#e1a94a' : '#8c775d', 'center', '900');
    this.drawUpgradeText(ctx, '点击头像切换 · 点击外侧或右上角关闭', W / 2, 1070, 15, '#73583a', 'center', '700');
    ctx.restore();
  };

  Game.prototype.drawCards = function (ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(3,8,14,.89)'; ctx.fillRect(0, 0, W, H);
    A.text(ctx, '共 鸣 升 阶', W / 2, 178, 48, C.gold);
    A.text(ctx, '选择一道灵契 · 强化本局御灵技能', W / 2, 232, 23, C.paper);
    for (var i = 0; i < this.pendingCards.length; i++) {
      var card = this.pendingCards[i], hero = this.getHero(card.hero);
      var x = 35 + i * 235 + (3 - this.pendingCards.length) * 117;
      A.panel(ctx, x, 390, 215, 470, .99);
      A.rr(ctx, x + 15, 410, 185, 34, 13, card.color);
      A.text(ctx, card.heroName, x + 107, 427, 18, C.ink);
      this.drawHeroPortrait(ctx, hero, x + 107, 535, 62);
      A.text(ctx, card.title, x + 107, 637, 24, C.gold);
      A.text(ctx, card.role, x + 107, 674, 17, '#9ab4ac');
      this.wrapText(ctx, card.desc, x + 107, 731, 174, 22, C.paper);
      A.text(ctx, '点按选择', x + 107, 824, 17, C.jade);
    }
    A.text(ctx, '本局已强化 ' + this.upgradeCount + ' 次', W / 2, 930, 20, '#9eb7af');
    ctx.restore();
  };

  Game.prototype.drawUpgradeOrnament = function (ctx, crop, x, y, w, h) {
    var img = this.assets.upgradeCardOrnaments;
    if (!img || !(img.width || img.naturalWidth) || !crop) return false;
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, x, y, w, h);
    return true;
  };

  // Card copy must stay crisp at small mobile sizes. The shared HUD text helper
  // intentionally adds a soft shadow, so upgrade-card copy uses this sharp path.
  Game.prototype.drawUpgradeText = function (ctx, value, x, y, size, color, align, weight) {
    ctx.save();
    ctx.font = (weight || '700') + ' ' + size + 'px ' + uiFontFamily(size);
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillText(value, x, y);
    ctx.restore();
  };

  Game.prototype.wrapUpgradeText = function (ctx, value, x, y, maxWidth, size, color) {
    var chars = String(value || '').split(''), line = '', lines = [];
    ctx.save(); ctx.font = '700 ' + size + 'px ' + uiFontFamily(size);
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = chars[i]; } else line = test;
    }
    if (line) lines.push(line); ctx.restore();
    for (var j = 0; j < lines.length; j++) this.drawUpgradeText(ctx, lines[j], x, y + j * (size + 6), size, color);
  };

  Game.prototype.upgradeTextLines = function (ctx, value, maxWidth, size, weight) {
    var chars = String(value || '').split(''), line = '', lines = [];
    ctx.save();
    ctx.font = (weight || '700') + ' ' + size + 'px ' + uiFontFamily(size);
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines.length ? lines : [''];
  };

  Game.prototype.drawUpgradeCardDescription = function (ctx, card, slot, anchors, palette) {
    var maxWidth = slot.w - 42;
    var box = { y: slot.y + 265, h: 178 };
    var rows = [];
    function addRow(text, size, color, weight, lineHeight) {
      rows.push({ text: text, size: size, color: color, weight: weight || '700', lineHeight: lineHeight || size + 6 });
    }
    if (card.type === 'exclusive') {
      addRow('生效角色：' + (card.effectHeroName || card.heroName || '御灵'), 13, palette.body, '900', 17);
      addRow('生效技能：' + (card.effectSkillName || '专属技能') + '（' + (card.effectSkillKind || '专属') + '）', 13, palette.body, '900', 17);
      rows.push({ gap: 3 });
      var descLines = this.upgradeTextLines(ctx, card.desc, maxWidth, 13, '700');
      for (var i = 0; i < descLines.length; i++) addRow(descLines[i], 13, palette.body, '700', 17);
    } else {
      var lines = this.upgradeTextLines(ctx, card.desc, maxWidth, 15, '700');
      for (var j = 0; j < lines.length; j++) addRow(lines[j], 15, palette.body, '700', 20);
    }
    var total = 0;
    for (var r = 0; r < rows.length; r++) total += rows[r].gap || rows[r].lineHeight || 0;
    if (total > box.h) {
      var shrink = Math.max(.82, box.h / total);
      total = 0;
      for (var s = 0; s < rows.length; s++) {
        if (rows[s].gap) {
          rows[s].gap *= shrink;
          total += rows[s].gap;
        } else {
          rows[s].size = Math.max(11, Math.floor(rows[s].size * shrink));
          rows[s].lineHeight = Math.max(rows[s].size + 3, rows[s].lineHeight * shrink);
          total += rows[s].lineHeight;
        }
      }
    }
    var y = box.y + Math.max(0, (box.h - total) * .5);
    for (var k = 0; k < rows.length; k++) {
      var row = rows[k];
      if (row.gap) { y += row.gap; continue; }
      this.drawUpgradeText(ctx, row.text, anchors.desc.x, y + row.lineHeight * .5, row.size, row.color, 'center', row.weight);
      y += row.lineHeight;
    }
  };

  Game.prototype.drawUpgradeCardFace = function (ctx, card, slot, cardIndex) {
    var rarity = upgradeCardFrameRarity(card);
    var crop = UPGRADE_CARD_FRAME_CROPS[rarity];
    var palette = {
      common: { title: '#113a4e', body: '#27424d', tag: '#eafbff', star: '#d9f8ff', dim: '#61727a' },
      rare: { title: '#6c3d13', body: '#5d4524', tag: '#fff3c8', star: '#ffe392', dim: '#8f7953' },
      legendary: { title: '#fff0b8', body: '#5f261d', tag: '#fff0d0', star: '#fff0a6', dim: '#a8775b' }
    }[rarity];
    var anchors = this.upgradeCardAnchors(card, slot);
    var frame = this.assets.upgradeCardFrames;
    ctx.save();
    if (frame && (frame.width || frame.naturalWidth)) {
      var drawOffset = UPGRADE_CARD_FRAME_DRAW_OFFSETS[rarity] || UPGRADE_CARD_FRAME_DRAW_OFFSETS.common;
      ctx.drawImage(frame, crop.x, crop.y, crop.w, crop.h, slot.x, slot.y + (drawOffset.y || 0), slot.w, slot.h + (drawOffset.h || 0));
    } else {
      A.panel(ctx, slot.x, slot.y, slot.w, slot.h, .98);
    }

    var starLevel = Math.min(3, Math.max(1, this.rogueLevel(card.upgradeId) + 1));
    var starCapacity = Math.min(3, Math.max(starLevel, card.maxLevel || 1));
    var starSize = 33, starStep = 30;
    for (var star = 0; star < starCapacity; star++) {
      var starImg = star < starLevel ? this.assets.upgradeStarFilled : this.assets.upgradeStarEmpty;
      var starX = anchors.stars.x - starSize * .5 + (star - (starCapacity - 1) * .5) * starStep;
      if (starImg && (starImg.width || starImg.naturalWidth)) ctx.drawImage(starImg, starX, anchors.stars.y - starSize * .5, starSize, starSize);
      else this.drawUpgradeText(ctx, star < starLevel ? '\u2605' : '\u2606', starX + starSize * .5, anchors.stars.y, 24, star < starLevel ? palette.star : palette.dim);
    }
    this.drawUpgradeText(ctx, card.title, anchors.title.x, anchors.title.y, 21, palette.title, 'center', '900');

    var iconX = anchors.icon.x, iconY = anchors.icon.y, iconSize = 84, iconRadius = iconSize * .5;
    var portraitHero = card.type === 'exclusive' ? (this.getHero(card.portraitHero) || this.heroByType(card.portraitType)) : null;
    if (portraitHero) {
      this.drawHeroPortrait(ctx, portraitHero, iconX, iconY - 1, iconRadius - 5);
    } else {
      ctx.save();
      ctx.beginPath(); ctx.arc(iconX, iconY, iconRadius, 0, Math.PI * 2); ctx.clip();
      if (this.assets.spellIcons && (this.assets.spellIcons.width || this.assets.spellIcons.naturalWidth)) {
        A.atlasCell(ctx, this.assets.spellIcons, 3, 1, cardIndex % 3, iconX - iconRadius, iconY - iconRadius, iconSize, iconSize, false);
      } else {
        ctx.fillStyle = rarity === 'legendary' ? '#d7632b' : rarity === 'rare' ? '#d39a34' : '#2aa9c7';
        ctx.fillRect(iconX - iconRadius + 2, iconY - iconRadius + 2, iconSize - 4, iconSize - 4);
        A.text(ctx, '\u2726', iconX, iconY + 2, 36, C.white);
      }
      ctx.restore();
    }

    this.drawUpgradeText(ctx, card.tag || '\u4f24\u5bb3', anchors.tag.x, anchors.tag.y, 17, palette.tag, 'center', '900');
    this.drawUpgradeCardDescription(ctx, card, slot, anchors, palette);
    // Legacy fixed-anchor copy is disabled; drawUpgradeCardDescription above is the active centred renderer.
    if (false && card.type === 'exclusive') {
      this.drawUpgradeText(ctx, '生效角色：' + (card.effectHeroName || card.heroName || '御灵'), anchors.desc.x, anchors.desc.y, 14, palette.body, 'center', '900');
      this.drawUpgradeText(ctx, '生效技能：' + (card.effectSkillName || '专属技能') + '（' + (card.effectSkillKind || '专属') + '）', anchors.desc.x, anchors.desc.y + 22, 14, palette.body, 'center', '900');
      this.wrapUpgradeText(ctx, card.desc, anchors.desc.x, anchors.desc.y + 51, slot.w - 48, 15, palette.body);
    } else if (false) {
      this.wrapUpgradeText(ctx, card.desc, anchors.desc.x, anchors.desc.y, slot.w - 48, 17, palette.body);
    }
    var sealCrop = UPGRADE_CARD_ORNAMENT_CROPS.seals[cardIndex % UPGRADE_CARD_ORNAMENT_CROPS.seals.length];
    var runeCrop = UPGRADE_CARD_ORNAMENT_CROPS.runes[cardIndex % UPGRADE_CARD_ORNAMENT_CROPS.runes.length];
    this.drawUpgradeOrnament(ctx, sealCrop, slot.x + slot.w - 35, slot.y + 118, 24, 34);
    this.drawUpgradeOrnament(ctx, runeCrop, slot.x + 10, slot.y + 285, 17, 104);
    ctx.restore();
  };

  Game.prototype.drawCardEditorButton = function (ctx, x, y, w, label, active) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(211,152,48,.92)' : 'rgba(13,25,34,.94)';
    ctx.strokeStyle = active ? '#ffe39b' : '#5c9eb4';
    ctx.lineWidth = 2;
    A.pathRoundRect(ctx, x, y, w, 38, 8); ctx.fill(); ctx.stroke();
    this.drawUpgradeText(ctx, label, x + w * .5, y + 20, 15, active ? '#1e1510' : '#e9f6f4', 'center', '900');
    ctx.restore();
  };

  Game.prototype.drawCardEditor = function (ctx) {
    var enabled = this.cardEditor && this.cardEditor.enabled;
    if (!enabled) return;
    ctx.save();
    ctx.fillStyle = 'rgba(4,12,20,.94)'; ctx.fillRect(14, 284, 286, 54);
    ctx.strokeStyle = '#426b7c'; ctx.lineWidth = 2; ctx.strokeRect(14, 284, 286, 54);
    this.drawCardEditorButton(ctx, 18, 292, 64, '保存', false);
    this.drawCardEditorButton(ctx, 88, 292, 64, '复制', false);
    this.drawCardEditorButton(ctx, 158, 292, 64, '重置', false);
    this.drawCardEditorButton(ctx, 228, 292, 64, '关闭', false);

    var parts = [
      { id: 'stars', name: '星级', w: 130, h: 48, color: '#f7d15d' },
      { id: 'title', name: '名称', w: 188, h: 42, color: '#76daf0' },
      { id: 'icon', name: '图标', w: 104, h: 104, color: '#f29d67' },
      { id: 'tag', name: '标签', w: 144, h: 42, color: '#8cda91' },
      { id: 'desc', name: '描述', w: 184, h: 164, color: '#d29bff' }
    ];
    ctx.setLineDash([6, 5]);
    for (var i = 0; i < this.pendingCards.length; i++) {
      var card = this.pendingCards[i], anchors = this.upgradeCardAnchors(card, upgradeCardSlot(i, this.pendingCards.length));
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p], point = anchors[part.id];
        ctx.strokeStyle = part.color; ctx.lineWidth = 2;
        ctx.strokeRect(point.x - part.w * .5, point.y - part.h * .5, part.w, part.h);
        this.drawUpgradeText(ctx, part.name, point.x, point.y - part.h * .5 - 10, 13, part.color, 'center', '900');
      }
    }
    ctx.setLineDash([]);
    this.drawUpgradeText(ctx, '直接拖动虚线框；松手即保存。复制可固化配置。', W * .5, 976, 17, '#e6f7f3', 'center', '700');
    ctx.restore();
  };

  Game.prototype.drawCards = function (ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3,8,14,.79)'; ctx.fillRect(0, 0, W, H);
    if (!this.drawUpgradeOrnament(ctx, UPGRADE_CARD_ORNAMENT_CROPS.title, 104, 78, 542, 142)) {
      A.text(ctx, '\u62e9\u7b26\u5f3a\u5316', W / 2, 151, 42, C.gold, 'center', '900');
    }
    for (var i = 0; i < this.pendingCards.length; i++) this.drawUpgradeCardFace(ctx, this.pendingCards[i], upgradeCardSlot(i, this.pendingCards.length), i);
    if (!this.drawUpgradeOrnament(ctx, UPGRADE_CARD_ORNAMENT_CROPS.footer, 118, 838, 514, 109)) {
      A.text(ctx, '\u9009\u62e9\u4e00\u5f20\u7b26\u7b8f\uff0c\u83b7\u5f97\u672c\u5c40\u5f3a\u5316', W / 2, 880, 19, C.paper);
    }
    var refreshBusy = this.rewardedVideoBusy === 'upgrade-refresh';
    var allBusy = this.rewardedVideoBusy === 'upgrade-all';
    var refreshDisabled = this.upgradeAdRefreshUsed || (!!this.rewardedVideoBusy && !refreshBusy);
    var allDisabled = this.upgradeAdAllUsed || (!!this.rewardedVideoBusy && !allBusy);
    A.rr(ctx, UPGRADE_REWARDED_ACTIONS.refresh.x, UPGRADE_REWARDED_ACTIONS.refresh.y, UPGRADE_REWARDED_ACTIONS.refresh.w, UPGRADE_REWARDED_ACTIONS.refresh.h, 18,
      refreshDisabled ? '#30393b' : '#176a67', refreshDisabled ? '#77827f' : '#73e4d1', 2.5);
    A.rr(ctx, UPGRADE_REWARDED_ACTIONS.all.x, UPGRADE_REWARDED_ACTIONS.all.y, UPGRADE_REWARDED_ACTIONS.all.w, UPGRADE_REWARDED_ACTIONS.all.h, 18,
      allDisabled ? '#3a3533' : '#79542c', allDisabled ? '#837b72' : '#efd07a', 2.5);
    this.drawUpgradeText(ctx, refreshBusy ? '播放中…' : this.upgradeAdRefreshUsed ? '本局已刷新' : '看视频刷新', UPGRADE_REWARDED_ACTIONS.refresh.x + UPGRADE_REWARDED_ACTIONS.refresh.w / 2, UPGRADE_REWARDED_ACTIONS.refresh.y + 28, 21, refreshDisabled ? '#aeb8b4' : '#eafff8', 'center', '900');
    this.drawUpgradeText(ctx, allBusy ? '播放中…' : this.upgradeAdAllUsed ? '本局已领取' : '看视频全都要', UPGRADE_REWARDED_ACTIONS.all.x + UPGRADE_REWARDED_ACTIONS.all.w / 2, UPGRADE_REWARDED_ACTIONS.all.y + 28, 21, allDisabled ? '#b6afa6' : '#fff2c3', 'center', '900');
    this.drawUpgradeText(ctx, '每局各限一次', UPGRADE_REWARDED_ACTIONS.refresh.x + UPGRADE_REWARDED_ACTIONS.refresh.w / 2, UPGRADE_REWARDED_ACTIONS.refresh.y + 52, 14, '#a9cfc6', 'center', '700');
    this.drawUpgradeText(ctx, '可先刷新再全选', UPGRADE_REWARDED_ACTIONS.all.x + UPGRADE_REWARDED_ACTIONS.all.w / 2, UPGRADE_REWARDED_ACTIONS.all.y + 52, 14, '#d7c59c', 'center', '700');
    this.drawCardEditor(ctx);
    ctx.restore();
  };

  Game.prototype.eliteDrawSlot = function (index, count) {
    if (count <= 1) return { x: 58, y: 362, w: 634, h: 500 };
    if (count === 2) return { x: 38 + index * 340, y: 414, w: 324, h: 438 };
    if (count === 3) {
      if (index === 0) return { x: 150, y: 328, w: 450, h: 302 };
      return { x: 34 + (index - 1) * 358, y: 666, w: 330, h: 302 };
    }
    return { x: 34 + (index % 2) * 358, y: 348 + Math.floor(index / 2) * 330, w: 330, h: 300 };
  };

  Game.prototype.drawEliteResultCard = function (ctx, card, slot, cardIndex) {
    var rarity = upgradeCardFrameRarity(card);
    var border = UPGRADE_CARD_FRAME_COLORS[rarity] || C.gold;
    var body = rarity === 'legendary' ? 'rgba(76,25,25,.96)' : rarity === 'rare' ? 'rgba(65,43,21,.96)' : 'rgba(15,47,57,.96)';
    var compact = slot.h <= 310;
    var titleSize = compact ? 17 : 24;
    var descSize = compact ? 13 : 16;
    var iconSize = compact ? 58 : 88;
    var iconY = slot.y + (compact ? 86 : 128);
    var hero = card.type === 'exclusive' ? (this.getHero(card.portraitHero) || this.heroByType(card.portraitType)) : null;
    ctx.save();
    ctx.globalAlpha = .98;
    A.rr(ctx, slot.x, slot.y, slot.w, slot.h, 20, body, border, compact ? 2 : 3);
    ctx.globalAlpha = 1;
    A.rr(ctx, slot.x + 12, slot.y + 12, slot.w - 24, compact ? 28 : 36, 10, border);
    this.drawUpgradeText(ctx, (card.heroName || '全队') + ' · ' + (card.tag || '强化'), slot.x + slot.w * .5, slot.y + (compact ? 26 : 30), compact ? 12 : 15, '#21150d', 'center', '900');
    ctx.save();
    if (hero) {
      this.drawHeroPortrait(ctx, hero, slot.x + slot.w * .5, iconY, iconSize * .5);
    } else {
      ctx.shadowColor = border; ctx.shadowBlur = compact ? 10 : 18;
      ctx.fillStyle = rarity === 'legendary' ? '#db6c38' : rarity === 'rare' ? '#e4ac45' : '#50bdd0';
      ctx.beginPath(); ctx.arc(slot.x + slot.w * .5, iconY, iconSize * .5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#fff1b6'; ctx.lineWidth = 2; ctx.stroke();
      this.drawUpgradeText(ctx, '签', slot.x + slot.w * .5, iconY + 2, compact ? 24 : 38, '#fff4c6', 'center', '900');
    }
    ctx.restore();
    var titleLines = this.upgradeTextLines(ctx, card.title || '煞签强化', slot.w - 34, titleSize, '900').slice(0, 2);
    var titleY = slot.y + (compact ? 142 : 202);
    for (var titleIndex = 0; titleIndex < titleLines.length; titleIndex++) {
      this.drawUpgradeText(ctx, titleLines[titleIndex], slot.x + slot.w * .5, titleY + titleIndex * (titleSize + 3), titleSize, '#ffe5a0', 'center', '900');
    }
    var descLines = this.upgradeTextLines(ctx, card.desc || '强化已直接生效', slot.w - 38, descSize, '700').slice(0, compact ? 3 : 4);
    var descY = slot.y + (compact ? 194 : 280);
    for (var descIndex = 0; descIndex < descLines.length; descIndex++) {
      this.drawUpgradeText(ctx, descLines[descIndex], slot.x + slot.w * .5, descY + descIndex * (descSize + 4), descSize, '#f5eee0', 'center', '700');
    }
    A.rr(ctx, slot.x + slot.w * .5 - (compact ? 50 : 62), slot.y + slot.h - (compact ? 38 : 48), compact ? 100 : 124, compact ? 25 : 30, 12, 'rgba(53,108,72,.95)', '#9be0a2', 1.5);
    this.drawUpgradeText(ctx, '强化已生效', slot.x + slot.w * .5, slot.y + slot.h - (compact ? 25 : 33), compact ? 13 : 16, '#d8ffd4', 'center', '900');
    ctx.restore();
  };

  Game.prototype.eliteDrawEntry = function (card) {
    var source = YL.ROGUE_UPGRADES || [];
    for (var i = 0; i < source.length; i++) {
      if (source[i] && source[i].id === card.upgradeId) {
        return { upgrade: source[i], level: this.rogueLevel(card.upgradeId) };
      }
    }
    return null;
  };

  Game.prototype.eliteDrawRowSlot = function (index, count) {
    var scale = count <= 1 ? 1.04 : count === 2 ? .92 : count === 3 ? .84 : count === 4 ? .76 : .62;
    var w = 526 * scale, h = 164 * scale, step = h + 8;
    var total = h + Math.max(0, count - 1) * step;
    var top = Math.max(590, 840 - total * .5);
    return { x: (W - w) * .5, y: top + index * step, w: w, h: h, scale: scale };
  };

  Game.prototype.eliteDrawSignSlot = function (index, count) {
    var spacing = count === 1 ? 0 : count === 2 ? 206 : count === 3 ? 158 : count === 4 ? 136 : 112;
    return { x: W * .5 + (index - (count - 1) * .5) * spacing, y: 620 };
  };

  Game.prototype.drawEliteResultRow = function (ctx, card, slot, cardIndex) {
    var entry = this.eliteDrawEntry(card);
    if (!entry) return;
    ctx.save();
    ctx.translate(slot.x, slot.y);
    ctx.scale(slot.scale, slot.scale);
    this.drawTalismanRow(ctx, entry, cardIndex, 0, 0, 526, 164);
    ctx.restore();
  };

  Game.prototype.drawEliteDraw = function (ctx) {
    var state = this.eliteDrawState;
    if (!state) return;
    var timing = ELITE_DRAW_TIMING;
    var canContinue = state.t >= timing.revealEnd;
    ctx.save();
    ctx.fillStyle = 'rgba(2,7,13,.91)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(99,31,42,.20)'; ctx.fillRect(0, 0, W, 265);
    A.text(ctx, '精英掉落 · 煞签显现', W / 2, 58, 34, C.gold, 'center', '900');
    A.text(ctx, state.source && state.source.name ? state.source.name + ' 已伏 · 击杀奖励' : '击杀精英 · 获得强化签', W / 2, 94, 17, '#b9c8c1');

    // 先完整展示大签筒和筒内成束竹签，摇晃阶段持续 3.6 秒。
    var tubeX = W / 2, tubeY = 316;
    var tubeAsset = this.assets.eliteDrawTubeShake;
    var sealAsset = this.assets.eliteDrawSealBurst;
    var signAsset = this.assets.eliteDrawSignEject;
    var hasTubeAnimation = tubeAsset && (tubeAsset.width || tubeAsset.naturalWidth);
    var hasSealAnimation = sealAsset && (sealAsset.width || sealAsset.naturalWidth);
    var hasSignAnimation = signAsset && (signAsset.width || signAsset.naturalWidth);
    var introProgress = clamp(state.t / timing.introEnd, 0, 1);
    var introEase = 1 - Math.pow(1 - introProgress, 3);
    var tubeScale = .84 + introEase * .16;
    var tubeAlpha = 1 - clamp((state.t - timing.pauseEnd) / .62, 0, 1);
    var tubeFrame = state.t < timing.introEnd ? 0 : state.t < timing.shakeEnd
      ? Math.floor((state.t - timing.introEnd) / .10) % 8 : 7;
    if (hasSealAnimation && state.t >= timing.shakeEnd && state.t < timing.pauseEnd + .16) {
      var sealFrame = clamp(Math.floor((state.t - timing.shakeEnd) / .08), 0, 5);
      var sealFadeIn = clamp((state.t - timing.shakeEnd) / .08, 0, 1);
      var sealFadeOut = 1 - clamp((state.t - (timing.shakeEnd + .08)) / .20, 0, 1);
      ctx.save();
      ctx.globalAlpha = sealFadeIn * sealFadeOut * .88;
      ctx.globalCompositeOperation = 'lighter';
      A.atlasCell(ctx, sealAsset, 2, 3, sealFrame, tubeX - 142, tubeY - 142, 284, 284, false);
      ctx.restore();
    }
    if (tubeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = tubeAlpha;
      if (hasTubeAnimation) {
        A.atlasCell(ctx, tubeAsset, 2, 4, tubeFrame, tubeX - 160 * tubeScale, tubeY - 210 * tubeScale, 320 * tubeScale, 420 * tubeScale, false);
      } else {
        // 资源加载失败时保留一个放大的几何兜底，不影响抽签流程与结果数量。
        ctx.save();
        ctx.translate(tubeX, tubeY); ctx.scale(tubeScale, tubeScale);
        ctx.shadowColor = '#f4bd55'; ctx.shadowBlur = 22;
        A.rr(ctx, -90, -150, 180, 300, 28, 'rgba(28,24,22,.98)', '#f2bd65', 4);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f5d27f'; ctx.beginPath(); ctx.ellipse(0, -150, 94, 25, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8f522d'; ctx.lineWidth = 3; ctx.stroke();
        for (var fallbackSign = -2; fallbackSign <= 2; fallbackSign++) {
          ctx.save(); ctx.translate(fallbackSign * 20, -168 - Math.abs(fallbackSign) * 5);
          ctx.rotate(fallbackSign * .08); ctx.strokeStyle = '#d5ad64'; ctx.lineWidth = 10;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 76); ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = '#ffd878'; ctx.beginPath(); ctx.ellipse(0, 150, 94, 25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    var status = state.t < timing.shakeEnd ? '摇签中 · 筒内竹签同步晃动' :
      state.t < timing.pauseEnd ? '定签 · 签筒暂歇' : state.t < timing.ejectEnd ? '竹签出筒 · 横向排列' : '煞签落定 · 强化已生效';
    A.text(ctx, status, W / 2, 558, 20, state.t < timing.ejectEnd ? '#f8d98d' : '#bff5d1', 'center', '900');
    A.text(ctx, '本次摇出 ' + state.count + ' 根竹签 · 对应获得 ' + state.count + ' 道强化', W / 2, 589, 16, '#98aaa3');

    // 出签阶段：复用一根扁平竹片序列帧，按 1～5 根动态横向排开。
    var signCell = state.count >= 5 ? 152 : state.count === 4 ? 170 : 190;
    for (var sign = 0; sign < state.count; sign++) {
      var signSlot = this.eliteDrawSignSlot(sign, state.count);
      var signProgress = clamp((state.t - timing.pauseEnd - sign * .09) / .48, 0, 1);
      if (signProgress <= 0) continue;
      var signEase = 1 - Math.pow(1 - signProgress, 3);
      var signStartX = tubeX + (sign - (state.count - 1) * .5) * 10;
      var signStartY = tubeY - 138;
      var signX = signStartX + (signSlot.x - signStartX) * signEase;
      var signY = signStartY + (signSlot.y - signStartY) * signEase;
      var signFrame = clamp(Math.floor(signProgress * 8), 0, 7);
      var signAlpha = state.t < timing.ejectEnd ? 1 : 1 - clamp((state.t - timing.ejectEnd) / .68, 0, 1);
      ctx.save();
      ctx.globalAlpha = signAlpha;
      if (hasSignAnimation) {
        A.atlasCell(ctx, signAsset, 2, 4, signFrame, signX - signCell * .5, signY - signCell * .5, signCell, signCell, false);
      } else {
        ctx.save(); ctx.translate(signX, signY); ctx.rotate((1 - signProgress) * -.6);
        A.rr(ctx, -68, -13, 136, 26, 8, '#a9893f', '#f0cf76', 2);
        this.drawUpgradeText(ctx, '煞', 0, 1, 16, '#3b2a1a', 'center', '900');
        ctx.restore();
      }
      ctx.restore();
    }

    // 竹片横向停住后，逐根变宽、变亮，接管为强化预览横条。
    for (var i = 0; i < state.cards.length; i++) {
      var rowSlot = this.eliteDrawRowSlot(i, state.cards.length);
      var rowProgress = clamp((state.t - timing.ejectEnd - i * .08) / .62, 0, 1);
      if (rowProgress <= 0) continue;
      var rowEase = 1 - Math.pow(1 - rowProgress, 3);
      ctx.save();
      ctx.globalAlpha = rowEase;
      this.drawEliteResultRow(ctx, state.cards[i], rowSlot, i);
      ctx.restore();
    }

    A.button(ctx, state.continueRect.x, state.continueRect.y, state.continueRect.w, state.continueRect.h, canContinue ? '继续战斗' : '强化显现中…', canContinue, '#805b2a');
    A.text(ctx, canContinue ? '点击继续镇守' : '请稍候，竹签正在展开为强化', W / 2, 1252, 16, '#9eb7af');
    ctx.restore();
  };

  Game.prototype.wrapText = function (ctx, value, x, y, maxWidth, size, color) {
    var chars = value.split(''), line = '', lines = [];
    ctx.save(); ctx.font = '700 ' + size + 'px ' + uiFontFamily(size);
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = chars[i]; } else line = test;
    }
    if (line) lines.push(line); ctx.restore();
    for (var j = 0; j < lines.length; j++) A.text(ctx, lines[j], x, y + j * (size + 7), size, color);
  };

  Game.prototype.drawPause = function (ctx) {
    ctx.fillStyle = 'rgba(3,8,13,.86)'; ctx.fillRect(0, 0, W, H);
    A.panel(ctx, 135, 420, 480, 560, .99);
    A.text(ctx, '阵 法 暂 歇', W / 2, 510, 44, C.gold);
    A.text(ctx, '战斗已暂停', W / 2, 578, 24, C.paper);
    A.text(ctx, '场上御灵不能拖动', W / 2, 645, 21, '#a9c0b8');
    A.text(ctx, '魂归会回到整场开局时的初始布阵格', W / 2, 685, 21, '#a9c0b8');
    A.button(ctx, 225, 740, 300, 92, '继续镇魂', true, '#6d6440');
    A.button(ctx, 225, 850, 300, 72, '退出战斗', false, '#553439');
  };

  Game.prototype.drawInfo = function (ctx) {
    ctx.fillStyle = 'rgba(3,8,13,.80)'; ctx.fillRect(0, 0, W, H);
    if (this.infoOverlay === 'talismans') {
      this.drawTalismanOverlay(ctx);
      return;
    }
    if (this.infoOverlay === 'hero') {
      var inspected = this.getHero(this.inspectedHeroId);
      if (!inspected && this.heroes.length) inspected = this.heroes[0];
      this.drawHeroInspectRange(ctx, inspected);
      A.panel(ctx, 78, 808, 594, 220, .98);
      if (inspected) {
        var meta = HERO_META[inspected.type] || {};
        this.drawHeroPortrait(ctx, inspected, 132, 880, 38);
        A.text(ctx, inspected.name + ' · ' + (meta.factionName || meta.faction || inspected.faction) + ' / ' + (meta.job || inspected.job), 190, 858, 22, C.gold, 'left');
        A.text(ctx, '生命 ' + Math.ceil(inspected.hp) + ' / ' + inspected.maxHp + '    攻击 ' + Math.round(this.heroAttackPower(inspected)), 190, 892, 18, C.paper, 'left');
        A.text(ctx, '攻速 ' + (1 / Math.max(.01, inspected.attackInterval)).toFixed(2) + '/秒    范围 ' + (Math.round((inspected.attackRange || 0) / 150 * 10) / 10) + '格', 190, 924, 17, '#9db1aa', 'left');
        A.text(ctx, meta.role || '御灵', 190, 956, 17, HERO_META[inspected.type].color, 'left');
      }
      A.text(ctx, '点击任意处关闭', W / 2, 996, 16, '#80938e');
      return;
    }
    A.panel(ctx, 70, 190, 610, 790, .99);
    if (this.infoOverlay === 'data') {
      A.text(ctx, '战 斗 数 据', W / 2, 250, 38, C.gold);
      for (var i = 0; i < this.heroes.length; i++) {
        var hero = this.heroes[i], y = 340 + i * 105;
        this.drawHeroPortrait(ctx, hero, 135, y, 34);
        A.text(ctx, hero.name + ' · ' + hero.role, 190, y - 20, 21, C.paper, 'left');
        A.text(ctx, '伤害 ' + Math.round(hero.damageDone) + '  治疗 ' + Math.round(hero.healingDone), 190, y + 12, 17, '#9cb4ac', 'left');
        A.text(ctx, '魂归 ' + hero.deaths, 190, y + 38, 16, HERO_META[hero.type].color, 'left');
      }
      A.text(ctx, '主角技能释放 ' + Math.round((this.spellDamage.wind || 0) + (this.spellDamage.rain || 0)) + ' 次', W / 2, 900, 20, C.jade);
    } else {
      A.text(ctx, '本 关 怪 物', W / 2, 250, 38, C.gold);
      var enemies = this.currentWaveConfig && this.currentWaveConfig.enemies || {};
      var stage = this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave;
      A.text(ctx, '幽井村 ' + stage + ' · 本波编成', W / 2, 292, 20, C.paper);
      var entries = [];
      if (enemies.wisp) entries.push(['游魂 ×' + enemies.wisp, '速度快 · 血量低 · 数量多']);
      if (enemies.jiangshi) entries.push(['符尸 ×' + enemies.jiangshi, '近战压进 · 接敌后持续攻击']);
      if (enemies.armored) entries.push(['甲尸 ×' + enemies.armored, '高血高伤 · 加剧阵界压力']);
      if (enemies.swift) entries.push(['疾影 ×' + enemies.swift, '高速突进 · 优先关注边路']);
      if (enemies.boss) entries.push(['纸扎人 Boss ×' + enemies.boss, '召来替身 · 高血量 · 突破阵界压力大']);
      if (!entries.length) entries.push(['未知诡物', '本波暂无配置']);
      for (var e = 0; e < entries.length; e++) {
        var ey = 355 + e * 80;
        A.text(ctx, entries[e][0], 155, ey, 22, C.paper, 'left');
        A.text(ctx, entries[e][1], 265, ey, 18, '#9db1aa', 'left');
      }
      A.text(ctx, '首领技能：召来替身、持续压迫阵界', W / 2, 825, 20, C.gold);
      A.text(ctx, '敌人抵达七星灵灯后会持续破阵', W / 2, 870, 19, '#e99880');
    }
    A.text(ctx, '点击任意处关闭', W / 2, 945, 17, '#80938e');
  };

  Game.prototype.drawInfo = function (ctx) {
    ctx.fillStyle = 'rgba(3,8,13,.80)'; ctx.fillRect(0, 0, W, H);
    if (this.infoOverlay === 'talismans') {
      this.drawTalismanOverlay(ctx);
      return;
    }
    if (this.infoOverlay === 'hero') {
      var inspected = this.getHero(this.inspectedHeroId);
      if (!inspected && this.heroes.length) inspected = this.heroes[0];
      this.drawHeroInspectRange(ctx, inspected);
      A.panel(ctx, 78, 808, 594, 220, .98);
      if (inspected) {
        var meta = HERO_META[inspected.type] || {};
        this.drawHeroPortrait(ctx, inspected, 132, 880, 38);
        A.text(ctx, inspected.name + ' · ' + (meta.factionName || meta.faction || inspected.faction) + ' / ' + (meta.job || inspected.job), 190, 858, 22, C.gold, 'left');
        A.text(ctx, '生命 ' + Math.ceil(inspected.hp) + ' / ' + inspected.maxHp + '    攻击 ' + Math.round(this.heroAttackPower(inspected)), 190, 892, 18, C.paper, 'left');
        A.text(ctx, '攻速 ' + (1 / Math.max(.01, inspected.attackInterval)).toFixed(2) + '/秒    范围 ' + (Math.round((inspected.attackRange || 0) / 150 * 10) / 10) + '格', 190, 924, 17, '#9db1aa', 'left');
        A.text(ctx, meta.role || '御灵', 190, 956, 17, HERO_META[inspected.type].color, 'left');
      }
      A.text(ctx, '点击任意处关闭', W / 2, 996, 16, '#80938e');
      return;
    }
    A.panel(ctx, 70, 190, 610, 790, .99);
    if (this.infoOverlay === 'data') {
      A.text(ctx, '战斗数据', W / 2, 250, 38, C.gold);
      for (var i = 0; i < this.heroes.length; i++) {
        var hero = this.heroes[i], y = 330 + i * 104;
        this.drawHeroPortrait(ctx, hero, 135, y, 32);
        A.text(ctx, hero.name + ' · ' + hero.faction + ' / ' + hero.job, 190, y - 20, 20, C.paper, 'left');
        A.text(ctx, '伤害 ' + Math.round(hero.damageDone) + '  治疗 ' + Math.round(hero.healingDone), 190, y + 10, 17, '#9cb4ac', 'left');
        A.text(ctx, '魂归 ' + hero.deaths, 190, y + 36, 16, HERO_META[hero.type].color, 'left');
      }
      A.text(ctx, '主角技能释放 ' + Math.round((this.spellDamage.wind || 0) + (this.spellDamage.rain || 0)) + ' 次', W / 2, 900, 20, C.jade);
    } else {
      A.text(ctx, '本关怪物详情', W / 2, 250, 38, C.gold);
      var enemies = this.currentWaveConfig && this.currentWaveConfig.enemies || {};
      var stage = this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave;
      A.text(ctx, '幽野村 ' + stage + ' · 本波编成', W / 2, 292, 20, C.paper);
      var entries = [];
      if (enemies.wisp) entries.push(['符纸游魂 ×' + enemies.wisp, '普通怪 · 血量低 · 数量多 · 负责割草反馈']);
      if (enemies.jiangshi) entries.push(['镇魂甲尸 ×' + enemies.jiangshi, '精英怪 · 血厚 · 加剧阵界压力']);
      if (enemies.boss) entries.push(['纸扎魇主 ×' + enemies.boss, '终局 Boss · 召唤纸偶 · 红线点名 · 破阵压迫']);
      if (!entries.length) entries.push(['暂无怪物', '本波暂未配置']);
      for (var e = 0; e < entries.length; e++) {
        var ey = 365 + e * 86;
        A.text(ctx, entries[e][0], 135, ey, 22, C.paper, 'left');
        A.text(ctx, entries[e][1], 135, ey + 30, 17, '#9db1aa', 'left');
      }
      A.text(ctx, 'Boss 末波压轴出现；小怪清空后先结算最后一次强化。', W / 2, 830, 19, C.gold);
      A.text(ctx, '每波清完后可选择一项御灵强化。', W / 2, 872, 19, '#e99880');
    }
    A.text(ctx, '点击任意处关闭', W / 2, 945, 17, '#80938e');
  };

  Game.prototype.drawLegacyResult = function (ctx) {
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(4,9,14,.80)'; ctx.fillRect(0, 0, W, H);
    A.panel(ctx, 70, 130, 610, 1040, .96);
    A.text(ctx, this.win ? '诡 事 已 镇' : '五 灵 阵 破', W / 2, 220, 52, this.win ? C.gold : '#e87868');
    A.text(ctx, this.win ? '五灵归位，幽井村灯火未灭。' : '魂位尚在，重整之后仍可再战。', W / 2, 282, 23, C.paper);
    var startX = 145;
    for (var i = 0; i < this.heroes.length; i++) this.drawHeroPortrait(ctx, this.heroes[i], startX + i * 115, 405, 42);
    var rows = [
      ['镇守波次', this.wave + ' / ' + this.waveMax],
      ['镇伏诡物', this.kills + ''],
      ['御灵强化', this.upgradeCount + ' 次'],
      ['魂归次数', this.heroes.reduce(function (sum, h) { return sum + h.deaths; }, 0) + ' 次'],
      ['铜钱', this.coins + ''],
      ['总评分', this.finalScore + '']
    ];
    for (var r = 0; r < rows.length; r++) {
      var y = 515 + r * 70;
      ctx.strokeStyle = 'rgba(219,168,76,.24)'; ctx.beginPath(); ctx.moveTo(145, y + 31); ctx.lineTo(605, y + 31); ctx.stroke();
      A.text(ctx, rows[r][0], 170, y, 22, '#9eb3aa', 'left');
      A.text(ctx, rows[r][1], 580, y, 25, r === rows.length - 1 ? C.gold : C.white, 'right');
    }
    A.text(ctx, '本轮获得 · 御灵谱经验 +' + this.rewardXp, W / 2, 965, 22, C.jade);
    A.button(ctx, 150, 1080, 450, 105, this.win ? '再 镇 一 局' : '重 整 魂 位', true, '#a8492b');
    A.text(ctx, '失败仍按到达波次结算', W / 2, 1245, 18, '#89a39b');
  };

  Game.prototype.drawResultTitlePlaque = function (ctx) {
    var x = 92, y = 58, w = 566, h = 142;
    var plaque = this.assets.resultTitlePlaque;
    if (plaque && (plaque.width || plaque.naturalWidth)) {
      ctx.drawImage(plaque, x, y, w, h);
      return;
    }
    ctx.save();
    var wood = ctx.createLinearGradient(x, y, x, y + h);
    wood.addColorStop(0, '#4b3924'); wood.addColorStop(.48, '#211711'); wood.addColorStop(1, '#100f10');
    A.rr(ctx, x, y, w, h, 15, wood, '#b78638', 5);
    A.rr(ctx, x + 10, y + 11, w - 20, h - 22, 10, null, 'rgba(247,213,133,.52)', 2);
    ctx.strokeStyle = 'rgba(12,6,4,.72)'; ctx.lineWidth = 2;
    for (var grain = 0; grain < 7; grain++) {
      var gy = y + 26 + grain * 15;
      ctx.beginPath(); ctx.moveTo(x + 28, gy); ctx.quadraticCurveTo(W / 2, gy - 7 + (grain % 2) * 11, x + w - 28, gy); ctx.stroke();
    }
    ctx.fillStyle = '#c28e37'; ctx.fillRect(x + 22, y + 20, 13, h - 40); ctx.fillRect(x + w - 35, y + 20, 13, h - 40);
    ctx.fillStyle = 'rgba(92,36,21,.95)';
    ctx.fillRect(x + 24, y + h - 18, 9, 28); ctx.fillRect(x + w - 33, y + h - 18, 9, 28);
    ctx.restore();
  };

  Game.prototype.drawResultRewardStrip = function (ctx, result) {
    var x = 91, y = 604, w = 568, h = 86;
    var stripAsset = this.assets.resultRewardStrip;
    ctx.save();
    if (stripAsset && (stripAsset.width || stripAsset.naturalWidth)) ctx.drawImage(stripAsset, x, y, w, h);
    else {
      var strip = ctx.createLinearGradient(x, y, x, y + h);
      strip.addColorStop(0, 'rgba(49,42,28,.98)'); strip.addColorStop(1, 'rgba(13,22,25,.98)');
      A.rr(ctx, x, y, w, h, 8, strip, 'rgba(201,153,68,.80)', 3);
      A.rr(ctx, x + 7, y + 7, w - 14, h - 14, 5, null, 'rgba(237,205,138,.22)', 1);
      ctx.strokeStyle = 'rgba(220,170,75,.38)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2, y + 12); ctx.lineTo(W / 2, y + h - 12); ctx.stroke();
    }
    var rewards = result.rewards || [];
    for (var i = 0; i < rewards.length && i < 2; i++) {
      var reward = rewards[i], centerX = rewards.length === 1 ? W / 2 : (i === 0 ? 230 : 514);
      var amount = reward.amount * (result.adMultiplierState === 'claimed' && reward.doubleEligible ? 2 : 1);
      var iconX = rewards.length === 1 ? centerX - 88 : centerX - 92;
      var textX = rewards.length === 1 ? centerX + 20 : centerX + 10;
      this.drawResultRewardIcon(ctx, reward.id, iconX, y + 43, 47);
      A.text(ctx, reward.name + ' ×' + formatAmount(amount), textX, y + 45, 24, C.paper, 'center', '900');
    }
    ctx.restore();
  };

  Game.prototype.drawResultRewardIcon = function (ctx, rewardId, x, y, size) {
    var asset = rewardId === 'lingyun' ? this.assets.resultRewardLingyun : rewardId === 'talisman' ? this.assets.resultRewardTalisman : null;
    if (asset && (asset.width || asset.naturalWidth)) {
      drawCenteredImage(ctx, asset, x, y, size, size, 0, 1, 'source-over');
      return;
    }
    ctx.save();
    if (rewardId === 'lingyun') {
      var aura = ctx.createRadialGradient(x, y, 2, x, y, size * .7);
      aura.addColorStop(0, 'rgba(209,255,251,.90)'); aura.addColorStop(.36, 'rgba(73,216,177,.74)'); aura.addColorStop(1, 'rgba(36,119,125,0)');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(x, y, size * .7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#bafff2'; ctx.lineWidth = 2; ctx.shadowColor = '#38e5e1'; ctx.shadowBlur = 13;
      ctx.beginPath(); ctx.arc(x, y, size * .31, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(130,252,240,.64)'; ctx.beginPath(); ctx.arc(x, y, size * .22, 0, Math.PI * 2); ctx.fill();
    } else if (rewardId === 'talisman') {
      ctx.translate(x, y); ctx.rotate(-.22);
      A.rr(ctx, -size * .35, -size * .17, size * .7, size * .34, 7, '#e4c46b', '#7b421c', 2);
      ctx.strokeStyle = '#ad382a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-size * .22, 0); ctx.lineTo(size * .22, 0); ctx.stroke();
      ctx.strokeStyle = '#8c5728'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(size * .36, size * .08); ctx.quadraticCurveTo(size * .58, size * .18, size * .52, size * .46); ctx.stroke();
    } else {
      // 灵种先用 Canvas 灰盒表现：青玉种核、五瓣灵纹和建木根须，正式图标后续可单独替换。
      ctx.shadowColor = '#83f0d2'; ctx.shadowBlur = 12;
      var seed = ctx.createRadialGradient(x - size * .14, y - size * .18, 2, x, y, size * .42);
      seed.addColorStop(0, '#eaffd6'); seed.addColorStop(.35, '#7be0bb'); seed.addColorStop(1, '#217b73');
      ctx.fillStyle = seed;
      ctx.beginPath();
      ctx.moveTo(x, y - size * .43);
      ctx.bezierCurveTo(x + size * .34, y - size * .24, x + size * .31, y + size * .23, x, y + size * .42);
      ctx.bezierCurveTo(x - size * .31, y + size * .23, x - size * .34, y - size * .24, x, y - size * .43);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ddffe6'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = 'rgba(245,255,199,.88)'; ctx.lineWidth = 1.2;
      for (var petal = 0; petal < 5; petal++) {
        var angle = -Math.PI * .5 + petal * Math.PI * 2 / 5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * size * .22, y + Math.sin(angle) * size * .22); ctx.stroke();
      }
      ctx.strokeStyle = '#d0a34c'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - size * .20, y + size * .36); ctx.quadraticCurveTo(x, y + size * .18, x + size * .20, y + size * .36); ctx.stroke();
    }
    ctx.restore();
  };

  Game.prototype.drawResultReportPanel = function (ctx, result) {
    var x = 42, y = 716, w = 666, h = 426;
    var panelAsset = this.assets.resultReportPanel;
    ctx.save();
    if (panelAsset && (panelAsset.width || panelAsset.naturalWidth)) ctx.drawImage(panelAsset, x, y, w, h);
    else {
      var panel = ctx.createLinearGradient(x, y, x, y + h);
      panel.addColorStop(0, 'rgba(31,31,27,.98)'); panel.addColorStop(1, 'rgba(8,16,21,.98)');
      A.rr(ctx, x, y, w, h, 12, panel, '#8d632d', 4);
      A.rr(ctx, x + 10, y + 10, w - 20, h - 20, 8, null, 'rgba(237,210,142,.30)', 1.5);
    }
    ctx.strokeStyle = 'rgba(183,134,57,.34)'; ctx.lineWidth = 1;
    for (var line = 0; line < 6; line++) {
      var ly = 821 + line * 47;
      ctx.beginPath(); ctx.moveTo(x + 28, ly); ctx.lineTo(x + w - 28, ly); ctx.stroke();
    }
    A.text(ctx, '本 关 战 报', W / 2, 762, 35, '#deb35b', 'center', '900');
    ctx.strokeStyle = 'rgba(225,184,88,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(120, 762); ctx.lineTo(232, 762); ctx.moveTo(518, 762); ctx.lineTo(630, 762); ctx.stroke();
    for (var i = 0; i < result.damageRows.length; i++) this.drawResultDamageRow(ctx, result.damageRows[i], 798 + i * 47);
    ctx.strokeStyle = 'rgba(220,174,74,.42)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 22, 1080); ctx.lineTo(x + w - 22, 1080); ctx.stroke();
    A.text(ctx, '战斗时长', 114, 1107, 19, C.paper, 'center', '900');
    A.text(ctx, formatClock(result.durationSeconds), 240, 1107, 29, C.jade, 'center', '900');
    A.text(ctx, '击败', 380, 1107, 19, C.paper, 'center', '900');
    A.text(ctx, formatAmount(result.kills), 465, 1107, 29, C.jade, 'center', '900');
    A.text(ctx, '阵法剩余', 584, 1107, 19, C.paper, 'center', '900');
    A.text(ctx, Math.round(result.baseHp / Math.max(1, result.baseMax) * 100) + '%', 657, 1107, 29, C.jade, 'center', '900');
    ctx.restore();
  };

  Game.prototype.drawResultDamageRow = function (ctx, row, y) {
    var colors = { protagonist: '#52d8cc', huangjin: '#deb14d', hongyi: '#da6953', xuanya: '#6b9bc6', qingyi: '#ded19b', suwen: '#78d5a7', empty: '#64645f' };
    var color = colors[row.type] || C.paper;
    if (row.type === 'protagonist') {
      var mark = this.assets.resultProtagonistMark;
      if (mark && (mark.width || mark.naturalWidth)) drawCenteredImage(ctx, mark, 91, y, 46, 46, 0, 1, 'source-over');
      else {
        ctx.save(); ctx.beginPath(); ctx.arc(91, y, 23, 0, Math.PI * 2); ctx.fillStyle = '#0b2327'; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
        A.text(ctx, '主', 91, y + 1, 22, color, 'center', '900'); ctx.restore();
      }
    } else if (row.hero) {
      this.drawHeroPortrait(ctx, row.hero, 91, y, 21);
    } else {
      ctx.save(); ctx.beginPath(); ctx.arc(91, y, 21, 0, Math.PI * 2); ctx.fillStyle = 'rgba(13,16,17,.90)'; ctx.fill(); ctx.strokeStyle = '#5a5952'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    A.text(ctx, row.name, 132, y, 23, row.type === 'empty' ? '#9b9481' : C.paper, 'left', '900');
    A.bar(ctx, 241, y - 8, 220, 16, row.ratio, 1, color, 'rgba(0,0,0,.60)');
    A.text(ctx, formatAmount(row.damage), 565, y, 22, row.type === 'empty' ? '#a39b8b' : C.paper, 'right', '900');
    A.text(ctx, Math.round(row.ratio * 100) + '%', 654, y, 22, row.type === 'empty' ? '#77766e' : color, 'right', '900');
  };

  Game.prototype.drawResultButtons = function (ctx, result) {
    var adState = result.adMultiplierState;
    var adEnabled = adState === 'available';
    this.drawResultButton(ctx, 89, 1181, 270, 91, '看广告双倍', 'resultButtonAd', adEnabled);
    this.drawResultButton(ctx, 391, 1181, 270, 91, '确 定', 'resultButtonConfirm', true);
    if (adState === 'claimed') A.text(ctx, '已双倍', 224, 1264, 15, C.jade, 'center', '900');
    if (this.resultNotice && this.time < this.resultNoticeUntil) A.text(ctx, this.resultNotice, W / 2, 1303, 17, '#b9d7cc');
  };

  Game.prototype.drawResultButton = function (ctx, x, y, w, h, label, assetKey, active) {
    ctx.save();
    var asset = this.assets[assetKey];
    if (!active) ctx.globalAlpha = .48;
    if (asset && (asset.width || asset.naturalWidth)) ctx.drawImage(asset, x, y, w, h);
    else {
      var isAd = assetKey === 'resultButtonAd';
      var button = ctx.createLinearGradient(x, y, x, y + h);
      button.addColorStop(0, isAd ? '#176f70' : '#d09836'); button.addColorStop(1, isAd ? '#142e31' : '#754116');
      A.rr(ctx, x, y, w, h, 12, button, isAd ? '#66eee0' : '#f1c765', 4);
      A.rr(ctx, x + 8, y + 8, w - 16, h - 16, 8, null, 'rgba(255,244,192,.34)', 1.5);
    }
    if (assetKey === 'resultButtonAd') {
      var playMark = this.assets.resultPlayMark;
      if (playMark && (playMark.width || playMark.naturalWidth)) drawCenteredImage(ctx, playMark, x + 41, y + h / 2, 31, 31, 0, 1, 'source-over');
      else A.text(ctx, '▶', x + 41, y + h / 2 + 1, 23, '#e9f9cb', 'center', '900');
    }
    A.text(ctx, label, x + w / 2 + (assetKey === 'resultButtonAd' ? 14 : 0), y + h / 2 + 1, 30, active ? C.white : '#9da8a5', 'center', '900');
    ctx.restore();
  };

  Game.prototype.drawResult = function (ctx) {
    if (!this.battleResult) { this.drawLegacyResult(ctx); return; }
    // 胜负结算共用同一真实战场、遮罩和面板；只替换标题、中心资源和来自快照的奖励/数据。
    this.drawBattle(ctx);
    var shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(2,8,13,.82)'); shade.addColorStop(.45, 'rgba(4,13,18,.73)'); shade.addColorStop(1, 'rgba(2,8,13,.90)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    this.drawResultTitlePlaque(ctx);
    var isWin = !!this.battleResult.win;
    A.text(ctx, isWin ? '镇魂成功' : '阵法失守', W / 2, 128, 60, isWin ? '#f0c667' : '#d98d74', 'center', '900');
    A.text(ctx, '幽野村  ' + this.battleResult.stageId, W / 2, 231, 29, C.paper, 'center', '900');
    ctx.save();
    ctx.strokeStyle = 'rgba(218,169,75,.62)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(134, 231); ctx.lineTo(250, 231); ctx.moveTo(500, 231); ctx.lineTo(616, 231); ctx.stroke();
    ctx.restore();
    var glow = isWin ? this.assets.resultSealSuccessGlow : this.assets.resultSealFailureGlow;
    var seal = isWin ? this.assets.resultSealSuccess : this.assets.resultSealFailure;
    var glowAlpha = isWin ? .8 + Math.sin(this.time * 2.2) * .14 : .34 + Math.sin(this.time * 1.1) * .05;
    if (glow && (glow.width || glow.naturalWidth)) drawCenteredImage(ctx, glow, W / 2, 426, 390, 390, 0, glowAlpha, 'screen');
    if (seal && (seal.width || seal.naturalWidth)) drawCenteredImage(ctx, seal, W / 2, 426, 354, 354, 0, 1, 'source-over');
    else {
      ctx.save(); ctx.strokeStyle = isWin ? '#c99f52' : '#7d5740'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(W / 2, 426, 122, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = isWin ? 'rgba(63,206,200,.22)' : 'rgba(34,53,58,.18)'; ctx.beginPath(); ctx.arc(W / 2, 426, 112, 0, Math.PI * 2); ctx.fill(); A.text(ctx, isWin ? '镇' : '破', W / 2, 426, 82, isWin ? '#e8c162' : '#aa7d62', 'center', '900'); ctx.restore();
    }
    this.drawResultRewardStrip(ctx, this.battleResult);
    this.drawResultReportPanel(ctx, this.battleResult);
    this.drawResultButtons(ctx, this.battleResult);
    if (YL.TutorialUI && YL.TutorialUI.draw) YL.TutorialUI.draw(this, ctx);
  };

  YL.Game = Game;
}(typeof globalThis !== 'undefined' ? globalThis : this));
