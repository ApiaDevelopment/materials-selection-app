# Product-Vendor Test Data Summary

## Overview

Comprehensive product-vendor relationship data has been seeded to support testing all coordination scenarios. This document outlines what test data is available and how to use it.

**Total Relationships:** 47 product-vendor pairs  
**Last Seeded:** February 4, 2026  
**Script:** `seed_product_vendors.py`

---

## Test Scenario 1: Products with 1 Vendor (Auto-Select)

These products have exactly one vendor, so the system should auto-select that vendor when the product is chosen.

| Product             | Model Number | Manufacturer      | Vendor   | Cost    |
| ------------------- | ------------ | ----------------- | -------- | ------- |
| Undermount Sink     | K-2209-0     | Kohler            | Ferguson | $245.00 |
| Toilet Paper Holder | K-21954-2MB  | Kohler            | Ferguson | $42.00  |
| Towel Ring          | K-21955-2MB  | Kohler            | Ferguson | $38.00  |
| Pedestal Sink       | AS-0611000   | American Standard | Ferguson | $425.00 |
| Tub Spout           | D-RP19895    | Delta             | Ferguson | $45.00  |

**Expected Behavior:**

- Select any product above
- Vendor should auto-select to Ferguson
- Cost should populate automatically
- Vendor dropdown should show only Ferguson (filtered)

---

## Test Scenario 2: Products with 2 Vendors (Primary Selection)

These products have two vendor options with a designated primary vendor.

### Kohler Faucet & Drain (K-22022-4-2MB)

- **Ferguson** (Primary): $189.00
- **Amazon**: $165.00

### Kohler Toilet (K-30810-0)

- **Ferguson** (Primary): $425.00
- **Home Depot**: $399.00

**Expected Behavior:**

- Select product → Auto-selects primary vendor (Ferguson)
- Vendor dropdown shows both options (filtered to these 2)
- User can change to alternative vendor
- Cost updates when vendor changed

---

## Test Scenario 3: Products with 3+ Vendors (Multi-Vendor)

### Kohler Hardware Handles (K-26640-2MB) - 3 Vendors

1. **Ferguson** (Primary): $12.50
2. Amazon: $9.99
3. Home Depot: $11.50

### Moen Kitchen Faucet (M-7594SRS) - 4 Vendors

1. **Ferguson** (Primary): $299.00
2. Home Depot: $279.00
3. Amazon: $265.00 (cheapest)
4. Lowes: $289.00

### Daltile Porcelain Floor Tile (DT-12X24-WHT) - 3 Vendors

1. **Standard Lumber** (Primary): $3.50/sq ft
2. Home Depot: $3.75/sq ft
3. Menards: $3.25/sq ft (cheapest)

### Daltile Subway Wall Tile (DT-3X6-WHT) - 3 Vendors

1. **Standard Lumber** (Primary): $4.25/sq ft
2. Home Depot: $4.50/sq ft
3. Menards: $3.95/sq ft (cheapest)

**Expected Behavior:**

- Select product → Auto-selects primary vendor
- Vendor dropdown shows all valid vendors (filtered list)
- Cost reflects selected vendor's price
- Changing vendor updates cost

---

## Test Scenario 4: Cross-Manufacturer Vendor Testing

Test that one vendor carries multiple manufacturers' products, enabling proper manufacturer filtering when vendor selected first.

### Ferguson Carries:

- **Kohler**: Hardware Handles, Faucet, Toilet, Sink, Mirror, Medicine Cabinet
- **Moen**: Shower Trim, Handheld Shower
- **Delta**: Shower Faucet, Tub Spout
- **American Standard**: Toilet, Pedestal Sink

### Home Depot Carries:

- **Kohler**: Hardware Handles, Toilet
- **Moen**: Kitchen Faucet, Shower Trim, Handheld Shower
- **Delta**: Shower Faucet, Tub Spout
- **Daltile**: All three tile products

### Amazon Carries:

- **Kohler**: Hardware Handles, Faucet
- **Moen**: Kitchen Faucet, Shower Trim
- **Delta**: Shower Faucet
- **American Standard**: Toilet
- **Signature**: Wall Sconce
- **Panasonic**: Both exhaust fans

**Test Scenario C (Vendor-First):**

1. Select **Ferguson** → Manufacturer dropdown should show: Kohler, Moen, Delta, American Standard
2. Select **Moen** → Product dropdown should show: Shower Trim, Handheld Shower (only Moen products Ferguson carries)
3. Select product → Vendor stays as Ferguson, all fields populated

