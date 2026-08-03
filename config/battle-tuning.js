(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 战斗手感调参。
   *
   * 当前版本目标：
   * - 5 角色下场自动战斗。
   * - 普通怪成群压进，制造割草感。
   * - 精英怪压阻挡位，Boss 只在第 20 波出现。
   */
  YL.BATTLE_TUNING = {
    upgrade: {
      mode: 'waveClear',
      upgradesPerWave: 1
    },

    spiritLamp: {
      max: 5,
      initial: 1,
      interval: 5
    },

    hero: {
      // 与布阵界面及战斗画面从左到右保持一致。
      roster: ['hongyi', 'huangjin', 'xuanya'],
      unlocked: ['huangjin', 'hongyi', 'xuanya'],

      meleePressY: 540,
      rangedPressY: 805,

      stats: {
        huangjin: {
          slot: 2, row: 2, col: 2,
          hp: 1000, block: 3, search: 580, range: 580, move: 22,
          damage: 60, attackInterval: 2.55, attackMultiplier: 1,
          attackType: 'melee', attackWindup: 0.22, attackRecovery: 0.42,
          defenseStat: 60, ultimate: 14, scale: 0.70
        },
        xuanya: {
          slot: 4, row: 2, col: 4,
          hp: 720, block: 2, search: 850, range: 850, move: 14,
          damage: 78, attackInterval: 1.05, attackMultiplier: 1,
          attackType: 'ranged', projectile: 560, attackWindup: 0.18, attackRecovery: 0.28,
          defenseStat: 28, ultimate: 15, scale: 0.66
        },
        hongyi: {
          slot: 1, row: 2, col: 1,
          hp: 450, block: 1, search: 900, range: 900, move: 14,
          damage: 100, attackInterval: 1.28, attackMultiplier: 1,
          attackType: 'ranged', projectile: 350, attackWindup: 0.30, attackRecovery: 0.35,
          defenseStat: 15, ultimate: 18, scale: 0.64
        },
        suwen: {
          slot: 3, row: 2, col: 3,
          hp: 520, block: 1, search: 800, range: 800, move: 14,
          damage: 82, attackInterval: 1.18, attackMultiplier: 0.90,
          attackType: 'ranged', projectile: 620, attackWindup: 0.26, attackRecovery: 0.34,
          defenseStat: 20, ultimate: 17, scale: 0.64
        },
        qingyi: {
          slot: 0, row: 2, col: 0,
          hp: 600, block: 1, search: 850, range: 850, move: 14,
          damage: 50, attackInterval: 1.25, attackMultiplier: 1,
          attackType: 'ranged', projectile: 520, attackWindup: 0.28, attackRecovery: 0.35,
          defenseStat: 35, ultimate: 13, scale: 0.64
        }
      }
    },

    enemy: {
      speed: {
        wisp: 36.8,
        jiangshi: 25.6,
        boss: 19.2
      },

      sizeScale: {
        wisp: 0.82,
        jiangshi: 0.92,
        boss: 0.96,
        elite: 1.0
      },

      density: {
        spawnIntervalScale: 0.78,
        minSpawnInterval: 0.09,

        packChance: 0.38,
        packMin: 2,
        packMax: 4,

        clusterChance: 0.42,
        clusterLaneChangeChance: 0.46,
        sameLaneChance: 0.46,
        adjacentLaneChance: 0.40,

        xJitter: 22,
        yJitter: 60,

        maxAlive: 58
      }
    }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
