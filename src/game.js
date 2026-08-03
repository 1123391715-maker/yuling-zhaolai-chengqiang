(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};
  var A = YL.Art, C = YL.COLORS, W = YL.W, H = YL.H;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist2(a, b, c, d) { var x = a - c, y = b - d; return x * x + y * y; }
  function choice(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function cover(ctx, img, x, y, w, h) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
    return true;
  }

  function Game(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options || {};
    this.platform = this.options.platform || 'web';
    this.wx = this.options.wx;
    this.audio = new YL.AudioBus(this.platform);
    this.dpr = 1;
    this.screenW = W;
    this.screenH = H;
    this.assets = {};
    this.loaded = 0;
    this.loadTotal = 0;
    this.state = 'loading';
    this.last = 0;
    this.time = 0;
    this.pointer = { x: W / 2, y: H / 2, down: false };
    this.aiming = false;
    this.dragHero = null;
    this.selectedSkill = null;
    this.shake = 0;
    this.paused = false;
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
      this.screenW = info.windowWidth;
      this.screenH = info.windowHeight;
      this.dpr = Math.min(2, info.pixelRatio || 1);
    } else {
      this.screenW = root.innerWidth || W;
      this.screenH = root.innerHeight || H;
      this.dpr = Math.min(2, root.devicePixelRatio || 1);
    }
    this.canvas.width = Math.floor(W * this.dpr);
    this.canvas.height = Math.floor(H * this.dpr);
  };

  Game.prototype.raf = function (fn) {
    var r = root.requestAnimationFrame || (this.wx && this.wx.requestAnimationFrame);
    if (r) r(fn);
    else setTimeout(function () { fn(Date.now()); }, 16);
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
    if (this.platform === 'wechat') {
      return { x: p.clientX / this.screenW * W, y: p.clientY / this.screenH * H };
    }
    var r = this.canvas.getBoundingClientRect();
    return { x: (p.clientX - r.left) / r.width * W, y: (p.clientY - r.top) / r.height * H };
  };

  Game.prototype.bindInput = function () {
    var self = this;
    function start(e) {
      var p = e.touches ? e.touches[0] : e;
      if (!p) return;
      var q = self.mapPoint(p);
      self.pointer.x = q.x; self.pointer.y = q.y; self.pointer.down = true;
      self.onDown(q.x, q.y);
      if (e.preventDefault) e.preventDefault();
    }
    function move(e) {
      var p = e.touches ? e.touches[0] : e;
      if (!p) return;
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
    }
  };

  Game.prototype.onDown = function (x, y) {
    this.audio.unlock();
    if (this.state === 'title') {
      if (y > 1040 && y < 1155) { this.audio.tone('bell'); this.beginBattle(); }
      return;
    }
    if (this.state === 'result') {
      if (y > 1090 && y < 1205) { this.audio.tone('bell'); this.beginBattle(); }
      return;
    }
    if (this.state !== 'battle') return;
    if (this.infoOverlay) { this.infoOverlay = null; return; }
    if (this.paused) {
      if (x > 225 && x < 525 && y > 735 && y < 825) this.paused = false;
      return;
    }
    if (this.phase === 'cards') {
      for (var ci = 0; ci < 3; ci++) {
        var cx = 40 + ci * 230;
        if (x >= cx && x <= cx + 210 && y >= 405 && y <= 840) {
          this.pickUpgrade(ci);
          return;
        }
      }
      return;
    }
    if (x > 648 && y < 125) { this.infoOverlay = 'details'; return; }
    if (x > 665 && y >= 125 && y < 535) {
      var sideIndex = Math.floor((y - 125) / 82);
      if (sideIndex === 0) this.paused = true;
      else if (sideIndex === 1) this.infoOverlay = 'damage';
      else if (sideIndex === 2) { this.speed = this.speed >= 3 ? 1 : this.speed + 1; this.floatText(625, 320, '×' + this.speed + ' 倍速', C.gold, 22); }
      else if (sideIndex === 3) this.infoOverlay = 'faction';
      else if (sideIndex === 4) { this.autoSkills = !this.autoSkills; this.floatText(610, 500, this.autoSkills ? '自动法器：开' : '自动法器：关', this.autoSkills ? C.jade : C.paper, 20); }
      return;
    }
    if (x > 665 && y >= 1000) {
      var skillIndex = Math.floor((y - 1000) / 79);
      if (skillIndex === 0) this.selectTargetSkill('fire');
      else if (skillIndex === 1) this.castBell();
      else if (skillIndex === 2) this.selectTargetSkill('water');
      else if (skillIndex === 3) this.castNight();
      return;
    }
    for (var i = 0; i < this.heroes.length; i++) {
      var h = this.heroes[i];
      if (dist2(x, y, h.x, h.y) < 60 * 60) {
        this.dragHero = h;
        h.dragging = true;
        return;
      }
    }
    if (y < 970) {
      this.aiming = true;
      this.pointer.x = x; this.pointer.y = y;
    }
  };

  Game.prototype.onMove = function (x, y) {
    if (this.dragHero) {
      this.dragHero.x = clamp(x, 95, 655);
      this.dragHero.y = clamp(y, 1035, 1270);
    }
  };

  Game.prototype.onUp = function (x, y) {
    if (this.state !== 'battle' || this.paused || this.phase === 'cards') return;
    if (this.dragHero) {
      var target = 0, best = Infinity;
      for (var i = 0; i < this.slots.length; i++) {
        var d = dist2(x, y, this.slots[i].x, this.slots[i].y);
        if (d < best) { best = d; target = i; }
      }
      var other = null;
      for (var j = 0; j < this.heroes.length; j++) if (this.heroes[j].slot === target) other = this.heroes[j];
      if (other) {
        other.slot = this.dragHero.slot;
        other.x = this.slots[other.slot].x; other.y = this.slots[other.slot].y;
      }
      this.dragHero.slot = target;
      this.dragHero.x = this.slots[target].x; this.dragHero.y = this.slots[target].y;
      this.dragHero.dragging = false;
      this.dragHero = null;
      this.burst(x, y, C.gold, 12);
      return;
    }
    if (this.aiming && y < 970) {
      if (this.selectedSkill === 'fire') this.castFire(x, y);
      else if (this.selectedSkill === 'water') this.castWater(x, y);
      else this.playerShot(x, y);
    }
    this.aiming = false;
  };

  Game.prototype.beginBattle = function () {
    this.state = 'battle';
    this.phase = 'wave';
    this.wave = 1;
    this.waveMax = YL.WAVE_CONFIG && YL.WAVE_CONFIG.length ? YL.WAVE_CONFIG.length : 8;
    this.yin = 0;
    this.coins = 0;
    this.score = 0;
    this.kills = 0;
    this.damageDone = 0;
    this.gameTime = 0;
    this.nightTime = 0;
    this.nightCount = 0;
    this.waveRewardScale = 1;
    this.playerCooldown = 0;
    this.combo = 0;
    this.comboTime = 0;
    this.selectedSkill = null;
    this.speed = 1;
    this.autoSkills = false;
    this.autoThink = 0;
    this.infoOverlay = null;
    this.upgradeCount = 0;
    this.skillCd = { fire: 0, bell: 0, water: 0 };
    this.skillMax = { fire: 7, bell: 12, water: 9 };
    this.mods = {
      playerMulti: 1, playerDamage: 48, playerPierce: 0,
      burnShots: false, heroSpeed: 1, burnGround: false,
      yinGain: 1, bellFactor: 1, shield: 0
    };
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.zones = [];
    this.slots = [
      { x: 220, y: 1088 }, { x: 530, y: 1088 }, { x: 175, y: 1225 },
      { x: 375, y: 1250 }, { x: 575, y: 1225 }
    ];
    this.heroes = [
      { type: 'hongyi', name: '红衣', slot: 2, x: 175, y: 1225, hp: 200, maxHp: 200, cd: 0, rate: 1.02, damage: 64, range: 1100, flash: 0, scale: .72, attackAnim: 0, attackDuration: .34 },
      { type: 'huangjin', name: '黄巾', slot: 0, x: 220, y: 1088, hp: 240, maxHp: 240, cd: 0, rate: 1.32, damage: 46, range: 1000, flash: 0, scale: .75, attackAnim: 0, attackDuration: .4 },
      { type: 'qingyi', name: '青衣', slot: 4, x: 575, y: 1225, hp: 180, maxHp: 180, cd: 0, rate: 1.15, damage: 50, range: 1100, flash: 0, scale: .7, attackAnim: 0, attackDuration: .38 }
    ];
    this.baseMax = 620;
    this.baseHp = this.baseMax;
    this.pendingUpgrades = [];
    this.waveBanner = 2.2;
    this.message = '拖动御灵换阵 · 拖向敌群松手发射魂弹';
    this.messageTime = 6;
    this.startWave(1);
  };

  Game.prototype.startWave = function (n) {
    this.wave = n;
    this.phase = 'wave';
    this.spawnTimer = 0.4;
    this.waveBanner = 1.8;
    this.waveQueue = [];
    var fallback = { stage: '1-' + n, spawnInterval: Math.max(.35, .92 - n * .055), enemies: { wisp: 4 + n * 2 } };
    var config = YL.WAVE_CONFIG && YL.WAVE_CONFIG[n - 1] ? YL.WAVE_CONFIG[n - 1] : fallback;
    this.currentWaveConfig = config;
    var normalTypes = ['wisp', 'jiangshi', 'armored'];
    for (var ti = 0; ti < normalTypes.length; ti++) {
      var type = normalTypes[ti];
      var amount = Math.max(0, Math.floor(config.enemies[type] || 0));
      for (var ai = 0; ai < amount; ai++) this.waveQueue.push(type);
    }
    shuffle(this.waveQueue);
    var bosses = Math.max(0, Math.floor(config.enemies.boss || 0));
    for (var bi = 0; bi < bosses; bi++) this.waveQueue.push('boss');
    this.waveTotal = this.waveQueue.length;
  };

  Game.prototype.spawnEnemy = function (type, elite) {
    var lanes = [125, 250, 375, 500, 625];
    var waveScale = 1 + (this.wave - 1) * 0.16;
    var data = {
      wisp: { hp: 90, speed: 48, damage: 24, size: .82, reward: 8 },
      jiangshi: { hp: 185, speed: 35, damage: 40, size: .94, reward: 13 },
      armored: { hp: 360, speed: 25, damage: 68, size: 1.02, reward: 20 },
      boss: { hp: 3300, speed: 13, damage: 220, size: 1.38, reward: 180 }
    }[type];
    var hp = data.hp * waveScale * (elite ? 1.7 : 1);
    this.enemies.push({
      id: this.idSeed++, type: type, x: choice(lanes) + (Math.random() * 30 - 15), y: 145,
      hp: hp, maxHp: hp, speed: data.speed * (elite ? 1.15 : 1), damage: data.damage,
      size: data.size * (elite ? 1.08 : 1), reward: data.reward * (elite ? 2 : 1),
      hit: 0, burn: 0, burnDps: 0, burnTick: 0, slow: 0, elite: !!elite,
      age: 0, summonCd: type === 'boss' ? 4 : 99, summonAnim: 0,
      attacking: false, attackAnim: 0, attackDuration: type === 'boss' ? .78 : .58
    });
  };

  Game.prototype.selectTargetSkill = function (name) {
    if (this.skillCd[name] > 0) { this.floatText(375, 1070, '符法尚在回息', '#c7c7bd', 22); return; }
    this.selectedSkill = this.selectedSkill === name ? null : name;
    this.message = name === 'fire' ? '点按战场：落下焚火符阵' : '点按战场：斩出渡水剑气';
    this.messageTime = 2.5;
  };

  Game.prototype.castFire = function (x, y) {
    if (this.skillCd.fire > 0) return;
    this.skillCd.fire = this.skillMax.fire;
    this.selectedSkill = null;
    this.triggerHeroAttack('hongyi', .56);
    this.audio.tone('bell');
    this.damageArea(x, y, 105, 145, true);
    this.zones.push({ type: 'fire', x: x, y: y, r: 80, life: this.mods.burnGround ? 6 : 3.5, tick: 0 });
    this.burst(x, y, C.fire, 30);
    this.shake = 8;
  };

  Game.prototype.castWater = function (x, y) {
    if (this.skillCd.water > 0) return;
    this.skillCd.water = this.skillMax.water;
    this.selectedSkill = null;
    this.triggerHeroAttack('qingyi', .52);
    this.audio.tone('shoot');
    var sx = 375, sy = 985, ang = Math.atan2(y - sy, x - sx), len = 1000;
    this.zones.push({ type: 'slash', x: sx, y: sy, tx: sx + Math.cos(ang) * len, ty: sy + Math.sin(ang) * len, life: .45 });
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      var d = this.pointLineDistance(e.x, e.y, sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      if (d < 48 + e.size * 15) { this.damageEnemy(e, 120); e.slow = Math.max(e.slow, 2.2); }
    }
    this.shake = 5;
  };

  Game.prototype.castBell = function () {
    if (this.skillCd.bell > 0) { this.floatText(375, 1070, '摄魂铃尚在回息', '#c7c7bd', 22); return; }
    this.skillCd.bell = this.skillMax.bell * this.mods.bellFactor;
    this.triggerHeroAttack('huangjin', .58);
    this.audio.tone('bell');
    this.zones.push({ type: 'ring', x: 375, y: 905, r: 20, life: .8 });
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].slow = Math.max(this.enemies[i].slow, 4);
      this.damageEnemy(this.enemies[i], 25);
    }
    this.message = '铃音定魂：全场迟滞';
    this.messageTime = 1.8;
  };

  Game.prototype.castNight = function () {
    if (this.yin < 100 || this.nightTime > 0) {
      this.floatText(600, 1070, this.nightTime > 0 ? '百鬼夜行中' : '阴气尚未满槽', '#c7c7bd', 22);
      return;
    }
    this.yin = 0;
    this.nightTime = 8;
    this.nightCount++;
    this.audio.tone('bell');
    this.spawnEnemy('wisp', true); this.spawnEnemy('jiangshi', true); this.spawnEnemy('wisp', true);
    this.message = '百鬼夜行！我方威力大增，敌潮也更凶险';
    this.messageTime = 3;
    this.shake = 12;
  };

  Game.prototype.playerShot = function (x, y) {
    if (this.playerCooldown > 0) {
      this.floatText(375, 985, '回息', '#c8c2ad', 18);
      return;
    }
    this.playerCooldown = .43;
    this.audio.tone('shoot');
    var sx = 375, sy = 1000, ang = Math.atan2(y - sy, x - sx), count = this.mods.playerMulti;
    for (var i = 0; i < count; i++) {
      var spread = (i - (count - 1) / 2) * .105;
      this.projectiles.push({
        kind: 'player', x: sx, y: sy, vx: Math.cos(ang + spread) * 780, vy: Math.sin(ang + spread) * 780,
        life: 1.4, damage: this.mods.playerDamage * (this.nightTime > 0 ? 1.55 : 1),
        color: C.paper, r: 8, pierce: this.mods.playerPierce, hitIds: {}
      });
    }
    this.burst(sx, sy - 5, C.gold, 7);
  };

  Game.prototype.heroShot = function (h, e) {
    var colors = { hongyi: C.fire, qingyi: C.blue, huangjin: C.gold };
    this.projectiles.push({
      kind: 'hero', hero: h.type, x: h.x, y: h.y - 30, target: e,
      speed: h.type === 'huangjin' ? 410 : 520,
      life: 2.1, damage: h.damage * (this.nightTime > 0 ? 1.5 : 1),
      color: colors[h.type], r: h.type === 'huangjin' ? 9 : 7, hitIds: {}
    });
    h.flash = .11;
    h.attackAnim = h.attackDuration;
  };

  Game.prototype.triggerHeroAttack = function (type, duration) {
    for (var i = 0; i < this.heroes.length; i++) {
      if (this.heroes[i].type === type) {
        this.heroes[i].attackDuration = duration;
        this.heroes[i].attackAnim = duration;
        this.heroes[i].flash = .16;
        break;
      }
    }
  };

  Game.prototype.damageArea = function (x, y, r, damage, burn) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      if (dist2(x, y, e.x, e.y) < (r + 15 * e.size) * (r + 15 * e.size)) {
        this.damageEnemy(e, damage);
        if (burn) { e.burn = Math.max(e.burn, 4); e.burnDps = Math.max(e.burnDps, 26); }
      }
    }
  };

  Game.prototype.damageEnemy = function (e, damage) {
    if (!e || e.hp <= 0) return;
    e.hp -= damage;
    e.hit = .11;
    this.damageDone += damage;
    if (Math.random() < .32 || damage > 100) this.floatText(e.x, e.y - 38, '-' + Math.round(damage), damage > 110 ? '#ffd36a' : '#f3e1bb', damage > 110 ? 28 : 22);
    if (e.hp <= 0) this.killEnemy(e);
  };

  Game.prototype.killEnemy = function (e) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    this.coins += Math.round(e.reward * this.waveRewardScale);
    this.score += Math.round(e.reward * 10 * (1 + this.combo * .04));
    this.yin = clamp(this.yin + (e.type === 'boss' ? 35 : 7) * this.mods.yinGain, 0, 100);
    this.combo = Math.min(20, this.combo + 1); this.comboTime = 2.4;
    this.burst(e.x, e.y, e.type === 'boss' ? C.fire : C.jade, e.type === 'boss' ? 55 : 18);
    this.floatText(e.x, e.y - 25, e.type === 'boss' ? '镇魂！' : '+' + e.reward + ' 铜钱', C.gold, e.type === 'boss' ? 38 : 20);
    this.audio.tone(e.type === 'boss' ? 'win' : 'hit');
    if (e.type === 'boss') this.shake = 18;
  };

  Game.prototype.pointLineDistance = function (px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    var t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.sqrt(dist2(px, py, x1 + t * dx, y1 + t * dy));
  };

  Game.prototype.burst = function (x, y, color, count) {
    count = Math.min(count, 50);
    for (var i = 0; i < count && this.particles.length < 180; i++) {
      var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 150;
      this.particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: .35 + Math.random() * .55, max: .9, color: color, size: 2 + Math.random() * 5 });
    }
  };

  Game.prototype.floatText = function (x, y, value, color, size) {
    if (this.floaters.length < 30) this.floaters.push({ x: x, y: y, value: value, color: color, size: size, life: 1, max: 1 });
  };

  Game.prototype.update = function (dt) {
    this.time += dt * (this.state === 'battle' ? (this.speed || 1) : 1);
    if (this.state !== 'battle' || this.paused || this.phase === 'cards') return;
    dt *= this.speed || 1;
    this.gameTime += dt;
    this.playerCooldown = Math.max(0, this.playerCooldown - dt);
    this.waveBanner = Math.max(0, this.waveBanner - dt);
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.comboTime -= dt;
    if (this.comboTime <= 0) this.combo = 0;
    if (this.nightTime > 0) this.nightTime = Math.max(0, this.nightTime - dt);
    for (var sk in this.skillCd) this.skillCd[sk] = Math.max(0, this.skillCd[sk] - dt);
    for (var hfi = 0; hfi < this.heroes.length; hfi++) {
      this.heroes[hfi].flash = Math.max(0, this.heroes[hfi].flash - dt);
      this.heroes[hfi].attackAnim = Math.max(0, this.heroes[hfi].attackAnim - dt);
    }
    if (this.autoSkills && this.enemies.length) {
      this.autoThink -= dt;
      if (this.autoThink <= 0) {
        this.autoThink = .5;
        var autoTarget = this.enemies[0];
        if (this.skillCd.fire <= 0) this.castFire(autoTarget.x, autoTarget.y);
        else if (this.skillCd.water <= 0) this.castWater(autoTarget.x, autoTarget.y);
        else if (this.skillCd.bell <= 0 && this.enemies.length >= 3) this.castBell();
        if (this.yin >= 100 && this.nightTime <= 0) this.castNight();
      }
    }

    if (this.phase === 'wave') {
      this.spawnTimer -= dt;
      if (this.waveQueue.length && this.spawnTimer <= 0) {
        this.spawnEnemy(this.waveQueue.shift(), false);
        this.spawnTimer = Math.max(.15, this.currentWaveConfig && this.currentWaveConfig.spawnInterval || .7);
      }
    } else if (this.phase === 'intermission') {
      this.intermission -= dt;
      if (this.intermission <= 0) {
        if (this.wave === 2 || this.wave === 4 || this.wave === 6) this.offerUpgrades();
        else this.startWave(this.wave + 1);
      }
    }

    this.updateHeroes(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateEffects(dt);

    for (var ei = this.enemies.length - 1; ei >= 0; ei--) if (this.enemies[ei].dead) this.enemies.splice(ei, 1);
    if (this.state === 'battle' && this.phase === 'wave' && !this.waveQueue.length && !this.enemies.length) {
      if (this.wave >= this.waveMax) this.endBattle(true);
      else { this.phase = 'intermission'; this.intermission = 1.5; this.message = '此波已清 · 阵眼稍息'; this.messageTime = 1.5; }
    }
  };

  Game.prototype.updateHeroes = function (dt) {
    for (var i = 0; i < this.heroes.length; i++) {
      var h = this.heroes[i];
      if (h.dragging) continue;
      h.cd -= dt;
      if (h.cd > 0) continue;
      var target = null, best = Infinity;
      for (var j = 0; j < this.enemies.length; j++) {
        var e = this.enemies[j];
        if (e.dead) continue;
        var d = dist2(h.x, h.y, e.x, e.y);
        if (d < h.range * h.range && d < best) { best = d; target = e; }
      }
      if (target) {
        this.heroShot(h, target);
        h.cd = h.rate / this.mods.heroSpeed;
      }
    }
  };

  Game.prototype.updateEnemies = function (dt) {
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      if (e.dead) continue;
      e.age += dt; e.hit = Math.max(0, e.hit - dt); e.slow = Math.max(0, e.slow - dt);
      e.summonAnim = Math.max(0, e.summonAnim - dt);
      e.burn -= dt; e.burnTick -= dt;
      if (e.burn > 0 && e.burnTick <= 0) {
        this.damageEnemy(e, e.burnDps);
        e.burnTick = .55;
        this.burst(e.x + Math.random() * 12 - 6, e.y - 20, C.fire, 3);
      }
      if (e.attacking) {
        e.attackAnim = Math.max(0, e.attackAnim - dt);
        if (e.attackAnim <= 0) {
          e.dead = true;
          var harm = Math.max(0, e.damage - this.mods.shield);
          this.mods.shield = Math.max(0, this.mods.shield - e.damage);
          this.baseHp = Math.max(0, this.baseHp - harm);
          this.syncHeroHealth();
          this.floatText(e.x, 965, '-' + Math.round(harm) + ' 阵眼', C.danger, 25);
          this.burst(e.x, 985, C.danger, 20);
          this.audio.tone('hurt'); this.shake = 12;
          if (this.baseHp <= 0) { this.baseHp = 0; this.endBattle(false); return; }
        }
        continue;
      }
      var speedFactor = e.slow > 0 ? .48 : 1;
      if (this.nightTime > 0) speedFactor *= 1.35;
      e.y += e.speed * speedFactor * dt;
      e.x += Math.sin(e.age * 1.4 + e.id) * 4 * dt;
      if (e.type === 'boss') {
        e.summonCd -= dt;
        if (e.summonCd <= 0 && e.y < 850) {
          this.spawnEnemy(Math.random() < .5 ? 'wisp' : 'jiangshi', false);
          var child = this.enemies[this.enemies.length - 1];
          child.y = e.y - 25; child.x = clamp(e.x + (Math.random() * 160 - 80), 100, 650);
          e.summonAnim = .65;
          e.summonCd = 4.4;
          this.message = '纸扎人撒出替身！'; this.messageTime = 1.4;
        }
      }
      if (e.y > 930) {
        e.y = 930;
        e.attacking = true;
        e.attackAnim = e.attackDuration;
      }
    }
  };

  Game.prototype.updateProjectiles = function (dt) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      p.life -= dt;
      if (p.kind === 'hero') {
        if (!p.target || p.target.dead) { p.life = 0; }
        else {
          var dx = p.target.x - p.x, dy = p.target.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          p.x += dx / d * p.speed * dt; p.y += dy / d * p.speed * dt;
          if (d < 22 + p.target.size * 14) {
            this.damageEnemy(p.target, p.damage);
            if (p.hero === 'hongyi') {
              p.target.burn = Math.max(p.target.burn, 3.2); p.target.burnDps = Math.max(p.target.burnDps, 19);
            } else if (p.hero === 'qingyi') p.target.slow = Math.max(p.target.slow, 1.5);
            else this.damageArea(p.target.x, p.target.y, 45, p.damage * .35, false);
            this.burst(p.x, p.y, p.color, 8);
            p.life = 0;
          }
        }
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt;
        for (var j = this.enemies.length - 1; j >= 0; j--) {
          var e = this.enemies[j];
          if (e.dead || p.hitIds[e.id]) continue;
          if (dist2(p.x, p.y, e.x, e.y) < (p.r + 22 * e.size) * (p.r + 22 * e.size)) {
            p.hitIds[e.id] = true;
            this.damageEnemy(e, p.damage);
            if (this.mods.burnShots) { e.burn = Math.max(e.burn, 2.8); e.burnDps = Math.max(e.burnDps, 17); }
            this.burst(p.x, p.y, p.color, 7);
            if (p.pierce > 0) p.pierce--; else p.life = 0;
            break;
          }
        }
      }
      if (p.life <= 0 || p.x < -30 || p.x > W + 30 || p.y < -50 || p.y > 1060) this.projectiles.splice(i, 1);
    }
  };

  Game.prototype.updateZones = function (dt) {
    for (var i = this.zones.length - 1; i >= 0; i--) {
      var z = this.zones[i]; z.life -= dt;
      if (z.type === 'fire') {
        z.tick -= dt;
        if (z.tick <= 0) { this.damageArea(z.x, z.y, z.r, 23, true); z.tick = .5; }
      } else if (z.type === 'ring') z.r += 560 * dt;
      if (z.life <= 0) this.zones.splice(i, 1);
    }
  };

  Game.prototype.updateEffects = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.vx *= .985;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (var j = this.floaters.length - 1; j >= 0; j--) {
      var f = this.floaters[j]; f.life -= dt; f.y -= 36 * dt;
      if (f.life <= 0) this.floaters.splice(j, 1);
    }
    this.shake = Math.max(0, this.shake - dt * 32);
  };

  Game.prototype.offerUpgrades = function () {
    var pool = [
      { id: 'triple', icon: 4, name: '三焰追魂', tag: '攻势', desc: '魂弹增加 2 枚散射弹', color: C.fire },
      { id: 'ground', icon: 5, name: '炼狱余烬', tag: '符火', desc: '焚火符阵持续时间 +70%', color: C.red },
      { id: 'swift', icon: 6, name: '乘风结', tag: '阵法', desc: '全体御灵攻速 +22%', color: C.jade },
      { id: 'peach', icon: 7, name: '桃符护命', tag: '守御', desc: '修复 140 阵眼并获得护盾', color: '#f4a7a0' },
      { id: 'pierce', icon: 2, name: '渡水锋', tag: '魂弹', desc: '魂弹可额外贯穿 1 个目标', color: C.blue },
      { id: 'burn', icon: 0, name: '炎纹印', tag: '灼烧', desc: '手动魂弹附加灼烧', color: C.fire },
      { id: 'bell', icon: 1, name: '回响铃', tag: '控制', desc: '摄魂铃冷却缩短 25%', color: C.gold },
      { id: 'yin', icon: 9, name: '引魂灯', tag: '阴气', desc: '击杀所得阴气 +35%', color: C.jade }
    ];
    shuffle(pool);
    this.pendingUpgrades = pool.slice(0, 3);
    this.phase = 'cards';
    this.audio.tone('bell');
  };

  Game.prototype.pickUpgrade = function (index) {
    var u = this.pendingUpgrades[index];
    if (!u) return;
    if (u.id === 'triple') this.mods.playerMulti = Math.min(5, this.mods.playerMulti + 2);
    if (u.id === 'ground') this.mods.burnGround = true;
    if (u.id === 'swift') this.mods.heroSpeed *= 1.22;
    if (u.id === 'peach') { this.baseHp = Math.min(this.baseMax, this.baseHp + 140); this.syncHeroHealth(); this.mods.shield += 80; }
    if (u.id === 'pierce') this.mods.playerPierce++;
    if (u.id === 'burn') this.mods.burnShots = true;
    if (u.id === 'bell') this.mods.bellFactor *= .75;
    if (u.id === 'yin') this.mods.yinGain *= 1.35;
    this.upgradeCount = Math.min(3, this.upgradeCount + 1);
    this.pendingUpgrades = [];
    this.message = '符箓入阵 · ' + u.name;
    this.messageTime = 2;
    this.startWave(this.wave + 1);
  };

  Game.prototype.syncHeroHealth = function () {
    var ratio = this.baseMax ? this.baseHp / this.baseMax : 0;
    for (var i = 0; i < this.heroes.length; i++) this.heroes[i].hp = Math.round(this.heroes[i].maxHp * ratio);
  };

  Game.prototype.endBattle = function (win) {
    if (this.state !== 'battle') return;
    this.state = 'result';
    this.win = win;
    this.finalScore = this.score + Math.round(this.baseHp * 2 + this.coins * 5 + (win ? 3000 : 0));
    this.rewardShards = win ? 12 + this.nightCount * 3 : Math.max(2, this.wave);
    this.audio.tone(win ? 'win' : 'hurt');
  };

  Game.prototype.loop = function (stamp) {
    var now = stamp || Date.now();
    if (!this.last) this.last = now;
    var dt = clamp((now - this.last) / 1000, 0, .034);
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf(this.boundLoop);
  };

  Game.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (this.state === 'loading') this.drawLoading(ctx);
    else if (this.state === 'title') this.drawTitle(ctx);
    else if (this.state === 'battle') this.drawBattle(ctx);
    else this.drawResult(ctx);
  };

  Game.prototype.drawLoading = function (ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#071522'); g.addColorStop(1, '#102426');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, 590); ctx.rotate(this.time * 1.5);
    ctx.strokeStyle = C.jade; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 1.45); ctx.stroke(); ctx.restore();
    A.text(ctx, '正在点亮招魂灯…', W / 2, 690, 30, C.paper);
    A.bar(ctx, 175, 750, 400, 18, this.loaded, Math.max(1, this.loadTotal), C.jade);
  };

  Game.prototype.drawTitle = function (ctx) {
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) {
      ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    }
    var fade = ctx.createLinearGradient(0, 0, 0, 480);
    fade.addColorStop(0, 'rgba(4,12,22,.88)'); fade.addColorStop(1, 'rgba(4,12,22,0)');
    ctx.fillStyle = fade; ctx.fillRect(0, 0, W, 500);
    ctx.save();
    ctx.shadowColor = '#2a0804'; ctx.shadowBlur = 16;
    A.text(ctx, '御 灵 召 来', W / 2, 180, 74, '#f7d58c', 'center', '900');
    A.text(ctx, '幽井村 · 试炼夜', W / 2, 248, 27, '#8de3cc');
    ctx.restore();
    A.panel(ctx, 78, 930, 594, 86, .76);
    A.text(ctx, '守住阵眼 · 画符召灵 · 迎战八波诡潮', W / 2, 973, 26, C.paper);
    A.button(ctx, 150, 1040, 450, 112, '镇  魂  入  梦', true, '#bd5a2e');
    A.text(ctx, '竖屏触控 · 建议开启声音', W / 2, 1196, 21, '#b8c9c2');
    A.text(ctx, '战斗 Demo  ·  v0.1', W / 2, 1260, 18, 'rgba(255,243,210,.65)');
  };

  Game.prototype.drawBattle = function (ctx) {
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    if (!cover(ctx, this.assets.battlefield, 0, 0, W, 1040)) {
      var bg = ctx.createLinearGradient(0, 0, 0, 1040);
      bg.addColorStop(0, '#142a36'); bg.addColorStop(1, '#19251e');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 1040);
    }
    ctx.fillStyle = 'rgba(5,13,18,.16)'; ctx.fillRect(0, 0, W, 1040);
    if (this.nightTime > 0) {
      ctx.fillStyle = 'rgba(71,15,37,' + (0.18 + Math.sin(this.time * 5) * .035) + ')';
      ctx.fillRect(0, 0, W, 1040);
    }
    this.drawBattleTop(ctx);
    this.drawZones(ctx);
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      A.enemy(ctx, e, this.time, this.assets);
      this.drawEnemyBar(ctx, e);
    }
    this.drawProjectiles(ctx);
    this.drawEffects(ctx);
    if (this.aiming) this.drawAim(ctx);
    if (this.waveBanner > 0) this.drawWaveBanner(ctx);
    if (this.messageTime > 0) {
      A.rr(ctx, 90, 765, 570, 52, 20, 'rgba(7,15,20,.78)', 'rgba(219,168,76,.5)', 2);
      A.text(ctx, this.message, W / 2, 791, 22, C.paper);
    }
    ctx.restore();
    this.drawRightRail(ctx);
    this.drawBottomHud(ctx);
    if (this.phase === 'cards') this.drawUpgradeCards(ctx);
    if (this.paused) this.drawPause(ctx);
    if (this.infoOverlay) this.drawInfoOverlay(ctx);
  };

  Game.prototype.drawBattleTop = function (ctx) {
    A.panel(ctx, 18, 16, 620, 102, .86);
    A.text(ctx, '幽井村  ' + (this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave), 110, 43, 23, C.paper);
    A.bar(ctx, 40, 68, 240, 25, this.baseHp, this.baseMax, C.red, '#241318', Math.ceil(this.baseHp) + ' / ' + this.baseMax);
    A.text(ctx, '第 ' + this.wave + ' / ' + this.waveMax + ' 波', 430, 43, 28, C.white);
    var total = Math.max(1, this.waveTotal || (this.waveQueue.length + this.enemies.length));
    var remaining = this.waveQueue.length + this.enemies.length;
    A.bar(ctx, 330, 74, 200, 14, total - remaining, total, C.jade);
    A.text(ctx, '剩余 ' + remaining + ' / ' + total, 575, 84, 17, C.paper);
    A.button(ctx, 650, 22, 82, 90, '详情', true, '#5c4b32');
  };

  Game.prototype.drawEnemyBar = function (ctx, e) {
    var w = e.type === 'boss' ? 150 : 70, y = e.y - (e.type === 'boss' ? 148 : 83) * e.size;
    A.bar(ctx, e.x - w / 2, y, w, e.type === 'boss' ? 12 : 8, e.hp, e.maxHp, e.elite ? '#ca6bdc' : C.red, '#171118');
    if (e.elite) {
      ctx.fillStyle = '#c679dc'; ctx.beginPath(); ctx.arc(e.x - w / 2 - 8, y + 4, 5, 0, 7); ctx.fill();
    }
    if (e.burn > 0) {
      ctx.fillStyle = C.fire; ctx.beginPath(); ctx.arc(e.x + w / 2 + 8, y + 4, 5, 0, 7); ctx.fill();
    }
  };

  Game.prototype.drawShrine = function (ctx) {
    ctx.save(); ctx.translate(375, 1002);
    ctx.fillStyle = '#2c211b'; A.rr(ctx, -58, -22, 116, 48, 14, '#2c211b', C.gold2, 3);
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, -18, 15, 0, 7); ctx.fill();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -18, 25 + Math.sin(this.time * 4) * 3, 0, 7); ctx.stroke();
    A.text(ctx, '阵 眼', 0, 16, 17, C.paper);
    ctx.restore();
  };

  Game.prototype.drawZones = function (ctx) {
    for (var i = 0; i < this.zones.length; i++) {
      var z = this.zones[i];
      ctx.save();
      if (z.type === 'fire') {
        ctx.globalAlpha = Math.min(1, z.life * 1.5);
        var g = ctx.createRadialGradient(z.x, z.y, 5, z.x, z.y, z.r);
        g.addColorStop(0, 'rgba(255,215,90,.75)'); g.addColorStop(.45, 'rgba(255,92,31,.48)'); g.addColorStop(1, 'rgba(130,23,12,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill();
        for (var f = 0; f < 5; f++) {
          ctx.fillStyle = f % 2 ? '#ffb338' : '#f04a24';
          ctx.beginPath(); ctx.arc(z.x + Math.sin(this.time * 4 + f) * z.r * .55, z.y + Math.cos(this.time * 3 + f) * z.r * .35, 6 + f, 0, 7); ctx.fill();
        }
      } else if (z.type === 'ring') {
        ctx.strokeStyle = 'rgba(255,221,133,' + z.life + ')'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke();
      } else {
        ctx.globalAlpha = clamp(z.life * 3, 0, 1);
        ctx.strokeStyle = C.blue; ctx.lineWidth = 22; ctx.shadowColor = C.blue; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(z.tx, z.ty); ctx.stroke();
        ctx.strokeStyle = '#e5fbff'; ctx.lineWidth = 5; ctx.stroke();
      }
      ctx.restore();
    }
  };

  Game.prototype.drawProjectiles = function (ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = 15; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      ctx.globalAlpha = .5; ctx.strokeStyle = p.color; ctx.lineWidth = p.r;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.vx || 0) * .035, p.y - (p.vy || 0) * .035); ctx.stroke();
      ctx.restore();
    }
  };

  Game.prototype.drawEffects = function (ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var j = 0; j < this.floaters.length; j++) {
      var f = this.floaters[j];
      ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
      A.text(ctx, f.value, f.x, f.y, f.size, f.color);
    }
    ctx.globalAlpha = 1;
  };

  Game.prototype.drawAim = function (ctx) {
    var x = clamp(this.pointer.x, 30, W - 30), y = clamp(this.pointer.y, 130, 990);
    ctx.save(); ctx.strokeStyle = this.selectedSkill === 'fire' ? C.fire : this.selectedSkill === 'water' ? C.blue : C.paper;
    ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.globalAlpha = .75;
    ctx.beginPath(); ctx.moveTo(375, 982); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(x, y, this.selectedSkill ? 44 : 25, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 55, y); ctx.lineTo(x + 55, y); ctx.moveTo(x, y - 55); ctx.lineTo(x, y + 55); ctx.stroke();
    ctx.restore();
  };

  Game.prototype.drawWaveBanner = function (ctx) {
    var a = clamp(this.waveBanner * 1.2, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    var y = 230 + (1 - a) * -25;
    A.panel(ctx, 155, y, 440, 100, .82);
    A.text(ctx, this.wave === 8 ? '凶 兆 · 纸 扎 迎 亲' : '诡 潮 · 第 ' + this.wave + ' 波', W / 2, y + 39, 34, this.wave === 8 ? '#ff9d65' : C.paper);
    A.text(ctx, this.wave === 8 ? 'Boss 来袭' : '守住幽井村阵眼', W / 2, y + 73, 20, C.jade);
    ctx.restore();
  };

  Game.prototype.drawBottomHud = function (ctx) {
    ctx.fillStyle = '#08121a'; ctx.fillRect(0, 960, W, 374);
    A.panel(ctx, 8, 966, 734, 360, .97);
    A.bar(ctx, 165, 974, 420, 28, this.baseHp, this.baseMax, C.red, '#25151a', '五灵阵血量  ' + Math.ceil(this.baseHp) + ' / ' + this.baseMax);
    A.text(ctx, this.selectedSkill ? '已选法器 · 点按战场释放' : '拖动阵位换阵 · 战场拖动发射魂弹', W / 2, 947, 18, '#abc0b8');
    A.text(ctx, '角色技', 42, 991, 17, C.paper);
    A.text(ctx, '法 器', 708, 991, 17, C.paper);
    A.panel(ctx, 13, 1004, 60, 312, .82);
    A.panel(ctx, 677, 1004, 60, 312, .82);

    var leftYs = [1039, 1116, 1193, 1270], leftIcons = [4, 5, 6, 7];
    for (var li = 0; li < 4; li++) A.icon(ctx, this.assets.icons, leftIcons[li], 43, leftYs[li], 52, 0);

    ctx.save();
    ctx.strokeStyle = 'rgba(219,168,76,.42)'; ctx.lineWidth = 3;
    var order = [0, 4, 1, 2, 3, 0];
    ctx.beginPath();
    for (var oi = 0; oi < order.length; oi++) {
      var sp = this.slots[order[oi]];
      if (oi === 0) ctx.moveTo(sp.x, sp.y - 34); else ctx.lineTo(sp.x, sp.y - 34);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(375, 1130, 115 + Math.sin(this.time * 1.8) * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    for (var si = 0; si < this.slots.length; si++) {
      var slot = this.slots[si], occupied = false;
      for (var hi = 0; hi < this.heroes.length; hi++) if (this.heroes[hi].slot === si) occupied = true;
      ctx.save();
      ctx.beginPath(); ctx.arc(slot.x, slot.y - 34, 45, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? 'rgba(34,57,61,.42)' : 'rgba(8,19,27,.7)'; ctx.fill();
      ctx.strokeStyle = occupied ? C.gold : '#536266'; ctx.lineWidth = 3; ctx.stroke();
      if (!occupied) { A.text(ctx, '空', slot.x, slot.y - 34, 20, '#72817f'); }
      ctx.restore();
    }

    this.drawTaoistCore(ctx);
    for (var h = 0; h < this.heroes.length; h++) A.hero(ctx, this.heroes[h], this.time, this.assets);

    A.text(ctx, '五 行 聚 灵 阵', W / 2, 1288, 21, C.gold);
    A.bar(ctx, 245, 1306, 260, 14, this.upgradeCount, 3, C.gold, '#151b20', 'Lv.' + (1 + this.upgradeCount));

    var rightYs = [1039, 1118, 1197, 1276], indexes = [0, 1, 2, 9];
    var cds = [
      this.skillCd.fire / this.skillMax.fire,
      this.skillCd.bell / (this.skillMax.bell * this.mods.bellFactor),
      this.skillCd.water / this.skillMax.water,
      this.yin >= 100 || this.nightTime > 0 ? 0 : 1 - this.yin / 100
    ];
    for (var i = 0; i < 4; i++) {
      var selected = (i === 0 && this.selectedSkill === 'fire') || (i === 2 && this.selectedSkill === 'water');
      if (selected) {
        ctx.strokeStyle = i === 0 ? C.fire : C.blue; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(707, rightYs[i], 33 + Math.sin(this.time * 6) * 2, 0, 7); ctx.stroke();
      }
      A.icon(ctx, this.assets.icons, indexes[i], 707, rightYs[i], 52, clamp(cds[i], 0, 1));
    }
    A.text(ctx, '阴气 ' + Math.floor(this.yin), 707, 1310, 15, this.yin >= 100 ? '#ff9bc0' : C.jade);
  };

  Game.prototype.drawTaoistCore = function (ctx) {
    var img = this.assets.title;
    ctx.save();
    ctx.beginPath(); ctx.arc(375, 1128, 58, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#101a21'; ctx.fillRect(315, 1068, 120, 120);
    if (img && (img.width || img.naturalWidth)) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      ctx.drawImage(img, iw * .11, ih * .46, iw * .5, ih * .48, 315, 1048, 120, 176);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(375, 1128, 61, 0, Math.PI * 2);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.stroke();
    A.text(ctx, '御灵师', 375, 1193, 16, C.paper);
  };

  Game.prototype.drawRightRail = function (ctx) {
    A.panel(ctx, 675, 132, 66, 406, .82);
    var ys = [170, 252, 334, 416, 498];
    var labels = ['Ⅱ', '数', '×' + (this.speed || 1), '阵', '自'];
    for (var i = 0; i < 5; i++) {
      var active = i === 4 ? this.autoSkills : true;
      A.button(ctx, 684, ys[i] - 29, 48, 58, labels[i], active, i === 4 && this.autoSkills ? '#257f6e' : '#5c4b32');
    }
  };

  Game.prototype.drawInfoOverlay = function (ctx) {
    ctx.fillStyle = 'rgba(3,8,13,.76)'; ctx.fillRect(0, 0, W, H);
    A.panel(ctx, 115, 290, 520, 510, .98);
    if (this.infoOverlay === 'details') {
      A.text(ctx, '幽井村  ' + (this.currentWaveConfig && this.currentWaveConfig.stage || '1-' + this.wave) + ' · 敌情', W / 2, 355, 34, C.gold);
      var configured = this.currentWaveConfig && this.currentWaveConfig.enemies || {};
      var entries = [
        ['游魂', 3, '本波 ×' + (configured.wisp || 0)],
        ['符尸 / 甲尸', 4, '本波 ×' + ((configured.jiangshi || 0) + (configured.armored || 0))],
        ['纸扎人', 5, configured.boss ? '本波 Boss ×' + configured.boss : '本波不出现']
      ];
      for (var i = 0; i < entries.length; i++) {
        var yy = 455 + i * 105;
        A.portrait(ctx, this.assets.characters, entries[i][1], 205, yy, 76);
        A.text(ctx, entries[i][0], 275, yy - 14, 24, C.paper, 'left');
        A.text(ctx, entries[i][2], 275, yy + 20, 18, '#9db1aa', 'left');
      }
      A.text(ctx, '出怪间隔：' + ((this.currentWaveConfig && this.currentWaveConfig.spawnInterval) || .7) + ' 秒', W / 2, 735, 18, C.jade);
    } else if (this.infoOverlay === 'damage') {
      A.text(ctx, '伤 害 数 据', W / 2, 365, 36, C.gold);
      A.text(ctx, '累计伤害', 205, 470, 23, '#9db1aa', 'left');
      A.text(ctx, Math.round(this.damageDone) + '', 545, 470, 29, C.white, 'right');
      A.text(ctx, '镇伏诡物', 205, 540, 23, '#9db1aa', 'left');
      A.text(ctx, this.kills + '', 545, 540, 29, C.white, 'right');
      A.text(ctx, '平均每秒', 205, 610, 23, '#9db1aa', 'left');
      A.text(ctx, Math.round(this.damageDone / Math.max(1, this.gameTime)) + '', 545, 610, 29, C.jade, 'right');
    } else {
      A.text(ctx, '阵 营 加 成', W / 2, 365, 36, C.gold);
      A.text(ctx, '五行聚灵阵', W / 2, 455, 28, C.paper);
      A.text(ctx, '火 · 红衣：灼烧伤害 +15%', W / 2, 525, 21, '#ef9b75');
      A.text(ctx, '土 · 黄巾：阵法减伤 +8%', W / 2, 575, 21, '#d8bd73');
      A.text(ctx, '水 · 青衣：减速时间 +20%', W / 2, 625, 21, '#7dcbea');
    }
    A.text(ctx, '点击任意处关闭', W / 2, 752, 18, '#80938e');
  };

  Game.prototype.drawUpgradeCards = function (ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(3,8,14,.86)'; ctx.fillRect(0, 0, W, H);
    A.text(ctx, '梦 中 得 符', W / 2, 200, 52, C.gold);
    A.text(ctx, '选一道符箓，强化本局御灵阵', W / 2, 258, 24, C.paper);
    for (var i = 0; i < 3; i++) {
      var u = this.pendingUpgrades[i], x = 40 + i * 230;
      A.panel(ctx, x, 405, 210, 435, .98);
      ctx.fillStyle = u.color; A.rr(ctx, x + 18, 425, 174, 34, 14, u.color);
      A.text(ctx, u.tag, x + 105, 442, 18, C.ink);
      A.icon(ctx, this.assets.icons, u.icon, x + 105, 565, 130, 0);
      A.text(ctx, u.name, x + 105, 666, 28, C.gold);
      this.wrapText(ctx, u.desc, x + 105, 724, 165, 24, C.paper);
      A.text(ctx, '点按选择', x + 105, 803, 18, C.jade);
    }
    A.portrait(ctx, this.assets.characters, 0, 375, 970, 130);
    A.text(ctx, '“符入火中，才算活。”', W / 2, 1070, 25, '#f0c0aa');
    ctx.restore();
  };

  Game.prototype.wrapText = function (ctx, value, x, y, maxW, size, color) {
    var chars = value.split(''), line = '', lines = [];
    ctx.save(); ctx.font = '700 ' + size + 'px "Microsoft YaHei","PingFang SC",sans-serif';
    for (var i = 0; i < chars.length; i++) {
      var test = line + chars[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = chars[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    for (var j = 0; j < lines.length; j++) A.text(ctx, lines[j], x, y + j * (size + 7), size, color);
  };

  Game.prototype.drawPause = function (ctx) {
    ctx.fillStyle = 'rgba(3,8,13,.83)'; ctx.fillRect(0, 0, W, H);
    A.panel(ctx, 135, 430, 480, 430, .98);
    A.text(ctx, '暂  离  阳  世', W / 2, 520, 45, C.gold);
    A.text(ctx, '战斗已暂停', W / 2, 590, 24, C.paper);
    A.text(ctx, '拖动御灵可交换阵位', W / 2, 650, 21, '#a9c0b8');
    A.text(ctx, '拖向战场并松手可发射魂弹', W / 2, 688, 21, '#a9c0b8');
    A.button(ctx, 225, 735, 300, 90, '继续镇魂', true, '#6d6440');
  };

  Game.prototype.drawResult = function (ctx) {
    if (!cover(ctx, this.assets.title, 0, 0, W, H)) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(4,9,14,.76)'; ctx.fillRect(0, 0, W, H);
    A.panel(ctx, 70, 150, 610, 1015, .94);
    A.text(ctx, this.win ? '诡 事 已 镇' : '阵 眼 失 守', W / 2, 245, 54, this.win ? C.gold : '#e87868');
    A.text(ctx, this.win ? '幽井村的灯，又亮了一夜。' : '梦醒尚可重来，道行并未白费。', W / 2, 315, 24, C.paper);
    A.portrait(ctx, this.assets.characters, 0, 375, 445, 170);
    A.text(ctx, this.win ? '红衣 · 焚葬之火' : '红衣 · 再试一次', W / 2, 560, 27, '#edac8a');
    var rows = [
      ['镇守波次', this.wave + ' / ' + this.waveMax],
      ['镇伏诡物', this.kills + ''],
      ['百鬼夜行', this.nightCount + ' 次'],
      ['铜钱', this.coins + ''],
      ['总评分', this.finalScore + '']
    ];
    for (var i = 0; i < rows.length; i++) {
      var yy = 630 + i * 65;
      ctx.strokeStyle = 'rgba(219,168,76,.25)'; ctx.beginPath(); ctx.moveTo(145, yy + 30); ctx.lineTo(605, yy + 30); ctx.stroke();
      A.text(ctx, rows[i][0], 175, yy, 23, '#9eb3aa', 'left');
      A.text(ctx, rows[i][1], 575, yy, 25, i === 4 ? C.gold : C.white, 'right');
    }
    A.text(ctx, '本轮收益', W / 2, 960, 24, C.gold);
    A.icon(ctx, this.assets.icons, 10, 305, 1023, 72, 0);
    A.text(ctx, '+' + this.rewardShards + ' 红衣碎片', 455, 1023, 23, C.paper);
    A.button(ctx, 150, 1090, 450, 105, this.win ? '再 镇 一 局' : '重 整 阵 法', true, '#a8492b');
    A.text(ctx, '失败也按波次结算收益', W / 2, 1252, 19, '#89a39b');
  };

  YL.Game = Game;
}(typeof globalThis !== 'undefined' ? globalThis : this));
