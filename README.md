# 📊 Data Source Documentation

## 📌 Overview

This project simulates a cybersecurity threat detection pipeline. It involves generating raw log data, processing and cleaning it, and transforming it into a structured dataset suitable for analysis and modeling.

The pipeline demonstrates how real-world security logs can be handled, even when they contain noise, inconsistencies, or malformed entries.

---

## 🔄 Data Pipeline Flow

```
threat_simulator.py → raw_logs.txt → log_parser.py → cleaned_logs.csv
```

---

## 📂 Data Files

* **raw_logs.txt** → Contains unstructured simulated log data with noise and inconsistencies
* **cleaned_logs.csv** → Contains structured, validated, and cleaned data ready for analysis

---

## ⚙️ Data Generation

* Logs are generated using `threat_simulator.py`
* Each log entry represents a simulated system or network event
* Data includes:

  * Random timestamps (UTC)
  * IP addresses (valid and invalid)
  * Event types
  * Noise and malformed entries to mimic real-world logs

---

## 🧾 Data Schema

| Field Name | Description                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| timestamp  | Date and time of the event (UTC format)                                        |
| ip_address | Source IP address (IPv4 format)                                                |
| event_type | Type of event (e.g., login, failed_login, attack, port_scan, malware_detected) |
| severity   | Risk level (low, medium, high)                                                 |
| status     | Event outcome (success or failure)                                             |

### 🔎 Severity Mapping (Example)

* **Low** → Normal activity (e.g., successful login)
* **Medium** → Suspicious activity (e.g., failed login attempts)
* **High** → Malicious activity (e.g., attacks, malware detection)

---

## ⚠️ Raw Data Characteristics

The raw logs are intentionally noisy and may include:

* Invalid or fake IP addresses
* Noise tokens (e.g., `###`, `INVALID`, `??`)
* Missing or extra fields
* Inconsistent formatting

This simulates real-world log collection challenges.

---

## 🧹 Data Cleaning Process

Cleaning is performed using `log_parser.py`, which:

* Removes entries with malformed timestamps
* Filters out invalid IP address formats
* Eliminates noise tokens and corrupted rows
* Drops records with missing required fields
* Extracts relevant fields from raw text
* Converts structured data into CSV format
* Ensures consistency across all records

---

## 📊 Sample Cleaned Data

```csv
timestamp,ip_address,event_type,severity,status
2026-06-18T10:15:30Z,192.168.1.10,login,low,success
2026-06-18T10:17:02Z,10.0.0.5,failed_login,medium,failure
2026-06-18T10:18:45Z,172.16.0.3,attack,high,failure
```

---

## 📊 Metadata

* **Data Type:** Simulated
* **Format Conversion:** `.txt` → `.csv`
* **Record Generation:** Dynamic
* **Time Standard:** UTC
* **Last Updated:** June 18, 2026

---

## 📎 Assumptions

* All timestamps follow UTC format
* Data is synthetic and intended for testing and learning
* Event categories are predefined and controlled
* Cleaning rules are consistent across all datasets

---

## 📘 Usage

This dataset is intended for:

* Building and testing log parsing pipelines
* Practicing data cleaning and preprocessing techniques
* Simulating cybersecurity monitoring systems
* Demonstrating intrusion detection workflows
* Training basic anomaly detection or classification models

---

## 👥 Team Responsibilities

* **Member 1:** Log Generation (`threat_simulator.py`)
* **Member 2:** Data Parsing & Cleaning (`log_parser.py`)
* **Member 3:** Configuration & Environment Setup
* **Member 4:** Documentation & Reporting
* **Member 5:** Data Quality Validation & Cleaning Report
* **Member 6:** Integration Testing & Final Validation

---

## ✅ Conclusion

This project provides a complete mini-pipeline for simulating, processing, and structuring cybersecurity log data. It reflects real-world challenges in log handling and prepares the dataset for downstream analysis and security applications.
