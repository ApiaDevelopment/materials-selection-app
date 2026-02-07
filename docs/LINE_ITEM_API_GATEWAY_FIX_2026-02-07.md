# Line Item API Gateway Configuration Fix

**Date:** February 7, 2026  
**Issue:** Line item operations (insert, update, delete) were failing in the web application

## Problem Summary

User reported that line item operations were not working:

- ❌ Insert line item: Failed
- ❌ Update line item: Failed
- ❌ Delete line item: Failed

## Root Cause Analysis

### Investigation Steps

1. **Checked API Gateway Resources:**
   - `/lineitems` - existed with GET, POST methods
   - `/categories/{categoryId}/lineitems` - existed with OPTIONS, POST methods
   - `/projects/{projectId}/lineitems` - existed with GET method
   - ❌ `/lineitems/{id}` - **DID NOT EXIST**

2. **Checked Lambda Code:**
   - ✅ MaterialsSelection-API Lambda (index.js) had ALL line item handlers:
     - Line 171: `GET /lineitems/{id}` → getLineItem(id)
     - Line 178: `PUT /lineitems/{id}` → updateLineItem(id, data)
     - Line 182: `DELETE /lineitems/{id}` → deleteLineItem(id)
     - Lines 175-176: `POST /lineitems` → createLineItem(data)

3. **Found Two Issues:**

   **Issue #1:** Missing `/lineitems/{id}` resource
   - Lambda had the code to handle these routes
   - API Gateway had no resource to route requests to Lambda
   - Result: Update and delete operations failed

   **Issue #2:** POST `/lineitems` pointed to wrong Lambda
   - Was pointing to: `MaterialsSelection-CreateLineItem` (old Python Lambda)
   - Should point to: `MaterialsSelection-API` (unified Node.js Lambda)
   - Also had `apiKeyRequired: true` which blocked requests

## Architecture Understanding

**Two Separate Components:**

1. **Lambda (MaterialsSelection-API)**
   - Contains the actual code that processes requests
   - 5.5MB Node.js application
   - Has handlers for ALL line item operations
   - Location: Deployed Lambda function (last updated 2/7/2026 9:42 AM)
   - Source: `G:\Projects\MegaPros\MaterialsSelectionApp\WebPrototype\lambda\index.zip`

2. **API Gateway (xrld1hq3e2)**
   - Acts as the "front door" / router
   - Routes HTTP requests from the web app to Lambda functions
   - Configuration only - no code
   - **Critical:** Even if Lambda has the code, if API Gateway doesn't have the route, requests never reach Lambda

## Fixes Applied

### Fix #1: Create `/lineitems/{id}` Resource

```bash
# 1. Created resource under /lineitems parent
aws apigateway create-resource \
  --rest-api-id xrld1hq3e2 \
  --parent-id kts8z1 \
  --path-part "{id}"
# Resource ID: pphjcn

# 2. Added GET method (retrieve single line item)
aws apigateway put-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method GET \
  --authorization-type NONE \
  --no-api-key-required

# 3. Connected GET to MaterialsSelection-API Lambda
aws apigateway put-integration \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

# 4. Added PUT method (update line item)
aws apigateway put-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method PUT \
  --authorization-type NONE \
  --no-api-key-required

# 5. Connected PUT to Lambda
aws apigateway put-integration \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method PUT \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

# 6. Added DELETE method (delete line item)
aws apigateway put-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method DELETE \
  --authorization-type NONE \
  --no-api-key-required

# 7. Connected DELETE to Lambda
aws apigateway put-integration \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method DELETE \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

# 8. Added OPTIONS for CORS
aws apigateway put-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id pphjcn \
  --http-method OPTIONS \
  --authorization-type NONE \
  --no-api-key-required

# 9. Configured CORS mock response
# (MOCK integration + response headers for Access-Control-Allow-*)

# 10. Deployed
aws apigateway create-deployment \
  --rest-api-id xrld1hq3e2 \
  --stage-name prod \
  --description "Added /lineitems/{id} resource with GET, PUT, DELETE methods"
# Deployment ID: n2wfqi
```

### Fix #2: Redirect POST `/lineitems` to Correct Lambda

```bash
# 1. Deleted old POST method (was pointing to Python Lambda with API key required)
aws apigateway delete-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id kts8z1 \
  --http-method POST

# 2. Recreated POST method without API key requirement
aws apigateway put-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id kts8z1 \
  --http-method POST \
  --authorization-type NONE \
  --no-api-key-required

# 3. Connected to MaterialsSelection-API Lambda
aws apigateway put-integration \
  --rest-api-id xrld1hq3e2 \
  --resource-id kts8z1 \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:634752426026:function:MaterialsSelection-API/invocations"

# 4. Deployed
aws apigateway create-deployment \
  --rest-api-id xrld1hq3e2 \
  --stage-name prod \
  --description "Recreated POST /lineitems"
# Deployment ID: enys73
```

