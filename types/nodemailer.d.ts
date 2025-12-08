declare module "nodemailer" {
  import type { TransportOptions, SentMessageInfo } from "nodemailer/lib/smtp-transport";
  export type { TransportOptions, SentMessageInfo };

  export interface MailOptions {
    from?: string;
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(mail: MailOptions): Promise<SentMessageInfo>;
  }

  export function createTransport(options: TransportOptions): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
