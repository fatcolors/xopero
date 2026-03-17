/* ================================================================
   GitProtect Case Study — Presentation Engine v2
   ================================================================ */

(function () {
  'use strict';

  /* ---- DOM References ---- */
  const deck         = document.getElementById('deck');
  const slides       = Array.from(deck.querySelectorAll('.slide'));
  const btnPrev      = document.getElementById('btnPrev');
  const btnNext      = document.getElementById('btnNext');
  const counter      = document.getElementById('counter');
  const progressFill = document.getElementById('progressFill');
  const canvas       = document.getElementById('dotsCanvas');
  const ctx          = canvas.getContext('2d');
  const totalSlides  = slides.length;

  let currentIndex = 0;
  let isAnimating  = false;

  /* ============================================================
     ANIMATED DOTS BACKGROUND
     ============================================================ */
  var GRID_SPACING = 72;
  var DOT_RADIUS = 1.2;
  var dots = [];

  function initDots() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    dots = [];
    var cols = Math.ceil(canvas.width / GRID_SPACING) + 1;
    var rows = Math.ceil(canvas.height / GRID_SPACING) + 1;
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var maxDist = Math.sqrt(cx * cx + cy * cy);
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = col * GRID_SPACING;
        var y = row * GRID_SPACING;
        // Fade: full at top-center, fading toward left/right edges and bottom
        var hFade = 1 - Math.pow(Math.abs(x - cx) / cx, 2);        // horizontal: smooth quadratic
        var vFade = Math.max(0, 1 - (y / canvas.height) * 1.2);    // vertical: fade toward bottom
        var fade = Math.max(0, hFade) * vFade;
        if (fade <= 0) continue;
        dots.push({
          x: x,
          y: y,
          baseAlpha: 0.125 * fade,
          alpha: 0.125 * fade,
          targetAlpha: 0.125 * fade,
          fade: fade,
          blinkTimer: Math.random() * 600,
          nextBlink: 300 + Math.random() * 800,
        });
      }
    }
  }

  function animateDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.blinkTimer++;
      if (d.blinkTimer >= d.nextBlink) {
        d.targetAlpha = d.baseAlpha + (0.075 + Math.random() * 0.125) * d.fade;
        d.blinkTimer  = 0;
        d.nextBlink   = 300 + Math.random() * 900;
      }
      d.alpha += (d.targetAlpha - d.alpha) * 0.03;
      if (Math.abs(d.alpha - d.targetAlpha) < 0.003) {
        d.targetAlpha = d.baseAlpha;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(141, 149, 175, ' + d.alpha + ')';
      ctx.fill();
    }
    requestAnimationFrame(animateDots);
  }

  window.addEventListener('resize', function () {
    initDots();
  });

  initDots();
  animateDots();

  /* ============================================================
     SLIDE NAVIGATION
     ============================================================ */
  function init() {
    const hash = window.location.hash;
    if (hash) {
      const match = hash.match(/slide-(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < totalSlides) currentIndex = idx;
      }
    }
    slides[currentIndex].classList.add('slide--active');
    updateUI();
    initImageSlots();
  }

  function goTo(index, direction) {
    if (isAnimating || index === currentIndex || index < 0 || index >= totalSlides) return;
    isAnimating = true;

    const prev = slides[currentIndex];
    const next = slides[index];

    if (direction === undefined) {
      direction = index > currentIndex ? 'next' : 'prev';
    }

    const exitClass = direction === 'next' ? 'slide--exit-left' : 'slide--exit-right';

    // Prepare incoming slide
    next.style.transition = 'none';
    next.classList.remove('slide--exit-left', 'slide--exit-right');
    next.style.transform = direction === 'next'
      ? 'translateX(60px) scale(0.97)'
      : 'translateX(-60px) scale(0.97)';
    next.style.opacity = '0';
    next.classList.add('slide--active');

    void next.offsetWidth; // force reflow

    next.style.transition = '';
    next.style.transform  = '';
    next.style.opacity    = '';

    prev.classList.remove('slide--active');
    prev.classList.add(exitClass);

    currentIndex = index;
    updateUI();

    const cleanup = function () {
      prev.classList.remove(exitClass);
      prev.style.transform = '';
      prev.style.opacity   = '';
      isAnimating = false;
      prev.removeEventListener('transitionend', cleanup);
    };

    prev.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(function () { if (isAnimating) cleanup(); }, 500);
  }

  function goNext()  { goTo(currentIndex + 1, 'next'); }
  function goPrev()  { goTo(currentIndex - 1, 'prev'); }
  function goFirst() { goTo(0, 'prev'); }
  function goLast()  { goTo(totalSlides - 1, 'next'); }

  /* ---- UI Updates ---- */
  function updateUI() {
    const num = String(currentIndex + 1).padStart(2, '0');
    counter.textContent  = `${num} / ${String(totalSlides).padStart(2, '0')}`;
    btnPrev.disabled     = currentIndex === 0;
    btnNext.disabled     = currentIndex === totalSlides - 1;
    progressFill.style.width = `${((currentIndex + 1) / totalSlides) * 100}%`;

    const slideId = `slide-${num}`;
    if (window.location.hash !== `#${slideId}`) {
      history.replaceState(null, '', `#${slideId}`);
    }

    const bar = document.querySelector('.progress-bar');
    if (bar) bar.setAttribute('aria-valuenow', currentIndex + 1);
  }

  /* ---- Events ---- */
  btnNext.addEventListener('click', goNext);
  btnPrev.addEventListener('click', goPrev);

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); goNext(); break;
      case 'ArrowLeft':  case 'ArrowUp':   e.preventDefault(); goPrev(); break;
      case 'Home': e.preventDefault(); goFirst(); break;
      case 'End':  e.preventDefault(); goLast();  break;
    }
  });

  window.addEventListener('hashchange', function () {
    const match = window.location.hash.match(/slide-(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < totalSlides && idx !== currentIndex) goTo(idx);
    }
  });

  /* ---- Image Placeholders ---- */
  function initImageSlots() {
    document.querySelectorAll('.image-slot').forEach(function (slot) {
      const src   = slot.getAttribute('data-src');
      const label = slot.getAttribute('data-label') || 'Wizualizacja';
      const ratio = slot.getAttribute('data-ratio') || '16:9';

      if (!src) { renderPlaceholder(slot, '', label, ratio); return; }

      const img = new Image();
      img.alt = label;
      img.onload = function () {
        slot.innerHTML = '';
        slot.appendChild(img);
        slot.classList.add('image-slot--loaded');
      };
      img.onerror = function () { renderPlaceholder(slot, src, label, ratio); };
      img.src = src;
    });
  }

  function renderPlaceholder(slot, filename, label, ratio) {
    slot.innerHTML = `
      <div class="image-slot__placeholder">
        <div class="image-slot__placeholder-icon">&#9633;</div>
        ${filename ? `<span class="image-slot__placeholder-file">${filename}</span>` : ''}
        <span class="image-slot__placeholder-label">${label}</span>
        <span class="image-slot__placeholder-ratio">${ratio}</span>
      </div>`;
  }

  /* ---- Lightbox ---- */
  const lightbox        = document.getElementById('lightbox');
  const lightboxImg     = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose   = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxCaption.textContent = alt || '';
    lightbox.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('lightbox--open');
    document.body.style.overflow = '';
    setTimeout(function () { lightboxImg.src = ''; }, 250);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) {
      closeLightbox();
    }
  });

  // Attach click handlers to all loaded images
  document.addEventListener('click', function (e) {
    var slot = e.target.closest('.image-slot--loaded');
    if (!slot) return;
    var img = slot.querySelector('img');
    if (img) openLightbox(img.src, img.alt);
  });

  /* ---- Boot ---- */
  init();
})();
