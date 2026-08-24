import { Module } from "@nestjs/common";
import { ProfilesModule } from "../profiles/profiles.module";
import { UsersModule } from "../users/users.module";
import { AdminHostApplicationsController } from "./admin-host-applications.controller";
import { HostApplicationsService } from "./host-applications.service";
import { HostsController } from "./hosts.controller";

/**
 * Hosts module.
 *
 * Owns the durable Host application/review lifecycle. Administrative review
 * endpoints live here at the API/domain level; the future Admin Dashboard
 * consumes them without changes to this module.
 */
@Module({
  imports: [UsersModule, ProfilesModule],
  controllers: [HostsController, AdminHostApplicationsController],
  providers: [HostApplicationsService],
  exports: [HostApplicationsService],
})
export class HostsModule {}
