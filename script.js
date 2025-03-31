// Global state
const state = {
    userLocation: null,
    parkingSpots: [],
    filteredSpots: [],
    currentSlide: 0,
    theme: 'light'
  };
  
  // DOM Elements
  const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    locationBtn: document.getElementById('location-btn'),
    filterBtn: document.getElementById('filter-btn'),
    sortSelect: document.getElementById('sort-by'),
    parkingContainer: document.getElementById('parking-cards-container'),
    slideContainer: document.getElementById('parking-slide'),
    prevBtn: document.querySelector('.prev-btn'),
    nextBtn: document.querySelector('.next-btn')
  };
  
  // Initialize the application
  document.addEventListener('DOMContentLoaded', async function() {
    // Set up event listeners
    setupEventListeners();
    
    // Get user's current location
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error("Location error:", error);
      state.userLocation = { lat: -1.286389, lng: 36.817223 }; // Default to Nairobi
    }
    
    // Load parking data
    await loadParkingData();
    
    // Set initial theme
    setInitialTheme();
  });
  
  // Set up all event listeners
  function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Location button
    elements.locationBtn.addEventListener('click', handleLocationUpdate);
    
    // Filter button
    elements.filterBtn.addEventListener('click', showFilterOptions);
    
    // Sort select
    elements.sortSelect.addEventListener('change', handleSortChange);
    
    // Slideshow navigation
    elements.prevBtn.addEventListener('click', showPreviousSlide);
    elements.nextBtn.addEventListener('click', showNextSlide);
  }
  
  // Theme functionality
  function setInitialTheme() {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme') || 
                       (prefersDarkScheme.matches ? 'dark' : 'light');
    
    state.theme = savedTheme;
    if (state.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }
  
  function toggleTheme() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      state.theme = 'light';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      state.theme = 'dark';
    }
    localStorage.setItem('theme', state.theme);
  }
  
  // Location functionality
  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            state.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            resolve(state.userLocation);
          },
          error => {
            console.error("Geolocation error:", error);
            reject(error);
          },
          { timeout: 10000 }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        reject("Geolocation not supported");
      }
    });
  }
  
  async function handleLocationUpdate() {
    try {
      await getCurrentLocation();
      showNotification("Location updated successfully!");
      renderParkingCards();
    } catch (error) {
      showNotification("Could not update location. Using default position.", 'error');
    }
  }
  
  // Data loading and processing
  async function loadParkingData() {
    try {
      const response = await fetch('db.json');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      if (!data.parkingSpots || !Array.isArray(data.parkingSpots)) {
        throw new Error('Invalid data format');
      }
      
      state.parkingSpots = data.parkingSpots;
      state.filteredSpots = [...data.parkingSpots];
      
      // Calculate distances for all spots
      calculateAllDistances();
      
      // Initial render
      renderParkingCards();
      setupSlideshow();
    } catch (error) {
      console.error('Error loading parking data:', error);
      showErrorMessage('Failed to load parking data. Please try again later.');
    }
  }
  
  function calculateAllDistances() {
    if (!state.userLocation) return;
    
    state.filteredSpots.forEach(spot => {
      if (spot.coordinates) {
        spot.calculatedDistance = calculateDistance(
          state.userLocation.lat,
          state.userLocation.lng,
          spot.coordinates.lat,
          spot.coordinates.lng
        );
      }
    });
  }
  
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Rendering functions
  function renderParkingCards() {
    if (state.filteredSpots.length === 0) {
      elements.parkingContainer.innerHTML = '<p class="error-message">No parking spots match your criteria</p>';
      return;
    }
    
    elements.parkingContainer.innerHTML = '';
    
    state.filteredSpots.forEach(spot => {
      const card = document.createElement('div');
      card.className = 'parking-card';
      
      // Calculate distance text
      let distanceText = spot.distance; // Default from JSON
      if (spot.calculatedDistance) {
        distanceText = `${spot.calculatedDistance.toFixed(1)} km from you`;
      }
      
      // Create amenities tags
      const amenities = [];
      if (spot.security) amenities.push('Security');
      if (spot.covered) amenities.push('Covered');
      if (spot.evCharging) amenities.push('EV Charging');
      if (spot.disabledAccess) amenities.push('Accessible');
      
      const amenityTags = amenities.map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
      ).join('');
      
      card.innerHTML = `
        <img src="${spot.image}" alt="${spot.name}" class="parking-image" onerror="this.src='./images/default-parking.jpg'">
        <div class="parking-info">
          <h3>${spot.name}</h3>
          <div class="parking-meta">
            <span><strong>Destination:</strong> ${spot.destination}</span>
            <span><strong>KES ${spot.price}</strong></span>
          </div>
          <p><strong>Distance:</strong> ${distanceText}</p>
          <div class="parking-amenities">
            ${amenityTags}
          </div>
          <button class="btn more-info-btn" data-id="${spot.id}">More Info</button>
        </div>
      `;
      
      elements.parkingContainer.appendChild(card);
    });
    
    // Add event listeners to info buttons
    document.querySelectorAll('.more-info-btn').forEach(button => {
      button.addEventListener('click', function() {
        const spotId = parseInt(this.getAttribute('data-id'));
        showParkingDetails(spotId);
      });
    });
  }
  
  function showParkingDetails(id) {
    const parking = state.parkingSpots.find(p => p.id === id);
    if (!parking) {
      showNotification("Parking spot not found", 'error');
      return;
    }
    
    let distanceMessage = parking.distance;
    if (parking.calculatedDistance) {
      distanceMessage = `${parking.calculatedDistance.toFixed(1)} km from your location`;
    }
    
    // Create amenities list
    const amenities = [];
    if (parking.security) amenities.push('✔️ 24/7 Security');
    if (parking.covered) amenities.push('✔️ Covered Parking');
    if (parking.evCharging) amenities.push('✔️ EV Charging Available');
    if (parking.disabledAccess) amenities.push('✔️ Disabled Access');
    
    const details = `
      <div class="parking-details">
        <h3>${parking.name}</h3>
        <p><strong>Address:</strong> ${parking.address}</p>
        <p><strong>Price:</strong> KES ${parking.price} per hour</p>
        <p><strong>Distance:</strong> ${distanceMessage}</p>
        <p><strong>Capacity:</strong> ${parking.capacity} spots</p>
        <p><strong>Operating Hours:</strong> ${parking.operatingHours}</p>
        <div class="amenities-list">
          <h4>Amenities:</h4>
          <ul>
            ${amenities.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>
        <p><strong>Payment Methods:</strong> ${parking.paymentMethods.join(', ')}</p>
      </div>
    `;
    
    // You could replace this with a modal for better UX
    alert(details);
  }
  
  // Slideshow functionality
  function setupSlideshow() {
    if (state.filteredSpots.length < 3) return;
    
    state.currentSlide = 0;
    updateSlide();
  }
  
  function updateSlide() {
    const spot = state.filteredSpots[state.currentSlide];
    elements.slideContainer.innerHTML = `
      <img class="slide-image" src="${spot.image}" alt="${spot.name}" onerror="this.src='./images/default-parking.jpg'">
      <h3 class="slide-name">${spot.name}</h3>
      <p class="slide-distance">${spot.calculatedDistance ? `${spot.calculatedDistance.toFixed(1)} km away` : spot.distance}</p>
      <button class="btn slide-info-btn" data-id="${spot.id}">View Details</button>
    `;
    
    // Add event listener to slide button
    elements.slideContainer.querySelector('.slide-info-btn').addEventListener('click', function() {
      const spotId = parseInt(this.getAttribute('data-id'));
      showParkingDetails(spotId);
    });
  }
  
  function showPreviousSlide() {
    state.currentSlide = (state.currentSlide - 1 + state.filteredSpots.length) % state.filteredSpots.length;
    updateSlide();
  }
  
  function showNextSlide() {
    state.currentSlide = (state.currentSlide + 1) % state.filteredSpots.length;
    updateSlide();
  }
  
  // Filter and sort functionality
  function showFilterOptions() {
    // In a full implementation, this would show a filter modal
    showNotification("Filter functionality coming soon!");
  }
  
  function handleSortChange() {
    const sortBy = elements.sortSelect.value;
    
    state.filteredSpots.sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.calculatedDistance || Infinity) - (b.calculatedDistance || Infinity);
      } else if (sortBy === 'price') {
        return a.price - b.price;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    
    renderParkingCards();
  }
  
  // Utility functions
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  function showErrorMessage(message) {
    elements.parkingContainer.innerHTML = `<p class="error-message">${message}</p>`;
  }
  // CRUD Operations
