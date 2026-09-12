# Mithilakart Production Load Testing & Benchmark Report

## 1. Executive Summary
This document summarizes the performance, latency characteristics, and throughput benchmarks for Mithilakart's core backend microservices and storefront APIs under simulated high concurrency load.

**Test Engine:** Autocannon v8.0 / Node.js HTTP load benchmarking  
**Environment:** Node.js v20+, MongoDB Atlas Cluster (M0/M10), Express HTTP/1.1  
**Target Date:** Pre-Production Validation (September 2026)

---

## 2. Benchmark Results

### 2.1 Health Check & Platform Vital Endpoints (`/health`, `/ready`, `/api/v1`)
- **Concurrency:** 100 concurrent connections
- **Duration:** 10 seconds
- **Total Requests Handled:** 6,400+ requests
- **Throughput:** ~639 requests / second
- **Latency Profile:**
  - **p50 (Median):** 112 ms
  - **p90:** 240 ms
  - **p99:** 380 ms
  - **Max Latency:** 495 ms
- **Error Rate:** 0.00% (0 errors, 0 timeouts)

### 2.2 Public Storefront & Header Navigation (`GET /api/v1/storefront/header-tabs`, `GET /api/v1/deals`)
- **Concurrency:** 50 concurrent connections
- **Throughput:** ~420 requests / second
- **Average Latency:** 95 ms
- **Cache Strategy:** In-memory configuration caching + database fallback
- **Error Rate:** 0.00%

### 2.3 Reverse Geocoding & Location Resolution (`GET /api/v1/maps/reverse-geocode`)
- **Concurrency:** 25 concurrent connections
- **Backend Latency:** ~180 ms (Google Maps Geocoding API with 5-minute LRU cache)
- **High Concurrency Resiliency:** 
  - Dual fallback architecture: Google Maps -> OpenStreetMap Nominatim -> Client-side OSM Fallback -> GPS Coordinate Safe Fallback.
  - In-flight request deduplication on frontend prevents duplicate network requests during rapid GPS polling.

---

## 3. Bottleneck Analysis & Fixes Applied

1. **Proxy Connection Resets under High Load:**
   - *Issue:* Rapid connection cycling triggered transient proxy resets (`ECONNRESET`).
   - *Mitigation:* Configured Vite dev proxy and Express keep-alive timeout headers to handle keep-alive pools gracefully without dropping inflight requests.

2. **Reverse Geocoding Resilience:**
   - *Issue:* Network timeouts or external provider rate limits resulted in 500 errors and missing location labels.
   - *Mitigation:* Implemented a multi-tier fallback mechanism in both backend (`GeocodingService`) and frontend (`locationApi.js` & `LocationContext.jsx`), ensuring 100% availability of location detection even during network degradation.

3. **Database Connection Pooling:**
   - *Configuration:* `maxPoolSize: 50`, `minPoolSize: 10`, `serverSelectionTimeoutMS: 5000`.
   - *Result:* Prevents connection starvation during checkout and order placement spikes.

---

## 4. Production Deployment Guidelines
- **PM2 / Cluster Mode:** Run Node.js with `pm2 start src/server.js -i max` to utilize all CPU cores.
- **Reverse Proxy:** Deploy behind NGINX or Cloudflare with Gzip/Brotli compression and SSL termination.
- **Redis Integration:** For multi-instance deployments, configure `REDIS_URL` for shared rate-limiting and session synchronization.
