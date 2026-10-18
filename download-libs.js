const fs = require('fs');
const path = require('path');
const https = require('https');

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const makeRequest = (currentUrl) => {
            https.get(currentUrl, (response) => {
                // Tangani HTTP Redirects (301, 302, 307, 308)
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    let redirectUrl = response.headers.location;
                    if (redirectUrl.startsWith('/')) {
                        const parsed = new URL(currentUrl);
                        redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
                    }
                    return makeRequest(redirectUrl);
                }

                if (response.statusCode !== 200) {
                    return reject(new Error(`Gagal mengunduh ${currentUrl} (Status: ${response.statusCode})`));
                }

                const fileStream = fs.createWriteStream(destPath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close(() => {
                        const stats = fs.statSync(destPath);
                        console.log(`[OK] Unduh selesai: ${path.relative('.', destPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
                        resolve(stats.size);
                    });
                });
            }).on('error', (err) => {
                reject(err);
            });
        };

        makeRequest(url);
    });
}

async function main() {
    console.log('=== Memulai Pengunduhan Seluruh Pustaka Eksternal ke libs/ ===\n');

    const downloadTasks = [
        // 1. Chart.js
        {
            url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js',
            dest: 'libs/chartjs/chart.umd.min.js'
        },

        // 2. KaTeX JS & CSS
        {
            url: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
            dest: 'libs/katex/katex.min.js'
        },
        {
            url: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
            dest: 'libs/katex/katex.min.css'
        },

        // 3. Font Awesome CSS 6.4.0
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            dest: 'libs/fontawesome/css/all.min.css'
        },

        // 4. Font Awesome Webfonts 6.4.0
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
            dest: 'libs/fontawesome/webfonts/fa-solid-900.woff2'
        },
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.ttf',
            dest: 'libs/fontawesome/webfonts/fa-solid-900.ttf'
        },
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
            dest: 'libs/fontawesome/webfonts/fa-regular-400.woff2'
        },
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.ttf',
            dest: 'libs/fontawesome/webfonts/fa-regular-400.ttf'
        },
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
            dest: 'libs/fontawesome/webfonts/fa-brands-400.woff2'
        },

        // 5. Firebase Compat SDK
        {
            url: 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js',
            dest: 'libs/firebase/firebase-app-compat.js'
        },
        {
            url: 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database-compat.js',
            dest: 'libs/firebase/firebase-database-compat.js'
        }
    ];

    // Eksekusi task utama
    for (const task of downloadTasks) {
        try {
            await downloadFile(task.url, task.dest);
        } catch (err) {
            console.error(`[ERROR] Gagal mengunduh ${task.url}:`, err.message);
        }
    }

    // Unduh font KaTeX esensial yang dirujuk oleh katex.min.css
    console.log('\n--- Mengunduh Font KaTeX Esensial ---');
    const katexFonts = [
        'KaTeX_Main-Regular.woff2',
        'KaTeX_Main-Bold.woff2',
        'KaTeX_Main-Italic.woff2',
        'KaTeX_Math-Italic.woff2',
        'KaTeX_Math-BoldItalic.woff2',
        'KaTeX_Size1-Regular.woff2',
        'KaTeX_Size2-Regular.woff2',
        'KaTeX_AMS-Regular.woff2'
    ];

    for (const fontName of katexFonts) {
        const fontUrl = `https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/${fontName}`;
        const dest = `libs/katex/fonts/${fontName}`;
        try {
            await downloadFile(fontUrl, dest);
        } catch (e) {
            console.warn(`[WARN] Lewati font KaTeX ${fontName}:`, e.message);
        }
    }

    console.log('\n=== Seluruh Pengunduhan Pustaka Selesai! ===');
}

main().catch(err => console.error('Fatal error:', err));

