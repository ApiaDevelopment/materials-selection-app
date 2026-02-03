import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    categoryService,
    lineItemService,
    manufacturerService,
    orderService,
    productService,
    projectService,
    vendorService,
} from "../services";
import type {
    Category,
    CreateCategoryRequest,
    CreateLineItemRequest,
    LineItem,
    Manufacturer,
    Order,
    OrderItem,
    Product,
    Project,
    Receipt,
    Vendor,
} from "../types";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRow, setShowAddRow] = useState<string | null>(null); // categoryId
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editModalItemId, setEditModalItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"category" | "vendor">("category");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [receipts] = useState<Receipt[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showOrderListModal, setShowOrderListModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategoryLineItems, setExpandedCategoryLineItems] = useState<
    Set<string>
  >(new Set());
  const [orderForm, setOrderForm] = useState<{
    orderNumber: string;
    orderDate: string;
    notes: string;
    items: { [lineItemId: string]: { qty: string; price: string } };
  }>({
    orderNumber: "",
    orderDate: new Date().toISOString().split("T")[0],
    notes: "",
    items: {},
  });
  const [newCategory, setNewCategory] = useState<CreateCategoryRequest>({
    projectId: id || "",
    name: "",
    description: "",
    allowance: 0,
  });
  const [newItem, setNewItem] = useState<CreateLineItemRequest>({
    categoryId: "",
    projectId: id || "",
    name: "",
    material: "",
    quantity: 0,
    unit: "",
    unitCost: 0,
    notes: "",
    status: "pending",
  });

  useEffect(() => {
    if (id) {
      loadAllData(id);
    }
  }, [id]);

  const loadAllData = async (projectId: string) => {
    try {
      setLoading(true);
      const [
        projectData,
        categoriesData,
        lineItemsData,
        vendorsData,
        manufacturersData,
        productsData,
        ordersData,
        orderItemsData,
      ] = await Promise.all([
        projectService.getById(projectId),
        categoryService.getByProjectId(projectId),
        lineItemService.getByProjectId(projectId),
        vendorService.getAllVendors(),
        manufacturerService.getAllManufacturers(),
        productService.getAllProducts(),
        orderService.getByProjectId(projectId),
        orderService.getOrderItemsByProject(projectId),
      ]);
      setProject(projectData);
      setCategories(categoriesData);
      setLineItems(lineItemsData);
      setVendors(vendorsData);
      setManufacturers(manufacturersData);
      setProducts(productsData);
      setOrders(ordersData);
      setOrderItems(orderItemsData);

      // Auto-expand all sections
      const allIds = new Set<string>([
        ...categoriesData.map((c) => c.id),
        ...vendorsData
          .filter((v) => lineItemsData.some((item) => item.vendorId === v.id))
          .map((v) => v.id),
        "unassigned",
      ]);
      setExpandedSections(allIds);
    } catch (err) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;
    try {
      const updated = await projectService.update(editingProject.id, {
        name: editingProject.name,
        description: editingProject.description,
        customerName: editingProject.customerName,
        address: editingProject.address,
        email: editingProject.email,
        phone: editingProject.phone,
        estimatedStartDate: editingProject.estimatedStartDate,
        type: editingProject.type,
        status: editingProject.status,
      });
      setProject(updated);
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (err) {
      alert("Failed to update project");
      console.error("Error updating project:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      alert("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updated = await categoryService.update(
          editingCategory.id,
          newCategory,
        );
        setCategories(
          categories.map((c) => (c.id === editingCategory.id ? updated : c)),
        );
      } else {
        // Create new category
        const created = await categoryService.create(newCategory);
        setCategories([...categories, created]);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({
        projectId: id || "",
        name: "",
        description: "",
        allowance: 0,
      });
    } catch (err) {
      alert(`Failed to ${editingCategory ? "update" : "create"} category`);
      console.error(
        `Error ${editingCategory ? "updating" : "creating"} category:`,
        err,
      );
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoryService.delete(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
      setLineItems(lineItems.filter((item) => item.categoryId !== categoryId));
    } catch (err) {
      alert("Failed to delete category");
      console.error("Error deleting category:", err);
    }
  };

  const handleAddLineItem = async (categoryId: string) => {
    if (!newItem.name || !newItem.material) {
      alert("Please fill in item name and material");
      return;
    }

    try {
      const created = await lineItemService.create({
        ...newItem,
        categoryId,
        projectId: id!,
      });
      setLineItems([...lineItems, created]);
      setShowAddRow(null);
      setNewItem({
        categoryId: "",
        projectId: id || "",
        name: "",
        material: "",
        quantity: 0,
        unit: "",
        unitCost: 0,
        notes: "",
        status: "pending",
      });
    } catch (err) {
      alert("Failed to add line item");
      console.error("Error adding line item:", err);
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!confirm("Delete this line item?")) return;
    try {
      await lineItemService.delete(lineItemId);
      setLineItems(lineItems.filter((item) => item.id !== lineItemId));
    } catch (err) {
      alert("Failed to delete line item");
    }
  };

  const handleStartInlineEdit = (item: LineItem) => {
    setEditingItemId(item.id);
    setEditingItem({ ...item });
  };

  const handleCancelInlineEdit = () => {
    setEditingItemId(null);
    setEditingItem(null);
  };

  const handleSaveInlineEdit = async () => {
    if (!editingItem) return;
    try {
      const updated = await lineItemService.update(editingItem.id, editingItem);
      setLineItems(
        lineItems.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingItemId(null);
      setEditingItem(null);
    } catch (err) {
      alert("Failed to update line item");
      console.error("Error updating line item:", err);
    }
  };

  const handleStartModalEdit = (item: LineItem) => {
    setEditModalItemId(item.id);
    setEditingItem({ ...item });
  };

  const handleSaveModalEdit = async () => {
    if (!editingItem) return;
    try {
      const updated = await lineItemService.update(editingItem.id, editingItem);
      setLineItems(
        lineItems.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditModalItemId(null);
      setEditingItem(null);
    } catch (err) {
      alert("Failed to update line item");
      console.error("Error updating line item:", err);
    }
  };

  const handleManufacturerChange = async (manufacturerId: string) => {
    setNewItem({ ...newItem, manufacturerId: manufacturerId || undefined });
    if (manufacturerId) {
      const filtered =
        await productService.getProductsByManufacturer(manufacturerId);
      setProducts(filtered);
    } else {
      const all = await productService.getAllProducts();
      setProducts(all);
    }
  };

  const handleProductSelect = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      // Get primary vendor and cost
      const { productVendorService } = await import("../services");
      const primaryVendor =
        await productVendorService.getPrimaryVendor(productId);

      setNewItem({
        ...newItem,
        productId: product.id,
        manufacturerId: product.manufacturerId,
        modelNumber: product.modelNumber || undefined,
        name: product.name,
        material: product.description || "",
        unit: product.unit || "",
        vendorId: primaryVendor?.vendorId || undefined,
        unitCost: primaryVendor?.cost || 0,
      });
    }
  };

  const getCategoryLineItems = (categoryId: string) => {
    return lineItems.filter((item) => item.categoryId === categoryId);
  };

  const getCategoryTotal = (categoryId: string) => {
    return getCategoryLineItems(categoryId).reduce(
      (sum, item) => sum + item.totalCost,
      0,
    );
  };

  const getCategoryActualTotal = (categoryId: string) => {
    const categoryLineItemIds = getCategoryLineItems(categoryId).map(
      (item) => item.id,
    );
    return orderItems
      .filter((oi) => categoryLineItemIds.includes(oi.lineItemId))
      .reduce((sum, oi) => sum + oi.orderedQuantity * oi.orderedPrice, 0);
  };

  const getVendorLineItems = (vendorId: string) => {
    return lineItems.filter((item) => item.vendorId === vendorId);
  };

  const getUnassignedLineItems = () => {
    return lineItems.filter((item) => !item.vendorId);
  };

  const getVendorTotal = (vendorId: string) => {
    return getVendorLineItems(vendorId).reduce(
      (sum, item) => sum + item.totalCost,
      0,
    );
  };

  const getActiveVendors = () => {
    const vendorIds = new Set(
      lineItems.filter((item) => item.vendorId).map((item) => item.vendorId),
    );
    return vendors.filter((v) => vendorIds.has(v.id));
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleLineItemDetails = (lineItemId: string) => {
    const newExpanded = new Set(expandedLineItems);
    if (newExpanded.has(lineItemId)) {
      newExpanded.delete(lineItemId);
    } else {
      newExpanded.add(lineItemId);
    }
    setExpandedLineItems(newExpanded);
  };

  const toggleCategoryLineItemDetails = (lineItemId: string) => {
    const newExpanded = new Set(expandedCategoryLineItems);
    if (newExpanded.has(lineItemId)) {
      newExpanded.delete(lineItemId);
    } else {
      newExpanded.add(lineItemId);
    }
    setExpandedCategoryLineItems(newExpanded);
  };

  const handleOpenOrderModal = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setOrderForm({
      orderNumber: "",
      orderDate: new Date().toISOString().split("T")[0],
      notes: "",
      items: {},
    });
    setShowOrderModal(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedVendorId || !id) return;
    if (!orderForm.orderNumber.trim()) {
      alert("Please enter an order number");
      return;
    }

    try {
      if (editingOrderId) {
        // Edit mode - update existing order
        const existingOrder = orders.find((o) => o.id === editingOrderId);
        if (!existingOrder) return;

        // Update order
        const updatedOrder = await orderService.update(editingOrderId, {
          ...existingOrder,
          orderNumber: orderForm.orderNumber,
          orderDate: orderForm.orderDate,
          notes: orderForm.notes,
        });

        // Delete existing order items
        const existingItems = orderItems.filter(
          (oi) => oi.orderId === editingOrderId,
        );
        await Promise.all(
          existingItems.map((item) => orderService.deleteOrderItem(item.id)),
        );

        // Create new order items
        const itemsToCreate: Omit<
          OrderItem,
          "id" | "createdAt" | "updatedAt"
        >[] = [];
        Object.entries(orderForm.items).forEach(([lineItemId, data]) => {
          if (data.qty && parseFloat(data.qty) > 0) {
            const lineItem = lineItems.find((li) => li.id === lineItemId);
            itemsToCreate.push({
              orderId: editingOrderId,
              lineItemId: lineItemId,
              orderedQuantity: parseFloat(data.qty),
              orderedPrice: parseFloat(
                data.price || lineItem?.unitCost.toString() || "0",
              ),
            });
          }
        });

        if (itemsToCreate.length === 0) {
          alert("Please enter order quantities for at least one item");
          return;
        }

        const newOrderItems =
          await orderService.createOrderItems(itemsToCreate);

        // Update state
        setOrders(
          orders.map((o) => (o.id === editingOrderId ? updatedOrder : o)),
        );
        setOrderItems([
          ...orderItems.filter((oi) => oi.orderId !== editingOrderId),
          ...newOrderItems,
        ]);

        setShowOrderModal(false);
        setSelectedVendorId(null);
        setEditingOrderId(null);
      } else {
        // Create mode - new order
        const newOrder = await orderService.create({
          projectId: id,
          vendorId: selectedVendorId,
          orderNumber: orderForm.orderNumber,
          orderDate: orderForm.orderDate,
          notes: orderForm.notes,
          status: "placed",
        });

        // Create order items for filled entries
        const itemsToCreate: Omit<
          OrderItem,
          "id" | "createdAt" | "updatedAt"
        >[] = [];
        Object.entries(orderForm.items).forEach(([lineItemId, data]) => {
          if (data.qty && parseFloat(data.qty) > 0) {
            const lineItem = lineItems.find((li) => li.id === lineItemId);
            itemsToCreate.push({
              orderId: newOrder.id,
              lineItemId: lineItemId,
              orderedQuantity: parseFloat(data.qty),
              orderedPrice: parseFloat(
                data.price || lineItem?.unitCost.toString() || "0",
              ),
            });
          }
        });

        if (itemsToCreate.length === 0) {
          alert("Please enter order quantities for at least one item");
          await orderService.delete(newOrder.id);
          return;
        }

        // Save order items to database
        const newOrderItems =
          await orderService.createOrderItems(itemsToCreate);

        // Update line item statuses to "ordered"
        const lineItemUpdates = itemsToCreate.map(async (item) => {
          const lineItem = lineItems.find((li) => li.id === item.lineItemId);
          if (lineItem) {
            return await lineItemService.update(item.lineItemId, {
              status: "ordered",
            });
          }
        });
        const updatedLineItems = await Promise.all(
          lineItemUpdates.filter(Boolean),
        );

        // Update line items in state
        setLineItems(
          lineItems.map((li) => {
            const updated = updatedLineItems.find((u) => u?.id === li.id);
            return updated || li;
          }),
        );

        // Update state
        setOrders([...orders, newOrder]);
        setOrderItems([...orderItems, ...newOrderItems]);

        // Close modal
        setShowOrderModal(false);
        setSelectedVendorId(null);
      }
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("Failed to save order. Please try again.");
    }
  };

  const handleClearAllOrders = async () => {
    if (!id) return;
    if (
      !confirm(
        "Are you sure you want to delete all orders for this project? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      // Delete all orders (this will cascade delete order items and receipts)
      await Promise.all(orders.map((order) => orderService.delete(order.id)));

      // Clear state
      setOrders([]);
      setOrderItems([]);
    } catch (err) {
      console.error("Failed to clear orders:", err);
      alert("Failed to clear orders. Please try again.");
    }
  };

  const handleOpenReceiveModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReceiveModal(true);
  };

  const handleShowOrderList = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setShowOrderListModal(true);
  };

  const handleEditOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Get order items for this order
    const items = orderItems.filter((oi) => oi.orderId === orderId);

    // Populate form
    setOrderForm({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      notes: order.notes || "",
      items: items.reduce(
        (acc, item) => {
          acc[item.lineItemId] = {
            qty: item.orderedQuantity.toString(),
            price: item.orderedPrice.toString(),
          };
          return acc;
        },
        {} as Record<string, { qty: string; price: string }>,
      ),
    });

    setEditingOrderId(orderId);
    setSelectedVendorId(order.vendorId);
    setShowOrderListModal(false);
    setShowOrderModal(true);
  };

  const getVendorOrders = (vendorId: string) => {
    return orders.filter((order) => order.vendorId === vendorId);
  };

  const getLineItemOrders = (lineItemId: string) => {
    const itemOrders = orderItems.filter((oi) => oi.lineItemId === lineItemId);
    return orders.filter((o) => itemOrders.some((oi) => oi.orderId === o.id));
  };

  const getOrderItemReceipts = (orderItemId: string) => {
    return receipts.filter((r) => r.orderItemId === orderItemId);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!project)
    return <div className="text-center py-8">Project not found</div>;

  return (
    <div className="space-y-4">
      {/* Compact Project Header */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {project.name}
              </h1>
              {project.status && (
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    project.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : project.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : project.status === "on-hold"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status}
                </span>
              )}
              {project.type && (
                <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded">
                  {project.type}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
          <div className="flex-1 min-w-0 px-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-gray-600">
              {project.customerName && (
                <div className="truncate">
                  <span className="font-medium">Customer:</span>{" "}
                  {project.customerName}
                </div>
              )}
              {project.phone && (
                <div className="truncate">
                  <span className="font-medium">Phone:</span> {project.phone}
                </div>
              )}
              {project.email && (
                <div className="truncate col-span-2">
                  <span className="font-medium">Email:</span> {project.email}
                </div>
              )}
              {project.address && (
                <div className="truncate col-span-2">
                  <span className="font-medium">Address:</span>{" "}
                  {project.address}
                </div>
              )}
              {project.estimatedStartDate && (
                <div className="truncate">
                  <span className="font-medium">Est. Start:</span>{" "}
                  {new Date(project.estimatedStartDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setShowProjectModal(true);
                setEditingProject(project);
              }}
              className="text-indigo-600 hover:text-indigo-900 text-sm"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
            >
              ➕ Category
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("category")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === "category"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            By Category
          </button>
          <button
            onClick={() => setViewMode("vendor")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === "vendor"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            By Vendor
          </button>
        </div>
        {orders.length > 0 && (
          <button
            onClick={handleClearAllOrders}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
            title="Delete all orders for this project"
          >
            🗑️ Clear All Orders ({orders.length})
          </button>
        )}
      </div>

      {/* Spreadsheet-like Categories and Line Items */}
      {viewMode === "category" && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No categories yet. Add one to get started!
            </p>
          ) : (
            categories.map((category) => {
              const isExpanded = expandedSections.has(category.id);
              return (
                <div key={category.id} className="border-b last:border-b-0">
                  {/* Category Header */}
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSection(category.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                      <h3 className="text-sm font-semibold text-gray-700">
                        {category.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {category.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-gray-600">
                        Allowance: ${(category.allowance || 0).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded">
                        <span className="text-xs font-medium text-gray-600">
                          Est. Total: $
                          {getCategoryTotal(category.id).toFixed(2)}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          Est. Variance:{" "}
                          <span
                            className={
                              getCategoryTotal(category.id) <=
                              (category.allowance || 0)
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {getCategoryTotal(category.id) <=
                            (category.allowance || 0)
                              ? "$"
                              : "-$"}
                            {Math.abs(
                              (category.allowance || 0) -
                                getCategoryTotal(category.id),
                            ).toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded">
                        <span className="text-xs font-medium text-gray-600">
                          Actual Total: $
                          {getCategoryActualTotal(category.id).toFixed(2)}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          Actual Variance:{" "}
                          <span
                            className={
                              getCategoryActualTotal(category.id) <=
                              (category.allowance || 0)
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {getCategoryActualTotal(category.id) <=
                            (category.allowance || 0)
                              ? "$"
                              : "-$"}
                            {Math.abs(
                              (category.allowance || 0) -
                                getCategoryActualTotal(category.id),
                            ).toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <div className="h-6 w-px bg-gray-300 mx-2"></div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setNewCategory({
                              projectId: category.projectId,
                              name: category.name,
                              description: category.description,
                              allowance: category.allowance || 0,
                            });
                            setShowCategoryModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                        {showAddRow !== category.id && (
                          <button
                            onClick={() => setShowAddRow(category.id)}
                            className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                          >
                            + Add Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  {isExpanded && (
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Item
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Material
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Vendor
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Mfr
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Product
                          </th>
                          <th className="px-2 py-1 text-right font-medium text-gray-600">
                            Qty
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Unit
                          </th>
                          <th className="px-2 py-1 text-right font-medium text-gray-600">
                            Unit Cost
                          </th>
                          <th className="px-2 py-1 text-right font-medium text-gray-600">
                            Total
                          </th>
                          <th className="px-2 py-1 text-right font-medium text-gray-600">
                            Allowance
                          </th>
                          <th className="px-2 py-1 text-left font-medium text-gray-600">
                            Status
                          </th>
                          <th className="px-2 py-1 text-right font-medium text-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCategoryLineItems(category.id).map((item) => {
                          const isEditing = editingItemId === item.id;
                          if (isEditing && editingItem) {
                            return (
                              <tr
                                key={item.id}
                                className="bg-blue-50 border-2 border-indigo-300"
                              >
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={editingItem.material}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        material: e.target.value,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <select
                                    value={editingItem.vendorId || ""}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        vendorId: e.target.value || undefined,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">-</option>
                                    {vendors.map((v) => (
                                      <option key={v.id} value={v.id}>
                                        {v.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1">
                                  <select
                                    value={editingItem.manufacturerId || ""}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        manufacturerId:
                                          e.target.value || undefined,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">-</option>
                                    {manufacturers.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1">
                                  <select
                                    value={editingItem.productId || ""}
                                    onChange={(e) => {
                                      const product = products.find(
                                        (p) => p.id === e.target.value,
                                      );
                                      if (product) {
                                        setEditingItem({
                                          ...editingItem,
                                          productId: product.id,
                                          manufacturerId:
                                            product.manufacturerId,
                                          modelNumber: product.modelNumber,
                                          name: product.name,
                                          material:
                                            product.description ||
                                            editingItem.material,
                                        });
                                      } else {
                                        setEditingItem({
                                          ...editingItem,
                                          productId: undefined,
                                        });
                                      }
                                    }}
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">-</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={editingItem.quantity}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        quantity:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={editingItem.unit}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        unit: e.target.value,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingItem.unitCost}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        unitCost:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-2 py-1 text-right font-medium">
                                  $
                                  {(
                                    editingItem.quantity * editingItem.unitCost
                                  ).toFixed(2)}
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingItem.allowance || 0}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        allowance:
                                          parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <select
                                    value={editingItem.status || "pending"}
                                    onChange={(e) =>
                                      setEditingItem({
                                        ...editingItem,
                                        status: e.target.value as any,
                                      })
                                    }
                                    className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="ordered">Ordered</option>
                                    <option value="received">Received</option>
                                    <option value="installed">Installed</option>
                                  </select>
                                </td>
                                <td className="px-2 py-1 text-right space-x-1">
                                  <button
                                    onClick={handleSaveInlineEdit}
                                    className="text-green-600 hover:text-green-900 font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelInlineEdit}
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                          return (
                            <>
                              <tr
                                key={item.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                              >
                                <td className="px-2 py-1">{item.name}</td>
                                <td className="px-2 py-1 text-gray-600">
                                  {item.material}
                                </td>
                                <td className="px-2 py-1 text-gray-600">
                                  {item.vendorId
                                    ? vendors.find(
                                        (v) => v.id === item.vendorId,
                                      )?.name
                                    : "-"}
                                </td>
                                <td className="px-2 py-1 text-gray-600">
                                  {item.manufacturerId
                                    ? manufacturers.find(
                                        (m) => m.id === item.manufacturerId,
                                      )?.name
                                    : "-"}
                                </td>
                                <td className="px-2 py-1 text-gray-600">
                                  {item.productId
                                    ? (() => {
                                        const product = products.find(
                                          (p) => p.id === item.productId,
                                        );
                                        if (!product) return "-";
                                        if (product.productUrl) {
                                          return (
                                            <a
                                              href={product.productUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-indigo-600 hover:text-indigo-900 underline"
                                            >
                                              {product.name}
                                            </a>
                                          );
                                        }
                                        return product.name;
                                      })()
                                    : "-"}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {item.quantity}
                                </td>
                                <td className="px-2 py-1">{item.unit}</td>
                                <td className="px-2 py-1 text-right">
                                  ${item.unitCost.toFixed(2)}
                                </td>
                                <td className="px-2 py-1 text-right font-medium">
                                  ${item.totalCost.toFixed(2)}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  ${(item.allowance || 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-1">
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs ${
                                      item.status === "installed"
                                        ? "bg-green-100 text-green-700"
                                        : item.status === "ordered"
                                          ? "bg-blue-100 text-blue-700"
                                          : item.status === "received"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {item.status || "pending"}
                                  </span>
                                  {getLineItemOrders(item.id).length > 0 && (
                                    <button
                                      onClick={() =>
                                        toggleCategoryLineItemDetails(item.id)
                                      }
                                      className="ml-1 text-blue-600 hover:text-blue-900"
                                      title="View order details"
                                    >
                                      {expandedCategoryLineItems.has(item.id)
                                        ? "🔽"
                                        : "📋"}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleStartInlineEdit(item)}
                                    className="ml-1 text-indigo-600 hover:text-indigo-900"
                                    title="Edit inline"
                                  >
                                    ✏️
                                  </button>
                                </td>
                                <td className="px-2 py-1 text-right space-x-1">
                                  <button
                                    onClick={() => handleStartModalEdit(item)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteLineItem(item.id)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Del
                                  </button>
                                </td>
                              </tr>
                              {expandedCategoryLineItems.has(item.id) &&
                                getLineItemOrders(item.id).length > 0 && (
                                  <>
                                    {getLineItemOrders(item.id).map(
                                      (order, orderIndex, ordersArray) => {
                                        const orderItem = orderItems.find(
                                          (oi) =>
                                            oi.orderId === order.id &&
                                            oi.lineItemId === item.id,
                                        );
                                        const itemReceipts = orderItem
                                          ? getOrderItemReceipts(orderItem.id)
                                          : [];
                                        const totalReceived =
                                          itemReceipts.reduce(
                                            (sum, r) =>
                                              sum + r.receivedQuantity,
                                            0,
                                          );
                                        const orderTotal = orderItem
                                          ? orderItem.orderedQuantity *
                                            orderItem.orderedPrice
                                          : 0;

                                        // Calculate cumulative variance only for last order
                                        const isLastOrder =
                                          orderIndex === ordersArray.length - 1;
                                        const allOrderTotals =
                                          ordersArray.reduce((sum, o) => {
                                            const oi = orderItems.find(
                                              (oiItem) =>
                                                oiItem.orderId === o.id &&
                                                oiItem.lineItemId === item.id,
                                            );
                                            return (
                                              sum +
                                              (oi
                                                ? oi.orderedQuantity *
                                                  oi.orderedPrice
                                                : 0)
                                            );
                                          }, 0);
                                        const variance = isLastOrder
                                          ? (item.allowance || 0) -
                                            allOrderTotals
                                          : null;

                                        return (
                                          <tr
                                            key={`${item.id}-order-${order.id}`}
                                            className="text-xs"
                                          >
                                            <td className="px-2 py-1"></td>
                                            <td
                                              colSpan={4}
                                              className="px-2 py-1 text-gray-700 bg-blue-50"
                                            >
                                              <span className="font-medium text-gray-600">
                                                Order #{order.orderNumber} -{" "}
                                                {new Date(
                                                  order.orderDate,
                                                ).toLocaleDateString()}
                                              </span>
                                            </td>
                                            {orderItem ? (
                                              <>
                                                <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                  {orderItem.orderedQuantity}
                                                </td>
                                                <td className="px-2 py-1 text-left text-gray-600 bg-blue-50">
                                                  {item.unit || "-"}
                                                </td>
                                                <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                  $
                                                  {orderItem.orderedPrice.toFixed(
                                                    2,
                                                  )}
                                                </td>
                                                <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                  ${orderTotal.toFixed(2)}
                                                </td>
                                                <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                  {variance !== null && (
                                                    <span
                                                      className={
                                                        variance >= 0
                                                          ? "text-green-600"
                                                          : "text-red-600"
                                                      }
                                                    >
                                                      {variance >= 0
                                                        ? "$"
                                                        : "-$"}
                                                      {Math.abs(
                                                        variance,
                                                      ).toFixed(2)}
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="px-2 py-1 text-left text-gray-600 bg-blue-50">
                                                  {totalReceived > 0 &&
                                                    `Received: ${totalReceived}`}
                                                </td>
                                                <td className="px-2 py-1 bg-blue-50"></td>
                                              </>
                                            ) : (
                                              <td colSpan={8}></td>
                                            )}
                                          </tr>
                                        );
                                      },
                                    )}
                                  </>
                                )}
                            </>
                          );
                        })}

                        {/* Inline Add Row */}
                        {showAddRow === category.id && (
                          <tr className="bg-yellow-50 border-2 border-purple-300">
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={newItem.name}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Item name"
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={newItem.material}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    material: e.target.value,
                                  })
                                }
                                placeholder="Material"
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={newItem.vendorId || ""}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    vendorId: e.target.value || undefined,
                                  })
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="">-</option>
                                {vendors.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={newItem.manufacturerId || ""}
                                onChange={(e) =>
                                  handleManufacturerChange(e.target.value)
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="">-</option>
                                {manufacturers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={newItem.productId || ""}
                                onChange={(e) =>
                                  handleProductSelect(e.target.value)
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="">-</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                value={newItem.quantity}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    quantity: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={newItem.unit}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    unit: e.target.value,
                                  })
                                }
                                placeholder="ea"
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                step="0.01"
                                value={newItem.unitCost}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    unitCost: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                              />
                            </td>
                            <td className="px-2 py-1 text-right font-medium">
                              $
                              {(newItem.quantity * newItem.unitCost).toFixed(2)}
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={newItem.status}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    status: e.target.value as any,
                                  })
                                }
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="ordered">Ordered</option>
                              </select>
                            </td>
                            <td className="px-2 py-1 text-right space-x-1">
                              <button
                                onClick={() => handleAddLineItem(category.id)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddRow(null);
                                  setNewItem({
                                    categoryId: "",
                                    projectId: id || "",
                                    name: "",
                                    material: "",
                                    quantity: 0,
                                    unit: "",
                                    unitCost: 0,
                                    notes: "",
                                    status: "pending",
                                  });
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        )}

                        {getCategoryLineItems(category.id).length === 0 &&
                          showAddRow !== category.id && (
                            <tr>
                              <td
                                colSpan={11}
                                className="px-2 py-4 text-center text-gray-400 text-xs"
                              >
                                No items yet. Click "+ Add Item" to create one.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vendor View */}
      {viewMode === "vendor" && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {lineItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No line items yet.</p>
          ) : (
            <>
              {getActiveVendors().map((vendor) => {
                const isExpanded = expandedSections.has(vendor.id);
                return (
                  <div key={vendor.id} className="border-b last:border-b-0">
                    {/* Vendor Header */}
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSection(vendor.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                        <h3 className="text-sm font-semibold text-gray-700">
                          {vendor.name}
                        </h3>
                        {getVendorOrders(vendor.id).length > 0 && (
                          <button
                            onClick={() => handleShowOrderList(vendor.id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                            title="View orders for this vendor"
                          >
                            {getVendorOrders(vendor.id).length} order
                            {getVendorOrders(vendor.id).length > 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-600">
                          Total: ${getVendorTotal(vendor.id).toFixed(2)}
                        </span>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>
                        <button
                          onClick={() => handleOpenOrderModal(vendor.id)}
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 text-xs font-medium"
                          title="Create Order"
                        >
                          📦 Order
                        </button>
                        <button
                          onClick={() => handleOpenReceiveModal(vendor.id)}
                          className="text-green-600 hover:text-green-900 px-2 py-1 text-xs font-medium"
                          title="Receive Items"
                        >
                          ✓ Receive
                        </button>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    {isExpanded && (
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Category
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Item
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Material
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Mfr
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Product
                            </th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">
                              Qty
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Unit
                            </th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">
                              Unit Cost
                            </th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">
                              Total
                            </th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">
                              Allowance
                            </th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">
                              Status
                            </th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getVendorLineItems(vendor.id).map((item) => {
                            const isEditing = editingItemId === item.id;
                            const category = categories.find(
                              (c) => c.id === item.categoryId,
                            );
                            if (isEditing && editingItem) {
                              return (
                                <tr
                                  key={item.id}
                                  className="bg-blue-50 border-2 border-indigo-300"
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {category?.name || "-"}
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="text"
                                      value={editingItem.name}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          name: e.target.value,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="text"
                                      value={editingItem.material}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          material: e.target.value,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <select
                                      value={editingItem.manufacturerId || ""}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          manufacturerId:
                                            e.target.value || undefined,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    >
                                      <option value="">-</option>
                                      {manufacturers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1">
                                    <select
                                      value={editingItem.productId || ""}
                                      onChange={(e) => {
                                        const product = products.find(
                                          (p) => p.id === e.target.value,
                                        );
                                        if (product) {
                                          setEditingItem({
                                            ...editingItem,
                                            productId: product.id,
                                            manufacturerId:
                                              product.manufacturerId,
                                            modelNumber: product.modelNumber,
                                            name: product.name,
                                            material:
                                              product.description ||
                                              editingItem.material,
                                          });
                                        } else {
                                          setEditingItem({
                                            ...editingItem,
                                            productId: undefined,
                                          });
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    >
                                      <option value="">-</option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="number"
                                      value={editingItem.quantity}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          quantity:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="text"
                                      value={editingItem.unit}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          unit: e.target.value,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.unitCost}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          unitCost:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                    />
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium">
                                    $
                                    {(
                                      editingItem.quantity *
                                      editingItem.unitCost
                                    ).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.allowance || 0}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          allowance:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs text-right"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <select
                                      value={editingItem.status || "pending"}
                                      onChange={(e) =>
                                        setEditingItem({
                                          ...editingItem,
                                          status: e.target.value as any,
                                        })
                                      }
                                      className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="ordered">Ordered</option>
                                      <option value="received">Received</option>
                                      <option value="installed">
                                        Installed
                                      </option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-1 text-right space-x-1">
                                    <button
                                      onClick={handleSaveInlineEdit}
                                      className="text-green-600 hover:text-green-900 font-medium"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelInlineEdit}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      Cancel
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                            return (
                              <>
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {category?.name || "-"}
                                  </td>
                                  <td className="px-2 py-1">{item.name}</td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.material}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.manufacturerId
                                      ? manufacturers.find(
                                          (m) => m.id === item.manufacturerId,
                                        )?.name
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.productId
                                      ? (() => {
                                          const product = products.find(
                                            (p) => p.id === item.productId,
                                          );
                                          if (!product) return "-";
                                          if (product.productUrl) {
                                            return (
                                              <a
                                                href={product.productUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-900 underline"
                                              >
                                                {product.name}
                                              </a>
                                            );
                                          }
                                          return product.name;
                                        })()
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    {item.quantity}
                                  </td>
                                  <td className="px-2 py-1">{item.unit}</td>
                                  <td className="px-2 py-1 text-right">
                                    ${item.unitCost.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium">
                                    ${item.totalCost.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    ${(item.allowance || 0).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1">
                                    <span
                                      className={`px-1 py-0.5 rounded text-xs ${
                                        item.status === "installed"
                                          ? "bg-green-100 text-green-700"
                                          : item.status === "ordered"
                                            ? "bg-blue-100 text-blue-700"
                                            : item.status === "received"
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {item.status || "pending"}
                                    </span>
                                    {getLineItemOrders(item.id).length > 0 && (
                                      <button
                                        onClick={() =>
                                          toggleLineItemDetails(item.id)
                                        }
                                        className="ml-1 text-blue-600 hover:text-blue-900"
                                        title="View order details"
                                      >
                                        {expandedLineItems.has(item.id)
                                          ? "🔽"
                                          : "📋"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleStartInlineEdit(item)
                                      }
                                      className="ml-1 text-indigo-600 hover:text-indigo-900"
                                      title="Edit inline"
                                    >
                                      ✏️
                                    </button>
                                  </td>
                                  <td className="px-2 py-1 text-right space-x-1">
                                    <button
                                      onClick={() => handleStartModalEdit(item)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteLineItem(item.id)
                                      }
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Del
                                    </button>
                                  </td>
                                </tr>
                                {expandedLineItems.has(item.id) &&
                                  getLineItemOrders(item.id).length > 0 && (
                                    <>
                                      {getLineItemOrders(item.id).map(
                                        (order, orderIndex, ordersArray) => {
                                          const orderItem = orderItems.find(
                                            (oi) =>
                                              oi.orderId === order.id &&
                                              oi.lineItemId === item.id,
                                          );
                                          const itemReceipts = orderItem
                                            ? getOrderItemReceipts(orderItem.id)
                                            : [];
                                          const totalReceived =
                                            itemReceipts.reduce(
                                              (sum, r) =>
                                                sum + r.receivedQuantity,
                                              0,
                                            );
                                          const orderTotal = orderItem
                                            ? orderItem.orderedQuantity *
                                              orderItem.orderedPrice
                                            : 0;

                                          // Calculate cumulative variance only for last order
                                          const isLastOrder =
                                            orderIndex ===
                                            ordersArray.length - 1;
                                          const allOrderTotals =
                                            ordersArray.reduce((sum, o) => {
                                              const oi = orderItems.find(
                                                (oiItem) =>
                                                  oiItem.orderId === o.id &&
                                                  oiItem.lineItemId === item.id,
                                              );
                                              return (
                                                sum +
                                                (oi
                                                  ? oi.orderedQuantity *
                                                    oi.orderedPrice
                                                  : 0)
                                              );
                                            }, 0);
                                          const variance = isLastOrder
                                            ? (item.allowance || 0) -
                                              allOrderTotals
                                            : null;

                                          return (
                                            <tr
                                              key={`${item.id}-order-${order.id}`}
                                              className="text-xs"
                                            >
                                              <td className="px-2 py-1"></td>
                                              <td
                                                colSpan={4}
                                                className="px-2 py-1 text-gray-700 bg-blue-50"
                                              >
                                                <span className="font-medium text-gray-600">
                                                  Order #{order.orderNumber} -{" "}
                                                  {new Date(
                                                    order.orderDate,
                                                  ).toLocaleDateString()}
                                                </span>
                                              </td>
                                              {orderItem ? (
                                                <>
                                                  <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                    {orderItem.orderedQuantity}
                                                  </td>
                                                  <td className="px-2 py-1 text-left text-gray-600 bg-blue-50">
                                                    {item.unit || "-"}
                                                  </td>
                                                  <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                    $
                                                    {orderItem.orderedPrice.toFixed(
                                                      2,
                                                    )}
                                                  </td>
                                                  <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                    ${orderTotal.toFixed(2)}
                                                  </td>
                                                  <td className="px-2 py-1 text-right text-gray-600 bg-blue-50">
                                                    {variance !== null && (
                                                      <span
                                                        className={
                                                          variance >= 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                        }
                                                      >
                                                        {variance >= 0
                                                          ? "$"
                                                          : "-$"}
                                                        {Math.abs(
                                                          variance,
                                                        ).toFixed(2)}
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td className="px-2 py-1 text-left text-gray-600 bg-blue-50">
                                                    {totalReceived > 0 &&
                                                      `Received: ${totalReceived}`}
                                                  </td>
                                                  <td className="px-2 py-1 bg-blue-50"></td>
                                                </>
                                              ) : (
                                                <td colSpan={7}></td>
                                              )}
                                            </tr>
                                          );
                                        },
                                      )}
                                    </>
                                  )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
              {getUnassignedLineItems().length > 0 &&
                (() => {
                  const isExpanded = expandedSections.has("unassigned");
                  return (
                    <div className="border-b last:border-b-0">
                      <div className="bg-yellow-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSection("unassigned")}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {isExpanded ? "▼" : "▶"}
                          </button>
                          <h3 className="text-sm font-semibold text-gray-700">
                            Unassigned Vendor
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">
                            Total: $
                            {getUnassignedLineItems()
                              .reduce((sum, item) => sum + item.totalCost, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {isExpanded && (
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Category
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Item
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Material
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Mfr
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Product
                              </th>
                              <th className="px-2 py-1 text-right font-medium text-gray-600">
                                Qty
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-right font-medium text-gray-600">
                                Unit Cost
                              </th>
                              <th className="px-2 py-1 text-right font-medium text-gray-600">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600">
                                Status
                              </th>
                              <th className="px-2 py-1 text-right font-medium text-gray-600">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getUnassignedLineItems().map((item) => {
                              const category = categories.find(
                                (c) => c.id === item.categoryId,
                              );
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {category?.name || "-"}
                                  </td>
                                  <td className="px-2 py-1">{item.name}</td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.material}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.manufacturerId
                                      ? manufacturers.find(
                                          (m) => m.id === item.manufacturerId,
                                        )?.name
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1 text-gray-600">
                                    {item.productId
                                      ? products.find(
                                          (p) => p.id === item.productId,
                                        )?.name
                                      : "-"}
                                  </td>
                                  <td className="px-2 py-1 text-right">
                                    {item.quantity}
                                  </td>
                                  <td className="px-2 py-1">{item.unit}</td>
                                  <td className="px-2 py-1 text-right">
                                    ${item.unitCost.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1 text-right font-medium">
                                    ${item.totalCost.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-1">
                                    <span
                                      className={`px-1 py-0.5 rounded text-xs ${
                                        item.status === "installed"
                                          ? "bg-green-100 text-green-700"
                                          : item.status === "ordered"
                                            ? "bg-blue-100 text-blue-700"
                                            : item.status === "received"
                                              ? "bg-purple-100 text-purple-700"
                                              : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {item.status || "pending"}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleStartInlineEdit(item)
                                      }
                                      className="ml-1 text-indigo-600 hover:text-indigo-900"
                                      title="Edit inline"
                                    >
                                      ✏️
                                    </button>
                                  </td>
                                  <td className="px-2 py-1 text-right space-x-1">
                                    <button
                                      onClick={() => handleStartModalEdit(item)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteLineItem(item.id)
                                      }
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Del
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Kitchen, Master Bath"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newCategory.allowance}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      allowance: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setNewCategory({
                    projectId: id || "",
                    name: "",
                    description: "",
                    allowance: 0,
                  });
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {editingCategory ? "Update Category" : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Line Item Modal */}
      {editModalItemId && editingItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Line Item
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <input
                  type="text"
                  value={editingItem.material}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, material: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  value={editingItem.vendorId || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      vendorId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <select
                  value={editingItem.manufacturerId || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      manufacturerId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <select
                  value={editingItem.productId || ""}
                  onChange={(e) => {
                    const product = products.find(
                      (p) => p.id === e.target.value,
                    );
                    if (product) {
                      setEditingItem({
                        ...editingItem,
                        productId: product.id,
                        manufacturerId: product.manufacturerId,
                        modelNumber: product.modelNumber,
                        name: product.name,
                        material: product.description || editingItem.material,
                      });
                    } else {
                      setEditingItem({ ...editingItem, productId: undefined });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingItem.status || "pending"}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="installed">Installed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={editingItem.quantity}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={editingItem.unit}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="ea, sf, box"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.unitCost}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      unitCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Cost
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md font-medium">
                  ${(editingItem.quantity * editingItem.unitCost).toFixed(2)}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingItem.notes || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setEditModalItemId(null);
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalEdit}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showProjectModal && editingProject && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Project
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.name}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editingProject.customerName || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editingProject.address || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingProject.email || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editingProject.phone || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Start Date
                  </label>
                  <input
                    type="date"
                    value={editingProject.estimatedStartDate || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        estimatedStartDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={editingProject.type || "other"}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bath">Bath</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="shower">Shower</option>
                    <option value="roof">Roof</option>
                    <option value="addition">Addition</option>
                    <option value="renovation">Renovation</option>
                    <option value="flooring">Flooring</option>
                    <option value="deck">Deck</option>
                    <option value="basement">Basement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingProject.status || "planning"}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedVendorId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingOrderId ? "Edit Order" : "Create Order"} -{" "}
              {vendors.find((v) => v.id === selectedVendorId)?.name}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number *
                </label>
                <input
                  type="text"
                  value={orderForm.orderNumber}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, orderNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  placeholder="PO-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date *
                </label>
                <input
                  type="date"
                  value={orderForm.orderDate}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, orderDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Optional order notes"
                />
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Line Items</h4>
              <table className="min-w-full text-xs bg-white shadow rounded-lg overflow-hidden">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-1 text-center font-medium text-gray-600 w-8">
                      ✓
                    </th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">
                      Product
                    </th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">
                      Line Qty
                    </th>
                    <th className="px-2 py-1 text-left font-medium text-gray-600">
                      Unit
                    </th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">
                      Unit Cost
                    </th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">
                      Order Qty
                    </th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">
                      Order Price
                    </th>
                    <th className="px-2 py-1 text-right font-medium text-gray-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getVendorLineItems(selectedVendorId).map((item) => {
                    const product = item.productId
                      ? products.find((p) => p.id === item.productId)
                      : null;
                    const itemData = orderForm.items[item.id] || {
                      qty: "",
                      price: "",
                    };
                    const total =
                      itemData.qty && itemData.price
                        ? (
                            parseFloat(itemData.qty) *
                            parseFloat(itemData.price)
                          ).toFixed(2)
                        : "-";
                    const isSelected =
                      itemData.qty !== "" || itemData.price !== "";
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              if (isSelected) {
                                // Unselect - clear values
                                setOrderForm({
                                  ...orderForm,
                                  items: {
                                    ...orderForm.items,
                                    [item.id]: { qty: "", price: "" },
                                  },
                                });
                              } else {
                                // Select - populate with defaults
                                setOrderForm({
                                  ...orderForm,
                                  items: {
                                    ...orderForm.items,
                                    [item.id]: {
                                      qty: item.quantity.toString(),
                                      price: item.unitCost.toString(),
                                    },
                                  },
                                });
                              }
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-gray-300 hover:border-indigo-400"
                            }`}
                            title={
                              isSelected ? "Remove from order" : "Add to order"
                            }
                          >
                            {isSelected && "✓"}
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          {product?.name || item.name}
                        </td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-2 py-1 text-gray-600">{item.unit}</td>
                        <td className="px-2 py-1 text-right text-gray-600">
                          ${item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          <input
                            type="number"
                            value={itemData.qty}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                items: {
                                  ...orderForm.items,
                                  [item.id]: {
                                    ...itemData,
                                    qty: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                            placeholder="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <input
                            type="number"
                            value={itemData.price}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                items: {
                                  ...orderForm.items,
                                  [item.id]: {
                                    ...itemData,
                                    price: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                            placeholder="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-2 py-1 text-right font-medium">
                          {total !== "-" ? `$${total}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                * Click the ✓ button to add an item to the order with default
                quantities, or manually enter values
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedVendorId(null);
                  setEditingOrderId(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {editingOrderId ? "Update Order" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order List Modal */}
      {showOrderListModal && selectedVendorId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Orders for {vendors.find((v) => v.id === selectedVendorId)?.name}
            </h3>

            <div className="space-y-2 mb-6">
              {getVendorOrders(selectedVendorId).map((order) => {
                const itemCount = orderItems.filter(
                  (oi) => oi.orderId === order.id,
                ).length;
                return (
                  <button
                    key={order.id}
                    onClick={() => handleEditOrder(order.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          Order #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(order.orderDate).toLocaleDateString()} •{" "}
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </div>
                        {order.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {order.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-indigo-600 text-sm">Edit →</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowOrderListModal(false);
                  setSelectedVendorId(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && selectedVendorId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Receive Items -{" "}
              {vendors.find((v) => v.id === selectedVendorId)?.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Order
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                onChange={(e) => setSelectedOrderId(e.target.value)}
                value={selectedOrderId || ""}
              >
                <option value="">Choose an order...</option>
                {getVendorOrders(selectedVendorId).map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.orderNumber} -{" "}
                    {new Date(order.orderDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrderId && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Date *
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={2}
                      placeholder="Optional receiving notes"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Order Items
                  </h4>
                  <table className="min-w-full text-xs border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-gray-600 border-b">
                          Product
                        </th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 border-b">
                          Ordered
                        </th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 border-b">
                          Previously Received
                        </th>
                        <th className="px-2 py-2 text-right font-medium text-gray-600 border-b">
                          Receive Now
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems
                        .filter((oi) => oi.orderId === selectedOrderId)
                        .map((orderItem) => {
                          const item = lineItems.find(
                            (li) => li.id === orderItem.lineItemId,
                          );
                          if (!item) return null;
                          const product = item.productId
                            ? products.find((p) => p.id === item.productId)
                            : null;
                          const previouslyReceived = getOrderItemReceipts(
                            orderItem.id,
                          ).reduce((sum, r) => sum + r.receivedQuantity, 0);
                          return (
                            <tr
                              key={orderItem.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-2 py-2">
                                {product?.name || item.name}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-600">
                                {orderItem.orderedQuantity}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-600">
                                {previouslyReceived}
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                                  placeholder="0"
                                  step="0.01"
                                  max={
                                    orderItem.orderedQuantity -
                                    previouslyReceived
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReceiveModal(false);
                  setSelectedVendorId(null);
                  setSelectedOrderId(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save receipts
                  alert("Receiving will be implemented with backend API");
                  setShowReceiveModal(false);
                  setSelectedVendorId(null);
                  setSelectedOrderId(null);
                }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!selectedOrderId}
              >
                Record Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
