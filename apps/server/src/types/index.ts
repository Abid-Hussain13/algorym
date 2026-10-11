export interface AuthPayload {
  id: string;
  name: string;
  email: string;
  token_version: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
