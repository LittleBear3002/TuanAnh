// --- App State & Configurations ---
let appState = {
    texts: [],
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    musicSource: 'default', // 'default', 'url', 'upload'
    theme: 'nebula'
};

const defaultTexts = [
    "Anh Yêu Em",
    "Vũ trụ này chỉ có em",
    "Mãi bên nhau nhé",
    "Em là thế giới của anh",
    "Yêu em nhiều hơn mỗi ngày",
    "Ngôi sao sáng nhất đời anh",
    "Nhớ em da diết"
];

// --- Theme Style Mappings ---
const themes = {
    'nebula': {
        class: 'theme-nebula',
        starColor: () => `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.3})`,
        heartColor: () => `hsla(${Math.random() * 20 + 340}, 100%, 70%, ${Math.random() * 0.4 + 0.4})`, // Pink-red
        textColor: () => `hsla(${Math.random() * 60 + 260}, 100%, 85%, ${Math.random() * 0.5 + 0.5})`, // Purple-blue-pink pastel
    },
    'deep-space': {
        class: 'theme-deep-space',
        starColor: () => `rgba(255, 255, 255, ${Math.random() * 0.6 + 0.4})`,
        heartColor: () => `rgba(224, 20, 76, ${Math.random() * 0.4 + 0.5})`, // Deep Crimson
        textColor: () => `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`, // Pure glow white
    },
    'sunset': {
        class: 'theme-sunset',
        starColor: () => `rgba(255, 244, 214, ${Math.random() * 0.5 + 0.4})`,
        heartColor: () => `hsla(${Math.random() * 30 + 350}, 100%, 65%, ${Math.random() * 0.4 + 0.5})`, // Bright Red-Orange
        textColor: () => `hsla(${Math.random() * 40 + 20}, 100%, 80%, ${Math.random() * 0.5 + 0.5})`, // Warm Peach-Gold
    }
};

