#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs/knowledge-base');
const PROGRESS_PATH = path.join(ROOT_DIR, 'data/progress.json');
const MAPPING_PATH = path.join(ROOT_DIR, 'data/issue-mapping.json');

const MIND_DOMAINS = [
  { id: 'philosophy', dir: 'philosophy', name: 'Philosophy & Thought', emoji: '🏛️' },
  { id: 'psychology', dir: 'psychology-behavior', name: 'Psychology & Behavior', emoji: '🧠' },
  { id: 'economics', dir: 'economics-incentives', name: 'Economics & Incentives', emoji: '💰' },
  { id: 'politics', dir: 'politics-power', name: 'Politics & Power', emoji: '⚖️' },
  { id: 'history', dir: 'history-civilization', name: 'History & Civilization', emoji: '📜' }
];

const BODY_DOMAINS = [
  { id: 'structure', dir: 'body-mastery/structure', name: 'Structure', emoji: '🦴' },
  { id: 'nutrition', dir: 'body-mastery/nutrition', name: 'Nutrition', emoji: '🥗' },
  { id: 'movement', dir: 'body-mastery/movement', name: 'Movement', emoji: '🏃' },
  { id: 'recovery', dir: 'body-mastery/recovery', name: 'Recovery', emoji: '😴' },
  { id: 'regulation', dir: 'body-mastery/regulation', name: 'Regulation', emoji: '⚡' }
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
      // Parse table row: | # | [Title](url) | Author | ... or | # | <a href="url">Title</a> | Author | ...
      let match = line.match(/\|\s*\d+\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|([^|]+)\|/);
      if (!match) {
        // Try HTML link format
        match = line.match(/\|\s*\d+\s*\|\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>\s*\|([^|]+)\|/);
        if (match) {
          // Reorder for consistency: [, title, url, author]
          match = [match[0], match[2], match[1], match[3]];
        }
      }
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

function generateIssueBody(domain, resources, layer) {
  let body = `# ${domain.emoji} ${domain.name} Learning Progress\n\n`;
  body += `**Layer**: ${layer}\n\n`;
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

function createOrUpdateIssue(domain, body, label) {
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
        `gh issue edit ${issues[0].number} --body-file -`,
        { input: body, cwd: ROOT_DIR, stdio: ['pipe', 'inherit', 'inherit'] }
      );
      return issues[0].number;
    }
  } catch (e) {
    // Issue doesn't exist, create new one
  }

  // Create new issue
  console.log(`Creating new issue: ${title}`);
  const result = execSync(
    `gh issue create --title "${title}" --label "${label}" --body-file -`,
    { input: body, encoding: 'utf-8', cwd: ROOT_DIR }
  );
  console.log(`Created: ${result.trim()}`);

  const issueNumber = result.trim().match(/\/(\d+)$/)?.[1];
  return issueNumber;
}

function ensureLabelsExist() {
  const labels = [
    { name: 'learning', color: '0E8A16', description: 'Learning progress tracking' },
    { name: 'mind', color: '5319E7', description: 'Layer A1: Mind domains' },
    { name: 'body', color: 'D93F0B', description: 'Layer A2: Body domains' }
  ];

  for (const label of labels) {
    try {
      execSync(`gh label create ${label.name} --color ${label.color} --description "${label.description}"`,
        { cwd: ROOT_DIR, stdio: 'pipe' });
      console.log(`Created "${label.name}" label`);
    } catch (e) {
      // Label already exists
    }
  }
}

function main() {
  console.log('Creating GitHub Issues for learning progress...\n');

  ensureLabelsExist();

  // Load existing mapping or create new
  let issueNumbers = {};
  if (fs.existsSync(MAPPING_PATH)) {
    issueNumbers = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  }

  // Process Mind domains
  console.log('\n=== Layer A1: Mind ===\n');
  for (const domain of MIND_DOMAINS) {
    const readmePath = path.join(DOCS_DIR, domain.dir, 'README.md');

    if (!fs.existsSync(readmePath)) {
      console.log(`Skipping ${domain.name}: README.md not found`);
      continue;
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    const resources = parseResourcesFromMarkdown(content);
    const body = generateIssueBody(domain, resources, 'A1: Mind');

    const issueNumber = createOrUpdateIssue(domain, body, 'learning,mind');
    issueNumbers[domain.id] = issueNumber;
  }

  // Process Body domains
  console.log('\n=== Layer A2: Body ===\n');
  for (const domain of BODY_DOMAINS) {
    const readmePath = path.join(DOCS_DIR, domain.dir, 'README.md');

    if (!fs.existsSync(readmePath)) {
      console.log(`Skipping ${domain.name}: README.md not found`);
      continue;
    }

    const content = fs.readFileSync(readmePath, 'utf-8');
    const resources = parseResourcesFromMarkdown(content);
    const body = generateIssueBody(domain, resources, 'A2: Body');

    const issueNumber = createOrUpdateIssue(domain, body, 'learning,body');
    issueNumbers[domain.id] = issueNumber;
  }

  // Save issue numbers for sync script
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(issueNumbers, null, 2));
  console.log(`\nIssue mapping saved to ${MAPPING_PATH}`);
}

main();