async function getAllParkingSpots() {
  try {
    const response = await fetch('db.json');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.parkingSpots || [];
  } catch (error) {
    console.error('Error fetching parking spots:', error);
    return [];
  }
}

async function createParkingSpot(newSpot) {
  try {
    const spots = await getAllParkingSpots();
    const newId = Math.max(...spots.map(s => s.id), 0) + 1;
    const spotWithId = { ...newSpot, id: newId };
    
    state.parkingSpots.push(spotWithId);
    state.filteredSpots.push(spotWithId);
    
    renderParkingCards();
    setupSlideshow();
    
    return spotWithId;
  } catch (error) {
    console.error('Error creating parking spot:', error);
    throw error;
  }
}

async function updateParkingSpot(id, updatedSpot) {
  try {
    const index = state.parkingSpots.findIndex(spot => spot.id === id);
    
    if (index === -1) {
      throw new Error('Parking spot not found');
    }
    
    state.parkingSpots[index] = { ...state.parkingSpots[index], ...updatedSpot };
    
    const filteredIndex = state.filteredSpots.findIndex(spot => spot.id === id);
    if (filteredIndex !== -1) {
      state.filteredSpots[filteredIndex] = { ...state.filteredSpots[filteredIndex], ...updatedSpot };
    }
    
    renderParkingCards();
    setupSlideshow();
    
    return state.parkingSpots[index];
  } catch (error) {
    console.error('Error updating parking spot:', error);
    throw error;
  }
}

