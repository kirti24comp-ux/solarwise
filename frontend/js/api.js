// API configuration and helper functions
const API_BASE_URL = 'http://localhost:5000/api';

// Function to call solar assessment API
export async function callSolarAssessment(data) {
    const response = await fetch(`${API_BASE_URL}/assess-solar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
}

// Function to geocode location
export async function geocodeLocation(location) {
    const apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual key
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
        return {
            lat: data[0].lat,
            lon: data[0].lon,
            name: data[0].name,
            country: data[0].country
        };
    }
    
    throw new Error('Location not found');
}