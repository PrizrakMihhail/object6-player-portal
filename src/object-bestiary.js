document.querySelector('.bestiary').addEventListener('click', event => {
  const button = event.target.closest('button[data-dossier]');
  if (button) document.getElementById(button.dataset.dossier).showModal();
});
