// Dashboard State Management
const vehicleData = {
    vehicleType: '',
    vehicleModel: '',
    licensePlate: '',
    currentOdometer: 0
};

const maintenanceRecords = [];

// Service intervals (in km) - Default recommendations
const serviceIntervals = {
    'Oil Change': 6000,
    'Air Filter': 20000,
    'Tire Rotation': 10000,
    'Brake Service': 50000,
    'Battery': 50000, // placeholder, usually yearly
    'Coolant Flush': 60000,
    'Transmission Fluid': 80000,
    'Spark Plugs': 60000,
    'Inspection': 10000,
    'Other': 10000
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocalStorage();
    setupEventListeners();
    updateAllDisplays();
    setTodayDate();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Edit Vehicle Button
    document.querySelectorAll('[data-edit="vehicle"]').forEach(btn => {
        btn.addEventListener('click', openEditVehicleModal);
    });

    // Edit Vehicle Form
    document.getElementById('editVehicleForm').addEventListener('submit', saveVehicleInfo);

    // Maintenance Form
    document.getElementById('maintenanceForm').addEventListener('submit', addMaintenanceRecord);

    // Modal Close Buttons
    document.querySelector('.modal-close').addEventListener('click', closeEditVehicleModal);
    document.querySelector('.modal-cancel-btn').addEventListener('click', closeEditVehicleModal);

    // Logout Button
    document.querySelector('.logout-btn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Service Type Change - Update next service km field
    document.getElementById('serviceType').addEventListener('change', updateNextServiceKm);
    document.getElementById('odometerReading').addEventListener('change', updateNextServiceKm);
}

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Highlight selected button
    event.target.classList.add('active');

    // Refresh schedule if switching to schedule tab
    if (tabName === 'schedule') {
        updateScheduleDisplay();
    }

    // Refresh history if switching to history tab
    if (tabName === 'history') {
        updateTimelineDisplay();
    }
}

// Set Today's Date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('serviceDate').value = today;
}

// Update Next Service Km
function updateNextServiceKm() {
    const serviceType = document.getElementById('serviceType').value;
    const odometer = parseInt(document.getElementById('odometerReading').value) || 0;

    if (serviceType && odometer) {
        const interval = serviceIntervals[serviceType];
        const nextService = odometer + interval;
        document.getElementById('nextServiceKm').value = nextService;
    }
}

// Add Maintenance Record
function addMaintenanceRecord(e) {
    e.preventDefault();

    const record = {
        id: Date.now(),
        serviceType: document.getElementById('serviceType').value,
        serviceDate: document.getElementById('serviceDate').value,
        odometerReading: parseInt(document.getElementById('odometerReading').value),
        serviceCost: parseFloat(document.getElementById('serviceCost').value) || 0,
        serviceProvider: document.getElementById('serviceProvider').value,
        nextServiceKm: parseInt(document.getElementById('nextServiceKm').value),
        serviceNotes: document.getElementById('serviceNotes').value
    };

    // Update current odometer if this is higher
    if (record.odometerReading > vehicleData.currentOdometer) {
        vehicleData.currentOdometer = record.odometerReading;
    }

    maintenanceRecords.push(record);
    maintenanceRecords.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

    saveDataToLocalStorage();
    resetMaintenanceForm();
    updateAllDisplays();
    switchTab('maintenance');

    showNotification('Maintenance record added successfully!', 'success');
}

// Reset Maintenance Form
function resetMaintenanceForm() {
    document.getElementById('maintenanceForm').reset();
    setTodayDate();
    document.getElementById('nextServiceKm').value = '';
}

// Update Vehicle Info
function openEditVehicleModal() {
    document.getElementById('editVehicleType').value = vehicleData.vehicleType;
    document.getElementById('editVehicleModel').value = vehicleData.vehicleModel;
    document.getElementById('editLicensePlate').value = vehicleData.licensePlate;
    document.getElementById('editCurrentOdometer').value = vehicleData.currentOdometer;
    document.getElementById('editVehicleModal').style.display = 'block';
}

function closeEditVehicleModal() {
    document.getElementById('editVehicleModal').style.display = 'none';
}

function saveVehicleInfo(e) {
    e.preventDefault();

    vehicleData.vehicleType = document.getElementById('editVehicleType').value;
    vehicleData.vehicleModel = document.getElementById('editVehicleModel').value;
    vehicleData.licensePlate = document.getElementById('editLicensePlate').value;
    vehicleData.currentOdometer = parseInt(document.getElementById('editCurrentOdometer').value);

    saveDataToLocalStorage();
    updateVehicleInfoDisplay();
    closeEditVehicleModal();
    showNotification('Vehicle information updated!', 'success');
}

