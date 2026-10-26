import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    // Ramp up traffic from 10 to 100 VUs
    load_ramp: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
    // Sustained traffic on critical search endpoints
    search_traffic: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '45s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      startTime: '10s',
      exec: 'searchFlow',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors allowed
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'system is healthy': (r) => r.status === 200,
  });
  return { startTime: new Date().toISOString() };
}

export default function () {
  group('Storefront & Catalog Browsing', () => {
    // 1. Home storefront
    const homeRes = http.get(`${BASE_URL}/api/v1/storefront/home`);
    check(homeRes, {
      'storefront home 200': (r) => r.status === 200,
      'storefront has sections': (r) => r.body && r.body.length > 0,
    });

    // 2. Categories
    const catRes = http.get(`${BASE_URL}/api/v1/categories`);
    check(catRes, {
      'categories 200': (r) => r.status === 200,
    });

    // 3. Platform Config
    const configRes = http.get(`${BASE_URL}/api/v1/storefront/config`);
    check(configRes, {
      'config 200': (r) => r.status === 200,
    });

    // 4. Header Tabs
    const tabsRes = http.get(`${BASE_URL}/api/v1/storefront/header-tabs`);
    check(tabsRes, {
      'header tabs 200': (r) => r.status === 200,
    });

    // 5. Flash Deals
    const dealsRes = http.get(`${BASE_URL}/api/v1/deals`);
    check(dealsRes, {
      'deals 200': (r) => r.status === 200,
    });

    sleep(0.5);
  });
}

export function searchFlow() {
  group('Search Flow', () => {
    const queries = ['mithila', 'saree', 'art', 'organic', 'curd'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const searchRes = http.get(`${BASE_URL}/api/v1/search?q=${query}`);
    check(searchRes, {
      'search status 200': (r) => r.status === 200,
    });

    sleep(0.2);
  });
}

export function teardown(data) {
  console.log(`Load test finished. Started at: ${data.startTime}`);
}
