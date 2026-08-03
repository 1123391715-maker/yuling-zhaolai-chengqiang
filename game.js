require('./src/config.js');
require('./config/waves.js');
require('./config/heroes.js');
require('./config/battle-tuning.js');
require('./config/skill-tuning.js');
require('./config/upgrades.js');
require('./src/audio.js');
require('./src/art.js');
require('./src/game-wall.js');

var canvas = wx.createCanvas();
var game = new globalThis.YL.Game(canvas, { platform: 'wechat', wx: wx });
game.start();
