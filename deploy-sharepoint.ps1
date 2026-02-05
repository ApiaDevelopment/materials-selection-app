# SharePoint Integration - Lambda Deployment Script
# This script packages and deploys the Lambda function with SharePoint integration

Write-Host "=== SharePoint Integration Lambda Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to lambda directory
Write-Host "[1/6] Navigating to lambda directory..." -ForegroundColor Yellow
Set-Location -Path "g:\Projects\MegaPros\MaterialsSelectionApp\WebPrototype\lambda"

# Step 2: Install dependencies
Write-Host "[2/6] Installing dependencies (Microsoft Graph SDK)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 3: Package Lambda function
Write-Host "[3/6] Packaging Lambda function..." -ForegroundColor Yellow
if (Test-Path "lambda-function.zip") {
    Remove-Item "lambda-function.zip" -Force
}
Compress-Archive -Path ".\*" -DestinationPath "lambda-function.zip" -Force
Write-Host "✓ Lambda packaged: lambda-function.zip" -ForegroundColor Green

# Step 4: Deploy to AWS Lambda
Write-Host "[4/6] Deploying to AWS Lambda..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name MaterialsSelectionAPI `
    --zip-file fileb://lambda-function.zip `
    --region us-east-1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Lambda deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Lambda deployed" -ForegroundColor Green

# Step 5: Increase Lambda timeout to 30 seconds
Write-Host "[5/6] Increasing Lambda timeout to 30s..." -ForegroundColor Yellow
aws lambda update-function-configuration `
    --function-name MaterialsSelectionAPI `
    --timeout 30 `
    --region us-east-1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update timeout!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Timeout set to 30 seconds" -ForegroundColor Green

# Step 6: Deploy React frontend
Write-Host "[6/6] Deploying React frontend..." -ForegroundColor Yellow
Set-Location -Path "g:\Projects\MegaPros\MaterialsSelectionApp\WebPrototype"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}

aws s3 sync dist/ s3://materials-selection-app-7525/ --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: S3 sync failed!" -ForegroundColor Red
    exit 1
}

aws cloudfront create-invalidation --distribution-id E2CO2DGE8F4YUE --paths "/*"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: CloudFront invalidation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend deployed" -ForegroundColor Green

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify environment variables are set in Lambda:" -ForegroundColor White
Write-Host "   - AZURE_TENANT_ID" -ForegroundColor Gray
Write-Host "   - AZURE_CLIENT_ID" -ForegroundColor Gray
Write-Host "   - AZURE_CLIENT_SECRET" -ForegroundColor Gray
Write-Host "   - SHAREPOINT_SITE_URL" -ForegroundColor Gray
Write-Host "   - SHAREPOINT_LIBRARY" -ForegroundColor Gray
Write-Host "   - SHAREPOINT_BASE_FOLDER" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test by creating a new project at:" -ForegroundColor White
Write-Host "   https://d3f4oecpygbpd.cloudfront.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Check CloudWatch logs:" -ForegroundColor White
Write-Host "   aws logs tail /aws/lambda/MaterialsSelectionAPI --follow" -ForegroundColor Gray
Write-Host ""
