/**
 * PassMan Password Manager - Frontend JavaScript
 * Comprehensive password management application with security features
 */

// Global application state and configuration
const AppState = {
    currentUser: null,
    passwords: [],
    isAuthenticated: false,
    currentSection: 'passwords',
    theme: 'light',
    sessionTimeout: null,
    sessionWarningTimer: null,
    settings: {
        sessionTimeout: 30,
        require2FA: true,
        passwordMinLength: 12,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true
    }
};

// Sample data for demonstration (simulating backend responses)
const SAMPLE_DATA = {
    samplePasswords: [
        {
            id: 1,
            website: "google.com",
            username: "user@example.com",
            password: "SecurePass123!",
            created: "2024-01-15",
            lastUsed: "2024-01-20",
            strength: "strong",
            notes: "Main Google account"
        },
        {
            id: 2,
            website: "github.com",
            username: "developer",
            password: "CodeMaster789@",
            created: "2024-01-10",
            lastUsed: "2024-01-19",
            strength: "strong",
            notes: "Development account"
        },
        {
            id: 3,
            website: "netflix.com",
            username: "moviefan",
            password: "simple123",
            created: "2024-01-05",
            lastUsed: "2024-01-18",
            strength: "weak",
            notes: "Streaming service"
        }
    ],
    userProfile: {
        username: "testuser",
        email: "test@example.com",
        lastLogin: "2024-01-20 10:30:00",
        accountCreated: "2024-01-01",
        theme: "dark",
        language: "en"
    }
};

/**
 * DOM Content Loaded - Initialize application
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('PassMan Password Manager initialized');
    
    // Initialize theme from localStorage or system preference
    initializeTheme();
    
    // Load saved user session if exists
    loadUserSession();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Show appropriate page based on authentication status
    if (AppState.isAuthenticated) {
        showDashboard();
    } else {
        showLoginPage();
    }
});

/**
 * Initialize all event listeners for the application
 */
function initializeEventListeners() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', toggleTheme);
    
    // Authentication form handlers
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const twofaVerifyForm = document.getElementById('twofa-verify-form');
    const twofaLoginForm = document.getElementById('twofa-login-form');
    
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    twofaVerifyForm?.addEventListener('submit', handleTwoFAVerification);
    twofaLoginForm?.addEventListener('submit', handleTwoFALogin);
    
    // Navigation between auth pages
    document.getElementById('show-register')?.addEventListener('click', showRegisterPage);
    document.getElementById('show-login')?.addEventListener('click', showLoginPage);
    document.getElementById('back-to-login')?.addEventListener('click', showLoginPage);
    
    // Dashboard navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            if (section) switchDashboardSection(section);
        });
    });
    
    // Logout functionality
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Password management
    document.getElementById('add-password-btn')?.addEventListener('click', () => openPasswordModal());
    document.getElementById('password-form')?.addEventListener('submit', handlePasswordSave);
    
    // Password search functionality
    document.getElementById('password-search')?.addEventListener('input', handlePasswordSearch);
    
    // Password generator
    document.getElementById('generate-btn')?.addEventListener('click', generatePassword);
    document.getElementById('copy-generated-btn')?.addEventListener('click', copyGeneratedPassword);
    document.getElementById('password-length')?.addEventListener('input', updateLengthDisplay);
    
    // Generator checkboxes for updating password generation
    const generatorOptions = ['include-uppercase', 'include-lowercase', 'include-numbers', 'include-symbols', 'exclude-ambiguous'];
    generatorOptions.forEach(id => {
        document.getElementById(id)?.addEventListener('change', generatePassword);
    });
    
    // Modal functionality
    document.getElementById('close-modal')?.addEventListener('click', closePasswordModal);
    document.getElementById('cancel-modal')?.addEventListener('click', closePasswordModal);
    document.getElementById('password-modal')?.querySelector('.modal-overlay')?.addEventListener('click', closePasswordModal);
    
    // Password visibility toggle in modal
    document.getElementById('toggle-password-visibility')?.addEventListener('click', togglePasswordVisibility);
    document.getElementById('generate-password-btn')?.addEventListener('click', generatePasswordForModal);
    
    // Password strength checking
    document.getElementById('register-password')?.addEventListener('input', checkPasswordStrength);
    document.getElementById('password-password')?.addEventListener('input', checkModalPasswordStrength);
    
    // Settings form
    document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
    
    // Import/Export functionality
    document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('export-btn')?.addEventListener('click', exportPasswords);
    document.getElementById('import-file')?.addEventListener('change', handleImport);
    
    // Session management
    setupSessionTimeout();
    
    // Confirmation modal handlers
    document.getElementById('confirm-cancel')?.addEventListener('click', closeConfirmModal);
    document.getElementById('session-logout')?.addEventListener('click', handleLogout);
    document.getElementById('session-extend')?.addEventListener('click', extendSession);
}

