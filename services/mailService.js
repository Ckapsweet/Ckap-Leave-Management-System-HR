import nodemailer from "nodemailer";

const DEFAULT_OUTLOOK_HOST = "smtp.office365.com";
const DEFAULT_OUTLOOK_PORT = 587;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || DEFAULT_OUTLOOK_HOST;
  return {
    host,
    port: Number(process.env.SMTP_PORT || DEFAULT_OUTLOOK_PORT),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: normalizeSmtpPassword(process.env.SMTP_PASS, host),
    from: formatMailFrom(process.env.MAIL_FROM, process.env.SMTP_USER),
    enabled: process.env.MAIL_ENABLED !== "false",
    verifyBeforeSend: process.env.MAIL_VERIFY_BEFORE_SEND !== "false",
    timeout: Number(process.env.MAIL_TIMEOUT_MS || 15000),
  };
}

function normalizeSmtpPassword(pass, host) {
  if (!pass) return pass;
  if (host?.includes("gmail.com")) return pass.replace(/\s+/g, "");
  return pass;
}

function formatMailFrom(from, smtpUser) {
  const value = from?.trim();
  if (!value) return smtpUser;
  if (value.includes("@") || value.includes("<")) return value;
  return smtpUser ? `"${value.replaceAll('"', '\\"')}" <${smtpUser}>` : value;
}

function isConfigured(config) {
  return Boolean(config.enabled && config.host && config.port && Number.isFinite(config.port) && config.user && config.pass && config.from);
}

function isMailDebugEnabled() {
  return process.env.MAIL_DEBUG === "true" || process.env.NODE_ENV !== "production";
}

function missingConfigFields(config) {
  return [
    !config.enabled && "MAIL_ENABLED",
    !config.host && "SMTP_HOST",
    (!config.port || !Number.isFinite(config.port)) && "SMTP_PORT",
    !config.user && "SMTP_USER",
    !config.pass && "SMTP_PASS",
    !config.from && "MAIL_FROM",
  ].filter(Boolean);
}

function redactSmtpConfig(config) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    pass: config.pass ? "[set]" : "[missing]",
    from: config.from,
    enabled: config.enabled,
    verifyBeforeSend: config.verifyBeforeSend,
    timeout: config.timeout,
  };
}

function classifyMailError(error) {
  if (error.code === "EAUTH" || error.responseCode === 535) {
    return "smtp_auth_failed";
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(error.code)) {
    return "smtp_connection_failed";
  }
  if (error.code === "EENVELOPE" || error.responseCode === 550 || error.responseCode === 553) {
    return "invalid_sender_or_recipient";
  }
  return "smtp_send_failed";
}

function mailErrorHint(error) {
  const reason = classifyMailError(error);
  const hints = {
    smtp_auth_failed: "Check SMTP_USER and SMTP_PASS. For Gmail, use an App Password with 2-Step Verification enabled.",
    smtp_connection_failed: "Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, network access, and firewall rules.",
    invalid_sender_or_recipient: "Check MAIL_FROM and recipient email addresses.",
    smtp_send_failed: "Check the SMTP response and enable MAIL_DEBUG=true for stack details.",
  };
  return hints[reason];
}

function mailErrorDetails(error, stage = "send") {
  return {
    stage,
    reason: classifyMailError(error),
    hint: mailErrorHint(error),
    name: error.name,
    message: error.message,
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
    response: error.response,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port,
    stack: isMailDebugEnabled() ? error.stack : undefined,
  };
}

