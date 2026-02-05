# SharePoint Integration Plan - Materials Selection App

## Overview

Integrate Microsoft SharePoint for document storage associated with projects. When a project is created, automatically create a corresponding folder in SharePoint.

**Folder Naming Convention:** `{ProjectName}-{Type}-{CustomerName}`

Example: `Vance Bathroom Remodel-bath-John Vance`

---

## Current Project Data Model

Good news! The Project interface already has all required fields:

```typescript
export interface Project {
  id: string;
  name: string;                    // ✓ For folder name
  customerName?: string;            // ✓ For folder name
  type?: "bath" | "kitchen" | ...  // ✓ For folder name
  // ... other fields
}
```

**No schema changes needed!**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  - Creates project via existing API                    │
│  - Receives SharePoint folder URL in response          │
│  - Displays link to SharePoint folder                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Lambda/API Gateway                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  POST /projects                                  │  │
│  │  1. Create project in DynamoDB                   │  │
│  │  2. Generate folder name                         │  │
│  │  3. Call Microsoft Graph API                     │  │
│  │  4. Create SharePoint folder                     │  │
│  │  5. Store folder URL in project                  │  │
│  │  6. Return project with SharePoint link          │  │
│  └──────────────────────────────────────────────────┘  │
└───────┬──────────────────────────────────┬──────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────┐          ┌──────────────────────────┐
│    DynamoDB      │          │  Microsoft Graph API     │
│  Projects Table  │          │  (SharePoint Online)     │
│  + sharepointUrl │          │  - Create folder         │
│  + sharepointId  │          │  - Upload files          │
└──────────────────┘          │  - List files            │
                              └──────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Azure AD App Registration (30 min)

**Prerequisites:**

- Microsoft 365 admin access
- SharePoint site where folders will be created
- Access to Azure Portal

**Steps:**