// --- DOM Elements ---
const spaceBg = document.getElementById('spaceBg');
const universeCanvas = document.getElementById('universeCanvas');
const ctx = universeCanvas.getContext('2d');
const introScreen = document.getElementById('introScreen');
const btnStart = document.getElementById('btnStart');
const setupInterface = document.getElementById('setupInterface');
const textInput = document.getElementById('textInput');
const musicOptions = document.querySelectorAll('.music-option');
const musicUrlGroup = document.getElementById('musicUrlGroup');
const musicUrlInput = document.getElementById('musicUrlInput');
const musicUploadGroup = document.getElementById('musicUploadGroup');
const musicFileInput = document.getElementById('musicFileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const themeOptions = document.querySelectorAll('.theme-option');
const btnCreate = document.getElementById('btnCreate');
const musicPlayer = document.getElementById('musicPlayer');
const btnPlayPause = document.getElementById('btnPlayPause');
const playPauseIcon = document.getElementById('playPauseIcon');
const volumeRange = document.getElementById('volumeRange');
const btnBackToEdit = document.getElementById('btnBackToEdit');
const btnOpenShare = document.getElementById('btnOpenShare');
const shareModal = document.getElementById('shareModal');
const btnCloseShare = document.getElementById('btnCloseShare');
const qrcodeDiv = document.getElementById('qrcode');
const qrLoading = document.getElementById('qrLoading');
const shareUrlInput = document.getElementById('shareUrlInput');
const btnCopyLink = document.getElementById('btnCopyLink');
const copyFeedback = document.getElementById('copyFeedback');
const bgAudio = document.getElementById('bgAudio');

// --- 3D Particle Canvas System Engine ---
let stars = [];
let floatingItems = [];
let nebulae = [];
const maxZ = 1600; // Expanded depth to spread items out more!
const fov = 450; 
const cameraZ = 850; // Galactic depth position
let animationFrameId;
let width, height, centerX, centerY;
let mouse = { x: 0, y: 0, active: false };

// Base64 UTF-8 Encoding Helpers
function encodeState(state) {
    const jsonStr = JSON.stringify(state);
    const utf8Str = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    return btoa(utf8Str);
}

function decodeState(base64Str) {
    try {
        const binaryStr = atob(base64Str);
        const utf8Str = Array.prototype.map.call(binaryStr, function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('');
        const jsonStr = decodeURIComponent(utf8Str);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Decoding error:", e);
        return null;
    }
}

// Adjust Canvas Resolution for High-DPI screens (Retina)
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;

    const dpr = window.devicePixelRatio || 1;
    universeCanvas.width = width * dpr;
    universeCanvas.height = height * dpr;
    universeCanvas.style.width = width + 'px';
    universeCanvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    
    // Initialize Canvas Nebulae based on screen size
    initNebulae();
}

function initNebulae() {
    nebulae = [
        { x: -width * 0.25, y: -height * 0.2, r: Math.max(width, height) * 0.65, color: 'rgba(93, 23, 150, 0.13)', angle: 0, speed: 0.001, dist: Math.min(width, height) * 0.15 },
        { x: width * 0.25, y: height * 0.15, r: Math.max(width, height) * 0.7, color: 'rgba(186, 23, 102, 0.13)', angle: Math.PI, speed: 0.0008, dist: Math.min(width, height) * 0.2 },
        { x: 0, y: -height * 0.05, r: Math.max(width, height) * 0.5, color: 'rgba(162, 155, 254, 0.08)', angle: Math.PI / 2, speed: 0.0012, dist: Math.min(width, height) * 0.1 }
    ];
}

function initParticles() {
    stars = [];
    floatingItems = [];
    const themeConfig = themes[appState.theme];
    
    // Twinkling stars in background (reduced to 150 for massive performance boost)
    const starCount = Math.min(150, Math.floor((width * height) / 3500));
    for (let i = 0; i < starCount; i++) {
        const isPinkNebula = Math.random() < 0.55; // 55% pink twinkling dots
        let starColor = isPinkNebula ? `hsla(${Math.random() * 30 + 325}, 100%, 75%, ${Math.random() * 0.6 + 0.4})` : themeConfig.starColor();
        stars.push({
            x: (Math.random() - 0.5) * width * 3.5,
            y: (Math.random() - 0.5) * height * 3.5,
            z: Math.random() * maxZ,
            color: starColor,
            isPink: isPinkNebula,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
    
    const userTexts = appState.texts.length > 0 ? appState.texts : defaultTexts;
    
    // Create glowing swarming texts (45 particles - perfectly optimized, no clumping!)
    const textCount = 45;
    for (let i = 0; i < textCount; i++) {
        floatingItems.push(createFloatingItem('text', userTexts[i % userTexts.length], themeConfig));
    }
    
    // Create glowing hearts (30 particles)
    const heartCount = 30;
    for (let i = 0; i < heartCount; i++) {
        floatingItems.push(createFloatingItem('heart', null, themeConfig));
    }
}

function createFloatingItem(type, textVal = null, themeConfig) {
    const spawnAngle = Math.random() * Math.PI * 2;
    // Spawn concentrated near center but widely spread out
    const spawnDist = Math.random() * Math.min(width, height) * 0.85;
    
    return {
        type: type,
        text: textVal,
        x: Math.cos(spawnAngle) * spawnDist,
        y: Math.sin(spawnAngle) * spawnDist,
        z: Math.random() * maxZ,
        vx: Math.cos(spawnAngle) * (Math.random() * 0.22 + 0.12), // slightly slower, more graceful drift
        vy: Math.sin(spawnAngle) * (Math.random() * 0.22 + 0.12),
        vz: -(Math.random() * 0.9 + 0.6), // Slower, extremely smooth zoom forward velocity
        rot: (Math.random() - 0.5) * 0.25,
        vRot: (Math.random() - 0.5) * 0.003, // slower rot
        color: type === 'text' ? themeConfig.textColor() : themeConfig.heartColor(),
        baseSize: type === 'text' ? (Math.random() * 8 + 20) : (Math.random() * 6 + 12), // Perfectly elegant, smaller cute sizes!
        dx3d: 0,
        dy3d: 0
    };
}

function drawHeart(c, x, y, size) {
    c.beginPath();
    c.moveTo(x, y - size / 4);
    // Left curve
    c.bezierCurveTo(x - size / 1.8, y - size / 1.2, x - size, y - size / 3, x, y + size * 0.85);
    // Right curve
    c.bezierCurveTo(x + size, y - size / 3, x + size / 1.8, y - size / 1.2, x, y - size / 4);
    c.closePath();
    c.fill();
}

function updateAndRender() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw swirling nebulae background
    nebulae.forEach(neb => {
        neb.angle += neb.speed;
        const offsetX = Math.cos(neb.angle) * neb.dist;
        const offsetY = Math.sin(neb.angle) * neb.dist;
        const cx = centerX + neb.x + offsetX;
        const cy = centerY + neb.y + offsetY;
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, neb.r);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(0.5, neb.color.replace('0.13', '0.04').replace('0.08', '0.02'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, neb.r, 0, Math.PI * 2);
        ctx.fill();
    });
    
    const themeConfig = themes[appState.theme];
    
    // 1. Render Background Stars (Flying Outward & Twinkling Pink Dots)
    stars.forEach(star => {
        const speed = star.isPink ? 0.8 : 2.2; // Pink dots move slower for background depth
        const prevZ = star.z;
        star.z -= speed;
        
        if (star.z <= 0) {
            star.z = maxZ;
            star.x = (Math.random() - 0.5) * width * 3.5;
            star.y = (Math.random() - 0.5) * height * 3.5;
            return;
        }
        
        // Project current 3D to 2D
        const px = centerX + (star.x * (fov / star.z));
        const py = centerY + (star.y * (fov / star.z));
        
        let pSize = Math.max(0.3, (fov / star.z) * 1.6);
        if (star.isPink) {
            pSize = Math.max(0.5, (fov / star.z) * 0.9); // Tiny dot size
        }
        
        if (px >= 0 && px < width && py >= 0 && py < height) {
            ctx.save();
            ctx.globalAlpha = Math.max(0.1, Math.min(0.8, (maxZ - star.z) / maxZ));
            if (star.isPink) {
                // Twinkle / blink effect
                const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinklePhase) * 0.4 + 0.6;
                ctx.globalAlpha = twinkle;
                ctx.fillStyle = star.color;
                ctx.shadowBlur = 4;
                ctx.shadowColor = star.color;
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = star.color;
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    });
    
    // Update swarming texts & hearts
    floatingItems.forEach(item => {
        // Zoom forward (Z decreases towards screen)
        item.z += item.vz;
        
        // Float outward
        item.x += item.vx;
        item.y += item.vy;
        
        item.rot += item.vRot;
        
        // Decay mouse push forces
        item.dx3d *= 0.95;
        item.dy3d *= 0.95;
        
        // Boundary recycle check: if Z <= 0 or off screen edges, recycle back to center!
        const scale = fov / item.z;
        const px = centerX + (item.x + item.dx3d) * scale;
        const py = centerY + (item.y + item.dy3d) * scale;
        const size = item.baseSize * scale;
        
        const margin = size * 2.5;
        let needsRecycle = false;
        if (item.z <= 0) {
            needsRecycle = true;
        } else if (px < -margin || px > width + margin || py < -margin || py > height + margin) {
            needsRecycle = true;
        }
        
        if (needsRecycle) {
            item.z = maxZ;
            
            // Spawn very close to center
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = Math.random() * Math.min(width, height) * 0.15;
            item.x = Math.cos(spawnAngle) * spawnDist;
            item.y = Math.sin(spawnAngle) * spawnDist;
            
            // Velocity points outwards
            const moveAngle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.45 + 0.15;
            item.vx = Math.cos(moveAngle) * speed;
            item.vy = Math.sin(moveAngle) * speed;
            
            item.vz = -(Math.random() * 1.5 + 1.2); // zoom forward speed
            item.rot = (Math.random() - 0.5) * 0.25;
            item.dx3d = 0;
            item.dy3d = 0;
        }
    });
    
    // Sort items by Z index to render distant things first
    floatingItems.sort((a, b) => b.z - a.z);
    
    // 2. Render Glowing Texts & Hearts (No bubbles, matching user screenshot!)
    floatingItems.forEach(item => {
        const scale = fov / item.z;
        const px = centerX + (item.x + item.dx3d) * scale;
        const py = centerY + (item.y + item.dy3d) * scale;
        const size = item.baseSize * scale;
        
        // Mouse push interaction
        if (mouse.active) {
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = 180;
            
            if (dist < threshold) {
                const force = (threshold - dist) / threshold;
                const angle = Math.atan2(dy, dx);
                const pushMag = force * 6;
                const pushX = Math.cos(angle) * pushMag;
                const pushY = Math.sin(angle) * pushMag;
                
                item.dx3d += pushX * (item.z / fov);
                item.dy3d += pushY * (item.z / fov);
            }
        }
        
        // Fog transparency
        let opacity = 1;
        if (item.z > maxZ * 0.8) {
            opacity = (maxZ - item.z) / (maxZ * 0.2); // Fade in
        } else if (item.z < 150) {
            opacity = item.z / 150; // Fade out near screen
        }
        opacity = Math.max(0, Math.min(1, opacity));
        
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(item.rot);
        ctx.globalAlpha = opacity;
        
        // Neon glow styling (optimized shadow blur radius limits lag on mobile devices!)
        ctx.shadowBlur = Math.min(8, 4 * scale);
        ctx.shadowColor = item.color;
        
        if (item.type === 'text') {
            // Girly round cute font
            ctx.font = `bold ${Math.max(14, size)}px 'Itim', 'Pacifico', cursive`;
            ctx.fillStyle = '#ffffff'; // Glowing white text core
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw filled text
            ctx.fillText(item.text, 0, 0);
            
            // Draw a subtle colored border around the white letters for a clean neon outline
            ctx.strokeStyle = item.color;
            ctx.lineWidth = Math.max(0.5, 0.6 * scale);
            ctx.strokeText(item.text, 0, 0);
        } else if (item.type === 'heart') {
            ctx.fillStyle = item.color;
            drawHeart(ctx, 0, 0, size);
        }
        
        ctx.restore();
    });
    
    animationFrameId = requestAnimationFrame(updateAndRender);
}

function startUniverseAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    resizeCanvas();
    initParticles();
    updateAndRender();
}

// --- Layout & Theme Operations ---
function applyTheme(themeName) {
    if (!themes[themeName]) themeName = 'nebula';
    appState.theme = themeName;
    
    // Reset background styles
    spaceBg.className = 'space-bg';
    spaceBg.classList.add(themes[themeName].class);
    
    // Update theme selector state in UI
    themeOptions.forEach(opt => {
        if (opt.getAttribute('data-theme') === themeName) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
}

function parseStateFromURL() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#state=')) {
        const base64Str = hash.replace('#state=', '');
        const state = decodeState(base64Str);
        if (state) {
            appState = { ...appState, ...state };
            
            // Sync form contents in case user opens edit mode later
            if (appState.texts && appState.texts.length > 0) {
                textInput.value = appState.texts.join('\n');
            }
            
            applyTheme(appState.theme);
            
            // Setup music options display
            const correspondingOpt = Array.from(musicOptions).find(opt => {
                return opt.getAttribute('data-url') === appState.musicUrl;
            });
            
            musicOptions.forEach(opt => opt.classList.remove('active'));
            if (correspondingOpt) {
                correspondingOpt.classList.add('active');
            } else if (appState.musicSource === 'url') {
                document.querySelector('[data-source="url"]').classList.add('active');
                musicUrlInput.value = appState.musicUrl;
                musicUrlGroup.classList.remove('hide');
            }
            
            return true; // Valid state found
        }
    }
    return false;
}

// Apply selected music configs to HTML Audio element
function setupAudio() {
    let sourceUrl = appState.musicUrl;
    
    if (appState.musicSource === 'upload' && musicFileInput.files.length > 0) {
        sourceUrl = URL.createObjectURL(musicFileInput.files[0]);
    }
    
    bgAudio.src = sourceUrl;
    bgAudio.load();
}

function playAudio() {
    bgAudio.play()
        .then(() => {
            playPauseIcon.setAttribute('data-lucide', 'pause');
            lucide.createIcons();
            document.querySelector('.music-status').innerText = 'Đang phát nhạc nền';
        })
        .catch(err => {
            console.warn("Audio autoplay blocked or loaded incorrectly:", err);
        });
}

function toggleAudio() {
    if (bgAudio.paused) {
        bgAudio.play();
        playPauseIcon.setAttribute('data-lucide', 'pause');
    } else {
        bgAudio.pause();
        playPauseIcon.setAttribute('data-lucide', 'play');
    }
    lucide.createIcons();
}

// Generate sharing URL & QR Code
function generateShare() {
    qrLoading.classList.remove('hide');
    qrcodeDiv.innerHTML = '';
    
    // 1. Capture texts
    const textLines = textInput.value.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
    const finalTexts = textLines.length > 0 ? textLines : defaultTexts;
    
    // 2. Capture music details
    let selectedMusicUrl = appState.musicUrl;
    let selectedSource = appState.musicSource;
    
    if (selectedSource === 'upload') {
        // Warning: Local upload can't be carried easily over URLs. Show note and default.
        selectedMusicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        selectedSource = 'default';
        alert("Lưu ý: File nhạc tải lên cục bộ không thể đính kèm vào mã QR chia sẻ. Hệ thống sẽ thay thế bằng nhạc mặc định khi quét QR.");
    } else if (selectedSource === 'url') {
        selectedMusicUrl = musicUrlInput.value.trim() || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    
    // 3. Assemble state object
    const stateObj = {
        texts: finalTexts,
        musicUrl: selectedMusicUrl,
        musicSource: selectedSource,
        theme: appState.theme
    };
    
    appState = stateObj; // Update local appState
    
    // Build share link using window.location origin and path
    const cleanUrl = window.location.origin + window.location.pathname;
    const base64State = encodeState(stateObj);
    const shareUrl = `${cleanUrl}#state=${base64State}`;
    
    shareUrlInput.value = shareUrl;
    
    // Generate QR using public API QR Server
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;
    
    const qrImg = new Image();
    qrImg.onload = () => {
        qrLoading.classList.add('hide');
        qrcodeDiv.appendChild(qrImg);
    };
    qrImg.onerror = () => {
        qrLoading.classList.add('hide');
        qrcodeDiv.innerHTML = `<span class="text-sm" style="color:#ff758c">Không thể tải mã QR. Nhấp sao chép liên kết bên dưới để gửi!</span>`;
    };
    qrImg.src = qrUrl;
}

// --- Event Listeners Initialization ---

// 1. Intro Screen Button
btnStart.addEventListener('click', () => {
    introScreen.classList.remove('active');
    setupAudio();
    playAudio();
    
    // If URL contains state parameters, jump directly to Universe Mode
    const hasUrlState = parseStateFromURL();
    if (hasUrlState) {
        setupInterface.classList.add('hide');
        musicPlayer.classList.remove('hide');
        startUniverseAnimation();
    } else {
        // No configuration state, display Setup Form
        setupInterface.classList.remove('hide');
        // Initial setup animation
        startUniverseAnimation();
    }
});

// 2. Music Options Selection
musicOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        musicOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        const source = option.getAttribute('data-source');
        appState.musicSource = source;
        
        // Hide/Show sub-groups
        musicUrlGroup.classList.add('hide');
        musicUploadGroup.classList.add('hide');
        
        if (source === 'default') {
            appState.musicUrl = option.getAttribute('data-url');
        } else if (source === 'url') {
            musicUrlGroup.classList.remove('hide');
        } else if (source === 'upload') {
            musicUploadGroup.classList.remove('hide');
        }
    });
});