/**
 * Theme Management Functions
 */
function initializeTheme() {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('passman-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    AppState.theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(AppState.theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('passman-theme')) {
            AppState.theme = e.matches ? 'dark' : 'light';
            applyTheme(AppState.theme);
        }
    });
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    applyTheme(AppState.theme);
    localStorage.setItem('passman-theme', AppState.theme);
    showToast('Theme changed to ' + AppState.theme + ' mode', 'success');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-color-scheme', theme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Authentication Functions
 */
function handleLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, this would validate against backend
        if (username && password) {
            // Check if user has 2FA enabled (simulate checking backend)
            const user2FA = localStorage.getItem(`passman-2fa-${username}`);
            
            if (user2FA) {
                // User has 2FA enabled, show verification page
                AppState.currentUser = { username, needsTwoFA: true };
                showTwoFAVerifyPage();
            } else {
                // Complete login without 2FA
                completeLogin(username);
            }
        } else {
            showToast('Invalid username or password', 'error');
        }
        showLoading(false);
    }, 1000);
}

function handleRegister(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        showLoading(false);
        return;
    }
    
    // Check password strength
    const strength = calculatePasswordStrength(password);
    if (strength < 3) {
        showToast('Password is too weak. Please use a stronger password.', 'error');
        showLoading(false);
        return;
    }
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, this would create account on backend
        AppState.currentUser = { username, email };
        
        // Save user profile to localStorage (simulating backend)
        const userProfile = {
            username,
            email,
            accountCreated: new Date().toISOString(),
            theme: AppState.theme,
            language: 'en'
        };
        localStorage.setItem(`passman-user-${username}`, JSON.stringify(userProfile));
        
        showToast('Account created successfully!', 'success');
        showTwoFASetupPage();
        showLoading(false);
    }, 1500);
}

function showTwoFASetupPage() {
    // Generate TOTP secret for user
    const secret = generateTOTPSecret();
    const username = AppState.currentUser.username;
    
    // Store secret temporarily (in real app, this would be on backend)
    localStorage.setItem(`passman-2fa-secret-${username}`, secret);
    
    // Generate QR code
    const qrData = `otpauth://totp/PassMan:${username}?secret=${secret}&issuer=PassMan`;
    const canvas = document.getElementById('qr-code');
    
    if (canvas && window.QRCode) {
        QRCode.toCanvas(canvas, qrData, {
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff'
        });
    }
    
    // Display manual key
    document.getElementById('manual-key-text').textContent = secret;
    
    showPage('twofa-setup-page');
}

function handleTwoFAVerification(e) {
    e.preventDefault();
    const code = e.target.code.value;
    const username = AppState.currentUser.username;
    const secret = localStorage.getItem(`passman-2fa-secret-${username}`);
    
    // Verify TOTP code (simplified verification)
    if (verifyTOTPCode(secret, code)) {
        // Enable 2FA for user
        localStorage.setItem(`passman-2fa-${username}`, secret);
        localStorage.removeItem(`passman-2fa-secret-${username}`);
        
        showToast('Two-factor authentication enabled successfully!', 'success');
        completeLogin(username);
    } else {
        showToast('Invalid verification code. Please try again.', 'error');
    }
}

