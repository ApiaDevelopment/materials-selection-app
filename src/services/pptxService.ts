import pptxgen from "pptxgenjs";
import type {
    Category,
    LineItem,
    LineItemOption,
    Manufacturer,
    Product,
    Project,
    Vendor,
} from "../types";
import {
    categoryService,
    lineItemOptionService,
    lineItemService,
    manufacturerService,
    productService,
    projectService,
    vendorService,
} from "./index";

/**
 * Data structure for organizing project data for PowerPoint generation
 */
interface CategorySection {
  category: Category;
  lineItems: Array<{
    lineItem: LineItem;
    product: Product | null;
    manufacturer: Manufacturer | null;
    vendor: Vendor | null;
    options: Array<{
      option: LineItemOption;
      product: Product;
      manufacturer: Manufacturer | null;
      vendor: Vendor | null;
    }>;
  }>;
  totalBudget: number;
}

interface ProjectPresentationData {
  project: Project;
  categorySections: CategorySection[];
}

/**
 * Phase 2: Data fetching layer
 * Fetches all data needed for PowerPoint generation
 */
async function fetchProjectData(
  projectId: string,
): Promise<ProjectPresentationData> {
  // Fetch project
  const project = await projectService.getById(projectId);

  // Fetch all line items for this project
  const lineItems = await lineItemService.getByProjectId(projectId);

  // Fetch all related data for each line item (including options)
  const lineItemsWithDetails = await Promise.all(
    lineItems.map(async (lineItem) => {
      const category = await categoryService.getById(lineItem.categoryId);

      // Fetch selected product if exists
      let product: Product | null = null;
      let manufacturer: Manufacturer | null = null;
      let vendor: Vendor | null = null;

      if (lineItem.productId) {
        product = await productService.getProduct(lineItem.productId);

        if (product.manufacturerId) {
          manufacturer = await manufacturerService.getManufacturer(
            product.manufacturerId,
          );
        }

        if (lineItem.vendorId) {
          vendor = await vendorService.getVendor(lineItem.vendorId);
        }
      }

      // Fetch line item options
      const options = await lineItemOptionService.getByLineItemId(lineItem.id);

      // Fetch product details for each option (only non-selected options)
      const optionsWithDetails = await Promise.all(
        options
          .filter((opt) => !opt.isSelected)
          .map(async (option) => {
            const optionProduct = await productService.getProduct(
              option.productId,
            );

            let optionManufacturer: Manufacturer | null = null;
            if (optionProduct.manufacturerId) {
              optionManufacturer = await manufacturerService.getManufacturer(
                optionProduct.manufacturerId,
              );
            }

            // Get vendor from product-vendor relationship
            let optionVendor: Vendor | null = null;
            // For options, we don't have a vendorId on the line item,
            // so we would need to look it up from ProductVendors if needed
            // For now, leaving as null since option pricing comes from the option itself

            return {
              option,
              product: optionProduct,
              manufacturer: optionManufacturer,
              vendor: optionVendor,
            };
          }),
      );

      return {
        lineItem,
        product,
        category,
        manufacturer,
        vendor,
        options: optionsWithDetails,
      };
    }),
  );

  // Filter to only line items that have either a selected product or options
  const relevantLineItems = lineItemsWithDetails.filter(
    (item) => item.product !== null || item.options.length > 0,
  );

  // Organize by category
  const categoryMap = new Map<string, CategorySection>();

  relevantLineItems.forEach((item) => {
    const categoryId = item.category.id;

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        category: item.category,
        lineItems: [],
        totalBudget: 0,
      });
    }

    const section = categoryMap.get(categoryId)!;
    section.lineItems.push({
      lineItem: item.lineItem,
      product: item.product,
      manufacturer: item.manufacturer,
      vendor: item.vendor,
      options: item.options,
    });
    section.totalBudget += item.lineItem.totalCost || 0;
  });

  return {
    project,
    categorySections: Array.from(categoryMap.values()),
  };
}

/**
 * Phase 4: Helper function to fetch and convert image to base64 data URI
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Failed to load image from ${url}:`, error);
    throw error;
  }
}

/**
 * Phase 5: Generate cover slide matching sample styling
 * Blue gradient background on left 25%, logo and selector info on right
 */
async function generateCoverSlide(
  pptx: pptxgen,
  project: Project,
): Promise<void> {
  const slide = pptx.addSlide();

  // Blue gradient background on left 25%
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 2.5,
    h: 7.5,
    fill: { color: "1F4788" },
  });

  // Project details in blue section (white text)
  const projectInfo = [];
  if (project.name) projectInfo.push(project.name);
  if (project.customerName) projectInfo.push(project.customerName);
  if (project.address) projectInfo.push(project.address);
  if (project.projectNumber)
    projectInfo.push(`Project: ${project.projectNumber}`);

  if (projectInfo.length > 0) {
    slide.addText(projectInfo.join("\n"), {
      x: 0.2,
      y: 1.5,
      w: 2.1,
      h: 4.0,
      fontSize: 19,
      fontFace: "Calibri",
      color: "FFFFFF",
      valign: "top",
    });
  }

  // Logo on right side
  try {
    const logoData = await fetchImageAsBase64("/MegaProsLogo.png");
    slide.addImage({
      data: logoData,
      x: 4.0,
      y: 0.5,
      w: 3.0,
      h: 0.6,
    });
  } catch (error) {
    console.warn("Failed to add logo to cover slide:", error);
  }

  // Selector info in bottom right
  slide.addText("Judy Hogel\nJudy@megapros.com\n847-652-4185", {
    x: 7.0,
    y: 6.8,
    w: 2.5,
    h: 0.6,
    fontSize: 10,
    fontFace: "Calibri",
    color: "363636",
    align: "right",
    valign: "bottom",
  });
}

