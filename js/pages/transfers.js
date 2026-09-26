import { operationsService } from "../services/operations.service.js";
import { escapeHtml, formatNumber, formatStatus } from "../utils/format.js";

/**
 * Build the internal transfers page.
 */
export function renderTransfersPage() {
  const transfers = operationsService.list({ type: "transfer" });

  return `
    <section class="page-heading">
      <div>
        <h1>Internal transfers</h1>
        <p>Move stock between warehouses and locations.</p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        data-action="create-transfer"
      >
        ＋ New transfer
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Transfer history</h2>
          <span class="muted">${transfers.length} transfers</span>
        </div>

        <select class="control" id="transfer-status-filter">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>PRODUCT</th>
              <th>QUANTITY</th>
              <th>SOURCE</th>
              <th>DESTINATION</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="transfer-table">
            ${
              transfers.length
                ? transfers.map(renderTransferRow).join("")
                : emptyTableRow("No internal transfers yet.")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach transfer page controls after rendering.
 */
export function attachTransfersPageEvents() {
  document
    .querySelector("#transfer-status-filter")
    ?.addEventListener("change", filterTransfers);

  document
    .querySelector('[data-action="create-transfer"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:create-operation", {
        detail: { type: "transfer" }
      }));
    });

  document.querySelectorAll("[data-validate-transfer]").forEach(button => {
    button.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:validate-operation", {
        detail: { reference: button.dataset.validateTransfer }
      }));
    });
  });
}

function renderTransferRow(transfer) {
  const canValidate =
    transfer.status !== "done" &&
    transfer.status !== "cancelled";

  const source =
    `${transfer.warehouse || "—"} · ${transfer.location || "—"}`;

  const destination =
    `${transfer.destinationWarehouse || transfer.warehouse || "—"} · ` +
    `${transfer.destinationLocation || "—"}`;

  return `
    <tr data-status="${escapeHtml(transfer.status)}">
      <td class="mono"><strong>${escapeHtml(transfer.reference)}</strong></td>
      <td>${escapeHtml(transfer.productName)}</td>
      <td>${formatNumber(transfer.quantity)}</td>
      <td>${escapeHtml(source)}</td>
      <td>${escapeHtml(destination)}</td>
      <td>${renderStatusBadge(transfer.status)}</td>
      <td>${escapeHtml(transfer.createdAt || "—")}</td>
      <td>
        ${
          canValidate
            ? `<button
                class="btn btn-outline"
                type="button"
                data-validate-transfer="${escapeHtml(transfer.reference)}"
              >
                Validate
              </button>`
            : "—"
        }
      </td>
    </tr>
  `;
}

function renderStatusBadge(status) {
  return `
    <span class="badge badge-${escapeHtml(status)}">
      ${escapeHtml(formatStatus(status))}
    </span>
  `;
}

function filterTransfers(event) {
  const selectedStatus = event.currentTarget.value;

  document.querySelectorAll("#transfer-table tr[data-status]").forEach(row => {
    row.hidden =
      selectedStatus !== "all" &&
      row.dataset.status !== selectedStatus;
  });
}

function emptyTableRow(message) {
  return `
    <tr>
      <td colspan="8" class="empty">${message}</td>
    </tr>
  `;
}