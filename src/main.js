// Main application entry point
console.log('VR Analytics Platform initializing...');

// Import required modules
import * as THREE from 'three';

// Import custom modules (will be created in following days)
// import { AnalyticsCollector } from './analytics/analytics-collector.js';
// import { SceneManager } from './vr/scene-manager.js';
// import { InteractionHandler } from './vr/interaction-handler.js';

class VRAnalyticsPlatform {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isVRSupported = false;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        this.init();
    }
    
    async init() {
        console.log('Initializing VR Analytics Platform...');
        
        // Hide loading screen after short delay
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }, 2000);
        
        // Initialize Three.js
        this.initializeThreeJS();
        
        // Check VR support
        await this.checkVRSupport();
        
        // Start render loop
        this.animate();
        
        console.log('VR Analytics Platform initialized successfully');
    }
    
    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 1.6, 3);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to DOM
        document.body.appendChild(this.renderer.domElement);
        
        // Add basic lighting
        this.setupLighting();
        
        // Add basic scene content
        this.createBasicScene();
        
        // Setup controls for desktop
        this.setupDesktopControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);
        
        // Point light for dynamic lighting
        const pointLight = new THREE.PointLight(0x4a90e2, 1, 100);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);
    }
    
    createBasicScene() {
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create some basic geometric shapes for testing
        this.createTestObjects();
        
        // Create analytics visualization placeholder
        this.createAnalyticsVisualization();
    }
    
    createTestObjects() {
        // Create test cubes with different colors
        const colors = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0x8b5cf6];
        
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshPhongMaterial({ 
                color: colors[i % colors.length] 
            });
            const cube = new THREE.Mesh(geometry, material);
            
            cube.position.set(
                (i - 2) * 1.5, 
                0.25, 
                -2
            );
            cube.castShadow = true;
            cube.receiveShadow = true;
            
            // Add user data for analytics
            cube.userData = {
                type: 'test_object',
                id: `cube_${i}`,
                interactable: true
            };
            
            this.scene.add(cube);
        }
    }
    
    createAnalyticsVisualization() {
        // Create a floating panel for analytics display
        const panelGeometry = new THREE.PlaneGeometry(2, 1);
        const panelMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 2, -1);
        
        // Add border
        const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a90e2 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        panel.add(border);
        
        panel.userData = {
            type: 'analytics_panel',
            id: 'main_panel'
        };
        
        this.scene.add(panel);
    }
    
    setupDesktopControls() {
        let mouseX = 0;
        let mouseY = 0;
        let isMouseDown = false;
        
        document.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;
            
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            this.camera.rotation.y -= deltaX * 0.005;
            this.camera.rotation.x -= deltaY * 0.005;
            
            // Limit vertical rotation
            this.camera.rotation.x = Math.max(
                -Math.PI / 2, 
                Math.min(Math.PI / 2, this.camera.rotation.x)
            );
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        // Keyboard controls
        const keys = {};
        document.addEventListener('keydown', (event) => {
            keys[event.key] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            keys[event.key] = false;
        });
        
        // Movement with WASD
        const handleKeyboardMovement = () => {
            const speed = 0.1;
            
            if (keys['w'] || keys['W']) {
                this.camera.position.z -= speed;
            }
            if (keys['s'] || keys['S']) {
                this.camera.position.z += speed;
            }
            if (keys['a'] || keys['A']) {
                this.camera.position.x -= speed;
            }
            if (keys['d'] || keys['D']) {
                this.camera.position.x += speed;
            }
        };
        
        // Add to render loop
        this.keyboardHandler = handleKeyboardMovement;
    }
    
    async checkVRSupport() {
        if ('xr' in navigator) {
            try {
                this.isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (this.isVRSupported) {
                    this.createVRButton();
                    console.log('VR support detected');
                } else {
                    console.log('VR not supported on this device');
                }
            } catch (error) {
                console.log('Error checking VR support:', error);
                this.isVRSupported = false;
            }
        } else {
            console.log('WebXR not available');
            this.isVRSupported = false;
        }
    }
    
    createVRButton() {
        const button = document.createElement('button');
        button.innerHTML = this.renderer.xr.isPresenting ? 'Exit VR' : 'Enter VR';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.left = '50%';
        button.style.transform = 'translateX(-50%)';
        button.style.padding = '12px 20px';
        button.style.fontSize = '16px';
        button.style.backgroundColor = '#4a90e2';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        
        button.addEventListener('click', () => {
            if (this.renderer.xr.isPresenting) {
                this.exitVR();
            } else {
                this.enterVR();
            }
        });
        
        document.body.appendChild(button);
        this.vrButton = button;
    }
    
    async enterVR() {
        try {
            const session = await navigator.xr.requestSession('immersive-vr');
            await this.renderer.xr.setSession(session);
            
            session.addEventListener('end', () => {
                this.onVRSessionEnd();
            });
            
            console.log('VR session started');
        } catch (error) {
            console.error('Failed to enter VR:', error);
        }
    }
    
    exitVR() {
        if (this.renderer.xr.getSession()) {
            this.renderer.xr.getSession().end();
        }
    }
    
    onVRSessionEnd() {
        if (this.vrButton) {
            this.vrButton.innerHTML = 'Enter VR';
        }
        console.log('VR session ended');
    }
    
    updateFPSCounter() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${fps}`;
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    animate() {
        this.renderer.setAnimationLoop(() => {
            // Handle keyboard movement
            if (this.keyboardHandler) {
                this.keyboardHandler();
            }
            
            // Update FPS counter
            this.updateFPSCounter();
            
            // Animate test objects
            this.scene.children.forEach(child => {
                if (child.userData.type === 'test_object') {
                    child.rotation.y += 0.01;
                    child.rotation.x += 0.005;
                }
            });
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vrPlatform = new VRAnalyticsPlatform();
});

// Handle page visibility changes for performance optimization
document.addEventListener('visibilitychange', () => {
    if (window.vrPlatform) {
        if (document.hidden) {
            console.log('Page hidden - pausing analytics');
        } else {
            console.log('Page visible - resuming analytics');
        }
    }
});

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// WebXR error handling
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});