const STORAGE_KEY = "stocksense-demo-data";

const startingData = {
  products: [
    {
      id: "product-1",
      name: "Steel Rods",
      sku: "SKU-1005",
      category: "Raw Materials",
      unit: "kg",
      initialStock: 300,
      quantity: 50,
      warehouse: "Main Warehouse",
      location: "Rack A",
      reorderLevel: 60
    },
    {
      id: "product-2",
      name: "Bolt M8 × 40",
      sku: "SKU-2007",
      category: "Hardware",
      unit: "pcs",
      initialStock: 800,
      quantity: 240,
      warehouse: "Main Warehouse",
      location: "Rack B",
      reorderLevel: 100
    },
    {
      id: "product-3",
      name: "Plywood Sheets",
      sku: "SKU-3013",
      category: "Raw Materials",
      unit: "sheet",
      initialStock: 200,
      quantity: 50,
      warehouse: "Main Warehouse",
      location: "Rack A",
      reorderLevel: 50
    },
    {
      id: "product-4",
      name: "Office Chairs",
      sku: "SKU-4011",
      category: "Finished Goods",
      unit: "pcs",
      initialStock: 40,
      quantity: 20,
      warehouse: "Main Warehouse",
      location: "Dispatch",
      reorderLevel: 20
    },
    {
      id: "product-5",
      name: "Packing Tape",
      sku: "SKU-5022",
      category: "Packaging",
      unit: "roll",
      initialStock: 40,
      quantity: 10,
      warehouse: "West Warehouse",
      location: "Shelf C",
      reorderLevel: 20
    },
    {
      id: "product-6",
      name: "Protective Gloves",
      sku: "SKU-8010",
      category: "Safety",
      unit: "pair",
      initialStock: 120,
      quantity: 0,
      warehouse: "West Warehouse",
      location: "Shelf D",
      reorderLevel: 25
    }
  ],

  operations: [
    {
      reference: "RCV-0148",
      type: "receipt",
      description: "Steel rods from Vendor B",
      productName: "Steel Rods",
      quantity: 50,
      partner: "Vendor B",
      warehouse: "Main Warehouse",
      location: "Rack A",
      status: "waiting",
      createdAt: "Today"
    },
    {
      reference: "OUT-0086",
      type: "delivery",
      description: "Order for Customer Y",
      productName: "Office Chairs",
      quantity: 10,
      partner: "Customer Y",
      warehouse: "Main Warehouse",
      location: "Dispatch",
      status: "ready",
      createdAt: "Today"
    },
    {
      reference: "TRF-0031",
      type: "transfer",
      description: "Rack A to Production Floor",
      productName: "Steel Rods",
      quantity: 20,
      partner: "Internal transfer",
      warehouse: "Main Warehouse",
      location: "Rack A",
      destinationLocation: "Production Floor",
      status: "draft",
      createdAt: "Sep 25"
    },
    {
      reference: "ADJ-0012",
      type: "adjustment",
      description: "Cycle count for Packing Tape",
      productName: "Packing Tape",
      quantity: 2,
      partner: "Cycle count",
      warehouse: "West Warehouse",
      location: "Shelf C",
      status: "done",
      createdAt: "Sep 24"
    }
  ],

  movements: [
    {
      id: "movement-1",
      productName: "Steel Rods",
      quantityChange: 50,
      type: "receipt",
      source: "Vendor B",
      destination: "Main Warehouse · Rack A",
      timeLabel: "Today, 10:42 AM"
    },
    {
      id: "movement-2",
      productName: "Office Chairs",
      quantityChange: -10,
      type: "delivery",
      source: "Main Warehouse · Dispatch",
      destination: "Customer Y",
      timeLabel: "Today, 9:18 AM"
    },
    {
      id: "movement-3",
      productName: "Packing Tape",
      quantityChange: -2,
      type: "adjustment",
      source: "West Warehouse · Shelf C",
      destination: "Stock correction",
      timeLabel: "Sep 24, 4:05 PM"
    },
    {
      id: "movement-4",
      productName: "Bolt M8 × 40",
      quantityChange: 80,
      type: "transfer",
      source: "Main Warehouse · Rack B",
      destination: "West Warehouse · Rack A",
      timeLabel: "Sep 24, 11:30 AM"
    }
  ]
};

/**
 * Read the inventory data from this browser.
 * If this is the first visit, start with the sample data above.
 */
export function getData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Could not load StockSense demo data:", error);
  }

  const freshData = structuredClone(startingData);
  saveData(freshData);

  return freshData;
}

/**
 * Save the current inventory data in this browser.
 */
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save StockSense demo data:", error);
  }
}

/**
 * Add an operation such as a receipt or delivery.
 * New operations start as drafts unless another status is provided.
 */
export function createOperation(operationDetails) {
  const data = getData();
  const operationType = operationDetails.type || "receipt";
  const prefix = getReferencePrefix(operationType);

  const operation = {
    ...operationDetails,
    reference: `${prefix}-${Date.now().toString().slice(-5)}`,
    status: operationDetails.status || "draft",
    createdAt: "Today"
  };

  data.operations.unshift(operation);
  saveData(data);

  return operation;
}

/**
 * Validate an operation and apply its stock change.
 * A validated operation also creates a movement-history entry.
 */
export function completeOperation(reference) {
  const data = getData();

  const operation = data.operations.find(
    item => item.reference === reference
  );

  if (!operation || operation.status === "done") {
    return false;
  }

  const product = data.products.find(
    item => item.name === operation.productName
  );

  if (!product) {
    console.error(`Product not found for operation ${reference}.`);
    return false;
  }

  const oldQuantity = Number(product.quantity);
  const operationQuantity = Number(operation.quantity);
  let quantityChange = 0;

  if (operation.type === "receipt") {
    product.quantity = oldQuantity + operationQuantity;
    quantityChange = operationQuantity;
  }

  if (operation.type === "delivery") {
    product.quantity = oldQuantity - operationQuantity;
    quantityChange = -operationQuantity;
  }

  if (operation.type === "transfer") {
    // A transfer moves stock to another location but does not change
    // the total quantity of this product.
    product.location =
      operation.destinationLocation || product.location;

    quantityChange = operationQuantity;
  }

  if (operation.type === "adjustment") {
    // For an adjustment, quantity is the newly counted physical stock.
    product.quantity = operationQuantity;
    quantityChange = operationQuantity - oldQuantity;
  }

  operation.status = "done";
  operation.completedAt = new Date().toISOString();

  data.movements.unshift({
    id: `movement-${Date.now()}`,
    productName: product.name,
    quantityChange,
    type: operation.type,
    source: getMovementSource(operation),
    destination: getMovementDestination(operation),
    timeLabel: "Just now"
  });

  saveData(data);

  return true;
}

function getReferencePrefix(type) {
  const prefixes = {
    receipt: "RCV",
    delivery: "OUT",
    transfer: "TRF",
    adjustment: "ADJ"
  };

  return prefixes[type] || "OPS";
}

function getMovementSource(operation) {
  if (operation.type === "receipt") {
    return operation.partner || "Supplier";
  }

  return `${operation.warehouse} · ${operation.location}`;
}

function getMovementDestination(operation) {
  if (operation.type === "delivery") {
    return operation.partner || "Customer";
  }

  if (operation.type === "transfer") {
    return `${operation.warehouse} · ${
      operation.destinationLocation || "New location"
    }`;
  }

  if (operation.type === "receipt") {
    return `${operation.warehouse} · ${operation.location}`;
  }

  return "Stock correction";
}