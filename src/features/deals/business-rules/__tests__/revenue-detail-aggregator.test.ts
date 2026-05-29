import { describe, it, expect } from 'vitest';
import {
  aggregateUnpaid,
  aggregateRevenue,
  aggregateProjections,
  aggregateItems,
  type AggregatorTrialRow,
  type AggregatorClientRow,
  type UnpaidInvoiceRow,
  type PaymentRow,
  type RevenueInvoiceRow,
  type LabeledItem,
} from '../revenue-detail-aggregator';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const trials: AggregatorTrialRow[] = [
  { id: 't1', case_name: 'Acme v. Beta', client_id: 'c1' },
  { id: 't2', case_name: 'Gamma Suit', client_id: 'c2' },
  { id: 't3', case_name: 'Delta Matter', client_id: 'c1' },
];

const clients: AggregatorClientRow[] = [
  { id: 'c1', firm_name: 'Smith & Co' },
  { id: 'c2', firm_name: 'Jones LLP' },
];

describe('aggregateUnpaid', () => {
  const invoices: UnpaidInvoiceRow[] = [
    { trial_id: 't1', invoice_number: 1001, total: 100 },
    { trial_id: 't1', invoice_number: 1002, total: 50 },
    { trial_id: 't2', invoice_number: 2001, total: 200 },
  ];

  it('returns [] when no invoices', () => {
    expect(aggregateUnpaid([], trials, clients, 'invoice')).toEqual([]);
    expect(aggregateUnpaid(undefined, trials, clients, 'invoice')).toEqual([]);
    expect(aggregateUnpaid(null, trials, clients, 'invoice')).toEqual([]);
  });

  it('returns [] for detailLevel total', () => {
    expect(aggregateUnpaid(invoices, trials, clients, 'total')).toEqual([]);
  });

  it('invoice level: one row per invoice with #number labels', () => {
    expect(aggregateUnpaid(invoices, trials, clients, 'invoice')).toEqual([
      { name: '#1001', value: 100 },
      { name: '#1002', value: 50 },
      { name: '#2001', value: 200 },
    ]);
  });

  it('case level: group-sum by case_name', () => {
    expect(aggregateUnpaid(invoices, trials, clients, 'case')).toEqual([
      { name: 'Acme v. Beta', value: 150 },
      { name: 'Gamma Suit', value: 200 },
    ]);
  });

  it('client level: group-sum by firm_name', () => {
    expect(aggregateUnpaid(invoices, trials, clients, 'client')).toEqual([
      { name: 'Smith & Co', value: 150 },
      { name: 'Jones LLP', value: 200 },
    ]);
  });

  it('falls back to Invoice label when no invoice_number', () => {
    const noNumber: UnpaidInvoiceRow[] = [{ trial_id: 'missing', total: 10 }];
    expect(aggregateUnpaid(noNumber, trials, clients, 'invoice')).toEqual([
      { name: 'Invoice', value: 10 },
    ]);
  });

  it('client level falls back to Unknown on join miss', () => {
    const orphan: UnpaidInvoiceRow[] = [{ trial_id: 'nope', invoice_number: 9, total: 5 }];
    expect(aggregateUnpaid(orphan, trials, clients, 'client')).toEqual([
      { name: 'Unknown', value: 5 },
    ]);
  });

  it('case level falls back to #number on trial join miss', () => {
    const orphan: UnpaidInvoiceRow[] = [{ trial_id: 'nope', invoice_number: 7, total: 3 }];
    expect(aggregateUnpaid(orphan, trials, clients, 'case')).toEqual([
      { name: '#7', value: 3 },
    ]);
  });

  it('treats null total as 0', () => {
    const nullTotal: UnpaidInvoiceRow[] = [{ trial_id: 't1', invoice_number: 1, total: null }];
    expect(aggregateUnpaid(nullTotal, trials, clients, 'invoice')).toEqual([
      { name: '#1', value: 0 },
    ]);
  });
});