/**
 * Phase 5: Generate section slide matching sample styling
 * Blue gradient background on top 75%, section name and info
 */
function generateSectionSlide(
  pptx: pptxgen,
  category: Category,
  totalBudget: number,
): void {
  const slide = pptx.addSlide();

  // Blue gradient background on top 75%
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 5.625,
    fill: { color: "1F4788" },
  });

  // Category name (white text)
  slide.addText(category.name, {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.0,
    fontSize: 39,
    fontFace: "Calibri",
    bold: true,
    align: "center",
    color: "FFFFFF",
  });

  // Section info below blue area
  const budgetText = `Total Budget: $${totalBudget.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  slide.addText(budgetText, {
    x: 0.5,
    y: 6.0,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: "Calibri",
    align: "center",
    color: "363636",
  });

  // Category description if available
  if (category.description) {
    slide.addText(category.description, {
      x: 0.5,
      y: 6.6,
      w: 9,
      h: 0.7,
      fontSize: 18,
      fontFace: "Calibri",
      align: "center",
      color: "666666",
    });
  }
}

/**
 * Phase 5: Generate product slide matching sample styling
 * Blue bar on bottom 10%, product details upper area, image below
 */
async function generateProductSlide(
  pptx: pptxgen,
  lineItem: LineItem,
  product: Product | null,
  manufacturer: Manufacturer | null,
  vendor: Vendor | null,
  statusText?: string,
): Promise<void> {
  const slide = pptx.addSlide();

  // Blue bar on bottom 10%
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 6.75,
    w: 10,
    h: 0.75,
    fill: { color: "1F4788" },
  });

  // Product URL just above blue bar (if available)
  if (product?.productUrl) {
    // Ensure URL has protocol prefix
    let fullUrl = product.productUrl;
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = "https://" + fullUrl;
    }

    slide.addText(fullUrl, {
      x: 0.5,
      y: 5.9,
      w: 9,
      h: 0.7,
      fontSize: 18,
      fontFace: "Calibri",
      hyperlink: { url: fullUrl },
      color: "0563C1",
      align: "center",
      underline: { style: "sng" },
    });
  }

  // Line item name and allowance upper left
  const allowanceText = lineItem.allowance
    ? ` - $${lineItem.allowance.toLocaleString()}`
    : "";
  const headerText = `${lineItem.name}${allowanceText}`;
  slide.addText(headerText, {
    x: 0.3,
    y: 0.2,
    w: 5.0,
    h: 0.5,
    fontSize: 35,
    fontFace: "Calibri",
    bold: true,
    color: "1F4788",
  });

  // Status upper right with tier if available
  const baseStatus = statusText || lineItem.status || "Selected";
  const tierText = product?.tier ? ` - ${product.tier.toUpperCase()}` : "";
  const fullStatusText = `${baseStatus}${tierText}`.toUpperCase();

  // Determine status color
  let statusColor = "1F4788"; // Default blue
  const statusLower = baseStatus.toLowerCase();

  if (statusLower === "installed") {
    statusColor = "2D9F48"; // Green
  } else if (statusLower === "ordered") {
    statusColor = "2B579A"; // Blue
  } else if (statusLower === "received") {
    statusColor = "7E3BA6"; // Purple
  } else if (statusLower === "final") {
    statusColor = "0D9488"; // Teal
  } else if (statusLower.startsWith("option")) {
    statusColor = "D97706"; // Amber/Orange
  } else if (statusLower === "no selection") {
    statusColor = "DC2626"; // Red
  }

  slide.addText(fullStatusText, {
    x: 5.5,
    y: 0.2,
    w: 4.2,
    h: 0.5,
    fontSize: 35,
    fontFace: "Calibri",
    bold: true,
    color: statusColor,
    align: "right",
  });

  // Product details
  let yPos = 0.9;
  const detailsX = 0.3;
  const detailsW = 4.5;

  // Product name
  if (product?.name) {
    slide.addText(`Product: ${product.name}`, {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      bold: true,
      color: "363636",
    });
    yPos += 0.35;
  }

  // Product description (materials)
  if (product?.description || lineItem.material) {
    const description = product?.description || lineItem.material;
    slide.addText(`Description: ${description}`, {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      color: "363636",
    });
    yPos += 0.35;
  }

  // Model number (without tier)
  if (product?.modelNumber) {
    slide.addText(`Model: ${product.modelNumber}`, {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      color: "363636",
    });
    yPos += 0.35;
  }

  // Manufacturer
  if (manufacturer) {
    slide.addText(`Manufacturer: ${manufacturer.name}`, {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      color: "363636",
    });
    yPos += 0.35;
  }

  // Vendor
  if (vendor) {
    slide.addText(`Vendor: ${vendor.name}`, {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      color: "363636",
    });
    yPos += 0.35;
  }

  // Quantity
  slide.addText(`Quantity: ${lineItem.quantity} ${lineItem.unit}`, {
    x: detailsX,
    y: yPos,
    w: detailsW,
    h: 0.3,
    fontSize: 18,
    fontFace: "Calibri",
    bold: true,
    color: "363636",
  });
  yPos += 0.35;

  // Pricing
  slide.addText(
    `Unit: $${lineItem.unitCost.toFixed(2)} | Total: $${lineItem.totalCost.toFixed(2)}`,
    {
      x: detailsX,
      y: yPos,
      w: detailsW,
      h: 0.3,
      fontSize: 18,
      fontFace: "Calibri",
      color: "363636",
    },
  );

  // Product image or placeholder (below details)
  try {
    let imageData: string;
    if (product?.imageUrl) {
      try {
        imageData = await fetchImageAsBase64(product.imageUrl);
      } catch (error) {
        console.warn(`Failed to load product image, using placeholder:`, error);
        imageData = await fetchImageAsBase64("/SubstituteImage.png");
      }
    } else {
      imageData = await fetchImageAsBase64("/SubstituteImage.png");
    }

    slide.addImage({
      data: imageData,
      x: 5.0,
      y: 1.0,
      w: 4.5,
      h: 5.0,
      sizing: { type: "contain", w: 4.5, h: 5.0 },
    });
  } catch (error) {
    console.warn(`Failed to add image to slide:`, error);
  }
}

/**
 * Phase 3: Main function to generate project PowerPoint
 * Generates complete presentation with cover, sections, and product slides
 */
export async function generateProjectPPTX(projectId: string): Promise<void> {
  try {
    console.log("Fetching project data for PowerPoint generation...");
    const data = await fetchProjectData(projectId);

    console.log("Generating PowerPoint presentation...");

    // Create presentation instance
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_4x3";
    pptx.author = "MegaPros Materials Selection App";
    pptx.title = data.project.name;

    // Generate cover slide with logo
    await generateCoverSlide(pptx, data.project);

    // Generate category sections with products
    for (const section of data.categorySections) {
      // Section divider slide
      generateSectionSlide(pptx, section.category, section.totalBudget);

      // Product slides for this category
      for (const item of section.lineItems) {
        const isFinal = item.lineItem.status === "final";

        if (isFinal) {
          // For "final" status, only show selected product (or "No Selection")
          const statusText = item.product ? "Final" : "No Selection";
          await generateProductSlide(
            pptx,
            item.lineItem,
            item.product,
            item.manufacturer,
            item.vendor,
            statusText,
          );
        } else {
          // For non-final status, show selected product first, then options
          // Show selected product slide if it exists
          if (item.product) {
            await generateProductSlide(
              pptx,
              item.lineItem,
              item.product,
              item.manufacturer,
              item.vendor,
              undefined, // Use actual status
            );
          }

          // Show option slides
          for (let i = 0; i < item.options.length; i++) {
            const option = item.options[i];
            const optionStatusText = `Option ${i + 1}`;

            // Create a temporary line item for the option with option's cost
            const optionLineItem = {
              ...item.lineItem,
              unitCost: option.option.unitCost,
              totalCost: option.option.unitCost * item.lineItem.quantity,
            };

            await generateProductSlide(
              pptx,
              optionLineItem,
              option.product,
              option.manufacturer,
              option.vendor,
              optionStatusText,
            );
          }
        }
      }
    }

    // Generate filename
    const fileName = `${data.project.name.replace(/[^a-zA-Z0-9]/g, "_")}_Materials_Selection.pptx`;

    // Download the file
    console.log(`Downloading ${fileName}...`);
    await pptx.writeFile({ fileName });

    console.log("PowerPoint generated successfully!");
  } catch (error) {
    console.error("Error generating PowerPoint:", error);
    alert("Failed to generate PowerPoint. Check console for details.");
  }
}

/**
 * Phase 1: Basic proof of concept - generates a simple PowerPoint with one slide
 * Used to verify pptxgenjs works with our stack
 */
export const generateTestPPTX = () => {
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.layout = "LAYOUT_4x3"; // Match sample presentations
  pptx.author = "MegaPros Materials Selection App";
  pptx.title = "Test Presentation";

  // Add a simple slide
  const slide = pptx.addSlide();
  slide.addText("Hello World from PowerPoint!", {
    x: 1,
    y: 1,
    w: 8,
    h: 1,
    fontSize: 24,
    bold: true,
    align: "center",
    color: "363636",
  });

  slide.addText("If you can see this, pptxgenjs is working correctly!", {
    x: 1,
    y: 2.5,
    w: 8,
    h: 0.5,
    fontSize: 14,
    align: "center",
    color: "666666",
  });

  // Download the file
  pptx.writeFile({ fileName: "Test-Presentation.pptx" });
};
