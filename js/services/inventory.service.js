import { getData } from "./data.service.js";

export const inventoryService = {
  /**
   * Return the total quantity for every product at its current location.
   */
  listBalances() {
    const data = getData();

    return data.products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      warehouse: product.warehouse,
      location: product.location,
      quantity: Number(product.quantity) || 0,
      reorderLevel: Number(product.reorderLevel) || 0
    }));
  },

  /**
   * Find the quantity for one product.
   */
  getProductQuantity(productId) {
    const data = getData();
    const product = data.products.find(item => item.id === productId);

    if (!product) {
      return null;
    }

    return Number(product.quantity) || 0;
  },

  /**
   * Return the dashboard totals for products and stock.
   */
  getSummary() {
    const data = getData();

    const totalUnits = data.products.reduce(
      (total, product) => total + (Number(product.quantity) || 0),
      0
    );

    const lowStockProducts = data.products.filter(product => {
      const quantity = Number(product.quantity) || 0;
      const reorderLevel = Number(product.reorderLevel) || 0;

      return quantity > 0 && quantity <= reorderLevel;
    });

    const outOfStockProducts = data.products.filter(
      product => Number(product.quantity) === 0
    );

    const pendingReceipts = countPendingOperations(data, "receipt");
    const pendingDeliveries = countPendingOperations(data, "delivery");
    const pendingTransfers = countPendingOperations(data, "transfer");

    return {
      totalUnits,
      productCount: data.products.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers
    };
  },

  /**
   * Return products that are at or below their reorder level.
   */
  listLowStockProducts() {
    const data = getData();

    return data.products.filter(product => {
      const quantity = Number(product.quantity) || 0;
      const reorderLevel = Number(product.reorderLevel) || 0;

      return quantity <= reorderLevel;
    });
  },

  /**
   * Return the stock movement ledger, newest movement first.
   */
  listMovements() {
    const data = getData();

    return [...data.movements];
  }
};

function countPendingOperations(data, operationType) {
  return data.operations.filter(operation => {
    const isMatchingType = operation.type === operationType;
    const isStillPending =
      operation.status !== "done" &&
      operation.status !== "cancelled";

    return isMatchingType && isStillPending;
  }).length;
}