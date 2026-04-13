// Update the loadResults function in app.js
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
    document.getElementById('annualSavings').textContent = '₹' + data.estimated_savings_per_year.toLocaleString();
    document.getElementById('coverage').textContent = data.coverage_percentage + '%';
    document.getElementById('recommendation').innerHTML = '<p>' + data.recommendation + '</p>';
    
    createScoreChart(data.score_breakdown);
}

// Update quick assessment for Rupees
function handleQuickAssessment(e) {
    e.preventDefault();
    const bill = document.getElementById('quickBill').value;
    
    if (!bill) {
        alert('Please enter your monthly bill');
        return;
    }
    
    const potentialScore = Math.min(100, Math.floor(bill / 15)); // ₹15 per point
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