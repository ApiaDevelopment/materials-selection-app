import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vendorService } from "../services";
import type { Vendor } from "../types";

const VendorList = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorService.getAllVendors();
      setVendors(data);
    } catch (err) {
      setError("Failed to load vendors");
      console.error("Error loading vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      await vendorService.deleteVendor(id);
      setVendors(vendors.filter((v) => v.id !== id));
    } catch (err) {
      setError("Failed to delete vendor");
      console.error("Error deleting vendor:", err);
    }
  };

  if (loading) return <div className="px-4 py-8">Loading vendors...</div>;
  if (error) return <div className="px-4 py-8 text-red-600">{error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your vendor list for material sourcing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/vendors/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Vendor
          </Link>
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
                      Contact Info
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
                  {vendors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-xs text-gray-500"
                      >
                        No vendors found. Create your first vendor to get
                        started.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="py-1 pl-3 pr-2 text-xs font-medium text-gray-900">
                          {vendor.name}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-500">
                          {vendor.contactInfo || "-"}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-500">
                          {vendor.website ? (
                            <a
                              href={vendor.website}
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
                          <Link
                            to={`/vendors/${vendor.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(vendor.id)}
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
    </div>
  );
};

export default VendorList;
