(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  // 当前开放的三关复用已验证的城墙战斗配置；1-1/1-2 为八波，1-3 收束为十二波。
  // 每关保留独立副本，后续调 1-2 / 1-3 数值或怪物编成时不会影响已验收的 1-1。
  function copyCurrentBattle() {
    var source = YL.WAVE_CONFIG || [];
    return source.map(function (wave) {
      var result = {}, key;
      for (key in wave) result[key] = wave[key];
      if (wave.enemies) {
        result.enemies = {};
        for (key in wave.enemies) result.enemies[key] = wave.enemies[key];
      }
      if (wave.sequence) {
        result.sequence = wave.sequence.map(function (item) {
          var sequenceItem = {}, itemKey;
          for (itemKey in item) sequenceItem[itemKey] = item[itemKey];
          return sequenceItem;
        });
      }
      return result;
    });
  }

  // 首局只保留教学所需的短怪潮。每关从同一基础模板复制后再写入独立的
  // 数量、血量和出怪间隔，避免青衣加入后 1-2 仍和 1-1 一样被瞬间清空。
  function guidedBattle(waves, stageId) {
    var source = copyCurrentBattle();
    return waves.map(function (tuning, index) {
      // 长关会超出基础十波模板；这里必须每波新建副本，避免末段波次共用同一对象。
      var template = source[Math.min(index, source.length - 1)] || {};
      var wave = {}, templateKey;
      for (templateKey in template) wave[templateKey] = template[templateKey];
      var enemies = tuning.enemies || {};
      wave.enemies = {};
      for (var type in enemies) wave.enemies[type] = enemies[type];
      for (var tuningKey in tuning) if (tuningKey !== 'enemies') wave[tuningKey] = tuning[tuningKey];
      wave.stage = stageId || '1-1';
      // 引导关不复用后期 Boss 的分段序列；每一波都是清晰、连续的短怪潮。
      delete wave.sequence;
      return wave;
    });
  }

  // 1-2 是“阵主后方火力 + 御灵守备区阻挡”的独立验证关。
  // 它沿用十波压力曲线，但不再围绕开局召来御灵设计。
  function copySpiritLineBattle() {
    var waves = copyCurrentBattle();
    // V2 的三名初始御灵与阵主火力较高，不能继续沿用旧关卡的教学数量。
    // 目标：首波即形成可见怪群，中后段保持怪潮压力；只提高数量、生命与出怪节奏，
    // 不额外提高敌方伤害，避免把“看得到怪潮”误做成“瞬间城防崩盘”。
    var siegeCurve = [
      { enemies: { wisp: 18 }, spawnInterval: .64, enemyHpScale: 1.18 },
      { enemies: { wisp: 26 }, spawnInterval: .54, enemyHpScale: 1.32 },
      { enemies: { wisp: 38, jiangshi: 2 }, spawnInterval: .48, enemyHpScale: 1.48 },
      { enemies: { wisp: 52, jiangshi: 3 }, spawnInterval: .42, enemyHpScale: 1.65 },
      { enemies: { wisp: 66, jiangshi: 5 }, spawnInterval: .38, enemyHpScale: 1.83 },
      { enemies: { wisp: 80, jiangshi: 7 }, spawnInterval: .35, enemyHpScale: 2.02 },
      { enemies: { wisp: 94, jiangshi: 9 }, spawnInterval: .33, enemyHpScale: 2.22 },
      { enemies: { wisp: 112, jiangshi: 12 }, spawnInterval: .31, enemyHpScale: 2.43 },
      { enemies: { wisp: 132, jiangshi: 15 }, spawnInterval: .29, enemyHpScale: 2.65 },
      { enemies: { wisp: 124, jiangshi: 20, boss: 1 }, spawnInterval: .32, enemyHpScale: 2.90 }
    ];
    for (var i = 0; i < waves.length && i < siegeCurve.length; i++) {
      var curve = siegeCurve[i];
      waves[i].enemies = curve.enemies;
      waves[i].spawnInterval = curve.spawnInterval;
      waves[i].enemyHpScale = curve.enemyHpScale;
      // 原第十波的间隔序列会把怪潮拆得过散，V2 改为连续压入。
      delete waves[i].sequence;
    }
    return waves;
  }

  // 1-2 的“角色直接下场 + 守备区阻挡”原型暂不进入试玩流程。
  // 保留完整配置及专用波次，待有验证时间时可原样恢复，不删除任何 V2 实验代码。
  var archivedSpiritLinePrototype = {
    id: 'archive-spirit-line-v2-1-2',
    sourceStageId: '1-2',
    volume: '第一卷·幽野村',
    name: '井畔孤灯 · 守备原型备份',
    recommendedPower: 1000,
    archived: true,
    battleMode: 'spirit-line-v2',
    xpProgression: { firstNeed: 64, growth: 1.52, maxNeed: 720 },
    waves: copySpiritLineBattle()
  };

  // 归档配置不参与首页选关、布阵或战斗；1-2 的当前正式入口回退为城墙战斗。
  YL.ARCHIVED_STAGE_CONFIG = [archivedSpiritLinePrototype];
  YL.STAGE_CONFIG = [
    {
      id: '1-1',
      volume: '第一卷·幽野村',
      name: '纸人夜叩门',
      recommendedPower: 1000,
      resultRewards: {
      success: [
        { id: 'lingyun', name: '灵蕴', amount: 1280, doubleEligible: true }
      ],
        failure: [
          { id: 'lingyun', name: '灵蕴', amount: 320, doubleEligible: true }
        ]
      },
      // 首局完整教学关：8 波纯普通游魂，先由阵主独自应战，第三波召来三名初始御灵，
      // 第五波开放主角技能。第五波起普通游魂数量翻倍，让主角技面对真实怪潮；
      // 第八波额外提高 30% 怪物血量，作为首关收束压力。
      waves: guidedBattle([
        { enemies: { wisp: 8 }, spawnInterval: 0.98, enemyHpScale: 0.72 },
        { enemies: { wisp: 12 }, spawnInterval: 0.92, enemyHpScale: 0.78 },
        { enemies: { wisp: 18 }, spawnInterval: 0.86, enemyHpScale: 0.84 },
        { enemies: { wisp: 22 }, spawnInterval: 0.80, enemyHpScale: 0.90 },
        { enemies: { wisp: 52 }, spawnInterval: 0.74, enemyHpScale: 0.96 },
        { enemies: { wisp: 60 }, spawnInterval: 0.68, enemyHpScale: 1.02 },
        { enemies: { wisp: 68 }, spawnInterval: 0.62, enemyHpScale: 1.08 },
        { enemies: { wisp: 76 }, spawnInterval: 0.58, enemyHpScale: 1.14 * 1.30 }
      ], '1-1')
    },
    {
      id: '1-2',
      volume: '第一卷·幽野村',
      name: '井畔孤灯',
      recommendedPower: 1000,
      resultRewards: {
        success: [
          { id: 'lingyun', name: '灵蕴', amount: 1280, doubleEligible: true },
          { id: 'spiritSeed', faction: 'universal', name: '万灵种', amount: 50, doubleEligible: true }
        ],
        failure: [
          { id: 'lingyun', name: '灵蕴', amount: 320, doubleEligible: true }
        ]
      },
      // 青衣加入后采用 8 波；血量沿用原 1-2 波次配置，不额外改动。
      // 精英只在第 5 波出现 1 只；第 8 波先清完小怪，再触发最后一次强化，最后才出现 Boss。
      // 只提高怪量与生命，敌方伤害保持克制，避免弱倍速提示变成强制生存门槛。
      waves: guidedBattle([
        { enemies: { wisp: 36 }, spawnInterval: 0.86, enemyHpScale: 0.84, enemyDamageScale: 0.14 },
        { enemies: { wisp: 52 }, spawnInterval: 0.80, enemyHpScale: 0.92, enemyDamageScale: 0.14 },
        { enemies: { wisp: 76 }, spawnInterval: 0.74, enemyHpScale: 1.00, enemyDamageScale: 0.15 },
        { enemies: { wisp: 100 }, spawnInterval: 0.68, enemyHpScale: 1.10, enemyDamageScale: 0.15 },
        { enemies: { wisp: 124, jiangshi: 1 }, spawnInterval: 0.62, enemyHpScale: 1.20, enemyDamageScale: 0.16 },
        { enemies: { wisp: 148 }, spawnInterval: 0.58, enemyHpScale: 1.30, enemyDamageScale: 0.16 },
        { enemies: { wisp: 176 }, spawnInterval: 0.54, enemyHpScale: 1.40, enemyDamageScale: 0.18 },
        { enemies: { wisp: 204, boss: 1 }, spawnInterval: 0.50, enemyHpScale: 1.50, enemyDamageScale: 0.18 }
      ], '1-2')
    },
    {
      id: '1-3',
      volume: '第一卷·幽野村',
      name: '村门夜禁',
      recommendedPower: 1000,
      resultRewards: {
        success: [
          { id: 'lingyun', name: '灵蕴', amount: 1280, doubleEligible: true },
          { id: 'spiritSeed', faction: 'universal', name: '万灵种', amount: 100, doubleEligible: true }
        ],
        failure: [
          { id: 'lingyun', name: '灵蕴', amount: 320, doubleEligible: true }
        ]
      },
      // 不再假设青衣已经升星。精英只在第 3、6 波各出现 1 只；第 10 波后进入末段，
      // 第 12 波让剧情威胁真实推进到城墙前，关底 Boss 血量额外提高 50%。
      waves: guidedBattle([
        { enemies: { wisp: 36 }, spawnInterval: 0.82, enemyHpScale: 0.90, enemyDamageScale: 0.05 },
        { enemies: { wisp: 44 }, spawnInterval: 0.78, enemyHpScale: 0.94, enemyDamageScale: 0.05 },
        { enemies: { wisp: 52, jiangshi: 1 }, spawnInterval: 0.74, enemyHpScale: 0.98, enemyDamageScale: 0.055 },
        { enemies: { wisp: 60 }, spawnInterval: 0.70, enemyHpScale: 1.02, enemyDamageScale: 0.055 },
        { enemies: { wisp: 68 }, spawnInterval: 0.66, enemyHpScale: 1.06, enemyDamageScale: 0.06 },
        { enemies: { wisp: 76, jiangshi: 1 }, spawnInterval: 0.62, enemyHpScale: 1.10, enemyDamageScale: 0.06 },
        { enemies: { wisp: 84 }, spawnInterval: 0.59, enemyHpScale: 1.16, enemyDamageScale: 0.065 },
        { enemies: { wisp: 92 }, spawnInterval: 0.56, enemyHpScale: 1.22, enemyDamageScale: 0.065 },
        { enemies: { wisp: 100 }, spawnInterval: 0.53, enemyHpScale: 1.28, enemyDamageScale: 0.07 },
        { enemies: { wisp: 108 }, spawnInterval: 0.50, enemyHpScale: 1.34, enemyDamageScale: 0.07 },
        { enemies: { wisp: 140 }, spawnInterval: 0.42, enemyHpScale: 1.60, enemyDamageScale: 0.08 },
        { enemies: { wisp: 120, boss: 1 }, spawnInterval: 0.47, enemyHpScale: 1.90, bossHpScale: 1.50, enemyDamageScale: 0.10, rescueThreat: true }
      ], '1-3')
    },
    {
      // 第二卷只作为首局尾声预览：一波即可看到素问加入、二倍速与自动术法入口。
      id: '2-1',
      volume: '第二卷·雾隐山道',
      name: '山门残灯',
      recommendedPower: 1600,
      resultRewards: {
        success: [
          { id: 'lingyun', name: '灵蕴', amount: 640, doubleEligible: true }
        ],
        failure: [
          { id: 'lingyun', name: '灵蕴', amount: 160, doubleEligible: true }
        ]
      },
      waves: guidedBattle([
        { enemies: { wisp: 18 }, spawnInterval: 0.72, enemyHpScale: 1.24 }
      ], '2-1')
    }
  ];
}(typeof globalThis !== 'undefined' ? globalThis : this));
