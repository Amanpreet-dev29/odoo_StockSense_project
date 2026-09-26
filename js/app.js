import { getData } from "./services/data.service.js";
import { productsService } from "./services/products.service.js";
import { operationsService } from "./services/operations.service.js";
import { inventoryService } from "./services/inventory.service.js";
import { authService } from "./services/auth.service.js";

import { sidebar } from "./components/sidebar.js";
import { topbar } from "./components/topbar.js";
import { showModal } from "./components/modal.js";

import {
  getDashboardSummary,
  filterOperations,
  filterProducts
} from "./pages/dashboard.js";

import {
  renderProductsPage,
  attachProductsPageEvents
} from "./pages/products.js";

import {
  renderReceiptsPage,
  attachReceiptsPageEvents
} from "./pages/receipts.js";

import {
  renderDeliveriesPage,
  attachDeliveriesPageEvents
} from "./pages/deliveries.js";

import {
  renderTransfersPage,
  attachTransfersPageEvents
} from "./pages/transfers.js";

import {
  renderAdjustmentsPage,
  attachAdjustmentsPageEvents
} from "./pages/adjustments.js";

import {
  renderMoveHistoryPage,
  attachMoveHistoryPageEvents
} from "./pages/move-history.js";

import {
  renderSettingsPage,
  attachSettingsPageEvents
} from "./pages/settings.js";

import { escapeHtml, formatNumber } from "./utils/format.js";

const app = document.querySelector("#app");
const currentPage = document.body.dataset.page || "dashboard";
const isInsidePagesFolder = window.location.pathname.includes("/pages/");
const basePath = isInsidePagesFolder ? "../" : "";

const pageTitles = {
  dashboard: "Dashboard",
  products: "Products",
  receipts: "Receipts",
  deliveries: "Delivery Orders",
  transfers: "Internal Transfers",
  adjustments: "Inventory Adjustment",
  "move-history": "Move History",
  settings: "Warehouse & Settings"
};

renderPage();
attachGlobalEvents();

function renderPage() {
  if (isAuthenticationPage()) {
    renderAuthenticationPage();
    return;
  }

  const pageContent = getPageContent();

  app.innerHTML = `
    <div class="shell">
      ${sidebar(currentPage, basePath)}

      <main class="main">
        ${topbar(pageTitles[currentPage] || "StockSense")}

        <div class="page-wrap">
          ${pageContent}
        </div>
      </main>
    </div>
  `;

  attachPageEvents();
}

function getPageContent() {
  switch (currentPage) {
    case "dashboard":
      return renderDashboardPage();

    case "products":
      return renderProductsPage();

    case "receipts":
      return renderReceiptsPage();

    case "deliveries":
      return renderDeliveriesPage();

    case "transfers":
      return renderTransfersPage();

    case "adjustments":
      return renderAdjustmentsPage();

    case "move-history":
      return renderMoveHistoryPage();

    case "settings":
      return renderSettingsPage();

    default:
      return `
        <section class="page-heading">
          <div>
            <h1>Page not found</h1>
            <p>Choose a page from the StockSense navigation.</p>
          </div>
        </section>
      `;
  }
}

function attachPageEvents() {
  const pageEventHandlers = {
    dashboard: attachDashboardEvents,
    products: attachProductsPageEvents,
    receipts: attachReceiptsPageEvents,
    deliveries: attachDeliveriesPageEvents,
    transfers: attachTransfersPageEvents,
    adjustments: attachAdjustmentsPageEvents,
    "move-history": attachMoveHistoryPageEvents,
    settings: attachSettingsPageEvents
  };

  pageEventHandlers[currentPage]?.();
}

function renderDashboardPage() {
  const data = getData();
  const summary = getDashboardSummary(data);
  const categories = [...new Set(data.products.map(product => product.category))];

  return `
    <section class="page-heading">
      <div>
        <h1>Inventory dashboard</h1>
        <p>Here’s what’s happening across your inventory today.</p>
      </div>

      <button class="btn btn-primary" type="button" data-action="new-receipt">
        ＋ New operation
      </button>
    </section>

    ${renderDashboardFilters(categories)}
    ${renderDashboardCards(summary)}
    ${renderDashboardOperations(data)}
    ${renderDashboardStock(data)}
    ${renderDashboardMovements(data)}
  `;
}

