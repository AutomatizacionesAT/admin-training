import { createContext, useContext, useState, type ReactNode } from "react";
import { setSalasSessionToken } from '@/lib/salasPermissions';
import { setTrainingSessionToken, trainingRequest } from '@/lib/trainingApi';

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
    { documento: '1075657236', nombre: 'EDISON CAMILO SUÁREZ RODRIGUEZ', cargo: 'Jefe de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '52829724', nombre: 'DIANA MARITZA PEDREROS CUERVO', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '1018509964', nombre: 'SEBASTIAN SANTOS POLANIA', cargo: 'Analista de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '1030550388', nombre: 'SINDY JULIETH ROJAS OROZCO', cargo: 'Coordinador de Formación', rol: 'SUPER_ADMIN' },
    { documento: '79616534', nombre: 'CARLOS DASTE', cargo: 'Gerente de Negocios', rol: 'SUPER_ADMIN' },
    { documento: '1088309969', nombre: 'JOHAN SEBASTIAN QUINCHIA VARGAS', cargo: 'Agile Training', rol: 'SUPER_ADMIN' },
    { documento: '52748970', nombre: 'DIANA PATRICIA BELTRÁN PARRA', cargo: 'Gerente de Negocios', rol: 'SUPER_ADMIN' },
    // ── Coordinadores ─────────────────────────────────────────────────────────
    { documento: '1032430434', nombre: 'ALVARO JAVIER GARZON ZAMBRANO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1016048741', nombre: 'CRISTIAM CAMILO LOPEZ CONTRERAS', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1019047075', nombre: 'JHONNY ALEXANDER VARELA RUSINQUE', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1020808847', nombre: 'JENNY CAROLINA PINZON FERNANDEZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1032485963', nombre: 'JEIMMY LORENA MUÑOZ DIAZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1081514968', nombre: 'OLGA LUCIA BRAVO NUNEZ', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1088312274', nombre: 'JHON EYDER RAMIREZ CORREA', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1113789102', nombre: 'YENNY VANESSA RUIZ VALLEJO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
    { documento: '1012385857', nombre: 'WALTHER DUVAN GOMEZ OSORIO', cargo: 'Lider de Formación', rol: 'COORDINADOR' },
    { documento: '52829724', nombre: 'DIANA MARITZA PEDREROS CUERVO', cargo: 'Analista de Negocios', rol: 'COORDINADOR' },
    { documento: '1018509964', nombre: 'SEBASTIAN SANTOS POLANIA', cargo: 'Analista de Negocios', rol: 'COORDINADOR' },
    { documento: '1030550388', nombre: 'SINDY JULIETH ROJAS OROZCO', cargo: 'Coordinador de Formación', rol: 'COORDINADOR' },
];


interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isCoordinador: boolean;
    canAccessUsabilidad: boolean;
    canAccessBiometrico: boolean;
    salasUser: SalasUser | null;
    login: (usuario: string, clave: string) => Promise<boolean>;
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
    const canAccessBiometrico = isAdmin || isSuperAdmin || isCoordinador;

    const login = async (usuario: string, clave: string): Promise<boolean> => {
        const result = await trainingRequest<{
            authenticated?: boolean; documento?: string; salasToken?: string; sessionToken?: string;
        }>({ action: 'login', usuario: usuario.trim(), clave }, false);

        if (!result.authenticated || !result.documento) {
            return false;
        }

        const found = SALAS_USERS.find(user => user.documento === result.documento?.trim());
        if (!found) {
            return false;
        }
        if (!result.sessionToken) {
            throw new Error('El servicio no devolvió una sesión válida. Verifica la versión de Apps Script.');
        }

        setTrainingSessionToken(result.sessionToken);
        setSalasUser(found);
        setSalasSessionToken(result.salasToken ?? null);
        setIsAdmin(found.rol === 'SUPER_ADMIN');
        return true;
    };

    const logout = () => {
        setTrainingSessionToken(null);
        setSalasSessionToken(null);
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
