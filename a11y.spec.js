const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { createHtmlReport } = require('axe-html-reporter');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const reportsDir = './accessibility-reports'; // Report directory
const visitedLinks = new Set();
const PROJECT_KEY = process.env.PROJECT_KEY || 'A11Y'; // Custom project key
const URLS_FILE_PATH = 'urls.txt'; // File containing list of URLs to be scanned
const allResults = []; // Store results for aggregation

async function modifyTitle(filePath, newTitle) {
    const htmlContent = await fs.readFile(filePath, 'utf8');
    const updatedHtml = htmlContent.replace(/<title>.*<\/title>/, `<title>${newTitle}</title>`);
    await fs.writeFile(filePath, updatedHtml, 'utf8');
}

const getPageIdentifier = (url) => {
    try {
        const parsedUrl = new URL(url);
        let pathname = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash

        if (!pathname || pathname === '/') {
            return 'Home';
        }

        return pathname.split('/').pop().replace(/\.[^/.]+$/, '') || 'Home';
    } catch (error) {
        console.error(`Invalid URL: ${url}`, error);
        return 'Home';
    }
};

async function scanPage(page, url) {
    console.log(`Scanning: ${url}`);
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 1200000 }); // Increased timeout to 60s
    } catch (error) {
        console.error(`Failed to load ${url}:`, error);
        return;
    }

    let axeResults;
    try {
        axeResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
    } catch (error) {
        console.error(`Axe analysis failed for: ${url}`, error);
        return;
    }

    if (!axeResults || !axeResults.violations) {
        console.error(`No accessibility violations found or axe analysis failed for: ${url}`);
        return;
    }

    allResults.push(...axeResults.violations.map(v => ({
        url,
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        // tags: v.tags.join(', '),
        tags: v.tags.filter(tag => tag.includes('wcag')).join('<br>'), // Display only WCAG tags
    })));

    let pgTitle = getPageIdentifier(url);
    let fileName = `${PROJECT_KEY}_${pgTitle}.html`;     

    // Generate individual report
    const reportFilePath = path.join(reportsDir, fileName);
    createHtmlReport({
        results: axeResults,
        options: {
            outputDir: reportsDir,
            reportFileName: fileName,
            showPasses: true,
            reportTitle: `Accessibility Report | ${PROJECT_KEY} | ${pgTitle}`,
            customSummary: `Project: ${PROJECT_KEY} | URL: ${url}`,
        },
    });

    await modifyTitle(reportFilePath, `Accessibility Report - ${PROJECT_KEY} - ${pgTitle}`);
    console.log(`Report generated: ${fileName}`);    
}

async function processUrlsFromFile(page) {
    const urls = await fs.readFile(URLS_FILE_PATH, 'utf8');
    const urlList = urls.split('\n').filter(url => url.trim() !== '');

    for (const url of urlList) {
        if (visitedLinks.has(url) || url.includes('#')) continue;
        visitedLinks.add(url);
        await scanPage(page, url);
    }
}

async function generateSummaryReport() {
    const summaryFilePath = path.join(reportsDir, `${PROJECT_KEY}-a11y-summary.html`);
    await fs.ensureDir(reportsDir);
    
    const totalViolations = allResults.length;
    const uniqueViolations = new Set(allResults.map(r => r.id)).size;
    
    let htmlContent = `
        <html>
        <head>
            <title>Aggregated Accessibility Report | ${PROJECT_KEY}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Aggregated Accessibility Report | ${PROJECT_KEY}</h1>
            <p><strong>Total Violations:</strong> ${totalViolations}</p>
            <p><strong>Unique Violations:</strong> ${uniqueViolations}</p>
            <table>
                <tr>
                    <th>URL</th>
                    <th>Violation ID</th>
                    <th>Impact</th>
                    <th>Description</th>
                    <th>No of Nodes Affected</th>
                    <th>WCAG Guidelines</th>
                </tr>
    `;

    allResults.forEach(result => {
        htmlContent += `
            <tr>
                <td>${result.url}</td>
                <td>${result.id}</td>
                <td>${result.impact}</td>
                <td>${result.description}</td>
                <td>${result.nodes}</td>
                <td>${result.tags}</td>
            </tr>
        `;
    });

    htmlContent += `
            </table>
        </body>
        </html>
    `;

    await fs.writeFile(summaryFilePath, htmlContent, 'utf8');
    console.log(`Aggregated HTML report generated: ${summaryFilePath}`);
}

test('Accessibility scan', async ({ page }) => {    
    test.setTimeout(120000); // Set test timeout to 2 minutes
    await processUrlsFromFile(page);
    await generateSummaryReport();
});
