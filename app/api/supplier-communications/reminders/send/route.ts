/**
 * POST /api/supplier-communications/reminders/send
 *
 * Dispatches a supplier reminder email.
 * - In mock mode, logs reminder and transitions recommendation to PENDING_SUPPLIER_RESPONSE.
 * - In Outlook Graph mode, runs credential validation, calls Graph client stub, and transitions on success.
 */

import { NextRequest } from 'next/server';
import * as recStore from '@/src/services/mockRecommendationStore';
import { sendSupplierReminderEmail } from '@/src/services/supplierEmailService';
import { createReminder } from '@/src/services/supplierCommunicationService';
import { SupplierCommunicationValidationError } from '@/src/types/supplierCommunications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: {
      recommendationId: string;
      recipientEmail?: string;
      ccEmails?: string[];
      subject: string;
      body: string;
      sentBy?: string;
    };

    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Basic body validations
    if (!body.recommendationId?.trim()) {
      return Response.json({ error: 'Missing required field: recommendationId' }, { status: 400 });
    }
    if (!body.subject?.trim()) {
      return Response.json({ error: 'Missing required field: subject' }, { status: 400 });
    }
    if (!body.body?.trim()) {
      return Response.json({ error: 'Missing required field: body' }, { status: 400 });
    }

    // 1. Load recommendation from database
    const recId = body.recommendationId.trim();
    let rec = recStore.getRecommendationById(recId);

    // Securely create fallback recommendation if it doesn't exist yet
    if (!rec && recId.startsWith('AR_FB_')) {
      const parts = recId.split('_');
      const poNumber = parts[2];
      const itemNumber = parts[3] || '00010';

      const { getRecommendationsForPurchaseOrderLine, createRecommendation } = await import('@/src/services/recommendationService');
      const dbRecs = await getRecommendationsForPurchaseOrderLine(poNumber, itemNumber);
      if (dbRecs && dbRecs.length > 0) {
        rec = dbRecs[0];
      } else {
        const { getPurchaseOrderLineDetailRaw } = await import('@/src/services/procurementDataService');
        const poLine = await getPurchaseOrderLineDetailRaw(poNumber, itemNumber, '0001');
        if (poLine) {
          console.log(`[POST /api/supplier-communications/reminders/send] Fallback creation: creating real recommendation for PO ${poNumber} item ${itemNumber}`);
          rec = await createRecommendation({
            sourceModule: 'OVERDUE_PO',
            purchaseOrderNumber: poNumber,
            purchaseOrderItem: itemNumber,
            supplierId: poLine.supplier_id,
            supplierName: poLine.supplier_name,
            recommendationType: 'SEND_SUPPLIER_REMINDER',
            issueReason: `PO line is overdue.`,
            recommendedActionText: `Send supplier reminder.`,
            lifecycleStatus: 'RECOMMENDED',
            currentOwner: 'BUYER',
            createdBy: 'local-user'
          });
        } else {
          console.warn(`[POST /api/supplier-communications/reminders/send] Fallback creation blocked: PO ${poNumber} item ${itemNumber} does not exist in source data.`);
        }
      }
    }

    if (!rec) {
      return Response.json({ error: `Recommendation "${body.recommendationId}" not found` }, { status: 404 });
    }

    // Block sending if recommendation is closed
    if (rec.lifecycleStatus === 'CONFIRMED_RESOLVED' || rec.lifecycleStatus === 'CLOSED_NO_ACTION') {
      return Response.json({ error: 'Cannot send reminder for a closed recommendation.' }, { status: 400 });
    }

    // 2. Resolve Supplier Contact email if not supplied by UI
    let recipientEmail = body.recipientEmail;
    if (recipientEmail === undefined) {
      const { getSupplierContactEmail } = await import('@/src/services/procurementDataService');
      recipientEmail = await getSupplierContactEmail(rec.supplierId);
    } else {
      recipientEmail = recipientEmail.trim();
    }

    if (!recipientEmail) {
      return Response.json({
        error: 'Cannot send reminder because supplier email is missing.',
        code: 'MISSING_EMAIL'
      }, { status: 400 });
    }

    const sentBy = body.sentBy?.trim() || 'local-user';

    // 3. Dispatch sending process via email coordinator
    const emailResult = await sendSupplierReminderEmail({
      recommendationId: rec.recommendationId,
      poNumber: rec.purchaseOrderNumber,
      poItem: rec.purchaseOrderItem,
      scheduleLine: rec.purchaseOrderItem ? '0001' : undefined,
      supplierId: rec.supplierId,
      supplierName: rec.supplierName,
      recipientEmail,
      ccEmails: body.ccEmails,
      subject: body.subject.trim(),
      body: body.body.trim(),
      sentBy,
    });

    // 4. Process delivery result
    if (
      emailResult.deliveryStatus === 'MOCK_SENT' ||
      emailResult.deliveryStatus === 'SENT' ||
      emailResult.deliveryStatus === 'LOGGED_ONLY'
    ) {
      // Persist the reminder record and transition recommendation lifecycle
      const reminderResult = await createReminder({
        recommendationId: rec.recommendationId,
        purchaseOrderNumber: rec.purchaseOrderNumber,
        purchaseOrderItem: rec.purchaseOrderItem,
        supplierId: rec.supplierId,
        supplierName: rec.supplierName,
        supplierEmail: recipientEmail,
        channel: 'EMAIL',
        subject: body.subject.trim(),
        bodyText: body.body.trim(),
        createdBy: sentBy,
        
        // Pass metadata fields
        ccEmails: body.ccEmails,
        sendMode: emailResult.sendMode,
        deliveryStatus: emailResult.deliveryStatus,
        providerMessage: emailResult.providerMessage,
        providerMessageId: emailResult.providerMessageId,
        errorMessage: emailResult.errorMessage,
        sentBy,
      });

      return Response.json({
        success: true,
        deliveryStatus: emailResult.deliveryStatus,
        sendMode: emailResult.sendMode,
        message: emailResult.providerMessage,
        reminder: reminderResult.reminder,
        recommendationUpdated: reminderResult.recommendationUpdated,
      });
    }

    // Outlook credentials not configured or direct failure
    return Response.json({
      success: false,
      deliveryStatus: emailResult.deliveryStatus,
      sendMode: emailResult.sendMode,
      error: emailResult.providerMessage,
      errorMessage: emailResult.errorMessage,
    }, { status: 400 });

  } catch (e) {
    if (e instanceof SupplierCommunicationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[POST /api/supplier-communications/reminders/send] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
