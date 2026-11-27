/**
 * White-label brand settings, read from the environment.
 *
 * Every value is read lazily (getters), so it reflects process.env at the time
 * of use rather than at import time. Unset or blank variables fall back to
 * neutral defaults; nothing here names a specific company.
 */

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DEFAULTS = {
  companyName: 'Your Company',
  emailFromAddress: 'noreply@example.com',
  supportEmail: 'support@example.com',
  dashboardLoginUrl: 'http://localhost:5173/login',
  primaryColor: '#007bff',
} as const;

const companyName = (): string =>
  readEnv('COMPANY_NAME') ?? DEFAULTS.companyName;
const emailFromName = (): string => readEnv('EMAIL_FROM_NAME') ?? companyName();
const emailFromAddress = (): string =>
  readEnv('EMAIL_FROM_ADDRESS') ?? DEFAULTS.emailFromAddress;
const dashboardLoginUrl = (): string =>
  readEnv('DASHBOARD_LOGIN_URL') ?? DEFAULTS.dashboardLoginUrl;

export const brand = {
  /** COMPANY_NAME */
  get companyName(): string {
    return companyName();
  },

  /** EMAIL_FROM_NAME (defaults to the company name) */
  get emailFromName(): string {
    return emailFromName();
  },

  /** EMAIL_FROM_ADDRESS. Must be on a domain verified in Resend for mail to send. */
  get emailFromAddress(): string {
    return emailFromAddress();
  },

  /** Value for the "from" header, e.g. `Acme <noreply@acme.com>`. */
  get emailFrom(): string {
    // Quotes and angle brackets in the display name would break the header.
    const name = emailFromName().replace(/["<>]/g, '');
    return `${name} <${emailFromAddress()}>`;
  },

  /** EMAIL_LOGO_URL. Optional; emails show no logo when unset. */
  get emailLogoUrl(): string | undefined {
    return readEnv('EMAIL_LOGO_URL');
  },

  /** DASHBOARD_LOGIN_URL */
  get dashboardLoginUrl(): string {
    return dashboardLoginUrl();
  },

  /** Origin of DASHBOARD_LOGIN_URL, used as the last-resort dashboard base URL. */
  get dashboardOrigin(): string {
    try {
      return new URL(dashboardLoginUrl()).origin;
    } catch {
      return new URL(DEFAULTS.dashboardLoginUrl).origin;
    }
  },

  /** SUPPORT_EMAIL (also used as the reply-to address) */
  get supportEmail(): string {
    return readEnv('SUPPORT_EMAIL') ?? DEFAULTS.supportEmail;
  },

  /** BRAND_PRIMARY_COLOR, a hex color such as #1a2b3c. Invalid values use the default. */
  get primaryColor(): string {
    const color = readEnv('BRAND_PRIMARY_COLOR');
    return color && HEX_COLOR.test(color) ? color : DEFAULTS.primaryColor;
  },

  /** True when COMPANY_NAME is set; lets callers warn about the generic default. */
  get isCompanyNameConfigured(): boolean {
    return readEnv('COMPANY_NAME') !== undefined;
  },
};
