# Fix Lambda integrations to use correct account ID
$apiId = "xrld1hq3e2"
$correctLambdaUri = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

Write-Host "Fixing Lambda integrations to use correct account (634752426026)..."

# Fix /products POST
Write-Host "Fixing /products POST..."
aws apigateway put-integration --rest-api-id $apiId --resource-id 1z63lw --http-method POST --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

# Fix /products/{productId} GET, PUT, DELETE
Write-Host "Fixing /products/{productId}..."
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method GET --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

# Fix /manufacturers POST
Write-Host "Fixing /manufacturers POST..."
aws apigateway put-integration --rest-api-id $apiId --resource-id 6t75zr --http-method POST --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

# Fix /manufacturers/{manufacturerId} GET, PUT, DELETE
Write-Host "Fixing /manufacturers/{manufacturerId}..."
aws apigateway put-integration --rest-api-id $apiId --resource-id sfq8od --http-method GET --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id sfq8od --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id sfq8od --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

# Fix /vendors POST
Write-Host "Fixing /vendors POST..."
aws apigateway put-integration --rest-api-id $apiId --resource-id 3f6bow --http-method POST --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

# Fix /vendors/{vendorId} GET, PUT, DELETE
Write-Host "Fixing /vendors/{vendorId}..."
aws apigateway put-integration --rest-api-id $apiId --resource-id yla3k3 --http-method GET --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id yla3k3 --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri
aws apigateway put-integration --rest-api-id $apiId --resource-id yla3k3 --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $correctLambdaUri

Write-Host "`nDeploying fix..."
$deployment = aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --description "Fixed Lambda account ID for products/manufacturers/vendors" | ConvertFrom-Json
Write-Host "Deployment ID: $($deployment.id)"
Write-Host "`n✅ All integrations fixed!"