function handleTwoFALogin(e) {
    e.preventDefault();
    const code = e.target.code.value;
    const username = AppState.currentUser.username;
    const secret = localStorage.getItem(`passman-2fa-${username}`);
    
    if (verifyTOTPCode(secret, code)) {
        completeLogin(username);
    } else {
        showToast('Invalid verification code. Please try again.', 'error');
    }
}

function completeLogin(username) {
    AppState.isAuthenticated = true;
    AppState.currentUser = { username };
    
    // Load user data
    loadUserData(username);
    
    // Save session
    localStorage.setItem('passman-session', JSON.stringify({
        username,
        loginTime: Date.now()
    }));
    
    showToast(`Welcome back, ${username}!`, 'success');
    showDashboard();
    startSessionTimeout();
}

function handleLogout() {
    AppState.isAuthenticated = false;
    AppState.currentUser = null;
    AppState.passwords = [];
    
    // Clear session data
    localStorage.removeItem('passman-session');
    
    // Clear timers
    if (AppState.sessionTimeout) clearTimeout(AppState.sessionTimeout);
    if (AppState.sessionWarningTimer) clearTimeout(AppState.sessionWarningTimer);
    
    showToast('Logged out successfully', 'info');
    showLoginPage();
}

/**
 * Page Navigation Functions
 */
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
    }
}

function showLoginPage() {
    showPage('login-page');
    document.getElementById('login-form').reset();
}

function showRegisterPage() {
    showPage('register-page');
    document.getElementById('register-form').reset();
}

function showTwoFAVerifyPage() {
    showPage('twofa-verify-page');
}

function showDashboard() {
    showPage('dashboard-page');
    document.getElementById('current-username').textContent = AppState.currentUser.username;
    loadPasswords();
    generatePassword(); // Generate initial password
    updateSecurityAudit();
    loadSettings();
}

/**
 * Dashboard Section Management
 */
function switchDashboardSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Show section
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
    }
    
    AppState.currentSection = section;
    
    // Update section-specific content
    if (section === 'security') {
        updateSecurityAudit();
    }
}

/**
 * Password Management Functions
 */
function loadPasswords() {
    const username = AppState.currentUser.username;
    const savedPasswords = localStorage.getItem(`passman-passwords-${username}`);
    
    if (savedPasswords) {
        AppState.passwords = JSON.parse(savedPasswords);
    } else {
        // Load sample data for demo
        AppState.passwords = SAMPLE_DATA.samplePasswords;
        savePasswords();
    }
    
    renderPasswords();
}

function savePasswords() {
    const username = AppState.currentUser.username;
    localStorage.setItem(`passman-passwords-${username}`, JSON.stringify(AppState.passwords));
}

function renderPasswords(filteredPasswords = null) {
    const passwordsList = document.getElementById('passwords-list');
    const noPasswordsMsg = document.getElementById('no-passwords');
    const passwords = filteredPasswords || AppState.passwords;
    
    if (passwords.length === 0) {
        passwordsList.innerHTML = '';
        noPasswordsMsg.classList.remove('hidden');
        return;
    }
    
    noPasswordsMsg.classList.add('hidden');
    
    passwordsList.innerHTML = passwords.map(password => `
        <div class="password-card" data-id="${password.id}">
            <div class="password-card-header">
                <h3 class="password-card-title">${escapeHtml(password.website)}</h3>
                <div class="password-card-actions">
                    <button onclick="copyPassword('${password.password}')" title="Copy Password">📋</button>
                    <button onclick="editPassword(${password.id})" title="Edit">✏️</button>
                    <button onclick="deletePassword(${password.id})" title="Delete">🗑️</button>
                </div>
            </div>
            
            <div class="password-card-field">
                <label class="password-card-label">Username</label>
                <div class="password-card-value">${escapeHtml(password.username)}</div>
            </div>
            
            <div class="password-card-field">
                <label class="password-card-label">Password</label>
                <div class="password-card-value">
                    <span class="password-hidden" data-password="${password.password}">••••••••••••</span>
                    <button onclick="togglePasswordDisplay(this)" class="btn btn--sm btn--secondary">Show</button>
                </div>
            </div>
            
            ${password.notes ? `
                <div class="password-card-field">
                    <label class="password-card-label">Notes</label>
                    <div class="password-card-value">${escapeHtml(password.notes)}</div>
                </div>
            ` : ''}
            
            <div class="password-meta">
                <span class="status status--${password.strength}">${password.strength}</span>
                <span>Created: ${formatDate(password.created)}</span>
            </div>
        </div>
    `).join('');
}

