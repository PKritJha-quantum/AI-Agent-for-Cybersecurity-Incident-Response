import json
import os
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))

# Reconcile exact placement thresholds for config files dynamically
if os.path.basename(current_dir) == 'src':
    CONFIG_PATH = os.path.abspath(os.path.join(current_dir, "security_config.json"))
    BLACKLIST_PATH = os.path.abspath(os.path.join(current_dir, "..", "data", "firewall_blacklist.txt"))
else:
    CONFIG_PATH = os.path.abspath(os.path.join(current_dir, "src", "security_config.json"))
    if not os.path.exists(CONFIG_PATH):
        CONFIG_PATH = os.path.abspath(os.path.join(current_dir, "security_config.json"))
    BLACKLIST_PATH = os.path.abspath(os.path.join(current_dir, "data", "firewall_blacklist.txt"))

def load_security_settings():
    try:
        with open(CONFIG_PATH, "r") as file:
            config = json.load(file)
            # CRITICAL CORRECTION FIX: Read singular "parameter" from json to avoid internal KeyError drops
            settings = {item["parameter"]: item["values"] for item in config["security_settings"]}
            return settings 
    except Exception as e:
        print(f"⚠️ Config schema exception: Using built-in dictionary standards ({e}).")
        return {
            "trusted_ip_addresses": ["192.168.1.1"],
            "mock_system_thresholds": {"max_failed_login_attempts": 5}
        }
  
def block_malicious_ip(ip_address, reason="Automated AI Block"):
    settings = load_security_settings()
    if ip_address in settings.get("trusted_ip_addresses", []):
        print(f"[REMEDIATION DENIED]: IP {ip_address} matches trusted admin profile definitions.")
        return False

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    os.makedirs(os.path.dirname(BLACKLIST_PATH), exist_ok=True)
    
    with open(BLACKLIST_PATH, "a") as blacklist:
        blacklist.write(f"{timestamp} | BLOCKED | IP: {ip_address} | Reason: {reason}\n")
        print(f"[REMEDIATION EXECUTED]: Added target address {ip_address} to firewall blacklist file.")
        return True

def evaluate_login_anomalies(ip_address, failed_attempts):
    settings = load_security_settings()
    thresholds = settings.get("mock_system_thresholds", {})
    max_allowed = thresholds.get("max_failed_login_attempts", 5)

    if failed_attempts > max_allowed:
        block_malicious_ip(ip_address, reason=f"Exceeded maximum failed logins ({failed_attempts} attempts)")
        return "BLOCKED"
    return "ALLOWED"
