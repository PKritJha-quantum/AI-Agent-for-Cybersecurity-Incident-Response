# src/threat_simulator.py

import random
import os
from datetime import datetime, timedelta

# Configuration


TOTAL_LOGS = 200
NOISE_PERCENTAGE = 0.20

EVENT_TYPES = [
    ("login", "low", "success"),
    ("logout", "low", "success"),
    ("file_access", "low", "success"),
    ("failed_login", "medium", "failure"),
    ("port_scan", "medium", "failure"),
    ("attack", "high", "failure"),
    ("malware_detected", "high", "failure"),
]

NOISE_STRINGS = [
    "###",
    "INVALID",
    "???",
    "CORRUPTED_LOG",
    "SYSTEM_ERROR"
]


# Timestamp Generation


def generate_timestamp():
    start = datetime.utcnow()
    random_offset = random.randint(0, 86400)

    timestamp = start + timedelta(seconds=random_offset)

    return timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")

# IP Generation


def generate_valid_ip():
    return ".".join(
        str(random.randint(1, 255))
        for _ in range(4)
    )


def generate_invalid_ip():
    invalid_ips = [
        "999.999.999.999",
        "300.400.500.600",
        "abc.def.ghi.jkl",
        "192.168",
        "10.0.0.999"
    ]

    return random.choice(invalid_ips)


# Valid Logs


def generate_valid_log():

    event, severity, status = random.choice(EVENT_TYPES)

    return (
        f"{generate_timestamp()},"
        f"{generate_valid_ip()},"
        f"{event},"
        f"{severity},"
        f"{status}"
    )

# Invalid Logs


def generate_invalid_log():

    noise_type = random.randint(1, 4)

    event, severity, status = random.choice(EVENT_TYPES)

    if noise_type == 1:
        return random.choice(NOISE_STRINGS)

    elif noise_type == 2:
        return (
            f"{generate_timestamp()},"
            f"{generate_invalid_ip()},"
            f"{event},"
            f"{severity},"
            f"{status}"
        )

    elif noise_type == 3:
        return (
            f"{generate_timestamp()},"
            f"{generate_valid_ip()},"
            f"{event}"
        )

    else:
        return (
            f"{generate_timestamp()},"
            f"{generate_valid_ip()},"
            f"{event},"
            f"{severity},"
            f"{status},"
            f"EXTRA_FIELD"
        )


# Dataset Creation


def generate_logs(total_logs):

    logs = []

    valid_count = 0
    invalid_count = 0

    for _ in range(total_logs):

        if random.random() < (1 - NOISE_PERCENTAGE):
            logs.append(generate_valid_log())
            valid_count += 1

        else:
            logs.append(generate_invalid_log())
            invalid_count += 1

    return logs, valid_count, invalid_count


# Save File


def save_logs(filename="../data/raw_logs.txt"):

    logs, valid_count, invalid_count = generate_logs(TOTAL_LOGS)

    with open(filename, "w") as file:

        for log in logs:
            file.write(log + "\n")

    print("=" * 40)
    print("Threat Simulation Completed")
    print("=" * 40)
    print(f"Total Logs Generated : {TOTAL_LOGS}")
    print(f"Valid Logs           : {valid_count}")
    print(f"Invalid Logs         : {invalid_count}")
    print(f"Output File          : {filename}")
    print("=" * 40)


# Main


if __name__ == "__main__":
    save_logs()
