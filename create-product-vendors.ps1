# Create product-vendors endpoints for managing product-vendor relationships

$apiId = "xrld1hq3e2"
$lambdaUri = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

# Get root resource ID
$rootId = (aws apigateway get-resources --rest-api-id $apiId --query 'items[?path==`/`].id' --output text)

Write-Host "Creating /product-vendors resource..."
$pvResource = aws apigateway create-resource --rest-api-id $apiId --parent-id $rootId --path-part "product-vendors" | ConvertFrom-Json
$pvResourceId = $pvResource.id
Write-Host "Created /product-vendors with ID: $pvResourceId"

# Add POST to /product-vendors
Write-Host "Adding POST to /product-vendors..."
aws apigateway put-method --rest-api-id $apiId --resource-id $pvResourceId --http-method POST --authorization-type NONE | Out-Null
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvResourceId --http-method POST --type AWS_PROXY --integration-http-method POST --uri $lambdaUri | Out-Null

# Add OPTIONS to /product-vendors
Write-Host "Adding OPTIONS to /product-vendors..."
aws apigateway put-method --rest-api-id $apiId --resource-id $pvResourceId --http-method OPTIONS --authorization-type NONE | Out-Null

$mockTemplate = '{"application/json":"{\"statusCode\": 200}"}'
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvResourceId --http-method OPTIONS --type MOCK --request-templates $mockTemplate | Out-Null

$methodParams = '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}'
aws apigateway put-method-response --rest-api-id $apiId --resource-id $pvResourceId --http-method OPTIONS --status-code 200 --response-parameters $methodParams | Out-Null

$integParams = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'POST,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $pvResourceId --http-method OPTIONS --status-code 200 --response-parameters $integParams | Out-Null

# Create /product-vendors/{id}
Write-Host "Creating /product-vendors/{id}..."
$pvidResource = aws apigateway create-resource --rest-api-id $apiId --parent-id $pvResourceId --path-part '{id}' | ConvertFrom-Json
$pvidResourceId = $pvidResource.id
Write-Host "Created /product-vendors/{id} with ID: $pvidResourceId"

# Add GET, PUT, DELETE to /product-vendors/{id}
Write-Host "Adding GET, PUT, DELETE to /product-vendors/{id}..."
aws apigateway put-method --rest-api-id $apiId --resource-id $pvidResourceId --http-method GET --authorization-type NONE | Out-Null
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvidResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri $lambdaUri | Out-Null

aws apigateway put-method --rest-api-id $apiId --resource-id $pvidResourceId --http-method PUT --authorization-type NONE | Out-Null
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvidResourceId --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $lambdaUri | Out-Null

aws apigateway put-method --rest-api-id $apiId --resource-id $pvidResourceId --http-method DELETE --authorization-type NONE | Out-Null
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvidResourceId --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $lambdaUri | Out-Null

# Add OPTIONS to /product-vendors/{id}
Write-Host "Adding OPTIONS to /product-vendors/{id}..."
aws apigateway put-method --rest-api-id $apiId --resource-id $pvidResourceId --http-method OPTIONS --authorization-type NONE | Out-Null
aws apigateway put-integration --rest-api-id $apiId --resource-id $pvidResourceId --http-method OPTIONS --type MOCK --request-templates $mockTemplate | Out-Null
aws apigateway put-method-response --rest-api-id $apiId --resource-id $pvidResourceId --http-method OPTIONS --status-code 200 --response-parameters $methodParams | Out-Null

$integParams2 = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,PUT,DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
aws apigateway put-integration-response --rest-api-id $apiId --resource-id $pvidResourceId --http-method OPTIONS --status-code 200 --response-parameters $integParams2 | Out-Null

Write-Host "`nDeploying API Gateway changes..."
$deployment = aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --description "Added product-vendors endpoints" | ConvertFrom-Json
Write-Host "Deployment ID: $($deployment.id)"
Write-Host "`n✅ Product-vendor endpoints created!"
