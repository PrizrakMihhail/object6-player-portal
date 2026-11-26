const grid = document.querySelector('.bestiary-grid');
let scrollRoom = 0;

grid.addEventListener('click', event => {
  const button = event.target.closest('button[data-dossier]');
  if (button) document.getElementById(button.dataset.dossier).showModal();
});

for (const gallery of document.querySelectorAll('.beast-image-slot')) {
  const slides = [...gallery.querySelectorAll('.beast-gallery img')];
  const count = gallery.querySelector('.beast-gallery-count');
  let current = 0;

  function move(direction) {
    slides[current].hidden = true;
    current = (current + direction + slides.length) % slides.length;
    slides[current].hidden = false;
    count.textContent = `${current + 1} / ${slides.length}`;
  }

  gallery.addEventListener('click', event => {
    const button = event.target.closest('button[data-slide]');
    if (button) move(Number(button.dataset.slide));
  });
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
}

grid.addEventListener('toggle', event => {
  const card = event.target;
  if (!card.matches('.beast-card')) return;
  if (!card.open) {
    if (!grid.querySelector('.beast-card[open]')) {
      scrollRoom = 0;
      grid.style.removeProperty('--bestiary-scroll-room');
    }
    return;
  }

  const { top, bottom } = card.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const fullyVisible = top >= 0 && bottom <= viewportHeight;
  const targetScroll = fullyVisible ? window.scrollY : window.scrollY + top;
  const naturalScrollLimit = document.documentElement.scrollHeight - viewportHeight - scrollRoom;
  scrollRoom = Math.max(0, Math.ceil(targetScroll - naturalScrollLimit));
  grid.style.setProperty('--bestiary-scroll-room', `${scrollRoom}px`);

  if (fullyVisible) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' });
}, true);
