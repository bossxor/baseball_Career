# Season API profiling: partial, 2026-11-08

Status: **three regular seasons completed; US partial; design 135 step 0 remains incomplete**. Measurements use Hono `app.request`, in-memory PGlite, server-supplied commands and V8 inspector. No network socket or external PostgreSQL is involved. Prefix fixtures are controlled; completed season games are engine-generated. Times include profiler and HTTP/DB work, intervening reads and event choices. This is not an isolated component wall-time breakdown. Windows 10.0.26300, Node 24.20.0, Ryzen 5 9600X, 12 logical CPUs, 66 GB RAM.

| League | Status | Regular records | HTTP commands | Loop wall time | Source → final career SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| School | SEASON_REVIEW | 216 | 102 | 69.374 s | `9247637e0026f6228c7c1af3b136af8538cf7776bc9f29a53fe9bdcb6b672cfe` → `1d304251844ba3558a0dbfdd0ef67af07523dfda79cbde48463aa762e9f44e24` |
| College | SEASON_REVIEW | 216 | 6 | 30.805 s | `cc0aedefd6509b55397f3c5f0b3ed84da9ecf3b6134c800cb1c301a8112c373b` → `da9fd8da5c52509fe309300313465e42c81d88df88f6675a86dad96b3a246372` |
| KBO | SEASON_REVIEW | 1,440 | 55 | 1,436.012 s | `9352731906e5705e59380b9d7c5144f0af10b6c1573ae8a35b6ce598584f4cf8` → `533754a33db04115da7a73a1dc043653e4d8273e3d2effbb5212b6214262bb33` |
| US | HTTP 500, event decision, incomplete | 1,800 | 5, including failed command | 93.038 s | `305c73a6a4d691acbfa9fcee4fa4415a03805e54f89d44d974192c7ec47bc11d` → `70ffeb6d44c2626c553362ca80fcf220fd0091287b99b3888567f433ea8c8068` |

Each source hash remained unchanged. The US final hash describes the last successfully read state, not a completed season. KBO ran concurrently with a build and tests for an unknown interval; do not compare its wall time directly with the other runs. School and US include school-shell fix `78243ce`; college and KBO started at `d29db0f`. The earlier school failure at E43 is superseded by the new successful run, but its evidence remains preserved.

## Sample attribution, not wall time

Percentages below are exclusive, weighted V8 sample-time estimates assigned to the nearest matching function/file on each stack by `scripts/analyze-career-profile.mjs`. Helpers and native functions can be hidden or misattributed; DB waits are not measured. A zero means no matching samples, not zero cost. GC and unclassified are retained rather than distributed. Inspector itself has overhead; do not add these shares to HTTP elapsed times.

| League | Simulation | Day close | Validation | Clone | Seal | JSON | DB | GC | Idle | Unclassified |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| School | 6.88% | 2.25% | 0.93% | 21.75% | 0% | 0% | 56.60% | 3.34% | 0% | 8.25% |
| College | 14.56% | 4.05% | 2.22% | 49.92% | 0% | 0% | 7.40% | 4.39% | 0% | 17.45% |
| KBO | 10.39% | 1.16% | 1.21% | 48.78% | 0.31% | 0% | 11.69% | 6.20% | 0% | 20.27% |
| US partial | 11.09% | 5.02% | 5.12% | 30.02% | 1.24% | 0% | 20.43% | 3.19% | 0% | 23.89% |

Clone is a prominent sampled candidate for college and KBO; DB attribution dominates school; US cannot rank a full-season bottleneck. `canonicalJson` is a top KBO/college exclusive frame but has uses beyond sealing. Precise seven-component wall-time ratios and a complete US season are outstanding; no optimization is justified as a completed step-0 decision from these data alone.

## US error and evidence

The fourth US command stopped for an event. The following `CAREER_US_PLAY_RESOLVE_LEVEL` returned HTTP 500 (`INTERNAL_ERROR`); the API server logged `out of memory`. The log does not locate the allocation or establish whether it is specifically the PGlite WASM heap, Node heap, or another allocation. The run used PGlite and its error is not proof of a production PostgreSQL or engine defect. No PostgreSQL binaries or configured `PLAYBALL_LARGE_SAVE_DATABASE_URL`, `DATABASE_URL_DIRECT`, or `DATABASE_URL` were found by name; service enumeration was denied. No values were printed. An actual PostgreSQL HTTP run or further memory instrumentation is required; increasing the V8 heap alone is not a demonstrated fix.

Raw originals are retained. `CODEX-20261108-profile-{school,kbo,us}.json.gz` decompress byte-for-byte to their originals; corresponding `-metadata.json` files record raw SHA-256 and omit only the large CPU profile. `-analysis.json` files contain sample attribution. College uses `CODEX-20261107-profile-college.json` and `CODEX-20261107-profile-college-analysis.json`. School/US stdout and stderr are in `CODEX-20261108-profile-{school,us}.{stdout,stderr}.log`; US stderr contains the error. Exact commands: `node --import tsx scripts/profile-career-api.mjs <school|college|kbo|us> <output.json>` and `node scripts/analyze-career-profile.mjs <output.json>`.
