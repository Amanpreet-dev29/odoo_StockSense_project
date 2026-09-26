const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "▦",
    href: "index.html"
  },
  {
    id: "products",
    label: "Products",
    icon: "⬡",
    href: "pages/products.html"
  },
  {
    id: "receipts",
    label: "Receipts",
    icon: "↙",
    href: "pages/receipts.html"
  },
  {
    id: "deliveries",
    label: "Delivery Orders",
    icon: "↗",
    href: "pages/deliveries.html"
  },
  {
    id: "transfers",
    label: "Internal Transfers",
    icon: "⇄",
    href: "pages/transfers.html"
  },
  {
    id: "adjustments",
    label: "Inventory Adjustment",
    icon: "⊕",
    href: "pages/adjustments.html"
  },
  {
    id: "move-history",
    label: "Move History",
    icon: "☷",
    href: "pages/move-history.html"
  },
  {
    id: "settings",
    label: "Warehouse & Settings",
    icon: "⚙",
    href: "pages/settings.html"
  }
];

/**
 * Create the StockSense sidebar.
 *
 * @param {string} activePage - The page ID, such as "dashboard" or "products".
 * @param {string} basePath - Use "../" on pages inside the pages folder.
 * @returns {string} Sidebar HTML.
 */
export function sidebar(activePage, basePath = "") {
  const links = navigationItems
    .map(item => {
      const activeClass = item.id === activePage ? " active" : "";

      return `
        <a
          class="nav-link${activeClass}"
          href="${basePath}${item.href}"
          ${item.id === activePage ? 'aria-current="page"' : ""}
        >
          <span class="nav-icon" aria-hidden="true">${item.icon}</span>
          <span class="nav-text">${item.label}</span>
        </a>
      `;
    })
    .join("");

  return `
    <aside class="sidebar">
      <a class="brand" href="${basePath}index.html" aria-label="StockSense home">
        <span class="brand-mark" aria-hidden="true">◈</span>
        <span class="brand-name">StockSense</span>
      </a>

      <div class="nav-label">Workspace</div>

      <nav aria-label="Main navigation">
        ${links}
      </nav>

      <div class="sidebar-bottom">
        <div class="user-chip">
          <span class="avatar" aria-hidden="true">AM</span>

          <span class="user-meta">
            <span class="user-name">Alex Morgan</span>
            <span class="user-role">Inventory manager</span>
          </span>
        </div>

        <a class="nav-link" href="${basePath}login.html">
          <span class="nav-icon" aria-hidden="true">↪</span>
          <span class="nav-text">Sign out</span>
        </a>
      </div>
    </aside>
  `;
}