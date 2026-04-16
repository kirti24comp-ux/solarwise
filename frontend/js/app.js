// frontend/js/app.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("App.js loaded");
    
    // Check user status on assessment page
    if (window.location.pathname.includes('assessment.html')) {
        checkUserStatus();
    }
    
    // Handle quick assessment form (on homepage)
    const quickForm = document.getElementById('quickForm');
    if (quickForm) {
        quickForm.addEventListener('submit', handleQuickAssessment);
    }
    
    // Handle full assessment form (on assessment page)
    const solarForm = document.getElementById('solarForm');
    if (solarForm) {
        console.log("Solar form found, attaching event listener");
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
        if (loggedInUsername) {
            loggedInUsername.textContent = userData.username;
        }
        userStatusDiv.style.display = 'block';
        if (guestStatusDiv) guestStatusDiv.style.display = 'none';
    } else if (guestStatusDiv) {
        if (userStatusDiv) userStatusDiv.style.display = 'none';
        guestStatusDiv.style.display = 'block';
    }
}

// Quick assessment (based on bill only) - for homepage
function handleQuickAssessment(e) {
    e.preventDefault();
    
    const bill = document.getElementById('quickBill').value;
    
    if (!bill) {
        alert('Please enter your monthly bill');
        return;
    }
    
    // Simple calculation for quick estimate
    const potentialScore = Math.min(100, Math.floor(bill / 15));
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
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h3>Quick Estimate Results</h3>
            <p><strong>Solar Potential Score:</strong> ${potentialScore}/100</p>
            <p>${recommendation}</p>
            <p style="margin-top: 1rem; font-size: 0.9rem;">For accurate results, complete the full assessment with your location.</p>
            <a href="assessment.html" class="btn-secondary" style="margin-top: 1rem; display: inline-block;">Full Assessment →</a>
        `;
    }
}

// Full assessment with location
async function handleFullAssessment(e) {
    e.preventDefault();
    
    console.log("handleFullAssessment called");
    
    // Get form values
    const location = document.getElementById('location').value;
    const monthlyBill = parseFloat(document.getElementById('monthlyBill').value) || 1500;
    const roofArea = parseFloat(document.getElementById('roofArea').value) || 500;
    const shading = document.getElementById('shading').value;
    const roofCondition = document.getElementById('roofCondition').value;
    
    console.log("Form values:", { location, monthlyBill, roofArea, shading, roofCondition });
    
    if (!location) {
        alert('Please enter your location');
        return;
    }
    
    // Show loading
    const loadingDiv = document.getElementById('loading');
    const form = document.getElementById('solarForm');
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (form) form.style.opacity = '0.5';
    
    try {
        // Convert location to coordinates
        console.log("Getting coordinates for:", location);
        const coords = await getCoordinates(location);
        console.log("Coordinates:", coords);
        
        // Prepare data for API
        const assessmentData = {
            lat: coords.lat,
            lon: coords.lon,
            location_name: coords.name || location,
            monthly_bill: monthlyBill,
            roof_area: roofArea,
            shading: shading,
            roof_condition: roofCondition
        };
        
        console.log("Sending assessment data:", assessmentData);
        
        // Call backend API
        const result = await assessSolarPotential(assessmentData);
        console.log("Assessment result:", result);
        
        // Store results and redirect
        sessionStorage.setItem('solarResults', JSON.stringify(result));
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('Assessment error:', error);
        alert('Error calculating solar potential. Please try again. Error: ' + error.message);
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (form) form.style.opacity = '1';
    }
}

// Convert location to coordinates
async function getCoordinates(location) {
    // Check if already coordinates (format: "lat,lon")
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (coordPattern.test(location.replace(/\s/g, ''))) {
        const [lat, lon] = location.split(',').map(Number);
        return { lat, lon, name: `${lat}, ${lon}` };
    }
    
    // Use OpenWeatherMap Geocoding API or fallback
    // For now, use fallback coordinates for India
    console.log("Using fallback coordinates for:", location);
    return { lat: 20.5937, lon: 78.9629, name: location };
}

// Call backend API for solar assessment
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
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
}

// Load and display results on results page
function loadResults() {
    console.log("Loading results");
    
    const results = sessionStorage.getItem('solarResults');
    
    if (!results) {
        console.log("No results found, redirecting to assessment");
        window.location.href = 'assessment.html';
        return;
    }
    
    const data = JSON.parse(results);
    console.log("Results data:", data);
    
    // Update DOM elements
    const scoreElement = document.getElementById('scoreValue');
    const systemSizeElement = document.getElementById('systemSize');
    const productionElement = document.getElementById('annualProduction');
    const savingsElement = document.getElementById('annualSavings');
    const coverageElement = document.getElementById('coverage');
    const recommendationElement = document.getElementById('recommendation');
    
    if (scoreElement) scoreElement.textContent = data.solar_potential_score;
    if (systemSizeElement) systemSizeElement.textContent = data.estimated_system_size_kw + ' kW';
    if (productionElement) productionElement.textContent = data.annual_production_kwh.toLocaleString() + ' kWh';
    if (savingsElement) savingsElement.textContent = '₹' + data.estimated_savings_per_year.toLocaleString();
    if (coverageElement) coverageElement.textContent = data.coverage_percentage + '%';
    if (recommendationElement) recommendationElement.innerHTML = '<p>' + data.recommendation + '</p>';
    
    // Create score breakdown chart
    if (data.score_breakdown) {
        createScoreChart(data.score_breakdown);
    }
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
        breakdown.sunlight || 0,
        breakdown.roof_area || 0,
        breakdown.shading || 0,
        breakdown.bill_savings || 0
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