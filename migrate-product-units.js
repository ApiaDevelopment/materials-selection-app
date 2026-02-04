import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// Configure AWS
const client = new DynamoDBClient({ region: "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "MaterialsSelection-Products";

// Mapping from old to new unit values
const UNIT_MAPPING = {
  "ea.": "ea",
  "sq. ft.": "sqft",
  "linear ft.": "lnft",
  lbs: "lbs", // unchanged
};

async function migrateUnits() {
  console.log("Starting product unit migration...");

  try {
    // Scan all products
    const params = {
      TableName: TABLE_NAME,
    };

    const result = await dynamodb.send(new ScanCommand(params));
    const products = result.Items || [];

    console.log(`Found ${products.length} products to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const oldUnit = product.unit;
      const newUnit = UNIT_MAPPING[oldUnit];

      if (newUnit && newUnit !== oldUnit) {
        // Update the product
        const updateParams = {
          TableName: TABLE_NAME,
          Key: { id: product.id },
          UpdateExpression: "SET #unit = :newUnit",
          ExpressionAttributeNames: {
            "#unit": "unit",
          },
          ExpressionAttributeValues: {
            ":newUnit": newUnit,
          },
        };

        await dynamodb.send(new UpdateCommand(updateParams));
        console.log(
          `Updated product ${product.id}: "${oldUnit}" -> "${newUnit}"`,
        );
        updatedCount++;
      } else {
        console.log(
          `Skipped product ${product.id}: unit="${oldUnit}" (no change needed)`,
        );
        skippedCount++;
      }
    }

    console.log("\nMigration complete!");
    console.log(`Updated: ${updatedCount} products`);
    console.log(`Skipped: ${skippedCount} products`);
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Run the migration
migrateUnits()
  .then(() => {
    console.log("\nMigration finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
