"""
Seed comprehensive product-vendor relationship data for testing coordination logic.

This script creates product-vendor relationships covering various test scenarios:
- Products with 0 vendors (no availability)
- Products with 1 vendor (auto-select)
- Products with 2+ vendors (with and without primary designation)
- Multiple vendors for same product with different costs
- Products from different manufacturers carried by same vendor
"""

import boto3
from uuid import uuid4
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Get existing data
vendors_table = dynamodb.Table('MaterialsSelection-Vendors')
products_table = dynamodb.Table('MaterialsSelection-Products')
manufacturers_table = dynamodb.Table('MaterialsSelection-Manufacturers')
product_vendors_table = dynamodb.Table('MaterialsSelection-ProductVendors')

vendors_response = vendors_table.scan()
vendors = {item['name'].strip(): item['id'] for item in vendors_response['Items']}

products_response = products_table.scan()
products = {}
for item in products_response['Items']:
    # Key by model number for easier matching
    products[item['modelNumber']] = item

manufacturers_response = manufacturers_table.scan()
manufacturers = {item['id']: item['name'] for item in manufacturers_response['Items']}

print(f"Found {len(vendors)} vendors")
for name in vendors.keys():
    print(f"  {name}")

print(f"\nFound {len(products)} products")
print(f"Found {len(manufacturers)} manufacturers\n")

# Clear existing product-vendor relationships (for clean testing)
print("Clearing existing product-vendor relationships...")
existing_pv = product_vendors_table.scan()
for item in existing_pv.get('Items', []):
    product_vendors_table.delete_item(Key={'id': item['id']})
    print(f"  Deleted: {item['id']}")
print()

