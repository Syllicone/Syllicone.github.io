// Selected Works page behaviour only — the works themselves are plain HTML
// blocks in work/portfolio.html (.work-entry, copy one to add a new work).
// This script builds the Type/Keywords filter bar from whatever .work-entry
// blocks it finds (reading their data-type/data-keywords attributes), and
// wires up click/keyboard navigation for each .work-carousel's <img> set.
(function () {
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function splitList(value) {
    return (value || '').split('/').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // Counts how many .work-entry blocks use each type/keyword, in first-seen
  // order, so the dropdowns can show "(no.) times used" next to each one.
  function collectFilterOptions(entries) {
    var typeCounts = {};
    var typeOrder = [];
    var keywordCounts = {};
    var keywordOrder = [];

    entries.forEach(function (entry) {
      var type = entry.dataset.type;
      if (type) {
        if (!(type in typeCounts)) { typeCounts[type] = 0; typeOrder.push(type); }
        typeCounts[type]++;
      }
      splitList(entry.dataset.keywords).forEach(function (k) {
        if (!(k in keywordCounts)) { keywordCounts[k] = 0; keywordOrder.push(k); }
        keywordCounts[k]++;
      });
    });

    return {
      types: typeOrder.map(function (v) { return { value: v, count: typeCounts[v] }; }),
      keywords: keywordOrder.map(function (v) { return { value: v, count: keywordCounts[v] }; })
    };
  }

  function renderFilterChecklist(name, items, gridLayout) {
    var details = el('details', 'filter-dropdown');
    details.appendChild(el('summary', 'filter-trigger', name));

    var list = el('ul', 'filter-checklist' + (gridLayout ? ' grid' : ''));
    items.forEach(function (item) {
      var li = el('li');
      var label = el('label');
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.filterGroup = name.toLowerCase();
      checkbox.value = item.value;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + item.value + ' (' + item.count + ')'));
      li.appendChild(label);
      list.appendChild(li);
    });
    details.appendChild(list);
    return details;
  }

  function renderFilterBar(container, options) {
    var bar = el('div', 'filter-bar');

    var allBtn = el('button', 'filter-trigger filter-all-btn', 'All');
    allBtn.type = 'button';
    bar.appendChild(allBtn);

    bar.appendChild(renderFilterChecklist('Type', options.types, false));
    bar.appendChild(renderFilterChecklist('Keywords', options.keywords, true));

    container.appendChild(bar);
  }

  function matchesFilters(entry, activeTypes, activeKeywords) {
    if (activeTypes.size && !activeTypes.has(entry.dataset.type)) return false;
    if (activeKeywords.size) {
      var keywords = splitList(entry.dataset.keywords);
      if (!keywords.some(function (k) { return activeKeywords.has(k); })) return false;
    }
    return true;
  }

  function applyFilters(filterBarRoot, entries) {
    var activeTypes = new Set();
    var activeKeywords = new Set();
    filterBarRoot.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
      if (!checkbox.checked) return;
      if (checkbox.dataset.filterGroup === 'type') activeTypes.add(checkbox.value);
      else if (checkbox.dataset.filterGroup === 'keywords') activeKeywords.add(checkbox.value);
    });

    entries.forEach(function (entry) {
      entry.hidden = !matchesFilters(entry, activeTypes, activeKeywords);
    });
  }

  // The carousel is a real horizontal filmstrip: every image sits in a row
  // inside .carousel-track at its own natural aspect ratio (height:100%,
  // width:auto — no cropping), and the "peek" of the next image is simply
  // whatever pokes past the viewport's right edge before being clipped by
  // .work-carousel's overflow:hidden — not a separately cropped preview.
  //
  // Navigation loops infinitely without ever animating "backwards" across
  // the whole strip: advancing slides one image over, then — once that
  // slide has visually finished — silently moves the passed image to the
  // far end of the track and snaps the transform back to 0 (invisible,
  // since the next image is now sitting exactly where the old one was).
  // Going back does the same in reverse: prepend the last image, jump the
  // transform to compensate (invisible), then animate forward to reveal it.
  // Real elements are reused/reordered — no cloned nodes.
  var CAROUSEL_GAP = 40; // fixed px gap between images in the strip

  // Splits the current image in half and toggles the left/right-arrow
  // cursor class to match which half the pointer is over.
  function updateCursorHalf(current, clientX) {
    var rect = current.getBoundingClientRect();
    var overRight = (clientX - rect.left) > rect.width / 2;
    current.classList.toggle('cursor-next', overRight);
    current.classList.toggle('cursor-prev', !overRight);
    return overRight;
  }

  function initCarousel(carousel) {
    var track = carousel.querySelector('.carousel-track');
    if (!track) return;
    track.style.gap = CAROUSEL_GAP + 'px';

    function currentImages() {
      return Array.prototype.slice.call(track.querySelectorAll('img'));
    }

    var count = currentImages().length;
    if (!count) return;

    var pendingFinish = null;
    var pendingListener = null;

    function clearPending() {
      if (pendingListener) {
        track.removeEventListener('transitionend', pendingListener);
        pendingListener = null;
      }
      pendingFinish = null;
    }

    // Runs a deferred reorder immediately (skipping ahead of its slide
    // animation) — used both when the animation naturally finishes and
    // when a new click arrives before it has, so rapid repeat clicks
    // always start from a settled, consistent order.
    function finishPendingNow() {
      if (!pendingFinish) return;
      var fn = pendingFinish;
      clearPending();
      fn();
    }

    // Marks images[currentPos] as the visible/current one (full a11y
    // exposure) and images[currentPos + 1] as the peeking one, without
    // touching the track's transform.
    function markCurrentAndPeek(currentPos) {
      currentImages().forEach(function (img, i) {
        img.classList.remove('carousel-current', 'carousel-peek');
        if (i === currentPos) {
          img.classList.add('carousel-current');
          img.removeAttribute('aria-hidden');
        } else {
          img.setAttribute('aria-hidden', 'true');
          if (i === currentPos + 1) img.classList.add('carousel-peek');
        }
      });
    }

    function step(direction) {
      finishPendingNow();
      if (count <= 1) return;

      if (direction > 0) {
        var imgs = currentImages();
        var first = imgs[0];
        var dist = first.offsetWidth + CAROUSEL_GAP;
        track.style.transform = 'translateX(-' + dist + 'px)';
        markCurrentAndPeek(1); // imgs[1] is what's sliding into view

        pendingFinish = function () {
          track.style.transition = 'none';
          track.appendChild(first); // move the passed image to the far end
          track.style.transform = 'translateX(0)'; // imgs[1] is now first — no visible jump
          void track.offsetWidth; // force the instant jump to commit
          track.style.transition = '';
          markCurrentAndPeek(0);
        };
        pendingListener = function (e) {
          if (e.target === track && e.propertyName === 'transform') finishPendingNow();
        };
        track.addEventListener('transitionend', pendingListener);
      } else {
        var imgs2 = currentImages();
        var last = imgs2[imgs2.length - 1];
        var dist2 = last.offsetWidth + CAROUSEL_GAP;

        track.style.transition = 'none';
        track.insertBefore(last, imgs2[0]); // prepend — DOM order shifts...
        track.style.transform = 'translateX(-' + dist2 + 'px)'; // ...compensate, so nothing visibly moves yet
        void track.offsetWidth;
        track.style.transition = '';
        markCurrentAndPeek(0); // `last` is now first, and already correct

        requestAnimationFrame(function () {
          track.style.transform = 'translateX(0)'; // now animate the reveal
        });
      }
    }

    markCurrentAndPeek(0);

    carousel.addEventListener('click', function (e) {
      var current = carousel.querySelector('.carousel-current');
      if (!current) return;
      var clickedRight = updateCursorHalf(current, e.clientX);
      step(clickedRight ? 1 : -1);
      // Keep the cursor correct immediately after the swap, without
      // waiting on the next mousemove, since the pointer hasn't moved yet.
      var newCurrent = carousel.querySelector('.carousel-current');
      if (newCurrent) updateCursorHalf(newCurrent, e.clientX);
    });

    carousel.addEventListener('mousemove', function (e) {
      if (e.target.classList.contains('carousel-current')) {
        updateCursorHalf(e.target, e.clientX);
      }
    });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var filterBarRoot = document.getElementById('selected-works-filter-bar');
    if (!filterBarRoot) return;

    var entries = Array.prototype.slice.call(document.querySelectorAll('.work-entry'));
    renderFilterBar(filterBarRoot, collectFilterOptions(entries));

    filterBarRoot.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-all-btn')) return;
      filterBarRoot.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
        checkbox.checked = false;
      });
      filterBarRoot.querySelectorAll('.filter-dropdown').forEach(function (details) {
        details.open = false;
      });
      applyFilters(filterBarRoot, entries);
    });

    filterBarRoot.addEventListener('change', function (e) {
      if (e.target.matches('input[type="checkbox"]')) applyFilters(filterBarRoot, entries);
    });

    document.querySelectorAll('.work-carousel').forEach(initCarousel);
  });
})();
