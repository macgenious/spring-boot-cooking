/**
 * ChefPath — Application Logic
 *
 * API field names (Java records → JSON camelCase):
 *   LectureResponse     : id, unitId, title, description, youtubeLink, imagePath, sortOrder
 *   UserProgressResponse: userId, currentLessonId, progressPercentage, streakCount
 */

const API_BASE = window.__API_BASE_URL__ || '/api';

/* ── Authenticated fetch with auto-refresh ── */
async function apiFetch(path, options = {}) {
  // getValidJwt() refreshes transparently if the token is about to expire
  const jwt = await Auth.getValidJwt();
  if (!jwt) { Auth.signOut(); throw new Error('Session expired. Please log in again.'); }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      ...(options.headers || {})
    }
  });

  // 401 from our backend → token really is bad, force re-login
  if (res.status === 401) { Auth.signOut(); throw new Error('Session expired.'); }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (HTTP ${res.status})`);
  }
  return res.json();
}

/* ── UI helpers ── */
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

function showToast(msg, type = 'success') {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; document.body.appendChild(t); }
  t.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  t.textContent = msg;
  requestAnimationFrame(() => {
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3500);
  });
}

function hideLoading() { const e = document.getElementById('loading-overlay'); if (e) e.classList.add('hidden'); }
function showLoading()  { const e = document.getElementById('loading-overlay'); if (e) e.classList.remove('hidden'); }

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

/* ── Curriculum metadata ── */
const UNIT_META = [
  { title: 'Errores Básicos y Utensilios',      desc: 'Evita errores comunes y equipa tu cocina.' },
  { title: 'Técnicas de Corte',                 desc: 'Juliana, brunoise, mirepoix y despiece de aves.' },
  { title: 'Técnicas de Cocción',               desc: 'Métodos de cocción y puntos de temperatura exactos.' },
  { title: 'Almacenamiento y Conservación',     desc: 'Fermentación, vacío y conservación segura.' },
  { title: 'Cereales I: Arroz',                 desc: 'Onigiri, paella, arroz frito y biryani.' },
  { title: 'Proteínas I: Carnes',               desc: 'Guisos, estofados, empanados y puntos de la carne.' },
  { title: 'Proteínas II: Aves',                desc: 'Pavo asado, pollo frito y cocina de aves.' },
  { title: 'Vegetales y Legumbres',             desc: 'Verduras y legumbres con técnicas de restaurante.' },
  { title: 'Panadería',                         desc: 'Panes artesanales, brioche y croissants.' },
  { title: 'Cereales II: Pasta',                desc: 'Mantecatura perfecta y recetas italianas clásicas.' },
  { title: 'Salsas Madre',                      desc: 'Las 5 salsas madre francesas y especias esenciales.' },
  { title: 'Proteínas III: Pescados',           desc: 'Vapor, plancha, crudo y horno para texturas perfectas.' },
  { title: 'Platos Sencillos',                  desc: 'Cenas rápidas y tuppers en menos de 15 minutos.' },
  { title: 'Repostería I: Dulces',              desc: 'Bizcochos, cookies y pastelería profesional.' },
  { title: 'Repostería II: Aperitivos Salados', desc: 'Croquetas, tequeños y snacks irresistibles.' },
  { title: 'Ensaladas',                         desc: 'Ensaladas como platos principales con técnica.' },
  { title: 'Cocina Europea',                    desc: 'Cocido, risotto, sopa de cebolla y clásicos europeos.' },
  { title: 'Cocina Americana',                  desc: 'Tacos, quesadillas, bocadillo cubano y más.' },
  { title: 'Cocina Asiática',                   desc: 'Pad Thai, curry verde, ramen y sushi.' },
  { title: 'Cocina del Mundo',                  desc: 'Kebab, poke bowls, baklava y recetas globales.' }
];

/* ════════════════════════════
   DASHBOARD
════════════════════════════ */
async function initDashboard() {
  if (!Auth.requireAuth()) return;
  try {
    const userId   = Session.getUserId();
    const progress = await apiFetch(`/users/${userId}/progress`);
    setText('streak-label', `${progress.streakCount || 0} day streak`);
    renderUnitsGrid(progress.progressPercentage || 0);
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast(err.message || 'Failed to load dashboard', 'error');
    renderUnitsGrid(0);
  } finally {
    hideLoading();
  }
}

function renderUnitsGrid(progressPct) {
  const grid = document.getElementById('units-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const totalDone      = progressPct;
  const completedUnits = Math.floor(totalDone / 5);

  for (let i = 0; i < 20; i++) {
    const unitNum       = i + 1;
    const meta          = UNIT_META[i];
    const unitDoneCount = Math.max(0, Math.min(5, totalDone - i * 5));
    const isComplete    = unitDoneCount >= 5;
    const isUnlocked    = unitNum <= 3 || i < completedUnits + 3;
    const fillPct       = (unitDoneCount / 5) * 100;

    let badgeClass = 'badge--unlocked', badgeText = `${unitDoneCount} / 5`, badgeIcon = '';
    if (!isUnlocked) { badgeClass = 'badge--locked';   badgeText = 'Locked';   badgeIcon = '🔒 '; }
    if (isComplete)  { badgeClass = 'badge--complete'; badgeText = 'Complete'; badgeIcon = '✓ '; }

    const el = document.createElement(isUnlocked ? 'a' : 'div');
    if (isUnlocked) el.href = `/lectures?unitId=${unitNum}`;
    el.className = `unit-btn${!isUnlocked ? ' unit-btn--locked' : ''}${isComplete ? ' unit-btn--complete' : ''}`;
    el.innerHTML = `
      <span class="unit-btn__num">${String(unitNum).padStart(2, '0')}</span>
      <span class="unit-btn__title">${meta.title}</span>
      <span class="unit-btn__desc">${meta.desc}</span>
      <div class="unit-btn__progress">
        <div class="unit-btn__progress-fill" style="width:${fillPct}%"></div>
      </div>
      <div class="unit-btn__footer">
        <span class="unit-btn__badge ${badgeClass}">${badgeIcon}${badgeText}</span>
        ${isUnlocked ? '<span class="unit-btn__arrow">→</span>' : ''}
      </div>`;
    grid.appendChild(el);
  }
}

/* ════════════════════════════
   UNIT PAGE — lesson list
════════════════════════════ */
async function initLectureList() {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const unitId = parseInt(params.get('unitId') || '1', 10);
  const meta   = UNIT_META[unitId - 1] || { title: `Unit ${unitId}`, desc: '' };

  document.title = `${meta.title} — ChefPath`;
  setText('unit-title', `Unit ${String(unitId).padStart(2,'0')}: ${meta.title}`);
  setText('unit-subtitle', meta.desc);

  try {
    const userId = Session.getUserId();
    const [lectures, progress] = await Promise.all([
      apiFetch(`/lectures/unit/${unitId}`),
      apiFetch(`/users/${userId}/progress`)
    ]);

    const pct            = progress.progressPercentage || 0;
    const totalDone      = pct;
    const unitDoneCount  = Math.max(0, Math.min(lectures.length, totalDone - (unitId - 1) * 5));
    const completedUnits = Math.floor(totalDone / 5);

    setText('streak-label', `${progress.streakCount || 0} day streak`);
    setText('unit-meta',    `${unitDoneCount} of ${lectures.length} lessons complete`);

    renderLessons(lectures, unitDoneCount);
    renderFooterNav(unitId, completedUnits);
  } catch (err) {
    console.error('Unit page error:', err);
    const list = document.getElementById('lessons-list');
    if (list) list.innerHTML = `<div style="padding:48px;text-align:center;color:var(--muted);font-size:14px;">
      Could not load lessons. <br><br>
      <button class="btn btn-black btn-sm" onclick="window.location.reload()">Retry</button>
    </div>`;
    showToast(err.message || 'Failed to load lessons', 'error');
  } finally {
    hideLoading();
  }
}

/* ── Render the lesson cards in the "always visible" style ── */
function renderLessons(lectures, unitDoneCount) {
  const container = document.getElementById('lessons-list');
  if (!container) return;
  container.innerHTML = '';

  lectures.forEach((lec, idx) => {
    const isDone    = idx < unitDoneCount;
    const lessonNum = idx + 1;
    const vid       = extractYouTubeId(lec.youtubeLink || '');
    const thumbUrl  = vid
      ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
      : null;

    const card = document.createElement('div');
    card.className = `lcard${isDone ? ' lcard--done' : ''}`;
    card.id = `lcard-${lec.id}`;

    card.innerHTML = `
      <!-- Left: video thumbnail / player -->
      <div class="lcard__video" id="video-wrap-${lec.id}">
        ${thumbUrl
          ? `<img src="${thumbUrl}" alt="${lec.title}" class="lcard__thumb"/>
             <button class="lcard__play-btn" onclick="playVideo(${lec.id}, '${vid}')" aria-label="Play video">▶</button>`
          : `<div class="lcard__no-video">
               <span style="font-size:28px;">▶</span>
               <span>No video</span>
             </div>`
        }
      </div>

      <!-- Right: info + done button -->
      <div class="lcard__body">
        <div class="lcard__title">${lec.title}</div>
        ${lec.description
          ? `<p class="lcard__desc">${lec.description}</p>`
          : ''}
        <div class="lcard__actions">
          ${isDone
            ? `<button class="btn btn-black btn-sm" disabled id="done-btn-${lec.id}">✓ Done</button>`
            : `<button class="btn btn-outline btn-sm" id="done-btn-${lec.id}"
                 onclick="markDone(${lec.id}, 'lcard-${lec.id}')">
                 Mark as done
               </button>`
          }
        </div>
      </div>`;

    container.appendChild(card);
  });
}

/**
 * Replace the thumbnail with the actual YouTube iframe when the user
 * clicks the play button.
 */
function playVideo(lectureId, videoId) {
  const wrap = document.getElementById(`video-wrap-${lectureId}`);
  if (!wrap) return;
  wrap.innerHTML = `<iframe
    src="https://www.youtube.com/embed/${videoId}?autoplay=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen loading="lazy"></iframe>`;
}

