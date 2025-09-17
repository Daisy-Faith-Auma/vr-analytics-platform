import * as THREE from 'three';
import { AnalyticsCollector } from './analytics/analytics-collector.js';
import { SceneManager } from './vr/scene-manager.js';
import { InteractionHandler } from './vr/interaction-handler.js';

class VRAnalyticsPlatform {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.analyticsCollector = null;
        this.sceneManager = null;
        this.interactionHandler = null;
        
        this.init();
    }
    
    init() {
        console.log('Initializing VR Analytics Platform...');
        
        // Initialize core components
        this.initializeThreeJS();
        this.analyticsCollector = new AnalyticsCollector();
        this.sceneManager = new SceneManager(this.scene, this.analyticsCollector);
        this.interactionHandler = new InteractionHandler(
            this.camera, 
            this.scene, 
            this.analyticsCollector,
            this.sceneManager.getInteractableObjects()
        );
        
        // Setup VR
        this.initializeVR();
        
        // Start animation loop
        this.animate();
        
        // Log session start
        this.analyticsCollector.logEvent('session_start', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
    
    initializeThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 1.6, 3);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.xr.enabled = true;
        
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
    }
    
    initializeVR() {
        // Check for WebXR support
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    const vrButton = this.createVRButton();
                    document.body.appendChild(vrButton);
                } else {
                    console.log('VR not supported, running in desktop mode');
                    this.setupDesktopControls();
                }
            });
        } else {
            console.log('WebXR not available, running in desktop mode');
            this.setupDesktopControls();
        }
    }
    
    createVRButton() {
        const button = document.createElement('button');
        button.innerHTML = 'Enter VR';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.left = '50%';
        button.style.transform = 'translateX(-50%)';
        button.style.padding = '12px 20px';
        button.style.fontSize = '16px';
        button.style.backgroundColor = '#1976d2';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', () => {
            this.renderer.xr.getSession() ? 
                this.exitVR() : 
                this.enterVR();
        });
        
        return button;
    }
    
    setupDesktopControls() {
        // Basic mouse controls for desktop testing
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.camera.rotation.y = mouseX * 0.5;
            this.camera.rotation.x = mouseY * 0.3;
        });
        
        // Log desktop interaction
        this.analyticsCollector.logEvent('desktop_mode_enabled', {
            timestamp: Date.now()
        });
    }
    
    async enterVR() {
        try {
            const session = await navigator.xr.requestSession('immersive-vr');
            await this.renderer.xr.setSession(session);
            
            this.analyticsCollector.logEvent('vr_session_start', {
                timestamp: Date.now(),
                sessionType: 'immersive-vr'
            });
        } catch (error) {
            console.error('Failed to enter VR:', error);
        }
    }
    
    exitVR() {
        this.renderer.xr.getSession().end();
        
        this.analyticsCollector.logEvent('vr_session_end', {
            timestamp: Date.now()
        });
    }
    
    animate() {
        this.renderer.setAnimationLoop(() => {
            // Update scene manager
            if (this.sceneManager) {
                this.sceneManager.update();
            }
            
            // Update interaction handler
            if (this.interactionHandler) {
                this.interactionHandler.update();
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        });
    }
    
    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const vrPlatform = new VRAnalyticsPlatform();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        vrPlatform.onWindowResize();
    });
});