function renderDashboardFilters(categories) {
  return `
    <section class="filters">
      <div class="field">
        <label for="filter-type">DOCUMENT TYPE</label>
        <select class="control" id="filter-type">
          <option value="all">All document types</option>
          <option value="receipt">Receipts</option>
          <option value="delivery">Delivery orders</option>
          <option value="transfer">Internal transfers</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-status">STATUS</label>
        <select class="control" id="filter-status">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-warehouse">WAREHOUSE</label>
        <select class="control" id="filter-warehouse">
          <option value="all">All warehouses</option>
          <option value="Main Warehouse">Main Warehouse</option>
          <option value="West Warehouse">West Warehouse</option>
        </select>
      </div>

      <div class="field">
        <label for="filter-category">CATEGORY</label>
        <select class="control" id="filter-category">
          <option value="all">All categories</option>
          ${categories
            .map(category => `
              <option value="${escapeHtml(category)}">
                ${escapeHtml(category)}
              </option>
            `)
            .join("")}
        </select>
      </div>
    </section>
  `;
}

function renderDashboardCards(summary) {
  return `
    <section class="kpis">
      ${renderKpiCard(
        "Total units in stock",
        formatNumber(summary.totalUnits),
        "Across all warehouses",
        "green",
        "▦"
      )}

      ${renderKpiCard(
        "Low / out of stock",
        `${summary.lowStockCount} / ${summary.outOfStockCount}`,
        `${summary.lowStockCount} low stock · ${summary.outOfStockCount} out of stock`,
        "red",
        "⚠"
      )}

      ${renderKpiCard(
        "Pending receipts",
        summary.pendingReceipts,
        "Awaiting validation",
        "blue",
        "↙"
      )}

      ${renderKpiCard(
        "Pending deliveries",
        summary.pendingDeliveries,
        "Ready to pick or ship",
        "amber",
        "↗"
      )}

      ${renderKpiCard(
        "Transfers scheduled",
        summary.pendingTransfers,
        "Across warehouse locations",
        "",
        "⇄"
      )}
    </section>
  `;
}

function renderKpiCard(label, value, note, colorClass, icon) {
  return `
    <article class="card kpi ${colorClass}">
      <span class="kpi-icon" aria-hidden="true">${icon}</span>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-foot">${note}</div>
    </article>
  `;
}