// Sync music URL input change
musicUrlInput.addEventListener('input', (e) => {
    appState.musicUrl = e.target.value.trim();
});

// Handle local file uploads
musicFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        fileNameDisplay.textContent = file.name;
        appState.musicUrl = URL.createObjectURL(file);
    } else {
        fileNameDisplay.textContent = "Chưa có file nào được chọn";
    }
});

// 3. Theme Selections
themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        const selectedTheme = opt.getAttribute('data-theme');
        applyTheme(selectedTheme);
        // Regenerate particles colors
        initParticles();
    });
});

// 4. Create Universe Trigger
btnCreate.addEventListener('click', () => {
    // Capture user text
    const textLines = textInput.value.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
    appState.texts = textLines;
    
    // Setup audio
    setupAudio();
    playAudio();
    
    // Animate transition into Universe view
    setupInterface.classList.add('hide');
    musicPlayer.classList.remove('hide');
    
    // Reload animation engine
    startUniverseAnimation();
});

// 5. Floating Music Controller actions
btnPlayPause.addEventListener('click', toggleAudio);

volumeRange.addEventListener('input', (e) => {
    bgAudio.volume = e.target.value;
});

btnBackToEdit.addEventListener('click', () => {
    setupInterface.classList.remove('hide');
    musicPlayer.classList.add('hide');
});

