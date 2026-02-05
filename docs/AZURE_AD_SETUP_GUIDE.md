# Azure AD Setup Guide for SharePoint Integration

## Quick Reference - Materials Selection App

This guide walks through setting up Azure AD authentication for automated SharePoint folder creation.

---

## Prerequisites

✅ Microsoft 365 admin access  
✅ Access to Azure Portal  
✅ SharePoint site: `https://apiaconsulting.sharepoint.com/sites/MegaPros360`  
✅ Document library: `Projects`

---

## Step 1: Register Application in Azure AD

### 1.1 Navigate to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your admin account
3. Click "Azure Active Directory" (or search for it)

### 1.2 Create App Registration

1. In left menu, click **"App registrations"**
2. Click **"+ New registration"**
3. Fill in the form:
   - **Name**: `MaterialsSelectionApp`
   - **Supported account types**: `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Leave blank (we'll use client credentials flow)
4. Click **"Register"**

### 1.3 Note Application IDs

After registration, you'll see the Overview page. **Copy these values** (you'll need them later):

```
Application (client) ID: ___________________________________
Directory (tenant) ID:   ___________________________________
```

---

## Step 2: Create Client Secret

### 2.1 Generate Secret

1. In your app registration, click **"Certificates & secrets"** (left menu)
2. Click **"+ New client secret"**
3. Fill in:
   - **Description**: `Lambda SharePoint Access`
   - **Expires**: `24 months` (or as per your security policy)
4. Click **"Add"**

### 2.2 Copy Secret Value

⚠️ **IMPORTANT**: Copy the secret **VALUE** immediately! You won't see it again!

```
Client Secret Value: ___________________________________
```

**DO NOT** copy the "Secret ID" - you need the **VALUE** field.

---

## Step 3: Grant API Permissions

### 3.1 Add Permissions

1. In your app registration, click **"API permissions"** (left menu)
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Application permissions"** (NOT Delegated)
5. Search and select these permissions:
   - `Sites.ReadWrite.All` - Full control of all site collections
   - `Files.ReadWrite.All` - Read and write files in all site collections
6. Click **"Add permissions"**

### 3.2 Grant Admin Consent

⚠️ **Critical Step**: You must grant admin consent!

1. Click **"✓ Grant admin consent for [your organization]"**
2. Click **"Yes"** in the confirmation dialog
3. Verify that both permissions show "Granted for [your organization]" in green

Your permissions should look like this:

```
API / Permissions Name          Type        Status
─────────────────────────────────────────────────────────
Microsoft Graph
  Sites.ReadWrite.All           Application ✓ Granted
  Files.ReadWrite.All           Application ✓ Granted
