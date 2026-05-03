/**
 * ChefPath — Application Logic
 * Unlock logic: first 3 units always unlocked; each completed unit unlocks the next.
 */

const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const jwt = Session.getJwt();
  if (!jwt) { Auth.signOut(); throw new Error('Not authenticated'); }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function showToast(msg, type = 'success') {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; document.body.appendChild(t); }
  t.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
  t.textContent = msg;
  requestAnimationFrame(() => {
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 3200);
  });
}

function hideLoading() { const e = document.getElementById('loading-overlay'); if (e) e.classList.add('hidden'); }
function showLoading()  { const e = document.getElementById('loading-overlay'); if (e) e.classList.remove('hidden'); }

function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

/* ── Curriculum metadata ── */
const UNIT_META = [
  { title: 'Errores Básicos y Utensilios',          desc: 'Evita errores comunes y equipa tu cocina.' },
  { title: 'Técnicas de Corte',                     desc: 'Juliana, brunoise, mirepoix y despiece de aves.' },
  { title: 'Técnicas de Cocción',                   desc: 'Métodos de cocción y puntos de temperatura exactos.' },
  { title: 'Almacenamiento y Conservación',         desc: 'Fermentación, vacío y conservación segura.' },
  { title: 'Cereales I: Arroz',                     desc: 'Onigiri, paella, arroz frito y biryani.' },
  { title: 'Proteínas I: Carnes',                   desc: 'Guisos, estofados, empanados y puntos de la carne.' },
  { title: 'Proteínas II: Aves',                    desc: 'Pavo asado, pollo frito y cocina de aves.' },
  { title: 'Vegetales y Legumbres',                 desc: 'Verduras y legumbres con técnicas de restaurante.' },
  { title: 'Panadería',                             desc: 'Panes artesanales, brioche y croissants.' },
  { title: 'Cereales II: Pasta',                    desc: 'Mantecatura perfecta y recetas italianas clásicas.' },
  { title: 'Salsas Madre',                          desc: 'Las 5 salsas madre francesas y especias esenciales.' },
  { title: 'Proteínas III: Pescados',               desc: 'Vapor, plancha, crudo y horno para texturas perfectas.' },
  { title: 'Platos Sencillos',                      desc: 'Cenas rápidas y tuppers en menos de 15 minutos.' },
  { title: 'Repostería I: Dulces',                  desc: 'Bizcochos, cookies y pastelería profesional.' },
  { title: 'Repostería II: Aperitivos Salados',     desc: 'Croquetas, tequeños y snacks irresistibles.' },
  { title: 'Ensaladas',                             desc: 'Ensaladas como platos principales con técnica.' },
  { title: 'Cocina Europea',                        desc: 'Cocido, risotto, sopa de cebolla y clásicos europeos.' },
  { title: 'Cocina Americana',                      desc: 'Tacos, quesadillas, bocadillo cubano y más.' },
  { title: 'Cocina Asiática',                       desc: 'Pad Thai, curry verde, ramen y sushi.' },
  { title: 'Cocina del Mundo',                      desc: 'Kebab, poke bowls, baklava y recetas globales.' }
];

/* ════════════════════════════
   DASHBOARD
════════════════════════════ */
async function initDashboard() {
  if (!Auth.requireAuth()) return;

  try {
    const userId   = Session.getUserId();
    const progress = await apiFetch(`/users/${userId}/progress`);
    const streak   = progress.streakCount || 0;
    const pct      = progress.progressPercentage || 0;
    const doneLecs = Math.round((pct / 100) * 100);

    setText('streak-label', `${streak} day streak`);

    // Fill profile dropdown email
    const session  = Session.get();
    const email    = session?.user?.email || '';
    setText('user-email-short', email.split('@')[0] || 'Profile');
    setText('dropdown-email',   email);

    // Load per-unit completions
    const unitCompletions = [];
    for (let i = 1; i <= 20; i++) {
      try {
        const lecs = await apiFetch(`/lectures/unit/${i}`);
        unitCompletions.push(lecs);
      } catch { unitCompletions.push([]); }
    }

    // Figure out which units are complete
    // A unit is complete if all its lectures are completed
    // We'll check via completed_lectures later; for now use doneLecs count
    // Unlock rule: first 3 always unlocked; each completed unit unlocks next
    const completedPerUnit = unitCompletions.map(lecs => {
      // We can't directly know per-unit completion from progress alone
      // So we'll mark unit complete when doneLecs >= unit*5
      return 0; // Will be set by server-side info if available
    });

    // Simpler: compute completed lectures per unit based on total progress
    // 5 lectures per unit, 20 units, 100 total
    const totalDone = doneLecs;
    let unitsCompleted = 0;
    for (let i = 0; i < 20; i++) {
      const startLec = i * 5 + 1;
      const endLec   = i * 5 + 5;
      // We assume lectures are done in order
      if (totalDone >= endLec) unitsCompleted++;
    }

    renderUnitsGrid(unitCompletions, totalDone, unitsCompleted);
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast(err.message, 'error');
    renderUnitsGrid([], 0, 0);
  } finally {
    hideLoading();
  }
}

