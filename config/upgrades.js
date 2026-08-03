(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 局内肉鸽强化配置。
   * type: common 通用 / faction 阵营 / exclusive 专属
   * rarity: common 普通 / rare 稀有 / legendary 传说
   */
  YL.ROGUE_UPGRADES = [
    {
      id: 'U01', type: 'common', rarity: 'common', name: '全军奋起', maxLevel: 3,
      levels: [
        '全队 ATK +10%',
        '全队 ATK +18%',
        '全队 ATK +25%，额外攻速 +5%'
      ]
    },
    {
      id: 'U02', type: 'common', rarity: 'common', name: '护身符甲', maxLevel: 3,
      levels: [
        '全队 DEF +12%',
        '全队 DEF +22%',
        '全队 DEF +32%，每名角色本波首次受击伤害 -30%'
      ]
    },
    {
      id: 'U03', type: 'common', rarity: 'common', name: '气血充盈', maxLevel: 3,
      levels: [
        '全队最大 HP +12%',
        '全队最大 HP +22%',
        '全队最大 HP +30%，阵法血量上限 +10%'
      ]
    },
    {
      id: 'U04', type: 'common', rarity: 'common', name: '疾风符', maxLevel: 3,
      levels: [
        '全队攻速 +8%',
        '全队攻速 +14%',
        '全队攻速 +20%，远程弹道速度 +10%'
      ]
    },
    {
      id: 'U05', type: 'common', rarity: 'rare', name: '灵气加持', maxLevel: 3, p0: true,
      levels: [
        '主角灵气恢复速度 +15%',
        '主角灵气恢复速度 +25%',
        '主角灵气恢复速度 +35%，每波首次主角技能消耗 -1 灵气'
      ]
    },
    {
      id: 'U06', type: 'common', rarity: 'rare', name: '聚魂回响', maxLevel: 2,
      levels: [
        '每击杀 10 个敌人，全队回复 2% 最大 HP',
        '每击杀 10 个敌人，全队回复 3.5% 最大 HP'
      ]
    },
    {
      id: 'U07', type: 'common', rarity: 'rare', name: '破阵火种', maxLevel: 3, p0: true,
      levels: [
        '全队技能伤害 +10%；选择时所有大招立刻充能 25%',
        '全队技能伤害 +18%；选择时所有大招立刻充能 25%',
        '全队技能伤害 +26%，所有角色大招 CD -10%；选择时立刻充能 25%'
      ]
    },
    {
      id: 'U08', type: 'common', rarity: 'rare', name: '金甲护阵', maxLevel: 2,
      levels: [
        '阵法血量上限 +15%，敌人破阵伤害 -10%',
        '阵法血量上限 +25%，敌人破阵伤害 -18%'
      ]
    },
    {
      id: 'U09', type: 'common', rarity: 'legendary', name: '天命重燃', maxLevel: 1, p0: true,
      levels: ['每波首次有角色阵亡时，3s 后以 35% HP 复活；复活时击退附近敌人']
    },
    {
      id: 'U10', type: 'common', rarity: 'legendary', name: '万灵同心', maxLevel: 1,
      levels: ['上阵每有 1 个不同阵营，全队伤害 +6%、受到伤害 -4%，最多计算 5 个阵营']
    },

    {
      id: 'F01', type: 'faction', faction: '人族', rarity: 'common', name: '人族·列阵', maxLevel: 3,
      levels: [
        '人族 DEF +20%',
        '人族 DEF +35%',
        '人族 DEF +45%，第一名人族阻挡数 +1'
      ]
    },
    {
      id: 'F02', type: 'faction', faction: '人族', rarity: 'rare', name: '人族·军势', maxLevel: 3, p0: true,
      levels: [
        '被人族阻挡的敌人受到全队伤害 +12%',
        '被人族阻挡的敌人受到全队伤害 +20%',
        '被人族阻挡的敌人受到全队伤害 +28%；死亡时为同列友方提供护盾'
      ]
    },
    {
      id: 'F03', type: 'faction', faction: '修士', rarity: 'common', name: '修士·符脉', maxLevel: 3,
      levels: [
        '修士大招 CD -8%',
        '修士大招 CD -14%',
        '修士大招 CD -20%，修士释放大招后恢复少量灵气进度'
      ]
    },
    {
      id: 'F04', type: 'faction', faction: '修士', rarity: 'rare', name: '修士·法阵共鸣', maxLevel: 2,
      levels: [
        '修士释放大招时，为最低血量队友提供 80% 修士 ATK 的护盾',
        '修士释放大招时，为最低血量队友提供 140% 修士 ATK 的护盾'
      ]
    },
    {
      id: 'F05', type: 'faction', faction: '妖族', rarity: 'common', name: '妖族·迅影', maxLevel: 3,
      levels: [
        '妖族攻速 +12%',
        '妖族攻速 +22%',
        '妖族攻速 +32%，击杀后额外攻速 +15%，持续 3s'
      ]
    },
    {
      id: 'F06', type: 'faction', faction: '妖族', rarity: 'rare', name: '妖族·野性连击', maxLevel: 3, p0: true,
      levels: [
        '妖族每第 3 次普攻追加 40% ATK 伤害',
        '妖族每第 3 次普攻追加 65% ATK 伤害',
        '妖族每第 3 次普攻追加 90% ATK 小范围横斩'
      ]
    },
    {
      id: 'F07', type: 'faction', faction: '鬼族', rarity: 'common', name: '鬼族·阴火', maxLevel: 3,
      levels: [
        '鬼族造成的持续伤害 +25%',
        '鬼族造成的持续伤害 +45%',
        '鬼族造成的持续伤害 +60%，持续伤害每跳有概率额外跳一次'
      ]
    },
    {
      id: 'F08', type: 'faction', faction: '鬼族', rarity: 'rare', name: '鬼族·魂爆', maxLevel: 2, p0: true,
      levels: [
        '灼烧敌人死亡时造成 45% 红衣 ATK 小范围爆炸；魂爆不能连锁触发',
        '魂爆提升至 80% 红衣 ATK，范围扩大并留下 1s 余火'
      ]
    },
    {
      id: 'F09', type: 'faction', faction: '神', rarity: 'rare', name: '神·神谕', maxLevel: 3,
      levels: [
        '神阵营技能伤害 +18%',
        '神阵营技能伤害 +30%',
        '神阵营技能伤害 +42%，神阵营释放大招时净化全队'
      ]
    },
    {
      id: 'F10', type: 'faction', faction: '魔', rarity: 'legendary', name: '魔·献祭', maxLevel: 1, disabled: true,
      levels: ['魔阵营伤害 +35%、技能伤害 +15%，但受到治疗 -20%。当前版本暂不进入刷新池']
    },

    {
      id: 'E01', type: 'exclusive', hero: 'huangjin', rarity: 'common', name: '鼓波扩音', maxLevel: 3, p0: true,
      levels: [
        '镇岳鼓波距离 +70px',
        '第二道鼓波伤害 +25%',
        '每轮攻击追加第 3 道小鼓波，造成 25% ATK；小鼓波不击退'
      ]
    },
    {
      id: 'E13', type: 'exclusive', hero: 'huangjin', rarity: 'rare', name: '重鼓连敲', maxLevel: 3, p0: true,
      levels: [
        '重鼓从每第 3 轮改为每第 2 轮触发',
        '重鼓减速持续时间 +0.5 秒',
        '重鼓命中 3 个及以上敌人时，追加一次短震，造成 35% ATK 并轻微击退'
      ]
    },
    {
      id: 'E11', type: 'exclusive', hero: 'huangjin', rarity: 'rare', name: '山岳回响', maxLevel: 3, p0: true,
      levels: [
        '每轮鼓波结束后，在最远处爆开回响，造成 30% ATK',
        '回响范围 +20%',
        '回响连续爆两次，第二次造成 20% ATK'
      ]
    },
    {
      id: 'E12', type: 'exclusive', hero: 'huangjin', rarity: 'rare', name: '裂地聚阵', maxLevel: 3, disabled: true,
      levels: ['旧版聚怪链已停用，避免黄巾形成常驻控场闭环']
    },
    {
      id: 'E02', type: 'exclusive', hero: 'huangjin', rarity: 'legendary', name: '山岳护城', maxLevel: 1, ultimateUnlock: true,
      levels: ['解锁黄巾大招山岳护城：为城防生成护盾，并短暂压制接近阵前的敌人']
    },
    {
      id: 'E03', type: 'exclusive', hero: 'hongyi', rarity: 'common', name: '业火爆燃', maxLevel: 3, p0: true,
      levels: [
        '主火羽命中后产生 80px 爆燃，造成 40% ATK 范围伤害',
        '爆燃命中已灼烧目标时扩大至 100px，并将灼烧传播给附近最多 2 名敌人',
        '灼烧目标死亡时产生 70% ATK 连锁爆燃；爆燃击杀可再传递 1 代，次代伤害降为 35% ATK'
      ]
    },
    {
      id: 'E14', type: 'exclusive', hero: 'hongyi', rarity: 'rare', name: '凤羽齐射', maxLevel: 3, p0: true,
      levels: [
        '普攻改为三羽扇射：主火羽伤害不变，两侧火羽各造成 35% ATK，侧羽不凝聚业火符',
        '两侧火羽伤害提高至 45% ATK，并在短暂展开后向主目标弯曲',
        '每次普攻延迟 0.18 秒追加第二轮三羽齐射，每枚造成 30% ATK；追加火羽不凝符、不递归追加'
      ]
    },
    {
      id: 'E16', type: 'exclusive', hero: 'hongyi', rarity: 'rare', name: '赤莲焚城', maxLevel: 3, p0: true,
      levels: [
        '业火莲心原有火区替换为五瓣莲火：主要向敌人来袭方向延伸，持续时间与基础跳伤不变',
        '莲火每秒朝敌人最密集方向延伸一片莲瓣，造成 70% 火区跳伤并刷新灼烧',
        '两个赤莲火区重叠时融合为业火莲台：六向喷发莲焰，范围上限 135%，剩余时间最高刷新至 5 秒'
      ]
    },
    {
      id: 'E04', type: 'exclusive', hero: 'hongyi', rarity: 'legendary', name: '焚天火雨', maxLevel: 1, ultimateUnlock: true,
      levels: ['解锁红衣大招焚天火雨：对全场敌人降下火雨，并刷新灼烧']
    },
    {
      id: 'Q01', type: 'exclusive', hero: 'qingyi', rarity: 'common', name: '照破加深', maxLevel: 3, p0: true,
      levels: [
        '青灯照影的照破增伤从 +8% 提高到 +12%',
        '照破持续时间从 4s 提高到 5.5s',
        '青灯命中精英 / Boss 时，照破额外提高 4%'
      ]
    },
    {
      id: 'Q02', type: 'exclusive', hero: 'qingyi', rarity: 'common', name: '青灯连照', maxLevel: 3, p0: true,
      levels: [
        '青灯命中后，向附近 1 个敌人传播 50% 持续时间的照破',
        '传播目标 +1',
        '若附近没有可传播目标，原地留下 1s 残灯；下一个进入范围的敌人获得照破'
      ]
    },
    {
      id: 'Q03', type: 'exclusive', hero: 'qingyi', rarity: 'rare', name: '符灯同辉', maxLevel: 3, p0: true,
      levels: [
        '触发同辉所需辉光从 6 降低为 5',
        '同辉持续时间 +1s',
        '同辉期间，触发者对照破目标的第一次命中额外造成 30% 青衣 ATK 光爆'
      ]
    },
    {
      id: 'Q04', type: 'exclusive', hero: 'qingyi', rarity: 'rare', name: '引魂护城', maxLevel: 3, p0: true,
      levels: [
        '城防低于 50% 时，同辉额外恢复 80% 青衣 ATK 城防',
        '溢出治疗的 50% 转为城防护盾',
        '城防有护盾时，所有御灵攻速 +8%'
      ]
    },
    {
      id: 'Q05', type: 'exclusive', hero: 'qingyi', rarity: 'legendary', name: '万灯归阵', maxLevel: 1, ultimateUnlock: true,
      levels: ['解锁青衣大招万灯归阵：全场施加青灯照破，并让御灵进入短暂同辉']
    },
    {
      id: 'E07', type: 'exclusive', hero: 'xuanya', rarity: 'common', name: '裂羽穿心', maxLevel: 3, p0: true,
      levels: [
        '鸦影飞刀命中后继续向前飞行 180px，路径上的敌人受到 40% ATK 伤害',
        '穿刺距离提高到 260px，穿刺伤害提高到 55% ATK',
        '穿刺距离提高到 340px，穿刺伤害提高到 70% ATK'
      ]
    },
    {
      id: 'E17', type: 'exclusive', hero: 'xuanya', rarity: 'common', name: '回旋鸦刃', maxLevel: 3, p0: true,
      levels: [
        '鸦影飞刀飞到尽头后返回玄鸦，返回路径上的敌人受到 35% ATK 伤害',
        '返回伤害提高到 50% ATK',
        '返回路径变宽，返回伤害提高到 65% ATK'
      ]
    },
    {
      id: 'E18', type: 'exclusive', hero: 'xuanya', rarity: 'rare', name: '追命鸦痕', maxLevel: 3, p0: true,
      levels: [
        '玄鸦命中生命低于 35% 的敌人时施加鸦痕，持续 3 秒；若场上没有鸦痕目标，优先攻击生命百分比最低的敌人',
        '鸦痕触发血线提高到 45%；玄鸦攻击鸦痕目标时，伤害提高 25%',
        '玄鸦击杀鸦痕目标时，向附近生命百分比最低的敌人追加一枚追命飞刀，造成 70% ATK 伤害'
      ]
    },
    {
      id: 'E19', type: 'exclusive', hero: 'xuanya', rarity: 'rare', name: '群鸦窥命', maxLevel: 3, p0: false, disabled: true,
      levels: [
        '旧版鸦痕索敌链已合并进「追命鸦痕」',
        '旧版鸦痕血线链已合并进「追命鸦痕」',
        '旧版溢伤转移链已合并进「追命鸦痕」'
      ]
    },
    {
      id: 'E08', type: 'exclusive', hero: 'xuanya', rarity: 'legendary', name: '夜幕收割', maxLevel: 1, ultimateUnlock: true,
      levels: ['解锁玄鸦大招夜幕收割：锁定高威胁目标连续斩击，并施加破绽']
    },
    {
      id: 'E09', type: 'exclusive', hero: 'suwen', rarity: 'common', name: '星针入骨', maxLevel: 3, p0: true,
      levels: [
        '太素星针伤害 +20%',
        '星蚀每层增伤从 +6% 提高到 +8%',
        '太素星针命中 3 层及以上星蚀目标时，额外造成 35% ATK 入骨伤害'
      ]
    },
    {
      id: 'E20', type: 'exclusive', hero: 'suwen', rarity: 'common', name: '坠星连针', maxLevel: 3, p0: true,
      levels: [
        '太素星针命中后，有 25% 概率在同一落点追加 1 枚小星针，造成 40% ATK',
        '小星针概率提升至 40%',
        '命中 5 层及以上星蚀目标时，小星针必定触发'
      ]
    },
    {
      id: 'E21', type: 'exclusive', hero: 'suwen', rarity: 'rare', name: '问命加深', maxLevel: 3, p0: true,
      levels: [
        '问命针伤害从 150% ATK 提升至 180% ATK',
        '问命针所需连续命中从 3 次降低为 2 次',
        '问命针命中后，将目标星蚀层数提升至至少 3 层'
      ]
    },
    {
      id: 'E22', type: 'exclusive', hero: 'suwen', rarity: 'rare', name: '观星持命', maxLevel: 3, p0: true,
      levels: [
        '当前问命目标死亡或暂时离开攻击范围时，问命计数保留 1.5s',
        '保留期间命中新目标时，继承保留计数并额外施加 1 层星蚀',
        '问命针命中后，素问 2s 内优先继续攻击该目标；不覆盖城防紧急索敌'
      ]
    },
    {
      id: 'E10', type: 'exclusive', hero: 'suwen', rarity: 'legendary', name: '天命星陨', maxLevel: 1, ultimateUnlock: true,
      levels: ['解锁素问大招天命星陨：围绕最高星蚀 / 精英 / Boss 目标落下多枚星针']
    }
  ];
}(typeof globalThis !== 'undefined' ? globalThis : this));
