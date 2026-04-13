/**
 * PasswordModal — 비밀번호 입력 모달
 *
 * 사용법:
 *   PasswordModal.show({
 *       title    : '비밀번호 확인',               // (선택) 제목
 *       message  : '관리자 비밀번호를 입력하세요.', // (선택) 안내 문구
 *       onConfirm: (password) => { ... },         // 확인 시 콜백
 *       onCancel : () => { ... },                 // 취소 시 콜백 (선택)
 *   });
 *
 *   PasswordModal.hide();  // 외부에서 강제 닫기
 */
window.PasswordModal = (function () {

    // ── DOM 레퍼런스 ──────────────────────────────────────────────────────
    let overlay, box, titleEl, messageEl, input,
        errorEl, confirmBtn, cancelBtn, eyeToggle, eyeOff, eyeOn;

    let _onConfirm  = null;
    let _onCancel   = null;
    let _visible    = false;
    let _initialized = false;
    let _pausedFocusTrap = null;
    let _hideTimer = null;
    let _closeOnConfirm = true;
    let _confirmBusy = false;

    // ── 초기화 ────────────────────────────────────────────────────────────
    function init() {
        overlay    = document.getElementById('passwordModalOverlay');
        box        = document.getElementById('passwordModalBox');
        titleEl    = document.getElementById('pwModalTitle');
        messageEl  = document.getElementById('pwModalMessage');
        input      = document.getElementById('pwModalInput');
        errorEl    = document.getElementById('pwModalError');
        confirmBtn = document.getElementById('pwModalConfirmBtn');
        cancelBtn  = document.getElementById('pwModalCancelBtn');
        eyeToggle  = document.getElementById('pwToggleEye');
        eyeOff     = document.getElementById('pwEyeOff');
        eyeOn      = document.getElementById('pwEyeOn');

        if (!overlay) {
            console.error('[PasswordModal] #passwordModalOverlay 를 찾을 수 없습니다. password_modal.html 프래그먼트가 포함되어 있는지 확인하세요.');
            return false;
        }

        // ── 핵심 수정 ①: document.body로 이동 ────────────────────────────
        // AdminLTE 레이아웃의 transform/overflow 스타일이 적용된 조상 안에
        // position:fixed 요소가 있으면 뷰포트 기준이 아닌 조상 기준으로
        // 배치되어 화면 전체를 덮지 못하거나 stacking context 문제가 생깁니다.
        if (overlay.parentElement !== document.body) {
            document.body.appendChild(overlay);
        }

        // ── 이벤트 등록 ───────────────────────────────────────────────────

        // 확인 / 취소 버튼
        confirmBtn.addEventListener('click', _handleConfirm);
        cancelBtn.addEventListener('click',  _handleCancel);

        // 오버레이 배경 클릭 → 닫기
        // mousedown 사용: click 이벤트는 input focus-blur 이후에 발생해
        // 일부 브라우저에서 이중 이벤트가 생길 수 있음
        overlay.addEventListener('mousedown', function (e) {
            if (e.target === overlay) _handleCancel();
        });

        // 박스 내부 클릭은 상위(오버레이)로 전파하지 않음
        box.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });

        // Enter → 확인
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                _handleConfirm();
            }
        });

        // 타이핑 시 에러 실시간 해제
        input.addEventListener('input', function () {
            if (_visible) _clearError();
        });

        // 눈 아이콘 클릭
        eyeToggle.addEventListener('click', _toggleEye);

        // ESC → 닫기 (document 레벨)
        document.addEventListener('keydown', _handleKeydown);

        _initialized = true;
        return true;
    }

    // ── 공개 API ──────────────────────────────────────────────────────────
    function show({ title = '비밀번호 확인', message = '', closeOnConfirm = true, onConfirm, onCancel } = {}) {
        if (!_initialized && !init()) return;

        _pauseBootstrapFocusTrap();

        _onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
        _onCancel  = typeof onCancel  === 'function' ? onCancel  : null;
        _closeOnConfirm = closeOnConfirm !== false;

        // 내용 설정
        titleEl.textContent = title;
        if (message) {
            messageEl.textContent = message;
            messageEl.style.display = '';
        } else {
            messageEl.style.display = 'none';
        }

        // 초기화
        _clearError();
        input.value = '';
        _resetEye();
        setLoading(false);

        // ── 핵심 수정 ②: 표시 방식 변경 ─────────────────────────────────
        // display:none → flex 전환 후 포커스
        // visibility:hidden만 쓰면 transition 도중 pointer-events가 살아있을 수 있음
        overlay.style.display = 'flex';
        // 다음 프레임에서 active 클래스 추가 (CSS transition 트리거)
        requestAnimationFrame(function () {
            overlay.classList.add('pw-modal-active');
            overlay.setAttribute('aria-hidden', 'false');
            _visible = true;

            // ── 핵심 수정 ③: 포커스 타이밍 ─────────────────────────────
            // transition 180ms가 끝난 뒤 포커스 (visibility 전환 완료 보장)
            setTimeout(function () {
                if (_visible) input.focus();
            }, 200);
        });
    }

    function hide() {
        if (!overlay) return;
        overlay.classList.remove('pw-modal-active');
        overlay.setAttribute('aria-hidden', 'true');
        _visible = false;

        // transition 종료 후 display:none으로 완전 제거
        // → pointer-events 가로채기 완전 차단
        overlay.addEventListener('transitionend', _finishHide, { once: true });
        clearTimeout(_hideTimer);
        _hideTimer = setTimeout(_finishHide, 250);
    }

    function _finishHide() {
        clearTimeout(_hideTimer);
        _hideTimer = null;

        if (!_visible) {
            overlay.style.display = 'none';
            _clearError();
            input.value = '';
            _resetEye();
            setLoading(false);
            _restoreBootstrapFocusTrap();
        }
    }

    // ── 내부 핸들러 ───────────────────────────────────────────────────────
    async function _handleConfirm() {
        if (_confirmBusy) return;

        const value = input.value;
        if (!value || value.trim() === '') {
            _showError('비밀번호를 입력해 주세요.');
            input.focus();
            return;
        }
        const pw = value; // hide()가 input.value를 초기화하므로 미리 저장
        const controls = _getControls();

        if (_closeOnConfirm) {
            hide();
            if (_onConfirm) _onConfirm(pw, controls);
            return;
        }

        if (!_onConfirm) return;

        try {
            setLoading(true);
            await _onConfirm(pw, controls);
        } catch (err) {
            _showError(err?.message || '처리 중 오류가 발생했습니다.');
        } finally {
            if (_visible) {
                setLoading(false);
                input.focus();
            }
        }
    }

    function _handleCancel() {
        if (_confirmBusy) return;
        hide();
        if (_onCancel) _onCancel();
    }

    function _handleKeydown(e) {
        if (!_visible) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            _handleCancel();
        }
    }

    function _showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.add('pw-modal-error--visible');
        input.classList.add('pw-input-error');
        // 흔들기 애니메이션 재실행 (reflow 강제)
        input.classList.remove('pw-input-shake');
        void input.offsetWidth;
        input.classList.add('pw-input-shake');
    }

    function showError(msg) {
        if (!_initialized && !init()) return;
        _showError(msg);
        input.focus();
    }

    function _clearError() {
        errorEl.textContent = '';
        errorEl.classList.remove('pw-modal-error--visible');
        input.classList.remove('pw-input-error', 'pw-input-shake');
    }

    function clearError() {
        if (!_initialized && !init()) return;
        _clearError();
    }

    function setLoading(isLoading) {
        _confirmBusy = !!isLoading;
        if (!confirmBtn || !cancelBtn || !input || !eyeToggle) return;

        if (!confirmBtn.dataset.defaultText) {
            confirmBtn.dataset.defaultText = confirmBtn.textContent || '확인';
        }

        confirmBtn.disabled = _confirmBusy;
        cancelBtn.disabled = _confirmBusy;
        input.disabled = _confirmBusy;
        eyeToggle.disabled = _confirmBusy;
        confirmBtn.textContent = _confirmBusy ? '확인 중...' : confirmBtn.dataset.defaultText;

    }

    function _getControls() {
        return {
            hide,
            showError,
            clearError,
            setLoading
        };
    }

    function _toggleEye() {
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        eyeOff.style.display = isPw ? 'none' : '';
        eyeOn.style.display  = isPw ? ''     : 'none';
        input.focus();
    }

    function _resetEye() {
        input.type = 'password';
        eyeOff.style.display = '';
        eyeOn.style.display  = 'none';
    }

    function _pauseBootstrapFocusTrap() {
        _restoreBootstrapFocusTrap();

        if (!window.bootstrap?.Modal) return;

        const openModals = Array.from(document.querySelectorAll('.modal.show'));
        const activeModalEl = openModals[openModals.length - 1];
        if (!activeModalEl) return;

        const modalInstance = window.bootstrap.Modal.getInstance(activeModalEl);
        const focusTrap = modalInstance?._focustrap;
        if (!focusTrap || typeof focusTrap.deactivate !== 'function') return;

        focusTrap.deactivate();
        _pausedFocusTrap = { modalEl: activeModalEl, focusTrap };
    }

    function _restoreBootstrapFocusTrap() {
        if (!_pausedFocusTrap) return;

        const { modalEl, focusTrap } = _pausedFocusTrap;
        _pausedFocusTrap = null;

        if (!modalEl.classList.contains('show')) return;
        if (typeof focusTrap.activate === 'function') {
            focusTrap.activate();
        }
    }

    // ── DOM 준비 후 자동 초기화 ───────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('passwordModalOverlay')) {
            init();
        }
    });

    return { show, hide, showError, clearError, setLoading };

})();
