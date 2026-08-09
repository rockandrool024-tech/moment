import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminGuard } from "../../common/guards/admin.guard";
import { RoundsModule } from "../rounds/rounds.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [RoundsModule, IdentityModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
