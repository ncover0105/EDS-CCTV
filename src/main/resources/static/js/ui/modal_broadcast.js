/* ============================================================
    Broadcast Modal Controller
    - 수동발령 모달의 UI 제어
============================================================ */
window.BroadcastModal = (function () {

    /* ------------------------------------------
        1) 공통 버튼 그룹 토글
    ------------------------------------------ */
    function initButtonGroups() {
        const groupButtons = document.querySelectorAll("[data-group]");
    
        groupButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const group = btn.dataset.group;
                const isActive = btn.classList.contains("active");
    
                if (isActive) {
                    // 이미 선택된 버튼을 다시 클릭 → 해제
                    btn.classList.remove("active");
                    return;
                }
    
                // 동일 그룹 버튼 초기화
                document.querySelectorAll(`[data-group="${group}"]`)
                    .forEach(b => b.classList.remove("active"));
    
                // 현재 클릭된 버튼 활성화
                btn.classList.add("active");
            });
        });
    }
    /* ------------------------------------------
        2) 메시지 옵션 선택
    ------------------------------------------ */
    function initMessageSelect() {
        const radios = document.querySelectorAll(".message-option input[type='radio']");
        const textarea = document.getElementById("messageInput");

        radios.forEach(radio => {
            radio.addEventListener("change", () => {
                textarea.value = ""; // Custom 입력 초기화
                updateCharCount();
            });
        });
    }

    /* ------------------------------------------
        3) Custom Message 글자수 카운팅
    ------------------------------------------ */
    function updateCharCount() {
        const textarea = document.getElementById("messageInput");
        const counter = document.getElementById("charCount");

        if (!textarea || !counter) return;

        counter.innerText = `${textarea.value.length} / 1000 characters`;
    }

    function initMessageCounter() {
        const textarea = document.getElementById("messageInput");
        if (!textarea) return;

        textarea.addEventListener("input", updateCharCount);
    }

    /* ------------------------------------------
        4) 발령 대상 체크박스 선택 수 업데이트
    ------------------------------------------ */
function initTargetSelector() {
    const checkboxes = document.querySelectorAll(".target-check");
    const countEl = document.getElementById("selectedCount");
    const summaryEl = document.querySelector(".selection-summary");

    if (!countEl || !summaryEl) return;

    function updateCount() {
        const selected = document.querySelectorAll(".target-check:checked").length;
        countEl.innerText = selected + "개";

        if (selected > 0) {
            summaryEl.classList.add("active");
        } else {
            summaryEl.classList.remove("active");
        }
    }

    checkboxes.forEach(chk => chk.addEventListener("change", updateCount));

    updateCount(); // 초기 상태 반영
}


    /* ------------------------------------------
        5) 확인 버튼 클릭
    ------------------------------------------ */
    function initConfirmButton() {
        const btn = document.getElementById("confirmAlert");
        if (!btn) return;

        btn.addEventListener("click", () => {
            const selectedMode = document.querySelector(".btn.active[data-group='mode']");
            const selectedMedia = document.querySelector(".btn.active[data-group='media']");
            const selectedType = document.querySelector(".btn.active[data-group='type']");
            const customMessage = document.getElementById("messageInput").value.trim();
            const selectedMsg = document.querySelector(".message-option input[type='radio']:checked");

            // 선택된 발령 대상
            const targets = [...document.querySelectorAll(".target-check:checked")]
                .map(chk => chk.nextElementSibling.innerText);

            // 유효성 체크
            if (!selectedMode || !selectedMedia || !selectedType) {
                Utils.alert("모든 설정 항목을 선택해주세요!", "warning");
                return;
            }

            if (!selectedMsg && customMessage.length === 0) {
                Utils.alert("문안 또는 Custom Message를 입력하세요!", "warning");
                return;
            }

            if (targets.length === 0) {
                Utils.alert("발령 대상을 1개 이상 선택하세요!", "warning");
                return;
            }

            const finalMessage = selectedMsg 
                ? selectedMsg.nextElementSibling.innerText
                : customMessage;

            console.log("⚡ [Broadcast Confirmed]");
            console.log("Mode:", selectedMode.innerText);
            console.log("Media:", selectedMedia.innerText);
            console.log("Type:", selectedType.innerText);
            console.log("Message:", finalMessage);
            console.log("Targets:", targets);

            Utils.alert("발령 요청이 완료되었습니다!", "success");

            const modalEl = document.getElementById("broadcast_modal");
            bootstrap.Modal.getInstance(modalEl).hide();
        });
    }

    async function loadBroadcastMessages() {
        const listEl = document.getElementById("broadcastMessageList");
        if (!listEl) return;
    
        try {
            const messages = await App.utils.fetchJson("/api/broadcast/list");
    
            listEl.innerHTML = ""; // 기존 비우기
    
            messages
                .filter(m => m.useInfo === 1) // 사용중인 메시지만 표시
                .forEach(msg => {
                    const id = `msg_${msg.code}`;
    
                    const item = `
                        <div class="message-option">
                            <input type="radio" name="message" id="${id}" value="${msg.code}">
                            <label for="${id}">${msg.title}</label>
                        </div>
                    `;
    
                    listEl.insertAdjacentHTML("beforeend", item);
                });
    
            console.log("📩 Broadcast messages loaded:", messages.length);
    
        } catch (err) {
            console.error("❌ Broadcast message load error:", err);
        }
    }

    async function loadSpeakerTargets() {
        const listEl = document.getElementById("broadcastTargetList");
        if (!listEl) return;
    
        try {
            const speakers = await App.utils.fetchJson("/api/speaker/list");
    
            listEl.innerHTML = ""; // 기존 내용 삭제
    
            speakers
                .filter(sp => sp.useInfo === 1) // 사용중인 스피커만 표시
                .forEach(sp => {
                    const id = `target_${sp.speakerCode}`;
    
                    const name = (sp.speakerName || "알수 없음").trim();
                    const location = (sp.locationCode || "-");
                    const address = (sp.speakerAdr || "알수 없음").trim();
    
                    const item = `
                        <div class="target-option">
                            <input type="checkbox" 
                                    class="target-check" 
                                    id="${id}" 
                                    value="${sp.speakerCode}">
                            <label for="${id}">
                                ${name} (${address})
                            </label>
                        </div>
                    `;
    
                    listEl.insertAdjacentHTML("beforeend", item);
                });
    
            console.log("📡 Speaker targets loaded:", speakers.length);
    
            // 선택 수 카운트 초기화
            initTargetSelector();
    
        } catch (err) {
            console.error("❌ Speaker list load error:", err);
        }
    }
    
    function init() {
        initButtonGroups();
        initMessageSelect();
        initMessageCounter();
        initTargetSelector();
        initConfirmButton();
        updateCharCount();

        loadBroadcastMessages();
        loadSpeakerTargets();

        console.log("📢 BroadcastModal.init() complete.");
    }

    return { init };

})();
