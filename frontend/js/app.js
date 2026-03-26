// Main application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check user status on assessment page
    if (window.location.pathname.includes('assessment.html')) {
        checkUserStatus();
    }
    
    // Handle quick assessment form
    const quickForm = document.getElementById('quickForm');
    if (quickForm) {
        quickForm.addEventListener('submit', handleQuickAssessment);
    }
    
    // Handle full assessment form
    const solarForm = document.getElementById('solarForm');
    if (solarForm) {
        solarForm.addEventListener('submit', handleFullAssessment);
    }
    
    // Load results if on results page
    if (window.location.pathname.includes('results.html')) {
        loadResults();
    }
});

// Check user status on assessment page
function checkUserStatus() {
    const user = sessionStorage.getItem('user');
    const userStatusDiv = document.getElementById('userStatus');
    const guestStatusDiv = document.getElementById('guestStatus');
    const loggedInUsername = document.getElementById('loggedInUsername');
    
    if (user && userStatusDiv) {
        const userData = JSON.parse(user);
        loggedInUsername.textContent = userData.username;
        userStatusDiv.style.display = 'block';
        guestStatusDiv.style.display = 'none';
    } else if (guestStatusDiv) {
        userStatusDiv.style.display = 'none';
        guestStatusDiv.style.display = 'block';
    }
}

// Quick assessment (based on bill only)
function handleQuickAssessment(e) {
    e.preventDefault();
    const bill = document.getElementById('quickBill').value;
    
    if (!bill) {
        alert('Please enter your monthly bill');
        return;
    }
    
    const potentialScore = Math.min(100, Math.floor(bill / 2));
    let recommendation = '';
    
    if (potentialScore >= 70) {
        recommendation = 'Excellent potential! Your energy usage suggests solar would be very beneficial.';
    } else if (potentialScore >= 50) {
        recommendation = 'Good potential. Solar could work well for your energy needs.';
    } else if (potentialScore >= 30) {
        recommendation = 'Moderate potential. Consider a detailed assessment.';
    } else {
        recommendation = 'Limited potential based on bill alone. Try our full assessment for accurate results.';
    }
    
    const resultDiv = document.getElementById('quickResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>Quick Estimate Results</h3>
        <p><strong>Solar Potential Score:</strong> ${potentialScore}/100</p>
        <p>${recommendation}</p>
        <p style="margin-top: 1rem; font-size: 0.9rem;">For accurate results, complete the full assessment with your location.</p>
        <a href="assessment.html" class="btn-secondary" style="margin-top: 1rem; display: inline-block;">Full Assessment →</a>
    `;
}

// Full assessment with location
async function handleFullAssessment(e) {
    e.preventDefault();
    
    const location = document.getElementById('location').value;
    const monthlyBill = parseFloat(document.getElementById('monthlyBill').value) || 150;
    const roofArea = parseFloat(document.getElementById('roofArea').value) || 500;
    const shading = document.getElementById('shading').value;
    const roofCondition = document.getElementById('roofCondition').value;
    
    if (!location) {
        alert('Please enter your location');
        return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('solarForm').style.opacity = '0.5';
    
    try {
        const coords = await getCoordinates(location);
        
        const result = await assessSolarPotential({
            lat: coords.lat,
            lon: coords.lon,
            location_name: coords.name || location,
            monthly_bill: monthlyBill,
            roof_area: roofArea,
            shading: shading,
            roof_condition: roofCondition
        });
        
        sessionStorage.setItem('solarResults', JSON.stringify(result));
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('Assessment error:', error);
        alert('Error calculating solar potential. Please try again.');
        document.getElementById('loading').style.display = 'none';
        document.getElementById('solarForm').style.opacity = '1';
    }
}

// Convert location to coordinates
async function getCoordinates(location) {
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordPattern.test(location.replace(/\s/g, ''))) {
        const [lat, lon] = location.split(',').map(Number);
        return { lat, lon, name: `${lat}, ${lon}` };
    }
    
    const apiKey = 'YOUR_OPENWEATHER_API_KEY';
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon,
                name: data[0].name
            };
        } else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.warn('Geocoding failed, using fallback');
        return { lat: 0, lon: 0, name: location };
    }
}

// Call backend API
async function assessSolarPotential(data) {
    const response = await fetch('http://localhost:5000/api/assess-solar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    return await response.json();
}

// Load and display results
function loadResults() {
    const results = sessionStorage.getItem('solarResults');
    
    if (!results) {
        window.location.href = 'assessment.html';
        return;
    }
    
    const data = JSON.parse(results);
    
    document.getElementById('scoreValue').textContent = data.solar_potential_score;
    document.getElementById('systemSize').textContent = data.estimated_system_size_kw + ' kW';
    document.getElementById('annualProduction').textContent = data.annual_production_kwh.toLocaleString() + ' kWh';
    document.getElementById('annualSavings').textContent = '$' + data.estimated_savings_per_year.toLocaleString();
    document.getElementById('coverage').textContent = data.coverage_percentage + '%';
    document.getElementById('recommendation').innerHTML = '<p>' + data.recommendation + '</p>';
    
    createScoreChart(data.score_breakdown);
}

// Create chart for score breakdown
function createScoreChart(breakdown) {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;
    
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = ['Sunlight', 'Roof Area', 'Shading', 'Savings'];
    const values = [
        breakdown.sunlight,
        breakdown.roof_area,
        breakdown.shading,
        breakdown.bill_savings
    ];
    
    const barWidth = 60;
    const startX = 50;
    const maxValue = 40;
    
    categories.forEach((cat, i) => {
        const x = startX + (i * 80);
        const height = (values[i] / maxValue) * 150;
        const y = 180 - height;
        
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(cat, x + 15, 195);
        
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(values[i].toFixed(1), x + 25, y - 5);
    });
}