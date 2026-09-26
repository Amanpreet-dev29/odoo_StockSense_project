import { supabase } from "../config/supabase.js";

const allowedStatuses = [
  "draft",
  "waiting",
  "ready",
  "done",
  "cancelled"
];

const supportedTypes = [
  "receipt",
  "delivery",
  "transfer",
  "adjustment"
];

export const operationsService = {
  async list(filters = {}) {
    let query = supabase
      .from("operations")
      .select(`
        id,
        operation_number,
        operation_type,
        status,
        product_id,
        quantity,
        source_warehouse_id,
        destination_warehouse_id,
        source_location_id,
        destination_location_id,
        partner_name,
        notes,
        created_by,
        created_at,
        validated_at,
        products (
          id,
          name,
          sku,
          category,
          unit
        ),
        source_warehouse:source_warehouse_id (
          id,
          name,
          location
        ),
        destination_warehouse:destination_warehouse_id (
          id,
          name,
          location
        ),
        source_location:source_location_id (
          id,
          name
        ),
        destination_location:destination_location_id (
          id,
          name
        )
      `)
      .order("created_at", {
        ascending: false
      });

    if (filters.type) {
      query = query.eq(
        "operation_type",
        filters.type
      );
    }

    if (filters.status) {
      query = query.eq(
        "status",
        filters.status
      );
    }

    if (filters.warehouse) {
      query = query.or(
        `source_warehouse_id.eq.${filters.warehouse},destination_warehouse_id.eq.${filters.warehouse}`
      );
    }

    const {
      data,
      error
    } = await query;

    if (error) {
      throw new Error(
        error.message
      );
    }

    return (data || []).map(
      mapOperation
    );
  },

  async getByReference(reference) {
    const {
      data,
      error
    } = await supabase
      .from("operations")
      .select(`
        id,
        operation_number,
        operation_type,
        status,
        product_id,
        quantity,
        source_warehouse_id,
        destination_warehouse_id,
        source_location_id,
        destination_location_id,
        partner_name,
        notes,
        created_by,
        created_at,
        validated_at,
        products (
          id,
          name,
          sku,
          category,
          unit
        ),
        source_warehouse:source_warehouse_id (
          id,
          name,
          location
        ),
        destination_warehouse:destination_warehouse_id (
          id,
          name,
          location
        ),
        source_location:source_location_id (
          id,
          name
        ),
        destination_location:destination_location_id (
          id,
          name
        )
      `)
      .eq(
        "operation_number",
        reference
      )
      .order("created_at", {
        ascending: false
      })
      .limit(1);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (!data || data.length === 0) {
      return null;
    }

    return mapOperation(
      data[0]
    );
  },

  async create(operationDetails) {
    validateOperation(
      operationDetails
    );

    const product =
      await findProduct(
        operationDetails
      );

    if (!product) {
      throw new Error(
        "The selected product could not be found."
      );
    }

    const warehouse =
      await findWarehouse(
        operationDetails.warehouse
      );

    if (!warehouse) {
      throw new Error(
        "The selected warehouse could not be found."
      );
    }

    const location =
      await findLocation(
        warehouse.id,
        operationDetails.location
      );

    if (!location) {
      throw new Error(
        "The selected stock location could not be found."
      );
    }

    let destinationWarehouse =
      warehouse;

    let destinationLocation =
      location;

    if (
      operationDetails.type ===
      "transfer"
    ) {
      const destinationWarehouseName =
        operationDetails
          .destinationWarehouse
          ?.trim() ||
        operationDetails.warehouse.trim();

      destinationWarehouse =
        await findWarehouse(
          destinationWarehouseName
        );

      if (!destinationWarehouse) {
        throw new Error(
          "The destination warehouse could not be found."
        );
      }

      destinationLocation =
        await findLocation(
          destinationWarehouse.id,
          operationDetails.destinationLocation
        );

      if (!destinationLocation) {
        throw new Error(
          "The destination stock location could not be found."
        );
      }
    }

    const operationNumber =
      await generateOperationNumber(
        operationDetails.type
      );

    const {
      data: userData,
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(
        userError.message
      );
    }

    const userId =
      userData.user?.id || null;

    const payload = {
      operation_number:
        operationNumber,

      operation_type:
        operationDetails.type,

      status:
        operationDetails.status ||
        "draft",

      product_id:
        product.id,

      quantity:
        Number(
          operationDetails.quantity
        ),

      source_warehouse_id:
        operationDetails.type ===
        "receipt"
          ? null
          : warehouse.id,

      destination_warehouse_id:
        operationDetails.type ===
        "delivery"
          ? null
          : destinationWarehouse.id,

      source_location_id:
        operationDetails.type ===
        "receipt"
          ? null
          : location.id,

      destination_location_id:
        operationDetails.type ===
        "delivery"
          ? null
          : destinationLocation.id,

      partner_name:
        operationDetails
          .partnerName
          ?.trim() || null,

      notes:
        operationDetails.notes
          ?.trim() || null,

      created_by:
        userId
    };

    const {
      data,
      error
    } = await supabase
      .from("operations")
      .insert(payload)
      .select(`
        id,
        operation_number,
        operation_type,
        status,
        product_id,
        quantity,
        source_warehouse_id,
        destination_warehouse_id,
        source_location_id,
        destination_location_id,
        partner_name,
        notes,
        created_by,
        created_at,
        validated_at,
        products (
          id,
          name,
          sku,
          category,
          unit
        ),
        source_warehouse:source_warehouse_id (
          id,
          name,
          location
        ),
        destination_warehouse:destination_warehouse_id (
          id,
          name,
          location
        ),
        source_location:source_location_id (
          id,
          name
        ),
        destination_location:destination_location_id (
          id,
          name
        )
      `);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Operation was created but could not be loaded."
      );
    }

    return mapOperation(
      data[0]
    );
  },

  async setStatus(
    reference,
    newStatus
  ) {
    if (
      !allowedStatuses.includes(
        newStatus
      )
    ) {
      throw new Error(
        `"${newStatus}" is not a supported operation status.`
      );
    }

    const operation =
      await this.getByReference(
        reference
      );

    if (!operation) {
      throw new Error(
        "Operation could not be found."
      );
    }

    if (
      operation.status ===
      "done"
    ) {
      return operation;
    }

    if (
      operation.status ===
      "cancelled"
    ) {
      throw new Error(
        "A cancelled operation cannot be changed."
      );
    }

    if (newStatus !== "done") {
      const {
        data,
        error
      } = await supabase
        .from("operations")
        .update({
          status: newStatus
        })
        .eq(
          "id",
          operation.id
        )
        .select(`
          id,
          operation_number,
          operation_type,
          status,
          product_id,
          quantity,
          source_warehouse_id,
          destination_warehouse_id,
          source_location_id,
          destination_location_id,
          partner_name,
          notes,
          created_by,
          created_at,
          validated_at,
          products (
            id,
            name,
            sku,
            category,
            unit
          )
        `);

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (
        !data ||
        data.length === 0
      ) {
        throw new Error(
          "Operation status could not be updated."
        );
      }

      return mapOperation(
        data[0]
      );
    }

    return completeOperationInDatabase(
      operation
    );
  },

  async cancel(reference) {
    const operation =
      await this.getByReference(
        reference
      );

    if (!operation) {
      throw new Error(
        "Operation could not be found."
      );
    }

    if (
      operation.status ===
      "done"
    ) {
      throw new Error(
        "A completed operation cannot be cancelled."
      );
    }

    if (
      operation.status ===
      "cancelled"
    ) {
      return operation;
    }

    const {
      data,
      error
    } = await supabase
      .from("operations")
      .update({
        status: "cancelled"
      })
      .eq(
        "id",
        operation.id
      )
      .select(`
        id,
        operation_number,
        operation_type,
        status,
        product_id,
        quantity,
        source_warehouse_id,
        destination_warehouse_id,
        source_location_id,
        destination_location_id,
        partner_name,
        notes,
        created_by,
        created_at,
        validated_at,
        products (
          id,
          name,
          sku,
          category,
          unit
        )
      `);

    if (error) {
      throw new Error(
        error.message
      );
    }

    if (
      !data ||
      data.length === 0
    ) {
      throw new Error(
        "Operation could not be cancelled."
      );
    }

    return mapOperation(
      data[0]
    );
  }
};

