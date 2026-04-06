(() => {
    'use strict';

    // =========================
    // Setting (view=set) 전용 로직
    // =========================

    let settingInitialized = false;
    let radioGroupBound = false;

    function initSettingManager() {
        if (settingInitialized) return;
        settingInitialized = true;

        console.log('[setting_set] initSettingManager');

        // (선택) API Key는 기본 마스킹
        const apiKey = document.getElementById('mapApiKey');
        if (apiKey && apiKey.type !== 'password') apiKey.type = 'password';

        // 저장 버튼은 HTML onclick="saveSetting()" 사용

        bindRadioGroupsOnce();
        loadSetting();
    }

    function bindRadioGroupsOnce() {
        if (radioGroupBound) return;
        radioGroupBound = true;

        // 현재 HTML은 .sradio-stack 구조라서, "radio-group" 클래스를 안쓰고 있어도 동작하도록 둘 다 처리
        const groups = [
            ...document.querySelectorAll('.radio-group'),
            ...document.querySelectorAll('.sradio-stack')
        ];

        groups.forEach(group => {
            updateRadioLabelStyles(group);
            group.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', () => updateRadioLabelStyles(group));
            });
        });
    }

    function updateRadioLabelStyles(groupElement) {
        const radios = groupElement.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            // label[for]가 없을 수도 있어서, 가장 가까운 label도 같이 지원
            const label =
                groupElement.querySelector(`label[for="${radio.id}"]`) ||
                radio.closest('label');

            if (!label) return;

            label.classList.toggle('is-checked', radio.checked);
            label.classList.toggle('is-unchecked', !radio.checked);
        });
    }

    // ====== Setting API ======
    async function saveSetting() {
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
                window.iziToast.success({
                    message: '설정이 성공적으로 저장되었습니다.',
                    position: 'topRight',
                    timeout: 4000,
                    progressBar: true
                });
            } else {
                alert('설정이 저장되었습니다.');
            }

            console.log('[setting_set] saved:', result);
        } catch (e) {
            console.error('[setting_set] save error:', e);
            alert('오류가 발생했습니다: ' + e.message);
        }
    }

    async function loadSetting() {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('설정 불러오기 실패');

            const setting = await res.json();

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
            const groups = [
                ...document.querySelectorAll('.radio-group'),
                ...document.querySelectorAll('.sradio-stack')
            ];
            groups.forEach(group => updateRadioLabelStyles(group));

            console.log('[setting_set] loaded:', setting);
        } catch (e) {
            console.error('[setting_set] load error:', e);
            alert('설정을 불러오는 중 오류가 발생했습니다.');
        }
    }

    function setChecked(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = !!checked;
    }

    // API Key eye 버튼
    function toggleApiKeyVisibility() {
        const input = document.getElementById('mapApiKey');
        const icon = document.getElementById('apiEyeIcon');
        if (!input) return;

        const nextIsVisible = input.type === 'password';
        input.type = nextIsVisible ? 'text' : 'password';

        if (icon) {
            icon.classList.toggle('bi-eye', !nextIsVisible);
            icon.classList.toggle('bi-eye-slash', nextIsVisible);
        }
    }

    // 글로벌 노출 (HTML onclick 유지)
    window.initSettingManager = initSettingManager;
    window.saveSetting = saveSetting;
    window.loadSetting = loadSetting;
    window.toggleApiKeyVisibility = toggleApiKeyVisibility;
})();
