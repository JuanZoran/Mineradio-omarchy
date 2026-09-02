'use strict';

const path = require('path');

const LINUX_DESKTOP_NAME = 'com.mineradio.Mineradio';
const GLOBAL_SHORTCUTS_PORTAL_FEATURE = 'GlobalShortcutsPortal';

function isWaylandSession(env = process.env) {
  const sessionType = String(env.XDG_SESSION_TYPE || '').trim().toLowerCase();
  return sessionType === 'wayland' || Boolean(String(env.WAYLAND_DISPLAY || '').trim());
}

function appendChromiumFeature(commandLine, feature, switchName = 'enable-features') {
  if (!commandLine || typeof commandLine.appendSwitch !== 'function') return false;
  const current = typeof commandLine.getSwitchValue === 'function'
    ? String(commandLine.getSwitchValue(switchName) || '')
    : '';
  const features = current.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (features.includes(feature)) return false;
  features.push(feature);
  commandLine.appendSwitch(switchName, features.join(','));
  return true;
}

function configureLinuxRuntime(app, options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  if (platform !== 'linux') {
    return { linux: false, wayland: false, desktopName: '', globalShortcutsPortal: false };
  }

  const desktopName = String(options.desktopName || LINUX_DESKTOP_NAME).replace(/\.desktop$/i, '');
  if (app && typeof app.setDesktopName === 'function') app.setDesktopName(desktopName);

  const wayland = isWaylandSession(env);
  const portalEnabled = wayland
    && env.MINERADIO_DISABLE_WAYLAND_GLOBAL_SHORTCUTS !== '1'
    && appendChromiumFeature(app && app.commandLine, GLOBAL_SHORTCUTS_PORTAL_FEATURE);

  return {
    linux: true,
    wayland,
    desktopName,
    globalShortcutsPortal: portalEnabled,
  };
}

function resolveAppIconPath(projectRoot, platform = process.platform) {
  return path.join(projectRoot, 'build', platform === 'win32' ? 'icon.ico' : 'icon.png');
}

module.exports = {
  GLOBAL_SHORTCUTS_PORTAL_FEATURE,
  LINUX_DESKTOP_NAME,
  appendChromiumFeature,
  configureLinuxRuntime,
  isWaylandSession,
  resolveAppIconPath,
};
