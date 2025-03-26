# Parking Space Finder 🚗

![Project Screenshot](./screenshot.png)

**Author**: [Ian Kiprop]  
**Live Site**: [GitHub Pages Link](#)  
**License**: MIT License  

## Description
A web application that helps users find available parking spaces in Nairobi using local JSON data. The app displays parking locations on an interactive map with availability and filtering options.

## Features
- Interactive map with parking location markers
- Filter parking by type (street, garage, lot)
- Dark/light mode toggle
- Responsive design for all devices
- Detailed parking information cards

## Technologies Used
- HTML5, CSS3, JavaScript
- Leaflet.js for interactive maps
- Local JSON data storage

## Setup Instructions
1. Clone this repository
2. Open `index.html` in your browser
3. No server required - works with local data

## Data Structure
The application uses the following JSON structure:
```json
{
    "parkingSpots": [
        {
            "id": 1,
            "name": "NAIROBI CENTRAL PARKING",
            "type": "garage",
            "location": { "lat": -1.286389, "lng": 36.817223 },
            "price": 250,
            "spaces": 150,
            "available": 45,
            "address": "CBD, NAIROBI",
            "operator": "CITY PARKING LTD",
            "hours": "24/7"
        },
        ...
    ]
}