(function () {
  var SETTINGS_KEY = 'portfolio_settings_v1';

  function getSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { theme: 'light', cursor: 1, ambient: false };
      var p = JSON.parse(raw);
      return {
        theme: p.theme || 'light',
        cursor: (function () { var cn = parseInt(p.cursor, 10); return isNaN(cn) ? 1 : cn; }()),
        ambient: !!p.ambient,
        dachshund: !!p.dachshund
      };
    } catch (e) {
      return { theme: 'light', cursor: 1, ambient: false };
    }
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function getBasePath() {
    return window.location.pathname.indexOf('/Portfolio_2_Mock/') !== -1 ? '/Portfolio_2_Mock' : '';
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  function applyCursor(num) {
    var existing = document.getElementById('settings-cursor-style');
    if (existing) existing.remove();
    if (!num || num < 1) return;
    var bp = getBasePath();
    var pad = num < 10 ? '0' + num : '' + num;
    var style = document.createElement('style');
    style.id = 'settings-cursor-style';
    style.textContent =
      '* { cursor: url("' + bp + '/extra/assets/cursors/arrow-' + pad + '.cur"), default !important; }\n' +
      'a, button, .nav-collapsible-trigger, [role="button"], [tabindex]:not([tabindex="-1"]) ' +
      '{ cursor: url("' + bp + '/extra/assets/cursors/hover-' + pad + '.cur"), pointer !important; }';
    document.head.appendChild(style);
  }

  // Hardcoded volume balance for each track
  var TRACK_CONFIG = [
    { file: 'rain.mp3',     vol: 0.04  },
    { file: 'forest.mp3',   vol: 0.3  },
    { file: 'campfire.mp3', vol: 0.03  },
    { file: 'wind.mp3',     vol: 0.02 }
  ];

  var tracks = null;

  function ensureTracks() {
    if (tracks) return;
    var base = getBasePath() + '/extra/assets/audio/';
    tracks = TRACK_CONFIG.map(function (t) {
      var a = new Audio(base + t.file);
      a.loop = true;
      a.volume = t.vol;
      return a;
    });
  }

  function startAmbient() {
    ensureTracks();
    tracks.forEach(function (a) { a.play().catch(function () {}); });
  }

  function stopAmbient() {
    if (!tracks) return;
    tracks.forEach(function (a) { a.pause(); a.currentTime = 0; });
  }

  function setActiveBtn(setting, value) {
    document.querySelectorAll('.setting-btn[data-setting="' + setting + '"]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.value === String(value));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var s = getSettings();

    setActiveBtn('theme', s.theme);
    setActiveBtn('cursor', s.cursor);
    setActiveBtn('ambient', s.ambient ? 'on' : 'off');
    setActiveBtn('dachshund', s.dachshund ? 'on' : 'off');

    if (s.ambient) startAmbient();
    if (s.dachshund) window._dachshundStart();

    document.querySelectorAll('.setting-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var setting = btn.dataset.setting;
        var value = btn.dataset.value;

        if (setting === 'theme') {
          s.theme = value;
          applyTheme(value);
          setActiveBtn('theme', value);
        } else if (setting === 'cursor') {
          s.cursor = parseInt(value, 10);
          applyCursor(s.cursor);
          setActiveBtn('cursor', value);
        } else if (setting === 'ambient') {
          s.ambient = value === 'on';
          if (s.ambient) startAmbient(); else stopAmbient();
          setActiveBtn('ambient', value);
        } else if (setting === 'dachshund') {
          s.dachshund = value === 'on';
          if (s.dachshund) window._dachshundStart(); else window._dachshundStop();
          setActiveBtn('dachshund', value);
        }

        saveSettings(s);
      });
    });
  });
})();