function openPasswordModal(passwordId = null) {
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('password-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    
    if (passwordId) {
        // Edit mode
        const password = AppState.passwords.find(p => p.id === passwordId);
        if (password) {
            title.textContent = 'Edit Password';
            document.getElementById('password-website').value = password.website;
            document.getElementById('password-username').value = password.username;
            document.getElementById('password-password').value = password.password;
            document.getElementById('password-notes').value = password.notes || '';
            form.dataset.editId = passwordId;
            checkModalPasswordStrength();
        }
    } else {
        // Add mode
        title.textContent = 'Add Password';
        delete form.dataset.editId;
    }
    
    modal.classList.remove('hidden');
    document.getElementById('password-website').focus();
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
}

function handlePasswordSave(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editId = e.target.dataset.editId;
    
    const passwordData = {
        website: formData.get('website'),
        username: formData.get('username'),
        password: formData.get('password'),
        notes: formData.get('notes') || '',
        strength: getPasswordStrengthLabel(calculatePasswordStrength(formData.get('password')))
    };
    
    if (editId) {
        // Update existing password
        const index = AppState.passwords.findIndex(p => p.id === parseInt(editId));
        if (index !== -1) {
            AppState.passwords[index] = {
                ...AppState.passwords[index],
                ...passwordData,
                lastUsed: new Date().toISOString().split('T')[0]
            };
            showToast('Password updated successfully', 'success');
        }
    } else {
        // Add new password
        const newPassword = {
            id: Date.now(),
            ...passwordData,
            created: new Date().toISOString().split('T')[0],
            lastUsed: new Date().toISOString().split('T')[0]
        };
        AppState.passwords.push(newPassword);
        showToast('Password added successfully', 'success');
    }
    
    savePasswords();
    renderPasswords();
    closePasswordModal();
    
    // Update security audit
    if (AppState.currentSection === 'security') {
        updateSecurityAudit();
    }
}

function editPassword(id) {
    openPasswordModal(id);
}

function deletePassword(id) {
    showConfirmModal(
        'Delete Password',
        'Are you sure you want to delete this password? This action cannot be undone.',
        () => {
            AppState.passwords = AppState.passwords.filter(p => p.id !== id);
            savePasswords();
            renderPasswords();
            showToast('Password deleted successfully', 'success');
            
            if (AppState.currentSection === 'security') {
                updateSecurityAudit();
            }
        }
    );
}

function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showToast('Password copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy password', 'error');
    });
}

function togglePasswordDisplay(button) {
    const passwordSpan = button.previousElementSibling;
    const isHidden = passwordSpan.classList.contains('password-hidden');
    
    if (isHidden) {
        passwordSpan.textContent = passwordSpan.dataset.password;
        passwordSpan.classList.remove('password-hidden');
        button.textContent = 'Hide';
    } else {
        passwordSpan.textContent = '••••••••••••';
        passwordSpan.classList.add('password-hidden');
        button.textContent = 'Show';
    }
}

function handlePasswordSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderPasswords();
        return;
    }
    
    const filteredPasswords = AppState.passwords.filter(password => 
        password.website.toLowerCase().includes(query) ||
        password.username.toLowerCase().includes(query) ||
        (password.notes && password.notes.toLowerCase().includes(query))
    );
    
    renderPasswords(filteredPasswords);
}

/**
 * Password Generator Functions
 */
