import type { Request } from "express";
import type { User } from "@prisma/client";

export interface JwtPayload {
  sub: string; // user id
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
