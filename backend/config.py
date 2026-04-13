# backend/config.py
import os
from dotenv import load_dotenv
import os.path

# Load .env from parent directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded .env from: {env_path}")
else:
    load_dotenv()
    print("⚠️  .env file not found")

class Config:
    # Database Configuration
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DB = os.getenv('MYSQL_DB', 'solarwise')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    
    # API Keys
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    
    # Currency Configuration (₹ Rupees)
    CURRENCY_SYMBOL = '₹'
    AVG_COST_PER_KWH = 7.0  # ₹7 per kWh (average Indian electricity rate)
    
    # App Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Session Configuration
    SESSION_EXPIRY_DAYS = 30
    
    @classmethod
    def format_currency(cls, amount):
        """Format amount in Indian Rupees"""
        return f"{cls.CURRENCY_SYMBOL}{amount:,.2f}"