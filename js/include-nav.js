// Apply persisted settings on every page (theme, cursor, ambient audio)
(function () {
  var SETTINGS_KEY = 'portfolio_settings_v1';
  try {
    var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');

    if (s.theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    var cn = parseInt(s.cursor, 10);
    if (cn >= 1 && cn <= 3) {
      var bp = window.location.pathname.indexOf('/Portfolio_2_Mock/') !== -1 ? '/Portfolio_2_Mock' : '';
      var pad = cn < 10 ? '0' + cn : '' + cn;
      var st = document.getElementById('settings-cursor-style') || document.createElement('style');
      st.id = 'settings-cursor-style';
      st.textContent =
        '* { cursor: url("' + bp + '/extra/assets/cursors/arrow-' + pad + '.cur"), default !important; }\n' +
        'a, button, .nav-collapsible-trigger, [role="button"], [tabindex]:not([tabindex="-1"]) ' +
        '{ cursor: url("' + bp + '/extra/assets/cursors/hover-' + pad + '.cur"), pointer !important; }';
      if (!st.parentNode) document.head.appendChild(st);
    }

    var onSettingsPage = window.location.pathname.indexOf('settings') !== -1;
    if (s.ambient && !onSettingsPage) {
      var bp2 = window.location.pathname.indexOf('/Portfolio_2_Mock/') !== -1 ? '/Portfolio_2_Mock' : '';
      var audioBase = bp2 + '/extra/assets/audio/';
      var ambientTracks = [
        [audioBase + 'rain.mp3', 0.04],
        [audioBase + 'forest.mp3', 0.3],
        [audioBase + 'campfire.mp3', 0.03],
        [audioBase + 'wind.mp3', 0.02]
      ];
      document.addEventListener('DOMContentLoaded', function () {
        ambientTracks.forEach(function (t) {
          var a = new Audio(t[0]);
          a.loop = true;
          a.volume = t[1];
          a.play().catch(function () {});
        });
      });
    }

    // ── Dachshund ──────────────────────────────────────────────
    var DACH_FRAMES = 8;
    var DACH_W = 180;
    var DACH_H = 192;
    var DACH_FRAME_MS = 100;
    var DACH_SPEED = 2;

    window._dachshundStart = function () {
      if (document.getElementById('dachshund-pet')) return;
      var bpD = window.location.pathname.indexOf('/Portfolio_2_Mock/') !== -1 ? '/Portfolio_2_Mock' : '';
      var el = document.createElement('div');
      el.id = 'dachshund-pet';
      el.style.cssText = [
        'position:fixed', 'bottom:0', 'z-index:500', 'pointer-events:none',
        'width:' + DACH_W + 'px', 'height:' + DACH_H + 'px',
        'background-image:url("' + bpD + '/extra/assets/dachshund%20sprite%20sheet.png")',
        'background-size:' + (DACH_W * DACH_FRAMES * 2) + 'px ' + DACH_H + 'px',
        'background-repeat:no-repeat', 'background-position:0 0', 'left:0'
      ].join(';');
      document.body.appendChild(el);

      var x = Math.random() * Math.max(0, window.innerWidth - DACH_W);
      var dir = 1;
      var anim = 0;
      var lastFrameTime = 0;
      var running = true;
      el.style.left = x + 'px';

      function step(ts) {
        if (!running) return;
        if (ts - lastFrameTime >= DACH_FRAME_MS) {
          anim = (anim + 1) % DACH_FRAMES;
          var spriteIdx = dir === 1 ? anim : (DACH_FRAMES + anim);
          el.style.backgroundPositionX = -(spriteIdx * DACH_W) + 'px';
          lastFrameTime = ts;
        }
        x += DACH_SPEED * dir;
        var maxX = window.innerWidth - DACH_W;
        if (x >= maxX) { x = maxX; dir = -1; anim = 0; }
        else if (x <= 0) { x = 0; dir = 1; anim = 0; }
        el.style.left = x + 'px';
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      el._dachKill = function () { running = false; };
    };

    window._dachshundStop = function () {
      var el = document.getElementById('dachshund-pet');
      if (el) { if (el._dachKill) el._dachKill(); el.remove(); }
    };

    if (s.dachshund && !onSettingsPage) {
      document.addEventListener('DOMContentLoaded', function () {
        window._dachshundStart();
      });
    }
  } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', function () {
  var placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;

  // Bump when nav.html structure changes so clients don’t reuse stale markup.
  var NAV_MARKUP_CACHE_VERSION = '1';
  var NAV_HTML_SESSION_KEY = 'portfolio_nav_markup_v' + NAV_MARKUP_CACHE_VERSION;
  var NAV_PATH_SESSION_KEY = 'portfolio_nav_ok_path_v' + NAV_MARKUP_CACHE_VERSION;

  // Remember which nav folders are collapsed across full page loads (static HTML + fetch nav).
  var NAV_COLLAPSE_STORAGE_KEY = 'portfolio_nav_collapsed_v1';

  function loadCollapsedMap() {
    try {
      var raw = localStorage.getItem(NAV_COLLAPSE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCollapsedMap(map) {
    try {
      localStorage.setItem(NAV_COLLAPSE_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function getSession(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setSession(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      /* ignore */
    }
  }

  function clearNavCache() {
    try {
      sessionStorage.removeItem(NAV_HTML_SESSION_KEY);
      sessionStorage.removeItem(NAV_PATH_SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // Try multiple possible paths to find nav.html
  var paths = [
    'nav.html',
    '../nav.html',
    '../../nav.html',
    '../../../nav.html'
  ];

  function initNavMarkup(ph) {
    var currentPath = window.location.pathname;
    var links = ph.querySelectorAll('a[href]');

    var nav = ph.querySelector('nav');
    var toggle = ph.querySelector('.nav-toggle');
    if (nav && toggle) {
      function setOpen(isOpen) {
        nav.classList.toggle('nav-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }

      toggle.addEventListener('click', function () {
        var isOpen = nav.classList.contains('nav-open');
        setOpen(!isOpen);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
      });

      nav.addEventListener('click', function (e) {
        var target = e.target;
        if (target && target.closest && target.closest('a[href]')) {
          setOpen(false);
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 900) setOpen(false);
      });
    }

    if (nav) {
      var collapsibleTriggers = nav.querySelectorAll('span.section-heading, span.label');
      var collapseId = 0;

      function setupCollapsible(trigger, target) {
        if (!target) return;
        if (target.tagName !== 'UL') return;

        var id = target.id;
        if (!id) {
          collapseId += 1;
          id = 'nav-collapsible-' + collapseId;
          target.id = id;
        }

        trigger.classList.add('nav-collapsible-trigger');
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('aria-controls', id);

        function setExpanded(isExpanded, persist) {
          trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          target.hidden = !isExpanded;
          if (persist) {
            var map = loadCollapsedMap();
            if (!isExpanded) {
              map[id] = true;
            } else {
              delete map[id];
            }
            saveCollapsedMap(map);
          }
        }

        var collapsedMap = loadCollapsedMap();
        var storedCollapsed = !!collapsedMap[id];
        setExpanded(!storedCollapsed, false);

        trigger.addEventListener('click', function () {
          var expanded = trigger.getAttribute('aria-expanded') === 'true';
          setExpanded(!expanded, true);
        });

        trigger.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var expanded = trigger.getAttribute('aria-expanded') === 'true';
            setExpanded(!expanded, true);
          }
        });
      }

      collapsibleTriggers.forEach(function (trigger) {
        var target = null;
        if (trigger.classList.contains('section-heading')) {
          target = trigger.nextElementSibling;
        } else if (trigger.classList.contains('label')) {
          target = trigger.nextElementSibling;
        }
        setupCollapsible(trigger, target);
      });
    }

    var basePath = '';
    if (currentPath.includes('/Portfolio_2_Mock/')) {
      basePath = '/Portfolio_2_Mock';
    }

    links.forEach(function (link) {
      var href = link.getAttribute('href');

      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      if (href.startsWith('/')) {
        link.setAttribute('href', basePath + href);
      }

      var linkPath = link.pathname;
      var isCurrent = currentPath === linkPath || currentPath.includes(href.replace(/^\//, ''));

      if (isCurrent) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function applyNavHtml(html, okPath) {
    placeholder.innerHTML = html;
    setSession(NAV_HTML_SESSION_KEY, html);
    if (okPath) {
      setSession(NAV_PATH_SESSION_KEY, okPath);
    }
    initNavMarkup(placeholder);
  }

  function tryFetch(index) {
    if (index >= paths.length) {
      console.error('Failed to load nav.html from any location');
      return;
    }

    fetch(paths[index])
      .then(function (response) {
        if (response.ok) {
          return response.text();
        }
        throw new Error('Not found at: ' + paths[index]);
      })
      .then(function (html) {
        applyNavHtml(html, paths[index]);
      })
      .catch(function () {
        tryFetch(index + 1);
      });
  }

  var cachedHtml = getSession(NAV_HTML_SESSION_KEY);
  if (cachedHtml) {
    placeholder.innerHTML = cachedHtml;
    initNavMarkup(placeholder);
    return;
  }

  var preferredPath = getSession(NAV_PATH_SESSION_KEY);
  if (preferredPath && paths.indexOf(preferredPath) !== -1) {
    fetch(preferredPath)
      .then(function (response) {
        if (response.ok) return response.text();
        throw new Error('stale path');
      })
      .then(function (html) {
        applyNavHtml(html, preferredPath);
      })
      .catch(function () {
        clearNavCache();
        tryFetch(0);
      });
    return;
  }

  tryFetch(0);
});
