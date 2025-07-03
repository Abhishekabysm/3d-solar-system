// Global variables
let scene, camera, renderer, controls;
let sun, planets = [], moons = [];
let starField, asteroidBelt, comet;
let clock = new THREE.Clock();
let isPaused = false;
let animationId;
let masterSpeedMultiplier = 1;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedPlanet = null;
let followingPlanet = null;
let cameraTarget = new THREE.Vector3();
let originalCameraPosition = new THREE.Vector3(0, 50, 120);
let scaleMode = 'visible'; // 'visible' or 'realistic'
let isTouring = false;
let tourStep = 0;
let audioContext, ambientSound;

// Planet data with visually appealing speeds
const planetData = [
    { name: 'mercury', size: 0.4, color: 0x8c7853, distance: 8, speed: 4.15, rotationSpeed: 0.01, realSize: 0.38 },
    { name: 'venus', size: 0.9, color: 0xffc649, distance: 12, speed: 1.62, rotationSpeed: 0.008, realSize: 0.95 },
    { name: 'earth', size: 1, color: 0x6b93d6, distance: 16, speed: 1.0, rotationSpeed: 0.02, realSize: 1.0 },
    { name: 'mars', size: 0.5, color: 0xc1440e, distance: 22, speed: 0.53, rotationSpeed: 0.018, realSize: 0.53 },
    { name: 'jupiter', size: 3, color: 0xd8ca9d, distance: 35, speed: 0.35, rotationSpeed: 0.045, realSize: 11.2 },
    { name: 'saturn', size: 2.5, color: 0xfad5a5, distance: 50, speed: 0.25, rotationSpeed: 0.038, realSize: 9.45 },
    { name: 'uranus', size: 1.8, color: 0x4fd0e4, distance: 65, speed: 0.18, rotationSpeed: 0.03, realSize: 4.0 },
    { name: 'neptune', size: 1.7, color: 0x4b70dd, distance: 80, speed: 0.12, rotationSpeed: 0.032, realSize: 3.88 }
];

// Moon data
const moonData = {
    earth: [
        { name: 'luna', size: 0.27, color: 0xc0c0c0, distance: 2.5, speed: 13.4, parent: 'earth' }
    ]
    // jupiter: [
    //     { name: 'io', size: 0.29, color: 0xffff88, distance: 8, speed: 17.3, parent: 'jupiter' },
    //     { name: 'europa', size: 0.25, color: 0x88ccff, distance: 10, speed: 13.7, parent: 'jupiter' },
    //     { name: 'ganymede', size: 0.41, color: 0x888888, distance: 12, speed: 10.9, parent: 'jupiter' },
    //     { name: 'callisto', size: 0.38, color: 0x444444, distance: 14, speed: 8.2, parent: 'jupiter' }
    // ]
};

// Initialize the application
function init() {
    initScene();
    createSun();
    createPlanets();
    createMoons();
    // createAsteroidBelt(); // Removed - too many asteroids
    createComet();
    createStarField();
    setupLighting();
    setupControls();
    setupEventListeners();
    initAudio();
    animate();
    
    // Update sound status after everything is loaded
    setTimeout(updateSoundStatus, 100);
    
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
    }, 1500);
}

// Initialize Three.js scene
function initScene() {
    scene = new THREE.Scene();
    
    // Create a gradient background for better contrast
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for space background
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(0.5, '#000011');
    gradient.addColorStop(1, '#000000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;
    
    // Camera setup - better positioning
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 120);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('solar-system-canvas'),
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaFactor = 2.2;
    renderer.gammaOutput = true;
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 300;
    controls.enablePan = false;
}

// Create the sun
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    sun.castShadow = false;
    sun.receiveShadow = false;
    scene.add(sun);
    
    // Add sun glow effect
    const glowGeometry = new THREE.SphereGeometry(6, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.1
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunGlow.position.set(0, 0, 0);
    scene.add(sunGlow);
}

// Create all planets
function createPlanets() {
    planetData.forEach((data, index) => {
        const planet = createPlanet(data);
        planet.userData = {
            ...data,
            angle: Math.random() * Math.PI * 2,
            originalSpeed: data.speed,
            speedMultiplier: 1
        };
        planets.push(planet);
        scene.add(planet);
        
        // Add orbital path
        createOrbitPath(data.distance);
        
        // Special handling for Saturn's rings
        if (data.name === 'saturn') {
            createSaturnRings(planet);
        }
    });
}

// Create all moons
function createMoons() {
    Object.keys(moonData).forEach(planetName => {
        const planetIndex = planetData.findIndex(p => p.name === planetName);
        if (planetIndex !== -1) {
            const planet = planets[planetIndex];
            
            moonData[planetName].forEach(moonInfo => {
                const moon = createMoon(moonInfo);
                moon.userData = {
                    ...moonInfo,
                    angle: Math.random() * Math.PI * 2,
                    parentPlanet: planet,
                    planetIndex: planetIndex
                };
                moons.push(moon);
                scene.add(moon);
            });
        }
    });
}

// Create a single moon
function createMoon(moonInfo) {
    const geometry = new THREE.SphereGeometry(moonInfo.size, 32, 32);
    const material = createMoonMaterial(moonInfo);
    const moon = new THREE.Mesh(geometry, material);
    
    moon.castShadow = true;
    moon.receiveShadow = true;
    moon.name = moonInfo.name;
    
    return moon;
}

// Create moon materials
function createMoonMaterial(moonInfo) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    switch(moonInfo.name) {
        case 'luna':
            createLunaTexture(ctx, canvas);
            break;
        case 'io':
            createIoTexture(ctx, canvas);
            break;
        case 'europa':
            createEuropaTexture(ctx, canvas);
            break;
        case 'ganymede':
            createGanymedeTexture(ctx, canvas);
            break;
        case 'callisto':
            createCallistoTexture(ctx, canvas);
            break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10,
        specular: 0x111111
    });
}

