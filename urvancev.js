/*! urvancev-ux v1.0.0 | JS для лендинга «Антикризисная стратегическая сессия» (Tilda)
 *
 *  Что делает:
 *   1. Типографика: неразрывные пробелы после предлогов, союзов и частиц, перед тире,
 *      внутри чисел, телефонов, инициалов; последние два слова абзаца не разрываются.
 *   2. Абзацы: двойные <br> превращаются в <p>, лишние одиночные <br> посреди
 *      предложения заменяются пробелом, жирный заход абзаца выделяется классом .u-lead.
 *   3. Мобильная панель «Обсудить ситуацию» + звонок.
 *   4. Мелочи: высота меню для якорей, атрибуты автозаполнения, alt у картинок, lang="ru".
 *
 *  Отключить обработку для блока: добавьте атрибут data-no-typo на любой родительский элемент.
 */
(function () {
  'use strict';

  var NBSP = '\u00A0';

  /* ================= Настройки ================= */
  var CONFIG = {
    root: '#allrecords',
    ctaText: 'Обсудить ситуацию',
    ctaTarget: '#zayavka',
    phoneHref: 'tel:+79035305894',
    stickyMaxWidth: 768,          // px: панель показывается на экранах не шире
    showAfter: 0.7,               // панель появляется после прокрутки на 0.7 высоты экрана
    maxBindLength: 22,            // макс. длина склейки «предпоследнее + последнее слово»
    altByUrlPart: {               // подписи для картинок без alt (часть адреса картинки → alt)
      'tild3933-3962-4436-a263-353835326338': 'Логотипы компаний-клиентов'
    }
  };

  var TEXT_BLOCKS = '.t-text, .t-descr, .t-title, .t-heading, .t-name, p, li, h1, h2, h3, h4, h5, h6, figcaption';
  var SKIP = 'script, style, noscript, textarea, input, select, option, code, pre, svg, [contenteditable], [data-no-typo]';

  /* ================= 1. Типографика ================= */

  // Слова, после которых пробел делаем неразрывным
  var SHORT_WORDS = [
    'а', 'б', 'в', 'ж', 'и', 'к', 'о', 'с', 'у', 'я',
    'бы', 'во', 'да', 'до', 'же', 'за', 'из', 'ко', 'ли', 'на', 'не', 'ни', 'но',
    'об', 'от', 'по', 'со', 'то', 'мы', 'вы', 'он', 'их',
    'без', 'для', 'над', 'обо', 'под', 'при', 'про', 'или', 'что', 'как', 'чем'
  ].join('|');

  var RE_SHORT = new RegExp(
    '(^|[\\s(«„“‘—–-])(' + SHORT_WORDS + ')(?:\\s+(?=\\S)|\\s+$)', 'giu'
  );
  var RE_DASH = /\s+([–—])(?=\s)/g;                      // слово — слово
  var RE_HYPHEN_DASH = /\s-\s/g;                         // слово - слово → слово – слово
  var RE_DIGIT_DIGIT = /(\d)[ \t\n\r]+(?=\d)/g;          // 230 000, +7 903 530
  var RE_NUM_WORD = /([\d+%])[ \t\n\r]+(?=[A-Za-zА-Яа-яЁё₽])/g; // 90 дней, 500+ проектов, 230 000 ₽
  var RE_INITIALS = /([А-ЯЁ]\.)[ \t\n\r]+(?=[А-ЯЁ])/g;   // А.Н. Радчук
  var RE_ORG = /(^|[\s«„“])(ООО|ОАО|ЗАО|ПАО|АО|ИП)[ \t\n\r]+(?=\S)/g;

  function typo(str) {
    var out = str;
    out = out.replace(RE_HYPHEN_DASH, NBSP + '– ');
    out = out.replace(RE_DASH, NBSP + '$1');
    // два прохода: «и в доме» — второй предлог иначе пропускается
    for (var i = 0; i < 2; i++) {
      out = out.replace(RE_SHORT, function (m, pre, word) { return pre + word + NBSP; });
    }
    out = out.replace(RE_DIGIT_DIGIT, '$1' + NBSP);
    out = out.replace(RE_NUM_WORD, '$1' + NBSP);
    out = out.replace(RE_INITIALS, '$1' + NBSP);
    out = out.replace(RE_ORG, '$1$2' + NBSP);
    return out;
  }

  function textNodes(root) {
    var list = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) list.push(walker.currentNode);
    return list;
  }

  function applyTypography(root) {
    textNodes(root).forEach(function (node) {
      var next = typo(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  // Последние два слова блока не разрываем, чтобы в конце не оставалось одно слово
  function bindTails(root) {
    root.querySelectorAll(TEXT_BLOCKS).forEach(function (el) {
      if (el.closest(SKIP)) return;
      var nodes = textNodes(el);
      if (!nodes.length) return;
      var node = nodes[nodes.length - 1];
      var m = /(\S+)([ \t\n\r]+)(\S+)([ \t\n\r]*)$/.exec(node.nodeValue);
      if (!m) return;
      if (m[1].length + m[3].length + 1 > CONFIG.maxBindLength) return;
      node.nodeValue = node.nodeValue.slice(0, m.index) + m[1] + NBSP + m[3] + m[4];
    });
  }

  /* ================= 2. Абзацы и ручные переносы ================= */

  // Двойные <br> → абзацы <p class="u-p">
  function splitParagraphs(root) {
    root.querySelectorAll('.t-text, .t-descr, [data-paragraphs]').forEach(function (el) {
      if (el.closest(SKIP)) return;
      if (el.querySelector('p, ul, ol, div, table, h1, h2, h3, h4, h5, h6')) return;
      var html = el.innerHTML;
      if (!/(<br\s*\/?>\s*){2,}/i.test(html)) return;
      html = html
        .replace(/^(\s*<br\s*\/?>)+/i, '')
        .replace(/(<br\s*\/?>\s*)+$/i, '')
        .replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, '</p><p class="u-p">');
      el.innerHTML = '<p class="u-p">' + html + '</p>';
    });
  }

  function textBefore(br) {
    var n = br.previousSibling;
    while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.previousSibling;
    if (!n) return '';
    return (n.textContent || '').replace(/\s+$/, '');
  }
  function textAfter(br) {
    var n = br.nextSibling;
    while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
    if (!n) return '';
    if (n.nodeType === 1 && n.tagName === 'BR') return '';
    return (n.textContent || '').replace(/^\s+/, '');
  }

  // Одиночный <br> посреди предложения («выходите<br>с планом») → пробел.
  // Оставляем, если перед ним конец предложения или после него заглавная буква.
  function fixHardBreaks(root) {
    root.querySelectorAll(TEXT_BLOCKS).forEach(function (el) {
      if (el.closest(SKIP)) return;
      Array.prototype.slice.call(el.querySelectorAll('br')).forEach(function (br) {
        if (br.hasAttribute('data-keep')) return;
        var before = textBefore(br);
        var after = textAfter(br);
        if (!before || !after) return;
        if (/[.!?…:;»”)]$/.test(before)) return;
        if (!/^[а-яёa-z]/.test(after)) return;
        br.parentNode.replaceChild(document.createTextNode(' '), br);
      });
    });
  }

  // Жирный заход в начале абзаца → .u-lead (CSS выводит его отдельной строкой)
  function markLeads(root) {
    root.querySelectorAll('.t-text, .t-descr, p').forEach(function (el) {
      if (el.closest(SKIP)) return;
      var first = el.firstChild;
      while (first && first.nodeType === 3 && !first.nodeValue.trim()) first = first.nextSibling;
      if (!first || first.nodeType !== 1) return;
      if (first.tagName !== 'STRONG' && first.tagName !== 'B') return;
      var lead = (first.textContent || '').trim();
      var total = (el.textContent || '').trim();
      if (!/[.:]$/.test(lead)) return;                    // заход заканчивается точкой или двоеточием
      if (total.length - lead.length < 20) return;       // абзац из одного жирного — не заход
      first.classList.add('u-lead');
    });
  }

  /* ================= 3. Нижняя панель ================= */

  function initStickyCta() {
    if (document.querySelector('.u-cta')) return;

    var bar = document.createElement('div');
    bar.className = 'u-cta';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Быстрая связь');
    bar.innerHTML =
      '<a class="u-cta__main" href="' + CONFIG.ctaTarget + '">' + CONFIG.ctaText + '</a>' +
      '<a class="u-cta__call" href="' + CONFIG.phoneHref + '" aria-label="Позвонить">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>' +
      '</a>';
    document.body.appendChild(bar);

    // Цвет берём с существующей кнопки заявки, чтобы не выдумывать палитру
    var btn = document.querySelector(CONFIG.root + ' a.t-btn[href="' + CONFIG.ctaTarget + '"], ' +
                                     CONFIG.root + ' a[href="' + CONFIG.ctaTarget + '"][class*="btn"]');
    if (btn) {
      var cs = window.getComputedStyle(btn);
      var bg = cs.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        document.documentElement.style.setProperty('--u-cta-bg', bg);
        document.documentElement.style.setProperty('--u-cta-fg', cs.color);
        if (cs.borderRadius) document.documentElement.style.setProperty('--u-cta-radius', cs.borderRadius);
      }
    }

    var anchor = document.querySelector('a[name="zayavka"], [id="zayavka"]');
    var typing = false;
    var ticking = false;

    function update() {
      ticking = false;
      var mobile = window.innerWidth <= CONFIG.stickyMaxWidth;
      var show = mobile && !typing && window.pageYOffset > window.innerHeight * CONFIG.showAfter;
      if (show && anchor) {
        // Когда дошли до формы, панель не нужна
        if (anchor.getBoundingClientRect().top < window.innerHeight * 0.85) show = false;
      }
      bar.classList.toggle('is-visible', show);
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Пока открыта клавиатура, панель прячем
    document.addEventListener('focusin', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { typing = true; update(); }
    });
    document.addEventListener('focusout', function () { typing = false; onScroll(); });
    update();
  }

  /* ================= 4. Мелочи ================= */

  function measureHeader() {
    var fixed = document.querySelectorAll(
      CONFIG.root + ' [class*="positionfixed"], ' + CONFIG.root + ' header'
    );
    var h = 0;
    Array.prototype.forEach.call(fixed, function (el) {
      var pos = window.getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') h = Math.max(h, el.offsetHeight);
    });
    if (h) document.documentElement.style.setProperty('--u-header-h', h + 'px');
  }

  function enhanceForms(root) {
    root.querySelectorAll('input, textarea').forEach(function (el) {
      if (el.hasAttribute('autocomplete')) return;
      var key = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.placeholder || '')).toLowerCase();
      if (/name|имя/.test(key)) el.setAttribute('autocomplete', 'name');
      else if (/company|компан/.test(key)) el.setAttribute('autocomplete', 'organization');
      // Поле «Телефон или Telegram» намеренно не трогаем: type=tel закрыл бы ввод @ника
    });
  }

  function enhanceMedia(root) {
    root.querySelectorAll('img').forEach(function (img) {
      if (!img.hasAttribute('alt')) {
        var alt = '';
        var src = img.getAttribute('src') || img.getAttribute('data-original') || '';
        Object.keys(CONFIG.altByUrlPart).forEach(function (part) {
          if (src.indexOf(part) !== -1) alt = CONFIG.altByUrlPart[part];
        });
        img.setAttribute('alt', alt);
      }
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
    root.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /* ================= Запуск ================= */

  function run() {
    var root = document.querySelector(CONFIG.root);
    if (!root) return;
    if (!document.documentElement.lang) document.documentElement.lang = 'ru';

    splitParagraphs(root);   // сначала структура
    fixHardBreaks(root);
    markLeads(root);
    applyTypography(root);   // потом пробелы
    bindTails(root);
    enhanceForms(root);
    enhanceMedia(root);
    measureHeader();
    initStickyCta();
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  if (typeof document !== 'undefined') {
    ready(run);
    // Tilda дорисовывает часть блоков после загрузки; все шаги безопасны при повторном запуске
    window.addEventListener('load', function () { run(); setTimeout(run, 1200); });
    // Для ручного вызова из консоли
    window.UrvancevUX = { typo: typo, run: run };
  }
  // Для тестов в Node
  if (typeof module !== 'undefined' && module.exports) module.exports = { typo: typo };
})();
