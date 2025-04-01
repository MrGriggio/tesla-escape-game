// Three.js imports
import * as THREE from 'three';

// Game state
let gameState = {
    score: 0,
    speed: 0.35,
    minSpeed: 0.35,
    maxSpeed: 2.2,
    speedIncrement: 0.025,
    isGameOver: false,
    isPlaying: false,
    showingMenu: true,
    raptorBoostActive: false,
    raptorBoostStartTime: 0,
    raptorBoostDuration: 5000,
    lastSpawnTime: 0,
    spawnInterval: 600,
    audioContext: null,
    backgroundMusic: null,
    volumeSlider: null
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Set sky color
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Car setup
const carGeometry = new THREE.PlaneGeometry(4, 1.5);
const carMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x4287f5,
    transparent: true 
});
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, 0, 0);
scene.add(car);

// Load car textures
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    '/tesla-escape-game/Car/model3.png',
    (texture) => {
        carMaterial.map = texture;
        carMaterial.needsUpdate = true;
    },
    undefined,
    () => {
        console.warn('Failed to load car texture');
        carMaterial.color.setHex(0x4287f5); // Blue fallback
    }
);

const boostedCarTexture = textureLoader.load(
    '/tesla-escape-game/Perks/car boosted.png',
    undefined,
    undefined,
    () => {
        console.warn('Failed to load boosted car texture');
        carMaterial.color.setHex(0xff4400); // Orange fallback
    }
);

// Road setup
const roadGeometry = new THREE.PlaneGeometry(800, 4.5);
const roadMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x333333, // Dark gray
    side: THREE.DoubleSide
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
scene.add(road);

// Background setup
const grassGeometry = new THREE.PlaneGeometry(2000, 2000);
const grassMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x228B22, // Forest green
    transparent: true,
    depthWrite: false 
});
const grassBackground = new THREE.Mesh(grassGeometry, grassMaterial);
grassBackground.position.set(0, -0.5, -50);
grassBackground.rotation.x = -Math.PI / 2;
scene.add(grassBackground);

const skyGeometry = new THREE.PlaneGeometry(2000, 800);
const skyMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x87CEEB, // Light blue
    transparent: true,
    depthWrite: false 
});
const skyBackground = new THREE.Mesh(skyGeometry, skyMaterial);
skyBackground.position.set(0, 200, -1000);
scene.add(skyBackground);

// Camera setup
camera.position.z = 10;

// Obstacle setup
const obstaclePool = [];
const coinPool = [];
const raptorBoostPool = [];

function createObstacleGeometry(type) {
    if (type === 'standing') {
        const standingGeometry = new THREE.PlaneGeometry(6, 8);
        const randomNum = Math.floor(Math.random() * 3) + 1;
        const standingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red fallback
            transparent: true 
        });
        const standingEnemy = new THREE.Mesh(standingGeometry, standingMaterial);
        
        // Create a smaller collision box (invisible)
        const collisionGeometry = new THREE.PlaneGeometry(4, 6);
        const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
        const collisionBox = new THREE.Mesh(collisionGeometry, collisionMaterial);
        
        // Create a group to hold both meshes
        const group = new THREE.Group();
        group.add(standingEnemy);
        group.add(collisionBox);
        
        standingEnemy.position.y = 4;
        
        // Load texture asynchronously
        textureLoader.load(
            `/tesla-escape-game/stand enemies/${randomNum}.png`,
            (texture) => {
                standingMaterial.map = texture;
                standingMaterial.needsUpdate = true;
            },
            undefined,
            () => {
                console.warn('Failed to load standing enemy texture');
                standingMaterial.color.setHex(0xff0000); // Red fallback
            }
        );
        
        return group;
    } else {
        const geometry = new THREE.PlaneGeometry(4, 2);
        const randomNum = Math.floor(Math.random() * 5) + 1;
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Red fallback
            transparent: true 
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Load texture asynchronously
        textureLoader.load(
            `/tesla-escape-game/mov enemies/${randomNum}.png`,
            (texture) => {
                material.map = texture;
                material.needsUpdate = true;
            },
            undefined,
            () => {
                console.warn('Failed to load moving enemy texture');
                material.color.setHex(0xff0000); // Red fallback
            }
        );
        
        return mesh;
    }
}

function createCoinGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffd700, // Gold fallback
        transparent: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Load texture asynchronously
    textureLoader.load(
        '/tesla-escape-game/Perks/coin.png',
        (texture) => {
            material.map = texture;
            material.needsUpdate = true;
        },
        undefined,
        () => {
            console.warn('Failed to load coin texture');
            material.color.setHex(0xffd700); // Gold fallback
        }
    );
    
    return mesh;
}

function createRaptorBoostGeometry() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff4400, // Orange fallback
        transparent: true 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Load texture asynchronously
    textureLoader.load(
        '/tesla-escape-game/Perks/boost.png',
        (texture) => {
            material.map = texture;
            material.needsUpdate = true;
        },
        undefined,
        () => {
            console.warn('Failed to load boost texture');
            material.color.setHex(0xff4400); // Orange fallback
        }
    );
    
    return mesh;
}

// UI setup
const menuContainer = document.createElement('div');
menuContainer.style.position = 'absolute';
menuContainer.style.width = '100%';
menuContainer.style.height = '100%';
menuContainer.style.display = 'flex';
menuContainer.style.flexDirection = 'column';
menuContainer.style.alignItems = 'center';
menuContainer.style.justifyContent = 'center';
menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
menuContainer.style.backdropFilter = 'blur(5px)';
document.body.appendChild(menuContainer);

const playButton = document.createElement('button');
playButton.textContent = 'Play Game';
playButton.style.fontSize = '24px';
playButton.style.padding = '15px 30px';
playButton.style.marginTop = '80px';
playButton.style.marginBottom = '30px';
playButton.style.backgroundColor = '#4CAF50';
playButton.style.color = 'white';
playButton.style.border = 'none';
playButton.style.borderRadius = '5px';
playButton.style.cursor = 'pointer';
menuContainer.appendChild(playButton);

const tutorialBox = document.createElement('div');
tutorialBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tutorialBox.style.color = 'white';
tutorialBox.style.padding = '20px';
tutorialBox.style.borderRadius = '10px';
tutorialBox.style.maxWidth = '400px';
tutorialBox.style.textAlign = 'center';
tutorialBox.innerHTML = `
    <h2 style="margin-bottom: 15px;">How to Play</h2>
    <p style="margin-bottom: 10px;">Use Arrow Keys or WASD to move</p>
    <p style="margin-bottom: 10px;">Collect coins to increase your score</p>
    <p style="margin-bottom: 10px;">Avoid obstacles to stay alive</p>
    <p style="color: #ff4400;">Collect Raptor Boost power-ups to become invincible!</p>
`;
menuContainer.appendChild(tutorialBox);

const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '20px';
scoreDisplay.style.left = '20px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontWeight = 'bold';
scoreDisplay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
document.body.appendChild(scoreDisplay);

const gameOverScreen = document.createElement('div');
gameOverScreen.style.position = 'absolute';
gameOverScreen.style.width = '100%';
gameOverScreen.style.height = '100%';
gameOverScreen.style.display = 'none';
gameOverScreen.style.flexDirection = 'column';
gameOverScreen.style.alignItems = 'center';
gameOverScreen.style.justifyContent = 'center';
gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
gameOverScreen.style.color = 'white';
gameOverScreen.style.fontSize = '36px';
gameOverScreen.style.zIndex = '1000';
document.body.appendChild(gameOverScreen);

const gameOverText = document.createElement('div');
gameOverText.style.marginBottom = '20px';
gameOverScreen.appendChild(gameOverText);

const finalScoreText = document.createElement('div');
finalScoreText.style.fontSize = '24px';
finalScoreText.style.marginBottom = '30px';
gameOverScreen.appendChild(finalScoreText);

const restartButton = document.createElement('button');
restartButton.textContent = 'Play Again';
restartButton.style.fontSize = '24px';
restartButton.style.padding = '15px 30px';
restartButton.style.backgroundColor = '#4CAF50';
restartButton.style.color = 'white';
restartButton.style.border = 'none';
restartButton.style.borderRadius = '5px';
restartButton.style.cursor = 'pointer';
restartButton.style.marginBottom = '20px';
gameOverScreen.appendChild(restartButton);

