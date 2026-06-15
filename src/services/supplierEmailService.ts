/**
 * Supplier Email Service — Phase 9A
 *
 * Boundary coordinator for sending supplier emails.
 * Validates inputs and routes execution to mock or Microsoft Graph providers.
 */

import { getEmailConfig } from '@/src/config/email';
import { sendViaOutlookGraph } from '@/src/services/emailProviders/outlookGraphEmailProvider';
import type {
  SupplierReminderSendMode,
  SupplierReminderDeliveryStatus,
} from '@/src/types/supplierCommunications';

export interface EmailSendPayload {
  recommendationId: string;
  poNumber: string;
  poItem: string;
  scheduleLine?: string;
  supplierId: string;
  supplierName: string;
  recipientEmail: string;
  ccEmails?: string[];
  subject: string;
  body: string;
  sentBy: string;
}

export interface EmailSendResult {
  sendMode: SupplierReminderSendMode;
  deliveryStatus: SupplierReminderDeliveryStatus;
  providerMessage: string;
  providerMessageId?: string;
  errorMessage?: string;
}

export async function sendSupplierReminderEmail(payload: EmailSendPayload): Promise<EmailSendResult> {
  // 1. Input Validation
  const emailTrimmed = payload.recipientEmail?.trim();
  if (!emailTrimmed || !emailTrimmed.includes('@')) {
    return {
      sendMode: 'MOCK',
      deliveryStatus: 'FAILED',
      providerMessage: 'Email sending failed: Invalid recipient email address.',
      errorMessage: 'Invalid recipient email address.',
    };
  }

  if (!payload.subject?.trim()) {
    return {
      sendMode: 'MOCK',
      deliveryStatus: 'FAILED',
      providerMessage: 'Email sending failed: Subject is required.',
      errorMessage: 'Subject is required.',
    };
  }

  if (!payload.body?.trim()) {
    return {
      sendMode: 'MOCK',
      deliveryStatus: 'FAILED',
      providerMessage: 'Email sending failed: Body text is required.',
      errorMessage: 'Body text is required.',
    };
  }

  // 2. Determine configuration mode
  const config = getEmailConfig();

  if (config.provider === 'outlook_graph') {
    if (!config.isConfigured) {
      return {
        sendMode: 'OUTLOOK_GRAPH',
        deliveryStatus: 'NOT_CONFIGURED',
        providerMessage: 'Outlook sending is not configured. Graph credentials or sender email are missing.',
      };
    }

    const graphResult = await sendViaOutlookGraph({
      recommendationId: payload.recommendationId,
      poNumber: payload.poNumber,
      poItem: payload.poItem,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      recipientEmail: emailTrimmed,
      ccEmails: payload.ccEmails,
      subject: payload.subject,
      body: payload.body,
      sentBy: payload.sentBy,
    });

    return {
      sendMode: 'OUTLOOK_GRAPH',
      deliveryStatus: graphResult.deliveryStatus,
      providerMessage: graphResult.providerMessage,
      providerMessageId: graphResult.providerMessageId,
      errorMessage: graphResult.errorMessage,
    };
  }

  // 3. Fallback to Mock Sending
  console.log(`[supplierEmailService] Mock sending email to ${emailTrimmed} subject: "${payload.subject}"`);
  
  return {
    sendMode: 'MOCK',
    deliveryStatus: 'MOCK_SENT',
    providerMessage: 'Mock send complete: reminder logged. No Outlook email was sent.',
  };
}
