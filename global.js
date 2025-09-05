/* global.js - Lenis smooth scrolling and page transition effects */

import Lenis from 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.23/bundled/lenis.min.js';

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => t * (2 - t),
  smoothWheel: true,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Page transition effects
document.body.classList.add('fade-in');

const links = document.querySelectorAll('a[href]:not([target="_blank"])');
links.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const href = link.getAttribute('href');

    document.body.classList.remove('fade-in');
    document.body.classList.add('fade-out');

    setTimeout(() => {
      window.location.href = href;
    }, 500);
  });
});

// Add fade-in class on page load
window.addEventListener('pageshow', () => {
  document.body.classList.remove('fade-out');
  document.body.classList.add('fade-in');
});
