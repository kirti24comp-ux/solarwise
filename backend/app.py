# backend/app.py
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import mysql.connector
import requests
import os
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv
from auth import AuthManager

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
CORS(app, supports_credentials=True, origins=['http://localhost:8000'])

# Database connection
db = mysql.connector.connect(
    host=os.getenv('MYSQL_HOST', 'localhost'),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DB', 'solarwise')
)

auth_manager = AuthManager(db)

# NASA POWER API
NASA_API = "https://power.larc.nasa.gov/api/power"

# Currency config
AVG_COST_PER_KWH = 7.0  # ₹ per kWh

# ============ AUTHENTICATION ROUTES ============

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    result = auth_manager.create_user(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    return jsonify(result)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    result = auth_manager.login_user(
        username_or_email=data.get('username_or_email'),
        password=data.get('password')
    )
    
    if result['success']:
        response = make_response(jsonify(result))
        response.set_cookie(
            'session_token', 
            result['session_token'],
            max_age=30*24*60*60,
            httponly=True,
            samesite='Lax'
        )
        return response
    
    return jsonify(result), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session_token = request.cookies.get('session_token')
    if session_token:
        auth_manager.logout_user(session_token)
    
    response = make_response(jsonify({'success': True}))
    response.set_cookie('session_token', '', expires=0)
    return response

@app.route('/api/me', methods=['GET'])
def get_current_user():
    session_token = request.cookies.get('session_token')
    user = auth_manager.validate_session(session_token)
    
    if user:
        return jsonify({'success': True, 'user': user})
    return jsonify({'success': False, 'error': 'Not logged in'}), 401

@app.route('/api/assessments', methods=['GET'])
def get_user_assessments():
    session_token = request.cookies.get('session_token')
    user = auth_manager.validate_session(session_token)
    
    if not user:
        return jsonify({'success': False, 'error': 'Please log in'}), 401
    
    assessments = auth_manager.get_user_assessments(user['id'])
    return jsonify({'success': True, 'assessments': assessments})

@app.route('/api/delete-account', methods=['DELETE'])
def delete_account():
    """Delete user account and all associated data"""
    session_token = request.cookies.get('session_token')
    user = auth_manager.validate_session(session_token)
    
    if not user:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    # Delete user (cascade will delete sessions and assessments)
    cursor = db.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user['id'],))
    db.commit()
    cursor.close()
    
    # Clear session cookie
    response = make_response(jsonify({'success': True, 'message': 'Account deleted successfully'}))
    response.set_cookie('session_token', '', expires=0)
    
    return response

# ============ SOLAR ASSESSMENT ROUTES ============

@app.route('/api/assess-solar', methods=['POST'])
def assess_solar():
    data = request.json
    lat = data['lat']
    lon = data['lon']
    monthly_bill_rupees = data.get('monthly_bill', 1500)  # Default ₹1500
    roof_area = data.get('roof_area', 500)
    shading = data.get('shading', 'moderate')
    roof_condition = data.get('roof_condition', 'good')
    location_name = data.get('location_name', '')
    
    # Get solar data from NASA API
    solar_data = get_nasa_solar_data(lat, lon)
    
    # Calculate solar potential score (in Rupees)
    result = calculate_solar_potential_rupees(
        solar_data, 
        monthly_bill_rupees, 
        roof_area, 
        shading,
        lat
    )
    
    # Add metadata
    result['lat'] = lat
    result['lon'] = lon
    result['location_name'] = location_name
    result['monthly_bill'] = monthly_bill_rupees
    result['roof_area'] = roof_area
    result['shading'] = shading
    result['roof_condition'] = roof_condition
    
    # Save assessment
    session_token = request.cookies.get('session_token')
    user = auth_manager.validate_session(session_token)
    
    if user:
        auth_manager.save_assessment_to_user(user['id'], result)
    else:
        save_guest_assessment(data, result, request)
    
    return jsonify(result)

