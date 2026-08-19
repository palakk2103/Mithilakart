# CR-002 — Layer 2 Tests (real MongoDB)

These tests run against a **real MongoDB replica set** and are the only ones
that prove the transactional/atomicity claims. Layer 1 (the in-memory suites
under `tests/unit` and `tests/integration`) proves the *algorithm*; Layer 2
proves the *database behaviour*. Both are kept — neither replaces the other.

## Requirements

- MongoDB **replica set** (single-node replica set is fine). A standalone
  `mongod` will not work: multi-document transactions require a replica set.
- MongoDB Atlas works, provided your IP is allow-listed.

## Running

```bash
# Never point this at production. It creates and deletes real documents.
export MONGO_TEST_URI="mongodb+srv://user:pass@cluster/mithilakart_layer2"
npm run test:layer2
```

Without `MONGO_TEST_URI` the whole suite **skips** (it does not fail), so CI
without a database stays green.

## Safety

- Every document created is namespaced with a per-run `runId` and removed in
  `afterAll`.
- The suite refuses to run against a database whose name contains `prod`.
- It never touches `platform_settings`, so your configuration is unaffected.

## What it proves

| # | Scenario | Guarantee |
|---|---|---|
| 1 | Atomic single reservation | `reserveStock` is a real conditional update |
| 2 | Concurrent order attempts | no double-reserve |
| 3 | Last-unit race | exactly one winner |
| 4 | Multi-product complete cart | all-or-nothing |
| 5 | Rollback on partial failure | zero stranded stock |
| 6 | Seller fallback after failed reservation | next seller reserves cleanly |
| 7 | Warehouse fallback | warehouse reserves when sellers cannot |
| 8 | Concurrent seller attempts | one seller holds the cart |
| 9 | Duplicate fulfillment start | one `OrderFulfillment` per order |
| 10 | Concurrent delivery assignment | one partner owns the assignment |

All ten assert the same four invariants: **no overselling, no negative
inventory, no partial reservation, no stranded reservation.**
