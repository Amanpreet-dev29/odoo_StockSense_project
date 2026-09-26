/**
 * Format a number with thousands separators.
 * Example: 21450 becomes "21,450".
 */
export function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(number);
}

/**
 * Format a quantity together with its unit.
 * Example: formatQuantity(50, "kg") returns "50 kg".
 */
export function formatQuantity(value, unit = "") {
  const formattedNumber = formatNumber(value);

  return unit ? `${formattedNumber} ${unit}` : formattedNumber;
}

/**
 * Convert operation type values into labels for the interface.
 */
export function formatOperationType(type) {
  const operationLabels = {
    receipt: "Receipt",
    delivery: "Delivery order",
    transfer: "Internal transfer",
    adjustment: "Inventory adjustment"
  };

  return operationLabels[type] || titleCase(type);
}

/**
 * Convert a workflow status into a readable label.
 */
export function formatStatus(status) {
  const statusLabels = {
    draft: "Draft",
    waiting: "Waiting",
    ready: "Ready",
    done: "Done",
    cancelled: "Cancelled"
  };

  return statusLabels[status] || titleCase(status);
}

/**
 * Format a date for display.
 */
export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    // Some demo dates are labels like "Today", so keep them as written.
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(value) {
  return String(value ?? "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Escape text before inserting it into HTML.
 */
export function escapeHtml(value) {
  const charactersToEscape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return String(value ?? "").replace(/[&<>"']/g, character => {
    return charactersToEscape[character];
  });
}