(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 战斗手感调参。
   *
   * 当前版本目标：
   * - 5 角色下场自动战斗。
   * - 普通怪成群压进，制造割草感。
   * - 精英怪提高阵界压力，Boss 在各关末波压轴出现。
   */
  YL.BATTLE_TUNING = {
    upgrade: {
      mode: 'waveClear',
      upgradesPerWave: 1
    },

    // 精英击杀后的煞签强化：3 根概率最高，2/4 根次高，1/5 根较低，抽出后立即生效。
    // 仅由城墙模式的指定精英触发，避免与 1-2 的灵识选牌混用。
    eliteDraw: {
      enabled: true,
      minWave: 3,
      maxOffersPerBattle: 3,
      eligibleTypes: ['jiangshi'],
      countWeights: [
        { count: 1, weight: 5 },
        { count: 2, weight: 25 },
        { count: 3, weight: 40 },
        { count: 4, weight: 25 },
        { count: 5, weight: 5 }
      ]
    },

    spiritLamp: {
      max: 5,
      initial: 1,
      interval: 15
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
          // 守备原型中黄巾的实际接战距离为 92px；寻敌只留 48px 缓冲，
          // 不再在怪物尚远时提前压到守备扇区前沿。
          hp: 1000, block: 3, search: 140, range: 580, move: 22,
          damage: 60, attackInterval: 2.55, attackMultiplier: 1,
          attackType: 'melee', attackWindup: 0.22, attackRecovery: 0.42,
          defenseStat: 60, ultimate: 14, scale: 0.70
        },
        xuanya: {
          slot: 3, row: 2, col: 4,
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
        },
        nuba: {
          slot: 4, row: 2, col: 4,
          hp: 680, block: 1, search: 900, range: 900, move: 14,
          damage: 128, attackInterval: 1.18, attackMultiplier: 1,
          attackType: 'ranged', projectile: 0, attackWindup: 0.30, attackRecovery: 0.40,
          // 女魃素材透明留白较多，按可见身形校准到与其他御灵接近的战斗高度。
          defenseStat: 18, ultimate: 19, scale: 1.02
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
        // 甲尸是当前城墙关的精英辨识锚点，约为普通游魂的两倍体型。
        elite: 1.67
      },

      // 仅给 1-2「御灵守备」V2 使用的可读性节奏。
      // 普通游魂缩小，精英和 Boss 保留轮廓；敌人更快抵达交战带，
      // 但攻城动作放慢，压力来自怪潮而不是密集掉血。
      spiritLineV2: {
        speed: {
          wisp: 60,
          jiangshi: 42,
          boss: 31
        },

        sizeScale: {
          wisp: 0.72,
          jiangshi: 1.0,
          boss: 1.0,
          elite: 1.06
        },

        attackRate: {
          wisp: 1.85,
          jiangshi: 2.10,
          boss: 2.40
        },

        // 漏怪接近城门后，御灵临时打破守备区索敌限制并回身拦截。
        // 只扩大紧急索敌，不扩大常规攻击判定和常规巡逻范围。
        breachResponse: {
          warningDistance: 72,
          meleeSearch: 360
        }
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
