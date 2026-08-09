export default () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000", 10),
  // Public URL of the web app — used for Stripe Connect onboarding redirect
  // links (never called from the browser, so no CORS implications).
  appUrl: process.env.APP_URL ?? "http://localhost:3001",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
  // Admin allowlist by phone number (E.164) — see admin.guard.ts. No admin
  // role in the User model on purpose: this is reviewed manually via env,
  // not self-service, since it's the one gate with no downstream check.
  adminPhoneNumbers: (process.env.ADMIN_PHONE_NUMBERS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  mux: {
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
    webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },
  rounds: {
    // ADR-003: results reveal 2h after round close regardless of stragglers.
    revealDeadlineMs: 2 * 60 * 60 * 1000,
    // ADR-003 action item 2 / ADR-005 open question: participation-gate
    // minimum peer votes before a creator's own result unlocks.
    participationGateVotes: 8,
    // ADR-005 open question #1: non-participation penalty, still a
    // placeholder per the docs — tunable without a redeploy via env later.
    nonParticipationPenalty: 0.9,
    // README §economics: peer vote vs seller-score composite weighting.
    peerVoteWeight: 0.7,
    sellerScoreWeight: 0.3,
  },
});
