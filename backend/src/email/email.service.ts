import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { WelcomeEmailDto } from './dto/welcome-email.dto';
import { KycEmailDto } from './dto/kyc-email.dto';
import { ResetPasswordEmailDto } from './dto/reset-password-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor() {
    // Initialize Resend with API key from environment variables
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment variables');
    }
    this.resend = new Resend(apiKey);
  }

  async sendWelcomeEmail(
    welcomeEmailDto: WelcomeEmailDto,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Extract first name from full name
      const firstName = welcomeEmailDto.fullName.split(' ')[0];

      // Resolve company name from environment
      const companyNameFromEnv = process.env.COMPANY_NAME;
      if (!companyNameFromEnv) {
        this.logger.warn('COMPANY_NAME not found in environment variables');
      }
      const companyName = companyNameFromEnv ?? 'Your Company';

      // Create the email content using the template
      const htmlContent = this.generateWelcomeEmailHtml(
        firstName,
        welcomeEmailDto.fullName,
        welcomeEmailDto.email,
        welcomeEmailDto.accountId,
        companyName,
        welcomeEmailDto.loginUrl,
        welcomeEmailDto.password,
      );

      const textContent = this.generateWelcomeEmailText(
        firstName,
        welcomeEmailDto.fullName,
        welcomeEmailDto.email,
        welcomeEmailDto.accountId,
        companyName,
        welcomeEmailDto.loginUrl,
        welcomeEmailDto.password,
      );

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: 'noreply@transbridgeusa.com',
        to: [welcomeEmailDto.email],
        subject: `Welcome to ${companyName} - Your Account is Ready!`,
        html: htmlContent,
        text: textContent,
        replyTo: 'support@transbridgeusa.com',
      });

      // Handle Resend response properly
      if (result.error) {
        let errorMessage = 'Unknown error occurred';
        if (typeof result.error === 'object' && result.error !== null) {
          const maybeMessage = (result.error as { message?: unknown }).message;
          if (typeof maybeMessage === 'string') {
            errorMessage = maybeMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const messageId = result.data?.id;
      this.logger.log(
        `Welcome email sent successfully to ${welcomeEmailDto.email}. Message ID: ${messageId}`,
      );

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${welcomeEmailDto.email}:`,
        error,
      );

      return {
        success: false,
        error: (error as Error).message || 'Failed to send email',
      };
    }
  }

  async sendKycEmail(
    kycEmailDto: KycEmailDto,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Resolve company name from environment
      const companyNameFromEnv = process.env.COMPANY_NAME;
      if (!companyNameFromEnv) {
        this.logger.warn('COMPANY_NAME not found in environment variables');
      }
      const companyName = companyNameFromEnv ?? 'Your Company';

      // Create the email content using the template
      const htmlContent = this.generateKycEmailHtml(
        kycEmailDto.email,
        companyName,
        kycEmailDto.termsOfServiceUrl,
        kycEmailDto.customerDetailsUrl,
      );

      const textContent = this.generateKycEmailText(
        kycEmailDto.email,
        companyName,
        kycEmailDto.termsOfServiceUrl,
        kycEmailDto.customerDetailsUrl,
      );

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: 'noreply@transbridgeusa.com',
        to: [kycEmailDto.email],
        subject: `Complete Your KYC Process - ${companyName}`,
        html: htmlContent,
        text: textContent,
        replyTo: 'support@transbridgeusa.com',
      });

      // Handle Resend response properly
      if (result.error) {
        let errorMessage = 'Unknown error occurred';
        if (typeof result.error === 'object' && result.error !== null) {
          const maybeMessage = (result.error as { message?: unknown }).message;
          if (typeof maybeMessage === 'string') {
            errorMessage = maybeMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const messageId = result.data?.id;
      this.logger.log(
        `KYC email sent successfully to ${kycEmailDto.email}. Message ID: ${messageId}`,
      );

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send KYC email to ${kycEmailDto.email}:`,
        error,
      );

      return {
        success: false,
        error: (error as Error).message || 'Failed to send email',
      };
    }
  }

  private generateWelcomeEmailHtml(
    firstName: string,
    fullName: string,
    email: string,
    accountId: string,
    companyName: string,
    loginUrl: string,
    password: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .account-details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .cta-button { display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .support { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to ${companyName}!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${firstName},</p>
          
          <p>Welcome to ${companyName}! Your account is now active and ready to use.</p>
          
          <div class="account-details">
            <h3>Account Details:</h3>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Account ID:</strong> ${accountId}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <p>You can log in any time at: <a href="${loginUrl}">${loginUrl}</a></p>
          
          <a href="${loginUrl}" class="cta-button">Login to Your Account</a>
          
          <div class="support">
            <p><strong>Important:</strong> If you didn't create this account or believe this was done in error, please contact our support team immediately at <a href="mailto:support@transbridgeusa.com">support@transbridgeusa.com</a></p>
          </div>
          
          <p>We're excited to have you with us!</p>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(
    firstName: string,
    fullName: string,
    email: string,
    accountId: string,
    companyName: string,
    loginUrl: string,
    password: string,
  ): string {
    return `
Hi ${firstName},

Welcome to ${companyName}! Your account is now active and ready to use.

Account Details:
Name: ${fullName}
Email: ${email}
Account ID: ${accountId}
Password: ${password}

You can log in any time at: ${loginUrl}

If you didn't create this account or believe this was done in error, please contact our support team immediately at support@transbridgeusa.com

We're excited to have you with us!

Best regards,
The ${companyName} Team
    `;
  }

  private generateKycEmailHtml(
    email: string,
    companyName: string,
    termsOfServiceUrl: string,
    customerDetailsUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your KYC Process - ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .action-buttons { margin: 30px 0; text-align: center; }
          .cta-button { display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px; font-weight: bold; }
          .cta-button.secondary { background-color: #6c757d; }
          .cta-button:hover { opacity: 0.9; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .important { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .steps { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .step { margin: 10px 0; padding: 10px; background-color: #ffffff; border-radius: 3px; border-left: 4px solid #007bff; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Complete Your KYC Process</h1>
          <p>${companyName}</p>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          
          <p>Thank you for choosing ${companyName}! To complete your account setup and ensure compliance with regulatory requirements, please complete the following steps:</p>
          
          <div class="steps">
            <h3>Required Actions:</h3>
            <div class="step">
              <strong>Step 1:</strong> Accept our Terms of Service
              <br><small>Please review and accept our terms of service to continue using our platform.</small>
            </div>
            <div class="step">
              <strong>Step 2:</strong> Complete Customer Details for KYC
              <br><small>Provide the necessary information for Know Your Customer (KYC) verification.</small>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${termsOfServiceUrl}" class="cta-button">Accept Terms of Service</a>
            <a href="${customerDetailsUrl}" class="cta-button secondary">Add Customer Details</a>
          </div>
          
          <div class="important">
            <p><strong>Important:</strong> You must complete both steps to fully activate your account and access all features of our platform.</p>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@transbridgeusa.com">support@transbridgeusa.com</a>.</p>
          
          <p>We look forward to serving you!</p>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateKycEmailText(
    email: string,
    companyName: string,
    termsOfServiceUrl: string,
    customerDetailsUrl: string,
  ): string {
    return `
Hello,

Thank you for choosing ${companyName}! To complete your account setup and ensure compliance with regulatory requirements, please complete the following steps:

REQUIRED ACTIONS:

Step 1: Accept our Terms of Service
Please review and accept our terms of service to continue using our platform.
Link: ${termsOfServiceUrl}

Step 2: Complete Customer Details for KYC
Provide the necessary information for Know Your Customer (KYC) verification.
Link: ${customerDetailsUrl}

IMPORTANT: You must complete both steps to fully activate your account and access all features of our platform.

If you have any questions or need assistance, please don't hesitate to contact our support team at support@transbridgeusa.com.

We look forward to serving you!

Best regards,
The ${companyName} Team
    `;
  }

  async sendResetPasswordEmail(
    resetPasswordEmailDto: ResetPasswordEmailDto,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Resolve company name from environment
      const companyNameFromEnv = process.env.COMPANY_NAME;
      if (!companyNameFromEnv) {
        this.logger.warn('COMPANY_NAME not found in environment variables');
      }
      const companyName = companyNameFromEnv ?? 'Your Company';

      // Create the email content using the template
      const htmlContent = this.generateResetPasswordEmailHtml(
        resetPasswordEmailDto.email,
        companyName,
        resetPasswordEmailDto.resetLink,
      );

      const textContent = this.generateResetPasswordEmailText(
        resetPasswordEmailDto.email,
        companyName,
        resetPasswordEmailDto.resetLink,
      );

      // Send email using Resend
      const result = await this.resend.emails.send({
        from: 'noreply@transbridgeusa.com',
        to: [resetPasswordEmailDto.email],
        subject: `Reset Your Password - ${companyName}`,
        html: htmlContent,
        text: textContent,
        replyTo: 'support@transbridgeusa.com',
      });

      // Handle Resend response properly
      if (result.error) {
        let errorMessage = 'Unknown error occurred';
        if (typeof result.error === 'object' && result.error !== null) {
          const maybeMessage = (result.error as { message?: unknown }).message;
          if (typeof maybeMessage === 'string') {
            errorMessage = maybeMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const messageId = result.data?.id;
      this.logger.log(
        `Reset password email sent successfully to ${resetPasswordEmailDto.email}. Message ID: ${messageId}`,
      );

      return {
        success: true,
        messageId: messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${resetPasswordEmailDto.email}:`,
        error,
      );

      return {
        success: false,
        error: (error as Error).message || 'Failed to send email',
      };
    }
  }

  private generateResetPasswordEmailHtml(
    email: string,
    companyName: string,
    resetLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .cta-button { display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .link-fallback { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          
          <p>We received a request to reset your password for your ${companyName} account (${email}).</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="cta-button">Reset Password</a>
          </div>
          
          <div class="link-fallback">
            <p><strong>Or copy and paste this link into your browser:</strong></p>
            <p>${resetLink}</p>
          </div>
          
          <div class="warning">
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire after you use it once</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>For security reasons, this link is only valid for a limited time</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:support@transbridgeusa.com">support@transbridgeusa.com</a>.</p>
        </div>
        
        <div class="footer">
          <p>Best regards,<br>The ${companyName} Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateResetPasswordEmailText(
    email: string,
    companyName: string,
    resetLink: string,
  ): string {
    return `
Hello,

We received a request to reset your password for your ${companyName} account (${email}).

Click the link below to reset your password:
${resetLink}

IMPORTANT:
- This link will expire after you use it once
- If you didn't request a password reset, please ignore this email
- For security reasons, this link is only valid for a limited time

If you have any questions or need assistance, please contact our support team at support@transbridgeusa.com.

Best regards,
The ${companyName} Team
    `;
  }
}
