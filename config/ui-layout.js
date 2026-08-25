(function (root) {
  'use strict';

  var YL = root.YL = root.YL || {};
  var canvas = {
    width: 750,
    height: 1334,
    orientation: 'portrait',
    coordinateSpace: 'logical-canvas-px',
    scaling: 'contain'
  };

  // 所有新 UI 的唯一逻辑坐标源。浏览器截图、微信屏幕和设备 DPR 都只能改变显示缩放，
  // 不能改变这里的 x/y/w/h。点击热区必须复用同一个 rect。
  YL.UI_CANVAS = canvas;
  YL.UI = YL.UI || {};
  YL.UI.mapPoint = function (clientX, clientY, viewport) {
    viewport = viewport || {};
    var width = Number(viewport.width) || canvas.width;
    var height = Number(viewport.height) || canvas.height;
    var left = Number(viewport.left) || 0;
    var top = Number(viewport.top) || 0;
    var scale = Math.min(width / canvas.width, height / canvas.height);
    var contentWidth = canvas.width * scale;
    var contentHeight = canvas.height * scale;
    var offsetX = (width - contentWidth) * 0.5;
    var offsetY = (height - contentHeight) * 0.5;
    return {
      x: (clientX - left - offsetX) / scale,
      y: (clientY - top - offsetY) / scale
    };
  };
  YL.UI_LAYOUT = {
    version: '20260820-ui-coordinate-contract-v1',
    canvas: canvas,
    home: {
      taskGuide: {
        // 按已确认主线视觉图中的任务卡外接矩形重新测量：约占逻辑画布 26.7% 宽度。
        x: 18,
        y: 1070,
        w: 200,
        h: 86,
        coordinateSpace: canvas.coordinateSpace,
        hitRect: 'same-as-visual-rect',
        content: {
          icon: { x: 34, y: 39, size: 32 },
          rewardAmount: { x: 34, y: 75 },
          description: { x: 64, y: 23, w: 106, h: 28, maxLines: 2, maxSize: 14, minSize: 9 },
          progress: { x: 142, y: 52, w: 36, h: 22 }
        },
        states: {
          incomplete: 'assets/art/ui/task-guide-v2/task-guide-panel-incomplete-v2.png',
          claimable: 'assets/art/ui/task-guide-v2/task-guide-panel-claimable-v3-clean.png'
        }
      }
    }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
