import { getData, saveData } from "./data.service.js";

export const productsService = {
  /**
   * Return all active products.
   */
  list() {
    const data = getData();

    return data.products.filter(product => product.isActive !== false);
  },

  /**
   * Find a product by its ID.
   */
  getById(productId) {
    const data = getData();

    return data.products.find(product => product.id === productId) || null;
  },

  /**
   * Add a product to the catalog.
   */
  add(productDetails) {
    validateProduct(productDetails);

    const data = getData();
    const skuAlreadyExists = data.products.some(
      product =>
        product.sku.toLowerCase() === productDetails.sku.trim().toLowerCase()
    );

    if (skuAlreadyExists) {
      throw new Error("A product with this SKU already exists.");
    }

    const product = {
      id: createProductId(),
      name: productDetails.name.trim(),
      sku: productDetails.sku.trim(),
      category: productDetails.category.trim(),
      unit: productDetails.unit.trim(),
      initialStock: Number(productDetails.initialStock) || 0,
      quantity: Number(productDetails.initialStock) || 0,
      warehouse: productDetails.warehouse.trim(),
      location: productDetails.location.trim(),
      reorderLevel: Number(productDetails.reorderLevel) || 0,
      isActive: true
    };

    data.products.push(product);
    saveData(data);

    return product;
  },

  /**
   * Update the editable details of an existing product.
   * Stock quantity is changed by inventory operations, not this function.
   */
  update(productId, changes) {
    const data = getData();
    const product = data.products.find(item => item.id === productId);

    if (!product) {
      throw new Error("Product could not be found.");
    }

    const updatedDetails = {
      ...product,
      ...changes,
      name: changes.name?.trim() ?? product.name,
      sku: changes.sku?.trim() ?? product.sku,
      category: changes.category?.trim() ?? product.category,
      unit: changes.unit?.trim() ?? product.unit,
      warehouse: changes.warehouse?.trim() ?? product.warehouse,
      location: changes.location?.trim() ?? product.location,
      reorderLevel:
        changes.reorderLevel === undefined
          ? product.reorderLevel
          : Number(changes.reorderLevel)
    };

    validateProduct(updatedDetails, { checkStock: false });

    const duplicateSku = data.products.some(
      item =>
        item.id !== productId &&
        item.sku.toLowerCase() === updatedDetails.sku.toLowerCase()
    );

    if (duplicateSku) {
      throw new Error("Another product is already using this SKU.");
    }

    Object.assign(product, updatedDetails);
    saveData(data);

    return product;
  },

  /**
   * Archive a product without removing its movement history.
   */
  archive(productId) {
    const data = getData();
    const product = data.products.find(item => item.id === productId);

    if (!product) {
      throw new Error("Product could not be found.");
    }

    product.isActive = false;
    saveData(data);

    return product;
  }
};

function validateProduct(product, options = {}) {
  const { checkStock = true } = options;

  if (!product.name?.trim()) {
    throw new Error("Enter a product name.");
  }

  if (!product.sku?.trim()) {
    throw new Error("Enter a SKU or product code.");
  }

  if (!product.category?.trim()) {
    throw new Error("Choose a product category.");
  }

  if (!product.unit?.trim()) {
    throw new Error("Enter a unit of measure.");
  }

  if (!product.warehouse?.trim()) {
    throw new Error("Choose a warehouse.");
  }

  if (!product.location?.trim()) {
    throw new Error("Enter a stock location.");
  }

  if (Number(product.reorderLevel) < 0) {
    throw new Error("The reorder level cannot be negative.");
  }

  if (checkStock && Number(product.initialStock) < 0) {
    throw new Error("Initial stock cannot be negative.");
  }
}

function createProductId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `product-${Date.now()}`;
}