const itemsPerPage = 15;
let currentPage = 1;

let userData = [];
let mentData = [];
let smsData = [];
let bgmData = [];

const renderMap = {
    user: renderUserTable,
    ment: renderMentTable,
    sms: renderSmsTable,
    bgm: renderBgmTable,
    setting: () => {
        // 모든 .radio-group 안의 라벨 스타일을 초기화 및 이벤트 등록
        document.querySelectorAll('.radio-group').forEach(group => {
            updateRadioLabelStyles(group);
    
          // change 이벤트 등록
            group.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', () => updateRadioLabelStyles(group));
            });
        });

        loadSetting();
    }
};

function renderView(currentView) {
    const renderFunc = renderMap[currentView];
    console.log('renderFunc :', renderFunc);

    if (renderFunc) {
        renderFunc();
    } else {
        console.warn(`페이지 오류: ${currentView}`);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    userData = generateRandomUserData();
    mentData = generateRandomMentData();
    smsData = generateRandomSmsData();
    bgmData = generateRandomBgmData();

    console.log('currentView :', currentView);
    renderView(currentView);
});

function mentInsert() {
    alert('등록 기능');
}

function mentUpdate() {
    const updateModal = new bootstrap.Modal(document.getElementById('updateModal'));

    if (!selectedData) return;

    // 모달 폼에 기존 데이터 채우기
    document.getElementById('updateId').value = selectedData.selectedId;
    document.getElementById('updateTitle').value = selectedData.title;
    document.getElementById('updateText').value = selectedData.text;
    document.getElementById('updateStatus').value = selectedData.status;

    // 모달 띄우기
    updateModal.show();
}

function mentDeprecated() {
    alert('삭제 기능');
}

// --- 사용자 설정 ---
function generateRandomUserData(count = 25) {
    const names = ['홍길동', '김민수', '이영희', '박지훈', '최수정', '정예린', '한지민', '조세호'];
    const phones = ['010-1234-5678', '010-9876-5432', '010-1111-2222', '010-3333-4444'];

    return Array.from({ length: count }, (_, i) => ({
        id: `user${i + 1}`,
        name: names[Math.floor(Math.random() * names.length)],
        phnNo: phones[Math.floor(Math.random() * phones.length)],
        valid: Math.random() > 0.2 // 80%는 정상, 20%는 오류
    }));
}

function renderUserTable() {
    const tbody = document.getElementById('userList');
    const btnEdit = document.getElementById('btn-edit');
    const btnDisable = document.getElementById('btn-disable');

    if (!tbody) {
        console.error('userList tbody 요소가 없습니다.');
        return;
    }

    tbody.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (!row) return;

        if (event.target.type === 'checkbox') return;

        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            row.classList.toggle('table-active', checkbox.checked);
        }
    });
    
    tbody.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const row = event.target.closest('tr');
            row.classList.toggle('table-active', event.target.checked);
        }
    });
    
    function getSelectedUsers() {
        const checkedBoxes = tbody.querySelectorAll('input[name="selectedIds"]:checked');
        return Array.from(checkedBoxes).map(cb => {
            const row = cb.closest('tr');
            return {
                id: row.children[2].textContent.trim(),
                name: row.children[3].textContent.trim(),
                phone: row.children[4].textContent.trim(),
                role: row.children[5].innerText.includes("관리자") ? "MANAGER" : "USER"
            };
        });
    }
    
    btnEdit.addEventListener('click', () => {
        const selectedUsers = getSelectedUsers();
        if (selectedUsers.length === 0) {
            alert('수정할 사용자를 선택하세요.');
            return;
        }
        if (selectedUsers.length > 1) {
            alert('한 명의 사용자만 수정할 수 있습니다.');
            return;
        }

        userUpdate(selectedUsers[0]);
    });

    btnDisable.addEventListener('click', () => {
        const selectedUsers = getSelectedUsers();
        if (selectedUsers.length === 0) {
            alert('사용중지할 사용자를 선택하세요.');
            return;
        }

        if (confirm(`${selectedUsers.length}명의 사용자를 사용중지하시겠습니까?`)) {
            userDisable(selectedUsers);
        }
    });
}

