import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { RoundJobPayload, RoundStateMachineService } from "../round-state-machine.service";

@Processor("rounds")
export class RoundsProcessor extends WorkerHost {
  private readonly logger = new Logger(RoundsProcessor.name);

  constructor(private readonly stateMachine: RoundStateMachineService) {
    super();
  }

  async process(job: Job<RoundJobPayload>): Promise<void> {
    switch (job.name) {
      case "close-round":
        await this.stateMachine.closeRound(job.data.roundId);
        break;
      case "reveal-deadline":
        await this.stateMachine.forceRevealDeadline(job.data.roundId);
        break;
      default:
        this.logger.warn(`Unknown job name on 'rounds' queue: ${job.name}`);
    }
  }
}
