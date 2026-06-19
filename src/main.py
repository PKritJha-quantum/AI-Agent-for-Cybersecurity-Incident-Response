import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)
    
try:
    import threat_simulator
    import log_parser
    import remediation_control
except ImportError as e:
    print(f"\n❌ [CRITICAL ERROR]: Pipeline execution halted.")
    print(f"Missing dependency component: {e}")
    print("Ensure threat_simulator.py, log_parser.py, and remediation_controls.py are all in the same folder as main.py.\n")
    sys.exit(1)

def run_integration_pipeline():
    print("🚀 [STARTING MASTER INTEGRATION TESTING - WEEK 2] 🚀\n")
    
    raw_log_path = os.path.join(current_dir, "../data/raw_logs.txt")
    clean_csv_path = os.path.join(current_dir, "../data/cleaned_logs.csv")
    
    print("Running Module 1: Threat Simulator Engine...")
    threat_simulator.save_logs(raw_log_path)
    print("\n" + "-"*50 + "\n")
    
    print("Running Module 2: Data Cleaning Parser...")
    log_parser.parse_logs(raw_log_path, clean_csv_path)
    print("\n" + "-"*50 + "\n")
    
    print("Running Module 6: Automation & Threshold Evaluator...")
    simulated_attacker = "185.220.101.5" 
    print(f"Analyzing log anomalies for IP: {simulated_attacker}")
    status = remediation_control.evaluate_login_anomalies(simulated_attacker, failed_attempts=8)
    
    print(f"\n🏁 Pipeline System Status: {status}")
    print("\n🚀 [ALL SYSTEMS SYNCED AND VALIDATED - WEEK 2 DONE] 🚀")

if __name__ == "__main__":
    run_integration_pipeline()