function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value);
    const includeUppercase = document.getElementById('include-uppercase').checked;
    const includeLowercase = document.getElementById('include-lowercase').checked;
    const includeNumbers = document.getElementById('include-numbers').checked;
    const includeSymbols = document.getElementById('include-symbols').checked;
    const excludeAmbiguous = document.getElementById('exclude-ambiguous').checked;
    
    let charset = '';
    
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (excludeAmbiguous) {
        charset = charset.replace(/[0Ol1Il]/g, '');
    }
    
    if (!charset) {
        showToast('Please select at least one character type', 'warning');
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    document.getElementById('generated-password').value = password;
}

function generatePasswordForModal() {
    // Use same generation logic but put result in modal field
    generatePassword();
    const generatedPassword = document.getElementById('generated-password').value;
    document.getElementById('password-password').value = generatedPassword;
    checkModalPasswordStrength();
}

function copyGeneratedPassword() {
    const password = document.getElementById('generated-password').value;
    if (password) {
        navigator.clipboard.writeText(password).then(() => {
            showToast('Password copied to clipboard', 'success');
        });
    }
}

function updateLengthDisplay() {
    const length = document.getElementById('password-length').value;
    document.getElementById('length-value').textContent = length;
    generatePassword();
}

/**
 * Password Strength Functions
 */
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length scoring
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Character type scoring
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Complexity bonus
    if (password.length >= 20) score++;
    
    return Math.min(score, 4);
}

function getPasswordStrengthLabel(score) {
    const labels = ['very weak', 'weak', 'fair', 'good', 'strong'];
    return labels[score] || 'weak';
}

function checkPasswordStrength() {
    const password = document.getElementById('register-password').value;
    const strengthElement = document.getElementById('password-strength');
    updatePasswordStrengthDisplay(strengthElement, password);
}

function checkModalPasswordStrength() {
    const password = document.getElementById('password-password').value;
    const strengthElement = document.getElementById('modal-password-strength');
    updatePasswordStrengthDisplay(strengthElement, password);
}

function updatePasswordStrengthDisplay(strengthElement, password) {
    if (!strengthElement || !password) return;
    
    const score = calculatePasswordStrength(password);
    const label = getPasswordStrengthLabel(score);
    
    const fill = strengthElement.querySelector('.strength-fill');
    const text = strengthElement.querySelector('.strength-text');
    
    // Remove all strength classes
    fill.className = 'strength-fill';
    
    // Add appropriate strength class
    if (score <= 1) {
        fill.classList.add('weak');
    } else if (score === 2) {
        fill.classList.add('fair');
    } else if (score === 3) {
        fill.classList.add('good');
    } else {
        fill.classList.add('strong');
    }
    
    text.textContent = `Password strength: ${label}`;
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('password-password');
    const toggleButton = document.getElementById('toggle-password-visibility');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        passwordField.type = 'password';
        toggleButton.textContent = 'Show';
    }
}

/**
 * Security Audit Functions
 */
function updateSecurityAudit() {
    const totalPasswords = AppState.passwords.length;
    const weakPasswords = AppState.passwords.filter(p => ['weak', 'very weak'].includes(p.strength)).length;
    const duplicatePasswords = findDuplicatePasswords();
    const oldPasswords = findOldPasswords();
    
    // Update statistics
    document.getElementById('total-passwords').textContent = totalPasswords;
    document.getElementById('weak-passwords').textContent = weakPasswords;
    document.getElementById('duplicate-passwords').textContent = duplicatePasswords.length;
    document.getElementById('old-passwords').textContent = oldPasswords.length;
    
    // Generate security issues
    const issues = [];
    
    if (weakPasswords > 0) {
        issues.push({
            severity: 'high',
            title: 'Weak Passwords Detected',
            description: `${weakPasswords} passwords are weak and should be updated.`,
            action: 'Update weak passwords'
        });
    }
    
    if (duplicatePasswords.length > 0) {
        issues.push({
            severity: 'medium',
            title: 'Duplicate Passwords Found',
            description: `${duplicatePasswords.length} passwords are used multiple times.`,
            action: 'Use unique passwords'
        });
    }
    
    if (oldPasswords.length > 0) {
        issues.push({
            severity: 'low',
            title: 'Old Passwords',
            description: `${oldPasswords.length} passwords haven't been changed in over 90 days.`,
            action: 'Consider updating old passwords'
        });
    }
    
    renderSecurityIssues(issues);
}

