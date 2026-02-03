#!/bin/bash

# AWS Deployment Script for S3 + CloudFront

# Set your bucket name
BUCKET_NAME="your-bucket-name"
REGION="us-east-1"

# Build the application
npm run build

# Create S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Upload files
aws s3 sync ./dist s3://$BUCKET_NAME --delete

# Set bucket policy for public read (update YOUR_BUCKET_NAME in the policy file first)
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://aws/s3-bucket-policy.json

echo "Deployment complete! Your site is available at:"
echo "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

# Optional: Create CloudFront distribution for HTTPS and CDN
# aws cloudfront create-distribution --distribution-config file://aws/cloudfront-config.json