# Define comprehensive product-vendor relationships
# Format: (product_model_number, vendor_name, cost, is_primary)
relationships = [
    # ===== SCENARIO: Products with 1 vendor (auto-select) =====
    ('K-2209-0', 'Ferguson', Decimal('245.00'), True),  # Kohler Undermount Sink
    ('K-21954-2MB', 'Ferguson', Decimal('42.00'), True),  # Kohler TP Holder
    ('K-21955-2MB', 'Ferguson', Decimal('38.00'), True),  # Kohler Towel Ring
    
    # ===== SCENARIO: Products with 2 vendors (primary designation) =====
    ('K-22022-4-2MB', 'Ferguson', Decimal('189.00'), True),   # Kohler Faucet & Drain - PRIMARY
    ('K-22022-4-2MB', 'Amazon', Decimal('165.00'), False),    # Kohler Faucet & Drain - cheaper alternative
    
    ('K-30810-0', 'Ferguson', Decimal('425.00'), True),  # Kohler Toilet - PRIMARY
    ('K-30810-0', 'Home Depot', Decimal('399.00'), False),  # Kohler Toilet - cheaper
    
    # ===== SCENARIO: Products with 3+ vendors (test multi-vendor filtering) =====
    ('K-26640-2MB', 'Ferguson', Decimal('12.50'), True),   # Kohler Hardware Handles - PRIMARY
    ('K-26640-2MB', 'Amazon', Decimal('9.99'), False),     # Kohler Hardware Handles - cheapest
    ('K-26640-2MB', 'Home Depot', Decimal('11.50'), False),  # Kohler Hardware Handles - mid-price
    
    ('M-7594SRS', 'Ferguson', Decimal('299.00'), True),   # Moen Kitchen Faucet - PRIMARY
    ('M-7594SRS', 'Home Depot', Decimal('279.00'), False),  # Moen Kitchen Faucet
    ('M-7594SRS', 'Amazon', Decimal('265.00'), False),    # Moen Kitchen Faucet - cheapest
    ('M-7594SRS', 'Lowes', Decimal('289.00'), False),     # Moen Kitchen Faucet
    
    # ===== SCENARIO: Same vendor carries multiple manufacturers' products =====
    # Ferguson carries Kohler, Moen, Delta, American Standard
    ('M-TS22002', 'Ferguson', Decimal('189.00'), True),  # Moen Shower Trim
    ('M-3869', 'Ferguson', Decimal('78.00'), True),      # Moen Handheld Shower
    ('D-T14294', 'Ferguson', Decimal('165.00'), True),   # Delta Shower Faucet
    ('D-RP19895', 'Ferguson', Decimal('45.00'), True),   # Delta Tub Spout
    ('AS-2988101', 'Ferguson', Decimal('385.00'), True), # American Standard Toilet
    
    # Home Depot carries Kohler, Moen, Delta
    ('M-TS22002', 'Home Depot', Decimal('179.00'), False),  # Moen Shower Trim
    ('M-3869', 'Home Depot', Decimal('72.00'), False),      # Moen Handheld Shower
    ('D-T14294', 'Home Depot', Decimal('159.00'), False),   # Delta Shower Faucet
    ('D-RP19895', 'Home Depot', Decimal('42.00'), False),   # Delta Tub Spout
    
    # Amazon carries various manufacturers at competitive prices
    ('M-TS22002', 'Amazon', Decimal('169.00'), False),  # Moen Shower Trim
    ('D-T14294', 'Amazon', Decimal('152.00'), False),   # Delta Shower Faucet
    ('AS-2988101', 'Amazon', Decimal('365.00'), False), # American Standard Toilet
    
    # ===== SCENARIO: Specialty items =====
    ('S 2165BZ-CG', 'Ferguson Home', Decimal('189.00'), True),  # Signature Wall Sconce
    ('S 2165BZ-CG', 'Amazon', Decimal('175.00'), False),    # Signature Wall Sconce
    
    ('FV-0510VS1', 'Ferguson Home', Decimal('145.00'), True),   # Panasonic Bath Fan
    ('FV-0510VS1', 'Amazon', Decimal('135.00'), False),     # Panasonic Bath Fan
    ('FV-0510VSL1', 'Ferguson Home', Decimal('185.00'), True),  # Panasonic LED Fan
    ('FV-0510VSL1', 'Amazon', Decimal('175.00'), False),    # Panasonic LED Fan
    
    # ===== SCENARIO: Tile products (multiple vendors, price variations) =====
    ('DT-12X24-WHT', 'Standard Lumber', Decimal('3.50'), True),  # Daltile Floor Tile per sq ft - PRIMARY
    ('DT-12X24-WHT', 'Home Depot', Decimal('3.75'), False),      # Daltile Floor Tile
    ('DT-12X24-WHT', 'Menards', Decimal('3.25'), False),         # Daltile Floor Tile - cheaper
    
    ('DT-3X6-WHT', 'Standard Lumber', Decimal('4.25'), True),  # Daltile Subway Tile per sq ft
    ('DT-3X6-WHT', 'Home Depot', Decimal('4.50'), False),      # Daltile Subway Tile
    ('DT-3X6-WHT', 'Menards', Decimal('3.95'), False),         # Daltile Subway Tile - cheaper
    
    ('DT-MOSAIC-GRY', 'Standard Lumber', Decimal('12.50'), True),     # Daltile Mosaic - PRIMARY
    ('DT-MOSAIC-GRY', 'Home Depot', Decimal('13.25'), False),         # Daltile Mosaic
    
    # ===== SCENARIO: High-end products (fewer vendor options) =====
    ('K-99007-TLC-NA', 'Ferguson', Decimal('1245.00'), True),  # Kohler Medicine Cabinet - PRIMARY
    ('K-99007-TLC-NA', 'Ferguson Home', Decimal('1195.00'), False),  # Kohler Medicine Cabinet
    
    # ===== SCENARIO: Custom/Local vendors (exclusive products) =====
    ('WW-VAN30', 'ProSource Wholesale', Decimal('1850.00'), True),     # Custom Vanity - exclusive
    
    # ===== SCENARIO: Products with NO vendors (orphaned products for testing) =====
    # The following products are INTENTIONALLY left without vendor relationships:
    # - WW-MED2430 (WW Woods Medicine Cabinet) - 0 vendors
    # - K-26050-BLG (Kohler LED Mirror) - 0 vendors  
    # - AS-0611000 (American Standard Pedestal Sink) - 0 vendors
    # These test the scenario where product has no available vendors
]

