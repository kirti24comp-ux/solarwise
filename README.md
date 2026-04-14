# 🌞 SolarWise - Solar Energy Assessment Platform

[![Python](https://img.shields.io/badge/Python-3.12+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-red.svg)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![NASA API](https://img.shields.io/badge/NASA-POWER-blue.svg)](https://power.larc.nasa.gov/)

**SolarWise** helps homeowners check if solar panels are worth it for their home. Enter your location, monthly bill, and roof details - get instant solar potential score and savings in ₹!

---

##  Quick Features

| Feature | Description |
|---------|-------------|
|  **User Accounts** | Sign up, login, save assessments |
|  **Location Based** | Works anywhere using NASA satellite data |
|  **₹ Savings** | All calculations in Indian Rupees |
|  **Solar Score** | 0-100 rating for your home |
|  **Learn Section** | Solar basics explained simply |
|  **Delete Account** | Remove account & all data |

---

##  How It Works

### Solar Score Formula

| Component | Max Points | What It Means |
|-----------|------------|---------------|
|  Sunlight | 40 | How much sun your location gets |
|  Roof Area | 20 | Space available for panels |
|  Shading | 20 | Trees/buildings blocking sun |
|  Savings | 20 | Money you'll save on bills |

**Total Score 0-100 → Recommendation**

---

##  Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python Flask |
| Database | MySQL |
| APIs | NASA POWER, OpenWeatherMap |

---

## APIs Used

### 1. NASA POWER API 
 Gives solar radiation data for any location


### 2. OpenWeatherMap API 
 Converts city name to coordinates


---

##  Database Tables

| Table | What it stores |
|-------|----------------|
| users | Account info (username, email, hashed password) |
| user_sessions | Login sessions (30-day expiry) |
| assessments | All saved solar assessment results |
| solar_cache | Cached API responses (faster loading) |

---

##  App Flow

<img width="1218" height="484" alt="image" src="https://github.com/user-attachments/assets/3028dd41-9080-438d-ab00-68780275343e" />

Calculation Example
Input:

Location: Delhi

Monthly Bill: ₹2000

Roof Area: 500 sq ft

Shading: Moderate

NASA Data: 5.2 kWh/m²/day (solar radiation)

Output:

Solar Score: 68/100 (Good)

System Size: 3.5 kW

Annual Savings: ₹15,000

Payback: 8-10 years

Snapshots of the platform which shows the following: 
Homepage
<img width="1919" height="1076" alt="image" src="https://github.com/user-attachments/assets/b54b089d-23b4-40aa-8192-bb8d3471d828" />

Solar Potential Form
<img width="1908" height="1017" alt="image" src="https://github.com/user-attachments/assets/ae932aca-dedd-40e5-8b21-eaaaf7a7217a" />

Solar Potential Result
<img width="1715" height="1004" alt="image" src="https://github.com/user-attachments/assets/5c84c7c8-bc57-4ffd-bd6a-5680ea39a0be" />

Basics of Solar
<img width="1411" height="1015" alt="image" src="https://github.com/user-attachments/assets/3f2db267-26fc-404d-876a-7cd9999d31b7" />



Challenges Faced & Solutions

Challenge	   

CORS error (frontend can't talk to backend)	

Deleting user should delete all data

Dollar to Rupee conversion	

Solution

Added Flask-CORS with proper headers

MySQL FOREIGN KEY with ON DELETE CASCADE

Changed all calculations to ₹7/kWh rate


Contributors

Kirti Nair	 CEB435  
MySQL database and backend, API Integration

Kirtana Minoy  CEB428
Frontend UI
