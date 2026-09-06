(() => {
  const WORD_RE = /^[A-Za-z]{1,45}$/;
  const VOICE_URL = 'https://dict.youdao.com/dictvoice?audio=';

  let host = null;
  let shadow = null;
  let badge = null;
  let card = null;
  let currentWord = '';

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .tt-badge {
      position: absolute;
      width: 22px; height: 22px;
      border-radius: 50%;
      background: #4a7cf7;
      color: #fff;
      font: bold 12px/22px -apple-system, sans-serif;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,.3);
      user-select: none;
    }
    .tt-badge:hover { background: #3565e0; }
    .tt-card {
      position: absolute;
      width: 300px;
      background: #fff;
      color: #222;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
      font: 14px/1.5 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
      padding: 12px 14px;
    }
    .tt-head { display: flex; align-items: center; gap: 8px; }
    .tt-word { font-size: 18px; font-weight: 600; }
    .tt-fav {
      margin-left: auto;
      border: none; background: none;
      font-size: 20px; line-height: 1; cursor: pointer;
      color: #ccc;
      padding: 2px 4px; border-radius: 6px;
      transition: color .15s ease, transform .15s ease, background .15s ease;
    }
    .tt-fav:hover { background: rgba(0,0,0,.05); }
    .tt-fav.on { color: #f5a623; }
    .tt-fav.pop { animation: tt-fav-pop .3s ease; }
    @keyframes tt-fav-pop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.4); }
      70%  { transform: scale(.9); }
      100% { transform: scale(1); }
    }
    .tt-phones { margin: 4px 0 8px; color: #666; font-size: 13px; }
    .tt-phone { cursor: pointer; margin-right: 10px; }
    .tt-phone:hover { color: #4a7cf7; }
    .tt-defs div { margin-bottom: 2px; }
    .tt-phrases { margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px; }
    .tt-phrase { margin-bottom: 4px; font-size: 13px; }
    .tt-phrase b { font-weight: 600; }
    .tt-phrase span { color: #666; }
    .tt-msg { color: #999; }
  `;

  function ensureHost() {
    if (host && host.isConnected) return;
    host = document.createElement('div');
    host.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;';
    shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    shadow.appendChild(style);
    (document.body || document.documentElement).appendChild(host);
  }

  function hideAll() {
    if (badge) { badge.remove(); badge = null; }
    hideCard();
  }

  function hideCard() {
    if (card) { card.remove(); card = null; }
  }

  function showBadge(x, y, word) {
    ensureHost();
    hideAll();
    currentWord = word;
    badge = document.createElement('div');
    badge.className = 'tt-badge';
    badge.textContent = '译';
    badge.style.left = x + 'px';
    badge.style.top = y + 'px';
    badge.addEventListener('mousedown', (e) => e.stopPropagation());
    badge.addEventListener('click', () => {
      const bx = parseFloat(badge.style.left);
      const by = parseFloat(badge.style.top);
      badge.remove();
      badge = null;
      openCard(bx, by, word);
    });
    shadow.appendChild(badge);
  }

  function openCard(x, y, word) {
    hideCard();
    card = document.createElement('div');
    card.className = 'tt-card';
    card.style.left = Math.min(x, window.scrollX + window.innerWidth - 320) + 'px';
    card.style.top = y + 4 + 'px';
    card.addEventListener('mousedown', (e) => e.stopPropagation());
    card.innerHTML = '<div class="tt-msg">查询中…</div>';
    shadow.appendChild(card);

    chrome.runtime.sendMessage({ type: 'lookup', word }, (resp) => {
      if (!card) return;
      if (!resp || !resp.ok) {
        card.innerHTML = '';
        card.appendChild(msgEl(
          resp && resp.error === 'notfound' ? '未找到该单词' : '查询失败，请检查网络'
        ));
        return;
      }
      renderCard(resp.result);
    });
  }

  function msgEl(text) {
    const div = document.createElement('div');
    div.className = 'tt-msg';
    div.textContent = text;
    return div;
  }

  function playVoice(word, type) {
    new Audio(VOICE_URL + encodeURIComponent(word) + '&type=' + type)
      .play()
      .catch(() => {});
  }

  function renderCard(result) {
    card.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'tt-head';
    const wordEl = document.createElement('span');
    wordEl.className = 'tt-word';
    wordEl.textContent = result.word;
    const favBtn = document.createElement('button');
    favBtn.className = 'tt-fav';
    favBtn.textContent = '☆';
    favBtn.title = '收藏';
    head.append(wordEl, favBtn);
    card.appendChild(head);

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
        });
      });
    });

    const phones = document.createElement('div');
    phones.className = 'tt-phones';
    const phoneDefs = [
      ['美', result.usPhone, 2],
      ['英', result.ukPhone, 1],
    ];
    for (const [label, phone, type] of phoneDefs) {
      if (!phone) continue;
      const span = document.createElement('span');
      span.className = 'tt-phone';
      span.textContent = `${label} /${phone}/ 🔊`;
      span.title = '点击发音';
      span.addEventListener('click', () => playVoice(result.word, type));
      phones.appendChild(span);
    }
    if (phones.children.length) card.appendChild(phones);

    const defs = document.createElement('div');
    defs.className = 'tt-defs';
    for (const d of result.defs) {
      const div = document.createElement('div');
      div.textContent = d;
      defs.appendChild(div);
    }
    card.appendChild(defs);

    if (result.phrases.length) {
      const phrases = document.createElement('div');
      phrases.className = 'tt-phrases';
      for (const p of result.phrases) {
        const div = document.createElement('div');
        div.className = 'tt-phrase';
        const b = document.createElement('b');
        b.textContent = p.text;
        const span = document.createElement('span');
        span.textContent = ' ' + p.trans;
        div.append(b, span);
        phrases.appendChild(div);
      }
      card.appendChild(phrases);
    }
  }

  document.addEventListener('mouseup', (e) => {
    if (host && e.composedPath().includes(host)) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!WORD_RE.test(text)) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      showBadge(
        rect.right + window.scrollX + 4,
        rect.bottom + window.scrollY + 4,
        text
      );
    }, 0);
  });

  document.addEventListener('mousedown', (e) => {
    if (host && e.composedPath().includes(host)) return;
    hideAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAll();
  });
})();
