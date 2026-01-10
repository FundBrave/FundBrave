export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// Auth helpers removed; retained signatures now return inert defaults.
export function generateToken(_payload: JWTPayload): string {
  return "";
}

export function verifyToken(_token: string): JWTPayload | null {
  return null;
}

export async function hashPassword(_password: string): Promise<string> {
  return "";
}

export async function comparePassword(
  _password: string,
  _hash: string
): Promise<boolean> {
  return false;
}

export function extractTokenFromRequest(_request: unknown): string | null {
  return null;
}

export function getUserFromRequest(_request: unknown): JWTPayload | null {
  return null;
}