btnOpenShare.addEventListener('click', () => {
    generateShare();
    shareModal.classList.add('active');
});

// 6. Share Modal Actions
btnCloseShare.addEventListener('click', () => {
    shareModal.classList.remove('active');
    copyFeedback.classList.add('hide');
});

btnCopyLink.addEventListener('click', () => {
    shareUrlInput.select();
    shareUrlInput.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(shareUrlInput.value)
        .then(() => {
            copyFeedback.classList.remove('hide');
            setTimeout(() => {
                copyFeedback.classList.add('hide');
            }, 3000);
        })
        .catch(err => {
            console.error("Lỗi khi sao chép liên kết:", err);
        });
});

// 7. Track User Pointer / Finger position for interactive Canvas push
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

window.addEventListener('mouseleave', () => {
    mouse.active = false;
});

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
    }
});

window.addEventListener('touchend', () => {
    mouse.active = false;
});

// 8. Auto-resize Canvas on viewport adjustments
window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

// --- Mode Management ---
function updateUIForMode(isViewer) {
    if (isViewer) {
        btnBackToEdit.classList.add('hide');
        btnOpenShare.classList.add('hide');
    } else {
        btnBackToEdit.classList.remove('hide');
        btnOpenShare.classList.remove('hide');
    }
}

// --- Bootloader Init ---
window.addEventListener('DOMContentLoaded', () => {
    // Standard setup
    applyTheme('nebula');
    
    // Check if configuration already loaded via QR parameter
    const hasUrlState = parseStateFromURL();
    const urlParams = new URLSearchParams(window.location.search);
    const forceEdit = urlParams.get('edit') === 'true';
    
    if (hasUrlState) {
        // Keep configuration setup hidden, prompt user with Intro Screen
        setupInterface.classList.add('hide');
        
        // If loaded with state and without ?edit=true, enter Viewer mode (hide edit/share)
        if (forceEdit) {
            updateUIForMode(false);
        } else {
            updateUIForMode(true);
        }
    } else {
        // Welcome mode default text mapping
        textInput.value = defaultTexts.join('\n');
        updateUIForMode(false);
    }
});
