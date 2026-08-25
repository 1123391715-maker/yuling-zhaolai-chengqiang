(function (root) {
  'use strict';

  // 首局强引导只描述“此刻必须点哪里”。具体业务动作仍走首页、战斗和结算的正式逻辑，
  // 因此不会维护第二套引导状态机或复制奖励/养成流程。
  var YL = root.YL = root.YL || {};
  var W = YL.W || 750;
  var H = YL.H || 1334;
  var TUTORIAL_ATTACK_FOCUS_W = 124;
  var TUTORIAL_ATTACK_FOCUS_H = 132;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function inRect(x, y, rect) {
    return !!rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function roundedPath(ctx, x, y, w, h, radius) {
    var r = Math.max(2, Math.min(radius || 12, w * .5, h * .5));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function layout() {
    return YL.HomeUI && YL.HomeUI.tutorialLayout || {};
  }

  function stageId(game) {
    var stage = game && game.getSelectedStage && game.getSelectedStage();
    return stage && stage.id || '';
  }

  function makeTarget(surface, action, rect, message, options) {
    var target = { surface: surface, action: action, rect: rect, message: message };
    if (options && options.weak) target.weak = true;
    return target;
  }

  function heroCardRect(index) {
    var layouts = layout();
    return layouts.heroCardBox ? layouts.heroCardBox(index) : null;
  }

  function tutorialEnemyHeadY(game, enemy) {
    if (game && typeof game.wallEnemyHeadY === 'function') return game.wallEnemyHeadY(enemy);
    return enemy.y - 18 * (enemy.size || 1);
  }

  function targetFor(game) {
    if (!game || !game.progression || !game.progression.profile) return null;
    var step = game.progression.profile.guideStep || 'stage-1-1';
    var layouts = layout();
    var home = layouts.home || {};
    var recruit = layouts.recruit || {};
    var growth = layouts.growth || {};

    if (game.state === 'battle' && game.nubaRescue && game.nubaRescue.active && !game.nubaRescue.complete) {
      return makeTarget('game', 'nubaRescueContinue', game.nubaRescue.continueRect,
        game.nubaRescue.dialogueIndex === 0
          ? '女魃：呵呵，这就顶不住了吗？'
          : '女魃：退后些，莫要把你伤着了');
    }

    if (game.state === 'battle' && game.phase === 'wave' && game.spiritAccessoryTutorial) {
      var accessoryTutorial = game.spiritAccessoryTutorial;
      if (accessoryTutorial.phase === 'pickup') {
        for (var dropIndex = 0; dropIndex < (game.runeDrops || []).length; dropIndex++) {
          var drop = game.runeDrops[dropIndex];
          if (drop && drop.id === accessoryTutorial.dropId) {
            return makeTarget('game', 'spiritAccessoryPickup', { x: drop.x - 40, y: drop.y - 40, w: 80, h: 80 }, '点击拾取第一件灵饰');
          }
        }
      }
      if (accessoryTutorial.phase === 'equip') {
        if (game.dragRune) {
          var equipHero = game.heroes && game.heroes[0];
          if (equipHero) return makeTarget('game', 'spiritAccessoryEquip', { x: equipHero.x - 74, y: equipHero.y - 154, w: 148, h: 154 }, '拖到任意御灵头顶，装备灵饰');
        }
        return makeTarget('game', 'spiritAccessoryShelf', { x: 674, y: 458, w: 70, h: 76 }, '按住右侧灵饰，再拖到御灵头顶');
      }
    }

    if (game.state === 'battle' && game.phase === 'wave' && game.isFirstStageTutorialActive && game.isFirstStageTutorialActive()) {
      var firstStageTutorial = game.firstStageTutorial;
      if (firstStageTutorial.summonAvailable && !firstStageTutorial.summoned) {
        return makeTarget('game', 'tutorialSummon', game.firstStageTutorialSummonRect(), '道长，怪潮越来越多，请召唤御灵吧！');
      }
      if (firstStageTutorial.skillUnlocked && !firstStageTutorial.skillCast) {
        return makeTarget('game', 'tutorialWind', game.firstStageTutorialSpellRect('wind'), '战斗可以积攒灵力，释放强力法术');
      }
      if (firstStageTutorial.attackGuideActive && !firstStageTutorial.attackGuideDone) {
        var attackTarget = null;
        var attackTargetHeadY = -Infinity;
        for (var enemyIndex = 0; enemyIndex < (game.enemies || []).length; enemyIndex++) {
          var candidate = game.enemies[enemyIndex];
          if (!candidate || candidate.dead) continue;
          var candidateHeadY = tutorialEnemyHeadY(game, candidate);
          if (!attackTarget || candidateHeadY > attackTargetHeadY) {
            attackTarget = candidate;
            attackTargetHeadY = candidateHeadY;
          }
        }
        var attackRect = attackTarget
          ? { x: clamp(attackTarget.x - TUTORIAL_ATTACK_FOCUS_W * .5, 24, W - TUTORIAL_ATTACK_FOCUS_W - 10),
            y: clamp(attackTargetHeadY - 12, 118, H - 230),
            w: TUTORIAL_ATTACK_FOCUS_W, h: TUTORIAL_ATTACK_FOCUS_H }
          : { x: 24, y: 220, w: 650, h: 700 };
        return makeTarget('game', 'tutorialAttack', attackRect, '道长，怪潮袭来，点击界面消灭它们！');
      }
    }

    // 1-2 的二倍速改为弱引导：只给手指，不加遮罩，也不拦截战斗输入；
    // 实际切速仍由正式的 sideActionAt / onDown 逻辑完成。
    if (game.state === 'battle' && game.phase === 'wave' && stageId(game) === '1-2' &&
      step === 'stage-1-2' && (game.speed || 1) < 2) {
      return makeTarget('game', 'battleSpeed', { x: 684, y: 300, w: 54, h: 66 }, '点击右侧按钮开启二倍速', { weak: true });
    }

    if (game.state !== 'title') return null;
    var page = game.homePage || 'main';

    if (game.progression.profile.coreReplaceGuidePending && !game.coreReplaceCandidateId) {
      var ownedIds = YL.HomeUI && YL.HomeUI.heroListIds ? YL.HomeUI.heroListIds(game) : [];
      var coreIds = game.progression.profile.coreHeroIds || [];
      var incomingIndex = -1;
      for (var ownedIndex = 0; ownedIndex < ownedIds.length; ownedIndex++) {
        if (coreIds.indexOf(ownedIds[ownedIndex]) < 0) { incomingIndex = ownedIndex; break; }
      }
      if (page === 'heroes' && incomingIndex >= 0) {
        return makeTarget('home', 'hero:' + ownedIds[incomingIndex], heroCardRect(incomingIndex), '获得第六位御灵：选择它调整建木主灵');
      }
      if (page === 'heroDetail' && coreIds.indexOf(game.selectedHeroId) < 0) {
        return makeTarget('home', 'coreReplaceOpen', growth.detailButton, '点击入驻建木灵位，再选择一位主灵替换');
      }
    }

    if (step === 'summon-event-open' || (step === 'summon-event-claim' && page === 'main')) {
      if (page === 'main') return makeTarget('home', 'summonEventOpen', home.summonEventEntry, '打开千抽盛典，领取首次十连请灵符');
    }
    if (step === 'summon-event-claim' && page === 'summonEvent') {
      return makeTarget('home', 'summonEventClaim', layouts.summonEvent && layouts.summonEvent.action, '领取通关 1-1 的十张请灵符');
    }
    if (step === 'summon-event-return' && page === 'summonEvent') {
      return makeTarget('home', 'summonEventClose', layouts.summonEvent && layouts.summonEvent.back, '返回主线，前往宗门请灵台');
    }

    if (step === 'recruit') {
      if (page === 'main') {
        return makeTarget('home', 'sect', { x: W * 2 / 5, y: home.nav.y, w: W / 5, h: home.nav.h }, '点击宗门，寻找请灵台');
      }
      if (page === 'sect') {
        var summonRect = YL.HomeUI && YL.HomeUI.sectLocationRect && YL.HomeUI.sectLocationRect(game, 'summon');
        return makeTarget('home', 'recruit', summonRect, '点击请灵台，使用刚领取的请灵符');
      }
      if (page === 'recruit') return makeTarget('home', 'recruitTen', recruit.ten, '点击请灵十次，回应青衣');
    }

    if (step === 'grow') {
      if (page === 'heroes') return makeTarget('home', 'hero:qingyi', heroCardRect(3), '点击青衣，进行第一次灵蕴升级');
      if (page === 'heroDetail' && game.selectedHeroId === 'qingyi' && (game.heroGrowthTab || 'level') === 'level') {
        return makeTarget('home', 'heroUpgrade', growth.detailButton, '点击升 1 级，提升青衣灵力');
      }
    }

    if (step === 'stage-1-1' && page === 'main') {
      return makeTarget('home', 'enter', home.enter, '点击入卷镇魂，开始第一场守城');
    }
    // 12 点击任务卡后进入 1-2 主线页，下一步必须切换到 13 的挑战入口，
    // 不能再次把玩家指回同一张任务卡。
    if (page === 'main' && game.taskGuideChallengeActive === 'stage-1-2' && game.selectedStageIndex === 1) {
      return makeTarget('home', 'enter', home.enter, '点击入卷镇魂，挑战第一章·1-2');
    }
    // 1-2 通关后的 22/23 节点改为弱引导：玩家点击任务卡后进入 1-3，
    // 再由手指提示点击挑战按钮；不遮罩，也不限制其它按钮。
    if (page === 'main' && game.taskGuideChallengeActive === 'stage-1-3' && game.selectedStageIndex === 2) {
      return makeTarget('home', 'enter', home.enter, '点击入卷镇魂，挑战第一章·1-3', { weak: true });
    }
    // 升级或关卡完成后回到主线，任务卡进入“可领取”态；领取后下一条任务要继续，
    // 1-2 通关后的任务卡链路统一使用弱引导，明确显示当前 1-2/1-3 任务。
    // 这里读取正式任务链状态，不依赖 pendingStageReward，避免 11/12 节点
    // 因为 guideStep 已推进或旧档字段缺失而被跳过。
    if ((page === 'main' || page === 'sect') && home.taskGuide && game.progression.taskGuideStatus) {
      var taskStatus = game.progression.taskGuideStatus();
      if (taskStatus && taskStatus.task && !taskStatus.allComplete) {
        if (taskStatus.complete) {
          var taskClaimMessage = taskStatus.task.id === 'grow'
            ? '点击领取任务奖励'
            : taskStatus.task.id === 'stage-1-2'
              ? '点击任务卡，领取 1-2 通关奖励'
              : taskStatus.task.id === 'stage-1-3'
                ? '点击任务卡，领取 1-3 通关奖励'
                : '点击领取任务奖励';
          return makeTarget('home', 'taskGuideClaim', home.taskGuide, taskClaimMessage,
            { weak: taskStatus.task.id !== 'grow' });
        }
        if (taskStatus.task.id === 'stage-1-2') {
          return makeTarget('home', 'taskGuideGo:' + taskStatus.task.id, home.taskGuide, '查看下一个任务');
        }
        if (taskStatus.task.id === 'stage-1-3') {
          return makeTarget('home', 'taskGuideGo:' + taskStatus.task.id, home.taskGuide, '查看下一个任务', { weak: true });
        }
      }
    }
    if ((page === 'main' || page === 'sect') && home.taskGuide) {
      var pending = Array.isArray(game.progression.profile.pendingStageReward) ? game.progression.profile.pendingStageReward : [];
      if (pending.indexOf('1-2') >= 0) {
        return makeTarget('home', 'taskGuideClaim', home.taskGuide, '点击任务卡，领取 1-2 通关奖励', { weak: true });
      }
      if (pending.indexOf('1-3') >= 0) {
        return makeTarget('home', 'taskGuideClaim', home.taskGuide, '点击任务卡，领取 1-3 通关奖励', { weak: true });
      }
    }
    return null;
  }

  function homeAction(game, x, y) {
    var target = targetFor(game);
    if (!target || target.surface !== 'home') return null;
    if (target.weak) return null;
    return inRect(x, y, target.rect) ? target.action : 'tutorialBlocked';
  }

  function blocksGameInput(game, x, y) {
    var target = targetFor(game);
    if (!target || target.surface !== 'game') return false;
    if (target.weak) return false;
    // 手指图标会伸到高亮框下方；攻击教学扩大“可点区域”，避免玩家点到手指时被误判为遮罩外。
    var hitRect = target.action === 'tutorialAttack'
      ? { x: Math.max(0, target.rect.x - 32), y: Math.max(0, target.rect.y - 32),
        w: Math.min(W, target.rect.w + 64), h: Math.min(H, target.rect.h + 64) }
      : target.rect;
    return !inRect(x, y, hitRect);
  }

  function drawTapHand(ctx, x, y, time) {
    var pulse = .5 + .5 * Math.sin((time || 0) * 5.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,234,174,' + (.45 + pulse * .35) + ')';
    ctx.lineWidth = 3;
    for (var ring = 0; ring < 2; ring++) {
      ctx.beginPath();
      ctx.arc(x, y, 19 + ring * 11 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    var handY = y + 45 + pulse * 4;
    ctx.save();
    ctx.translate(x, handY);
    ctx.rotate(-.16);
    ctx.shadowColor = 'rgba(0,0,0,.68)';
    ctx.shadowBlur = 7;
    ctx.fillStyle = '#f3c68a';
    ctx.strokeStyle = '#fff0c8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-4, 24, 23, 20, -.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    roundedPath(ctx, -10, -34, 17, 68, 9);
    ctx.fill(); ctx.stroke();
    roundedPath(ctx, 7, 1, 15, 42, 8);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(136,78,44,.72)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(6, 8); ctx.moveTo(-5, 15); ctx.lineTo(5, 18); ctx.stroke();
    ctx.restore();
  }

  function drawMessage(ctx, target) {
    var width = 540;
    var panelH = 68;
    var preferAbove = target.rect.y > H * .68;
    var y = preferAbove ? target.rect.y - 96 : target.rect.y + target.rect.h + 88;
    y = clamp(y, 88, H - 72);
    var x = clamp(target.rect.x + target.rect.w * .5 - width * .5, 32, W - width - 32);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.62)'; ctx.shadowBlur = 12;
    roundedPath(ctx, x, y - panelH * .5, width, panelH, 18);
    ctx.fillStyle = 'rgba(8,25,31,.96)'; ctx.fill();
    ctx.strokeStyle = '#e2b75e'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.font = '900 22px ' + (YL.UI_FONT_TITLE_FAMILY || 'sans-serif');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff0c0';
    ctx.shadowColor = 'rgba(0,0,0,.82)'; ctx.shadowBlur = 4;
    ctx.fillText(target.message, x + width * .5, y, width - 44);
    ctx.restore();
  }

  function draw(game, ctx) {
    var target = targetFor(game);
    if (!target || !target.rect) return false;
    var rect = target.rect;
    var padding = rect.w < 90 ? 12 : 16;
    var x = Math.max(4, rect.x - padding);
    var y = Math.max(4, rect.y - padding);
    var w = Math.min(W - x - 4, rect.w + padding * 2);
    var h = Math.min(H - y - 4, rect.h + padding * 2);
    var pulse = .5 + .5 * Math.sin((game.time || 0) * 4.2);

    if (!target.weak) {
      // 不用 destination-out 挖洞：部分小游戏 Canvas 合成后会让镂空区仍显暗。
      // 四块遮罩直接围住焦点，目标热区因此保持原画面的完整亮度。
      ctx.save();
      // 参考首局成品的亮度保留更多战场信息；焦点热区仍保持原亮度。
      ctx.fillStyle = 'rgba(1,7,12,.50)';
      ctx.fillRect(0, 0, W, y);
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, Math.max(0, W - x - w), h);
      ctx.fillRect(0, y + h, W, Math.max(0, H - y - h));
      ctx.restore();

      // 焦点保留原始按钮/角色画面，并额外加一层暖光，明确提示"这里可以点"。
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      roundedPath(ctx, x, y, w, h, 18);
      ctx.fillStyle = 'rgba(255,223,145,.14)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = '#79f0d8'; ctx.shadowBlur = 16 + pulse * 12;
      roundedPath(ctx, x, y, w, h, 18);
      ctx.strokeStyle = 'rgba(137,255,226,' + (.72 + pulse * .25) + ')';
      ctx.lineWidth = 3.5 + pulse * 2;
      ctx.stroke();
      ctx.restore();
    }

    // 弱引导严格只保留点击手势：不加遮罩、不画描边、不弹说明框，其他按钮可自由操作。
    drawTapHand(ctx, rect.x + rect.w * .5, rect.y + rect.h * .5, game.time || 0);
    if (!target.weak) drawMessage(ctx, target);
    return true;
  }

  YL.TutorialUI = {
    targetFor: targetFor,
    homeAction: homeAction,
    blocksGameInput: blocksGameInput,
    isActive: function (game) { return !!targetFor(game); },
    draw: draw
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