1. **Register Application in Azure AD**
   - Navigate to [Azure Portal](https://portal.azure.com/)
   - Go to "Azure Active Directory" → "App registrations" → "New registration"
   - Name: `MaterialsSelectionApp`
   - Supported account types: "Single tenant"
   - Redirect URI: Not needed (we'll use client credentials flow)
   - Click "Register"

2. **Create Client Secret**
   - In app registration → "Certificates & secrets"
   - Click "New client secret"
   - Description: `Lambda SharePoint Access`
   - Expires: 24 months (or never, if allowed)
   - Click "Add"
   - **COPY THE SECRET VALUE** - you won't see it again!

3. **Note Required Values**
   - Application (client) ID: `<copy this>`
   - Directory (tenant) ID: `<copy this>`
   - Client secret value: `<copy this>`

4. **Grant API Permissions**
   - Go to "API permissions" → "Add a permission"
   - Select "Microsoft Graph"
   - Select "Application permissions" (not Delegated)
   - Add these permissions:
     - `Sites.ReadWrite.All` - Create/read SharePoint sites and content
     - `Files.ReadWrite.All` - Read and write files
   - Click "Grant admin consent for [your org]"

5. **Identify SharePoint Site**
   - Navigate to your SharePoint site (e.g., `https://yourtenant.sharepoint.com/sites/ProjectFiles`)
   - Note the site URL
   - Document library name (usually "Documents" or custom)

---

### Phase 2: Lambda Integration (2-3 hours)

#### Step 1: Add Microsoft Graph SDK

**Update package.json in lambda folder:**

```bash
cd lambda
npm install @microsoft/microsoft-graph-client isomorphic-fetch
```

**Dependencies:**

```json
{
  "dependencies": {
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "isomorphic-fetch": "^3.0.0"
  }
}
```

#### Step 2: Environment Variables

**Add to Lambda environment variables:**

```bash
# Azure AD credentials
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# SharePoint configuration
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/ProjectFiles
SHAREPOINT_LIBRARY=Documents
SHAREPOINT_BASE_FOLDER=Projects  # Base folder where project folders will be created
```

#### Step 3: Create SharePoint Service Module

**Create: `lambda/sharepointService.js`**

```javascript
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

// Get authentication token using client credentials
async function getAuthToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to get auth token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Initialize Graph client with auth token
async function getGraphClient() {
  const accessToken = await getAuthToken();

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Extract site ID from SharePoint URL
async function getSiteId(client, siteUrl) {
  // Parse site URL: https://tenant.sharepoint.com/sites/SiteName
  const urlParts = siteUrl.replace("https://", "").split("/");
  const hostname = urlParts[0];
  const sitePath = "/" + urlParts.slice(1).join("/");

  const site = await client.api(`/sites/${hostname}:${sitePath}`).get();

  return site.id;
}

// Get drive ID for document library
async function getDriveId(client, siteId, libraryName) {
  const drives = await client.api(`/sites/${siteId}/drives`).get();

  const targetDrive = drives.value.find((d) => d.name === libraryName);

  if (!targetDrive) {
    throw new Error(`Document library '${libraryName}' not found`);
  }

  return targetDrive.id;
}

// Ensure base folder exists (create if not)
async function ensureBaseFolderExists(client, driveId, baseFolderName) {
  try {
    // Try to get the folder
    const folder = await client
      .api(`/drives/${driveId}/root:/${baseFolderName}`)
      .get();
    return folder;
  } catch (error) {
    if (error.statusCode === 404) {
      // Folder doesn't exist, create it
      const newFolder = await client
        .api(`/drives/${driveId}/root/children`)
        .post({
          name: baseFolderName,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail",
        });
      return newFolder;
    }
    throw error;
  }
}

// Create project folder in SharePoint
async function createProjectFolder(projectName, projectType, customerName) {
  const client = await getGraphClient();

  // Get SharePoint site and drive
  const siteUrl = process.env.SHAREPOINT_SITE_URL;
  const libraryName = process.env.SHAREPOINT_LIBRARY || "Documents";
  const baseFolderName = process.env.SHAREPOINT_BASE_FOLDER || "Projects";

  const siteId = await getSiteId(client, siteUrl);
  const driveId = await getDriveId(client, siteId, libraryName);

  // Ensure base "Projects" folder exists
  await ensureBaseFolderExists(client, driveId, baseFolderName);

  // Generate folder name: ProjectName-Type-CustomerName
  // Clean up names to be filesystem-friendly
  const cleanProjectName = projectName.replace(/[<>:"/\\|?*]/g, "");
  const cleanType = projectType || "other";
  const cleanCustomerName = customerName
    ? customerName.replace(/[<>:"/\\|?*]/g, "")
    : "Unknown";

  const folderName = `${cleanProjectName}-${cleanType}-${cleanCustomerName}`;

  // Create project folder inside base folder
  const newFolder = await client
    .api(`/drives/${driveId}/root:/${baseFolderName}:/children`)
    .post({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "rename", // Auto-rename if exists
    });

  // Return folder info
  return {
    id: newFolder.id,
    name: newFolder.name,
    webUrl: newFolder.webUrl,
    driveId: driveId,
    siteId: siteId,
  };
}

// Get folder contents (for future file listing)
async function getProjectFolderContents(driveId, folderId) {
  const client = await getGraphClient();

  const contents = await client
    .api(`/drives/${driveId}/items/${folderId}/children`)
    .get();

  return contents.value;
}

// Upload file to project folder (for future file upload)
async function uploadFileToProjectFolder(
  driveId,
  folderId,
  fileName,
  fileContent,
) {
  const client = await getGraphClient();

  const uploadedFile = await client
    .api(`/drives/${driveId}/items/${folderId}:/${fileName}:/content`)
    .put(fileContent);

  return uploadedFile;
}

module.exports = {
  createProjectFolder,
  getProjectFolderContents,
  uploadFileToProjectFolder,
};
```

#### Step 4: Update Project Creation Handler

**Modify `lambda/index.js` - createProject function:**

```javascript
const { createProjectFolder } = require("./sharepointService");

async function createProject(data) {
  const project = {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create SharePoint folder if project has required fields
  if (project.name && process.env.SHAREPOINT_SITE_URL) {
    try {
      const folderInfo = await createProjectFolder(
        project.name,
        project.type,
        project.customerName,
      );

      // Add SharePoint info to project
      project.sharepointFolderId = folderInfo.id;
      project.sharepointFolderUrl = folderInfo.webUrl;
      project.sharepointDriveId = folderInfo.driveId;
      project.sharepointSiteId = folderInfo.siteId;

      console.log(`Created SharePoint folder: ${folderInfo.webUrl}`);
    } catch (error) {
      console.error("Failed to create SharePoint folder:", error);
      // Continue with project creation even if SharePoint fails
      // Don't block project creation on SharePoint failure
    }
  }

  await ddb.send(new PutCommand({ TableName: PROJECTS_TABLE, Item: project }));
  return { statusCode: 201, headers, body: JSON.stringify(project) };
}
```

#### Step 5: Update TypeScript Types

**Update `src/types/index.ts` - Project interface:**

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  customerName?: string;
  address?: string;
  email?: string;
  phone?: string;
  estimatedStartDate?: string;
  type?:
    | "bath"
    | "kitchen"
    | "shower"
    | "roof"
    | "addition"
    | "renovation"
    | "flooring"
    | "deck"
    | "basement"
    | "other";
  status?: "planning" | "in-progress" | "on-hold" | "completed";
  createdAt: string;
  updatedAt: string;
  // SharePoint integration
  sharepointFolderId?: string;
  sharepointFolderUrl?: string;
  sharepointDriveId?: string;
  sharepointSiteId?: string;
}
```

---

### Phase 3: Frontend Integration (1 hour)

#### Display SharePoint Link in Project Detail

**Update `ProjectDetail.tsx`:**

```tsx
{
  /* Add SharePoint link in project header */
}
{
  project.sharepointFolderUrl && (
    <div className="mt-2">
      <a
        href={project.sharepointFolderUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        📁 Open SharePoint Folder
      </a>
    </div>
  );
}
```

#### Display in Project List

**Update `ProjectList.tsx`:**

```tsx
{
  project.sharepointFolderUrl && (
    <a
      href={project.sharepointFolderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 text-xs ml-2"
      title="Open SharePoint folder"
    >
      📁
    </a>
  );
}
```

---

### Phase 4: Deployment (30 min)

#### Update Lambda Package

```bash
cd lambda

# Install dependencies
npm install

# Package Lambda with new dependencies
zip -r ../lambda-function.zip .

# Upload to Lambda
aws lambda update-function-code \
  --function-name MaterialsSelectionAPI \
  --zip-file fileb://lambda-function.zip \
  --region us-east-1
```

#### Set Environment Variables

```bash
aws lambda update-function-configuration \
  --function-name MaterialsSelectionAPI \
  --environment Variables="{
    AZURE_TENANT_ID=your-tenant-id,
    AZURE_CLIENT_ID=your-client-id,
    AZURE_CLIENT_SECRET=your-client-secret,
    SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/ProjectFiles,
    SHAREPOINT_LIBRARY=Documents,
    SHAREPOINT_BASE_FOLDER=Projects
  }" \
  --region us-east-1
```

#### Increase Lambda Timeout

SharePoint API calls may take longer:

```bash
aws lambda update-function-configuration \
  --function-name MaterialsSelectionAPI \
  --timeout 30 \
  --region us-east-1
```

---

## Testing Plan

### Test 1: Folder Creation

1. Create new project with all fields:
   - Name: "Test Bathroom Remodel"
   - Type: "bath"
   - Customer Name: "John Smith"

2. Expected folder name: `Test Bathroom Remodel-bath-John Smith`

3. Verify:
   - Folder exists in SharePoint
   - Project record has `sharepointFolderUrl`
   - Link appears in UI
   - Clicking link opens SharePoint folder

### Test 2: Special Characters

1. Create project with special characters:
   - Name: "Smith's Kitchen/Dining Room"
   - Type: "kitchen"
   - Customer: "O'Brien & Associates"

2. Expected: Special characters replaced/removed
3. Folder created without errors

### Test 3: Missing Fields

1. Create project without customerName
2. Expected: Folder name uses "Unknown" for customer
3. Project still created successfully

### Test 4: Duplicate Names

1. Create two projects with same name/type/customer
2. Expected: Second folder auto-renamed (e.g., "Project-bath-Smith 1")
3. Both projects created with different SharePoint URLs

### Test 5: SharePoint Failure Handling

1. Temporarily break SharePoint connection (wrong credentials)
2. Create project
3. Expected: Project created WITHOUT SharePoint fields
4. No error shown to user
5. Error logged in CloudWatch

---

## Error Handling

### SharePoint Errors Should Not Block Project Creation

```javascript
try {
  const folderInfo = await createProjectFolder(...);
  project.sharepointFolderId = folderInfo.id;
  // ...
} catch (error) {
  console.error('SharePoint folder creation failed:', error);
  // Continue without SharePoint - don't throw
  // Project creation succeeds even if SharePoint fails
}
```

### Common Errors

| Error                 | Cause                      | Solution                               |
| --------------------- | -------------------------- | -------------------------------------- |
| 401 Unauthorized      | Invalid credentials        | Check client ID/secret/tenant ID       |
| 403 Forbidden         | Insufficient permissions   | Grant Sites.ReadWrite.All in Azure AD  |
| 404 Not Found         | Site/library doesn't exist | Verify SharePoint URL and library name |
| 429 Too Many Requests | Rate limiting              | Implement retry logic with backoff     |
| Network timeout       | SharePoint unavailable     | Increase Lambda timeout, add retry     |

---

## Future Enhancements

### Phase 2: File Upload (Future)

- Add file upload UI to project detail page
- Upload invoices, drawings, photos to SharePoint
- Store file metadata in DynamoDB
- Display file list in UI

### Phase 3: File Listing (Future)

- List files from SharePoint folder in UI
- Download files directly from SharePoint
- Preview images/PDFs inline

### Phase 4: Subfolder Structure (Future)

Create organized subdirectories:

```
Project Folder/
  ├── Invoices/
  ├── Receipts/
  ├── Drawings/
  ├── Photos/
  └── Documents/
```

---

## Security Considerations

1. **Client Credentials Flow**
   - Uses app-only authentication (no user context)
   - All operations done as application identity
   - Secure for backend-to-backend communication

2. **Secret Storage**
   - Store client secret in Lambda environment variables
   - Never expose in frontend code
   - Rotate secrets periodically

3. **Permissions**
   - Grant minimum required permissions
   - `Sites.ReadWrite.All` gives access to all sites
   - Consider limiting to specific site collection if possible

4. **Error Messages**
   - Don't expose SharePoint errors to end users
   - Log detailed errors to CloudWatch for debugging
   - Show generic "folder creation failed" message to user

---

## Cost Estimate

**Microsoft Graph API:**

- Free tier: 100,000 requests/month
- Your usage: ~50 projects/month = negligible cost

**Lambda:**

- Additional execution time: +500ms per project creation
- Cost impact: ~$0.01/month

**Total Additional Cost: <$1/month**

---

## Rollback Plan

If SharePoint integration causes issues:

1. **Quick Disable:**

   ```bash
   # Remove SharePoint env vars from Lambda
   aws lambda update-function-configuration \
     --function-name MaterialsSelectionAPI \
     --environment Variables="{}" \
     --region us-east-1
   ```

2. **Code Check:**
   - Error handling ensures project creation continues
   - No SharePoint fields saved if connection fails
   - No UI changes break if fields missing

---

## Implementation Checklist

### Preparation

- [ ] Confirm SharePoint site URL
- [ ] Confirm document library name
- [ ] Verify Microsoft 365 admin access
- [ ] Decide on base folder name ("Projects")

### Azure Configuration

- [ ] Register app in Azure AD
- [ ] Create client secret (save value!)
- [ ] Grant API permissions (Sites.ReadWrite.All, Files.ReadWrite.All)
- [ ] Grant admin consent
- [ ] Note tenant ID, client ID, client secret

### Backend Development

- [ ] Add Microsoft Graph SDK to lambda/package.json
- [ ] Create sharepointService.js module
- [ ] Update createProject function in index.js
- [ ] Add environment variables to Lambda
- [ ] Increase Lambda timeout to 30 seconds
- [ ] Package and deploy Lambda

### Frontend Development

- [ ] Update Project interface with SharePoint fields
- [ ] Add SharePoint link to ProjectDetail.tsx
- [ ] Add SharePoint icon to ProjectList.tsx
- [ ] Build and deploy frontend

### Testing

- [ ] Test project creation with all fields
- [ ] Test project creation with missing fields
- [ ] Test special characters in names
- [ ] Test duplicate project names
- [ ] Test SharePoint link clicking
- [ ] Test with intentionally broken SharePoint (verify graceful failure)

### Documentation

- [ ] Document SharePoint configuration
- [ ] Document folder naming convention
- [ ] Document troubleshooting steps

---

## Next Steps After SharePoint

Once SharePoint integration is working, we can add:

1. **File Upload Feature** - Upload files to project folders
2. **File Management UI** - List, view, delete files
3. **Auto-upload Receipts** - Automatically save receipt images
4. **Invoice Processing** - OCR invoices and extract line items
5. **AI Integration** - Analyze uploaded drawings for material takeoffs

---

**Ready to start implementation?**

We can begin with Azure AD app registration and SharePoint configuration, then move to Lambda integration.
