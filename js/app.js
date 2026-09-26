import { productsService } from "./services/products.service.js";
import { operationsService } from "./services/operations.service.js";
import { inventoryService } from "./services/inventory.service.js";
import { authService } from "./services/auth.service.js";
import { supabase } from "./config/supabase.js";

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

async function renderPage() {
  if (isAuthenticationPage()) {
    renderAuthenticationPage();
    return;
  }

  try {
    const pageContent =
      await getPageContent();

    app.innerHTML = `
      <div class="shell">
        ${sidebar(
          currentPage,
          basePath
        )}

        <main class="main">
          ${topbar(
            pageTitles[currentPage] ||
            "StockSense"
          )}

          <div class="page-wrap">
            ${pageContent}
          </div>
        </main>
      </div>
    `;

    attachPageEvents();

  } catch (error) {
    console.error(error);

    app.innerHTML = `
      <div class="shell">
        ${sidebar(
          currentPage,
          basePath
        )}

        <main class="main">
          ${topbar(
            pageTitles[currentPage] ||
            "StockSense"
          )}

          <div class="page-wrap">
            <section class="panel">
              <h2>
                Unable to load this page
              </h2>

              <p class="muted">
                ${escapeHtml(
                  error.message
                )}
              </p>
            </section>
          </div>
        </main>
      </div>
    `;
  }
}

function isAuthenticationPage() {
  return [
    "login",
    "signup",
    "reset-password"
  ].includes(
    currentPage
  );
}

function renderAuthenticationPage() {
  const authContent = {
    login: {
      title: "Welcome back",
      description:
        "Sign in to manage your inventory.",
      button: "Sign in"
    },

    signup: {
      title: "Create your account",
      description:
        "Set up your StockSense workspace.",
      button: "Create account"
    },

    "reset-password": {
      title: "Reset your password",
      description:
        "Request a one-time code to reset your password.",
      button: "Send reset code"
    }
  }[currentPage];

  const includesName =
    currentPage === "signup";

  const includesPassword =
    currentPage !==
    "reset-password";

  const includesCode =
    currentPage ===
    "reset-password";

  app.innerHTML = `
    <main class="auth-page">

      <section class="auth-card card">

        <a
          class="brand"
          href="${basePath}index.html"
        >
          <span class="brand-mark">
            ◈
          </span>

          <span class="brand-name">
            StockSense
          </span>
        </a>

        <h1>
          ${escapeHtml(
            authContent.title
          )}
        </h1>

        <p>
          ${escapeHtml(
            authContent.description
          )}
        </p>

        <form
          id="authentication-form"
        >

          ${
            includesName
              ? `
                <div class="field">

                  <label
                    for="full-name"
                  >
                    FULL NAME
                  </label>

                  <input
                    class="control"
                    id="full-name"
                    name="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                  >

                </div>
              `
              : ""
          }

          <div class="field">

            <label
              for="auth-email"
            >
              EMAIL
            </label>

            <input
              class="control"
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            >

          </div>

          ${
            includesPassword
              ? `
                <div class="field">

                  <label
                    for="auth-password"
                  >
                    PASSWORD
                  </label>

                  <input
                    class="control"
                    id="auth-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
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

                  <label
                    for="reset-code"
                  >
                    RESET CODE
                  </label>

                  <input
                    class="control"
                    id="reset-code"
                    name="resetCode"
                    type="text"
                    placeholder="Enter reset code"
                  >

                </div>
              `
              : ""
          }

          <button
            class="btn btn-primary auth-submit"
            type="submit"
          >
            ${escapeHtml(
              authContent.button
            )}
          </button>

        </form>

        <nav
          class="auth-links"
          aria-label="Account links"
        >

          ${
            currentPage === "login"
              ? `
                <a
                  href="${basePath}reset-password.html"
                >
                  Forgot password?
                </a>

                <span>
                  New to StockSense?

                  <a
                    href="${basePath}signup.html"
                  >
                    Create an account
                  </a>
                </span>
              `
              : `
                <a
                  href="${basePath}login.html"
                >
                  Back to sign in
                </a>
              `
          }

        </nav>

        <p class="demo-note">
          Demo interface.
          Supabase authentication is connected.
        </p>

      </section>

    </main>
  `;

  document
    .querySelector(
      "#authentication-form"
    )
    .addEventListener(
      "submit",
      handleAuthentication
    );
}

