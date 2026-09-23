const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

// Reuse the project's compiler; no runtime or test dependency is added.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const {
  projects,
  PROJECT_IDS,
  getProject,
  isProjectId,
} = require('../src/lib/projects.ts');
const { isPersonalContent } = require('../src/lib/posts/editorial.ts');
const {
  getAllPosts,
  getPostBySlug,
  getAllTags,
  getAllSeries,
} = require('../src/lib/posts/index.ts');
const { postMatchesView } = require('../src/lib/posts/types.ts');
const previousContentRoot = process.env.CONTENT_REPO_PATH;
const fixtureRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'aitool-studio-test-'),
);
fs.mkdirSync(path.join(fixtureRoot, 'posts'));
fs.mkdirSync(path.join(fixtureRoot, 'series'));
process.env.CONTENT_REPO_PATH = fixtureRoot;

after(() => {
  if (previousContentRoot === undefined) delete process.env.CONTENT_REPO_PATH;
  else process.env.CONTENT_REPO_PATH = previousContentRoot;
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

function post(slug, extra = '', body = '这是公开的个人研究记录。') {
  fs.writeFileSync(
    path.join(fixtureRoot, 'posts', `${slug}.md`),
    `---\ntitle: ${slug}\ndate: 2026-09-22\npublishedAt: 2026-09-22T00:00:00Z\n${extra}\n---\n\n${body}\n`,
  );
}

test('catalog contains exactly the four personal directions and honest experiment status', () => {
  assert.deepEqual(
    projects.map((item) => item.id),
    [...PROJECT_IDS],
  );
  assert.equal(new Set(projects.map((item) => item.id)).size, 4);
  assert.equal(getProject('cat-host').status, '探索中');
  assert.match(getProject('language-learning').steps[2].text, /模拟 demo/);
  assert.equal(getProject('missing'), undefined);
  assert.equal(isProjectId('evox'), false);
  assert.equal(isProjectId(1), false);
  assert.equal(isProjectId('tingdong'), true);
  assert.doesNotMatch(JSON.stringify(projects), /evox|evomap|求职|招聘/i);
});

test('editorial rule excludes draft, private and company references anywhere in the source', () => {
  assert.equal(isPersonalContent('个人研究', {}), true);
  assert.equal(isPersonalContent('个人研究', { draft: true }), false);
  assert.equal(isPersonalContent('个人研究', { visibility: 'private' }), false);
  for (const body of ['EvoX desktop', '关于 EVOMAP', 'EFX token']) {
    assert.equal(isPersonalContent(body, {}), false);
  }
});

test('missing content repository returns empty collections', () => {
  process.env.CONTENT_REPO_PATH = path.join(fixtureRoot, 'not-present');
  try {
    assert.deepEqual(getAllPosts(), []);
    assert.deepEqual(getAllSeries([]), []);
    assert.equal(getPostBySlug('missing'), null);
  } finally {
    process.env.CONTENT_REPO_PATH = fixtureRoot;
  }
});

test('indexes and direct links share exclusions; related projects are validated', () => {
  post(
    'public-note',
    'tags: [AI, 产品]\nseries: 我的实验\nprojects: [tingdong, tingdong, language-learning, unknown, 123]',
  );
  post('draft-note', 'draft: true');
  post('private-note', 'visibility: private');
  post('company-in-body', '', '一段普通开头。\n\n随后谈到 EvoX 的内部方案。');
  post('company-in-meta', 'tags: [EvoMap]');
  fs.writeFileSync(
    path.join(fixtureRoot, 'series', 'public.md'),
    '---\ntitle: 我的实验\n---\n\n个人研究路线。',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'series', 'company.md'),
    '---\ntitle: 公司方向\n---\n\nEvoX 记录。',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'series', 'private.md'),
    '---\ntitle: 私人系列\nvisibility: private\n---\n\n未公开。',
  );
  const all = getAllPosts();
  assert.deepEqual(
    all.map((item) => item.slug),
    ['public-note'],
  );
  assert.deepEqual(all[0].projects, ['tingdong', 'language-learning']);
  assert.equal(all[0].date, '2026-09-22');
  assert.equal('content' in all[0], false);
  assert.match(getPostBySlug('public-note').content, /个人研究/);
  for (const slug of [
    'draft-note',
    'private-note',
    'company-in-body',
    'company-in-meta',
    '../public-note',
    '..',
    '',
    'missing',
  ]) {
    assert.equal(getPostBySlug(slug), null, slug);
  }
  assert.deepEqual(
    getAllTags(all)
      .map((item) => item.tag)
      .sort(),
    ['AI', '产品'],
  );
  assert.deepEqual(
    getAllSeries(all).map((item) => [item.series, item.count]),
    [['我的实验', 1]],
  );
  assert.equal(postMatchesView(all[0], 'ai'), true);
  assert.equal(postMatchesView(all[0], 'life'), false);
});
