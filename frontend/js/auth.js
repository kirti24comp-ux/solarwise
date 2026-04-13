// Authentication management

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Handle logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Load user profile if on profile page
    if (window.location.pathname.includes('profile.html')) {
        loadUserProfile();
        loadUserAssessments();
    }
    
    // Update navigation based on auth status
    updateNavigation();
});
// Handle delete account button
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
if (deleteAccountBtn) {
    console.log("Delete account button found");
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username_or_email = document.getElementById('username_or_email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username_or_email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || 'profile.html';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectTo;
        } else {
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (password !== confirm_password) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                first_name,
                last_name
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successDiv.textContent = 'Account created successfully! Redirecting to login...';
            successDiv.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('http://localhost:5000/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('http://localhost:5000/api/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } else {
            sessionStorage.removeItem('user');
            return null;
        }
    } catch (error) {
        sessionStorage.removeItem('user');
        return null;
    }
}

// Update navigation based on login status
function updateNavigation() {
    const user = sessionStorage.getItem('user');
    const navLinks = document.getElementById('navLinks');
    
    if (!navLinks) return;
    
    if (user) {
        const userData = JSON.parse(user);
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="assessment.html">Check Your Solar Potential</a></li>
            <li><a href="learn.html">Solar Basics</a></li>
            <li><a href="profile.html">My Profile</a></li>
            <li><a href="#" id="navLogoutBtn">Logout</a></li>
        `;
        
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    } else {
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="assessment.html">Check Your Solar Potential</a></li>
            <li><a href="learn.html">Solar Basics</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a href="signup.html">Sign Up</a></li>
        `;
    }
}

// Load user profile data
async function loadUserProfile() {
    const user = sessionStorage.getItem('user');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const userData = JSON.parse(user);
    document.getElementById('userName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username;
    document.getElementById('userEmail').textContent = userData.email;
    
    const memberSince = new Date(userData.created_at).toLocaleDateString();
    document.getElementById('memberSince').innerHTML = `<strong>Member since:</strong> ${memberSince}`;
}

// Load user's assessments
async function loadUserAssessments() {
    try {
        const response = await fetch('http://localhost:5000/api/assessments', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        const assessmentsList = document.getElementById('assessmentsList');
        
        if (data.success && data.assessments.length > 0) {
            assessmentsList.innerHTML = data.assessments.map(assessment => `
                <div class="assessment-card">
                    <h4>Assessment from ${new Date(assessment.created_at).toLocaleDateString()}</h4>
                    <div class="assessment-details">
                        <div class="assessment-detail">
                            <strong>Solar Score</strong>
                            ${assessment.solar_potential_score}/100
                        </div>
                        <div class="assessment-detail">
                            <strong>System Size</strong>
                            ${assessment.estimated_system_size} kW
                        </div>
                        <div class="assessment-detail">
                            <strong>Annual Savings</strong>
                            $${assessment.estimated_savings}
                        </div>
                        <div class="assessment-detail">
                            <strong>Location</strong>
                            ${assessment.location_name || 'Not specified'}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            assessmentsList.innerHTML = `
                <div class="no-assessments">
                    <p>You haven't completed any solar assessments yet.</p>
                    <a href="assessment.html" class="cta-button" style="margin-top: 1rem; display: inline-block;">Start Your First Assessment →</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading assessments:', error);
        document.getElementById('assessmentsList').innerHTML = '<p>Error loading assessments. Please try again later.</p>';
    }
}

// Check if user is logged in
function requireAuth() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}