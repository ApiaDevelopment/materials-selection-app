# LineItem Options Architecture Analysis

**Date:** February 9, 2026  
**Status:** Analysis Complete - Implementation Pending

## Current Architecture

**LineItem table has:**

- `productId` (optional) - direct foreign key
- `vendorId`, `manufacturerId` (optional) - direct foreign keys
- `modelNumber`, `vendorName`, `manufacturerName` - denormalized data
- This is used in **50+ places** in ProjectDetail.tsx alone

**LineItemOptions table has:**

- Just alternative products (Good/Better/Best options)
- `lineItemId`, `productId`, `unitCost`

**PowerPoint export:**

- Filters `lineItems.filter((item) => item.productId)`
- Fetches product details for slides

## Proposed Architecture Evolution

### Makes Conceptual Sense:

- LineItemOptions becomes the single source of truth for ALL product associations
- Add `isSelected` boolean field to mark the active product
- Cleaner data model - no denormalization
- Better audit trail (can track when selections changed)

## What Would Need to Change (Full Migration)

### 1. **Database (DynamoDB)**

- Add `isSelected: boolean` to LineItemOptions
- Add validation: max 1 `isSelected=true` per lineItemId
- **Migration**: Copy all existing `lineItem.productId` → new LineItemOption records with `isSelected=true`

### 2. **Backend (lambda/index.js)**

- New endpoint: `PUT /lineitem-options/{id}/select` - sets isSelected, clears others for that lineItemId
- Update `GET /lineitems/{id}` to include selected option data (or require frontend to join)
- Add validation to prevent multiple selected options

### 3. **Frontend Types**

- Add `isSelected: boolean` to LineItemOption interface
- Possibly add computed field: `selectedOption?: LineItemOption` to LineItem for convenience

### 4. **Frontend Services**

- New method: `lineItemOptionService.selectOption(optionId)`
- Update `lineItemService` to fetch selected options with line items

### 5. **ProjectDetail.tsx - MAJOR REFACTOR**

- Replace **50+ references** to `item.productId` with `item.selectedOption?.productId`
- Update all product selection handlers to work with LineItemOptions
- Update all display logic (model number, manufacturer, vendor shown in 7+ places)
- The "Select Product" modal would need to create LineItemOption with `isSelected=true`

### 6. **PowerPoint Export**

- Change from `item.productId` to `item.selectedOption?.productId`
- Update product fetching logic

### 7. **Data Migration Script**

- Convert all existing line items with products to LineItemOptions
- Validate no data loss

## Risks & Considerations

**Performance:**

- Every line item display now requires fetching/joining LineItemOptions
- Could mitigate by fetching all options for all line items in one batch query (using GSI)

**Complexity:**

- Simple line item operations become more complex
- More database round trips potentially

**Breaking Changes:**

- This touches almost every part of the application
- Extensive testing required

## Implementation Approaches

### Option 1: Full Migration (NOT RECOMMENDED FOR NOW)

Remove `productId` from LineItem entirely, use only LineItemOptions

**Pros:**

- Cleanest data model
- Single source of truth
- Better audit trail

**Cons:**

- Massive refactor (50+ changes in ProjectDetail alone)
- Performance concerns (requires joins)
- High risk of bugs
- Breaking change across entire application

---

### Option 2: Hybrid Approach ⭐ (RECOMMENDED - FUTURE)

**Phase 1 - Add isSelected, Keep productId:**

1. Add `isSelected` field to LineItemOptions
2. Keep `productId` on LineItem as a denormalized cache
3. Backend keeps them in sync (when option selected → update LineItem.productId)
4. Migrate existing data to LineItemOptions

**Benefits:**

- Backward compatible
- Better performance (no joins needed for display)
- Gradual migration
- LineItemOptions is still source of truth, LineItem just caches for performance

**Phase 2 - Optional Cleanup:**

- Once proven stable, could remove productId from LineItem if desired
- But honestly, keeping it as a cached field is practical

**Implementation Steps for Hybrid:**

1. **Database Changes:**
   - Add `isSelected` boolean to LineItemOptions table
   - Default: `false`

2. **Backend Updates (lambda/index.js):**
   - Update `createLineItemOption` to accept optional `isSelected` parameter
   - New endpoint: `PUT /lineitem-options/{id}/select` that:
     - Sets this option's `isSelected = true`
     - Sets all other options for this lineItemId to `isSelected = false`
     - Updates the parent LineItem with this option's productId, unitCost, etc.
   - Update `getLineItemOptions` to return `isSelected` field

3. **Frontend Changes:**
   - Add `isSelected: boolean` to LineItemOption interface
   - Add "Select" button in ChooseOptionsModal
   - When clicked, call new `selectOption` endpoint
   - Refresh line item data to show updated product
   - Keep option in the list (marked as isSelected)

4. **Migration Script:**
   - For each line item with productId:
     - Create a LineItemOption with that productId and `isSelected=true`
     - If unitCost differs, use LineItem's unitCost

---

### Option 3: Simple Approach ✅ (IMPLEMENTING FIRST)

**What to do NOW:**

- Add "Select" button to ChooseOptionsModal
- Clicking Select:
  - Updates the LineItem with that option's productId/unitCost/modelNumber/etc
  - Removes that option from LineItemOptions (since it's now the "selected" one on the LineItem)
  - Closes the modal
  - Refreshes the line item display

**This works with current architecture, zero schema changes.**

**Implementation Steps:**

1. **Backend (lambda/index.js):**
   - Update existing `updateLineItem` endpoint to accept product selection updates
   - OR create specific endpoint: `PUT /lineitems/{id}/select-product` that:
     - Accepts productId, unitCost
     - Fetches product details (model, manufacturer)
     - Updates LineItem with all product-related fields
     - Returns updated LineItem

2. **Frontend Service:**
   - Add method: `lineItemService.selectProduct(lineItemId, productId, unitCost)`
   - OR use existing `updateLineItem` method

3. **ChooseOptionsModal.tsx:**
   - Add "Select" button column (or change "Add" to "Select" for already-added options)
   - Handler:
     ```typescript
     const handleSelectOption = async (option: LineItemOption) => {
       const product = products.find((p) => p.id === option.productId);
       await lineItemService.updateLineItem(lineItem.id, {
         productId: option.productId,
         unitCost: option.unitCost,
         modelNumber: product?.modelNumber,
         // ... other product fields
       });
       await lineItemOptionService.deleteOption(option.id); // Remove from options
       onOptionsChanged(); // Refresh parent
       onClose();
     };
     ```

4. **No database changes required**
5. **No migration required**
6. **Works with all existing code**

**After this works, we can later migrate to Hybrid approach.**

---

## Implementation Plan

### Phase 1: Simple Approach (CURRENT)

- [x] Analysis complete
- [ ] Add "Select" button to ChooseOptionsModal
- [ ] Implement select handler (update LineItem, delete option)
- [ ] Test thoroughly
- [ ] Deploy

### Phase 2: Hybrid Approach (FUTURE)

- [ ] Add `isSelected` field to LineItemOptions schema
- [ ] Create backend endpoint for selecting options
- [ ] Update frontend to use isSelected
- [ ] Data migration script
- [ ] Keep productId on LineItem as cache
- [ ] Test and validate sync logic

### Phase 3: Optional Full Migration (TBD)

- [ ] Evaluate if removing productId from LineItem is worth the effort
- [ ] Likely answer: NO - denormalization is practical for performance

## Decision Log

**2026-02-09:**

- Decided to implement Simple Approach first
- Will follow with Hybrid Approach once proven
- Full migration not recommended due to risk/complexity vs. benefit
