/**
 * Supplier Response Interpreter — Phase 8D
 *
 * Implements rule-based, local heuristic rules to parse raw supplier response
 * text, classify them into a SupplierResponseCategory, and extract proposed
 * values (dates, quantities, prices).
 *
 * This file does NOT call any external AI/LLM models, database, or SAP APIs.
 */

import type { SupplierResponseCategory } from '@/src/types/supplierCommunications';

export interface SupplierResponseInterpretation {
  responseCategory: SupplierResponseCategory;
  interpretedSummary: string;
  proposedNewDeliveryDate?: string; // YYYY-MM-DD
  proposedNewQuantity?: number;
  proposedNewPrice?: number;
}

/**
 * Extracts a date from text and converts it to YYYY-MM-DD format.
 * Supports: YYYY-MM-DD, MM/DD/YYYY, month name spellings (e.g. June 18, Jun 18, 18 June)
 */
export function extractDate(text: string): string | undefined {
  if (!text) return undefined;

  // 1. Check YYYY-MM-DD
  const ymdMatch = text.match(/\b(\d{4})[-/.](\d{2})[-/.](\d{2})\b/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  // 2. Check MM/DD/YYYY or MM/DD/YY
  const mdyMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (mdyMatch) {
    const m = mdyMatch[1].padStart(2, '0');
    const d = mdyMatch[2].padStart(2, '0');
    let y = mdyMatch[3];
    if (y.length === 2) {
      y = '20' + y;
    }
    return `${y}-${m}-${d}`;
  }

  // 3. Month Name Day, Year (e.g. June 18, 2026 or June 18th, 2026 or Jun 18)
  const monthsPattern = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const monthWordRegex = new RegExp(`\\b${monthsPattern}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?\\b`, 'i');
  const monthWordMatch = text.match(monthWordRegex);
  if (monthWordMatch) {
    const monthStr = monthWordMatch[1].toLowerCase();
    const dayStr = monthWordMatch[2].padStart(2, '0');
    // Default to 2026 (current context year) if not specified
    const yearStr = monthWordMatch[3] || '2026';
    
    const monthsMap: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };
    
    const prefix = monthStr.substring(0, 3);
    const m = monthsMap[prefix] || '01';
    return `${yearStr}-${m}-${dayStr}`;
  }

  return undefined;
}

/**
 * Extracts a quantity from text by identifying numeric patterns near quantity keywords.
 */
export function extractQuantity(text: string): number | undefined {
  if (!text) return undefined;

  const regexes = [
    /\bqty\s*(?:to|is|of)?\s*(\d+)\b/i,
    /\bquantity\s*(?:to|is|of)?\s*(\d+)\b/i,
    /\b(?:supply|supplying|supplied)\s*(\d+)\b/i,
    /\b(?:ship|shipping|shipped)\s*(\d+)\b/i,
    /\b(?:deliver|delivering|delivered)\s*(\d+)\b/i,
    /\b(\d+)\s*units\b/i,
    /\b(\d+)\s*pcs\b/i
  ];

  for (const regex of regexes) {
    const m = text.match(regex);
    if (m) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val)) return val;
    }
  }

  return undefined;
}

/**
 * Extracts a price from text by identifying monetary patterns near price keywords.
 */
export function extractPrice(text: string): number | undefined {
  if (!text) return undefined;

  const regexes = [
    /\bunit price\s*(?:is|should be|of|to)?\s*\$?(\d+(?:\.\d{1,2})?)\b/i,
    /\bprice\s*(?:is|should be|of|to)?\s*\$?(\d+(?:\.\d{1,2})?)\b/i,
    /\bquote\s*(?:is|of|to)?\s*\$?(\d+(?:\.\d{1,2})?)\b/i,
    /\bcost\s*(?:is|of|to)?\s*\$?(\d+(?:\.\d{1,2})?)\b/i,
    /\$(\d+(?:\.\d{1,2})?)\b/
  ];

  for (const regex of regexes) {
    const m = text.match(regex);
    if (m) {
      const val = parseFloat(m[1]);
      if (!isNaN(val)) return val;
    }
  }

  return undefined;
}

/**
 * Interprets the raw response text from a supplier.
 */
