/**
 * Check whether a value contains non-whitespace text.
 */
export function isRequired(value) {
  return String(value ?? "").trim().length > 0;
}

/**
 * Check that a value can be read as a number greater than zero.
 */
export function isPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0;
}

/**
 * Check that a value is a number that is zero or greater.
 */
export function isNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0;
}

/**
 * Basic email format check for sign-in and sign-up forms.
 */
export function isValidEmail(value) {
  const email = String(value ?? "").trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check whether a password has at least eight characters.
 */
export function isValidPassword(value) {
  return String(value ?? "").length >= 8;
}

/**
 * Validate the required fields for a product.
 * Returns an array of error messages. An empty array means it is valid.
 */
export function validateProduct(product) {
  const errors = [];

  if (!isRequired(product.name)) {
    errors.push("Enter a product name.");
  }

  if (!isRequired(product.sku)) {
    errors.push("Enter a SKU or product code.");
  }

  if (!isRequired(product.category)) {
    errors.push("Choose a product category.");
  }

  if (!isRequired(product.unit)) {
    errors.push("Enter a unit of measure.");
  }

  if (!isRequired(product.warehouse)) {
    errors.push("Choose a warehouse.");
  }

  if (!isRequired(product.location)) {
    errors.push("Enter a stock location.");
  }

  if (!isNonNegativeNumber(product.initialStock)) {
    errors.push("Initial stock must be zero or greater.");
  }

  if (!isNonNegativeNumber(product.reorderLevel)) {
    errors.push("Reorder level must be zero or greater.");
  }

  return errors;
}

/**
 * Validate an operation before saving it.
 * For an adjustment, quantity represents the newly counted stock.
 */
export function validateOperation(operation) {
  const errors = [];
  const supportedTypes = [
    "receipt",
    "delivery",
    "transfer",
    "adjustment"
  ];

  if (!supportedTypes.includes(operation.type)) {
    errors.push("Choose a valid operation type.");
  }

  if (!isRequired(operation.productName)) {
    errors.push("Choose a product.");
  }

  const quantityIsValid =
    operation.type === "adjustment"
      ? isNonNegativeNumber(operation.quantity)
      : isPositiveNumber(operation.quantity);

  if (!quantityIsValid) {
    errors.push(
      operation.type === "adjustment"
        ? "Counted quantity must be zero or greater."
        : "Quantity must be greater than zero."
    );
  }

  if (!isRequired(operation.warehouse)) {
    errors.push("Choose a warehouse.");
  }

  if (!isRequired(operation.location)) {
    errors.push("Enter the stock location.");
  }

  if (
    operation.type === "transfer" &&
    !isRequired(operation.destinationLocation)
  ) {
    errors.push("Enter the transfer destination.");
  }

  return errors;
}