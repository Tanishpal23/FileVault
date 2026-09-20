export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log('\n================== 📧 OUTGOING EMAIL (DEV) ==================');
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('------------------------------------------------------------');
    console.log(options.text || options.html.replace(/<[^>]*>?/gm, ' '));
    console.log('============================================================\n');
    return true;
  }
}

export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    // Default to Console provider for dev; easily swappable with Resend/SendGrid/SES
    this.provider = new ConsoleEmailProvider();
  }

  setProvider(provider: IEmailProvider) {
    this.provider = provider;
  }

  async sendFileSharedNotification(params: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    fileName: string;
    role: string;
    fileUrl: string;
  }) {
    const subject = `${params.senderName} shared "${params.fileName}" with you on FileVault`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">FileVault Collaboration</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.senderName}</strong> has shared the file <strong>"${params.fileName}"</strong> with you with <strong>${params.role}</strong> access.</p>
        <div style="margin: 28px 0;">
          <a href="${params.fileUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Open File in FileVault
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't expect this, you can safely ignore this email.</p>
      </div>
    `;

    return this.provider.sendEmail({
      to: params.recipientEmail,
      subject,
      html,
    });
  }

  async sendCommentNotification(params: {
    recipientEmail: string;
    recipientName: string;
    commenterName: string;
    fileName: string;
    commentContent: string;
    fileUrl: string;
  }) {
    const subject = `New comment from ${params.commenterName} on "${params.fileName}"`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">New Comment on FileVault</h2>
        <p>Hi ${params.recipientName},</p>
        <p><strong>${params.commenterName}</strong> left a comment on <strong>"${params.fileName}"</strong>:</p>
        <blockquote style="border-left: 4px solid #6366f1; padding-left: 12px; margin: 16px 0; color: #334155; font-style: italic;">
          ${params.commentContent}
        </blockquote>
        <div style="margin: 28px 0;">
          <a href="${params.fileUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            View and Reply
          </a>
        </div>
      </div>
    `;

    return this.provider.sendEmail({
      to: params.recipientEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
