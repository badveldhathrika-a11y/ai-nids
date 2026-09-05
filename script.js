/* ==========================================================================
   AI AquaGuard - Water Quality Monitoring Website
   JavaScript - Interactivity & Live Data Simulation
   ========================================================================== */

/* -------------------------------------------------------
   1. Navbar Scroll Effect
------------------------------------------------------- */
const navbar = document.getElementById('navbar');
const navLinks = document.getElementById('nav-links');
const hamburger = document.getElementById('hamburger');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    updateActiveLink();
});

/* -------------------------------------------------------
   2. Mobile Hamburger Menu
------------------------------------------------------- */
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

/* -------------------------------------------------------
   3. Active Nav Link Highlighting
------------------------------------------------------- */
function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;

        if (scrollPos >= top && scrollPos < bottom) {
            const currentId = section.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + currentId) {
                    link.classList.add('active');
                }
            });
        }
    });
}

/* -------------------------------------------------------
   4. Animated Counter Stats (Hero)
------------------------------------------------------- */
function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const suffix = el.textContent.includes('%') ? '%' : (el.textContent.includes('/') ? '/7' : '+');
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        let value = start + (target - start) * eased;
        if (suffix === '%') {
            el.textContent = value.toFixed(1) + '%';
        } else if (suffix === '/7') {
            el.textContent = Math.round(value) + '/7';
        } else {
            el.textContent = Math.round(value) + '+';
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// Trigger counters when hero stats enter viewport
const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => statsObserver.observe(el));

