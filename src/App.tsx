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

export default function App() {
    return (
        <>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Dashboard Layout */}
                    <Route element={<AppLayout />}>
                        <Route index path="/" element={<Home />} />

                        {/* Gestión */}
                        <Route path="/roles" element={<RolesPage />} />
                        <Route path="/usuarios" element={<UsersPage />} />
                        <Route path="/personas" element={<PeoplePage />} />

                        {/* DIGEMID */}
                        <Route path="/digemid" element={<DigemidPage />} />
                    </Route>

                    {/* Auth Layout */}
                    <Route path="/signin" element={<SignIn />} />

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </>
    );
}
