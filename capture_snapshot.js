const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('🚀 Launching browser...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set viewport to Instagram Story dimensions with HIGH DPI for quality
        await page.setViewport({
            width: 1080,
            height: 1920,
            deviceScaleFactor: 3 // 3x resolution = 3240x5760px final output
        });

        const filePath = path.resolve('wesal-snap-story.html');
        console.log(`📄 Loading: ${filePath}`);

        // Use a file:// URL
        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

        console.log('⏳ Waiting for fonts and animations to load...');
        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');
        // Additional wait for any animations or transitions
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take high-resolution PNG screenshot
        const outputPath = path.resolve('wesal-snap-story.png');
        console.log('📸 Capturing high-resolution screenshot...');

        await page.screenshot({
            path: outputPath,
            type: 'png', // PNG for lossless quality
            fullPage: false
        });

        console.log(`✅ High-resolution PNG saved to: ${outputPath}`);
        console.log(`📐 Resolution: 3240x5760px (3x scale for retina displays)`);
        console.log(`💾 File size may be larger due to PNG format`);

        await browser.close();
    } catch (error) {
        console.error('❌ Error taking screenshot:', error);
        process.exit(1);
    }
})();
