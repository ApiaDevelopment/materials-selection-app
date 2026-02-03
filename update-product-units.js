// Script to update product units based on description
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = "MaterialsSelection-Products";

// Determine unit based on product name and description
function determineUnit(name, description, category) {
  const text = `${name} ${description} ${category}`.toLowerCase();

  // Check for square footage indicators
  if (text.match(/tile|flooring|countertop|sheet|panel|board/i)) {
    return "sq. ft.";
  }

  // Check for linear footage indicators
  if (text.match(/trim|molding|railing|rope|chain|wire|pipe|tubing/i)) {
    return "linear ft.";
  }

  // Check for weight indicators
  if (text.match(/\blbs\b|pounds|weight|grout|mortar|cement|concrete|sand/i)) {
    return "lbs";
  }

  // Default to each for most items
  return "ea.";
}

async function updateProducts() {
  try {
    // Scan all products
    const scanResult = await ddb.send(
      new ScanCommand({
        TableName: PRODUCTS_TABLE,
      }),
    );

    console.log(`Found ${scanResult.Items.length} products to update`);

    // Update each product
    for (const product of scanResult.Items) {
      const unit = determineUnit(
        product.name || "",
        product.description || "",
        product.category || "",
      );

      // Update the product with unit
      const updatedProduct = {
        ...product,
        unit,
        updatedAt: new Date().toISOString(),
      };

      await ddb.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: updatedProduct,
        }),
      );

      console.log(`Updated: ${product.name} -> ${unit}`);
    }

    console.log("\nAll products updated successfully!");
  } catch (error) {
    console.error("Error updating products:", error);
    process.exit(1);
  }
}

updateProducts();
