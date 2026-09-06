// 查词相关纯函数，被 background.js、popup.js 与测试共用。
// content script 无法 import（不上构建步骤），其内联正则须与此保持一致。
const MAX_PHRASES = 3;
const WORD_RE = /^[A-Za-z]{1,45}$/;

// 触发规则：仅单个纯英文单词（1–45 字母），容忍首尾空格
export function isTranslatableWord(text) {
  return WORD_RE.test(String(text).trim());
}

export function parseResult(word, data) {
  const ec = data.ec && data.ec.word && data.ec.word[0];
  if (!ec) return null;

  const defs = (ec.trs || [])
    .map((t) => t.tr && t.tr[0] && t.tr[0].l && t.tr[0].l.i && t.tr[0].l.i[0])
    .filter(Boolean);
  if (defs.length === 0) return null;

  const phrases = ((data.phrs && data.phrs.phrs) || [])
    .slice(0, MAX_PHRASES)
    .map((p) => {
      const phr = p.phr || {};
      const text = phr.headword && phr.headword.l && phr.headword.l.i;
      const tr = phr.trs && phr.trs[0] && phr.trs[0].tr;
      const trans = tr && tr.l && tr.l.i;
      return text && trans ? { text, trans } : null;
    })
    .filter(Boolean);

  return {
    word,
    usPhone: ec.usphone || '',
    ukPhone: ec.ukphone || '',
    defs,
    phrases,
  };
}
