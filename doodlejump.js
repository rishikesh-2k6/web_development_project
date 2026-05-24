// ========== GAME BOARD SETUP ==========
// Canvas elements and dimensions
let board; // Reference to HTML canvas element
let boardWidth = 360; // Width of game area in pixels
let boardHeight = 576; // Height of game area in pixels
let context; // 2D drawing context for canvas

// ========== DOODLER (PLAYER) SETUP ==========
// Player character properties
let doodlerWidth = 46; // Width of doodler character
let doodlerHeight = 46; // Height of doodler character
let doodlerX = boardWidth/2 - doodlerWidth/2; // Starting X position (centered)
let doodlerY = boardHeight*7/8 - doodlerHeight; // Starting Y position (near bottom)
let doodlerRightImg; // Image for right-facing doodler
let doodlerLeftImg; // Image for left-facing doodler

// Doodler object containing current state
let doodler = {
    img: null, // Current image (changes based on direction)
    x: doodlerX, // Current X position
    y: doodlerY, // Current Y position
    width: doodlerWidth, // Character width
    height: doodlerHeight // Character height
}

// ========== PHYSICS SYSTEM ==========
let velocityX = 0; // Horizontal movement speed
let velocityY = 0; // Vertical movement speed (jumping/falling)
let initialVelocityY = -8; // Initial jump velocity (negative = upward)
let gravity = 0.4; // Force pulling doodler downward

// ========== PLATFORM SYSTEM ==========
let platformArray = []; // Stores all platform objects
let platformWidth = 60; // Width of each platform
let platformHeight = 18; // Height of each platform
let platformImg; // Image used for platforms

// ========== GAME STATE ==========
let score = 0; // Current player score
let maxScore = 0; // Highest score achieved this game
let gameOver = false; // Whether game has ended

// ========== GAME INITIALIZATION ==========
window.onload = function() {
    // Set up canvas
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); // Get 2D drawing context

    // Load images
    doodlerRightImg = new Image();
    doodlerRightImg.src = "./doodler-right.png";
    doodler.img = doodlerRightImg; // Set initial image
    
    // When right image loads, draw it
    doodlerRightImg.onload = function() {
        context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);
    }

    // Load other images
    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "./doodler-left.png";
    platformImg = new Image();
    platformImg.src = "./platform.png";

    // Initialize game state
    velocityY = initialVelocityY; // Start with initial jump
    placePlatforms(); // Create starting platforms
    requestAnimationFrame(update); // Start game loop
    document.addEventListener("keydown", moveDoodler); // Set up controls
}

// ========== MAIN GAME LOOP ==========
function update() {
    requestAnimationFrame(update); // Continuously run game loop
    
    // Stop if game over
    if (gameOver) return;
    
    // Clear canvas for fresh frame
    context.clearRect(0, 0, board.width, board.height);

    // ===== DOODLER MOVEMENT =====
    doodler.x += velocityX; // Move horizontally
    
    // Screen wrapping - left/right edges
    if (doodler.x > boardWidth) { // Went off right
        doodler.x = 0; // Appear on left
    }
    else if (doodler.x + doodler.width < 0) { // Went off left
        doodler.x = boardWidth; // Appear on right
    }

    // Apply gravity and move vertically
    velocityY += gravity;
    doodler.y += velocityY;
    
    // Check if fell off bottom
    if (doodler.y > board.height) {
        gameOver = true;
    }
    
    // Draw doodler
    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    // ===== PLATFORM HANDLING =====
    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];
        
        // If jumping upward and above 3/4 screen height, move platforms down
        if (velocityY < 0 && doodler.y < boardHeight*3/4) {
            platform.y -= initialVelocityY; // Slide platform down
        }
        
        // Check for landing on platform
        if (detectCollision(doodler, platform) && velocityY >= 0) {
            velocityY = initialVelocityY; // Make doodler jump
        }
        
        // Draw platform
        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
    }

    // Remove platforms that scrolled off bottom and add new ones
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift(); // Remove oldest platform
        newPlatform(); // Add new platform at top
    }

    // ===== SCORE DISPLAY =====
    updateScore();
    context.fillStyle = "black";
    context.font = "16px sans-serif";
    context.fillText(score, 5, 20); // Draw score in top-left

    // Game over message
    if (gameOver) {
        context.fillText("Game Over: Press 'Space' to Restart", boardWidth/7, boardHeight*7/8);
    }
}

// ========== CONTROLS ==========
function moveDoodler(e) {
    // Right movement
    if (e.code == "ArrowRight" || e.code == "KeyD") {
        velocityX = 4; // Move right
        doodler.img = doodlerRightImg; // Face right
    }
    // Left movement
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        velocityX = -4; // Move left
        doodler.img = doodlerLeftImg; // Face left
    }
    // Restart game
    else if (e.code == "Space" && gameOver) {
        // Reset all game state
        doodler = {
            img: doodlerRightImg,
            x: doodlerX,
            y: doodlerY,
            width: doodlerWidth,
            height: doodlerHeight
        }
        velocityX = 0;
        velocityY = initialVelocityY;
        score = 0;
        maxScore = 0;
        gameOver = false;
        placePlatforms(); // Regenerate platforms
    }
}

// ========== PLATFORM FUNCTIONS ==========
function placePlatforms() {
    platformArray = []; // Clear existing platforms

    // Create starting platform (centered near bottom)
    let platform = {
        img: platformImg,
        x: boardWidth/2,
        y: boardHeight - 50,
        width: platformWidth,
        height: platformHeight
    }
    platformArray.push(platform);

    // Create 6 additional random platforms
    for (let i = 0; i < 6; i++) {
        let randomX = Math.floor(Math.random() * boardWidth*3/4); // Random X within 3/4 width
        let platform = {
            img: platformImg,
            x: randomX,
            y: boardHeight - 75*i - 150, // Space platforms vertically
            width: platformWidth,
            height: platformHeight
        }
        platformArray.push(platform);
    }
}

function newPlatform() {
    // Create single new platform at top with random X position
    let randomX = Math.floor(Math.random() * boardWidth*3/4);
    let platform = {
        img: platformImg,
        x: randomX,
        y: -platformHeight, // Start above visible area
        width: platformWidth,
        height: platformHeight
    }
    platformArray.push(platform);
}

// ========== COLLISION DETECTION ==========
function detectCollision(a, b) {
    // Check if object a overlaps with object b
    return a.x < b.x + b.width && // a's left vs b's right
           a.x + a.width > b.x && // a's right vs b's left
           a.y < b.y + b.height && // a's top vs b's bottom
           a.y + a.height > b.y; // a's bottom vs b's top
}

// ========== SCORE SYSTEM ==========
function updateScore() {
    let points = Math.floor(50*Math.random()); // Random points (0-50)
    
    // If moving upward (jumping), increase score
    if (velocityY < 0) {
        maxScore += points;
        if (score < maxScore) {
            score = maxScore; // Only show highest score
        }
    }
    // If falling, decrease score (but never below 0)
    else if (velocityY >= 0) {
        maxScore = Math.max(0, maxScore - points);
    } 
}