// Create asteroid belt
function createAsteroidBelt() {
    const asteroidCount = 2000;
    const asteroidGeometry = new THREE.BufferGeometry();
    const asteroidPositions = new Float32Array(asteroidCount * 3);
    const asteroidColors = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + Math.random() * 8; // Between Mars and Jupiter
        const height = (Math.random() - 0.5) * 2;
        
        asteroidPositions[i * 3] = Math.cos(angle) * distance;
        asteroidPositions[i * 3 + 1] = height;
        asteroidPositions[i * 3 + 2] = Math.sin(angle) * distance;
        
        // Brown/gray colors
        const grayness = 0.3 + Math.random() * 0.3;
        asteroidColors[i * 3] = grayness;
        asteroidColors[i * 3 + 1] = grayness * 0.8;
        asteroidColors[i * 3 + 2] = grayness * 0.6;
    }
    
    asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
    asteroidGeometry.setAttribute('color', new THREE.BufferAttribute(asteroidColors, 3));
    
    const asteroidMaterial = new THREE.PointsMaterial({
        size: 0.8,
        transparent: true,
        opacity: 0.8,
        vertexColors: true
    });
    
    asteroidBelt = new THREE.Points(asteroidGeometry, asteroidMaterial);
    scene.add(asteroidBelt);
}

