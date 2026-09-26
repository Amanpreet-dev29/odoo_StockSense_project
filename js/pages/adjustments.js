import { operationsService } from "../services/operations.service.js";
import { escapeHtml, formatNumber, formatStatus } from "../utils/format.js";

/**
 * Build the inventory adjustments page.
 */
export async function renderAdjustmentsPage() {
  const adjustments = await operationsService.list({ type: "adjustment" });

  return `
    <section class="page-heading">
      <div>
        <h1>Inventory adjustments</h1>
        <p>Compare recorded quantities with physical stock counts.</p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        data-action="create-adjustment"
      >
        ＋ New adjustment
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Stock count corrections</h2>
          <span class="muted">${adjustments.length} adjustments</span>
        </div>

        <select class="control" id="adjustment-status-filter">
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
              <th>COUNTED QUANTITY</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>NOTES</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="adjustment-table">
            ${
              adjustments.length
                ? adjustments.map(renderAdjustmentRow).join("")
                : emptyTableRow("No inventory adjustments yet.")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach adjustment page controls after rendering.
 */
export function attachAdjustmentsPageEvents() {
  document
    .querySelector("#adjustment-status-filter")
    ?.addEventListener("change", filterAdjustments);

  document
    .querySelector('[data-action="create-adjustment"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:create-operation", {
          detail: { type: "adjustment" }
        })
      );
    });

  document.querySelectorAll("[data-validate-adjustment]").forEach(button => {
    button.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:validate-operation", {
          detail: {
            reference: button.dataset.validateAdjustment
          }
        })
      );
    });
  });
}

function renderAdjustmentRow(adjustment) {
  const canValidate =
    adjustment.status !== "done" &&
    adjustment.status !== "cancelled";

  return `
    <tr data-status="${escapeHtml(adjustment.status)}">
      <td class="mono">
        <strong>${escapeHtml(adjustment.reference)}</strong>
      </td>

      <td>
        ${escapeHtml(adjustment.productName || "—")}
      </td>

      <td>
        ${formatNumber(adjustment.quantity)}
      </td>

      <td>
        ${escapeHtml(adjustment.warehouse || "—")}
        <span class="muted">
          · ${escapeHtml(adjustment.location || "—")}
        </span>
      </td>

      <td>
        ${escapeHtml(
          adjustment.description ||
          adjustment.partner ||
          "—"
        )}
      </td>

      <td>
        ${renderStatusBadge(adjustment.status)}
      </td>

      <td>
        ${escapeHtml(adjustment.createdAt || "—")}
      </td>

      <td>
        ${
          canValidate
            ? `
              <button
                class="btn btn-outline"
                type="button"
                data-validate-adjustment="${escapeHtml(adjustment.reference)}"
              >
                Validate
              </button>
            `
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

function filterAdjustments(event) {
  const selectedStatus = event.currentTarget.value;

  document
    .querySelectorAll("#adjustment-table tr[data-status]")
    .forEach(row => {
      row.hidden =
        selectedStatus !== "all" &&
        row.dataset.status !== selectedStatus;
    });
}

function emptyTableRow(message) {
  return `
    <tr>
      <td colspan="8" class="empty">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}