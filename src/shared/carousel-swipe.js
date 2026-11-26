export function enableCarouselSwipe(surface, step) {
  let start;

  surface.addEventListener('dragstart', event => event.preventDefault());

  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary) {
      start = undefined;
      return;
    }
    if (event.button !== 0) return;

    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    surface.setPointerCapture(event.pointerId);
  });

  surface.addEventListener('pointerup', event => {
    if (start?.id !== event.pointerId) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = undefined;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      step(dx < 0 ? 1 : -1);
    }
  });

  function cancel(event) {
    if (start?.id === event.pointerId) start = undefined;
  }

  surface.addEventListener('pointercancel', cancel);
  surface.addEventListener('lostpointercapture', cancel);
}