function renderUnitsGrid(unitLectures, totalDone, unitsCompleted) {
  const grid = document.getElementById('units-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let i = 0; i < 20; i++) {
    const unitNum    = i + 1;
    const meta       = UNIT_META[i];
    const lecCount   = unitLectures[i]?.length || 5;

    // Lectures done in this unit
    const unitDoneCount = Math.max(0, Math.min(5, totalDone - i * 5));
    const isComplete  = unitDoneCount >= 5;

    // Unlock: first 3 always unlocked, then each completed unit unlocks next
    const isUnlocked = unitNum <= 3 || i < unitsCompleted + 3;

    const btn = document.createElement(isUnlocked ? 'a' : 'div');
    if (isUnlocked) btn.href = `/lectures?unitId=${unitNum}`;

    let badgeClass = 'badge--unlocked';
    let badgeText  = `${unitDoneCount} / ${lecCount}`;
    let badgeIcon  = '';

    if (!isUnlocked)   { badgeClass = 'badge--locked';   badgeText = 'Locked';    badgeIcon = '🔒 '; }
    if (isComplete)    { badgeClass = 'badge--complete';  badgeText = 'Complete';  badgeIcon = '✓ '; }

    btn.className = `unit-btn${!isUnlocked ? ' unit-btn--locked' : ''}${isComplete ? ' unit-btn--complete' : ''}`;

    const fillPct = (unitDoneCount / lecCount) * 100;

    btn.innerHTML = `
      <span class="unit-btn__num">${String(unitNum).padStart(2,'0')}</span>
      <span class="unit-btn__title">${meta.title}</span>
      <span class="unit-btn__desc">${meta.desc}</span>
      <div class="unit-btn__progress">
        <div class="unit-btn__progress-fill" style="width:${fillPct}%"></div>
      </div>
      <div class="unit-btn__footer">
        <span class="unit-btn__badge ${badgeClass}">${badgeIcon}${badgeText}</span>
        ${isUnlocked ? '<span class="unit-btn__arrow">→</span>' : ''}
      </div>
    `;
    grid.appendChild(btn);
  }
}

