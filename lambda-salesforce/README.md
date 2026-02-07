# Salesforce Integration Lambda Function

This Lambda function provides integration with Salesforce to fetch Opportunity, Account, and Contact data for creating projects from Salesforce Opportunities.

## Architecture

This is a **separate Lambda function** from the MaterialSelection-API Lambda, providing:

- Independent scaling for Salesforce operations
- Security isolation for Salesforce credentials
- Clear separation of concerns
- Independent versioning and deployment

## API Endpoints

### GET /salesforce/opportunities

Returns all Salesforce Opportunities where `Selection_Coordinator_Needed__c = true`

**Response:**

```json
{
  "opportunities": [
    {
      "Id": "006...",
      "Name": "Acme Corp - Q1 Materials",
      "StageName": "Proposal",
      "AccountId": "001...",
      "OCR_LU_PrimaryContact__c": "003...",
      "Selection_Coordinator_Needed__c": true
    }
  ]
}
```

### GET /salesforce/opportunities/:id

Returns detailed information for a specific Opportunity including Account and Contact

**Response:**

```json
{
  "opportunity": {
    "Id": "006...",
    "Name": "Acme Corp - Q1 Materials",
    "StageName": "Proposal",
    "AccountId": "001...",
    "OCR_LU_PrimaryContact__c": "003...",
    "Selection_Coordinator_Needed__c": true
  },
  "account": {
    "Id": "001...",
    "BillingStreet": "123 Main St",
    "BillingCity": "Seattle",
    "BillingState": "WA",
    "BillingPostalCode": "98101",
    "BillingCountry": "USA"
  },
  "contact": {
    "Id": "003...",
    "Name": "John Smith",
    "Email": "john.smith@acme.com",
    "Phone": "(206) 555-1234",
    "MobilePhone": "(206) 555-5678",
    "Preferred_Method_of_Contact__c": "Email"
  }
}
```

## Environment Variables

The Lambda function requires the following environment variables (from `docs/SFConnect.txt`):

| Variable           | Description                          | Example                                              |
| ------------------ | ------------------------------------ | ---------------------------------------------------- |
| `SF_CLIENT_ID`     | Salesforce OAuth client ID           | `3MVG9szVa2Rxs...`                                   |
| `SF_CLIENT_SECRET` | Salesforce OAuth client secret       | `F0210E2BA025A7A6...`                                |
| `SF_USERNAME`      | Salesforce username                  | `pmp@megapros.com`                                   |
| `SF_PASSWORD`      | Salesforce password + security token | `MegaTeam427**Zgb...`                                |
| `SF_AUTH_URL`      | Salesforce OAuth token endpoint      | `https://login.salesforce.com/services/oauth2/token` |
| `SF_INSTANCE_URL`  | Salesforce instance URL              | `https://megapros.my.salesforce.com`                 |

## Deployment Steps

### 1. Install Dependencies

```bash
cd lambda-salesforce
npm install
```

### 2. Create Deployment Package

```bash
# Create a zip file with code and dependencies
zip -r salesforce-lambda.zip index.js package.json package-lock.json node_modules/
```

### 3. Create Lambda Function in AWS

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name salesforce-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://salesforce-lambda.zip \
  --timeout 30 \
  --memory-size 256
```

### 4. Set Environment Variables

```bash
# Set all required environment variables
aws lambda update-function-configuration \
  --function-name salesforce-api \
  --environment Variables="{
    SF_CLIENT_ID=your_salesforce_client_id,
    SF_CLIENT_SECRET=your_salesforce_client_secret,
    SF_USERNAME=your_salesforce_username,
    SF_PASSWORD=your_salesforce_password_and_security_token,
    SF_AUTH_URL=https://login.salesforce.com/services/oauth2/token,
    SF_INSTANCE_URL=https://your_instance.my.salesforce.com
  }"
```

### 5. Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api --name salesforce-api

# Create resources and methods
# GET /salesforce/opportunities
# GET /salesforce/opportunities/{id}

# Deploy API
aws apigateway create-deployment \
  --rest-api-id YOUR_API_ID \
  --stage-name prod
```

### 6. Update Frontend Environment Variable

Once deployed, update the frontend `.env.production` file:

```
VITE_SF_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

## Security Best Practices

✅ **Implemented:**

- OAuth password grant flow (credentials not hardcoded)
- Token caching with automatic refresh
- Environment variables for all secrets
- CORS headers configured
- Error messages do not expose sensitive data

⚠️ **Recommendations:**

- Store Salesforce credentials in AWS Secrets Manager for production
- Implement request throttling
- Add CloudWatch monitoring and alarms
- Consider implementing request signing/authentication
- Use VPC if accessing internal Salesforce instance

## Testing

### Test OAuth Authentication

```bash
aws lambda invoke \
  --function-name salesforce-api \
  --payload '{"httpMethod":"GET","path":"/salesforce/opportunities"}' \
  response.json

cat response.json
```

### Test Opportunity Details

```bash
aws lambda invoke \
  --function-name salesforce-api \
  --payload '{"httpMethod":"GET","path":"/salesforce/opportunities/006XXXXXXXXXXXXXXX","pathParameters":{"id":"006XXXXXXXXXXXXXXX"}}' \
  response.json

cat response.json
```

## Troubleshooting

### OAuth Errors

- Verify `SF_PASSWORD` includes security token appended
- Check `SF_CLIENT_ID` and `SF_CLIENT_SECRET` are correct
- Confirm user has API access enabled in Salesforce

### SOQL Query Errors

- Verify custom field API names (e.g., `Selection_Coordinator_Needed__c`)
- Check user has field-level security access
- Confirm object permissions in Salesforce

### CORS Errors

- Verify CORS headers are returned
- Check API Gateway CORS configuration
- Ensure OPTIONS method is enabled

## Notes

- Token is cached for ~115 minutes (Salesforce default is 2 hours, we refresh 5 min early)
- Uses Salesforce API v59.0
- All queries are read-only (no data modification)
- Filters Opportunities by `Selection_Coordinator_Needed__c = true`