// Create comet
function createComet() {
    // Comet nucleus
    const cometGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cometMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x444444,
        emissiveIntensity: 0.1
    });
    
    comet = new THREE.Mesh(cometGeometry, cometMaterial);
    comet.userData = {
        angle: 0,
        distance: 120,
        speed: 0.5,
        orbitTilt: 0.3
    };
    
    // Comet tail (particle system)
    const tailGeometry = new THREE.BufferGeometry();
    const tailCount = 100;
    const tailPositions = new Float32Array(tailCount * 3);
    const tailColors = new Float32Array(tailCount * 3);
    
    for (let i = 0; i < tailCount; i++) {
        tailPositions[i * 3] = 0;
        tailPositions[i * 3 + 1] = 0;
        tailPositions[i * 3 + 2] = 0;
        
        const intensity = 1 - (i / tailCount);
        tailColors[i * 3] = 0.8 * intensity; // Red
        tailColors[i * 3 + 1] = 0.9 * intensity; // Green
        tailColors[i * 3 + 2] = 1.0 * intensity; // Blue
    }
    
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));
    
    const tailMaterial = new THREE.PointsMaterial({
        size: 2,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    const cometTail = new THREE.Points(tailGeometry, tailMaterial);
    comet.add(cometTail);
    comet.tail = cometTail;
    
    scene.add(comet);
}

// Create a single planet
function createPlanet(data) {
    const geometry = new THREE.SphereGeometry(data.size, 64, 64);
    
    // Create realistic planet materials with procedural textures
    const material = createPlanetMaterial(data);
    const planet = new THREE.Mesh(geometry, material);
    
    planet.position.set(data.distance, 0, 0);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.name = data.name;
    
    return planet;
}

// Planet texture creation functions
function createMercuryTexture(ctx, canvas) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#8C7853');
    gradient.addColorStop(0.3, '#A0956B');
    gradient.addColorStop(0.7, '#6B5D3F');
    gradient.addColorStop(1, '#8C7853');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add craters
    for(let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 8 + 2;
        ctx.fillStyle = '#5A4F35';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createVenusTexture(ctx, canvas) {
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, '#FFC649');
    gradient.addColorStop(0.5, '#E6B143');
    gradient.addColorStop(1, '#CC9A3D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add atmospheric swirls
    for(let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.lineWidth = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 50 + 20, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function createEarthTexture(ctx, canvas) {
    // Create continents and oceans
    ctx.fillStyle = '#1E40AF'; // Ocean blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add continents (simplified)
    const continents = [
        {x: 0.1, y: 0.3, w: 0.2, h: 0.4}, // Americas
        {x: 0.4, y: 0.2, w: 0.3, h: 0.5}, // Europe/Africa
        {x: 0.7, y: 0.25, w: 0.25, h: 0.4} // Asia
    ];
    
    ctx.fillStyle = '#22C55E'; // Land green
    continents.forEach(cont => {
        ctx.fillRect(cont.x * canvas.width, cont.y * canvas.height, cont.w * canvas.width, cont.h * canvas.height);
    });
    
    // Add clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for(let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = Math.random() * 30 + 10;
        const h = Math.random() * 15 + 5;
        ctx.fillRect(x, y, w, h);
    }
    
    // Add city lights on night side (will be controlled by shader)
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    for(let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function createMarsTexture(ctx, canvas) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#CD5C5C');
    gradient.addColorStop(0.5, '#A0522D');
    gradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add polar ice caps
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.1);
    ctx.fillRect(0, canvas.height * 0.9, canvas.width, canvas.height * 0.1);
    
    // Add dust storms
    for(let i = 0; i < 15; i++) {
        ctx.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.5})`;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, Math.random() * 50 + 20, Math.random() * 20 + 5);
    }
}

function createJupiterTexture(ctx, canvas) {
    // Create bands
    const bands = ['#D2B48C', '#CD853F', '#A0522D', '#8B4513', '#D2B48C'];
    const bandHeight = canvas.height / bands.length;
    
    bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * bandHeight, canvas.width, bandHeight);
    });
    
    // Add Great Red Spot
    ctx.fillStyle = '#B22222';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.7, canvas.height * 0.6, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add swirls and storms
    for(let i = 0; i < 25; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 15 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function createSaturnTexture(ctx, canvas) {
    // Similar to Jupiter but paler
    const bands = ['#FAD5A5', '#DEB887', '#D2B48C', '#BC9A6A', '#FAD5A5'];
    const bandHeight = canvas.height / bands.length;
    
    bands.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * bandHeight, canvas.width, bandHeight);
    });
    
    // Add subtle storms
    for(let i = 0; i < 15; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 10 + 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function createUranusTexture(ctx, canvas) {
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#4FD0E4');
    gradient.addColorStop(1, '#4682B4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add methane bands
    for(let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(70, 130, 180, ${Math.random() * 0.3})`;
        ctx.fillRect(0, i * (canvas.height/8), canvas.width, canvas.height/16);
    }
}

function createNeptuneTexture(ctx, canvas) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4B70DD');
    gradient.addColorStop(0.5, '#1E3A8A');
    gradient.addColorStop(1, '#1E40AF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add Great Dark Spot
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.3, canvas.height * 0.4, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add wind patterns
    for(let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
}

// Moon texture creation functions
function createLunaTexture(ctx, canvas) {
    // Gray gradient for lunar surface
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, '#E0E0E0');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add craters
    for(let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 3;
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createIoTexture(ctx, canvas) {
    // Yellow sulfur surface
    ctx.fillStyle = '#FFFF88';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add volcanic spots
    for(let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 8 + 2;
        ctx.fillStyle = Math.random() > 0.5 ? '#FF4444' : '#FFAA00';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createEuropaTexture(ctx, canvas) {
    // Icy blue-white surface
    ctx.fillStyle = '#88CCFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add ice cracks
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for(let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
}

function createGanymedeTexture(ctx, canvas) {
    // Dark gray with lighter patches
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add lighter regions
    for(let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = Math.random() * 40 + 20;
        const h = Math.random() * 20 + 10;
        ctx.fillStyle = '#AAAAAA';
        ctx.fillRect(x, y, w, h);
    }
}

function createCallistoTexture(ctx, canvas) {
    // Very dark surface with craters
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add impact craters
    for(let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 10 + 2;
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create realistic planet materials
function createPlanetMaterial(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create procedural planet textures
    switch(data.name) {
        case 'mercury':
            createMercuryTexture(ctx, canvas);
            break;
        case 'venus':
            createVenusTexture(ctx, canvas);
            break;
        case 'earth':
            createEarthTexture(ctx, canvas);
            break;
        case 'mars':
            createMarsTexture(ctx, canvas);
            break;
        case 'jupiter':
            createJupiterTexture(ctx, canvas);
            break;
        case 'saturn':
            createSaturnTexture(ctx, canvas);
            break;
        case 'uranus':
            createUranusTexture(ctx, canvas);
            break;
        case 'neptune':
            createNeptuneTexture(ctx, canvas);
            break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return new THREE.MeshPhongMaterial({
        map: texture,
        shininess: data.name === 'earth' ? 100 : 30,
        specular: data.name === 'earth' ? 0x222222 : 0x111111,
        emissive: data.color,
        emissiveIntensity: 0.02
    });
}

// Create Saturn's rings
function createSaturnRings(saturn) {
    const ringGeometry = new THREE.RingGeometry(3, 5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    saturn.add(rings);
}

// Create orbital paths
function createOrbitPath(distance) {
    const points = [];
    const segments = 64;
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(theta) * distance,
            0,
            Math.sin(theta) * distance
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.8
    });
    const orbit = new THREE.Line(geometry, material);
    scene.add(orbit);
}

// Create starfield background
function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        // Position stars randomly in space
        starPositions[i * 3] = (Math.random() - 0.5) * 2000;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
        
        // Add some color variation to stars
        const colorVariation = Math.random();
        starColors[i * 3] = 0.5 + colorVariation * 0.5;     // Red
        starColors[i * 3 + 1] = 0.5 + colorVariation * 0.5; // Green
        starColors[i * 3 + 2] = 0.7 + colorVariation * 0.3; // Blue
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        transparent: true,
        opacity: 0.9,
        vertexColors: true
    });
    
    starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// Setup lighting
function setupLighting() {
    // Ambient light - increased intensity
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Point light from sun - increased intensity
    const sunLight = new THREE.PointLight(0xffffff, 2, 300);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    
    // Add directional light for better planet visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
}

// Setup camera controls
function setupControls() {
    controls.update();
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', handleResize);
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', togglePause);
    
    // Collapse button
    const collapseBtn = document.getElementById('collapse-btn');
    const controlsPanel = document.getElementById('controls-panel');
    
    if (collapseBtn && controlsPanel) {
        // Set initial button text based on panel state
        const isCollapsed = controlsPanel.classList.contains('collapsed');
        collapseBtn.textContent = isCollapsed ? '+' : '−';
        
        collapseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Collapse button clicked!'); // Debug
            
            controlsPanel.classList.toggle('collapsed');
            
            const isCollapsed = controlsPanel.classList.contains('collapsed');
            collapseBtn.textContent = isCollapsed ? '+' : '−';
            
            console.log('Panel collapsed:', isCollapsed); // Debug
            
            // Force a reflow to ensure CSS changes are applied
            controlsPanel.offsetHeight;
        });
    } else {
        console.error('Collapse button or controls panel not found');
    }
    
    // Master speed control
    const masterSlider = document.getElementById('master-speed');
    const masterSpeedValue = masterSlider.nextElementSibling;
    masterSlider.addEventListener('input', (e) => {
        masterSpeedMultiplier = parseFloat(e.target.value);
        masterSpeedValue.textContent = `${masterSpeedMultiplier}x`;
    });
    
    // Speed sliders
    planetData.forEach((data, index) => {
        const slider = document.getElementById(`${data.name}-speed`);
        const speedValue = slider.nextElementSibling;
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            planets[index].userData.speedMultiplier = value;
            speedValue.textContent = `${value}x`;
        });
    });
    
    // Mouse/touch events for planet selection
    const canvas = document.getElementById('solar-system-canvas');
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
    
    // Add click outside to close panel (all screen sizes)
    function closePanel() {
        const controlsPanel = document.getElementById('controls-panel');
        if (controlsPanel && !controlsPanel.classList.contains('collapsed')) {
            controlsPanel.classList.add('collapsed');
            const collapseBtn = document.getElementById('collapse-btn');
            if (collapseBtn) {
                collapseBtn.textContent = '+';
            }
        }
    }
    
    function handleOutsideClick(e) {
        const controlsPanel = document.getElementById('controls-panel');
        const isClickInsidePanel = controlsPanel.contains(e.target);
        
        // Close panel if clicked outside panel and panel is not collapsed
        if (!isClickInsidePanel && !controlsPanel.classList.contains('collapsed')) {
            setTimeout(closePanel, 10); // Small delay to ensure other events are processed first
        }
    }
    
    // Add both click and touch events for cross-device compatibility
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchend', handleOutsideClick);
    
    // Hide planet info when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.planet-info') && !e.target.closest('#solar-system-canvas')) {
            hidePlanetInfo();
        }
    });
    
    // Camera control buttons
    const cameraButtons = document.querySelectorAll('.camera-btn');
    cameraButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            setCameraView(view);
            
            // Update active button
            cameraButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Stop following button
    const stopFollowBtn = document.getElementById('stop-follow-btn');
    stopFollowBtn.addEventListener('click', () => {
        stopFollowing();
        stopFollowBtn.style.display = 'none';
        cameraButtons.forEach(b => b.classList.remove('active'));
        hidePlanetInfo();
    });
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('change', (e) => {
        console.log('Sound toggle changed to:', e.target.checked);
        
        if (e.target.checked) {
            // Initialize audio if not already done
            if (!audioContext) {
                initAudio();
            }
            
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed from toggle');
                    handleSoundToggle(e.target.checked);
                });
            } else {
                handleSoundToggle(e.target.checked);
            }
        } else {
            handleSoundToggle(e.target.checked);
        }
    });
    
    function handleSoundToggle(isEnabled) {
        if (ambientSound && ambientSound.gainNode) {
            try {
                const volume = isEnabled ? 0.15 : 0; // Match new volume level
                ambientSound.gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                console.log('Ambient sound volume set to:', volume);
                updateSoundStatus();
            } catch (error) {
                console.log('Error adjusting sound volume:', error);
                // If error, recreate ambient sound
                if (isEnabled) {
                    createAmbientSound();
                }
            }
        } else if (isEnabled && audioContext) {
            console.log('Creating new ambient sound because toggle enabled and no existing sound');
            createAmbientSound();
        } else {
            console.log('No ambient sound to control, current state:', {
                hasAmbientSound: !!ambientSound,
                hasAudioContext: !!audioContext,
                isEnabled: isEnabled
            });
            updateSoundStatus();
        }
    }
    
    // Test sound button
    const testSoundBtn = document.getElementById('test-sound-btn');
    testSoundBtn.addEventListener('click', () => {
        console.log('Test sound button clicked');
        console.log('Current audio context state:', audioContext ? audioContext.state : 'no context');
        console.log('Current ambient sound exists:', !!ambientSound);
        
        // Force audio context resume
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Audio context resumed via test button');
                playWhooshSound();
                
                // Force create ambient sound
                setTimeout(() => {
                    console.log('Creating ambient sound after test...');
                    createAmbientSound();
                }, 100);
            });
        } else if (audioContext) {
            playWhooshSound();
            
            // Force create ambient sound if it doesn't exist
            if (!ambientSound) {
                console.log('No ambient sound found, creating...');
                setTimeout(() => {
                    createAmbientSound();
                }, 100);
            } else {
                console.log('Ambient sound already exists');
            }
        } else {
            console.log('No audio context available');
        }
        
        // Update sound status
        setTimeout(updateSoundStatus, 200);
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePause();
                playWhooshSound();
                break;
            case 'Escape':
                e.preventDefault();
                if (followingPlanet !== null) {
                    stopFollowing();
                    stopFollowBtn.style.display = 'none';
                    cameraButtons.forEach(b => b.classList.remove('active'));
                    hidePlanetInfo();
                }
                break;
            case 'Digit1':
                setCameraView('earth');
                playWhooshSound();
                break;
            case 'Digit2':
                setCameraView('jupiter');
                playWhooshSound();
                break;
            case 'Digit3':
                setCameraView('saturn');
                playWhooshSound();
                break;
            case 'Digit0':
                setCameraView('overview');
                playWhooshSound();
                break;
            case 'KeyS':
                e.preventDefault();
                takeScreenshot();
                break;
            case 'KeyT':
                e.preventDefault();
                if (isTouring) {
                    stopGuidedTour();
                } else {
                    startGuidedTour();
                }
                break;
            case 'KeyR':
                e.preventDefault();
                toggleScale();
                break;
        }
    });
}

