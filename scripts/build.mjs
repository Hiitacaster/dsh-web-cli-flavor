/**
 * build.mjs — 从 styles/cli-flavor.css 生成 lib/client.js
 * ----------------------------------------------------------------------------
 * 用法：node scripts/build.mjs
 *   - 读取 lib/client.template.js，把 /*__CLI_FLAVOR_CSS__*\/ 占位符替换为
 *     styles/cli-flavor.css 的完整内容（作为合法 JS 字符串字面量内联）。
 *   - 输出 lib/client.js。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'dsh-web-cli-flavor', 'styles', 'cli-flavor.css');
const tplPath = join(root, 'dsh-web-cli-flavor', 'lib', 'client.template.js');
const outPath = join(root, 'dsh-web-cli-flavor', 'lib', 'client.js');

const css = readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n').trim();
const tpl = readFileSync(tplPath, 'utf8').replace(/\r\n/g, '\n');

const marker = '/*__CLI_FLAVOR_CSS__*/';
if (!tpl.includes(marker)) {
  console.error('[build] template missing marker ' + marker);
  process.exit(1);
}
// 用 JSON.stringify 把 CSS 包成合法 JS 字符串字面量，并连同占位符后面的 '' 一起替换。
// 不能裸塞 CSS（CSS 注释里的 */ 会提前关闭 JS 注释，导致后续 CSS 被当 JS 解析 → 语法错误）。
// 也不能只替换占位符本身——模板里占位符后面还跟着 ''，会变成 "..." '' 两个字符串挨着 → 语法错误。
const out = tpl
  .replace(/\/\*__CLI_FLAVOR_CSS__\*\/\s*''/, () => JSON.stringify(css));

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out, 'utf8');
console.log('[build] lib/client.js updated (%d chars css inlined)', css.length);
