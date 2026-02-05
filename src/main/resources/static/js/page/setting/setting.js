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
    //   const view = (typeof window.currentView === 'string' && window.currentView)
    //     ? window.currentView
    //     : 'none';
  
      console.log('[setting] currentView =', currentView);
  
      switch (currentView) {
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
          if (!inited.bgm && typeof window.initBgmManager === 'function') {
            window.initBgmManager(); inited.bgm = true;
          }
          break;
  
        // ✅ set/setting 둘 다 허용 (컨트롤러/URL 혼용 대비)
        case 'set':
        case 'setting':
          if (!inited.setting) {
            initSettingManager(); inited.setting = true;
          }
          break;
  
        default:
          console.warn('[setting] unknown view:', view);
      }
    });
  
    window.SettingUtil = { safeArray, escapeHtml };
  
    function safeArray(v) { return Array.isArray(v) ? v : []; }
  
    function escapeHtml(str) {
      return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }
  
    /* ======================================================
     * ✅ view=setting 전용 로직 (이 파일에 포함)
     *  - loadSetting() 호출
     *  - 저장 버튼(saveSetting) 이벤트 바인딩
     *  - radio-group 라벨 스타일 적용
     * ====================================================== */
  
    let settingInitialized = false;
  
    function initSettingManager() {
      if (settingInitialized) return;
      settingInitialized = true;
  
      console.log('[setting] initSettingManager');
  
      // 1) 저장 버튼 바인딩 (id가 다르면 여기만 바꿔)
      const saveBtn =
        document.getElementById('btn-setting-save');
  
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          saveSetting();
        });
      } else {
        console.warn('[setting] save button not found (btn-setting-save)');
      }
  
      // 2) 라디오 그룹 스타일/이벤트 (setting 화면에서만)
      bindRadioGroupsOnce();
  
      // 3) 초기값 로드
      loadSetting();
    }
  
    let radioGroupBound = false;
  
    function bindRadioGroupsOnce() {
      if (radioGroupBound) return;
      radioGroupBound = true;
  
      document.querySelectorAll('.radio-group').forEach(group => {
        updateRadioLabelStyles(group);
        group.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.addEventListener('change', () => updateRadioLabelStyles(group));
        });
      });
    }
  
    function updateRadioLabelStyles(groupElement) {
      const radios = groupElement.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        const label = groupElement.querySelector(`label[for="${radio.id}"]`);
        if (!label) return;
        label.classList.toggle('text-primary', radio.checked);
        label.classList.toggle('text-gray', !radio.checked);
      });
    }
  
    // ====== Setting API (너가 기존에 쓰던 패턴 유지) ======
    async function saveSetting() {
      // ✅ setting 화면에서 실제로 쓰는 id/name에 맞춰 아래만 조정하면 됨
      const payload = {
        id: 1,
        autoApproval: document.getElementById('autoApproval')?.checked ?? false,
        mode: (document.querySelector("input[name='mode']:checked")?.value === 'real') ? 0 : 1,
        media: document.querySelector("input[name='media']:checked")?.value ?? '',
        type: document.querySelector("input[name='type']:checked")?.value ?? '',
        mapApiKey: document.getElementById('mapApiKey')?.value ?? ''
      };
  
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!res.ok) {
          const err = await res.text();
          alert('설정 저장 실패: ' + err);
          return;
        }
  
        const result = await res.json();
  
        if (window.iziToast) {
          iziToast.success({
            message: '설정이 성공적으로 저장되었습니다.',
            position: 'topRight',
            timeout: 4000,
            progressBar: true
          });
        } else {
          alert('설정이 저장되었습니다.');
        }
  
        console.log('[setting] saved:', result);
      } catch (e) {
        console.error('[setting] save error:', e);
        alert('오류가 발생했습니다: ' + e.message);
      }
    }
  
    async function loadSetting() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('설정 불러오기 실패');
  
        const setting = await res.json();
  
        // ✅ setting 화면 id에 맞춰 반영
        const auto = document.getElementById('autoApproval');
        if (auto) auto.checked = !!setting.autoApproval;
  
        setChecked('modeReal', setting.mode === 0);
        setChecked('modeTest', setting.mode === 1);
  
        setChecked('mediaCable', setting.media === 'cable');
        setChecked('mediaDmb', setting.media === 'dmb');
  
        setChecked('typeTts', setting.type === 'tts');
        setChecked('typeSaved', setting.type === 'saved');
  
        const apiKey = document.getElementById('mapApiKey');
        if (apiKey) apiKey.value = setting.mapApiKey || '';
  
        // 라디오 스타일 재적용
        document.querySelectorAll('.radio-group').forEach(group => updateRadioLabelStyles(group));
  
        console.log('[setting] loaded:', setting);
      } catch (e) {
        console.error('[setting] load error:', e);
        alert('설정을 불러오는 중 오류가 발생했습니다.');
      }
    }
  
    function setChecked(id, checked) {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    }
  
    // 필요하면 외부에서도 호출 가능하게 노출
    window.initSettingManager = initSettingManager;
  
  })();
  