export const createOperation =
  operationsService.create.bind(
    operationsService
  );

export const completeOperation =
  reference =>
    operationsService.setStatus(
      reference,
      "done"
    );

async function completeOperationInDatabase(
  operation
) {
  const {
    data: existingMovement,
    error: existingMovementError
  } = await supabase
    .from("stock_movements")
    .select("id")
    .eq(
      "operation_id",
      operation.id
    )
    .limit(1);

  if (existingMovementError) {
    throw new Error(
      existingMovementError.message
    );
  }

  /*
   * If there is no movement yet,
   * create one.
   *
   * If a movement already exists,
   * do not create a duplicate.
   */

  if (
    !existingMovement ||
    existingMovement.length === 0
  ) {
    const movementPayload = {
      operation_id:
        operation.id,

      product_id:
        operation.productId,

      source_warehouse_id:
        operation.type ===
        "receipt"
          ? null
          : operation.warehouseId,

      destination_warehouse_id:
        operation.type ===
        "delivery"
          ? null
          : operation.destinationWarehouseId,

      source_location_id:
        operation.type ===
        "receipt"
          ? null
          : operation.locationId,

      destination_location_id:
        operation.type ===
        "delivery"
          ? null
          : operation.destinationLocationId,

      quantity:
        Number(
          operation.quantity
        ),

      quantity_change:
        getQuantityChange(
          operation
        ),

      movement_type:
        operation.type,

      status: "done",

      reference:
        operation.reference,

      notes:
        operation.notes || null,

      created_by:
        operation.createdBy || null
    };

    const {
      error: movementError
    } = await supabase
      .from("stock_movements")
      .insert(
        movementPayload
      );

    if (movementError) {
      throw new Error(
        movementError.message
      );
    }
  }

  /*
   * Update the operation itself.
   */

  const {
    error: updateError
  } = await supabase
    .from("operations")
    .update({
      status: "done",
      validated_at:
        new Date().toISOString()
    })
    .eq(
      "id",
      operation.id
    );

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  /*
   * Reload the operation.
   */

  const updatedOperation =
    await operationsService.getByReference(
      operation.reference
    );

  if (!updatedOperation) {
    throw new Error(
      "Operation was validated but could not be reloaded."
    );
  }

  return updatedOperation;
}

