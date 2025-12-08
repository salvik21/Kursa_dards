import nodemailer, { Transporter } from "nodemailer";

const SMTP_URL = process.env.EMAIL_SMTP_URL;
const DEFAULT_FROM = process.env.EMAIL_FROM || "no-reply@lost-and-found";

let transporter: Transporter | null = null;

function ensureTransporter() {
  if (!SMTP_URL) {
    throw new Error("EMAIL_SMTP_URL is not configured");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_URL);
  }
  return transporter;
}

export function buildPostUrl(id: string) {
  const base =
    process.env.PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/posts/${id}`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const mailer = ensureTransporter();
  await mailer.sendMail({
    from: DEFAULT_FROM,
    ...params,
  });
}