async function handleAuthentication(
  event
) {
  event.preventDefault();

  const formData =
    new FormData(
      event.currentTarget
    );

  const email =
    formData.get("email");

  const password =
    formData.get("password");

  try {

    if (
      currentPage ===
      "login"
    ) {
      await authService.signIn(
        email,
        password
      );

      window.location.href =
        `${basePath}index.html`;

      return;
    }

    if (
      currentPage ===
      "signup"
    ) {
      await authService.signUp(
        email,
        password,
        formData.get(
          "fullName"
        )
      );

      showToast(
        "Account created. Please check your email for confirmation."
      );

      return;
    }

    if (
      currentPage ===
      "reset-password"
    ) {
      await authService.sendPasswordResetCode(
        email
      );

      showToast(
        "Password reset instructions sent to your email."
      );
    }

  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    showToast(
      error.message
    );
  }
}

function showToast(
  message
) {
  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "toast";

  toast.setAttribute(
    "role",
    "status"
  );

  toast.textContent =
    message;

  document.body.append(
    toast
  );

  window.setTimeout(
    () => {
      toast.remove();
    },
    3000
  );
}

renderPage();
async function getPageContent() {
  switch (currentPage) {
    case "dashboard":
      return await renderDashboardPage();

    case "products":
      return await renderProductsPage();

    case "receipts":
      return await renderReceiptsPage();

    case "deliveries":
      return await renderDeliveriesPage();

    case "transfers":
      return await renderTransfersPage();

    case "adjustments":
      return await renderAdjustmentsPage();

    case "move-history":
      return await renderMoveHistoryPage();

    case "settings":
      return await renderSettingsPage();

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

async function getWarehouses() {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name, location")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function renderDashboardPage() {
  const [
    summary,
    products,
    operations,
    movements,
    warehouses
  ] = await Promise.all([
    inventoryService.getSummary(),
    inventoryService.listBalances(),
    operationsService.list(),
    inventoryService.listMovements(),
    getWarehouses()
  ]);

  const data = {
    products,
    operations,
    movements
  };

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  return `
    <section class="page-heading">
      <div>
        <h1>Inventory dashboard</h1>
        <p>Here’s what’s happening across your inventory today.</p>
      </div>

      <button
        class="btn btn-primary"
        type="button"
        data-action="new-receipt"
      >
        ＋ New operation
      </button>
    </section>

    ${renderDashboardFilters(categories, warehouses)}
    ${renderDashboardCards(summary)}
    ${renderDashboardOperations(data)}
    ${renderDashboardStock(data)}
    ${renderDashboardMovements(data)}
  `;
}

function renderDashboardFilters(categories, warehouses) {
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

          ${warehouses
            .map(
              warehouse => `
                <option value="${escapeHtml(warehouse.name)}">
                  ${escapeHtml(warehouse.name)}
                </option>
              `
            )
            .join("")}
        </select>
      </div>

      <div class="field">
        <label for="filter-category">CATEGORY</label>

        <select class="control" id="filter-category">
          <option value="all">All categories</option>

          ${categories
            .map(
              category => `
                <option value="${escapeHtml(category)}">
                  ${escapeHtml(category)}
                </option>
              `
            )
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

function renderKpiCard(
  label,
  value,
  note,
  colorClass,
  icon
) {
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

          <span class="muted">
            Documents matching the filters above
          </span>
        </div>

        <a
          class="btn btn-quiet"
          href="${basePath}pages/receipts.html"
        >
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
                ? operations
                    .map(operation => {
                      const product =
                        data.products.find(
                          item =>
                            item.name ===
                            operation.productName
                        );

                      return `
                        <tr
                          data-operation-type="${escapeHtml(
                            operation.type
                          )}"
                          data-operation-status="${escapeHtml(
                            operation.status
                          )}"
                          data-warehouse="${escapeHtml(
                            operation.warehouse || ""
                          )}"
                          data-category="${escapeHtml(
                            product?.category || ""
                          )}"
                        >

                          <td class="mono">
                            <strong>
                              ${escapeHtml(
                                operation.reference
                              )}
                            </strong>
                          </td>

                          <td>
                            ${escapeHtml(
                              operation.type
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              operation.description ||
                              operation.partner ||
                              "—"
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              operation.productName ||
                              "—"
                            )}

                            ·
                            ${formatNumber(
                              operation.quantity
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              operation.warehouse ||
                              "—"
                            )}

                            <span class="muted">
                              ·
                              ${escapeHtml(
                                operation.location ||
                                "—"
                              )}
                            </span>
                          </td>

                          <td>
                            ${renderStatusBadge(
                              operation.status
                            )}
                          </td>

                          <td>
                            ${
                              operation.status ===
                                "done" ||
                              operation.status ===
                                "cancelled"
                                ? "—"
                                : `
                                  <button
                                    class="btn btn-outline"
                                    type="button"
                                    data-action="validate-operation"
                                    data-reference="${escapeHtml(
                                      operation.reference
                                    )}"
                                  >
                                    Validate
                                  </button>
                                `
                            }
                          </td>

                        </tr>
                      `;
                    })
                    .join("")
                : renderEmptyRow(
                    "No operations yet.",
                    7
                  )
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

          <span class="muted">
            Current stock and reorder levels
          </span>
        </div>

        <a
          class="btn btn-outline"
          href="${basePath}pages/products.html"
        >
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

            ${
              data.products.length
                ? data.products
                    .map(renderStockRow)
                    .join("")
                : renderEmptyRow(
                    "No products yet.",
                    9
                  )
            }

          </tbody>

        </table>

      </div>
    </section>
  `;
}

function renderStockRow(product) {
  const quantity =
    Number(product.quantity) || 0;

  const reorderLevel =
    Number(product.reorderLevel) || 0;

  let stockStatus = "In stock";
  let badgeClass = "badge-done";

  if (quantity === 0) {
    stockStatus = "Out of stock";
    badgeClass = "badge-cancelled";
  } else if (
    quantity <= reorderLevel
  ) {
    stockStatus = "Low stock";
    badgeClass = "badge-waiting";
  }

  return `
    <tr
      data-stock-warehouse="${escapeHtml(
        product.warehouse || ""
      )}"
      data-stock-category="${escapeHtml(
        product.category || ""
      )}"
    >

      <td>
        <strong>
          ${escapeHtml(
            product.name || "—"
          )}
        </strong>
      </td>

      <td class="mono">
        ${escapeHtml(
          product.sku || "—"
        )}
      </td>

      <td>
        ${escapeHtml(
          product.category || "—"
        )}
      </td>

      <td>
        ${escapeHtml(
          product.unit || "—"
        )}
      </td>

      <td>
        ${formatNumber(
          product.initialStock
        )}
      </td>

      <td>
        <strong>
          ${formatNumber(quantity)}
        </strong>
      </td>

      <td>
        ${escapeHtml(
          product.warehouse || "—"
        )}

        <span class="muted">
          ·
          ${escapeHtml(
            product.location || "—"
          )}
        </span>
      </td>

      <td>
        ${formatNumber(reorderLevel)}
        ${escapeHtml(
          product.unit || "Unit"
        )}
      </td>

      <td>
        <span class="badge ${badgeClass}">
          ${stockStatus}
        </span>
      </td>

    </tr>
  `;
}

function renderDashboardMovements(data) {
  const movements =
    data.movements.slice(0, 4);

  return `
    <section class="panel history-panel">

      <header class="panel-head">

        <div>
          <h2>Recent move history</h2>

          <span class="muted">
            Latest stock ledger activity
          </span>
        </div>

        <a
          class="btn btn-quiet"
          href="${basePath}pages/move-history.html"
        >
          Full ledger →
        </a>

      </header>

      <div class="recent-list">

        ${
          movements.length
            ? movements
                .map(renderMovementRow)
                .join("")
            : `
              <p class="muted">
                No stock movements have been recorded yet.
              </p>
            `
        }

      </div>

    </section>
  `;
}

function renderMovementRow(movement) {
  const change =
    Number(
      movement.quantityChange
    ) || 0;

  const isOutgoing =
    change < 0;

  return `
    <div class="move-row">

      <span class="move-dot ${
        isOutgoing ? "negative" : ""
      }">
        ${isOutgoing ? "−" : "+"}
      </span>

      <div class="move-main">

        <strong>
          ${escapeHtml(
            movement.productName ||
            "—"
          )}
        </strong>

        <span>
          ${escapeHtml(
            movement.type || "—"
          )}
          ·
          ${escapeHtml(
            movement.source || "—"
          )}
          →
          ${escapeHtml(
            movement.destination || "—"
          )}
        </span>

      </div>

      <strong
        class="move-qty ${
          isOutgoing ? "negative" : ""
        }"
      >
        ${isOutgoing ? "" : "+"}
        ${formatNumber(
          Math.abs(change)
        )}
      </strong>

      <time>
        ${escapeHtml(
          movement.timeLabel || "—"
        )}
      </time>

    </div>
  `;
}

function renderStatusBadge(status) {
  return `
    <span class="badge badge-${escapeHtml(
      status
    )}">
      ${escapeHtml(status)}
    </span>
  `;
}

function renderEmptyRow(
  message,
  columnCount
) {
  return `
    <tr>
      <td
        colspan="${columnCount}"
        class="empty"
      >
        ${escapeHtml(message)}
      </td>
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
    document
      .querySelector(`#${id}`)
      ?.addEventListener(
        "change",
        applyDashboardFilters
      );
  });
}