def get_nasa_solar_data(lat, lon):
    """Fetch solar radiation data from NASA POWER"""
    params = {
        'request': 'execute',
        'parameters': 'ALLSKY_SFC_SW_DWN',
        'userCommunity': 'SSE',
        'format': 'JSON',
        'latitude': lat,
        'longitude': lon,
        'startDate': '20230101',
        'endDate': '20231231'
    }
    
    try:
        response = requests.get(NASA_API, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"NASA API error: {e}")
        return None
    
    return None

def calculate_solar_potential_rupees(solar_data, monthly_bill_rupees, roof_area, shading, lat):
    """Calculate solar potential with ₹ currency"""
    
    # Extract solar radiation
    if solar_data and 'properties' in solar_data:
        solar_radiation = extract_solar_radiation(solar_data)
    else:
        solar_radiation = approximate_solar_by_latitude(lat)
    
    # Shading factors
    shading_factors = {'low': 0.9, 'moderate': 0.7, 'heavy': 0.4}
    shading_factor = shading_factors.get(shading, 0.7)
    
    # Calculate system size
    system_size_kw = (roof_area / 100) * 0.7
    daily_production = system_size_kw * solar_radiation * shading_factor
    annual_production_kwh = daily_production * 365
    
    # Calculate savings in Rupees
    monthly_usage_kwh = monthly_bill_rupees / AVG_COST_PER_KWH
    annual_usage_kwh = monthly_usage_kwh * 12
    coverage_percent = min(100, (annual_production_kwh / annual_usage_kwh) * 100)
    annual_savings_rupees = annual_production_kwh * AVG_COST_PER_KWH
    
    # Calculate score components
    score_components = {
        'sunlight': min(40, (solar_radiation / 7) * 40),
        'roof_area': min(20, (roof_area / 1000) * 20),
        'shading': shading_factor * 20,
        'bill_savings': min(20, (coverage_percent / 100) * 20)
    }
    
    total_score = sum(score_components.values())
    
    return {
        'solar_potential_score': round(total_score),
        'estimated_system_size_kw': round(system_size_kw, 1),
        'annual_production_kwh': round(annual_production_kwh),
        'estimated_savings_per_year': round(annual_savings_rupees, 2),
        'coverage_percentage': round(coverage_percent),
        'recommendation': get_recommendation(total_score),
        'solar_radiation_kwh': round(solar_radiation, 2),
        'currency_symbol': '₹',
        'score_breakdown': score_components
    }

def extract_solar_radiation(solar_data):
    try:
        properties = solar_data.get('properties', {})
        parameter = properties.get('parameter', {})
        allsky = parameter.get('ALLSKY_SFC_SW_DWN', {})
        if allsky:
            values = list(allsky.values())
            if values:
                return sum(values) / len(values)
    except:
        pass
    return 4.5

def approximate_solar_by_latitude(lat):
    lat_abs = abs(lat)
    if lat_abs < 23.5:
        return 5.5
    elif lat_abs < 35:
        return 4.8
    elif lat_abs < 50:
        return 3.8
    else:
        return 2.5

def get_recommendation(score):
    if score >= 70:
        return "Excellent! Solar panels would be highly beneficial for your home."
    elif score >= 50:
        return "Good potential. Solar panels could work well for you."
    elif score >= 30:
        return "Moderate potential. Consider improving roof conditions or reducing shading."
    else:
        return "Limited potential. You might want to explore community solar options instead."

def save_guest_assessment(data, result, request):
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO assessments (
            session_id, location_lat, location_lon, location_name,
            monthly_bill, roof_area_sqft, roof_condition, shading,
            solar_potential_score, estimated_system_size,
            annual_production_kwh, estimated_savings, coverage_percentage
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        request.cookies.get('session_id', 'guest'),
        data.get('lat'),
        data.get('lon'),
        data.get('location_name', ''),
        data.get('monthly_bill'),
        data.get('roof_area'),
        data.get('roof_condition'),
        data.get('shading'),
        result.get('solar_potential_score'),
        result.get('estimated_system_size_kw'),
        result.get('annual_production_kwh'),
        result.get('estimated_savings_per_year'),
        result.get('coverage_percentage')
    ))
    db.commit()
    cursor.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)