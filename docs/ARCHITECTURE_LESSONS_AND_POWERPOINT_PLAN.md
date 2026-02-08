# Architecture Lessons & PowerPoint Feature Plan

**Date:** February 8, 2026  
**Purpose:** Document current application state, Salesforce integration learnings, and architectural plan for PowerPoint generation feature

---

## Table of Contents

1. [Current Application State](#current-application-state)
2. [Salesforce Integration: What We Learned](#salesforce-integration-what-we-learned)
3. [Problems We Avoided](#problems-we-avoided)
4. [PowerPoint Feature Architecture Plan](#powerpoint-feature-architecture-plan)

---

## Current Application State

### Production Environment

**URL:** https://mpmaterials.apiaconsulting.com  
**CloudFront Distribution ID:** E2CO2DGE8F4YUE  
**S3 Bucket:** materials-selection-app-7525  
**API Gateway ID:** xrld1hq3e2  
**Lambda (Main):** MaterialsSelection-API (Node.js 20.x)  
**Lambda (Salesforce):** MaterialsSelection-Salesforce-API (Node.js 20.x, separate)  
**DynamoDB Tables:** 10 active tables (hyphen format)

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite 7.2.5 (rolldown experimental)
- TailwindCSS v4
- React Router for navigation

**Backend:**
- AWS Lambda (Node.js 20.x)
- DynamoDB for data persistence
- API Gateway REST API
- CloudFront CDN

**Build Output:**
- ~468 KB JavaScript bundle
- ~37 KB CSS bundle
- Single-page application

### Working Features (All Tested ✅)

1. **Project Management**
   - Create, Read, Update, Delete projects
   - Project fields: name, description, clientName, clientAddress, projectNumber, contactName, contactEmail, phone, mobilePhone, preferredContactMethod, startDate, endDate, status, budget
   - Optional Salesforce integration (opportunityId field)

2. **Product Management**
   - Full CRUD operations
   - Product fields: name, description, manufacturer, sku, price, category, imageUrl, specSheetUrl, productUrl

3. **Manufacturer Management**
   - Full CRUD operations
   - Manufacturer fields: name, description, website, contactEmail, phone

4. **Vendor Management**
   - Full CRUD operations
   - Vendor fields: name, description, website, contactEmail, phone

5. **Product-Vendor Relationships**
   - Link products to vendors with pricing and lead times
   - Fields: productId, vendorId, vendorPrice, vendorSku, leadTimeDays, notes

6. **Salesforce Integration** (New as of Feb 8, 2026)
   - Fetch opportunities from Salesforce (43+ active opportunities)
   - Two-step workflow: select opportunity → pre-populated project form
   - Creates project with opportunityId reference
   - Loading states and proper error handling

### Component Architecture

**Main Components:**
- `ProjectList.tsx` - Project list view with two separate modals:
  - Regular CRUD modal (create/edit projects)
  - Salesforce modal (two-step: opportunity list → pre-filled form)
- `CategoryList.tsx` - Category management
- `CategoryDetail.tsx` - Line items within a category
- `ManufacturerList.tsx` - Manufacturer management
- `VendorList.tsx` - Vendor management
- `ProductList.tsx` - Product management with vendor relationship UI
- `Layout.tsx` - Main navigation and page structure
- `ChatAssistant.tsx` - AI assistant (AWS Bedrock integration)

**Service Layer:**
- `src/services/projectService.ts` - Project CRUD operations
- `src/services/categoryService.ts` - Category operations
- `src/services/lineItemService.ts` - Line item operations
- `src/services/manufacturerService.ts` - Manufacturer operations
- `src/services/vendorService.ts` - Vendor operations
- `src/services/productService.ts` - Product and product-vendor operations

**Type Definitions:**
- `src/types/index.ts` - All TypeScript interfaces (Project, Product, Category, LineItem, etc.)

---

## Salesforce Integration: What We Learned

### Background: The Original Problem

**Previous State (Before Feb 8, 2026):**
- Salesforce modal existed but had mysterious rendering issues
- Modal would open with gray overlay and table headers
- Content (opportunity list) wouldn't render despite:
  - Data successfully fetched from backend
  - React state updating correctly
  - No JavaScript errors
  - DOM elements present in HTML
- Issue was documented but unresolved (see DEVELOPMENT_STATUS.md lines 214-248)

**Decision:** Rather than debug the existing problematic modal, we built a completely new implementation from scratch.

### What We Built (Feb 8, 2026)

**Architecture Decision:** Separate Salesforce integration without touching existing modal code

**Implementation:**
1. **Separate Lambda Function:** MaterialsSelection-Salesforce-API
   - Completely independent from main MaterialsSelection-API
   - Handles Salesforce OAuth authentication
   - Returns opportunities in clean JSON format
   - No impact on existing project creation flow

2. **Separate Modal in ProjectList.tsx:**
   - New state variables: `showSalesforceModal`, `showSalesforceForm`, `salesforceOpportunities`, `selectedOpportunity`, `savingSalesforceProject`
   - Completely independent from existing `showModal`, `editingProject`, `formData`, `savingProject` states
   - Two-step workflow:
     - Step 1: Display table of Salesforce opportunities
     - Step 2: Pre-populate form with opportunity data, allow edits, save
   - User can close at any point without affecting regular project creation

3. **Backend Support (Lambda):**
   - Added 3 new optional fields to MaterialsSelection-API's createProject function:
     - `mobilePhone` (String)
     - `preferredContactMethod` (String)
     - `opportunityId` (String)
   - All fields optional with empty string defaults
   - **Backward compatible** - existing project creation still works unchanged

4. **Frontend Consistency:**
   - Added same 3 fields to regular "Create Project" modal
   - Both modals now have identical field sets
   - Same loading state behavior (`Creating...` / `Updating...`)
   - Same validation and error handling patterns

### Technical Implementation Details

**Salesforce Modal State Flow:**
```typescript
// Step 1: User clicks "Create from Salesforce" button
setShowSalesforceModal(true) → fetch opportunities → display table

// Step 2: User selects an opportunity
handleSelectOpportunity(opp) → fetch full SF details → pre-fill form → setShowSalesforceForm(true)

// Step 3: User clicks "Create Project"
handleSalesforceSubmit() → setSavingSalesforceProject(true) → projectService.create() → success/error handling → finally setSavingSalesforceProject(false)
```

**Regular Modal State Flow:**
```typescript
// Create: User clicks "Create Project" button
setShowModal(true) → setFormData(initialData)

// Edit: User clicks edit icon on project
setEditingProject(project) → setFormData(project) → setShowModal(true)

// Submit: User clicks "Create Project" or "Update Project"
handleSubmit() → setSavingProject(true) → projectService.create/update() → success/error handling → finally setSavingProject(false)
```

**Key Insight:** These two flows are completely independent. No shared state variables. No conditional logic based on "are we in Salesforce mode?"

### Code Changes Made

**Files Modified:**
1. `lambda/index.js` (lines 354-371)
   - Added 3 lines to createProject function to save new fields
   
2. `src/components/ProjectList.tsx` (multiple sections)
   - Added Salesforce modal state variables (lines ~70-75)
   - Added handleSelectOpportunity function (lines ~180-195)
   - Added handleSalesforceSubmit function (lines ~197-217)
   - Updated handleSubmit with loading state (lines ~219-241)
   - Added Salesforce button in header (line ~465)
   - Added Salesforce opportunity list modal (lines ~675-750)
   - Added Salesforce pre-filled form modal (lines ~752-890)
   - Added Mobile Phone and Preferred Contact Method to regular modal (lines ~545-565)
   - Updated submit buttons with loading states (lines ~600, 885)

**Git Commits:**
- `62ae9e2` - "Add Salesforce opportunity integration"
- `31833a6` - "Add Mobile Phone and Preferred Contact Method fields to regular project modal"

### What Worked Well

✅ **Isolation Strategy:**
- Salesforce integration is completely separate from existing project creation
- If Salesforce Lambda fails, regular project creation still works
- Can disable Salesforce button without affecting anything else
- Testing one doesn't impact the other

✅ **Backend Changes Were Minimal:**
- Added 3 optional fields to Lambda
- No breaking changes to existing API
- All existing projects continue to work
- Empty strings as defaults prevent null/undefined issues

✅ **Two-Step User Flow:**
- Users understand they're doing something different ("Create from Salesforce" vs "Create Project")
- Opportunity selection is clear and straightforward
- Pre-populated data saves time but is still editable
- Can cancel at any point without side effects

✅ **Loading States:**
- Users get immediate visual feedback when clicking submit
- Button text changes ("Create Project" → "Creating...")
- Button disabled during save prevents double-clicks
- Consistent pattern across both modals

✅ **Error Handling:**
- Try-catch blocks prevent crashes
- Alerts inform users of failures
- Finally blocks ensure loading states always reset
- Network failures don't break the UI

### What Could Have Gone Better

⚠️ **Modal Code Duplication:**
- Regular modal and Salesforce modal have ~90% identical form fields
- Could have created shared FormFields component
- However, this was intentional to avoid the consolidation risks (see below)

⚠️ **Field Additions Required Two Updates:**
- When adding Mobile Phone and Preferred Contact Method, had to update both modals
- Risk that they could get out of sync over time
- Trade-off: duplication vs. complexity

---

## Problems We Avoided

### 1. Breaking Existing Functionality

**Risk:** Modifying existing modal could break project editing

**How We Avoided:**
- Created completely separate Salesforce modal
- Existing modal code untouched until we added new fields
- When adding fields, we carefully preserved all existing logic
- Edit functionality never tested with Salesforce data flow

**Validation:**
- User confirmed: "That is working as expected" (after initial Salesforce implementation)
- User confirmed: "OK. that works" (after adding loading spinner)
- No reports of broken edit functionality

### 2. Modal Consolidation Complexity

**Risk We Discussed:**
When adding Mobile Phone and Preferred Contact Method to regular modal, we analyzed two options:

**Option 1 (Chosen):** Add fields separately to both modals
- Pros: Low risk, maintains separation, predictable behavior
- Cons: Code duplication

**Option 2 (Rejected):** Consolidate into single modal with mode detection
- Pros: DRY principle, single source of truth
- Cons: High complexity, risk of breaking edit functionality, mode detection bugs

**Decision:** User chose Option 1 explicitly: "I agree lets go with option 1"

**Why This Was Wise:**
- Edit functionality is critical to users' workflow
- Bug in consolidated modal could break both create AND edit
- Separate modals meant Salesforce issues couldn't impact regular workflow
- We had already learned from the original Salesforce modal mysteries

### 3. State Management Bugs

**Risk:** Shared state between workflows could cause race conditions

**How We Avoided:**
- Separate state variables for each workflow:
  - Regular: `showModal`, `editingProject`, `formData`, `savingProject`
  - Salesforce: `showSalesforceModal`, `showSalesforceForm`, `selectedOpportunity`, `salesforceOpportunities`, `savingSalesforceProject`
- Clear state initialization in each handler
- Proper cleanup in close handlers

**Example of Potential Bug Avoided:**
```typescript
// BAD (if we had consolidated):
const handleSubmit = async () => {
  if (isSalesforceMode) {
    // What if isSalesforceMode is stale?
    // What if user opened SF modal then regular modal?
  }
}

// GOOD (what we did):
const handleSubmit = async () => {
  // Only handles regular modal
  // No mode checking needed
}

const handleSalesforceSubmit = async () => {
  // Only handles Salesforce modal
  // No mode checking needed
}
```

### 4. Lambda Complexity

**Risk:** Complex conditional logic in Lambda based on "is this from Salesforce?"

**How We Avoided:**
- Made all new fields optional
- No special handling for Salesforce projects in createProject function
- opportunityId is just another field like any other
- Can query by opportunityId later if needed, but it's not treated specially

**What We Didn't Do (Good):**
```javascript
// We DIDN'T do this:
if (data.opportunityId) {
  // Special Salesforce project creation logic
  // Validate against Salesforce
  // Special field requirements
}
```

**What We Did (Better):**
```javascript
// We just added the fields neutrally:
mobilePhone: data.mobilePhone || "",
preferredContactMethod: data.preferredContactMethod || "",
opportunityId: data.opportunityId || ""
```

### 5. UI/UX Confusion

**Risk:** Users confused about which button to use

**How We Avoided:**
- Clear, distinct button labels:
  - "Create Project" (regular)
  - "Create from Salesforce" (SF integration)
- Different visual context (different modals)
- Salesforce modal has clear two-step progression
- Both buttons visible, neither hidden based on state

### 6. Deployment Coupling

**Risk:** Deploying Salesforce feature could break existing features

**How We Avoided:**
- Backend changes were additive only (new optional fields)
- Frontend changes were additive (new modal, new states)
- Tested regular project creation still worked after deployment
- Incremental deployments:
  1. Backend Lambda changes
  2. Frontend Salesforce modal
  3. Frontend regular modal field additions
- Each deployment was tested independently

### 7. Git Commit Atomicity

**Risk:** Massive commit with all changes makes rollback difficult

**How We Avoided:**
- Separate commits for logical changes:
  - Commit 1: Salesforce integration feature
  - Commit 2: Regular modal field additions
- Each commit is independently deployable
- If regular modal changes broke something, could revert just that commit

---

## PowerPoint Feature Architecture Plan

### Objective

Add ability to generate PowerPoint (.pptx) presentations from the Project Detail page containing:
1. Cover slide (client info, project name, designer)
2. Section divider slides (categories with budget breakdown)
3. Product detail slides (one per line item with image, specs, vendor info, URL)

### Requirements (Based on Example Files)

**Data Needed:**
- Project: name, clientName, clientAddress, projectNumber, designer name
- Categories: name, line items grouped by category
- Line Items: 
  - Product name
  - Vendor name
  - Manufacturer/brand
  - Description/specifications
  - Model number
  - Price
  - Product URL (clickable link)
  - Product image (embedded)
  - Status/option number
  - Notes (if any)

**PowerPoint Structure:**
- Slide 1: Title/cover
- Slide 2-N: Section dividers (one per category)
- Remaining: Product detail slides (one per line item)

### Architectural Options Analysis

#### Option A: Client-Side Generation (Recommended)

**Library:** `pptxgenjs` (npm package)  
**Size:** ~200 KB added to bundle  
**Processing:** In browser

**Implementation:**
1. Add `pptxgenjs` to package.json dependencies
2. Create new service: `src/services/pptxService.ts`
3. Add "Export to PowerPoint" button in ProjectDetail component
4. Fetch all required data:
   - Project details (already have)
   - Categories for project
   - Line items for each category
   - Products for each line item
5. Build presentation using pptxgenjs API
6. Trigger browser download

**Pros:**
- ✅ No backend changes required
- ✅ Uses existing API endpoints (getProject, getCategories, getLineItems, getProduct)
- ✅ Faster to implement (2-3 hours)
- ✅ Real-time generation, no storage needed
- ✅ User gets immediate download
- ✅ No Lambda cold start delays
- ✅ No new AWS resources to manage
- ✅ Easy to test locally during development

**Cons:**
- ⚠️ Adds ~200 KB to frontend bundle
- ⚠️ Processing happens on user's device (slower devices = slower generation)
- ⚠️ Network calls to fetch images happen from browser (CORS could be issue)
- ⚠️ Can't store generated presentations for later

**Risk Assessment:** LOW
- Library is mature and well-documented
- All data already available via existing APIs
- No backend deployment risk
- Can be built behind feature flag
- Easy to remove if problems arise

#### Option B: Server-Side Generation (Lambda)

**Library:** `pptxgenjs` or `officegen` (Node.js)  
**Processing:** In Lambda function

**Implementation:**
1. Create new Lambda function: MaterialsSelection-PPTXGenerator
2. Add pptxgenjs to Lambda dependencies
3. Create new API Gateway endpoint: POST /projects/{projectId}/generate-pptx
4. Lambda fetches data from DynamoDB
5. Lambda generates PPTX file
6. Options for return:
   - a) Return file directly as binary response
   - b) Upload to S3, return pre-signed URL

**Pros:**
- ✅ No bundle size increase for frontend
- ✅ Consistent performance regardless of user's device
- ✅ Can cache/store presentations in S3 if needed
- ✅ Could add to background job queue for very large projects

**Cons:**
- ⚠️ New Lambda function to create and maintain
- ⚠️ New API Gateway endpoint and permissions
- ⚠️ Lambda cold starts add latency (3-5 seconds first time)
- ⚠️ More complex deployment process
- ⚠️ Lambda timeout limits (15 minutes max, should use ~2 minutes)
- ⚠️ Additional costs (Lambda execution + potential S3 storage)

**Risk Assessment:** MEDIUM
- More moving parts (Lambda, API Gateway, potential S3)
- Requires backend deployment
- Binary response handling can be tricky
- Testing requires full deployment cycle

### Recommended Approach: **Option A (Client-Side)**

**Rationale:**
1. **Faster to implement and test**
2. **Lower risk** - no backend changes means can't break existing functionality
3. **Matches our architectural pattern** - keep complex operations separate
4. **User experience** - immediate generation and download
5. **Maintainability** - all PowerPoint logic in one place (src/services/pptxService.ts)

### Implementation Plan (Step-by-Step)

#### Phase 1: Setup and Proof of Concept (1 hour)

**Goal:** Verify pptxgenjs works with our stack, generate minimal presentation

1. Install package:
   ```powershell
   npm install pptxgenjs --save
   ```

2. Create service file:
   ```typescript
   // src/services/pptxService.ts
   import pptxgen from "pptxgenjs";
   
   export const generateBasicPPTX = () => {
     const pptx = new pptxgen();
     const slide = pptx.addSlide();
     slide.addText("Hello World", { x: 1, y: 1, fontSize: 18 });
     pptx.writeFile({ fileName: "Test.pptx" });
   };
   ```

3. Add button to ProjectDetail.tsx:
   ```typescript
   <button onClick={() => generateBasicPPTX()}>
     Test PPTX
   </button>
   ```

4. Test:
   - Build and run locally
   - Click button
   - Verify PowerPoint downloads
   - Verify file opens in PowerPoint/LibreOffice

**Checkpoint:** Stop if file doesn't generate or open correctly. Investigate issues before proceeding.

#### Phase 2: Data Fetching Layer (30 minutes)

**Goal:** Fetch all required data for presentation

1. Add functions to pptxService.ts:
   ```typescript
   export const fetchPresentationData = async (projectId: string) => {
     const project = await projectService.getById(projectId);
     const categories = await categoryService.getByProject(projectId);
     
     const categoriesWithLineItems = await Promise.all(
       categories.map(async (category) => {
         const lineItems = await lineItemService.getByCategory(category.id);
         const lineItemsWithProducts = await Promise.all(
           lineItems.map(async (lineItem) => {
             const product = await productService.getById(lineItem.productId);
             return { ...lineItem, product };
           })
         );
         return { ...category, lineItems: lineItemsWithProducts };
       })
     );
     
     return { project, categories: categoriesWithLineItems };
   };
   ```

2. Test with console.log to verify data structure

**Checkpoint:** Verify all required data is fetching correctly. Check for:
- Missing categories
- Missing line items
- Missing products
- Missing product images

#### Phase 3: Cover Slide Generation (45 minutes)

**Goal:** Create title slide matching example format

1. Study example files to determine:
   - Slide dimensions (4:3 or 16:9?)
   - Font sizes and styles
   - Layout positions
   - Colors

2. Implement cover slide:
   ```typescript
   const createCoverSlide = (pptx: pptxgen, project: Project) => {
     const slide = pptx.addSlide();
     
     // Client name (top)
     slide.addText(project.clientName, {
       x: 1, y: 1, w: 8, h: 0.5,
       fontSize: 24, bold: true, align: "center"
     });
     
     // Address
     slide.addText(project.clientAddress, {
       x: 1, y: 1.5, w: 8, h: 0.5,
       fontSize: 18, align: "center"
     });
     
     // Material Selections title
     slide.addText("Material Selections", {
       x: 1, y: 3, w: 8, h: 1,
       fontSize: 36, bold: true, align: "center"
     });
     
     // Project number
     slide.addText(project.projectNumber, {
       x: 1, y: 4.5, w: 8, h: 0.5,
       fontSize: 16, align: "center"
     });
     
     // Designer name (bottom - will need to add this field?)
     // slide.addText(project.designerName, ...);
   };
   ```

3. Test cover slide in isolation

**Checkpoint:** Compare generated cover slide to examples. Adjust positions/sizes as needed.

#### Phase 4: Section Divider Slides (30 minutes)

**Goal:** Create category divider slides with budget breakdowns

1. Study examples for format
2. Implement:
   ```typescript
   const createSectionSlide = (
     pptx: pptxgen,
     category: Category,
     lineItems: LineItemWithProduct[]
   ) => {
     const slide = pptx.addSlide();
     
     // Category name
     slide.addText(category.name, {
       x: 1, y: 1, w: 8, h: 1,
       fontSize: 28, bold: true
     });
     
     // Divider line
     slide.addText("_".repeat(70), {
       x: 1, y: 1.8, w: 8, h: 0.2,
       fontSize: 12
     });
     
     // Line items breakdown
     let yPos = 2.2;
     lineItems.forEach(item => {
       slide.addText(
         `$${item.price || 0} ${item.product.name}`,
         { x: 1, y: yPos, w: 8, h: 0.3, fontSize: 14 }
       );
       yPos += 0.4;
     });
     
     // Total
     const total = lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
     slide.addText(`Total Allowances: $${total.toFixed(2)}`, {
       x: 1, y: yPos + 0.2, w: 8, h: 0.4,
       fontSize: 16, bold: true
     });
   };
   ```

3. Test section slides

**Checkpoint:** Verify budget calculations and layout match examples.

#### Phase 5: Product Detail Slides (1-2 hours, most complex)

**Goal:** Create product slides with images, specs, and links

1. Implement basic product slide:
   ```typescript
   const createProductSlide = (
     pptx: pptxgen,
     lineItem: LineItemWithProduct
   ) => {
     const slide = pptx.addSlide();
     const { product } = lineItem;
     
     // Product name
     slide.addText(product.name, {
       x: 0.5, y: 0.5, w: 4, h: 0.5,
       fontSize: 18, bold: true
     });
     
     // Status/Option number
     slide.addText(lineItem.status || "Final", {
       x: 5, y: 0.5, w: 4, h: 0.5,
       fontSize: 16
     });
     
     // Vendor
     slide.addText(`Vendor: ${lineItem.vendorName || "TBD"}`, {
       x: 0.5, y: 1.2, w: 9, h: 0.3,
       fontSize: 14
     });
     
     // Description
     slide.addText(product.description || "", {
       x: 0.5, y: 1.6, w: 9, h: 0.5,
       fontSize: 12
     });
     
     // Model number
     if (product.sku) {
       slide.addText(`Model # ${product.sku}`, {
         x: 0.5, y: 2.2, w: 9, h: 0.3,
         fontSize: 12, italic: true
       });
     }
     
     // Price
     if (lineItem.price) {
       slide.addText(`$${lineItem.price}`, {
         x: 0.5, y: 2.6, w: 9, h: 0.3,
         fontSize: 14, bold: true
       });
     }
     
     // URL (hyperlink)
     if (product.productUrl) {
       slide.addText(product.productUrl, {
         x: 0.5, y: 3.0, w: 9, h: 0.3,
         fontSize: 10, color: "0000FF", underline: true,
         hyperlink: { url: product.productUrl }
       });
     }
     
     // Product image (if available)
     if (product.imageUrl) {
       // pptxgenjs can embed images from URLs
       slide.addImage({
         path: product.imageUrl,
         x: 0.5, y: 3.5, w: 3, h: 2.5
       });
     }
     
     // Notes
     if (lineItem.notes) {
       slide.addText(lineItem.notes, {
         x: 0.5, y: 6.2, w: 9, h: 0.4,
         fontSize: 11, italic: true, color: "666666"
       });
     }
   };
   ```

2. Test with products that have images
3. Test with products without images
4. Test URL hyperlinking

**Checkpoint:** This is most likely place for issues:
- Image CORS problems (product images from external sites)
- Image loading failures
- URL formatting issues
- Layout overflow with long descriptions

**Mitigation Strategy for Images:**
- Handle image load failures gracefully (skip image, show placeholder text)
- Test with both HTTP and HTTPS image URLs
- Consider adding image proxy if CORS is an issue

#### Phase 6: Integration and Polish (1 hour)

**Goal:** Wire everything together with proper UX

1. Create main generation function:
   ```typescript
   export const generateProjectPPTX = async (projectId: string) => {
     try {
       // Fetch all data
       const { project, categories } = await fetchPresentationData(projectId);
       
       // Create presentation
       const pptx = new pptxgen();
       pptx.layout = "LAYOUT_4x3";
       pptx.author = "Materials Selection App";
       pptx.title = `${project.name} - Material Selections`;
       
       // Cover slide
       createCoverSlide(pptx, project);
       
       // For each category: section + product slides
       categories.forEach(category => {
         if (category.lineItems.length > 0) {
           createSectionSlide(pptx, category, category.lineItems);
           
           category.lineItems.forEach(lineItem => {
             createProductSlide(pptx, lineItem);
           });
         }
       });
       
       // Generate filename
       const filename = `${project.clientName} - ${project.name} - Material Selections.pptx`;
       
       // Download
       await pptx.writeFile({ fileName: filename });
       
       return true;
     } catch (error) {
       console.error("PowerPoint generation error:", error);
       throw error;
     }
   };
   ```

2. Add to ProjectDetail.tsx:
   ```typescript
   const [generatingPPTX, setGeneratingPPTX] = useState(false);
   
   const handleGeneratePPTX = async () => {
     if (!project) return;
     
     setGeneratingPPTX(true);
     try {
       await generateProjectPPTX(project.id);
       alert("PowerPoint presentation generated successfully!");
     } catch (error) {
       alert("Failed to generate PowerPoint. Please try again.");
     } finally {
       setGeneratingPPTX(false);
     }
   };
   
   // In JSX:
   <button
     onClick={handleGeneratePPTX}
     disabled={generatingPPTX}
     className="..."
   >
     {generatingPPTX ? "Generating..." : "Export to PowerPoint"}
   </button>
   ```

3. Test end-to-end with real project data

**Checkpoint:** Full test with actual project:
- Does it generate without errors?
- Do all slides appear?
- Do images load?
- Do hyperlinks work?
- Does it open in PowerPoint?
- Compare to example files for quality

#### Phase 7: Testing and Refinement (1 hour)

**Test Cases:**
1. Project with no categories → only cover slide
2. Project with categories but no line items → cover + sections only
3. Project with products missing images → handle gracefully
4. Project with very long descriptions → test text overflow
5. Project with 30+ line items → test performance
6. Products with external image URLs → test CORS
7. Products with no URLs → verify slide still looks good

**Refinements:**
- Adjust font sizes if text overflows
- Tweak layout positions to match examples more closely
- Add loading progress indicator for large projects
- Add error handling for specific failure modes
- Add retry logic for image loading

### Deployment Strategy

**Step 1: Local Testing**
- Implement and test fully in development (npm run dev)
- Generate presentations, verify quality
- Test various edge cases

**Step 2: Build and Test**
- Run `npm run build`
- Check bundle size increase (should be ~200 KB)
- Test production build locally with `npm run preview`

**Step 3: Deploy to Production**
- Deploy to S3
- Invalidate CloudFront cache
- Test on production with real data
- Monitor for errors

**Step 4: User Acceptance**
- Generate presentations for a few real projects
- Compare to manually-created examples
- Gather feedback
- Iterate as needed

### Rollback Plan

If issues arise:
1. **Minor issues:** Fix forward
2. **Major issues:** 
   - Git revert the commits
   - Redeploy previous version
   - No backend changes means no Lambda rollback needed

### Success Criteria

✅ User can click "Export to PowerPoint" button  
✅ PowerPoint file downloads to browser  
✅ File opens successfully in PowerPoint/LibreOffice  
✅ Cover slide contains correct project information  
✅ Section dividers appear for each category  
✅ Product slides appear for each line item  
✅ Images display correctly (when available)  
✅ Hyperlinks work when clicked  
✅ Layout matches example presentations  
✅ Generation completes in < 30 seconds for typical project  
✅ No errors in browser console  
✅ Existing functionality remains unaffected  

### Maintenance Considerations

**Future Enhancements:**
- Template selection (different designs)
- Custom branding (logo, colors)
- Option to include/exclude certain categories
- Option to include only "Final" selections (filter out options)
- Email presentation directly from app
- Store presentations in S3 for later retrieval
- Background generation for very large projects

**Potential Issues:**
- External image URLs changing/breaking (solution: cache images, or use proxy)
- PowerPoint format changes (solution: keep pptxgenjs updated)
- Very large projects timing out (solution: add progress indicator, optimize)
- Bundle size concerns (solution: code-split, lazy load pptxgenjs only when needed)

---

## Key Architectural Principles (Lessons Applied)

### 1. Isolation
Keep new features isolated from existing functionality:
- Separate buttons/entry points
- Separate state variables
- Separate service files
- No shared conditional logic

### 2. Backward Compatibility
All changes should be additive:
- Optional fields in backend
- New endpoints, don't modify existing
- Graceful degradation (feature works even if partial data)

### 3. Progressive Enhancement
Build in layers, test each layer:
- Start with basic functionality
- Add complexity incrementally
- Each phase has a checkpoint
- Can stop at any phase if issues arise

### 4. Error Boundaries
Prevent failures from cascading:
- Try-catch blocks around async operations
- Finally blocks to reset UI state
- User-friendly error messages
- Console logging for debugging

### 5. User Feedback
Always show loading states:
- Button text changes during operations
- Disabled states prevent double-clicks
- Clear success/failure messages
- Progress indicators for long operations

### 6. Deployment Independence
Features should be independently deployable:
- Frontend-only changes don't require backend deployment
- Backend changes are backward compatible
- Can roll back frontend without touching backend
- Atomic git commits for atomic rollbacks

### 7. Testing Discipline
Test at every checkpoint:
- Unit test components in isolation
- Integration test full workflows
- Test edge cases explicitly
- Test on production after deployment
- Compare results to expectations/examples

---

## Questions for Consideration

Before starting implementation:

1. **Designer Name Field:**
   - Example presentations show designer name on cover slide
   - Do we need to add this to Project schema?
   - Or pull from current logged-in user?
   - Or make it configurable in settings?

2. **Line Item Data Completeness:**
   - Do line items have all required fields? (status, price, vendor)
   - Or will we need to add fields to LineItem schema?
   - What happens if line item references non-existent product?

3. **Image Sources:**
   - Where are product images hosted? (our S3? external URLs?)
   - Are there CORS restrictions?
   - Do we need an image proxy?

4. **Slide Layout:**
   - 4:3 or 16:9 aspect ratio? (examples appear to be 4:3)
   - Template/theme matching existing presentations?
   - Color scheme?

5. **Performance:**
   - What's the largest project (most line items)?
   - Is 30-second generation time acceptable?
   - Should we add "may take a moment" warning for large projects?

6. **Security:**
   - Any sensitive data that shouldn't be in presentations?
   - Should there be permissions (who can generate presentations)?

---

## Summary

**Current State:**
- Application is stable and functional
- All CRUD operations working
- Salesforce integration deployed and tested
- Git repository up to date

**Salesforce Lessons:**
- Isolation prevented existing features from breaking
- Separate state management avoided complex bugs
- Backward-compatible backend changes were safe
- Step-by-step implementation allowed validation at each stage
- Code duplication was acceptable trade-off vs. consolidation risk

**PowerPoint Plan:**
- Client-side generation (pptxgenjs) recommended
- Low risk, no backend changes required
- 7-phase implementation plan
- Checkpoints prevent wasted effort
- Follows same architectural principles as Salesforce

**Next Steps:**
- Answer questions above
- Get user approval on architectural approach
- Begin Phase 1 implementation
- Test thoroughly at each checkpoint

