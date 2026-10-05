// Selected Works page behaviour only — the works themselves are plain HTML
// blocks in work/portfolio.html (.work-entry, copy one to add a new work).
// This script wires up click/keyboard navigation for each .work-carousel's
// <img> set. Filtering is handled separately by js/filter.js.
(function () {
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
    document.querySelectorAll('.work-carousel').forEach(initCarousel);
  });
})();
