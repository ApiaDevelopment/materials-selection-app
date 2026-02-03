import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    lineItemService,
    manufacturerService,
    vendorService,
} from "../services";
import type {
    CreateLineItemRequest,
    Manufacturer,
    UpdateLineItemRequest,
    Vendor,
} from "../types";

const LineItemForm = () => {
  const { categoryId, lineItemId } = useParams<{
    categoryId: string;
    lineItemId: string;
  }>();
  const navigate = useNavigate();
  const isEditMode = !!lineItemId;

  const [formData, setFormData] = useState<CreateLineItemRequest>({
    categoryId: categoryId || "",
    projectId: "", // Will be set when loading or from category
    name: "",
    material: "",
    quantity: 0,
    unit: "",
    unitCost: 0,
    notes: "",
    vendorId: undefined,
    manufacturerId: undefined,
    productId: undefined,
    modelNumber: undefined,
    allowance: undefined,
    orderedDate: undefined,
    receivedDate: undefined,
    stagingLocation: undefined,
    returnNotes: undefined,
    status: "pending",
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDropdownData();
    if (isEditMode && lineItemId) {
      loadLineItem(lineItemId);
    } else if (categoryId && !formData.projectId) {
      // Load category to get projectId
      loadCategoryForProjectId(categoryId);
    }
  }, [lineItemId, isEditMode, categoryId]);

  const loadCategoryForProjectId = async (catId: string) => {
    try {
      const { categoryService } = await import("../services");
      const category = await categoryService.getById(catId);
      setFormData((prev) => ({ ...prev, projectId: category.projectId }));
    } catch (err) {
      console.error("Error loading category:", err);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [vendorsData, manufacturersData] = await Promise.all([
        vendorService.getAllVendors(),
        manufacturerService.getAllManufacturers(),
      ]);
      setVendors(vendorsData);
      setManufacturers(manufacturersData);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  const loadLineItem = async (id: string) => {
    try {
      const lineItem = await lineItemService.getById(id);
      setFormData({
        categoryId: lineItem.categoryId,
        projectId: lineItem.projectId,
        name: lineItem.name,
        material: lineItem.material,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        unitCost: lineItem.unitCost,
        notes: lineItem.notes || "",
        vendorId: lineItem.vendorId,
        manufacturerId: lineItem.manufacturerId,
        productId: lineItem.productId,
        modelNumber: lineItem.modelNumber,
        allowance: lineItem.allowance,
        orderedDate: lineItem.orderedDate,
        receivedDate: lineItem.receivedDate,
        stagingLocation: lineItem.stagingLocation,
        returnNotes: lineItem.returnNotes,
        status: lineItem.status || "pending",
      });
    } catch (err) {
      setError("Failed to load line item");
      console.error("Error loading line item:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && lineItemId) {
        await lineItemService.update(
          lineItemId,
          formData as UpdateLineItemRequest,
        );
        navigate(`/categories/${formData.categoryId}`);
      } else {
        await lineItemService.create(formData);
        navigate(`/categories/${categoryId}`);
      }
    } catch (err) {
      setError(`Failed to ${isEditMode ? "update" : "create"} line item`);
      console.error("Error saving line item:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === "number") {
      processedValue = value === "" ? undefined : parseFloat(value) || 0;
    } else if (type === "date") {
      processedValue = value === "" ? undefined : value;
    } else if (e.target instanceof HTMLSelectElement && value === "") {
      processedValue = undefined;
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const calculatedTotal = formData.quantity * formData.unitCost;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEditMode ? "Edit Line Item" : "Create Line Item"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {isEditMode
              ? "Update the line item information below."
              : "Add a new material line item to this category."}
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div>
                  <label
                    htmlFor="material"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Material
                  </label>
                  <input
                    type="text"
                    name="material"
                    id="material"
                    required
                    value={formData.material}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      required
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="unit"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      id="unit"
                      required
                      placeholder="e.g., sq ft, lbs, each"
                      value={formData.unit}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="unitCost"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    name="unitCost"
                    id="unitCost"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div className="bg-gray-50 px-4 py-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700">
                    Total Cost:{" "}
                    <span className="text-lg font-bold text-indigo-600">
                      ${calculatedTotal.toFixed(2)}
                    </span>
                    {formData.allowance !== undefined && (
                      <span className="ml-4 text-sm">
                        Allowance: ${formData.allowance.toFixed(2)}
                        {calculatedTotal > formData.allowance && (
                          <span className="ml-2 text-red-600 font-semibold">
                            (Over by $
                            {(calculatedTotal - formData.allowance).toFixed(2)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Enhanced tracking fields */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Order Tracking
                  </h4>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="vendorId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Vendor
                      </label>
                      <select
                        id="vendorId"
                        name="vendorId"
                        value={formData.vendorId || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">Select a vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="manufacturerId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Manufacturer
                      </label>
                      <select
                        id="manufacturerId"
                        name="manufacturerId"
                        value={formData.manufacturerId || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">Select a manufacturer</option>
                        {manufacturers.map((mfr) => (
                          <option key={mfr.id} value={mfr.id}>
                            {mfr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label
                        htmlFor="modelNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Model Number
                      </label>
                      <input
                        type="text"
                        name="modelNumber"
                        id="modelNumber"
                        value={formData.modelNumber || ""}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="allowance"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Allowance ($)
                      </label>
                      <input
                        type="number"
                        name="allowance"
                        id="allowance"
                        min="0"
                        step="0.01"
                        value={formData.allowance || ""}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label
                        htmlFor="orderedDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Ordered Date
                      </label>
                      <input
                        type="date"
                        name="orderedDate"
                        id="orderedDate"
                        value={formData.orderedDate || ""}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="receivedDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Received Date
                      </label>
                      <input
                        type="date"
                        name="receivedDate"
                        id="receivedDate"
                        value={formData.receivedDate || ""}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status || "pending"}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="pending">Pending</option>
                        <option value="ordered">Ordered</option>
                        <option value="received">Received</option>
                        <option value="installed">Installed</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="stagingLocation"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Staging Location
                      </label>
                      <input
                        type="text"
                        name="stagingLocation"
                        id="stagingLocation"
                        value={formData.stagingLocation || ""}
                        onChange={handleChange}
                        placeholder="e.g., Garage, Basement"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label
                      htmlFor="returnNotes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Return Notes
                    </label>
                    <textarea
                      id="returnNotes"
                      name="returnNotes"
                      rows={2}
                      value={formData.returnNotes || ""}
                      onChange={handleChange}
                      placeholder="Notes about returns, damages, or issues"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/categories/${formData.categoryId}`)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LineItemForm;
