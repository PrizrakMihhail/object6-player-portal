const grid = document.querySelector('.faction-grid');

grid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-faction]');
  if (!card) return;

  const dossier = document.getElementById(card.dataset.faction);
  dossier.showModal();
  dossier.addEventListener('close', () => card.focus({ preventScroll: true }), { once: true });
});
