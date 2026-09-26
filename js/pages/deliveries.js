import { operationsService } from "../services/operations.service.js";
import { escapeHtml, formatNumber, formatStatus } from "../utils/format.js";

/**
 * Build the delivery orders page.
 */
export async function renderDeliveriesPage() {
  const deliveries = await operationsService.list({ type: "delivery" });

  return `
    <section class="page-heading">
      <div>
        <h1>Delivery orders</h1>
        <p>Pick, pack, and ship stock to your customers.</p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        data-action="create-delivery"
      >
        ＋ New delivery
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Outgoing deliveries</h2>
          <span class="muted">${deliveries.length} delivery orders</span>
        </div>

        <select class="control" id="delivery-status-filter">
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
              <th>CUSTOMER / DETAILS</th>
              <th>PRODUCT</th>
              <th>QUANTITY</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>STATUS</th>
              <th>CREATED</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="delivery-table">
            ${
              deliveries.length
                ? deliveries.map(renderDeliveryRow).join("")
                : emptyTableRow("No delivery orders yet.")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach page controls after rendering.
 */
export function attachDeliveriesPageEvents() {
  document
    .querySelector("#delivery-status-filter")
    ?.addEventListener("change", filterDeliveries);

  document
    .querySelector('[data-action="create-delivery"]')
    ?.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:create-operation", {
          detail: { type: "delivery" }
        })
      );
    });

  document.querySelectorAll("[data-validate-delivery]").forEach(button => {
    button.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("stocksense:validate-operation", {
          detail: {
            reference: button.dataset.validateDelivery
          }
        })
      );
    });
  });
}

function renderDeliveryRow(delivery) {
  const canValidate =
    delivery.status !== "done" &&
    delivery.status !== "cancelled";

  return `
    <tr data-status="${escapeHtml(delivery.status)}">
      <td class="mono">
        <strong>${escapeHtml(delivery.reference)}</strong>
      </td>

      <td>
        ${escapeHtml(
          delivery.description ||
          delivery.partner ||
          "Delivery"
        )}
      </td>

      <td>
        ${escapeHtml(delivery.productName || "—")}
      </td>

      <td>
        ${formatNumber(delivery.quantity)}
      </td>

      <td>
        ${escapeHtml(delivery.warehouse || "—")}
        <span class="muted">
          · ${escapeHtml(delivery.location || "—")}
        </span>
      </td>

      <td>
        ${renderStatusBadge(delivery.status)}
      </td>

      <td>
        ${escapeHtml(delivery.createdAt || "—")}
      </td>

      <td>
        ${
          canValidate
            ? `
              <button
                class="btn btn-outline"
                type="button"
                data-validate-delivery="${escapeHtml(delivery.reference)}"
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

function filterDeliveries(event) {
  const selectedStatus = event.currentTarget.value;

  document
    .querySelectorAll("#delivery-table tr[data-status]")
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