import csv
import re
import os
from datetime import datetime

INPUT_FILE = "../data/raw_logs.txt" 
OUTPUT_FILE = "../data/cleaned_logs.csv"

CSV_HEADERS = ["timestamp", "ip_address", "event_type", "severity", "status"]

VALID_EVENT_TYPES = {
    "login",
    "logout",
    "file_access",
    "failed_login",
    "port_scan",
    "attack",
    "malware_detected"
}

VALID_SEVERITIES = {"low", "medium", "high"}

VALID_STATUSES = {"success", "failure"}

TIMESTAMP_PATTERN = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$"
)

IP_PATTERN = re.compile(
    r"^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}"
    r"(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$"
)


def is_valid_timestamp(value: str) -> bool:
    """Return True if value matches YYYY-MM-DDTHH:MM:SSZ and is a real date."""
    if not TIMESTAMP_PATTERN.match(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
        return True
    except ValueError:
        return False


def is_valid_ip(value: str) -> bool:
    """Return True if value is a well-formed IPv4 address."""
    return bool(IP_PATTERN.match(value))


def is_valid_event(value: str) -> bool:
    return value in VALID_EVENT_TYPES


def is_valid_severity(value: str) -> bool:
    return value in VALID_SEVERITIES


def is_valid_status(value: str) -> bool:
    return value in VALID_STATUSES


def parse_line(line: str):
    """
    Parse a single raw log line.

    Expected format:
    timestamp,ip_address,event_type,severity,status
    """

    line = line.strip()

    if not line:
        return None

    fields = line.split(",")

    if len(fields) != 5:
        return None

    timestamp, ip_address, event_type, severity, status = (
        f.strip() for f in fields
    )

    if not is_valid_timestamp(timestamp):
        return None

    if not is_valid_ip(ip_address):
        return None

    if not is_valid_event(event_type):
        return None

    if not is_valid_severity(severity):
        return None

    if not is_valid_status(status):
        return None

    return {
        "timestamp": timestamp,
        "ip_address": ip_address,
        "event_type": event_type,
        "severity": severity,
        "status": status,
    }


def parse_logs(input_file=INPUT_FILE, output_file=OUTPUT_FILE):

    total_lines = 0
    valid_count = 0
    invalid_count = 0

    cleaned_rows = []

    try:
        with open(input_file, "r") as infile:

            for line in infile:

                total_lines += 1

                result = parse_line(line)

                if result:
                    cleaned_rows.append(result)
                    valid_count += 1
                else:
                    invalid_count += 1

    except FileNotFoundError:
        print(f"[ERROR] Input file not found: {input_file}")
        print("Run threat_simulator.py first.")
        return

    with open(output_file, "w", newline="") as outfile:

        writer = csv.DictWriter(
            outfile,
            fieldnames=CSV_HEADERS
        )

        writer.writeheader()
        writer.writerows(cleaned_rows)

    print("=" * 45)
    print("Log Parsing & Cleaning Completed")
    print("=" * 45)
    print(f"Input File       : {input_file}")
    print(f"Output File      : {output_file}")
    print(f"Total Lines Read : {total_lines}")
    print(f"Valid Records    : {valid_count}")
    print(f"Dropped Records  : {invalid_count}")

    if total_lines > 0:
        retention = (valid_count / total_lines) * 100
        print(f"Retention Rate   : {retention:.1f}%")

    print("=" * 45)


if __name__ == "__main__":
    parse_logs()
