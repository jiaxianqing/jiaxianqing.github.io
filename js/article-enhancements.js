/* Plant IDEA Lab article utilities: native sharing, copy link and accessible figure zoom.
   No external libraries. Loaded only on News and Projects detail pages. */
(() => {
  'use strict';

  const shareArea = document.querySelector('[data-lab-article-share]');
  if (shareArea) {
    const url = shareArea.dataset.shareUrl || window.location.href;
    const title = shareArea.dataset.shareTitle || document.title;
    const feedback = shareArea.querySelector('[data-lab-share-feedback]');
    let feedbackTimer = null;

    function showFeedback(message) {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.classList.toggle('is-visible', Boolean(message));
      if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
      if (message) feedbackTimer = window.setTimeout(() => {
        feedback.textContent = '';
        feedback.classList.remove('is-visible');
      }, 3200);
    }

    async function copyLink() {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          showFeedback('Link copied');
          return;
        }
      } catch (_error) { /* Try the legacy fallback below. */ }
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(field);
      field.focus();
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (_error) { /* No copy support. */ }
      field.remove();
      showFeedback(copied ? 'Link copied' : 'Could not copy. Please copy the address from your browser.');
    }

    shareArea.querySelector('[data-lab-copy-link]')?.addEventListener('click', copyLink);
    shareArea.querySelector('[data-lab-share]')?.addEventListener('click', async () => {
      if (typeof navigator.share !== 'function') { await copyLink(); return; }
      try {
        await navigator.share({ title, url });
      } catch (error) {
        if (error && error.name === 'AbortError') return; // User closed the native share sheet.
        await copyLink();
      }
    });
  }

  // Only independent article figures; existing .lab-carousel galleries and linked images
  // retain their original navigation and click behavior.
  const figures = Array.from(document.querySelectorAll(
    '.post-single .article-content img, .project-single .article-content img, .project-single .single-feature-image img'
  )).filter(img => !img.closest('a, .lab-carousel, .gallery-slider, [data-no-lightbox]'));
  if (!figures.length || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lab-figure-lightbox';
  dialog.setAttribute('aria-label', 'Enlarged research image');
  dialog.innerHTML = `
    <div class="lab-figure-panel">
      <button type="button" class="lab-figure-close" data-lightbox-close aria-label="Close image">&times;</button>
      <div class="lab-figure-stage">
        <button type="button" class="lab-figure-arrow lab-figure-prev" data-lightbox-prev aria-label="Previous image">&#8249;</button>
        <img data-lightbox-image alt="">
        <button type="button" class="lab-figure-arrow lab-figure-next" data-lightbox-next aria-label="Next image">&#8250;</button>
      </div>
      <div class="lab-figure-caption"><span data-lightbox-caption></span><span data-lightbox-counter></span></div>
    </div>`;
  document.body.appendChild(dialog);

  const enlarged = dialog.querySelector('[data-lightbox-image]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const counter = dialog.querySelector('[data-lightbox-counter]');
  const prev = dialog.querySelector('[data-lightbox-prev]');
  const next = dialog.querySelector('[data-lightbox-next]');
  const close = dialog.querySelector('[data-lightbox-close]');
  if (figures.length <= 1) { prev.hidden = true; next.hidden = true; }
  let current = 0;
  let openedFrom = null;
  let touchX = null;

  function showImage(index) {
    current = (index + figures.length) % figures.length;
    const source = figures[current];
    enlarged.src = source.currentSrc || source.src;
    enlarged.alt = source.alt || 'Research figure';
    const description = (source.alt || '').trim();
    caption.textContent = description || 'Research figure';
    counter.textContent = figures.length > 1 ? `${current + 1} / ${figures.length}` : '';
  }

  function openImage(index) {
    if (typeof dialog.showModal !== 'function') return;
    openedFrom = figures[index];
    showImage(index);
    if (!dialog.open) dialog.showModal();
    close.focus();
  }

  figures.forEach((img, index) => {
    img.dataset.labZoom = 'true';
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-label', `Enlarge ${img.alt || 'research figure'}`);
    img.addEventListener('click', () => openImage(index));
    img.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImage(index);
      }
    });
  });
  close.addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => showImage(current - 1));
  next.addEventListener('click', () => showImage(current + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && figures.length > 1) { event.preventDefault(); showImage(current - 1); }
    if (event.key === 'ArrowRight' && figures.length > 1) { event.preventDefault(); showImage(current + 1); }
  });
  dialog.addEventListener('touchstart', event => {
    touchX = event.changedTouches[0]?.screenX ?? null;
  }, { passive: true });
  dialog.addEventListener('touchend', event => {
    if (touchX === null || figures.length <= 1) return;
    const delta = (event.changedTouches[0]?.screenX ?? touchX) - touchX;
    touchX = null;
    if (Math.abs(delta) > 55) showImage(current + (delta < 0 ? 1 : -1));
  }, { passive: true });
  dialog.addEventListener('close', () => {
    enlarged.removeAttribute('src');
    if (openedFrom?.isConnected) openedFrom.focus();
    openedFrom = null;
  });
})();
