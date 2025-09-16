// Main application entry point
console.log('VR Analytics Platform initializing...');

// Import required modules
import * as THREE from 'three';
import { AnalyticsCollector } from './analytics/analytics-collector.js';

class VRAnalyticsPlatform {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isVRSupported = false;
        this.analyticsCollector = null;
        
        // Interactive objects for analytics testing
        this.interactableObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    async init() {
        console.log('Initializing VR Analytics Platform...');
        
        // Initialize analytics first
        this.analyticsCollector = new AnalyticsCollector();
        
        // Hide loading screen after short delay
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }, 2000);
        
        // Initialize Three.js
        this.initializeThreeJS();
        
        // Check VR support
        await this.checkVRSupport();
        
        // Setup interactions
        this.setupInteractions();
        
        // Start render loop
        this.animate();
        
        console.log('VR Analytics Platform initialized successfully');
        this.analyticsCollector.logEvent('platform_initialized', {
            vrSupported: this.isVRSupported,
            interactableObjects: this.interactableObjects.length
        });
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
            powerPreference: "high-performance"
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
        this.createAnalyticsScene();
        
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
    
    createAnalyticsScene() {
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
        
        // Create interactive data visualization elements
        this.createDataVisualizationObjects();
        
        // Create analytics dashboard in 3D space
        this.createAnalyticsDashboard();
    }
    
    createDataVisualizationObjects() {
        // Create interactive data points representing analytics metrics
        const dataPoints = [
            { label: 'User Sessions', value: 1250, color: 0xff4757, position: [-3, 1, -2] },
            { label: 'Engagement Rate', value: 78, color: 0x2ed573, position: [-1, 1, -2] },
            { label: 'VR Adoption', value: 45, color: 0x1e90ff, position: [1, 1, -2] },
            { label: 'Performance Score', value: 92, color: 0xffa502, position: [3, 1, -2] },
            { label: 'Conversion Rate', value: 34, color: 0x8b5cf6, position: [0, 2.5, -2] }
        ];
        
        dataPoints.forEach((dataPoint, index) => {
            // Create 3D bar chart representation
            const height = (dataPoint.value / 100) * 2; // Scale height based on value
            const geometry = new THREE.BoxGeometry(0.3, height, 0.3);
            const material = new THREE.MeshPhongMaterial({ 
                color: dataPoint.color,
                transparent: true,
                opacity: 0.8
            });
            const bar = new THREE.Mesh(geometry, material);
            
            bar.position.set(dataPoint.position[0], height/2, dataPoint.position[2]);
            bar.castShadow = true;
            bar.receiveShadow = true;
            
            // Add analytics metadata
            bar.userData = {
                type: 'data_visualization',
                id: `data_point_${index}`,
                label: dataPoint.label,
                value: dataPoint.value,
                interactable: true,
                analyticsData: dataPoint
            };
            
            // Add text label
            this.addTextLabel(dataPoint.label, dataPoint.value, 
                             [dataPoint.position[0], height + 0.5, dataPoint.position[2]]);
            
            this.scene.add(bar);
            this.interactableObjects.push(bar);
        });
    }
    
    addTextLabel(text, value, position) {
        // Create text using canvas texture (simplified approach)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width/2, 40);
        context.font = '32px Arial';
        context.fillText(value.toString(), canvas.width/2, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 0.5, 1);
        sprite.position.set(position[0], position[1], position[2]);
        
        this.scene.add(sprite);
    }
    
    createAnalyticsDashboard() {
        // Create floating analytics panel
        const panelGeometry = new THREE.PlaneGeometry(3, 2);
        const panelMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(-5, 2, 0);
        panel.lookAt(this.camera.position);
        
        // Add border
        const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a90e2, linewidth: 2 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        panel.add(border);
        
        panel.userData = {
            type: 'analytics_dashboard',
            id: 'main_dashboard',
            interactable: true
        };
        
        this.scene.add(panel);
        this.interactableObjects.push(panel);
        
        // Add dashboard title
        this.addTextLabel('VR Analytics Dashboard', 'Live Data', [-5, 3, 0]);
    }
    
    setupInteractions() {
        // Mouse interactions for desktop
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });
        
        // Touch interactions for mobile
        this.renderer.domElement.addEventListener('touchstart', (event) => {
            this.handleTouch(event);
        });
    }
    
    handleClick(event) {
        // Convert mouse coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Perform raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects);
        
        if (intersects.length > 0) {
            const target = intersects[0];
            
            // Log interaction with analytics
            this.analyticsCollector.logInteraction('click', target.object.userData.id, {
                x: target.point.x,
                y: target.point.y,
                z: target.point.z
            }, {
                distance: target.distance,
                screenPosition: { x: event.clientX, y: event.clientY },
                objectType: target.object.userData.type,
                objectLabel: target.object.userData.label
            });
            
            // Handle specific object interactions
            this.handleObjectInteraction(target.object, 'click');
        } else {
            // Log missed click
            this.analyticsCollector.logInteraction('click_miss', 'empty_space', {
                x: event.clientX,
                y: event.clientY,
                z: 0
            });
        }
    }
    
    handleMouseMove(event) {
        // Update mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Occasional hover tracking (throttled)
        if (Math.random() < 0.1) { // 10% of mouse moves
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactableObjects);
            
            if (intersects.length > 0) {
                this.analyticsCollector.logInteraction('hover', intersects[0].object.userData.id, {
                    x: intersects[0].point.x,
                    y: intersects[0].point.y,
                    z: intersects[0].point.z
                });
            }
        }
    }
    
    handleTouch(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            this.analyticsCollector.logInteraction('touch', 'screen', null, {
                screenPosition: { x: touch.clientX, y: touch.clientY },
                force: touch.force || 1.0,
                touchType: 'single'
            });
        } else if (event.touches.length === 2) {
            this.analyticsCollector.logInteraction('touch', 'screen', null, {
                touchType: 'multi',
                touchCount: event.touches.length
            });
        }
    }
    
    handleObjectInteraction(object, interactionType) {
        const userData = object.userData;
        
        // Visual feedback
        this.provideInteractionFeedback(object);
        
        // Handle different object types
        switch (userData.type) {
            case 'data_visualization':
                this.handleDataPointInteraction(object, interactionType);
                break;
            case 'analytics_dashboard':
                this.handleDashboardInteraction(object, interactionType);
                break;
            default:
                console.log('Unknown object type:', userData.type);
        }
        
        // Log business event
        this.analyticsCollector.logEvent('object_interaction', {
            objectType: userData.type,
            objectId: userData.id,
            interactionType: interactionType,
            objectData: userData.analyticsData || null
        });
    }
    
    handleDataPointInteraction(object, interactionType) {
        const data = object.userData.analyticsData;
        
        // Animate the object
        const originalScale = object.scale.clone();
        object.scale.multiplyScalar(1.2);
        
        setTimeout(() => {
            object.scale.copy(originalScale);
        }, 300);
        
        // Log specific data point interaction
        this.analyticsCollector.logEvent('data_point_selected', {
            dataLabel: data.label,
            dataValue: data.value,
            selectionMethod: interactionType
        });
        
        // Update info display
        this.updateInfoDisplay(`Selected: ${data.label} - Value: ${data.value}`);
    }
    
    handleDashboardInteraction(object, interactionType) {
        // Toggle dashboard detailed view
        this.analyticsCollector.logEvent('dashboard_accessed', {
            method: interactionType,
            timestamp: performance.now()
        });
        
        // Show analytics summary
        this.showAnalyticsSummary();
    }
    
    provideInteractionFeedback(object) {
        // Color change feedback
        const originalColor = object.material.color.getHex();
        object.material.color.setHex(0x00ff00);
        
        setTimeout(() => {
            object.material.color.setHex(originalColor);
        }, 200);
        
        // Scale animation
        const originalScale = object.scale.clone();
        object.scale.multiplyScalar(1.1);
        
        setTimeout(() => {
            object.scale.copy(originalScale);
        }, 200);
    }
    
    updateInfoDisplay(message) {
        const infoElement = document.getElementById('info');
        if (infoElement) {
            const messageElement = infoElement.querySelector('.interaction-message') || 
                                  (() => {
                                      const msg = document.createElement('p');
                                      msg.className = 'interaction-message';
                                      infoElement.appendChild(msg);
                                      return msg;
                                  })();
            messageElement.textContent = message;
            messageElement.style.color = '#4a90e2';
            messageElement.style.fontWeight = 'bold';
            
            setTimeout(() => {
                messageElement.style.color = '#ffffff';
                messageElement.style.fontWeight = 'normal';
            }, 2000);
        }
    }
    
    showAnalyticsSummary() {
        const summary = this.analyticsCollector.getSessionSummary();
        const recommendations = this.analyticsCollector.getRecommendations();
        
        console.log('📊 Session Summary:', summary);
        console.log('💡 Recommendations:', recommendations);
        
        // Update info display with summary
        const summaryText = `Session: ${Math.round(summary.duration/1000)}s, ` +
                          `Interactions: ${summary.totalInteractions}, ` +
                          `FPS: ${summary.averageFPS}, ` +
                          `Engagement: ${this.analyticsCollector.calculateEngagementScore()}%`;
        
        this.updateInfoDisplay(summaryText);
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
            
            this.analyticsCollector.logInteraction('camera_control_start', 'mouse_drag', {
                x: event.clientX,
                y: event.clientY
            });
        });
        
        document.addEventListener('mouseup', () => {
            if (isMouseDown) {
                this.analyticsCollector.logInteraction('camera_control_end', 'mouse_drag');
            }
            isMouseDown = false;
        });
        
        // Keyboard controls
        const keys = {};
        document.addEventListener('keydown', (event) => {
            if (!keys[event.key]) {
                keys[event.key] = true;
                this.analyticsCollector.logInteraction('key_press', event.key);
            }
        });
        
        document.addEventListener('keyup', (event) => {
            keys[event.key] = false;
        });
        
        // Movement with WASD
        const handleKeyboardMovement = () => {
            const speed = 0.1;
            let moved = false;
            
            if (keys['w'] || keys['W']) {
                this.camera.position.z -= speed;
                moved = true;
            }
            if (keys['s'] || keys['S']) {
                this.camera.position.z += speed;
                moved = true;
            }
            if (keys['a'] || keys['A']) {
                this.camera.position.x -= speed;
                moved = true;
            }
            if (keys['d'] || keys['D']) {
                this.camera.position.x += speed;
                moved = true;
            }
            
            if (moved) {
                // Log spatial data for user movement
                this.analyticsCollector.logSpatialData(
                    this.camera.position,
                    this.camera.rotation,
                    null,
                    'camera'
                );
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
                    this.analyticsCollector.logEvent('vr_support_detected', {
                        supported: true
                    });
                } else {
                    console.log('VR not supported on this device');
                    this.analyticsCollector.logEvent('vr_support_detected', {
                        supported: false,
                        reason: 'not_supported'
                    });
                }
            } catch (error) {
                console.log('Error checking VR support:', error);
                this.isVRSupported = false;
                this.analyticsCollector.logEvent('vr_support_error', {
                    error: error.message
                });
            }
        } else {
            console.log('WebXR not available');
            this.analyticsCollector.logEvent('vr_support_detected', {
                supported: false,
                reason: 'webxr_not_available'
            });
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
            this.analyticsCollector.logEvent('vr_entry_attempt');
            
            const session = await navigator.xr.requestSession('immersive-vr');
            await this.renderer.xr.setSession(session);
            
            this.analyticsCollector.setVRMode(true);
            this.analyticsCollector.logEvent('vr_session_started', {
                timestamp: performance.now()
            });
            
            session.addEventListener('end', () => {
                this.onVRSessionEnd();
            });
            
            if (this.vrButton) {
                this.vrButton.innerHTML = 'Exit VR';
            }
            
            console.log('VR session started');
        } catch (error) {
            console.error('Failed to enter VR:', error);
            this.analyticsCollector.logEvent('vr_entry_failed', {
                error: error.message
            });
        }
    }
    
    exitVR() {
        if (this.renderer.xr.getSession()) {
            this.renderer.xr.getSession().end();
        }
    }
    
    onVRSessionEnd() {
        this.analyticsCollector.setVRMode(false);
        this.analyticsCollector.logEvent('vr_session_ended', {
            timestamp: performance.now()
        });
        
        if (this.vrButton) {
            this.vrButton.innerHTML = 'Enter VR';
        }
        console.log('VR session ended');
    }
    
    animate() {
        this.renderer.setAnimationLoop(() => {
            const startTime = performance.now();
            
            // Handle keyboard movement
            if (this.keyboardHandler) {
                this.keyboardHandler();
            }
            
            // Animate scene objects
            this.animateScene();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            // Update FPS counter
            this.updateFPSCounter();
            
            // Log performance data (handled by AnalyticsCollector)
            if (this.analyticsCollector) {
                // FPS is calculated by AnalyticsCollector's built-in monitoring
                // We just need to pass render time
                this.analyticsCollector.logPerformance(60, renderTime); // Approximate FPS
            }
        });
    }
    
    animateScene() {
        // Animate data visualization objects
        this.scene.children.forEach(child => {
            if (child.userData.type === 'data_visualization') {
                // Gentle floating animation
                child.position.y += Math.sin(Date.now() * 0.001 + child.position.x) * 0.002;
                
                // Gentle rotation
                child.rotation.y += 0.005;
            }
        });
        
        // Animate analytics dashboard
        const dashboard = this.scene.children.find(child => 
            child.userData.type === 'analytics_dashboard'
        );
        if (dashboard) {
            // Make dashboard always face camera (billboard effect)
            dashboard.lookAt(this.camera.position);
        }
    }
    
    updateFPSCounter() {
        // This is handled by the analytics collector, but we can update UI
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement && this.analyticsCollector) {
            const fps = this.analyticsCollector.calculateAverageFPS();
            fpsElement.textContent = `FPS: ${fps}`;
            
            // Color code based on performance
            if (fps >= 45) {
                fpsElement.style.color = '#00ff00'; // Green
            } else if (fps >= 30) {
                fpsElement.style.color = '#ffff00'; // Yellow
            } else {
                fpsElement.style.color = '#ff0000'; // Red
            }
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Log resize event
        if (this.analyticsCollector) {
            this.analyticsCollector.logEvent('window_resize', {
                newSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                devicePixelRatio: window.devicePixelRatio
            });
        }
    }
    
    // Cleanup method for session end
    cleanup() {
        if (this.analyticsCollector) {
            this.analyticsCollector.logEvent('session_cleanup');
            
            // Export final analytics data
            const finalData = this.analyticsCollector.exportData();
            console.log('📊 Final Analytics Data:', finalData);
            
            // In a real application, you would send this data to your server
            // For demo purposes, we'll store it locally
            localStorage.setItem('vr_session_final_data', JSON.stringify(finalData));
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vrPlatform = new VRAnalyticsPlatform();
    
    // Handle page visibility changes for performance optimization
    document.addEventListener('visibilitychange', () => {
        if (window.vrPlatform && window.vrPlatform.analyticsCollector) {
            if (document.hidden) {
                window.vrPlatform.analyticsCollector.logEvent('page_hidden');
            } else {
                window.vrPlatform.analyticsCollector.logEvent('page_visible');
            }
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (window.vrPlatform) {
            window.vrPlatform.cleanup();
        }
    });
});

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.vrPlatform && window.vrPlatform.analyticsCollector) {
        window.vrPlatform.analyticsCollector.logEvent('javascript_error', {
            message: event.error.message,
            filename: event.filename,
            lineNumber: event.lineno,
            stack: event.error.stack
        });
    }
});

// WebXR error handling
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.vrPlatform && window.vrPlatform.analyticsCollector) {
        window.vrPlatform.analyticsCollector.logEvent('promise_rejection', {
            reason: event.reason.toString()
        });
    }
});