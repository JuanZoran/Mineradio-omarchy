'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {
  GLOBAL_SHORTCUTS_PORTAL_FEATURE,
  LINUX_DESKTOP_NAME,
  appendChromiumFeature,
  configureLinuxRuntime,
  isWaylandSession,
  resolveAppIconPath,
} = require('../desktop/linux-runtime');

test('detects Hyprland and other Wayland sessions', () => {
  assert.equal(isWaylandSession({ XDG_SESSION_TYPE: 'wayland' }), true);
  assert.equal(isWaylandSession({ WAYLAND_DISPLAY: 'wayland-1' }), true);
  assert.equal(isWaylandSession({ XDG_SESSION_TYPE: 'x11' }), false);
});

test('configures Linux desktop identity and Wayland global shortcut portal', () => {
  const calls = [];
  const app = {
    setDesktopName(value) { calls.push(['desktop', value]); },
    commandLine: {
      getSwitchValue(name) { return name === 'enable-features' ? 'ExistingFeature' : ''; },
      appendSwitch(name, value) { calls.push(['switch', name, value]); },
    },
  };
  const result = configureLinuxRuntime(app, {
    platform: 'linux',
    env: { XDG_SESSION_TYPE: 'wayland' },
  });

  assert.equal(result.desktopName, LINUX_DESKTOP_NAME);
  assert.equal(result.wayland, true);
  assert.deepEqual(calls, [
    ['desktop', LINUX_DESKTOP_NAME],
    ['switch', 'enable-features', `ExistingFeature,${GLOBAL_SHORTCUTS_PORTAL_FEATURE}`],
  ]);
});

test('does not duplicate portal feature or touch non-Linux runtimes', () => {
  const switches = [];
  const commandLine = {
    getSwitchValue() { return `Foo,${GLOBAL_SHORTCUTS_PORTAL_FEATURE}`; },
    appendSwitch(name, value) { switches.push([name, value]); },
  };
  assert.equal(appendChromiumFeature(commandLine, GLOBAL_SHORTCUTS_PORTAL_FEATURE), false);
  assert.deepEqual(switches, []);

  const result = configureLinuxRuntime({}, { platform: 'win32', env: {} });
  assert.equal(result.linux, false);
});

test('uses PNG icons on Linux and ICO icons on Windows', () => {
  assert.equal(resolveAppIconPath('/app', 'linux'), path.join('/app', 'build', 'icon.png'));
  assert.equal(resolveAppIconPath('/app', 'win32'), path.join('/app', 'build', 'icon.ico'));
});

test('keeps the D3D11 ANGLE override Windows-only', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'desktop', 'main.js'), 'utf8');
  assert.match(main, /process\.platform === 'win32'\) CHROMIUM_SAFE_PERFORMANCE_SWITCHES\.push\(\['use-angle', 'd3d11'\]\)/);
  assert.match(main, /angle: process\.platform === 'win32' \? 'd3d11' : 'system-default'/);
});
