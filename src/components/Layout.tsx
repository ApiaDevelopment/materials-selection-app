import { Link, useLocation } from "react-router-dom";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Materials Selection
                </h1>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive("/projects") || location.pathname === "/"
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  📁 Projects
                </Link>
                <Link
                  to="/vendors"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive("/vendors")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  🏪 Vendors
                </Link>
                <Link
                  to="/manufacturers"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive("/manufacturers")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  🏭 Manufacturers
                </Link>
                <Link
                  to="/products"
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isActive("/products")
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  📦 Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default Layout;
