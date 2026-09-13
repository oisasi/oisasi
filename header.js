/* =========================================================
   header.js
   共通ヘッダーを fetch で読み込んで挿入し、
   挿入完了後にハンバーガーメニューの開閉イベントを登録する。

   ★重要:
   - <div id="header-placeholder"></div> の中身はページ読み込み直後は空です。
   - fetch は非同期処理なので、HTMLが挿入されるのは
     DOMContentLoaded より "後" になります。
   - そのため document.getElementById('hamburgerBtn') などは
     「挿入が終わった後」に取得・addEventListener しないと
     null になり、クリックしても何も起きません。
   - 対処法は主に2つ:
     (A) fetch → insertAdjacentHTML/innerHTML の完了を await してから、
         その中の要素を取得してイベント登録する（このファイルの方式）
     (B) 親要素（document）にイベント委任(delegation)して、
         ヘッダーがまだ無くても後から効くようにする
   ========================================================= */

(async function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) {
    console.warn('[header.js] #header-placeholder が見つかりません。');
    return;
  }

  try {
    // 1. header.html を取得する
    //    ルート直下に置く前提で絶対パス "/header.html" を使うと、
    //    サブディレクトリのページ(例: /blog/post.html)からでも
    //    パスがずれずに済む（Cloudflare Pages はルート基準で配信されるため）。
    const res = await fetch('/header.html');
    if (!res.ok) {
      throw new Error(`header.html の取得に失敗しました: ${res.status}`);
    }
    const html = await res.text();

    // 2. 取得したHTMLをDOMに挿入する
    placeholder.innerHTML = html;

    // 3. ★挿入が終わった「この後」で初めて要素が存在する状態になる。
    //    ここで初めて要素取得・イベント登録を行う。
    initHamburgerMenu();
    initScrollEffect();

  } catch (err) {
    console.error('[header.js] ヘッダーの読み込みに失敗しました:', err);
    // フォールバック表示（任意）
    placeholder.innerHTML =
      '<p style="text-align:center;padding:12px;">メニューの読み込みに失敗しました</p>';
  }
})();

/**
 * ハンバーガーメニューの開閉処理
 * header.html が挿入された後に呼び出される想定。
 */
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMobile = document.getElementById('navMobile');

  if (!hamburgerBtn || !navMobile) {
    console.warn('[header.js] hamburgerBtn または navMobile が見つかりません。');
    return;
  }

  function openMenu() {
    navMobile.classList.add('open');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // 背景スクロール抑止
  }

  function closeMenu() {
    navMobile.classList.remove('open');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const isOpen = navMobile.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  }

  // ボタンクリックで開閉
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // メニュー内のリンクをクリックしたら閉じる
  navMobile.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (
      navMobile.classList.contains('open') &&
      !navMobile.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // 画面幅を広げてPC表示に戻ったときは開閉状態をリセット
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

/**
 * スクロールでヘッダーの見た目を変える処理（任意の例）
 */
function initScrollEffect() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  window.addEventListener(
    'scroll',
    () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    },
    { passive: true }
  );
}
