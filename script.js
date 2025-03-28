document.addEventListener('DOMContentLoaded', async function() {
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme or use system preference
    const currentTheme = localStorage.getItem('theme') || 
                         (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the current theme
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Toggle between themes
    themeToggle.addEventListener('click', function() {
        let theme;
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            theme = 'light';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            theme = 'dark';
        }
        localStorage.setItem('theme', theme);
    });

    // Location Functionality
    let userLocation = null;
    const locationBtn = document.getElementById('location-btn');

    // Get current location
    async function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        resolve(userLocation);
                    },
                    error => {
                        console.error("Geolocation error:", error);
                        // Default to Nairobi coordinates
                        userLocation = { lat: -1.286389, lng: 36.817223 };
                        reject(error);
                    },
                    { timeout: 10000 }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
                // Default to Nairobi coordinates
                userLocation = { lat: -1.286389, lng: 36.817223 };
                reject("Geolocation not supported");
            }
        });
    }

    // Calculate distance between two coordinates
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

    // Location button click handler
    locationBtn.addEventListener('click', async () => {
        try {
            await getCurrentLocation();
            alert("Location updated successfully!");
            // Refresh parking spots to update distances
            if (document.getElementById('parking-cards-container').children.length > 0) {
                fetchParkingData();
            }
        } catch (error) {
            alert("Could not update location. Using default Nairobi position.");
        }
    });

    // Main parking data fetch function
    async function fetchParkingData() {
        try {
            const response = await fetch('db.json');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (!data.parkingSpots || !Array.isArray(data.parkingSpots)) {
                throw new Error('Invalid data format: parkingSpots array not found');
            }
            
            displayParkingCards(data.parkingSpots);
            setupSlideshow(data.parkingSpots);
        } catch (error) {
            console.error('Error loading parking data:', error);
            displayErrorMessage('Failed to load parking data. Please try again later.');
        }
    }

    // Display parking cards
    function displayParkingCards(parkingSpots) {
        const container = document.getElementById('parking-cards-container');
        container.innerHTML = '';
        
        parkingSpots.forEach(spot => {
            const card = document.createElement('div');
            card.className = 'parking-card';
            
            // Calculate distance if coordinates are available
            let distanceText = spot.distance; // Default from JSON
            if (userLocation && spot.coordinates) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    spot.coordinates.lat,
                    spot.coordinates.lng
                );
                distanceText = `${distance.toFixed(1)} km from you`;
            }
            
            card.innerHTML = `
                <img src="${spot.image}" alt="${spot.name}" class="parking-image" onerror="this.src='./images/default-parking.jpg'">
                <div class="parking-info">
                    <h3>${spot.name}</h3>
                    <p><strong>Destination:</strong> ${spot.destination}</p>
                    <p><strong>Distance:</strong> ${distanceText}</p>
                    <p><strong>Security:</strong> ${spot.security ? '✔️ Available' : '❌ Not available'}</p>
                    <button class="navigate-btn" data-id="${spot.id}">More Info</button>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners to navigation buttons
        document.querySelectorAll('.navigate-btn').forEach(button => {
            button.addEventListener('click', function() {
                const spotId = parseInt(this.getAttribute('data-id'));
                showParkingDetails(spotId);
            });
        });
    }

    // Show parking details in alert
    function showParkingDetails(id) {
        fetch('db.json')
            .then(response => response.json())
            .then(data => {
                const parking = data.parkingSpots.find(p => p.id === id);
                if (parking) {
                    let distanceMessage = parking.distance;
                    
                    if (userLocation && parking.coordinates) {
                        const distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            parking.coordinates.lat,
                            parking.coordinates.lng
                        );
                        distanceMessage = `${distance.toFixed(1)} km from your location`;
                    }

                    const details = `
                        Parking: ${parking.name}
                        Destination: ${parking.destination}
                        Address: ${parking.address}
                        Price: KES ${parking.price}
                        Distance: ${distanceMessage}
                        Capacity: ${parking.capacity} spots
                        Security: ${parking.security ? 'Available' : 'Not available'}
                    `;
                    alert(details);
                } else {
                    alert('Parking spot not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Could not load parking details');
            });
    }

    // Setup slideshow
    function setupSlideshow(parkingSpots) {
        const slidesContainer = document.getElementById('parking-slide');
        const featuredSpots = parkingSpots.slice(0, 3);
        
        slidesContainer.innerHTML = '';
        
        let currentIndex = 0;
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        function updateSlide() {
            const spot = featuredSpots[currentIndex];
            slidesContainer.innerHTML = `
                <img class="slide-image" src="${spot.image}" alt="${spot.name}" onerror="this.src='./images/default-parking.jpg'">
                <h3 class="slide-name">${spot.name}</h3>
                <p class="slide-distance">${spot.distance} away</p>
            `;
        }

        updateSlide();

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + featuredSpots.length) % featuredSpots.length;
            updateSlide();
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % featuredSpots.length;
            updateSlide();
        });
    }

    // Display error message
    function displayErrorMessage(message) {
        const container = document.getElementById('parking-cards-container');
        container.innerHTML = `<p class="error-message">${message}</p>`;
    }

    // Initialize app
    try {
        await getCurrentLocation();
        await fetchParkingData();
    } catch (error) {
        console.error("Initialization error:", error);
        await fetchParkingData(); // Try to load data even if location fails
    }
});