// Handle window resize
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    
    if (isPaused) {
        pauseBtn.textContent = 'Resume';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = 'Pause';
        pauseBtn.classList.remove('paused');
    }
}

// Update planet positions and rotations
function updatePlanets(deltaTime) {
    planets.forEach((planet, index) => {
        const data = planet.userData;
        
        if (!isPaused) {
            // Update orbital position with master speed multiplier
            data.angle += data.originalSpeed * data.speedMultiplier * masterSpeedMultiplier * deltaTime * 0.5;
            planet.position.x = Math.cos(data.angle) * data.distance;
            planet.position.z = Math.sin(data.angle) * data.distance;
            
            // Update rotation
            planet.rotation.y += data.rotationSpeed * deltaTime * 50;
        }
    });
}

// Update sun rotation
function updateSun(deltaTime) {
    if (!isPaused && sun) {
        sun.rotation.y += 0.005 * deltaTime * 10;
    }
}

// Update moon positions and rotations
function updateMoons(deltaTime) {
    moons.forEach((moon, index) => {
        const data = moon.userData;
        const parentPlanet = data.parentPlanet;
        
        if (!isPaused && parentPlanet) {
            // Update orbital position around parent planet
            data.angle += data.speed * masterSpeedMultiplier * deltaTime * 0.1;
            
            const offsetX = Math.cos(data.angle) * data.distance;
            const offsetZ = Math.sin(data.angle) * data.distance;
            
            moon.position.x = parentPlanet.position.x + offsetX;
            moon.position.z = parentPlanet.position.z + offsetZ;
            moon.position.y = parentPlanet.position.y + Math.sin(data.angle) * 0.5;
            
            // Update rotation
            moon.rotation.y += 0.01 * deltaTime * 10;
        }
    });
}

