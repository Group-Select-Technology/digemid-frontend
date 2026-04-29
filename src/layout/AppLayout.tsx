import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { Toaster } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

const LayoutContent: React.FC = () => {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const { theme } = useTheme();

    return (
        <div className="min-h-screen xl:flex">
            <Toaster
                position="top-right"
                containerStyle={{ top: '76px' }}
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: theme === "dark" ? "#1f2937" : "#ffffff",
                        color: theme === "dark" ? "#f3f4f6" : "#1f2937",
                        border: theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
                        borderRadius: "10px",
                        fontSize: "14px",
                    },
                    success: {
                        iconTheme: {
                            primary: "#22c55e",
                            secondary: theme === "dark" ? "#1f2937" : "#ffffff",
                        },
                    },
                    error: {
                        duration: 7000,
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: theme === "dark" ? "#1f2937" : "#ffffff",
                        },
                    },
                }}
            />
            <div>
                <AppSidebar />
                <Backdrop />
            </div>
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
                    } ${isMobileOpen ? "ml-0" : ""}`}
            >
                <AppHeader />
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const AppLayout: React.FC = () => {
    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
};

export default AppLayout;
