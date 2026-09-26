/**
 * Calculate the numbers shown in the dashboard KPI cards.
 */
export function getDashboardSummary(data) {
  const totalUnits = data.products.reduce((total, product) => {
    return total + Number(product.quantity || 0);
  }, 0);

  const lowStockProducts = data.products.filter(product => {
    const quantity = Number(product.quantity || 0);
    const reorderLevel = Number(product.reorderLevel || 0);

    return quantity > 0 && quantity <= reorderLevel;
  });

  const outOfStockProducts = data.products.filter(product => {
    return Number(product.quantity || 0) === 0;
  });

  return {
    totalUnits,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    pendingReceipts: countPendingOperations(data, "receipt"),
    pendingDeliveries: countPendingOperations(data, "delivery"),
    pendingTransfers: countPendingOperations(data, "transfer")
  };
}

/**
 * Filter dashboard operations by the selected filter values.
 *
 * Example filters:
 * {
 *   type: "receipt",
 *   status: "waiting",
 *   warehouse: "Main Warehouse",
 *   category: "Raw Materials"
 * }
 */
export function filterOperations(operations, products, filters = {}) {
  return operations.filter(operation => {
    const product = products.find(item => {
      return item.name === operation.productName;
    });

    const matchesType =
      !filters.type ||
      filters.type === "all" ||
      operation.type === filters.type;

    const matchesStatus =
      !filters.status ||
      filters.status === "all" ||
      operation.status === filters.status;

    const matchesWarehouse =
      !filters.warehouse ||
      filters.warehouse === "all" ||
      operation.warehouse === filters.warehouse;

    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      product?.category === filters.category;

    return (
      matchesType &&
      matchesStatus &&
      matchesWarehouse &&
      matchesCategory
    );
  });
}

/**
 * Filter products by warehouse and category.
 */
export function filterProducts(products, filters = {}) {
  return products.filter(product => {
    const matchesWarehouse =
      !filters.warehouse ||
      filters.warehouse === "all" ||
      product.warehouse === filters.warehouse;

    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      product.category === filters.category;

    return matchesWarehouse && matchesCategory;
  });
}

function countPendingOperations(data, type) {
  return data.operations.filter(operation => {
    const isCorrectType = operation.type === type;
    const isStillOpen =
      operation.status !== "done" &&
      operation.status !== "cancelled";

    return isCorrectType && isStillOpen;
  }).length;
}