async function applyDashboardFilters() {
  const filters = {
    type:
      document.querySelector("#filter-type")?.value ||
      "all",

    status:
      document.querySelector("#filter-status")?.value ||
      "all",

    warehouse:
      document.querySelector("#filter-warehouse")?.value ||
      "all",

    category:
      document.querySelector("#filter-category")?.value ||
      "all"
  };

  try {
    const [products, operations] =
      await Promise.all([
        inventoryService.listBalances(),
        operationsService.list()
      ]);

    const matchingOperations =
      new Set(
        filterOperations(
          operations,
          products,
          filters
        ).map(
          operation =>
            operation.reference
        )
      );

    const matchingProducts =
      new Set(
        filterProducts(
          products,
          filters
        ).map(
          product =>
            product.sku
        )
      );

    document
      .querySelectorAll(
        "#dashboard-operations tr[data-operation-type]"
      )
      .forEach(row => {
        const reference =
          row
            .querySelector(".mono")
            ?.textContent
            .trim();

        row.hidden =
          !matchingOperations.has(
            reference
          );
      });

    document
      .querySelectorAll(
        "#dashboard-stock tr[data-stock-warehouse]"
      )
      .forEach(row => {
        const productSku =
          row
            .querySelector(".mono")
            ?.textContent
            .trim();

        row.hidden =
          !matchingProducts.has(
            productSku
          );
      });

  } catch (error) {
    console.error(error);

    showToast(
      error.message
    );
  }
}

