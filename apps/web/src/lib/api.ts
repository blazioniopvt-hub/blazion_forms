// ============================================
// Blazion Forms — API Client
// ============================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('blazion_token', token);
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('blazion_token');
    }
    return null;
  }

  clearToken() {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blazion_token');
      localStorage.removeItem('blazion_refresh');
    }
  }

  private async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: any = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      // Try to refresh
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return retryRes.json();
      }
      this.clearToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : (null as unknown as T);
  }

  private async tryRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const refreshToken = localStorage.getItem('blazion_refresh');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setToken(data.accessToken);
      localStorage.setItem('blazion_refresh', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // ── Auth ──
  auth = {
    register: (data: { email: string; password: string; name?: string }) =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => this.request('/auth/me'),
    forgotPassword: (email: string) =>
      this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) =>
      this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  };

  // ── Forms ──
  forms = {
    list: (workspaceId: string) => this.request(`/forms?workspaceId=${workspaceId}`),
    get: (id: string) => this.request(`/forms/${id}`),
    create: (data: { workspaceId: string; title: string; description?: string }) =>
      this.request('/forms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      this.request(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateFields: (id: string, fields: any[]) =>
      this.request(`/forms/${id}/fields`, { method: 'PUT', body: JSON.stringify({ fields }) }),
    duplicate: (id: string) =>
      this.request(`/forms/${id}/duplicate`, { method: 'POST' }),
    delete: (id: string) =>
      this.request(`/forms/${id}`, { method: 'DELETE' }),
    getPublic: (slug: string) =>
      this.request(`/forms/public/${slug}`),
    getTemplates: () => this.request('/forms/templates'),
  };

  // ── Responses ──
  responses = {
    submit: (slug: string, answers: Record<string, any>) =>
      this.request(`/responses/submit/${slug}`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    list: (formId: string, query?: { page?: number; limit?: number }) =>
      this.request(`/responses/form/${formId}?page=${query?.page || 1}&limit=${query?.limit || 25}`),
    get: (id: string) => this.request(`/responses/${id}`),
    delete: (id: string) => this.request(`/responses/${id}`, { method: 'DELETE' }),
    exportCsv: (formId: string) =>
      `${API_BASE}/responses/export/csv/${formId}`,
    exportJson: (formId: string) =>
      this.request(`/responses/export/json/${formId}`),
  };

  // ── Analytics ──
  analytics = {
    form: (formId: string, days?: number) =>
      this.request(`/analytics/form/${formId}?days=${days || 30}`),
    workspace: (workspaceId: string) =>
      this.request(`/analytics/workspace/${workspaceId}`),
  };

  // ── AI ──
  ai = {
    generateForm: (prompt: string, workspaceId: string) =>
      this.request('/ai/generate-form', { method: 'POST', body: JSON.stringify({ prompt, workspaceId }) }),
    getInsights: (formId: string) =>
      this.request(`/ai/insights/${formId}`),
    getSuggestions: (formId: string) =>
      this.request(`/ai/suggestions/${formId}`),
  };

  // ── Automations ──
  automations = {
    create: (data: { formId: string; name: string; trigger: string; actions: any[] }) =>
      this.request('/automations', { method: 'POST', body: JSON.stringify(data) }),
    list: (formId: string) => this.request(`/automations/form/${formId}`),
    update: (id: string, data: any) => this.request(`/automations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/automations/${id}`, { method: 'DELETE' }),
    getLogs: (id: string) => this.request(`/automations/${id}/logs`),
  };

  // ── Integrations ──
  integrations = {
    create: (data: { workspaceId: string; provider: string; name: string; config: any }) =>
      this.request('/integrations', { method: 'POST', body: JSON.stringify(data) }),
    list: (workspaceId: string) => this.request(`/integrations/workspace/${workspaceId}`),
    update: (id: string, data: any) => this.request(`/integrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => this.request(`/integrations/${id}`, { method: 'DELETE' }),
    test: (id: string) => this.request(`/integrations/${id}/test`, { method: 'POST' }),
  };

  // ── Billing ──
  billing = {
    getPlans: () => this.request('/billing/plans'),
    getSubscription: (workspaceId: string) => this.request(`/billing/subscription/${workspaceId}`),
    createCheckout: (workspaceId: string, plan: string) =>
      this.request('/billing/checkout', { method: 'POST', body: JSON.stringify({ workspaceId, plan }) }),
    getUsage: (workspaceId: string) => this.request(`/billing/usage/${workspaceId}`),
  };

  // ── Teams ──
  teams = {
    getMembers: (workspaceId: string) => this.request(`/teams/${workspaceId}/members`),
    invite: (workspaceId: string, email: string, role: string) =>
      this.request(`/teams/${workspaceId}/invite`, { method: 'POST', body: JSON.stringify({ email, role }) }),
    updateRole: (workspaceId: string, userId: string, role: string) =>
      this.request(`/teams/${workspaceId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
    removeMember: (workspaceId: string, userId: string) =>
      this.request(`/teams/${workspaceId}/members/${userId}`, { method: 'DELETE' }),
    getInvites: (workspaceId: string) => this.request(`/teams/${workspaceId}/invites`),
  };
}

export const api = new ApiClient();
