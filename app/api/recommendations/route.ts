/**
 * GET  /api/recommendations       — List recommendations with optional filters
 * POST /api/recommendations       — Create a new recommendation record
 *
 * Phase 8B: Backend Setup
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  listRecommendations,
  createRecommendation,
  getRecommendationById,
} from '@/src/services/recommendationService';
import { RecommendationValidationError } from '@/src/types/procurementRecommendations';
import type {
  RecommendationInput,
  RecommendationLifecycleStatus,
  RecommendationSourceModule,
  RecommendationCurrentOwner,
} from '@/src/types/procurementRecommendations';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/recommendations
// Optional filters: status, supplierId, purchaseOrderNumber, sourceModule, owner, limit, offset
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Check if this is a request for a guided AI recommendation (Phase 2 feature used by PO detail drawer)
    let exceptionId = searchParams.get('exception_id');
    const poNumber = searchParams.get('po_number') || '';
    const itemNumber = searchParams.get('item_number') || '';
    const agentName = (searchParams.get('agent_name') as any) || 'PO_OVERDUE_AGENT';

    if (exceptionId || (poNumber && itemNumber)) {
      if (!exceptionId) {
        exceptionId = `EX_FB_${poNumber}_${itemNumber}`;
      }

      // First check if there is an existing database recommendation for this PO line
      const { getRecommendationsForPurchaseOrderLine } = await import('@/src/services/recommendationService');
      const dbRecs = await getRecommendationsForPurchaseOrderLine(poNumber, itemNumber);
      if (dbRecs && dbRecs.length > 0) {
        const dbRec = dbRecs[0];
        const { getSupplierContactEmail } = await import('@/src/services/procurementDataService');
        const supplierEmail = await getSupplierContactEmail(dbRec.supplierId) || '';

        // Map to AgentRecommendation expected by the UI drawer
        const mapped = {
          recommendation_id: dbRec.recommendationId,
          exception_id: dbRec.recommendationId,
          agent_name: dbRec.sourceModule === 'PO_ACKNOWLEDGEMENT' ? 'SUPPLIER_ACK_AGENT' : 'PO_OVERDUE_AGENT',
          confidence_score: 0.75,
          recommended_action: dbRec.recommendedActionText,
          draft_subject: `Action required: ${dbRec.sourceModule === 'PO_ACKNOWLEDGEMENT' ? 'SUPPLIER_ACK' : 'PO_OVERDUE'} for PO ${dbRec.purchaseOrderNumber}`,
          draft_message: `Hello, please provide an update for PO ${dbRec.purchaseOrderNumber} item ${dbRec.purchaseOrderItem}. This line is currently flagged as critical in our Procurement Control Tower. Action: ${dbRec.recommendedActionText}`,
          approval_status:
            dbRec.lifecycleStatus === 'CONFIRMED_RESOLVED' || dbRec.lifecycleStatus === 'CLOSED_NO_ACTION'
              ? 'REJECTED'
              : ['PENDING_SUPPLIER_RESPONSE', 'VERIFICATION_PENDING', 'PENDING_BUYER_SAP_UPDATE'].includes(dbRec.lifecycleStatus)
              ? 'SENT'
              : 'PENDING',
          created_on: dbRec.createdAt.split('T')[0],
          supplier_email: supplierEmail,
          supplierEmail: supplierEmail
        };
        return Response.json(mapped);
      }

      const { getRecommendationByExceptionRaw, getSupplierContactEmail } = await import('@/src/services/procurementDataService');
      const guidedRec = await getRecommendationByExceptionRaw(exceptionId, poNumber, itemNumber, agentName);

      const { getPurchaseOrderLineDetailRaw } = await import('@/src/services/procurementDataService');
      const poDetail = await getPurchaseOrderLineDetailRaw(poNumber, itemNumber, '0001');
      const supplierEmail = poDetail ? (await getSupplierContactEmail(poDetail.supplier_id) || '') : '';

      const enrichedGuidedRec = {
        ...guidedRec,
        supplier_email: supplierEmail,
        supplierEmail: supplierEmail
      };
      return Response.json(enrichedGuidedRec);
    }

    let sourceModuleParam = searchParams.get('sourceModule');
    if (sourceModuleParam === 'OVERDUE_WORKBENCH') {
      sourceModuleParam = 'OVERDUE_PO';
    } else if (sourceModuleParam === 'SUPPLIER_ACKNOWLEDGEMENTS') {
      sourceModuleParam = 'PO_ACKNOWLEDGEMENT';
    }

    const filters = {
      status: (searchParams.get('status') as RecommendationLifecycleStatus) || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      purchaseOrderNumber: searchParams.get('purchaseOrderNumber') || undefined,
      sourceModule: (sourceModuleParam as RecommendationSourceModule) || undefined,
      owner: (searchParams.get('owner') as RecommendationCurrentOwner) || undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    };

    const recommendations = await listRecommendations(filters);
    const { getSupplierContactEmail } = await import('@/src/services/procurementDataService');
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const supplierEmail = await getSupplierContactEmail(rec.supplierId) || '';
        return {
          ...rec,
          supplierEmail,
          supplier_email: supplierEmail
        };
      })
    );
    return Response.json({ recommendations: enrichedRecommendations, total: enrichedRecommendations.length });
  } catch (e) {
    console.error('[GET /api/recommendations] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/recommendations
// Body (JSON): RecommendationInput or status updates
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.sourceModule === 'OVERDUE_WORKBENCH') {
      body.sourceModule = 'OVERDUE_PO';
    } else if (body.sourceModule === 'SUPPLIER_ACKNOWLEDGEMENTS') {
      body.sourceModule = 'PO_ACKNOWLEDGEMENT';
    }

    // Check if this is an update request for an existing recommendation
    if (body.recommendation_id) {
      const recId = body.recommendation_id.trim();
      let dbRec = await getRecommendationById(recId);

      // Securely create fallback recommendation if it doesn't exist yet
      if (!dbRec && recId.startsWith('AR_FB_')) {
        const parts = recId.split('_');
        const poNumber = parts[2];
        const itemNumber = parts[3] || '00010';

        const { getRecommendationsForPurchaseOrderLine } = await import('@/src/services/recommendationService');
        const dbRecs = await getRecommendationsForPurchaseOrderLine(poNumber, itemNumber);
        if (dbRecs && dbRecs.length > 0) {
          dbRec = dbRecs[0];
        } else {
          // Only create if the PO/item combination actually exists in the source data
          const { getPurchaseOrderLineDetailRaw } = await import('@/src/services/procurementDataService');
          const poLine = await getPurchaseOrderLineDetailRaw(poNumber, itemNumber, '0001');
          if (poLine) {
            console.log(`[POST /api/recommendations] Fallback creation: creating real recommendation for PO ${poNumber} item ${itemNumber}`);
            dbRec = await createRecommendation({
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
            console.warn(`[POST /api/recommendations] Fallback creation blocked: PO ${poNumber} item ${itemNumber} does not exist in source data.`);
          }
        }
      }

      if (!dbRec) {
        return Response.json({ error: `Recommendation not found: ${recId}` }, { status: 404 });
      }

      // Map request status to lifecycle status transitions
      let nextStatus: RecommendationLifecycleStatus = 'RECOMMENDED';
      if (body.status === 'APPROVED') {
        nextStatus = 'PENDING_BUYER_ACTION';
      } else if (body.status === 'REJECTED') {
        nextStatus = 'CLOSED_NO_ACTION';
      } else if (body.status === 'SENT') {
        nextStatus = 'PENDING_SUPPLIER_RESPONSE';
      }

      const { transitionRecommendationStatus, updateRecommendation } = await import('@/src/services/recommendationService');

      // Update the recommendation text first
      let updated = await updateRecommendation(
        dbRec.recommendationId,
        {
          recommendedActionText: body.message || dbRec.recommendedActionText,
          updatedBy: 'local-user'
        },
        dbRec.version
      );

      // Transition the lifecycle status
      updated = await transitionRecommendationStatus(
        updated.recommendationId,
        {
          nextStatus,
          closureReason: body.status === 'REJECTED' ? 'Rejected by buyer.' : undefined,
          updatedBy: 'local-user'
        },
        updated.version
      );

      return Response.json(updated);
    }

    // Validation guard for basic fields when creating new ones
    const required = [
      'sourceModule',
      'purchaseOrderNumber',
      'purchaseOrderItem',
      'supplierId',
      'supplierName',
      'recommendationType',
      'issueReason',
      'recommendedActionText',
    ] as const;

    for (const field of required) {
      if (!body[field]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const recommendation = await createRecommendation(body as RecommendationInput);
    return Response.json(recommendation, { status: 201 });
  } catch (e) {
    if (e instanceof RecommendationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[POST /api/recommendations] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
