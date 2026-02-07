# DynamoDB Table Naming Conflict - February 7, 2026

## PROBLEM DISCOVERED

Two sets of DynamoDB tables exist with different naming conventions and data structures:

### OLD TABLES (Underscore Naming)

**Pattern:** `MaterialsSelection_TableName`

**Field Naming:** PascalCase

- Example fields: `ProjectID`, `ProjectName`, `CustomerFirstName`, `CustomerLastName`, `ProjectStatus`, `CreatedDate`, `ModifiedDate`

**Data Volume:**

```
MaterialsSelection_Projects:      1 record  (obsolete test data)
MaterialsSelection_Categories:    1 record  (obsolete)
MaterialsSelection_LineItems:     1 record  (obsolete)
MaterialsSelection_Manufacturers: 0 records
MaterialsSelection_Products:      0 records
MaterialsSelection_Vendors:       0 records
```

### NEW TABLES (Hyphen Naming)

**Pattern:** `MaterialsSelection-TableName`

**Field Naming:** camelCase

- Example fields: `id`, `name`, `customerName`, `address`, `email`, `phone`, `status`, `createdAt`, `updatedAt`
- Additional SharePoint fields: `sharepointFolderId`, `sharepointFolderUrl`, `sharepointDriveId`, `sharepointSiteId`

**Data Volume:**

```
MaterialsSelection-Projects:      4 records  (PRODUCTION DATA)
MaterialsSelection-Categories:    7 records  (PRODUCTION DATA)
MaterialsSelection-LineItems:    15 records  (PRODUCTION DATA)
MaterialsSelection-Manufacturers: 8 records  (PRODUCTION DATA)
MaterialsSelection-Products:     24 records  (PRODUCTION DATA)
MaterialsSelection-Vendors:      10 records  (PRODUCTION DATA)
MaterialsSelection-OrderItems:    9 records  (PRODUCTION DATA)
MaterialsSelection-Orders:        6 records  (PRODUCTION DATA)
MaterialsSelection-Receipts:      8 records  (PRODUCTION DATA)
MaterialsSelection-ProductVendors: 44 records (PRODUCTION DATA)
```

## ROOT CAUSE

The **MaterialsSelection-GetProjects** Lambda was configured to query the OLD table:

```python
table = dynamodb.Table('MaterialsSelection_Projects')  # WRONG - underscore
```

This caused it to return only 1 obsolete record instead of the 4 production records.

## FIXES APPLIED

### 1. Lambda Code Update

**File:** `MaterialsSelection-GetProjects` Lambda
**Change:**

```python
# OLD (incorrect):
table = dynamodb.Table('MaterialsSelection_Projects')

# NEW (correct):
table = dynamodb.Table('MaterialsSelection-Projects')  # hyphen
```

### 2. IAM Policy Update

**Role:** `MaterialsSelection-LambdaRole`
**Policy:** `DynamoDBAccess`
**Change:** Added wildcard pattern to cover both naming conventions

```json
{
  "Resource": [
    "arn:aws:dynamodb:us-east-1:634752426026:table/MaterialsSelection*"
  ]
}
```

### 3. API Gateway Endpoint

**Added:** GET `/projects/{projectId}`

- Method: GET
- Authorization: NONE
- API Key Required: false
- Integration: AWS_PROXY → MaterialsSelection-API Lambda
- Deployment: 8zax8s

## CURRENT STATE (After Fixes)

✅ Lambda queries correct table: `MaterialsSelection-Projects` (hyphen)
✅ All 4 projects returned by GET /projects
✅ Project detail endpoint working: GET /projects/{id}
✅ IAM permissions cover both table naming patterns

## NEW PROBLEM DISCOVERED

The frontend transformation layer in `src/services/projectService.ts` was added to handle PascalCase responses from the OLD table. Now that the Lambda queries the NEW table (which returns camelCase), the transformation is broken:

**Transformation Layer (lines 9-34):**

