const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class VRAnalyticsServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3001;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }
    
    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use('/dist', express.static(path.join(__dirname, '../dist')));
        
        // Parse JSON bodies
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS middleware
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // API routes
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        
        // Analytics endpoint
        this.app.post('/api/analytics', (req, res) => {
            const { events, sessionId } = req.body;
            
            // In a real application, you would store this in a database
            console.log(`Analytics data received for session: ${sessionId}`);
            console.log(`Number of events: ${events ? events.length : 0}`);
            
            res.json({ 
                success: true, 
                message: 'Analytics data received',
                eventsProcessed: events ? events.length : 0
            });
        });
        
        // Serve the main application
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
        
        // Catch-all route for SPA
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            // Handle real-time analytics events
            socket.on('analytics-event', (data) => {
                console.log('Analytics event received:', data.eventType);
                
                // Broadcast to other clients (for collaborative features)
                socket.broadcast.emit('analytics-broadcast', data);
            });
            
            // Handle VR session events
            socket.on('vr-session-start', (data) => {
                console.log('VR session started:', socket.id);
                socket.broadcast.emit('user-entered-vr', { userId: socket.id });
            });
            
            socket.on('vr-session-end', (data) => {
                console.log('VR session ended:', socket.id);
                socket.broadcast.emit('user-exited-vr', { userId: socket.id });
            });
            
            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`VR Analytics Server running on port ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/api/health`);
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new VRAnalyticsServer();
    server.start();
}

module.exports = VRAnalyticsServer;