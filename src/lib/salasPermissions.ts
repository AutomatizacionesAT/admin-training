export const SALAS_MANAGER_DOCUMENTO = '52829724';

export function canManageSalas(user: { documento: string } | null | undefined): boolean {
  return user?.documento.trim() === SALAS_MANAGER_DOCUMENTO;
}

// La sesión se conserva solo en memoria y se elimina al cerrar sesión.
let salasSessionToken: string | null = null;

export function setSalasSessionToken(token: string | null): void {
  salasSessionToken = token;
}

export function getSalasSessionToken(): string | null {
  return salasSessionToken;
}