```

---

## Step 4: Verify SharePoint Configuration

### 4.1 Confirm SharePoint Details

1. Navigate to: `https://apiaconsulting.sharepoint.com/sites/MegaPros360`
2. Verify the site exists and you have access
3. Click **"Documents"** or **"Projects"** library (whatever it's named)
4. Confirm the document library name

**Your SharePoint Configuration:**

```
Site URL:     https://apiaconsulting.sharepoint.com/sites/MegaPros360
Library Name: Projects
Base Folder:  ProjectFolders (will be created automatically)
```

---

## Step 5: Configure Lambda Environment Variables

### 5.1 Prepare Environment Variables

Copy your values into this template:

```bash
AZURE_TENANT_ID=<your-tenant-id-from-step-1.3>
AZURE_CLIENT_ID=<your-client-id-from-step-1.3>
AZURE_CLIENT_SECRET=<your-client-secret-from-step-2.2>
SHAREPOINT_SITE_URL=https://apiaconsulting.sharepoint.com/sites/MegaPros360
SHAREPOINT_LIBRARY=Projects
SHAREPOINT_BASE_FOLDER=ProjectFolders
```

### 5.2 Set in AWS Lambda

**Option A: AWS Console**

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Select function: `MaterialsSelectionAPI`
3. Go to "Configuration" tab → "Environment variables"
4. Click "Edit"
5. Add each variable above
6. Click "Save"

**Option B: AWS CLI** (after filling in values):

```bash
aws lambda update-function-configuration \
  --function-name MaterialsSelectionAPI \
  --environment Variables="{
    AZURE_TENANT_ID=your-tenant-id,
    AZURE_CLIENT_ID=your-client-id,
    AZURE_CLIENT_SECRET=your-client-secret,
    SHAREPOINT_SITE_URL=https://apiaconsulting.sharepoint.com/sites/MegaPros360,
    SHAREPOINT_LIBRARY=Projects,
    SHAREPOINT_BASE_FOLDER=ProjectFolders
  }" \
  --region us-east-1
```

---

## Step 6: Install Dependencies and Deploy

### 6.1 Install Dependencies

```bash
cd lambda
npm install
```

This will install:

- `@microsoft/microsoft-graph-client@^3.0.7`
- `isomorphic-fetch@^3.0.0`

### 6.2 Package Lambda

```bash
# Create deployment package
zip -r lambda-function.zip .
```

### 6.3 Deploy to AWS Lambda

```bash
aws lambda update-function-code \
  --function-name MaterialsSelectionAPI \
  --zip-file fileb://lambda-function.zip \
  --region us-east-1
```

### 6.4 Increase Lambda Timeout

SharePoint API calls may take a few seconds:

```bash
aws lambda update-function-configuration \
  --function-name MaterialsSelectionAPI \
  --timeout 30 \
  --region us-east-1
```

---

## Step 7: Test the Integration

### 7.1 Create Test Project

1. Open your app: `https://d3f4oecpygbpd.cloudfront.net`
2. Create a new project:
   - **Name**: "Test Bathroom Remodel"
   - **Type**: "bath"
   - **Customer Name**: "John Smith"
3. Click "Create Project"

### 7.2 Verify Folder Creation

**Expected Behavior:**

- Folder created in SharePoint: `https://apiaconsulting.sharepoint.com/sites/MegaPros360/Projects/ProjectFolders/Test Bathroom Remodel-bath-John Smith`
- Blue link appears in project header: "📁 Open Project Folder in SharePoint →"

**Check SharePoint:**

1. Navigate to: `https://apiaconsulting.sharepoint.com/sites/MegaPros360/Projects`
2. Open folder: `ProjectFolders`
3. Verify folder exists: `Test Bathroom Remodel-bath-John Smith`

**Check CloudWatch Logs:**

```bash
aws logs tail /aws/lambda/MaterialsSelectionAPI --follow
```

Look for:

```
SharePoint: Creating folder for project <project-id>
SharePoint folder created: https://apiaconsulting.sharepoint.com/...
```

---

## Troubleshooting

### Error: "Failed to get auth token: 401"

**Problem**: Invalid client ID, secret, or tenant ID

**Solution**:

1. Verify all three IDs are correct
2. Regenerate client secret if needed
3. Check for extra spaces or quotes in environment variables

---

### Error: "403 Forbidden"

**Problem**: Insufficient permissions or admin consent not granted

**Solution**:

1. Go to Azure AD → App registrations → API permissions
2. Verify both permissions are granted (green checkmark)
3. Click "Grant admin consent" again
4. Wait 5-10 minutes for permissions to propagate

---

### Error: "Document library 'Projects' not found"

**Problem**: Wrong library name

**Solution**:

1. Navigate to SharePoint site
2. Check actual library name (might be "Shared Documents" or "Documents")
3. Update `SHAREPOINT_LIBRARY` environment variable
4. Common names: `Documents`, `Shared Documents`, `Projects`

---

### Error: "Site not found" or "404"

**Problem**: Wrong SharePoint URL

**Solution**:

1. Verify site URL format: `https://tenant.sharepoint.com/sites/SiteName`
2. Remove any trailing `/Shared Documents` or `/Documents` from URL
3. Just the site URL, not the library path

---

### Folder Not Created, But No Error

**Problem**: SharePoint integration silently failing

**Check CloudWatch Logs**:

```bash
aws logs tail /aws/lambda/MaterialsSelectionAPI --since 5m
```

Look for error messages starting with "SharePoint"

**Verify Environment Variables**:

```bash
aws lambda get-function-configuration \
  --function-name MaterialsSelectionAPI \
  --query 'Environment.Variables' \
  --region us-east-1
```

---

### Project Created Without SharePoint Link

**This is expected behavior!**

If SharePoint folder creation fails, the project is still created successfully. The integration is designed to be non-blocking:

```javascript
try {
  // Create SharePoint folder
} catch (error) {
  console.error("SharePoint failed:", error);
  // Continue anyway - project creation succeeds
}
```

Check CloudWatch logs to see why SharePoint failed.

---

## Folder Naming Convention

Folders are named using this format:

```
{ProjectName}-{Type}-{CustomerName}
```

**Examples:**

- `Vance Bathroom Remodel-bath-John Vance`
- `Smith Kitchen Update-kitchen-Mary Smith`
- `Deck Addition-deck-Project-a1b2c3d4` (when customer name missing)

**Special Character Handling:**

- Invalid characters removed: `< > : " / \ | ? *`
- Trailing periods removed
- Leading/trailing spaces trimmed

**Duplicates:**
If a folder with the same name exists, SharePoint auto-renames:

- `Project Name-bath-Smith`
- `Project Name-bath-Smith 1`
- `Project Name-bath-Smith 2`

---

## Security Best Practices

### Rotate Client Secrets

Client secrets should be rotated every 12-24 months:

1. Azure AD → App registrations → Certificates & secrets
2. Create new secret
3. Update Lambda environment variable
4. Test that new secret works
5. Delete old secret

### Minimize Permissions

Currently using:

- `Sites.ReadWrite.All` - Required for folder creation
- `Files.ReadWrite.All` - Required for file operations

These are broad permissions. If possible, use SharePoint app-only permissions scoped to specific sites.

### Store Secrets Securely

For production, consider using AWS Secrets Manager instead of environment variables:

```javascript
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();
  return JSON.parse(data.SecretString);
}
```

---

## Next Steps

Once SharePoint integration is working:

1. ✅ **Test edge cases**
   - Projects without customer name
   - Projects without type
   - Special characters in names
   - Very long project names

2. **Add file upload (future)**
   - Upload invoices, receipts, photos
   - Store file metadata in DynamoDB
   - Display file list in UI

3. **Add file listing (future)**
   - Show SharePoint files in project detail
   - Download/preview files
   - Delete files

4. **Create subfolders (future)**
   ```
   Project Folder/
     ├── Invoices/
     ├── Receipts/
     ├── Photos/
     └── Documents/
   ```

---

## Reference Links

- [Azure Portal](https://portal.azure.com/)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [SharePoint REST API](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)
- [Microsoft Graph Client Library](https://github.com/microsoftgraph/msgraph-sdk-javascript)

---

## Support

If you encounter issues:

1. Check CloudWatch Logs first
2. Review this troubleshooting guide
3. Verify Azure AD permissions
4. Test authentication manually using Graph Explorer

**Graph Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer

---

**Last Updated**: Feb 5, 2025  
**Configuration**: apiaconsulting.sharepoint.com/sites/MegaPros360
