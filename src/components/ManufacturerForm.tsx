import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { manufacturerService } from "../services";
import type {
    CreateManufacturerRequest,
    UpdateManufacturerRequest,
} from "../types";

const ManufacturerForm = () => {
  const { manufacturerId } = useParams<{ manufacturerId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!manufacturerId;

  const [formData, setFormData] = useState<CreateManufacturerRequest>({
    name: "",
    website: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && manufacturerId) {
      loadManufacturer(manufacturerId);
    }
  }, [manufacturerId, isEditMode]);

  const loadManufacturer = async (id: string) => {
    try {
      const manufacturer = await manufacturerService.getManufacturer(id);
      setFormData({
        name: manufacturer.name,
        website: manufacturer.website,
      });
    } catch (err) {
      setError("Failed to load manufacturer");
      console.error("Error loading manufacturer:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && manufacturerId) {
        await manufacturerService.updateManufacturer(
          manufacturerId,
          formData as UpdateManufacturerRequest,
        );
      } else {
        await manufacturerService.createManufacturer(formData);
      }
      navigate("/manufacturers");
    } catch (err) {
      setError(`Failed to ${isEditMode ? "update" : "create"} manufacturer`);
      console.error("Error saving manufacturer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : value,
    }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEditMode ? "Edit Manufacturer" : "Create Manufacturer"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {isEditMode
              ? "Update manufacturer information."
              : "Add a new manufacturer to your list."}
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
                    Manufacturer Name
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
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website || ""}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/manufacturers")}
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

export default ManufacturerForm;
