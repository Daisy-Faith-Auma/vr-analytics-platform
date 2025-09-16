// Jest setup file
import 'jest-canvas-mock';

// Mock WebXR APIs
global.navigator.xr = {
    isSessionSupported: jest.fn().mockResolvedValue(false),
    requestSession: jest.fn().mockRejectedValue(new Error('VR not available in test environment'))
};

// Mock WebGL context
const mockWebGLContext = {
    getExtension: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    drawArrays: jest.fn(),
    viewport: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockWebGLContext;
    }
    return null;
});