// Update All Displays
function updateAllDisplays() {
    updateVehicleInfoDisplay();
    updateStatsDisplay();
    updateMaintenanceTableDisplay();
    updateUpcomingServicesDisplay();
    updateScheduleDisplay();
}

// Update Vehicle Info Display
function updateVehicleInfoDisplay() {
    document.getElementById('vehicleType').value = vehicleData.vehicleType || 'Not set';
    document.getElementById('vehicleModel').value = vehicleData.vehicleModel || 'Not set';
    document.getElementById('licensePlate').value = vehicleData.licensePlate || 'Not set';
    document.getElementById('currentOdometer').value = vehicleData.currentOdometer || 0;
}

// Update Stats Display
function updateStatsDisplay() {
    const totalServices = maintenanceRecords.length;
    const currentYear = new Date().getFullYear();
    const servicesThisYear = maintenanceRecords.filter(r => {
        return new Date(r.serviceDate).getFullYear() === currentYear;
    }).length;
    const totalCost = maintenanceRecords.reduce((sum, r) => sum + r.serviceCost, 0);
    const upcomingServices = calculateUpcomingServices().length;

    document.getElementById('totalServices').textContent = totalServices;
    document.getElementById('servicesThisYear').textContent = servicesThisYear;
    document.getElementById('upcomingServices').textContent = upcomingServices;
    document.getElementById('totalCost').textContent = '$' + totalCost.toFixed(2);
}

// Calculate Upcoming Services
function calculateUpcomingServices() {
    const upcoming = [];

    for (const [serviceType, interval] of Object.entries(serviceIntervals)) {
        const lastService = maintenanceRecords
            .filter(r => r.serviceType === serviceType)
            .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate))[0];

        if (lastService) {
            const nextDueKm = lastService.nextServiceKm;
            const kmRemaining = nextDueKm - vehicleData.currentOdometer;

            if (kmRemaining <= 5000 && kmRemaining > 0) { // Show if within 5000 km
                upcoming.push({
                    serviceType: serviceType,
                    nextDueKm: nextDueKm,
                    kmRemaining: kmRemaining,
                    lastServiceDate: lastService.serviceDate,
                    priority: kmRemaining <= 0 ? 'urgent' : kmRemaining <= 1000 ? 'high' : 'medium'
                });
            }
        } else {
            // No previous service, suggest initial service
            const nextDueKm = vehicleData.currentOdometer + interval;
            upcoming.push({
                serviceType: serviceType,
                nextDueKm: nextDueKm,
                kmRemaining: interval,
                lastServiceDate: 'Never',
                priority: 'info'
            });
        }
    }

    return upcoming.sort((a, b) => a.kmRemaining - b.kmRemaining);
}

// Update Upcoming Services Display
function updateUpcomingServicesDisplay() {
    const upcoming = calculateUpcomingServices();
    const container = document.getElementById('upcomingList');

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="empty-state">No upcoming services in the near future.</p>';
        return;
    }

    container.innerHTML = upcoming.map(service => `
        <div class="upcoming-item priority-${service.priority}">
            <div class="upcoming-header">
                <span class="service-name">${service.serviceType}</span>
                <span class="priority-badge priority-${service.priority}">${service.priority.toUpperCase()}</span>
            </div>
            <div class="upcoming-details">
                <div class="detail-item">
                    <span class="detail-label">Next Due:</span>
                    <span class="detail-value">${service.nextDueKm.toLocaleString()} km</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Remaining:</span>
                    <span class="detail-value ${service.kmRemaining <= 0 ? 'overdue' : ''}">${Math.max(0, service.kmRemaining).toLocaleString()} km</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Last Service:</span>
                    <span class="detail-value">${service.lastServiceDate}</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.max(0, Math.min(100, (1 - (service.kmRemaining / 5000)) * 100))}%"></div>
            </div>
        </div>
    `).join('');
}

