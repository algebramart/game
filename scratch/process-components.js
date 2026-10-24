const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'components.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Redesign Badge Gallery section in css/components.css
const oldBadgeBlock = `.badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    max-height: 540px;
    overflow-y: auto;
    padding-right: 6px;
}
.badges-grid::-webkit-scrollbar { width: 6px; }
.badges-grid::-webkit-scrollbar-track { background: #fdf6ec; border-radius: 4px; }
.badges-grid::-webkit-scrollbar-thumb { background: #fde68a; border-radius: 4px; }
.badges-grid::-webkit-scrollbar-thumb:hover { background: #f59e0b; }

.badge-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 14px 10px 12px;
    border-radius: 18px;
    border: none;
    min-height: 105px;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    cursor: pointer;
}
.badge-card:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 18px rgba(180, 83, 9, 0.16);
}

.badge-unlocked {
    background: #ffffff;
    border: 1.5px solid #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);
}
.badge-locked {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    opacity: 0.7;
    filter: grayscale(85%);
}
.badge-locked:hover {
    opacity: 0.95;
    filter: grayscale(30%);
}

.badge-category-tag {
    font-size: 0.65rem;
    font-weight: 800;
    color: #b45309;
    text-transform: uppercase;
    margin-bottom: 4px;
    letter-spacing: 0.4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
.badge-locked .badge-category-tag {
    color: #94a3b8;
}

.badge-icon-wrapper {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.45rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
    background-color: #f1f5f9;
}
.badge-unlocked .badge-icon-wrapper {
    background-color: #fffbeb;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
}
.badge-locked .badge-icon-wrapper {
    background-color: #e2e8f0;
    color: #94a3b8;
}

.badge-card h4 {
    font-weight: 800;
    font-size: 0.85rem;
    line-height: 1.25;
    margin: 0;
    color: #78350f;
}
.badge-locked h4 { color: #64748b; }

/* Jangan tampilkan deskripsi pada tampilan galeri lencana agar terlihat bersih */
.badge-desc-text {
    display: none !important;
}`;

const newBadgeBlock = `/* Modern Floating Badge Gallery - Bebas Kotak Kaku */
.badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 16px 12px;
    max-height: 540px;
    overflow-y: auto;
    padding-right: 6px;
    padding-top: 6px;
}
.badges-grid::-webkit-scrollbar { width: 6px; }
.badges-grid::-webkit-scrollbar-track { background: #fdf6ec; border-radius: 4px; }
.badges-grid::-webkit-scrollbar-thumb { background: #fde68a; border-radius: 4px; }
.badges-grid::-webkit-scrollbar-thumb:hover { background: #f59e0b; }

.badge-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 8px 6px;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    min-height: 125px;
    justify-content: flex-start;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    cursor: pointer;
    user-select: none;
}
.badge-card:hover {
    transform: translateY(-5px);
}
.badge-card:focus-visible {
    outline: 2px solid #f59e0b;
    outline-offset: 4px;
    border-radius: 12px;
}

.badge-unlocked {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}
.badge-locked {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    opacity: 0.8;
}
.badge-locked:hover {
    opacity: 1;
}

.badge-insignia-platform {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.45rem;
    width: 100%;
}

.badge-pedestal-shadow {
    width: 48px;
    height: 10px;
    background: radial-gradient(ellipse at center, rgba(180, 83, 9, 0.32) 0%, rgba(180, 83, 9, 0.08) 50%, transparent 80%);
    border-radius: 50%;
    margin-top: -3px;
    transition: transform 0.25s ease, opacity 0.25s ease;
}
.badge-locked .badge-pedestal-shadow {
    background: radial-gradient(ellipse at center, rgba(100, 116, 139, 0.22) 0%, transparent 70%);
}
.badge-card:hover .badge-pedestal-shadow {
    transform: scale(0.85);
    opacity: 0.55;
}

.badge-icon-wrapper {
    position: relative;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease;
}
.badge-card:hover .badge-icon-wrapper {
    transform: translateY(-3px) scale(1.05);
}

.badge-unlocked .badge-icon-wrapper {
    filter: drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4));
}
.badge-unlocked:hover .badge-icon-wrapper {
    filter: drop-shadow(0 8px 18px rgba(245, 158, 11, 0.65));
}

.badge-locked .badge-icon-wrapper {
    filter: grayscale(100%) opacity(0.35);
}
.badge-locked:hover .badge-icon-wrapper {
    filter: grayscale(80%) opacity(0.55);
}

.badge-lock-badge {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 18px;
    height: 18px;
    background: #475569;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.58rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
    border: 1.5px solid #ffffff;
    z-index: 2;
}

.badge-category-tag {
    font-size: 0.65rem;
    font-weight: 500;
    color: #b45309;
    text-transform: uppercase;
    margin-bottom: 2px;
    letter-spacing: 0.4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
.badge-locked .badge-category-tag {
    color: #94a3b8;
}

.badge-card h4 {
    font-weight: 500;
    font-size: 0.82rem;
    line-height: 1.25;
    margin: 0;
    color: #78350f;
}
.badge-locked h4 { color: #64748b; }

/* Jangan tampilkan deskripsi pada tampilan galeri lencana agar terlihat bersih */
.badge-desc-text {
    display: none !important;
}`;

if (css.includes(oldBadgeBlock)) {
    css = css.replace(oldBadgeBlock, newBadgeBlock);
    console.log('Badge block replaced successfully.');
} else {
    console.error('Could not find oldBadgeBlock!');
    process.exit(1);
}

// 2. Parse rules and replace font-weights
// We can use a regex that matches CSS rules: selector { ... }
// Or line by line tracking current selector.
const lines = css.split('\n');
let currentSelector = '';
let inRule = false;
let updatedLines = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (!inRule) {
        if (line.includes('{')) {
            currentSelector += ' ' + line.substring(0, line.indexOf('{')).trim();
            inRule = true;
        } else {
            currentSelector += ' ' + line.trim();
        }
    }

    if (inRule) {
        // Check if line contains font-weight
        if (/font-weight\s*:/.test(line)) {
            // Is it an allowed exception? (.speech-bubble b, .item-name-bold)
            const isException = (
                currentSelector.includes('.speech-bubble b') ||
                currentSelector.includes('.speech-bubble strong') ||
                currentSelector.includes('item-name-bold')
            );

            if (isException) {
                // Ensure it is 700
                if (line.includes('!important')) {
                    line = line.replace(/font-weight\s*:\s*[^;]+;/, 'font-weight: 700 !important;');
                } else {
                    line = line.replace(/font-weight\s*:\s*[^;]+;/, 'font-weight: 700;');
                }
            } else {
                // Not exception: replace 600, 700, 800, 850, 900, bold with 500
                if (/font-weight\s*:\s*(bold|[6-9]\d\d)/.test(line)) {
                    if (line.includes('!important')) {
                        line = line.replace(/font-weight\s*:\s*[^;]+;/, 'font-weight: 500 !important;');
                    } else {
                        line = line.replace(/font-weight\s*:\s*[^;]+;/, 'font-weight: 500;');
                    }
                }
            }
        }

        if (line.includes('}')) {
            inRule = false;
            currentSelector = '';
        }
    }

    updatedLines.push(line);
}

const updatedCss = updatedLines.join('\n');
fs.writeFileSync(cssPath, updatedCss, 'utf8');
console.log('css/components.css updated successfully.');

