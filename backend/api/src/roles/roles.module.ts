import { Module } from "@nestjs/common";
import { RolesService } from "./roles.service";

/**
 * Roles module.
 *
 * Centralizes the Caller/Host role model so it is not duplicated across auth,
 * users and future modules. Role values come from `@rndm/contracts` to keep
 * the backend and clients in sync.
 */
@Module({
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
