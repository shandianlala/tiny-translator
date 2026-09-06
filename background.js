// 数据源：有道非官方接口。请求在本文件，解析在 parse.mjs，失效换源只动这两处。
import { parseResult } from './parse.mjs';

const API_URL = 'https://dict.youdao.com/jsonapi?q=';

async function lookup(rawWord) {
  // 统一转小写：查询、结果 word、收藏 key 全链路小写
  const word = String(rawWord).trim().toLowerCase();
  const resp = await fetch(API_URL + encodeURIComponent(word));
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const data = await resp.json();
  return parseResult(word, data);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'lookup') return;
  lookup(msg.word)
    .then((result) => {
      if (result) sendResponse({ ok: true, result });
      else sendResponse({ ok: false, error: 'notfound' });
    })
    .catch(() => sendResponse({ ok: false, error: 'network' }));
  return true; // 异步 sendResponse
});
