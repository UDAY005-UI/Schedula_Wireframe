import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(`${process.env.RESEND_API_KEY}`);

  async sendOtpEmail(receiversEmail: string, otp: string) {
    await this.resend.emails.send({
      from: 'Auth Service <onboarding@resend.dev>', 
      to: receiversEmail,
      subject: 'Your OTP Code',
      html: `
        <h2>Verification Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Expires in 5 minutes.</p>
      `,
    });
  }
}