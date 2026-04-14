/**
 * ChefPath — Application Logic
 *
 * Handles fetching lectures, units, user progress, and navigation
 * by calling the Spring Boot REST API with the Supabase JWT.
 */

const API_BASE = window.__API_BASE_URL__ || '/api';

// ---- Authenticated fetch wrapper ----
async function apiFetch(path, options = {}) {
  const jwt = Session.getJwt();
  if (!jwt) {
    Auth.signOut();
    throw new Error('Not authenticated');
  }

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

// ---- Toast notifications ----
function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  requestAnimationFrame(() => {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  });
}

// ---- Loading overlay ----
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}

function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.remove('hidden');
}

// ---- Progress Ring helper ----
function setProgressRing(percentage) {
  const circle = document.getElementById('progress-ring-fill');
  const text = document.getElementById('progress-ring-value');
  if (!circle || !text) return;

  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference - (percentage / 100) * circumference;
  text.textContent = `${percentage}%`;
}

// ---- UNIT ICONS (cooking themed) ----
const UNIT_ICONS = [
  '🔪', '🍲', '🥩', '🫕', '🍞',
  '🎨', '🥚', '🔥', '🐟', '🧁'
];

// ============================================================
//  DASHBOARD PAGE
// ============================================================
async function initDashboard() {
  if (!Auth.requireAuth()) return;

  try {
    const userId = Session.getUserId();
    const [progress, ...unitLectures] = await Promise.all([
      apiFetch(`/users/${userId}/progress`),
      ...Array.from({ length: 10 }, (_, i) => apiFetch(`/lectures/unit/${i + 1}`))
    ]);

    // Set progress ring
    setProgressRing(progress.progressPercentage || 0);

    // Set streak
    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = `${progress.streakCount || 0} day streak`;

    // Render unit cards
    const container = document.getElementById('units-list');
    if (!container) return;
    container.innerHTML = '';

    const unitTitles = [
      'Knife Skills Fundamentals',
      'The Science of Stock',
      'Roasting & Maillard Reaction',
      'Saucier Mastery: Mother Sauces',
      'Hydration & Gluten Structure',
      'Plating & Aesthetic Presentation',
      'Egg Mastery',
      'Wood-Fire & Smoke Chemistry',
      'Ocean to Table: Fish Butchery',
      'Modern Pastry Foundations'
    ];

    const unitDescriptions = [
      'Master the grip, the rock, and the dice of essential vegetables.',
      'Unlocking depth and umami through bone-roasting and slow-simmering.',
      'Understanding heat transfer and achieving the perfect golden crust.',
      'The secrets of Béchamel, Velouté, Espagnole, Hollandaise, and Tomato.',
      'The molecular biology of artisanal bread baking.',
      'Turning meals into art with height, negative space, and color.',
      'From the perfect soft-scramble to the legendary French omelette.',
      'Controlling combustion and flavor absorption.',
      'Sustainability and precision filleting techniques.',
      'Mousses, gels, and the architecture of desserts.'
    ];

    for (let i = 0; i < 10; i++) {
      const lectures = unitLectures[i] || [];
      const completedCount = 0; // would come from completed_lectures
      const totalCount = lectures.length || 10;
      const pct = Math.round((completedCount / totalCount) * 100);

      const card = document.createElement('a');
      card.href = `${AppRoutes.lectures}?unitId=${i + 1}`;
      card.className = `unit-card animate-in animate-in-delay-${Math.min(i % 5, 4) + 1}`;
      card.innerHTML = `
        <div class="unit-card__icon">${UNIT_ICONS[i]}</div>
        <div class="unit-card__content">
          <div class="unit-card__title">${unitTitles[i]}</div>
          <div class="unit-card__description">${unitDescriptions[i]}</div>
          <div class="unit-card__meta">
            <div class="progress-bar" style="max-width:180px;">
              <div class="progress-bar__fill" style="width:${pct}%"></div>
            </div>
            <span>${completedCount}/${totalCount} lectures</span>
          </div>
        </div>
        <span class="unit-card__chevron material-symbols-outlined">chevron_right</span>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================
//  LECTURE LIST PAGE (for a specific unit)
// ============================================================
async function initLectureList() {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unitId') || '1';

  try {
    const lectures = await apiFetch(`/lectures/unit/${unitId}`);
    const container = document.getElementById('lectures-list');
    if (!container) return;
    container.innerHTML = '';

    const unitTitle = document.getElementById('unit-title');
    if (unitTitle) {
      const titles = [
        'Knife Skills Fundamentals', 'The Science of Stock',
        'Roasting & Maillard Reaction', 'Saucier Mastery: Mother Sauces',
        'Hydration & Gluten Structure', 'Plating & Aesthetic Presentation',
        'Egg Mastery', 'Wood-Fire & Smoke Chemistry',
        'Ocean to Table: Fish Butchery', 'Modern Pastry Foundations'
      ];
      unitTitle.textContent = titles[parseInt(unitId) - 1] || `Unit ${unitId}`;
    }

    lectures.forEach((lec, idx) => {
      const card = document.createElement('a');
      card.href = `${AppRoutes.lecture}?id=${lec.id}`;
      card.className = `unit-card animate-in animate-in-delay-${Math.min(idx % 5, 4) + 1}`;
      card.innerHTML = `
        <div class="unit-card__icon" style="font-size:1.1rem; font-family:var(--font-display); font-weight:800;">
          ${idx + 1}
        </div>
        <div class="unit-card__content">
          <div class="unit-card__title">${lec.title}</div>
          <div class="unit-card__description">${lec.description || ''}</div>
        </div>
        <span class="unit-card__chevron material-symbols-outlined">chevron_right</span>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Lecture list error:', err);
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ============================================================
//  LECTURE DETAIL PAGE
// ============================================================
let currentLecture = null;

async function initLectureDetail() {
  if (!Auth.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const lectureId = params.get('id');
  if (!lectureId) {
    window.location.href = AppRoutes.dashboard;
    return;
  }

  try {
    const lecture = await apiFetch(`/lectures/${lectureId}`);
    currentLecture = lecture;

    // Populate fields
    setText('lecture-title', lecture.title);
    setText('lecture-description', lecture.description || '');
    setText('lecture-unit-title', `Unit ${lecture.unitId}`);
    setText('lecture-num', `Lecture ${lecture.sortOrder} of 10`);

    // YouTube embed
    const videoContainer = document.getElementById('video-container');
    if (videoContainer && lecture.youtubeLink) {
      const videoId = extractYouTubeId(lecture.youtubeLink);
      if (videoId) {
        videoContainer.innerHTML = `
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          ></iframe>`;
      }
    }

    // Lecture image
    const imgContainer = document.getElementById('lecture-image');
    if (imgContainer && lecture.imagePath) {
      imgContainer.innerHTML = `<img src="${lecture.imagePath}" alt="${lecture.title}" />`;
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
  const userId = Session.getUserId();

  try {
    showLoading();
    const updated = await apiFetch(`/lectures/${currentLecture.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    showToast('🎉 Lecture completed! +1%');
    // Move to next lecture if available
    setTimeout(() => navigateNext(), 800);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function navigateNext() {
  const userId = Session.getUserId();
  try {
    const updated = await apiFetch('/lectures/navigate/next', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    if (updated.currentLessonId) {
      window.location.href = `${AppRoutes.lecture}?id=${updated.currentLessonId}`;
    }
  } catch (err) {
    showToast('You\'ve reached the last lecture!', 'error');
  }
}

async function navigatePrevious() {
  const userId = Session.getUserId();
  try {
    const updated = await apiFetch('/lectures/navigate/previous', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    if (updated.currentLessonId) {
      window.location.href = `${AppRoutes.lecture}?id=${updated.currentLessonId}`;
    }
  } catch (err) {
    showToast('You\'re at the first lecture!', 'error');
  }
}

// ---- Helpers ----
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

// ---- Expose to HTML ----
window.initDashboard = initDashboard;
window.initLectureList = initLectureList;
window.initLectureDetail = initLectureDetail;
window.completeLecture = completeLecture;
window.navigateNext = navigateNext;
window.navigatePrevious = navigatePrevious;
