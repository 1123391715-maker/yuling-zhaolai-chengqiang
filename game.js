require('./config/ui-layout.js');
require('./src/config.js');
require('./config/waves.js');
require('./config/stages.js');
require('./config/heroes.js');
require('./config/battle-tuning.js');
require('./config/skill-tuning.js');
require('./config/upgrades.js');
require('./src/audio.js');
require('./src/art.js');
require('./src/progression.js');
require('./src/home-ui.js');
require('./src/tutorial-ui.js');
require('./src/game-wall.js');

// 微信小游戏 Canvas 需要在绘制任何界面前显式注册标题与正文字体。加载失败时保留 config 中的后备字族。
try {
  var customFontFamily = wx.loadFont('assets/fonts/MaShanZheng-Regular.ttf');
  if (customFontFamily) {
    globalThis.YL.UI_FONT_TITLE_FAMILY = '"' + customFontFamily + '","MaShanZheng","Microsoft YaHei","PingFang SC",sans-serif';
    globalThis.YL.UI_FONT_FAMILY = globalThis.YL.UI_FONT_TITLE_FAMILY;
  }
} catch (fontError) {
  console.warn('MaShanZheng font load failed; using fallback font.', fontError);
}

try {
  var bodyFontFamily = wx.loadFont('assets/fonts/NotoSerifSC-GameSubset.ttf');
  if (bodyFontFamily) {
    globalThis.YL.UI_FONT_BODY_FAMILY = '"' + bodyFontFamily + '","NotoSerifSCGame","Noto Serif SC","Source Han Serif SC","Songti SC","SimSun",serif';
  }
} catch (fontError) {
  console.warn('NotoSerifSCGame font load failed; using fallback font.', fontError);
}

var canvas = wx.createCanvas();
var game = new globalThis.YL.Game(canvas, { platform: 'wechat', wx: wx });
game.start();