const menuButton = document.createElement('button');
menuButton.textContent = 'Main Menu';
menuButton.style.fontSize = '24px';
menuButton.style.padding = '15px 30px';
menuButton.style.backgroundColor = '#2196F3';
menuButton.style.color = 'white';
menuButton.style.border = 'none';
menuButton.style.borderRadius = '5px';
menuButton.style.cursor = 'pointer';
gameOverScreen.appendChild(menuButton);

// Boost timer display
const boostTimerContainer = document.createElement('div');
boostTimerContainer.style.position = 'absolute';
boostTimerContainer.style.left = '50%';
boostTimerContainer.style.top = '40%';
boostTimerContainer.style.transform = 'translate(-50%, -50%)';
boostTimerContainer.style.display = 'none';
document.body.appendChild(boostTimerContainer);

const boostTimer = document.createElement('div');
boostTimer.style.color = '#ff4400';
boostTimer.style.fontSize = '36px';
boostTimer.style.fontWeight = 'bold';
boostTimer.style.textAlign = 'center';
boostTimer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
boostTimer.style.marginBottom = '10px';
boostTimerContainer.appendChild(boostTimer);

const boostProgressContainer = document.createElement('div');
boostProgressContainer.style.width = '200px';
boostProgressContainer.style.height = '12px';
boostProgressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
boostProgressContainer.style.borderRadius = '6px';
boostProgressContainer.style.overflow = 'hidden';
boostTimerContainer.appendChild(boostProgressContainer);

const boostProgress = document.createElement('div');
boostProgress.style.width = '100%';
boostProgress.style.height = '100%';
boostProgress.style.backgroundColor = '#ff4400';
boostProgress.style.borderRadius = '6px';
boostProgress.style.transition = 'width 0.1s linear';
boostProgressContainer.appendChild(boostProgress);

// Badge
const badge = document.createElement('img');
badge.src = '/tesla-escape-game/menu/menu.png';
badge.style.position = 'absolute';
badge.style.bottom = '20px';
badge.style.right = '20px';
badge.style.width = '150px';
badge.style.height = 'auto';
document.body.appendChild(badge);

// Audio setup
const volumeControl = document.createElement('div');
volumeControl.style.position = 'absolute';
volumeControl.style.top = '20px';
volumeControl.style.right = '20px';
volumeControl.style.display = 'flex';
volumeControl.style.alignItems = 'center';
volumeControl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
volumeControl.style.padding = '10px';
volumeControl.style.borderRadius = '5px';
document.body.appendChild(volumeControl);

const volumeIcon = document.createElement('span');
volumeIcon.textContent = '🔊';
volumeIcon.style.color = 'white';
volumeIcon.style.marginRight = '10px';
volumeControl.appendChild(volumeIcon);

const volumeSlider = document.createElement('input');
volumeSlider.type = 'range';
volumeSlider.min = '0';
volumeSlider.max = '1';
volumeSlider.step = '0.1';
volumeSlider.value = '0.5';
volumeSlider.style.width = '100px';
volumeControl.appendChild(volumeSlider);

function initAudio() {
    if (!gameState.audioContext) {
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load and set up background music
        fetch('/tesla-escape-game/soundtrack/soundtrack.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => gameState.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = gameState.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.loop = true;
                
                const gainNode = gameState.audioContext.createGain();
                gainNode.gain.value = volumeSlider.value;
                
                source.connect(gainNode);
                gainNode.connect(gameState.audioContext.destination);
                
                gameState.backgroundMusic = {
                    source: source,
                    gainNode: gainNode
                };
                
                source.start();
            })
            .catch(error => console.error('Error loading audio:', error));
    }
}

volumeSlider.addEventListener('input', () => {
    if (gameState.backgroundMusic) {
        gameState.backgroundMusic.gainNode.gain.value = volumeSlider.value;
    }
});

// Game controls
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
};

document.addEventListener('keydown', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
});

