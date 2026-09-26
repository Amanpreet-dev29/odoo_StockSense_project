import { inventoryService } from "../services/inventory.service.js";
import {
  escapeHtml,
  formatNumber,
  formatOperationType
} from "../utils/format.js";

/**
 * Build the move history page.
 */
export function renderMoveHistoryPage() {
  const movements = inventoryService.listMovements();

  return `
    <section class="page-heading">
      <div>
        <h1>Move history</h1>
        <p>Review stock changes across your warehouses and locations.</p>
      </div>

      <button class="btn btn-outline" type="button" data-action="print-ledger">
        Print / Export
      </button>
    </section>

    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Stock ledger</h2>
          <span class="muted">${movements.length} movements</span>
        </div>

        <div class="toolbar">
          <input
            class="control"
            id="movement-search"
            type="search"
            placeholder="Search product or location…"
          >

          <select class="control" id="movement-type-filter">
            <option value="all">All movement types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="transfer">Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TIME</th>
              <th>PRODUCT</th>
              <th>MOVEMENT</th>
              <th>QUANTITY CHANGE</th>
              <th>SOURCE</th>
              <th>DESTINATION</th>
            </tr>
          </thead>

          <tbody id="movement-table">
            ${
              movements.length
                ? movements.map(renderMovementRow).join("")
                : emptyTableRow("No stock movements have been recorded yet.")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

/**
 * Attach search, type filter, and print button events after rendering.
 */
export function attachMoveHistoryPageEvents() {
  document
    .querySelector("#movement-search")
    ?.addEventListener("input", filterMovements);

  document
    .querySelector("#movement-type-filter")
    ?.addEventListener("change", filterMovements);

  document
    .querySelector('[data-action="print-ledger"]')
    ?.addEventListener("click", () => {
      window.print();
    });
}

function renderMovementRow(movement) {
  const quantityChange = Number(movement.quantityChange) || 0;
  const isOutgoing = quantityChange < 0;

  const searchText = [
    movement.productName,
    movement.source,
    movement.destination
  ]
    .join(" ")
    .toLowerCase();

  return `
    <tr
      data-search="${escapeHtml(searchText)}"
      data-type="${escapeHtml(movement.type)}"
    >
      <td>${escapeHtml(movement.timeLabel || "—")}</td>
      <td><strong>${escapeHtml(movement.productName)}</strong></td>
      <td>${formatOperationType(movement.type)}</td>
      <td class="${isOutgoing ? "negative" : "positive"}">
        ${isOutgoing ? "" : "+"}${formatNumber(quantityChange)}
      </td>
      <td>${escapeHtml(movement.source || "—")}</td>
      <td>${escapeHtml(movement.destination || "—")}</td>
    </tr>
  `;
}

function filterMovements() {
  const searchTerm =
    document.querySelector("#movement-search")?.value.trim().toLowerCase() || "";

  const selectedType =
    document.querySelector("#movement-type-filter")?.value || "all";

  document.querySelectorAll("#movement-table tr[data-search]").forEach(row => {
    const matchesSearch = row.dataset.search.includes(searchTerm);
    const matchesType =
      selectedType === "all" || row.dataset.type === selectedType;

    row.hidden = !(matchesSearch && matchesType);
  });
}

function emptyTableRow(message) {
  return `
    <tr>
      <td colspan="6" class="empty">${message}</td>
    </tr>
  `;
}