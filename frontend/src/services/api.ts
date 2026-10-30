import axios from 'axios';
import {
  Customer,
  CustomerType,
  KYCRequirement,
  DocumentItem,
  Verification,
  RiskRating,
  ReviewCase,
  BeneficialOwner,
  AlertItem,
  AuditEvent,
  DashboardMetrics,
  EvaluationResponse,
  ValidationSummaryResponse,
} from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard & Metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await client.get('/analytics/dashboard');
    return res.data;
  },

  // Customers
  getCustomers: async (params?: { customer_type?: string; risk_level?: string; status?: string; search?: string; skip?: number; limit?: number }): Promise<Customer[]> => {
    const res = await client.get('/customers', { params });
    return res.data;
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const res = await client.get(`/customers/${id}`);
    return res.data;
  },

  getCustomerDetails: async (id: string) => {
    const res = await client.get(`/customers/${id}/details`);
    return res.data;
  },

  recalculateCompleteness: async (id: string) => {
    const res = await client.post(`/customers/${id}/recalculate-completeness`);
    return res.data;
  },

  // Documents
  getDocuments: async (params?: { customer_id?: string; document_type?: string; lifecycle_state?: string; skip?: number; limit?: number }): Promise<DocumentItem[]> => {
    const res = await client.get('/documents', { params });
    return res.data;
  },

  getDocumentDetails: async (id: string) => {
    const res = await client.get(`/documents/${id}`);
    return res.data;
  },

  verifyDocument: async (id: string, payload: { status: string; actor: string; analyst_notes?: string }): Promise<Verification> => {
    const res = await client.post(`/documents/${id}/verify`, payload);
    return res.data;
  },

  // Compliance Governance
  getCustomerTypes: async (): Promise<CustomerType[]> => {
    const res = await client.get('/customer-types');
    return res.data;
  },

  getKYCRequirements: async (params?: { customer_type?: string; risk_level?: string }): Promise<KYCRequirement[]> => {
    const res = await client.get('/kyc-requirements', { params });
    return res.data;
  },

  getRiskRatings: async (params?: { customer_id?: string; risk_level?: string; skip?: number; limit?: number }): Promise<RiskRating[]> => {
    const res = await client.get('/risk-ratings', { params });
    return res.data;
  },

  assessRisk: async (customerId: string, actor: string = 'RISK_REVIEWER'): Promise<RiskRating> => {
    const res = await client.post(`/risk-ratings/${customerId}/assess`, null, { params: { actor } });
    return res.data;
  },

  getBeneficialOwners: async (params?: { business_id?: string; skip?: number; limit?: number }): Promise<BeneficialOwner[]> => {
    const res = await client.get('/beneficial-owners', { params });
    return res.data;
  },

  getUBOReconciliation: async () => {
    const res = await client.get('/beneficial-owners/reconciliation');
    return res.data;
  },

  getReviewCases: async (params?: { status?: string; is_overdue?: boolean; skip?: number; limit?: number }): Promise<ReviewCase[]> => {
    const res = await client.get('/review-cases', { params });
    return res.data;
  },

  updateReviewCase: async (id: string, payload: { status?: string; resolution_decision?: string; resolution_notes?: string }, actor: string = 'RISK_REVIEWER'): Promise<ReviewCase> => {
    const res = await client.patch(`/review-cases/${id}`, payload, { params: { actor } });
    return res.data;
  },

  getVerifications: async (params?: { status?: string; skip?: number; limit?: number }): Promise<Verification[]> => {
    const res = await client.get('/verifications', { params });
    return res.data;
  },

  // Alerts
  getAlerts: async (params?: { customer_id?: string; alert_type?: string; severity?: string; status?: string; skip?: number; limit?: number }): Promise<AlertItem[]> => {
    const res = await client.get('/alerts', { params });
    return res.data;
  },

  updateAlertStatus: async (id: string, status: string, actor: string = 'OPERATIONS_ANALYST'): Promise<AlertItem> => {
    const res = await client.patch(`/alerts/${id}`, { status }, { params: { actor } });
    return res.data;
  },

  scanExpirations: async () => {
    const res = await client.post('/alerts/scan-expirations');
    return res.data;
  },

  // Audit
  getAuditEvents: async (params?: { entity_type?: string; entity_id?: string; event_type?: string; actor?: string; skip?: number; limit?: number }): Promise<AuditEvent[]> => {
    const res = await client.get('/audit-events', { params });
    return res.data;
  },

  // Exceptions & Evaluation
  getExceptions: async () => {
    const res = await client.get('/analytics/exceptions');
    return res.data;
  },

  getEvaluation: async (): Promise<EvaluationResponse> => {
    const res = await client.get('/analytics/evaluation');
    return res.data;
  },

  getValidation: async (): Promise<ValidationSummaryResponse> => {
    const res = await client.get('/analytics/validation');
    return res.data;
  },

  getReproducibility: async () => {
    const res = await client.get('/analytics/reproducibility');
    return res.data;
  },

  triggerDataGeneration: async (preset: 'starter' | 'full') => {
    const res = await client.post('/analytics/generate-data', null, { params: { preset } });
    return res.data;
  },
};