// Game functions
function spawnObstacle() {
    const now = Date.now();
    if (now - gameState.lastSpawnTime < gameState.spawnInterval) return;
    
    if (Math.random() > 0.15) {  // 85% chance to spawn
        const type = Math.random() < 0.5 ? 'standing' : 'laying';
        const obstacle = createObstacleGeometry(type);
        obstacle.position.x = camera.position.x + 50;
        obstacle.position.y = type === 'standing' ? 0 : 1;
        obstacle.position.z = Math.random() < 0.5 ? -2 : 2;
        scene.add(obstacle);
        obstaclePool.push(obstacle);
        
        // 45% chance for a second obstacle
        if (Math.random() < 0.45) {
            setTimeout(() => {
                const secondType = Math.random() < 0.5 ? 'standing' : 'laying';
                const secondObstacle = createObstacleGeometry(secondType);
                secondObstacle.position.x = obstacle.position.x + 3;
                secondObstacle.position.y = secondType === 'standing' ? 0 : 1;
                secondObstacle.position.z = -obstacle.position.z;
                scene.add(secondObstacle);
                obstaclePool.push(secondObstacle);
            }, 200);
        }
        
        // 25% chance for a third obstacle
        if (Math.random() < 0.25) {
            setTimeout(() => {
                const thirdType = Math.random() < 0.5 ? 'standing' : 'laying';
                const thirdObstacle = createObstacleGeometry(thirdType);
                thirdObstacle.position.x = obstacle.position.x + 6;
                thirdObstacle.position.y = thirdType === 'standing' ? 0 : 1;
                thirdObstacle.position.z = Math.random() < 0.5 ? -2 : 2;
                scene.add(thirdObstacle);
                obstaclePool.push(thirdObstacle);
            }, 400);
        }
    }
    
    // Spawn coins
    if (Math.random() < 0.4) {
        const coin = createCoinGeometry();
        coin.position.x = camera.position.x + 50;
        coin.position.y = 1;
        coin.position.z = Math.random() < 0.5 ? -2 : 2;
        scene.add(coin);
        coinPool.push(coin);
    }
    
    // Spawn Raptor Boost
    if (Math.random() < 0.1) {
        const raptorBoost = createRaptorBoostGeometry();
        raptorBoost.position.x = camera.position.x + 50;
        raptorBoost.position.y = 1;
        raptorBoost.position.z = Math.random() < 0.5 ? -2 : 2;
        scene.add(raptorBoost);
        raptorBoostPool.push(raptorBoost);
    }
    
    gameState.lastSpawnTime = now;
}

function updateObstacles() {
    const cameraX = camera.position.x;
    
    // Remove obstacles that are too far behind
    for (let i = obstaclePool.length - 1; i >= 0; i--) {
        if (obstaclePool[i].position.x < cameraX - 10) {
            scene.remove(obstaclePool[i]);
            obstaclePool.splice(i, 1);
        }
    }
    
    // Remove coins that are too far behind
    for (let i = coinPool.length - 1; i >= 0; i--) {
        if (coinPool[i].position.x < cameraX - 10) {
            scene.remove(coinPool[i]);
            coinPool.splice(i, 1);
        }
    }
    
    // Remove Raptor Boosts that are too far behind
    for (let i = raptorBoostPool.length - 1; i >= 0; i--) {
        if (raptorBoostPool[i].position.x < cameraX - 10) {
            scene.remove(raptorBoostPool[i]);
            raptorBoostPool.splice(i, 1);
        }
    }
}

function checkCollision(object1, object2) {
    const box1 = new THREE.Box3().setFromObject(object1);
    const box2 = new THREE.Box3().setFromObject(object2);
    return box1.intersectsBox(box2);
}

function activateRaptorBoost() {
    gameState.raptorBoostActive = true;
    gameState.raptorBoostStartTime = Date.now();
    car.material.map = boostedCarTexture;
    boostTimerContainer.style.display = 'block';
}

function deactivateRaptorBoost() {
    gameState.raptorBoostActive = false;
    car.material.map = carMaterial;
    boostTimerContainer.style.display = 'none';
}

