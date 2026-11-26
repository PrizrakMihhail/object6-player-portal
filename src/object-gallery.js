const grid = document.querySelector('.gallery-grid');
const photos = [...grid.querySelectorAll('a')];
const preview = document.querySelector('.gallery-preview');
const image = preview.querySelector('figure img');
const caption = preview.querySelector('figcaption');
const position = preview.querySelector('[role="status"]');
const slideshow = preview.querySelector('.gallery-slideshow');
let current = 0;
let opener;
let timer;

function setSlideshow(active) {
  clearTimeout(timer);
  slideshow.setAttribute('aria-pressed', String(active));
  if (active) timer = setTimeout(() => {
    if (preview.open) show(current + 1);
  }, 30000);
}

function show(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];
  const description = photo.firstElementChild.alt;
  image.src = photo.href;
  image.alt = description;
  caption.textContent = description;
  position.textContent = `${current + 1} / ${photos.length}`;
  if (slideshow.getAttribute('aria-pressed') === 'true') setSlideshow(true);
}

slideshow.addEventListener('click', () => setSlideshow(slideshow.getAttribute('aria-pressed') !== 'true'));

grid.addEventListener('click', event => {
  const photo = event.target.closest('a');
  if (!photo || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  opener = photo;
  setSlideshow(false);
  show(photos.indexOf(photo));
  preview.showModal();
});

preview.addEventListener('click', event => {
  const control = event.target.closest('[data-step]');
  if (control) show(current + Number(control.dataset.step));
});

preview.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  show(current + (event.key === 'ArrowLeft' ? -1 : 1));
});

preview.addEventListener('close', () => {
  if (preview.open) return;
  setSlideshow(false);
  opener.focus({ preventScroll: true });
});
