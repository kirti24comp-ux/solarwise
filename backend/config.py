# backend/config.py
import os
from dotenv import load_dotenv
import os.path

# Find and load .env file from parent directory
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
    print(f"✅ Loaded .env from: {dotenv_path}")
else:
    load_dotenv()  # Try current directory
    print("⚠️  .env file not found in parent directory, trying current directory")

class Config:
    """
    Configuration class for SolarWise application
    All sensitive data should be in .env file
    """
    
    # Database Configuration
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')  # ← CORRECT: Uses MYSQL_PASSWORD
    MYSQL_DB = os.getenv('MYSQL_DB', 'solarwise')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    
    # API Keys
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    
    # App Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', '0ebcd16e7fdb9c26e18829f4c32853c2333c13c992364bfaac9a18fd94ab0734')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Session Configuration
    SESSION_EXPIRY_DAYS = 30
    
    # Print configuration for debugging (remove in production)
    @classmethod
    def print_config(cls):
        """Print current configuration (hides sensitive data)"""
        print("\n=== SolarWise Configuration ===")
        print(f"Database Host: {cls.MYSQL_HOST}")
        print(f"Database User: {cls.MYSQL_USER}")
        print(f"Database Password: {'*' * len(cls.MYSQL_PASSWORD) if cls.MYSQL_PASSWORD else 'NOT SET'}")
        print(f"Database Name: {cls.MYSQL_DB}")
        print(f"Database Port: {cls.MYSQL_PORT}")
        print(f"API Key: {'*' * len(cls.OPENWEATHER_API_KEY) if cls.OPENWEATHER_API_KEY else 'NOT SET'}")
        print(f"Debug Mode: {cls.DEBUG}")
        print("===============================\n")

# Optional: Auto-print config when imported (for debugging)
if __name__ != '__main__':
    Config.print_config()