function updateRaptorBoostEffects() {
    if (gameState.raptorBoostActive) {
        const elapsedTime = Date.now() - gameState.raptorBoostStartTime;
        const remainingTime = Math.max(0, gameState.raptorBoostDuration - elapsedTime);
        const progress = (remainingTime / gameState.raptorBoostDuration) * 100;
        
        // Update timer display
        const secondsRemaining = (remainingTime / 1000).toFixed(1);
        boostTimer.textContent = secondsRemaining;
        boostProgress.style.width = `${progress}%`;
        
        if (remainingTime <= 0) {
            deactivateRaptorBoost();
        }
    }
}

function checkCollisions() {
    if (!gameState.isPlaying) return;
    
    // Check collisions with obstacles
    for (const obstacle of obstaclePool) {
        if (checkCollision(car, obstacle) && !gameState.raptorBoostActive) {
            gameOver();
            return;
        }
    }
    
    // Check collisions with coins
    for (let i = coinPool.length - 1; i >= 0; i--) {
        if (checkCollision(car, coinPool[i])) {
            scene.remove(coinPool[i]);
            coinPool.splice(i, 1);
            gameState.score += 10;
            updateScore();
        }
    }
    
    // Check collisions with Raptor Boosts
    for (let i = raptorBoostPool.length - 1; i >= 0; i--) {
        if (checkCollision(car, raptorBoostPool[i])) {
            scene.remove(raptorBoostPool[i]);
            raptorBoostPool.splice(i, 1);
            activateRaptorBoost();
        }
    }
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${gameState.score}`;
}

function gameOver() {
    gameState.isGameOver = true;
    gameState.isPlaying = false;
    gameOverText.textContent = 'Game Over!';
    finalScoreText.textContent = `Final Score: ${gameState.score}`;
    gameOverScreen.style.display = 'flex';
}

function resetGame() {
    // Reset game state
    gameState.score = 0;
    gameState.speed = gameState.minSpeed;
    gameState.isGameOver = false;
    gameState.raptorBoostActive = false;
    
    // Reset car position
    car.position.set(0, 0, 0);
    
    // Remove all obstacles
    for (const obstacle of obstaclePool) {
        scene.remove(obstacle);
    }
    obstaclePool.length = 0;
    
    // Remove all coins
    for (const coin of coinPool) {
        scene.remove(coin);
    }
    coinPool.length = 0;
    
    // Remove all Raptor Boosts
    for (const boost of raptorBoostPool) {
        scene.remove(boost);
    }
    raptorBoostPool.length = 0;
    
    // Reset camera
    camera.position.set(0, 0, 10);
    
    // Reset UI
    updateScore();
    gameOverScreen.style.display = 'none';
    deactivateRaptorBoost();
}

function startGame() {
    if (!gameState.isPlaying) {
        gameState.isPlaying = true;
        gameState.showingMenu = false;
        menuContainer.style.display = 'none';
        resetGame();
        initAudio();
    }
}

// Event listeners
playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
menuButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    menuContainer.style.display = 'flex';
    gameState.showingMenu = true;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.isPlaying) {
        // Update car position based on input
        if ((keys.ArrowLeft || keys.a) && car.position.z < 2) car.position.z += 0.2;
        if ((keys.ArrowRight || keys.d) && car.position.z > -2) car.position.z -= 0.2;
        
        // Update camera and car position
        camera.position.x += gameState.speed;
        car.position.x = camera.position.x;
        
        // Update road texture offset for scrolling effect
        roadMaterial.color.setHex(0x333333 + (Math.sin(Date.now() * 0.005) * 0x101010));
        
        // Update grass texture offset
        grassMaterial.color.setHex(0x228B22 + (Math.sin(Date.now() * 0.005) * 0x008B00));
        
        // Spawn and update obstacles
        spawnObstacle();
        updateObstacles();
        
        // Check collisions
        checkCollisions();
        
        // Update Raptor Boost effects
        updateRaptorBoostEffects();
        
        // Gradually increase speed
        if (!gameState.raptorBoostActive && gameState.speed < gameState.maxSpeed) {
            gameState.speed += gameState.speedIncrement * 0.016; // Assuming 60 FPS
        }
    }
    
    renderer.render(scene, camera);
}

// Start the game loop
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});