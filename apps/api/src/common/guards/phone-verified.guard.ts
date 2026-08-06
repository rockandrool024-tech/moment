import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthenticatedRequest } from "../types/authenticated-request";

// Gates voting endpoints on phone-OTP verification per ADR-001 action item 5.
// Must run after JwtAuthGuard (relies on request.user being populated).
@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.phoneVerifiedAt) {
      throw new ForbiddenException("Phone verification is required to vote");
    }

    return true;
  }
}
