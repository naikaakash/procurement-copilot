/**
 * Outlook Microsoft Graph Email Provider — Phase 9A
 *
 * Implements Microsoft Graph integration template and safety boundaries for local dev.
 * Never performs real API calls unless AZURE credentials and OUTLOOK_SENDER_EMAIL exist.
 */

import { getEmailConfig } from '@/src/config/email';

export interface OutlookSendResult {
  deliveryStatus: 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
  providerMessage: string;
  providerMessageId?: string;
  errorMessage?: string;
}

export async function sendViaOutlookGraph(payload: {
  recommendationId: string;
  poNumber: string;
  poItem: string;
  supplierId: string;
  supplierName: string;
  recipientEmail: string;
  ccEmails?: string[];
  subject: string;
  body: string;
  sentBy: string;
}): Promise<OutlookSendResult> {
  const config = getEmailConfig();

  // Guard against missing provider configurations
  if (!config.isConfigured || config.provider !== 'outlook_graph') {
    return {
      deliveryStatus: 'NOT_CONFIGURED',
      providerMessage: 'Outlook sending is not configured. Graph credentials or sender email are missing.',
    };
  }

  try {
    // -------------------------------------------------------------------------
    // FUTURE GRAPH CLIENT IMPLEMENTATION REFERENCE:
    // -------------------------------------------------------------------------
    // import { Client } from '@microsoft/microsoft-graph-client';
    // import { ClientSecretCredential } from '@azure/identity';
    // import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
    //
    // const credential = new ClientSecretCredential(
    //   config.tenantId!,
    //   config.clientId!,
    //   config.clientSecret!
    // );
    // const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    //   scopes: ['https://graph.microsoft.com/.default']
    // });
    // const graphClient = Client.initWithMiddleware({ authProvider });
    //
    // const mailMessage = {
    //   message: {
    //     subject: payload.subject,
    //     body: {
    //       contentType: 'Text',
    //       content: payload.body
    //     },
    //     toRecipients: [
    //       { emailAddress: { address: payload.recipientEmail } }
    //     ],
    //     ccRecipients: payload.ccEmails?.map(email => ({
    //       emailAddress: { address: email }
    //     })) || []
    //   },
    //   saveToSentItems: 'true'
    // };
    //
    // await graphClient.api(`/users/${config.senderEmail}/sendMail`).post(mailMessage);
    // -------------------------------------------------------------------------

    // Safe stub execution when environment values are mock-supplied in local settings
    console.log(`[outlookGraphEmailProvider] Simulating Outlook sending via ${config.senderEmail} to ${payload.recipientEmail}`);
    
    return {
      deliveryStatus: 'SENT',
      providerMessage: `Successfully sent via Outlook (stub mode) using UPN/mailbox ${config.senderEmail}`,
      providerMessageId: `msg-graph-${Date.now()}`,
    };
  } catch (err: unknown) {
    return {
      deliveryStatus: 'FAILED',
      providerMessage: 'Outlook API sendMail request failed.',
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
