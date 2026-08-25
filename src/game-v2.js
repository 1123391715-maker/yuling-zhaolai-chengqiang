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
  function spellCost(key) {
    return SPELL_META[key] && SPELL_META[key].cost || 1;
  }
  function spiritLampTuning() {
    var tuning = battleTuning();
    return tuning.spiritLamp || tuning.lamp || {};
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
      attack: ['斩击伤害 +25%', '对精英与首领增伤 +35%', '斩击追加一道鸦影'],
      passive: ['每四击必定暴击', '生命低于 35% 时闪避提升', '处决生命低于 15% 的非首领'],
      ultimate: ['影袭额外攻击一次', '优先锁定精英并破甲', '影袭结束后获得无敌']
    },
    huangjin: {
      name: '黄巾', role: '铁壁守卫', color: C.gold, sprite: 'heroHuangjin', icon: 6,
      attack: ['盾击：100% 攻击伤害', '盾击命中 30% 概率击退半格', '巨盾挥砸前方敌人'],
      passive: ['不动如山：每存活 10 秒防御 +8%', '最多 5 层，魂归后保留层数', '满层防御力共 +40%'],
      ultimate: ['坚壁领域：获得 30% 最大生命护盾', '护盾存在时同列友方减伤 25%', '释放瞬间获得 0.15 秒无敌']
    },
    suwen: {
      name: '素问', role: '治疗守护', color: C.jade, sprite: 'heroSuwen', icon: 7,
      attack: ['灵灯伤害 +25%', '灵灯命中为最低血御灵治疗', '灵灯弹射一次并治疗两人'],
      passive: ['治疗量 +25%', '治疗附加短时护盾', '魂归结束时治疗全队'],
      ultimate: ['回春术治疗量 +35%', '回春术覆盖全队', '回春术令一名魂归御灵提前返场']
    },
    qingyi: {
      name: '青衣', role: '减速控场', color: C.blue, sprite: 'heroQingyi', icon: 2,
      attack: ['水刃伤害 +25%', '水刃减速时间 +2 秒', '水刃命中产生寒潮'],
      passive: ['减速强度提高', '每五击击退目标', '被减速敌人受到伤害提高 15%'],
      ultimate: ['渡水锋伤害 +35%', '渡水锋冻结普通敌人', '渡水锋往返斩击两次']
      , name: '青衣', role: '圣光祭司', color: '#f7e6a3',
      attack: ['圣光弹：80% ATK 伤害', '每 1.11 秒发射一次', '弹道速度 380px/s'],
      passive: ['圣光眷顾：每 3 秒治疗最低血量队友', '治疗量：100% ATK', '只治疗非满血单位'],
      ultimate: ['群体治愈：全队回复 200% ATK', '获得治疗量 50% 的护盾，持续 4 秒', '圣光庇护：周围 2 格治疗 +30%']
    }
  };

  var BOARD_H = 960;
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
      slot: 0, hp: 450, block: 1, search: 450, range: 450, move: 50,
      damage: 100, attackInterval: 1.11, attackMultiplier: 1,
      attackType: 'ranged', projectile: 350, attackWindup: .3, attackRecovery: .35,
      defenseStat: 15, ultimate: 18, scale: .70
    },
    xuanya: {
      slot: 1, hp: 560, block: 2, search: 185, range: 58, move: 126,
      damage: 76, attackInterval: .82, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .2, attackRecovery: .34,
      ultimate: 13, scale: .72
    },
    huangjin: {
      slot: 2, hp: 1000, block: 3, search: 180, range: 92, move: 50,
      damage: 40, attackInterval: 1.25, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .25, attackRecovery: .35,
      defenseStat: 60, ultimate: 14, scale: .75
    },
    suwen: {
      slot: 3, hp: 470, block: 1, search: 195, range: 205, move: 88,
      damage: 34, attackInterval: 1.20, attackMultiplier: 1,
      attackType: 'ranged', projectile: 460, ultimate: 14, scale: .68
    },
    qingyi: {
      slot: 4, hp: 600, block: 1, search: 300, range: 300, move: 80,
      damage: 35, attackInterval: 1.11, attackMultiplier: .8,
      attackType: 'ranged', projectile: 380, attackWindup: .26, attackRecovery: .35,
      defenseStat: 35, ultimate: 13, scale: .69
    }
  };
  HERO_META = {
    hongyi: {
      name: '红衣', faction: '鬼族', job: '输出', role: '焚火术士',
      color: C.fire, sprite: 'heroHongyi', icon: 0
    },
    xuanya: {
      name: '玄鸦', faction: '妖族', job: '战士', role: '鸦影战士',
      color: '#d9c7a6', sprite: 'heroXuanya', icon: 4
    },
    huangjin: {
      name: '黄巾', faction: '人族', job: '坦克', role: '铁壁守卫',
      color: C.gold, sprite: 'heroHuangjin', icon: 6
    },
    suwen: {
      name: '素问', faction: '神', job: '输出', role: '太素星使',
      color: C.jade, sprite: 'heroSuwen', icon: 7
    },
    qingyi: {
      name: '青衣', faction: '修士', job: '辅助', role: '圣光祭司',
      color: '#f7e6a3', sprite: 'heroQingyi', icon: 2
    }
  };

  DEFAULT_HERO_STATS = {
    hongyi: {
      slot: 0, hp: 450, block: 1, search: 680, range: 450, move: 14,
      damage: 100, attackInterval: 1.11, attackMultiplier: 1,
      attackType: 'ranged', projectile: 350, attackWindup: .30, attackRecovery: .35,
      defenseStat: 15, ultimate: 18, scale: .56
    },
    xuanya: {
      slot: 1, hp: 720, block: 2, search: 430, range: 96, move: 60,
      damage: 78, attackInterval: .87, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .18, attackRecovery: .28,
      defenseStat: 28, ultimate: 15, scale: .58
    },
    huangjin: {
      slot: 2, hp: 1000, block: 3, search: 430, range: 96, move: 22,
      damage: 40, attackInterval: 1.25, attackMultiplier: 1,
      attackType: 'melee', attackWindup: .25, attackRecovery: .35,
      defenseStat: 60, ultimate: 14, scale: .60
    },
    suwen: {
      slot: 3, hp: 520, block: 1, search: 680, range: 450, move: 14,
      damage: 82, attackInterval: 1.18, attackMultiplier: .9,
      attackType: 'ranged', projectile: 430, attackWindup: .26, attackRecovery: .34,
      defenseStat: 20, ultimate: 17, scale: .56
    },
    qingyi: {
      slot: 4, hp: 600, block: 1, search: 430, range: 300, move: 14,
      damage: 35, attackInterval: 1.11, attackMultiplier: .8,
      attackType: 'ranged', projectile: 380, attackWindup: .26, attackRecovery: .35,
      defenseStat: 35, ultimate: 13, scale: .56
    }
  };

  var UPGRADE_TYPE_LABELS = { common: '通用', faction: '阵营', exclusive: '专属' };
  var RARITY_LABELS = { common: '普通', rare: '稀有', legendary: '传说' };
  var RARITY_COLORS = { common: '#d7e2d2', rare: '#7de7ff', legendary: '#ffd36e' };
  var FACTION_COLORS = { '人族': C.gold, '修士': '#f7e6a3', '妖族': '#d9c7a6', '鬼族': C.fire, '神': C.jade, '魔': '#c46cff' };
  var FORMATION_ICON = {
    faction: { '人族': 0, '修士': 1, '妖族': 2, '鬼族': 3, '神': 4, '魔': 3 },
    job: { '坦克': 5, '战士': 6, '输出': 7, '辅助': 8 },
    monster: 9, recommend: 10, start: 11, empty: 12, filter: 13, star: 14, check: 15
  };
  var FORMATION_CARD_TYPES = ['huangjin', 'hongyi', 'qingyi', 'xuanya', 'suwen'];
  var FORMATION_GRID = { x: 64, y: 338, w: 622, h: 348, cols: 5, rows: 3 };
  var FORMATION_CARD_AREA = { x: 26, y: 836, w: 698, h: 296 };
  var FORMATION_START = { x: 170, y: 1192, w: 410, h: 104 };

  var SPELL_KEYS = ['fire', 'bell', 'water'];
  var SPELL_META = {
    fire: {
      name: '符火咒', icon: 0, color: C.fire, cost: 2,
      desc: ['引燃敌群中心，造成范围火焰伤害。', '自动：敌人数量 ≥ 3 时释放。']
    },
    bell: {
      name: '镇魂铃', icon: 1, color: C.gold, cost: 3,
      desc: ['震慑全场敌人，造成小额伤害并减速。', '自动：敌人较多或阵法危急时释放。']
    },
    water: {
      name: '渡水符', icon: 2, color: C.blue, cost: 2,
      desc: ['沿威胁最高敌人所在列释放水锋。', '自动：有敌人时优先打最危险一路。']
    }
  };
  var SPELL_POS = {
    fire: { x: 436, y: 1262 },
    bell: { x: 540, y: 1262 },
    water: { x: 644, y: 1262 }
  };
  var AUTO_CAST_BUTTON = { x: 718, y: 1262, r: 30 };
  var TALISMAN_BUTTON = { x: 684, y: 386, w: 54, h: 66 };
  // Generated panel aspect is 849:1421. Keep this exact ratio at runtime so
  // its circular close mount and bronze edging never stretch on tall screens.
  var TALISMAN_MODAL = { x: 72, y: 118, w: 606, h: 1014 };
  var TALISMAN_ROWS = { x: 112, y: 422, w: 526, h: 164, step: 176, visible: 3 };
  var SPIRIT_LAMP_MAX = 7;
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
      stars: { x: -21, y: 17 }, title: { x: -20, y: 11 },
      icon: { x: -21, y: -3 }, tag: { x: -20, y: -2 },
      desc: { x: -15, y: 32 }
    },
    legendary: {
      stars: { x: -3, y: 18 }, title: { x: -4, y: 10 },
      icon: { x: -3, y: -2 }, tag: { x: -7, y: 0 }
    }
  };
  // Bump the key when source defaults change, so an earlier editor session
  // cannot accidentally re-apply its offsets over the approved layout.
  var UPGRADE_CARD_EDITOR_STORAGE = 'yl-upgrade-card-layout-v2';

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
    this.inspectedHeroId = null;
    this.spellHelpKey = null;
    this.spellHelpTime = 0;
    this.spellAuto = true;
    this.paused = false;
    this.infoOverlay = null;
    this.talismanHeroId = null;
    this.talismanScroll = 0;
    this.talismanOverlayWasPaused = false;
    this.formationSlots = [];
    this.formationSelected = null;
    this.formationNotice = '';
    this.formationNoticeTime = 0;
    this.cardUiTuning = this.loadCardUiTuning();
    this.cardEditor = { enabled: false, drag: null, dirty: false };
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
      this.dpr = Math.min(2, root.devicePixelRatio || 1);
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

  Game.prototype.loadAssets = function () {
    var self = this, keys = Object.keys(YL.ASSETS);
    this.loadTotal = keys.length;
    keys.forEach(function (key) {
      var img = self.makeImage();
      if (!img) { self.loaded++; return; }
      img.onload = function () { self.loaded++; if (self.loaded >= self.loadTotal) self.state = 'title'; };
      img.onerror = function () { self.loaded++; if (self.loaded >= self.loadTotal) self.state = 'title'; };
      img.src = YL.ASSETS[key];
      self.assets[key] = img;
    });
    setTimeout(function () { if (self.state === 'loading') self.state = 'title'; }, 4500);
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
    var rarity = UPGRADE_CARD_FRAME_CROPS[card.rarity] ? card.rarity : 'common';
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
    var text = '/* 粘贴到 game-v2.js 的 UPGRADE_CARD_UI_TUNING */\n' + JSON.stringify(this.cardUiTuning || {}, null, 2);
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
    var drag = this.cardEditor && this.cardEditor.drag;
    if (!drag) return;
    var offset = this.cardUiOffset(drag.rarity, drag.part);
    this.setCardUiOffset(drag.rarity, drag.part, offset.x + x - drag.x, offset.y + y - drag.y);
    drag.x = x; drag.y = y;
  };

  Game.prototype.onDown = function (x, y) {
    this.audio.unlock();
    if (this.state === 'title') {
      if (y > 1030 && y < 1165) { this.audio.tone('bell'); this.openFormation(); }
      return;
    }
    if (this.state === 'formation') {
      this.onFormationDown(x, y);
      return;
    }
    if (this.state === 'result') {
      if (y > 1080 && y < 1205) { this.audio.tone('bell'); this.openFormation(); }
      return;
    }
    if (this.state !== 'battle') return;
    if (this.infoOverlay === 'talismans') { this.onTalismanDown(x, y); return; }
    if (this.infoOverlay) { this.infoOverlay = null; this.inspectedHeroId = null; return; }
    if (this.paused) {
      if (x > 225 && x < 525 && y > 735 && y < 835) this.paused = false;
      return;
    }
    if (this.phase === 'cards') {
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
      else if (action === 2) this.speed = this.speed >= 3 ? 1 : this.speed + 1;
      else if (action === 3) this.openTalismanOverlay();
      return;
    }
    var spellKey = this.spellKeyAt(x, y);
    if (spellKey && this.phase === 'wave') {
      this.spellPress = { key: spellKey, start: this.time, long: false };
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
    if (this.state === 'formation') return;
    if (this.state !== 'battle') return;
    if (this.cardEditor && this.cardEditor.drag) {
      this.cardEditor.drag = null;
      this.saveCardUiTuning();
      return;
    }
    if (this.phase === 'cards') {
      this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
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
    return dist2(x, y, AUTO_CAST_BUTTON.x, AUTO_CAST_BUTTON.y) < AUTO_CAST_BUTTON.r * AUTO_CAST_BUTTON.r;
  };

  Game.prototype.sideActionAt = function (x, y) {
    if (x < 684 || x > 738) return -1;
    var ys = [128, 214, 300, TALISMAN_BUTTON.y];
    for (var i = 0; i < ys.length; i++) if (y >= ys[i] && y <= ys[i] + 66) return i;
    return -1;
  };

  Game.prototype.spellKeyAt = function (x, y) {
    for (var i = 0; i < SPELL_KEYS.length; i++) {
      var key = SPELL_KEYS[i], pos = SPELL_POS[key];
      if (pos && dist2(x, y, pos.x, pos.y) < 36 * 36) return key;
    }
    return null;
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

  Game.prototype.updateSpellPress = function () {
    if (!this.spellPress || !this.pointer.down) return;
    if (this.time - this.spellPress.start >= .45) {
      this.spellPress.long = true;
      this.showSpellHelp(this.spellPress.key, .35);
    }
  };

  Game.prototype.updateHeroPress = function () {
    if (!this.heroPress || !this.pointer.down || this.infoOverlay || this.dragDeploy || this.spellPress) return;
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

  Game.prototype.openFormation = function () {
    this.state = 'formation';
    this.paused = false;
    this.infoOverlay = null;
    this.inspectedHeroId = null;
    this.dragSoul = null;
    this.dragDeploy = null;
    this.spellPress = null;
    this.formationSlots = [];
    this.formationSelected = null;
    this.formationNotice = '点击下方卡牌上阵御灵';
    this.formationNoticeTime = 2.2;
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

  Game.prototype.formationCardRect = function (index) {
    var count = this.formationCardTypes().length;
    var w = count > 4 ? 128 : 150, gap = count > 4 ? 10 : 18;
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
    var stats = this.configuredHeroStats(type);
    var preferred = this.configuredHeroGridIndex(stats, slot);
    if (!this.formationSlotForGrid(preferred)) return preferred;
    var order = [2, 1, 3, 10, 14, 6, 8, 11, 12, 13, 0, 4, 5, 7, 9];
    for (var i = 0; i < order.length; i++) if (!this.formationSlotForGrid(order[i])) return order[i];
    return -1;
  };

  Game.prototype.setFormationNotice = function (text, time) {
    this.formationNotice = text;
    this.formationNoticeTime = time || 1.8;
  };

  Game.prototype.toggleFormationHero = function (type) {
    var existing = this.formationSlotForType(type), meta = HERO_META[type];
    if (existing) {
      removeFrom(this.formationSlots, existing);
      if (this.formationSelected === type) this.formationSelected = null;
      this.setFormationNotice(meta.name + ' 已下阵');
      this.audio.tone('shoot');
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
    this.setFormationNotice(meta.name + ' 上阵：' + ANCHORS[gridIndex].name);
    this.audio.tone('bell');
  };

  Game.prototype.onFormationDown = function (x, y) {
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
      if (occupant) {
        this.formationSelected = occupant.type;
        this.setFormationNotice(HERO_META[occupant.type].name + ' 已选中，点击空格可调整阵位', 1.6);
        this.audio.tone('shoot');
        return;
      }
      if (this.formationSelected) {
        var selected = this.formationSlotForType(this.formationSelected);
        if (selected) {
          selected.gridIndex = gridIndex;
          this.setFormationNotice(HERO_META[selected.type].name + ' 调整到 ' + ANCHORS[gridIndex].name);
          this.audio.tone('bell');
        }
      }
      return;
    }
    if (inRect(x, y, FORMATION_START)) {
      if (!this.formationSlots.length) {
        this.setFormationNotice('至少选择 1 名御灵才能开阵', 2);
        this.audio.tone('hurt');
        return;
      }
      this.audio.tone('bell');
      this.beginBattle(this.formationSlots);
    }
  };

  Game.prototype.configuredHeroStats = function (type) {
    var base = DEFAULT_HERO_STATS[type] || {}, tune = battleTuning().hero || {};
    var custom = tune.stats && tune.stats[type] || {};
    var stats = {}, k;
    for (k in base) stats[k] = base[k];
    for (k in custom) stats[k] = custom[k];
    return stats;
  };

  Game.prototype.configuredRoster = function () {
    var tune = battleTuning().hero || {};
    var roster = tune.roster && tune.roster.length ? tune.roster.slice() : ['huangjin'];
    var result = [];
    for (var i = 0; i < roster.length && result.length < SOUL_SLOTS.length; i++) {
      if (HERO_META[roster[i]]) result.push(roster[i]);
    }
    return result.length ? result : ['huangjin'];
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
    return {
      id: this.idSeed++, type: type, name: meta.name, role: meta.role,
      faction: meta.faction, job: meta.job,
      soulSlot: slot, soulAnchorIndex: gridIndex, anchorIndex: gridIndex, x: anchor.x, y: anchor.y,
      hp: stats.hp, maxHp: stats.hp, shield: 0, defense: stats.defense || 0,
      defenseStat: stats.defenseStat || 0, defenseStacks: 0, survivalTime: 0,
      baseHp: stats.hp, baseDamage: stats.damage, baseDefenseStat: stats.defenseStat || 0,
      baseBlock: stats.block, baseAttackInterval: stats.attackInterval || attack.interval || 1,
      baseUltimateMax: stats.ultimate, baseProjectileSpeed: stats.projectile == null ? (attack.projectileSpeed || 0) : stats.projectile,
      block: stats.block, search: stats.search, attackRange: stats.range == null ? attack.range : stats.range,
      moveSpeed: stats.move, damage: stats.damage,
      attackInterval: stats.attackInterval || attack.interval || 1,
      attackMultiplier: stats.attackMultiplier == null ? (attack.multiplier == null ? 1 : attack.multiplier) : stats.attackMultiplier,
      attackType: attackType, attackFacing: 1,
      attackWindupDuration: windup,
      projectileSpeed: stats.projectile == null ? (attack.projectileSpeed || 0) : stats.projectile, alive: true, respawn: 0,
      soulReturn: null,
      respawnMax: 8, invuln: 1.2, target: null, attackCd: Math.random() * .4,
      attackWindup: 0, pendingTarget: null,
      ultimateCd: stats.ultimate, ultimatePrevCd: stats.ultimate, ultimateMax: stats.ultimate,
      healCd: type === 'qingyi' || type === 'suwen' ? valueOr(skill.passive && skill.passive.cooldown, type === 'suwen' ? 6 : 3) : 2.5, attackCount: 0, flash: 0, hitReact: 0, attackAnim: 0, attackDuration: .38, hitHold: 0, shieldFlash: 0,
      attackRecoveryDuration: stats.attackRecovery || (attackType === 'ranged' ? .36 : .3),
      skillReadyFlash: 0, skillCastFlash: 0,
      wallBarrierTime: 0, wallBarrierShield: 0, wallBarrierReduction: .25,
      holyShieldTime: 0, holyShield: 0,
      scale: stats.scale || .72, blocked: [], damageDone: 0, healingDone: 0,
      blockedTotal: 0, deaths: 0, upgrades: { attack: 0, passive: 0, ultimate: 0 }
    };
  };

  Game.prototype.beginBattle = function (formationSlots) {
    this.state = 'battle'; this.phase = 'wave'; this.paused = false; this.infoOverlay = null; this.inspectedHeroId = null;
    this.wave = 1; this.waveMax = YL.WAVE_CONFIG && YL.WAVE_CONFIG.length ? YL.WAVE_CONFIG.length : 20; this.speed = 1; this.gameTime = 0;
    this.baseMax = 1000; this.baseHp = this.baseMax; this.score = 0; this.coins = 0;
    this.kills = 0; this.totalDamage = 0; this.totalHealing = 0; this.idSeed = 1;
    this.level = 1; this.xp = 0; this.xpNeed = 1; this.pendingLevels = 0; this.upgradeCount = 0;
    this.rogueLevels = {}; this.upgradeAcquireOrder = []; this.waveReviveUsed = false; this.baseBaseMax = 1000;
    this.talismanHeroId = null; this.talismanScroll = 0; this.talismanOverlayWasPaused = false;
    this.spellDiscountWave = 0; this.killHealCounter = 0;
    this.nextWaveShowcase = null; this.activeWaveShowcase = null;
    this.waveKills = 0; this.waveProgress = 0; this.waveProgressFlash = 0;
    this.enemies = []; this.projectiles = []; this.particles = []; this.floaters = []; this.zones = [];
    this.pendingCards = []; this.waveQueue = []; this.intermission = 0;
    this.skillVignette = null;
    this.waveBanner = 2.2; this.messageTime = 5; this.message = '布阵完成 · 魂位已锁定';
    var lampTune = spiritLampTuning();
    this.spiritLampMax = valueOr(lampTune.max, SPIRIT_LAMP_MAX);
    this.spiritLampInterval = valueOr(lampTune.interval, 5);
    this.spiritLampLit = clamp(valueOr(lampTune.initial, 1), 0, this.spiritLampMax) | 0;
    this.spiritLampTimer = 0; this.spiritLampPulse = 0; this.spiritLampHit = 0;
    this.spellCd = { fire: 0, bell: 0, water: 0 };
    this.spellMax = { fire: 0, bell: 0, water: 0 };
    this.spellDamage = { fire: 0, bell: 0, water: 0 };
    this.spellAuto = false; this.spellPress = null; this.spellHelpKey = null; this.spellHelpTime = 0;
    this.heroes = [];
    var layout = formationSlots && formationSlots.length ? formationSlots.slice(0, SOUL_SLOTS.length) : null;
    var roster = layout || this.configuredRoster().map(function (type) { return { type: type, gridIndex: null }; });
    for (var r = 0; r < roster.length; r++) {
      var type = roster[r].type || roster[r], stats = this.configuredHeroStats(type);
      if (roster[r].gridIndex != null) stats.gridIndex = clamp(roster[r].gridIndex | 0, 0, ANCHORS.length - 1);
      var slot = layout ? r : clamp(stats.slot == null ? r : stats.slot, 0, SOUL_SLOTS.length - 1) | 0;
      this.heroes.push(this.makeHero(type, slot, stats));
    }
    this.refreshUpgradeDerivedStats(true);
    this.startWave(1);
  };

  Game.prototype.startWave = function (number) {
    this.wave = number; this.phase = 'wave'; this.waveBanner = 1.65; this.spawnTimer = .35;
    this.enemyClusterLane = (Math.random() * GRID_COLS.length) | 0;
    this.waveQueue = []; this.waveKills = 0; this.waveProgress = 0; this.waveProgressFlash = 0; this.waveUpgradeOffered = false;
    this.waveReviveUsed = false; this.spellDiscountWave = 0;
    for (var resetHero = 0; resetHero < this.heroes.length; resetHero++) this.heroes[resetHero].firstHitGuardUsed = false;
    var fallback = { stage: '1-' + number, spawnInterval: Math.max(.34, .65 - number * .012), enemies: { wisp: 4 + Math.floor(number * .55) } };
    var config = YL.WAVE_CONFIG && YL.WAVE_CONFIG[number - 1] ? YL.WAVE_CONFIG[number - 1] : fallback;
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
      if (this.waveQueue[totalIndex].type !== 'gap') this.waveTotal++;
    }
    this.activeWaveShowcase = this.nextWaveShowcase;
    this.nextWaveShowcase = null;
    if (this.activeWaveShowcase) {
      this.message = '新强化演练：' + this.activeWaveShowcase.name;
      this.messageTime = 2.2;
    }
  };

  Game.prototype.pickEnemyLane = function () {
    var density = enemyDensityTuning();
    if (this.enemyClusterLane == null || Math.random() < (density.clusterLaneChangeChance == null ? .14 : density.clusterLaneChangeChance)) {
      this.enemyClusterLane = (Math.random() * GRID_COLS.length) | 0;
    }
    if (Math.random() > (density.clusterChance == null ? 0 : density.clusterChance)) {
      return (Math.random() * GRID_COLS.length) | 0;
    }
    var roll = Math.random();
    var sameChance = density.sameLaneChance == null ? .62 : density.sameLaneChance;
    var adjacentChance = density.adjacentLaneChance == null ? .33 : density.adjacentLaneChance;
    if (roll < sameChance) return this.enemyClusterLane;
    if (roll < sameChance + adjacentChance) {
      var dir = Math.random() < .5 ? -1 : 1;
      return clamp(this.enemyClusterLane + dir, 0, GRID_COLS.length - 1) | 0;
    }
    return (Math.random() * GRID_COLS.length) | 0;
  };

  Game.prototype.nextSpawnPackSize = function () {
    var density = enemyDensityTuning();
    if (Math.random() >= (density.packChance == null ? 0 : density.packChance)) return 1;
    var min = Math.max(1, density.packMin || 2), max = Math.max(min, density.packMax || min);
    return min + ((Math.random() * (max - min + 1)) | 0);
  };

  Game.prototype.spawnEnemy = function (config) {
    var type = config.type, elite = !!config.elite, mini = !!config.mini;
    if (config.countInWave) this.waveTotal = Math.max(0, this.waveTotal || 0) + 1;
    var density = enemyDensityTuning();
    var laneIndex = this.pickEnemyLane();
    var data = {
      wisp: { name: '符纸游魂', hp: 115, speed: 55, damage: 24, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 },
      jiangshi: { name: '镇魂甲尸', hp: 620, speed: 38, damage: 82, rate: 1.33, range: 66, size: .92, xp: 26, coin: 18 },
      boss: { name: '纸扎魇主', hp: 6800, speed: 28, damage: 155, rate: 1.54, range: 96, size: 1.22, xp: 260, coin: 180 },
      swift: { name: '符纸游魂', hp: 115, speed: 55, damage: 24, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 },
      armored: { name: '镇魂甲尸', hp: 620, speed: 38, damage: 82, rate: 1.33, range: 66, size: .92, xp: 26, coin: 18 }
    }[type] || { name: '符纸游魂', hp: 115, speed: 55, damage: 24, rate: 1.00, range: 58, size: .86, xp: 8, coin: 5 };
    var scale = type === 'boss' ? 1 : 1 + (this.wave - 1) * .035;
    var elitePower = elite && type !== 'jiangshi';
    var eliteVisual = elite || type === 'jiangshi';
    var eliteScale = elitePower ? 1.65 : 1;
    if (mini) eliteScale *= .62;
    var waveHpScale = valueOr(this.currentWaveConfig && this.currentWaveConfig.enemyHpScale, 1);
    var waveDamageScale = valueOr(this.currentWaveConfig && this.currentWaveConfig.enemyDamageScale, 1);
    var waveEliteHpScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteHpScale, 1) : 1;
    var waveEliteDamageScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteDamageScale, 1) : 1;
    var waveEliteAttackRateScale = type === 'jiangshi' ? valueOr(this.currentWaveConfig && this.currentWaveConfig.eliteAttackRateScale, 1) : 1;
    var hp = data.hp * scale * eliteScale * waveHpScale * waveEliteHpScale;
    var speedOverrides = battleTuning().enemy && battleTuning().enemy.speed || {};
    var baseSpeed = speedOverrides[type] == null ? data.speed : speedOverrides[type];
    var sizeOverrides = battleTuning().enemy && battleTuning().enemy.sizeScale || {};
    var typeSizeScale = sizeOverrides[type] == null ? 1 : sizeOverrides[type];
    var eliteSizeScale = eliteVisual && type !== 'boss' ? (sizeOverrides.elite == null ? 1.08 : sizeOverrides.elite) : 1;
    var jitter = density.xJitter || 0;
    var spawnX = clamp(GRID_COLS[laneIndex] + (Math.random() * 2 - 1) * jitter, 35, W - 35);
    var spawnY = -(Math.random() * (density.yJitter || 0));
    this.enemies.push({
      id: this.idSeed++, type: type, x: spawnX, y: spawnY, gridCol: laneIndex,
      name: data.name,
      hp: hp, maxHp: hp, speed: baseSpeed * (elitePower ? 1.05 : 1),
      damage: data.damage * (type === 'boss' ? 1 : 1 + (this.wave - 1) * .018) * waveDamageScale * waveEliteDamageScale,
      attackRate: data.rate * waveEliteAttackRateScale,
      attackType: 'melee', attackRange: data.range,
      attackCd: Math.random() * .5, size: data.size * typeSizeScale * eliteSizeScale,
      xp: data.xp * (elitePower ? 2 : 1), coin: data.coin * (elitePower ? 2 : 1),
      elite: eliteVisual, mini: mini, blocker: null, breaking: false, dead: false,
      slow: 0, freeze: 0, burn: 0, burnDps: 0, burnTick: 0, hit: 0, age: 0, hpBarTime: 0,
      rowPause: 0, nextRowStop: 0, redFlash: 0, soulExplosionGuard: false,
      summonCd: type === 'boss' ? 6 : 999, summonAnim: 0, attackAnim: 0,
      attackWindup: 0, attackWindupDuration: type === 'wisp' ? .22 : 0, pendingHero: null,
      attackDuration: type === 'boss' ? .75 : type === 'wisp' ? .34 : .5,
      hitHold: 0, attackFacing: 1, moving: false
    });
  };

  Game.prototype.getHero = function (id) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].id === id) return this.heroes[i];
    return null;
  };

  Game.prototype.heroByType = function (type) {
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].type === type) return this.heroes[i];
    return null;
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
    var searchRange = hero.search == null ? 820 : hero.search;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (!enemy || enemy.dead) continue;
      var d = distance(hero.x, hero.y, enemy.x, enemy.y);
      if (d > searchRange) continue;
      var score = d - (914 - enemy.y) * .12;
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
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
    var passive = heroSkillConfig('hongyi').passive || {};
    return Math.min(valueOr(passive.maxBurningStacks, 5), this.countBurningEnemies());
  };

  Game.prototype.heroAttackPower = function (hero) {
    var attack = hero.damage;
    if (hero.type === 'hongyi') {
      var passive = heroSkillConfig('hongyi').passive || {};
      attack *= 1 + this.hongyiEmberStacks() * valueOr(passive.atkPerBurningEnemy, .03);
    }
    return attack;
  };

  Game.prototype.applyBurn = function (enemy, source, duration, dps) {
    if (!enemy || enemy.dead) return;
    if (source && source.faction === '鬼族') dps *= 1 + this.upgradeValue('F07', [.15, .30, .45], 0);
    enemy.burn = Math.max(enemy.burn || 0, duration || 0);
    if ((enemy.burnDps || 0) <= dps) {
      enemy.burnDps = dps;
      enemy.burnSource = source ? source.id : null;
    }
    enemy.burnTick = enemy.burnTick > 0 ? Math.min(enemy.burnTick, .5) : .5;
  };

  Game.prototype.updateHongyiPassive = function (hero) {
    var stacks = this.hongyiEmberStacks();
    if (stacks !== (hero.emberStacks || 0)) {
      hero.emberStacks = stacks;
      if (stacks > 0) {
        var passive = heroSkillConfig('hongyi').passive || {};
        this.floatText(hero.x, hero.y - 122, '余烬 +' + Math.round(stacks * valueOr(passive.atkPerBurningEnemy, .03) * 100) + '% ATK', C.fire, 18, {
          life: .8, bold: true, rise: 18
        });
      }
    }
  };

  Game.prototype.updateQingyiPassive = function (hero) {
    if (hero.healCd > 0) return;
    var passive = heroSkillConfig('qingyi').passive || {};
    var e05Level = this.rogueLevel('E05');
    var baseCooldown = valueOr(passive.cooldown, 3);
    var target = this.lowestWoundedHero();
    if (target) {
      var lowHealth = target.hp / Math.max(1, target.maxHp) < valueOr(passive.emergencyThreshold, .35);
      var healAtk = lowHealth ? valueOr(passive.emergencyHealAtk, 2) : valueOr(passive.healAtk, 1.3);
      var healAmount = this.heroAttackPower(hero) * healAtk;
      if (hero.storedHealing) {
        healAmount *= 1.75;
        hero.storedHealing = 0;
        this.floatText(target.x, target.y - 126, '储存灵息释放', HERO_META[hero.type].color, 18, { life: .9, bold: true });
      }
      this.healHero(target, healAmount, hero);
      this.zones.push({ type: 'ring', x: target.x, y: target.y, r: 22, color: HERO_META[hero.type].color, life: .45 });
      if (e05Level >= 1) {
        var second = null, secondRatio = 2;
        for (var i = 0; i < this.heroes.length; i++) {
          var candidate = this.heroes[i];
          if (!candidate.alive || candidate === target || candidate.hp >= candidate.maxHp) continue;
          var candidateRatio = candidate.hp / candidate.maxHp;
          if (candidateRatio < secondRatio) { secondRatio = candidateRatio; second = candidate; }
        }
        if (second) {
          this.healHero(second, healAmount * .5, hero);
          this.zones.push({ type: 'healLink', x: target.x, y: target.y - 35, tx: second.x, ty: second.y - 35, color: HERO_META[hero.type].color, life: .42, maxLife: .42 });
        }
      }
      if (e05Level >= 2 && lowHealth) this.addHolyShield(target, healAmount * .5, 3.5);
      hero.healCd = Math.max(.8, baseCooldown - (e05Level >= 3 ? .7 : 0));
    } else {
      if (e05Level >= 3 && !hero.storedHealing) {
        hero.storedHealing = 1;
        this.floatText(hero.x, hero.y - 122, '储存灵息', HERO_META[hero.type].color, 18, { life: .9, bold: true });
        this.zones.push({ type: 'ring', x: hero.x, y: hero.y, r: 24, color: HERO_META[hero.type].color, life: .55 });
        hero.healCd = Math.max(.8, baseCooldown - .7);
      } else hero.healCd = valueOr(passive.retryCooldown, .35);
    }
  };

  Game.prototype.healingReceivedMultiplier = function (hero, source) {
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

  Game.prototype.updateHeroes = function (dt) {
    for (var i = 0; i < this.heroes.length; i++) {
      var hero = this.heroes[i];
      hero.flash = Math.max(0, hero.flash - dt);
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
      if (hero.type === 'hongyi') this.updateHongyiPassive(hero);
      this.updateHuangjinWall(hero, dt);
      this.updateHolyShield(hero, dt);
      hero.attackCd -= dt * (hero.attackBuffTime > 0 ? 1.12 : 1);
      var previousUltimateCd = hero.ultimateCd;
      hero.ultimateCd -= dt;
      if (previousUltimateCd > 0 && hero.ultimateCd <= 0) hero.skillReadyFlash = .15;
      hero.ultimatePrevCd = previousUltimateCd;
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
          marked.markDamageTaken = valueOr(suwenPassive.damageTaken, .15) + this.upgradeValue('E10', [.08, .14, .20], 0);
          this.floatText(marked.x, marked.y - 92, '问命签', HERO_META[hero.type].color, 19, { life: .9, bold: true });
          this.zones.push({ type: 'ring', x: marked.x, y: marked.y, r: 28, color: HERO_META[hero.type].color, life: .6 });
        }
        hero.healCd = valueOr(suwenPassive.cooldown, 6);
      }
      if (hero.type === 'qingyi') this.updateQingyiPassive(hero);
      if (hero.ultimateCd <= 0) this.castHeroUltimate(hero);
    }
  };

  Game.prototype.updateSoulReturn = function (hero, dt) {
    var anchor = this.heroSoulAnchor(hero);
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

  Game.prototype.blockingHero = function (enemy) {
    return enemy && enemy.blocker ? this.getHero(enemy.blocker) : null;
  };

  Game.prototype.isBlockedByFaction = function (enemy, faction) {
    var blocker = this.blockingHero(enemy);
    return !!(blocker && blocker.alive && blocker.faction === faction);
  };

  Game.prototype.heroAttack = function (hero, target) {
    hero.pendingTarget = target.id;
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
      p.life -= dt; p.age = (p.age || 0) + dt;
      if (!target || target.dead || p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      var d = distance(p.x, p.y, target.x, target.y);
      if (d <= p.speed * dt + 12) {
        this.projectileHit(p, target);
        this.projectiles.splice(i, 1);
      } else {
        p.prevX = p.x; p.prevY = p.y;
        p.x += (target.x - p.x) / d * p.speed * dt;
        p.y += (target.y - p.y) / d * p.speed * dt;
      }
    }
  };

  Game.prototype.projectileHit = function (p, target) {
    var hero = this.getHero(p.hero);
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
      hongyi: '焚天火雨！', xuanya: '影袭！', huangjin: '坚壁领域！',
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

  Game.prototype.castHeroUltimate = function (hero) {
    if (!hero.alive) return;
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
      this.floatText(hero.x, hero.y - 116, '坚壁领域', C.gold, 24, { life: 1, bold: true, rise: 18 });
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

  Game.prototype.releaseHeroAttack = function (hero, target) {
    hero.attackAnim = hero.attackRecoveryDuration || .34;
    hero.hitHold = .06;
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
      this.impactPause(.06, 6);
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

  Game.prototype.projectileHit = function (p, target) {
    var hero = this.getHero(p.hero);
    if (!hero) return;
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
    this.projectiles.push({
      x: x, y: y, prevX: x, prevY: y, target: target.id, hero: hero.id, type: type,
      speed: hero.projectileSpeed * 1.05, damage: damage, color: options.color || HERO_META[hero.type].color,
      burnDuration: options.burnDuration || 0, burnDps: options.burnDps || 0,
      r: options.r || 6, life: 2.2, age: 0, vfxRow: options.vfxRow || 0,
      primary: false, canSplit: options.canSplit !== false
    });
  };

  Game.prototype.beginSkillMoment = function (hero) {
    var skillNames = {
      hongyi: '焚天火雨！', xuanya: '玄鸦掠阵！', huangjin: '坚壁领域！',
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
    if (!hero.alive) return;
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
      if (this.rogueLevel('E04') > 0) {
        for (var lotus = 0; lotus < 3; lotus++) {
          var center = this.densestEnemy();
          if (center) this.zones.push({ type: 'delayedFire', x: center.x + (Math.random() * 100 - 50), y: center.y + (Math.random() * 80 - 40), r: 85, damage: hongyiAtk * .55, hero: hero.id, life: .60 + lotus * .18, maxLife: .60 + lotus * .18, skill: true });
        }
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
      hero.wallBarrierTime = valueOr(huangjinUltimate.duration, 6) + this.upgradeValue('E02', [1, 2, 3], 0);
      hero.wallBarrierReduction = valueOr(huangjinUltimate.reduction, .25);
      hero.invuln = Math.max(hero.invuln, valueOr(huangjinUltimate.invuln, .15));
      this.floatText(hero.x, hero.y - 116, '坚壁领域', C.gold, 24, { life: 1, bold: true, rise: 18 });
      this.zones.push({ type: 'guard', x: hero.x, y: hero.y, r: valueOr(huangjinUltimate.effectRadius, 128), color: C.gold, life: hero.wallBarrierTime, hero: hero.id });
    } else if (hero.type === 'xuanya') {
      var target = this.highestThreatEnemy();
      if (!target) { hero.ultimateCd = 1; return; }
      this.beginSkillMoment(hero);
      var xuanyaUltimate = heroSkillConfig('xuanya').ultimate || {};
      var hits = valueOr(xuanyaUltimate.hits, 3);
      for (var h = 0; h < hits; h++) this.damageEnemy(target, this.heroAttackPower(hero) * valueOr(xuanyaUltimate.damageAtk, .8), hero, h === 0 ? { impact: true, skill: true } : { skill: true });
      if (this.rogueLevel('E08') > 0) {
        if (target.type !== 'boss' && target.hp < target.maxHp * .15) this.damageEnemy(target, target.hp + 1, hero, { impact: true, skill: true });
        else if (target.type === 'boss') this.damageEnemy(target, this.heroAttackPower(hero) * 2, hero, { impact: true, skill: true });
      }
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

  Game.prototype.updateEnemies = function (dt) {
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
      if (enemy.bleed > 0) {
        enemy.bleed -= dt;
        enemy.bleedTick = (enemy.bleedTick || .5) - dt;
        if (enemy.bleedTick <= 0) {
          enemy.bleedTick = .5;
          this.damageEnemy(enemy, (enemy.bleedDps || 0) * .5, this.getHero(enemy.bleedSource));
          if (enemy.dead) continue;
        }
      }
      if (enemy.burn > 0) {
        enemy.burn -= dt; enemy.burnTick -= dt;
        if (enemy.burnTick <= 0) {
          enemy.burnTick = .5;
          var source = this.getHero(enemy.burnSource);
          this.damageEnemy(enemy, enemy.burnDps * .5, source);
          if (!enemy.dead && source && source.faction === '鬼族' && this.rogueLevel('F07') >= 3 && Math.random() < .10) {
            this.damageEnemy(enemy, enemy.burnDps * .5, source);
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
          this.burst(enemy.x, 914, C.danger, 8); this.audio.tone('hurt'); this.shake = Math.min(10, this.shake + 3);
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
    if (enemy && enemy.flaw > 0 && source && (source.job === '战士' || source.job === '坦克')) {
      mult *= 1 + (enemy.flawDamageTaken || .20);
    }
    if (enemy && enemy.skillDamageTaken && options.skill) mult *= 1 + enemy.skillDamageTaken;
    if (source) {
      if (source.faction === '神' && options.skill) mult *= 1 + this.upgradeValue('F09', [.18, .30, .42], 0);
      if (source.type === 'huangjin' && this.rogueLevel('E02') >= 3) {
        for (var i = 0; i < this.heroes.length; i++) {
          var guard = this.heroes[i];
          if (guard.type === 'huangjin' && guard.alive && guard.wallBarrierTime > 0 && gridColumnFromX(guard.x) === gridColumnFromX(source.x)) {
            mult *= 1.15; break;
          }
        }
      }
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
    hero.hp -= damage; hero.flash = .16; hero.hitReact = .18;
    this.impactPause(.035, 2.5);
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

  Game.prototype.soulReturn = function (hero) {
    var deathX = hero.x, deathY = hero.y;
    var soulAnchor = this.heroSoulAnchor(hero);
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
    if (!ANCHORS[hero.soulAnchorIndex]) hero.soulAnchorIndex = hero.anchorIndex;
    hero.anchorIndex = hero.soulAnchorIndex;
    var anchor = this.heroSoulAnchor(hero);
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
    this.message = hero.name + '归阵 · ' + ANCHORS[hero.anchorIndex].name;
    this.messageTime = 1.8; this.audio.tone('bell');
  };

  Game.prototype.damageEnemy = function (enemy, amount, source, options) {
    if (!enemy || enemy.dead) return;
    options = options || {};
    var blockerBeforeHit = this.blockingHero(enemy);
    var final = amount * this.outgoingDamageMultiplier(source, enemy, options) * (enemy.armorBreak ? 1.25 : 1);
    var previousHp = enemy.hp;
    if (enemy.hpLag == null) enemy.hpLag = previousHp;
    enemy.hp -= final;
    enemy.hpLag = Math.max(enemy.hpLag, previousHp);
    enemy.hpBarTime = 3;
    enemy.hpLagHold = options.impact || options.skill ? .12 : .05;
    enemy.hitDuration = options.skill ? .20 : (options.impact ? .17 : .12);
    enemy.hit = enemy.hitDuration;
    if (options.impact || options.skill) {
      enemy.redFlash = .1;
      var dx = source ? enemy.x - source.x : 0, dy = source ? enemy.y - source.y : -1;
      var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var recoil = options.skill ? 24 : 15;
      enemy.recoilX = dx / d * recoil;
      enemy.recoilY = dy / d * recoil * .45;
      this.impactPause(options.skill ? .055 : .035, options.skill ? 5 : 2.5);
      this.burst(enemy.x, enemy.y - 18, options.skill && source ? HERO_META[source.type].color : '#fff0c7', options.skill ? 18 : 10);
    }
    if (options.skill) {
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
    if (enemy.hp <= 0) {
      options.blockerBeforeHit = blockerBeforeHit ? blockerBeforeHit.id : null;
      this.killEnemy(enemy, source, options);
    }
  };

  Game.prototype.killEnemy = function (enemy, source, killOptions) {
    if (enemy.dead) return;
    killOptions = killOptions || {};
    var humanBlocker = killOptions.blockerBeforeHit ? this.getHero(killOptions.blockerBeforeHit) : this.blockingHero(enemy);
    if (!humanBlocker || humanBlocker.faction !== '人族') humanBlocker = null;
    enemy.dead = true; this.kills++; this.coins += Math.round(enemy.coin); this.score += Math.round(enemy.xp * 12);
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
    if (source && source.type === 'hongyi' && this.rogueLevel('E03') >= 3 && enemy.burn > 0) {
      var hongyiPassive = heroSkillConfig('hongyi').passive || {};
      var spreadTargets = this.findProjectileTargets(enemy.x, enemy.y, [enemy.id], 1, 170, true);
      if (spreadTargets.length) {
        this.launchSecondaryProjectile(source, enemy.x, enemy.y - 18, spreadTargets[0], this.heroAttackPower(source) * .25, 'hongyiEmber', {
          color: C.fire, r: 6, vfxRow: 0,
          burnDuration: valueOr(hongyiPassive.spreadDuration, 3),
          burnDps: enemy.burnDps * valueOr(hongyiPassive.spreadDpsRatio, .75), canSplit: false
        });
      }
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
    if (enemy.suwenMarked && this.rogueLevel('E10') >= 3) {
      var suwen = this.heroByType('suwen');
      if (suwen) this.damageArea(enemy.x, enemy.y, 92, this.heroAttackPower(suwen) * 1.1, suwen, null, { impact: true, skill: true });
    }
    if (enemy.suwenMarked) {
      var markOwner = this.heroByType('suwen');
      var suwenPassive = heroSkillConfig('suwen').passive || {};
      if (markOwner) markOwner.ultimateCd = Math.max(0, markOwner.ultimateCd - valueOr(suwenPassive.ultimateCdRefund, 1));
    }
    var deathColor = enemy.type === 'boss' ? C.fire : enemy.type === 'wisp' ? C.blue : (enemy.elite ? '#ce83dc' : C.gold);
    var deathCount = enemy.type === 'boss' ? 46 : enemy.type === 'wisp' ? 12 : enemy.elite ? 16 : 9;
    var deathScale = enemy.type === 'boss' ? 1.35 : enemy.type === 'wisp' ? .72 : enemy.elite ? .88 : .68;
    this.soulFireBurst(enemy.x, enemy.y, deathColor, deathCount, deathScale, { soft: true });
    this.impactPause(enemy.type === 'boss' ? .12 : .045, enemy.type === 'boss' ? 14 : 3.5);
    if (enemy.type === 'boss') { this.shake = 14; this.audio.tone('win'); }
  };

  Game.prototype.healHero = function (hero, amount, source) {
    if (!hero || !hero.alive) return 0;
    var finalAmount = amount * this.healingReceivedMultiplier(hero, source);
    var missing = Math.max(0, hero.maxHp - hero.hp);
    var actual = Math.min(finalAmount, missing);
    hero.hp += actual; this.totalHealing += actual;
    if (source) source.healingDone += actual;
    var overflow = Math.max(0, finalAmount - actual);
    var qingyiShieldRatio = source && source.type === 'qingyi' ? this.upgradeValue('E06', [.40, .70, 1.00], 0) : 0;
    if (qingyiShieldRatio > 0 && overflow > 0) {
      hero.shield += overflow * qingyiShieldRatio;
      hero.shieldFlash = .32;
      hero.holyShield = Math.max(hero.holyShield || 0, overflow * qingyiShieldRatio);
      hero.holyShieldTime = Math.max(hero.holyShieldTime || 0, 4);
      if (this.rogueLevel('E06') >= 3) hero.attackBuffTime = Math.max(hero.attackBuffTime || 0, 3);
    }
    if (source && source.type === 'suwen' && this.rogueLevel('E10') >= 2) { hero.shield += actual * .20; hero.shieldFlash = .28; }
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
    var interval = Math.max(.5, (this.spiritLampInterval || 5) / intervalBoost);
    while (this.spiritLampTimer >= interval && this.spiritLampLit < this.spiritLampMax) {
      this.spiritLampTimer -= interval;
      this.spiritLampLit++;
      this.spiritLampPulse = .45;
      this.audio.tone('bell');
    }
  };

  Game.prototype.spellCostFor = function (key) {
    var cost = spellCost(key);
    if (this.rogueLevel('U05') >= 3 && !this.spellDiscountWave) cost = Math.max(1, cost - 1);
    return cost;
  };

  Game.prototype.hasSpiritLamps = function (key) {
    return (this.spiritLampLit || 0) >= this.spellCostFor(key);
  };

  Game.prototype.spendSpiritLamps = function (key, manual) {
    var baseCost = spellCost(key);
    var cost = this.spellCostFor(key);
    if ((this.spiritLampLit || 0) < cost) {
      if (manual) {
        this.message = SPELL_META[key].name + ' 需要 ' + cost + ' 盏灵灯';
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

  Game.prototype.canAutoCastSpell = function (key) {
    if (!this.hasSpiritLamps(key)) return false;
    if (key === 'fire') return this.enemies.length >= 3;
    if (key === 'bell') return this.enemies.length >= 6 || this.baseHp < this.baseMax * .45;
    if (key === 'water') return this.enemies.length > 0;
    return false;
  };

  Game.prototype.castSpell = function (key, manual) {
    if (this.spellCd[key] > 0) {
      if (manual) {
        this.message = SPELL_META[key].name + ' 冷却中 ' + this.spellCd[key].toFixed(1) + 's';
        this.messageTime = 1.6;
        this.audio.tone('shoot');
      }
      return false;
    }
    if (key === 'fire') {
      var center = this.densestEnemy();
      if (!center) {
        if (manual) { this.message = '符火咒需要敌人目标'; this.messageTime = 1.6; }
        return false;
      }
      if (!this.spendSpiritLamps(key, manual)) return false;
      var before = this.totalDamage;
      this.damageArea(center.x, center.y, 105, 145, null, 'burn');
      this.spellDamage.fire += this.totalDamage - before;
      this.zones.push({ type: 'fire', x: center.x, y: center.y, r: 105, color: C.fire, life: .85 });
      this.spellCd.fire = 0; this.audio.tone('bell');
    } else if (key === 'bell') {
      if (!this.enemies.length) {
        if (manual) { this.message = '镇魂铃需要敌人目标'; this.messageTime = 1.6; }
        return false;
      }
      if (!this.spendSpiritLamps(key, manual)) return false;
      var beforeBell = this.totalDamage;
      for (var i = 0; i < this.enemies.length; i++) {
        this.enemies[i].slow = Math.max(this.enemies[i].slow, 3.5);
        this.damageEnemy(this.enemies[i], 24, null);
      }
      this.spellDamage.bell += this.totalDamage - beforeBell;
      this.zones.push({ type: 'ring', x: 375, y: 690, r: 20, color: C.gold, life: .8 });
      this.spellCd.bell = 0; this.audio.tone('bell');
    } else if (key === 'water') {
      var threat = this.highestThreatEnemy(), beforeWater = this.totalDamage;
      if (!threat) {
        if (manual) { this.message = '渡水符需要敌人目标'; this.messageTime = 1.6; }
        return false;
      }
      if (!this.spendSpiritLamps(key, manual)) return false;
      for (var j = 0; j < this.enemies.length; j++) {
        var e = this.enemies[j];
        if (Math.abs(e.x - threat.x) < 62) { this.damageEnemy(e, 92, null); e.slow = Math.max(e.slow, 2.5); }
      }
      this.zones.push({ type: 'wave', x: threat.x, y: 160, tx: threat.x, ty: 910, color: C.blue, life: .5 });
      this.spellDamage.water += this.totalDamage - beforeWater;
      this.spellCd.water = 0; this.audio.tone('shoot');
    } else return false;
    this.message = SPELL_META[key].name + (manual ? ' · 手动释放' : ' · 自动释放');
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

  Game.prototype.offerCards = function () {
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
    this.audio.tone('bell');
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
    if (!inRect(x, y, panel) || (x >= panel.x + panel.w - 78 && y <= panel.y + 122)) {
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
    for (var i = 0; i < this.heroes.length; i++) if (this.heroes[i].type === type) return true;
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
  };

  Game.prototype.availableUpgradeList = function (preferredType) {
    var source = YL.ROGUE_UPGRADES || [], list = [];
    for (var i = 0; i < source.length; i++) {
      var upgrade = source[i];
      if (!upgrade || upgrade.disabled) continue;
      if (preferredType && upgrade.type !== preferredType) continue;
      if (this.rogueLevel(upgrade.id) >= (upgrade.maxLevel || 1)) continue;
      if (upgrade.type === 'faction' && !this.hasFaction(upgrade.faction)) continue;
      if (upgrade.type === 'exclusive' && !this.hasHeroType(upgrade.hero)) continue;
      list.push(upgrade);
    }
    return list;
  };

  Game.prototype.hasAvailableUpgradeCards = function () {
    return this.availableUpgradeList().length > 0;
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
    var color = upgrade.type === 'faction' ? (FACTION_COLORS[upgrade.faction] || C.gold) :
      upgrade.type === 'exclusive' && hero ? HERO_META[hero.type].color : (RARITY_COLORS[upgrade.rarity] || C.jade);
    return {
      upgradeId: upgrade.id,
      type: upgrade.type,
      rarity: upgrade.rarity,
      maxLevel: upgrade.maxLevel || 1,
      hero: hero && upgrade.type === 'exclusive' ? hero.id : null,
      portraitHero: hero ? hero.id : null,
      heroName: upgrade.type === 'common' ? '全队' : upgrade.type === 'faction' ? upgrade.faction : (hero ? hero.name : '御灵'),
      role: (UPGRADE_TYPE_LABELS[upgrade.type] || '强化') + ' · ' + (RARITY_LABELS[upgrade.rarity] || ''),
      title: upgrade.name,
      desc: upgrade.levels[Math.min(nextLevel, upgrade.levels.length) - 1],
      color: color,
      icon: hero ? HERO_META[hero.type].icon : 1
    };
  };

  Game.prototype.offerCards = function () {
    this.phase = 'cards'; this.pendingLevels = 0;
    this.spellPress = null; this.dragDeploy = null; this.dragSoul = null;
    var cards = [], used = {};
    function addCard(game, pool) {
      pool = shuffle(pool.slice());
      for (var i = 0; i < pool.length; i++) {
        if (!used[pool[i].id]) {
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

    if (!cards.length) { this.phase = 'wave'; return; }
    this.pendingCards = cards;
    this.audio.tone('bell');
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
    var text = upgrade.type === 'common' ? '全队生效' : upgrade.type === 'faction' ? upgrade.faction + '生效' : '专属生效';
    this.skillVignette = { color: card.color, life: .32, maxLife: .32 };
    this.waveProgressFlash = .55;

    for (var i = 0; i < affected.length; i++) {
      var hero = affected[i];
      if (!hero) continue;
      this.burst(hero.x, hero.y - 40, card.color, strong ? 22 : 14);
      this.zones.push({ type: 'ring', x: hero.x, y: hero.y, r: strong ? 48 : 34, color: card.color, life: .65 });
      this.floatText(hero.x, hero.y - 122, text, card.color, strong ? 22 : 18, { life: .9, bold: true, rise: 18 });

      if (upgrade.id === 'U01' || upgrade.id === 'U04' || upgrade.id === 'F05' || upgrade.id === 'F06' ||
        upgrade.id === 'F07' || upgrade.id === 'F08' || upgrade.id === 'E03' || upgrade.id === 'E07' || upgrade.id === 'E09') {
        hero.attackCd = 0;
        hero.attackBuffTime = Math.max(hero.attackBuffTime || 0, strong ? 5 : 3.5);
      }
      if (upgrade.id === 'U02' || upgrade.id === 'F01' || upgrade.id === 'F04' || upgrade.id === 'E02' ||
        upgrade.id === 'E06' || upgrade.id === 'U10') {
        var shield = hero.maxHp * (strong ? .18 : .10);
        hero.shield += shield;
        hero.shieldFlash = .32;
        this.floatText(hero.x, hero.y - 98, '盾 +' + Math.round(shield), '#f7e6a3', 17, { life: .9, rise: 16 });
      }
      if (upgrade.id === 'U03' || upgrade.id === 'U06' || upgrade.id === 'E05') {
        this.healHero(hero, hero.maxHp * (strong ? .18 : .12), null);
      }
      if (upgrade.id === 'F03' || upgrade.id === 'F09' || upgrade.id === 'E04' ||
        upgrade.id === 'E03' || upgrade.id === 'F07' || upgrade.id === 'F08' || upgrade.id === 'E08' || upgrade.id === 'E10') {
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
        if (this.rogueLevel('E01') >= 3) hero.attackCount = 2;
      }
      if (upgrade.id === 'E05' && hero.type === 'qingyi') hero.healCd = 0;
      if (upgrade.id === 'E09' && hero.type === 'suwen') {
        hero.attackCd = 0;
        hero.forceStarRicochet = 1;
      }
    }

    if (upgrade.id === 'U05') {
      this.spiritLampLit = clamp((this.spiritLampLit || 0) + 1, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
      this.spiritLampPulse = .55;
      this.floatText(W / 2, 1120, '灵灯 +1', C.gold, 24, { life: 1, bold: true, rise: 20 });
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

  Game.prototype.applyRogueUpgrade = function (card) {
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
    this.level = this.upgradeCount;
    this.refreshUpgradeDerivedStats(false);

    var anchorHero = this.heroForUpgrade(upgrade);
    var bx = anchorHero ? anchorHero.x : W / 2, by = anchorHero ? anchorHero.y - 40 : 720;
    this.burst(bx, by, card.color, upgrade.rarity === 'legendary' ? 34 : 20);
    this.floatText(bx, by - 50, card.title, card.color, upgrade.rarity === 'legendary' ? 28 : 22, { life: 1.2, bold: true, rise: 22 });
    this.applyUpgradeImmediatePulse(upgrade, card);
    if (upgrade.p0) this.nextWaveShowcase = { id: upgrade.id, name: upgrade.name, level: next, shown: false };
    this.message = card.title + '：' + card.desc;
    this.messageTime = 3;
  };

  Game.prototype.pickCard = function (index) {
    var card = this.pendingCards[index];
    if (!card) return;
    this.applyRogueUpgrade(card);
    this.pendingCards = [];
    this.phase = 'wave';
  };

  Game.prototype.updateZones = function (dt) {
    for (var i = this.zones.length - 1; i >= 0; i--) {
      var zone = this.zones[i]; zone.life -= dt; zone.age = (zone.age || 0) + dt;
      if (zone.type === 'delayedFire' && !zone.fired && zone.life <= .05) {
        zone.fired = true;
        this.damageArea(zone.x, zone.y, zone.r, zone.damage, this.getHero(zone.hero), 'burn', zone.skill ? { impact: true, skill: true } : null);
        this.burst(zone.x, zone.y, C.fire, 24); this.shake = 5;
      }
      if (zone.type === 'soulFire' && zone.life > 0) {
        zone.tick = (zone.tick || 0) - dt;
        if (zone.tick <= 0) {
          zone.tick = .20;
          var fireOwner = this.getHero(zone.hero);
          for (var fireIndex = 0; fireIndex < this.enemies.length; fireIndex++) {
            var fireTarget = this.enemies[fireIndex];
            if (fireTarget.dead || zone.touched[fireTarget.id] || dist2(zone.x, zone.y, fireTarget.x, fireTarget.y) > zone.r * zone.r) continue;
            zone.touched[fireTarget.id] = true;
            this.applyBurn(fireTarget, fireOwner, 2, fireOwner ? this.heroAttackPower(fireOwner) * .08 : 8);
            this.burst(fireTarget.x, fireTarget.y - 12, C.fire, 5);
          }
        }
      }
      if (zone.type === 'guard' && zone.life > 0) {
        var guardian = this.getHero(zone.hero);
        if (guardian && guardian.alive && guardian.upgrades.ultimate >= 3) this.damageArea(guardian.x, guardian.y, zone.r, 16 * dt, guardian, null);
      }
      if (zone.life <= 0) this.zones.splice(i, 1);
    }
  };

  Game.prototype.impactPause = function (duration, shake) {
    if (this.paused || this.phase === 'cards') return;
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
    if (this.spellHelpTime > 0) {
      this.spellHelpTime -= dt;
      if (this.spellHelpTime <= 0) this.spellHelpKey = null;
    }
    if (this.skillVignette) {
      this.skillVignette.life -= dt;
      if (this.skillVignette.life <= 0) this.skillVignette = null;
    }
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i]; p.life -= dt;
      if (p.kind === 'soulFire') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(.20, dt);
        p.vy -= 12 * dt;
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
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.waveBanner = Math.max(0, this.waveBanner - dt);
    this.shake = Math.max(0, this.shake - dt * 18);
    this.updateEffects(dt);
    this.updateSpellPress();
    this.updateHeroPress();
    if (this.paused || this.infoOverlay) return;
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return;
    }
    this.updateWaveProgress(dt);
    this.updateSpiritLamps(dt);
    this.gameTime += dt;
    if (this.waveQueue.length && this.spawnTimer <= 0 && this.waveQueue[0].type === 'gap') {
      var gapStep = this.waveQueue.shift();
      this.spawnTimer = Math.max(.1, gapStep.delay || .5);
    } else if (this.waveQueue.length && this.spawnTimer <= 0) {
      var density = enemyDensityTuning();
      var maxAlive = density.maxAlive || 38;
      var packSize = this.waveQueue[0] && this.waveQueue[0].type === 'boss' ? 1 : this.nextSpawnPackSize();
      for (var spawn = 0; spawn < packSize && this.waveQueue.length && this.waveQueue[0].type !== 'gap' && this.enemies.length < maxAlive; spawn++) {
        this.spawnEnemy(this.waveQueue.shift());
      }
      var baseInterval = this.currentWaveConfig && this.currentWaveConfig.spawnInterval || .55;
      this.spawnTimer = Math.max(density.minSpawnInterval || .12, baseInterval * (density.spawnIntervalScale || 1));
    } else this.spawnTimer -= dt;
    this.updateHeroes(dt);
    if (this.phase === 'cards') return;
    this.syncBlocks();
    this.updateEnemies(dt);
    if (this.phase === 'cards') return;
    if (this.state !== 'battle') return;
    this.resolveSoftCollisions(dt);
    this.updateProjectiles(dt);
    if (this.phase === 'cards') return;
    this.updateZones(dt);
    if (this.phase === 'cards') return;
    this.castAutoSpells(dt);
    if (this.phase === 'cards') return;
    if (!this.waveQueue.length && !this.enemies.length && this.phase === 'wave') {
      if (this.wave >= this.waveMax) this.endBattle(true);
      else if (!this.waveUpgradeOffered && this.hasAvailableUpgradeCards()) {
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
        this.message = '布阵阶段：拖动御灵到任意空格';
        this.messageTime = 3;
      }
    }
    if (this.intermission > 0) {
      this.intermission -= dt;
      if (this.intermission <= 0 && this.state === 'battle') this.startWave(this.wave + 1);
    }
  };

  Game.prototype.endBattle = function (win) {
    if (this.state !== 'battle') return;
    this.state = 'result'; this.win = win;
    this.finalScore = Math.round(this.score + this.baseHp * 2 + this.upgradeCount * 80 + (win ? 2500 : 0));
    this.rewardXp = Math.max(20, Math.round(this.wave * 12 + this.kills * 1.5));
    this.audio.tone(win ? 'win' : 'hurt');
  };

  Game.prototype.loop = function (timestamp) {
    var now = timestamp || Date.now(), dt = this.last ? (now - this.last) / 1000 : .016;
    this.last = now; dt = Math.min(.034, Math.max(.001, dt));
    this.syncBgm();
    if (!(this.state === 'battle' && this.phase === 'cards')) this.time += dt;
    if (this.state === 'formation' && this.formationNoticeTime > 0) this.formationNoticeTime = Math.max(0, this.formationNoticeTime - dt);
    if (this.state === 'battle') {
      var steps = (this.paused || this.phase === 'cards') ? 1 : (this.speed || 1);
      for (var i = 0; i < steps; i++) this.updateBattle(dt);
    }
    this.render();
    this.raf(this.boundLoop);
  };

  Game.prototype.syncBgm = function () {
    var track = this.state === 'title' ? 'main' : 'battle';
    if (track === this.bgmTrack) return;
    this.bgmTrack = track;
    this.audio.setMusic(track);
  };

  Game.prototype.render = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (this.state === 'loading') this.drawLoading(ctx);
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

  Game.prototype.drawTitle = function (ctx) {
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }
    var fade = ctx.createLinearGradient(0, 0, 0, 540);
    fade.addColorStop(0, 'rgba(4,12,22,.92)'); fade.addColorStop(1, 'rgba(4,12,22,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 560);
    A.text(ctx, '御 灵 召 来', W / 2, 165, 72, '#f7d58c', 'center', '900');
    A.text(ctx, '五灵守阵 · 魂归原位', W / 2, 235, 28, '#8de3cc');
    A.panel(ctx, 78, 895, 594, 122, .80);
    A.text(ctx, '五名御灵下场阻敌', W / 2, 927, 25, C.paper);
    A.text(ctx, '阵亡御灵会返回初始魂位等待复活', W / 2, 968, 22, '#a9cfc2');
    A.button(ctx, 145, 1035, 460, 118, '开 阵 镇 魂', true, '#bd5a2e');
    A.text(ctx, '20 波完整试炼 · 道士术法可手动/自动释放', W / 2, 1195, 20, '#b8c9c2');
    A.text(ctx, '核心验证版  ·  v0.2', W / 2, 1265, 18, 'rgba(255,243,210,.68)');
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

  Game.prototype.drawFormationTop = function (ctx) {
    A.rr(ctx, 208, 28, 334, 68, 10, 'rgba(22,18,14,.82)', 'rgba(219,168,76,.74)', 3);
    A.text(ctx, '幽 野 村  1-1', W / 2, 63, 30, C.paper, 'center', '900');
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
      var rect = this.formationCellRect(i), cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 14, cy); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 14, cy); ctx.closePath();
      ctx.stroke();
      if (!this.formationSlotForGrid(i)) this.drawFormationIcon(ctx, FORMATION_ICON.empty, cx, cy + 13, 28, .34);
    }
    var labels = ['前排', '中排', '后排'];
    for (r = 0; r < labels.length; r++) A.text(ctx, labels[r], 40, g.y + r * ch + ch / 2, 18, C.gold);
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
      A.spriteImage(ctx, this.assets[meta.sprite], center.x, center.y + 26, slot.type === 'huangjin' ? 118 : 110, 142, 1);
      A.rr(ctx, center.x - 36, center.y + 31, 72, 24, 12, 'rgba(9,17,23,.86)', meta.color, 2);
      A.text(ctx, meta.name, center.x, center.y + 44, 15, C.white);
      if (selected) this.drawFormationIcon(ctx, FORMATION_ICON.check, center.x + 46, center.y - 60, 32);
    }
  };

  Game.prototype.drawFormationTeamBar = function (ctx) {
    A.rr(ctx, 46, 716, 658, 72, 12, 'rgba(11,16,20,.80)', 'rgba(219,168,76,.48)', 2);
    A.text(ctx, '御灵  ' + this.formationSlots.length + ' / 5', 118, 752, 24, C.paper);
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
    A.text(ctx, meta.faction + ' · ' + meta.job, rect.x + rect.w / 2, rect.y + 198, 14, '#9fb5ad');
    this.drawFormationIcon(ctx, FORMATION_ICON.star, rect.x + rect.w / 2, rect.y + rect.h - 33, 30, .9);
    if (deployed) {
      A.rr(ctx, rect.x + rect.w - 42, rect.y + rect.h - 46, 32, 32, 16, 'rgba(17,61,45,.88)', '#c8ffd7', 2);
      A.text(ctx, '✓', rect.x + rect.w - 26, rect.y + rect.h - 29, 22, '#dfffd8');
    }
    ctx.restore();
  };

  Game.prototype.drawFormationCards = function (ctx) {
    A.panel(ctx, FORMATION_CARD_AREA.x, FORMATION_CARD_AREA.y, FORMATION_CARD_AREA.w, FORMATION_CARD_AREA.h, .95);
    A.text(ctx, '御 灵 册', 92, 858, 24, C.paper);
    A.text(ctx, '点击卡牌上阵 / 再点下阵', 242, 858, 16, '#9fb5ad');
    var types = this.formationCardTypes();
    for (var i = 0; i < types.length; i++) this.drawFormationHeroCard(ctx, types[i], i);
  };

  Game.prototype.drawFormationStart = function (ctx) {
    var active = this.formationSlots.length > 0;
    var r = FORMATION_START;
    ctx.save();
    var grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    grad.addColorStop(0, active ? '#d99949' : '#44505a');
    grad.addColorStop(1, active ? '#8a421f' : '#27313a');
    A.rr(ctx, r.x, r.y, r.w, r.h, 18, grad, active ? '#ffe3a2' : '#70787a', 4);
    ctx.shadowColor = active ? 'rgba(255,197,92,.72)' : 'rgba(0,0,0,0)';
    ctx.shadowBlur = active ? 18 + Math.sin(this.time * 5) * 5 : 0;
    this.drawFormationIcon(ctx, FORMATION_ICON.start, r.x + 58, r.y + r.h / 2, 58, active ? 1 : .45);
    A.text(ctx, active ? '开始镇魂' : '请先上阵', r.x + r.w / 2 + 22, r.y + r.h / 2 + 2, 38, active ? C.white : '#b8c0bd', 'center', '900');
    ctx.restore();
    A.rr(ctx, 608, 1206, 98, 74, 13, 'rgba(9,18,25,.78)', 'rgba(219,168,76,.46)', 2);
    this.drawFormationIcon(ctx, FORMATION_ICON.recommend, 657, 1232, 44, .82);
    A.text(ctx, '推荐阵容', 657, 1269, 15, '#b8c9c2');
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
    if (this.formationNoticeTime > 0 && this.formationNotice) {
      A.rr(ctx, 98, 796, 554, 42, 16, 'rgba(8,16,22,.84)', 'rgba(219,168,76,.38)', 2);
      A.text(ctx, this.formationNotice, W / 2, 817, 18, C.paper);
    }
  };

  Game.prototype.drawBattle = function (ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    if (!cover(ctx, this.assets.battlefield, 0, 0, W, 960)) {
      var bg = ctx.createLinearGradient(0, 0, 0, 960); bg.addColorStop(0, '#142a36'); bg.addColorStop(1, '#19251e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 960);
    }
    ctx.fillStyle = 'rgba(5,13,18,.2)'; ctx.fillRect(0, 0, W, 960);
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
    this.drawProjectiles(ctx); this.drawEffects(ctx); this.drawZones(ctx, true);
    this.drawTopHud(ctx);
    if (this.waveBanner > 0) this.drawWaveBanner(ctx);
    if (this.messageTime > 0) {
      A.rr(ctx, 72, 875, 606, 48, 18, 'rgba(7,15,20,.82)', 'rgba(219,168,76,.55)', 2);
      A.text(ctx, this.message, W / 2, 899, 20, C.paper);
    }
    ctx.restore();
    this.drawSkillVignette(ctx);
    this.drawSideRail(ctx);
    this.drawSpellHelp(ctx);
    this.drawBottomFormation(ctx);
    if (this.phase === 'cards') this.drawCards(ctx);
    if (this.paused) this.drawPause(ctx);
    if (this.infoOverlay) this.drawInfo(ctx);
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
    A.text(ctx, 'LV.' + this.upgradeCount, 174, 101, 18, C.gold, 'center', '900');
    A.text(ctx, 'LV.' + (this.upgradeCount + 1), 576, 101, 18, C.gold, 'center', '900');
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
    var ry = Math.max(24, range * .42);
    var pulse = .5 + .5 * Math.sin(this.time * 7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.lineWidth = 3 + pulse * 1.5;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.ellipse(hero.x, hero.y + 6, range, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = .18 + pulse * .08;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(hero.x, hero.y + 6, range, ry, 0, 0, Math.PI * 2);
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

  Game.prototype.drawHeroStatusBack = function (ctx, hero) {
    if (!hero || !hero.alive) return;
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
    this.drawTalismanCountBadge(ctx, hero);
  };

  Game.prototype.drawTalismanCountBadge = function (ctx, hero) {
    var count = this.talismanCountForHero(hero);
    if (!count) return;
    var size = 34, x = hero.x + 34, y = hero.y + 4;
    if (x + size / 2 > W - 12) x = hero.x - 34;
    var img = this.assets.talismanCountBadge;
    ctx.save();
    ctx.shadowColor = 'rgba(255,198,74,.72)'; ctx.shadowBlur = 7;
    if (img && (img.width || img.naturalWidth)) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = '#efd176'; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9c5e20'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    this.drawUpgradeText(ctx, String(Math.min(99, count)), x, y + 1, 18, '#3b240f', 'center', '900');
  };

  Game.prototype.drawProjectiles = function (ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
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
      var foregroundZone = z.type === 'meleeSlash' || z.type === 'shieldBashImpact' ||
        z.type === 'wispClawHit' || z.type === 'orbImpact';
      if (foregroundZone !== foreground) continue;
      ctx.save(); ctx.globalAlpha = alpha;
      if (z.type === 'deathSoulFire') {
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
      } else if (z.type === 'fire' || z.type === 'delayedFire' || z.type === 'soulFire' || z.type === 'soulBurst' || z.type === 'emberBurst') {
        var fire = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
        fire.addColorStop(0, 'rgba(255,221,112,.82)'); fire.addColorStop(.5, 'rgba(245,91,35,.5)'); fire.addColorStop(1, 'rgba(120,24,14,0)');
        ctx.fillStyle = fire; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        if (z.type === 'delayedFire' && !z.fired) {
          var warning = clamp(z.life / Math.max(.01, z.maxLife || 1), 0, 1);
          ctx.strokeStyle = '#ffd67d'; ctx.lineWidth = 3 + (1 - warning) * 5;
          ctx.shadowColor = C.fire; ctx.shadowBlur = 12;
          ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + warning * .28), 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        if (z.type === 'soulFire') {
          ctx.strokeStyle = 'rgba(255,190,74,.8)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.72 + .08 * Math.sin(this.time * 12)), 0, Math.PI * 2); ctx.stroke();
        }
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
    var alpha = clamp(this.waveBanner * 1.3, 0, 1), boss = this.wave === 20;
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
      { y: 300, title: '倍速', sub: 'X' + this.speed, type: 'speed' },
      { y: TALISMAN_BUTTON.y, title: '符箓', sub: '', type: 'talisman' }
    ];
    for (var i = 0; i < buttons.length; i++) this.drawSideButton(ctx, 684, buttons[i].y, 54, 66, buttons[i]);
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
    var speed = clamp(this.speed || 1, 1, 3) | 0;
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
    A.icon(ctx, this.assets.icons, meta.icon, 280, 620, 58, 0);
    A.text(ctx, meta.name, 350, 603, 28, meta.color, 'left');
    A.text(ctx, '模式：' + (this.spellAuto ? '自动释放' : '手动释放') + '    消耗 ' + this.spellCostFor(this.spellHelpKey) + ' 盏灵灯', 350, 638, 18, C.paper, 'left');
    for (var i = 0; i < meta.desc.length; i++) A.text(ctx, meta.desc[i], 350, 680 + i * 28, 18, '#b9c9c3', 'left');
    A.text(ctx, this.spellAuto ? '点底部「自」切为手动' : '短按图标立即释放', 440, 730, 17, C.jade);
    ctx.restore();
  };

  Game.prototype.heroSprite = function (hero) { return this.assets[HERO_META[hero.type].sprite]; };

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

  Game.prototype.drawSpellDock = function (ctx) {
    var lit = clamp(this.spiritLampLit || 0, 0, this.spiritLampMax || SPIRIT_LAMP_MAX);
    var max = this.spiritLampMax || SPIRIT_LAMP_MAX;
    var pulse = clamp((this.spiritLampPulse || 0) / .55, 0, 1);
    A.rr(ctx, 14, 1228, 310, 86, 16, 'rgba(6,14,20,.82)', 'rgba(219,168,76,.62)', 3);
    A.text(ctx, '灵灯', 58, 1252, 18, C.paper);
    A.text(ctx, lit + ' / ' + max, 58, 1284, 25, C.white);
    var lampStates = this.assets.spiritLampStates;
    for (var l = 0; l < max; l++) {
      var lx = 112 + l * 29, ly = 1305, on = l < lit;
      ctx.save();
      if (on) {
        ctx.shadowColor = C.gold; ctx.shadowBlur = 10 + pulse * 8;
      } else ctx.globalAlpha = .84;
      if (lampStates && (lampStates.width || lampStates.naturalWidth)) {
        var liw = lampStates.width || lampStates.naturalWidth, lih = lampStates.height || lampStates.naturalHeight;
        var lsw = liw / 2, lampState = on ? 0 : 1;
        ctx.drawImage(lampStates, lampState * lsw, 0, lsw, lih, lx - 15, ly - 45, 30, 45);
      } else {
        ctx.strokeStyle = on ? C.gold : '#67716e'; ctx.lineWidth = 2;
        A.rr(ctx, lx - 9, ly - 10, 18, 7, 4, on ? '#743817' : '#263136', on ? C.gold : '#67716e', 1.5);
      }
      ctx.restore();
    }
    for (var i = 0; i < SPELL_KEYS.length; i++) {
      var key = SPELL_KEYS[i], meta = SPELL_META[key], pos = SPELL_POS[key];
      var ready = this.hasSpiritLamps(key) && this.spellCd[key] <= 0;
      var cd = this.spellMax[key] > 0 ? clamp(this.spellCd[key] / this.spellMax[key], 0, 1) : 0;
      if (ready) {
        ctx.save();
        ctx.shadowColor = meta.color; ctx.shadowBlur = 18 + Math.sin(this.time * 10) * 5;
        ctx.strokeStyle = '#fff4c6'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 34 + Math.sin(this.time * 8) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      if (this.assets.spellIcons && (this.assets.spellIcons.width || this.assets.spellIcons.naturalWidth)) {
        A.atlasCell(ctx, this.assets.spellIcons, 3, 1, i, pos.x - 31, pos.y - 31, 62, 62, true);
        if (cd > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.arc(pos.x, pos.y, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cd);
          ctx.closePath();
          ctx.fillStyle = 'rgba(3,8,13,.72)'; ctx.fill();
          ctx.restore();
        }
      } else A.icon(ctx, this.assets.icons, meta.icon, pos.x, pos.y, 52, cd);
      if (!ready) {
        ctx.save();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 31, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(3,8,13,.48)'; ctx.fill();
        ctx.restore();
      }
      A.text(ctx, meta.name, pos.x, pos.y + 43, 12, ready ? '#d9ffe8' : '#9ca7a3');
      A.text(ctx, '耗' + this.spellCostFor(key), pos.x + 29, pos.y - 24, 12, ready ? C.gold : '#77827e');
    }
    this.drawAutoCastButton(ctx);
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
    this.drawUpgradeText(ctx, '符箓总览', W / 2, panel.y + 106, 32, '#4a2d0c', 'center', '900');

    var closeX = panel.x + panel.w - 52, closeY = panel.y + 105;
    ctx.save(); ctx.fillStyle = 'rgba(9,17,23,.92)'; ctx.beginPath(); ctx.arc(closeX, closeY, 23, 0, Math.PI * 2); ctx.fill();
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
    this.drawUpgradeText(ctx, selected ? (selected.name + ' · 生效符箓 ' + list.length + ' 条') : '暂无御灵', W / 2, 394, 17, '#553717', 'center', '900');
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

  Game.prototype.drawUpgradeCardFace = function (ctx, card, slot, cardIndex) {
    var rarity = UPGRADE_CARD_FRAME_CROPS[card.rarity] ? card.rarity : 'common';
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
      ctx.drawImage(frame, crop.x, crop.y, crop.w, crop.h, slot.x, slot.y, slot.w, slot.h);
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

    this.drawUpgradeText(ctx, '\u4f24\u5bb3', anchors.tag.x, anchors.tag.y, 17, palette.tag, 'center', '900');
    this.wrapUpgradeText(ctx, card.desc, anchors.desc.x, anchors.desc.y, slot.w - 48, 17, palette.body);
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
    this.drawCardEditor(ctx);
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
    A.panel(ctx, 135, 420, 480, 450, .99);
    A.text(ctx, '阵 法 暂 歇', W / 2, 510, 44, C.gold);
    A.text(ctx, '战斗已暂停', W / 2, 578, 24, C.paper);
    A.text(ctx, '场上御灵不能拖动', W / 2, 645, 21, '#a9c0b8');
    A.text(ctx, '魂归会回到整场开局时的初始布阵格', W / 2, 685, 21, '#a9c0b8');
    A.button(ctx, 225, 740, 300, 92, '继续镇魂', true, '#6d6440');
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
        A.text(ctx, inspected.name + ' · ' + (meta.faction || inspected.faction) + ' / ' + (meta.job || inspected.job), 190, 858, 22, C.gold, 'left');
        A.text(ctx, '生命 ' + Math.ceil(inspected.hp) + ' / ' + inspected.maxHp + '    攻击 ' + Math.round(this.heroAttackPower(inspected)), 190, 892, 18, C.paper, 'left');
        A.text(ctx, '攻速 ' + (1 / Math.max(.01, inspected.attackInterval)).toFixed(2) + '/秒    阻挡 ' + inspected.block + '    范围 ' + (Math.round((inspected.attackRange || 0) / 150 * 10) / 10) + '格', 190, 924, 17, '#9db1aa', 'left');
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
        A.text(ctx, '阻挡 ' + hero.blockedTotal + '  魂归 ' + hero.deaths, 190, y + 38, 16, HERO_META[hero.type].color, 'left');
      }
      A.text(ctx, '道士术法伤害 ' + Math.round(this.spellDamage.fire + this.spellDamage.bell + this.spellDamage.water), W / 2, 900, 20, C.jade);
    } else {
      A.text(ctx, '本 关 怪 物', W / 2, 250, 38, C.gold);
      var enemies = this.currentWaveConfig && this.currentWaveConfig.enemies || {};
      var stage = this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave;
      A.text(ctx, '幽井村 ' + stage + ' · 本波编成', W / 2, 292, 20, C.paper);
      var entries = [];
      if (enemies.wisp) entries.push(['游魂 ×' + enemies.wisp, '速度快 · 血量低 · 数量多']);
      if (enemies.jiangshi) entries.push(['符尸 ×' + enemies.jiangshi, '近战压进 · 接敌后持续攻击']);
      if (enemies.armored) entries.push(['甲尸 ×' + enemies.armored, '高血高伤 · 消耗阻挡位']);
      if (enemies.swift) entries.push(['疾影 ×' + enemies.swift, '高速突进 · 优先关注边路']);
      if (enemies.boss) entries.push(['纸扎人 Boss ×' + enemies.boss, '召来替身 · 高血量 · 突破阵界压力大']);
      if (!entries.length) entries.push(['未知诡物', '本波暂无配置']);
      for (var e = 0; e < entries.length; e++) {
        var ey = 355 + e * 80;
        A.text(ctx, entries[e][0], 155, ey, 22, C.paper, 'left');
        A.text(ctx, entries[e][1], 265, ey, 18, '#9db1aa', 'left');
      }
      A.text(ctx, '首领技能：召来替身、持续压迫阵界', W / 2, 825, 20, C.gold);
      A.text(ctx, '未被阻挡的敌人抵达七星灵灯后会持续破阵', W / 2, 870, 19, '#e99880');
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
        A.text(ctx, inspected.name + ' · ' + (meta.faction || inspected.faction) + ' / ' + (meta.job || inspected.job), 190, 858, 22, C.gold, 'left');
        A.text(ctx, '生命 ' + Math.ceil(inspected.hp) + ' / ' + inspected.maxHp + '    攻击 ' + Math.round(this.heroAttackPower(inspected)), 190, 892, 18, C.paper, 'left');
        A.text(ctx, '攻速 ' + (1 / Math.max(.01, inspected.attackInterval)).toFixed(2) + '/秒    阻挡 ' + inspected.block + '    范围 ' + (Math.round((inspected.attackRange || 0) / 150 * 10) / 10) + '格', 190, 924, 17, '#9db1aa', 'left');
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
        A.text(ctx, '阻挡 ' + hero.blockedTotal + '  魂归 ' + hero.deaths, 190, y + 36, 16, HERO_META[hero.type].color, 'left');
      }
      A.text(ctx, '主角法器伤害 ' + Math.round(this.spellDamage.fire + this.spellDamage.bell + this.spellDamage.water), W / 2, 900, 20, C.jade);
    } else {
      A.text(ctx, '本关怪物详情', W / 2, 250, 38, C.gold);
      var enemies = this.currentWaveConfig && this.currentWaveConfig.enemies || {};
      var stage = this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave;
      A.text(ctx, '幽野村 ' + stage + ' · 本波编成', W / 2, 292, 20, C.paper);
      var entries = [];
      if (enemies.wisp) entries.push(['符纸游魂 ×' + enemies.wisp, '普通怪 · 血量低 · 数量多 · 负责割草反馈']);
      if (enemies.jiangshi) entries.push(['镇魂甲尸 ×' + enemies.jiangshi, '精英怪 · 血厚 · 压阻挡位 · 会削弱前排']);
      if (enemies.boss) entries.push(['纸扎魇主 ×' + enemies.boss, '终局 Boss · 召唤纸偶 · 红线点名 · 破阵压迫']);
      if (!entries.length) entries.push(['暂无怪物', '本波暂未配置']);
      for (var e = 0; e < entries.length; e++) {
        var ey = 365 + e * 86;
        A.text(ctx, entries[e][0], 135, ey, 22, C.paper, 'left');
        A.text(ctx, entries[e][1], 135, ey + 30, 17, '#9db1aa', 'left');
      }
      A.text(ctx, 'Boss 只在第 20 波出现；前 19 波用于形成局内强化构筑。', W / 2, 830, 19, C.gold);
      A.text(ctx, '每波清完固定触发一次三选一强化。', W / 2, 872, 19, '#e99880');
    }
    A.text(ctx, '点击任意处关闭', W / 2, 945, 17, '#80938e');
  };

  Game.prototype.drawResult = function (ctx) {
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

  YL.Game = Game;
}(typeof globalThis !== 'undefined' ? globalThis : this));
