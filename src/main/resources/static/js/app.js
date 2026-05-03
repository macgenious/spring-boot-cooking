/**
 * ChefPath — Application Logic
 * Communicates with the Spring Boot REST API using the Supabase JWT.
 */

const API_BASE = '/api';

// ---- Auth helpers (from supabase-auth.js) ----
// Session, Auth, AppRoutes are defined in supabase-auth.js

// ---- Authenticated fetch ----
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
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---- Toast ----
function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  });
}

// ---- Loading ----
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}
function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}

// ---- Routes (server-side Thymeleaf paths) ----
const Routes = {
  login:     '/login',
  dashboard: '/dashboard',
  lectures:  '/lectures',
  lecture:   '/lecture'
};

// ============================================================
//  CURRICULUM METADATA (fallback — matches Supabase data)
// ============================================================
const UNIT_META = [
  { title: 'Errores Básicos y Utensilios de Cocina',       desc: 'Domina los fundamentos: evita errores comunes y equipa tu cocina.' },
  { title: 'Técnicas de Corte y Manejo de Cuchillo',       desc: 'Cortes con precisión: juliana, brunoise, mirepoix y despiece de aves.' },
  { title: 'Técnicas de Cocción y Tipos de Fuego',          desc: 'Métodos de cocción, tipos de fuego y puntos de temperatura exactos.' },
  { title: 'Almacenamiento y Conservación de Alimentos',   desc: 'Fermentación, envasado al vacío y conservación segura.' },
  { title: 'Cereales I: Arroz',                             desc: 'Onigiri, paella, arroz frito, biryani y todas las formas del arroz.' },
  { title: 'Proteínas I: Carnes',                           desc: 'Guisos, estofados, empanados y el punto perfecto de la carne.' },
  { title: 'Proteínas II: Aves',                            desc: 'Desde el pavo asado hasta el pollo frito internacional.' },
  { title: 'Vegetales y Legumbres',                         desc: 'Verduras y legumbres con técnicas de restaurante.' },
  { title: 'Panadería',                                     desc: 'Panes artesanales, brioche y croissants como un maestro panadero.' },
  { title: 'Cereales II: Pasta',                            desc: 'Mantecatura perfecta y recetas clásicas italianas.' },
  { title: 'Salsas Madre',                                  desc: 'Las 5 salsas madre francesas, salsas del mundo y especias esenciales.' },
  { title: 'Proteínas III: Pescados',                       desc: 'Vapor, plancha, crudo y horno para texturas perfectas.' },
  { title: 'Platos Sencillos',                              desc: 'Cenas rápidas y tuppers sabrosos en menos de 15 minutos.' },
  { title: 'Repostería I: Dulces',                          desc: 'Bizcochos, cookies, postres de restaurante y pastelería profesional.' },
  { title: 'Repostería II: Aperitivos Salados',             desc: 'Croquetas, tequeños, aros de cebolla y snacks irresistibles.' },
  { title: 'Ensaladas',                                     desc: 'Ensaladas como platos principales con técnica internacional.' },
  { title: 'Cocina Europea: Española, Italiana, Francesa', desc: 'Cocido, risotto, sopa de cebolla y platos clásicos europeos.' },
  { title: 'Cocina Americana: Cubana, Mexicana, Peruana',  desc: 'Tacos, quesadillas, bocadillo cubano y lo mejor de América Latina.' },
  { title: 'Cocina Asiática: China, Coreana, Japonesa',    desc: 'Pad Thai, curry verde, carta china y cocina japonesa completa.' },
  { title: 'Cocina Rara: De Todas Partes',                  desc: 'Kebab casero, poke bowls, baklava, restaurante indio y samosas.' }
];

