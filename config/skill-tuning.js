(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};

  /*
   * 角色技能数值配置。
   *
   * 约定：
   * - xxxAtk 表示攻击力倍率，例如 2.5 = 250% ATK。
   * - xxxMaxHp 表示最大生命倍率，例如 0.3 = 30% 最大生命。
   * - duration / cooldown 单位为秒。
   */
  YL.SKILL_TUNING = {
    hongyi: {
      attack: {
        burnDuration: 3,
        burnDpsAtk: 0.15,
        splashRadius: 80,
        splashDamageAtk: 0.40,
        burningSplashRadius: 100,
        burnSpreadTargets: 2,
        burnSpreadDurationRatio: 0.60,
        chainExplosionRadius: 95,
        chainExplosionAtk: 0.70,
        chainExplosionSecondAtk: 0.35,
        chainExplosionMaxGenerations: 2,
        fanAngle: 0.16,
        fanSideDamageAtk: 0.35,
        fanSideDamageUpgradedAtk: 0.45,
        fanSideBurnScale: 0.65,
        fanCurveDelay: 0.18,
        fanSecondWaveDelay: 0.18,
        fanSecondWaveDamageAtk: 0.30
      },
      passive: {
        sigilsRequired: 5,
        lotusDamageAtk: 1.30,
        starLotusDamageAtk: 1.80,
        lotusSplashRadius: 90,
        lotusSplashDamageAtk: 1.30,
        lotusBurningRadiusBonus: 0.15,
        lotusFireDuration: 3,
        lotusFireStarDurationBonus: 0.3,
        lotusFireRadius: 82,
        lotusFireBurnDpsAtk: 0.20,
        lotusPetalForwardScale: 1.15,
        lotusPetalSideScale: 1.05,
        lotusWaveInterval: 1,
        lotusWaveDamageAtk: 0.14,
        lotusWaveLengthScale: 1.55,
        lotusWaveWidthScale: 0.36,
        lotusFusionRadiusScale: 1.35,
        lotusFusionMaxDuration: 5,
        lotusFusionDamageAtk: 0.45,
        lotusPlatformDpsScale: 1.43,
        soulEchoDamageAtk: 0.30
      },
      ultimate: {
        cooldown: 18,
        damageAtk: 1.00,
        burnDuration: 4,
        burnDpsAtk: 0.16,
        burningBonusAtk: 0.45,
        invuln: 0.30,
        effectRadius: 520,
        effectLife: 1.00,
        shake: 9
      }
    },

    qingyi: {
      attack: {
        damageAtk: 0.60,
        hitRadius: 46,
        fallDelay: 0.38,
        fallStartOffset: 180,
        markDuration: 4,
        upgradedMarkDuration: 5.5,
        markDamageBonus: 0.08,
        upgradedMarkDamageBonus: 0.12,
        eliteMarkDamageBonus: 0.04,
        propagateRadius: 210,
        propagateDurationRatio: 0.50,
        residualDuration: 1
      },
      passive: {
        glowRequired: 6,
        upgradedGlowRequired: 5,
        targetGlowCooldown: 0.25,
        synergyDuration: 3,
        upgradedSynergyDuration: 4,
        synergyDamageBonus: 0.10,
        lightBurstAtk: 0.30,
        wallHealThreshold: 0.50,
        wallHealAtk: 0.80,
        overflowShieldRatio: 0.50,
        shieldAttackSpeedBonus: 0.08
      },
      ultimate: {
        cooldown: 13,
        exposeDuration: 5,
        exposeDamageBonus: 0.15,
        synergyDuration: 3.5,
        effectRadius: 620,
        effectLife: 1.05,
        shake: 3
      }
    },

    huangjin: {
      attack: {
        damageAtk: 0.35,
        range: 580,
        halfAngleDegrees: 34,
        comboWaveDelay: 0.18,
        secondWaveDamageAtk: 0.35,
        secondWaveBonusAtk: 0.25,
        thirdWaveDamageAtk: 0.25,
        thirdWaveDelay: 0.36,
        rangeBonus: 70,
        knockbackDistance: 6,
        secondKnockbackDistance: 8,
        heavyEvery: 3,
        heavyEveryUpgraded: 2,
        heavyDamageAtk: 0.70,
        heavyKnockbackDistance: 16,
        heavySlowDuration: 1,
        heavySlowDurationBonus: 0.5,
        heavySlowMultiplier: 0.75,
        heavyExtraHitMinTargets: 3,
        heavyExtraHitDamageAtk: 0.35,
        heavyExtraHitRadius: 118,
        heavyExtraHitDelay: 0.12,
        resonanceDamageAtk: 0.30,
        resonanceSecondDamageAtk: 0.20,
        resonanceRadius: 105,
        resonanceRadiusScale: 1.20,
        resonanceDelay: 0.48,
        resonanceSecondDelay: 0.28
      },
      passive: {
        gatherRadius: 115,
        upgradedGatherRadius: 150,
        gatherPullDistance: 22,
        gatherCooldown: 6,
        gatherSlowDuration: 1,
        gatherSlowMultiplier: 0.90,
        heartDuration: 1,
        heartSuppressBonus: 1
      },
      ultimate: {
        cooldown: 14,
        wallShieldMaxHp: 0.18,
        duration: 5,
        slowDuration: 2.2,
        slowMultiplier: 0.85,
        invuln: 0.15,
        effectRadius: 260,
        shake: 6
      }
    },

    xuanya: {
      attack: {
        executeThreshold: 0.35,
        markThreshold: 0.35,
        upgradedMarkThreshold: 0.45,
        markDuration: 3,
        starMarkDuration: 3.5,
        markDamageBonus: 0.25,
        e07PierceDamageAtk: 0.40,
        e07PierceDamageAtk2: 0.55,
        e07PierceDamageAtk3: 0.70,
        e07PierceDistance: 180,
        e07PierceDistance2: 260,
        e07PierceDistance3: 340,
        bladeHitRadius: 18,
        piercePathWidth: 24,
        returnForwardDistance: 120,
        returnDamageAtk: 0.35,
        returnDamageAtk2: 0.50,
        returnDamageAtk3: 0.65,
        returnPathWidth: 24,
        returnPathWidth3: 32,
        chaseDamageAtk: 0.70,
        starSplashDamageAtk: 0.25,
        soulDamageAtkPerStack: 0.20,
        soulMaxStacks: 3,
        empoweredBladeBaseAtk: 1.40,
        overflowTransferCapAtk: 0.80,
        followupRadius: 260
      },
      passive: {
        haste: 0.20,
        hasteDuration: 3,
        maxHasteStacks: 3
      },
      ultimate: {
        cooldown: 15,
        hits: 3,
        damageAtk: 0.75,
        sideTargetDamageAtk: 0.70,
        sideTargets: 2,
        sideTargetRadius: 260,
        flawDuration: 4,
        flawDamageTaken: 0.18,
        effectRadius: 92,
        shake: 5
      }
    },

    suwen: {
      attack: {
        damageAtk: 0.90,
        fallDelay: 0.32,
        hitRadius: 42,
        stackDuration: 4,
        starStackDuration: 4.5,
        maxStacks: 5,
        starMaxStacks: 6,
        stackDamageBonus: 0.06,
        upgradedStackDamageBonus: 0.08,
        inboneDamageAtk: 0.35,
        smallNeedleDamageAtk: 0.40,
        smallNeedleChance: 0.25,
        smallNeedleChanceUpgraded: 0.40
      },
      passive: {
        focusRequired: 3,
        upgradedFocusRequired: 2,
        focusDamageAtk: 1.50,
        upgradedFocusDamageAtk: 1.80,
        eliteBossBonus: 0.25,
        starEliteBossBonus: 0.35,
        focusRetainDuration: 1.5,
        focusLockDuration: 2,
        forceMinStacks: 3,
        starCarryDuration: 1.5,
        starCarryMinStacks: 3,
        starCarryBonusStacks: 1,
        starSpreadStacks: 1,
        starPerStackBonusAtk: 0.08,
        starFullStackBonusAtk: 0.30
      },
      ultimate: {
        cooldown: 17,
        hits: 5,
        damageAtk: 0.30,
        radius: 135,
        maxTargets: 6,
        breakDuration: 5,
        defenseBreak: 0.20,
        skillDamageTaken: 0.10,
        effectLife: 1.05,
        shake: 5
      }
    },

    nuba: {
      attack: {
        damageAtk: 0.92,
        fieldRadius: 112,
        upgradedFieldRadius: 130,
        fieldDuration: 2.60,
        fallDelay: 0.38,
        pillarDamageAtk: 0.78,
        fieldTickDamageAtk: 0.24,
        fieldTickInterval: 0.82,
        resonanceLineDamageAtk: 0.72,
        resonanceWidth: 28,
        resonanceBurstDamageAtk: 0.46,
        castAnimDuration: 0.34,
        sigilColor: '#d7c38a',
        shadowColor: '#151225'
      },
      passive: {
        maxActiveSigils: 1,
        resonanceDuration: 0.48,
        resonanceBurstRadius: 104,
        starResonanceWidth: 36
      },
      ultimate: {
        cooldown: 19,
        castDuration: 0.92,
        radius: 226,
        centerDamageAtk: 1.80,
        pillarCount: 5,
        pillarDamageAtk: 0.55,
        pillarRadius: 74,
        pillarDelay: 0.16,
        pillarSpacing: 0.16,
        fieldDuration: 4.0,
        fieldRadius: 264,
        laneRadius: 390,
        fieldTickInterval: 0.80,
        fieldTickDamageAtk: 0.42,
        shake: 10
      }
    }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
