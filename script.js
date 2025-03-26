/**
 * Parking Space Finder Application
 * 
 * Features:
 * - Displays parking locations on an interactive map
 * - Filters parking by type
 * - Dark/light mode toggle
 * - Responsive design
 */

// DOM Elements
const TYPE_FILTER = document.getElementById('typeFilter');
const THEME_TOGGLE = document.getElementById('themeToggle');
const PARKING_LIST = document.getElementById('parkingList');
const MAP_ELEMENT = document.getElementById('map');

// Application State
const state = {
    map: null,
    markers: [],
    parkingData: []
};

// Initialize Application
function initApp() {
    initMap();
    loadParkingData();
    setupEventListeners();
}

// Initialize Map
function initMap() {
    state.map = L.map(MAP_ELEMENT).setView([-1.286389, 36.817223], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(state.map);
}

// Load Parking Data
async function loadParkingData() {
    try {
        const response = await fetch('http://localhost:3000/parkingSpots');
        state.parkingData = await response.json();
        displayParkingSpots(state.parkingData);
        
        if (state.parkingData.length > 0) {
            zoomToMarkers();
        }
    } catch (error) {
        console.error('Error loading parking data:', error);
        displayError();
    }
}

// Display Parking Spots
function displayParkingSpots(spots) {
    clearMarkers();
    clearParkingList();
    
    if (spots.length === 0) {
        displayNoResults();
        return;
    }
    
    spots.forEach(spot => {
        addMarker(spot);
        addParkingCard(spot);
    });
}

// Add Marker to Map
function addMarker(spot) {
    const markerIcon = createMarkerIcon(spot);
    const marker = L.marker([spot.location.lat, spot.location.lng], {
        icon: markerIcon
    }).addTo(state.map);
    
    marker.bindPopup(createPopupContent(spot));
    state.markers.push(marker);
}

// Create Marker Icon
function createMarkerIcon(spot) {
    return L.divIcon({
        className: `marker-icon marker-${spot.type}`,
        html: `<div>🚗</div><div class="marker-label">${spot.available}</div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
}

// Create Popup Content
function createPopupContent(spot) {
    return `
        <strong>${spot.name}</strong><br>
        <strong>Type:</strong> ${spot.type.toUpperCase()}<br>
        <strong>Price:</strong> KSH ${spot.price}/HR<br>
        <strong>Available:</strong> ${spot.available}/${spot.spaces}<br>
        <strong>Address:</strong> ${spot.address}
    `;
}

// Add Parking Card
function addParkingCard(spot) {
    const card = document.createElement('article');
    card.className = 'parking-card';
    card.innerHTML = `
        <h3>${spot.name}</h3>
        <p><strong>TYPE:</strong> ${spot.type.toUpperCase()}</p>
        <p><strong>PRICE:</strong> <span class="price">KSH ${spot.price}/HR</span></p>
        <p><strong>AVAILABLE:</strong> ${spot.available}/${spot.spaces} SPACES</p>
        <p><strong>ADDRESS:</strong> ${spot.address}</p>
    `;
    PARKING_LIST.appendChild(card);
}

// Filter Parking Spots
function filterParkingSpots() {
    const filterValue = TYPE_FILTER.value;
    const filteredSpots = filterValue === 'all' 
        ? state.parkingData 
        : state.parkingData.filter(spot => spot.type === filterValue);
    
    displayParkingSpots(filteredSpots);
}

// Clear All Markers
function clearMarkers() {
    state.markers.forEach(marker => state.map.removeLayer(marker));
    state.markers = [];
}

// Clear Parking List
function clearParkingList() {
    PARKING_LIST.innerHTML = '';
}

// Zoom to Show All Markers
function zoomToMarkers() {
    const markerGroup = new L.featureGroup(state.markers);
    state.map.fitBounds(markerGroup.getBounds().pad(0.2));
}

// Display Error Message
function displayError() {
    PARKING_LIST.innerHTML = `
        <div class="error-message">
            <p>⚠️ Unable to load parking data. Please try again later.</p>
        </div>
    `;
}

// Display No Results Message
function displayNoResults() {
    PARKING_LIST.innerHTML = `
        <div class="no-results">
            <p>No parking spots found matching your criteria.</p>
        </div>
    `;
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    THEME_TOGGLE.textContent = newTheme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE';
    
    // Save preference to localStorage
    localStorage.setItem('themePreference', newTheme);
}

// Set Initial Theme
function setInitialTheme() {
    const savedTheme = localStorage.getItem('themePreference') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    THEME_TOGGLE.textContent = savedTheme === 'dark' ? '☀️ LIGHT MODE' : '🌙 DARK MODE';
}

// Setup Event Listeners
function setupEventListeners() {
    TYPE_FILTER.addEventListener('change', filterParkingSpots);
    THEME_TOGGLE.addEventListener('click', toggleTheme);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setInitialTheme();
    initApp();
});