// ============================================================
//  DASHBOARD
// ============================================================
async function initDashboard() {
  if (!Auth.requireAuth()) return;

  try {
    const userId = Session.getUserId();
    const [progress, ...unitLectures] = await Promise.all([
      apiFetch(`/users/${userId}/progress`),
      ...Array.from({ length: 20 }, (_, i) => apiFetch(`/lectures/unit/${i + 1}`))
    ]);

    const pct     = progress.progressPercentage || 0;
    const streak  = progress.streakCount || 0;
    const done    = Math.round((pct / 100) * 100);

    setText('progress-val', `${pct}%`);
    setText('streak-val', `${streak}`);
    setText('done-val', `${done}`);

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${pct}%`;

    const container = document.getElementById('units-list');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 20; i++) {
      const lectures   = unitLectures[i] || [];
      const totalCount = lectures.length || 5;
      const unit       = UNIT_META[i];

      const card = document.createElement('a');
      card.href  = `${Routes.lectures}?unitId=${i + 1}`;
      card.className = 'unit-card';
      card.innerHTML = `
        <span class="unit-card__num">${String(i + 1).padStart(2, '0')}</span>
        <div class="unit-card__body">
          <div class="unit-card__title">${unit.title}</div>
          <div class="unit-card__desc">${unit.desc}</div>
          <div class="unit-card__meta">
            <div class="progress-bar" style="max-width:140px;">
              <div class="progress-bar__fill" style="width:0%"></div>
            </div>
            <span class="unit-card__count">0 / ${totalCount}</span>
          </div>
        </div>
        <span class="unit-card__arrow">›</span>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================
//  LECTURE LIST
// ============================================================
async function initLectureList() {
  if (!Auth.requireAuth()) return;

  const params  = new URLSearchParams(window.location.search);
  const unitId  = parseInt(params.get('unitId') || '1', 10);
  const unitIdx = unitId - 1;
  const unit    = UNIT_META[unitIdx] || { title: `Unit ${unitId}`, desc: '' };

  setText('unit-title', unit.title);
  setText('unit-description', unit.desc);
  document.title = `${unit.title} — ChefPath`;

  try {
    const lectures  = await apiFetch(`/lectures/unit/${unitId}`);
    const container = document.getElementById('lectures-list');
    if (!container) return;
    container.innerHTML = '';

    lectures.forEach((lec, idx) => {
      const item = document.createElement('a');
      item.href  = `${Routes.lecture}?id=${lec.id}`;
      item.className = 'lecture-item';
      item.innerHTML = `
        <span class="lecture-item__num">${String(idx + 1).padStart(2, '0')}</span>
        <div class="lecture-item__body">
          <div class="lecture-item__title">${lec.title}</div>
          ${lec.description ? `<div class="lecture-item__desc">${lec.description}</div>` : ''}
        </div>
        <span class="lecture-item__arrow">›</span>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error('Lecture list error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================
//  LECTURE DETAIL
// ============================================================
let currentLecture = null;

async function initLectureDetail() {
  if (!Auth.requireAuth()) return;

  const params    = new URLSearchParams(window.location.search);
  const lectureId = params.get('id');
  if (!lectureId) { window.location.href = Routes.dashboard; return; }

  try {
    const lec     = await apiFetch(`/lectures/${lectureId}`);
    currentLecture = lec;

    const unitIdx  = (lec.unitId || 1) - 1;
    const unitData = UNIT_META[unitIdx] || { title: `Unit ${lec.unitId}` };

    document.title = `${lec.title} — ChefPath`;

    // Breadcrumb
    const unitLink = document.getElementById('breadcrumb-unit-link');
    if (unitLink) {
      unitLink.textContent = unitData.title;
      unitLink.href = `${Routes.lectures}?unitId=${lec.unitId}`;
    }
    setText('breadcrumb-num', `Lecture ${lec.sortOrder}`);

    // Tags
    setText('lecture-unit-tag', `Unit ${lec.unitId}`);
    setText('lecture-num-tag',  `Lecture ${lec.sortOrder} of 5`);

    // Title
    setText('lecture-title', lec.title);

    // Description
    const descEl = document.getElementById('lecture-description');
    if (descEl) {
      if (lec.description) {
        descEl.textContent = lec.description;
      } else {
        descEl.style.display = 'none';
      }
    }

    // Video
    const videoEl = document.getElementById('video-container');
    if (videoEl && lec.youtubeLink) {
      const vid = extractYouTubeId(lec.youtubeLink);
      if (vid) {
        videoEl.innerHTML = `<iframe
          src="https://www.youtube.com/embed/${vid}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>`;
      }
    }
  } catch (err) {
    console.error('Lecture detail error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function completeLecture() {
  if (!currentLecture) return;
  const btn = document.getElementById('btn-complete');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    showLoading();
    await apiFetch(`/lectures/${currentLecture.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });
    showToast('🎉 Lecture complete! +1%');
    if (btn) btn.textContent = '✓ Completed';
    setTimeout(() => navigateNext(), 900);
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Mark as complete'; }
  } finally {
    hideLoading();
  }
}

async function navigateNext() {
  try {
    const res = await apiFetch('/lectures/navigate/next', {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });
    if (res.currentLessonId) {
      window.location.href = `${Routes.lecture}?id=${res.currentLessonId}`;
    }
  } catch { showToast('You\'ve reached the last lecture!', 'error'); }
}

async function navigatePrevious() {
  try {
    const res = await apiFetch('/lectures/navigate/previous', {
      method: 'POST',
      body: JSON.stringify({ userId: Session.getUserId() })
    });
    if (res.currentLessonId) {
      window.location.href = `${Routes.lecture}?id=${res.currentLessonId}`;
    }
  } catch { showToast('You\'re at the first lecture!', 'error'); }
}

// ---- Helpers ----
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
  return m ? m[1] : null;
}

// ---- Expose to templates ----
window.initDashboard     = initDashboard;
window.initLectureList   = initLectureList;
window.initLectureDetail = initLectureDetail;
window.completeLecture   = completeLecture;
window.navigateNext      = navigateNext;
window.navigatePrevious  = navigatePrevious;
