import "dotenv/config";
import { sendDiagnosticMail } from "../services/mailService.js";

const recipient = process.argv[2] || process.env.MAIL_TEST_TO || process.env.SMTP_USER;

if (!recipient) {
  console.error("[mail:check] Missing recipient. Pass an email argument or set MAIL_TEST_TO/SMTP_USER.");
  process.exit(1);
}

const result = await sendDiagnosticMail(recipient);

if (result?.failed || result?.skipped) {
  console.error("[mail:check] failed", JSON.stringify(result, null, 2));
  process.exit(1);
}

console.info("[mail:check] success", JSON.stringify({
  accepted: result.accepted,
  rejected: result.rejected,
  response: result.response,
  messageId: result.messageId,
}, null, 2));
