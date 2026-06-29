# 🤖 AI Client-Server Application

A simple **AI-powered Client-Server web application** built using **Python Flask** for the backend and **HTML, CSS, and JavaScript** for the frontend. The application demonstrates how a client interacts with a server through REST APIs to send user requests and receive AI-generated responses.

---

# 📌 Project Overview

The AI Client-Server Application provides a web interface where users can submit prompts to an AI backend. The backend processes these requests and returns responses via RESTful APIs.

This project demonstrates:

- Client-server communication
- REST API development using Flask
- Frontend-backend integration
- JSON request and response handling
- Software architecture documentation

---

# 🎯 Project Objectives

- Develop a Flask-based backend server.
- Create REST API endpoints.
- Design a responsive frontend interface.
- Connect frontend and backend using HTTP requests.
- Document APIs and system architecture.
- Demonstrate end-to-end client-server communication.

---

# 🛠 Technologies Used

| Technology | Purpose |
|------------|---------|
| Python | Backend Development |
| Flask | REST API Framework |
| HTML5 | Frontend Structure |
| CSS3 | Styling |
| JavaScript | Client-side Logic |
| JSON | Data Exchange |

---

# 📂 Project Structure

```text
AI-Client-Server/
│
├── frontend/
│   ├── index.html          # User Interface
│   ├── style.css           # Styling
│   └── script.js           # API Calls
│
├── src/
│   ├── app.py              # Flask Backend
│   ├── threat_simulator.py # Log Generator
│   ├── log_parser.py       # Log Parser
│   └── README.md
│
├── reports/
│   ├── README.md
│   ├── API_Specification.md
│   ├── Data_Source_Documentation.md
│   ├── Architecture_Diagram.png
│   └── Sequence_Diagram.png
│
├── raw_logs.txt
├── cleaned_logs.csv
├── requirements.txt
└── README.md
```

---

# ⚙️ Features

- User-friendly web interface
- Flask REST API
- JSON-based communication
- Client-server architecture
- Modular project structure
- API documentation
- Architecture and sequence diagrams

---

# 🏗 System Architecture

```text
+---------------------+
|     Frontend        |
| HTML • CSS • JS     |
+----------+----------+
           |
           | HTTP Requests (REST API)
           |
+----------v----------+
|    Flask Backend    |
|      app.py         |
+----------+----------+
           |
           | AI Processing
           |
+----------v----------+
|   AI Response Engine|
+---------------------+
```

---

# 🔄 Workflow

1. User enters a prompt in the frontend.
2. JavaScript sends an HTTP request to the Flask backend.
3. Flask receives and processes the request.
4. The AI engine generates a response.
5. Flask returns the response as JSON.
6. The frontend displays the AI response.

---

# 📡 API Endpoints

## Health Check

**GET /**

Returns a welcome message indicating that the server is running.

### Sample Response

```json
{
    "message": "Welcome to AI Client Server"
}
```

---

## Generate AI Response

**POST /predict**

### Request Body

```json
{
    "prompt": "Hello AI"
}
```

### Success Response

```json
{
    "response": "Hello! How can I assist you today?"
}
```

---

# 🚀 Installation

## Clone the Repository

```bash
git clone https://github.com/your-username/AI-Client-Server.git
```

```bash
cd AI-Client-Server
```

## Create Virtual Environment (Optional)

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

or

```bash
pip install flask
```

## Run the Flask Server

```bash
python src/app.py
```

## Open the Frontend

Open:

```
frontend/index.html
```

in your web browser.

---

# 📷 Project Documentation

The `reports` folder contains:

- Project documentation
- API Specification
- Architecture Diagram
- Sequence Diagram

---

# 👥 Team Members

| Role | Responsibility |
|------|----------------|
| Member 1 | Backend Developer |
| Member 2 | API Engineer |
| Member 3 | System Architect |
| Member 4 | Frontend UI Developer |
| Member 5 | Technical Writer |
| Member 6 | Integration Lead |

---

# 📌 Future Enhancements

- Integrate advanced AI models
- User authentication and authorization
- Database integration
- Conversation history
- Responsive UI improvements
- Cloud deployment (AWS, Azure, Render)

---

# 📄 License

This project is developed for **educational and learning purposes**.

---

# 🙏 Acknowledgements

- Python Community
- Flask Framework
- HTML, CSS and JavaScript Documentation
- Open Source Contributors

---

# 📊 Data Source Documentation

## 📌 Overview

This project also includes a **Cybersecurity Threat Detection Pipeline** that simulates the generation, processing, and cleaning of security logs. The processed dataset is suitable for analytics, visualization, and machine learning.

---

## 🔄 Data Pipeline Flow

```text
threat_simulator.py
        │
        ▼
   raw_logs.txt
        │
        ▼
   log_parser.py
        │
        ▼
 cleaned_logs.csv
```

---

## 📂 Data Files

| File | Description |
|------|-------------|
| raw_logs.txt | Contains unstructured simulated security logs with noise and malformed entries |
| cleaned_logs.csv | Contains cleaned, validated, and structured log data |

---

## ⚙️ Data Generation

Logs are generated using **threat_simulator.py**.

Each log entry contains:

- Random UTC timestamps
- IPv4 addresses
- Event types
- Severity levels
- Status values
- Noise and malformed records

---

## 📋 Dataset Schema

| Field | Description |
|-------|-------------|
| timestamp | Event timestamp (UTC) |
| ip_address | Source IPv4 address |
| event_type | Event category |
| severity | Risk Level (Low, Medium, High) |
| status | Success / Failure |

---

## 🔎 Severity Mapping

| Severity | Description |
|----------|-------------|
| Low | Normal activity |
| Medium | Suspicious activity |
| High | Malicious activity |

---

## ⚠️ Raw Data Characteristics

The generated logs intentionally contain:

- Invalid IP addresses
- Noise tokens (`###`, `INVALID`, `??`)
- Missing fields
- Extra fields
- Corrupted entries
- Inconsistent formatting

These simulate real-world cybersecurity log collection.

---

## 🧹 Data Cleaning Process

The `log_parser.py` script:

- Removes malformed timestamps
- Removes invalid IP addresses
- Eliminates corrupted records
- Removes noise tokens
- Extracts relevant fields
- Converts TXT logs into CSV
- Produces structured datasets

---

## 📊 Sample Cleaned Data

```csv
timestamp,ip_address,event_type,severity,status
2026-06-18T10:15:30Z,192.168.1.10,login,low,success
2026-06-18T10:17:02Z,10.0.0.5,failed_login,medium,failure
2026-06-18T10:18:45Z,172.16.0.3,attack,high,failure
```

---

## 🚀 Running the Data Pipeline

Generate Logs

```bash
python src/threat_simulator.py
```

Clean Logs

```bash
python src/log_parser.py
```

---

## 📊 Metadata

| Property | Value |
|----------|-------|
| Data Type | Simulated |
| Input Format | TXT |
| Output Format | CSV |
| Time Standard | UTC |
| Record Generation | Dynamic |

---

## 📚 Usage

This dataset can be used for:

- Cybersecurity log analysis
- Data cleaning practice
- Log parsing demonstrations
- Intrusion detection workflows
- Machine learning experiments
- Anomaly detection

---

## ✅ Conclusion

This repository combines a **Flask-based AI Client-Server Application** with a **Cybersecurity Threat Detection Data Pipeline**, demonstrating REST APIs, frontend-backend communication, log generation, data cleaning, and structured dataset preparation in a single project.
