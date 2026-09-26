import { operationsService } from "../services/operations.service.js";
import { escapeHtml, formatNumber, formatStatus } from "../utils/format.js";

/**
 * Build the receipts page.
 */
export function renderReceiptsPage() {
  const receipts = operationsService.list({ type: "receipt" });

  return `
    <section class="page-heading">
      <div>
        <h1>Receipts</h1>
        <p>Track incoming stock from your suppliers.</p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        data-action="create-receipt"
      >
        ＋ New receipt
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Incoming receipts</h2>
          <span class="muted">${receipts.length} receipts</span>
        </div>

        <select class="control" id="receipt-status-filter">
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
              <th>SUPPLIER / DETAILS</th>
              <th>PRODUCT</th>
              <th>QUANTITY</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="receipt-table">
            ${
              receipts.length
                ? receipts.map(renderReceiptRow).join("")
                : emptyTableRow("No receipts yet.")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach page controls after inserting the page HTML.
 */
export function attachReceiptsPageEvents() {
  document
    .querySelector("#receipt-status-filter")
    ?.addEventListener("change", filterReceipts);

  document
    .querySelector('[data-action="create-receipt"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:create-operation", {
        detail: { type: "receipt" }
      }));
    });

  document.querySelectorAll("[data-validate-receipt]").forEach(button => {
    button.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stocksense:validate-operation", {
        detail: { reference: button.dataset.validateReceipt }
      }));
    });
  });
}

function renderReceiptRow(receipt) {
  const canValidate =
    receipt.status !== "done" &&
    receipt.status !== "cancelled";

  return `
    <tr data-status="${escapeHtml(receipt.status)}">
      <td class="mono"><strong>${escapeHtml(receipt.reference)}</strong></td>
      <td>${escapeHtml(receipt.description || receipt.partner || "Receipt")}</td>
      <td>${escapeHtml(receipt.productName)}</td>
      <td>${formatNumber(receipt.quantity)}</td>
      <td>
        ${escapeHtml(receipt.warehouse)}
        <span class="muted">· ${escapeHtml(receipt.location)}</span>
      </td>
      <td>${renderStatusBadge(receipt.status)}</td>
      <td>${escapeHtml(receipt.createdAt || "—")}</td>
      <td>
        ${
          canValidate
            ? `<button
                class="btn btn-outline"
                type="button"
                data-validate-receipt="${escapeHtml(receipt.reference)}"
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
  const className = `badge badge-${status}`;

  return `
    <span class="${escapeHtml(className)}">
      ${escapeHtml(formatStatus(status))}
    </span>
  `;
}

function filterReceipts(event) {
  const selectedStatus = event.currentTarget.value;

  document.querySelectorAll("#receipt-table tr[data-status]").forEach(row => {
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