export class AnalyticsCollector {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.startTime = performance.now();
        this.isVRMode = false;
        
        // Initialize data structures
        this.userInteractions = [];
        this.performanceMetrics = [];
        this.spatialData = [];
        this.sessionData = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            userAgent: navigator.userAgent,
            platform: this.detectPlatform(),
            vrCapable: false,
            deviceInfo: this.getDeviceInfo()
        };
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        console.log(`🎯 VR Analytics session started: ${this.sessionId}`);
    }
    
    generateSessionId() {
        return 'vr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    detectPlatform() {
        const ua = navigator.userAgent;
        if (ua.includes('Oculus')) return 'Oculus';
        if (ua.includes('SteamVR')) return 'SteamVR';
        if (ua.includes('Mobile')) return 'Mobile';
        if (ua.includes('Mac')) return 'MacOS';
        if (ua.includes('Windows')) return 'Windows';
        return 'Unknown';
    }
    
    getDeviceInfo() {
        return {
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                pixelRatio: window.devicePixelRatio
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            memory: navigator.deviceMemory || 'unknown',
            cores: navigator.hardwareConcurrency || 'unknown',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null
        };
    }
    
    logEvent(eventType, data = {}) {
        const event = {
            sessionId: this.sessionId,
            eventType: eventType,
            timestamp: performance.now(),
            relativeTime: performance.now() - this.startTime,
            isVRMode: this.isVRMode,
            ...data
        };
        
        this.events.push(event);
        
        // Real-time event processing
        this.processEventRealTime(event);
        
        // Persist important events immediately
        if (this.isImportantEvent(eventType)) {
            this.persistEvent(event);
        }
        
        console.log(`📊 Analytics: ${eventType}`, data);
        return event;
    }
    
    logInteraction(interactionType, target, position = null, data = {}) {
        const interaction = {
            type: interactionType,
            target: target,
            position: position,
            duration: data.duration || null,
            force: data.force || null,
            timestamp: performance.now(),
            vrMode: this.isVRMode,
            ...data
        };
        
        this.logEvent('user_interaction', interaction);
        this.userInteractions.push(interaction);
        
        // Update interaction metrics
        this.updateInteractionMetrics(interaction);
        
        return interaction;
    }
    
    logSpatialData(position, rotation, scale = null, objectType = 'user') {
        const spatialEvent = {
            objectType: objectType,
            position: {
                x: Math.round(position.x * 1000) / 1000,
                y: Math.round(position.y * 1000) / 1000,
                z: Math.round(position.z * 1000) / 1000
            },
            rotation: {
                x: Math.round(rotation.x * 1000) / 1000,
                y: Math.round(rotation.y * 1000) / 1000,
                z: Math.round(rotation.z * 1000) / 1000
            },
            scale: scale ? {
                x: Math.round(scale.x * 1000) / 1000,
                y: Math.round(scale.y * 1000) / 1000,
                z: Math.round(scale.z * 1000) / 1000
            } : null,
            timestamp: performance.now()
        };
        
        this.spatialData.push(spatialEvent);
        
        // Only log spatial data periodically to avoid spam
        if (this.spatialData.length % 30 === 0) { // Every 30 frames (~0.5 second at 60fps)
            this.logEvent('spatial_tracking', {
                recentMovements: this.spatialData.slice(-30),
                movementMetrics: this.calculateMovementMetrics()
            });
        }
        
        // Keep spatial data array manageable
        if (this.spatialData.length > 1800) { // Keep last 30 seconds at 60fps
            this.spatialData = this.spatialData.slice(-1800);
        }
    }
    
    logPerformance(fps, renderTime, memoryUsage = null) {
        const performanceData = {
            fps: Math.round(fps * 10) / 10,
            renderTime: Math.round(renderTime * 100) / 100,
            memoryUsage: memoryUsage,
            timestamp: performance.now(),
            isVRMode: this.isVRMode
        };
        
        this.performanceMetrics.push(performanceData);
        
        // Log performance data every 5 seconds
        if (this.performanceMetrics.length % 300 === 0) { // Every 300 frames at 60fps
            this.logEvent('performance_metrics', {
                current: performanceData,
                averages: {
                    fps: this.calculateAverageFPS(),
                    renderTime: this.calculateAverageRenderTime(),
                    trend: this.getPerformanceTrend()
                }
            });
        }
        
        // Keep performance array manageable
        if (this.performanceMetrics.length > 1800) {
            this.performanceMetrics = this.performanceMetrics.slice(-1800);
        }
    }
    
    setVRMode(isVR) {
        const previousMode = this.isVRMode;
        this.isVRMode = isVR;
        
        this.logEvent('vr_mode_change', { 
            previousMode: previousMode,
            newMode: isVR,
            transitionTime: performance.now() - this.startTime
        });
        
        // Update session data
        this.sessionData.vrCapable = true;
        if (isVR && !this.sessionData.vrSessionStart) {
            this.sessionData.vrSessionStart = performance.now();
        }
    }
    
    calculateAverageFPS() {
        if (this.performanceMetrics.length === 0) return 0;
        
        const recent = this.performanceMetrics.slice(-300); // Last 5 seconds
        const sum = recent.reduce((acc, metric) => acc + metric.fps, 0);
        return Math.round((sum / recent.length) * 10) / 10;
    }
    
    calculateAverageRenderTime() {
        if (this.performanceMetrics.length === 0) return 0;
        
        const recent = this.performanceMetrics.slice(-300);
        const sum = recent.reduce((acc, metric) => acc + metric.renderTime, 0);
        return Math.round((sum / recent.length) * 100) / 100;
    }
    
    getPerformanceTrend() {
        if (this.performanceMetrics.length < 120) return 'insufficient_data';
        
        const recent = this.performanceMetrics.slice(-60);  // Last second
        const older = this.performanceMetrics.slice(-120, -60);  // Previous second
        
        const recentAvg = recent.reduce((acc, m) => acc + m.fps, 0) / recent.length;
        const olderAvg = older.reduce((acc, m) => acc + m.fps, 0) / older.length;
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (change > 5) return 'improving';
        if (change < -5) return 'degrading';
        return 'stable';
    }
    
    calculateMovementMetrics() {
        if (this.spatialData.length < 2) return null;
        
        const recent = this.spatialData.slice(-30);
        let totalDistance = 0;
        let maxVelocity = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const prev = recent[i - 1];
            const curr = recent[i];
            
            const distance = Math.sqrt(
                Math.pow(curr.position.x - prev.position.x, 2) +
                Math.pow(curr.position.y - prev.position.y, 2) +
                Math.pow(curr.position.z - prev.position.z, 2)
            );
            
            const timeDelta = (curr.timestamp - prev.timestamp) / 1000; // Convert to seconds
            const velocity = distance / Math.max(timeDelta, 0.001);
            
            totalDistance += distance;
            maxVelocity = Math.max(maxVelocity, velocity);
        }
        
        return {
            totalDistance: Math.round(totalDistance * 1000) / 1000,
            averageVelocity: Math.round((totalDistance / (recent.length - 1)) * 1000) / 1000,
            maxVelocity: Math.round(maxVelocity * 1000) / 1000,
            movementIntensity: this.classifyMovementIntensity(maxVelocity)
        };
    }
    
    classifyMovementIntensity(velocity) {
        if (velocity < 0.1) return 'stationary';
        if (velocity < 0.5) return 'slow';
        if (velocity < 1.0) return 'moderate';
        if (velocity < 2.0) return 'active';
        return 'rapid';
    }
    
    updateInteractionMetrics(interaction) {
        // Update interaction frequency
        if (!this.sessionData.interactionMetrics) {
            this.sessionData.interactionMetrics = {
                totalInteractions: 0,
                interactionTypes: {},
                averageTimeBetweenInteractions: 0,
                lastInteractionTime: null
            };
        }
        
        const metrics = this.sessionData.interactionMetrics;
        metrics.totalInteractions++;
        
        // Update interaction type counts
        if (!metrics.interactionTypes[interaction.type]) {
            metrics.interactionTypes[interaction.type] = 0;
        }
        metrics.interactionTypes[interaction.type]++;
        
        // Update timing metrics
        if (metrics.lastInteractionTime) {
            const timeSinceLastInteraction = interaction.timestamp - metrics.lastInteractionTime;
            metrics.averageTimeBetweenInteractions = 
                (metrics.averageTimeBetweenInteractions * (metrics.totalInteractions - 1) + 
                 timeSinceLastInteraction) / metrics.totalInteractions;
        }
        metrics.lastInteractionTime = interaction.timestamp;
    }
    
    processEventRealTime(event) {
        // Real-time event processing for immediate insights
        switch (event.eventType) {
            case 'user_interaction':
                this.processInteractionEvent(event);
                break;
            case 'performance_metrics':
                this.processPerformanceEvent(event);
                break;
            case 'vr_mode_change':
                this.processVRModeChange(event);
                break;
        }
    }
    
    processInteractionEvent(event) {
        // Check for interaction patterns
        const recentInteractions = this.userInteractions.slice(-5);
        
        if (recentInteractions.length >= 3) {
            const avgTimeBetween = recentInteractions.reduce((sum, interaction, i) => {
                if (i === 0) return 0;
                return sum + (interaction.timestamp - recentInteractions[i-1].timestamp);
            }, 0) / (recentInteractions.length - 1);
            
            if (avgTimeBetween < 500) { // Less than 500ms between interactions
                this.logEvent('rapid_interaction_detected', {
                    pattern: 'high_frequency',
                    averageInterval: avgTimeBetween,
                    interactionCount: recentInteractions.length
                });
            }
        }
    }
    
    processPerformanceEvent(event) {
        // Performance issue detection
        if (event.current && event.current.fps < 30) {
            this.logEvent('performance_warning', {
                type: 'low_fps',
                fps: event.current.fps,
                severity: event.current.fps < 15 ? 'critical' : 'warning'
            });
        }
        
        if (event.current && event.current.renderTime > 16.67) { // Over 16.67ms = under 60fps
            this.logEvent('performance_warning', {
                type: 'high_render_time',
                renderTime: event.current.renderTime,
                severity: event.current.renderTime > 33.33 ? 'critical' : 'warning'
            });
        }
    }
    
    processVRModeChange(event) {
        // VR mode transition analytics
        if (event.newMode) {
            this.logEvent('vr_experience_start', {
                timeToVR: event.transitionTime,
                platform: this.sessionData.platform
            });
        } else {
            const vrDuration = performance.now() - (this.sessionData.vrSessionStart || this.startTime);
            this.logEvent('vr_experience_end', {
                vrDuration: vrDuration,
                totalSessionTime: event.transitionTime
            });
        }
    }
    
    isImportantEvent(eventType) {
        const importantEvents = [
            'session_start', 'session_end', 'vr_mode_change', 
            'performance_warning', 'error', 'task_completion'
        ];
        return importantEvents.includes(eventType);
    }
    
    persistEvent(event) {
        try {
            const stored = localStorage.getItem('vr_analytics_events') || '[]';
            const events = JSON.parse(stored);
            events.push(event);
            
            // Keep only last 1000 events to prevent storage overflow
            if (events.length > 1000) {
                events.splice(0, events.length - 1000);
            }
            
            localStorage.setItem('vr_analytics_events', JSON.stringify(events));
        } catch (error) {
            console.warn('Failed to persist analytics event:', error);
        }
    }
    
    startPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) { // Every second
                const fps = (frameCount * 1000) / (currentTime - lastTime);
                const renderTime = (currentTime - lastTime) / frameCount;
                
                this.logPerformance(fps, renderTime);
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    getSessionSummary() {
        const currentTime = performance.now();
        const sessionDuration = currentTime - this.startTime;
        
        return {
            sessionId: this.sessionId,
            duration: sessionDuration,
            totalEvents: this.events.length,
            totalInteractions: this.userInteractions.length,
            averageFPS: this.calculateAverageFPS(),
            vrModeUsed: this.events.some(e => e.eventType === 'vr_session_start'),
            interactionTypes: [...new Set(this.userInteractions.map(i => i.type))],
            performanceTrend: this.getPerformanceTrend(),
            sessionData: this.sessionData,
            movementMetrics: this.calculateMovementMetrics(),
            performanceMetrics: {
                averageFPS: this.calculateAverageFPS(),
                averageRenderTime: this.calculateAverageRenderTime(),
                performanceWarnings: this.events.filter(e => e.eventType === 'performance_warning').length
            }
        };
    }
    
    exportData() {
        return {
            sessionSummary: this.getSessionSummary(),
            events: this.events,
            interactions: this.userInteractions,
            spatialData: this.spatialData.slice(-1000), // Last 1000 spatial points
            performanceMetrics: this.performanceMetrics.slice(-1000),
            deviceInfo: this.sessionData.deviceInfo,
            exportTimestamp: performance.now()
        };
    }
    
    // Business analytics methods
    calculateEngagementScore() {
        const summary = this.getSessionSummary();
        const duration = summary.duration / 1000; // Convert to seconds
        
        // Engagement factors
        const durationScore = Math.min(duration / 300, 1) * 30; // Max 30 points for 5+ minutes
        const interactionScore = Math.min(summary.totalInteractions / 50, 1) * 30; // Max 30 points for 50+ interactions
        const vrScore = summary.vrModeUsed ? 25 : 0; // 25 points for using VR
        const performanceScore = summary.averageFPS > 45 ? 15 : (summary.averageFPS > 30 ? 10 : 5); // Performance bonus
        
        return Math.round(durationScore + interactionScore + vrScore + performanceScore);
    }
    
    getRecommendations() {
        const recommendations = [];
        const summary = this.getSessionSummary();
        
        if (summary.averageFPS < 30) {
            recommendations.push('Consider reducing graphics quality for better performance');
        }
        
        if (summary.totalInteractions < 10) {
            recommendations.push('Add more interactive elements to increase engagement');
        }
        
        if (!summary.vrModeUsed && this.sessionData.vrCapable) {
            recommendations.push('Encourage VR mode usage for enhanced experience');
        }
        
        const movementMetrics = this.calculateMovementMetrics();
        if (movementMetrics && movementMetrics.movementIntensity === 'stationary') {
            recommendations.push('Add movement-encouraging elements to reduce motion sickness');
        }
        
        return recommendations;
    }
}