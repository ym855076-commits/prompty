/* Prompty add-on: фото из галереи, диктовка голосом, аккуратный вид.
   Подключается одной строкой перед </body>:  <script src="addon.js"></script> */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- Вид ---------- */
  var css = [
    'header{background:radial-gradient(120% 90% at 100% 0%,rgba(255,255,255,.22),transparent 55%),linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 10px 30px -12px rgba(74,108,247,.55)}',
    'header h1{font-size:1.6rem;font-weight:800;letter-spacing:-.02em}',
    '#q{box-shadow:0 6px 18px -8px rgba(0,0,0,.35);transition:box-shadow .2s}',
    '#q:focus{outline:0;box-shadow:0 0 0 3px rgba(255,255,255,.55),0 6px 18px -8px rgba(0,0,0,.35)}',
    '.tools button,.tools a{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:transform .1s}',
    '.tools button:active{transform:scale(.94)}',
    '.chip{transition:background .15s,color .15s,box-shadow .15s}',
    '.chip.on{box-shadow:0 6px 14px -6px var(--accent)}',
    '.role{border-radius:16px}',
    '.item{border-radius:16px;box-shadow:0 1px 2px rgba(20,30,60,.06),0 10px 22px -16px rgba(20,30,60,.4);transition:transform .12s}',
    '.item:active{transform:scale(.985)}',
    '.cmd{background:rgba(74,108,247,.1);padding:1px 8px;border-radius:8px;font-size:.85rem}',
    '.intents button{border-radius:18px;padding:22px 8px;box-shadow:0 1px 2px rgba(20,30,60,.08),0 10px 22px -16px rgba(20,30,60,.45);transition:transform .1s}',
    '.intents button:active{transform:scale(.97)}',
    '.bar{background:color-mix(in srgb,var(--card) 82%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}',
    '.bar a,.acts button,.acts a,.bt{box-shadow:0 8px 18px -10px rgba(0,0,0,.5);transition:transform .1s}',
    '.bar a:active,.acts button:active,.acts a:active,.bt:active{transform:scale(.97)}',
    '.ov{background:rgba(10,14,30,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}',
    '.ov.on{animation:pxf .2s ease}',
    '.ov.on .sheet{animation:pxu .3s cubic-bezier(.2,.85,.25,1)}',
    '.sheet{position:relative;padding-top:26px}',
    '.sheet::before{content:"";position:absolute;top:8px;left:50%;width:42px;height:4px;margin-left:-21px;border-radius:2px;background:var(--line)}',
    '.f:focus{outline:0;border-color:var(--accent);box-shadow:0 0 0 3px rgba(74,108,247,.2)}',
    '.prev{border-left:3px solid var(--accent)}',
    '.toast{max-width:88vw;text-align:center}',
    '@keyframes pxf{from{opacity:0}to{opacity:1}}',
    '@keyframes pxu{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}',
    /* голос */
    '#pxVoice{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:40;display:none;gap:6px;align-items:center}',
    '#pxVoice.on{display:flex}',
    '#pxVoice button{border:0;border-radius:22px;padding:10px 16px;font-weight:700;font-size:.95rem;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 8px 20px -8px rgba(0,0,0,.6)}',
    '#pxVoice #pxLang{background:rgba(30,36,60,.9);padding:10px 12px}',
    '#pxVoice button.rec{background:#e5484d;animation:pxp 1s infinite}',
    '@keyframes pxp{50%{box-shadow:0 0 0 8px rgba(229,72,77,.25)}}',
    /* фото */
    '.pxph{margin:12px 0}',
    '.pxph .row{display:flex;gap:8px}',
    '.pxph .row button{flex:1;padding:12px 6px;border-radius:14px;border:1px solid var(--accent);background:var(--bg);color:var(--accent);font-weight:600;font-size:.92rem}',
    '.pxph .row button:disabled{opacity:.45}',
    '.pxph #pxSend:not(:disabled){background:var(--accent);color:#fff}',
    '.pxth{display:flex;gap:10px;overflow-x:auto;padding-top:8px}',
    '.pxth div{position:relative;flex:none}',
    '.pxth img{width:64px;height:64px;object-fit:cover;border-radius:12px;display:block}',
    '.pxth b{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:#1d2433;color:#fff;font-size:.75rem;display:grid;place-items:center}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var pxToast = document.createElement('div');
  pxToast.className = 'toast';
  document.body.appendChild(pxToast);
  function say(m) {
    var t = pxToast;
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(say.t);
    say.t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }

  /* ---------- Голосовой ввод ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var langs = [['ru-RU', 'RU'], ['tk-TM', 'TM'], ['en-US', 'EN']];
  var li = 0;
  try { li = (+localStorage.getItem('px_lang') || 0) % langs.length; } catch (e) {}
  var last = null, rec = null;

  var box = document.createElement('div');
  box.id = 'pxVoice';
  box.innerHTML = '<button id="pxMic" type="button">🎤 Диктовать</button><button id="pxLang" type="button"></button>';
  document.body.appendChild(box);
  var mic = $('#pxMic'), lang = $('#pxLang');
  lang.textContent = langs[li][1];

  document.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('.ov .f')) last = e.target;
  });

  lang.addEventListener('click', function () {
    if (rec) rec.stop();
    li = (li + 1) % langs.length;
    lang.textContent = langs[li][1];
    try { localStorage.setItem('px_lang', li); } catch (e) {}
    say('Язык диктовки: ' + langs[li][1]);
  });

  mic.addEventListener('click', function () {
    if (!SR) { say('Диктовка не работает в этом браузере. Нажмите микрофон на клавиатуре'); return; }
    if (rec) { rec.stop(); return; }
    var f = last && document.contains(last) ? last : $('.ov.on .f');
    if (!f) { say('Сначала нажмите на поле'); return; }
    rec = new SR();
    rec.lang = langs[li][0];
    rec.interimResults = false;
    rec.continuous = false;
    rec.onstart = function () { mic.classList.add('rec'); mic.textContent = '⏹ Слушаю…'; };
    rec.onresult = function (ev) {
      var t = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      t = t.trim();
      if (!t) return;
      var v = f.value;
      f.value = (v && !/\s$/.test(v) ? v + ' ' : v) + t;
      f.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = function (ev) {
      var m = {
        'not-allowed': 'Разрешите микрофон для этого сайта',
        'service-not-allowed': 'Разрешите микрофон для этого сайта',
        'language-not-supported': 'Этот язык не поддерживается, выберите RU',
        'no-speech': 'Ничего не слышно, попробуйте ещё раз',
        'network': 'Для диктовки нужен интернет'
      }[ev.error];
      say(m || 'Диктовка не сработала');
    };
    rec.onend = function () { rec = null; mic.classList.remove('rec'); mic.textContent = '🎤 Диктовать'; };
    try { rec.start(); } catch (e) { rec = null; }
  });

  /* ---------- Фото из галереи ---------- */
  var photos = [], urls = [];

  function shrink(file) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s);
        c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          res(b ? new File([b], 'photo-' + Date.now() + '.jpg', { type: 'image/jpeg' }) : file);
        }, 'image/jpeg', 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(url); res(file); };
      im.src = url;
    });
  }

  function renderThumbs() {
    var th = $('#pxTh'), send = $('#pxSend');
    if (!th) return;
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
    th.innerHTML = '';
    photos.forEach(function (p, i) {
      var u = URL.createObjectURL(p), d = document.createElement('div');
      urls.push(u);
      d.innerHTML = '<img alt=""><b role="button" aria-label="Убрать фото">✕</b>';
      d.firstChild.src = u;
      d.lastChild.addEventListener('click', function () { photos.splice(i, 1); renderThumbs(); });
      th.appendChild(d);
    });
    send.disabled = !photos.length;
  }

  function buildPhoto() {
    var sheet = $('#ov .sheet');
    if (!sheet || $('.pxph', sheet)) return;
    var before = $('.acts', sheet);
    var d = document.createElement('div');
    d.className = 'pxph';
    d.innerHTML = '<div class="row"><button type="button" id="pxAdd">📷 Добавить фото</button><button type="button" id="pxSend" disabled>Отправить с фото</button></div><div class="pxth" id="pxTh"></div><input type="file" id="pxFile" accept="image/*" multiple hidden>';
    sheet.insertBefore(d, before);
    var inp = $('#pxFile');
    $('#pxAdd').addEventListener('click', function () { inp.click(); });
    inp.addEventListener('change', function () {
      var files = Array.prototype.slice.call(inp.files || [], 0, 6 - photos.length);
      inp.value = '';
      Promise.all(files.map(shrink)).then(function (r) { photos = photos.concat(r); renderThumbs(); });
    });
    $('#pxSend').addEventListener('click', function () {
      var p = $('#sP'), text = ((p && p.innerText) || '').trim();
      var go = navigator.clipboard ? navigator.clipboard.writeText(text).catch(function () {}) : Promise.resolve();
      go.then(function () {
        if (navigator.canShare && navigator.canShare({ files: photos })) {
          return navigator.share({ files: photos, text: text }).then(function () {
            say('Если текст не появился, вставьте его: он в буфере');
          }, function (e) { if (e && e.name !== 'AbortError') say('Не получилось отправить. Текст скопирован'); });
        }
        say('Текст скопирован. Откройте чат и прикрепите фото скрепкой');
      });
    });
  }

  /* ---------- Следим за окнами ---------- */
  function sync() {
    box.classList.toggle('on', !!$('.ov.on'));
    if (!$('#ov.on') && photos.length) { photos = []; renderThumbs(); }
  }
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  buildPhoto();
  sync();
})();
