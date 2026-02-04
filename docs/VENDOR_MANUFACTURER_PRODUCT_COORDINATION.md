# Vendor/Manufacturer/Product Coordination Logic

## Overview

This document explains the coordinated selection logic for Vendor, Manufacturer, and Product fields in the inline "Add Line Item" functionality in ProjectDetail.tsx. The implementation supports three distinct user workflows while maintaining data integrity through product-vendor relationships.

## Three Supported Scenarios

### SCENARIO A: Product-First Selection

**User Flow:**

1. User selects Product first
2. System auto-populates:
   - Manufacturer (from product.manufacturerId)
   - Vendor (primary vendor or first vendor from product-vendor relationships)
3. Vendor list is filtered to show only vendors carrying this specific product
4. User can change vendor, but only to valid options for this product

**Key Behaviors:**

- Material, unit, cost, name, modelNumber auto-populated from product/vendor data
- Product list expands to full `allProducts` after selection (allows exploring other products)
- Vendor auto-selection logic based on count:
  - **0 vendors**: No vendor selected, cost = 0
  - **1 vendor**: Auto-select that vendor
  - **2+ vendors**: Auto-select primary vendor (or first), keep list filtered to valid vendors

**Code Location:** `handleProductSelect()` function

---

### SCENARIO B: Manufacturer-First Selection

**User Flow:**

1. User selects Manufacturer first
2. System filters:
   - Products to only that manufacturer's products
   - Vendors to only those carrying that manufacturer's products
3. User selects Product
4. System auto-selects primary vendor from filtered list

**Key Behaviors:**

- Changing manufacturer (from one value to another) clears all dependent fields:
  - productId, vendorId, modelNumber, material, unit, unitCost, name
- This ensures data integrity (old product belonged to old manufacturer)
- Product list filtered by manufacturer selection
- Vendor list filtered to vendors carrying that manufacturer's products

**Code Location:** `handleManufacturerChange()` function

---

### SCENARIO C: Vendor-First Selection

**User Flow:**

1. User selects Vendor first
2. System filters:
   - Manufacturers to only those whose products this vendor carries
   - Products to only those this vendor carries
3. User selects Manufacturer
4. System **keeps vendor** and filters products by BOTH vendor AND manufacturer
5. User selects Product
6. All fields populated (vendor already set from step 1)

**Key Behaviors:**

- Vendor selection preserved when manufacturer is selected (different from Scenario B)
- Detection logic: `vendorId exists && manufacturerId was previously undefined`
- Products filtered by both vendor AND manufacturer for valid combinations
- If product already selected when vendor changed, list expands to full products

**Code Location:** `handleNewItemVendorChange()` and `handleManufacturerChange()` functions

---

## Key Architectural Decisions

### 1. Product-Vendor Relationship: 1-to-Many

- One product can be sold by multiple vendors at different prices
- Each product-vendor pair has its own cost (stored in `productVendors` table)
- When product is selected, vendor list is **ALWAYS** filtered to show only vendors carrying that product
- This maintains data integrity and prevents invalid product-vendor combinations

### 2. Dual Product Lists

```typescript
const [products, setProducts] = useState<Product[]>([]); // Filtered display list
const [allProducts, setAllProducts] = useState<Product[]>([]); // Full unfiltered reference
```

**Why two lists?**

When user selects manufacturer, we filter `products` to show only that manufacturer's products. However, `getFilteredManufacturers()` needs to see ALL products to determine which manufacturers are available for a selected vendor.

Using the filtered list would create a circular dependency where:

1. Select manufacturer → filters products to that manufacturer
2. Filtered products only show selected manufacturer
3. Manufacturer dropdown now only shows one manufacturer
4. User can't change manufacturer anymore ❌

Using `allProducts` as an immutable reference prevents this circular filtering bug.

### 3. Manufacturer Change Behavior

The `handleManufacturerChange()` function has conditional logic:

**Case 1: Vendor already selected, manufacturer being selected for first time**

- **Action**: Keep vendor, update manufacturer, filter products by BOTH
- **Scenario**: Scenario C (vendor-first selection)
- **Detection**: `vendorId exists && previousManufacturerId === undefined`

**Case 2: Manufacturer being changed or selected without vendor**

- **Action**: Clear all dependent fields (productId, vendorId, modelNumber, material, unit, unitCost, name)
- **Scenario**: Scenario B (manufacturer-first) or changing manufacturer
- **Reason**: Data integrity - old product belongs to old manufacturer

### 4. Material Field: Read-Only

The Material field is displayed as a read-only div (not an input) with gray background:

```tsx
<div className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs bg-gray-50 text-gray-600">
  {newItem.material || "-"}
</div>
```

Material is auto-populated from `product.description` when product is selected.

### 5. Reset on Save/Cancel

Both Save and Cancel operations completely reset the add line item form:

