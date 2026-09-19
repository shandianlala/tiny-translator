import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeFavorites, parseFavoritesBackup } from '../favorites.mjs';

function favorite(word, savedAt) {
  return {
    word,
    usPhone: '',
    ukPhone: '',
    defs: ['n. 示例'],
    phrases: [],
    savedAt,
  };
}

test('导入备份时规范化单词，并保留同词较新的记录', () => {
  const parsed = parseFavoritesBackup(JSON.stringify({
    first: favorite('Example', 100),
    second: favorite('example', 200),
  }));

  assert.deepEqual(Object.keys(parsed), ['example']);
  assert.equal(parsed.example.savedAt, 200);
});

test('格式错误时拒绝整个备份', () => {
  assert.throws(() => parseFavoritesBackup('{bad json'), /有效的 JSON/);
  assert.throws(
    () => parseFavoritesBackup(JSON.stringify({ example: { word: 'example' } })),
    /收藏时间/
  );
});

test('合并时新增新词、用较新记录更新同词、跳过较旧记录', () => {
  const existing = {
    apple: favorite('apple', 200),
    book: favorite('book', 200),
  };
  const imported = {
    apple: favorite('apple', 100),
    book: favorite('book', 300),
    cat: favorite('cat', 100),
  };

  const { favorites, stats } = mergeFavorites(existing, imported);
  assert.deepEqual(stats, { added: 1, updated: 1, skipped: 1 });
  assert.equal(favorites.apple.savedAt, 200);
  assert.equal(favorites.book.savedAt, 300);
  assert.equal(favorites.cat.savedAt, 100);
});
