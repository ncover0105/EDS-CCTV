(() => {
  'use strict';

  const inited = {
    ment: false,
    user: false,
    sms: false,
    schedule: false,
    setting: false
  };

  document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initViewNavigation();

    const view = (typeof window.currentView === 'string' && window.currentView)
      ? window.currentView
      : (typeof window.currentView === 'undefined' ? (typeof currentView === 'string' ? currentView : 'none') : 'none');

    console.log('[setting] currentView =', view);

    switch (view) {
      case 'ment':
        if (!inited.ment && typeof window.initMentManager === 'function') {
          window.initMentManager(); inited.ment = true;
        }
        break;

      case 'user':
        if (!inited.user && typeof window.initUserManager === 'function') {
          window.initUserManager(); inited.user = true;
        }
        break;

      case 'sms':
        if (!inited.sms && typeof window.initSmsManager === 'function') {
          window.initSmsManager(); inited.sms = true;
        }
        break;

      case 'schedule':
        // 기존 코드가 initBgmManager를 호출하고 있었는데, 실제 스케줄 매니저가 따로 있으면 그걸로 바꾸세요.
        if (!inited.schedule && typeof window.initScheduleManager === 'function') {
          window.initScheduleManager(); inited.schedule = true;
        } else if (!inited.schedule && typeof window.initBgmManager === 'function') {
          window.initBgmManager(); inited.schedule = true;
        }
        break;

      // ✅ set/setting 둘 다 허용
      case 'set':
      case 'setting':
        if (!inited.setting && typeof window.initSettingManager === 'function') {
          window.initSettingManager(); inited.setting = true;
        }
        break;

      default:
        console.warn('[setting] unknown view:', view);
    }
  });

  // 공용 유틸
  window.SettingUtil = { safeArray, escapeHtml };

  function initSidebarToggle() {
    const sidebar = document.getElementById('setSidebar');
    const overlay = document.getElementById('setOverlay');
    const toggleBtn = document.getElementById('setSidebarToggle');
    const collapseBtn = document.getElementById('setSidebarCollapse');

    function openMobile() {
      if (sidebar) sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('is-active');
      document.body.classList.add('set-no-scroll');
    }

    function closeMobile() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-active');
      document.body.classList.remove('set-no-scroll');
    }

    function toggleMobile(e) {
      if (e) e.preventDefault();
      if (sidebar && sidebar.classList.contains('is-open')) {
        closeMobile();
      } else {
        openMobile();
      }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleMobile);
    if (overlay) overlay.addEventListener('click', closeMobile);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobile();
    });
    if (collapseBtn) {
      const handleCollapse = (e) => {
        e.preventDefault();
        if (sidebar) sidebar.classList.toggle('is-collapsed');
      };
      collapseBtn.addEventListener('click', handleCollapse);
      collapseBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCollapse(e);
      });
    }
  }

  function initViewNavigation() {
    const sidebar = document.getElementById('setSidebar');
    const buttons = document.querySelectorAll('.set-nav-item[data-view], .set-tab-item[data-view]');

    function navigateToView(view) {
      if (!view) return;
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      if (sidebar && sidebar.classList.contains('is-collapsed')) {
        url.searchParams.set('sidebar', 'collapsed');
      } else {
        url.searchParams.delete('sidebar');
      }
      window.location.href = url.toString();
    }

    buttons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToView(button.dataset.view);
      });
    });
  }

  function safeArray(v) { return Array.isArray(v) ? v : []; }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
