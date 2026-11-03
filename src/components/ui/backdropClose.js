/**
 * Closes only when both mousedown and click land on the overlay itself, so a text
 * selection that starts inside the modal and ends on the backdrop does not close it.
 * Usage: <div className="fixed inset-0 …" {...backdropClose(onClose)}>…</div>
 */
export function backdropClose(onClose) {
  let pressedOnBackdrop = false;
  return {
    onMouseDown: (e) => { pressedOnBackdrop = e.target === e.currentTarget; },
    onClick: (e) => {
      if (pressedOnBackdrop && e.target === e.currentTarget) onClose();
      pressedOnBackdrop = false;
    },
  };
}
