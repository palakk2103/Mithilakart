# Backend Documentation

Phase 0 foundation documentation lives in the repository root master plan:

- `docs/backend-master-plan/`

## API Conventions

- Base path: `/api/v1`
- Success envelope: `{ success, data, meta?, requestId }`
- Error envelope: `{ success: false, error: { code, message, details? }, requestId }`

## OpenAPI

Swagger UI is served at `/api/docs` with a minimal stub spec. Full endpoint documentation will be added as modules are implemented in later phases.
