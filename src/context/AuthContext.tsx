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
    { documento: '1007144082', nombre: 'JHON JAIRO GIRALDO RODRIGUEZ', cargo: 'Jefe de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '52829724', nombre: 'DIANA MARITZA PEDREROS CUERVO', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '1018509964', nombre: 'SEBASTIAN SANTOS POLANIA', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '79616534', nombre: 'CARLOS DASTE', cargo: 'Gerente de Negocios', rol: 'SUPER_ADMIN' },
    // ── Coordinadores ─────────────────────────────────────────────────────────
    { documento: '52508133', nombre: 'GLADYS LILIANA HERRERA OLAYA', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1016048741', nombre: 'CRISTIAM CAMILO LOPEZ CONTRERAS', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1019047075', nombre: 'JHONNY ALEXANDER VARELA RUSINQUE', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1020808847', nombre: 'JENNY CAROLINA PINZON FERNANDEZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1032485963', nombre: 'JEIMMY LORENA MUÑOZ DIAZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1081514968', nombre: 'OLGA LUCIA BRAVO NUNEZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1088312274', nombre: 'JHON EYDER RAMIREZ CORREA', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1113789102', nombre: 'YENNY VANESSA RUIZ VALLEJO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1013675280', nombre: 'MICHAEL DANIEL RENDON MORATO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1012385857', nombre: 'WALTHER DUVAN GOMEZ OSORIO', cargo: 'Lider de Formación', rol: 'COORDINADOR' },
    { documento: '1022390304', nombre: 'KAROL EITYSAN FERREIRA QUEVEDO', cargo: 'Prof. Gestión de Procesos', rol: 'COORDINADOR' },
    { documento: '1018475580', nombre: 'FERNANDO ANDRES CHONA GIRALDO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1088309969', nombre: 'JOHAN SEBASTIAN QUINCHIA VARGAS', cargo: 'Agile Training', rol: 'COORDINADOR' },
    { documento: '1088351617', nombre: 'VANESSA AGUDELO GARCIA', cargo: 'Agile Training', rol: 'COORDINADOR' },
    { documento: '1030550388', nombre: 'SINDY JULIETH ROJAS OROZCO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
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
    const canAccessUsabilidad = isAdmin || isSuperAdmin || isCoordinador;
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