```typescript
const transformProject = (apiProject: any): Project => {
  return {
    id: apiProject.ProjectID, // WRONG: looking for ProjectID (doesn't exist)
    name: apiProject.ProjectName, // WRONG: looking for ProjectName (doesn't exist)
    // ... all mappings are wrong
  };
};
```

**Actual API Response (from NEW table):**

```json
{
  "id": "b9cdfb3c-ba03-4cb3-a7f0-8ae7a636b247",
  "name": "Faraci Master Bath",
  "customerName": "Dave Faraci"
  // ... already in camelCase
}
```

**Result:** All transformed fields become `undefined`, causing blank page.

## RECOMMENDED ACTIONS

### IMMEDIATE (Fix Blank Page)

Remove the transformation layer from `projectService.ts` since the API now returns data in the correct format (camelCase).

### SHORT-TERM (Cleanup)

Consider deleting the OLD tables once confirmed they're no longer needed:

- MaterialsSelection_Projects
- MaterialsSelection_Categories
- MaterialsSelection_LineItems
- MaterialsSelection_Manufacturers
- MaterialsSelection_Products
- MaterialsSelection_Vendors

### LONG-TERM (Prevention)

1. Document the correct table naming convention: `MaterialsSelection-TableName` (hyphen, camelCase fields)
2. Update any remaining Lambdas to use hyphenated table names
3. Audit all Lambda functions to ensure they query the correct tables
4. Consider using environment variables for table names to prevent hardcoding errors

## VERIFICATION CHECKLIST

- [x] Lambda queries MaterialsSelection-Projects (hyphen)
- [x] IAM policy allows access to hyphenated tables
- [x] GET /projects returns 4 projects
- [x] GET /projects/{id} endpoint configured and working
- [ ] Frontend transformation layer removed
- [ ] Frontend displays all 4 projects correctly
- [ ] Project detail pages load without errors
- [ ] Old tables deleted or archived

## FILES MODIFIED

1. **Lambda Function:** MaterialsSelection-GetProjects
   - Updated: 2026-02-07T20:14:33Z
   - Size: 562 bytes
   - Table name corrected

2. **IAM Policy:** MaterialsSelection-LambdaRole > DynamoDBAccess
   - Updated: 2026-02-07
   - Uses wildcard pattern for tables

3. **API Gateway:** xrld1hq3e2
   - Deployment: 8zax8s (2026-02-07T14:19:22)
   - Added GET /projects/{projectId}

## NOTES

- The old table (underscore) still exists but contains only obsolete test data
- All production data is safely stored in the new tables (hyphen)
- No data was lost during the migration
- The blank page issue is caused by transformation layer mismatch, NOT data loss

## ADDITIONAL API GATEWAY FIXES (2026-02-07 Afternoon)

### Missing Endpoints Discovered

After fixing the table naming issue, discovered multiple API Gateway endpoints were completely missing:

**Created Endpoints:**

1. `/vendors` - GET method added
2. `/products` - GET method added
3. `/manufacturers` - GET method added
4. `/projects/{projectId}/lineitems` - GET method added
5. `/products/{productId}` - Resource created
6. `/products/{productId}/vendors` - GET method added (fixes product-vendor relationships)

**Root Cause:** API Gateway was never fully configured for all routes that the MaterialsSelection-API Lambda handles.

**Lambda Architecture:**

- **MaterialsSelection-API** (5.5MB unified Lambda) - Handles ALL main application endpoints
- **MaterialsSelection-Salesforce-API** (134KB separate Lambda) - Handles ONLY `/salesforce/*` endpoints per user requirement
- **Old individual Lambdas** (MaterialsSelection-GetProjects, etc.) - Legacy functions being phased out

**All endpoints configured with:**

- Authorization: NONE
- API Key Required: false
- Integration: AWS_PROXY to MaterialsSelection-API Lambda
- CORS: Headers returned by Lambda automatically

**Final Deployment:** fb2sq1 (2026-02-07 14:49:55)