function attachGlobalEvents() {
  app.addEventListener(
    "click",
    handleAppClick
  );

  document.addEventListener(
    "stocksense:create-operation",
    event => {
      showOperationForm(
        event.detail.type
      );
    }
  );

  document.addEventListener(
    "stocksense:validate-operation",
    event => {
      validateAndRefresh(
        event.detail.reference
      );
    }
  );

  document.addEventListener(
    "stocksense:add-product",
    () => {
      showProductForm();
    }
  );

  document.addEventListener(
    "stocksense:add-warehouse",
    () => {
      showWarehouseForm();
    }
  );

  document.addEventListener(
    "stocksense:add-category",
    () => {
      showToast(
        "Category settings can be connected to the database next."
      );
    }
  );

  document
    .querySelector(
      "#global-search"
    )
    ?.addEventListener(
      "input",
      event => {
        filterVisibleRows(
          event.currentTarget.value
        );
      }
    );
}

function handleAppClick(event) {
  const button =
    event.target.closest(
      "[data-action]"
    );

  if (!button) {
    return;
  }

  if (
    button.dataset.action ===
    "new-receipt"
  ) {
    showOperationForm(
      "receipt"
    );
  }

  if (
    button.dataset.action ===
    "validate-operation"
  ) {
    validateAndRefresh(
      button.dataset.reference
    );
  }

  if (
    button.dataset.action ===
    "toggle-menu"
  ) {
    document
      .querySelector(
        ".sidebar"
      )
      ?.classList.toggle(
        "mobile-open"
      );
  }
}

