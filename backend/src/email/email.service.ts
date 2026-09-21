import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

export class NodemailerEmailProvider implements IEmailProvider {
  private transporter: any = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      console.log(`📧 Nodemailer SMTP initialized: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: env.SMTP_USER ? `FileVault <${env.SMTP_USER}>` : env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`📧 Email sent successfully to ${options.to} via SMTP`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email via SMTP to ${options.to}:`, error);
      return false;
    }
  }
}

export class ResendEmailProvider implements IEmailProvider {
  constructor(private apiKey: string, private from: string) {
    console.log("📧 Resend HTTPS Email Provider initialized (Port 443)");
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: env.SMTP_USER || undefined,
        }),
      });

      const data: any = await response.json();
      if (!response.ok) {
        console.error("❌ Resend API error:", data);
        return false;
      }
      console.log(`📧 Email sent successfully to ${options.to} via Resend (ID: ${data.id})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email via Resend to ${options.to}:`, error);
      return false;
    }
  }
}

export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log("\n================== 📧 OUTGOING EMAIL (DEV CONSOLE) ==================");
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log("------------------------------------------------------------");
    console.log(options.text || options.html.replace(/<[^>]*>?/gm, " "));
    console.log("============================================================\n");
    return true;
  }
}

export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.provider = new ResendEmailProvider(env.RESEND_API_KEY, env.RESEND_FROM);
    } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.provider = new NodemailerEmailProvider();
    } else {
      console.log("📧 Using Console Email Provider (Set RESEND_API_KEY or SMTP_HOST in .env for real delivery)");
      this.provider = new ConsoleEmailProvider();
    }
  }

  setProvider(provider: IEmailProvider) {
    this.provider = provider;
  }

  async sendPasswordResetOtp(params: {
    recipientEmail: string;
    recipientName?: string;
    otp: string;
  }) {
    const subject = `Your FileVault Password Reset Code: ${params.otp}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #4f46e5; color: #ffffff; font-weight: bold; font-size: 20px; padding: 10px 18px; border-radius: 10px;">
            FileVault
          </div>
        </div>
        <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 20px; font-weight: 700; text-align: center;">
          Password Reset Verification
        </h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
          Hi ${params.recipientName || "there"}, you requested to reset your FileVault account password. Use the verification code below:
        </p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5;">
            ${params.otp}
          </span>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">
            Valid for 10 minutes • Do not share this code with anyone
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;

    return this.provider.sendEmail({
      to: params.recipientEmail,
      subject,
      html,
      text: `Your FileVault verification code is: ${params.otp}. It expires in 10 minutes.`,
    });
  }
}

export const emailService = new EmailService();
