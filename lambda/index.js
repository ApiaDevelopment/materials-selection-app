const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
const { createProjectFolder } = require("./sharepointService");

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

const PROJECTS_TABLE = "MaterialsSelection-Projects";
const CATEGORIES_TABLE = "MaterialsSelection-Categories";
const LINEITEMS_TABLE = "MaterialsSelection-LineItems";
const VENDORS_TABLE = "MaterialsSelection-Vendors";
const MANUFACTURERS_TABLE = "MaterialsSelection-Manufacturers";
const PRODUCTS_TABLE = "MaterialsSelection-Products";
const ORDERS_TABLE = "MaterialsSelection-Orders";
const ORDERITEMS_TABLE = "MaterialsSelection-OrderItems";
const RECEIPTS_TABLE = "MaterialsSelection-Receipts";
const PRODUCTVENDORS_TABLE = "MaterialsSelection-ProductVendors";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  if (event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  try {
    // Projects routes
    if (path === "/projects" && method === "GET") {
      return await getAllProjects();
    }
    if (path.match(/^\/projects\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getProject(id);
    }
    if (path === "/projects" && method === "POST") {
      return await createProject(JSON.parse(event.body));
    }
    if (path.match(/^\/projects\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateProject(id, JSON.parse(event.body));
    }
    if (path.match(/^\/projects\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteProject(id);
    }

    // Categories routes
    if (path.match(/^\/projects\/[^\/]+\/categories$/) && method === "GET") {
      const projectId = path.split("/")[2];
      return await getCategoriesByProject(projectId);
    }
    if (path.match(/^\/categories\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getCategory(id);
    }
    if (path === "/categories" && method === "POST") {
      return await createCategory(JSON.parse(event.body));
    }
    if (path.match(/^\/categories\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateCategory(id, JSON.parse(event.body));
    }
    if (path.match(/^\/categories\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteCategory(id);
    }

    // LineItems routes
    if (path.match(/^\/categories\/[^\/]+\/lineitems$/) && method === "GET") {
      const categoryId = path.split("/")[2];
      return await getLineItemsByCategory(categoryId);
    }
    if (path.match(/^\/projects\/[^\/]+\/lineitems$/) && method === "GET") {
      const projectId = path.split("/")[2];
      return await getLineItemsByProject(projectId);
    }
    if (path.match(/^\/lineitems\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getLineItem(id);
    }
    if (path === "/lineitems" && method === "POST") {
      return await createLineItem(JSON.parse(event.body));
    }
    if (path.match(/^\/lineitems\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateLineItem(id, JSON.parse(event.body));
    }
    if (path.match(/^\/lineitems\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteLineItem(id);
    }

    // Vendors routes
    if (path === "/vendors" && method === "GET") {
      return await getAllVendors();
    }
    if (path.match(/^\/vendors\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getVendor(id);
    }
    if (path === "/vendors" && method === "POST") {
      return await createVendor(JSON.parse(event.body));
    }
    if (path.match(/^\/vendors\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateVendor(id, JSON.parse(event.body));
    }
    if (path.match(/^\/vendors\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteVendor(id);
    }

    // Manufacturers routes
    if (path === "/manufacturers" && method === "GET") {
      return await getAllManufacturers();
    }
    if (path.match(/^\/manufacturers\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getManufacturer(id);
    }
    if (path === "/manufacturers" && method === "POST") {
      return await createManufacturer(JSON.parse(event.body));
    }
    if (path.match(/^\/manufacturers\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateManufacturer(id, JSON.parse(event.body));
    }
    if (path.match(/^\/manufacturers\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteManufacturer(id);
    }

    // Products routes
    if (path === "/products" && method === "GET") {
      return await getAllProducts();
    }
    if (path.match(/^\/manufacturers\/[^\/]+\/products$/) && method === "GET") {
      const manufacturerId = path.split("/")[2];
      return await getProductsByManufacturer(manufacturerId);
    }
    if (path.match(/^\/products\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getProduct(id);
    }
    if (path === "/products" && method === "POST") {
      return await createProduct(JSON.parse(event.body));
    }
    if (path.match(/^\/products\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateProduct(id, JSON.parse(event.body));
    }
    if (path.match(/^\/products\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteProduct(id);
    }

    // ProductVendor routes
    if (path.match(/^\/products\/[^\/]+\/vendors$/) && method === "GET") {
      const productId = path.split("/")[2];
      return await getProductVendorsByProduct(productId);
    }
    if (path === "/product-vendors" && method === "POST") {
      return await createProductVendor(JSON.parse(event.body));
    }
    if (path.match(/^\/product-vendors\/[^\/]+$/) && method === "GET") {
      const id = path.split("/")[2];
      return await getProductVendor(id);
    }
    if (path.match(/^\/product-vendors\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateProductVendor(id, JSON.parse(event.body));
    }
    if (path.match(/^\/product-vendors\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteProductVendor(id);
    }

    // Orders routes
    if (path.match(/^\/projects\/[^\/]+\/orders$/) && method === "GET") {
      const projectId = path.split("/")[2];
      return await getOrdersByProject(projectId);
    }
    if (path === "/orders" && method === "POST") {
      return await createOrder(JSON.parse(event.body));
    }
    if (path.match(/^\/orders\/[^\/]+$/) && method === "PUT") {
      const id = path.split("/")[2];
      return await updateOrder(id, JSON.parse(event.body));
    }
    if (path.match(/^\/orders\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteOrder(id);
    }

    // OrderItems routes
    if (path.match(/^\/orders\/[^\/]+\/items$/) && method === "GET") {
      const orderId = path.split("/")[2];
      return await getOrderItemsByOrder(orderId);
    }
    if (path.match(/^\/projects\/[^\/]+\/orderitems$/) && method === "GET") {
      const projectId = path.split("/")[2];
      return await getOrderItemsByProject(projectId);
    }
    if (path === "/orderitems" && method === "POST") {
      return await createOrderItems(JSON.parse(event.body));
    }
    if (path.match(/^\/orderitems\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteOrderItem(id);
    }

    // Receipts routes
    if (path.match(/^\/orders\/[^\/]+\/receipts$/) && method === "GET") {
      const orderId = path.split("/")[2];
      return await getReceiptsByOrder(orderId);
    }
    if (path === "/receipts" && method === "POST") {
      return await createReceipts(JSON.parse(event.body));
    }
    if (path.match(/^\/receipts\/[^\/]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      return await deleteReceipt(id);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Not found" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

// Project functions
async function getAllProjects() {
  const result = await ddb.send(new ScanCommand({ TableName: PROJECTS_TABLE }));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getProject(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: PROJECTS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Project not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createProject(data) {
  const project = {
    id: randomUUID(),
    name: data.name,
    description: data.description,
    customerName: data.customerName || "",
    address: data.address || "",
    email: data.email || "",
    phone: data.phone || "",
    estimatedStartDate: data.estimatedStartDate || "",
    type: data.type || "",
    status: data.status || "planning",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create SharePoint folder if configured
  if (project.name && process.env.SHAREPOINT_SITE_URL) {
    try {
      console.log(`Creating SharePoint folder for project: ${project.name}`);
      const folderInfo = await createProjectFolder(
        project.id,
        project.name,
        project.type,
        project.customerName,
      );

      // Add SharePoint info to project
      project.sharepointFolderId = folderInfo.id;
      project.sharepointFolderUrl = folderInfo.webUrl;
      project.sharepointDriveId = folderInfo.driveId;
      project.sharepointSiteId = folderInfo.siteId;

      console.log(`SharePoint folder created: ${folderInfo.webUrl}`);
    } catch (error) {
      console.error("SharePoint folder creation failed:", error.message);
      console.error("Stack:", error.stack);
      // Continue with project creation even if SharePoint fails
      // Don't throw - project creation should succeed regardless
    }
  }

  await ddb.send(new PutCommand({ TableName: PROJECTS_TABLE, Item: project }));
  return { statusCode: 201, headers, body: JSON.stringify(project) };
}

async function updateProject(id, data) {
  // First get the existing project to preserve fields
  const existingResult = await ddb.send(
    new GetCommand({ TableName: PROJECTS_TABLE, Key: { id } }),
  );

  if (!existingResult.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Project not found" }),
    };
  }

  const project = {
    ...existingResult.Item,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: PROJECTS_TABLE, Item: project }));
  return { statusCode: 200, headers, body: JSON.stringify(project) };
}

async function deleteProject(id) {
  await ddb.send(new DeleteCommand({ TableName: PROJECTS_TABLE, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
}

// Category functions
async function getCategoriesByProject(projectId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: CATEGORIES_TABLE,
      IndexName: "ProjectIdIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": projectId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getCategory(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: CATEGORIES_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Category not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createCategory(data) {
  const category = {
    id: randomUUID(),
    projectId: data.projectId,
    name: data.name,
    description: data.description,
    allowance: data.allowance || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(
    new PutCommand({ TableName: CATEGORIES_TABLE, Item: category }),
  );
  return { statusCode: 201, headers, body: JSON.stringify(category) };
}

async function updateCategory(id, data) {
  // First get the existing category to preserve fields
  const existingResult = await ddb.send(
    new GetCommand({ TableName: CATEGORIES_TABLE, Key: { id } }),
  );

  if (!existingResult.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Category not found" }),
    };
  }

  const category = {
    ...existingResult.Item,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(
    new PutCommand({ TableName: CATEGORIES_TABLE, Item: category }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(category) };
}

async function deleteCategory(id) {
  await ddb.send(
    new DeleteCommand({ TableName: CATEGORIES_TABLE, Key: { id } }),
  );
  return { statusCode: 204, headers, body: "" };
}

// LineItem functions
async function getLineItemsByCategory(categoryId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: LINEITEMS_TABLE,
      IndexName: "CategoryIdIndex",
      KeyConditionExpression: "categoryId = :categoryId",
      ExpressionAttributeValues: { ":categoryId": categoryId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getLineItemsByProject(projectId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: LINEITEMS_TABLE,
      IndexName: "ProjectIdIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": projectId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getLineItem(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: LINEITEMS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "LineItem not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createLineItem(data) {
  const totalCost = data.quantity * data.unitCost;
  const lineItem = {
    id: randomUUID(),
    categoryId: data.categoryId,
    projectId: data.projectId,
    name: data.name,
    material: data.material,
    quantity: data.quantity,
    unit: data.unit,
    unitCost: data.unitCost,
    totalCost: totalCost,
    notes: data.notes || "",
    vendorId: data.vendorId || null,
    manufacturerId: data.manufacturerId || null,
    productId: data.productId || null,
    modelNumber: data.modelNumber || null,
    allowance: data.allowance || null,
    orderedDate: data.orderedDate || null,
    receivedDate: data.receivedDate || null,
    stagingLocation: data.stagingLocation || null,
    returnNotes: data.returnNotes || null,
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(
    new PutCommand({ TableName: LINEITEMS_TABLE, Item: lineItem }),
  );
  return { statusCode: 201, headers, body: JSON.stringify(lineItem) };
}

async function updateLineItem(id, data) {
  // Get existing item first
  const existing = await ddb.send(
    new GetCommand({ TableName: LINEITEMS_TABLE, Key: { id } }),
  );

  if (!existing.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Line item not found" }),
    };
  }

  // Merge updates with existing data
  const lineItem = {
    ...existing.Item,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate totalCost if quantity or unitCost changed
  if (lineItem.quantity !== undefined && lineItem.unitCost !== undefined) {
    lineItem.totalCost = lineItem.quantity * lineItem.unitCost;
  }

  await ddb.send(
    new PutCommand({ TableName: LINEITEMS_TABLE, Item: lineItem }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(lineItem) };
}

async function deleteLineItem(id) {
  await ddb.send(
    new DeleteCommand({ TableName: LINEITEMS_TABLE, Key: { id } }),
  );
  return { statusCode: 204, headers, body: "" };
}

// Vendor functions
async function getAllVendors() {
  const result = await ddb.send(new ScanCommand({ TableName: VENDORS_TABLE }));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getVendor(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: VENDORS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Vendor not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createVendor(data) {
  const vendor = {
    id: randomUUID(),
    name: data.name,
    contactInfo: data.contactInfo || "",
    website: data.website || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: VENDORS_TABLE, Item: vendor }));
  return { statusCode: 201, headers, body: JSON.stringify(vendor) };
}

async function updateVendor(id, data) {
  const vendor = {
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: VENDORS_TABLE, Item: vendor }));
  return { statusCode: 200, headers, body: JSON.stringify(vendor) };
}

async function deleteVendor(id) {
  await ddb.send(new DeleteCommand({ TableName: VENDORS_TABLE, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
}

// Manufacturer functions
async function getAllManufacturers() {
  const result = await ddb.send(
    new ScanCommand({ TableName: MANUFACTURERS_TABLE }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getManufacturer(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: MANUFACTURERS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Manufacturer not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createManufacturer(data) {
  const manufacturer = {
    id: randomUUID(),
    name: data.name,
    website: data.website || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(
    new PutCommand({ TableName: MANUFACTURERS_TABLE, Item: manufacturer }),
  );
  return { statusCode: 201, headers, body: JSON.stringify(manufacturer) };
}

async function updateManufacturer(id, data) {
  const manufacturer = {
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(
    new PutCommand({ TableName: MANUFACTURERS_TABLE, Item: manufacturer }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(manufacturer) };
}

async function deleteManufacturer(id) {
  await ddb.send(
    new DeleteCommand({ TableName: MANUFACTURERS_TABLE, Key: { id } }),
  );
  return { statusCode: 204, headers, body: "" };
}

// Product functions
async function getAllProducts() {
  const result = await ddb.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getProductsByManufacturer(manufacturerId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: "ManufacturerIdIndex",
      KeyConditionExpression: "manufacturerId = :manufacturerId",
      ExpressionAttributeValues: { ":manufacturerId": manufacturerId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getProduct(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createProduct(data) {
  const product = {
    id: randomUUID(),
    manufacturerId: data.manufacturerId,
    name: data.name,
    modelNumber: data.modelNumber || null,
    description: data.description || "",
    category: data.category || null,
    unit: data.unit || null,
    imageUrl: data.imageUrl || null,
    productUrl: data.productUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));
  return { statusCode: 201, headers, body: JSON.stringify(product) };
}

async function updateProduct(id, data) {
  // Fetch existing product first
  const getResult = await ddb.send(
    new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
  );
  if (!getResult.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Product not found" }),
    };
  }

  const product = {
    ...getResult.Item,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));
  return { statusCode: 200, headers, body: JSON.stringify(product) };
}

async function deleteProduct(id) {
  await ddb.send(new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
}

// Order functions
async function getOrdersByProject(projectId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "ProjectIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": projectId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function createOrder(data) {
  const order = {
    id: randomUUID(),
    projectId: data.projectId,
    vendorId: data.vendorId,
    orderNumber: data.orderNumber,
    orderDate: data.orderDate,
    notes: data.notes || "",
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
  return { statusCode: 201, headers, body: JSON.stringify(order) };
}

async function updateOrder(id, data) {
  const order = {
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
  return { statusCode: 200, headers, body: JSON.stringify(order) };
}

async function deleteOrder(id) {
  // Delete associated order items first
  const orderItems = await ddb.send(
    new QueryCommand({
      TableName: ORDERITEMS_TABLE,
      IndexName: "OrderIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": id },
    }),
  );

  // Delete all receipts for each order item
  for (const item of orderItems.Items || []) {
    const receipts = await ddb.send(
      new QueryCommand({
        TableName: RECEIPTS_TABLE,
        IndexName: "OrderItemIndex",
        KeyConditionExpression: "orderItemId = :orderItemId",
        ExpressionAttributeValues: { ":orderItemId": item.id },
      }),
    );
    for (const receipt of receipts.Items || []) {
      await ddb.send(
        new DeleteCommand({
          TableName: RECEIPTS_TABLE,
          Key: { id: receipt.id },
        }),
      );
    }
    await ddb.send(
      new DeleteCommand({ TableName: ORDERITEMS_TABLE, Key: { id: item.id } }),
    );
  }

  // Delete the order
  await ddb.send(new DeleteCommand({ TableName: ORDERS_TABLE, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
}

// OrderItem functions
async function getOrderItemsByOrder(orderId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: ORDERITEMS_TABLE,
      IndexName: "OrderIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getOrderItemsByProject(projectId) {
  // Get all orders for project first
  const orders = await ddb.send(
    new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "ProjectIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": projectId },
    }),
  );

  // Get all order items for these orders
  const allItems = [];
  for (const order of orders.Items || []) {
    const items = await ddb.send(
      new QueryCommand({
        TableName: ORDERITEMS_TABLE,
        IndexName: "OrderIndex",
        KeyConditionExpression: "orderId = :orderId",
        ExpressionAttributeValues: { ":orderId": order.id },
      }),
    );
    allItems.push(...(items.Items || []));
  }

  return { statusCode: 200, headers, body: JSON.stringify(allItems) };
}

// Receipt functions
async function getReceiptsByOrder(orderId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: RECEIPTS_TABLE,
      IndexName: "OrderIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function createReceipts(receipts) {
  const createdReceipts = [];
  for (const receiptData of receipts) {
    const receipt = {
      id: randomUUID(),
      orderId: receiptData.orderId,
      orderItemId: receiptData.orderItemId,
      receivedQuantity: receiptData.receivedQuantity,
      receivedDate: receiptData.receivedDate,
      notes: receiptData.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(
      new PutCommand({ TableName: RECEIPTS_TABLE, Item: receipt }),
    );
    createdReceipts.push(receipt);
  }
  return { statusCode: 201, headers, body: JSON.stringify(createdReceipts) };
}

async function deleteReceipt(id) {
  await ddb.send(new DeleteCommand({ TableName: RECEIPTS_TABLE, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
}

// Order functions
async function getOrderItemsByOrder(orderId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: ORDERITEMS_TABLE,
      IndexName: "OrderIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getOrderItemsByProject(projectId) {
  // Get all orders for the project first
  const ordersResult = await ddb.send(
    new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "ProjectIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": projectId },
    }),
  );

  // Get order items for all orders
  const allOrderItems = [];
  for (const order of ordersResult.Items || []) {
    const itemsResult = await ddb.send(
      new QueryCommand({
        TableName: ORDERITEMS_TABLE,
        IndexName: "OrderIndex",
        KeyConditionExpression: "orderId = :orderId",
        ExpressionAttributeValues: { ":orderId": order.id },
      }),
    );
    allOrderItems.push(...(itemsResult.Items || []));
  }

  return { statusCode: 200, headers, body: JSON.stringify(allOrderItems) };
}

async function createOrderItems(items) {
  const createdItems = [];
  for (const data of items) {
    const orderItem = {
      id: randomUUID(),
      orderId: data.orderId,
      lineItemId: data.lineItemId,
      orderedQuantity: data.orderedQuantity,
      orderedPrice: data.orderedPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(
      new PutCommand({ TableName: ORDERITEMS_TABLE, Item: orderItem }),
    );
    createdItems.push(orderItem);
  }
  return { statusCode: 201, headers, body: JSON.stringify(createdItems) };
}

async function deleteOrderItem(id) {
  await ddb.send(
    new DeleteCommand({ TableName: ORDERITEMS_TABLE, Key: { id } }),
  );
  return { statusCode: 204, headers, body: "" };
}

// ProductVendor functions
async function getProductVendorsByProduct(productId) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: PRODUCTVENDORS_TABLE,
      IndexName: "ProductIdIndex",
      KeyConditionExpression: "productId = :productId",
      ExpressionAttributeValues: {
        ":productId": productId,
      },
    }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
}

async function getProductVendor(id) {
  const result = await ddb.send(
    new GetCommand({ TableName: PRODUCTVENDORS_TABLE, Key: { id } }),
  );
  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: "ProductVendor not found" }),
    };
  }
  return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
}

async function createProductVendor(data) {
  // Check if this is the first vendor for this product
  const existing = await ddb.send(
    new QueryCommand({
      TableName: PRODUCTVENDORS_TABLE,
      IndexName: "ProductIdIndex",
      KeyConditionExpression: "productId = :productId",
      ExpressionAttributeValues: {
        ":productId": data.productId,
      },
    }),
  );

  const isFirstVendor = !existing.Items || existing.Items.length === 0;
  const isPrimary =
    data.isPrimary !== undefined ? data.isPrimary : isFirstVendor;

  // If setting this as primary, unset all others
  if (isPrimary && existing.Items) {
    for (const item of existing.Items) {
      if (item.isPrimary) {
        await ddb.send(
          new PutCommand({
            TableName: PRODUCTVENDORS_TABLE,
            Item: {
              ...item,
              isPrimary: false,
              updatedAt: new Date().toISOString(),
            },
          }),
        );
      }
    }
  }

  const productVendor = {
    id: randomUUID(),
    productId: data.productId,
    vendorId: data.vendorId,
    cost: data.cost,
    isPrimary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({ TableName: PRODUCTVENDORS_TABLE, Item: productVendor }),
  );
  return { statusCode: 201, headers, body: JSON.stringify(productVendor) };
}

async function updateProductVendor(id, data) {
  const getResult = await ddb.send(
    new GetCommand({ TableName: PRODUCTVENDORS_TABLE, Key: { id } }),
  );
  if (!getResult.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "ProductVendor not found" }),
    };
  }

  // If setting as primary, unset all others for this product
  if (data.isPrimary) {
    const existing = await ddb.send(
      new QueryCommand({
        TableName: PRODUCTVENDORS_TABLE,
        IndexName: "ProductIdIndex",
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: {
          ":productId": getResult.Item.productId,
        },
      }),
    );

    if (existing.Items) {
      for (const item of existing.Items) {
        if (item.id !== id && item.isPrimary) {
          await ddb.send(
            new PutCommand({
              TableName: PRODUCTVENDORS_TABLE,
              Item: {
                ...item,
                isPrimary: false,
                updatedAt: new Date().toISOString(),
              },
            }),
          );
        }
      }
    }
  }

  const productVendor = {
    ...getResult.Item,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({ TableName: PRODUCTVENDORS_TABLE, Item: productVendor }),
  );
  return { statusCode: 200, headers, body: JSON.stringify(productVendor) };
}

async function deleteProductVendor(id) {
  await ddb.send(
    new DeleteCommand({ TableName: PRODUCTVENDORS_TABLE, Key: { id } }),
  );
  return { statusCode: 204, headers, body: "" };
}