async function markDone(lectureId, cardId) {
  const btn = document.getElementById(`done-btn-${lectureId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    showLoading();
    await apiFetch(`/lectures/${lectureId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });
    showToast('🎉 Lesson complete! Keep going!');

    const card = document.getElementById(cardId);
    if (card) card.classList.add('lcard--done');
    if (btn)  { btn.className = 'btn btn-black btn-sm'; btn.textContent = '✓ Done'; }
  } catch (err) {
    showToast(err.message || 'Failed to save progress', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Mark as done'; }
  } finally {
    hideLoading();
  }
}

/* ── Footer nav (prev / next unit) ── */
function renderFooterNav(unitId, completedUnits) {
  const nav = document.getElementById('unit-footer-nav');
  if (!nav) return;
  nav.style.display = '';

  setText('footer-unit-label', `Unit ${unitId} of 20`);

  const prevWrap = document.getElementById('footer-prev-wrap');
  if (prevWrap) {
    if (unitId <= 1) {
      prevWrap.style.visibility = 'hidden';
    } else {
      const prevBtn = document.getElementById('footer-prev-btn');
      if (prevBtn) prevBtn.href = `/lectures?unitId=${unitId - 1}`;
    }
  }

  const nextWrap = document.getElementById('footer-next-wrap');
  if (nextWrap) {
    if (unitId >= 20) {
      nextWrap.style.visibility = 'hidden';
    } else {
      const nextUnitNum  = unitId + 1;
      const nextUnlocked = nextUnitNum <= 3 || (nextUnitNum - 1) < completedUnits + 3;
      const nextBtn      = document.getElementById('footer-next-btn');
      if (nextBtn) {
        if (nextUnlocked) {
          nextBtn.href      = `/lectures?unitId=${nextUnitNum}`;
          nextBtn.className = 'btn btn-black';
          nextBtn.textContent = 'Next unit →';
          nextBtn.onclick   = null;
        } else {
          nextBtn.href      = '#';
          nextBtn.className = 'btn btn-outline-muted';
          nextBtn.textContent = '🔒 Next unit';
          nextBtn.onclick   = (e) => { e.preventDefault(); showToast('Complete this unit to unlock the next one! 🔒', 'error'); };
        }
      }
    }
  }
}

/* ════════════════════════════
   GLOBALS
════════════════════════════ */
window.initDashboard   = initDashboard;
window.initLectureList = initLectureList;
window.markDone        = markDone;
window.playVideo       = playVideo;
