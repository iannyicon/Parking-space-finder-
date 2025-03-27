document.addEventListener('DOMContentLoaded', function() {
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

  // Parking Spot Functionality
  fetch('db.json')
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
      })
      .then(data => {
          if (!data.parkingSpots || !Array.isArray(data.parkingSpots)) {
              throw new Error('Invalid data format: parkingSpots array not found');
          }
          displayParkingCards(data.parkingSpots);
          setupSlideshow(data.parkingSpots);
      })
      .catch(error => {
          console.error('Error loading parking data:', error);
          displayErrorMessage('Failed to load parking data. Please try again later.');
      });

  function displayParkingCards(parkingSpots) {
      const container = document.getElementById('parking-cards-container');
      container.innerHTML = '';
      
      parkingSpots.forEach(spot => {
          const card = document.createElement('div');
          card.className = 'parking-card';
          card.innerHTML = `
              <img src="${spot.image}" alt="${spot.name}" class="parking-image" onerror="this.src='./images/default-parking.jpg'">
              <div class="parking-info">
                  <h3>${spot.name}</h3>
                  <p><strong>Destination:</strong> ${spot.destination}</p>
                  <p><strong>Security:</strong> ${spot.security ? '✔️ Available' : '❌ Not available'}</p>
                  <button class="navigate-btn" data-id="${spot.id}">More Info</button>
              </div>
          `;
          container.appendChild(card);
      });

      document.querySelectorAll('.navigate-btn').forEach(button => {
          button.addEventListener('click', function() {
              const spotId = parseInt(this.getAttribute('data-id'));
              showParkingDetails(spotId);
          });
      });
  }

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

  function showParkingDetails(id) {
      fetch('db.json')
          .then(response => response.json())
          .then(data => {
              const parking = data.parkingSpots.find(p => p.id === id);
              if (parking) {
                  const details = `
                      Parking: ${parking.name}
                      Destination: ${parking.destination}
                      Address: ${parking.address}
                      Price: KES ${parking.price}
                      Distance: ${parking.distance}
                      Capacity: ${parking.capacity} spots
                      Security: ${parking.security ? 'Available' : 'Not available'}
                  `;
                  alert(details);
              } else {
                  alert('Parking spot details not found');
              }
          })
          .catch(error => {
              console.error('Error:', error);
              alert('Could not load parking details');
          });
  }

  function displayErrorMessage(message) {
      const container = document.getElementById('parking-cards-container');
      container.innerHTML = `<p class="error-message">${message}</p>`;
  }
});