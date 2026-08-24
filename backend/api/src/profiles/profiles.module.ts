import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

/**
 * Profiles module.
 *
 * Owns the Caller/Host subprofiles and legal acceptance records. The base
 * application profile (role, account status) remains owned by the users
 * module.
 */
@Module({
  imports: [UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
