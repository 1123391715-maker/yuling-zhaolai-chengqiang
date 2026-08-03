(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  function AudioBus(platform) {
    this.platform = platform;
    this.enabled = true;
    this.ctx = null;
    this.music = {};
    this.samplePools = {};
    this.sampleIndex = {};
    this.sampleLast = {};
    this.musicName = null;
    this.pendingMusic = null;
    this.musicUnlocked = false;
  }
  AudioBus.prototype.unlock = function () {
    if (this.platform === 'web' && !this.ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    this.musicUnlocked = true;
    this.applyMusic();
  };
  AudioBus.prototype.createMusic = function (name) {
    if (this.music[name]) return this.music[name];
    var source = YL.AUDIO && YL.AUDIO[name];
    if (!source) return null;
    var track = null;
    if (this.platform !== 'web' && root.wx && root.wx.createInnerAudioContext) {
      track = root.wx.createInnerAudioContext();
      track.src = source;
      track.loop = true;
      track.volume = .34;
    } else if (root.Audio) {
      track = new root.Audio();
      track.src = source;
      track.loop = true;
      track.preload = 'auto';
      track.volume = .34;
    }
    this.music[name] = track;
    return track;
  };
  AudioBus.prototype.setMusic = function (name) {
    if (this.pendingMusic === name && this.musicName === name) return;
    this.pendingMusic = name;
    this.applyMusic();
  };
  AudioBus.prototype.applyMusic = function () {
    var name = this.pendingMusic;
    if (!this.musicUnlocked || !name || this.musicName === name) return;
    var previous = this.music[this.musicName];
    if (previous && previous.stop) previous.stop();
    else if (previous && previous.pause) { previous.pause(); previous.currentTime = 0; }
    var track = this.createMusic(name);
    this.musicName = name;
    if (!track || !track.play) return;
    var promise = track.play();
    if (promise && promise.catch) promise.catch(function () {});
  };
  AudioBus.prototype.sampleSource = function (name) {
    return YL.SFX && YL.SFX[name] || YL.AUDIO && YL.AUDIO.sfx && YL.AUDIO.sfx[name] || null;
  };
  AudioBus.prototype.sampleVolume = function (name, options) {
    if (options && options.volume != null) return options.volume;
    var table = {
      uiTap: .34,
      uiCardOpen: .50,
      upgradeCommon: .54,
      upgradeRare: .62,
      upgradeLegendary: .72,
      waveStart: .58,
      waveClear: .58,
      bossAppear: .72,
      enemyHit: .30,
      enemyDie: .32,
      wallHitLight: .52,
      wallHitHeavy: .68,
      hongyiFireHit: .46,
      huangjinDrumWave: .50,
      xuanyaBladeHit: .44,
      spellWind: .76,
      spellRain: .70,
      runeDrop: .58,
      runePickup: .56,
      runeEquip: .62,
      energyFull: .50,
      ultimateHongyi: .78,
      ultimateHuangjin: .76,
      ultimateXuanya: .76,
      victory: .78,
      defeat: .72
    };
    return table[name] == null ? .5 : table[name];
  };
  AudioBus.prototype.sampleThrottle = function (name, options) {
    if (options && options.throttle != null) return options.throttle;
    var table = {
      enemyHit: .055,
      enemyDie: .035,
      wallHitLight: .12,
      wallHitHeavy: .18,
      hongyiFireHit: .055,
      huangjinDrumWave: .08,
      xuanyaBladeHit: .055,
      uiTap: .035
    };
    return table[name] == null ? 0 : table[name];
  };
  AudioBus.prototype.samplePoolSize = function (name) {
    if (name === 'enemyHit' || name === 'hongyiFireHit' || name === 'xuanyaBladeHit') return 5;
    if (name === 'enemyDie' || name === 'huangjinDrumWave') return 4;
    return 2;
  };
  AudioBus.prototype.createSample = function (name, source) {
    var sample = null;
    if (this.platform !== 'web' && root.wx && root.wx.createInnerAudioContext) {
      sample = root.wx.createInnerAudioContext();
      sample.src = source;
      sample.loop = false;
      sample.volume = this.sampleVolume(name);
    } else if (root.Audio) {
      sample = new root.Audio();
      sample.src = source;
      sample.loop = false;
      sample.preload = 'auto';
      sample.volume = this.sampleVolume(name);
    }
    return sample;
  };
  AudioBus.prototype.createSamplePool = function (name) {
    if (this.samplePools[name]) return this.samplePools[name];
    var source = this.sampleSource(name);
    if (!source) return null;
    var pool = [], size = this.samplePoolSize(name);
    for (var i = 0; i < size; i++) {
      var sample = this.createSample(name, source);
      if (sample) pool.push(sample);
    }
    this.samplePools[name] = pool;
    this.sampleIndex[name] = 0;
    return pool;
  };
  AudioBus.prototype.playSfx = function (name, options) {
    if (!this.enabled || !this.musicUnlocked || !name) return false;
    var source = this.sampleSource(name);
    if (!source) return false;
    var now = Date.now() / 1000;
    var throttle = this.sampleThrottle(name, options);
    if (throttle > 0 && this.sampleLast[name] && now - this.sampleLast[name] < throttle) return false;
    this.sampleLast[name] = now;
    var pool = this.createSamplePool(name);
    if (!pool || !pool.length) return false;
    var index = this.sampleIndex[name] || 0;
    var sample = pool[index % pool.length];
    this.sampleIndex[name] = (index + 1) % pool.length;
    if (!sample || !sample.play) return false;
    sample.volume = this.sampleVolume(name, options);
    if (sample.stop) sample.stop();
    else if (sample.pause) sample.pause();
    try { sample.currentTime = 0; } catch (e) {}
    var promise = sample.play();
    if (promise && promise.catch) promise.catch(function () {});
    return true;
  };
  AudioBus.prototype.tone = function (type) {
    var alias = type === 'win' ? 'victory' : null;
    if (alias && this.playSfx(alias)) return;
    if (!this.enabled || !this.ctx) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    var f = type === 'hit' ? 180 : type === 'bell' ? 520 : type === 'win' ? 720 : type === 'hurt' ? 95 : 300;
    o.type = type === 'bell' ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(f, t);
    if (type === 'shoot') o.frequency.exponentialRampToValueAtTime(190, t + 0.08);
    if (type === 'win') o.frequency.exponentialRampToValueAtTime(1050, t + 0.22);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(type === 'bell' ? 0.08 : 0.045, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (type === 'bell' ? 0.5 : 0.16));
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.55);
  };
  YL.AudioBus = AudioBus;
}(typeof globalThis !== 'undefined' ? globalThis : this));