/* ════════════════════════════
   LECTURE LIST (Unit page)
════════════════════════════ */
async function initLectureList() {
  if (!Auth.requireAuth()) return;

  const params  = new URLSearchParams(window.location.search);
  const unitId  = parseInt(params.get('unitId') || '1', 10);
  const meta    = UNIT_META[unitId - 1] || { title: `Unit ${unitId}`, desc: '' };

  document.title = `${meta.title} — ChefPath`;
  setText('unit-title', meta.title);

  try {
    const userId    = Session.getUserId();
    const [lectures, progress] = await Promise.all([
      apiFetch(`/lectures/unit/${unitId}`),
      apiFetch(`/users/${userId}/progress`)
    ]);

    const totalDone     = Math.round(((progress.progressPercentage || 0) / 100) * 100);
    const unitStartDone = (unitId - 1) * 5;
    const unitDoneCount = Math.max(0, Math.min(5, totalDone - unitStartDone));

    const streak = progress.streakCount || 0;
    setText('streak-label', `${streak} day streak`);
    setText('unit-meta', `${unitDoneCount} of ${lectures.length} lessons complete`);

    const session = Session.get();
    const email   = session?.user?.email || '';
    setText('user-email-short', email.split('@')[0] || 'Profile');

    renderLessons(lectures, unitDoneCount);
  } catch (err) {
    console.error('Unit page error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderLessons(lectures, unitDoneCount) {
  const container = document.getElementById('lessons-list');
  if (!container) return;
  container.innerHTML = '';

  lectures.forEach((lec, idx) => {
    const isDone   = idx < unitDoneCount;
    const lessonNum = idx + 1;
    const vid      = extractYouTubeId(lec.youtubeLink || lec.youtube_link || '');
    const cardId   = `lesson-card-${lec.id}`;
    const expandId = `expand-${lec.id}`;

    const card = document.createElement('div');
    card.className = `lesson-card${isDone ? ' lesson-card--done' : ''}`;
    card.id = cardId;

    card.innerHTML = `
      <div class="lesson-card__header" onclick="toggleLesson('${expandId}')">
        <span class="lesson-card__num">${String(lessonNum).padStart(2,'0')}</span>
        <div class="lesson-card__body">
          <div class="lesson-card__title${isDone ? ' lesson-card__title--done' : ''}">${lec.title}</div>
          ${lec.description ? `<div class="lesson-card__desc">${lec.description}</div>` : ''}
        </div>
        <div class="lesson-card__status${isDone ? ' lesson-card__status--done' : ''}" id="status-${lec.id}">
          ${isDone ? '✓' : ''}
        </div>
      </div>
      <div class="lesson-card__expand" id="${expandId}">
        <div class="lesson-card__video">
          ${vid
            ? `<iframe src="https://www.youtube.com/embed/${vid}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
            : `<div class="lesson-card__video-placeholder"><span class="lesson-card__video-placeholder-icon">▶</span><span>No video available</span></div>`
          }
        </div>
        ${lec.description ? `<p class="lesson-card__desc-full">${lec.description}</p>` : ''}
        <div class="lesson-card__actions">
          ${isDone
            ? `<button class="btn btn-light btn-sm" disabled>✓ Completed</button>`
            : `<button class="btn btn-black btn-sm" onclick="markDone(${lec.id}, '${cardId}', '${expandId}')">Mark as done</button>`
          }
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleLesson(expandId) {
  const el = document.getElementById(expandId);
  if (!el) return;
  // Close others
  document.querySelectorAll('.lesson-card__expand.open').forEach(e => {
    if (e.id !== expandId) e.classList.remove('open');
  });
  el.classList.toggle('open');
}

async function markDone(lectureId, cardId, expandId) {
  const btn = document.querySelector(`#${expandId} .btn-black`);
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    showLoading();
    await apiFetch(`/lectures/${lectureId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });

    showToast('🎉 Lesson complete! Keep going!');

    // Update card visually
    const card   = document.getElementById(cardId);
    const status = document.getElementById(`status-${lectureId}`);
    if (card)   { card.classList.add('lesson-card--done'); }
    if (status) { status.classList.add('lesson-card__status--done'); status.textContent = '✓'; }

    const titleEl = card?.querySelector('.lesson-card__title');
    if (titleEl) titleEl.classList.add('lesson-card__title--done');

    const expandEl = document.getElementById(expandId);
    if (expandEl) {
      const actions = expandEl.querySelector('.lesson-card__actions');
      if (actions) actions.innerHTML = '<button class="btn btn-light btn-sm" disabled>✓ Completed</button>';
    }
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Mark as done'; }
  } finally {
    hideLoading();
  }
}

/* ════════════════════════════
   SINGLE LECTURE DETAIL PAGE
════════════════════════════ */
let _currentLecture = null;

async function initLectureDetail() {
  if (!Auth.requireAuth()) return;
  const params    = new URLSearchParams(window.location.search);
  const lectureId = params.get('id');
  if (!lectureId) { window.location.href = '/dashboard'; return; }

  try {
    const userId = Session.getUserId();
    const [lec, progress] = await Promise.all([
      apiFetch(`/lectures/${lectureId}`),
      apiFetch(`/users/${userId}/progress`)
    ]);
    _currentLecture = lec;

    document.title = `${lec.title} — ChefPath`;
    setText('lecture-title', lec.title);
    setText('lecture-meta', `Unit ${lec.unitId} · Lesson ${lec.sortOrder}`);
    setText('streak-label', `${progress.streakCount || 0} day streak`);

    const backLink = document.getElementById('back-link');
    if (backLink) backLink.href = `/lectures?unitId=${lec.unitId}`;

    const desc = document.getElementById('lecture-description');
    if (desc) desc.textContent = lec.description || '';

    const vid = extractYouTubeId(lec.youtubeLink || lec.youtube_link || '');
    const vc  = document.getElementById('video-container');
    if (vc && vid) {
      vc.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function completeLecture() {
  if (!_currentLecture) return;
  const btn = document.getElementById('btn-complete');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    showLoading();
    await apiFetch(`/lectures/${_currentLecture.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });
    showToast('🎉 Lesson complete!');
    if (btn) { btn.textContent = '✓ Done'; }
    setTimeout(() => navigateNext(), 800);
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Mark as done'; }
  } finally {
    hideLoading();
  }
}

async function navigateNext() {
  if (!_currentLecture) return;
  const unitId = _currentLecture.unitId;
  const order  = _currentLecture.sortOrder;
  try {
    const lecs = await apiFetch(`/lectures/unit/${unitId}`);
    const next = lecs.find(l => l.sortOrder === order + 1);
    if (next) window.location.href = `/lecture?id=${next.id}`;
    else if (unitId < 20) window.location.href = `/lectures?unitId=${unitId + 1}`;
    else showToast('You\'ve completed the curriculum! 🎓');
  } catch { showToast('Could not navigate', 'error'); }
}

async function navigatePrevious() {
  if (!_currentLecture) return;
  const unitId = _currentLecture.unitId;
  const order  = _currentLecture.sortOrder;
  try {
    const lecs = await apiFetch(`/lectures/unit/${unitId}`);
    const prev = lecs.find(l => l.sortOrder === order - 1);
    if (prev) window.location.href = `/lecture?id=${prev.id}`;
    else if (unitId > 1) {
      const prevLecs = await apiFetch(`/lectures/unit/${unitId - 1}`);
      const last = prevLecs[prevLecs.length - 1];
      if (last) window.location.href = `/lecture?id=${last.id}`;
    } else showToast('This is the first lesson!');
  } catch { showToast('Could not navigate', 'error'); }
}

/* Expose globals */
window.initDashboard     = initDashboard;
window.initLectureList   = initLectureList;
window.initLectureDetail = initLectureDetail;
window.completeLecture   = completeLecture;
window.navigateNext      = navigateNext;
window.navigatePrevious  = navigatePrevious;
window.markDone          = markDone;
window.toggleLesson      = toggleLesson;