function findDuplicatePasswords() {
    const passwordCounts = {};
    const duplicates = [];
    
    AppState.passwords.forEach(p => {
        if (passwordCounts[p.password]) {
            passwordCounts[p.password]++;
        } else {
            passwordCounts[p.password] = 1;
        }
    });
    
    Object.keys(passwordCounts).forEach(password => {
        if (passwordCounts[password] > 1) {
            duplicates.push(password);
        }
    });
    
    return duplicates;
}

function findOldPasswords() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return AppState.passwords.filter(p => {
        const lastUsed = new Date(p.lastUsed);
        return lastUsed < ninetyDaysAgo;
    });
}

function renderSecurityIssues(issues) {
    const container = document.getElementById('security-issues');
    
    if (issues.length === 0) {
        container.innerHTML = `
            <div class="security-issue">
                <div class="issue-info">
                    <span class="issue-severity low">✓ All Good</span>
                    <div>
                        <strong>No security issues found</strong>
                        <p>Your passwords are secure and up to date.</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = issues.map(issue => `
        <div class="security-issue">
            <div class="issue-info">
                <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <div>
                    <strong>${issue.title}</strong>
                    <p>${issue.description}</p>
                </div>
            </div>
            <button class="btn btn--outline btn--sm">${issue.action}</button>
        </div>
    `).join('');
}

/**
 * Settings Functions
 */
function loadSettings() {
    const username = AppState.currentUser.username;
    const userProfile = JSON.parse(localStorage.getItem(`passman-user-${username}`) || '{}');
    
    // Populate form fields
    document.getElementById('settings-username').value = username;
    document.getElementById('settings-email').value = userProfile.email || '';
    document.getElementById('session-timeout').value = AppState.settings.sessionTimeout;
    document.getElementById('min-length').value = AppState.settings.passwordMinLength;
    document.getElementById('require-special').checked = AppState.settings.requireSpecialChars;
    document.getElementById('require-numbers').checked = AppState.settings.requireNumbers;
    document.getElementById('require-uppercase').checked = AppState.settings.requireUppercase;
}

function saveSettings() {
    const username = AppState.currentUser.username;
    const email = document.getElementById('settings-email').value;
    
    // Update settings
    AppState.settings.sessionTimeout = parseInt(document.getElementById('session-timeout').value);
    AppState.settings.passwordMinLength = parseInt(document.getElementById('min-length').value);
    AppState.settings.requireSpecialChars = document.getElementById('require-special').checked;
    AppState.settings.requireNumbers = document.getElementById('require-numbers').checked;
    AppState.settings.requireUppercase = document.getElementById('require-uppercase').checked;
    
    // Save user profile
    const userProfile = JSON.parse(localStorage.getItem(`passman-user-${username}`) || '{}');
    userProfile.email = email;
    localStorage.setItem(`passman-user-${username}`, JSON.stringify(userProfile));
    
    // Save settings
    localStorage.setItem(`passman-settings-${username}`, JSON.stringify(AppState.settings));
    
    showToast('Settings saved successfully', 'success');
    
    // Restart session timeout with new duration
    startSessionTimeout();
}

/**
 * Import/Export Functions
 */
function exportPasswords() {
    const data = {
        passwords: AppState.passwords,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `passman-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showToast('Passwords exported successfully', 'success');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            
            if (data.passwords && Array.isArray(data.passwords)) {
                // Add imported passwords with new IDs
                const importedPasswords = data.passwords.map(p => ({
                    ...p,
                    id: Date.now() + Math.random()
                }));
                
                AppState.passwords = [...AppState.passwords, ...importedPasswords];
                savePasswords();
                renderPasswords();
                
                showToast(`Imported ${importedPasswords.length} passwords successfully`, 'success');
            } else {
                showToast('Invalid file format', 'error');
            }
        } catch (error) {
            showToast('Error reading file', 'error');
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

/**
 * Session Management Functions
 */
function loadUserSession() {
    const session = localStorage.getItem('passman-session');
    if (session) {
        const sessionData = JSON.parse(session);
        const loginTime = sessionData.loginTime;
        const now = Date.now();
        const sessionDuration = AppState.settings.sessionTimeout * 60 * 1000; // Convert to milliseconds
        
        if (now - loginTime < sessionDuration) {
            // Session is still valid
            AppState.isAuthenticated = true;
            AppState.currentUser = { username: sessionData.username };
            loadUserData(sessionData.username);
            return true;
        } else {
            // Session expired
            localStorage.removeItem('passman-session');
        }
    }
    return false;
}

function loadUserData(username) {
    // Load user settings
    const savedSettings = localStorage.getItem(`passman-settings-${username}`);
    if (savedSettings) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
    }
}

function startSessionTimeout() {
    // Clear existing timers
    if (AppState.sessionTimeout) clearTimeout(AppState.sessionTimeout);
    if (AppState.sessionWarningTimer) clearTimeout(AppState.sessionWarningTimer);
    
    const timeoutDuration = AppState.settings.sessionTimeout * 60 * 1000; // Convert to milliseconds
    const warningTime = timeoutDuration - 60000; // Warn 1 minute before timeout
    
    // Set warning timer
    AppState.sessionWarningTimer = setTimeout(() => {
        showSessionWarning();
    }, warningTime);
    
    // Set logout timer
    AppState.sessionTimeout = setTimeout(() => {
        handleLogout();
        showToast('Session expired due to inactivity', 'warning');
    }, timeoutDuration);
}

function showSessionWarning() {
    const modal = document.getElementById('session-warning-modal');
    modal.classList.remove('hidden');
    
    let countdown = 60;
    const countdownElement = document.getElementById('countdown-timer');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            modal.classList.add('hidden');
        }
    }, 1000);
}

