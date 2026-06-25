import { createContext, useContext, useState, type ReactNode } from "react";

export type SalasRole = 'SUPER_ADMIN' | 'COORDINADOR';

export interface SalasUser {
    documento: string;
    nombre: string;
    cargo: string;
    rol: SalasRole;
}

// ── Usuarios con acceso a Salas ─────────────────────────────────────────────
export const SALAS_USERS: SalasUser[] = [
    // ── Super Admins ──────────────────────────────────────────────────────────
    { documento: '1007144082', nombre: 'Jhon Jairo Giraldo Rodriguez', cargo: 'Jefe de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '52829724', nombre: 'Diana Maritza Perderos Cuervo', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '1018509964', nombre: 'Sebastian Santos Polania', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '79616534', nombre: 'Carlos Daste', cargo: 'Gerente de Negocios', rol: 'SUPER_ADMIN' },
    // ── Coordinadores ─────────────────────────────────────────────────────────
    { documento: '52508133', nombre: 'Gladys Lilana Herrera Olaya', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1012421029', nombre: 'Stefany Lizarrazo Jimenez', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1019604075', nombre: 'Jhonny Alexander Varilla Rusinque', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1070808647', nombre: 'Jenny Carolina Pinzon Fernandez', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1032465563', nombre: 'Jeimy Lorena Muñoz Diaz', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1001514968', nombre: 'Olga Lucia Bravo Nunez', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1068312274', nombre: 'Jhon Cyder Ramirez Correa', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1113789102', nombre: 'Yenny Vanessa Ruiz Vallejo', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1068343279', nombre: 'Kenny Arce Rodriguez', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1013675280', nombre: 'Michael Daniel Rendon Morato', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1012385857', nombre: 'Walther Duvan Gomez Osorio', cargo: 'Lider de Formación', rol: 'COORDINADOR' },
    { documento: '1022390304', nombre: 'Karol Citysan Ferreira Quevedo', cargo: 'Prof. Gestión de Procesos', rol: 'COORDINADOR' },
    { documento: '1075303121', nombre: 'Jhon Fredy Gonzalez Alvarez', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '108830969', nombre: 'Johan Sebastian Quinchia Vargas', cargo: 'Agile Training', rol: 'COORDINADOR' },
    { documento: '1088351617', nombre: 'Vanessa Agudelo Garcia', cargo: 'Agile Training', rol: 'COORDINADOR' },
];

const ADMIN_PASSWORD = 'desarrollo2026';

const ADMIN_GLOBAL_USER: SalasUser = {
    documento: 'admin',
    nombre: 'Administrador',
    cargo: 'Admin Global',
    rol: 'SUPER_ADMIN',
};


interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isCoordinador: boolean;
    canAccessUsabilidad: boolean;
    canAccessBiometrico: boolean;
    salasUser: SalasUser | null;
    login: (input: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [salasUser, setSalasUser] = useState<SalasUser | null>(null);
    const isAuthenticated = isAdmin || !!salasUser;
    const isSuperAdmin = isAdmin || salasUser?.rol === 'SUPER_ADMIN';
    const isCoordinador = salasUser?.rol === 'COORDINADOR';
    const canAccessUsabilidad = isAdmin || isSuperAdmin;
    const canAccessBiometrico = isAdmin || isSuperAdmin;

    const login = (input: string): boolean => {
        const value = input.trim();

        // Contraseña global → Admin Mode + Super Admin en Salas
        if (value === ADMIN_PASSWORD) {
            setIsAdmin(true);
            setSalasUser(ADMIN_GLOBAL_USER);
            return true;
        }

        // Cédula → buscar en lista de usuarios de Salas
        const found = SALAS_USERS.find(u => u.documento === value);
        if (found) {
            setSalasUser(found);
            return true;
        }

        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        setSalasUser(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isAdmin,
            isSuperAdmin,
            isCoordinador,
            canAccessUsabilidad,
            canAccessBiometrico,
            salasUser,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
