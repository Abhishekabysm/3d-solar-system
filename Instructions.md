# Complete AI Prompt for 3D Solar System Assignment

## Project Overview
Create a mobile-responsive web page with a 3D solar system simulation using Three.js. The project should be a seprate HTML  CSS AND JS file with embedded CSS and JavaScript.

## Technical Requirements

### 1. HTML Structure
Create an HTML page with:
- A full-screen canvas for the 3D scene
- A control panel overlay with speed sliders for each planet
- Responsive design that works on mobile and desktop
- Clean, modern UI design

### 2. Three.js 3D Scene Setup
```javascript
// Required scene components:
- Scene with black space background
- Perspective camera positioned to view the entire solar system
- Ambient light + directional light (representing sunlight)
- WebGL renderer with antialiasing enabled
```

### 3. Solar System Objects
Create the following celestial bodies as THREE.SphereGeometry:

**Sun (center):**
- Large golden/yellow sphere at origin (0,0,0)
- Self-rotating animation
- Bright material that acts as light source

**8 Planets in order from Sun:**
1. Mercury - smallest, gray, closest orbit
2. Venus - yellow/orange, second orbit
3. Earth - blue/green, third orbit
4. Mars - red, fourth orbit
5. Jupiter - large, orange/brown with bands, fifth orbit
6. Saturn - yellow with ring system, sixth orbit
7. Uranus - light blue/cyan, seventh orbit
8. Neptune - dark blue, outermost orbit

**Planet Requirements:**
- Each planet should have realistic relative sizes
- Distinct colors/textures for identification
- Individual rotation on their axis
- Orbital motion around the Sun at different speeds
- Realistic orbital distances (scaled appropriately)

### 4. Animation System
Implement smooth orbital mechanics:
- Use THREE.Clock or requestAnimationFrame for consistent timing
- Each planet should orbit at different speeds (Mercury fastest, Neptune slowest)
- Planets should rotate on their own axis while orbiting
- All animations should be frame-rate independent

### 5. Speed Control Interface
Create a control panel with:
- Individual speed sliders for each planet (range: 0 to 5x normal speed)
- Labels showing planet names
- Real-time speed adjustment (no page refresh needed)
- Pause/Resume button for all animations
- Clean, intuitive UI design

### 6. Interactive Features
Implement:
- Mouse/touch controls for camera rotation around the scene
- Zoom in/out functionality with mouse wheel or pinch gestures
- Smooth camera movements

### 7. Visual Enhancements
Add:
- Starfield background using THREE.Points
- Orbital path lines (optional rings showing planet paths)
- Smooth lighting that creates realistic shadows
- Anti-aliasing for crisp edges

### 8. Performance Optimization
Ensure:
- Smooth 60fps performance on modern browsers
- Efficient render loop
- Proper disposal of resources
- Mobile-friendly performance

## Code Structure Requirements

### File Organization:
- Single HTML file with embedded CSS and JavaScript
- Well-commented code explaining key sections
- Modular JavaScript functions for different components
- Clear variable naming conventions

### Key Functions to Implement:
```javascript
// Core functions needed:
function initScene() // Set up Three.js scene, camera, renderer
function createSun() // Create and position the sun
function createPlanet(name, size, color, distance, speed) // Planet factory
function createStarField() // Background stars
function setupLighting() // Ambient and directional lights
function setupControls() // Camera controls and UI event listeners
function updatePlanetSpeeds() // Handle speed slider changes
function animate() // Main render loop
function handleResize() // Responsive canvas sizing
```

## UI Design Specifications
- Dark theme with space-like appearance
- Control panel positioned as overlay (top-right or bottom)
- Responsive design that works on mobile devices
- Smooth hover effects and transitions
- Clear typography and intuitive controls

## Technical Implementation Details

### Animation Logic:
- Store each planet's orbital angle and increment based on speed
- Use Math.sin() and Math.cos() for circular orbital motion
- Separate rotation speed from orbital speed
- Implement smooth interpolation for speed changes

### Camera Setup:
- Position camera to show entire solar system
- Implement OrbitControls for user interaction
- Set appropriate near/far clipping planes
- Smooth zoom limits

### Performance Considerations:
- Use efficient geometry (low polygon count for distant planets)
- Implement proper render loop with deltaTime
- Avoid creating/destroying objects in animation loop
- Use appropriate texture sizes

## Expected Deliverables
The AI should generate:
1. Complete HTML file with embedded CSS/JS
2. Fully functional 3D solar system
3. Working speed control interface
4. Responsive design
5. Clean, commented code
6. README.md with setup instructions

## Additional Requirements
- No external dependencies except Three.js (load from CDN)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile touch support
- Smooth performance on mid-range devices
- Professional, clean code structure

Please create a complete, working implementation that fulfills all these requirements. The code should be production-ready and well-documented.