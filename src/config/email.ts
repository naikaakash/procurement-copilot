/**
 * Email Mode Configuration Layer — Phase 9A
 *
 * Configures the communication channel provider.
 * Supports:
 *   - 'mock': Logs reminders locally on disk. Default mode.
 *   - 'outlook_graph': Microsoft Graph API client for future Outlook integration.
 */

export interface EmailConfig {
  provider: 'mock' | 'outlook_graph';
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  senderEmail?: string;
  isConfigured: boolean;
}

export function getEmailConfig(): EmailConfig {
  const providerRaw = process.env.EMAIL_PROVIDER || 'mock';
  const provider = providerRaw.toLowerCase() === 'outlook_graph' ? 'outlook_graph' : 'mock';

  if (provider === 'outlook_graph') {
    const tenantId = process.env.AZURE_TENANT_ID?.trim();
    const clientId = process.env.AZURE_CLIENT_ID?.trim();
    const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim();
    const senderEmail = (process.env.OUTLOOK_SENDER_EMAIL || process.env.OUTLOOK_SENDER_UPN)?.trim();

    // Verify all required parameters are present and non-empty
    const isConfigured = !!(tenantId && clientId && clientSecret && senderEmail);

    return {
      provider: 'outlook_graph',
      tenantId,
      clientId,
      clientSecret,
      senderEmail,
      isConfigured,
    };
  }

  return {
    provider: 'mock',
    isConfigured: true,
  };
}
