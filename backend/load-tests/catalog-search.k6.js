import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    product_browse: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      exec: 'browseCatalog',
    },
    search: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: 'searchProducts',
      startTime: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export function browseCatalog() {
  const res = http.get(`${BASE_URL}/api/v1/storefront/home`);
  check(res, {
    'home status 200': (r) => r.status === 200,
  });
  sleep(0.1);
}

export function searchProducts() {
  const res = http.get(`${BASE_URL}/api/v1/search?q=shirt`);
  check(res, {
    'search status 200': (r) => r.status === 200,
  });
  sleep(0.1);
}

export function setup() {
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error(`API not healthy at ${BASE_URL}`);
  }
}
