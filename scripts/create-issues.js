#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs/knowledge-base');

const DOMAINS = [
  { id: 'philosophy', dir: 'philosophy', name: 'Philosophy & Thought', emoji: '🏛️' },
  { id: 'psychology', dir: 'psychology-behavior', name: 'Psychology & Behavior', emoji: '🧠' },
  { id: 'economics', dir: 'economics-incentives', name: 'Economics & Incentives', emoji: '💰' },
  { id: 'politics', dir: 'politics-power', name: 'Politics & Power', emoji: '⚖️' },
  { id: 'history', dir: 'history-civilization', name: 'History & Civilization', emoji: '📜' }
];

function parseResourcesFromMarkdown(content) {
  const resources = {
    books: [],
    courses: [],
    papers: []
  };

  let currentSection = null;
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.match(/^## 📚 Books/i)) {
      currentSection = 'books';
    } else if (line.match(/^## 🎬 YouTube|^## 🎬 Courses/i)) {
      currentSection = 'courses';
    } else if (line.match(/^## 📄 Papers/i)) {
      currentSection = 'papers';
    } else if (line.match(/^## /) && currentSection) {
      currentSection = null;
    }

    if (currentSection && line.includes('|')) {
      // Parse table row: | # | [Title](url) | Author | ...
      const match = line.match(/\|\s*\d+\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|([^|]+)\|/);
      if (match) {
        const [, title, url, author] = match;
        const isChecked = line.includes('[x]') || line.includes('[X]');
        resources[currentSection].push({
          title: title.trim(),
          url: url.trim(),
          author: author.trim(),
          checked: isChecked
        });
      }
    }
  }

  return resources;
}

function generateIssueBody(domain, resources) {
  let body = `# ${domain.emoji} ${domain.name} Learning Progress\n\n`;
  body += `Track your learning progress for ${domain.name}.\n`;
  body += `Click checkboxes to mark items as completed.\n\n`;
  body += `---\n\n`;

  if (resources.books.length > 0) {
    body += `## 📚 Books\n\n`;
    for (const r of resources.books) {
      const check = r.checked ? 'x' : ' ';
      body += `- [${check}] [${r.title}](${r.url}) - ${r.author}\n`;
    }
    body += `\n`;
  }

  if (resources.courses.length > 0) {
    body += `## 🎬 Courses\n\n`;
    for (const r of resources.courses) {
      const check = r.checked ? 'x' : ' ';
      body += `- [${check}] [${r.title}](${r.url}) - ${r.author}\n`;
    }
    body += `\n`;
  }

  if (resources.papers.length > 0) {
    body += `## 📄 Papers\n\n`;
    for (const r of resources.papers) {
      const check = r.checked ? 'x' : ' ';
      body += `- [${check}] [${r.title}](${r.url}) - ${r.author}\n`;
    }
    body += `\n`;
  }

  return body;
}

function createOrUpdateIssue(domain, body) {
  const title = `[Learning] ${domain.emoji} ${domain.name}`;

  // Check if issue already exists
  try {
    const existing = execSync(
      `gh issue list --search "${title}" --json number,title --limit 1`,
      { encoding: 'utf-8', cwd: ROOT_DIR }
    );
    const issues = JSON.parse(existing);

    if (issues.length > 0 && issues[0].title === title) {
      console.log(`Updating existing issue #${issues[0].number}: ${title}`);
      execSync(
        `gh issue edit ${issues[0].number} --body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
        { cwd: ROOT_DIR, stdio: 'inherit' }
      );
      return issues[0].number;
    }
  } catch (e) {
    // Issue doesn't exist, create new one
  }

  // Create new issue
  console.log(`Creating new issue: ${title}`);
  const result = execSync(
    `gh issue create --title "${title}" --label "learning" --body-file -`,
    { input: body, encoding: 'utf-8', cwd: ROOT_DIR }
  );
  console.log(`Created: ${result.trim()}`);

  const issueNumber = result.trim().match(/\/(\d+)$/)?.[1];
  return issueNumber;
}

function ensureLabelExists() {
  try {
    execSync('gh label create learning --color 0E8A16 --description "Learning progress tracking"',
      { cwd: ROOT_DIR, stdio: 'pipe' });
    console.log('Created "learning" label');
  } catch (e) {
    // Label already exists
  }
}

function main() {
  console.log('Creating GitHub Issues for learning progress...\n');

  ensureLabelExists();

  const issueNumbers = {};

  for (const domain of DOMAINS) {
    const readmePath = path.join(DOCS_DIR, domain.dir, 'README.md');

    if (!fs.existsSync(readmePath)) {
      console.log(`Skipping ${domain.name}: README.md not found`);
      continue;
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    const resources = parseResourcesFromMarkdown(content);
    const body = generateIssueBody(domain, resources);

    const issueNumber = createOrUpdateIssue(domain, body);
    issueNumbers[domain.id] = issueNumber;
  }

  // Save issue numbers for sync script
  const mappingPath = path.join(ROOT_DIR, 'data/issue-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(issueNumbers, null, 2));
  console.log(`\nIssue mapping saved to ${mappingPath}`);
}

main();