// 페이지네이션 렌더링
function renderUserPagination() {
    App.utils.renderPagination({
        containerId: 'userPagination',
        currentPage: currentPage,
        totalItems: userData.length,
        itemsPerPage: 9,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderUserTable(currentPage);
            renderUserPagination();
        }
    });
}

/**
 * 사용자 등록 처리
 */
function userInsert() {
    alert("사용자 등록 기능 실행");
    // 👉 여기에 등록 모달 표시, API 호출 등 구현
}

/**
 * 사용자 수정 처리
 */
function userUpdate(user) {
    // user: {id, name, phone, role}
    console.log('수정할 사용자:', user);

    // 모달 띄우기 (Bootstrap 예시)
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserPhone').value = user.phone;
    document.getElementById('editUserRole').value = user.role;

    const modal = new bootstrap.Modal(document.getElementById('userEditModal'));
    modal.show();
}

/**
 * 사용자 사용중지 처리
 */
function userDisable() {
    const confirmStop = confirm("선택된 사용자를 사용 중지하시겠습니까?");
    if (confirmStop) {
        alert("사용중지 완료!");
    }
}


// --- 문안 설정 ---
function generateRandomMentData(count = 30) {
    const mentNames = ['긴급 안내', '일반 안내', '재난 방송', '기상 정보', '교통 상황'];
    const mentContents = [
        '긴급 상황 발생 시 신속히 대피해 주세요.',
        '오늘은 맑은 날씨가 예상됩니다.',
        '재난 방송이 시작됩니다. 안내에 따라 주세요.',
        '기상 악화가 예상되니 주의 바랍니다.',
        '교통 혼잡이 예상되니 대중교통 이용 바랍니다.'
    ];

    return Array.from({ length: count }, (_, i) => ({
        no: i + 1,
        name: mentNames[Math.floor(Math.random() * mentNames.length)],
        content: mentContents[Math.floor(Math.random() * mentContents.length)],
        valid: Math.random() > 0.3 // 약 70%는 사용중, 30%는 미사용
    }));
}

// 문안 목록 렌더링
function renderMentTable() {
    const tbody = document.getElementById('mentList');
    if (!tbody) return;

    const updateModal = new bootstrap.Modal(document.getElementById('mentUpdateModal'));

    // 행 클릭 시 단일 선택
    tbody.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (!row) return;
    
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
    
        const isAlreadyChecked = checkbox.checked;
    
        // 다른 체크박스 모두 해제
        tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('tr').classList.remove('table-active');
        });
    
        // 이전에 체크된 행이면 체크 해제, 아니면 체크
        checkbox.checked = !isAlreadyChecked;
        row.classList.toggle('table-active', !isAlreadyChecked);
    });
    
    function getSelectedMentData() {
        const checkedBox = tbody.querySelector('input[name="selectedIds"]:checked');
        if (!checkedBox) return null;

        const row = checkedBox.closest('tr');
        return {
            no: checkedBox.value,
            name: row.cells[2].textContent.trim(),
            content: row.cells[3].textContent.trim(),
            status: row.cells[4].querySelector('span').textContent.trim()
        };
    }

    // 수정 버튼 이벤트
    const btnEdit = document.getElementById('btn-edit');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            const data = getSelectedMentData();
            if (!data) {
                alert('수정할 항목을 선택하세요.');
                return;
            }

            // 모달에 데이터 채우기
            document.getElementById('mentUpdateId').value = data.no;
            document.getElementById('mentUpdateName').value = data.name;
            document.getElementById('mentUpdateContent').value = data.content;
            document.getElementById('mentUpdateStatus').value = data.status;

            updateModal.show();
        });
    }

    // 저장 버튼 이벤트
    document.getElementById('mentSaveUpdateBtn').addEventListener('click', () => {
        const id = document.getElementById('mentUpdateId').value;
        const name = document.getElementById('mentUpdateName').value.trim();
        const content = document.getElementById('mentUpdateContent').value.trim();
        const status = document.getElementById('mentUpdateStatus').value;

        if (!name || !content) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 여기서 서버 요청 또는 테이블 갱신
        console.log('수정된 멘트 데이터:', { id, name, content, status });

        updateModal.hide();
    });
}

