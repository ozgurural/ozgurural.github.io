const fs = require('fs');
const path = require('path');

// Mock simple DOM environment
const mockElement = {
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => mockElement,
  setAttribute: () => {},
  classList: {
    toggle: () => {},
    add: () => {},
    remove: () => {}
  },
  children: [],
  dataset: {},
  appendChild: () => {},
  removeChild: () => {},
  style: {}
};

global.document = {
  getElementById: (id) => {
    console.log("document.getElementById called for id:", id);
    return mockElement;
  },
  querySelector: (sel) => {
    console.log("global document.querySelector called for:", sel);
    return mockElement;
  },
  querySelectorAll: (sel) => {
    console.log("global document.querySelectorAll called for:", sel);
    return [];
  },
  addEventListener: () => {},
  head: {
    appendChild: () => {}
  },
  createElement: (tag) => {
    return mockElement;
  },
  createElementNS: (ns, tag) => {
    return mockElement;
  }
};

global.window = {
  addEventListener: () => {},
};

try {
  const code = fs.readFileSync(path.join(__dirname, 'assets/js/lab.js'), 'utf8');
  eval(code);
  console.log("SUCCESS: Script parsed and evaluated without top-level errors.");
} catch (e) {
  console.error("FAIL: Script evaluation threw an error:", e);
}
