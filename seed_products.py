import boto3
from uuid import uuid4

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Get existing manufacturers to link products
manufacturers_table = dynamodb.Table('MaterialsSelection-Manufacturers')
manufacturers_response = manufacturers_table.scan()
manufacturers = {item['name'].strip(): item['id'] for item in manufacturers_response['Items']}

print(f"Found {len(manufacturers)} manufacturers")
for name, id in manufacturers.items():
    print(f"  {name}: {id}")

# Seed Products based on spreadsheet data
products_table = dynamodb.Table('MaterialsSelection-Products')

# Kohler products (from Vance project)
kohler_products = [
    {
        'name': 'Hardware Handles',
        'modelNumber': 'K-26640-2MB',
        'description': 'Cabinet Hardware Handles - Matte Black',
        'category': 'Hardware'
    },
    {
        'name': 'Undermount Sink',
        'modelNumber': 'K-2209-0',
        'description': 'Undermount Bathroom Sink - White',
        'category': 'Plumbing'
    },
    {
        'name': 'Faucet & Drain',
        'modelNumber': 'K-22022-4-2MB',
        'description': '4" Centerset Bathroom Faucet with Drain - Matte Black',
        'category': 'Plumbing'
    },
    {
        'name': 'Toilet',
        'modelNumber': 'K-30810-0',
        'description': 'Corbelle Comfort Height Toilet - White',
        'category': 'Plumbing'
    },
    {
        'name': 'Toilet Paper Holder',
        'modelNumber': 'K-21954-2MB',
        'description': 'Wall-Mount Toilet Paper Holder - Matte Black',
        'category': 'Accessories'
    },
    {
        'name': 'Towel Ring',
        'modelNumber': 'K-21955-2MB',
        'description': 'Wall-Mount Towel Ring - Matte Black',
        'category': 'Accessories'
    },
    {
        'name': 'Mirror',
        'modelNumber': 'K-26050-BLG',
        'description': 'LED Lighted Mirror - Brushed Gold',
        'category': 'Lighting'
    },
    {
        'name': 'Medicine Cabinet',
        'modelNumber': 'K-99007-TLC-NA',
        'description': '24" x 30" Lighted Medicine Cabinet',
        'category': 'Storage'
    },
]

# Signature products (lighting)
signature_products = [
    {
        'name': 'Wall Sconce',
        'modelNumber': 'S 2165BZ-CG',
        'description': 'Bath Wall Sconce - Bronze with Clear Glass',
        'category': 'Lighting'
    },
]

# Panasonic products (ventilation)
panasonic_products = [
    {
        'name': 'Bath Exhaust Fan',
        'modelNumber': 'FV-0510VS1',
        'description': '100 CFM 0.9 Sone Ceiling Mounted HVI Certified Exhaust Fan',
        'category': 'Ventilation'
    },
    {
        'name': 'LED Lighted Exhaust Fan',
        'modelNumber': 'FV-0510VSL1',
        'description': '100 CFM 0.5 Sone Ceiling Mounted LED Lighted Exhaust Fan with Smart Flow Technology',
        'category': 'Ventilation'
    },
]

# Daltile products (tile)
daltile_products = [
    {
        'name': 'Porcelain Floor Tile',
        'modelNumber': 'DT-12X24-WHT',
        'description': '12" x 24" Porcelain Floor Tile - White',
        'category': 'Flooring'
    },
    {
        'name': 'Subway Wall Tile',
        'modelNumber': 'DT-3X6-WHT',
        'description': '3" x 6" Subway Wall Tile - White',
        'category': 'Wall Tile'
    },
    {
        'name': 'Mosaic Accent Tile',
        'modelNumber': 'DT-MOSAIC-GRY',
        'description': 'Hexagon Mosaic Accent Tile - Gray',
        'category': 'Wall Tile'
    },
]

# Moen products
moen_products = [
    {
        'name': 'Kitchen Faucet',
        'modelNumber': 'M-7594SRS',
        'description': 'Pull-Down Kitchen Faucet - Stainless Steel',
        'category': 'Plumbing'
    },
    {
        'name': 'Shower Trim Kit',
        'modelNumber': 'M-TS22002',
        'description': 'Posi-Temp Shower Trim Kit - Chrome',
        'category': 'Plumbing'
    },
    {
        'name': 'Handheld Shower',
        'modelNumber': 'M-3869',
        'description': 'Magnetix 6-Function Handheld Shower - Chrome',
        'category': 'Plumbing'
    },
]

# Delta products
delta_products = [
    {
        'name': 'Shower Faucet',
        'modelNumber': 'D-T14294',
        'description': 'Monitor 14 Series Shower Trim - Chrome',
        'category': 'Plumbing'
    },
    {
        'name': 'Tub Spout',
        'modelNumber': 'D-RP19895',
        'description': 'Pull-Down Diverter Tub Spout - Chrome',
        'category': 'Plumbing'
    },
]

# American Standard products
american_standard_products = [
    {
        'name': 'Toilet',
        'modelNumber': 'AS-2988101',
        'description': 'Champion 4 Right Height Elongated Toilet - White',
        'category': 'Plumbing'
    },
    {
        'name': 'Pedestal Sink',
        'modelNumber': 'AS-0611000',
        'description': 'Retrospect Pedestal Sink Combo - White',
        'category': 'Plumbing'
    },
]

# WW Woods products (custom cabinetry)
ww_woods_products = [
    {
        'name': 'Vanity Cabinet',
        'modelNumber': 'WW-VAN30',
        'description': '30" Bathroom Vanity - Shaker Style',
        'category': 'Cabinetry'
    },
    {
        'name': 'Medicine Cabinet',
        'modelNumber': 'WW-MED2430',
        'description': '24" x 30" Recessed Medicine Cabinet',
        'category': 'Storage'
    },
]

all_products = [
    (manufacturers.get('Kohler'), kohler_products),
    (manufacturers.get('Signature'), signature_products),
    (manufacturers.get('Panasonic'), panasonic_products),
    (manufacturers.get('Daltile'), daltile_products),
    (manufacturers.get('Moen'), moen_products),
    (manufacturers.get('Delta'), delta_products),
    (manufacturers.get('American Standard'), american_standard_products),
    (manufacturers.get('WW Woods'), ww_woods_products),
]

print("\nSeeding Products...")
total_added = 0

for manufacturer_id, products in all_products:
    if not manufacturer_id:
        print(f"⚠️  Skipping products - manufacturer not found")
        continue
    
    manufacturer_name = [k for k, v in manufacturers.items() if v == manufacturer_id][0]
    print(f"\n{manufacturer_name} products:")
    
    for product in products:
        try:
            products_table.put_item(Item={
                'id': str(uuid4()),
                'manufacturerId': manufacturer_id,
                'name': product['name'],
                'modelNumber': product['modelNumber'],
                'description': product['description'],
                'category': product.get('category', ''),
                'imageUrl': '',
            })
            print(f"  ✓ {product['name']} ({product['modelNumber']})")
            total_added += 1
        except Exception as e:
            print(f"  ✗ Failed to add {product['name']}: {e}")

print(f"\n✅ Seed complete! Added {total_added} products")
