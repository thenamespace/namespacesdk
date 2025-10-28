// Test setup file
// This file is run before each test file

// Mock global objects that might not be available in Node.js test environment
global.FormData = class FormData {
  private data: Map<string, any> = new Map();
  
  append(name: string, value: any, filename?: string) {
    this.data.set(name, { value, filename });
  }
  
  get(name: string) {
    return this.data.get(name)?.value;
  }
  
  has(name: string) {
    return this.data.has(name);
  }
  
  delete(name: string) {
    this.data.delete(name);
  }
  
  entries() {
    return this.data.entries();
  }
  
  keys() {
    return this.data.keys();
  }
  
  values() {
    return this.data.values();
  }
} as any;

global.Blob = class Blob {
  constructor(public parts: any[], public options: any = {}) {}
  
  get size() {
    return this.parts.reduce((total, part) => total + (part.length || 0), 0);
  }
  
  get type() {
    return this.options.type || '';
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  text() {
    return Promise.resolve('');
  }
  
  stream() {
    return new ReadableStream();
  }
} as any;

// Mock File constructor
global.File = class File extends Blob {
  constructor(
    public fileBits: any[],
    public fileName: string,
    public options: any = {}
  ) {
    super(fileBits, options);
  }
  
  get name() {
    return this.fileName;
  }
  
  get lastModified() {
    return this.options.lastModified || Date.now();
  }
} as any;

// Mock URL constructor
global.URL = class URL {
  constructor(public href: string) {}
  
  get hostname() {
    try {
      return new URL(this.href).hostname;
    } catch {
      return 'localhost';
    }
  }
} as any;

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Restore console for debugging if needed
(global as any).restoreConsole = () => {
  global.console = originalConsole;
};