// Update comet
function updateComet(deltaTime) {
    if (!isPaused && comet) {
        const data = comet.userData;
        
        // Update comet orbit (elliptical)
        data.angle += data.speed * masterSpeedMultiplier * deltaTime * 0.02;
        
        const ellipticalDistance = data.distance * (1 + 0.8 * Math.cos(data.angle));
        comet.position.x = Math.cos(data.angle) * ellipticalDistance;
        comet.position.z = Math.sin(data.angle) * ellipticalDistance;
        comet.position.y = Math.sin(data.angle * 0.5) * data.orbitTilt * ellipticalDistance;
        
        // Update tail to point away from sun
        if (comet.tail) {
            const tailPositions = comet.tail.geometry.attributes.position.array;
            const sunDirection = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), comet.position).normalize();
            
            for (let i = 0; i < tailPositions.length / 3; i++) {
                const t = i / (tailPositions.length / 3);
                const tailLength = 15 * (1 / (ellipticalDistance / 50)); // Tail gets longer closer to sun
                
                tailPositions[i * 3] = sunDirection.x * tailLength * t + (Math.random() - 0.5) * t;
                tailPositions[i * 3 + 1] = sunDirection.y * tailLength * t + (Math.random() - 0.5) * t;
                tailPositions[i * 3 + 2] = sunDirection.z * tailLength * t + (Math.random() - 0.5) * t;
            }
            
            comet.tail.geometry.attributes.position.needsUpdate = true;
        }
        
        comet.rotation.y += 0.02 * deltaTime * 10;
    }
}

// Update asteroid belt rotation
function updateAsteroidBelt(deltaTime) {
    if (!isPaused && asteroidBelt) {
        asteroidBelt.rotation.y += 0.001 * deltaTime * masterSpeedMultiplier;
    }
}

// Update starfield rotation
function updateStarField(deltaTime) {
    if (!isPaused && starField) {
        starField.rotation.y += 0.0002 * deltaTime;
    }
}

// Main animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update objects
    updateSun(deltaTime);
    updatePlanets(deltaTime);
    updateMoons(deltaTime);
    updateComet(deltaTime);
    updateAsteroidBelt(deltaTime);
    updateStarField(deltaTime);
    
    // Update camera following
    updateCameraFollow();
    
    // Update controls
    controls.update();
    
    // Render
    renderer.render(scene, camera);
}

// Audio system
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created, state:', audioContext.state);
        
        // Add click listener to resume audio context (required by browsers)
        const resumeAudio = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Audio context resumed');
                    createAmbientSound();
                });
            } else if (audioContext.state === 'running' && !ambientSound) {
                createAmbientSound();
            }
        };
        
        // Resume audio on any user interaction
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        
        // Try to create ambient sound immediately (might work on some browsers)
        if (audioContext.state === 'running') {
            createAmbientSound();
        }
    } catch (e) {
        console.log('Audio not supported:', e);
    }
}

