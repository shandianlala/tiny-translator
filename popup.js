import { isTranslatableWord } from './parse.mjs';

const VOICE_URL = 'https://dict.youdao.com/dictvoice?audio=';

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const resultEl = document.getElementById('result');
const inputEl = document.getElementById('word-input');
const lookupBtn = document.getElementById('lookup-btn');

// ---- 收藏列表 ----

function render(favorites) {
  const items = Object.values(favorites).sort((a, b) => b.savedAt - a.savedAt);
  listEl.innerHTML = '';
  emptyEl.hidden = items.length > 0;

  for (const item of items) {
    const div = document.createElement('div');
    div.className = 'item';

    const row = document.createElement('div');
    row.className = 'row';
    const word = document.createElement('span');
    word.className = 'word';
    word.textContent = item.word;
    word.title = '点击展开/收起词组';
    const phone = document.createElement('span');
    phone.className = 'phone';
    phone.textContent = item.usPhone ? `/${item.usPhone}/` : '';
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '★';
    del.title = '取消收藏';
    row.append(word, phone, del);

    const defs = document.createElement('div');
    defs.className = 'defs';
    defs.textContent = item.defs.join('；');

    div.append(row, defs);

    if (item.phrases && item.phrases.length) {
      const phrases = document.createElement('div');
      phrases.className = 'phrases';
      for (const p of item.phrases) {
        const line = document.createElement('div');
        line.className = 'phrase';
        const b = document.createElement('b');
        b.textContent = p.text;
        line.append(b, ' ' + p.trans);
        phrases.appendChild(line);
      }
      div.appendChild(phrases);
      word.addEventListener('click', () => div.classList.toggle('open'));
    }

    del.addEventListener('click', () => {
      del.classList.remove('pop');
      void del.offsetWidth; // reflow to restart animation
      del.classList.add('pop');
      del.disabled = true;
      setTimeout(() => {
        chrome.storage.local.get('favorites', ({ favorites = {} }) => {
          delete favorites[item.word.toLowerCase()];
          chrome.storage.local.set({ favorites }, () => render(favorites));
        });
      }, 280);
    });

    listEl.appendChild(div);
  }
}

function refreshList() {
  chrome.storage.local.get('favorites', ({ favorites = {} }) => render(favorites));
}

// ---- 主动查词 ----

function showMessage(text) {
  resultEl.hidden = false;
  resultEl.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'msg';
  div.textContent = text;
  resultEl.appendChild(div);
}

function playVoice(word, type) {
  new Audio(VOICE_URL + encodeURIComponent(word) + '&type=' + type)
    .play()
    .catch(() => {});
}

function renderResult(result) {
  resultEl.hidden = false;
  resultEl.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'head';
  const wordEl = document.createElement('span');
  wordEl.className = 'word';
  wordEl.textContent = result.word;
  const favBtn = document.createElement('button');
  favBtn.className = 'fav';
  favBtn.textContent = '☆';
  favBtn.title = '收藏';
  head.append(wordEl, favBtn);
  resultEl.appendChild(head);

  const key = result.word.toLowerCase();
  function setFav(on) {
    favBtn.classList.toggle('on', on);
    favBtn.textContent = on ? '★' : '☆';
    favBtn.title = on ? '取消收藏' : '收藏';
  }
  chrome.storage.local.get('favorites', ({ favorites = {} }) => {
    setFav(!!favorites[key]);
  });
  favBtn.addEventListener('click', () => {
    chrome.storage.local.get('favorites', ({ favorites = {} }) => {
      const willFav = !favorites[key];
      if (willFav) {
        favorites[key] = { ...result, savedAt: Date.now() };
      } else {
        delete favorites[key];
      }
      chrome.storage.local.set({ favorites }, () => {
        setFav(willFav);
        favBtn.classList.remove('pop');
        void favBtn.offsetWidth; // reflow to restart animation
        favBtn.classList.add('pop');
        render(favorites);
      });
    });
  });

  const phones = document.createElement('div');
  phones.className = 'phones';
  const phoneDefs = [
    ['美', result.usPhone, 2],
    ['英', result.ukPhone, 1],
  ];
  for (const [label, phone, type] of phoneDefs) {
    if (!phone) continue;
    const span = document.createElement('span');
    span.className = 'phone';
    span.textContent = `${label} /${phone}/ 🔊`;
    span.title = '点击发音';
    span.addEventListener('click', () => playVoice(result.word, type));
    phones.appendChild(span);
  }
  if (phones.children.length) resultEl.appendChild(phones);

  const defs = document.createElement('div');
  defs.className = 'defs';
  for (const d of result.defs) {
    const div = document.createElement('div');
    div.textContent = d;
    defs.appendChild(div);
  }
  resultEl.appendChild(defs);

  if (result.phrases.length) {
    const phrases = document.createElement('div');
    phrases.className = 'rphrases';
    for (const p of result.phrases) {
      const div = document.createElement('div');
      div.className = 'rphrase';
      const b = document.createElement('b');
      b.textContent = p.text;
      div.append(b, ' ' + p.trans);
      phrases.appendChild(div);
    }
    resultEl.appendChild(phrases);
  }
}

function lookup() {
  const word = inputEl.value.trim();
  if (!word) return;
  if (!isTranslatableWord(word)) {
    showMessage('仅支持单个英文单词');
    return;
  }
  showMessage('查询中…');
  chrome.runtime.sendMessage({ type: 'lookup', word }, (resp) => {
    if (!resp || !resp.ok) {
      showMessage(
        resp && resp.error === 'notfound' ? '未找到该单词' : '查询失败，请检查网络'
      );
      return;
    }
    renderResult(resp.result);
  });
}

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lookup();
});
lookupBtn.addEventListener('click', lookup);
inputEl.focus();

// ---- 其他 ----

refreshList();

document.getElementById('export').addEventListener('click', () => {
  chrome.storage.local.get('favorites', ({ favorites = {} }) => {
    const blob = new Blob([JSON.stringify(favorites, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tiny-translator-favorites.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
});
