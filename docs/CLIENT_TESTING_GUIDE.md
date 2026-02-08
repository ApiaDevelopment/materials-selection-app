# Materials Selection Application

## User Testing and Review Guide

**Application URL:** [mpmaterials.apiaconsulting.com](https://mpmaterials.apiaconsulting.com)

---

## Introduction

Thank you for participating in the review and testing of the Materials Selection Application. This is a **fully functional prototype** designed for:

- **Proof of Concept** - Demonstrating core functionality and workflow
- **User Testing** - Validating the user experience and interface design
- **User Feedback** - Gathering your insights to refine and improve the application

### Important Notes

**Application Status:**
While this prototype is fully functional, you may encounter issues or areas that need refinement. Please note any problems, suggestions, or feedback you have during your testing - this is extremely valuable input for the development process.

**Data Preservation:**
Any data you enter during testing, **particularly product setup information**, will be saved and preserved. This data will not be lost when we move to the next phase of implementation, so feel free to enter real product information as needed.

---

## A. Product Maintenance

The Product Maintenance section allows you to manage the foundational data for materials selection: vendors, manufacturers, and products.

### Vendor Setup

**Purpose:** Vendors are the companies you purchase products from.

**How to Access:**

1. Navigate to the **Vendors** page from the main navigation menu
2. Click the **➕ Add Vendor** button

**Key Fields:**

- **Vendor Name** - Company name (e.g., "ABC Supply Co.")
- **Contact Person** - Primary contact at the vendor
- **Email & Phone** - Contact information
- **Address** - Vendor's physical location
- **Website** - Vendor's website URL
- **Notes** - Any additional information

**Actions:**

- **Edit** - Use the ✏️ Edit button to modify vendor details
- **Delete** - Remove vendors that are no longer needed

### Manufacturer Setup

**Purpose:** Manufacturers are the companies that produce the products (may be different from vendors).

**How to Access:**

1. Navigate to the **Manufacturers** page from the main navigation menu
2. Click the **➕ Add Manufacturer** button

**Key Fields:**

- **Manufacturer Name** - Company name (e.g., "Mohawk Industries")
- **Contact Information** - Email, phone, website
- **Description** - Additional details about the manufacturer
- **Notes** - Internal notes or special considerations

**Actions:**

- **Edit** - Modify manufacturer information
- **Delete** - Remove manufacturers no longer in use

### Product Setup

**Purpose:** Products are the individual items (flooring, tile, fixtures, etc.) available for project selection.

**How to Access:**

1. Navigate to the **Products** page from the main navigation menu
2. Click the **➕ Add Product** button

**Key Fields:**

- **Product Type** - Category (Flooring, Tile, Plumbing, etc.)
- **Product Name** - Descriptive name
- **SKU/Model** - Manufacturer's product code
- **Manufacturer** - Select from the manufacturers you've set up
- **Tier Level** - Good, Better, or Best
- **Collection** - Product line or collection name
- **Color/Finish** - Product appearance details
- **Size/Dimensions** - Product measurements
- **Unit** - Unit of measure (Square Foot, Linear Foot, Each, etc.)
- **List Price** - Manufacturer's suggested retail price
- **Description** - Detailed product information
- **Product URL** - Link to manufacturer's product page
- **Image URL** - Link to product image (will appear in presentations)
- **Notes** - Internal notes or installation considerations

**Actions:**

- **Edit** - Update product information
- **Delete** - Remove products from the catalog
- **Filter & Search** - Use filters to find products by type, manufacturer, tier, or collection

### Product-Vendor Association

**Purpose:** Link products to the vendors who supply them, including vendor-specific pricing.

**How to Access:**

1. From the **Products** page, click on a product to view its details
2. Scroll to the **Vendor Associations** section
3. Click **➕ Add Vendor** to associate a vendor with this product

**Key Fields:**

- **Vendor** - Select which vendor supplies this product
- **Vendor SKU** - Vendor's product code (may differ from manufacturer SKU)
- **Vendor Price** - Your cost from this vendor
- **Lead Time** - How many days to receive the product
- **Minimum Order** - Minimum quantity requirements
- **Notes** - Vendor-specific details

**Why This Matters:**
When you select a product for a project, you can choose which vendor to purchase from based on price, lead time, and other factors.

---

## B. Project Creation

Projects are the central organizing structure for materials selection. Each project represents a client job or renovation.

### Two Ways to Create a Project

There are two methods for creating new projects:

1. **Basic Project Creation** - Manually enter all project information
2. **Load from Salesforce** - Pre-populate project data from an existing Salesforce opportunity

### Method 1: Basic Project Creation

**How to Access:**

1. Navigate to the **Projects** page from the main navigation menu
2. Click the **➕ New Project** button
3. The basic project creation form appears

**Project Information:**

- **Project Name** - Descriptive name for the job (e.g., "Smith Kitchen Remodel")
- **Project Type** - Residential, Commercial, or Hospitality
- **Status** - Planning, In Progress, On Hold, or Completed
- **Customer Information:**
  - Customer Name
  - Address
  - Phone Number
  - Email Address
  - Mobile Phone
  - Preferred Contact Method
- **Project Details:**
  - Project Number - Internal tracking number
  - Description - Project scope and notes
  - Estimated Start Date
  - Budget - Overall project budget

**After Creation:**
Once created, you'll be taken to the Project Detail page where you can begin adding sections and selecting products.

### Method 2: Load from Salesforce

**Purpose:** Automatically import project and customer information from an existing Salesforce opportunity, reducing manual data entry.

**How to Access:**

1. Navigate to the **Projects** page from the main navigation menu
2. Click the **➕ New Project** button
3. Check the **"Load from Salesforce Opportunity"** checkbox
4. Click **"Load from Salesforce"** button

**Salesforce Workflow:**

1. **Select Opportunity:**
   - A list of active Salesforce opportunities appears
   - Browse through available opportunities
   - Click **"Select"** on the opportunity you want to use

2. **Review Pre-Populated Data:**
   - The project form automatically fills with Salesforce data:
     - Project Name (from Opportunity Name)
     - Customer Name (from Account)
     - Address (from Account)
     - Phone and Email (from Account)
     - Additional contact information
   - All fields remain editable - you can modify any pre-filled data

3. **Complete and Create:**
   - Review and adjust the pre-populated information as needed
   - Add any additional details (budget, estimated start date, etc.)
   - Click **"Create Project"** to save

**Benefits:**

- Faster project creation with less typing
- Ensures consistency between Salesforce and the Materials Selection App
- Automatically links project to Salesforce opportunity for future reference
- Reduces data entry errors

**Note:** The Salesforce integration requires that opportunities are properly set up in your Salesforce system with complete account information.

---

## C. Project Detail

The Project Detail page is where you build out your materials selection for a specific project.

### Project Header

The project header displays:

- **Project Name and Status** - Stacked vertically for easy viewing
- **Project Type** - Residential, Commercial, or Hospitality
- **Customer Information** - Name, address, phone, email
- **Action Buttons:**
  - **📊 Export PowerPoint** - Generate presentation (see Section D)
  - **📄 Documents** - Access SharePoint documents (if configured)
  - **✏️ Edit** - Modify project information
  - **➕ Section** - Add a new category section
  - **📦 Insert Product** - Quick product insertion

### Section Creation

**Purpose:** Sections organize products by category (e.g., "Kitchen Flooring", "Master Bath Tile", "Plumbing Fixtures").

**How to Create:**

1. Click the **➕ Section** button in the project header
2. Select a category from the dropdown:
   - Flooring
   - Tile
   - Plumbing
   - Countertops
   - Cabinets
   - Lighting
   - Hardware
   - Paint
   - Appliances
   - Miscellaneous
3. Enter a **Section Budget** (optional)
4. Click **Add Section**

**Section Management:**

- Each section displays its products in a grouped view
- Budget tracking shows total vs. allocated amounts
- Sections can be viewed by category or by vendor

### Item Input (Line Items)

**Purpose:** Line items represent individual product selections within a section.

**How to Add:**
Within a section, you can add products using two methods:

#### Method 1: In-Line Product Selection

**Best For:** Quick selection when you know which product you want.

**How to Use:**

1. Within a section, click **➕ Add Item**
2. A new line item row appears with dropdowns:
   - **Product** - Select from your product catalog
   - **Manufacturer** - Auto-filled based on product selection
   - **Vendor** - Choose which vendor to purchase from
   - **Quantity** - Number of units needed
   - **Unit Cost** - Auto-filled from vendor pricing (can be adjusted)
3. The **Extended Price** automatically calculates (Quantity × Unit Cost)
4. **Status** options: Pending, Selected, Approved, Ordered, or Rejected
5. Add **Notes** for special instructions or considerations

**Actions:**

- **Save** - Confirms the line item
- **Cancel** - Discards changes
- **Edit** - Modify an existing line item
- **Delete** - Remove the line item

#### Method 2: Insert Product (Modal Selection)

**Best For:** Browsing and comparing products before selection.

**How to Use:**

1. Click the **📦 Insert Product** button in the project header
2. A product selection modal opens with:
   - **Category Filter** - Choose which section to add the product to
   - **Product Filters:**
     - Vendor
     - Manufacturer
     - Product Type
     - Tier Level (Good, Better, Best)
     - Collection
   - **Search** - Text search across product names and descriptions
   - **Product Grid** - Visual display of filtered products showing:
     - Product image (if available)
     - Product name and SKU
     - Manufacturer and tier
     - Price and availability
3. Select a product from the grid
4. Choose **Vendor** (if multiple vendors supply this product)
5. Enter **Quantity**
6. Review **Unit Cost** (auto-filled, can be adjusted)
7. Click **Insert Product**

**Advantages:**

- Visual product browsing
- Easy comparison of similar products
- Advanced filtering capabilities
- See product images and details before selection

### Product Information Display

Each line item shows:

- **Product Name** - Clickable link to manufacturer's page (if URL provided)
- **Manufacturer** - Product source
- **Collection & SKU** - Product identification
- **Tier Level** - Good, Better, or Best indicator
- **Quantity & Unit** - How much is being ordered
- **Pricing** - Unit cost and extended price
- **Status** - Current approval/order status
- **Notes** - Any special instructions

### View Modes

Toggle between two view modes:

- **By Section** - Groups products by category (Flooring, Tile, etc.)
- **By Vendor** - Groups products by vendor for easier ordering

---

## D. PowerPoint Export

The PowerPoint Export feature generates a professional presentation of your materials selection.

### How to Export

**From Project Detail Page:**

1. Click the **📊 Export PowerPoint** button in the project header
2. The system automatically generates a PowerPoint file
3. The file downloads to your computer with the naming format:
   `[ProjectName]_Materials_Selection.pptx`

### Presentation Contents

The generated PowerPoint includes:

**1. Cover Slide**

- Project name and customer information
- Project type and status
- Materials selector information
- MegaPros branding and logo

**2. Section Divider Slides**

- One slide per category (Flooring, Tile, etc.)
- Section name in large text
- Budget allocation for that category
- Professional blue gradient background

**3. Product Detail Slides**

- One slide per product showing:
  - Product name and status
  - Manufacturer and tier level
  - SKU, collection, color, and size
  - Quantity and pricing
  - Product image (if URL provided) or placeholder
  - Clickable link to manufacturer's website
  - Vendor information

### Presentation Design

The PowerPoint follows professional design standards:

- **Aspect Ratio:** 4:3 standard presentation format
- **Fonts:** Calibri throughout for consistency
- **Color Scheme:** Professional blue (#1F4788) with white text
- **Images:** Product images embedded (or placeholder if not available)
- **Branding:** MegaPros logo on cover slide

### Using the Presentation

**With Clients:**

- Review product selections visually
- Present good/better/best options
- Show budget allocation by category
- Provide clickable links to manufacturer details

**Editing:**
The exported PowerPoint is fully editable:

- Modify text and pricing
- Rearrange or delete slides
- Add your own branding or notes
- Insert additional images or information

**Hyperlinks:**
Product URLs are active hyperlinks:

- In slideshow mode: Click to open manufacturer's website
- In edit mode: Ctrl+Click (Windows) or Cmd+Click (Mac) to follow link

---

## E. AI Chat Assistant

The AI Chat Assistant provides intelligent help and automation for product selection and project management.

### How to Access

**Opening the Chat:**

1. Click the **💬 Chat** button in the main navigation menu
2. The AI assistant panel opens on the right side of the screen

### What the AI Can Do

**Product Information:**

- Answer questions about products in your catalog
- Compare products across different manufacturers or tiers
- Explain product specifications and features
- Recommend products based on project requirements

**Project Assistance:**

- Help with budget allocation across categories
- Suggest product combinations
- Calculate quantities needed based on room dimensions
- Provide installation or specification guidance

**Data Entry:**

- Help format product information
- Suggest standardized naming conventions
- Validate SKU or model numbers

### Using the Chat

**Asking Questions:**
Simply type your question in natural language:

- "What flooring options do we have in the Better tier?"
- "Show me all tile products from Manufacturer X"
- "What's the price difference between these two products?"
- "How much flooring do I need for a 12x15 foot room?"

**Getting Recommendations:**
Ask for suggestions based on criteria:

- "Recommend budget-friendly plumbing fixtures for a residential bathroom"
- "What are our best options for commercial-grade tile?"
- "Compare Good vs. Better tier countertops"

**Tips for Best Results:**

- Be specific about what you're looking for
- Mention relevant criteria (budget, tier, manufacturer, etc.)
- Ask follow-up questions to refine recommendations
- Use the AI to explore options before making final selections

---

## Testing Feedback

As you explore the application, please document:

### Functionality Issues

- Any features that don't work as expected
- Errors or unexpected behavior
- Performance problems (slow loading, etc.)

### User Experience

- Confusing workflows or navigation
- Missing features or capabilities you need
- Layout or design improvements
- Mobile/tablet experience (if tested)

### Data & Content

- Required fields that are missing
- Fields that are unnecessary or confusing
- Default values that should be different
- Better labeling or descriptions needed

### Business Process

- Does the workflow match your actual process?
- Are there steps that could be simplified?
- Missing integrations or connections to other systems?
- Reporting or export needs not addressed?

### Product Selection

- Is the product catalog structure intuitive?
- Are the filtering and search capabilities sufficient?
- Do you need additional product attributes?
- Are vendor associations working as expected?

---

## Getting Help

**During Testing:**
If you encounter issues or have questions during your testing, please document them with:

- What you were trying to do
- What happened instead
- Any error messages you saw
- Screenshots (if applicable)

**Contact Information:**
[Add your preferred contact method here]

---

## What Happens Next

After your review and testing:

1. **Feedback Collection** - We'll gather all feedback and prioritize improvements
2. **Refinement Phase** - Updates based on your input
3. **Data Migration** - Your product data will be preserved and migrated
4. **Production Implementation** - Move to the final production environment
5. **Training** - Comprehensive training for all users
6. **Go-Live** - Launch the production system

---

## Appendix: Quick Reference

### Common Tasks

| Task                        | Steps                                               |
| --------------------------- | --------------------------------------------------- |
| Add a Product               | Products → ➕ Add Product → Fill details → Save     |
| Create a Project            | Projects → ➕ New Project → Enter info → Create     |
| Add Section to Project      | Project Detail → ➕ Section → Select category → Add |
| Select a Product            | In Section → ➕ Add Item → Choose product → Save    |
| Export PowerPoint           | Project Detail → 📊 Export PowerPoint               |
| Associate Vendor to Product | Products → Click product → ➕ Add Vendor            |

### Keyboard Shortcuts

| Action        | Shortcut                         |
| ------------- | -------------------------------- |
| Search/Filter | Start typing in any filter field |
| Close Modal   | ESC key                          |
| Save Form     | CTRL+Enter (in most forms)       |

### Browser Recommendations

**Recommended Browsers:**

- Google Chrome (latest version)
- Microsoft Edge (latest version)
- Mozilla Firefox (latest version)
- Safari (latest version on Mac)

**For Best Performance:**

- Use a modern browser with latest updates
- Enable JavaScript
- Allow pop-ups for document downloads
- Use desktop/laptop for full functionality (mobile support is limited in this prototype)

---

**Thank you for your participation in testing the Materials Selection Application!**

Your feedback is invaluable in creating a system that truly meets your needs.