describe('aggregateRevenue', () => {
  const invoices: RevenueInvoiceRow[] = [
    { id: 'i1', trial_id: 't1', invoice_number: 1001 },
    { id: 'i2', trial_id: 't2', invoice_number: 2001 },
  ];
  const payments: PaymentRow[] = [
    { invoice_id: 'i1', amount: 100 },
    { invoice_id: 'i1', amount: 25 },
    { invoice_id: 'i2', amount: 200 },
  ];

  it('returns [] when no payments', () => {
    expect(aggregateRevenue([], invoices, trials, clients, 'invoice')).toEqual([]);
    expect(aggregateRevenue(undefined, invoices, trials, clients, 'invoice')).toEqual([]);
  });

  it('returns [] for detailLevel total', () => {
    expect(aggregateRevenue(payments, invoices, trials, clients, 'total')).toEqual([]);
  });

  it('invoice level: labels by case_name (preferred) per payment', () => {
    expect(aggregateRevenue(payments, invoices, trials, clients, 'invoice')).toEqual([
      { name: 'Acme v. Beta', value: 100 },
      { name: 'Acme v. Beta', value: 25 },
      { name: 'Gamma Suit', value: 200 },
    ]);
  });

  it('case level: group-sum by case_name', () => {
    expect(aggregateRevenue(payments, invoices, trials, clients, 'case')).toEqual([
      { name: 'Acme v. Beta', value: 125 },
      { name: 'Gamma Suit', value: 200 },
    ]);
  });

  it('client level: group-sum by firm_name', () => {
    expect(aggregateRevenue(payments, invoices, trials, clients, 'client')).toEqual([
      { name: 'Smith & Co', value: 125 },
      { name: 'Jones LLP', value: 200 },
    ]);
  });

  it('falls back through #number then payment_reference then Payment', () => {
    const invsNoTrial: RevenueInvoiceRow[] = [{ id: 'i3', trial_id: 'gone', invoice_number: 555 }];
    const p1: PaymentRow[] = [{ invoice_id: 'i3', amount: 9 }];
    // trial join miss → #number label
    expect(aggregateRevenue(p1, invsNoTrial, trials, clients, 'invoice')).toEqual([
      { name: '#555', value: 9 },
    ]);
    // no invoice match at all, with a payment_reference
    const p2: PaymentRow[] = [{ invoice_id: 'none', payment_reference: 'REF-1', amount: 4 }];
    expect(aggregateRevenue(p2, invsNoTrial, trials, clients, 'invoice')).toEqual([
      { name: 'REF-1', value: 4 },
    ]);
    // no invoice, no reference → Payment
    const p3: PaymentRow[] = [{ invoice_id: 'none', amount: 2 }];
    expect(aggregateRevenue(p3, invsNoTrial, trials, clients, 'invoice')).toEqual([
      { name: 'Payment', value: 2 },
    ]);
  });

  it('case level uses Payment fallback when no case and no number', () => {
    const p: PaymentRow[] = [{ invoice_id: 'none', amount: 8 }];
    expect(aggregateRevenue(p, [], trials, clients, 'case')).toEqual([
      { name: 'Payment', value: 8 },
    ]);
  });

  it('client level falls back to Unknown on join miss', () => {
    const p: PaymentRow[] = [{ invoice_id: 'none', amount: 6 }];
    expect(aggregateRevenue(p, [], trials, clients, 'client')).toEqual([
      { name: 'Unknown', value: 6 },
    ]);
  });

  it('treats null amount as 0', () => {
    const p: PaymentRow[] = [{ invoice_id: 'i1', amount: null }];
    expect(aggregateRevenue(p, invoices, trials, clients, 'invoice')).toEqual([
      { name: 'Acme v. Beta', value: 0 },
    ]);
  });
});

describe('aggregateProjections', () => {
  const caseItems = [
    { name: 'Acme v. Beta', value: 100 },
    { name: 'Delta Matter', value: 50 },
    { name: 'Gamma Suit', value: 200 },
  ];

  it('returns [] when no caseItems', () => {
    expect(aggregateProjections([], clients, trials, 'case')).toEqual([]);
    expect(aggregateProjections(undefined, clients, trials, 'case')).toEqual([]);
  });

  it('returns [] for detailLevel total', () => {
    expect(aggregateProjections(caseItems, clients, trials, 'total')).toEqual([]);
  });

  it('returns caseItems as-is for invoice level', () => {
    expect(aggregateProjections(caseItems, clients, trials, 'invoice')).toBe(caseItems);
  });

  it('returns caseItems as-is for case level', () => {
    expect(aggregateProjections(caseItems, clients, trials, 'case')).toBe(caseItems);
  });

  it('client level: sums cases by firm_name (Acme + Delta → Smith & Co)', () => {
    expect(aggregateProjections(caseItems, clients, trials, 'client')).toEqual([
      { name: 'Smith & Co', value: 150 },
      { name: 'Jones LLP', value: 200 },
    ]);
  });

  it('client level falls back to the item name on join miss', () => {
    const orphan = [{ name: 'Unmatched Case', value: 42 }];
    expect(aggregateProjections(orphan, clients, trials, 'client')).toEqual([
      { name: 'Unmatched Case', value: 42 },
    ]);
  });
});

describe('aggregateItems', () => {
  const items: LabeledItem[] = [
    { invoiceLabel: '#1', caseLabel: 'Case A', clientLabel: 'Firm X', value: 10 },
    { invoiceLabel: '#2', caseLabel: 'Case A', clientLabel: 'Firm X', value: 20 },
    { invoiceLabel: '#3', caseLabel: 'Case B', clientLabel: 'Firm Y', value: 30 },
  ];

  it('invoice level: one row per item by invoiceLabel', () => {
    expect(aggregateItems(items, 'invoice')).toEqual([
      { name: '#1', value: 10 },
      { name: '#2', value: 20 },
      { name: '#3', value: 30 },
    ]);
  });

  it('case level: group-sum by caseLabel', () => {
    expect(aggregateItems(items, 'case')).toEqual([
      { name: 'Case A', value: 30 },
      { name: 'Case B', value: 30 },
    ]);
  });

  it('client level: group-sum by clientLabel', () => {
    expect(aggregateItems(items, 'client')).toEqual([
      { name: 'Firm X', value: 30 },
      { name: 'Firm Y', value: 30 },
    ]);
  });
});
