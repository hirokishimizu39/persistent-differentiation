#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs/knowledge-base');

const DOMAIN_DIRS = [
  'philosophy',
  'psychology-behavior',
  'economics-incentives',
  'politics-power',
  'history-civilization'
];

function convertMarkdownLinksToHtml(content) {
  // Match markdown links: [text](url)
  // But exclude internal relative links (not starting with http)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

  return content.replace(markdownLinkRegex, (match, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const converted = convertMarkdownLinksToHtml(content);

  if (content !== converted) {
    fs.writeFileSync(filePath, converted);
    console.log(`✓ Converted: ${filePath}`);
    return true;
  }
  console.log(`- No changes: ${filePath}`);
  return false;
}

function main() {
  let totalConverted = 0;

  for (const dir of DOMAIN_DIRS) {
    const readmePath = path.join(DOCS_DIR, dir, 'README.md');
    if (fs.existsSync(readmePath)) {
      if (processFile(readmePath)) {
        totalConverted++;
      }
    }
  }

  console.log(`\nTotal files converted: ${totalConverted}`);
}

main();