---

## Test Scenario 5: Manufacturer-First Testing

### Kohler Products (8 total):

- Available from: Ferguson, Amazon, Home Depot, Ferguson Home
- Test: Select Kohler → Products filter to Kohler only → Vendors filter to those carrying Kohler

### Moen Products (3 total):

- Available from: Ferguson, Home Depot, Amazon, Lowes
- Test: Select Moen → Products filter to Moen only → Vendors filter to those carrying Moen

### Daltile Products (3 total):

- Available from: Standard Lumber, Home Depot, Menards
- Test: Select Daltile → Products filter to Daltile only → Vendors filter to tile vendors

---

## Test Scenario 6: Specialty/Exclusive Products

### Custom Cabinetry (Exclusive to ProSource Wholesale)

- Vanity Cabinet (WW-VAN30) - $1850.00
- Medicine Cabinet (WW-MED2430) - $675.00

**Expected Behavior:**

- Select either product → Only ProSource Wholesale available
- Select ProSource first → Only WW Woods products shown

### High-End Kohler (Ferguson & Ferguson Home)

- LED Mirror (K-26050-BLG): Ferguson $895 (Primary), Ferguson Home $865
- Medicine Cabinet (K-99007-TLC-NA): Ferguson $1245 (Primary), Ferguson Home $1195

---

## Test Scenario 7: Price Comparison Testing

Products with significant price variations across vendors:

### Best Price Differences:

1. **Kohler Hardware Handles**: Amazon $9.99 vs Ferguson $12.50 (20% savings)
2. **Moen Kitchen Faucet**: Amazon $265 vs Ferguson $299 (11% savings)
3. **Kohler Faucet & Drain**: Amazon $165 vs Ferguson $189 (13% savings)
4. **Daltile Floor Tile**: Menards $3.25 vs Home Depot $3.75 (13% savings)

Use these to test that cost updates correctly when vendor changed.

---

## Test Scenario 8: Products with NO Vendors

Not all products have vendor relationships. Check the products table for items without relationships to test the 0-vendor scenario.

**Expected Behavior:**

- Select product with no vendors
- Vendor field should remain empty
- Cost should be 0 or manual entry
- Vendor dropdown should show all vendors (no filtering needed)

---

## Resetting Test Data

To reset and re-seed the data:

```bash
python seed_product_vendors.py
```

This script:

1. Clears all existing product-vendor relationships
2. Seeds 47 new relationships covering all test scenarios
3. Properly sets primary vendor flags
4. Uses Decimal types for DynamoDB compatibility

---

## Testing Checklist

### Scenario A: Product-First

- [ ] Select 1-vendor product → Auto-selects vendor, cost populated
- [ ] Select 2-vendor product → Auto-selects primary, can change to alternative
- [ ] Select 4-vendor product → Auto-selects primary, dropdown shows only valid vendors
- [ ] Change vendor → Cost updates correctly
- [ ] Verify manufacturer auto-populated

### Scenario B: Manufacturer-First

- [ ] Select Kohler → Products filtered to Kohler, Vendors filtered correctly
- [ ] Select product → Auto-selects primary vendor
- [ ] Change manufacturer → Product and vendor cleared
- [ ] Re-select different manufacturer → New filtered lists

### Scenario C: Vendor-First

- [ ] Select Ferguson → Manufacturers filtered (Kohler, Moen, Delta, American Standard)
- [ ] Select Moen → Products filtered to Moen products Ferguson carries
- [ ] Select product → Vendor stays Ferguson (not cleared)
- [ ] Verify all fields populated correctly

### Edge Cases

- [ ] Product with 0 vendors → No auto-selection, manual entry allowed
- [ ] Change from 1-vendor product to 2-vendor product → Proper reset
- [ ] Cancel operation → All fields cleared
- [ ] Save operation → All fields cleared for next add

### Data Integrity

- [ ] Cannot select invalid vendor for product
- [ ] Cost matches selected vendor's price
- [ ] Primary vendor always selected first when multiple options
- [ ] Manufacturer-product relationship maintained

---

## Notes

- All costs use Decimal type for DynamoDB compatibility
- Primary vendor flag ensures consistent auto-selection
- Relationships cover real-world scenarios from spreadsheet data
- Use different products to test different vendor count scenarios