async function deleteParkingSpot(id) {
  try {
    state.parkingSpots = state.parkingSpots.filter(spot => spot.id !== id);
    state.filteredSpots = state.filteredSpots.filter(spot => spot.id !== id);
    
    renderParkingCards();
    setupSlideshow();
    
    return true;
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    throw error;
  }
}
document.getElementById('add-parking-btn').addEventListener('click', () => openParkingModal());
document.getElementById('parking-form').addEventListener('submit', handleParkingFormSubmit);
document.querySelector('.close-btn').addEventListener('click', () => closeParkingModal());

function openParkingModal(spot = null) {
  const modal = document.getElementById('parking-modal');
  const form = document.getElementById('parking-form');
  
  if (spot) {
    document.getElementById('modal-title').textContent = 'Edit Parking Spot';
    document.getElementById('spot-id').value = spot.id;
    document.getElementById('spot-name').value = spot.name;
    document.getElementById('spot-destination').value = spot.destination;
    document.getElementById('spot-address').value = spot.address;
    document.getElementById('spot-price').value = spot.price;
    document.getElementById('spot-distance').value = spot.distance;
    document.getElementById('spot-capacity').value = spot.capacity;
    document.getElementById('spot-image').value = spot.image;
    document.getElementById('spot-lat').value = spot.coordinates.lat;
    document.getElementById('spot-lng').value = spot.coordinates.lng;
    document.getElementById('spot-security').checked = spot.security || false;
    document.getElementById('spot-covered').checked = spot.covered || false;
    document.getElementById('spot-ev').checked = spot.evCharging || false;
    document.getElementById('spot-accessible').checked = spot.disabledAccess || false;
  } else {
    //
    document.getElementById('modal-title').textContent = 'Add New Parking Spot';
    form.reset();
    document.getElementById('spot-id').value = '';
  }
  
  modal.style.display = 'block';
}

function closeParkingModal() {
  document.getElementById('parking-modal').style.display = 'none';
}

