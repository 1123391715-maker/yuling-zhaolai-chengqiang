(function (root) {
  'use strict';
  var YL = root.YL = root.YL || {};
  var C = YL.COLORS;

  function uiFontFamily(size) {
    if (YL.uiFontFamily) return YL.uiFontFamily(size);
    return Number(size) >= 22 ? (YL.UI_FONT_TITLE_FAMILY || '"MaShanZheng","Microsoft YaHei","PingFang SC",sans-serif') : (YL.UI_FONT_BODY_FAMILY || '"Microsoft YaHei","PingFang SC",sans-serif');
  }

  function pathRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function rr(ctx, x, y, w, h, r, fill, stroke, line) {
    pathRoundRect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = line || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function text(ctx, value, x, y, size, color, align, weight) {
    ctx.save();
    ctx.font = (weight || '700') + ' ' + size + 'px ' + uiFontFamily(size);
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || C.white;
    ctx.shadowColor = 'rgba(0,0,0,.75)';
    ctx.shadowBlur = size > 32 ? 7 : 3;
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function panel(ctx, x, y, w, h, alpha) {
    ctx.save();
    rr(ctx, x, y, w, h, 18, 'rgba(10,18,25,' + (alpha == null ? 0.9 : alpha) + ')', C.gold2, 3);
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 1;
    pathRoundRect(ctx, x + 7, y + 7, w - 14, h - 14, 13);
    ctx.stroke();
    ctx.restore();
  }

  function button(ctx, x, y, w, h, label, active, accent) {
    ctx.save();
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, active ? (accent || '#cc6d32') : '#42505a');
    grad.addColorStop(1, active ? '#73321f' : '#26323a');
    rr(ctx, x, y, w, h, 18, grad, active ? C.gold : '#687179', 4);
    rr(ctx, x + 7, y + 7, w - 14, h - 14, 13, null, 'rgba(255,239,187,.35)', 2);
    text(ctx, label, x + w / 2, y + h / 2 + 1, 28, active ? C.white : '#aeb6b4');
    ctx.restore();
  }

  function bar(ctx, x, y, w, h, value, max, fill, bg, label) {
    var p = Math.max(0, Math.min(1, max ? value / max : 0));
    rr(ctx, x, y, w, h, h / 2, bg || 'rgba(0,0,0,.58)', 'rgba(240,213,153,.4)', 2);
    if (p > 0) {
      var g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, fill);
      g.addColorStop(1, fill === C.red ? C.fire : '#8ff6d6');
      rr(ctx, x + 3, y + 3, Math.max(3, (w - 6) * p), h - 6, (h - 6) / 2, g);
    }
    if (label) text(ctx, label, x + w / 2, y + h / 2, Math.min(22, h - 5), C.white);
  }

  function clipCircle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
  }

  function atlasCell(ctx, img, cols, rows, index, x, y, w, h, circle) {
    if (!img || !img.complete && !img.width) return;
    var sw = img.width / cols;
    var sh = img.height / rows;
    var col = index % cols;
    var row = Math.floor(index / cols);
    ctx.save();
    if (circle) clipCircle(ctx, x + w / 2, y + h / 2, Math.min(w, h) / 2);
    ctx.drawImage(img, col * sw + 4, row * sh + 4, sw - 8, sh - 8, x, y, w, h);
    ctx.restore();
  }

  function icon(ctx, img, index, x, y, size, cooldown) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1723'; ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
    atlasCell(ctx, img, 4, 3, index, x - size / 2, y - size / 2, size, size, true);
    if (cooldown > 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, size / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, cooldown));
      ctx.closePath();
      ctx.fillStyle = 'rgba(3,8,13,.72)'; ctx.fill();
    }
    ctx.restore();
  }

  function skillCooldown(ctx, hero, x, y, time) {
    var radius = 9;
    var colorMap = {
      hongyi: C.fire, qingyi: C.blue, huangjin: C.gold,
      xuanya: '#e7dcc4', suwen: C.jade
    };
    var color = colorMap[hero.type] || C.gold;
    var maxCd = Math.max(.01, hero.ultimateMax || 1);
    var remaining = Math.max(0, hero.ultimateCd || 0);
    var progress = Math.max(0, Math.min(1, 1 - remaining / maxCd));
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#12171b'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4e5659'; ctx.fill();
    if (progress > 0) {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    }
    if (remaining <= 2 && remaining > 0) {
      var urgency = 1 - remaining / 2;
      var pulse = .5 + .5 * Math.sin(time * (12 + urgency * 22));
      ctx.shadowColor = color; ctx.shadowBlur = 5 + pulse * 10;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5 + pulse * 1.5;
    } else {
      ctx.strokeStyle = progress >= 1 ? '#fff4c8' : '#9b9f9c';
      ctx.lineWidth = 1.5;
    }
    ctx.beginPath(); ctx.arc(x, y, radius + 1, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = progress > .5 ? '#fff8df' : '#d2d4cf';
    ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.5;
    if (hero.type === 'hongyi') {
      ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.quadraticCurveTo(x - 5, y, x, y - 6); ctx.quadraticCurveTo(x + 5, y, x, y + 5); ctx.fill();
    } else if (hero.type === 'qingyi') {
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
      ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
    } else if (hero.type === 'xuanya') {
      ctx.beginPath(); ctx.moveTo(x - 5, y + 5); ctx.lineTo(x + 5, y - 5); ctx.moveTo(x - 1, y + 4); ctx.lineTo(x + 4, y - 1); ctx.stroke();
    } else if (hero.type === 'huangjin') {
      ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 5, y - 3); ctx.lineTo(x + 4, y + 3); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4, y + 3); ctx.lineTo(x - 5, y - 3); ctx.closePath(); ctx.stroke();
    } else {
      ctx.fillRect(x - 1, y - 5, 2, 10); ctx.fillRect(x - 5, y - 1, 10, 2);
    }
    if (hero.skillReadyFlash > 0) {
      ctx.globalAlpha = Math.min(1, hero.skillReadyFlash / .15);
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function portrait(ctx, img, index, x, y, size) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, size / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = C.ink2; ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
    atlasCell(ctx, img, 3, 2, index, x - size / 2, y - size / 2, size, size, true);
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, alpha) {
    ctx.save();
    ctx.scale(1, 0.32);
    ctx.beginPath(); ctx.arc(x, y / 0.32, rx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + (alpha || 0.35) + ')'; ctx.fill();
    ctx.restore();
  }

  function atlasSprite(ctx, img, index, x, y, w, h, alpha) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var sw = iw / 3, sh = ih / 2, col = index % 3, row = Math.floor(index / 3);
    var inset = 8;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(img, col * sw + inset, row * sh + inset, sw - inset * 2, sh - inset * 2, x, y, w, h);
    ctx.restore();
    return true;
  }

  function spriteImage(ctx, img, centerX, baseY, maxW, maxH, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var scale = Math.min(maxW / iw, maxH / ih), w = iw * scale, h = ih * scale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'source-over';
    ctx.drawImage(img, centerX - w / 2, baseY - h, w, h);
    ctx.restore();
    return true;
  }

  function attackFrame(ctx, img, frame, centerX, baseY, maxW, maxH, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var sw = iw / 4, inset = 3;
    var scale = Math.min(maxW / (sw - inset * 2), maxH / (ih - inset * 2));
    var w = (sw - inset * 2) * scale, h = (ih - inset * 2) * scale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'screen';
    ctx.drawImage(
      img, frame * sw + inset, inset, sw - inset * 2, ih - inset * 2,
      centerX - w / 2, baseY - h, w, h
    );
    ctx.restore();
    return true;
  }

  function actionFrame(ctx, img, frame, cols, rows, centerX, baseY, maxW, maxH, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var sw = iw / cols, sh = ih / rows, col = frame % cols, row = Math.floor(frame / cols), inset = 4;
    var scale = Math.min(maxW / Math.max(1, sw - inset * 2), maxH / Math.max(1, sh - inset * 2));
    var w = (sw - inset * 2) * scale, h = (sh - inset * 2) * scale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'source-over';
    ctx.drawImage(img, col * sw + inset, row * sh + inset, sw - inset * 2, sh - inset * 2, centerX - w / 2, baseY - h, w, h);
    ctx.restore();
    return true;
  }

  function skeletonPart(ctx, img, centerX, baseY, maxW, maxH, pivotX, pivotY, pose, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    pose = pose || {};
    var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    var baseScale = Math.min(maxW / iw, maxH / ih);
    var drawW = iw * baseScale, drawH = ih * baseScale;
    var left = centerX - drawW / 2, top = baseY - drawH;
    var px = left + pivotX * baseScale, py = top + pivotY * baseScale;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'source-over';
    ctx.translate(px + (pose.x || 0), py + (pose.y || 0));
    ctx.rotate(pose.r || 0);
    ctx.scale(pose.sx == null ? 1 : pose.sx, pose.sy == null ? 1 : pose.sy);
    ctx.drawImage(img, left - px, top - py, drawW, drawH);
    ctx.restore();
    return true;
  }

  function rigPart(ctx, img, x, y, w, h, pivotX, pivotY, pose, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    pose = pose || {};
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'source-over';
    ctx.translate(x + (pose.x || 0), y + (pose.y || 0));
    ctx.rotate(pose.r || 0);
    ctx.scale(pose.sx == null ? 1 : pose.sx, pose.sy == null ? 1 : pose.sy);
    ctx.drawImage(img, -w * pivotX, -h * pivotY, w, h);
    ctx.restore();
    return true;
  }

  function rigImageReady(img) {
    return img && (img.width || img.naturalWidth);
  }

  function safeRigBounds(img) {
    if (!img || !(img.width || img.naturalWidth)) return { x: 0, y: 0, w: 1, h: 1 };
    return { x: 0, y: 0, w: img.width || img.naturalWidth, h: img.height || img.naturalHeight };
  }

  function safeRigSprite(ctx, img, rect, cx, baseY, drawH, pivotX, pivotY, pose, alpha, blend) {
    if (!img || !(img.width || img.naturalWidth)) return false;
    pose = pose || {};
    var drawW = drawH * rect.w / rect.h;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.globalCompositeOperation = blend || 'source-over';
    ctx.translate(cx + (pose.x || 0), baseY + (pose.y || 0));
    ctx.rotate(pose.r || 0);
    ctx.scale(pose.sx == null ? 1 : pose.sx, pose.sy == null ? 1 : pose.sy);
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, -drawW * pivotX, -drawH * pivotY, drawW, drawH);
    ctx.restore();
    return true;
  }

  function huangjinSafeRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, alpha, blend) {
    var body = sprites.heroHuangjinSafeBody, shield = sprites.heroHuangjinSafeShield;
    if (!rigImageReady(body) || !rigImageReady(shield)) return false;
    var idle = Math.sin(time * 2.35 + (h.id || 0));
    var walk = h.walking ? Math.sin(time * 9.2 + (h.id || 0)) : 0;
    var walkAbs = Math.abs(walk);
    var windup = shieldWindup || 0;
    var hit = shieldHit || 0;
    var hitLock = h.hitHold > 0 ? clamp01(h.hitHold / .06) : 0;
    var recoil = hurt ? Math.sin((1 - hurt) * Math.PI) : 0;
    var recovery = h.attackAnim > 0 ? clamp01(1 - h.attackAnim / Math.max(.01, h.attackRecoveryDuration || .35)) : 0;
    var settle = h.attackAnim > 0 ? Math.sin(recovery * Math.PI) : 0;
    var tremor = hitLock > 0 ? Math.sin(time * 92) * hitLock : 0;
    var bodyDx = walk * 2.5 + windup * 12 - hit * 22 + recoil * 12 + settle * 6 + tremor * 1.1;
    var bodyDy = idle * 1.2 + walkAbs * 4 + windup * 4 - hit * 5 + recoil * 5 + settle * 2;
    var bodyRot = walk * .012 + windup * .07 - hit * .09 + recoil * .10 + settle * .018;
    var bodySx = 1 + windup * .012 + hit * .030 - settle * .008 + idle * .002;
    var bodySy = 1 - windup * .010 - hit * .026 + walkAbs * .010 + settle * .005 - idle * .002;
    var shieldDx = -44 + windup * 30 - hit * 58 + recoil * 13 + settle * 9 - tremor * 1.6;
    var shieldDy = -82 + idle * .6 - windup * 12 - hit * 5 + walkAbs * 1.2 + settle * 2;
    var shieldRot = walk * .008 + windup * .34 - hit * .24 - recoil * .14 + settle * .05;
    var shadowScale = 1 + walkAbs * .05 + hit * .22 + windup * .05;
    if (!blend) {
      shadow(ctx, bodyDx, 38, 49 * shadowScale, .44);
      if (walkAbs > .08 || hit > .05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(219,168,76,' + (.08 + hit * .10 + walkAbs * .04) + ')';
        for (var d = 0; d < 5; d++) {
          var dustX = bodyDx + (d - 2) * 13;
          ctx.beginPath();
          ctx.ellipse(dustX, 42 + Math.sin(d * 1.7) * 2, 7 + hit * 8, 2.4 + hit * 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    var bodyRect = safeRigBounds(body);
    var shieldRect = safeRigBounds(shield);
    if (hit > .25 && !blend) {
      safeRigSprite(ctx, body, bodyRect, 0, 40, 160, .5, 1, {
        x: bodyDx + 16, y: bodyDy + 4, r: bodyRot + .04, sx: bodySx, sy: bodySy
      }, .20 * hit, 'lighter');
    }
    safeRigSprite(ctx, body, bodyRect, 0, 40, 160, .5, 1, {
      x: bodyDx, y: bodyDy, r: bodyRot, sx: bodySx, sy: bodySy
    }, alpha, blend);
    safeRigSprite(ctx, shield, shieldRect, 0, 40, 100, .55, .50, {
      x: shieldDx, y: shieldDy, r: shieldRot, sx: 1 + hit * .045, sy: 1 - hit * .030
    }, alpha, blend);
    return true;
  }

  function huangjinRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, alpha, blend) {
    var base = sprites.heroHuangjinRigBase;
    var head = sprites.heroHuangjinRigHead, body = sprites.heroHuangjinRigBody, shield = sprites.heroHuangjinRigShield;
    var leftUpper = sprites.heroHuangjinRigLeftUpperArm, leftForearm = sprites.heroHuangjinRigLeftForearm, rightArm = sprites.heroHuangjinRigRightArm;
    var leftLeg = sprites.heroHuangjinRigLeftLeg, rightLeg = sprites.heroHuangjinRigRightLeg, cape = sprites.heroHuangjinRigCape;
    if (!rigImageReady(head) || !rigImageReady(body) || !rigImageReady(shield) || !rigImageReady(leftLeg) || !rigImageReady(rightLeg)) return false;
    var facing = h.attackFacing || 1;
    var idle = Math.sin(time * 2.1 + (h.id || 0));
    var walk = h.walking ? Math.sin(time * 9.2 + (h.id || 0)) : 0;
    var walkAbs = Math.abs(walk);
    var hurtKick = hurt ? Math.sin((1 - hurt) * Math.PI) : 0;
    var brace = shieldWindup || 0;
    var slam = shieldHit || 0;
    var bodyLean = -facing * brace * .018 + facing * slam * .025 - facing * hurtKick * .07;
    var bodyX = -facing * brace * 2 + facing * slam * 4 - facing * hurtKick * 7;
    var bodyY = idle * .6 + walkAbs * 1.4 + brace * 1.2 + hurtKick * 4;
    var shieldX = -39 - facing * brace * 20 + facing * slam * 48 - facing * hurtKick * 12;
    var shieldY = -23 - brace * 13 - slam * 2 + walkAbs * 1;
    var shieldR = -facing * brace * .26 + facing * slam * .20 + facing * walk * .01 + facing * hurtKick * .14;
    var headX = facing * slam * 3 - facing * brace * 2 - facing * hurtKick * 5;
    var headY = -64 + idle * .8 + hurtKick * 3 - slam * 1;
    var legLiftL = Math.max(0, walk) * 3;
    var legLiftR = Math.max(0, -walk) * 3;
    var legSpread = h.walking ? 3.5 : 0;

    if (rigImageReady(base)) {
      var stableX = -facing * brace * 1.5 + facing * slam * 3.5 - facing * hurtKick * 7;
      var stableY = idle * .55 + walkAbs * 1.1 + brace * 1 + hurtKick * 4;
      var stableR = -facing * brace * .015 + facing * slam * .022 - facing * hurtKick * .06;
      var stableSx = 1 + slam * .006;
      var stableSy = 1 - slam * .006 + walkAbs * .004;
      var stableShieldX = -39 - facing * brace * 14 + facing * slam * 36 - facing * hurtKick * 11;
      var stableShieldY = -20 - brace * 9 - slam * 2 + walkAbs * .7;
      var stableShieldR = -facing * brace * .20 + facing * slam * .16 + facing * walk * .008 + facing * hurtKick * .12;
      if (!blend) {
        var stableGlow = Math.max(brace * .45, slam, hurtKick * .30);
        if (stableGlow > .01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.min(.72, .10 + stableGlow * .50);
          ctx.shadowColor = color || C.gold; ctx.shadowBlur = 14 + stableGlow * 18;
          var stableAura = ctx.createRadialGradient(stableShieldX, stableShieldY, 6, stableShieldX, stableShieldY, 68 + stableGlow * 28);
          stableAura.addColorStop(0, 'rgba(255,242,177,.68)');
          stableAura.addColorStop(.46, 'rgba(255,178,54,.26)');
          stableAura.addColorStop(1, 'rgba(255,178,54,0)');
          ctx.fillStyle = stableAura;
          ctx.beginPath(); ctx.ellipse(stableShieldX, stableShieldY + 4, 48 + stableGlow * 18, 70 + stableGlow * 12, -.12 + stableShieldR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      }
      rigPart(ctx, base, stableX, 40 + stableY, 126, 126, .50, .88, {
        r: stableR,
        sx: stableSx,
        sy: stableSy
      }, alpha, blend);
      rigPart(ctx, shield, stableShieldX + stableX * .10, stableShieldY + stableY, 50, 92, .58, .52, {
        r: stableShieldR,
        sx: 1 + slam * .035,
        sy: 1 - slam * .028
      }, alpha, blend);
      return true;
    }

    if (!blend) {
      var glow = Math.max(brace * .55, slam, hurtKick * .35);
      if (glow > .01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(.78, .12 + glow * .55);
        ctx.shadowColor = color || C.gold; ctx.shadowBlur = 16 + glow * 22;
        var aura = ctx.createRadialGradient(shieldX, shieldY, 6, shieldX, shieldY, 74 + glow * 38);
        aura.addColorStop(0, 'rgba(255,242,177,.72)');
        aura.addColorStop(.46, 'rgba(255,178,54,.28)');
        aura.addColorStop(1, 'rgba(255,178,54,0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.ellipse(shieldX, shieldY + 4, 54 + glow * 22, 76 + glow * 14, -.12 + shieldR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    if (rigImageReady(cape)) {
      rigPart(ctx, cape, 26 + bodyX - facing * brace * 4, -9 + bodyY, 82, 86, .32, .18, {
        r: .05 * idle - facing * brace * .05 + facing * slam * .04,
        sx: 1,
        sy: 1 + walkAbs * .015
      }, alpha, blend);
    }
    rigPart(ctx, leftLeg, -18 - legSpread * walk + bodyX * .25, 15 + bodyY - legLiftL, 38, 59, .52, .08, {
      r: walk * .12 - facing * brace * .018 + facing * slam * .025,
      sx: 1,
      sy: 1 - legLiftL * .004
    }, alpha, blend);
    rigPart(ctx, rightLeg, 17 + legSpread * walk + bodyX * .25, 15 + bodyY - legLiftR, 37, 61, .50, .08, {
      r: -walk * .11 - facing * brace * .015 + facing * slam * .022,
      sx: 1,
      sy: 1 - legLiftR * .004
    }, alpha, blend);
    if (rigImageReady(rightArm)) {
      rigPart(ctx, rightArm, 29 + bodyX + facing * slam * 2, -31 + bodyY, 58, 56, .26, .36, {
        r: .04 + facing * brace * .035 - facing * slam * .06 - facing * hurtKick * .07,
        sx: 1,
        sy: 1
      }, alpha, blend);
    }
    rigPart(ctx, body, bodyX, -18 + bodyY, 116, 122, .50, .28, {
      r: bodyLean,
      sx: 1 + slam * .006,
      sy: 1 - slam * .006 + walkAbs * .006
    }, alpha, blend);
    if (rigImageReady(leftUpper)) {
      rigPart(ctx, leftUpper, -42 + bodyX - facing * brace * 11 + facing * slam * 15, -27 + bodyY - brace * 3, 58, 53, .56, .42, {
        r: -facing * brace * .22 + facing * slam * .14 + facing * hurtKick * .08,
        sx: 1,
        sy: 1
      }, alpha, blend);
    }
    if (rigImageReady(leftForearm)) {
      rigPart(ctx, leftForearm, -39 + bodyX - facing * brace * 14 + facing * slam * 26, -20 + bodyY - brace * 4, 45, 38, .55, .47, {
        r: -facing * brace * .26 + facing * slam * .17,
        sx: .78,
        sy: .78
      }, alpha == null ? .55 : alpha * .55, blend);
    }
    rigPart(ctx, head, headX + bodyX * .15, headY + bodyY, 70, 63, .50, .82, {
      r: -facing * brace * .028 + facing * slam * .038 - facing * hurtKick * .09 + idle * .006,
      sx: 1,
      sy: 1
    }, alpha, blend);
    rigPart(ctx, shield, shieldX + bodyX * .12, shieldY + bodyY, 52, 96, .58, .52, {
      r: shieldR,
      sx: 1 + slam * .045,
      sy: 1 - slam * .035
    }, alpha, blend);
    return true;
  }

  function huangjinSkeleton(ctx, h, time, sprites, color, maxW, maxH, shieldWindup, shieldHit, hurt, alpha, blend) {
    var body = sprites.heroHuangjinBody, head = sprites.heroHuangjinHead, shield = sprites.heroHuangjinShield;
    if (!body || !head || !shield || !(body.width || body.naturalWidth) || !(head.width || head.naturalWidth) || !(shield.width || shield.naturalWidth)) return false;
    var facing = h.attackFacing || 1;
    var idle = Math.sin(time * 2.6 + (h.id || 0)) * .5;
    var walk = h.walking ? Math.sin(time * 10 + (h.id || 0)) : 0;
    var hurtKick = hurt ? Math.sin((1 - hurt) * Math.PI) : 0;
    var bodyPose = {
      x: -facing * shieldWindup * 2 + facing * shieldHit * 5 - facing * hurtKick * 8,
      y: idle * .8 + Math.abs(walk) * 2 + shieldWindup * 1 - shieldHit * 1 + hurtKick * 5,
      r: -facing * shieldWindup * .015 + facing * shieldHit * .025 - facing * hurtKick * .07,
      sx: 1 + shieldHit * .006,
      sy: 1 - shieldHit * .008 + Math.abs(walk) * .006
    };
    var headPose = {
      x: facing * shieldHit * 3 - facing * shieldWindup * 2 - facing * hurtKick * 5,
      y: idle * .9 - shieldHit * 1 + hurtKick * 4,
      r: -facing * shieldWindup * .025 + facing * shieldHit * .04 - facing * hurtKick * .10 + idle * .008,
      sx: 1,
      sy: 1
    };
    var shieldPose = {
      x: -facing * shieldWindup * 30 + facing * shieldHit * 52 - facing * hurtKick * 12,
      y: -shieldWindup * 16 - shieldHit * 2 + Math.abs(walk) * 1,
      r: -facing * shieldWindup * .34 + facing * shieldHit * .24 + facing * walk * .012 + facing * hurtKick * .16,
      sx: 1 + shieldHit * .045,
      sy: 1 - shieldHit * .035
    };
    var glow = Math.max(shieldWindup * .78, shieldHit, hurtKick * .55);
    if (glow > .01 && !blend) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(.82, .16 + glow * .58);
      ctx.shadowColor = color || C.gold; ctx.shadowBlur = 18 + glow * 18;
      var aura = ctx.createRadialGradient(-45 + shieldPose.x, -34 + shieldPose.y, 7, -45 + shieldPose.x, -34 + shieldPose.y, 72 + glow * 34);
      aura.addColorStop(0, 'rgba(255,244,184,.76)');
      aura.addColorStop(.42, 'rgba(255,184,66,.34)');
      aura.addColorStop(1, 'rgba(255,184,66,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.ellipse(-45 + shieldPose.x, -28 + shieldPose.y, 50 + glow * 24, 72 + glow * 16, -.16 + shieldPose.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    skeletonPart(ctx, body, 0, 40, maxW, maxH, 318, 520, bodyPose, alpha, blend);
    skeletonPart(ctx, shield, 0, 40, maxW, maxH, 118, 390, shieldPose, alpha, blend);
    skeletonPart(ctx, head, 0, 40, maxW, maxH, 312, 145, headPose, alpha, blend);
    return true;
  }

  function hero(ctx, h, time, sprites) {
    var spriteMap = {
      hongyi: sprites.heroHongyi,
      qingyi: sprites.heroQingyi,
      huangjin: sprites.heroHuangjin,
      xuanya: sprites.heroXuanya,
      suwen: sprites.heroSuwen,
      nuba: sprites.heroNuba
    };
    var attackMap = {
      hongyi: sprites.heroAttackHongyi,
      qingyi: sprites.heroAttackQingyi,
      huangjin: sprites.heroAttackHuangjinBash,
      xuanya: sprites.heroAttackXuanya,
      suwen: sprites.heroAttackSuwen
    };
    var colorMap = {
      hongyi: C.fire,
      qingyi: C.blue,
      huangjin: C.gold,
      xuanya: '#d9c7a6',
      suwen: C.jade,
      nuba: '#c7ad7e'
    };
    var sprite = spriteMap[h.type] || sprites.heroHongyi;
    var attackSprite = attackMap[h.type];
    var castSprite = sprites.heroCastNuba;
    var color = colorMap[h.type] || C.paper;
    var useNubaCast = h.type === 'nuba' && (h.nubaCastTime || 0) > 0 && rigImageReady(castSprite);
    var nubaCastProgress = useNubaCast ? clamp01(1 - h.nubaCastTime / Math.max(.01, h.nubaCastDuration || .92)) : 0;
    var nubaCastFrame = useNubaCast ? Math.min(5, Math.floor(nubaCastProgress * 6)) : 0;
    var attacking = h.attackWindup > 0 || h.attackAnim > 0;
    var progress = 0;
    if (h.attackWindup > 0) {
      progress = .5 * (1 - h.attackWindup / Math.max(.01, h.attackWindupDuration || .2));
    } else if (h.attackAnim > 0) {
      progress = .5 + .5 * (1 - h.attackAnim / Math.max(.01, h.attackRecoveryDuration || .34));
    }
    progress = clamp01(progress);
    var attackFrameIndex = Math.min(3, Math.floor(progress * 4));
    var strike = attacking ? Math.sin(progress * Math.PI) : 0;
    var ranged = h.attackType === 'ranged';
    var facing = h.attackFacing || 1;
    var windupProgress = h.attackWindup > 0 ? clamp01(1 - h.attackWindup / Math.max(.01, h.attackWindupDuration || .2)) : 0;
    var shieldWindup = h.type === 'huangjin' && h.attackWindup > 0 ? 1 - Math.pow(1 - windupProgress, 2) : 0;
    var hitHoldPeak = h.hitHold > 0 ? 1 : 0;
    var recoveryLeft = h.attackAnim > 0 ? clamp01(h.attackAnim / Math.max(.01, h.attackRecoveryDuration || .34)) : 0;
    var shieldHit = h.type === 'huangjin' && h.attackAnim > 0 ? Math.max(hitHoldPeak, Math.pow(recoveryLeft, 1.75)) : 0;
    var hurt = h.hitReact > 0 ? clamp01(h.hitReact / .18) : 0;
    var hasHuangjinSafeRig = h.type === 'huangjin'
      && rigImageReady(sprites.heroHuangjinSafeBody)
      && rigImageReady(sprites.heroHuangjinSafeShield);
    var hasHuangjinRig = false;
    var hasHuangjinSkeleton = false;
    var useHuangjinAttackSheet = h.type === 'huangjin' && attacking && rigImageReady(attackSprite);
    var useHongyiAttackSheet = h.type === 'hongyi' && attacking && rigImageReady(attackSprite);
    var useXuanyaAttackSheet = h.type === 'xuanya' && attacking && rigImageReady(attackSprite);
    var useQingyiAttackSheet = h.type === 'qingyi' && attacking && rigImageReady(attackSprite);
    var useSuwenAttackSheet = h.type === 'suwen' && attacking && rigImageReady(attackSprite);
    var useHongyiFloatStep = h.type === 'hongyi' && !attacking && h.walking;
    var useSupportFloatStep = (h.type === 'qingyi' || h.type === 'suwen') && !attacking && h.walking;
    var useSoftFloatStep = useHongyiFloatStep || useSupportFloatStep;
    var bob = Math.sin(time * 3 + (h.id || h.slot || 0)) * 3;
    var walk = h.walking ? Math.sin(time * 9.2 + (h.id || h.slot || 0)) : 0;
    var visualWalk = useSoftFloatStep ? 0 : walk;
    var walkAbs = Math.abs(visualWalk);
    var softHover = useSoftFloatStep ? Math.sin(time * (useHongyiFloatStep ? 5.2 : 4.6) + (h.id || h.slot || 0)) * (useHongyiFloatStep ? 2.4 : 1.7) : 0;
    var x = h.x + (ranged ? 0 : facing * strike * 13) - facing * shieldWindup * 16 + facing * shieldHit * 18 + visualWalk * 3.5;
    var y = h.y + (useSoftFloatStep ? bob * .22 - (useHongyiFloatStep ? 3 : 2) + softHover : bob) - strike * (ranged ? 7 : 17) + shieldWindup * 5 - shieldHit * 4 + walkAbs * 2.8;
    if (hasHuangjinSafeRig) {
      x = h.x;
      y = h.y + bob * .45;
    } else if (hasHuangjinRig || hasHuangjinSkeleton) {
      x = h.x + facing * (-shieldWindup * 10 + shieldHit * 28 + strike * 3);
      y = h.y + bob * .45 + shieldWindup * 2 - shieldHit * 2;
    }
    var baseScale = h.scale || 1;
    var skillPop = 0;
    if (h.skillCastFlash > 0) {
      var skillProgress = 1 - h.skillCastFlash / .15;
      skillPop = Math.sin(Math.max(0, Math.min(1, skillProgress)) * Math.PI) * .10;
    }
    ctx.save();
    ctx.translate(x, y);
    if (hasHuangjinSafeRig) {
      ctx.scale(baseScale * (1 + skillPop), baseScale * (1 + skillPop));
    } else if (hasHuangjinRig || hasHuangjinSkeleton) {
      ctx.rotate(-facing * shieldWindup * .025 + facing * shieldHit * .035);
      ctx.scale(
        baseScale * (1 + skillPop) * (1 + shieldHit * .018),
        baseScale * (1 + skillPop) * (1 - shieldHit * .012)
      );
    } else if (useQingyiAttackSheet || useSuwenAttackSheet) {
      ctx.rotate(-facing * .018 * strike + visualWalk * .01);
      ctx.scale(
        baseScale * (1 + skillPop) * (1 + strike * .006 + walkAbs * .006),
        baseScale * (1 + skillPop) * (1 - strike * .004 - walkAbs * .004)
      );
    } else {
      ctx.rotate((ranged ? -facing * .055 : facing * .09) * strike - facing * shieldWindup * .10 + facing * shieldHit * .12 + visualWalk * .026);
      ctx.scale(
        baseScale * (1 + skillPop) * (1 + strike * (ranged ? .035 : .09) + shieldWindup * .025 + shieldHit * .045 + walkAbs * .018),
        baseScale * (1 + skillPop) * (1 - strike * .06 - shieldWindup * .025 - shieldHit * .055 - walkAbs * .012)
      );
    }
    if (!hasHuangjinSafeRig) shadow(ctx, 0, 45, 49, .48);
    if (useHongyiFloatStep) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var emberI = 0; emberI < 7; emberI++) {
        var emberP = (time * 1.35 + emberI * .19) % 1;
        var emberX = -facing * (18 + emberP * 48) + Math.sin(time * 4 + emberI) * 5;
        var emberY = 25 - emberP * 46 + Math.cos(time * 3.5 + emberI * .7) * 4;
        var emberR = 2.2 + (1 - emberP) * 3.2;
        ctx.globalAlpha = (1 - emberP) * .34;
        ctx.shadowColor = '#ff8a36';
        ctx.shadowBlur = 12;
        var emberGrad = ctx.createRadialGradient(emberX, emberY, 0, emberX, emberY, emberR * 2.4);
        emberGrad.addColorStop(0, 'rgba(255,232,142,.95)');
        emberGrad.addColorStop(.45, 'rgba(255,112,38,.45)');
        emberGrad.addColorStop(1, 'rgba(255,112,38,0)');
        ctx.fillStyle = emberGrad;
        ctx.beginPath(); ctx.arc(emberX, emberY, emberR * 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = .20 + Math.sin(time * 5.2) * .04;
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(255,118,44,.18)';
      ctx.beginPath(); ctx.ellipse(-facing * 18, 36, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (useSupportFloatStep) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var moteColor = h.type === 'qingyi' ? '96,222,255' : '146,232,186';
      for (var moteI = 0; moteI < 5; moteI++) {
        var moteP = (time * .82 + moteI * .23) % 1;
        var moteX = -facing * (12 + moteP * 28) + Math.sin(time * 3 + moteI) * 4;
        var moteY = 28 - moteP * 34 + Math.cos(time * 2.8 + moteI) * 3;
        ctx.globalAlpha = (1 - moteP) * .18;
        ctx.shadowColor = 'rgba(' + moteColor + ',.9)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(' + moteColor + ',.40)';
        ctx.beginPath(); ctx.arc(moteX, moteY, 2.4 + (1 - moteP) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = .10 + Math.sin(time * 4.6) * .02;
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(' + moteColor + ',.14)';
      ctx.beginPath(); ctx.ellipse(-facing * 10, 36, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (h.type === 'huangjin' && attacking && !hasHuangjinSkeleton && !hasHuangjinSafeRig) {
      var shieldGlow = Math.max(shieldWindup * .85, shieldHit);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .18 + shieldGlow * .62;
      ctx.shadowColor = C.gold; ctx.shadowBlur = 22 + shieldGlow * 18;
      var shieldAura = ctx.createRadialGradient(-47, -32, 8, -47, -32, 72 + shieldGlow * 18);
      shieldAura.addColorStop(0, 'rgba(255,244,184,.72)');
      shieldAura.addColorStop(.42, 'rgba(255,184,66,.36)');
      shieldAura.addColorStop(1, 'rgba(255,184,66,0)');
      ctx.fillStyle = shieldAura;
      ctx.beginPath(); ctx.ellipse(-47, -28, 48 + shieldGlow * 12, 70 + shieldGlow * 10, -.16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (strike > 0 && !ranged && h.type !== 'huangjin' && !useXuanyaAttackSheet) {
      ctx.strokeStyle = color; ctx.globalAlpha = .75 * strike; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(0, -26, 67 + strike * 15, facing > 0 ? Math.PI * 1.05 : Math.PI * -.05, facing > 0 ? Math.PI * 1.9 : Math.PI * .8); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (strike > 0 && ranged && !useHongyiAttackSheet && !useQingyiAttackSheet && !useSuwenAttackSheet) {
      ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(facing * 38, -48 - strike * 7, 7 + strike * 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff2c8'; ctx.lineWidth = 2; ctx.globalAlpha = .8;
      ctx.beginPath(); ctx.arc(facing * 38, -48 - strike * 7, 13 + strike * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    var spriteMaxW = h.type === 'huangjin' ? 168 : 150;
    var spriteMaxH = h.type === 'huangjin' ? 162 : 168;
    var drewSkeleton = false;
    if (useNubaCast) {
      shadow(ctx, 0, 45, 51, .48);
      actionFrame(ctx, castSprite, nubaCastFrame, 2, 3, 0, 44, 182, 198, .99, 'source-over');
      drewSkeleton = true;
    } else if (useHuangjinAttackSheet) {
      shadow(ctx, 0, 45, 49, .46);
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 154, 166, .99, 'source-over');
      drewSkeleton = true;
    } else if (useHongyiAttackSheet) {
      shadow(ctx, 0, 45, 49, .44);
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 166, 196, .99, 'source-over');
      drewSkeleton = true;
    } else if (useXuanyaAttackSheet) {
      shadow(ctx, 0, 45, 50, .46);
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 154, 176, .99, 'source-over');
      drewSkeleton = true;
    } else if (useQingyiAttackSheet) {
      shadow(ctx, 0, 45, 48, .42);
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 160, 182, .99, 'source-over');
      drewSkeleton = true;
    } else if (useSuwenAttackSheet) {
      shadow(ctx, 0, 45, 48, .42);
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 158, 180, .99, 'source-over');
      drewSkeleton = true;
    } else if (hasHuangjinSafeRig) {
      drewSkeleton = huangjinSafeRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, .99);
    } else if (hasHuangjinRig) {
      drewSkeleton = huangjinRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, .99);
    } else if (hasHuangjinSkeleton) {
      drewSkeleton = huangjinSkeleton(ctx, h, time, sprites, color, spriteMaxW, spriteMaxH, shieldWindup, shieldHit, hurt, .99);
    }
    if (!drewSkeleton) {
      spriteImage(ctx, sprite, 0, 40, spriteMaxW, spriteMaxH, .99);
      if (attacking && attackSprite) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 166, 196, .78);
    } else if (attacking && attackSprite && !useHuangjinAttackSheet && !useHongyiAttackSheet && !useXuanyaAttackSheet && !useQingyiAttackSheet && !useSuwenAttackSheet) {
      attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, h.type === 'huangjin' ? 164 : 166, h.type === 'huangjin' ? 172 : 196, h.type === 'huangjin' ? .92 : .78, 'screen');
    }
    if (h.flash > 0) {
      if (drewSkeleton) {
        if (useNubaCast) actionFrame(ctx, castSprite, nubaCastFrame, 2, 3, 0, 44, 182, 198, Math.min(.42, h.flash * 2.6), 'lighter');
        else if (useHuangjinAttackSheet) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 154, 166, Math.min(.42, h.flash * 2.6), 'lighter');
        else if (useHongyiAttackSheet) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 166, 196, Math.min(.36, h.flash * 2.2), 'lighter');
        else if (useXuanyaAttackSheet) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 154, 176, Math.min(.34, h.flash * 2.1), 'lighter');
        else if (useQingyiAttackSheet) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 160, 182, Math.min(.28, h.flash * 1.8), 'lighter');
        else if (useSuwenAttackSheet) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 158, 180, Math.min(.28, h.flash * 1.8), 'lighter');
        else if (hasHuangjinSafeRig) huangjinSafeRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, Math.min(.42, h.flash * 2.6), 'lighter');
        else if (hasHuangjinRig) huangjinRig(ctx, h, time, sprites, color, shieldWindup, shieldHit, hurt, Math.min(.42, h.flash * 2.6), 'lighter');
        else huangjinSkeleton(ctx, h, time, sprites, color, spriteMaxW, spriteMaxH, shieldWindup, shieldHit, hurt, Math.min(.42, h.flash * 2.6), 'lighter');
      } else {
        spriteImage(ctx, sprite, 0, 40, spriteMaxW, spriteMaxH, Math.min(.42, h.flash * 2.6), 'lighter');
        if (attacking && attackSprite) attackFrame(ctx, attackSprite, attackFrameIndex, 0, 44, 166, 196, Math.min(.34, h.flash * 2.2), 'lighter');
      }
    }
    if (h.redFlash > 0) {
      var redHitAlpha = Math.min(.46, h.redFlash * 2.6);
      var redHitGlow = ctx.createRadialGradient(0, -2, 6, 0, -2, 70);
      redHitGlow.addColorStop(0, 'rgba(255,86,54,' + redHitAlpha + ')');
      redHitGlow.addColorStop(.46, 'rgba(255,45,32,' + (redHitAlpha * .45) + ')');
      redHitGlow.addColorStop(1, 'rgba(255,28,18,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = redHitGlow;
      ctx.beginPath(); ctx.ellipse(0, -2, 45, 70, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function paperSeal(ctx, x, y, scale, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(scale, scale);
    ctx.fillStyle = '#e9c870'; rr(ctx, -9, -20, 18, 40, 2, '#e9c870', '#8d3d2f', 2);
    ctx.strokeStyle = '#b5342b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(4, -14); ctx.lineTo(-3, -7); ctx.lineTo(4, 0); ctx.lineTo(-4, 7); ctx.lineTo(4, 14); ctx.stroke();
    ctx.restore();
  }

  function enemy(ctx, e, time, sprites) {
    var sprite = e.type === 'wisp' ? sprites.enemyWisp : e.type === 'boss' ? sprites.enemyBoss : sprites.enemyJiangshi;
    var boss = e.type === 'boss';
    var armored = e.type === 'armored';
    var wisp = e.type === 'wisp';
    var facing = e.attackFacing || 1;
    var bob = Math.sin(time * (wisp ? 5.8 : 3.2) + e.id) * (wisp ? 6 : 2);
    var floatSway = wisp ? Math.sin(time * 2.7 + e.id * .71) * 4 : 0;
    var moveFlutter = wisp && e.moving ? Math.sin(time * 11 + e.id) * 2 : 0;
    var duration = e.attackDuration || .58;
    var attacking = e.attackWindup > 0 || e.attackAnim > 0;
    var windupDuration = e.attackWindupDuration || .22;
    var attackProgress = 0;
    if (e.attackWindup > 0) {
      attackProgress = .48 * (1 - e.attackWindup / Math.max(.01, windupDuration));
    } else if (e.attackAnim > 0) {
      attackProgress = .48 + .52 * (1 - e.attackAnim / duration);
    }
    var recoveryProgress = e.attackAnim > 0 ? 1 - e.attackAnim / duration : 0;
    var recoveryLeft = e.attackAnim > 0 ? clamp01(e.attackAnim / Math.max(.01, duration)) : 0;
    var hitHold = e.hitHold > 0 ? clamp01(e.hitHold / (wisp ? .055 : .035)) : 0;
    var windupRaw = e.attackWindup > 0 ? clamp01(1 - e.attackWindup / Math.max(.01, windupDuration)) : 0;
    var windupLean = e.attackWindup > 0 ? (wisp ? 1 - Math.pow(1 - windupRaw, 2) : Math.sin(windupRaw * Math.PI)) : 0;
    var wispSwipe = wisp && e.attackAnim > 0 ? Math.max(hitHold, Math.pow(recoveryLeft, 1.65)) : 0;
    var lunge = e.attackAnim > 0 ? (wisp ? wispSwipe : Math.sin(recoveryProgress * Math.PI)) : 0;
    var summon = e.summonAnim > 0 ? Math.sin((1 - e.summonAnim / .65) * Math.PI) : 0;
    var hitRatio = e.hit > 0 ? clamp01(e.hit / Math.max(.01, e.hitDuration || .16)) : 0;
    var recoil = e.hit > 0 ? Math.sin((1 - Math.min(1, e.hit / .16)) * Math.PI) : 0;
    var pausePulse = e.rowPause > 0 ? .5 + .5 * Math.sin(time * 25) : 0;
    var scale = e.size * (boss ? 1.1 : armored ? 1.06 : 1);
    var hitSquash = wisp ? hitRatio : hitRatio * .45;
    ctx.save();
    ctx.translate(
      e.x + floatSway + moveFlutter + facing * (wispSwipe * 18 - windupLean * 8) + recoil * 7 + (e.recoilX || 0) * hitRatio,
      e.y + bob + (wisp ? wispSwipe * 8 : lunge * 24) + windupLean * 5 - summon * 10 + (e.recoilY || 0) * hitRatio
    );
    ctx.rotate((e.id % 2 ? 1 : -1) * (.025 * summon + hitSquash * .045) + facing * (.10 * wispSwipe - .08 * windupLean));
    ctx.scale(
      scale * (1 + summon * .14 + pausePulse * .04 + windupLean * .04 + hitSquash * .13 + (wisp && e.moving ? Math.sin(time * 9 + e.id) * .018 : 0)),
      scale * (1 - lunge * (wisp ? .08 : .1) + summon * .08 - pausePulse * .05 - windupLean * .03 - hitSquash * .10)
    );
    shadow(ctx, 0, boss ? 61 : 38, boss ? 68 : 39, boss ? .5 : .38);
    if (wisp && (e.moving || attacking || hitRatio > 0)) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (var trail = 0; trail < 3; trail++) {
        spriteImage(
          ctx, sprite,
          -facing * (10 + trail * 8 + wispSwipe * 10) - moveFlutter * .5,
          36 + trail * 2,
          98, 98,
          (.10 - trail * .022) * (hitRatio > 0 ? 1.2 : 1),
          'screen'
        );
      }
      ctx.restore();
    }
    if (e.elite || summon > 0) {
      var auraColor = boss ? C.fire : '#bd68e0';
      var aura = ctx.createRadialGradient(0, -16, 5, 0, -16, boss ? 98 : 62);
      aura.addColorStop(0, auraColor + '66'); aura.addColorStop(1, auraColor + '00');
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, -16, boss ? 98 : 62, 0, Math.PI * 2); ctx.fill();
    }
    if (e.rowPause > 0) {
      ctx.strokeStyle = '#f7d58c'; ctx.lineWidth = 3; ctx.globalAlpha = .45 + pausePulse * .35;
      ctx.beginPath(); ctx.ellipse(0, 24, boss ? 76 : 47, boss ? 22 : 14, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (e.redFlash > 0) {
      var redAura = ctx.createRadialGradient(0, -15, 4, 0, -15, boss ? 98 : 62);
      redAura.addColorStop(0, 'rgba(255,65,48,.72)'); redAura.addColorStop(1, 'rgba(255,30,20,0)');
      ctx.fillStyle = redAura; ctx.beginPath(); ctx.arc(0, -15, boss ? 98 : 62, 0, Math.PI * 2); ctx.fill();
    }
    var wispAttackFrameDrawn = false;
    if (wisp && attacking) {
      var ghostPower = Math.max(windupLean * .75, wispSwipe);
      var wispAttackFrame = Math.min(3, Math.floor(clamp01(attackProgress) * 4));
      wispAttackFrameDrawn = attackFrame(ctx, sprites.enemyWispAttackVfx, wispAttackFrame, 0, 37, 116, 116, .82 + ghostPower * .14, 'screen');
      if (!wispAttackFrameDrawn) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = C.blue; ctx.shadowBlur = 16 + ghostPower * 18;
        ctx.globalAlpha = .28 + ghostPower * .42;
        var ghostAura = ctx.createRadialGradient(0, -16, 4, 0, -16, 62);
        ghostAura.addColorStop(0, 'rgba(190,252,255,.64)');
        ghostAura.addColorStop(.5, 'rgba(88,189,233,.24)');
        ghostAura.addColorStop(1, 'rgba(88,189,233,0)');
        ctx.fillStyle = ghostAura; ctx.beginPath(); ctx.arc(0, -16, 62, 0, Math.PI * 2); ctx.fill();
        if (wispSwipe > 0) {
          ctx.fillStyle = 'rgba(177,255,255,' + (.18 * wispSwipe) + ')';
          ctx.beginPath(); ctx.ellipse(facing * 24, -18, 54 + wispSwipe * 18, 24 + wispSwipe * 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    } else if (lunge > 0) {
      ctx.strokeStyle = boss ? C.fire : '#e9dfbd'; ctx.lineWidth = boss ? 10 : 6;
      ctx.globalAlpha = lunge * .75; ctx.beginPath(); ctx.arc(0, -20, boss ? 86 : 56, .2, 2.45); ctx.stroke(); ctx.globalAlpha = 1;
    }
    var spriteW = boss ? 190 : armored ? 112 : 98;
    var spriteH = boss ? 190 : armored ? 112 : 98;
    if (!wispAttackFrameDrawn) spriteImage(ctx, sprite, 0, boss ? 58 : 36, spriteW, spriteH, e.hit > 0 ? .82 : .99);
    if (e.redFlash > 0) {
      if (wispAttackFrameDrawn) attackFrame(ctx, sprites.enemyWispAttackVfx, wispAttackFrame, 0, 37, 116, 116, Math.min(.65, e.redFlash * 6.5), 'lighter');
      else spriteImage(ctx, sprite, 0, boss ? 58 : 36, spriteW, spriteH, Math.min(.65, e.redFlash * 6.5), 'lighter');
    }
    if (armored) {
      ctx.strokeStyle = '#9ab8ad'; ctx.lineWidth = 4; ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.arc(0, -26, 47, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  YL.Art = {
    rr: rr, text: text, panel: panel, button: button, bar: bar,
    icon: icon, portrait: portrait, skillCooldown: skillCooldown, hero: hero, enemy: enemy,
    atlasCell: atlasCell, pathRoundRect: pathRoundRect, paperSeal: paperSeal,
    spriteImage: spriteImage
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
