(function () {
  function getBasePath() {
    return window.location.pathname.indexOf('/Portfolio_2_Mock/') !== -1 ? '/Portfolio_2_Mock' : '';
  }

  var _dachshundEl = null;

  window._dachshundStart = function () {
    if (_dachshundEl) return;
    var img = document.createElement('img');
    img.id = 'dachshund-overlay';
    img.src = getBasePath() + '/extra/assets/dachshund/dachshund.gif';
    img.style.cssText = 'position:fixed;bottom:0;right:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(img);
    _dachshundEl = img;
  };

  window._dachshundStop = function () {
    if (_dachshundEl) {
      _dachshundEl.remove();
      _dachshundEl = null;
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  // About heading grow effect - toggle on hover
  const heading = document.querySelector('.about-heading');
  if (heading) {
    heading.addEventListener('mouseenter', () => {
      heading.classList.toggle('grown');
    });
  }
  
  // Media grid expand functionality
  const entries = document.querySelectorAll('.entry');
  if (entries.length > 0) {
    entries.forEach((entry, index) => {
      entry.addEventListener('click', (e) => {
        e.stopPropagation();
        entries.forEach(e => e.classList.remove('expanded', 'expanded-left', 'expanded-right'));
        entry.classList.add('expanded');
        if (index % 2 === 0) {
          entry.classList.add('expanded-right');
        } else {
          entry.classList.add('expanded-left');
        }
      });
    });
    
    document.addEventListener('click', () => {
      entries.forEach(e => e.classList.remove('expanded', 'expanded-left', 'expanded-right'));
    });
  }
});