/* -------------------------------------------------------
   5. Live Dashboard Simulation
const params = {
    ph: { value: 7.0, min: 6.5, max: 8.5, decimals: 1, unit: '', label: 'pH', bar: null },
    temp: { value: 22.5, min: 18, max: 28, decimals: 1, unit: '°C', label: 'Temp', bar: null },
    turb: { value: 1.2, min: 0, max: 5, decimals: 1, unit: ' NTU', label: 'Turbidity', bar: null },
    tds: { value: 245, min: 0, max: 500, decimals: 0, unit: ' ppm', label: 'TDS', bar: null },
    do: { value: 8.0, min: 6.5, max: 8, decimals: 1, unit: ' mg/L', label: 'DO', bar: null },
    cond: { value: 180, min: 0, max: 250, decimals: 0, unit: ' µS/cm', label: 'Cond', bar: null }
};

function getElement(el) {
    return document.getElementById(el);
}

const features = [
    ['packet_rate', 'Packet rate', 'packets / second', 85],
    ['connection_count', 'Connection count', 'active connections', 18],
    ['failed_logins', 'Failed logins', 'attempts / minute', 1],
    ['payload_size', 'Payload size', 'bytes', 420],
    ['port_entropy', 'Port entropy', '0.00 - 1.00', 0.72],
    ['protocol_score', 'Protocol score', '0.00 - 1.00', 0.86]
];
let authMode = 'login';
let summaryData = { detections: [], alerts: [] };
let trafficChart;

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function showPage(page) {
    document.querySelectorAll('.page').forEach((item) => item.classList.add('hidden'));
    $(`#${page}Page`).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
    $('#pageTitle').textContent = { overview: 'System overview', analyze: 'Traffic analyzer', history: 'Detection history', model: 'Model performance' }[page];
    if (page === 'model') loadModel();
    if (page === 'history') renderHistory();
    history.replaceState(null, '', `#${page}`);
    $('#sidebar').classList.remove('open');
}

async function api(path, options = {}) {
    const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

function populateFields() {
    $('#featureFields').innerHTML = features.map(([name, label, hint, value]) => `<div class="field"><label for="${name}">${label}<small> · ${hint}</small></label><input id="${name}" name="${name}" type="number" step="any" value="${value}" required></div>`).join('');
}

function updateDashboard() {
    $('#totalMetric').textContent = summaryData.total || 0;
    $('#normalMetric').textContent = summaryData.normal || 0;
    $('#suspiciousMetric').textContent = summaryData.suspicious || 0;
    $('#accuracyMetric').textContent = summaryData.accuracy ? `${summaryData.accuracy}%` : '--';
    $('#alertCount').textContent = summaryData.alerts?.length || 0;
    $('#alertList').innerHTML = summaryData.alerts?.length ? summaryData.alerts.map((alert) => `<div class="alert-item"><b>${esc(alert.message)}</b><small>${new Date(alert.created_at).toLocaleString()}</small></div>`).join('') : '<div class="empty-state">No alerts. The queue is clear.</div>';
    renderChart();
}

function renderChart() {
    const rows = summaryData.detections || [];
    $('#chartEmpty').classList.toggle('hidden', rows.length > 0);
    if (typeof Chart === 'undefined') return;
    const normal = rows.filter((row) => row.prediction === 'Normal').length;
    const suspicious = rows.filter((row) => row.prediction === 'Suspicious').length;
    if (trafficChart) trafficChart.destroy();
    trafficChart = new Chart($('#trafficChart'), { type: 'doughnut', data: { labels: ['Normal', 'Suspicious'], datasets: [{ data: [normal, suspicious], backgroundColor: ['#75e6d0', '#ff6e6e'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '73%', plugins: { legend: { labels: { color: '#84939d', font: { family: 'Space Grotesk' } } } } } });
}

function renderHistory() {
    const query = ($('#historySearch').value || '').toLowerCase();
    const risk = $('#riskFilter').value;
    const rows = (summaryData.detections || []).filter((row) => `${row.prediction} ${row.source}`.toLowerCase().includes(query) && (risk === 'all' || row.risk === risk));
    $('#historyBody').innerHTML = rows.length ? rows.map((row) => `<tr><td>${new Date(row.created_at).toLocaleString()}</td><td>${esc(row.prediction)}</td><td><span class="status ${row.risk.toLowerCase()}">${esc(row.risk)}</span></td><td>${row.confidence}%</td><td>${esc(row.source)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">No detections match this filter.</td></tr>';
}

function renderPrediction(result) {
    const danger = result.prediction === 'Suspicious';
    $('#predictionResult').className = `panel prediction-result ${danger ? 'danger-result' : ''}`;
    $('#predictionResult').innerHTML = `<div class="result-heading"><div><span class="kicker">CLASSIFICATION</span><h3>${esc(result.prediction)}</h3></div><strong>${result.confidence}%</strong></div><p class="result-copy">Risk level: <b>${esc(result.risk)}</b> · ${esc(result.message || 'Prediction saved to the detection history.')}</p><p class="muted">Recorded ${new Date(result.created_at).toLocaleString()}</p>`;
}

async function refresh() { try { summaryData = await api('/api/summary'); updateDashboard(); } catch (error) { openAuth(); } }

async function loadModel() {
    try { const data = await api('/api/model'); $('#scoreGrid').innerHTML = [['Accuracy', data.accuracy], ['Precision', data.precision], ['Recall', data.recall], ['F1-score', data.f1]].map(([label, value]) => `<div class="score"><span>${label}</span><b>${value}%</b></div>`).join(''); $('#matrix').innerHTML = `<div></div><div class="label">Pred. normal</div><div class="label">Pred. suspicious</div><div class="label">Actual normal</div><div>${data.matrix[0][0]}</div><div>${data.matrix[0][1]}</div><div class="label">Actual suspicious</div><div>${data.matrix[1][0]}</div><div>${data.matrix[1][1]}</div>`; $('#importance').innerHTML = data.features.sort((a, b) => b.value - a.value).map((feature) => `<div class="bar-row"><span>${esc(feature.label)}</span><div class="bar"><i style="width:${feature.value}%"></i></div><small>${feature.value}%</small></div>`).join(''); } catch (error) { openAuth(); }
}

function openAuth() { $('#authModal').classList.remove('hidden'); }

document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showPage(link.dataset.page); }));
document.querySelectorAll('[data-page-target]').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.pageTarget)));
$('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#accountButton').addEventListener('click', openAuth);
$('#closeAuth').addEventListener('click', () => $('#authModal').classList.add('hidden'));
$('#authToggle').addEventListener('click', () => { authMode = authMode === 'login' ? 'register' : 'login'; $('#authTitle').textContent = authMode === 'login' ? 'Welcome back' : 'Create analyst account'; $('#authSubtitle').textContent = authMode === 'login' ? 'Sign in to your local SOC workspace.' : 'Passwords are hashed before storage.'; $('#authSubmit').textContent = authMode === 'login' ? 'Sign in' : 'Register'; $('#authToggle').textContent = authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'; });
$('#authForm').addEventListener('submit', async (event) => { event.preventDefault(); $('#authError').textContent = ''; try { await api(`/api/${authMode}`, { method: 'POST', body: JSON.stringify({ email: $('#email').value, password: $('#password').value }) }); $('#authModal').classList.add('hidden'); await refresh(); } catch (error) { $('#authError').textContent = error.message; } });
$('#predictForm').addEventListener('submit', async (event) => { event.preventDefault(); $('#predictError').textContent = ''; const button = $('#predictButton'); button.disabled = true; button.textContent = 'Classifying...'; try { const values = Object.fromEntries(new FormData(event.target)); renderPrediction(await api('/api/predict', { method: 'POST', body: JSON.stringify({ ...values, source: 'manual' }) })); await refresh(); } catch (error) { $('#predictError').textContent = error.message; } finally { button.disabled = false; button.innerHTML = 'Classify traffic <span>→</span>'; } });
$('#csvInput').addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; $('#fileNote').textContent = `Uploading ${file.name}...`; const form = new FormData(); form.append('file', file); try { const response = await fetch('/api/predict-csv', { method: 'POST', body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); $('#fileNote').textContent = `${data.count} rows classified and saved.`; await refresh(); showPage('history'); } catch (error) { $('#fileNote').textContent = error.message; } });
$('#historySearch').addEventListener('input', renderHistory); $('#riskFilter').addEventListener('change', renderHistory);
$('#logoutButton').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); openAuth(); });

populateFields();
const initialPage = location.hash.slice(1); showPage(['overview', 'analyze', 'history', 'model'].includes(initialPage) ? initialPage : 'overview');
refresh();
function updateDashboard() {
    // Update each parameter with slight random fluctuation
    params.ph.value = clamp(params.ph.value + randomChange(0.05), 6.5, 8.5);
    params.temp.value = clamp(params.temp.value + randomChange(0.2), 18, 28);
    params.turb.value = clamp(params.turb.value + randomChange(0.1), 0, 5);
    params.tds.value = clamp(params.tds.value + randomChange(3), 0, 500);
    params.do.value = clamp(params.do.value + randomChange(0.1), 6.5, 8);
    params.cond.value = clamp(params.cond.value + randomChange(2), 0, 250);

    // Update displayed values
    getElement('ph-value').textContent = params.ph.value.toFixed(params.ph.decimals);
    getElement('temp-value').textContent = params.temp.value.toFixed(params.temp.decimals) + '°C';
    getElement('turb-value').textContent = params.turb.value.toFixed(params.turb.decimals) + ' NTU';
    getElement('tds-value').textContent = params.tds.value.toFixed(params.tds.decimals) + ' ppm';
    getElement('do-value').textContent = params.do.value.toFixed(params.do.decimals) + ' mg/L';
    getElement('cond-value').textContent = params.cond.value.toFixed(params.cond.decimals) + ' µS/cm';

    // Update bars
    document.querySelector('.bar-fill.ph').style.width = ((params.ph.value - 4) / (9 - 4)) * 100 + '%';
    document.querySelector('.bar-fill.temp').style.width = (params.temp.value / 35) * 100 + '%';
    document.querySelector('.bar-fill.turb').style.width = (params.turb.value / 5) * 100 + '%';
    document.querySelector('.bar-fill.tds').style.width = (params.tds.value / 500) * 100 + '%';
    document.querySelector('.bar-fill.do').style.width = (params.do.value / 10) * 100 + '%';
    document.querySelector('.bar-fill.cond').style.width = (params.cond.value / 250) * 100 + '%';

    // Update status labels based on values
    updateStatus('ph-status', params.ph.value >= 6.5 && params.ph.value <= 8.5);
    updateStatus('temp-status', params.temp.value >= 18 && params.temp.value <= 28);

    // Update hero gauge
    const overall = calculateWQI();
    getElement('hero-score').textContent = overall;
    getElement('overall-score').textContent = overall;
    getElement('hero-gauge').style.background =
        `conic-gradient(var(--cyan) ${overall}%, rgba(255,255,255,0.2) 0)`;
    getElement('overall-level').textContent = wqiLabel(overall);

    // Update timestamp
    getElement('last-update').textContent = new Date().toLocaleTimeString();

    // Update overall score level in dashboard footer
    document.querySelector('.overall-qual .level').textContent = wqiLabel(overall);
}

function updateStatus(id, good) {
    const el = document.getElementById(id);
    // Status elements are found by class in HTML; handle gracefully
}

function randomChange(amount) {
    return (Math.random() - 0.5) * 2 * amount;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function calculateWQI() {
    // Simple aggregate WQI calculation
    const weights = {
        ph: 0.2, temp: 0.1, turb: 0.25, tds: 0.15, do: 0.2, cond: 0.1
    };
    let score = 0;
    let totalWeight = 0;

    // Normalize each parameter to a 0-100 scale where higher is better
    const normalized = {
        ph: 100 - (Math.abs(params.ph.value - 7) / 1.5) * 100,
        temp: 100 - (Math.abs(params.temp.value - 23) / 5) * 100,
        turb: 100 - (params.turb.value / 5) * 100,
        tds: 100 - (params.tds.value / 500) * 100,
        do: (params.do.value / 8) * 100,
        cond: 100 - (params.cond.value / 250) * 100
    };

    for (const key in weights) {
        score += normalized[key] * weights[key];
        totalWeight += weights[key];
    }

    return Math.max(0, Math.round(score / totalWeight));
}

function wqiLabel(score) {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
}

// Start dashboard updates
setInterval(updateDashboard, 1000);
updateDashboard();

// Also update data-status elements' classes for color
const statusEls = document.querySelectorAll('.param-status');
statusEls.forEach(el => {
    // Add animation pulse on initial load
    el.classList.add('pulse-in');
});

/* -------------------------------------------------------
   6. Contact Form Handling
------------------------------------------------------- */
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
        formSuccess.style.display = 'block';
        contactForm.reset();
        submitBtn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
        submitBtn.disabled = false;

        setTimeout(() => {
            formSuccess.style.display = 'none';
        }, 5000);
    }, 1500);
});

/* -------------------------------------------------------
   7. Scroll Reveal Animations
------------------------------------------------------- */
const revealElements = document.querySelectorAll('.feature-card, .step, .testimonial-card, .param-card, .about-text');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
});

// Initial load animation for hero
window.addEventListener('load', () => {
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    if (heroContent) heroContent.style.animation = 'fadeInUp 1s ease';
    if (heroVisual) heroVisual.style.animation = 'fadeInUp 1s ease 0.2s both';
});