function renderMentPagination() {
    App.utils.renderPagination({
        containerId: 'mentPagination',
        currentPage: currentPage,
        totalItems: mentData.length,
        itemsPerPage: itemsPerPage,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderMentTable(currentPage);
            renderMentPagination();
        }
    });
}

// --- SMS 알림설정 ---
function generateRandomSmsData(count = 30) {
    const names = ['홍길동', '김철수', '이영희', '박민수', '최지은'];
    const phonePrefix = ['010', '011', '016', '017', '019'];
    
    return Array.from({ length: count }, (_, i) => ({
        no: i + 1,
        name: names[Math.floor(Math.random() * names.length)],
        phone: phonePrefix[Math.floor(Math.random() * phonePrefix.length)] + '-' +
               String(Math.floor(1000 + Math.random() * 9000)) + '-' +
               String(Math.floor(1000 + Math.random() * 9000)),
        situationSms: Math.random() > 0.5 ? '사용' : '미사용',
        alertSms: Math.random() > 0.5 ? '사용' : '미사용',
        enabled: Math.random() > 0.5 ? '사용' : '미사용'
    }));
}

function renderSmsTable() {
    const tbody = document.getElementById('smsUserList');
    if (!tbody) {
        console.error('smsUserList tbody 요소가 없습니다.');
        return;
    }
    const editBtn = document.getElementById("btn-edit");
    const smsModal = new bootstrap.Modal(document.getElementById('smsEditModal'));
    const modalUserId = document.getElementById('modalUserId');
    const modalUserName = document.getElementById('modalUserName');
    const modalUserPhn = document.getElementById('modalUserPhn');
    const modalEventAlert = document.getElementById('modalEventAlert');
    const modalWarnAlert = document.getElementById('modalWarnAlert');
    const modalAlertEnabled = document.getElementById('modalAlertEnabled');
    const modalSaveBtn = document.getElementById('modalSaveBtn');

    tbody.querySelectorAll("tr").forEach(tr => {
        const checkbox = tr.querySelector("input.alert-toggle");
    
        // ✅ 행 클릭 처리 (체크박스 클릭은 제외)
        tr.addEventListener("click", e => {
            if(e.target.tagName.toLowerCase() !== 'input') {
                checkbox.checked = !checkbox.checked; // 행 클릭 시만 토글
            }
        });
    
        // ✅ 체크박스 클릭은 브라우저 기본 동작 유지
        checkbox.addEventListener("click", e => {
            e.stopPropagation(); // 부모 tr 클릭 이벤트 중복 방지
            // toggleAlert() 제거 → 브라우저가 체크 상태를 바꿈
        });
    });

    editBtn.addEventListener("click", () => {
        // 체크된 사용자 1명만 편집
        const checkedBoxes = tbody.querySelectorAll("input.alert-toggle:checked");
        if (checkedBoxes.length !== 1) {
            alert("수정할 사용자를 1명만 선택해주세요.");
            return;
        }

        const tr = checkedBoxes[0].closest("tr");
        modalUserId.value = tr.dataset.userId;
        modalUserName.value = tr.querySelector("td:nth-child(3)").innerText;
        modalUserPhn.value = tr.querySelector("td:nth-child(4)").innerText;
        modalEventAlert.checked = tr.querySelector("td:nth-child(5) .status-badge").innerText === "ON";
        modalWarnAlert.checked = tr.querySelector("td:nth-child(6) .status-badge").innerText === "ON";
        modalAlertEnabled.checked = tr.querySelector("td:nth-child(7) .status-badge").innerText === "ON";

        smsModal.show();
    });
}

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// BGM 스케줄
function generateRandomBgmData(count = 30) {
    const speakerNames = ['스피커1', '스피커2', '스피커3', '스피커4', '스피커5'];
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const modes = ['자동', '수동', '예약'];
    const folders = ['폴더A', '폴더B', '폴더C'];

    function pad(num) { return num.toString().padStart(2, '0'); }

    return Array.from({ length: count }, (_, i) => {
        const startHour = 6 + (i % 12);
        const endHour = (startHour + 1) % 24;
        return {
            no: i + 1,
            speakerName: speakerNames[Math.floor(Math.random() * speakerNames.length)],
            startTime: `${pad(startHour)}:00`,
            endTime: `${pad(endHour)}:00`,
            day: days[Math.floor(Math.random() * days.length)],
            repeat: Math.random() > 0.5 ? '반복' : '반복 안함',
            enabled: Math.random() > 0.5 ? '사용' : '미사용',
            mode: modes[Math.floor(Math.random() * modes.length)],
            folder: folders[Math.floor(Math.random() * folders.length)]
        };
    });
}

