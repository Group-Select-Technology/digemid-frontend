import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import RolesPage from "./pages/Roles/RolesPage";
import UsersPage from "./pages/Users/UsersPage";
import PeoplePage from "./pages/People/PeoplePage";
import DigemidPage from "./pages/Digemid/DigemidPage";
import CobranzasPage from "./pages/Cobranzas/CobranzasPage";
import SelectPuntoVentaPage from "./pages/SelectPos/SelectPuntoVentaPage";
import Forbidden from "./pages/OtherPage/Forbidden";
import ProfilePage from "./pages/Profile/ProfilePage";
import CategoriesPage from "./pages/Gsp/CategoriesPage";
import BrandsPage from "./pages/Gsp/BrandsPage";
import ProductsPage from "./pages/Gsp/ProductsPage";
import ProductFormPage from "./pages/Gsp/ProductFormPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import PublicRoute from "./components/auth/PublicRoute";
import { CORE_ROLES, GSP_VIEW_ROLES, GSP_WRITE_ROLES } from "./constants/roles";

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Protected routes — require authentication */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route index path="/" element={<Home />} />

                            {/* DIGEMID */}
                            <Route element={<RoleRoute roles={CORE_ROLES} />}>
                                <Route path="/digemid" element={<DigemidPage />} />
                            </Route>

                            {/* GSP — catálogo visible para todos los roles, escritura según la API */}
                            <Route element={<RoleRoute roles={GSP_VIEW_ROLES} />}>
                                <Route path="/gsp/categorias" element={<CategoriesPage />} />
                                <Route path="/gsp/marcas" element={<BrandsPage />} />
                                <Route path="/gsp/productos" element={<ProductsPage />} />
                            </Route>

                            {/* Formulario de productos en página aparte: solo roles con permiso de escritura */}
                            <Route element={<RoleRoute roles={GSP_WRITE_ROLES} />}>
                                <Route path="/gsp/productos/nuevo" element={<ProductFormPage />} />
                                <Route path="/gsp/productos/:id/editar" element={<ProductFormPage />} />
                            </Route>

                            <Route element={<RoleRoute roles={['ADMIN', 'DESARROLLO', 'SOPORTE']} />}>
                                <Route path="/select-punto-venta" element={<SelectPuntoVentaPage />} />
                            </Route>
                            <Route element={<RoleRoute roles={['ADMIN', 'DESARROLLO']} />}>
                                <Route path="/cobranzas" element={<CobranzasPage />} />
                            </Route>

                            {/* Gestión — protegido por rol */}
                            <Route element={<RoleRoute roles={['ADMIN']} />}>
                                <Route path="/roles" element={<RolesPage />} />
                                <Route path="/usuarios" element={<UsersPage />} />
                            </Route>
                            <Route element={<RoleRoute roles={['ADMIN', 'DESARROLLO']} />}>
                                <Route path="/personas" element={<PeoplePage />} />
                            </Route>

                            <Route path="/403" element={<Forbidden />} />

                            {/* Perfil */}
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* Public routes — redirect to dashboard if already logged in */}
                    <Route element={<PublicRoute />}>
                        <Route path="/signin" element={<SignIn />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
