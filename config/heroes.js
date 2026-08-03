(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 普攻配置。
   * interval：每隔多少秒普攻一次。
   * multiplier：攻击力倍率，1 = 100%。
   * range：攻击范围，当前战场约 1 格 = 150px。
   * type：ranged 远程 / melee 近战。
   * windup：前摇时间。
   */
  YL.HERO_ATTACK_CONFIG = {
    hongyi: {
      type: 'ranged',
      interval: 1.28,
      multiplier: 1,
      range: 900,
      windup: 0.30,
      projectileSpeed: 350
    },
    xuanya: {
      type: 'ranged',
      interval: 1.05,
      multiplier: 1,
      range: 850,
      windup: 0.18,
      projectileSpeed: 560
    },
    huangjin: {
      type: 'melee',
      interval: 1.55,
      multiplier: 1,
      range: 620,
      windup: 0.25
    },
    suwen: {
      type: 'ranged',
      interval: 1.18,
      multiplier: 0.9,
      range: 800,
      windup: 0.26,
      projectileSpeed: 620
    },
    qingyi: {
      type: 'ranged',
      interval: 1.25,
      multiplier: 1,
      range: 850,
      windup: 0.28,
      projectileSpeed: 520
    }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
