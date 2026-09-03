'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const mainText = fs.readFileSync(path.join(appRoot, 'desktop', 'main.js'), 'utf8');
const preferencesText = fs.readFileSync(
  path.join(appRoot, 'public', 'js', 'modules', '00-state', '02-preferences-ui-modes.js'),
  'utf8'
);
const storesText = fs.readFileSync(
  path.join(appRoot, 'public', 'js', 'modules', '00-state', '00-core-stores.js'),
  'utf8'
);

assert.match(mainText, /let closeBehavior = 'tray';/, '主进程默认关闭行为必须是托盘隐藏');
assert.match(
  preferencesText,
  /localStorage\.getItem\(CLOSE_BEHAVIOR_STORE_KEY\) \|\| 'tray'/,
  '新用户的渲染进程偏好必须默认保存为托盘隐藏'
);
assert.match(
  storesText,
  /CLOSE_BEHAVIOR_STORE_KEY = 'mineradio-close-behavior-v2'/,
  '必须升级偏好键，避免历史 v1=exit 覆盖新的托盘默认值'
);
assert.doesNotMatch(
  storesText,
  /CLOSE_BEHAVIOR_STORE_KEY = 'mineradio-close-behavior-v1'/,
  '运行时不得继续读取旧的直接退出默认值'
);
assert.match(
  mainText,
  /createOrUpdateTray\(\);\s*await createWindow\(\);/,
  '应用启动时必须先创建托盘项'
);
assert.match(
  mainText,
  /!appQuitting && closeBehavior === 'tray'[\s\S]{0,360}win\.hide\(\)/,
  '关闭主窗口时必须隐藏窗口而非终止进程'
);
assert.match(
  mainText,
  /label: '退出',[\s\S]{0,160}app\.quit\(\)/,
  '托盘菜单必须保留显式退出入口'
);

console.log('[OK] Default close-to-tray behavior preserves background playback and provides an explicit quit action.');
