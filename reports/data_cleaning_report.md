# Data Cleaning Report — Before vs. After Analysis

**Owner:** Anushka — Documentation (Cleaning Report)
**Pipeline stage covered:** `threat_simulator.py` → `raw_logs.txt` → `log_parser.py` → `cleaned_logs.csv`
**Last run:** June 19, 2026

---

## 1. Purpose

This report documents how raw, unstructured log strings produced by `threat_simulator.py` are converted into clean, validated data cell records by `log_parser.py`. It shows exactly what each raw line looked like, what happened to it during cleaning, and why — so the dataset's quality and the cleaning logic are auditable.

---

## 2. Run Summary

A full pipeline run was executed to produce the figures in this report.

| Metric | Value |
|---|---|
| Total raw lines generated | 200 |
| Valid records retained | 160 |
| Records dropped | 40 |
| Retention rate | 80.0% |
| Output format | `timestamp,ip_address,event_type,severity,status` (CSV) |

These numbers are deterministic in structure but stochastic in content — `threat_simulator.py` injects noise into ~20% of records on every run (`NOISE_PERCENTAGE = 0.20`), so exact line contents differ run to run, but the *categories* of malformed data and the cleaning behavior below are consistent.

---

## 3. How a Raw String Becomes a Data Cell Record

Each raw line is plain text, comma-separated, with no guarantee of structure. `parse_line()` in `log_parser.py` performs the following steps, in order, on every line:

1. **Strip whitespace** — trims leading/trailing whitespace and the newline character.
2. **Skip empty lines** — blank lines are discarded immediately.
3. **Split on comma** and check the result has **exactly 5 fields**. Anything else (fewer or more) is dropped.
4. **Trim each field** individually (handles stray spaces around commas).
5. **Validate each field** against a strict rule:
   - `timestamp` — must match `YYYY-MM-DDTHH:MM:SSZ` *and* be a real calendar date/time (regex + `datetime.strptime` parse).
   - `ip_address` — must match a well-formed IPv4 pattern (each octet 0–255).
   - `event_type` — must be one of: `login`, `logout`, `file_access`, `failed_login`, `port_scan`, `attack`, `malware_detected`.
   - `severity` — must be one of: `low`, `medium`, `high`.
   - `status` — must be one of: `success`, `failure`.
6. **Reject on first failure** — if any single field fails validation, the entire line is dropped (no partial records).
7. **Emit a structured dict** — a line that passes all checks becomes a Python dict with the five named fields, which is then written as one row in `cleaned_logs.csv` via `csv.DictWriter`.

A raw string only becomes a data cell record if **all 5 fields are present and all 5 pass validation**. There is no partial repair or field substitution — the design is reject-if-invalid, not fix-if-invalid.

---

## 4. Before vs. After — Valid Records (Successfully Cleaned)

These raw lines passed every check unchanged and were converted directly into structured rows.

| # | Raw String (Before) | Parsed Record (After) |
|---|---|---|
| 1 | `2026-06-19T12:01:51Z,9.100.103.196,malware_detected,high,failure` | `{timestamp: 2026-06-19T12:01:51Z, ip_address: 9.100.103.196, event_type: malware_detected, severity: high, status: failure}` |
| 2 | `2026-06-19T17:01:00Z,154.255.207.211,failed_login,medium,failure` | `{timestamp: 2026-06-19T17:01:00Z, ip_address: 154.255.207.211, event_type: failed_login, severity: medium, status: failure}` |
| 3 | `2026-06-20T01:29:17Z,20.140.213.201,logout,low,success` | `{timestamp: 2026-06-20T01:29:17Z, ip_address: 20.140.213.201, event_type: logout, severity: low, status: success}` |
| 4 | `2026-06-20T09:44:28Z,11.24.14.21,login,low,success` | `{timestamp: 2026-06-20T09:44:28Z, ip_address: 11.24.14.21, event_type: login, severity: low, status: success}` |

Resulting CSV rows:

```csv
timestamp,ip_address,event_type,severity,status
2026-06-19T12:01:51Z,9.100.103.196,malware_detected,high,failure
2026-06-19T17:01:00Z,154.255.207.211,failed_login,medium,failure
2026-06-20T01:29:17Z,20.140.213.201,logout,low,success
2026-06-20T09:44:28Z,11.24.14.21,login,low,success
```

---

## 5. Before vs. After — Rejected Records (Dropped During Cleaning)

Of the 200 raw lines, 40 were dropped. Every dropped line falls into one of four categories, all produced intentionally by `threat_simulator.py`'s noise-injection logic (`generate_invalid_log()`).

### 5.1 Category breakdown

| Category | Count | % of Dropped | Cause |
|---|---|---|---|
| Invalid IP address | 11 | 27.5% | IP fails the IPv4 regex (out-of-range octets, truncated, non-numeric) |
| Missing fields | 10 | 25.0% | Line has fewer than 5 comma-separated fields |
| Pure noise token | 10 | 25.0% | Entire line is a single junk token, no structure at all |
| Extra field | 9 | 22.5% | Line has 6 fields instead of 5 |
| **Total dropped** | **40** | **100%** | |

