import type { CoreRoleCode, GspRoleCode, RoleCode } from '../types';

/** Roles del panel interno. Son los únicos que ven DIGEMID, Select POS, Cobranzas y la gestión de usuarios. */
export const CORE_ROLES: CoreRoleCode[] = ['ADMIN', 'SOPORTE', 'DESARROLLO'];

/** Roles de la tienda GSP. Solo ven las secciones del catálogo. */
export const GSP_ROLES: GspRoleCode[] = ['ADMIN_GSP', 'ASESOR_GSP', 'SOPORTE_GSP'];

/** Quiénes pueden entrar a las secciones del catálogo GSP: todos los roles del sistema. */
export const GSP_VIEW_ROLES: RoleCode[] = [...CORE_ROLES, ...GSP_ROLES];

/** Quiénes pueden crear, editar o eliminar en el catálogo GSP (según los `@Auth()` de la API). */
export const GSP_WRITE_ROLES: RoleCode[] = ['ADMIN', 'ADMIN_GSP', 'DESARROLLO'];

export const isGspRole = (role?: RoleCode): boolean =>
  !!role && (GSP_ROLES as RoleCode[]).includes(role);

export const canWriteGsp = (role?: RoleCode): boolean => !!role && GSP_WRITE_ROLES.includes(role);
