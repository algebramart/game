const fs = require('fs');
const path = require('path');
const vm = require('vm');

const files = [
    'js/core/state.js',
    'js/core/audio.js',
    'js/data/items.js',
    'js/data/levels.js',
    'js/data/quiz.js',
    'js/core/engine.js',
    'js/core/sync.js',
    'js/core/tutorial.js',
    'js/ui/levelZero.js',
    'js/ui/screens.js',
    'js/ui/victory.js',
    'js/ui/cashier.js',
    'js/ui/reports.js',
    'js/app.js'
];

console.log('Total files to bundle:', files.length);

let combinedChunks = [];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    if (file === 'js/core/sync.js') {
        const compatHelper = `
let app = null;
let db = null;

try {
    if (typeof firebase !== 'undefined') {
        app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }
} catch (e) {
    console.warn('[Sync] Inisialisasi Firebase Compat:', e);
}

function ref(database, path) {
    if (database && typeof database.ref === 'function') {
        return database.ref(path);
    }
    return { path };
}

function set(dbRef, val) {
    if (dbRef && typeof dbRef.set === 'function') {
        return dbRef.set(val);
    }
    return Promise.resolve();
}

function update(dbRef, val) {
    if (dbRef && typeof dbRef.update === 'function') {
        return dbRef.update(val);
    }
    return Promise.resolve();
}

function get(dbRef) {
    if (dbRef && typeof dbRef.once === 'function') {
        return dbRef.once('value');
    }
    if (dbRef && typeof dbRef.get === 'function') {
        return dbRef.get();
    }
    return Promise.resolve({ exists: () => false, val: () => null });
}

function onValue(dbRef, callback) {
    if (dbRef && typeof dbRef.on === 'function') {
        return dbRef.on('value', callback);
    }
}

function off(dbRef) {
    if (dbRef && typeof dbRef.off === 'function') {
        return dbRef.off();
    }
}
`;
        content = content.replace('const app = initializeApp(firebaseConfig);\nconst db = getDatabase(app);', compatHelper);
    }

    if (file === 'js/ui/levelZero.js') {
        // Rename isInitialized to isLevelZeroInitialized to avoid conflict with audio.js
        content = content.replace(/let isInitialized = false;/g, 'let isLevelZeroInitialized = false;');
        content = content.replace(/\bisInitialized\b/g, 'isLevelZeroInitialized');
    }

    // Remove any import statements (single-line or multi-line)
    content = content.replace(/import\s+(?:[\w*\s{},]*\s+from\s+)?['"][^'"]+['"]\s*;?/g, '');

    // Remove standalone export { ... }
    content = content.replace(/export\s*\{[^}]*\}\s*;?/g, '');

    // Replace export const, export let, export var, export function, export async function, export class
    content = content.replace(/export\s+(const|let|var|function|async\s+function|class)\s+/g, '$1 ');

    // Replace export default
    content = content.replace(/export\s+default\s+/g, '');

    combinedChunks.push(`\n// ==========================================\n// FILE: ${file}\n// ==========================================\n` + content);
}

const bundledCode = `(function() {
'use strict';
${combinedChunks.join('\n')}
})();
`;

try {
    new vm.Script(bundledCode);
    console.log('SUCCESS! Bundled script compiled without syntax errors.');
    console.log('Total characters:', bundledCode.length);
    fs.writeFileSync('js/bundle.js', bundledCode, 'utf8');
    console.log('Written to js/bundle.js');
} catch (err) {
    console.error('Compilation failed:', err);
}