function extendSession() {
    const modal = document.getElementById('session-warning-modal');
    modal.classList.add('hidden');
    
    // Update session timestamp
    const session = JSON.parse(localStorage.getItem('passman-session'));
    session.loginTime = Date.now();
    localStorage.setItem('passman-session', JSON.stringify(session));
    
    // Restart timeout
    startSessionTimeout();
    
    showToast('Session extended', 'success');
}

/**
 * Modal Functions
 */
function showConfirmModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('hidden');
    
    // Set up one-time event listener for confirmation
    const confirmButton = document.getElementById('confirm-action');
    const cancelButton = document.getElementById('confirm-cancel');
    
    const handleConfirm = () => {
        callback();
        closeConfirmModal();
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        closeConfirmModal();
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
    };
    
    confirmButton.addEventListener('click', handleConfirm);
    cancelButton.addEventListener('click', handleCancel);
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

/**
 * Utility Functions
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

/**
 * TOTP (Time-based One-Time Password) Functions
 * Simplified implementation for demo purposes
 */
function generateTOTPSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}

function verifyTOTPCode(secret, code) {
    // Simplified TOTP verification for demo
    // In a real application, use a proper TOTP library
    const timeStep = Math.floor(Date.now() / 30000);
    const expectedCode = String(timeStep).slice(-6).padStart(6, '0');
    
    // For demo purposes, accept the current time-based code or "123456"
    return code === expectedCode || code === '123456';
}

/**
 * Keyboard Shortcuts
 */
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('password-search');
        if (searchInput && AppState.isAuthenticated) {
            searchInput.focus();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const visibleModals = document.querySelectorAll('.modal:not(.hidden)');
        visibleModals.forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});

// Initialize app when DOM is ready
console.log('PassMan Password Manager script loaded successfully');