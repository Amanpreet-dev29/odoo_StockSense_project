/**
 * Show a modal dialog.
 *
 * `content` should be HTML created by the app, such as form fields.
 * Do not place untrusted user input directly into this HTML.
 *
 * @param {Object} options
 * @param {string} options.title - Heading shown in the modal.
 * @param {string} options.content - HTML for the modal's main content.
 * @param {string} [options.submitText="Save"] - Text on the submit button.
 * @param {Function} [options.onSubmit] - Called when the form is submitted.
 * @returns {{ close: Function, element: HTMLElement }}
 */
export function showModal({
  title,
  content,
  submitText = "Save",
  onSubmit
}) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <header class="modal-head">
        <h2 id="modal-title">${escapeHtml(title)}</h2>

        <button
          class="icon-button"
          type="button"
          aria-label="Close dialog"
          data-close-modal
        >
          ×
        </button>
      </header>

      <form class="modal-form">
        <div class="modal-content">
          ${content}
        </div>

        <footer class="modal-foot">
          <button
            class="btn btn-quiet"
            type="button"
            data-close-modal
          >
            Cancel
          </button>

          <button class="btn btn-primary" type="submit">
            ${escapeHtml(submitText)}
          </button>
        </footer>
      </form>
    </section>
  `;

  document.body.append(backdrop);

  const close = () => backdrop.remove();

  backdrop.addEventListener("click", event => {
    const clickedBackdrop = event.target === backdrop;
    const clickedCloseButton = event.target.closest("[data-close-modal]");

    if (clickedBackdrop || clickedCloseButton) {
      close();
    }
  });

  backdrop.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();

    if (typeof onSubmit === "function") {
      const formData = new FormData(event.currentTarget);
      onSubmit(formData, close);
    }
  });

  return {
    close,
    element: backdrop
  };
}

/**
 * Close the first open modal, if there is one.
 */
export function closeModal() {
  document.querySelector(".modal-backdrop")?.remove();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}