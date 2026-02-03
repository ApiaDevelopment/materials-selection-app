import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CategoryDetail from "./components/CategoryDetail";
import CategoryForm from "./components/CategoryForm";
import Layout from "./components/Layout";
import LineItemForm from "./components/LineItemForm";
import ManufacturerForm from "./components/ManufacturerForm";
import ManufacturerList from "./components/ManufacturerList";
import ProductList from "./components/ProductList";
import ProjectDetail from "./components/ProjectDetail";
import ProjectForm from "./components/ProjectForm";
import ProjectList from "./components/ProjectList";
import VendorForm from "./components/VendorForm";
import VendorList from "./components/VendorList";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/edit" element={<ProjectForm />} />
          <Route
            path="/projects/:projectId/categories/new"
            element={<CategoryForm />}
          />
          <Route path="/categories/:id" element={<CategoryDetail />} />
          <Route
            path="/categories/:categoryId/edit"
            element={<CategoryForm />}
          />
          <Route
            path="/categories/:categoryId/lineitems/new"
            element={<LineItemForm />}
          />
          <Route
            path="/lineitems/:lineItemId/edit"
            element={<LineItemForm />}
          />
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/new" element={<VendorForm />} />
          <Route path="/vendors/:vendorId/edit" element={<VendorForm />} />
          <Route path="/manufacturers" element={<ManufacturerList />} />
          <Route path="/manufacturers/new" element={<ManufacturerForm />} />
          <Route
            path="/manufacturers/:manufacturerId/edit"
            element={<ManufacturerForm />}
          />
          <Route path="/products" element={<ProductList />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
