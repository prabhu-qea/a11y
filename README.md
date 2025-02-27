# Accessibility Testing with Playwright and Axe

## Overview
This project performs automated accessibility testing using Playwright and Axe. It scans multiple URLs, generates individual accessibility reports for each page, and creates a summary report aggregating all violations.

## Features
- Uses Playwright for web page automation.
- Uses Axe-core for accessibility testing.
- Generates individual HTML reports for each scanned URL.
- Creates an aggregated summary report with all detected violations.
- Supports WCAG 2.0 & 2.1 (A & AA) compliance testing.
- Provides inline documentation within the code for better understanding.

## Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Playwright](https://playwright.dev/)
- [axe-html-reporter][https://github.com/lpelypenko/axe-html-reporter]

## Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd <repo-folder>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Usage

### 1. Prepare URL List
Create a `urls.txt` file in the root directory and list the URLs to be tested, one per line.

### 2. Run the Accessibility Scan
Execute the following command:
```sh
npx playwright test
```
This will:
- Load URLs from `urls.txt`
- Scan each page for accessibility violations
- Generate individual reports in `accessibility-reports/`
- Create an aggregated summary report

### 3. View Reports
- Individual reports are stored in `accessibility-reports/`
- The aggregated report is saved as `accessibility-reports/<PROJECT_KEY>-a11y-summary.html`

## Environment Variables
You can set a custom project key by defining:
```sh
export PROJECT_KEY=MyProject
```
If not set, the default `PROJECT_KEY` is `A11Y`.

## Customization
- Modify `withTags` in `scanPage()` to test different WCAG levels.
- Adjust `test.setTimeout()` if testing large pages.
- Inline comments are included in the code for better readability and understanding.
