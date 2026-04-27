// API Helper
const API_BASE = '/api';

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
}

// Auth functions
async function login(email, password) {
    const data = await apiCall('/login.js', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
}

async function register(fullname, email, password) {
    return await apiCall('/register.js', {
        method: 'POST',
        body: JSON.stringify({ fullname, email, password })
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Check auth on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    const publicPages = ['/index.html', '/login.html', '/register.html'];
    const currentPage = window.location.pathname;
    
    if (!token && !publicPages.includes(currentPage)) {
        window.location.href = '/login.html';
        return false;
    }
    
    if (token && user) {
        // Check if user is banned
        if (user.status === 'banned') {
            logout();
            alert('Your account has been banned');
            return false;
        }
        
        // Redirect admin to admin page
        if (user.role === 'admin' && currentPage === '/dashboard.html') {
            window.location.href = '/admin.html';
            return false;
        }
        
        // Redirect user to user page
        if (user.role === 'user' && currentPage === '/admin.html') {
            window.location.href = '/dashboard.html';
            return false;
        }
    }
    
    return true;
}

// Show notification
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.animation = 'slideIn 0.3s ease';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID');
}

// Show loading
function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';
}

// Hide loading
function hideLoading(elementId, content) {
    document.getElementById(elementId).innerHTML = content;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Setup logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});