#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'README.template.md');
const PROGRESS_PATH = path.join(ROOT_DIR, 'data/progress.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'README.md');
const DOCS_DIR = path.join(ROOT_DIR, 'docs/knowledge-base');

const MIND_DOMAIN_DIRS = {
  philosophy: 'philosophy',
  psychology: 'psychology-behavior',
  economics: 'economics-incentives',
  politics: 'politics-power',
  history: 'history-civilization'
};

const BODY_DOMAIN_DIRS = {
  structure: 'body-mastery/structure',
  nutrition: 'body-mastery/nutrition',
  movement: 'body-mastery/movement',
  recovery: 'body-mastery/recovery',
  regulation: 'body-mastery/regulation'
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

  // Parse Mind domains
  for (const domain of progress.mind.domains) {
    const dirName = MIND_DOMAIN_DIRS[domain.id];
    const readmePath = path.join(DOCS_DIR, dirName, 'README.md');

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      const parsed = parseStatusFromMarkdown(content);
      domain.books = parsed.books;
      domain.courses = parsed.courses;
      domain.papers = parsed.papers;
    } else {
      domain.books = { completed: 0, total: 0 };
      domain.courses = { completed: 0, total: 0 };
      domain.papers = { completed: 0, total: 0 };
    }
  }

  // Parse Body domains
  for (const domain of progress.body.domains) {
    const dirName = BODY_DOMAIN_DIRS[domain.id];
    const readmePath = path.join(DOCS_DIR, dirName, 'README.md');

    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      const parsed = parseStatusFromMarkdown(content);
      domain.books = parsed.books;
      domain.courses = parsed.courses;
      domain.papers = parsed.papers;
    } else {
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

function generateDirectoryResources(domains, prefix) {
  const mindDirMap = {
    philosophy: { dir: 'philosophy', label: '哲学・思想' },
    psychology: { dir: 'psychology-behavior', label: '心理・行動' },
    economics: { dir: 'economics-incentives', label: '経済・インセンティブ' },
    politics: { dir: 'politics-power', label: '政治・権力' },
    history: { dir: 'history-civilization', label: '歴史・文明' }
  };

  const bodyDirMap = {
    structure: { dir: 'body-mastery/structure', label: '構造・機能' },
    nutrition: { dir: 'body-mastery/nutrition', label: '栄養' },
    movement: { dir: 'body-mastery/movement', label: '運動' },
    recovery: { dir: 'body-mastery/recovery', label: '回復' },
    regulation: { dir: 'body-mastery/regulation', label: '調整' }
  };

  const dirMap = prefix === 'mind' ? mindDirMap : bodyDirMap;

  return domains.map(d => {
    const info = dirMap[d.id];
    if (!info) return '';
    const total = d.books.total + d.courses.total + d.papers.total;
    return `│   │   ├── ${info.dir}/              # ${info.label}（${total} resources）`;
  }).filter(Boolean).join('\n');
}

function generateLearningLog(learningLog) {
  const header = '| Date | Domain | Resource | Type | Time | Key Takeaways |\n|------|--------|----------|------|------|---------------|';

  if (!learningLog || learningLog.length === 0) {
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
    .replace('{{MIND_DOMAIN_TABLE}}', generateDomainTable(progress.mind.domains))
    .replace('{{MIND_PROGRESS_TABLE}}', generateProgressTable(progress.mind.domains))
    .replace('{{MIND_DIRECTORY_RESOURCES}}', generateDirectoryResources(progress.mind.domains, 'mind'))
    .replace('{{BODY_DOMAIN_TABLE}}', generateDomainTable(progress.body.domains))
    .replace('{{BODY_PROGRESS_TABLE}}', generateProgressTable(progress.body.domains))
    .replace('{{BODY_DIRECTORY_RESOURCES}}', generateDirectoryResources(progress.body.domains, 'body'))
    .replace('{{LEARNING_LOG}}', generateLearningLog(progress.learningLog));

  fs.writeFileSync(OUTPUT_PATH, readme);
  console.log('README.md generated successfully!');

  // Show parsed progress
  console.log('\n=== Layer A1: Mind ===');
  for (const d of progress.mind.domains) {
    const total = d.books.completed + d.courses.completed + d.papers.completed;
    const max = d.books.total + d.courses.total + d.papers.total;
    console.log(`  ${d.name}: ${total}/${max}`);
  }

  console.log('\n=== Layer A2: Body ===');
  for (const d of progress.body.domains) {
    const total = d.books.completed + d.courses.completed + d.papers.completed;
    const max = d.books.total + d.courses.total + d.papers.total;
    console.log(`  ${d.name}: ${total}/${max}`);
  }
}

generate();
