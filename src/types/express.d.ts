import { User } from '../models/user';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: number;
        email: string;
        role: 'user' | 'admin';
        name?: string;
      };
    }
  }
}

export {};