function createAmbientSound() {
    if (!audioContext) {
        console.log('No audio context available');
        return;
    }
    
    if (audioContext.state === 'suspended') {
        console.log('Audio context suspended, attempting to resume...');
        audioContext.resume().then(() => {
            console.log('Audio context resumed, trying to create ambient sound again');
            createAmbientSound();
        });
        return;
    }
    
    if (audioContext.state !== 'running') {
        console.log('Audio context not running, state:', audioContext.state);
        return;
    }
    
    try {
        // Stop existing ambient sound
        if (ambientSound) {
            try {
                if (ambientSound.oscillator) {
                    ambientSound.oscillator.stop();
                }
                if (ambientSound.oscillator2) {
                    ambientSound.oscillator2.stop();
                }
                if (ambientSound.lfoOscillator) {
                    ambientSound.lfoOscillator.stop();
                }
                console.log('Stopped previous ambient sound');
            } catch (e) {
                console.log('Error stopping previous ambient sound:', e);
            }
        }
        
        // Create soothing ambient space sound
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const lfoOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const gainNode2 = audioContext.createGain();
        const lfoGain = audioContext.createGain();
        const masterGain = audioContext.createGain();
        
        // Deep calming drone - very low frequency
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(60, audioContext.currentTime); // Deep, calming frequency
        
        // Gentle harmonic layer
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(120, audioContext.currentTime); // Perfect fifth harmony
        
        // Add gentle frequency modulation for breathing effect
        lfoOscillator.type = 'sine';
        lfoOscillator.frequency.setValueAtTime(0.1, audioContext.currentTime); // Very slow modulation
        lfoGain.gain.setValueAtTime(3, audioContext.currentTime); // Subtle frequency variation
        
        // Set volumes for soothing effect
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime); // Gentle main drone
        gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime); // Soft harmonic layer
        
        // Check if sound toggle is enabled
        const soundToggle = document.getElementById('sound-toggle');
        const masterVolume = soundToggle && soundToggle.checked ? 0.15 : 0; // Increased overall volume
        masterGain.gain.setValueAtTime(masterVolume, audioContext.currentTime);
        
        // Connect the audio graph with gentle modulation
        lfoOscillator.connect(lfoGain);
        lfoGain.connect(oscillator1.frequency); // Gentle breathing effect on main drone
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode2);
        gainNode.connect(masterGain);
        gainNode2.connect(masterGain);
        masterGain.connect(audioContext.destination);
        
        oscillator1.start();
        oscillator2.start();
        lfoOscillator.start();
        
        ambientSound = { 
            oscillator: oscillator1, 
            oscillator2: oscillator2,
            lfoOscillator: lfoOscillator,
            gainNode: masterGain 
        };
        
        console.log('Ambient sound created and playing at volume:', masterVolume);
        console.log('Audio context state:', audioContext.state);
        console.log('Sound toggle checked:', soundToggle ? soundToggle.checked : 'toggle not found');
        console.log('Oscillator 1 type:', oscillator1.type, 'Frequency:', oscillator1.frequency.value);
        console.log('Oscillator 2 type:', oscillator2.type, 'Frequency:', oscillator2.frequency.value);
        
        updateSoundStatus();
        
        // Add error handlers for oscillators
        oscillator1.onended = () => {
            console.log('Ambient sound oscillator 1 ended unexpectedly');
        };
        oscillator2.onended = () => {
            console.log('Ambient sound oscillator 2 ended unexpectedly');
        };
        lfoOscillator.onended = () => {
            console.log('Ambient sound LFO ended unexpectedly');
        };
        
    } catch (e) {
        console.log('Error creating ambient sound:', e);
        updateSoundStatus();
    }
}

function playWhooshSound() {
    if (!audioContext || audioContext.state !== 'running') {
        console.log('Audio context not ready for whoosh');
        return;
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Use sawtooth for whoosh effect (white noise not supported)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('Whoosh sound played');
    } catch (e) {
        console.log('Error playing whoosh sound:', e);
    }
}

// Scale toggle system
function toggleScale() {
    scaleMode = scaleMode === 'visible' ? 'realistic' : 'visible';
    updatePlanetScales();
    
    const scaleBtn = document.getElementById('scale-toggle-btn');
    if (scaleBtn) {
        scaleBtn.textContent = scaleMode === 'visible' ? 'Realistic Scale' : 'Visible Scale';
    }
}

function updatePlanetScales() {
    planets.forEach((planet, index) => {
        const data = planetData[index];
        const newSize = scaleMode === 'realistic' ? data.realSize : data.size;
        
        // Animate scale change
        const startScale = planet.scale.x;
        const endScale = newSize / data.size;
        const duration = 1000;
        const startTime = Date.now();
        
        function animateScale() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentScale = startScale + (endScale - startScale) * progress;
            
            planet.scale.set(currentScale, currentScale, currentScale);
            
            if (progress < 1) {
                requestAnimationFrame(animateScale);
            }
        }
        
        animateScale();
    });
}

// Guided tour system
function startGuidedTour() {
    isTouring = true;
    tourStep = 0;
    tourNextStep();
    
    const tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
        tourBtn.textContent = 'Stop Tour';
        tourBtn.onclick = stopGuidedTour;
    }
}

function stopGuidedTour() {
    isTouring = false;
    tourStep = 0;
    stopFollowing();
    
    const tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
        tourBtn.textContent = 'Start Tour';
        tourBtn.onclick = startGuidedTour;
    }
}

function tourNextStep() {
    if (!isTouring) return;
    
    const tourSteps = [
        { planet: 'mercury', duration: 5000, info: 'Mercury - Closest to the Sun' },
        { planet: 'venus', duration: 5000, info: 'Venus - Hottest planet' },
        { planet: 'earth', duration: 6000, info: 'Earth - Our home planet' },
        { planet: 'mars', duration: 5000, info: 'Mars - The Red Planet' },
        { planet: 'jupiter', duration: 6000, info: 'Jupiter - Gas giant with Great Red Spot' },
        { planet: 'saturn', duration: 6000, info: 'Saturn - Beautiful ring system' },
        { planet: 'uranus', duration: 5000, info: 'Uranus - Tilted ice giant' },
        { planet: 'neptune', duration: 5000, info: 'Neptune - Windiest planet' }
    ];
    
    if (tourStep < tourSteps.length) {
        const step = tourSteps[tourStep];
        setCameraView(step.planet);
        
        // Show tour info
        showTourInfo(step.info);
        
        setTimeout(() => {
            tourStep++;
            tourNextStep();
        }, step.duration);
    } else {
        stopGuidedTour();
        setCameraView('overview');
    }
}

