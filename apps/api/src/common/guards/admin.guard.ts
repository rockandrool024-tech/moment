import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthenticatedRequest } from "../types/authenticated-request";

// Composed on top of JwtAuthGuard (never standing in for it) — checks the
// already-authenticated user's phone against ADMIN_PHONE_NUMBERS. No admin
// flag on the User model: reviewed manually via env/redeploy, not
// self-service, since this is the one gate with no downstream check behind it.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const allowlist = this.config.get<string[]>("adminPhoneNumbers") ?? [];
    if (!request.user || !allowlist.includes(request.user.phone)) {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}
