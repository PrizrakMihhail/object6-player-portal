const grid = document.querySelector('.gallery-grid');
const photos = [...grid.querySelectorAll('a')];
const preview = document.querySelector('.gallery-preview');
const image = preview.querySelector('figure img');
const caption = preview.querySelector('figcaption');
const position = preview.querySelector('[role="status"]');
let current = 0;
let opener;

function show(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];
  const description = photo.firstElementChild.alt;
  image.src = photo.href;
  image.alt = description;
  caption.textContent = description;
  position.textContent = `${current + 1} / ${photos.length}`;
}

grid.addEventListener('click', event => {
  const photo = event.target.closest('a');
  if (!photo || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  opener = photo;
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

preview.addEventListener('close', () => opener.focus({ preventScroll: true }));
