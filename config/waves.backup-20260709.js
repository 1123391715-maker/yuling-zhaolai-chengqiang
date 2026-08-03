(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  // 2026-07-09 之前的旧版 20 波配置备份。
  YL.WAVE_CONFIG_BACKUP_20260709 = [
    { stage: '1-1', spawnInterval: 0.86, enemies: { wisp: 20 } },
    { stage: '1-2', spawnInterval: 0.82, enemies: { wisp: 30, jiangshi: 2 } },
    { stage: '1-3', spawnInterval: 0.78, enemies: { wisp: 50, jiangshi: 3 } },
    { stage: '1-4', spawnInterval: 0.74, enemies: { wisp: 50, jiangshi: 4, armored: 2 } },
    { stage: '1-5', spawnInterval: 0.70, enemies: { wisp: 50, jiangshi: 5, armored: 2 } },
    { stage: '1-6', spawnInterval: 0.66, enemies: { wisp: 50, jiangshi: 5, armored: 4 } },
    { stage: '1-7', spawnInterval: 0.60, enemies: { wisp: 50, jiangshi: 6, armored: 4 } },
    { stage: '1-8', spawnInterval: 0.55, enemies: { wisp: 50, jiangshi: 2, armored: 2, boss: 1 } },
    { stage: '1-9', spawnInterval: 0.54, enemies: { wisp: 5, jiangshi: 3, armored: 1 } },
    { stage: '1-10', spawnInterval: 0.52, miniBoss: true, enemies: { wisp: 5, jiangshi: 3, armored: 1, boss: 1 } },
    { stage: '1-11', spawnInterval: 0.51, enemies: { wisp: 5, jiangshi: 3, armored: 2 } },
    { stage: '1-12', spawnInterval: 0.50, enemies: { wisp: 5, jiangshi: 3, armored: 2, swift: 1 } },
    { stage: '1-13', spawnInterval: 0.49, enemies: { wisp: 5, jiangshi: 4, armored: 2, swift: 1 } },
    { stage: '1-14', spawnInterval: 0.48, enemies: { wisp: 5, jiangshi: 4, armored: 2, swift: 2 } },
    { stage: '1-15', spawnInterval: 0.47, enemies: { wisp: 5, jiangshi: 4, armored: 3, swift: 2 } },
    { stage: '1-16', spawnInterval: 0.46, enemies: { wisp: 6, jiangshi: 4, armored: 3, swift: 2 } },
    { stage: '1-17', spawnInterval: 0.45, enemies: { wisp: 6, jiangshi: 5, armored: 3, swift: 2 } },
    { stage: '1-18', spawnInterval: 0.44, enemies: { wisp: 6, jiangshi: 5, armored: 3, swift: 3 } },
    { stage: '1-19', spawnInterval: 0.42, enemies: { wisp: 7, jiangshi: 5, armored: 4, swift: 3 } },
    { stage: '1-20', spawnInterval: 0.40, enemies: { wisp: 2, jiangshi: 2, armored: 2, swift: 1, boss: 1 } }
  ];
}(typeof globalThis !== 'undefined' ? globalThis : this));
