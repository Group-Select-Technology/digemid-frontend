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
import ProfilePage from "./pages/Profile/ProfilePage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

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
                            <Route path="/digemid" element={<DigemidPage />} />

                            {/* Gestión */}
                            <Route path="/roles" element={<RolesPage />} />
                            <Route path="/usuarios" element={<UsersPage />} />
                            <Route path="/personas" element={<PeoplePage />} />

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
