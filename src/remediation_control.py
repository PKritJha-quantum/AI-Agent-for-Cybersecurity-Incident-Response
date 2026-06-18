#remediation file
import json
import os
from datetime import datetime

CONFIG_PATH = "src/security_config.json" if os.path.exsits("src/security_config.json") else "security_condig.json"
BLACKLIST_PATH = "../data/firewall_blacklist.txt" if os.path.exists("../data") else "firewall_blacklist.txt"

def load_security_settings():
  try:
    with open(CONFIG_PATH, "r") as file:
      config =  json.load(file)
      settings = {items["parameters"] : item["values"] for item in config["security_settings"]}
      return settings 
  except FileNotFoundError:
      print(f"Warning: Configuration not found at {CONFIG_PATH}. Using local fallback thresholds.")
      return {
            "trusted_ip_addresses": ["192.168.1.1"],
            "mock_system_thresholds": {"max_failed_login_attempts": 5}
        }
  
def block_malicious_ip(ip_address, reason="Automated AI Block"):
  settings = load_security_settings()
  if ip_address in settings.get("trusted_ip_addresses", []):
    print(f"[REMEDIATON DENIED]: IP{ip_address} is a trusted admin IP. Skipping the block request.")
    return False

  timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

  os.makedirs(os.path.dirname(BLACKLIST_PATH), exist_ok=True) if "/" in BLACKLIST_PATH else None
  
  with open(BLACKLIST_PATH, "a") as blacklist:
    blacklist.write(f"{timestamp} | BLOCKED | IP: {ip_address} | Reason: {reason}\n")
    print(f"[REMEDIATION EXECUTED]: Successfully blocked malicious IP {ip_address}. Added to local firewall blacklist.")
    return True

def evaluate_login_anomalies(ip_address, failed_attempts):
    settings = load_security_settings()
    thresholds = settings.get("mock_system_thresholds", {})
    max_allowed = thresholds.get("max_failed_login_attempts", 5)

    print(f"Checking thresholds... Current failed attempts: {failed_attempts}/{max_allowed}")
    if failed_attempts > max_allowed:
      print(f"⚠️ Threshold breached by {ip_address}!")
      block_malicious_ip(ip_address, reason=f"Exceeded maximum failed logins ({failed_attempts} attempts)")
      return "BLOCKED"

if __name__ == "__main__":
  print("--- Testing Member 6 Remediation Engine ---")
  evaluate_login_anomalies("192.168.1.55", failed_attempts=7)
  evaluate_login_anomalies("192.168.1.1", failed_attempts=12)
