import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";

import {
    GridIcon,
    ChevronDownIcon,
    HorizontaLDots,
    DollarLineIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import type { RoleCode } from "../types";
import { CORE_ROLES, GSP_VIEW_ROLES } from "../constants/roles";
import {
    BeakerIcon,
    BuildingStorefrontIcon,
    IdentificationIcon,
    PhotoIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    TagIcon,
    ShoppingBagIcon,
    RectangleGroupIcon,
    UserIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";

type NavSubItem = {
    name: string;
    path: string;
    icon?: ReactNode;
    roles?: RoleCode[];
    pro?: boolean;
    new?: boolean;
};

type NavItem = {
    name: string;
    icon: ReactNode;
    path?: string;
    roles?: RoleCode[];
    subItems?: NavSubItem[];
};

const navItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
    },
    {
        icon: <BeakerIcon className="w-5 h-5" />,
        name: "DIGEMID",
        path: "/digemid",
        roles: CORE_ROLES,
    },
    {
        icon: <BuildingStorefrontIcon className="w-5 h-5" />,
        name: "GSP",
        subItems: [
            {
                icon: <Squares2X2Icon className="w-4 h-4" />,
                name: "Categorías",
                path: "/gsp/categorias",
                roles: GSP_VIEW_ROLES,
            },
            {
                icon: <TagIcon className="w-4 h-4" />,
                name: "Marcas",
                path: "/gsp/marcas",
                roles: GSP_VIEW_ROLES,
            },
            {
                icon: <ShoppingBagIcon className="w-4 h-4" />,
                name: "Productos",
                path: "/gsp/productos",
                roles: GSP_VIEW_ROLES,
            },
            {
                icon: <RectangleGroupIcon className="w-4 h-4" />,
                name: "Kits y packs",
                path: "/gsp/kits",
                roles: GSP_VIEW_ROLES,
            },
        ],
    },
    {
        icon: <PhotoIcon className="w-5 h-5" />,
        name: "Select Punto de Venta",
        path: "/select-punto-venta",
        roles: ["ADMIN", "DESARROLLO", "SOPORTE"],
    },
    {
        icon: <DollarLineIcon />,
        name: "Cobranzas",
        path: "/cobranzas",
        roles: ["ADMIN", "DESARROLLO"],
    },
    {
        icon: <UsersIcon className="w-5 h-5" />,
        name: "Gestión de Usuarios",
        subItems: [
            {
                icon: <ShieldCheckIcon className="w-4 h-4" />,
                name: "Roles",
                path: "/roles",
                roles: ["ADMIN"],
            },
            {
                icon: <UserIcon className="w-4 h-4" />,
                name: "Usuarios",
                path: "/usuarios",
                roles: ["ADMIN"],
            },
            {
                icon: <IdentificationIcon className="w-4 h-4" />,
                name: "Personas",
                path: "/personas",
                roles: ["ADMIN", "DESARROLLO"],
            },
        ],
    },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const location = useLocation();
    const { user } = useAuth();

    const visibleNavItems = useMemo(() => {
        const canSeeItem = (roles?: RoleCode[]) => {
            if (!roles || roles.length === 0) return true;
            return !!user && roles.includes(user.roleCode);
        };
        return navItems
            .map((item) => ({
                ...item,
                subItems: item.subItems?.filter((sub) => canSeeItem(sub.roles)),
            }))
            .filter((item) => {
                if (item.subItems) {
                    return item.subItems.length > 0;
                }
                return canSeeItem(item.roles);
            });
    }, [user]);

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "others";
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
        {}
    );
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // const isActive = (path: string) => location.pathname === path;
    const isActive = useCallback(
        (path: string) =>
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(`${path}/`)),
        [location.pathname]
    );

    useEffect(() => {
        let submenuMatched = false;
        ["main", "others"].forEach((menuType) => {
            const items = menuType === "main" ? visibleNavItems : othersItems;
            items.forEach((nav, index) => {
                if (nav.subItems) {
                    nav.subItems.forEach((subItem) => {
                        if (isActive(subItem.path)) {
                            setOpenSubmenu({
                                type: menuType as "main" | "others",
                                index,
                            });
                            submenuMatched = true;
                        }
                    });
                }
            });
        });

        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [location, isActive, visibleNavItems]);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
        <ul className="flex flex-col gap-4">
            {items.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-active"
                                    : "menu-item-inactive"
                                } cursor-pointer ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "lg:justify-start"
                                }`}
                        >
                            <span
                                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? "menu-item-icon-active"
                                        : "menu-item-icon-inactive"
                                    }`}
                            >
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className="menu-item-text">{nav.name}</span>
                            )}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <ChevronDownIcon
                                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                                            openSubmenu?.index === index
                                            ? "rotate-180 text-brand-500"
                                            : ""
                                        }`}
                                />
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                to={nav.path}
                                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                    }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${isActive(nav.path)
                                            ? "menu-item-icon-active"
                                            : "menu-item-icon-inactive"
                                        }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">{nav.name}</span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                        <div
                            ref={(el) => {
                                subMenuRefs.current[`${menuType}-${index}`] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{
                                height:
                                    openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                        : "0px",
                            }}
                        >
                            <ul className="mt-2 space-y-1 ml-9">
                                {nav.subItems.map((subItem) => (
                                    <li key={subItem.name}>
                                        <Link
                                            to={subItem.path}
                                            className={`menu-dropdown-item ${isActive(subItem.path)
                                                    ? "menu-dropdown-item-active"
                                                    : "menu-dropdown-item-inactive"
                                                }`}
                                        >
                                            {subItem.icon && (
                                                <span className="shrink-0">{subItem.icon}</span>
                                            )}
                                            <span className="flex-1">{subItem.name}</span>
                                            <span className="flex items-center gap-1 ml-auto">
                                                {subItem.new && (
                                                    <span
                                                        className={`ml-auto ${isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                            } menu-dropdown-badge`}
                                                    >
                                                        new
                                                    </span>
                                                )}
                                                {subItem.pro && (
                                                    <span
                                                        className={`ml-auto ${isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                            } menu-dropdown-badge`}
                                                    >
                                                        pro
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : "w-[90px]"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
            >
                <Link to="/">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <img
                                className="dark:hidden"
                                src="/images/logo/logoSelectNuevoOriginal.png"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <img
                                className="hidden dark:block"
                                src="/images/logo/logoSelectNuevoWhite.png"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                        </>
                    ) : (
                        <img
                            src="/images/logo/logoSelectNuevoOriginalIcono.png"
                            alt="Logo"
                            width={32}
                            height={32}
                        />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "justify-start"
                                    }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Menu"
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>
                            {renderMenuItems(visibleNavItems, "main")}
                        </div>
                        <div className="">
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "justify-start"
                                    }`}
                            >
                                {/* {isExpanded || isHovered || isMobileOpen ? (
                                    "Others"
                                ) : ( */}
                                    {/* <HorizontaLDots /> */}
                                {/* )} */}
                            </h2>
                            {renderMenuItems(othersItems, "others")}
                        </div>
                    </div>
                </nav>
                {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
            </div>
        </aside>
    );
};

export default AppSidebar;
