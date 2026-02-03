import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services";
import type { CreateProjectRequest, Project } from "../types";

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Project>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: "",
    description: "",
    customerName: "",
    address: "",
    email: "",
    phone: "",
    estimatedStartDate: "",
    type: "other",
    status: "planning",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError("Failed to load projects. Please check your API configuration.");
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await projectService.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete project");
      console.error("Error deleting project:", err);
    }
  };

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        customerName: project.customerName || "",
        address: project.address || "",
        email: project.email || "",
        phone: project.phone || "",
        estimatedStartDate: project.estimatedStartDate || "",
        type: project.type || "other",
        status: project.status || "planning",
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        customerName: "",
        address: "",
        email: "",
        phone: "",
        estimatedStartDate: "",
        type: "other",
        status: "planning",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      customerName: "",
      address: "",
      email: "",
      phone: "",
      estimatedStartDate: "",
      type: "other",
      status: "planning",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const updated = await projectService.update(
          editingProject.id,
          formData,
        );
        setProjects(
          projects.map((p) => (p.id === editingProject.id ? updated : p)),
        );
      } else {
        const created = await projectService.create(formData);
        setProjects([...projects, created]);
      }
      handleCloseModal();
    } catch (err) {
      alert(`Failed to ${editingProject ? "update" : "create"} project`);
      console.error("Error saving project:", err);
    }
  };

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customerName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aValue = a[sortField] || "";
    const bValue = b[sortField] || "";
    const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-indigo-400 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-4 w-48 bg-indigo-400 rounded"></div>
            <div className="h-4 w-32 bg-indigo-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 bg-red-50 border-l-4 border-red-400 rounded-lg p-6 shadow-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your construction and renovation projects
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Create Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search projects by name, description, or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Projects Table */}
      {sortedProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <p className="text-gray-500">
            {searchTerm
              ? "No projects found matching your search"
              : "No projects yet. Create your first project!"}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-2 py-1 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  Project Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("customerName")}
                  className="px-2 py-1 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  Customer{" "}
                  {sortField === "customerName" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("type")}
                  className="px-2 py-1 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  Type{" "}
                  {sortField === "type" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-2 py-1 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  Status{" "}
                  {sortField === "status" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("estimatedStartDate")}
                  className="px-2 py-1 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                >
                  Est. Start{" "}
                  {sortField === "estimatedStartDate" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-2 py-1 text-right font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-2 py-1">
                    <div className="font-medium text-gray-900">
                      {project.name}
                    </div>
                    <div className="text-gray-500 truncate max-w-xs">
                      {project.description}
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <div className="text-gray-900">
                      {project.customerName || "-"}
                    </div>
                    {project.phone && (
                      <div className="text-gray-500">{project.phone}</div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <div className="text-gray-900 capitalize">
                      {project.type || "other"}
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "on-hold"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status || "planning"}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-gray-500">
                    {project.estimatedStartDate
                      ? new Date(
                          project.estimatedStartDate,
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-2 py-1 text-right font-medium space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(project);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? "Edit Project" : "Create New Project"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
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
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
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
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
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
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
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
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
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
                    value={formData.estimatedStartDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
