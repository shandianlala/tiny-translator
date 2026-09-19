import { isTranslatableWord } from './parse.mjs';

const MAX_IMPORT_ITEMS = 10000;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} 格式不正确`);
  }
  const result = value.map((item) => String(item).trim()).filter(Boolean);
  if (result.length !== value.length) throw new Error(`${field} 格式不正确`);
  return result;
}

function normalizeFavorite(value) {
  if (!isPlainObject(value) || !isTranslatableWord(value.word)) {
    throw new Error('收藏词条格式不正确');
  }

  const savedAt = Number(value.savedAt);
  if (!Number.isFinite(savedAt) || savedAt <= 0) {
    throw new Error(`${value.word} 缺少有效的收藏时间`);
  }

  const phrases = value.phrases == null ? [] : value.phrases;
  if (!Array.isArray(phrases)) throw new Error(`${value.word} 的词组格式不正确`);

  return {
    word: value.word.trim().toLowerCase(),
    usPhone: typeof value.usPhone === 'string' ? value.usPhone : '',
    ukPhone: typeof value.ukPhone === 'string' ? value.ukPhone : '',
    defs: stringArray(value.defs, `${value.word} 的释义`),
    phrases: phrases.map((phrase) => {
      if (!isPlainObject(phrase)) throw new Error(`${value.word} 的词组格式不正确`);
      const text = typeof phrase.text === 'string' ? phrase.text.trim() : '';
      const trans = typeof phrase.trans === 'string' ? phrase.trans.trim() : '';
      if (!text || !trans) throw new Error(`${value.word} 的词组格式不正确`);
      return { text, trans };
    }),
    savedAt,
  };
}

export function parseFavoritesBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (!isPlainObject(raw)) throw new Error('备份文件格式不正确');

  const entries = Object.values(raw);
  if (entries.length > MAX_IMPORT_ITEMS) {
    throw new Error(`单次最多导入 ${MAX_IMPORT_ITEMS} 个收藏`);
  }

  const favorites = {};
  for (const value of entries) {
    const item = normalizeFavorite(value);
    const previous = favorites[item.word];
    if (!previous || item.savedAt > previous.savedAt) favorites[item.word] = item;
  }
  return favorites;
}

export function mergeFavorites(existing, imported) {
  const favorites = { ...existing };
  const stats = { added: 0, updated: 0, skipped: 0 };

  for (const [word, item] of Object.entries(imported)) {
    const current = favorites[word];
    if (!current) {
      favorites[word] = item;
      stats.added += 1;
    } else if (item.savedAt > Number(current.savedAt || 0)) {
      favorites[word] = item;
      stats.updated += 1;
    } else {
      stats.skipped += 1;
    }
  }

  return { favorites, stats };
}
