import { supabase } from "../config/supabase.js";

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

export function sidebar(
  activePage,
  basePath = "",
  userName = "User",
  userRole = "Inventory manager"
) {
  const links = navigationItems
    .map(item => {
      const activeClass =
        item.id === activePage ? " active" : "";

      return `
        <a
          class="nav-link${activeClass}"
          href="${basePath}${item.href}"
          ${
            item.id === activePage
              ? 'aria-current="page"'
              : ""
          }
        >
          <span class="nav-icon" aria-hidden="true">
            ${item.icon}
          </span>

          <span class="nav-text">
            ${item.label}
          </span>
        </a>
      `;
    })
    .join("");

  const initials = userName
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `
    <aside class="sidebar">

      <a
        class="brand"
        href="${basePath}index.html"
        aria-label="StockSense home"
      >
        <span
          class="brand-mark"
          aria-hidden="true"
        >
          ◈
        </span>

        <span class="brand-name">
          StockSense
        </span>
      </a>

      <div class="nav-label">
        Workspace
      </div>

      <nav aria-label="Main navigation">
        ${links}
      </nav>

      <div class="sidebar-bottom">

        <div class="user-chip">

          <span class="avatar" aria-hidden="true">
            ${initials || "U"}
          </span>

          <span class="user-meta">

            <span class="user-name">
              ${userName}
            </span>

            <span class="user-role">
              ${userRole}
            </span>

          </span>

        </div>

        <a
          class="nav-link"
          href="${basePath}login.html"
        >
          <span
            class="nav-icon"
            aria-hidden="true"
          >
            ↪
          </span>

          <span class="nav-text">
            Sign out
          </span>
        </a>

      </div>

    </aside>
  `;
}