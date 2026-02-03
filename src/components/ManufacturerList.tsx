import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { manufacturerService } from "../services";
import type { Manufacturer } from "../types";

const ManufacturerList = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Link
            to="/manufacturers/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Manufacturer
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
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Website
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {manufacturers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-sm text-gray-500"
                      >
                        No manufacturers found. Create your first manufacturer
                        to get started.
                      </td>
                    </tr>
                  ) : (
                    manufacturers.map((mfr) => (
                      <tr key={mfr.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {mfr.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/manufacturers/${mfr.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </Link>
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
    </div>
  );
};

export default ManufacturerList;
