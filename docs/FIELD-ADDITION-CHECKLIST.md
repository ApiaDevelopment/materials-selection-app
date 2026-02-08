# Field Addition Checklist

## ⚠️ CRITICAL: Read This Every Time Before Adding Fields to Entities

When adding a field to **Project**, **Category**, **LineItem**, **Product**, **Vendor**, or **Manufacturer**:

---

## Backend (Lambda - lambda/index.js)

### Create Function:

- [ ] Add field to `createProject()` / `createCategory()` / etc.
- [ ] Use default value: `fieldName: data.fieldName || ""`
- [ ] Position: Add in logical order with related fields

Example:

```javascript
async function createProject(data) {
  const project = {
    id: randomUUID(),
    name: data.name,
    description: data.description,
    projectNumber: data.projectNumber || "", // ← NEW FIELD
    customerName: data.customerName || "",
    // ... rest of fields
  };
}
```

### Update Function:

- [ ] Usually automatic via spread operator (`...data`)
- [ ] Verify no explicit field list that needs updating

---

## Frontend TypeScript (src/types/index.ts)

- [ ] Add to main interface (e.g., `Project`, `Category`)
- [ ] Add to `CreateXRequest` interface
- [ ] Add to `UpdateXRequest` interface
- [ ] Mark as optional with `?` unless required

Example:

```typescript
export interface Project {
  id: string;
  name: string;
  projectNumber?: string; // ← NEW FIELD
  // ... rest of fields
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  projectNumber?: string; // ← NEW FIELD
  // ... rest of fields
}
```

---

## Frontend Component State (MOST ERROR-PRONE)

### ⚠️ CRITICAL: Find ALL setFormData() calls

**Search Pattern:** `setFormData({` or `setFormData(\s*{`

For each occurrence, add the new field with appropriate default value.

### Typical Locations in ProjectList.tsx / CategoryList.tsx / etc:

#### 1. Initial useState Declaration

```typescript
const [formData, setFormData] = useState<CreateProjectRequest>({
  name: "",
  description: "",
  projectNumber: "", // ← ADD HERE
  customerName: "",
  // ... ALL fields must be here
});
```

#### 2. handleOpenModal - Edit Mode (when project exists)

```typescript
if (project) {
  setFormData({
    name: project.name,
    description: project.description,
    projectNumber: project.projectNumber || "", // ← ADD HERE
    customerName: project.customerName || "",
    // ... ALL fields must be here
  });
}
```

#### 3. handleOpenModal - Create Mode (new entity)

```typescript
else {
  setFormData({
    name: "",
    description: "",
    projectNumber: "",  // ← ADD HERE
    customerName: "",
    // ... ALL fields must be here with empty defaults
  });
}
```

#### 4. handleCloseModal

```typescript
const handleCloseModal = () => {
  setShowModal(false);
  setEditingProject(null);
  setFormData({
    name: "",
    description: "",
    projectNumber: "", // ← ADD HERE
    customerName: "",
    // ... ALL fields must be here with empty defaults
  });
};
```

#### 5. Salesforce/Special Modals (if applicable)

```typescript
const handleCloseSalesforceModal = () => {
  setFormData({
    name: "",
    description: "",
    projectNumber: "", // ← ADD HERE
    // ... ALL fields
  });
};

const handleSelectOpportunity = async (id: string) => {
  setFormData({
    name: details.name,
    description: details.description,
    projectNumber: "", // ← ADD HERE (usually empty for SF)
    // ... ALL fields
  });
};
```

### ⚠️ WHY THIS BREAKS

If you add a field to TypeScript types but NOT to all formData initializations:

- Field may be `undefined` instead of empty string
- Backend may crash or reject the request
- Form inputs may fail to bind correctly
- Edit mode may lose data

---

## Frontend JSX (Form Inputs)

- [ ] Add input field to form
- [ ] Add to BOTH modals if you have separate ones (e.g., regular + Salesforce)
- [ ] Position field in logical order
- [ ] Use proper input type (text, tel, email, number, date, etc.)
- [ ] Bind to formData with null coalescing: `value={formData.projectNumber || ""}`

Example:

```tsx
<div className="col-span-2">
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Project Number
  </label>
  <input
    type="text"
    value={formData.projectNumber || ""}
    onChange={(e) =>
      setFormData({ ...formData, projectNumber: e.target.value })
    }
    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
  />
</div>
```

---

## Deployment Process

### Backend Deployment:

- [ ] Copy `lambda/index.js` to `lambda/deploy/index.js`
- [ ] Create ZIP with all 5 items (see DEPLOYMENT-CHECKLIST.md)
- [ ] Upload to Lambda via AWS Console
- [ ] Check CloudWatch logs for errors

### Frontend Deployment:

- [ ] `npm run build` - verify no TypeScript errors
- [ ] `aws s3 sync dist/ s3://materials-selection-app-7525 --delete`
- [ ] `aws cloudfront create-invalidation --distribution-id E2CO2DGE8F4YUE --paths "/*"`
- [ ] Wait 2-3 minutes for invalidation
- [ ] Hard refresh browser (Ctrl+Shift+R)

### Testing:

- [ ] Create new entity with new field
- [ ] Edit existing entity - verify field loads
- [ ] Check browser console for errors
- [ ] Check Network tab - verify field in request/response
- [ ] Check DynamoDB - verify field saved

### Git:

- [ ] Test BEFORE committing
- [ ] Commit backend and frontend separately if possible
- [ ] Clear commit message describing the field added

---

## Common Mistakes History

### 2026-02-08: projectNumber field

**Problem:** Added to TypeScript types and Lambda, but forgot to add to all formData initializations  
**Result:** Edit mode failed because formData was missing mobilePhone and preferredContactMethod  
**Lesson:** Must grep for ALL setFormData calls and update every single one

### 2026-02-08: mobilePhone and preferredContactMethod

**Problem:** Added input fields to JSX but never added to formData state initializations  
**Result:** Fields worked initially but broke when projectNumber was added  
**Lesson:** Adding JSX without updating state is incomplete - both must be done together

---

## Verification Script

Before deploying, run this check:

```powershell
# Check that your new field appears in all the right places
$field = "projectNumber"  # Change to your field name

# Should appear in types
Select-String -Path "src\types\index.ts" -Pattern $field

# Should appear multiple times in component (once per setFormData)
Select-String -Path "src\components\ProjectList.tsx" -Pattern $field

# Should appear in Lambda
Select-String -Path "lambda\index.js" -Pattern $field
Select-String -Path "lambda\deploy\index.js" -Pattern $field
```

Expected counts:

- **TypeScript types**: 3+ occurrences (Project, CreateRequest, UpdateRequest)
- **Component**: 10+ occurrences (all formData + JSX input)
- **Lambda**: 1-2 occurrences (create function, maybe update)