### Fix #3: Add CORS OPTIONS to `/lineitems`

```bash
# Added OPTIONS method with CORS headers to /lineitems
# Deployment ID: tf1ybu
```

### Fix #4: Lambda Permissions

```bash
# Added wildcard permission for API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name MaterialsSelection-API \
  --statement-id apigateway-all-methods \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:634752426026:xrld1hq3e2/*/*"
```

## Final API Gateway Configuration

### Line Item Endpoints

| Endpoint                             | Methods                   | Lambda Target          | Purpose                                  |
| ------------------------------------ | ------------------------- | ---------------------- | ---------------------------------------- |
| `/lineitems`                         | GET, POST, OPTIONS        | MaterialsSelection-API | List all / Create line item              |
| `/lineitems/{id}`                    | GET, PUT, DELETE, OPTIONS | MaterialsSelection-API | Get / Update / Delete specific line item |
| `/categories/{categoryId}/lineitems` | POST, OPTIONS             | MaterialsSelection-API | Create line item in category             |
| `/projects/{projectId}/lineitems`    | GET                       | MaterialsSelection-API | List line items for project              |

### Key Configuration Settings

- **Authorization:** NONE (no authentication required)
- **API Key Required:** FALSE (no API key needed)
- **Integration Type:** AWS_PROXY (Lambda proxy integration)
- **CORS:** Enabled via OPTIONS methods with mock responses

## Legacy Components

**Old Python Lambda Functions (NOT USED):**

- MaterialsSelection-GetLineItems
- MaterialsSelection-CreateLineItem

These still exist but are no longer connected to API Gateway. All line item operations now go through the unified **MaterialsSelection-API** Lambda.

## How to Verify Configuration

### Check API Gateway Resources

```bash
aws apigateway get-resources \
  --rest-api-id xrld1hq3e2 \
  --query 'items[?contains(path, `lineitem`)].{Path:path,Methods:keys(resourceMethods)}'
```

### Check Method Integration

```bash
# Check what Lambda a method points to
aws apigateway get-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id <resource-id> \
  --http-method <GET|POST|PUT|DELETE> \
  --query 'methodIntegration.uri'
```

### Check API Key Requirement

```bash
aws apigateway get-method \
  --rest-api-id xrld1hq3e2 \
  --resource-id <resource-id> \
  --http-method <method> \
  --query 'apiKeyRequired'
```

## Testing

### Terminal Test

```bash
# Test POST (create line item)
$body = '{"projectId":"test123","categoryId":"cat123","productId":"prod123","quantity":5,"unitCost":10.50}'
curl.exe -X POST -H "Content-Type: application/json" -d $body https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/lineitems

# Test GET (retrieve line item)
curl.exe https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/lineitems/{id}

# Test PUT (update line item)
$body = '{"quantity":10}'
curl.exe -X PUT -H "Content-Type: application/json" -d $body https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/lineitems/{id}

# Test DELETE (delete line item)
curl.exe -X DELETE https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/lineitems/{id}

# Test CORS preflight
curl.exe -X OPTIONS -i https://xrld1hq3e2.execute-api.us-east-1.amazonaws.com/prod/lineitems
# Should return: Access-Control-Allow-Origin: *
```

## Lessons Learned

1. **API Gateway and Lambda are separate:**
   - Lambda code can exist without API Gateway routes
   - API Gateway routes can exist without pointing to correct Lambda
   - Both must be configured correctly for endpoints to work

2. **Common Issues to Check:**
   - ✅ Does the resource exist in API Gateway?
   - ✅ Does the method (GET/POST/PUT/DELETE) exist on the resource?
   - ✅ Does the method point to the correct Lambda?
   - ✅ Is `apiKeyRequired` set to false?
   - ✅ Does Lambda have permission for API Gateway to invoke it?
   - ✅ Is OPTIONS method configured for CORS?
   - ✅ Has the API been deployed after changes?

3. **Legacy Lambdas:**
   - Python Lambdas were original implementation
   - MaterialsSelection-API (Node.js) is the unified replacement
   - Always verify which Lambda API Gateway is calling

4. **Deployment Required:**
   - API Gateway changes don't take effect until deployed
   - Use `create-deployment` with descriptive descriptions
   - Test after every deployment

## Related Documentation

- [TABLE_NAMING_CONFLICT_2026-02-07.md](./TABLE_NAMING_CONFLICT_2026-02-07.md) - DynamoDB table naming issues from same day

## Status

✅ **RESOLVED** - All line item operations working as of 2026-02-07 22:12 GMT

- Insert ✓
- Update ✓
- Delete ✓
- Select Product ✓
