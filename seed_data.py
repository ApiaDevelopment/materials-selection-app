import boto3
from uuid import uuid4

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Seed Vendors
vendors_table = dynamodb.Table('MaterialsSelection-Vendors')
vendors = [
    'Ferguson',
    'Ferguson Home',
    'Home Depot',
    'Menards',
    'Lowes',
    'Standard Lumber',
    'Amazon',
    'ProSource Wholesale',
    'CACJR Granite',
    'Shiloh Order'
]

print("Seeding Vendors...")
for vendor in vendors:
    vendors_table.put_item(Item={
        'id': str(uuid4()),
        'name': vendor,
        'contact': '',
        'website': '',
        'notes': ''
    })
    print(f"  ✓ {vendor}")

# Seed Manufacturers
manufacturers_table = dynamodb.Table('MaterialsSelection-Manufacturers')
manufacturers = [
    'Kohler',
    'Moen',
    'Delta',
    'Signature',
    'American Standard',
    'Daltile',
    'WW Woods',
    'Panasonic'
]

print("\nSeeding Manufacturers...")
for manufacturer in manufacturers:
    manufacturers_table.put_item(Item={
        'id': str(uuid4()),
        'name': manufacturer,
        'website': '',
        'notes': ''
    })
    print(f"  ✓ {manufacturer}")

print("\n✅ Seed data complete!")
