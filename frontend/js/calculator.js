// Client-side solar calculations (fallback if API fails)

export function calculateSolarScore(solarRadiation, roofArea, shading, monthlyBill) {
    const shadingFactors = {
        'low': 0.9,
        'moderate': 0.7,
        'heavy': 0.4
    };
    
    const shadingFactor = shadingFactors[shading] || 0.7;
    const systemSize = (roofArea / 100) * 0.7;
    const dailyProduction = systemSize * solarRadiation * shadingFactor;
    const annualProduction = dailyProduction * 365;
    
    const avgCostPerKwh = 0.13;
    const estimatedSavings = annualProduction * avgCostPerKwh;
    
    const monthlyUsageKwh = monthlyBill / avgCostPerKwh;
    const annualUsage = monthlyUsageKwh * 12;
    const coveragePercent = Math.min(100, (annualProduction / annualUsage) * 100);
    
    const sunlightScore = Math.min(40, (solarRadiation / 7) * 40);
    const roofScore = Math.min(20, (roofArea / 1000) * 20);
    const shadingScore = shadingFactor * 20;
    const savingsScore = Math.min(20, (coveragePercent / 100) * 20);
    
    const totalScore = sunlightScore + roofScore + shadingScore + savingsScore;
    
    let recommendation;
    if (totalScore >= 70) {
        recommendation = "Excellent! Solar panels would be highly beneficial for your home.";
    } else if (totalScore >= 50) {
        recommendation = "Good potential. Solar panels could work well for you.";
    } else if (totalScore >= 30) {
        recommendation = "Moderate potential. Consider improving roof conditions or reducing shading.";
    } else {
        recommendation = "Limited potential. You might want to explore community solar options instead.";
    }
    
    return {
        solar_potential_score: Math.round(totalScore),
        estimated_system_size_kw: Math.round(systemSize * 10) / 10,
        annual_production_kwh: Math.round(annualProduction),
        estimated_savings_per_year: Math.round(estimatedSavings * 100) / 100,
        coverage_percentage: Math.round(coveragePercent),
        recommendation: recommendation,
        solar_radiation_kwh: solarRadiation,
        score_breakdown: {
            sunlight: sunlightScore,
            roof_area: roofScore,
            shading: shadingScore,
            bill_savings: savingsScore
        }
    };
}

export function estimateSolarRadiation(latitude) {
    const latAbs = Math.abs(latitude);
    if (latAbs < 23.5) return 5.5;
    if (latAbs < 35) return 4.8;
    if (latAbs < 50) return 3.8;
    return 2.5;
}