function showTourInfo(info) {
    // Create or update tour info overlay
    let tourInfo = document.getElementById('tour-info');
    if (!tourInfo) {
        tourInfo = document.createElement('div');
        tourInfo.id = 'tour-info';
        tourInfo.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 24px;
            text-align: center;
            z-index: 2000;
            pointer-events: none;
        `;
        document.body.appendChild(tourInfo);
    }
    
    tourInfo.textContent = info;
    tourInfo.style.opacity = '1';
    
    setTimeout(() => {
        tourInfo.style.opacity = '0';
    }, 3000);
}

// Screenshot function
function takeScreenshot() {
    // Force a render to ensure the latest frame is captured
    renderer.render(scene, camera);
    
    const canvas = renderer.domElement;
    const link = document.createElement('a');
    link.download = 'solar-system-' + new Date().getTime() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('Screenshot captured and downloaded');
}

// Update sound status indicator
function updateSoundStatus() {
    const soundStatus = document.getElementById('sound-status');
    const soundToggle = document.getElementById('sound-toggle');
    
    if (!audioContext) {
        soundStatus.textContent = '❌ Audio Not Supported';
        return;
    }
    
    const isEnabled = soundToggle.checked;
    const contextState = audioContext.state;
    
    if (contextState === 'suspended') {
        soundStatus.textContent = '⏸️ Audio Suspended (Click to enable)';
    } else if (contextState === 'running' && isEnabled && ambientSound) {
        soundStatus.textContent = '🔊 Ambient Sound Playing';
    } else if (contextState === 'running' && isEnabled) {
        soundStatus.textContent = '🔊 Audio Ready';
    } else if (!isEnabled) {
        soundStatus.textContent = '🔇 Audio Muted';
    } else {
        soundStatus.textContent = '⚠️ Audio Loading...';
    }
}

// Start the application when page loads
document.addEventListener('DOMContentLoaded', init);

// Planet interaction functions
function onCanvasClick(event) {
    updateMousePosition(event);
    checkPlanetIntersection();
    
    // Close controls panel when clicking on canvas
    const controlsPanel = document.getElementById('controls-panel');
    if (controlsPanel && !controlsPanel.classList.contains('collapsed')) {
        controlsPanel.classList.add('collapsed');
        const collapseBtn = document.getElementById('collapse-btn');
        if (collapseBtn) {
            collapseBtn.textContent = '+';
        }
    }
}

function onCanvasMouseMove(event) {
    updateMousePosition(event);
}

function onCanvasTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        updateMousePosition(touch);
        checkPlanetIntersection();
    }
}

function onCanvasTouchMove(event) {
    event.preventDefault();
}

function onCanvasTouchEnd(event) {
    event.preventDefault();
    
    // Close controls panel when touching canvas (mobile)
    const controlsPanel = document.getElementById('controls-panel');
    if (controlsPanel && !controlsPanel.classList.contains('collapsed')) {
        controlsPanel.classList.add('collapsed');
        const collapseBtn = document.getElementById('collapse-btn');
        if (collapseBtn) {
            collapseBtn.textContent = '+';
        }
    }
}

function updateMousePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function checkPlanetIntersection() {
    raycaster.setFromCamera(mouse, camera);
    
    // If following a planet, allow tap to stop following (mobile friendly)
    if (followingPlanet !== null) {
        stopFollowing();
        return;
    }
    
    // Check sun first
    const sunIntersects = raycaster.intersectObjects([sun]);
    if (sunIntersects.length > 0) {
        showSunInfo();
        return;
    }
    
    // Check planets
    const intersects = raycaster.intersectObjects(planets);
    if (intersects.length > 0) {
        const intersectedPlanet = intersects[0].object;
        const planetIndex = planets.indexOf(intersectedPlanet);
        if (planetIndex !== -1) {
            showPlanetInfo(planetIndex);
        }
    } else {
        // Clicked on empty space - hide planet info
        hidePlanetInfo();
    }
}

function showSunInfo() {
    const planetInfo = document.getElementById('planet-info');
    const planetName = document.getElementById('planet-name');
    const planetDistance = document.getElementById('planet-distance');
    const planetSize = document.getElementById('planet-size');
    const planetSpeed = document.getElementById('planet-speed');
    const planetMoons = document.getElementById('planet-moons');
    const planetDay = document.getElementById('planet-day');
    const planetYear = document.getElementById('planet-year');
    const planetDesc = document.getElementById('planet-desc');
    
    planetName.textContent = 'Sun';
    planetDistance.textContent = 'Distance: 0 AU (Center of Solar System)';
    planetSize.textContent = 'Diameter: 1,391,400 km';
    planetSpeed.textContent = 'Speed: 0 km/s (Stationary)';
    planetMoons.textContent = 'Planets: 8';
    planetDay.textContent = 'Rotation: 25 days';
    planetYear.textContent = 'Age: 4.6 billion years';
    planetDesc.textContent = 'The Sun is a yellow dwarf star that contains 99.86% of the Solar System\'s mass. It generates energy through nuclear fusion, converting hydrogen into helium.';
    
    planetInfo.classList.add('visible');
    selectedPlanet = -1; // Special index for sun
    
    // Set camera to sun view
    setCameraView('sun');
}

function showPlanetInfo(planetIndex) {
    const planetInfo = document.getElementById('planet-info');
    const planetName = document.getElementById('planet-name');
    const planetDistance = document.getElementById('planet-distance');
    const planetSize = document.getElementById('planet-size');
    const planetSpeed = document.getElementById('planet-speed');
    const planetMoons = document.getElementById('planet-moons');
    const planetDay = document.getElementById('planet-day');
    const planetYear = document.getElementById('planet-year');
    const planetDesc = document.getElementById('planet-desc');
    
    const data = planetData[planetIndex];
    const planet = planets[planetIndex];
    
    // Enhanced planet information
    const planetDetails = {
        mercury: { 
            realDistance: '0.39', realSize: '4,879', realSpeed: '47.87', 
            moons: '0', dayLength: '1,408', yearLength: '88',
            description: 'Closest planet to the Sun with extreme temperature variations. No atmosphere to retain heat.'
        },
        venus: { 
            realDistance: '0.72', realSize: '12,104', realSpeed: '35.02',
            moons: '0', dayLength: '5,832', yearLength: '225',
            description: 'Hottest planet due to runaway greenhouse effect. Thick toxic atmosphere of carbon dioxide.'
        },
        earth: { 
            realDistance: '1.00', realSize: '12,756', realSpeed: '29.78',
            moons: '1', dayLength: '24', yearLength: '365',
            description: 'Our home planet! Only known planet with life. Perfect distance from Sun for liquid water.'
        },
        mars: { 
            realDistance: '1.52', realSize: '6,792', realSpeed: '24.07',
            moons: '2', dayLength: '24.6', yearLength: '687',
            description: 'The Red Planet. Has polar ice caps and evidence of ancient water flows. Target for future human missions.'
        },
        jupiter: { 
            realDistance: '5.20', realSize: '142,984', realSpeed: '13.07',
            moons: '95', dayLength: '9.9', yearLength: '4,333',
            description: 'Largest planet in our solar system. Gas giant with Great Red Spot storm and many moons.'
        },
        saturn: { 
            realDistance: '9.58', realSize: '120,536', realSpeed: '9.68',
            moons: '146', dayLength: '10.7', yearLength: '10,759',
            description: 'Famous for its beautiful ring system made of ice and rock particles. Less dense than water!'
        },
        uranus: { 
            realDistance: '19.20', realSize: '51,118', realSpeed: '6.80',
            moons: '28', dayLength: '17.2', yearLength: '30,687',
            description: 'Ice giant tilted on its side. Rotates like a rolling ball due to ancient collision.'
        },
        neptune: { 
            realDistance: '30.05', realSize: '49,528', realSpeed: '5.43',
            moons: '16', dayLength: '16.1', yearLength: '60,190',
            description: 'Windiest planet with speeds up to 2,100 km/h. Deep blue color from methane in atmosphere.'
        }
    };
    
    const details = planetDetails[data.name];
    
    planetName.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    planetDistance.textContent = `Distance: ${details.realDistance} AU`;
    planetSize.textContent = `Diameter: ${details.realSize} km`;
    planetSpeed.textContent = `Speed: ${details.realSpeed} km/s`;
    planetMoons.textContent = `Moons: ${details.moons}`;
    planetDay.textContent = `Day: ${details.dayLength} hours`;
    planetYear.textContent = `Year: ${details.yearLength} days`;
    planetDesc.textContent = details.description;
    
    planetInfo.classList.add('visible');
    selectedPlanet = planetIndex;
    
    // Start following the planet
    followPlanet(planetIndex);
}

// Camera view system
function setCameraView(view) {
    const stopFollowBtn = document.getElementById('stop-follow-btn');
    
    if (view === 'overview') {
        stopFollowing();
        stopFollowBtn.style.display = 'none';
        hidePlanetInfo();
    } else if (view === 'sun') {
        followSun();
        stopFollowBtn.style.display = 'block';
    } else {
        const planetIndex = planetData.findIndex(p => p.name === view);
        if (planetIndex !== -1) {
            followPlanet(planetIndex);
            showPlanetInfo(planetIndex);
            stopFollowBtn.style.display = 'block';
        }
    }
}

// Camera follow system
function followPlanet(planetIndex) {
    followingPlanet = planetIndex;
    controls.enableRotate = false; // Disable manual rotation while following
}

function followSun() {
    followingPlanet = -1; // Special index for sun
    controls.enableRotate = false; // Disable manual rotation while following
}

function stopFollowing() {
    followingPlanet = null;
    controls.enableRotate = true;
    
    // Smoothly return to original position
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    function animateReturn() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        camera.position.lerpVectors(startPos, originalCameraPosition, easeProgress);
        controls.target.lerpVectors(startTarget, new THREE.Vector3(0, 0, 0), easeProgress);
        
        if (progress < 1) {
            requestAnimationFrame(animateReturn);
        }
        
        controls.update();
    }
    
    animateReturn();
}

function updateCameraFollow() {
    if (followingPlanet === -1) {
        // Following the sun
        const sunPos = new THREE.Vector3(0, 0, 0);
        const distance = 25; // Distance from sun
        const offset = new THREE.Vector3(distance, distance * 0.3, distance);
        
        const targetCameraPos = sunPos.clone().add(offset);
        
        // Smooth camera movement
        camera.position.lerp(targetCameraPos, 0.05);
        controls.target.lerp(sunPos, 0.05);
        controls.update();
    } else if (followingPlanet !== null && planets[followingPlanet]) {
        const planet = planets[followingPlanet];
        const planetPos = planet.position;
        
        // Calculate ideal camera position (behind and above the planet)
        const distance = planetData[followingPlanet].size * 8 + 15;
        const offset = new THREE.Vector3(
            -distance * Math.cos(planetData[followingPlanet].angle || 0),
            distance * 0.5,
            -distance * Math.sin(planetData[followingPlanet].angle || 0)
        );
        
        const targetCameraPos = planetPos.clone().add(offset);
        
        // Smooth camera movement
        camera.position.lerp(targetCameraPos, 0.05);
        controls.target.lerp(planetPos, 0.05);
        controls.update();
    }
}

function hidePlanetInfo() {
    const planetInfo = document.getElementById('planet-info');
    planetInfo.classList.remove('visible');
    selectedPlanet = null;
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    } else {
        animate();
    }
});
