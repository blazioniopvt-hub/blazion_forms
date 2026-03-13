// ============================================================
// Blazion Forms — Load Testing Script
// Tool: k6 (https://k6.io)
// Run: k6 run infrastructure/load-test/k6-config.js
// ============================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const submissionLatency = new Trend('submission_latency');
const formLoadLatency = new Trend('form_load_latency');

// ── Test Stages ──────────────────────────────
// Ramps up to simulate peak traffic patterns
export const options = {
  stages: [
    { duration: '1m',  target: 50   },  // Warm up
    { duration: '3m',  target: 200  },  // Normal load
    { duration: '5m',  target: 500  },  // High load
    { duration: '3m',  target: 1000 },  // Peak load (1M/day = ~12 rps average, 1000 concurrent is burst test)
    { duration: '2m',  target: 0    },  // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],    // 95th percentile under 500ms
    http_req_duration: ['p(99)<2000'],   // 99th percentile under 2s
    errors: ['rate<0.01'],               // Error rate under 1%
    submission_latency: ['p(95)<300'],   // Submissions under 300ms (95th)
    form_load_latency: ['p(95)<200'],    // Form loads under 200ms (95th)
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';
const FORM_SLUG = __ENV.FORM_SLUG || 'test-form';

// ── Test Scenarios ───────────────────────────

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('Load Public Form', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/forms/public/${FORM_SLUG}`);
    formLoadLatency.add(Date.now() - start);
    check(res, {
      'form loaded': (r) => r.status === 200,
      'has fields': (r) => {
        try { return JSON.parse(r.body).fields.length > 0; } catch { return false; }
      },
    });
    errorRate.add(res.status !== 200);
  });

  group('Submit Form Response', () => {
    const payload = JSON.stringify({
      answers: {
        name: `User ${Math.random().toString(36).slice(2, 8)}`,
        email: `test${Date.now()}@example.com`,
        message: 'This is a load test submission with realistic content length to simulate production usage.',
      },
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/responses/submit/${FORM_SLUG}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    submissionLatency.add(Date.now() - start);

    check(res, {
      'submission accepted': (r) => r.status === 200 || r.status === 201,
      'has response ID': (r) => {
        try { return !!JSON.parse(r.body).responseId; } catch { return false; }
      },
    });
    errorRate.add(res.status >= 400);
  });

  group('Search Responses', () => {
    const res = http.get(`${BASE_URL}/search/responses?q=test&limit=10`, {
      headers: { 'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'test-token'}` },
    });
    check(res, { 'search works': (r) => r.status === 200 || r.status === 401 });
  });

  sleep(Math.random() * 2 + 0.5); // Random think time 0.5-2.5s
}

// ── Specific Scenario: Burst Submissions ─────
export function burstSubmissions() {
  for (let i = 0; i < 10; i++) {
    const payload = JSON.stringify({
      answers: {
        name: `Burst User ${i}`,
        email: `burst${Date.now()}_${i}@example.com`,
        rating: Math.floor(Math.random() * 5) + 1,
      },
    });

    const res = http.post(`${BASE_URL}/responses/submit/${FORM_SLUG}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, { 'burst accepted': (r) => r.status < 500 });
  }
}