**Reconciliation check:** 160 valid + 11 + 10 + 10 + 9 = 200 raw lines. ✅ All input lines are accounted for — nothing is silently lost outside these categories.

### 5.2 Examples by category

**A. Invalid IP address** — line structurally correct, but the IP fails validation.

| Raw String (Before) | Result (After) | Reason Rejected |
|---|---|---|
| `2026-06-19T15:30:49Z,300.400.500.600,failed_login,medium,failure` | *dropped* | Octets exceed 255 |
| `2026-06-19T13:47:07Z,192.168,logout,low,success` | *dropped* | Incomplete IP (only 2 octets) |
| `2026-06-19T21:15:17Z,abc.def.ghi.jkl,file_access,low,success` | *dropped* | Non-numeric, not an IP at all |

**B. Missing fields** — line has only 3 of the required 5 fields (timestamp, IP, event type present; severity and status absent).

| Raw String (Before) | Result (After) | Reason Rejected |
|---|---|---|
| `2026-06-19T15:39:17Z,31.109.219.64,file_access` | *dropped* | Only 3 fields, expected 5 |
| `2026-06-19T14:41:32Z,51.120.252.123,login` | *dropped* | Only 3 fields, expected 5 |
| `2026-06-20T03:33:07Z,53.199.170.104,port_scan` | *dropped* | Only 3 fields, expected 5 |

**C. Pure noise token** — the entire "line" is a single corrupted/placeholder string with no delimiters at all.

| Raw String (Before) | Result (After) | Reason Rejected |
|---|---|---|
| `SYSTEM_ERROR` | *dropped* | Not comma-separated; 1 field, expected 5 |
| `###` | *dropped* | Not comma-separated; 1 field, expected 5 |
| `CORRUPTED_LOG` | *dropped* | Not comma-separated; 1 field, expected 5 |

**D. Extra field** — a 6th, unexpected token (`EXTRA_FIELD`) appended after a valid 5-field record.

| Raw String (Before) | Result (After) | Reason Rejected |
|---|---|---|
| `2026-06-20T08:19:25Z,24.223.36.101,file_access,low,success,EXTRA_FIELD` | *dropped* | 6 fields, expected exactly 5 |
| `2026-06-20T04:55:45Z,237.69.84.150,login,low,success,EXTRA_FIELD` | *dropped* | 6 fields, expected exactly 5 |
| `2026-06-19T23:37:19Z,47.215.136.69,file_access,low,success,EXTRA_FIELD` | *dropped* | 6 fields, expected exactly 5 |

> Note: these four categories cover the noise types the simulator currently generates. Other malformed-timestamp or malformed-event/severity/status values would also be rejected by `parse_line()`, but the simulator does not yet produce that noise type in this run — see Section 7.

---

## 6. Schema Reference (Cleaned Output)

| Field | Type | Allowed Values / Format | Source Validation |
|---|---|---|---|
| `timestamp` | string (ISO 8601, UTC) | `YYYY-MM-DDTHH:MM:SSZ` | Regex + real-date check |
| `ip_address` | string (IPv4) | 4 dot-separated octets, each 0–255 | Regex |
| `event_type` | enum | `login`, `logout`, `file_access`, `failed_login`, `port_scan`, `attack`, `malware_detected` | Set membership |
| `severity` | enum | `low`, `medium`, `high` | Set membership |
| `status` | enum | `success`, `failure` | Set membership |

---

## 7. Observations & Recommendations

- **Cleaning is "reject," not "repair."** No field is auto-corrected (e.g., no clamping of out-of-range IP octets, no default-filling of missing fields). This favors data correctness over volume, which is appropriate for a security dataset.
- **All-or-nothing field validation.** A single bad field invalidates the whole record, even if the other 4 fields are perfectly valid. This is simple and safe but means one bad field type (e.g., IP) accounts for a disproportionate share of total data loss (27.5% of all rejections here) even when the rest of the line was usable.
- **Coverage gap in the simulator's noise generator:** `threat_simulator.py` currently never produces malformed *timestamps*, invalid *event_type* strings, or invalid *severity/status* values as noise (`generate_invalid_log()` only produces pure-noise tokens, bad IPs, missing fields, or extra fields). The parser's `is_valid_timestamp`, `is_valid_event`, `is_valid_severity`, and `is_valid_status` checks are therefore exercised by validation logic but not by this dataset's actual noise distribution. Recommend the simulator team (Member 1) add these noise types for fuller test coverage of the cleaning pipeline.
- **Retention rate (80.0%) matches the simulator's configured noise rate (`NOISE_PERCENTAGE = 0.20`) exactly**, confirming the parser drops precisely the noise the simulator injects, with no false rejections of well-formed data and no false acceptances of malformed data observed in this run.
- **CSV line endings:** `csv.DictWriter` on this system writes `\r\n` line terminators (standard CSV behavior) — worth noting for downstream tools that assume Unix-style `\n` only.

---

## 8. Files Referenced

- `src/threat_simulator.py` — generates `data/raw_logs.txt`
- `src/log_parser.py` — generates `data/cleaned_logs.csv`
- `data/raw_logs.txt` — raw input for this report (200 lines)
- `data/cleaned_logs.csv` — cleaned output for this report (160 rows + header)
