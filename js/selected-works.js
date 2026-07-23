// Renders the curated "Selected Works" list (filter bar + per-work carousels)
// into #selected-works-root, if that container exists on the page.
(function () {
  var WORKS = [
    {
      id: 'ido',
      title: 'Inconsiderate Domestic Objects',
      year: '2026',
      type: 'PROJECT',
      keywords: ['Technology', 'Interaction', 'Relationship'],
      outcomes: ['Interface', 'Objects', 'Publication'],
      description: 'Inconsiderate Domestic Objects make us more considerate by using them. This series of tools encourage emotional reflection through friction. Highlighting the ways in which domestic technologies are optimised for functions rather than humanness. The project encourages more poetic modes of habitation, helping people recognise and expel mathematical efficiency from their pockets, countertops and bedside tables. The project aims to enable new emotional behaviours, and enrich our imaginations.',
      href: '/work/projects/Inconsiderate-Domestic-Objects',
      images: [
        { src: 'projects/IDO-images/DANIEL_SINCLAIR_SUPPORT.jpg', alt: 'Inconsiderate Domestic Objects' },
        { src: 'projects/IDO-images/toaster-hands.gif', alt: 'Copy-cat Toaster' },
        { src: 'projects/IDO-images/UI.png', alt: 'Inconsiderate Domestic Objects Interface' },
        { src: 'projects/IDO-images/00kettle.gif', alt: 'Hold down the kettle' },
        { src: 'projects/IDO-images/00lamp.gif', alt: 'Eye contact lamp' },
        { src: 'projects/IDO-images/hold hands toastie machine.png', alt: "Early proposal to hold 'hands' with a toastie maker" }
      ]
    },
    {
      id: 'escaping-recognition',
      title: 'Escaping Recognition',
      year: '2025',
      type: 'PROJECT',
      keywords: ['Vision', 'Non-human', 'Escape'],
      outcomes: ['Publication', 'Research'],
      description: "The mortifying ordeal of being known is becoming increasingly complex as high resolution satellites orbit the earth, as we live in close proximity to animal vision systems we do not comprehend, and interact with an increasing amount of people. If only there was a way to understand and evade how we are perceived.",
      href: '/work/projects/Escaping-Recognition',
      images: [
        { src: 'projects/Escaping-recognition-images/Garden from top floor ZI.jpg', alt: 'What my neighbours & flatmates see' },
        { src: 'projects/Escaping-recognition-images/Nvis escape easier to see.jpg', alt: 'Hiding from night vision with a dark umbrella' },
        { src: 'projects/Escaping-recognition-images/Cover.jpg', alt: 'How to Avoid Everything: One thing at a time pocket guide' },
        { src: 'projects/Escaping-recognition-images/Flow chart.png', alt: "What 'sees' me in my garden?" },
        { src: 'projects/Escaping-recognition-images/IMG_1.jpg', alt: 'How to Avoid Everything: One thing at a time' },
        { src: 'projects/Escaping-recognition-images/What-sees-me-in-my-garden.jpg', alt: 'This is what sees me' }
      ]
    }
  ];

  function collectFilterOptions(works) {
    var types = [];
    var keywords = [];
    works.forEach(function (work) {
      if (types.indexOf(work.type) === -1) types.push(work.type);
      work.keywords.forEach(function (k) {
        if (keywords.indexOf(k) === -1) keywords.push(k);
      });
    });
    return { types: types, keywords: keywords };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderFilterChecklist(name, values) {
    var details = el('details', 'terminal-btn filter-dropdown');
    var summary = el('summary', null, name);
    details.appendChild(summary);

    var list = el('ul', 'filter-checklist');
    values.forEach(function (value) {
      var item = el('li');
      var label = el('label');
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.filterGroup = name.toLowerCase();
      checkbox.value = value;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + value));
      item.appendChild(label);
      list.appendChild(item);
    });
    details.appendChild(list);
    return details;
  }

  function renderFilterBar(container, options) {
    var bar = el('div', 'filter-bar');

    var allBtn = el('button', 'terminal-btn filter-all-btn', 'All');
    allBtn.type = 'button';
    bar.appendChild(allBtn);

    bar.appendChild(renderFilterChecklist('Type', options.types));
    bar.appendChild(renderFilterChecklist('Keywords', options.keywords));

    container.appendChild(bar);
  }

  function renderWorkEntry(work) {
    var entry = el('div', 'work-entry border');
    entry.dataset.workId = work.id;
    entry.dataset.type = work.type;
    entry.dataset.keywords = work.keywords.join('|');

    var header = el('div', 'work-header');

    var meta = el('div', 'selected-text-box work-meta');
    var titleLink = document.createElement('a');
    titleLink.className = 'link work-title';
    titleLink.href = work.href;
    var titleP = el('p');
    titleP.appendChild(titleLink);
    titleLink.textContent = work.title;
    meta.appendChild(titleP);
    meta.appendChild(el('p', 'work-date', work.year));
    meta.appendChild(el('p', 'work-date', work.type));
    meta.appendChild(el('p', 'work-date', ' '));
    meta.appendChild(el('p', 'work-date', 'Keywords: ' + work.keywords.join(' / ')));
    meta.appendChild(el('p', 'work-date', 'Outcomes: ' + work.outcomes.join(' / ')));
    header.appendChild(meta);

    var descriptionBox = el('div', 'selected-text-box work-description');
    descriptionBox.appendChild(el('p', 'about-text', work.description));
    header.appendChild(descriptionBox);

    entry.appendChild(header);

    var carousel = el('div', 'work-carousel');
    carousel.dataset.workId = work.id;
    carousel.dataset.index = '0';
    carousel.tabIndex = 0;
    carousel.setAttribute('aria-label', work.title + ' image carousel');
    var img = document.createElement('img');
    img.src = work.images[0].src;
    img.alt = work.images[0].alt;
    carousel.appendChild(img);
    entry.appendChild(carousel);

    return entry;
  }

  function stepCarousel(carouselEl, direction) {
    var work = WORKS.filter(function (w) { return w.id === carouselEl.dataset.workId; })[0];
    if (!work) return;
    var count = work.images.length;
    var index = parseInt(carouselEl.dataset.index, 10) || 0;
    index = (index + direction + count) % count;
    carouselEl.dataset.index = String(index);
    var img = carouselEl.querySelector('img');
    img.src = work.images[index].src;
    img.alt = work.images[index].alt;
  }

  function matchesFilters(entry, activeTypes, activeKeywords) {
    if (activeTypes.size && !activeTypes.has(entry.dataset.type)) return false;
    if (activeKeywords.size) {
      var keywords = entry.dataset.keywords.split('|');
      var hasMatch = keywords.some(function (k) { return activeKeywords.has(k); });
      if (!hasMatch) return false;
    }
    return true;
  }

  function applyFilters(root) {
    var activeTypes = new Set();
    var activeKeywords = new Set();
    root.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
      if (!checkbox.checked) return;
      if (checkbox.dataset.filterGroup === 'type') activeTypes.add(checkbox.value);
      else if (checkbox.dataset.filterGroup === 'keywords') activeKeywords.add(checkbox.value);
    });

    root.querySelectorAll('.work-entry').forEach(function (entry) {
      entry.hidden = !matchesFilters(entry, activeTypes, activeKeywords);
    });
  }

  function render(root) {
    var options = collectFilterOptions(WORKS);
    renderFilterBar(root, options);

    var list = el('div', 'work-list');
    WORKS.forEach(function (work) {
      list.appendChild(renderWorkEntry(work));
    });
    root.appendChild(list);

    root.addEventListener('click', function (e) {
      var carousel = e.target.closest('.work-carousel');
      if (carousel) {
        var rect = carousel.getBoundingClientRect();
        var clickedRight = (e.clientX - rect.left) > rect.width / 2;
        stepCarousel(carousel, clickedRight ? 1 : -1);
        return;
      }

      if (e.target.closest('.filter-all-btn')) {
        root.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
          checkbox.checked = false;
        });
        root.querySelectorAll('.filter-dropdown').forEach(function (details) {
          details.open = false;
        });
        applyFilters(root);
      }
    });

    root.addEventListener('keydown', function (e) {
      var carousel = e.target.closest('.work-carousel');
      if (!carousel) return;
      if (e.key === 'ArrowRight') {
        stepCarousel(carousel, 1);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        stepCarousel(carousel, -1);
        e.preventDefault();
      }
    });

    root.addEventListener('change', function (e) {
      if (e.target.matches('input[type="checkbox"]')) applyFilters(root);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('selected-works-root');
    if (root) render(root);
  });
})();
