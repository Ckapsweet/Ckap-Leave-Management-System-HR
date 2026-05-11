import nodemailer from "nodemailer";

const DEFAULT_OUTLOOK_HOST = "smtp.office365.com";
const DEFAULT_OUTLOOK_PORT = 587;

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || DEFAULT_OUTLOOK_HOST,
    port: Number(process.env.SMTP_PORT || DEFAULT_OUTLOOK_PORT),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    enabled: process.env.MAIL_ENABLED !== "false",
  };
}

function isConfigured(config) {
  return Boolean(config.enabled && config.host && config.port && config.user && config.pass && config.from);
}

function isMailDebugEnabled() {
  return process.env.MAIL_DEBUG === "true" || process.env.NODE_ENV !== "production";
}

function missingConfigFields(config) {
  return [
    !config.enabled && "MAIL_ENABLED",
    !config.host && "SMTP_HOST",
    !config.port && "SMTP_PORT",
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
    testTo: process.env.MAIL_TEST_TO || "",
  };
}

function mailErrorDetails(error) {
  return {
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

function createTransporter() {
  const config = getSmtpConfig();
  if (!isConfigured(config)) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
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

function recipientList(user) {
  return [...new Set([user?.email, user?.email_2].filter(Boolean))];
}

async function sendMail({ to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const testRecipients = recipientList({
    email: process.env.MAIL_TEST_TO,
  });
  const deliveryRecipients = testRecipients.length ? testRecipients : recipients;
  if (!deliveryRecipients.length) return { skipped: true, reason: "missing_recipient" };

  const config = getSmtpConfig();
  const transporter = createTransporter();
  if (!transporter || !isConfigured(config)) {
    const missingFields = missingConfigFields(config);
    console.warn("[mail] skipped: SMTP is not configured", {
      missingFields,
      config: isMailDebugEnabled() ? redactSmtpConfig(config) : undefined,
    });
    return { skipped: true, reason: "smtp_not_configured", missingFields };
  }

  if (isMailDebugEnabled()) {
    console.info("[mail] sending", {
      to: deliveryRecipients,
      originalTo: recipients,
      subject,
      config: redactSmtpConfig(config),
    });
  }

  return transporter.sendMail({
    from: config.from,
    to: deliveryRecipients.join(","),
    subject,
    html,
    text,
  });
}

async function sendMailSafely(mail) {
  try {
    return await sendMail(mail);
  } catch (error) {
    const details = mailErrorDetails(error);
    console.error("[mail] send failed:", details);
    return { failed: true, error: details };
  }
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
    html: `
      <p>A new leave request is waiting for your review.</p>
      <p><strong>Requester:</strong> ${escapeHtml(requester.full_name || requester.employee_code)}</p>
      ${leaveDetailsHtml(leaveRequest)}
      ${link ? `<p><a href="${escapeHtml(link)}">Open leave management system</a></p>` : ""}
    `,
  });
}

export async function notifyLeaveRequestForwarded({ leaveRequest, requester, assignee, approver, comment }) {
  const recipients = recipientList(assignee);
  const link = requestUrl(leaveRequest.id);

  return sendMailSafely({
    to: recipients,
    subject: `[CKAP Leave] Leave request forwarded for approval`,
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
    html: `
      <p>Your leave request was <strong>${escapeHtml(status)}</strong>.</p>
      <p><strong>Approver:</strong> ${escapeHtml(approver.full_name || approver.employee_code)}</p>
      ${comment ? `<p><strong>Comment:</strong> ${escapeHtml(comment)}</p>` : ""}
      ${leaveDetailsHtml(leaveRequest)}
    `,
  });
}
