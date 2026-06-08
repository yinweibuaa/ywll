/**
 * YWLL Love Site - App Core
 * 数据存储：localStorage
 */
(function () {
  'use strict';

  const DB = {
    album: 'ywll_album',
    blog: 'ywll_blog',
    guestbook: 'ywll_guestbook',
    admin: 'ywll_admin',
    auth: 'ywll_auth'
  };

  const ADMIN_HASH = 'e711f7eaed384c863a9f00eab807308ea66614b877d2a5aa842cd3fc2eab50d8';

  // ===== 工具函数 =====
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }
  function uuid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function fmtDate(d) {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function sha256(text) {
    const buf = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', buf).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''));
  }
  async function checkAdmin() {
    const token = localStorage.getItem(DB.auth);
    if (!token) return false;
    return await sha256(token) === ADMIN_HASH;
  }
  async function loginAdmin(pwd) {
    const h = await sha256(pwd);
    if (h === ADMIN_HASH) {
      localStorage.setItem(DB.auth, pwd);
      return true;
    }
    return false;
  }
  function logoutAdmin() { localStorage.removeItem(DB.auth); }

  // ===== 数据操作 =====
  function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function getAlbum() { return getData(DB.album); }
  function setAlbum(v) { setData(DB.album, v); }
  function addAlbum(item) { const a = getAlbum(); a.unshift({ ...item, id: uuid(), date: fmtDate() }); setAlbum(a); return a; }
  function delAlbum(id) { const a = getAlbum().filter(x => x.id !== id); setAlbum(a); return a; }

  function getBlog() { return getData(DB.blog); }
  function setBlog(v) { setData(DB.blog, v); }
  function addBlog(item) { const a = getBlog(); a.unshift({ ...item, id: uuid(), date: fmtDate() }); setBlog(a); return a; }
  function updBlog(id, item) { const a = getBlog().map(x => x.id === id ? { ...x, ...item } : x); setBlog(a); return a; }
  function delBlog(id) { const a = getBlog().filter(x => x.id !== id); setBlog(a); return a; }

  function getGuestbook() { return getData(DB.guestbook); }
  function setGuestbook(v) { setData(DB.guestbook, v); }
  function addGuestbook(item) { const a = getGuestbook(); a.unshift({ ...item, id: uuid(), date: fmtDate() }); setGuestbook(a); return a; }
  function delGuestbook(id) { const a = getGuestbook().filter(x => x.id !== id); setGuestbook(a); return a; }

  function getAdminSettings() {
    try { return JSON.parse(localStorage.getItem(DB.admin)) || {}; } catch { return {}; }
  }
  function setAdminSettings(v) { localStorage.setItem(DB.admin, JSON.stringify(v)); }

  // ===== 初始化示例数据 =====
  function initDemoData() {
    if (localStorage.getItem('ywll_inited')) return;
    // 默认相册数据（使用本地图片路径）
    setAlbum([
      { id: uuid(), title: '相遇的那一天', desc: '阳光正好，微风不燥，你出现在我生命里。', src: 'photo1.jpg', date: '2023-05-20' },
      { id: uuid(), title: '第一次旅行', desc: '牵着你的手，走遍世界的每一个角落。', src: 'photo2.jpg', date: '2023-10-01' },
      { id: uuid(), title: '求婚时刻', desc: '单膝跪地，许下一生的承诺。', src: 'photo3.jpg', date: '2024-02-14' },
    ]);
    // 默认博客
    setBlog([
      { id: uuid(), title: '我们的故事，从这里开始', content: '还记得第一次见面的那个下午，阳光透过窗帘洒在你的发梢，那一刻我就知道，你会是我生命中最重要的人。从相识到相知，从相知到相爱，每一步都走得踏实而坚定。\n\n爱情不是轰轰烈烈，而是细水长流。是清晨的一句早安，是深夜的一杯热牛奶，是疲惫时的一个拥抱。谢谢你，出现在我的生命里。', date: '2023-05-20', tags: '爱情,纪念日' },
      { id: uuid(), title: '写给未来的我们', content: '亲爱的，当我们白发苍苍的时候，希望还能像现在这样，手牵着手在夕阳下散步。\n\n我想和你一起看遍四季更迭，春赏花、夏听雨、秋望月、冬踏雪。无论未来有多少风雨，我都愿意做你的避风港。\n\n愿岁月温柔待你，愿我们永远相爱。', date: '2024-02-14', tags: '未来,承诺' },
    ]);
    // 默认留言
    setGuestbook([
      { id: uuid(), name: '小明', message: '祝你们永远幸福！白头偕老！', date: '2024-06-01' },
      { id: uuid(), name: '小红', message: '羡慕你们的爱情，要一直甜蜜下去呀~', date: '2024-06-02' },
    ]);
    localStorage.setItem('ywll_inited', '1');
  }

  // ===== 图片压缩工具（用于上传） =====
  function compressImage(file, maxW = 1200, maxH = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ===== 模态框 =====
  function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('open'); }
  function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }

  // ===== Lightbox =====
  function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (lb && img) { img.src = src; lb.classList.add('open'); }
  }
  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
  }

  // ===== Toast =====
  function toast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:400;padding:10px 22px;border-radius:999px;background:#333;color:#fff;font-size:14px;opacity:0;transition:opacity .3s;pointer-events:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = type === 'error' ? '#c0392b' : '#27ae60';
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2200);
  }

  // ===== 暴露全局 =====
  window.YWLL = {
    $, $$, uuid, fmtDate, sha256, checkAdmin, loginAdmin, logoutAdmin,
    getAlbum, setAlbum, addAlbum, delAlbum,
    getBlog, setBlog, addBlog, updBlog, delBlog,
    getGuestbook, setGuestbook, addGuestbook, delGuestbook,
    getAdminSettings, setAdminSettings,
    initDemoData, compressImage,
    openModal, closeModal, openLightbox, closeLightbox, toast
  };
})();