export function interpretSupplierResponse(rawText: string): SupplierResponseInterpretation {
  const text = rawText || '';
  
  // Extract values if possible
  const proposedNewDeliveryDate = extractDate(text);
  const proposedNewQuantity = extractQuantity(text);
  const proposedNewPrice = extractPrice(text);

  // 1. Out of Office
  if (
    /out of (?:the )?office/i.test(text) ||
    /\booo\b/i.test(text) ||
    /on vacation/i.test(text) ||
    /away from my desk/i.test(text) ||
    /automatic reply/i.test(text) ||
    /auto-reply/i.test(text)
  ) {
    return {
      responseCategory: 'OUT_OF_OFFICE',
      interpretedSummary: 'Supplier contact is out of office.',
    };
  }

  // 2. Wrong Contact
  if (
    /wrong contact/i.test(text) ||
    /no longer (?:handles|works)/i.test(text) ||
    /incorrect person/i.test(text) ||
    /contact sales@/i.test(text) ||
    /not my account/i.test(text) ||
    /forward to/i.test(text)
  ) {
    return {
      responseCategory: 'WRONG_CONTACT',
      interpretedSummary: 'Supplier indicates incorrect contact person.',
    };
  }

  // 3. Rejected
  if (
    /cannot fulfill/i.test(text) ||
    /unable to (?:fulfill|supply|deliver)/i.test(text) ||
    /please cancel/i.test(text) ||
    /cancel this/i.test(text) ||
    /cancel PO/i.test(text) ||
    /decline the order/i.test(text) ||
    /will not be able to deliver/i.test(text) ||
    /\brejected\b/i.test(text)
  ) {
    return {
      responseCategory: 'REJECTED',
      interpretedSummary: 'Supplier rejected the purchase order / schedule line.',
    };
  }

  // 4. Needs Clarification
  if (
    /please clarify/i.test(text) ||
    /need clarification/i.test(text) ||
    /require clarification/i.test(text) ||
    /do you require/i.test(text) ||
    /need details/i.test(text) ||
    /question about spec/i.test(text)
  ) {
    return {
      responseCategory: 'NEEDS_CLARIFICATION',
      interpretedSummary: 'Supplier response needs clarification.',
    };
  }

  // 5. Partial Confirmation
  if (
    /partial shipment/i.test(text) ||
    /partial delivery/i.test(text) ||
    /shipping some on/i.test(text) ||
    /ship part/i.test(text) ||
    /split delivery/i.test(text) ||
    /split schedule/i.test(text) ||
    /partially confirm/i.test(text)
  ) {
    return {
      responseCategory: 'PARTIAL_CONFIRMATION',
      interpretedSummary: 'Supplier proposed a partial confirmation/split schedule.',
      proposedNewDeliveryDate,
      proposedNewQuantity,
      proposedNewPrice,
    };
  }

  // 6. Price Issue
  if (
    /price dispute/i.test(text) ||
    /price discrepancy/i.test(text) ||
    /wrong price/i.test(text) ||
    /discrepancy in price/i.test(text) ||
    /unit price/i.test(text) ||
    /should be\s*\$/i.test(text) ||
    (proposedNewPrice !== undefined && /price|quote|cost|rate/i.test(text))
  ) {
    return {
      responseCategory: 'PRICE_ISSUE',
      interpretedSummary: proposedNewPrice
        ? `Supplier raised a price issue: proposed unit price is $${proposedNewPrice.toFixed(2)}.`
        : 'Supplier raised a price issue / unit price dispute.',
      proposedNewPrice,
      proposedNewDeliveryDate,
      proposedNewQuantity,
    };
  }

  // 7. Quantity Changed
  if (
    /only supply/i.test(text) ||
    /can only deliver/i.test(text) ||
    /reduced to/i.test(text) ||
    /shortage/i.test(text) ||
    /change quantity to/i.test(text) ||
    (proposedNewQuantity !== undefined && /qty|quantity|units|pcs/i.test(text))
  ) {
    return {
      responseCategory: 'QUANTITY_CHANGED',
      interpretedSummary: proposedNewQuantity
        ? `Supplier proposed a quantity change: new quantity is ${proposedNewQuantity} units.`
        : 'Supplier proposed a quantity change.',
      proposedNewQuantity,
      proposedNewDeliveryDate,
      proposedNewPrice,
    };
  }

  // 8. Delivery Date Changed
  if (
    proposedNewDeliveryDate !== undefined ||
    /new date/i.test(text) ||
    /delay/i.test(text) ||
    /postponed/i.test(text) ||
    /will deliver on/i.test(text) ||
    /shipment date is/i.test(text) ||
    /rescheduled to/i.test(text) ||
    /arrive on/i.test(text) ||
    /shipping date/i.test(text)
  ) {
    return {
      responseCategory: 'DELIVERY_DATE_CHANGED',
      interpretedSummary: proposedNewDeliveryDate
        ? `Supplier proposed a new delivery date: ${proposedNewDeliveryDate}.`
        : 'Supplier proposed a delivery date change.',
      proposedNewDeliveryDate,
      proposedNewQuantity,
      proposedNewPrice,
    };
  }

  // 9. Accepted As-Is
  if (
    /accept the PO/i.test(text) ||
    /accept the delivery date/i.test(text) ||
    /confirmed/i.test(text) ||
    /looks good/i.test(text) ||
    /all good/i.test(text) ||
    /acknowledged/i.test(text) ||
    /will deliver as requested/i.test(text) ||
    /correct date/i.test(text) ||
    /confirmed as-is/i.test(text) ||
    /on schedule/i.test(text) ||
    /ack receipt/i.test(text) ||
    /will ship on time/i.test(text)
  ) {
    return {
      responseCategory: 'ACCEPTED_AS_IS',
      interpretedSummary: 'Supplier accepted the purchase order details as-is.',
    };
  }

  // 10. Fallback
  return {
    responseCategory: 'FREE_TEXT_UNCLEAR',
    interpretedSummary: 'Supplier response is unclear and requires manual review.',
  };
}
