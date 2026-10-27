const fs = require('fs');
const bundle = fs.readFileSync('js/bundle.js', 'utf8');

const vm = require('vm');
const mockEl = {
    innerHTML: '',
    innerText: '',
    value: '',
    dataset: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    appendChild: () => {},
    style: { setProperty: () => {} },
    scrollLeft: 0,
    scrollTop: 0
};
const context = {
    document: {
        getElementById: () => mockEl,
        querySelectorAll: () => [mockEl],
        querySelector: () => mockEl,
        documentElement: mockEl,
        body: mockEl,
        readyState: 'complete',
        addEventListener: () => {}
    },
    window: {
        addEventListener: () => {},
        location: { reload: () => {} },
        scrollTo: () => {},
        innerWidth: 1280,
        innerHeight: 720
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    console: { log: () => {}, warn: () => {}, error: () => {} },
    navigator: { clipboard: {} },
    setTimeout: () => {},
    clearTimeout: () => {},
    Audio: class { constructor() { this.play = () => {}; this.pause = () => {}; } }
};
vm.createContext(context);
const script = new vm.Script(bundle);
script.runInContext(context);

const validate = context.window._validateKelas;
console.log('validate function loaded:', typeof validate === 'function');

const validCases = ['7A', '7-A', '7.1', '7 A', 'Kelas 7A', 'kls 7-1', 'VII-A', 'VIII B', 'IX', '10 MIPA 1', '12 IPS 2'];
const invalidCases = ['100', 'Kelas 100', '100A', '100-A', '0', '13', '99', '7@A', '7#', '7!', '7$A', '7*A', '---', '-7A', '7A-', 'abc', '', 'C', 'XX', 'XIII', 'XIV', '7_A', '7/A', '7=A', '7+A', '7(A)', '7?'];

let allPassed = true;
for (const tc of validCases) {
    try {
        const res = validate(tc);
        if (!res) throw new Error('Empty result');
        console.log('VALID (PASS):', tc, '=>', res);
    } catch (e) {
        console.error('Expected PASS but FAILED for:', tc, e.message);
        allPassed = false;
    }
}

for (const tc of invalidCases) {
    try {
        const res = validate(tc);
        console.error('Expected FAIL but PASSED for:', tc, 'Result was:', res);
        allPassed = false;
    } catch (e) {
        console.log('INVALID (CAUGHT):', tc, '=>', e.message);
    }
}

if (allPassed) {
    console.log('\n=== ALL BUNDLE TESTS PASSED PERFECTLY! ===');
} else {
    process.exit(1);
}

