import { supabase } from "../config/supabase.js";

export const productsService = {
  async list() {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        category,
        unit,
        initial_stock,
        initial_location_id,
        reorder_level,
        created_at,
        updated_at,
        locations (
          id,
          name,
          warehouse_id,
          warehouses (
            id,
            name,
            location
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(mapProduct);
  },

  async getById(productId) {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        category,
        unit,
        initial_stock,
        initial_location_id,
        reorder_level,
        created_at,
        updated_at,
        locations (
          id,
          name,
          warehouse_id,
          warehouses (
            id,
            name,
            location
          )
        )
      `)
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapProduct(data) : null;
  },

  async add(productDetails) {
    validateProduct(productDetails);

    const sku = productDetails.sku.trim();

    const { data: existingProduct, error: skuError } = await supabase
      .from("products")
      .select("id")
      .ilike("sku", sku)
      .maybeSingle();

    if (skuError) {
      throw new Error(skuError.message);
    }

    if (existingProduct) {
      throw new Error("A product with this SKU already exists.");
    }

    const warehouseId = await findOrCreateWarehouse(
      productDetails.warehouse.trim()
    );

    const locationId = await findOrCreateLocation(
      warehouseId,
      productDetails.location.trim()
    );

    const productPayload = {
      name: productDetails.name.trim(),
      sku,
      category: productDetails.category.trim(),
      unit: productDetails.unit.trim(),
      initial_stock: Number(productDetails.initialStock) || 0,
      initial_location_id: locationId,
      reorder_level: Number(productDetails.reorderLevel) || 0
    };

    const { data, error } = await supabase
      .from("products")
      .insert(productPayload)
      .select(`
        id,
        name,
        sku,
        category,
        unit,
        initial_stock,
        initial_location_id,
        reorder_level,
        created_at,
        updated_at,
        locations (
          id,
          name,
          warehouse_id,
          warehouses (
            id,
            name,
            location
          )
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapProduct(data);
  },

  async update(productId, changes) {
    const existingProduct = await this.getById(productId);

    if (!existingProduct) {
      throw new Error("Product could not be found.");
    }

    const updatedDetails = {
      ...existingProduct,
      ...changes
    };

    validateProduct(updatedDetails, { checkStock: false });

    const sku = changes.sku?.trim() ?? existingProduct.sku;

    const { data: duplicateProduct, error: duplicateError } = await supabase
      .from("products")
      .select("id")
      .ilike("sku", sku)
      .neq("id", productId)
      .maybeSingle();

    if (duplicateError) {
      throw new Error(duplicateError.message);
    }

    if (duplicateProduct) {
      throw new Error("Another product is already using this SKU.");
    }

    let locationId = existingProduct.initialLocationId;

    if (changes.warehouse || changes.location) {
      const warehouseName =
        changes.warehouse?.trim() ?? existingProduct.warehouse;

      const locationName =
        changes.location?.trim() ?? existingProduct.location;

      const warehouseId = await findOrCreateWarehouse(warehouseName);

      locationId = await findOrCreateLocation(
        warehouseId,
        locationName
      );
    }

    const updatePayload = {
      name: changes.name?.trim() ?? existingProduct.name,
      sku,
      category:
        changes.category?.trim() ?? existingProduct.category,
      unit:
        changes.unit?.trim() ?? existingProduct.unit,
      reorder_level:
        changes.reorderLevel === undefined
          ? existingProduct.reorderLevel
          : Number(changes.reorderLevel),
      initial_location_id: locationId
    };

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", productId)
      .select(`
        id,
        name,
        sku,
        category,
        unit,
        initial_stock,
        initial_location_id,
        reorder_level,
        created_at,
        updated_at,
        locations (
          id,
          name,
          warehouse_id,
          warehouses (
            id,
            name,
            location
          )
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapProduct(data);
  },

  async archive(productId) {
    /*
     * The current database schema does not have an is_active
     * column, so we don't physically archive/delete the product yet.
     *
     * We will add proper archive support when we finalize the
     * product-management schema.
     */
    throw new Error(
      "Product archiving is not connected to the database yet."
    );
  }
};

function mapProduct(product) {
  const location = product.locations;
  const warehouse = location?.warehouses;

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category || "",
    unit: product.unit || "Unit",
    initialStock: Number(product.initial_stock) || 0,

    /*
     * Current stock will later be calculated from stock movements.
     * For now, initial stock is used as the starting quantity.
     */
    quantity: Number(product.initial_stock) || 0,

    warehouse: warehouse?.name || "",
    location: location?.name || "",
    warehouseId: warehouse?.id || null,
    locationId: location?.id || null,
    initialLocationId: product.initial_location_id || null,
    reorderLevel: Number(product.reorder_level) || 0,
    isActive: true,

    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
}

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

async function findOrCreateWarehouse(name) {
  const { data: existing, error: findError } = await supabase
    .from("warehouses")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("warehouses")
    .insert({
      name
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

async function findOrCreateLocation(warehouseId, name) {
  const { data: existing, error: findError } = await supabase
    .from("locations")
    .select("id")
    .eq("warehouse_id", warehouseId)
    .eq("name", name)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      warehouse_id: warehouseId,
      name
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}