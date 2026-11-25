# Email Module

This module provides email functionality using the Resend service for sending welcome emails to new users.

## Setup

1. Set the `RESEND_API_KEY` environment variable with your Resend API key
2. Ensure the domain `noreply@transbridgeusa.com` is verified in your Resend account

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
      loginUrl: 'https://dashboard.originalaccounts.com/login'
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
 - `COMPANY_NAME`: Your company name shown in emails (required)

## Dependencies

- `resend`: ^6.0.1 (already installed)
- `@nestjs/common`: For NestJS decorators and functionality 