```typescript
setNewItem({
  categoryId: "",
  projectId: id || "",
  name: "",
  material: "",
  quantity: 0,
  unit: "",
  unitCost: 0,
  notes: "",
  status: "pending",
  vendorId: undefined,
  manufacturerId: undefined,
  productId: undefined,
  modelNumber: undefined,
});
setProducts(allProducts); // Reset to full unfiltered list
```

This prevents values from being carried over between add operations.

---

## Filter Functions

### `getFilteredManufacturers()`

**Purpose:** Filters manufacturer dropdown based on current selection state

**Priority Rules:**

1. If product selected → Show ALL manufacturers (selection locked, allow exploration)
2. If vendor selected (no product) → Show only manufacturers whose products this vendor carries
3. If neither selected → Show all manufacturers

**Critical Detail:** Uses `allProducts` (not filtered `products`) to prevent circular filtering bug.

### `getFilteredVendors()`

**Purpose:** Filters vendor dropdown based on current selection state

**Priority Rules:**

1. If product selected → **ALWAYS** show only vendors carrying this specific product
   - Ensures valid product-vendor relationship
   - Even if vendor already selected, list stays filtered to valid options
2. If manufacturer selected (no product) → Show vendors carrying that manufacturer's products
3. If neither selected → Show all vendors

**Key Insight:** Product-vendor relationship is 1-to-many, so vendor list must always stay filtered to valid vendors once product is selected.

---

## Data Integrity Rules

### Product-Vendor Validation

- ✅ Product can only be paired with vendors that carry it
- ✅ Each product-vendor pair has a specific cost from `productVendors` table
- ✅ Vendor list automatically filtered when product selected

### Manufacturer Change Integrity

- ✅ Changing manufacturer clears product/vendor (prevents orphaned relationships)
- ✅ Scenario C exception: First-time manufacturer selection with vendor preserves vendor

### State Reset Integrity

- ✅ Save operation clears all fields to prevent cross-contamination
- ✅ Cancel operation clears all fields and resets product list
- ✅ Product list reset to `allProducts` ensures next add starts fresh

---

## Code Structure

### State Variables

```typescript
const [products, setProducts] = useState<Product[]>([]); // Filtered display list
const [allProducts, setAllProducts] = useState<Product[]>([]); // Full unfiltered reference
const [newItem, setNewItem] = useState<Partial<LineItem>>({
  // ... includes vendorId, manufacturerId, productId, modelNumber
});
```

### Handler Functions

- **`handleNewItemVendorChange(vendorId: string)`** - Scenario C vendor-first
- **`handleManufacturerChange(manufacturerId: string)`** - Scenarios B & C manufacturer handling
- **`handleProductSelect(productId: string)`** - Scenario A product-first

### Filter Functions

- **`getFilteredManufacturers()`** - Dynamic manufacturer dropdown filtering
- **`getFilteredVendors()`** - Dynamic vendor dropdown filtering

### Reset Functions

- **`handleAddLineItem()`** - Saves item and resets form
- **Cancel button onClick** - Resets form without saving

---

## Testing Scenarios

### Test Scenario A: Product-First

1. Select Product from dropdown
2. Verify Manufacturer auto-populated
3. Verify Vendor auto-selected (primary or first)
4. Verify Material, Unit, Cost populated
5. Verify Vendor dropdown shows only valid vendors
6. Change vendor to another valid option
7. Verify cost updates to new vendor's cost

### Test Scenario B: Manufacturer-First

1. Select Manufacturer from dropdown
2. Verify Product list filtered to that manufacturer
3. Verify Vendor list filtered to vendors carrying manufacturer's products
4. Select Product
5. Verify Vendor auto-selected (primary)
6. Change Manufacturer
7. Verify Product and Vendor cleared

### Test Scenario C: Vendor-First

1. Select Vendor from dropdown
2. Verify Manufacturer list filtered to manufacturers carried by vendor
3. Verify Product list filtered to vendor's products
4. Select Manufacturer
5. **Verify Vendor NOT cleared** (key difference)
6. Verify Product list further filtered by manufacturer
7. Select Product
8. Verify all fields populated with vendor already set

### Edge Cases

- Product with 0 vendors (no vendor selected, cost = 0)
- Product with 1 vendor (auto-select that vendor)
- Product with 2+ vendors (auto-select primary, show filtered list)
- Changing manufacturer after selecting product (should clear product/vendor)
- Canceling add operation (should clear all fields and reset product list)

---

## TODO: Insert Product Modal

The Insert Product modal may need similar coordination logic. Review the modal's vendor/manufacturer/product selection flow to determine if the same patterns should be applied for consistency and data integrity.

**Location to review:** Insert Product modal in ProjectDetail.tsx

---

## Deployment History

**Last Updated:** February 4, 2026

**Recent Changes:**

- Fixed Scenario C to preserve vendor when manufacturer selected for first time
- Added comprehensive inline documentation
- Simplified vendor filtering to always filter by product when product selected
- Added manufacturer change clearing logic with Scenario C exception

**File:** `src/components/ProjectDetail.tsx` (4242 lines)

**Bundle Size:** 423.55 kB (gzip: 110.00 kB)
