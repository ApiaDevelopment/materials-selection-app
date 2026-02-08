# Lambda Deployment Checklist

## ⚠️ CRITICAL: Read This Every Time Before Deploying Lambda

### Required Files in ZIP (all from lambda/deploy folder):

- [ ] index.js
- [ ] package.json
- [ ] package-lock.json
- [ ] sharepointService.js
- [ ] node_modules/ (entire folder)

### Deployment Steps:

**Step 1: Copy Updated Files**

```powershell
Copy-Item lambda\index.js lambda\deploy\index.js -Force
```

**Step 2: Verify Changes**

```powershell
# Check that your changes are in deploy/index.js
Select-String -Path "lambda\deploy\index.js" -Pattern "YOUR_CHANGE_HERE" -Context 2
```

**Step 3: Create ZIP Manually**

- Navigate to `lambda\deploy` folder in File Explorer
- Select ALL 5 items listed above
- Right-click → Send to → Compressed (zipped) folder
- Name it: `lambda-description-YYMMDD.zip`
- Move ZIP to parent `lambda` folder

**Step 4: Upload via AWS Console**

- Go to AWS Lambda Console
- Find MaterialsSelection-API function
- Click "Upload from" → ".zip file"
- Select your ZIP file
- Click "Save"
- Wait for "Successfully updated" message

**Step 5: Test**

- Try creating a project in the app
- Check CloudWatch logs for errors
- Verify new fields are being saved

### ❌ NEVER DO THIS:

```powershell
# This is WRONG - missing node_modules
Compress-Archive -Path index.js,package.json,sharepointService.js -DestinationPath function.zip
```

### ✅ DO THIS INSTEAD:

Use File Explorer to manually ZIP all 5 items, or if using CLI:

```powershell
cd lambda\deploy
# Ensure node_modules exists first
Compress-Archive -Path index.js,package.json,package-lock.json,sharepointService.js,node_modules -DestinationPath ..\lambda-description.zip -Force
cd ..\..
```

## History of Deployment Failures

**2026-02-08:** Deployed without node_modules → Lambda failed to start → 502 Bad Gateway

- **Root Cause:** Used Compress-Archive with only .js files, forgot node_modules
- **Lesson:** Always include all 5 items, verify ZIP size (should be ~50MB+ with node_modules)
