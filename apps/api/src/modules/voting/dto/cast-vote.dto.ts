import { IsUUID } from "class-validator";

export class CastVoteDto {
  @IsUUID()
  submissionId!: string;
}
