# Email Module

This module provides email functionality using the Resend service for sending welcome emails to new users.

## Setup

1. Set the `RESEND_API_KEY` environment variable with your Resend API key
2. Set `EMAIL_FROM_ADDRESS` to an address on a domain verified in your Resend account

## Endpoints

None. The former `/email/*` HTTP endpoints were removed; inject `EmailService` (exported by `EmailModule`) instead.

## Email Template

The welcome email includes:
- Personalized greeting using the first name (extracted from fullName)
- Company name customization throughout the email
- Account details (name, email, account ID)
- Login URL with call-to-action button
- Support contact information
- Professional styling with HTML and plain text versions

## Usage Example

```typescript
import { EmailService } from './email/email.service';

@Injectable()
export class UserService {
  constructor(private readonly emailService: EmailService) {}

  async createUser(userData: CreateUserDto) {
    // Create user logic...
    
    // Send welcome email
    const emailResult = await this.emailService.sendWelcomeEmail({
      fullName: userData.fullName,
      email: userData.email,
      accountId: user.id,
      password: user.tempPassword,
      loginUrl: 'https://dashboard.example.com/login'
    });

    if (!emailResult.success) {
      // Handle email failure
      console.error('Failed to send welcome email:', emailResult.error);
    }
  }
}
```

## Environment Variables

- `RESEND_API_KEY`: Your Resend API key (required)
- `COMPANY_NAME`: company name shown in emails, Swagger and 2FA labels (default `Your Company`)
- `EMAIL_FROM_NAME`: sender display name (default: `COMPANY_NAME`)
- `EMAIL_FROM_ADDRESS`: sender address; must be on a Resend-verified domain (default `noreply@example.com`)
- `SUPPORT_EMAIL`: support contact shown in emails and used as reply-to (default `support@example.com`)
- `EMAIL_LOGO_URL`: optional logo shown in the email header
- `BRAND_PRIMARY_COLOR`: hex color for buttons and accents (default `#007bff`)
- `DASHBOARD_LOGIN_URL`: login link in the welcome email (default `http://localhost:5173/login`)

All of these are read by `src/config/brand.config.ts`.

## Dependencies

- `resend`: ^6.0.1 (already installed)
- `@nestjs/common`: For NestJS decorators and functionality 