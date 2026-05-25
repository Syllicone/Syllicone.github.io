(function () {
  const form = document.querySelector('.submission-form');
  if (!form) return;

  const accessKey = window.IDO_WEB3FORMS_ACCESS_KEY || '';
  const successEl = document.getElementById('submission-success');
  const errorEl = document.getElementById('submission-error');
  const submitBtn = form.querySelector('.submission-button');

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
    if (successEl) successEl.hidden = true;
  }

  function showSuccess() {
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = false;
    form.reset();
    const captcha = form.querySelector('.h-captcha');
    if (captcha && window.hcaptcha) window.hcaptcha.reset();
  }

  if (!accessKey) {
    showError('Form is not set up yet. Add your Web3Forms access key in js/ido-form-config.js (get one free at web3forms.com).');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  if (new URLSearchParams(window.location.search).get('submitted') === 'true') {
    showSuccess();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const captchaResponse = form.querySelector('textarea[name="h-captcha-response"]');
    if (!captchaResponse || !captchaResponse.value) {
      showError('Please complete the captcha before submitting.');
      return;
    }

    if (errorEl) errorEl.hidden = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    const payload = {
      access_key: accessKey,
      subject: 'IDO submission',
      from_name: 'IDO submission form',
      name: form.elements.namedItem('name').value,
      email: form.elements.namedItem('email').value,
      subject_line: form.elements.namedItem('subject').value,
      proposal: form.elements.namedItem('proposal').value,
      'h-captcha-response': captchaResponse.value,
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccess();
        history.replaceState(null, '', window.location.pathname);
      } else {
        showError(result.message || 'Something went wrong. Please try again in a moment.');
      }
    } catch {
      showError('Could not reach the form service. Check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit proposal';
      }
    }
  });
})();
