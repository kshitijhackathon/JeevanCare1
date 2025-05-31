import nodemailer from 'nodemailer';

// Email service for sending OTP codes
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'JeevanCare - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #60a5fa, #34d399); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">JeevanCare</h1>
            <p style="color: white; margin: 10px 0 0 0;">Your Healthcare Companion</p>
          </div>
          
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Verify Your Email</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Welcome to JeevanCare! Please use the verification code below to complete your registration:
            </p>
            
            <div style="background: #f8fafc; border: 2px dashed #60a5fa; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
              <h1 style="color: #60a5fa; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 JeevanCare. Your health, our commitment.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();