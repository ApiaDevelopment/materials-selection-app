import { useEffect, useState } from "react";
import { manufacturerService } from "../services";
import type { Manufacturer } from "../types";

const ManufacturerList = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
  });

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      const data = await manufacturerService.getAllManufacturers();
      setManufacturers(data);
    } catch (err) {
      setError("Failed to load manufacturers");
      console.error("Error loading manufacturers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (manufacturer?: Manufacturer) => {
    if (manufacturer) {
      setEditingManufacturer(manufacturer);
      setFormData({
        name: manufacturer.name,
        website: manufacturer.website || "",
      });
    } else {
      setEditingManufacturer(null);
      setFormData({
        name: "",
        website: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingManufacturer(null);
    setFormData({
      name: "",
      website: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingManufacturer) {
        const updated = await manufacturerService.updateManufacturer(editingManufacturer.id, formData);
        setManufacturers(manufacturers.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await manufacturerService.createManufacturer(formData);
        setManufacturers([...manufacturers, created]);
      }
      handleCloseModal();
    } catch (err) {
      setError("Failed to save manufacturer");
      console.error("Error saving manufacturer:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manufacturer?")) return;

    try {
      await manufacturerService.deleteManufacturer(id);
      setManufacturers(manufacturers.filter((m) => m.id !== id));
    } catch (err) {
      setError("Failed to delete manufacturer");
      console.error("Error deleting manufacturer:", err);
    }
  };

  if (loading) return <div className="px-4 py-8">Loading manufacturers...</div>;
  if (error) return <div className="px-4 py-8 text-red-600">{error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manufacturers
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your manufacturer list for product tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Manufacturer
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 pl-3 pr-2 text-left text-xs font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-900">
                      Website
                    </th>
                    <th className="relative py-2 pl-2 pr-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {manufacturers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-xs text-gray-500"
                      >
                        No manufacturers found. Create your first manufacturer
                        to get started.
                      </td>
                    </tr>
                  ) : (
                    manufacturers.map((mfr) => (
                      <tr key={mfr.id}>
                        <td className="py-1 pl-3 pr-2 text-xs font-medium text-gray-900">
                          {mfr.name}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-500">
                          {mfr.website ? (
                            <a
                              href={mfr.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Visit
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="relative py-1 pl-2 pr-3 text-right text-xs font-medium space-x-2">
                          <button
                            onClick={() => handleOpenModal(mfr)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(mfr.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Manufacturer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {editingManufacturer ? "Edit Manufacturer" : "Create Manufacturer"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
                >
                  {editingManufacturer ? "Update Manufacturer" : "Create Manufacturer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerList;
