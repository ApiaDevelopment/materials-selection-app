# Fix Products, Manufacturers, and Vendors API Gateway endpoints

$apiId = "xrld1hq3e2"
$lambdaArn = "arn:aws:lambda:us-east-1:590183816485:function:MaterialsSelection-API"
$lambdaUri = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$lambdaArn/invocations"

Write-Host "=== Fixing /products endpoint ==="

# /products OPTIONS integration response
Write-Host "Adding OPTIONS integration response to /products..."
aws apigateway put-integration-response --rest-api-id $apiId --resource-id 1z63lw --http-method OPTIONS --status-code 200 --response-parameters @"
{
  \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",
  \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS'\",
  \"method.response.header.Access-Control-Allow-Origin\": \"'*'\"
}
"@

Write-Host "=== Fixing /products/{productId} endpoint ==="

# /products/{productId} GET
Write-Host "Adding GET to /products/{productId}..."
aws apigateway put-method --rest-api-id $apiId --resource-id m83lje --http-method GET --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method GET --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /products/{productId} PUT
Write-Host "Adding PUT to /products/{productId}..."
aws apigateway put-method --rest-api-id $apiId --resource-id m83lje --http-method PUT --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /products/{productId} DELETE
Write-Host "Adding DELETE to /products/{productId}..."
aws apigateway put-method --rest-api-id $apiId --resource-id m83lje --http-method DELETE --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /products/{productId} OPTIONS
Write-Host "Adding OPTIONS to /products/{productId}..."
aws apigateway put-method --rest-api-id $apiId --resource-id m83lje --http-method OPTIONS --authorization-type NONE

$mockTemplate = @'
{"application/json":"{\"statusCode\": 200}"}
'@
aws apigateway put-integration --rest-api-id $apiId --resource-id m83lje --http-method OPTIONS --type MOCK --request-templates $mockTemplate

$methodParams = @'
{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}
'@
aws apigateway put-method-response --rest-api-id $apiId --resource-id m83lje --http-method OPTIONS --status-code 200 --response-parameters $methodParams

$integParams = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,PUT,DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id m83lje --http-method OPTIONS --status-code 200 --response-parameters $integParams

Write-Host "=== Fixing /manufacturers endpoint ==="

# /manufacturers POST
Write-Host "Adding POST to /manufacturers..."
aws apigateway put-method --rest-api-id $apiId --resource-id 6t75zr --http-method POST --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id 6t75zr --http-method POST --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /manufacturers OPTIONS
Write-Host "Adding OPTIONS to /manufacturers..."
aws apigateway put-method --rest-api-id $apiId --resource-id 6t75zr --http-method OPTIONS --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id 6t75zr --http-method OPTIONS --type MOCK --request-templates $mockTemplate
aws apigateway put-method-response --rest-api-id $apiId --resource-id 6t75zr --http-method OPTIONS --status-code 200 --response-parameters $methodParams

$integParamsManuf = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id 6t75zr --http-method OPTIONS --status-code 200 --response-parameters $integParamsManuf

# Create /manufacturers/{manufacturerId}
Write-Host "Creating /manufacturers/{manufacturerId}..."
$manufIdResource = aws apigateway create-resource --rest-api-id $apiId --parent-id 6t75zr --path-part '{manufacturerId}' | ConvertFrom-Json
$manufIdResourceId = $manufIdResource.id
Write-Host "Created resource with ID: $manufIdResourceId"

# /manufacturers/{manufacturerId} GET
aws apigateway put-method --rest-api-id $apiId --resource-id $manufIdResourceId --http-method GET --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $manufIdResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /manufacturers/{manufacturerId} PUT
aws apigateway put-method --rest-api-id $apiId --resource-id $manufIdResourceId --http-method PUT --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $manufIdResourceId --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /manufacturers/{manufacturerId} DELETE
aws apigateway put-method --rest-api-id $apiId --resource-id $manufIdResourceId --http-method DELETE --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $manufIdResourceId --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /manufacturers/{manufacturerId} OPTIONS
aws apigateway put-method --rest-api-id $apiId --resource-id $manufIdResourceId --http-method OPTIONS --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $manufIdResourceId --http-method OPTIONS --type MOCK --request-templates $mockTemplate
aws apigateway put-method-response --rest-api-id $apiId --resource-id $manufIdResourceId --http-method OPTIONS --status-code 200 --response-parameters $methodParams

$integParamsManufId = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,PUT,DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $manufIdResourceId --http-method OPTIONS --status-code 200 --response-parameters $integParamsManufId

Write-Host "=== Fixing /vendors endpoint ==="

# /vendors POST
Write-Host "Adding POST to /vendors..."
aws apigateway put-method --rest-api-id $apiId --resource-id 3f6bow --http-method POST --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id 3f6bow --http-method POST --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /vendors OPTIONS
Write-Host "Adding OPTIONS to /vendors..."
aws apigateway put-method --rest-api-id $apiId --resource-id 3f6bow --http-method OPTIONS --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id 3f6bow --http-method OPTIONS --type MOCK --request-templates $mockTemplate
aws apigateway put-method-response --rest-api-id $apiId --resource-id 3f6bow --http-method OPTIONS --status-code 200 --response-parameters $methodParams

$integParamsVendor = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id 3f6bow --http-method OPTIONS --status-code 200 --response-parameters $integParamsVendor

# Create /vendors/{vendorId}
Write-Host "Creating /vendors/{vendorId}..."
$vendorIdResource = aws apigateway create-resource --rest-api-id $apiId --parent-id 3f6bow --path-part '{vendorId}' | ConvertFrom-Json
$vendorIdResourceId = $vendorIdResource.id
Write-Host "Created resource with ID: $vendorIdResourceId"

# /vendors/{vendorId} GET
aws apigateway put-method --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method GET --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /vendors/{vendorId} PUT
aws apigateway put-method --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method PUT --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /vendors/{vendorId} DELETE
aws apigateway put-method --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method DELETE --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $lambdaUri

# /vendors/{vendorId} OPTIONS
aws apigateway put-method --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method OPTIONS --authorization-type NONE
aws apigateway put-integration --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method OPTIONS --type MOCK --request-templates $mockTemplate
aws apigateway put-method-response --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method OPTIONS --status-code 200 --response-parameters $methodParams

$integParamsVendorId = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,PUT,DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $vendorIdResourceId --http-method OPTIONS --status-code 200 --response-parameters $integParamsVendorId

Write-Host "`n=== Deploying API Gateway changes ==="
$deployment = aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --description "Added CRUD methods for products, manufacturers, vendors" | ConvertFrom-Json
Write-Host "Deployment ID: $($deployment.id)"

Write-Host "`n✅ All endpoints configured and deployed!"
