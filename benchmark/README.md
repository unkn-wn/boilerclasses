# Search latency benchmarks

Run from the repository root with Redis populated from the pinned snapshot. Start the Next.js server for `api` mode. Both modes send one request at a time over a warm connection and report latency percentiles in milliseconds.

```sh
node benchmark/benchmark-search.js redis
node benchmark/benchmark-search.js api
node benchmark/benchmark-search.js redis filtered 500 50
```

Arguments are `mode [case|all] [count] [warmup]`. Defaults are all cases, 100 measured requests and 10 warmup requests per case. Set `REDIS_URL` for direct Redis, or `API_URL` for the API (defaults: `redis://localhost:6379` and `http://localhost:3000`). The API timer includes the HTTP response and JSON parsing; it does not include browser rendering.

Edit [`cases.json`](cases.json) to add or change workloads. `defaults` contains the shared API query parameters; each named entry in `cases` overrides only the parameters it needs. Values are strings, with comma-separated values for multi-select filters. The runner uses each merged parameter set for both the direct Redis query and the API URL.

| Case | Search and filters | Axis |
| --- | --- | --- |
| `broad` | “introduction”, default filters | Common word, many matches |
| `broad_1`, `broad_10`, `broad_50` | Same query, result limits 1, 10, 50 | Payload size compared with `broad` (limit 100) |
| `subject` | “computer” in CS | Subject selectivity |
| `multiword` | “data structures”, default filters | Multiple text terms |
| `current_multiword` | “data structures” in Fall 2026 | Matches the home-page query |
| `filtered` | CS, Fall 2026, 200 level, Lecture | Several filters, no text |
| `sparse` | “operating systems” in CS, Fall 2026, Lecture | Narrow text and filters |

All cases use the same credit range; the result limit is 100 unless a case overrides it. The direct Redis query mirrors the app's current query construction. Compare the document counts printed by both modes; mismatched counts can mean the two targets have different data or the query construction has drifted. Results depend on the indexed snapshot, machine, and network, so record those when comparing runs. Run `node benchmark/benchmark-redis.js` separately for a `PING` round-trip baseline.

For `api` runs, `headers` is time from starting `fetch` until response headers, `body` is reading the response text, and `parse` is `JSON.parse`. These are per-phase p50 values and need not sum to the total p50. The printed byte count is the UTF-8 response size. Compare `broad_1`, `broad_10`, `broad_50`, and `broad` to isolate how result size affects latency.

For server profiling, run `BENCH_PROFILE=1 node benchmark/benchmark-search.js api`. This adds `__profile=1` to each request. The API then returns a `Server-Timing` header: `params` covers query parameter handling plus `searchCourses` (including Redis connection/query/result decoding), and `serialize` covers `JSON.stringify`. The runner prints their p50 values. The profiled response uses an explicit `JSON.stringify`/`send` path, so compare profiled cases with each other; use ordinary runs for the normal API latency baseline.

The home page now requests `view=card`: only card fields and the GPA summary precomputed by `server/push.py`. Full grade histories remain available through the detail endpoint. Without `view=card`, search still returns full documents. The result limit remains 100. The page uses a 25 ms debounce, aborts stale requests, and transitions result updates. The visible timer still measures fetch plus JSON parsing; it excludes debounce and rendering.

Compare `node benchmark/benchmark-search.js api current_multiword` with `node benchmark/benchmark-search.js api current_multiword_card` to measure the response size and API latency difference for the same query. `view` has no effect in direct Redis mode; the API still reads full Redis documents before projecting the response. Compare the same case, dataset, and production server configuration for each change.
