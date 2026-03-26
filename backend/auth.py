import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
import mysql.connector
import re

class AuthManager:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def hash_password(self, password):
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256((password + salt).encode())
        password_hash = f"{salt}:{hash_obj.hexdigest()}"
        return password_hash
    
    def verify_password(self, password, stored_hash):
        """Verify password against stored hash"""
        try:
            salt, hash_value = stored_hash.split(':')
            hash_obj = hashlib.sha256((password + salt).encode())
            return hash_obj.hexdigest() == hash_value
        except:
            return False
    
    def create_user(self, username, email, password, first_name='', last_name=''):
        """Create a new user account"""
        cursor = self.db.cursor(dictionary=True)
        
        # Validate input
        if not username or not email or not password:
            return {'success': False, 'error': 'All fields are required'}
        
        if len(password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        if not re.match(r'^[a-zA-Z0-9._-]+$', username):
            return {'success': False, 'error': 'Username can only contain letters, numbers, dots, underscores, and hyphens'}
        
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return {'success': False, 'error': 'Invalid email address'}
        
        # Check if username or email exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return {'success': False, 'error': 'Username or email already exists'}
        
        # Create user
        password_hash = self.hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, email, password_hash, first_name, last_name))
        
        self.db.commit()
        user_id = cursor.lastrowid
        cursor.close()
        
        return {
            'success': True,
            'user_id': user_id,
            'username': username,
            'email': email
        }
    
    def login_user(self, username_or_email, password):
        """Authenticate user and create session"""
        cursor = self.db.cursor(dictionary=True)
        
        # Find user by username or email
        cursor.execute("""
            SELECT id, username, email, password_hash, first_name, last_name 
            FROM users 
            WHERE (username = %s OR email = %s) AND is_active = TRUE
        """, (username_or_email, username_or_email))
        
        user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'Invalid credentials'}
        
        # Verify password
        if not self.verify_password(password, user['password_hash']):
            return {'success': False, 'error': 'Invalid credentials'}
        
        # Create session token
        session_token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=30)
        
        # Store session
        cursor.execute("""
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s)
        """, (user['id'], session_token, expires_at))
        
        # Update last login
        cursor.execute("""
            UPDATE users SET last_login = NOW() WHERE id = %s
        """, (user['id'],))
        
        self.db.commit()
        cursor.close()
        
        # Remove sensitive data
        del user['password_hash']
        
        return {
            'success': True,
            'session_token': session_token,
            'user': user
        }
    
    def validate_session(self, session_token):
        """Validate session token and return user info"""
        if not session_token:
            return None
        
        cursor = self.db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at
            FROM users u
            INNER JOIN user_sessions s ON u.id = s.user_id
            WHERE s.session_token = %s AND s.expires_at > NOW() AND u.is_active = TRUE
        """, (session_token,))
        
        user = cursor.fetchone()
        cursor.close()
        
        return user
    
    def logout_user(self, session_token):
        """Logout user by removing session"""
        cursor = self.db.cursor()
        
        cursor.execute("""
            DELETE FROM user_sessions WHERE session_token = %s
        """, (session_token,))
        
        self.db.commit()
        cursor.close()
        
        return {'success': True}
    
    def get_user_assessments(self, user_id):
        """Get all assessments for a user"""
        cursor = self.db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM assessments 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (user_id,))
        
        assessments = cursor.fetchall()
        cursor.close()
        
        return assessments
    
    def save_assessment_to_user(self, user_id, assessment_data):
        """Save assessment results to user's account"""
        cursor = self.db.cursor()
        
        cursor.execute("""
            INSERT INTO assessments (
                user_id, location_lat, location_lon, location_name,
                monthly_bill, roof_area_sqft, roof_condition, shading,
                solar_potential_score, estimated_system_size,
                annual_production_kwh, estimated_savings, coverage_percentage
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            assessment_data.get('lat'),
            assessment_data.get('lon'),
            assessment_data.get('location_name'),
            assessment_data.get('monthly_bill'),
            assessment_data.get('roof_area'),
            assessment_data.get('roof_condition'),
            assessment_data.get('shading'),
            assessment_data.get('solar_potential_score'),
            assessment_data.get('estimated_system_size_kw'),
            assessment_data.get('annual_production_kwh'),
            assessment_data.get('estimated_savings_per_year'),
            assessment_data.get('coverage_percentage')
        ))
        
        self.db.commit()
        assessment_id = cursor.lastrowid
        cursor.close()
        
        return assessment_id