function createTransporter(config = getSmtpConfig()) {
  if (!isConfigured(config)) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: config.timeout,
    greetingTimeout: config.timeout,
    socketTimeout: config.timeout,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function requestUrl(requestId) {
  const baseUrl = process.env.FRONTEND_URL;
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin` : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRecipients(to) {
  const values = Array.isArray(to) ? to : [to];
  const recipients = [];
  const invalidRecipients = [];

  values.filter(Boolean).forEach((value) => {
    const email = String(value).trim();
    if (isValidEmail(email)) {
      recipients.push(email);
    } else {
      invalidRecipients.push(email);
    }
  });

  return {
    recipients: [...new Set(recipients)],
    invalidRecipients: [...new Set(invalidRecipients)],
  };
}

function recipientList(user) {
  return [...new Set([user?.email, user?.email_2].filter(Boolean))];
}

function leaveStatusLabel(status) {
  const labels = {
    pending: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
  };
  return labels[status] || status;
}

async function sendMail({ to, subject, html, text, context }) {
  const { recipients, invalidRecipients } = normalizeRecipients(to);
  if (invalidRecipients.length) {
    console.warn("[mail] skipped invalid recipient(s)", { invalidRecipients, context });
  }
  if (!recipients.length) {
    console.warn("[mail] skipped: no valid recipient", { originalTo: to, context });
    return { skipped: true, reason: "missing_recipient", invalidRecipients, context };
  }

  const config = getSmtpConfig();
  const transporter = createTransporter(config);
  if (!transporter || !isConfigured(config)) {
    const missingFields = missingConfigFields(config);
    console.warn("[mail] skipped: SMTP is not configured", {
      missingFields,
      config: isMailDebugEnabled() ? redactSmtpConfig(config) : undefined,
    });
    return { skipped: true, reason: "smtp_not_configured", missingFields };
  }

  if (config.verifyBeforeSend) {
    try {
      await transporter.verify();
    } catch (error) {
      const details = mailErrorDetails(error, "verify");
      console.error("[mail] SMTP verify failed:", {
        ...details,
        config: isMailDebugEnabled() ? redactSmtpConfig(config) : undefined,
      });
      return { failed: true, error: details };
    }
  }

  if (isMailDebugEnabled()) {
    console.info("[mail] sending", {
      to: recipients,
      subject,
      config: redactSmtpConfig(config),
    });
  }

  const result = await transporter.sendMail({
    from: config.from,
    to: recipients.join(","),
    subject,
    html,
    text,
  });
  console.info("[mail] sent", {
    accepted: result.accepted,
    rejected: result.rejected,
    response: result.response,
    messageId: result.messageId,
  });
  return result;
}

async function sendMailSafely(mail) {
  try {
    return await sendMail(mail);
  } catch (error) {
    const details = mailErrorDetails(error, "send");
    console.error("[mail] send failed:", details);
    return { failed: true, error: details };
  }
}

export async function sendDiagnosticMail(to) {
  const recipient = to || process.env.MAIL_TEST_TO || process.env.SMTP_USER;
  return sendMailSafely({
    to: recipient,
    subject: "[CKAP Leave] Mail diagnostic",
    html: `
      <p>CKAP Leave mail diagnostic completed.</p>
      <p>If you received this email, SMTP configuration and delivery are working.</p>
    `,
    text: "CKAP Leave mail diagnostic completed. If you received this email, SMTP configuration and delivery are working.",
  });
}

function leaveDetailsHtml(leaveRequest) {
  const unitText = leaveRequest.start_time
    ? `${escapeHtml(leaveRequest.start_time)} - ${escapeHtml(leaveRequest.end_time)}`
    : `${escapeHtml(formatDate(leaveRequest.start_date))} - ${escapeHtml(formatDate(leaveRequest.end_date))}`;

  return `
    <ul>
      <li><strong>Leave type:</strong> ${escapeHtml(leaveRequest.leave_type_name || leaveRequest.leave_type?.name)}</li>
      <li><strong>Date/time:</strong> ${unitText}</li>
      <li><strong>Total days:</strong> ${escapeHtml(leaveRequest.total_days)}</li>
      <li><strong>Reason:</strong> ${escapeHtml(leaveRequest.reason)}</li>
    </ul>
  `;
}

export async function notifyLeaveRequestCreated({ leaveRequest, requester, assignee }) {
  const recipients = recipientList(assignee);
  const link = requestUrl(leaveRequest.id);

  return sendMailSafely({
    to: recipients,
    subject: `[CKAP Leave] New leave request from ${requester.full_name || requester.employee_code}`,
    context: {
      notification: "leave_request_created",
      leaveRequestId: leaveRequest.id,
      recipientUser: assignee
        ? {
            full_name: assignee.full_name,
            employee_code: assignee.employee_code,
            email: assignee.email,
            email_2: assignee.email_2,
          }
        : null,
    },
    html: `
      <p>A new leave request is waiting for your review.</p>
      <p><strong>Requester:</strong> ${escapeHtml(requester.full_name || requester.employee_code)}</p>
      ${leaveDetailsHtml(leaveRequest)}
      ${link ? `<p><a href="${escapeHtml(link)}">Open leave management system</a></p>` : ""}
    `,
  });
}

export async function notifyLeaveRequestSubmitted({ leaveRequest, requester, status, assignee }) {
  const recipients = recipientList(requester);
  const statusLabel = leaveStatusLabel(status);
  const reviewerText = assignee
    ? `<p><strong>Current reviewer:</strong> ${escapeHtml(assignee.full_name || assignee.employee_code)}</p>`
    : "";

  return sendMailSafely({
    to: recipients,
    subject: `[CKAP Leave] Your leave request is ${statusLabel}`,
    context: {
      notification: "leave_request_submitted",
      leaveRequestId: leaveRequest.id,
      status,
      recipientUser: requester
        ? {
            full_name: requester.full_name,
            employee_code: requester.employee_code,
            email: requester.email,
            email_2: requester.email_2,
          }
        : null,
    },
    html: `
      <p>Your leave request has been submitted.</p>
      <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
      ${reviewerText}
      ${leaveDetailsHtml(leaveRequest)}
    `,
    text: [
      "Your leave request has been submitted.",
      `Status: ${statusLabel}`,
      assignee ? `Current reviewer: ${assignee.full_name || assignee.employee_code}` : "",
      `Leave type: ${leaveRequest.leave_type_name || leaveRequest.leave_type?.name || "-"}`,
      `Total days: ${leaveRequest.total_days ?? "-"}`,
      `Reason: ${leaveRequest.reason ?? "-"}`,
    ].filter(Boolean).join("\n"),
  });
}

export async function notifyLeaveRequestForwarded({ leaveRequest, requester, assignee, approver, comment }) {
  const recipients = recipientList(assignee);
  const link = requestUrl(leaveRequest.id);

  return sendMailSafely({
    to: recipients,
    subject: `[CKAP Leave] Leave request forwarded for approval`,
    context: {
      notification: "leave_request_forwarded",
      leaveRequestId: leaveRequest.id,
      recipientUser: assignee
        ? {
            full_name: assignee.full_name,
            employee_code: assignee.employee_code,
            email: assignee.email,
            email_2: assignee.email_2,
          }
        : null,
    },
    html: `
      <p>A leave request has been forwarded to you for the next approval step.</p>
      <p><strong>Requester:</strong> ${escapeHtml(requester.full_name || requester.employee_code)}</p>
      <p><strong>Previous approver:</strong> ${escapeHtml(approver.full_name || approver.employee_code)}</p>
      ${comment ? `<p><strong>Comment:</strong> ${escapeHtml(comment)}</p>` : ""}
      ${leaveDetailsHtml(leaveRequest)}
      ${link ? `<p><a href="${escapeHtml(link)}">Open leave management system</a></p>` : ""}
    `,
  });
}

export async function notifyLeaveRequestResolved({ leaveRequest, requester, approver, status, comment }) {
  const recipients = recipientList(requester);

  return sendMailSafely({
    to: recipients,
    subject: `[CKAP Leave] Your leave request was ${status}`,
    context: {
      notification: "leave_request_resolved",
      leaveRequestId: leaveRequest.id,
      recipientUser: requester
        ? {
            full_name: requester.full_name,
            employee_code: requester.employee_code,
            email: requester.email,
            email_2: requester.email_2,
          }
        : null,
    },
    html: `
      <p>Your leave request was <strong>${escapeHtml(status)}</strong>.</p>
      <p><strong>Approver:</strong> ${escapeHtml(approver.full_name || approver.employee_code)}</p>
      ${comment ? `<p><strong>Comment:</strong> ${escapeHtml(comment)}</p>` : ""}
      ${leaveDetailsHtml(leaveRequest)}
    `,
  });
}
