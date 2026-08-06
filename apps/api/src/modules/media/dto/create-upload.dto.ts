import { IsUUID } from "class-validator";

export class CreateUploadDto {
  @IsUUID()
  submissionId!: string;
}
