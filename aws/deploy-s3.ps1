# AWS Deployment Scripts

## Deploy to S3 (PowerShell)

# Set your bucket name
$BUCKET_NAME = "your-bucket-name"
$REGION = "us-east-1"

# Build the application
npm run build

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload files
aws s3 sync ./dist s3://$BUCKET_NAME --delete

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy (Get-Content aws/s3-bucket-policy.json | Out-String)

Write-Host "Deployment complete! Your site is available at:"
Write-Host "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