function getQuantityChange(
  operation
) {
  if (
    operation.type ===
    "receipt"
  ) {
    return Number(
      operation.quantity
    );
  }

  if (
    operation.type ===
    "delivery"
  ) {
    return -Number(
      operation.quantity
    );
  }

  if (
    operation.type ===
    "adjustment"
  ) {
    return Number(
      operation.quantity
    );
  }

  /*
   * Transfer does not change
   * total stock quantity.
   */

  return 0;
}

function validateOperation(
  operation
) {
  if (
    !supportedTypes.includes(
      operation.type
    )
  ) {
    throw new Error(
      "Choose a valid operation type."
    );
  }

  if (
    !operation.productName?.trim() &&
    !operation.productId
  ) {
    throw new Error(
      "Choose a product for this operation."
    );
  }

  if (
    !Number.isFinite(
      Number(operation.quantity)
    ) ||
    Number(operation.quantity) <= 0
  ) {
    throw new Error(
      "Enter a quantity greater than zero."
    );
  }

  if (
    !operation.warehouse?.trim()
  ) {
    throw new Error(
      "Choose a warehouse."
    );
  }

  if (
    !operation.location?.trim()
  ) {
    throw new Error(
      "Enter the stock location."
    );
  }

  if (
    operation.type ===
      "transfer" &&
    !operation.destinationLocation?.trim()
  ) {
    throw new Error(
      "Enter the transfer destination."
    );
  }
}

async function findProduct(
  operation
) {
  if (operation.productId) {
    const {
      data,
      error
    } = await supabase
      .from("products")
      .select(
        "id, name, sku"
      )
      .eq(
        "id",
        operation.productId
      )
      .limit(1);

    if (error) {
      throw new Error(
        error.message
      );
    }

    return data?.length
      ? data[0]
      : null;
  }

  const {
    data,
    error
  } = await supabase
    .from("products")
    .select(
      "id, name, sku"
    )
    .eq(
      "name",
      operation.productName.trim()
    )
    .limit(1);

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data?.length
    ? data[0]
    : null;
}

async function findWarehouse(
  name
) {
  const {
    data,
    error
  } = await supabase
    .from("warehouses")
    .select(
      "id, name, location"
    )
    .eq(
      "name",
      name.trim()
    )
    .limit(1);

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data?.length
    ? data[0]
    : null;
}

async function findLocation(
  warehouseId,
  name
) {
  const {
    data,
    error
  } = await supabase
    .from("locations")
    .select(
      "id, name, warehouse_id"
    )
    .eq(
      "warehouse_id",
      warehouseId
    )
    .eq(
      "name",
      name.trim()
    )
    .limit(1);

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data?.length
    ? data[0]
    : null;
}

async function generateOperationNumber(
  type
) {
  const prefixes = {
    receipt: "REC",
    delivery: "DEL",
    transfer: "TRF",
    adjustment: "ADJ"
  };

  const prefix =
    prefixes[type] || "OP";

  const timestamp =
    Date.now()
      .toString()
      .slice(-8);

  return `${prefix}-${timestamp}`;
}

function mapOperation(
  operation
) {
  return {
    id: operation.id,

    reference:
      operation.operation_number,

    operationNumber:
      operation.operation_number,

    type:
      operation.operation_type,

    status:
      operation.status,

    productId:
      operation.product_id,

    productName:
      operation.products?.name ||
      "",

    sku:
      operation.products?.sku ||
      "",

    quantity:
      Number(
        operation.quantity
      ) || 0,

    warehouse:
      operation.source_warehouse
        ?.name ||
      operation.destination_warehouse
        ?.name ||
      "",

    warehouseId:
      operation.source_warehouse_id ||
      operation.destination_warehouse_id ||
      null,

    location:
      operation.source_location
        ?.name ||
      operation.destination_location
        ?.name ||
      "",

    locationId:
      operation.source_location_id ||
      operation.destination_location_id ||
      null,

    destinationWarehouse:
      operation.destination_warehouse
        ?.name ||
      "",

    destinationWarehouseId:
      operation.destination_warehouse_id ||
      null,

    destinationLocation:
      operation.destination_location
        ?.name ||
      "",

    destinationLocationId:
      operation.destination_location_id ||
      null,

    partnerName:
      operation.partner_name ||
      "",

    notes:
      operation.notes ||
      "",

    createdBy:
      operation.created_by ||
      null,

    createdAt:
      operation.created_at,

    validatedAt:
      operation.validated_at
  };
}