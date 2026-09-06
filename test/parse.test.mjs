import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseResult, isTranslatableWord } from '../parse.mjs';

// fixture 均为有道 jsonapi 的真实响应（2026-07-07 抓取），非手工编造
const example = JSON.parse(
  readFileSync(new URL('./fixtures/example.json', import.meta.url), 'utf8')
);

const notfound = JSON.parse(
  readFileSync(new URL('./fixtures/notfound.json', import.meta.url), 'utf8')
);

test('完整词条：音标、按词性释义、恰好前 3 个词组', () => {
  const r = parseResult('example', example);
  assert.equal(r.word, 'example');
  assert.equal(r.usPhone, 'ɪɡˈzæmp(ə)l');
  assert.equal(r.ukPhone, 'ɪɡˈzɑːmp(ə)l');
  assert.deepEqual(r.defs, [
    'n. 例子，例证；榜样，楷模；典型，范例；例句，例题；警戒，受罚（以示警告）者',
    'v. 得到说明，可加以举例说明',
  ]);
  assert.equal(r.phrases.length, 3);
  assert.deepEqual(r.phrases[0], { text: 'for example', trans: '例如' });
  for (const p of r.phrases) {
    assert.equal(typeof p.text, 'string');
    assert.ok(p.trans.length > 0);
  }
});

test('查不到词（响应无 ec 字段）返回 null', () => {
  assert.equal(parseResult('zzzqqqxwv', notfound), null);
});

test('有 ec 但释义为空时视为未找到，返回 null', () => {
  const data = structuredClone(example);
  data.ec.word[0].trs = [];
  assert.equal(parseResult('example', data), null);
});

test('音标缺失不视为失败，对应字段为空字符串', () => {
  const data = structuredClone(example);
  delete data.ec.word[0].usphone;
  delete data.ec.word[0].ukphone;
  const r = parseResult('example', data);
  assert.equal(r.usPhone, '');
  assert.equal(r.ukPhone, '');
  assert.ok(r.defs.length > 0);
});

test('词组缺失不视为失败，phrases 为空数组', () => {
  const data = structuredClone(example);
  delete data.phrs;
  const r = parseResult('example', data);
  assert.deepEqual(r.phrases, []);
  assert.ok(r.defs.length > 0);
});

test('isTranslatableWord：单个纯英文单词返回 true', () => {
  assert.equal(isTranslatableWord('example'), true);
  assert.equal(isTranslatableWord('a'), true); // 1 字母下界
  assert.equal(isTranslatableWord('A'.repeat(45)), true); // 45 字母上界
});

test('isTranslatableWord：容忍首尾空格', () => {
  assert.equal(isTranslatableWord('  example  '), true);
  assert.equal(isTranslatableWord('\texample\n'), true);
});

test('isTranslatableWord：非单个纯英文单词返回 false', () => {
  assert.equal(isTranslatableWord(''), false);
  assert.equal(isTranslatableWord('   '), false);
  assert.equal(isTranslatableWord('hello world'), false); // 多词
  assert.equal(isTranslatableWord('A'.repeat(46)), false); // 超长
  assert.equal(isTranslatableWord('abc123'), false); // 含数字
  assert.equal(isTranslatableWord("don't"), false); // 含标点
  assert.equal(isTranslatableWord('well-known'), false); // 含连字符
  assert.equal(isTranslatableWord('中文'), false);
});
