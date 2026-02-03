import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
products_table = dynamodb.Table('MaterialsSelection-Products')

# Get all products and add URLs for some of them based on real manufacturer sites
response = products_table.scan()
products = response['Items']

# Map model numbers to actual product URLs
product_urls = {
    'K-2209-0': 'https://www.kohler.com/en/products/bathroom-sinks/shop-bathroom-sinks/caxton-undermount-bathroom-sink-793214',
    'K-22022-4-2MB': 'https://www.kohler.com/en/products/bathroom-faucets/shop-bathroom-faucets/composed-widespread-bathroom-sink-faucet-1145421',
    'K-30810-0': 'https://www.kohler.com/en/products/toilets/shop-toilets/corbelle-comfort-height-skirted-one-piece-compact-elongated-dual-flush-toilet-1148389',
    'K-26640-2MB': 'https://www.kohler.com/en/products/cabinet-hardware/shop-cabinet-hardware/margaux-drawer-pull-1143653',
    'K-21954-2MB': 'https://www.kohler.com/en/products/bathroom-accessories/shop-bathroom-accessories/margaux-pivoting-toilet-tissue-holder-1145089',
    'K-21955-2MB': 'https://www.kohler.com/en/products/bathroom-accessories/shop-bathroom-accessories/margaux-towel-ring-1145091',
    'FV-0510VS1': 'https://na.panasonic.com/us/home-and-building-solutions/ventilation-indoor-air-quality/ventilation-fans/whispervalue-dc-fv-0510vs1',
    'FV-0510VSL1': 'https://na.panasonic.com/us/home-and-building-solutions/ventilation-indoor-air-quality/ventilation-fans/whispervalue-dc-led-fv-0510vsl1',
}

print("Updating products with URLs...")
updated_count = 0

for product in products:
    model_number = product.get('modelNumber', '')
    if model_number in product_urls:
        try:
            products_table.update_item(
                Key={'id': product['id']},
                UpdateExpression='SET productUrl = :url',
                ExpressionAttributeValues={':url': product_urls[model_number]}
            )
            print(f"  ✓ Updated {product['name']} ({model_number})")
            updated_count += 1
        except Exception as e:
            print(f"  ✗ Failed to update {product['name']}: {e}")

print(f"\n✅ Updated {updated_count} products with URLs")
