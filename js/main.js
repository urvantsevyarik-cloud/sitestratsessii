/* Настройки. Заполните перед публикацией. */
const CONFIG = {
  FORM_ENDPOINT: "",        // адрес приёма заявок (Formspree, Getform, свой сервер). Пока пусто – форма сообщит, что не подключена
  YM_ID: "",                // номер счётчика Яндекс.Метрики, например "12345678"
  VK_PIXEL_ID: "",          // номер пикселя VK Реклама / top.mail.ru
  POLICY_URL: "#",          // ссылка на политику обработки персональных данных
  REQS_URL: "#",            // ссылка на реквизиты ИП
  TELEGRAM: "https://t.me/AlexeyUrvancev"
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const q = new URLSearchParams(location.search);
const rub = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0\u20bd";

/* Счётчики. Подключаются, только если указан номер. */
if (CONFIG.YM_ID) {
  (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  ym(CONFIG.YM_ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}
if (CONFIG.VK_PIXEL_ID) {
  const _tmr = window._tmr || (window._tmr = []);
  _tmr.push({ id: CONFIG.VK_PIXEL_ID, type: "pageView", start: new Date().getTime() });
  const s = document.createElement("script"); s.async = true; s.src = "https://top-fwz1.mail.ru/js/code.js"; document.head.appendChild(s);
}
function goal(pos) {
  try { if (CONFIG.YM_ID) ym(CONFIG.YM_ID, "reachGoal", "lead", { form_position: pos }); } catch (e) {}
  try { if (CONFIG.VK_PIXEL_ID) (window._tmr = window._tmr || []).push({ type: "reachGoal", id: CONFIG.VK_PIXEL_ID, goal: "lead" }); } catch (e) {}
}

/* Ссылки в подвале */
$$("[data-policy]").forEach(a => a.href = CONFIG.POLICY_URL);
$$("[data-reqs]").forEach(a => a.href = CONFIG.REQS_URL);

/* Заголовок: ?h=a или ?h=b для теста */
const heads = {
  main: "План на 90 дней, который <b class=\"ac\">команда начнёт выполнять в понедельник</b>",
  a: "Что делать, когда <b class=\"ac\">резать уже нечего</b>, а продажи всё равно падают",
  b: "В антикризисном плане записано, <b class=\"ac\">когда мы из него выходим</b>. В обычном – нет"
};
const variant = heads[q.get("h")] ? q.get("h") : "main";
$("#h1").innerHTML = heads[variant];

/* Мобильное меню */
const hdr = $("#top"), burger = $("#burger");
burger.addEventListener("click", () => {
  const open = hdr.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
$$("#nav a").forEach(a => a.addEventListener("click", () => { hdr.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }));

/* Вопросы с «?» */
const ANS = [
  ["Справедливо.", "Поэтому начинаем с разговора, а не с сессии: <mark>если задача решается без неё, я так и скажу</mark>."],
  ["Обычно причина в составе групп.", "Топы оказались в одной группе с подчинёнными и разобрали их идеи как нереальные. Это решается до сессии, а не модерацией по ходу."],
  ["За один день успеть можно только диагностику.", "Если два дня подряд выделить невозможно, разносим их по графику."],
  ["Решения остались без ответственного, срока и критерия проверки.", "Поэтому план внедрения собирается на самой сессии, а не высылается потом."],
  ["Отрасль знаете вы и ваша команда.", "Моя работа – сделать так, чтобы это знание вышло на стол и превратилось в решения."],
  ["Очно, на вашей территории.", ""],
  ["Диагностика – 200\u00a0000\u00a0₽, день сессии – 200\u00a0000\u00a0₽, сопровождение – 400\u00a0000\u00a0₽ за 16 часов.", "Это ориентир: итоговая стоимость – после диагностики. Для юридических лиц РФ при заказе от 500\u00a0000\u00a0₽ возможна рассрочка или факторинг."]
];
const qps = $$(".qp");
qps.forEach(b => b.addEventListener("click", () => {
  qps.forEach(x => x.setAttribute("aria-pressed", x === b));
  const a = ANS[+b.dataset.k];
  $("#qa").innerHTML = `<b>${a[0]}</b>${a[1]}`;
}));

/* Диалоги */
const formDlg = $("#formDlg"), lbDlg = $("#lbDlg");
const closeOnBackdrop = d => d.addEventListener("click", e => { if (e.target === d) d.close(); });
[formDlg, lbDlg].forEach(closeOnBackdrop);
$$("dialog [data-close]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
$$("[data-open-form]").forEach(b => b.addEventListener("click", () => { hdr.classList.remove("open"); formDlg.showModal(); }));
$$("[data-letter]").forEach(b => b.addEventListener("click", () => {
  $("#lbImg").src = b.dataset.letter; $("#lbImg").alt = b.dataset.alt; lbDlg.showModal();
}));

/* Липкая кнопка на телефоне: прячется, когда рядом уже есть форма или кнопка */
const st = $("#sticky"), seen = new Map();
if ("IntersectionObserver" in window) {
  const io2 = new IntersectionObserver(es => { es.forEach(e => seen.set(e.target, e.isIntersecting)); st.classList.toggle("off", [...seen.values()].some(Boolean)); }, { threshold: .15 });
  $$(".hero, .fband, .fdark").forEach(x => io2.observe(x));
}

/* Формы */
function formHTML(pos) {
  const hid = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "erid"]
    .map(k => `<input type="hidden" name="${k}" value="${(q.get(k) || "").replace(/"/g, "&quot;")}">`).join("");
  const consent = pos === "final" || pos === "popup"
    ? `<label class="chk"><input type="checkbox" name="consent" required><span>Согласен на обработку персональных данных (<a href="${CONFIG.POLICY_URL}">политика</a>)</span></label>`
    : `<p class="small" style="margin-bottom:14px">Нажимая кнопку, вы соглашаетесь с <a href="${CONFIG.POLICY_URL}">политикой обработки персональных данных</a>.</p>`;
  return `<form novalidate>
<div class="f"><input type="text" name="name" placeholder="Имя" autocomplete="name" aria-label="Имя" required>
<input type="text" name="contact" placeholder="Телефон или Telegram" autocomplete="tel" aria-label="Телефон или Telegram" required></div>
${hid}<input type="hidden" name="headline_variant" value="${variant}"><input type="hidden" name="form_position" value="${pos}">
${consent}<button class="btn" type="submit">Обсудить ситуацию компании</button><p class="err" role="alert" hidden></p></form>`;
}
$$("[data-form]").forEach(box => {
  const pos = box.dataset.form;
  box.innerHTML = formHTML(pos);
  const f = $("form", box), err = $(".err", box);
  const fail = (t, el) => { err.hidden = false; err.textContent = t; el && el.focus(); };
  f.addEventListener("submit", async e => {
    e.preventDefault(); err.hidden = true;
    const bad = $$("input[required]", f).find(i => i.type === "checkbox" ? !i.checked : !i.value.trim());
    if (bad) return fail(bad.type === "checkbox" ? "Подтвердите согласие на обработку данных." : "Заполните имя и телефон или Telegram.", bad);
    if (!CONFIG.FORM_ENDPOINT) return fail("Форма пока не подключена к приёму заявок. Напишите в Telegram @AlexeyUrvancev.");
    try {
      const r = await fetch(CONFIG.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      if (!r.ok) throw 0;
      goal(pos);
      box.innerHTML = '<p class="ok" role="status">Заявка получена. Напишу или позвоню в течение рабочего дня, чтобы договориться о времени разговора.</p>';
    } catch { fail("Не удалось отправить. Попробуйте ещё раз или напишите в Telegram @AlexeyUrvancev."); }
  });
});

