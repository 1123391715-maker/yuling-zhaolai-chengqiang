(function (root) {
  'use strict';

  // 局外养成档案：只保存角色等级、星级与资源；不保存每局战斗中的临时强化。
  // 后续接服务端账户时，只需替换本文件的 load/save 实现，页面与战斗读取接口不变。
  var YL = root.YL = root.YL || {};
  // 保持 v2 存档键，靠 profile.version 迁移字段；改键会让已有玩家看起来像丢档。
  var STORAGE_KEY = 'yuling-zhaolai-progression-v2';
  var MAX_LEVEL = 20;
  var MAX_STAR = 15;
  var CORE_SLOT_COUNT = 5;

  // 角色包装统一收口：五阵营、五档品质只在这里维护，UI 和战斗可按需读取。
  // 当前城墙版先开放五位已有御灵，不新增凡品角色资源。
  var FACTION_PACKAGING = {
    hongchen: { id: 'hongchen', name: '红尘', subtitle: '人', color: '#d4a84f' },
    wanyao: { id: 'wanyao', name: '万妖', subtitle: '妖', color: '#8bc36b' },
    huangquan: { id: 'huangquan', name: '黄泉', subtitle: '鬼', color: '#ef6b43' },
    jiuxiao: { id: 'jiuxiao', name: '九霄', subtitle: '仙·佛·道', color: '#77c8e8' },
    hundun: { id: 'hundun', name: '混沌', subtitle: '魔', color: '#c46cff' }
  };
  var QUALITY_PACKAGING = {
    fan: { id: 'fan', name: '凡', color: '#318bc7', tier: 1 },
    ling: { id: 'ling', name: '灵', color: '#8e5ac8', tier: 2 },
    jue: { id: 'jue', name: '绝', color: '#cf603c', tier: 3 },
    shen: { id: 'shen', name: '神', color: '#d6424d', tier: 4 },
    zhen: { id: 'zhen', name: '臻', color: '#e7c75d', tier: 5 }
  };
  var FACTION_IDS = Object.keys(FACTION_PACKAGING);
  // 灵种不再按全部五阵营拆分：三界内阵营各有专属灵种，九霄/混沌使用同一份万灵种。
  var BASE_SEED_IDS = ['hongchen', 'wanyao', 'huangquan'];
  var SPIRIT_SEED_IDS = ['hongchen', 'wanyao', 'huangquan', 'universal'];
  var SPIRIT_SEED_PACKAGING = {
    hongchen: { id: 'hongchen', name: '红尘灵种', short: '红尘', color: FACTION_PACKAGING.hongchen.color },
    wanyao: { id: 'wanyao', name: '万妖灵种', short: '万妖', color: FACTION_PACKAGING.wanyao.color },
    huangquan: { id: 'huangquan', name: '黄泉灵种', short: '黄泉', color: FACTION_PACKAGING.huangquan.color },
    universal: { id: 'universal', name: '万灵种', short: '万能', color: '#e7c75d' }
  };

  function emptySpiritSeeds() {
    var seeds = {};
    for (var i = 0; i < SPIRIT_SEED_IDS.length; i++) seeds[SPIRIT_SEED_IDS[i]] = 0;
    return seeds;
  }

  function spiritSeedTotal(seeds) {
    var total = 0;
    for (var i = 0; i < SPIRIT_SEED_IDS.length; i++) total += Math.max(0, Math.floor(Number(seeds && seeds[SPIRIT_SEED_IDS[i]]) || 0));
    return total;
  }

  // 15 星统一养成成本：所有品质共用同一套“同名本体卡 + 灵种”消耗。
  // 下标对应“当前星级 -> 下一星级”，升品暂不参与这条链路。
  var STAR_COSTS = [
    { contracts: 1, spiritSeed: 20 },
    { contracts: 1, spiritSeed: 30 },
    { contracts: 1, spiritSeed: 40 },
    { contracts: 2, spiritSeed: 50 },
    { contracts: 2, spiritSeed: 60 },
    { contracts: 2, spiritSeed: 75 },
    { contracts: 3, spiritSeed: 90 },
    { contracts: 3, spiritSeed: 110 },
    { contracts: 3, spiritSeed: 130 },
    { contracts: 4, spiritSeed: 155 },
    { contracts: 4, spiritSeed: 180 },
    { contracts: 4, spiritSeed: 210 },
    { contracts: 5, spiritSeed: 250 },
    { contracts: 5, spiritSeed: 300 }
  ];

  // 关键星级提供技能效果节点；所有御灵初始技能均为 Lv.1。
  // 节点文案放在数据层，养成页与后续战斗倍率接入可共用这份定义。
  var STAR_SKILL_NODES = [
    { star: 3, skill: 'basic', label: '伤害提升', desc: '该技能造成的伤害提高 8%。' },
    { star: 5, skill: 'combo', label: '核心效果', desc: '该技能的主要触发效果强度提高 10%。' },
    { star: 8, skill: 'basic', label: '攻速提升', desc: '该技能的攻击速度提高 6%，出手更快。' },
    { star: 10, skill: 'ultimate', label: '冷却缩短', desc: '该技能冷却时间缩短 10%，更快再次释放。' },
    { star: 13, skill: 'combo', label: '效果深化', desc: '该技能的附加效果数值或持续时间再提高 15%。' },
    { star: 15, skill: 'ultimate', label: '终式形态', desc: '解锁该御灵大招的终式形态。' }
  ];

  // 养成页的技能资料独立于战斗内临时强化：定义层保留基础 Lv.1，
  // 实际展示等级由 skillLevels(star) 根据星级节点计算，不把节点重复写入每份存档。
  var HERO_DEFS = {
    hongyi: {
      id: 'hongyi', name: '红衣', element: '火', elementColor: '#ef6b43', faction: 'huangquan', quality: 'ling', qualityColor: QUALITY_PACKAGING.ling.color, role: '术法', sprite: 'heroHongyi',
      skills: [
        { kind: '普攻', icon: '符', name: '火羽符', level: 1, desc: '以火羽符攻击目标，造成攻击力 100% 的伤害。', rogueUpgradeIds: ['E03', 'E14'] },
        { kind: '连携', icon: '焰', name: '灼魂', level: 1, desc: '命中后附加灼烧，持续对目标造成火焰伤害。', rogueUpgradeIds: ['E16'] },
        { kind: '大招', icon: '雨', name: '焚天火雨', level: 1, desc: '满足战斗内解锁条件后自动施放，对最密集敌群降下火羽陨星。', rogueUpgradeIds: ['E04'] }
      ]
    },
    huangjin: {
      id: 'huangjin', name: '黄巾', element: '土', elementColor: '#d4a84f', faction: 'hongchen', quality: 'fan', qualityColor: QUALITY_PACKAGING.fan.color, role: '护卫', sprite: 'heroHuangjin',
      skills: [
        { kind: '普攻', icon: '盾', name: '撼地', level: 1, desc: '挥盾砸击前方敌人，造成攻击力 85% 的伤害。', rogueUpgradeIds: ['E01', 'E13'] },
        { kind: '连携', icon: '甲', name: '镇甲', level: 1, desc: '造成伤害时积蓄护盾；持有护盾时，撼地伤害获得提升。', rogueUpgradeIds: ['E11'] },
        { kind: '大招', icon: '山', name: '岳镇八荒', level: 1, desc: '满足战斗内解锁条件后自动施放，落下山印打击精英或首领，并为城墙提供护盾。', rogueUpgradeIds: ['E02'] }
      ]
    },
    xuanya: {
      id: 'xuanya', name: '玄鸦', element: '风', elementColor: '#51bd91', faction: 'wanyao', quality: 'ling', qualityColor: QUALITY_PACKAGING.ling.color, role: '刺袭', sprite: 'heroXuanya',
      skills: [
        { kind: '普攻', icon: '刃', name: '断魄横斩', level: 1, desc: '挥出横斩攻击目标，造成攻击力 100% 的伤害。', rogueUpgradeIds: ['E07', 'E17'] },
        { kind: '连携', icon: '血', name: '饮血残阵', level: 1, desc: '命中敌人后回复自身灵息，并在击败目标时获得短暂强化。', rogueUpgradeIds: ['E18'] },
        { kind: '大招', icon: '夜', name: '百鬼夜行', level: 1, desc: '满足战斗内解锁条件后自动施放，对高威胁敌人连续斩击。', rogueUpgradeIds: ['E08'] }
      ]
    },
    qingyi: {
      id: 'qingyi', name: '青衣', element: '木', elementColor: '#77bd62', faction: 'jiuxiao', quality: 'jue', qualityColor: QUALITY_PACKAGING.jue.color, role: '护持', sprite: 'heroQingyi',
      skills: [
        { kind: '普攻', icon: '枝', name: '青木灵缚', level: 1, desc: '以灵枝攻击目标，并削弱其推进节奏。', rogueUpgradeIds: ['Q01', 'Q02'], rogueStatus: '待开放' },
        { kind: '连携', icon: '灯', name: '灵灯护持', level: 1, desc: '为城墙与相邻御灵提供短暂护持效果。', rogueUpgradeIds: ['Q03', 'Q04'], rogueStatus: '待开放' },
        { kind: '大招', icon: '阵', name: '万灯归阵', level: 1, desc: '满足战斗内解锁条件后自动施放，点亮灵灯并强化全场守备。', rogueUpgradeIds: ['Q05'], rogueStatus: '待开放' }
      ]
    },
    suwen: {
      id: 'suwen', name: '素问', element: '水', elementColor: '#5aaee9', faction: 'jiuxiao', quality: 'fan', qualityColor: QUALITY_PACKAGING.fan.color, role: '辅疗', sprite: 'heroSuwen',
      skills: [
        { kind: '普攻', icon: '针', name: '灵针', level: 1, desc: '发射灵针攻击目标，造成攻击力 90% 的伤害。', rogueUpgradeIds: ['E09', 'E20'], rogueStatus: '待开放' },
        { kind: '连携', icon: '泉', name: '回春', level: 1, desc: '周期性为城墙补充灵息，并为受损御灵提供回复。', rogueUpgradeIds: ['E21', 'E22'], rogueStatus: '待开放' },
        { kind: '大招', icon: '雨', name: '甘霖', level: 1, desc: '满足战斗内解锁条件后自动施放，持续恢复城墙灵息。', rogueUpgradeIds: ['E10'], rogueStatus: '待开放' }
      ]
    },
    nuba: {
      id: 'nuba', name: '女魃', element: '旱', elementColor: '#c7ad7e', faction: 'hundun', quality: 'jue', qualityColor: QUALITY_PACKAGING.jue.color, role: '灾厄群攻', sprite: 'heroNuba',
      skills: [
        { kind: '普攻', icon: '仪', name: '玄旱落仪', level: 1, desc: '锁定最密集敌群落下裂日天仪，延迟召来旱柱并在短暂时间内持续灼裂地面。', rogueUpgradeIds: ['N01'] },
        { kind: '连携', icon: '环', name: '天仪共鸣', level: 1, desc: '场上已有裂日天仪时，下一次普攻使旧仪升起，与新落点连成覆日天门，沿线共同爆发。', rogueUpgradeIds: ['N02'] },
        { kind: '大招', icon: '蚀', name: '赤地无疆', level: 1, desc: '无需普攻或预置法阵即可独立落下蚀日天幕与多重旱柱；已有天仪只会额外参与共鸣。', rogueUpgradeIds: ['N03', 'N04'] }
      ]
    }
  };
  // 升星详情按角色和技能分别描述，避免在技能弹窗中显示无法判断的“效果提升”。
  // 数值采用当前技能配置与已确认的技能设计口径；这里只负责养成页展示。
  var HERO_STAR_EFFECTS = {
    hongyi: {
      basic: {
        3: { label: '灼烧解锁', desc: '火羽符命中后附加灼烧，持续 3.5 秒；命中即生效，无额外概率。' },
        8: { label: '火羽伤害', desc: '火羽命中伤害由攻击力 100% 提高至 108%。' }
      },
      combo: {
        5: { label: '灼烧伤害', desc: '灼魂命中后必定附加灼烧；每秒伤害由攻击力 15% 提高至 18%，无额外概率。' },
        13: { label: '灼烧持续', desc: '灼魂命中后必定附加灼烧；持续时间由 3 秒提高至 4 秒，无额外概率。' }
      },
      ultimate: {
        10: { label: '火雨冷却', desc: '焚天火雨冷却时间由 18 秒缩短至 16.2 秒。' },
        15: { label: '火雨伤害', desc: '每枚火羽伤害由攻击力 100% 提高至 110%；终式效果待定。' }
      }
    },
    huangjin: {
      basic: {
        3: { label: '震击伤害', desc: '撼地一次攻击伤害由攻击力 85% 提高至 92%。' },
        8: { label: '重击频率', desc: '重击触发间隔由每 3 次攻击缩短至每 2 次攻击。' }
      },
      combo: {
        5: { label: '护盾增益', desc: '持有护盾时，撼地伤害加成由 25% 提高至 35%。' },
        13: { label: '护盾震波', desc: '护盾结束时的震波伤害由 45% ATK 提高至 60% ATK。' }
      },
      ultimate: {
        10: { label: '山印冷却', desc: '岳镇八荒冷却时间由 14 秒缩短至 12.6 秒。' },
        15: { label: '护城强度', desc: '岳镇八荒提供的城墙护盾由最大生命 18% 提高至 22%；终式效果待定。' }
      }
    },
    xuanya: {
      basic: {
        3: { label: '残血增伤', desc: '目标生命低于 35% 时的额外伤害由 25% 提高至 45%。' },
        8: { label: '横斩伤害', desc: '断魄横斩伤害由攻击力 100% 提高至 108%。' }
      },
      combo: {
        5: { label: '鸦痕持续', desc: '鸦痕持续时间由 3 秒提高至 3.5 秒。' },
        13: { label: '鸦痕增伤', desc: '攻击鸦痕目标时的额外伤害由 20% 提高至 25%。' }
      },
      ultimate: {
        10: { label: '鬼刃冷却', desc: '百鬼夜行冷却时间由 15 秒缩短至 13.5 秒。' },
        15: { label: '鬼刃伤害', desc: '百鬼夜行每段伤害由攻击力 75% 提高至 82.5%；终式效果待定。' }
      }
    },
    qingyi: {
      basic: {
        3: { label: '照破持续', desc: '青木灵缚施加的照破持续时间由 4 秒提高至 5.5 秒。' },
        8: { label: '照破增伤', desc: '照破使目标受到的伤害加成由 8% 提高至 12%。' }
      },
      combo: {
        5: { label: '同辉门槛', desc: '灵灯护持触发同辉所需辉光由 6 点降低至 5 点。' },
        13: { label: '同辉持续', desc: '灵灯护持的同辉持续时间由 3 秒提高至 4 秒。' }
      },
      ultimate: {
        10: { label: '归阵冷却', desc: '万灯归阵冷却时间由 13 秒缩短至 11.7 秒。' },
        15: { label: '照破强度', desc: '万灯归阵施加的照破易伤由 15% 提高至 18%；终式效果待定。' }
      }
    },
    suwen: {
      basic: {
        3: { label: '星蚀上限', desc: '灵针施加的星蚀上限由 5 层提高至 6 层，持续时间由 4 秒提高至 4.5 秒。' },
        8: { label: '星蚀增伤', desc: '每层星蚀带来的伤害加成由 6% 提高至 8%。' }
      },
      combo: {
        5: { label: '问命门槛', desc: '回春触发问命针所需连续命中由 3 次降低至 2 次。' },
        13: { label: '问命伤害', desc: '问命针伤害由攻击力 150% 提高至 180%。' }
      },
      ultimate: {
        10: { label: '甘霖冷却', desc: '甘霖冷却时间由 17 秒缩短至 15.3 秒。' },
        15: { label: '星针伤害', desc: '甘霖每枚星针伤害由攻击力 30% 提高至 33%；终式效果待定。' }
      }
    },
    nuba: {
      basic: {
        3: { label: '旱仪扩域', desc: '玄旱落仪的内圈范围扩大，并让落点更稳定地覆盖密集敌群。' },
        8: { label: '双环落柱', desc: '裂日天仪展开内外双环；外环会追加一道较弱的旱柱，形态改变而非单纯加数值。' }
      },
      combo: {
        5: { label: '共鸣分枝', desc: '天仪共鸣连线两侧各分出一条短支线，旧仪与新仪之间形成三点共鸣结构。' },
        13: { label: '覆日天门', desc: '连线终点闭合为覆日天门，延迟爆裂并留下短暂蚀日区域。' }
      },
      ultimate: {
        10: { label: '天幕回转', desc: '赤地无疆冷却时间缩短 10%。' },
        15: { label: '赤地终式', desc: '赤地无疆展开为全线旱天幕；已有天仪转为覆日天门，没有预置天仪也会自动生成完整天门。' }
      }
    }
  };
  var HERO_IDS = Object.keys(HERO_DEFS);

  // 请灵奖池：角色与灵种都是同一奖池中的独立奖励条目。
  // Demo 保持可复现序列，正式接概率时只需替换 rewardAt，不改变结算与展示协议。
  var RECRUIT_REWARD_POOL = [
    { kind: 'hero', id: 'hongyi', label: '红衣' },
    { kind: 'hero', id: 'huangjin', label: '黄巾' },
    { kind: 'hero', id: 'xuanya', label: '玄鸦' },
    { kind: 'hero', id: 'qingyi', label: '青衣' },
    { kind: 'spiritSeed', seedId: 'hongchen', amount: 30, label: '红尘灵种 ×30' },
    { kind: 'spiritSeed', seedId: 'wanyao', amount: 30, label: '万妖灵种 ×30' },
    { kind: 'spiritSeed', seedId: 'huangquan', amount: 30, label: '黄泉灵种 ×30' },
    { kind: 'spiritSeed', seedId: 'universal', amount: 30, label: '万灵种 ×30' }
  ];

  // 主线与宗门共用一条顺序任务链。任务完成后不会自动跳到下一条，
  // 必须由玩家点击任务卡领取奖励，避免完成反馈被下一条任务瞬间覆盖。
  var TASK_GUIDE_DEFINITIONS = [
    { id: 'grow', title: '灵蕴淬炼', desc: '升级任意一位御灵', max: 1, reward: { id: 'lingyun', name: '灵蕴', amount: 500, asset: 'resultRewardLingyun' } },
    { id: 'stage-1-2', title: '再镇一卷', desc: '完成第一章·1-2 井畔孤灯', max: 1, reward: { id: 'talisman', name: '请灵符', amount: 5, asset: 'resultRewardTalisman' } },
    { id: 'stage-1-3', title: '守住村门', desc: '完成第一卷 · 村门夜禁', max: 1, reward: { id: 'talisman', name: '请灵符', amount: 8, asset: 'resultRewardTalisman' } },
    { id: 'first-charge', title: '首充敕令', desc: '解锁三日首充礼包', max: 1, reward: { id: 'lingyun', name: '灵蕴', amount: 1000, asset: 'resultRewardLingyun' } }
  ];

  var TASK_GUIDE_STEP_INDEX = {
    'stage-1-1': 0,
    'summon-event-open': 0,
    'summon-event-claim': 0,
    'summon-event-return': 0,
    recruit: 0,
    grow: 0,
    'stage-1-2': 1,
    'stage-1-3': 2,
    'first-charge': 3,
    'chapter-2-preview': TASK_GUIDE_DEFINITIONS.length,
    'guide-complete': TASK_GUIDE_DEFINITIONS.length
  };
  // v9 及更早版本使用的任务顺序，仅用于把旧档领取进度映射到新任务链。
  var LEGACY_TASK_GUIDE_IDS = ['stage-1-1', 'recruit', 'grow', 'stage-1-2', 'star', 'stage-1-3', 'first-charge'];
  var LEGACY_TASK_STEP_INDEX = {
    'stage-1-1': 0, recruit: 1, grow: 2, 'stage-1-2': 3,
    star: 4, 'stage-1-3': 5, 'first-charge': 6,
    'chapter-2-preview': 7, 'guide-complete': 7
  };

  function emptyTaskGuideProgress() {
    var progress = {};
    for (var i = 0; i < TASK_GUIDE_DEFINITIONS.length; i++) progress[TASK_GUIDE_DEFINITIONS[i].id] = 0;
    return progress;
  }

  function taskGuideIndexForStep(step) {
    return TASK_GUIDE_STEP_INDEX[step] == null ? 0 : TASK_GUIDE_STEP_INDEX[step];
  }

  function recruitPoolEntry(kind, key) {
    for (var i = 0; i < RECRUIT_REWARD_POOL.length; i++) {
      var entry = RECRUIT_REWARD_POOL[i];
      if (entry.kind === kind && (kind === 'hero' ? entry.id : entry.seedId) === key) return clone(entry);
    }
    return null;
  }

  // 将内部 id 转成玩家看到的中文包装，避免把“红尘/万妖”等长名散落在页面代码里。
  HERO_IDS.forEach(function (id) {
    var def = HERO_DEFS[id];
    var faction = FACTION_PACKAGING[def.faction] || FACTION_PACKAGING.hongchen;
    var quality = QUALITY_PACKAGING[def.quality] || QUALITY_PACKAGING.fan;
    def.factionId = faction.id;
    def.factionName = faction.name;
    def.factionSubtitle = faction.subtitle;
    def.factionColor = faction.color;
    def.qualityId = quality.id;
    def.quality = quality.name;
    def.qualityColor = quality.color;
    def.qualityTier = quality.tier;
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function numberInRange(value, fallback, min, max) {
    value = Number(value);
    if (!isFinite(value)) value = fallback;
    return Math.max(min, Math.min(max, Math.floor(value)));
  }

  function defaultHeroState(owned) {
    return { owned: !!owned, level: 1, star: 1, contracts: 0 };
  }

  function defaultProfile() {
    var heroes = {}, i;
    // 首局只有三名初始御灵；青衣由请灵获得，女魃由三日首充礼包首日获得。
    for (i = 0; i < HERO_IDS.length; i++) heroes[HERO_IDS[i]] = defaultHeroState(i < 3);
    return {
      version: 10,
      lingyun: 0,
      // 灵种按三基础阵营 + 万灵种拆分；spiritSeed 仅保留为兼容旧界面的总数缓存。
      spiritSeeds: emptySpiritSeeds(),
      spiritSeed: 0,
      talisman: 0,
      // 玩家选择的战斗倍速：只开放 1/2 倍，跨关卡沿用。
      battleSpeed: 1,
      // 五位主灵直接升级；未来招募到的其他御灵自动取这五位的最低等级。
      coreHeroIds: HERO_IDS.slice(0, 3),
      // 御灵页保存的默认驻守阵容；布阵页仍可按需调整阵位。
      defaultFormation: [],
      heroes: heroes,
      recruitCount: 0,
      recruitPity: 0,
      recruitHistory: [],
      // 首充礼包：购买立即领取第 1 日，后两日按真实间隔各领取一次。
      // Demo 点击仅模拟支付成功；正式支付接入时替换为支付回调进入同一状态机。
      firstChargePurchased: false,
      firstChargeStartAt: 0,
      firstChargeDaysClaimed: [false, false, false],
      firstChargeGuideViewed: false,
      // v3 兼容字段，保留到旧档迁移完成后再移除。
      firstChargeClaimed: false,
      // 千抽福利条件：前三项记录具体关卡，后续项按章节前缀判断。
      completedStages: {},
      summonEventClaimed: {},
      spiritAccessoryGuideComplete: false,
      coreReplaceGuidePending: false,
      coreReplaceGuideComplete: false,
      firstNubaRescueComplete: false,
      guideStep: 'stage-1-1',
      taskGuideIndex: 0,
      taskGuideProgress: emptyTaskGuideProgress()
    };
  }

  function normalizeProfile(raw) {
    var base = defaultProfile();
    raw = raw && typeof raw === 'object' ? raw : {};
    base.lingyun = numberInRange(raw.lingyun, base.lingyun, 0, 999999999);
    var savedSpiritSeeds = raw.spiritSeeds && typeof raw.spiritSeeds === 'object' ? raw.spiritSeeds : null;
    base.spiritSeeds = emptySpiritSeeds();
    if (savedSpiritSeeds) {
      for (var seedIndex = 0; seedIndex < BASE_SEED_IDS.length; seedIndex++) {
        var baseSeedId = BASE_SEED_IDS[seedIndex];
        base.spiritSeeds[baseSeedId] = numberInRange(savedSpiritSeeds[baseSeedId], 0, 0, 999999);
      }
      // 兼容上一版五阵营存档：九霄、混沌余额合并为万灵种，旧万能字段也一并保留。
      base.spiritSeeds.universal = numberInRange(savedSpiritSeeds.universal, 0, 0, 999999)
        + numberInRange(savedSpiritSeeds.jiuxiao, 0, 0, 999999)
        + numberInRange(savedSpiritSeeds.hundun, 0, 0, 999999);
    } else {
      // 更早旧档只有一个总灵种字段，转为万能灵种，避免角色养成材料丢失。
      base.spiritSeeds.universal = numberInRange(raw.spiritSeed, 0, 0, 999999);
    }
    base.spiritSeed = spiritSeedTotal(base.spiritSeeds);
    base.talisman = numberInRange(raw.talisman, base.talisman, 0, 999999);
    // 兼容旧档或外部写入的非法值，统一收敛到当前开放的 1/2 倍速。
    base.battleSpeed = numberInRange(raw.battleSpeed, base.battleSpeed, 1, 2);
    var previousVersion = numberInRange(raw.version, 1, 1, 99);
    var hasLegacyHeroes = !!(raw.heroes && Object.keys(raw.heroes).length);
    var i, id, source, savedStar;
    for (i = 0; i < HERO_IDS.length; i++) {
      id = HERO_IDS[i];
      source = raw.heroes && raw.heroes[id] || {};
      // v1 的星级以 0 星为初始值；v2 改为 1 星起步，旧档整体平移一星以保留已升次数。
      savedStar = source.star;
      if (previousVersion < 2 && savedStar != null) savedStar = Number(savedStar) + 1;
      base.heroes[id] = {
        // 老档此前没有“拥有”状态；只对真实存在的老档保持角色，空新档仍走三初始角色。
        owned: previousVersion < 3 && hasLegacyHeroes ? true : (source.owned == null ? base.heroes[id].owned : source.owned !== false),
        level: numberInRange(source.level, 1, 1, MAX_LEVEL),
        star: numberInRange(savedStar, 1, 1, MAX_STAR),
        contracts: numberInRange(source.contracts, 0, 0, 999)
      };
    }
    var requested = Array.isArray(raw.coreHeroIds) ? raw.coreHeroIds : base.coreHeroIds;
    var cores = [];
    for (i = 0; i < requested.length && cores.length < CORE_SLOT_COUNT; i++) {
      id = requested[i];
      if (HERO_DEFS[id] && base.heroes[id].owned && cores.indexOf(id) < 0) cores.push(id);
    }
    // 初期已拥有不足五人时也能正常运行；共鸣等级取当前已入驻灵位的最低等级。
    for (i = 0; i < HERO_IDS.length && cores.length < CORE_SLOT_COUNT; i++) {
      id = HERO_IDS[i];
      if (base.heroes[id].owned && cores.indexOf(id) < 0) cores.push(id);
    }
    base.coreHeroIds = cores;
    base.recruitCount = numberInRange(raw.recruitCount, 0, 0, 999999);
    base.recruitPity = numberInRange(raw.recruitPity, 0, 0, 10);
    base.recruitHistory = Array.isArray(raw.recruitHistory) ? raw.recruitHistory.slice(-30) : [];
    // v3 的“一次性领取”视为三日礼包第 1 日已完成，避免覆盖已拿到素问的旧档。
    var legacyFirstChargeClaimed = !!raw.firstChargeClaimed;
    base.firstChargePurchased = raw.firstChargePurchased === true || legacyFirstChargeClaimed;
    base.firstChargeStartAt = Math.max(0, Number(raw.firstChargeStartAt) || 0);
    if (base.firstChargePurchased && !base.firstChargeStartAt) base.firstChargeStartAt = Date.now();
    var savedDays = Array.isArray(raw.firstChargeDaysClaimed) ? raw.firstChargeDaysClaimed : [];
    for (i = 0; i < 3; i++) base.firstChargeDaysClaimed[i] = savedDays[i] === true || (legacyFirstChargeClaimed && i === 0);
    base.firstChargeClaimed = base.firstChargeDaysClaimed.every(function (claimed) { return claimed; });
    base.pendingStageReward = Array.isArray(raw.pendingStageReward) ? raw.pendingStageReward.filter(function (sid) { return typeof sid === 'string' && sid; }) : [];
    base.completedStages = {};
    var savedCompletedStages = raw.completedStages && typeof raw.completedStages === 'object' ? raw.completedStages : {};
    for (var completedStageId in savedCompletedStages) {
      if (savedCompletedStages[completedStageId] === true) base.completedStages[completedStageId] = true;
    }
    base.summonEventClaimed = {};
    var savedSummonEventClaimed = raw.summonEventClaimed && typeof raw.summonEventClaimed === 'object' ? raw.summonEventClaimed : {};
    for (var summonEventIndex in savedSummonEventClaimed) {
      if (/^\d+$/.test(String(summonEventIndex)) && savedSummonEventClaimed[summonEventIndex] === true) base.summonEventClaimed[summonEventIndex] = true;
    }
    base.firstChargeGuideViewed = raw.firstChargeGuideViewed === true || base.firstChargePurchased;
    base.spiritAccessoryGuideComplete = raw.spiritAccessoryGuideComplete === true || (previousVersion < 10 && base.completedStages['1-2'] === true);
    base.coreReplaceGuidePending = raw.coreReplaceGuidePending === true;
    base.coreReplaceGuideComplete = raw.coreReplaceGuideComplete === true;
    base.firstNubaRescueComplete = raw.firstNubaRescueComplete === true || (previousVersion < 10 && base.completedStages['1-3'] === true);
    base.guideStep = typeof raw.guideStep === 'string' ? raw.guideStep : base.guideStep;
    if (base.guideStep === 'star') base.guideStep = 'stage-1-3';
    if (base.guideStep === 'stage-1-2' || base.guideStep === 'stage-1-3') base.guideStep = 'guide-complete';
    var savedTaskProgress = raw.taskGuideProgress && typeof raw.taskGuideProgress === 'object' ? raw.taskGuideProgress : null;
    var taskHasSavedProgress = !!savedTaskProgress;
    base.taskGuideProgress = emptyTaskGuideProgress();
    for (i = 0; i < TASK_GUIDE_DEFINITIONS.length; i++) {
      var taskDef = TASK_GUIDE_DEFINITIONS[i];
      var legacyStepIndex = LEGACY_TASK_STEP_INDEX[typeof raw.guideStep === 'string' ? raw.guideStep : 'stage-1-1'];
      var legacyTaskIndex = LEGACY_TASK_GUIDE_IDS.indexOf(taskDef.id);
      var legacyDone = previousVersion < 10 && legacyStepIndex != null && legacyTaskIndex >= 0 && legacyStepIndex > legacyTaskIndex ? taskDef.max : 0;
      if (previousVersion >= 10) legacyDone = taskGuideIndexForStep(base.guideStep) > i ? taskDef.max : 0;
      var savedProgress = savedTaskProgress ? savedTaskProgress[taskDef.id] : legacyDone;
      base.taskGuideProgress[taskDef.id] = numberInRange(savedProgress, legacyDone, 0, taskDef.max);
    }
    var savedTaskIndex = Number(raw.taskGuideIndex);
    if (previousVersion < 10 && isFinite(savedTaskIndex)) {
      base.taskGuideIndex = 0;
      for (i = 0; i < TASK_GUIDE_DEFINITIONS.length; i++) {
        var oldTaskIndex = LEGACY_TASK_GUIDE_IDS.indexOf(TASK_GUIDE_DEFINITIONS[i].id);
        if (oldTaskIndex >= 0 && oldTaskIndex < Math.floor(savedTaskIndex)) base.taskGuideIndex++;
        else break;
      }
    } else {
      base.taskGuideIndex = isFinite(savedTaskIndex)
        ? Math.max(0, Math.min(TASK_GUIDE_DEFINITIONS.length, Math.floor(savedTaskIndex)))
        : (taskHasSavedProgress ? 0 : taskGuideIndexForStep(base.guideStep));
    }
    var savedDefaultFormation = Array.isArray(raw.defaultFormation) ? raw.defaultFormation : [];
    var formationTypes = [], formationGrids = [];
    base.defaultFormation = [];
    for (i = 0; i < savedDefaultFormation.length && base.defaultFormation.length < CORE_SLOT_COUNT; i++) {
      var savedFormation = savedDefaultFormation[i] || {};
      var formationType = savedFormation.type;
      var formationGrid = numberInRange(savedFormation.gridIndex, base.defaultFormation.length, 0, 4);
      if (!HERO_DEFS[formationType] || formationTypes.indexOf(formationType) >= 0 || formationGrids.indexOf(formationGrid) >= 0) continue;
      formationTypes.push(formationType);
      formationGrids.push(formationGrid);
      base.defaultFormation.push({ type: formationType, gridIndex: formationGrid });
    }
    return base;
  }

  function readStored(platform, wx) {
    try {
      if (platform === 'wechat' && wx && wx.getStorageSync) return wx.getStorageSync(STORAGE_KEY);
      if (root.localStorage) return root.localStorage.getItem(STORAGE_KEY);
    } catch (e) { /* 存档不可用时以新档继续，不阻断战斗。 */ }
    return null;
  }

  function writeStored(platform, wx, profile) {
    var serialized = JSON.stringify(profile);
    try {
      if (platform === 'wechat' && wx && wx.setStorageSync) {
        wx.setStorageSync(STORAGE_KEY, serialized);
        return true;
      }
      if (root.localStorage) {
        root.localStorage.setItem(STORAGE_KEY, serialized);
        return true;
      }
    } catch (e) { return false; }
    return false;
  }

  function parseStored(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch (e) { return null; }
  }

  function Progression(options) {
    options = options || {};
    this.platform = options.platform || 'web';
    this.wx = options.wx || null;
    this.volatile = !!options.volatile;
    this.profile = normalizeProfile(options.profile || parseStored(readStored(this.platform, this.wx)));
    if (!this.volatile) this.save();
  }

  Progression.prototype.save = function () {
    if (this.volatile) return true;
    return writeStored(this.platform, this.wx, this.profile);
  };

  Progression.prototype.getHero = function (id) {
    return this.profile.heroes[id] || null;
  };

  Progression.prototype.getHeroDef = function (id) {
    return HERO_DEFS[id] || null;
  };

  Progression.prototype.isOwned = function (id) {
    var hero = this.getHero(id);
    return !!(hero && hero.owned);
  };

  Progression.prototype.isCore = function (id) {
    return this.profile.coreHeroIds.indexOf(id) >= 0;
  };

  Progression.prototype.resonanceLevel = function () {
    var cores = this.profile.coreHeroIds, level = MAX_LEVEL, i, hero;
    for (i = 0; i < cores.length; i++) {
      hero = this.getHero(cores[i]);
      if (hero) level = Math.min(level, hero.level);
    }
    return level === MAX_LEVEL && !cores.length ? 1 : level;
  };

  Progression.prototype.effectiveLevel = function (id) {
    var hero = this.getHero(id);
    if (!hero) return 1;
    return this.isCore(id) ? hero.level : this.resonanceLevel();
  };

  // 前期临时成本表，后续策划平衡时只改这里；UI 和交互不依赖具体数值。
  Progression.prototype.levelCost = function (level) {
    return 120 + Math.max(0, level - 1) * 60;
  };

  Progression.prototype.starRequirement = function (star) {
    var index = Math.max(0, Math.floor(Number(star) || 1) - 1);
    var cost = STAR_COSTS[index];
    return cost ? { contracts: cost.contracts, spiritSeed: cost.spiritSeed } : { contracts: 0, spiritSeed: 0 };
  };

  // 保留旧调用点的数字接口：数字现在代表灵种消耗，真正的升星成本由 starRequirement 提供。
  Progression.prototype.starCost = function (star) {
    return this.starRequirement(star).spiritSeed;
  };

  Progression.prototype.spiritSeedBalances = function () {
    var balances = emptySpiritSeeds();
    var saved = this.profile.spiritSeeds || {};
    for (var i = 0; i < SPIRIT_SEED_IDS.length; i++) balances[SPIRIT_SEED_IDS[i]] = numberInRange(saved[SPIRIT_SEED_IDS[i]], 0, 0, 999999);
    return balances;
  };

  Progression.prototype.spiritSeedBalance = function (factionId) {
    var balances = this.spiritSeedBalances();
    return balances[factionId] || 0;
  };

  Progression.prototype.spiritSeedFaction = function (id) {
    var def = this.getHeroDef(id);
    var factionId = def && def.factionId || 'hongchen';
    return BASE_SEED_IDS.indexOf(factionId) >= 0 ? factionId : 'universal';
  };

  Progression.prototype.starRequirementForHero = function (id) {
    var cost = this.starRequirement((this.getHero(id) || {}).star || 1);
    var factionId = this.spiritSeedFaction(id);
    cost.spiritSeedFaction = factionId;
    cost.spiritSeedFactionName = SPIRIT_SEED_PACKAGING[factionId] ? SPIRIT_SEED_PACKAGING[factionId].name : factionId;
    cost.spiritSeedName = cost.spiritSeedFactionName;
    return cost;
  };

  // 基础阵营优先消耗对应灵种，不足部分再由万灵种补足；九霄/混沌只消耗万灵种。
  Progression.prototype.spiritSeedUsage = function (id) {
    var seedId = this.spiritSeedFaction(id);
    var balances = this.spiritSeedBalances();
    var specific = seedId === 'universal' ? 0 : balances[seedId] || 0;
    var universal = balances.universal || 0;
    return {
      seedId: seedId,
      seedName: SPIRIT_SEED_PACKAGING[seedId] ? SPIRIT_SEED_PACKAGING[seedId].name : seedId,
      specificBalance: specific,
      universalBalance: universal,
      usableBalance: seedId === 'universal' ? universal : specific + universal
    };
  };

  Progression.prototype.grantSpiritSeed = function (factionId, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!SPIRIT_SEED_PACKAGING[factionId] || !amount) return 0;
    if (!this.profile.spiritSeeds) this.profile.spiritSeeds = emptySpiritSeeds();
    this.profile.spiritSeeds[factionId] = Math.min(999999, (this.profile.spiritSeeds[factionId] || 0) + amount);
    this.profile.spiritSeed = spiritSeedTotal(this.profile.spiritSeeds);
    this.save();
    return amount;
  };

  Progression.prototype.spendSpiritSeed = function (factionId, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    var balance = this.spiritSeedBalance(factionId);
    if (balance < amount) return false;
    this.profile.spiritSeeds[factionId] = balance - amount;
    this.profile.spiritSeed = spiritSeedTotal(this.profile.spiritSeeds);
    return true;
  };

  Progression.prototype.spendSpiritSeedForHero = function (id, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    var usage = this.spiritSeedUsage(id);
    if (usage.usableBalance < amount) return false;
    var specificSpent = Math.min(usage.specificBalance, amount);
    var universalSpent = amount - specificSpent;
    if (specificSpent) this.spendSpiritSeed(usage.seedId, specificSpent);
    if (universalSpent) this.spendSpiritSeed('universal', universalSpent);
    return { specific: specificSpent, universal: universalSpent };
  };

  Progression.prototype.skillLevels = function (id) {
    var hero = this.getHero(id), star = hero ? numberInRange(hero.star, 1, 1, MAX_STAR) : 1;
    var levels = { basic: 1, combo: 1, ultimate: 1 };
    for (var i = 0; i < STAR_SKILL_NODES.length; i++) {
      var node = STAR_SKILL_NODES[i];
      if (star >= node.star) levels[node.skill] += 1;
    }
    return levels;
  };

  Progression.prototype.starSkillNodes = function (star) {
    star = numberInRange(star, 1, 1, MAX_STAR);
    return STAR_SKILL_NODES.filter(function (node) { return node.star <= star; }).map(clone);
  };

  Progression.prototype.starStage = function (star) {
    star = numberInRange(star, 1, 1, MAX_STAR);
    var phase = Math.floor((star - 1) / 5);
    return {
      phase: phase,
      name: phase === 0 ? '星' : phase === 1 ? '月' : '日',
      index: ((star - 1) % 5) + 1,
      total: 5,
      final: star >= MAX_STAR
    };
  };

  function starMultiplier(star) {
    star = numberInRange(star, 1, 1, MAX_STAR);
    // 保持旧 5 星档的 1.32 倍上限，同时让 6—15 星继续成长但边际递减。
    return 1 + Math.min(4, star - 1) * .08 + Math.min(5, Math.max(0, star - 5)) * .05 + Math.min(5, Math.max(0, star - 10)) * .04;
  }

  Progression.prototype.statMultiplier = function (id) {
    var hero = this.getHero(id);
    if (!hero) return 1;
    // 等级和星级只影响永久战斗属性；攻速保持角色基础节奏，避免早期数值失控。
    return this.statMultiplierAtStar(id, hero.star);
  };

  Progression.prototype.statMultiplierAtStar = function (id, star) {
    var hero = this.getHero(id);
    if (!hero) return 1;
    return (1 + (this.effectiveLevel(id) - 1) * .08) * starMultiplier(star);
  };

  Progression.prototype.tryUpgradeLevel = function (id) {
    var hero = this.getHero(id);
    if (!hero || !hero.owned) return { ok: false, reason: '御灵尚未获得' };
    if (!this.isCore(id)) return { ok: false, reason: '共鸣御灵取灵位最低等级，需先入驻灵位' };
    if (hero.level >= MAX_LEVEL) return { ok: false, reason: '已达当前等级上限' };
    var cost = this.levelCost(hero.level);
    if (this.profile.lingyun < cost) return { ok: false, reason: '灵蕴不足', cost: cost };
    this.profile.lingyun -= cost;
    hero.level += 1;
    this.save();
    return { ok: true, level: hero.level, cost: cost };
  };

  Progression.prototype.tryUpgradeStar = function (id) {
    var hero = this.getHero(id);
    if (!hero || !hero.owned) return { ok: false, reason: '御灵尚未获得' };
    if (hero.star >= MAX_STAR) return { ok: false, reason: '已达当前星级上限' };
    var previousStar = hero.star;
    var cost = this.starRequirementForHero(id);
    var seedUsage = this.spiritSeedUsage(id);
    if (hero.contracts < cost.contracts) return { ok: false, reason: '同名本体不足', cost: cost };
    if (seedUsage.usableBalance < cost.spiritSeed) return { ok: false, reason: (cost.spiritSeedFactionName || '对应灵种') + '不足', cost: cost };
    hero.contracts -= cost.contracts;
    hero.star += 1;
    var spiritSeedSpentByType = this.spendSpiritSeedForHero(id, cost.spiritSeed);
    this.save();
    return {
      ok: true,
      star: hero.star,
      cost: cost,
      contractsSpent: cost.contracts,
      spiritSeedSpent: cost.spiritSeed,
      spiritSeedSpentByType: spiritSeedSpentByType,
      skillUnlocks: STAR_SKILL_NODES.filter(function (node) { return node.star > previousStar && node.star <= hero.star; }).map(clone)
    };
  };

  Progression.prototype.grant = function (id, amount, factionId) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!amount) return 0;
    if (id === 'lingyun') this.profile.lingyun += amount;
    else if (id === 'spiritSeed') return this.grantSpiritSeed(factionId, amount);
    else if (id === 'talisman') this.profile.talisman += amount;
    else return 0;
    this.save();
    return amount;
  };

  Progression.prototype.addHero = function (id, source) {
    var hero = this.getHero(id);
    if (!hero || !HERO_DEFS[id]) return { ok: false, reason: '未知御灵' };
    var newlyOwned = !hero.owned;
    var ownedBefore = this.ownedHeroIds().length;
    hero.owned = true;
    if (newlyOwned && this.profile.coreHeroIds.length < CORE_SLOT_COUNT) this.profile.coreHeroIds.push(id);
    if (newlyOwned && ownedBefore >= CORE_SLOT_COUNT && !this.profile.coreReplaceGuideComplete) this.profile.coreReplaceGuidePending = true;
    this.profile.recruitHistory.push({ id: id, source: source || 'recruit' });
    this.profile.recruitHistory = this.profile.recruitHistory.slice(-30);
    this.save();
    return { ok: true, id: id, newlyOwned: newlyOwned, contract: !newlyOwned };
  };

  Progression.prototype.ownedHeroIds = function () {
    var owned = [];
    for (var i = 0; i < HERO_IDS.length; i++) {
      var id = HERO_IDS[i];
      if (this.profile.heroes[id] && this.profile.heroes[id].owned) owned.push(id);
    }
    return owned;
  };

  Progression.prototype.replaceCoreHero = function (outId, inId) {
    var coreIndex = this.profile.coreHeroIds.indexOf(outId);
    var incoming = this.getHero(inId);
    if (coreIndex < 0) return { ok: false, reason: '请选择一位当前主灵' };
    if (!incoming || !incoming.owned) return { ok: false, reason: '该御灵尚未获得' };
    if (this.profile.coreHeroIds.indexOf(inId) >= 0) return { ok: false, reason: '该御灵已在灵位中' };
    this.profile.coreHeroIds[coreIndex] = inId;
    this.profile.coreReplaceGuidePending = false;
    this.profile.coreReplaceGuideComplete = true;
    this.save();
    return { ok: true, outId: outId, inId: inId, coreHeroIds: this.profile.coreHeroIds.slice() };
  };

  Progression.prototype.addContract = function (id, amount) {
    var hero = this.getHero(id);
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!hero || !hero.owned || !amount) return 0;
    hero.contracts += amount;
    this.save();
    return amount;
  };

  function recruitRewardAt(recruitCount) {
    // 首抽青衣仍固定；从第 6 抽开始每第五抽投放一次灵种条目，
    // 让首个十连就能看到奖池中的灵种奖励，同时保留引导所需的青衣本体卡。
    if (recruitCount === 0) return recruitPoolEntry('hero', 'qingyi');
    if (recruitCount >= 5 && recruitCount % 5 === 0) {
      var seed = ['hongchen', 'wanyao', 'huangquan', 'universal'][(Math.floor(recruitCount / 5) - 1) % 4];
      return recruitPoolEntry('spiritSeed', seed);
    }
    return recruitPoolEntry('hero', ['hongyi', 'huangjin', 'xuanya', 'qingyi'][(recruitCount - 1) % 4]);
  }

  // 请灵结果使用可复现序列：角色和灵种都由同一奖池条目结算，首抽只在数据层固定为青衣。
  Progression.prototype.tryRecruit = function (count) {
    count = count === 10 ? 10 : 1;
    if (this.profile.talisman < count) return { ok: false, reason: '请灵符不足', need: count };
    var rewards = [], i, id, received, entry;
    this.profile.talisman -= count;
    for (i = 0; i < count; i++) {
      entry = recruitRewardAt(this.profile.recruitCount);
      if (entry.kind === 'spiritSeed') {
        this.grantSpiritSeed(entry.seedId, entry.amount);
        rewards.push({ kind: 'spiritSeed', seedId: entry.seedId, amount: entry.amount,
          name: SPIRIT_SEED_PACKAGING[entry.seedId].name, label: entry.amount + ' ' + SPIRIT_SEED_PACKAGING[entry.seedId].name });
      } else {
        id = entry.id;
        received = this.addHero(id, 'recruit');
        if (!received.newlyOwned) this.addContract(id, 1);
        rewards.push({ kind: 'hero', id: id, newlyOwned: received.newlyOwned, contract: !received.newlyOwned });
      }
      this.profile.recruitCount += 1;
      this.profile.recruitPity = this.profile.recruitCount % 10;
    }
    this.save();
    return { ok: true, count: count, rewards: rewards, pity: this.profile.recruitPity,
      spiritSeedGain: rewards.filter(function (reward) { return reward.kind === 'spiritSeed'; })
        .reduce(function (total, reward) { return total + reward.amount; }, 0) };
  };

  var FIRST_CHARGE_DAY_REWARDS = [
    { lingyun: 1280, talisman: 2, hero: 'nuba', label: '女魃、灵蕴 ×1280、请灵符 ×2' },
    { lingyun: 1680, talisman: 2, label: '灵蕴 ×1680、请灵符 ×2' },
    { lingyun: 2680, talisman: 3, contract: 1, label: '灵蕴 ×2680、请灵符 ×3、女魃本体卡 ×1' }
  ];

  Progression.prototype.firstChargeStatus = function (now) {
    now = Number(now) || Date.now();
    var profile = this.profile;
    var purchased = !!profile.firstChargePurchased;
    var unlocked = this.hasCompletedStage('1-3') || purchased;
    var startAt = Math.max(0, Number(profile.firstChargeStartAt) || 0);
    var passedDays = purchased && startAt ? Math.max(0, Math.min(2, Math.floor((now - startAt) / 86400000))) : 0;
    var claimed = profile.firstChargeDaysClaimed || [false, false, false];
    var claimDay = -1;
    for (var i = 0; i <= passedDays; i++) {
      if (!claimed[i]) { claimDay = i; break; }
    }
    var complete = !!(claimed[0] && claimed[1] && claimed[2]);
    return {
      purchased: purchased,
      unlocked: unlocked,
      complete: complete,
      passedDays: passedDays,
      claimDay: claimDay,
      nextDay: Math.min(2, passedDays + 1),
      canClaim: purchased && claimDay >= 0,
      canPurchase: unlocked && !purchased,
      rewards: FIRST_CHARGE_DAY_REWARDS
    };
  };

  Progression.prototype.claimFirstChargeDay = function (dayIndex) {
    var status = this.firstChargeStatus();
    dayIndex = dayIndex == null ? status.claimDay : Math.max(0, Math.min(2, Math.floor(Number(dayIndex) || 0)));
    if (!status.purchased) return { ok: false, reason: '请先解锁首充礼包' };
    if (dayIndex < 0 || dayIndex > status.passedDays) return { ok: false, reason: '明日再来领取' };
    if (this.profile.firstChargeDaysClaimed[dayIndex]) return { ok: false, reason: '今日奖励已领取' };
    var reward = FIRST_CHARGE_DAY_REWARDS[dayIndex], received = null;
    if (reward.hero) received = this.addHero(reward.hero, 'firstChargeDay' + (dayIndex + 1));
    if (reward.lingyun) this.profile.lingyun += reward.lingyun;
    if (reward.talisman) this.profile.talisman += reward.talisman;
    if (reward.contract) this.addContract('nuba', reward.contract);
    this.profile.firstChargeDaysClaimed[dayIndex] = true;
    this.profile.firstChargeClaimed = this.profile.firstChargeDaysClaimed.every(function (claimed) { return claimed; });
    this.save();
    return { ok: true, dayIndex: dayIndex, id: reward.hero || null, newlyOwned: received && received.newlyOwned, reward: reward };
  };

  // Demo 用：点击即模拟支付成功并领取首日，不发起真实支付请求。
  // 正式接入时由支付成功回调调用 claimFirstChargeDay(0)。
  Progression.prototype.purchaseFirstChargeMock = function () {
    if (!this.firstChargeStatus().unlocked) return { ok: false, reason: '完成 1-3 后解锁首充礼包' };
    if (this.profile.firstChargePurchased) return { ok: false, reason: '首充礼包已解锁' };
    this.profile.firstChargePurchased = true;
    this.profile.firstChargeStartAt = Date.now();
    this.profile.firstChargeDaysClaimed = [false, false, false];
    return this.claimFirstChargeDay(0);
  };

  // 保留旧调用名，避免旧 QA 链路断裂；语义已升级为“模拟支付并领首日”。
  Progression.prototype.claimFirstChargeMock = function () {
    return this.purchaseFirstChargeMock();
  };

  Progression.prototype.markFirstChargeGuideViewed = function () {
    if (this.profile.firstChargeGuideViewed) return false;
    this.profile.firstChargeGuideViewed = true;
    this.save();
    return true;
  };

  Progression.prototype.completeSpiritAccessoryGuide = function () {
    if (this.profile.spiritAccessoryGuideComplete) return false;
    this.profile.spiritAccessoryGuideComplete = true;
    this.save();
    return true;
  };

  Progression.prototype.setGuideStep = function (step) {
    this.profile.guideStep = String(step || 'stage-1-1');
    this.save();
  };

  Progression.prototype.markStageCompleted = function (stageId) {
    stageId = String(stageId || '');
    if (!stageId) return false;
    if (!this.profile.completedStages) this.profile.completedStages = {};
    if (this.profile.completedStages[stageId]) return false;
    this.profile.completedStages[stageId] = true;
    if (!Array.isArray(this.profile.pendingStageReward)) this.profile.pendingStageReward = [];
    if (this.profile.pendingStageReward.indexOf(stageId) < 0) this.profile.pendingStageReward.push(stageId);
    this.save();
    return true;
  };

  Progression.prototype.hasCompletedStage = function (stageId) {
    return !!(this.profile.completedStages && this.profile.completedStages[String(stageId || '')]);
  };

  Progression.prototype.taskGuideStatus = function () {
    var index = Math.max(0, Math.min(TASK_GUIDE_DEFINITIONS.length, Number(this.profile.taskGuideIndex) || 0));
    if (index >= TASK_GUIDE_DEFINITIONS.length) return { index: index, task: null, current: 0, max: 0, complete: false, allComplete: true };
    var task = TASK_GUIDE_DEFINITIONS[index];
    var current = numberInRange(this.profile.taskGuideProgress && this.profile.taskGuideProgress[task.id], 0, 0, task.max);
    return {
      index: index,
      task: clone(task),
      current: current,
      max: task.max,
      complete: current >= task.max,
      allComplete: false
    };
  };

  Progression.prototype.markTaskGuide = function (id, amount) {
    var task = null;
    for (var i = 0; i < TASK_GUIDE_DEFINITIONS.length; i++) {
      if (TASK_GUIDE_DEFINITIONS[i].id === id) { task = TASK_GUIDE_DEFINITIONS[i]; break; }
    }
    if (!task) return false;
    if (!this.profile.taskGuideProgress) this.profile.taskGuideProgress = emptyTaskGuideProgress();
    var previous = numberInRange(this.profile.taskGuideProgress[id], 0, 0, task.max);
    var next = Math.max(previous, Math.min(task.max, previous + Math.max(0, Math.floor(Number(amount) || 0))));
    if (next === previous) return false;
    this.profile.taskGuideProgress[id] = next;
    this.save();
    return true;
  };

  Progression.prototype.claimTaskGuide = function () {
    var status = this.taskGuideStatus();
    if (status.allComplete) return { ok: false, reason: '任务已全部完成' };
    if (!status.complete) return { ok: false, reason: '完成任务后可领取' };
    var reward = status.task.reward;
    var granted = this.grant(reward.id, reward.amount, reward.faction);
    this.profile.taskGuideIndex = status.index + 1;
    if (status.task && status.task.id && /^stage-/.test(status.task.id)) {
      var stageId = status.task.id.replace(/^stage-/, '');
      if (Array.isArray(this.profile.pendingStageReward)) {
        var rewardIndex = this.profile.pendingStageReward.indexOf(stageId);
        if (rewardIndex >= 0) this.profile.pendingStageReward.splice(rewardIndex, 1);
      }
    }
    this.save();
    return { ok: true, task: status.task, reward: reward, granted: granted, next: this.taskGuideStatus() };
  };

  Progression.prototype.fixture = function () {
    var profile = defaultProfile();
    profile.lingyun = 8000;
    profile.spiritSeeds.universal = 60;
    profile.spiritSeed = 60;
    profile.talisman = 12;
    profile.heroes.hongyi = { owned: true, level: 18, star: 4, contracts: 1 };
    profile.heroes.huangjin = { owned: true, level: 16, star: 3, contracts: 1 };
    profile.heroes.xuanya = { owned: true, level: 14, star: 3, contracts: 0 };
    profile.heroes.qingyi = { owned: true, level: 12, star: 2, contracts: 0 };
    profile.heroes.suwen = { owned: true, level: 12, star: 1, contracts: 0 };
    profile.heroes.nuba = { owned: true, level: 12, star: 3, contracts: 1 };
    return normalizeProfile(profile);
  };

  YL.Progression = Progression;
  YL.GROWTH_HERO_DEFS = HERO_DEFS;
  YL.GROWTH_HERO_IDS = HERO_IDS;
  YL.GROWTH_CORE_SLOT_COUNT = CORE_SLOT_COUNT;
  YL.GROWTH_MAX_LEVEL = MAX_LEVEL;
  YL.GROWTH_MAX_STAR = MAX_STAR;
  YL.FACTION_PACKAGING = FACTION_PACKAGING;
  YL.FACTION_IDS = FACTION_IDS;
  YL.BASE_SEED_IDS = BASE_SEED_IDS;
  YL.SPIRIT_SEED_IDS = SPIRIT_SEED_IDS;
  YL.SPIRIT_SEED_PACKAGING = SPIRIT_SEED_PACKAGING;
  YL.RECRUIT_REWARD_POOL = RECRUIT_REWARD_POOL;
  YL.HERO_STAR_EFFECTS = HERO_STAR_EFFECTS;
  YL.QUALITY_PACKAGING = QUALITY_PACKAGING;
  YL.STAR_COSTS = STAR_COSTS;
  YL.STAR_SKILL_NODES = STAR_SKILL_NODES;
  YL.TASK_GUIDE_DEFINITIONS = TASK_GUIDE_DEFINITIONS;
}(typeof globalThis !== 'undefined' ? globalThis : this));
