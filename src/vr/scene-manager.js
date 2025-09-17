import * as THREE from 'three';

export class SceneManager {
    constructor(scene, analyticsCollector) {
        this.scene = scene;
        this.analytics = analyticsCollector;
        this.interactiveObjects = [];
        this.clock = new THREE.Clock();
        this.initializeScene();
    }
    
    initializeScene() {
        console.log('Initializing VR scene...');
        this.createGround();
        this.createPropertyModels();
        this.createDataVisualization();
        this.createUserInterface();
        
        this.analytics.logEvent('scene_initialized', {
            objectCount: this.scene.children.length
        });
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90, 
            transparent: true, 
            opacity: 0.8 
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.name = 'ground';
        
        this.scene.add(ground);
    }
    
    createPropertyModels() {
        const propertyTypes = [
            { type: 'house', color: 0x8B4513, price: 350000 },
            { type: 'apartment', color: 0x4169E1, price: 250000 },
            { type: 'flat', color: 0x32CD32, price: 180000 }
        ];
        
        propertyTypes.forEach((propData, index) => {
            const property = this.createProperty(propData, index);
            this.interactiveObjects.push(property);
        });
    }
    
    createProperty(propertyData, index) {
        const group = new THREE.Group();
        
        const baseGeometry = new THREE.BoxGeometry(2, 2, 2);
        const roofGeometry = new THREE.ConeGeometry(1.5, 1, 4);
        
        const baseMaterial = new THREE.MeshLambertMaterial({ color: propertyData.color });
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        
        base.position.y = 1;
        roof.position.y = 2.5;
        roof.rotation.y = Math.PI / 4;
        
        group.add(base);
        group.add(roof);
        group.position.x = (index - 1) * 5;
        group.position.z = -5;
        
        group.userData = {
            interactionType: 'property',
            propertyType: propertyData.type,
            price: propertyData.price,
            value: propertyData.price
        };
        
        group.name = `property_${propertyData.type}`;
        this.scene.add(group);
        
        return group;
    }
    
    createDataVisualization() {
        const ratios = [4.5, 7.2, 9.8, 12.1, 6.3];
        const colors = [0x90EE90, 0xFFD700, 0xFF8C00, 0xDC143C, 0x4169E1];
        
        ratios.forEach((ratio, index) => {
            const height = ratio * 0.5;
            const barGeometry = new THREE.BoxGeometry(0.8, height, 0.8);
            const barMaterial = new THREE.MeshLambertMaterial({ color: colors[index] });
            
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.set((index - 2) * 2, height / 2, 3);
            
            bar.userData = {
                interactionType: 'data_point',
                value: ratio,
                category: 'price_to_earnings_ratio'
            };
            
            bar.name = `data_bar_${index}`;
            this.scene.add(bar);
            this.interactiveObjects.push(bar);
        });
    }
    
    createUserInterface() {
        const buttons = [
            { text: 'View All', action: 'show_all', color: 0x4CAF50 },
            { text: 'Crisis Only', action: 'show_crisis', color: 0xF44336 },
            { text: 'Analytics', action: 'show_analytics', color: 0x2196F3 }
        ];
        
        buttons.forEach((buttonData, index) => {
            const button = this.createButton(buttonData, index);
            this.interactiveObjects.push(button);
        });
    }
    
    createButton(buttonData, index) {
        const buttonGeometry = new THREE.BoxGeometry(2, 0.5, 0.2);
        const buttonMaterial = new THREE.MeshLambertMaterial({ color: buttonData.color });
        
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set((index - 1) * 3, 1.5, 8);
        
        button.userData = {
            interactionType: 'button',
            buttonType: 'menu',
            action: buttonData.action
        };
        
        button.name = `button_${buttonData.action}`;
        this.scene.add(button);
        
        return button;
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        this.scene.traverse((child) => {
            if (child.name.startsWith('data_bar_')) {
                child.rotation.y += 0.005;
            }
        });
    }
    
    getInteractableObjects() {
        return this.interactiveObjects;
    }
}