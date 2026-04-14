# 🌞 SolarWise - Solar Energy Assessment Platform

[![Python](https://img.shields.io/badge/Python-3.12+-green.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-red.svg)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![NASA API](https://img.shields.io/badge/NASA-POWER-blue.svg)](https://power.larc.nasa.gov/)

**SolarWise** helps homeowners check if solar panels are worth it for their home. Enter your location, monthly bill, and roof details - get instant solar potential score and savings in ₹!

---

## 🚀 Quick Features

| Feature | Description |
|---------|-------------|
| 🔐 **User Accounts** | Sign up, login, save assessments |
| 📍 **Location Based** | Works anywhere using NASA satellite data |
| 💰 **₹ Savings** | All calculations in Indian Rupees |
| 📊 **Solar Score** | 0-100 rating for your home |
| 🎓 **Learn Section** | Solar basics explained simply |
| 🗑️ **Delete Account** | Remove account & all data |

---

## 🏗️ How It Works

### Solar Score Formula

| Component | Max Points | What It Means |
|-----------|------------|---------------|
| ☀️ Sunlight | 40 | How much sun your location gets |
| 🏠 Roof Area | 20 | Space available for panels |
| 🌳 Shading | 20 | Trees/buildings blocking sun |
| 💰 Savings | 20 | Money you'll save on bills |

**Total Score 0-100 → Recommendation**

---

## 💻 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python Flask |
| Database | MySQL |
| APIs | NASA POWER, OpenWeatherMap |

---

## 🔌 APIs Used

### 1. NASA POWER API (Free, no key needed)
- **What it does:** Gives solar radiation data for any location
- **Why needed:** Tells how much sunlight your home gets

### 2. OpenWeatherMap API (Free, needs key)
- **What it does:** Converts city name to coordinates
- **Why needed:** So you can type "Mumbai" instead of coordinates

---

## 📊 Database Tables

| Table | What it stores |
|-------|----------------|
| users | Account info (username, email, hashed password) |
| user_sessions | Login sessions (30-day expiry) |
| assessments | All saved solar assessment results |
| solar_cache | Cached API responses (faster loading) |

---

## 📱 App Flow

```mermaid
flowchart LR
    A[Homepage] --> B{Have account?}
    B -->|No| C[Sign Up]
    B -->|Yes| D[Login]
    C --> D
    D --> E[Profile Page]
    
    A --> F[Take Assessment]
    F --> G[Enter location & bill]
    G --> H[Get Solar Score]
    H --> I{Save?}
    I -->|Yes| E
    I -->|No| F

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
Snapshots of the platform which shows the homepage, Solar Potential and Basics of Solar
<img width="1919" height="1076" alt="image" src="https://github.com/user-attachments/assets/b54b089d-23b4-40aa-8192-bb8d3471d828" />
<img width="1908" height="1017" alt="image" src="https://github.com/user-attachments/assets/ae932aca-dedd-40e5-8b21-eaaaf7a7217a" />
<img width="1715" height="1004" alt="image" src="https://github.com/user-attachments/assets/5c84c7c8-bc57-4ffd-bd6a-5680ea39a0be" />
<img width="1411" height="1015" alt="image" src="https://github.com/user-attachments/assets/3f2db267-26fc-404d-876a-7cd9999d31b7" />



Challenges Faced & Solutions

Challenge	                                 Solution

CORS error (frontend can't talk to backend)	Added Flask-CORS with proper headers
Deleting user should delete all data	      MySQL FOREIGN KEY with ON DELETE CASCADE
Dollar to Rupee conversion	Changed all calculations to ₹7/kWh rate

  Contributors
Name	      	Contributions
Kirti Nair	   MySQL database and backend, API Integration
Kirtana Minoy  Frontend UI