print("Seeding product-vendor relationships...")
added_count = 0
skipped_count = 0
error_count = 0

for model_number, vendor_name, cost, is_primary in relationships:
    # Find product
    product = products.get(model_number)
    if not product:
        print(f"  ⚠️  Product not found: {model_number}")
        skipped_count += 1
        continue
    
    # Find vendor
    vendor_id = vendors.get(vendor_name)
    if not vendor_id:
        print(f"  ⚠️  Vendor not found: {vendor_name}")
        skipped_count += 1
        continue
    
    try:
        # If setting as primary, check if another primary exists and unset it
        if is_primary:
            # Query existing relationships for this product
            existing_response = product_vendors_table.scan(
                FilterExpression='productId = :pid AND isPrimary = :true',
                ExpressionAttributeValues={
                    ':pid': product['id'],
                    ':true': True
                }
            )
            
            # Unset any existing primary
            for existing in existing_response.get('Items', []):
                product_vendors_table.update_item(
                    Key={'id': existing['id']},
                    UpdateExpression='SET isPrimary = :false',
                    ExpressionAttributeValues={':false': False}
                )
        
        # Create product-vendor relationship
        pv_id = str(uuid4())
        product_vendors_table.put_item(Item={
            'id': pv_id,
            'productId': product['id'],
            'vendorId': vendor_id,
            'cost': cost,
            'isPrimary': is_primary,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat(),
        })
        
        manufacturer_name = manufacturers.get(product.get('manufacturerId', ''), 'Unknown')
        primary_flag = ' [PRIMARY]' if is_primary else ''
        print(f"  ✓ {product['name']} ({manufacturer_name}) → {vendor_name} @ ${cost:.2f}{primary_flag}")
        added_count += 1
        
    except Exception as e:
        print(f"  ✗ Error adding {model_number} + {vendor_name}: {e}")
        error_count += 1

print(f"\n{'='*80}")
print(f"✅ Seed complete!")
print(f"   Added: {added_count} relationships")
print(f"   Skipped: {skipped_count}")
print(f"   Errors: {error_count}")
print(f"{'='*80}\n")

# Print summary by scenario
print("SUMMARY BY TEST SCENARIO:")
print("\n1. Products with 1 vendor (auto-select):")
print("   - K-2209-0 (Kohler Undermount Sink)")
print("   - K-21954-2MB (Kohler TP Holder)")
print("   - K-21955-2MB (Kohler Towel Ring)")

print("\n2. Products with 2 vendors (primary vs alternative):")
print("   - K-22022-4-2MB (Kohler Faucet)")
print("   - K-30810-0 (Kohler Toilet)")

print("\n3. Products with 3+ vendors (multi-vendor testing):")
print("   - K-26640-2MB (Kohler Hardware Handles) - 3 vendors")
print("   - M-7594SRS (Moen Kitchen Faucet) - 4 vendors")

print("\n4. Same vendor carries multiple manufacturers:")
print("   - Ferguson: Kohler, Moen, Delta, American Standard")
print("   - Home Depot: Kohler, Moen, Delta")
print("   - Amazon: Various manufacturers")

print("\n5. Specialty vendors (limited lines):")
print("   - Ferguson Home: Signature lighting, Panasonic, Kohler high-end")
print("   - Standard Lumber: Daltile tile products")
print("   - ProSource Wholesale: Custom cabinetry (exclusive)")

print("\n6. Products with NO vendors (test 0-vendor scenario):")
print("   - WW-MED2430 (WW Woods Medicine Cabinet)")
print("   - K-26050-BLG (Kohler LED Mirror)")
print("   - AS-0611000 (American Standard Pedestal Sink)")
print("   These products should appear in product list but have no vendor options")

print("\n" + "="*80)
