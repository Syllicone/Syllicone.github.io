// Gallery lightbox behaviour only — the images themselves are plain HTML.
// Any element marked data-gallery turns its <img>s into one gallery:
//
//   <div class="archive-images" data-gallery>
//     <img src="objects/lamp/1.jpg"> <img src="objects/lamp/2.jpg">
//   </div>
//
// Clicking a thumbnail opens it full size; clicking the right/left half of
// the big image (or ArrowRight/ArrowLeft) steps through that gallery only,
// looping round. Esc or a click outside the image closes it. On the Object
// Archive the caption also picks up the object's title.
(function () {
  // Same half-split as js/carousel.js: toggles the left/right-arrow cursor
  // class to match which half of the image the pointer is over.
  function updateCursorHalf(img, clientX) {
    var rect = img.getBoundingClientRect();
    var overRight = (clientX - rect.left) > rect.width / 2;
    img.classList.toggle('cursor-next', overRight);
    img.classList.toggle('cursor-prev', !overRight);
    return overRight;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var galleries = document.querySelectorAll('[data-gallery]');
    if (!galleries.length) return;

    var dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    var big = document.createElement('img');
    var caption = document.createElement('p');
    caption.className = 'lightbox-caption';
    dialog.appendChild(big);
    dialog.appendChild(caption);
    document.body.appendChild(dialog);

    var images = []; // the open gallery's thumbnails
    var index = 0;
    var title = '';

    function show(i) {
      index = (i + images.length) % images.length;
      var thumb = images[index];
      big.src = thumb.currentSrc || thumb.src;
      big.alt = thumb.alt;
      var count = images.length > 1 ? (index + 1) + ' / ' + images.length : '';
      caption.textContent = [title, count].filter(Boolean).join(' — ');
    }

    function step(direction) {
      if (images.length > 1) show(index + direction);
    }

    galleries.forEach(function (gallery) {
      gallery.addEventListener('click', function (e) {
        if (e.target.tagName !== 'IMG') return;
        images = Array.prototype.slice.call(gallery.querySelectorAll('img'));
        var titleEl = gallery.closest('.archive-object');
        titleEl = titleEl && titleEl.querySelector('.archive-title');
        title = titleEl ? titleEl.textContent.trim() : '';
        big.className = ''; // no arrows until the pointer is over it
        show(images.indexOf(e.target));
        dialog.showModal();
      });
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === big) {
        if (images.length > 1) step(updateCursorHalf(big, e.clientX) ? 1 : -1);
      } else if (e.target === dialog) {
        dialog.close();
      }
    });

    big.addEventListener('mousemove', function (e) {
      if (images.length > 1) updateCursorHalf(big, e.clientX);
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });
  });
})();