function renderDashboardOperations(data) {
  const operations = data.operations;

  return `
    <section class="panel operations-panel">
      <header class="panel-head">
        <div>
          <h2>Operations queue</h2>
          <span class="muted">Documents matching the filters above</span>
        </div>

        <a class="btn btn-quiet" href="${basePath}pages/receipts.html">
          Manage operations →
        </a>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>TYPE</th>
              <th>DETAILS</th>
              <th>PRODUCT</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody id="dashboard-operations">
            ${
              operations.length
                ? operations.map(operation => {
                    const product = data.products.find(item => {
                      return item.name === operation.productName;
                    });

                    return `
                      <tr
                        data-operation-type="${escapeHtml(operation.type)}"
                        data-operation-status="${escapeHtml(operation.status)}"
                        data-warehouse="${escapeHtml(operation.warehouse)}"
                        data-category="${escapeHtml(product?.category || "")}"
                      >
                        <td class="mono">
                          <strong>${escapeHtml(operation.reference)}</strong>
                        </td>
                        <td>${escapeHtml(operation.type)}</td>
                        <td>${escapeHtml(operation.description || operation.partner || "—")}</td>
                        <td>
                          ${escapeHtml(operation.productName)}
                          · ${formatNumber(operation.quantity)}
                        </td>
                        <td>
                          ${escapeHtml(operation.warehouse)}
                          <span class="muted">· ${escapeHtml(operation.location)}</span>
                        </td>
                        <td>${renderStatusBadge(operation.status)}</td>
                        <td>
                          ${
                            operation.status === "done" ||
                            operation.status === "cancelled"
                              ? "—"
                              : `<button
                                  class="btn btn-outline"
                                  type="button"
                                  data-action="validate-operation"
                                  data-reference="${escapeHtml(operation.reference)}"
                                >
                                  Validate
                                </button>`
                          }
                        </td>
                      </tr>
                    `;
                  }).join("")
                : renderEmptyRow("No operations yet.", 7)
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDashboardStock(data) {
  return `
    <section class="panel">
      <header class="panel-head">
        <div>
          <h2>Stock availability per location</h2>
          <span class="muted">Current stock and reorder levels</span>
        </div>

        <a class="btn btn-outline" href="${basePath}pages/products.html">
          View products →
        </a>
      </header>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>CATEGORY</th>
              <th>UNIT</th>
              <th>INITIAL</th>
              <th>ON HAND</th>
              <th>WAREHOUSE · LOCATION</th>
              <th>REORDER AT</th>
              <th>STATUS</th>
            </tr>
          </thead>

          <tbody id="dashboard-stock">
            ${data.products.map(renderStockRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderStockRow(product) {
  const quantity = Number(product.quantity) || 0;
  const reorderLevel = Number(product.reorderLevel) || 0;

  let stockStatus = "In stock";
  let badgeClass = "badge-done";

  if (quantity === 0) {
    stockStatus = "Out of stock";
    badgeClass = "badge-cancelled";
  } else if (quantity <= reorderLevel) {
    stockStatus = "Low stock";
    badgeClass = "badge-low";
  }

  return `
    <tr
      data-stock-warehouse="${escapeHtml(product.warehouse)}"
      data-stock-category="${escapeHtml(product.category)}"
    >
      <td><strong>${escapeHtml(product.name)}</strong></td>
      <td class="mono">${escapeHtml(product.sku)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.unit)}</td>
      <td>${formatNumber(product.initialStock)}</td>
      <td class="${quantity <= reorderLevel ? "qty-low" : ""}">
        ${formatNumber(quantity)} ${escapeHtml(product.unit)}
      </td>
      <td>
        ${escapeHtml(product.warehouse)}
        <span class="muted">· ${escapeHtml(product.location)}</span>
      </td>
      <td>${formatNumber(reorderLevel)} ${escapeHtml(product.unit)}</td>
      <td>
        <span class="badge ${badgeClass}">${stockStatus}</span>
      </td>
    </tr>
  `;
}

function renderDashboardMovements(data) {
  const movements = data.movements.slice(0, 4);

  return `
    <section class="panel history-panel">
      <header class="panel-head">
        <div>
          <h2>Recent move history</h2>
          <span class="muted">Latest stock ledger activity</span>
        </div>

        <a class="btn btn-quiet" href="${basePath}pages/move-history.html">
          Full ledger →
        </a>
      </header>

      <div class="recent-list">
        ${
          movements.length
            ? movements.map(renderMovementRow).join("")
            : `<p class="muted">No stock movements have been recorded yet.</p>`
        }
      </div>
    </section>
  `;
}

function renderMovementRow(movement) {
  const change = Number(movement.quantityChange) || 0;
  const isOutgoing = change < 0;

  return `
    <div class="move-row">
      <span class="move-dot ${isOutgoing ? "negative" : ""}">
        ${isOutgoing ? "−" : "+"}
      </span>

      <div class="move-main">
        <strong>${escapeHtml(movement.productName)}</strong>
        <span>
          ${escapeHtml(movement.type)} ·
          ${escapeHtml(movement.source)} →
          ${escapeHtml(movement.destination)}
        </span>
      </div>

      <strong class="move-qty ${isOutgoing ? "negative" : ""}">
        ${isOutgoing ? "" : "+"}${formatNumber(Math.abs(change))}
      </strong>

      <time>${escapeHtml(movement.timeLabel)}</time>
    </div>
  `;
}

function renderStatusBadge(status) {
  return `
    <span class="badge badge-${escapeHtml(status)}">
      ${escapeHtml(status)}
    </span>
  `;
}

function renderEmptyRow(message, columnCount) {
  return `
    <tr>
      <td colspan="${columnCount}" class="empty">${message}</td>
    </tr>
  `;
}

function attachDashboardEvents() {
  const filterIds = [
    "filter-type",
    "filter-status",
    "filter-warehouse",
    "filter-category"
  ];

  filterIds.forEach(id => {
    document.querySelector(`#${id}`)?.addEventListener("change", applyDashboardFilters);
  });
}

function applyDashboardFilters() {
  const filters = {
    type: document.querySelector("#filter-type").value,
    status: document.querySelector("#filter-status").value,
    warehouse: document.querySelector("#filter-warehouse").value,
    category: document.querySelector("#filter-category").value
  };

  const data = getData();
  const matchingOperations = new Set(
    filterOperations(data.operations, data.products, filters)
      .map(operation => operation.reference)
  );

  const matchingProducts = new Set(
    filterProducts(data.products, filters)
      .map(product => product.sku)
  );

  document.querySelectorAll("#dashboard-operations tr[data-operation-type]").forEach(row => {
    row.hidden = !matchingOperations.has(row.querySelector(".mono").textContent.trim());
  });

  document.querySelectorAll("#dashboard-stock tr[data-stock-warehouse]").forEach(row => {
    const productSku = row.querySelector(".mono").textContent.trim();
    row.hidden = !matchingProducts.has(productSku);
  });
}

function attachGlobalEvents() {
  app.addEventListener("click", handleAppClick);

  document.addEventListener("stocksense:create-operation", event => {
    showOperationForm(event.detail.type);
  });

  document.addEventListener("stocksense:validate-operation", event => {
    validateAndRefresh(event.detail.reference);
  });

  document.addEventListener("stocksense:add-product", () => {
    showProductForm();
  });

  document.addEventListener("stocksense:add-warehouse", () => {
    showToast("Warehouse settings can be connected to the database next.");
  });

  document.addEventListener("stocksense:add-category", () => {
    showToast("Category settings can be connected to the database next.");
  });

  document.querySelector("#global-search")?.addEventListener("input", event => {
    filterVisibleRows(event.currentTarget.value);
  });
}

function handleAppClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  if (button.dataset.action === "new-receipt") {
    showOperationForm("receipt");
  }

  if (button.dataset.action === "validate-operation") {
    validateAndRefresh(button.dataset.reference);
  }

  if (button.dataset.action === "toggle-menu") {
    document.querySelector(".sidebar")?.classList.toggle("mobile-open");
  }
}

function validateAndRefresh(reference) {
  try {
    operationsService.setStatus(reference, "done");
    renderPage();
    showToast("Operation validated. Stock and movement history updated.");
  } catch (error) {
    showToast(error.message);
  }
}

function showOperationForm(type) {
  const products = productsService.list();

  const productOptions = products
    .map(product => `
      <option value="${escapeHtml(product.name)}">
        ${escapeHtml(product.name)}
      </option>
    `)
    .join("");

  const transferFields = type === "transfer"
    ? `
      <div class="field">
        <label for="operation-destination">DESTINATION LOCATION</label>
        <input
          class="control"
          id="operation-destination"
          name="destinationLocation"
          value="Production Floor"
          required
        >
      </div>
    `
    : "";

  const modal = showModal({
    title: `New ${type}`,
    submitText: "Save operation",

    content: `
      <div class="field">
        <label for="operation-product">PRODUCT</label>
        <select class="control" id="operation-product" name="productName" required>
          ${productOptions}
        </select>
      </div>

      <div class="field">
        <label for="operation-quantity">
          ${type === "adjustment" ? "COUNTED QUANTITY" : "QUANTITY"}
        </label>
        <input
          class="control"
          id="operation-quantity"
          name="quantity"
          type="number"
          min="${type === "adjustment" ? "0" : "0.001"}"
          step="any"
          required
        >
      </div>

      <div class="field">
        <label for="operation-partner">
          ${type === "receipt" ? "SUPPLIER" : type === "delivery" ? "CUSTOMER" : "NOTES"}
        </label>
        <input
          class="control"
          id="operation-partner"
          name="partner"
          placeholder="Optional"
        >
      </div>

      <div class="field">
        <label for="operation-warehouse">WAREHOUSE</label>
        <select class="control" id="operation-warehouse" name="warehouse">
          <option>Main Warehouse</option>
          <option>West Warehouse</option>
        </select>
      </div>

      <div class="field">
        <label for="operation-location">SOURCE / LOCATION</label>
        <input
          class="control"
          id="operation-location"
          name="location"
          value="Rack A"
          required
        >
      </div>

      ${transferFields}

      <div class="field">
        <label for="operation-status">STATUS</label>
        <select class="control" id="operation-status" name="status">
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready</option>
        </select>
      </div>
    `,

    onSubmit(formData, closeModal) {
      const productName = formData.get("productName");
      const product = products.find(item => item.name === productName);

      try {
        operationsService.create({
          type,
          productName,
          quantity: Number(formData.get("quantity")),
          partner: formData.get("partner"),
          description: `${type} · ${productName}`,
          warehouse: formData.get("warehouse"),
          location: formData.get("location"),
          destinationLocation: formData.get("destinationLocation"),
          status: formData.get("status"),
          category: product?.category
        });

        closeModal();
        renderPage();
        showToast("Operation saved as a demo record.");
      } catch (error) {
        showToast(error.message);
      }
    }
  });

  return modal;
}

function showProductForm() {
  showModal({
    title: "Add product",
    submitText: "Save product",

    content: `
      <div class="field span-2">
        <label for="product-name">PRODUCT NAME</label>
        <input class="control" id="product-name" name="name" required>
      </div>

      <div class="field">
        <label for="product-sku">SKU / CODE</label>
        <input class="control" id="product-sku" name="sku" required>
      </div>

      <div class="field">
        <label for="product-category">CATEGORY</label>
        <input class="control" id="product-category" name="category" required>
      </div>

      <div class="field">
        <label for="product-unit">UNIT OF MEASURE</label>
        <input class="control" id="product-unit" name="unit" value="pcs" required>
      </div>

      <div class="field">
        <label for="product-initial-stock">INITIAL STOCK</label>
        <input
          class="control"
          id="product-initial-stock"
          name="initialStock"
          type="number"
          min="0"
          value="0"
          required
        >
      </div>

      <div class="field">
        <label for="product-reorder-level">REORDER LEVEL</label>
        <input
          class="control"
          id="product-reorder-level"
          name="reorderLevel"
          type="number"
          min="0"
          value="10"
          required
        >
      </div>

      <div class="field">
        <label for="product-warehouse">WAREHOUSE</label>
        <select class="control" id="product-warehouse" name="warehouse">
          <option>Main Warehouse</option>
          <option>West Warehouse</option>
        </select>
      </div>

      <div class="field">
        <label for="product-location">LOCATION</label>
        <input
          class="control"
          id="product-location"
          name="location"
          value="Rack A"
          required
        >
      </div>
    `,

    onSubmit(formData, closeModal) {
      try {
        productsService.add({
          name: formData.get("name"),
          sku: formData.get("sku"),
          category: formData.get("category"),
          unit: formData.get("unit"),
          initialStock: formData.get("initialStock"),
          reorderLevel: formData.get("reorderLevel"),
          warehouse: formData.get("warehouse"),
          location: formData.get("location")
        });

        closeModal();
        renderPage();
        showToast("Product added to the demo catalog.");
      } catch (error) {
        showToast(error.message);
      }
    }
  });
}

function filterVisibleRows(searchText) {
  const query = searchText.trim().toLowerCase();

  document.querySelectorAll("tbody tr").forEach(row => {
    row.hidden = !row.textContent.toLowerCase().includes(query);
  });
}

function renderAuthenticationPage() {
  const authContent = {
    login: {
      title: "Welcome back",
      description: "Sign in to manage your inventory.",
      button: "Sign in"
    },
    signup: {
      title: "Create your account",
      description: "Set up your StockSense workspace.",
      button: "Create account"
    },
    "reset-password": {
      title: "Reset your password",
      description: "Request a one-time code to reset your password.",
      button: "Send reset code"
    }
  }[currentPage];

  const includesName = currentPage === "signup";
  const includesPassword = currentPage !== "reset-password";
  const includesCode = currentPage === "reset-password";

  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-card card">
        <a class="brand" href="index.html">
          <span class="brand-mark">◈</span>
          <span class="brand-name">StockSense</span>
        </a>

        <h1>${authContent.title}</h1>
        <p>${authContent.description}</p>

        <form id="authentication-form">
          ${
            includesName
              ? `
                <div class="field">
                  <label for="full-name">FULL NAME</label>
                  <input
                    class="control"
                    id="full-name"
                    name="fullName"
                    autocomplete="name"
                    required
                  >
                </div>
              `
              : ""
          }

          <div class="field">
            <label for="email-address">EMAIL ADDRESS</label>
            <input
              class="control"
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
            >
          </div>

          ${
            includesPassword
              ? `
                <div class="field">
                  <label for="password">PASSWORD</label>
                  <input
                    class="control"
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="${currentPage === "login" ? "current-password" : "new-password"}"
                    required
                  >
                </div>
              `
              : ""
          }

          ${
            includesCode
              ? `
                <div class="field">
                  <label for="reset-code">ONE-TIME CODE</label>
                  <input
                    class="control"
                    id="reset-code"
                    name="resetCode"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                  >
                </div>
              `
              : ""
          }

          <button class="btn btn-primary auth-submit" type="submit">
            ${authContent.button}
          </button>
        </form>

        <nav class="auth-links" aria-label="Account links">
          ${
            currentPage === "login"
              ? `
                <a href="reset-password.html">Forgot password?</a>
                <span>New to StockSense? <a href="signup.html">Create an account</a></span>
              `
              : `
                <a href="login.html">Back to sign in</a>
              `
          }
        </nav>

        <p class="demo-note">
          Demo interface. Supabase authentication is not connected yet.
        </p>
      </section>
    </main>
  `;

  document
    .querySelector("#authentication-form")
    .addEventListener("submit", handleAuthentication);
}

async function handleAuthentication(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    if (currentPage === "login") {
      await authService.signIn(email, password);
    } else if (currentPage === "signup") {
      await authService.signUp(
        email,
        password,
        formData.get("fullName")
      );
    } else {
      await authService.sendPasswordResetCode(email);
    }

    window.location.href = "index.html";
  } catch (error) {
    showToast(error.message);
  }
}

function isAuthenticationPage() {
  return ["login", "signup", "reset-password"].includes(currentPage);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;

  document.body.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}