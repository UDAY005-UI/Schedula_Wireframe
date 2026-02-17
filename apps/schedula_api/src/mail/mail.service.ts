import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendOtpEmail(receiversEmail: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Auth Service" <${process.env.MAIL_USER}>`,
      to: [`${receiversEmail}`],
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
