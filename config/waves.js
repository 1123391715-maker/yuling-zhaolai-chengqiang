(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 《御灵召来》幽野村 1-1 演示版 10 波怪潮配置。
   *
   * 节奏目标：
   * - 前 2 波：保留教学和拾取空间。
   * - 第 3-6 波：开始出现明显怪潮，配合 2/4/6 波固定挂件掉落形成构筑反馈。
   * - 第 7-10 波：显著提高同屏压力和怪物血量，让红衣铺火、黄巾控场、玄鸦收割都有发挥空间。
   * - 当前 10 波总怪量约 625 只，先贴近竞品 500-800 只/局的下限做性能与爽感验证。
   */
  YL.WAVE_CONFIG = [
    { stage: '1-1', spawnInterval: 1.08, enemyHpScale: 0.82, enemies: { wisp: 10 } },
    { stage: '1-2', spawnInterval: 1.00, enemyHpScale: 0.88, enemies: { wisp: 14 } },
    { stage: '1-3', spawnInterval: 0.92, enemyHpScale: 0.98, enemies: { wisp: 24, jiangshi: 1 } },
    { stage: '1-4', spawnInterval: 0.80, enemyHpScale: 1.10, enemyDamageScale: 0.92, enemies: { wisp: 36, jiangshi: 2 } },
    { stage: '1-5', spawnInterval: 0.70, enemyHpScale: 1.22, enemyDamageScale: 0.94, enemies: { wisp: 52, jiangshi: 4 } },
    { stage: '1-6', spawnInterval: 0.62, enemyHpScale: 1.36, enemyDamageScale: 0.96, enemies: { wisp: 66, jiangshi: 5 } },
    { stage: '1-7', spawnInterval: 0.55, enemyHpScale: 1.14, enemyDamageScale: 0.53, enemies: { wisp: 78, jiangshi: 7 } },
    { stage: '1-8', spawnInterval: 0.50, enemyHpScale: 1.29, enemyDamageScale: 0.54, enemies: { wisp: 92, jiangshi: 9 } },
    { stage: '1-9', spawnInterval: 0.46, enemyHpScale: 1.46, enemyDamageScale: 0.55, enemies: { wisp: 108, jiangshi: 12 } },
    {
      stage: '1-10',
      spawnInterval: 0.52,
      enemyHpScale: 1.69,
      enemyDamageScale: 0.58,
      eliteHpScale: 1.16,
      eliteDamageScale: 1.35,
      eliteAttackRateScale: 0.90,
      pressureName: '魂潮压境',
      enemies: { wisp: 90, jiangshi: 14, boss: 1 },
      sequence: [
        { type: 'wisp', count: 24 },
        { type: 'jiangshi', count: 3 },
        { gap: 0.7 },
        { type: 'wisp', count: 26 },
        { type: 'jiangshi', count: 4 },
        { gap: 0.55 },
        { type: 'wisp', count: 24 },
        { type: 'jiangshi', count: 4 },
        { gap: 0.45 },
        { type: 'wisp', count: 16 },
        { type: 'jiangshi', count: 3 }
      ]
    }
  ];
}(typeof globalThis !== 'undefined' ? globalThis : this));
