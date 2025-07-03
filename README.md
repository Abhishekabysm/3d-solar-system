# 3D Solar System Simulator

A beautiful, interactive 3D solar system simulation built with Three.js featuring realistic planetary orbits, textures, and immersive controls.

## Features

### 🌌 Realistic Solar System
- **Sun** with animated glow effect
- **8 Planets** with accurate relative sizes and distances
- **Earth's Moon** with realistic orbit
- **Animated Comet** with particle tail
- **Starfield** background for immersive space experience

### 🎮 Interactive Controls
- **Orbit Controls** - Mouse/touch to rotate, zoom, and explore
- **Planet Following** - Click any planet to follow and learn about it
- **Speed Controls** - Adjust orbital and master speed with sliders
- **Pause/Resume** - Stop time or watch planets move
- **Camera Views** - Quick buttons to jump to different planets

### 📱 Mobile Optimized
- **Touch Support** - Full touch controls for mobile devices
- **Responsive Design** - Works on all screen sizes
- **Collapsible Controls** - Clean interface that adapts to screen size
- **Tap to Follow** - Tap planets to follow, tap again to stop

### 🎨 Visual Features
- **Procedural Textures** - Realistic planet surfaces generated in real-time
- **Lighting System** - Dynamic shadows and realistic lighting
- **Smooth Animations** - Fluid orbital mechanics and camera movements
- **Screenshot Function** - Capture and download your favorite views

### 🔊 Audio Experience
- **Ambient Space Sounds** - Soothing background atmosphere
- **Sound Effects** - Whoosh sounds for interactions
- **Audio Controls** - Toggle sound on/off as needed

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd Empty\ Cup
   ```

2. **Serve the files:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   
   # Or using Node.js
   npx http-server
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000`

## Controls

### Desktop
- **Mouse Drag** - Rotate view
- **Mouse Wheel** - Zoom in/out
- **Click Planet** - Follow and get information
- **Click Outside** - Hide information panel

### Mobile
- **Touch Drag** - Rotate view
- **Pinch** - Zoom in/out
- **Tap Planet** - Follow and get information
- **Tap Anywhere** - Stop following / Close panels

### Keyboard Shortcuts
- **Space** - Pause/Resume
- **R** - Reset to overview
- **S** - Take screenshot
- **M** - Toggle sound

## File Structure

```
Empty Cup/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # Core Three.js application logic
├── Instructions.md     # Development notes
└── README.md          # This file
```

## Technical Details

### Built With
- **Three.js** - 3D graphics library
- **WebGL** - Hardware-accelerated 3D rendering
- **Web Audio API** - Spatial audio effects
- **Canvas API** - Procedural texture generation

### Key Components
- **Scene Management** - Efficient 3D scene organization
- **Orbital Mechanics** - Realistic planetary motion calculations
- **Texture Generation** - Procedural planet surface creation
- **Audio System** - Immersive spatial audio experience
- **Responsive Controls** - Cross-device interaction handling

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

*Requires WebGL support for 3D graphics*

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test across different devices
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Credits

Created with passion for space exploration and interactive web experiences.
