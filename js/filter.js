// Reusable filter bar for any page of tagged items. The items themselves are
// plain HTML; put an empty placeholder where the bar should go, whose value
// is a selector for the items it filters:
//
//   <div data-filter-items=".work-entry"></div>
//   <div class="work-entry" data-year="2026" data-type="PROJECT"
//        data-keywords="Technology / Interaction"> ... </div>
//
// A dropdown is built for each tag in DEFAULT_FACETS that at least one item
// actually has, so a page only shows the filters that apply to it. To pick
// different tags (or reorder them) for one bar: data-facets="year material".
// Any tag can hold several values separated by " / ".
//
// Ticked options within one category combine as OR, categories combine as AND.
// Counts are live: each option shows how many items you'd see with it ticked
// too, given what's ticked in the *other* categories. Options at 0 dim out.
//
// Opening a category lays its options out inline, right after its label,
// pushing the later categories across (wrapping like text when long).
(function () {
  var DEFAULT_FACETS = 'year type keywords material location size';
  var SLIDE_MS = 200;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function splitList(value) {
    return (value || '').split('/').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // "made-in" -> "Made in"
  function facetLabel(name) {
    var label = name.replace(/-/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // FLIP: note where every label/option sits, run `change` (which opens or
  // closes option lists), then animate each one from its old spot to its new
  // one, so later categories glide across instead of jumping. The bar's
  // height eases too, so the content below doesn't jump when a line wraps.
  function animateLayout(bar, change) {
    function parts() {
      return Array.prototype.slice.call(bar.querySelectorAll('.filter-trigger, .filter-checklist li'));
    }
    var before = new Map();
    parts().forEach(function (node) { before.set(node, node.getBoundingClientRect()); });
    var oldHeight = bar.offsetHeight;

    // A quick second click can land mid-slide: stop the previous slide (but
    // not CSS transitions like the triangle) so new positions are measured
    // without its transforms. `before` above already captured where things
    // visibly were, so the new slide carries on from there.
    if (bar.getAnimations) {
      bar.getAnimations({ subtree: true }).forEach(function (a) {
        if (!a.transitionProperty) a.cancel();
      });
    }

    change();

    if (!bar.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var timing = { duration: SLIDE_MS, easing: 'ease' };

    parts().forEach(function (node) {
      var to = node.getBoundingClientRect();
      if (!to.width) return; // just closed
      var from = before.get(node);
      if (!from.width) { // just opened
        node.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], timing);
        return;
      }
      var dx = from.left - to.left;
      var dy = from.top - to.top;
      if (dx || dy) {
        node.animate([{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'none' }], timing);
      }
    });

    var newHeight = bar.offsetHeight;
    if (newHeight !== oldHeight) {
      bar.animate([
        { height: oldHeight + 'px', overflow: 'hidden' },
        { height: newHeight + 'px', overflow: 'hidden' }
      ], timing);
    }
  }

  function initFilterBar(root) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(root.dataset.filterItems));
    if (!nodes.length) return;

    // Read every item's tags once up front.
    var candidates = (root.dataset.facets || DEFAULT_FACETS).split(/\s+/).filter(Boolean);
    var items = nodes.map(function (node) {
      var values = {};
      candidates.forEach(function (f) { values[f] = splitList(node.getAttribute('data-' + f)); });
      return { el: node, values: values };
    });

    var facets = candidates.filter(function (f) {
      return items.some(function (item) { return item.values[f].length; });
    });
    if (!facets.length) return;

    var bar = el('div', 'filter-bar');
    var allBtn = el('button', 'filter-trigger filter-all-btn', 'All');
    allBtn.type = 'button';
    bar.appendChild(allBtn);

    // One entry per checkbox, so update() can refresh its count/disabled state.
    var options = [];

    facets.forEach(function (facet) {
      var values = []; // first-seen order, i.e. page order
      items.forEach(function (item) {
        item.values[facet].forEach(function (v) {
          if (values.indexOf(v) === -1) values.push(v);
        });
      });

      // Label button and its option list sit side by side in the bar; the
      // list is display:contents, so each option flows inline after it.
      var toggle = el('button', 'filter-trigger filter-toggle', facetLabel(facet));
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      var list = el('ul', 'filter-checklist');
      list.hidden = true;

      values.forEach(function (value) {
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.value = value;
        var count = el('span', 'filter-count');
        var label = el('label');
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + value + ' '));
        label.appendChild(count);
        var li = el('li');
        li.appendChild(label);
        list.appendChild(li);
        options.push({ facet: facet, value: value, input: input, count: count });
      });

      bar.appendChild(toggle);
      bar.appendChild(list);
    });

    var status = el('p', 'filter-status');
    status.setAttribute('aria-live', 'polite');

    root.appendChild(bar);
    root.appendChild(status);

    // An item passes if, for every facet with something ticked, it has at
    // least one of the ticked values. `skip` ignores one facet's selections.
    function matches(item, active, skip) {
      return facets.every(function (f) {
        return f === skip || !active[f].size ||
          item.values[f].some(function (v) { return active[f].has(v); });
      });
    }

    function update() {
      var active = {};
      facets.forEach(function (f) { active[f] = new Set(); });
      options.forEach(function (o) { if (o.input.checked) active[o.facet].add(o.value); });

      var shown = 0;
      items.forEach(function (item) {
        item.el.hidden = !matches(item, active);
        if (!item.el.hidden) shown++;
      });

      // Count each facet against the other facets' selections only, so
      // ticking one option doesn't zero out its siblings in the same dropdown.
      var counts = {};
      facets.forEach(function (f) {
        counts[f] = {};
        items.forEach(function (item) {
          if (!matches(item, active, f)) return;
          item.values[f].forEach(function (v) { counts[f][v] = (counts[f][v] || 0) + 1; });
        });
      });

      options.forEach(function (o) {
        var n = counts[o.facet][o.value] || 0;
        o.count.textContent = '(' + n + ')';
        o.input.disabled = !n && !o.input.checked; // a ticked option can always be unticked
      });

      status.textContent = 'Showing ' + shown + ' of ' + items.length;
    }

    bar.addEventListener('change', update);

    bar.addEventListener('click', function (e) {
      var toggle = e.target.closest('.filter-toggle');
      if (toggle) {
        animateLayout(bar, function () {
          var list = toggle.nextElementSibling;
          list.hidden = !list.hidden;
          toggle.setAttribute('aria-expanded', String(!list.hidden));
        });
      } else if (e.target === allBtn) {
        animateLayout(bar, function () {
          options.forEach(function (o) { o.input.checked = false; });
          bar.querySelectorAll('.filter-toggle').forEach(function (t) {
            t.setAttribute('aria-expanded', 'false');
            t.nextElementSibling.hidden = true;
          });
          update();
        });
      }
    });

    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-filter-items]').forEach(initFilterBar);
  });
})();