// --- 설정 ---
function updateRadioLabelStyles(groupElement) {
    const radios = groupElement.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        const label = groupElement.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            label.classList.toggle('text-primary', radio.checked); // 강조
            label.classList.toggle('text-gray', !radio.checked);  // 비강조
        }
    });
}
// 변경 시 갱신
document.querySelectorAll('.radio-group').forEach(group => {
    updateRadioLabelStyles(group);

    // 각 그룹 내에서 라디오에 이벤트 바인딩
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => updateRadioLabelStyles(group));
    });
});

// BGM 스케줄 관리 렌더링 함수
function renderBgmTable() {
    // 스케줄 데이터 초기화
    initScheduleManager();
    
    // 라디오 그룹 스타일 적용 (모달 내 라디오 버튼용)
    document.querySelectorAll('.radio-group').forEach(group => {
        updateRadioLabelStyles(group);
        group.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => updateRadioLabelStyles(group));
        });
    });
}

// 스케줄 관리 초기화
let schedules = [];
let expandedSchedule = null;
let editingScheduleId = null;
let devicesForm = [];

const weekDays = [
    { key: 'mon', label: '월' },
    { key: 'tue', label: '화' },
    { key: 'wed', label: '수' },
    { key: 'thu', label: '목' },
    { key: 'fri', label: '금' },
    { key: 'sat', label: '토' },
    { key: 'sun', label: '일' }
];

function initScheduleManager() {
    // 샘플 데이터 로드 (실제로는 API 호출)
    // loadSchedules();
    
    // 이벤트 리스너 등록
    const addBtn = document.getElementById('add-schedule-btn');
    const form = document.getElementById('schedule-form');
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    
    if (addBtn) {
        addBtn.onclick = () => openScheduleModal();
    }
    
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            handleScheduleSubmit();
        };
        
        // 재생 종류 변경 이벤트
        form.playType.forEach(radio => {
            radio.onchange = (e) => togglePlayTypeSection(e.target.value);
        });
    }
    
    if (addDeviceBtn) {
        addDeviceBtn.onclick = addDevice;
    }
    
    // 요일 버튼 생성
    createWeekdayButtons();
    
    // 초기 렌더링
    renderScheduleList();
}

// 스케줄 목록 로드 (API 호출 또는 샘플 데이터)
function loadSchedules() {
    // 실제로는 fetch('/api/schedules') 등으로 호출
    schedules = [
        {
            id: 1,
            startTime: '09:00',
            endTime: '18:00',
            createdDate: '2025-10-15',
            playType: 'BGM',
            bgmFolder: '매장음악/클래식',
            radioChannel: '',
            radioRegion: '',
            weekSchedule: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
            isRepeat: true,
            devices: [
                { name: '매장-001', authIp: '192.168.1.101', type: '디스플레이', manufacturer: 'Samsung', lte: '010-1234-5678', location: '1층 로비' }
            ]
        }
    ];
}