async function handleParkingFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const spotId = form.elements['spot-id'].value;
  
  const spotData = {
    name: form.elements['spot-name'].value,
    destination: form.elements['spot-destination'].value,
    address: form.elements['spot-address'].value,
    price: parseInt(form.elements['spot-price'].value),
    distance: form.elements['spot-distance'].value,
    capacity: parseInt(form.elements['spot-capacity'].value),
    image: form.elements['spot-image'].value,
    coordinates: {
      lat: parseFloat(form.elements['spot-lat'].value),
      lng: parseFloat(form.elements['spot-lng'].value)
    },
    security: form.elements['spot-security'].checked,
    covered: form.elements['spot-covered'].checked,
    evCharging: form.elements['spot-ev'].checked,
    disabledAccess: form.elements['spot-accessible'].checked
  };
  
  try {
    if (spotId) {
      // Update existing spot
      await updateParkingSpot(parseInt(spotId), spotData);
      showNotification('Parking spot updated successfully!');
    } else {
      // Create new spot
      await createParkingSpot(spotData);
      showNotification('Parking spot added successfully!');
    }
    
    closeParkingModal();
  } catch (error) {
    showNotification('Error saving parking spot: ' + error.message, 'error');
  }
}

// Modify renderParkingCards to include edit/delete buttons
function renderParkingCards() {
  if (state.filteredSpots.length === 0) {
    elements.parkingContainer.innerHTML = '<p class="error-message">No parking spots match your criteria</p>';
    return;
  }
  
  elements.parkingContainer.innerHTML = '';
  
  state.filteredSpots.forEach(spot => {
    const card = document.createElement('div');
    card.className = 'parking-card';
    
    // Calculate distance text
    let distanceText = spot.distance; // Default from JSON
    if (spot.calculatedDistance) {
      distanceText = `${spot.calculatedDistance.toFixed(1)} km from you`;
    }
    
    // Create amenities tags
    const amenities = [];
    if (spot.security) amenities.push('Security');
    if (spot.covered) amenities.push('Covered');
    if (spot.evCharging) amenities.push('EV Charging');
    if (spot.disabledAccess) amenities.push('Accessible');
    
    const amenityTags = amenities.map(amenity => 
      `<span class="amenity-tag">${amenity}</span>`
    ).join('');
    
    card.innerHTML = `
      <img src="${spot.image}" alt="${spot.name}" class="parking-image" onerror="this.src='./images/default-parking.jpg'">
      <div class="parking-info">
        <h3>${spot.name}</h3>
        <div class="parking-meta">
          <span><strong>Destination:</strong> ${spot.destination}</span>
          <span><strong>KES ${spot.price}</strong></span>
        </div>
        <p><strong>Distance:</strong> ${distanceText}</p>
        <div class="parking-amenities">
          ${amenityTags}
        </div>
        <div class="admin-actions">
          <button class="btn more-info-btn" data-id="${spot.id}">More Info</button>
          <button class="btn edit-btn" data-id="${spot.id}">Edit</button>
          <button class="btn delete-btn" data-id="${spot.id}">Delete</button>
        </div>
      </div>
    `;
    
    elements.parkingContainer.appendChild(card);
    
    // Add event listeners to buttons
    card.querySelector('.more-info-btn').addEventListener('click', function() {
      const spotId = parseInt(this.getAttribute('data-id'));
      showParkingDetails(spotId);
    });
    
    card.querySelector('.edit-btn').addEventListener('click', function() {
      const spotId = parseInt(this.getAttribute('data-id'));
      const spot = state.parkingSpots.find(s => s.id === spotId);
      if (spot) openParkingModal(spot);
    });
    
    card.querySelector('.delete-btn').addEventListener('click', async function() {
      const spotId = parseInt(this.getAttribute('data-id'));
      if (confirm('Are you sure you want to delete this parking spot?')) {
        try {
          await deleteParkingSpot(spotId);
          showNotification('Parking spot deleted successfully!');
        } catch (error) {
          showNotification('Error deleting parking spot: ' + error.message, 'error');
        }
      }
    });
  });
}