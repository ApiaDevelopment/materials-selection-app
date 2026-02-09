# Create API Gateway routes for LineItemOptions
# Routes needed:
# 1. GET /lineitems/{id}/options
# 2. POST /lineitems/{id}/options
# 3. DELETE /lineitem-options/{optionId}

$apiId = "xrld1hq3e2"
$region = "us-east-1"
$accountId = "634752426026"
$lambdaArn = "arn:aws:lambda:${region}:${accountId}:function:MaterialsSelection-API"

Write-Host "Setting up LineItemOptions API routes..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Find /lineitems/{id} resource
Write-Host "Finding /lineitems/{id} resource..." -ForegroundColor Yellow
$resources = aws apigateway get-resources --rest-api-id $apiId --region $region | ConvertFrom-Json
$lineItemIdResource = $resources.items | Where-Object { $_.path -eq "/lineitems/{id}" }

if (-not $lineItemIdResource) {
    Write-Host "✗ Could not find /lineitems/{id} resource" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found resource ID: $($lineItemIdResource.id)" -ForegroundColor Green
Write-Host ""

# Step 2: Create /options resource under /lineitems/{id}
Write-Host "Creating /options resource..." -ForegroundColor Yellow
$optionsResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $lineItemIdResource.id `
  --path-part "options" `
  --region $region | ConvertFrom-Json

Write-Host "✓ Created /lineitems/{id}/options - Resource ID: $($optionsResource.id)" -ForegroundColor Green
Write-Host ""

# Step 3: Add GET method to /lineitems/{lineItemId}/options
Write-Host "Adding GET method..." -ForegroundColor Yellow
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method GET `
  --authorization-type NONE `
  --region $region | Out-Null

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method GET `
  --type AWS_PROXY `
  --integration-http-method POST `
  --uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations" `
  --region $region | Out-Null

Write-Host "✓ GET method configured" -ForegroundColor Green

# Step 4: Add POST method to /lineitems/{lineItemId}/options
Write-Host "Adding POST method..." -ForegroundColor Yellow
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method POST `
  --authorization-type NONE `
  --region $region | Out-Null

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method POST `
  --type AWS_PROXY `
  --integration-http-method POST `
  --uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations" `
  --region $region | Out-Null

Write-Host "✓ POST method configured" -ForegroundColor Green

# Step 5: Add OPTIONS method for CORS
Write-Host "Adding OPTIONS method for CORS..." -ForegroundColor Yellow
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method OPTIONS `
  --authorization-type NONE `
  --region $region | Out-Null

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method OPTIONS `
  --type MOCK `
  --request-templates '{"application/json":"{\"statusCode\":200}"}' `
  --region $region | Out-Null

# Add method response
$methodParams = '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}'
aws apigateway put-method-response `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters $methodParams `
  --region $region | Out-Null

# Add integration response
$integParams = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response `
  --rest-api-id $apiId `
  --resource-id $optionsResource.id `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters $integParams `
  --region $region | Out-Null

Write-Host "✓ OPTIONS method configured" -ForegroundColor Green
Write-Host ""

# Step 6: Create /lineitem-options resource at root
Write-Host "Creating /lineitem-options resource..." -ForegroundColor Yellow
$rootResource = $resources.items | Where-Object { $_.path -eq "/" }
$lineItemOptionsResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $rootResource.id `
  --path-part "lineitem-options" `
  --region $region | ConvertFrom-Json

Write-Host "✓ Created /lineitem-options - Resource ID: $($lineItemOptionsResource.id)" -ForegroundColor Green
Write-Host ""

# Step 7: Create /{optionId} resource under /lineitem-options
Write-Host "Creating /{optionId} resource..." -ForegroundColor Yellow
$optionIdResource = aws apigateway create-resource `
  --rest-api-id $apiId `
  --parent-id $lineItemOptionsResource.id `
  --path-part "{optionId}" `
  --region $region | ConvertFrom-Json

Write-Host "✓ Created /lineitem-options/{optionId} - Resource ID: $($optionIdResource.id)" -ForegroundColor Green
Write-Host ""

# Step 8: Add DELETE method to /lineitem-options/{optionId}
Write-Host "Adding DELETE method..." -ForegroundColor Yellow
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method DELETE `
  --authorization-type NONE `
  --region $region | Out-Null

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method DELETE `
  --type AWS_PROXY `
  --integration-http-method POST `
  --uri "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations" `
  --region $region | Out-Null

Write-Host "✓ DELETE method configured" -ForegroundColor Green

# Step 9: Add OPTIONS method for CORS on /lineitem-options/{optionId}
Write-Host "Adding OPTIONS method for CORS..." -ForegroundColor Yellow
aws apigateway put-method `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method OPTIONS `
  --authorization-type NONE `
  --region $region | Out-Null

aws apigateway put-integration `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method OPTIONS `
  --type MOCK `
  --request-templates '{"application/json":"{\"statusCode\":200}"}' `
  --region $region | Out-Null

# Add method response
aws apigateway put-method-response `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters $methodParams `
  --region $region | Out-Null

# Add integration response
$integParams2 = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response `
  --rest-api-id $apiId `
  --resource-id $optionIdResource.id `
  --http-method OPTIONS `
  --status-code 200 `
  --response-parameters $integParams2 `
  --region $region | Out-Null

Write-Host "✓ OPTIONS method configured" -ForegroundColor Green
Write-Host ""

# Step 10: Deploy to prod stage
Write-Host "Deploying to prod stage..." -ForegroundColor Yellow
$deployment = aws apigateway create-deployment `
  --rest-api-id $apiId `
  --stage-name prod `
  --region $region | ConvertFrom-Json

Write-Host "✓ Deployed! Deployment ID: $($deployment.id)" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ All LineItemOptions routes created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints available:" -ForegroundColor White
Write-Host "  GET    /lineitems/{id}/options" -ForegroundColor Gray
Write-Host "  POST   /lineitems/{id}/options" -ForegroundColor Gray
Write-Host "  DELETE /lineitem-options/{optionId}" -ForegroundColor Gray
