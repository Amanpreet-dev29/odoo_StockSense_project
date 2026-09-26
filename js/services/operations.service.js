import { getData, saveData } from "./data.service.js";
import {
  createOperation as saveNewOperation,
  completeOperation as applyOperationToStock
} from "./data.service.js";

const allowedStatuses = [
  "draft",
  "waiting",
  "ready",
  "done",
  "cancelled"
];

export const operationsService = {
  /**
   * Return all operations, newest first.
   */
  list(filters = {}) {
    const data = getData();

    return data.operations
      .filter(operation => {
        const matchesType =
          !filters.type || operation.type === filters.type;

        const matchesStatus =
          !filters.status || operation.status === filters.status;

        const matchesWarehouse =
          !filters.warehouse ||
          operation.warehouse === filters.warehouse;

        return matchesType && matchesStatus && matchesWarehouse;
      })
      .sort((first, second) => {
        return new Date(second.createdAt) - new Date(first.createdAt);
      });
  },

  /**
   * Find an operation by its reference number.
   */
  getByReference(reference) {
    const data = getData();

    return (
      data.operations.find(operation => operation.reference === reference) ||
      null
    );
  },

  /**
   * Create a new receipt, delivery, transfer, or adjustment.
   */
  create(operationDetails) {
    validateOperation(operationDetails);

    return saveNewOperation({
      ...operationDetails,
      status: operationDetails.status || "draft"
    });
  },

  /**
   * Update an operation's workflow status.
   */
  setStatus(reference, newStatus) {
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`"${newStatus}" is not a supported operation status.`);
    }

    if (newStatus === "done") {
      const wasCompleted = applyOperationToStock(reference);

      if (!wasCompleted) {
        throw new Error("The operation could not be validated.");
      }

      return this.getByReference(reference);
    }

    const data = getData();
    const operation = data.operations.find(
      item => item.reference === reference
    );

    if (!operation) {
      throw new Error("Operation could not be found.");
    }

    if (operation.status === "done") {
      throw new Error("A completed operation cannot be changed.");
    }

    operation.status = newStatus;
    saveData(data);

    return operation;
  },

  /**
   * Cancel an operation that has not been completed.
   * Cancelling does not change stock.
   */
  cancel(reference) {
    const data = getData();
    const operation = data.operations.find(
      item => item.reference === reference
    );

    if (!operation) {
      throw new Error("Operation could not be found.");
    }

    if (operation.status === "done") {
      throw new Error("A completed operation cannot be cancelled.");
    }

    operation.status = "cancelled";
    saveData(data);

    return operation;
  }
};

/**
 * Keep these named exports available for app.js.
 */
export const createOperation = operationsService.create.bind(operationsService);
export const completeOperation = reference =>
  operationsService.setStatus(reference, "done");

function validateOperation(operation) {
  const supportedTypes = [
    "receipt",
    "delivery",
    "transfer",
    "adjustment"
  ];

  if (!supportedTypes.includes(operation.type)) {
    throw new Error("Choose a valid operation type.");
  }

  if (!operation.productName?.trim()) {
    throw new Error("Choose a product for this operation.");
  }

  if (!Number.isFinite(Number(operation.quantity)) ||
      Number(operation.quantity) <= 0) {
    throw new Error("Enter a quantity greater than zero.");
  }

  if (!operation.warehouse?.trim()) {
    throw new Error("Choose a warehouse.");
  }

  if (!operation.location?.trim()) {
    throw new Error("Enter the stock location.");
  }

  if (
    operation.type === "transfer" &&
    !operation.destinationLocation?.trim()
  ) {
    throw new Error("Enter the transfer destination.");
  }
}