async function validateAndRefresh(
  reference
) {
  try {
    await operationsService.setStatus(
      reference,
      "done"
    );

    await renderPage();

    showToast(
      "Operation validated. Stock and movement history updated."
    );

  } catch (error) {
    console.error(
      "Validation error:",
      error
    );

    showToast(
      error.message
    );
  }
}

async function showOperationForm(
  type
) {
  try {
    const [
      products,
      warehouses
    ] = await Promise.all([
      productsService.list(),
      getWarehouses()
    ]);

    const productOptions =
      products
        .map(
          product => `
            <option value="${escapeHtml(
              product.name
            )}">
              ${escapeHtml(
                product.name
              )}
            </option>
          `
        )
        .join("");

    const warehouseOptions =
      warehouses
        .map(
          warehouse => `
            <option value="${escapeHtml(
              warehouse.name
            )}">
              ${escapeHtml(
                warehouse.name
              )}
            </option>
          `
        )
        .join("");

    const transferFields =
      type === "transfer"
        ? `
          <div class="field">

            <label
              for="operation-destination"
            >
              DESTINATION LOCATION
            </label>

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

    showModal({
      title: `New ${type}`,
      submitText: "Save operation",

      content: `
        <div class="field">

          <label
            for="operation-product"
          >
            PRODUCT
          </label>

          <select
            class="control"
            id="operation-product"
            name="productName"
            required
          >
            ${productOptions}
          </select>

        </div>

        <div class="field">

          <label
            for="operation-quantity"
          >
            ${
              type === "adjustment"
                ? "COUNTED QUANTITY"
                : "QUANTITY"
            }
          </label>

          <input
            class="control"
            id="operation-quantity"
            name="quantity"
            type="number"
            min="${
              type === "adjustment"
                ? "0"
                : "0.001"
            }"
            step="any"
            required
          >

        </div>

        <div class="field">

          <label
            for="operation-partner"
          >
            ${
              type === "receipt"
                ? "SUPPLIER"
                : type === "delivery"
                  ? "CUSTOMER"
                  : "NOTES"
            }
          </label>

          <input
            class="control"
            id="operation-partner"
            name="partner"
            placeholder="Optional"
          >

        </div>

        <div class="field">

          <label
            for="operation-warehouse"
          >
            WAREHOUSE
          </label>

          <select
            class="control"
            id="operation-warehouse"
            name="warehouse"
            required
          >
            ${warehouseOptions}
          </select>

        </div>

        <div class="field">

          <label
            for="operation-location"
          >
            SOURCE / LOCATION
          </label>

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

          <label
            for="operation-status"
          >
            STATUS
          </label>

          <select
            class="control"
            id="operation-status"
            name="status"
          >
            <option value="draft">
              Draft
            </option>

            <option value="waiting" selected>
              Waiting
            </option>

            <option value="ready">
              Ready
            </option>
          </select>

        </div>
      `,

      onSubmit: async formData => {
        try {
          

          await operationsService.create({
            type,
            productName:
              formData.get(
                "productName"
              ),
            quantity:
              Number(
                formData.get(
                  "quantity"
                )
              ),
            partner:
              formData.get(
                "partner"
              ),
            warehouse:
              formData.get(
                "warehouse"
              ),
            location:
              formData.get(
                "location"
              ),
            destinationLocation:
              formData.get(
                "destinationLocation"
              ),
            status:
              formData.get(
                "status"
              )
          });

          await renderPage();

          showToast(
            "Operation created successfully."
          );

        } catch (error) {
          console.error(
            "Operation creation error:",
            error
          );

          showToast(
            error.message
          );

          throw error;
        }
      }
    });

  } catch (error) {
    console.error(
      "Operation form error:",
      error
    );

    showToast(
      error.message
    );
  }
}
async function showProductForm() {
  try {
    const warehouses =
      await getWarehouses();

    const warehouseOptions =
      warehouses.length
        ? warehouses
            .map(
              warehouse => `
                <option value="${escapeHtml(
                  warehouse.name
                )}">
                  ${escapeHtml(
                    warehouse.name
                  )}
                </option>
              `
            )
            .join("")
        : `
            <option value="">
              No warehouses available
            </option>
          `;

    showModal({
      title: "Add product",
      submitText: "Save product",

      content: `
        <div class="field">

          <label
            for="product-name"
          >
            PRODUCT NAME
          </label>

          <input
            class="control"
            id="product-name"
            name="name"
            type="text"
            placeholder="Steel Rod"
            required
          >

        </div>

        <div class="field">

          <label
            for="product-sku"
          >
            SKU / CODE
          </label>

          <input
            class="control"
            id="product-sku"
            name="sku"
            type="text"
            placeholder="STL-001"
            required
          >

        </div>

        <div class="field">

          <label
            for="product-category"
          >
            CATEGORY
          </label>

          <input
            class="control"
            id="product-category"
            name="category"
            type="text"
            placeholder="Raw Materials"
            required
          >

        </div>

        <div class="field">

          <label
            for="product-unit"
          >
            UNIT OF MEASURE
          </label>

          <input
            class="control"
            id="product-unit"
            name="unit"
            type="text"
            placeholder="kg"
            required
          >

        </div>

        <div class="field">

          <label
            for="product-reorder"
          >
            REORDER LEVEL
          </label>

          <input
            class="control"
            id="product-reorder"
            name="reorderLevel"
            type="number"
            min="0"
            step="any"
            value="0"
          >

        </div>

        <div class="field">

          <label
            for="product-stock"
          >
            INITIAL STOCK
          </label>

          <input
            class="control"
            id="product-stock"
            name="initialStock"
            type="number"
            min="0"
            step="any"
            value="0"
          >

        </div>

        <div class="field">

          <label
            for="product-warehouse"
          >
            WAREHOUSE
          </label>

          <select
            class="control"
            id="product-warehouse"
            name="warehouse"
            required
          >
            ${warehouseOptions}
          </select>

        </div>

        <div class="field">

          <label
            for="product-location"
          >
            INITIAL LOCATION
          </label>

          <input
            class="control"
            id="product-location"
            name="location"
            type="text"
            placeholder="Rack A"
            value="Rack A"
            required
          >

        </div>
      `,

      onSubmit: async formData => {
        try {
          

          await productsService.add({
            name:
              formData.get(
                "name"
              ),

            sku:
              formData.get(
                "sku"
              ),

            category:
              formData.get(
                "category"
              ),

            unit:
              formData.get(
                "unit"
              ),

            reorderLevel:
              Number(
                formData.get(
                  "reorderLevel"
                )
              ) || 0,

            initialStock:
              Number(
                formData.get(
                  "initialStock"
                )
              ) || 0,

            warehouse:
              formData.get(
                "warehouse"
              ),

            location:
              formData.get(
                "location"
              )
          });

          await renderPage();

          showToast(
            "Product added successfully."
          );

        } catch (error) {
          console.error(
            "Product creation error:",
            error
          );

          showToast(
            error.message
          );

          throw error;
        }
      }
    });

  } catch (error) {
    console.error(
      "Product form error:",
      error
    );

    showToast(
      error.message
    );
  }
}

async function showWarehouseForm() {
  showModal({
    title: "Add warehouse",
    submitText: "Save warehouse",

    content: `
      <div class="field">

        <label
          for="warehouse-name"
        >
          WAREHOUSE NAME
        </label>

        <input
          class="control"
          id="warehouse-name"
          name="name"
          type="text"
          placeholder="Main Warehouse"
          required
        >

      </div>

      <div class="field">

        <label
          for="warehouse-location"
        >
          LOCATION
        </label>

        <input
          class="control"
          id="warehouse-location"
          name="location"
          type="text"
          placeholder="Mohali"
        >

      </div>
    `,

    onSubmit: async formData => {
      try {
        
        const name =
          formData.get(
            "name"
          )?.trim();

        const location =
          formData.get(
            "location"
          )?.trim();

        if (!name) {
          throw new Error(
            "Warehouse name is required."
          );
        }

        const {
          error
        } = await supabase
          .from("warehouses")
          .insert({
            name,
            location:
              location || null
          });

        if (error) {
          throw new Error(
            error.message
          );
        }

        await renderPage();

        showToast(
          "Warehouse added successfully."
        );

      } catch (error) {
        console.error(
          "Warehouse creation error:",
          error
        );

        showToast(
          error.message
        );

        throw error;
      }
    }
  });
}

function filterVisibleRows(
  searchTerm
) {
  const query =
    searchTerm
      .trim()
      .toLowerCase();

  const rows =
    document.querySelectorAll(
      "tbody tr"
    );

  rows.forEach(row => {
    if (!query) {
      row.hidden = false;
      return;
    }

    row.hidden =
      !row.textContent
        .toLowerCase()
        .includes(query);
  });
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function formatRelativeTime(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return formatDate(value);
}

function getOperationTypeLabel(
  type
) {
  const labels = {
    receipt: "Receipt",
    delivery: "Delivery",
    transfer: "Internal Transfer",
    adjustment: "Adjustment"
  };

  return (
    labels[type] ||
    type ||
    "Operation"
  );
}

function getStatusLabel(
  status
) {
  const labels = {
    draft: "Draft",
    waiting: "Waiting",
    ready: "Ready",
    done: "Done",
    cancelled: "Canceled"
  };

  return (
    labels[status] ||
    status ||
    "Unknown"
  );
}

function normalizeStatus(
  status
) {
  return String(
    status || ""
  )
    .trim()
    .toLowerCase();
}

function normalizeType(
  type
) {
  return String(
    type || ""
  )
    .trim()
    .toLowerCase();
}

function isPendingStatus(
  status
) {
  return [
    "draft",
    "waiting",
    "ready"
  ].includes(
    normalizeStatus(
      status
    )
  );
}

function getBasePagePath() {
  return isInsidePagesFolder
    ? "../"
    : "./";
}

function redirectToLogin() {
  const loginPath =
    isInsidePagesFolder
      ? "../login.html"
      : "./login.html";

  window.location.href =
    loginPath;
}

function redirectToDashboard() {
  window.location.href =
    `${basePath}index.html`;
}

function getCurrentFileName() {
  const pathname =
    window.location.pathname;

  const fileName =
    pathname
      .split("/")
      .pop();

  return (
    fileName ||
    "index.html"
  );
}

function isPublicPage() {
  return [
    "login.html",
    "signup.html",
    "reset-password.html"
  ].includes(
    getCurrentFileName()
  );
}

function isDashboardPage() {
  return (
    currentPage ===
    "dashboard"
  );
}

function showLoadingState() {
  if (!app) {
    return;
  }

  app.innerHTML = `
    <section class="page-loading">
      <div class="spinner"></div>

      <p>
        Loading StockSense...
      </p>
    </section>
  `;
}

function showPageError(
  error
) {
  console.error(
    "StockSense page error:",
    error
  );

  if (!app) {
    return;
  }

  app.innerHTML = `
    <section class="panel error-panel">

      <div class="panel-head">

        <div>
          <h2>
            Something went wrong
          </h2>

          <p class="muted">
            ${
              escapeHtml(
                error?.message ||
                "Unable to load this page."
              )
            }
          </p>
        </div>

        <button
          class="btn btn-primary"
          type="button"
          onclick="window.location.reload()"
        >
          Try again
        </button>

      </div>

    </section>
  `;
}

async function checkAuthentication() {
  try {
    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();

    if (error) {
      throw error;
    }

    return data?.session || null;

  } catch (error) {
    console.error(
      "Authentication check failed:",
      error
    );

    return null;
  }
}

async function initializeApplication() {
  try {
    showLoadingState();

    const session =
      await checkAuthentication();

    if (
      !isPublicPage() &&
      !session
    ) {
      redirectToLogin();
      return;
    }

    if (
      isPublicPage() &&
      session
    ) {
      redirectToDashboard();
      return;
    }

    await renderPage();

  } catch (error) {
    showPageError(
      error
    );
  }
}

supabase.auth.onAuthStateChange(
  (event, session) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {
      if (!isPublicPage()) {
        redirectToLogin();
      }

      return;
    }

    if (
      event ===
      "SIGNED_IN" &&
      isPublicPage()
    ) {
      redirectToDashboard();
    }
  }
);

attachGlobalEvents();

initializeApplication();