import * as THREE from 'three';

export class InteractionHandler {
    constructor(camera, scene, analyticsCollector, interactableObjects = []) {
        this.camera = camera;
        this.scene = scene;
        this.analytics = analyticsCollector;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.controllers = [];
        this.interactableObjects = interactableObjects;
        
        this.setupEventListeners();
        this.setupVRControllers();
    }
    
    setupEventListeners() {
        // Mouse/touch events for desktop
        document.addEventListener('click', (event) => this.onMouseClick(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Touch events for mobile
        document.addEventListener('touchstart', (event) => this.onTouchStart(event));
        document.addEventListener('touchmove', (event) => this.onTouchMove(event));
    }
    
    setupVRControllers() {
        // Left controller
        const leftController = this.createController(0);
        this.controllers.push(leftController);
        this.scene.add(leftController);
        
        // Right controller
        const rightController = this.createController(1);
        this.controllers.push(rightController);
        this.scene.add(rightController);
    }
    
    createController(index) {
        const controller = new THREE.Group();
        
        // Add controller model (simple geometry for now)
        const geometry = new THREE.CylinderGeometry(0.01, 0.02, 0.1, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
        const controllerMesh = new THREE.Mesh(geometry, material);
        controller.add(controllerMesh);
        
        // Add ray for pointing
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const rayMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const ray = new THREE.Line(rayGeometry, rayMaterial);
        controller.add(ray);
        
        // Add event listeners
        controller.addEventListener('selectstart', () => this.onControllerSelect(index, 'start'));
        controller.addEventListener('selectend', () => this.onControllerSelect(index, 'end'));
        controller.addEventListener('connected', (event) => this.onControllerConnected(index, event));
        
        return controller;
    }
    
    onMouseClick(event) {
        // Convert mouse coordinates to normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Perform raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects);
        
        if (intersects.length > 0) {
            const target = intersects[0];
            
            this.analytics.logEvent('mouse_click', {
                target: target.object.name || 'unknown',
                position: {
                    x: target.point.x,
                    y: target.point.y,
                    z: target.point.z
                },
                distance: target.distance,
                screenPosition: { x: event.clientX, y: event.clientY }
            });
            
            this.handleObjectInteraction(target.object, 'click');
        }
    }
    
    onMouseMove(event) {
        // Track mouse movement for hover effects
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Throttled hover detection
        if (Date.now() % 100 === 0) { // Every 100ms
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactableObjects);
            
            if (intersects.length > 0) {
                this.analytics.logEvent('hover', {
                    target: intersects[0].object.name || 'unknown',
                    position: {
                        x: intersects[0].point.x,
                        y: intersects[0].point.y,
                        z: intersects[0].point.z
                    }
                });
            }
        }
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            this.analytics.logEvent('touch_start', {
                target: 'screen',
                screenPosition: { x: touch.clientX, y: touch.clientY },
                force: touch.force || 1.0
            });
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            // Throttled touch move tracking
            if (Date.now() % 50 === 0) {
                this.analytics.logEvent('touch_move', {
                    target: 'screen',
                    screenPosition: { x: touch.clientX, y: touch.clientY },
                    force: touch.force || 1.0
                });
            }
        }
    }
    
    onControllerSelect(controllerIndex, phase) {
        const controller = this.controllers[controllerIndex];
        
        if (phase === 'start') {
            // Start raycast from controller
            const ray = new THREE.Raycaster();
            ray.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            ray.ray.direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
            
            const intersects = ray.intersectObjects(this.interactableObjects);
            
            if (intersects.length > 0) {
                const target = intersects[0];
                
                this.analytics.logEvent('vr_controller_select', {
                    target: target.object.name || 'unknown',
                    position: {
                        x: target.point.x,
                        y: target.point.y,
                        z: target.point.z
                    },
                    controllerIndex: controllerIndex,
                    distance: target.distance
                });
                
                this.handleObjectInteraction(target.object, 'vr_select');
            }
        }
    }
    
    onControllerConnected(controllerIndex, event) {
        this.analytics.logEvent('controller_connected', {
            controllerIndex: controllerIndex,
            gamepad: event.data.gamepad ? {
                id: event.data.gamepad.id,
                axes: event.data.gamepad.axes.length,
                buttons: event.data.gamepad.buttons.length
            } : null
        });
    }
    
    handleObjectInteraction(object, interactionType) {
        // Handle specific object interactions
        if (object.userData && object.userData.interactionType) {
            switch (object.userData.interactionType) {
                case 'button':
                    this.handleButtonPress(object);
                    break;
                case 'data_point':
                    this.handleDataPointSelection(object);
                    break;
                case 'property':
                    this.handlePropertySelection(object);
                    break;
                case 'menu_item':
                    this.handleMenuSelection(object);
                    break;
                default:
                    console.log('Unknown interaction type:', object.userData.interactionType);
            }
        }
    }
    
    handleButtonPress(button) {
        this.analytics.logEvent('button_press', {
            buttonId: button.name,
            buttonType: button.userData.buttonType || 'generic',
            action: button.userData.action
        });
        
        // Visual feedback
        if (button.material) {
            const originalColor = button.material.color.getHex();
            button.material.color.setHex(0x00ff00);
            
            setTimeout(() => {
                button.material.color.setHex(originalColor);
            }, 200);
        }
    }
    
    handleDataPointSelection(dataPoint) {
        this.analytics.logEvent('data_point_selected', {
            dataId: dataPoint.name,
            value: dataPoint.userData.value,
            category: dataPoint.userData.category
        });
        
        // Visual feedback for data points
        if (dataPoint.material) {
            const originalColor = dataPoint.material.color.getHex();
            dataPoint.material.color.setHex(0xffff00);
            
            setTimeout(() => {
                dataPoint.material.color.setHex(originalColor);
            }, 500);
        }
    }
    
    handlePropertySelection(property) {
        this.analytics.logEvent('property_selected', {
            propertyId: property.name,
            propertyType: property.userData.propertyType,
            price: property.userData.price,
            affordability: property.userData.affordability
        });
        
        console.log(`Property selected: ${property.userData.propertyType} - £${property.userData.price}`);
    }
    
    handleMenuSelection(menuItem) {
        this.analytics.logEvent('menu_selection', {
            menuId: menuItem.name,
            menuAction: menuItem.userData.action
        });
    }
    
    addInteractableObject(object) {
        this.interactableObjects.push(object);
    }
    
    removeInteractableObject(object) {
        const index = this.interactableObjects.indexOf(object);
        if (index > -1) {
            this.interactableObjects.splice(index, 1);
        }
    }
    
    update() {
        // Update controller positions for analytics
        this.controllers.forEach((controller, index) => {
            if (controller.visible) {
                this.analytics.logEvent('spatial_tracking', {
                    controllerIndex: index,
                    position: {
                        x: controller.position.x,
                        y: controller.position.y,
                        z: controller.position.z
                    },
                    rotation: {
                        x: controller.rotation.x,
                        y: controller.rotation.y,
                        z: controller.rotation.z
                    }
                });
            }
        });
    }
}