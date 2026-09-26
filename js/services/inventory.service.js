import { supabase } from "../config/supabase.js";

export const inventoryService = {
  async listBalances() {
    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          category,
          unit,
          initial_stock,
          reorder_level,
          locations (
            id,
            name,
            warehouses (
              id,
              name,
              location
            )
          )
        `)
        .order("name");

    if (productsError) {
      throw new Error(productsError.message);
    }

    const { data: movements, error: movementsError } =
      await supabase
        .from("stock_movements")
        .select(`
          product_id,
          quantity,
          quantity_change,
          movement_type,
          status
        `)
        .eq("status", "done");

    if (movementsError) {
      throw new Error(movementsError.message);
    }

    return (products || []).map(product => {
      const quantity = calculateProductQuantity(
        product,
        movements || []
      );

      const location = product.locations;
      const warehouse = location?.warehouses;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category || "",
        unit: product.unit || "Unit",
        warehouse: warehouse?.name || "",
        location: location?.name || "",
        quantity,
        reorderLevel:
          Number(product.reorder_level) || 0
      };
    });
  },

  async getProductQuantity(productId) {
    const { data: product, error: productError } =
      await supabase
        .from("products")
        .select(`
          id,
          initial_stock
        `)
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
      throw new Error(productError.message);
    }

    if (!product) {
      return null;
    }

    const { data: movements, error: movementsError } =
      await supabase
        .from("stock_movements")
        .select(`
          quantity,
          quantity_change,
          movement_type,
          status
        `)
        .eq("product_id", productId)
        .eq("status", "done");

    if (movementsError) {
      throw new Error(movementsError.message);
    }

    return calculateQuantity(
      Number(product.initial_stock) || 0,
      movements || []
    );
  },

  async getSummary() {
    const [
      productsResult,
      movementsResult,
      receiptsResult,
      deliveriesResult,
      transfersResult
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, initial_stock, reorder_level"
        ),

      supabase
        .from("stock_movements")
        .select(`
          product_id,
          quantity,
          quantity_change,
          movement_type,
          status
        `)
        .eq("status", "done"),

      supabase
        .from("operations")
        .select("id")
        .eq("operation_type", "receipt")
        .not(
          "status",
          "in",
          '("done","cancelled")'
        ),

      supabase
        .from("operations")
        .select("id")
        .eq("operation_type", "delivery")
        .not(
          "status",
          "in",
          '("done","cancelled")'
        ),

      supabase
        .from("operations")
        .select("id")
        .eq("operation_type", "transfer")
        .not(
          "status",
          "in",
          '("done","cancelled")'
        )
    ]);

    if (productsResult.error) {
      throw new Error(
        productsResult.error.message
      );
    }

    if (movementsResult.error) {
      throw new Error(
        movementsResult.error.message
      );
    }

    if (receiptsResult.error) {
      throw new Error(
        receiptsResult.error.message
      );
    }

    if (deliveriesResult.error) {
      throw new Error(
        deliveriesResult.error.message
      );
    }

    if (transfersResult.error) {
      throw new Error(
        transfersResult.error.message
      );
    }

    const products =
      productsResult.data || [];

    const movements =
      movementsResult.data || [];

    const balances = products.map(product => {
      const quantity = calculateQuantity(
        Number(product.initial_stock) || 0,
        movements.filter(
          movement =>
            movement.product_id ===
            product.id
        )
      );

      return {
        ...product,
        quantity
      };
    });

    const totalUnits = balances.reduce(
      (total, product) =>
        total + product.quantity,
      0
    );

    const lowStockProducts =
      balances.filter(product => {
        const reorderLevel =
          Number(product.reorder_level) || 0;

        return (
          product.quantity > 0 &&
          product.quantity <= reorderLevel
        );
      });

    const outOfStockProducts =
      balances.filter(
        product =>
          product.quantity <= 0
      );

    return {
      totalUnits,
      productCount: products.length,
      lowStockCount:
        lowStockProducts.length,
      outOfStockCount:
        outOfStockProducts.length,
      pendingReceipts:
        receiptsResult.data?.length || 0,
      pendingDeliveries:
        deliveriesResult.data?.length || 0,
      pendingTransfers:
        transfersResult.data?.length || 0
    };
  },

  async listLowStockProducts() {
    const balances =
      await this.listBalances();

    return balances.filter(product => {
      return (
        product.quantity <=
        product.reorderLevel
      );
    });
  },

  async listMovements() {
    const { data, error } =
      await supabase
        .from("stock_movements")
        .select(`
          id,
          operation_id,
          product_id,
          source_warehouse_id,
          destination_warehouse_id,
          source_location_id,
          destination_location_id,
          quantity,
          quantity_change,
          movement_type,
          status,
          reference,
          notes,
          created_by,
          created_at,

          products (
            name,
            sku
          ),

          source_warehouse:source_warehouse_id (
            name
          ),

          destination_warehouse:destination_warehouse_id (
            name
          ),

          source_location:source_location_id (
            name
          ),

          destination_location:destination_location_id (
            name
          )
        `)
        .eq("status", "done")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(
      movement => {
        const sourceWarehouse =
          movement.source_warehouse?.name ||
          "";

        const destinationWarehouse =
          movement.destination_warehouse?.name ||
          "";

        const sourceLocation =
          movement.source_location?.name ||
          "";

        const destinationLocation =
          movement.destination_location?.name ||
          "";

        const source =
          [
            sourceWarehouse,
            sourceLocation
          ]
            .filter(Boolean)
            .join(" · ");

        const destination =
          [
            destinationWarehouse,
            destinationLocation
          ]
            .filter(Boolean)
            .join(" · ");

        let displaySource =
          source || "—";

        let displayDestination =
          destination || "—";

        if (
          movement.movement_type ===
          "receipt"
        ) {
          displaySource = "Supplier";

          displayDestination =
            destination || "Stock";
        }

        if (
          movement.movement_type ===
          "delivery"
        ) {
          displaySource =
            source || "Stock";

          displayDestination =
            "Customer";
        }

        if (
          movement.movement_type ===
          "adjustment"
        ) {
          displaySource =
            "Inventory Adjustment";

          displayDestination =
            destination ||
            source ||
            "Stock";
        }

        if (
          movement.movement_type ===
          "transfer"
        ) {
          displaySource =
            source || "—";

          displayDestination =
            destination || "—";
        }

        const typeMap = {
          receipt: "Receipt",
          delivery: "Delivery",
          transfer: "Transfer",
          adjustment: "Adjustment"
        };

        return {
          id: movement.id,

          operationId:
            movement.operation_id,

          productId:
            movement.product_id,

          productName:
            movement.products?.name ||
            "—",

          sku:
            movement.products?.sku ||
            "—",

          type:
            typeMap[
              movement.movement_type
            ] ||
            movement.movement_type ||
            "—",

          quantity:
            Number(movement.quantity) || 0,

          quantityChange:
            Number(
              movement.quantity_change
            ) || 0,

          source:
            displaySource,

          destination:
            displayDestination,

          reference:
            movement.reference || "—",

          notes:
            movement.notes || "",

          status:
            movement.status || "",

          createdAt:
            movement.created_at,

          timeLabel:
            movement.created_at
              ? new Date(
                  movement.created_at
                ).toLocaleString(
                  "en-IN",
                  {
                    dateStyle:
                      "medium",
                    timeStyle:
                      "short"
                  }
                )
              : "—"
        };
      }
    );
  }
};

function calculateProductQuantity(
  product,
  movements
) {
  return calculateQuantity(
    Number(product.initial_stock) || 0,
    movements.filter(
      movement =>
        movement.product_id ===
        product.id
    )
  );
}

function calculateQuantity(
  initialStock,
  movements
) {
  let quantity = initialStock;

  for (const movement of movements) {
    if (
      movement.movement_type ===
      "receipt"
    ) {
      quantity +=
        Number(movement.quantity) || 0;
    }

    if (
      movement.movement_type ===
      "delivery"
    ) {
      quantity -=
        Number(movement.quantity) || 0;
    }

    if (
      movement.movement_type ===
      "adjustment"
    ) {
      quantity +=
        Number(
          movement.quantity_change
        ) || 0;
    }

    if (
      movement.movement_type ===
      "transfer"
    ) {
      // Transfer changes the location,
      // not the total stock.
    }
  }

  return Math.max(0, quantity);
}