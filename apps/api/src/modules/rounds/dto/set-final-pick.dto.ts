import { IsUUID } from "class-validator";

export class SetFinalPickDto {
  @IsUUID()
  submissionId!: string;
}