// 스케줄 목록 렌더링
function renderScheduleList() {
    const listDiv = document.getElementById('schedule-list');
    const countSpan = document.getElementById('schedule-count');
    const emptyMsg = document.getElementById('no-schedule-msg');
    
    if (!listDiv) {
        console.error('schedule-list element not found');
        return;
    }
    
    listDiv.innerHTML = '';
    countSpan.textContent = `총 ${scheduleList.length}개의 스케줄 | 재생 스케줄과 단말 정보를 관리하세요`;
    emptyMsg.classList.toggle('d-none', scheduleList.length > 0);
    
    scheduleList.forEach(schedule => {
        // ✅ weekSchedule 처리 (Map 객체)
        let weekStr = '';
        if (schedule.weekSchedule && typeof schedule.weekSchedule === 'object') {
            weekStr = weekDays
                .filter(d => schedule.weekSchedule[d.key])
                .map(d => d.label)
                .join(', ') || '-';
        }
        
        const isExpanded = expandedSchedule === schedule.id;
        
        const scheduleCard = document.createElement('div');
        scheduleCard.className = 'bg-white rounded shadow-sm mb-2 p-3';
        scheduleCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
                    <button class="btn btn-sm btn-light" data-action="toggle" data-id="${schedule.id}">
                        <i class="bi bi-chevron-${isExpanded ? 'up' : 'down'}"></i>
                    </button>
                    <span class="status-badge ${schedule.playType === 'BGM' ? 'status-info' : 'status-purple'}">${schedule.playType}</span>
                    ${schedule.isRepeat ? '<span class="text-primary small"><i class="bi bi-arrow-repeat"></i> 반복</span>' : ''}
                    <span class="text-secondary small fw-medium"><i class="bi bi-clock"></i>
                        ${schedule.startTime ? schedule.startTime.substring(0, 5) : '-'} ~ 
                        ${schedule.endTime ? schedule.endTime.substring(0, 5) : '-'}
                    </span>
                    <span class="text-secondary small">${weekStr}</span>
                    ${schedule.playType === 'BGM' && schedule.bgmFolder ? 
                        `<span class="text-muted small"><i class="bi bi-file-earmark-music"></i> ${schedule.bgmFolder}</span>` : ''}
                    ${schedule.playType === '라디오' ? 
                        `<span class="text-muted small"><i class="bi bi-broadcast"></i> ${schedule.radioChannel} (${schedule.radioRegion})</span>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="small text-muted">${schedule.createdDate}</span>
                    <button class="btn btn-sm btn-light" data-action="edit" data-id="${schedule.id}">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-light" data-action="delete" data-id="${schedule.id}">
                        <i class="bi bi-trash3 text-danger"></i>
                    </button>
                </div>
            </div>
            ${isExpanded ? `
                <hr class="my-3">
                <div>
                    <h6 class="fw-bold mb-3 text-muted">할당된 스피커 (${schedule.speakers.length}개)</h6>
                    ${schedule.speakers && schedule.speakers.length > 0 ? `
                        <div class="table-responsive rounded-3">
                            <table class="table align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>코드</th>
                                        <th>단말명</th>
                                        <th>설치주소</th>
                                        <th>연락처</th>
                                        <th>연결상태</th>
                                        <th>등록시간</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${schedule.speakers.map(speaker => `
                                        <tr>
                                            <td>
                                                <small class="text-muted">${speaker.speakerCode || '-'}</small>
                                            </td>
                                            <td>${speaker.speakerName || '-'}</td>
                                            <td>${speaker.installAddress || '-'}</td>
                                            <td>${speaker.phone || '-'}</td>
                                            <td>
                                                <span class="status-badge ${speaker.connStat === '01' ? 'status-success' : speaker.connStat === '00' ? 'status-primary' : 'status-warning'}">
                                                    ${speaker.connStat === '01' ? '연결' : speaker.connStat === '00' ? '미연결' : '알수없음'}
                                                </span>
                                            </td>
                                            <td>
                                                <small class="text-muted">${speaker.createdAt ? speaker.createdAt.substring(0, 19) : '-'}</small>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="alert alert-info mb-0" role="alert">
                            <i class="bi bi-info-circle me-2"></i>할당된 단말이 없습니다.
                        </div>
                    `}
                </div>
            ` : ''}
        `;
        listDiv.appendChild(scheduleCard);
    });
    
    // 이벤트 위임
    listDiv.querySelectorAll('[data-action="toggle"]').forEach(btn => {
        btn.onclick = () => {
            const id = Number(btn.dataset.id);
            expandedSchedule = expandedSchedule === id ? null : id;
            renderScheduleList();
        };
    });
    
    listDiv.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.onclick = () => {
            const id = Number(btn.dataset.id);
            console.log('Edit schedule:', id);
            // openScheduleModal(id);
        };
    });
    
    listDiv.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.onclick = () => {
            const id = Number(btn.dataset.id);
            console.log('Delete schedule:', id);
            // deleteSchedule(id);
        };
    });
}

// 모달 열기
function openScheduleModal(scheduleId = null) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal')) || 
    new bootstrap.Modal(document.getElementById('scheduleModal'));
    const form = document.getElementById('schedule-form');
    const title = document.getElementById('scheduleModalLabel');
    const submitBtn = document.getElementById('submitBtn');
    
    editingScheduleId = scheduleId;
    devicesForm = [];
    
    if (scheduleId) {
        const schedule = schedules.find(s => s.id === scheduleId);
        form.startTime.value = schedule.startTime;
        form.endTime.value = schedule.endTime;
        form.playType.value = schedule.playType;
        form.bgmFolder.value = schedule.bgmFolder;
        form.radioChannel.value = schedule.radioChannel;
        form.radioRegion.value = schedule.radioRegion;
        form.isRepeat.checked = schedule.isRepeat;
        devicesForm = [...schedule.devices];
        updateWeekdayButtons(schedule.weekSchedule);
        title.textContent = '스케줄 수정';
        submitBtn.textContent = '수정하기';
    } else {
        form.reset();
        updateWeekdayButtons(getDefaultWeekSchedule());
        title.textContent = '새 스케줄 추가';
        submitBtn.textContent = '추가하기';
    }
    
    togglePlayTypeSection(form.playType.value);
    updateDeviceTable();
    modal.show();
}

// 요일 버튼 생성
function createWeekdayButtons() {
    const container = document.getElementById('weekdays');
    if (!container) return;
    
    container.innerHTML = weekDays.map((day, i) => 
        `<button type="button" class="btn btn-outline-primary flex-fill" id="weekday-${day.key}" data-day="${day.key}">
            ${day.label}
        </button>`
    ).join('');
}

// 요일 버튼 업데이트
function updateWeekdayButtons(weekSchedule) {
    weekDays.forEach(day => {
        const btn = document.getElementById(`weekday-${day.key}`);
        if (btn) {
            // 선택된 요일은 파란색, 선택 안 된 요일은 흰색 배경
            if (weekSchedule[day.key]) {
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-primary');
            }
            
            btn.onclick = () => {
                weekSchedule[day.key] = !weekSchedule[day.key];
                updateWeekdayButtons(weekSchedule);
            };
            btn.dataset.selected = weekSchedule[day.key] ? '1' : '0';
        }
    });
}
// 기본 요일 스케줄
function getDefaultWeekSchedule() {
    return { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false };
}

// BGM/라디오 섹션 토글
function togglePlayTypeSection(type) {
    const bgmSection = document.getElementById('bgm-section');
    const radioSection = document.getElementById('radio-section');
    
    if (type === 'BGM') {
        bgmSection.classList.remove('d-none');
        radioSection.classList.add('d-none');
    } else {
        bgmSection.classList.add('d-none');
        radioSection.classList.remove('d-none');
    }
}

// 단말 추가
function addDevice() {
    const name = document.getElementById('deviceName').value.trim();
    const authIp = document.getElementById('deviceAuthIp').value.trim();
    
    if (!name || !authIp) {
        alert('단말기명과 인증 IP는 필수입니다.');
        return;
    }
    
    devicesForm.push({
        name,
        authIp,
        type: document.getElementById('deviceType').value.trim(),
        manufacturer: document.getElementById('deviceManufacturer').value.trim(),
        lte: document.getElementById('deviceLte').value.trim(),
        location: document.getElementById('deviceLocation').value.trim()
    });
    
    // 입력 필드 초기화
    ['deviceName', 'deviceAuthIp', 'deviceType', 'deviceManufacturer', 'deviceLte', 'deviceLocation']
        .forEach(id => document.getElementById(id).value = '');
    
    updateDeviceTable();
}

// 단말 테이블 업데이트
function updateDeviceTable() {
    const wrapper = document.getElementById('deviceTableWrapper');
    const table = document.getElementById('deviceTable');
    const count = document.getElementById('deviceCount');
    
    if (!table) return;
    
    table.innerHTML = '';
    count.textContent = devicesForm.length;
    
    if (devicesForm.length === 0) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'block';
    devicesForm.forEach((device, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${device.name}</td>
            <td>${device.authIp}</td>
            <td>${device.type}</td>
            <td>${device.manufacturer}</td>
            <td>${device.lte}</td>
            <td>${device.location}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-danger" data-idx="${idx}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        row.querySelector('button').onclick = () => {
            devicesForm.splice(idx, 1);
            updateDeviceTable();
        };
        table.appendChild(row);
    });
}

// 스케줄 저장
function handleScheduleSubmit() {
    const form = document.getElementById('schedule-form');
    const weekSchedule = {};
    
    weekDays.forEach(day => {
        const btn = document.getElementById(`weekday-${day.key}`);
        weekSchedule[day.key] = btn.dataset.selected === '1';
    });
    
    const data = {
        startTime: form.startTime.value,
        endTime: form.endTime.value,
        playType: form.playType.value,
        bgmFolder: form.bgmFolder.value,
        radioChannel: form.radioChannel.value,
        radioRegion: form.radioRegion.value,
        weekSchedule,
        isRepeat: form.isRepeat.checked,
        devices: [...devicesForm]
    };
    
    if (editingScheduleId) {
        const idx = schedules.findIndex(s => s.id === editingScheduleId);
        schedules[idx] = { ...schedules[idx], ...data };
    } else {
        schedules.push({
            id: schedules.length ? Math.max(...schedules.map(s => s.id)) + 1 : 1,
            ...data,
            createdDate: new Date().toISOString().split('T')[0]
        });
    }
    
    // 실제로는 여기서 API 호출
    // await fetch('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
    
    bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
    expandedSchedule = null;
    renderScheduleList();
}

// 스케줄 삭제
function deleteSchedule(id) {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) return;
    
    schedules = schedules.filter(s => s.id !== id);
    // 실제로는 API 호출: await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    
    renderScheduleList();
}

async function saveSetting() {
    const setting = {
        id: 1, // 고정 ID
        autoApproval: document.getElementById("autoApproval").checked,
        mode: document.querySelector("input[name='mode']:checked").value === 'real' ? 0 : 1,
        media: document.querySelector("input[name='media']:checked").value,
        type: document.querySelector("input[name='type']:checked").value,
        mapApiKey: document.getElementById("mapApiKey").value
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setting)
        });

        if (!response.ok) {
            const err = await response.text();
            alert("설정 저장 실패: " + err);
            return;
        }

        const result = await response.json();

        iziToast.success({
            // title: '✔ 성공!',
            message: '설정이 성공적으로 저장되었습니다.',
            position: 'topRight',
            timeout: 4000,
            progressBar: true,
            backgroundColor: '#1e7e34',      // 진한 초록
            titleColor: '#ffffff',           // 타이틀 텍스트 색 (흰색)
            messageColor: '#e0ffe0',         // 메시지 텍스트 색 (연한 초록)
            icon: 'bi bi-check-circle',
            iconColor: '#ffffff',
            transitionIn: 'fadeInDown',
            transitionOut: 'fadeOutUp',
            close: false
        });

        console.log("저장된 설정:", result);
    } catch (err) {
        console.error("저장 오류:", err);
        alert("오류가 발생했습니다: " + err.message);
    }
}

async function loadSetting() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error("설정 불러오기 실패");

        const setting = await response.json();

        // 설정 적용
        document.getElementById("autoApproval").checked = setting.autoApproval;
        document.getElementById("modeReal").checked = setting.mode === 0;
        document.getElementById("modeTest").checked = setting.mode === 1;
        document.getElementById("mediaCable").checked = setting.media === 'cable';
        document.getElementById("mediaDmb").checked = setting.media === 'dmb';
        document.getElementById("typeTts").checked = setting.type === 'tts';
        document.getElementById("typeSaved").checked = setting.type === 'saved';
        document.getElementById("mapApiKey").value = setting.mapApiKey || '';

        console.log("설정 초기값 로드 완료:", setting);

        // 스타일 업데이트 다시 실행
        document.querySelectorAll('.radio-group').forEach(group => {
            updateRadioLabelStyles(group);
        });

    } catch (err) {
        console.error("설정 불러오기 실패:", err);
        alert("설정을 불러오는 중 오류가 발생했습니다.");
    }
}
