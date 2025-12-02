#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'README.template.md');
const PROGRESS_PATH = path.join(ROOT_DIR, 'data/progress.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'README.md');
const DOCS_DIR = path.join(ROOT_DIR, 'docs/knowledge-base');

const DOMAIN_DIRS = {
  philosophy: 'philosophy',
  psychology: 'psychology-behavior',
  economics: 'economics-incentives',
  politics: 'politics-power',
  history: 'history-civilization'
};

function parseStatusFromMarkdown(content) {
  const sections = {
    books: { completed: 0, total: 0 },
    courses: { completed: 0, total: 0 },
    papers: { completed: 0, total: 0 }
  };

  let currentSection = null;

  const lines = content.split('\n');
  for (const line of lines) {
    // Detect section headers
    if (line.match(/^## 📚 Books/i)) {
      currentSection = 'books';
    } else if (line.match(/^## 🎬 YouTube|^## 🎬 Courses/i)) {
      currentSection = 'courses';
    } else if (line.match(/^## 📄 Papers/i)) {
      currentSection = 'papers';
    } else if (line.match(/^## /) && currentSection) {
      // New section that's not one of ours, stop counting for current
      currentSection = null;
    }

    // Count checkboxes in table rows (Status column)
    if (currentSection && line.includes('|')) {
      const checked = (line.match(/\[x\]/gi) || []).length;
      const unchecked = (line.match(/\[ \]/g) || []).length;

      if (checked > 0 || unchecked > 0) {
        sections[currentSection].completed += checked;
        sections[currentSection].total += checked + unchecked;
      }
    }
  }

  return sections;
}

function loadDomainsFromMarkdown() {
  const progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));

  // Parse status from markdown files (SSOT)
  for (const domain of progress.domains) {
    const dirName = DOMAIN_DIRS[domain.id];
    const readmePath = path.join(DOCS_DIR, dirName, 'README.md');

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      const parsed = parseStatusFromMarkdown(content);

      domain.books = parsed.books;
      domain.courses = parsed.courses;
      domain.papers = parsed.papers;
    } else {
      // Fallback if README doesn't exist
      domain.books = { completed: 0, total: 0 };
      domain.courses = { completed: 0, total: 0 };
      domain.papers = { completed: 0, total: 0 };
    }
  }

  return progress;
}

function generateDomainTable(domains) {
  const header = '| # | Domain | 中心の問い | Resources |\n|---|--------|-----------|-----------|';
  const rows = domains.map((d, i) => {
    const total = d.books.total + d.courses.total + d.papers.total;
    return `| ${i + 1} | [${d.name}](${d.path}) | ${d.question} | ${total} |`;
  });
  return [header, ...rows].join('\n');
}

function generateProgressTable(domains) {
  const header = '| Domain | 📚 Books | 🎬 Courses | 📄 Papers | Total |\n|--------|----------|------------|-----------|-------|';

  let totalBooks = { completed: 0, total: 0 };
  let totalCourses = { completed: 0, total: 0 };
  let totalPapers = { completed: 0, total: 0 };

  const rows = domains.map(d => {
    totalBooks.completed += d.books.completed;
    totalBooks.total += d.books.total;
    totalCourses.completed += d.courses.completed;
    totalCourses.total += d.courses.total;
    totalPapers.completed += d.papers.completed;
    totalPapers.total += d.papers.total;

    const domainTotal = d.books.completed + d.courses.completed + d.papers.completed;
    const domainTotalMax = d.books.total + d.courses.total + d.papers.total;

    return `| ${d.name} | ${d.books.completed}/${d.books.total} | ${d.courses.completed}/${d.courses.total} | ${d.papers.completed}/${d.papers.total} | ${domainTotal}/${domainTotalMax} |`;
  });

  const grandTotal = totalBooks.completed + totalCourses.completed + totalPapers.completed;
  const grandTotalMax = totalBooks.total + totalCourses.total + totalPapers.total;
  const totalRow = `| **Total** | **${totalBooks.completed}/${totalBooks.total}** | **${totalCourses.completed}/${totalCourses.total}** | **${totalPapers.completed}/${totalPapers.total}** | **${grandTotal}/${grandTotalMax}** |`;

  return [header, ...rows, totalRow].join('\n');
}

function generateDirectoryResources(domains) {
  const dirMap = {
    philosophy: { dir: 'philosophy', label: '哲学・思想' },
    psychology: { dir: 'psychology-behavior', label: '心理・行動' },
    economics: { dir: 'economics-incentives', label: '経済・インセンティブ' },
    politics: { dir: 'politics-power', label: '政治・権力' },
    history: { dir: 'history-civilization', label: '歴史・文明' }
  };

  return domains.map(d => {
    const info = dirMap[d.id];
    const total = d.books.total + d.courses.total + d.papers.total;
    return `│   │   ├── ${info.dir}/              # ${info.label}（${total} resources）`;
  }).join('\n');
}

function generateLearningLog(learningLog) {
  const header = '| Date | Domain | Resource | Type | Time | Key Takeaways |\n|------|--------|----------|------|------|---------------|';

  if (learningLog.length === 0) {
    return header + '\n| | | | | | |';
  }

  const rows = learningLog.map(log =>
    `| ${log.date} | ${log.domain} | ${log.resource} | ${log.type} | ${log.time} | ${log.takeaways} |`
  );

  return [header, ...rows].join('\n');
}

function generate() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const progress = loadDomainsFromMarkdown();

  let readme = template
    .replace('{{DOMAIN_TABLE}}', generateDomainTable(progress.domains))
    .replace('{{PROGRESS_TABLE}}', generateProgressTable(progress.domains))
    .replace('{{DIRECTORY_RESOURCES}}', generateDirectoryResources(progress.domains))
    .replace('{{LEARNING_LOG}}', generateLearningLog(progress.learningLog));

  fs.writeFileSync(OUTPUT_PATH, readme);
  console.log('README.md generated successfully!');

  // Show parsed progress
  console.log('\nParsed progress from markdown files:');
  for (const d of progress.domains) {
    const total = d.books.completed + d.courses.completed + d.papers.completed;
    const max = d.books.total + d.courses.total + d.papers.total;
    console.log(`  ${d.name}: ${total}/${max}`);
  }
}

generate();
