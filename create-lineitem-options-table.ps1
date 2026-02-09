# Create LineItemOptions DynamoDB Table
# This table stores alternative product options for line items (Good/Better/Best choices)

$tableName = "MaterialsSelection-LineItemOptions"

Write-Host "Creating DynamoDB table: $tableName" -ForegroundColor Cyan

# Create table with primary key (id) and GSI for lineItemId
$gsiJson = @'
[
  {
    "IndexName": "lineItemId-index",
    "KeySchema": [
      {"AttributeName": "lineItemId", "KeyType": "HASH"}
    ],
    "Projection": {
      "ProjectionType": "ALL"
    }
  }
]
'@

aws dynamodb create-table `
    --table-name $tableName `
    --attribute-definitions `
    AttributeName=id, AttributeType=S `
    AttributeName=lineItemId, AttributeType=S `
    --key-schema `
    AttributeName=id, KeyType=HASH `
    --global-secondary-indexes $gsiJson `
    --billing-mode PAY_PER_REQUEST `
    --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Table created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for table to become ACTIVE..." -ForegroundColor Yellow
    
    # Wait for table to be active
    aws dynamodb wait table-exists --table-name $tableName --region us-east-1
    
    Write-Host "✓ Table is now ACTIVE and ready to use!" -ForegroundColor Green
}
else {
    Write-Host "✗ Failed to create table. Check error above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Table structure:" -ForegroundColor Cyan
Write-Host "  - id (Primary Key): Unique option ID"
Write-Host "  - lineItemId (GSI): Foreign key to LineItems table"
Write-Host "  - productId: Reference to product"
Write-Host "  - unitCost: Price for this option"
Write-Host "  - createdAt: Timestamp"
Write-Host "  - updatedAt: Timestamp"
