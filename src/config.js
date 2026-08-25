(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};
  var uiCanvas = YL.UI_CANVAS || { width: 750, height: 1334 };
  YL.W = uiCanvas.width;
  YL.H = uiCanvas.height;
  // 标题用马善政体保留视觉稿的手写笔锋；正文用思源宋体子集，补足中式金石感且保证小字号清晰。
  // 22px 及以上使用标题字体，其余正文、数值和说明使用正文宋体；未收录字符退回系统宋体。
  // Web 端由 index.html 的 @font-face 加载，微信端由 game.js 在创建 Canvas 前调用 wx.loadFont。
  YL.UI_FONT_TITLE_FAMILY = '"MaShanZheng","Microsoft YaHei","PingFang SC",sans-serif';
  YL.UI_FONT_BODY_FAMILY = '"NotoSerifSCGame","Noto Serif SC","Source Han Serif SC","Songti SC","SimSun",serif';
  YL.UI_FONT_FAMILY = YL.UI_FONT_TITLE_FAMILY;
  YL.UI_FONT_PATH = 'assets/fonts/MaShanZheng-Regular.ttf';
  YL.uiFontFamily = function (size) {
    return Number(size) >= 22 ? YL.UI_FONT_TITLE_FAMILY : YL.UI_FONT_BODY_FAMILY;
  };
  YL.COLORS = {
    ink: '#07111d', ink2: '#101c29', panel: '#16202a',
    paper: '#f4ddb0', gold: '#dba84c', gold2: '#8b5a23',
    red: '#d94a35', red2: '#8f261f', fire: '#ff8a36',
    jade: '#47d8b1', teal: '#15958d', blue: '#58bde9',
    white: '#fff7df', muted: '#98a6a2', danger: '#ef5d56'
  };
  YL.ASSETS = {
    battlefield: 'assets/art/battlefield.webp',
    title: 'assets/art/title-keyart.webp',
    characters: 'assets/art/character-atlas.webp',
    icons: 'assets/art/icon-atlas.webp',
    heroHongyi: 'assets/art/sprites/hero-hongyi-v3.png',
    heroQingyi: 'assets/art/sprites/hero-qingyi-v3.png',
    heroHuangjin: 'assets/art/sprites/hero-huangjin-v3.png',
    heroHongyiWalk: 'assets/art/vfx/hero-action-v1/hongyi-walk-packed.webp',
    heroHuangjinSafeBody: 'assets/art/rig-preview/huangjin-standard-v1/body-no-shield.webp',
    heroHuangjinSafeShield: 'assets/art/skeleton/huangjin-v2/shield.png',
    heroHuangjinBody: 'assets/art/skeleton/huangjin-v1/body.png',
    heroHuangjinHead: 'assets/art/skeleton/huangjin-v1/head.png',
    heroHuangjinShield: 'assets/art/skeleton/huangjin-v1/shield.png',
    heroHuangjinRigHead: 'assets/art/skeleton/huangjin-v2/head.png',
    heroHuangjinRigBody: 'assets/art/skeleton/huangjin-v2/body.png',
    heroHuangjinRigBase: 'assets/art/skeleton/huangjin-v2/base.png',
    heroHuangjinRigShield: 'assets/art/skeleton/huangjin-v2/shield.png',
    heroHuangjinRigLeftUpperArm: 'assets/art/skeleton/huangjin-v2/left_upper_arm.png',
    heroHuangjinRigLeftForearm: 'assets/art/skeleton/huangjin-v2/left_forearm.png',
    heroHuangjinRigRightArm: 'assets/art/skeleton/huangjin-v2/right_arm.png',
    heroHuangjinRigLeftLeg: 'assets/art/skeleton/huangjin-v2/left_leg.png',
    heroHuangjinRigRightLeg: 'assets/art/skeleton/huangjin-v2/right_leg.png',
    heroHuangjinRigCape: 'assets/art/skeleton/huangjin-v2/cape.png',
    heroXuanya: 'assets/art/sprites/hero-xuanya-v3.png',
    heroSuwen: 'assets/art/sprites/hero-suwen-v3.png',
    heroNuba: 'assets/art/sprites/hero-nuba-v1.png',
    heroCastNuba: 'assets/art/vfx/hero-action-v1/nuba-cast-v1.png',
    heroAttackHongyi: 'assets/art/vfx/attack-frames-v3/hongyi-mature-packed.webp',
    hongyiFireFeather: 'assets/art/vfx/hongyi-final-v1/hongyi-fire-feather-v1.png',
    hongyiFanFeather: 'assets/art/vfx/hongyi-final-v1/hongyi-fan-feather-v1.png',
    hongyiFirePetal: 'assets/art/vfx/hongyi-final-v1/hongyi-fire-petal-v1.png',
    hongyiSigil: 'assets/art/vfx/hongyi-final-v1/hongyi-sigil-v1.png',
    hongyiSigilRing: 'assets/art/vfx/hongyi-final-v1/hongyi-sigil-ring-v1.png',
    hongyiFireHitSheet: 'assets/art/vfx/hongyi-final-v1/hongyi-fire-hit-sheet-v1.png',
    hongyiEmberBurstSheet: 'assets/art/vfx/hongyi-final-v1/hongyi-ember-burst-sheet-v1.png',
    hongyiLotusFire: 'assets/art/vfx/hongyi-final-v1/hongyi-lotus-fire-v1.png',
    hongyiLotusFivePetal: 'assets/art/vfx/hongyi-final-v1/hongyi-lotus-five-petal-v1.png',
    hongyiLotusPlatform: 'assets/art/vfx/hongyi-final-v1/hongyi-lotus-platform-v1.png',
    heroAttackHuangjinBash: 'assets/art/vfx/attack-frames-v3/huangjin-shield-bash-packed.webp',
    huangjinWallShockwaveBasic: 'assets/art/vfx/huangjin-wall-v1/huangjin-shockwave-basic.png',
    huangjinWallShockwaveFan: 'assets/art/vfx/huangjin-wall-v1/huangjin-shockwave-fan.png',
    huangjinWallSuppressSeal: 'assets/art/vfx/huangjin-wall-v1/huangjin-suppress-seal.png',
    heroAttackXuanya: 'assets/art/vfx/attack-frames-v3/xuanya-mature-packed.webp',
    heroAttackSuwen: 'assets/art/vfx/attack-frames-v3/suwen-mature-normalized.webp',
    heroAttackQingyi: 'assets/art/vfx/attack-frames-v3/qingyi-mature-normalized.webp',
    enemyWispAttackVfx: 'assets/art/vfx/attack-frames-v3/enemy-wisp-attack-packed.png',
    rangedOrbsVfx: 'assets/art/vfx/ranged-orbs-atlas.webp',
    protagonistCastSheet: 'assets/art/vfx/protagonist-cast-v1/sheet-transparent.png',
    meleeSlashesVfx: 'assets/art/vfx/melee-slashes-atlas.webp',
    statusShieldAura: 'assets/art/vfx/status/shield-aura-v1.webp',
    statusGuardDragon: 'assets/art/vfx/status/guard-dragon-v1.webp',
    taoistMain: 'assets/art/ui/taoist-main-v3.webp',
    homeArchiveBook: 'assets/art/ui/home/home-archive-book-v1.webp',
    // 三日首充弹窗：透明组件来自当前批准的首充 UI 资源图集；动态文字、数量和状态仍由代码绘制。
    firstChargePanel: 'assets/art/ui/first-charge-v1/first-charge-panel-v1.png',
    firstChargeHeaderOrnament: 'assets/art/ui/first-charge-v1/first-charge-header-ornament-v1.png',
    firstChargeSideOrnament: 'assets/art/ui/first-charge-v1/first-charge-side-ornament-v1.png',
    firstChargeTabActive: 'assets/art/ui/first-charge-v1/first-charge-tab-active-v1.png',
    firstChargeTabInactive: 'assets/art/ui/first-charge-v1/first-charge-tab-inactive-v1.png',
    firstChargeHeroNameplate: 'assets/art/ui/first-charge-v1/first-charge-hero-nameplate-v1.png',
    firstChargeButtonNormal: 'assets/art/ui/first-charge-v1/first-charge-button-normal-v1.png',
    firstChargeButtonPressed: 'assets/art/ui/first-charge-v1/first-charge-button-pressed-v1.png',
    firstChargeButtonDisabled: 'assets/art/ui/first-charge-v1/first-charge-button-disabled-v1.png',
    firstChargeRewardLingyun: 'assets/art/ui/first-charge-v1/first-charge-reward-lingyun-v1.png',
    firstChargeRewardTalisman: 'assets/art/ui/first-charge-v1/first-charge-reward-talisman-single-v1.png',
    firstChargeRoleAvatarSuwen: 'assets/art/ui/first-charge-v1/first-charge-role-avatar-suwen-v1.png',
    firstChargeRoleAvatarNuba: 'assets/art/ui/first-charge-v1/first-charge-role-avatar-nuba-v1.webp',
    firstChargeItemFrameGreen: 'assets/art/ui/first-charge-v1/first-charge-item-frame-green-v1.png',
    firstChargeItemFrameBlue: 'assets/art/ui/first-charge-v1/first-charge-item-frame-blue-v1.png',
    firstChargeItemFramePurple: 'assets/art/ui/first-charge-v1/first-charge-item-frame-purple-v1.png',
    firstChargeItemFrameOrange: 'assets/art/ui/first-charge-v1/first-charge-item-frame-orange-v1.png',
    firstChargeBottomOrnament: 'assets/art/ui/first-charge-v1/first-charge-bottom-ornament-v1.png',
    // 千抽请灵符盛典：透明框、花纹、标题和展示立绘分开注册；奖励图标继续复用结果页既有资源。
    summonEventBackdrop: 'assets/art/ui/summon-ticket-event-v1/summon-event-backdrop-v1.webp',
    summonEventReference: 'assets/art/ui/summon-ticket-event-v1/summon-event-reference-v1.webp',
    summonEventPanel: 'assets/art/ui/summon-ticket-event-v1/summon-event-panel-v1.png',
    summonEventRewardCardNormal: 'assets/art/ui/summon-ticket-event-v1/summon-event-reward-card-normal-v1.png',
    summonEventRewardCardClaimable: 'assets/art/ui/summon-ticket-event-v1/summon-event-reward-card-claimable-v1.png',
    summonEventRewardCardClaimed: 'assets/art/ui/summon-ticket-event-v1/summon-event-reward-card-claimed-v1.png',
    summonEventRewardCardLocked: 'assets/art/ui/summon-ticket-event-v1/summon-event-reward-card-locked-v1.png',
    summonEventDetailPanel: 'assets/art/ui/summon-ticket-event-v1/summon-event-detail-panel-v1.png',
    summonEventButtonNormal: 'assets/art/ui/summon-ticket-event-v1/summon-event-button-normal-v1.png',
    summonEventButtonPressed: 'assets/art/ui/summon-ticket-event-v1/summon-event-button-pressed-v1.png',
    summonEventButtonDisabled: 'assets/art/ui/summon-ticket-event-v1/summon-event-button-disabled-v1.png',
    summonEventDayTabActive: 'assets/art/ui/summon-ticket-event-v1/summon-event-day-tab-active-v1.png',
    summonEventDayTabInactive: 'assets/art/ui/summon-ticket-event-v1/summon-event-day-tab-inactive-v1.png',
    summonEventTitleOrnament: 'assets/art/ui/summon-ticket-event-v1/summon-event-title-ornament-v1.png',
    summonEventTopOrnamentGold: 'assets/art/ui/summon-ticket-event-v1/summon-event-top-ornament-gold-v1.png',
    summonEventTopOrnamentBronze: 'assets/art/ui/summon-ticket-event-v1/summon-event-top-ornament-bronze-v1.png',
    summonEventCornerOrnamentRightTop: 'assets/art/ui/summon-ticket-event-v1/summon-event-corner-ornament-right-top-v1.png',
    summonEventCornerOrnamentLeftBottom: 'assets/art/ui/summon-ticket-event-v1/summon-event-corner-ornament-left-bottom-v1.png',
    summonEventHangingPendantPair: 'assets/art/ui/summon-ticket-event-v1/summon-event-hanging-pendant-pair-v1.png',
    summonEventDividerLine: 'assets/art/ui/summon-ticket-event-v1/summon-event-divider-line-v1.png',
    summonEventPortraitFrameLine: 'assets/art/ui/summon-ticket-event-v1/summon-event-portrait-frame-line-v1.png',
    summonEventDetailPanelLine: 'assets/art/ui/summon-ticket-event-v1/summon-event-detail-panel-line-v1.png',
    summonEventSidePendant: 'assets/art/ui/summon-ticket-event-v1/summon-event-side-pendant-v1.png',
    summonEventEmblem: 'assets/art/ui/summon-ticket-event-v1/summon-event-emblem-v1.png',
    summonEventDayBadge: 'assets/art/ui/summon-ticket-event-v1/summon-event-day-badge-v1.png',
    summonEventDecorativePlaque: 'assets/art/ui/summon-ticket-event-v1/summon-event-decorative-plaque-v1.png',
    summonEventLockedSeal: 'assets/art/ui/summon-ticket-event-v1/summon-event-locked-seal-v1.png',
    summonEventStarburst: 'assets/art/ui/summon-ticket-event-v1/summon-event-starburst-v1.png',
    summonEventClaimGlow: 'assets/art/ui/summon-ticket-event-v1/summon-event-claim-glow-v1.png',
    summonEventTitle: 'assets/art/ui/summon-ticket-event-v1/summon-event-title-v1.webp',
    summonEventHeroHongyi: 'assets/art/ui/summon-ticket-event-v1/summon-event-hero-hongyi-v2.webp',
    summonEventReturnArrow: 'assets/art/ui/summon-ticket-event-v1/summon-event-return-arrow-v1.png',
    // 宗门主城允许作为完整不透明场景底图使用；地点题签、导航和交互均由代码绘制。
    sectMapNight: 'assets/art/ui/sect/sect-map-night-v1.webp',
    // 从用户确认的局部云雾视觉稿提取的透明叠加层；运行时只绘制到上方未开放区域。
    sectCloudCover: 'assets/art/ui/sect/sect-cloud-cover-static-v2.webp',
    // 主线与宗门左下角常驻任务卡：两种状态使用独立透明成品；文字、进度和图标数量动态绘制。
    taskGuidePanel: 'assets/art/ui/task-guide-v2/task-guide-panel-incomplete-v2.png',
    taskGuidePanelIncomplete: 'assets/art/ui/task-guide-v2/task-guide-panel-incomplete-v2.png',
    taskGuidePanelClaimable: 'assets/art/ui/task-guide-v2/task-guide-panel-claimable-v3-clean.png',
    // 请灵台当前静态页的唯一不透明场景层。HUD、保底、按钮和文字均由代码绘制。
    // v4 已去除视觉稿中的 UI，并将底部延展为连续的法阵台阶与石砖地面。
    recruitSceneNight: 'assets/art/ui/recruit/recruit-scene-night-v4.webp',
    // 请灵台 HUD 图集切出的真实透明组件；文字、数值、图标和进度仍由代码绘制。
    recruitTitleFrame: 'assets/art/ui/recruit/recruit-title-frame-v1.png',
    recruitResourceFrame: 'assets/art/ui/recruit/recruit-resource-frame-v1.png',
    recruitRecordFrame: 'assets/art/ui/recruit/recruit-record-frame-v1.png',
    recruitPityPanel: 'assets/art/ui/recruit/recruit-pity-panel-v1.png',
    recruitButtonSingle: 'assets/art/ui/recruit/recruit-button-single-v1.png',
    recruitButtonTen: 'assets/art/ui/recruit/recruit-button-ten-v1.png',
    recruitBackButton: 'assets/art/ui/recruit/recruit-back-button-v1.png',
    battleFormationOverlay: 'assets/art/ui/battle-lower-v1/battle-formation-blue-v5.png',
    battleLowerHealthFrame: 'assets/art/ui/battle-lower-v1/health-bar-frame.png',
    battleLowerHealthFill: 'assets/art/ui/battle-lower-v1/health-bar-fill.png',
    baguaFormation: 'assets/art/ui/bagua-formation-v3.webp',
    spiritLamp: 'assets/art/ui/spirit-lamp-v3.webp',
    spiritLampStates: 'assets/art/ui/spirit-lamp-states-v4.webp',
    spellIcons: 'assets/art/ui/spell-icons-v2.webp',
    formationIcons: 'assets/art/ui/formation-icon-atlas-v1.webp',
    hudControlIcons: 'assets/art/ui/hud-control-icons-v2.webp',
    hudSpeedBase: 'assets/art/ui/hud-speed-base-v1.png',
    hudSpeedGlyphX: 'assets/art/ui/hud-speed-x-v1.png',
    hudSpeedGlyph1: 'assets/art/ui/hud-speed-1-v1.png',
    hudSpeedGlyph2: 'assets/art/ui/hud-speed-2-v1.png',
    hudSpeedGlyph3: 'assets/art/ui/hud-speed-3-v1.png',
    hudProgressFrame: 'assets/art/ui/hud-progress-frame-v2.webp',
    hudProgressOrnament: 'assets/art/ui/hud-progress-ornament-v3.png',
    upgradeCardFrames: 'assets/art/ui/upgrade-card-frames-v1.webp',
    upgradeCardOrnaments: 'assets/art/ui/upgrade-card-ornaments-v1.webp',
    upgradeStarFilled: 'assets/art/ui/upgrade-star-filled-v1.png',
    upgradeStarEmpty: 'assets/art/ui/upgrade-star-empty-v1.png',
    eliteDrawTubeShake: 'assets/art/vfx/elite-draw-v1/tube-shake-v2/processed-final/sheet-transparent.webp',
    eliteDrawSealBurst: 'assets/art/vfx/elite-draw-v1/seal-burst/sheet-transparent.webp',
    eliteDrawSignEject: 'assets/art/vfx/elite-draw-v1/sign-eject-v2/processed-final/sheet-transparent.png',
    talismanControl: 'assets/art/ui/talisman-control-v1.png',
    talismanCountBadge: 'assets/art/ui/talisman-count-badge-v1.png',
    talismanModalPanel: 'assets/art/ui/talisman-modal-panel-v1.webp',
    talismanRowCommon: 'assets/art/ui/talisman-row-common-v1.png',
    talismanRowRare: 'assets/art/ui/talisman-row-rare-v1.png',
    talismanRowLegendary: 'assets/art/ui/talisman-row-legendary-v1.png',
    resultTitlePlaque: 'assets/art/ui/battle-result-v1/result-title-plaque.png',
    resultSealSuccess: 'assets/art/ui/battle-result-v1/result-seal-success.png',
    resultSealSuccessGlow: 'assets/art/ui/battle-result-v1/result-seal-success-glow.png',
    resultSealFailure: 'assets/art/ui/battle-result-v1/result-seal-failure.png',
    resultSealFailureGlow: 'assets/art/ui/battle-result-v1/result-seal-failure-glow.png',
    resultRewardStrip: 'assets/art/ui/battle-result-v1/result-reward-strip.png',
    resultReportPanel: 'assets/art/ui/battle-result-v1/result-report-panel.png',
    resultButtonAd: 'assets/art/ui/battle-result-v1/result-button-ad.png',
    resultButtonConfirm: 'assets/art/ui/battle-result-v1/result-button-confirm.png',
    resultRewardLingyun: 'assets/art/ui/battle-result-v1/result-reward-lingyun.png',
    resultRewardTalisman: 'assets/art/ui/battle-result-v1/result-reward-talisman.png',
    resultProtagonistMark: 'assets/art/ui/battle-result-v1/result-protagonist-mark.png',
    resultPlayMark: 'assets/art/ui/battle-result-v1/result-play-mark.png',
    enemyWisp: 'assets/art/sprites/enemy-wisp.webp',
    enemyJiangshi: 'assets/art/sprites/enemy-jiangshi.webp',
    enemyBoss: 'assets/art/sprites/enemy-boss-transparent.webp'
  };
  YL.AUDIO = {
    main: 'assets/audio/main.mp3',
    battle: 'assets/audio/battle.mp3'
  };
  YL.SFX = {
    uiTap: 'assets/audio/sfx/sfx_ui_tap_confirm.mp3',
    uiCardOpen: 'assets/audio/sfx/sfx_ui_card_open.mp3',
    upgradeCommon: 'assets/audio/sfx/sfx_ui_upgrade_pick_common.mp3',
    upgradeRare: 'assets/audio/sfx/sfx_ui_upgrade_pick_rare.mp3',
    upgradeLegendary: 'assets/audio/sfx/sfx_ui_upgrade_pick_legendary.mp3',
    waveStart: 'assets/audio/sfx/sfx_wave_start.mp3',
    waveClear: 'assets/audio/sfx/sfx_wave_clear.mp3',
    bossAppear: 'assets/audio/sfx/sfx_boss_appear.mp3',
    enemyHit: 'assets/audio/sfx/sfx_enemy_hit_soft.mp3',
    enemyDie: 'assets/audio/sfx/sfx_enemy_die_paper.mp3',
    wallHitLight: 'assets/audio/sfx/sfx_wall_hit_light.mp3',
    wallHitHeavy: 'assets/audio/sfx/sfx_wall_hit_heavy.mp3',
    hongyiFireHit: 'assets/audio/sfx/sfx_hongyi_fire_hit.mp3',
    huangjinDrumWave: 'assets/audio/sfx/sfx_huangjin_drum_wave.mp3',
    xuanyaBladeHit: 'assets/audio/sfx/sfx_xuanya_blade_hit.mp3',
    spellWind: 'assets/audio/sfx/sfx_spell_wind.mp3',
    spellRain: 'assets/audio/sfx/sfx_spell_rain.mp3',
    runeDrop: 'assets/audio/sfx/sfx_rune_drop.mp3',
    runePickup: 'assets/audio/sfx/sfx_rune_pickup.mp3',
    runeEquip: 'assets/audio/sfx/sfx_rune_equip.mp3',
    energyFull: 'assets/audio/sfx/sfx_energy_full.mp3',
    ultimateHongyi: 'assets/audio/sfx/sfx_ultimate_hongyi.mp3',
    ultimateHuangjin: 'assets/audio/sfx/sfx_ultimate_huangjin.mp3',
    ultimateXuanya: 'assets/audio/sfx/sfx_ultimate_xuanya.mp3',
    victory: 'assets/audio/sfx/sfx_victory.mp3',
    defeat: 'assets/audio/sfx/sfx_defeat.mp3'
  };

  // 自动计算资源基础路径：优先遵循页面声明的 base（兼容上传平台的 iframe / 子路径部署）。
  // 不手动从 location.href 截断，避免平台以 /play 路由承载页面时把资源指到错误目录。
  try {
    var pageUrl = (typeof location !== 'undefined') ? location.href : '';
    var base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : pageUrl;
    YL.BASE = base;
    function toAbs(p) {
      if (/^(?:data:|blob:|https?:|file:)/i.test(p)) return p;
      return new URL(p, base).href;
    }
    var key;
    for (key in YL.ASSETS) YL.ASSETS[key] = toAbs(YL.ASSETS[key]);
    for (key in YL.AUDIO) YL.AUDIO[key] = toAbs(YL.AUDIO[key]);
    for (key in YL.SFX) YL.SFX[key] = toAbs(YL.SFX[key]);
  } catch (e) { YL.BASE = ''; }
}(typeof globalThis !== 'undefined' ? globalThis : this));