// Update Maintenance Table Display
function updateMaintenanceTableDisplay() {
    const tbody = document.getElementById('maintenanceTableBody');

    if (maintenanceRecords.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="empty-state">No maintenance records yet. Add your first service above.</td></tr>';
        return;
    }

    tbody.innerHTML = maintenanceRecords.map(record => `
        <tr class="table-row">
            <td class="service-type-cell">${record.serviceType}</td>
            <td>${formatDate(record.serviceDate)}</td>
            <td>${record.odometerReading.toLocaleString()}</td>
            <td>$${record.serviceCost.toFixed(2)}</td>
            <td>${record.serviceProvider || '-'}</td>
            <td>${record.nextServiceKm.toLocaleString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" onclick="viewRecord(${record.id})">View</button>
                    <button class="action-btn delete-btn" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update Schedule Display
function updateScheduleDisplay() {
    const container = document.getElementById('scheduleGrid');
    const upcoming = calculateUpcomingServices();

    if (upcoming.length === 0) {
        container.innerHTML = '<p class="empty-state">Add vehicle and maintenance records to see service schedule.</p>';
        return;
    }

    container.innerHTML = upcoming.map(service => {
        const progressPercent = Math.max(0, Math.min(100, (1 - (service.kmRemaining / 5000)) * 100));
        return `
            <div class="schedule-item priority-${service.priority}">
                <div class="schedule-header">
                    <h3>${service.serviceType}</h3>
                    <span class="schedule-priority">${service.priority.toUpperCase()}</span>
                </div>
                <div class="schedule-content">
                    <div class="schedule-row">
                        <span class="label">Next Due:</span>
                        <span class="value">${service.nextDueKm.toLocaleString()} km</span>
                    </div>
                    <div class="schedule-row">
                        <span class="label">Remaining:</span>
                        <span class="value ${service.kmRemaining <= 0 ? 'overdue' : ''}">${Math.max(0, service.kmRemaining).toLocaleString()} km</span>
                    </div>
                    <div class="schedule-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="progress-text">${progressPercent.toFixed(0)}% complete</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update Timeline Display
function updateTimelineDisplay() {
    const container = document.getElementById('timeline');

    if (maintenanceRecords.length === 0) {
        container.innerHTML = '<p class="empty-state">No service history yet. Add maintenance records to see your vehicle\'s history.</p>';
        return;
    }

    container.innerHTML = '<div class="timeline-items">' + maintenanceRecords.map((record, index) => `
        <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <h3>${record.serviceType}</h3>
                <p class="timeline-date">${formatDate(record.serviceDate)}</p>
                <p class="timeline-details">
                    <span class="detail-badge">Odometer: ${record.odometerReading.toLocaleString()} km</span>
                    <span class="detail-badge">Cost: $${record.serviceCost.toFixed(2)}</span>
                    ${record.serviceProvider ? `<span class="detail-badge">Provider: ${record.serviceProvider}</span>` : ''}
                </p>
                ${record.serviceNotes ? `<p class="timeline-notes">${record.serviceNotes}</p>` : ''}
            </div>
        </div>
    `).join('') + '</div>';
}

// Delete Record
function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
        const index = maintenanceRecords.findIndex(r => r.id === id);
        if (index > -1) {
            maintenanceRecords.splice(index, 1);
            saveDataToLocalStorage();
            updateAllDisplays();
            showNotification('Maintenance record deleted!', 'success');
        }
    }
}

// View Record
function viewRecord(id) {
    const record = maintenanceRecords.find(r => r.id === id);
    if (record) {
        alert(`Service Type: ${record.serviceType}\n` +
              `Date: ${formatDate(record.serviceDate)}\n` +
              `Odometer: ${record.odometerReading.toLocaleString()} km\n` +
              `Cost: $${record.serviceCost.toFixed(2)}\n` +
              `Provider: ${record.serviceProvider || 'N/A'}\n` +
              `Next Due: ${record.nextServiceKm.toLocaleString()} km\n` +
              `Notes: ${record.serviceNotes || 'N/A'}`);
    }
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Local Storage Management
function saveDataToLocalStorage() {
    localStorage.setItem('vehicleData', JSON.stringify(vehicleData));
    localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));
}

function loadDataFromLocalStorage() {
    const savedVehicle = localStorage.getItem('vehicleData');
    const savedRecords = localStorage.getItem('maintenanceRecords');

    if (savedVehicle) {
        Object.assign(vehicleData, JSON.parse(savedVehicle));
    }

    if (savedRecords) {
        maintenanceRecords.splice(0, maintenanceRecords.length, ...JSON.parse(savedRecords));
    }
}

// Notification Function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modal Click Outside Close
window.addEventListener('click', function(e) {
    const modal = document.getElementById('editVehicleModal');
    if (e.target === modal) {
        closeEditVehicleModal();
    }
});
