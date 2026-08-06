import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Twilio } from "twilio";

// Thin wrapper around Twilio Verify. Reads credentials from env on every
// call rather than at construction, so the app boots fine without them —
// this only throws when someone actually tries to send/verify an OTP with
// no provider configured, per the "stub with env-var config" decision.
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly config: ConfigService) {}

  private getClient(): { client: Twilio; verifyServiceSid: string } {
    const accountSid = this.config.get<string>("twilio.accountSid");
    const authToken = this.config.get<string>("twilio.authToken");
    const verifyServiceSid = this.config.get<string>("twilio.verifyServiceSid");

    if (!accountSid || !authToken || !verifyServiceSid) {
      throw new InternalServerErrorException(
        "Phone verification is not configured (TWILIO_* env vars missing)",
      );
    }

    return { client: new Twilio(accountSid, authToken), verifyServiceSid };
  }

  async sendCode(phone: string): Promise<void> {
    const { client, verifyServiceSid } = this.getClient();
    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: phone, channel: "sms" });
    this.logger.log(`OTP sent to ${phone}`);
  }

  async checkCode(phone: string, code: string): Promise<boolean> {
    const { client, verifyServiceSid } = this.getClient();
    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: phone, code });
    return check.status === "approved";
  }
}
