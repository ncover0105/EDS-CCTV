document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const group = this.classList.contains('mode-btn') ? '.mode-btn' : 
                    this.classList.contains('media-btn') ? '.media-btn' : '.broadcast-btn';
        
        document.querySelectorAll(group).forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Character Counter
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');

messageInput.addEventListener('input', function() {
    const length = this.value.length;
    charCount.textContent = `${length} / 1000 characters`;
    
    if (length > 900) {
        charCount.style.color = 'var(--accent-red)';
    } else if (length > 700) {
        charCount.style.color = 'var(--accent-orange)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
});

// Target Selection Counter
const targetChecks = document.querySelectorAll('.target-check');
const selectedCount = document.getElementById('selectedCount');

targetChecks.forEach(check => {
    check.addEventListener('change', function() {
        const checkedCount = document.querySelectorAll('.target-check:checked').length;
        selectedCount.textContent = checkedCount;
        
        const summary = document.querySelector('.selection-summary');
        if (checkedCount > 0) {
            summary.style.background = 'rgba(0, 122, 255, 0.1)';
            summary.style.borderColor = 'var(--accent-blue)';
            summary.style.color = 'var(--accent-blue)';
        } else {
            summary.style.background = 'var(--bs-gray-300)';
            summary.style.borderColor = 'var(--border-secondary)';
            summary.style.color = 'var(--text-secondary)';
        }
    });
});

// Radio button click animation
document.querySelectorAll('.message-option').forEach(option => {
    option.addEventListener('click', function() {
        
        document.querySelectorAll('.message-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        this.classList.add('selected');

        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
    });
});

// Checkbox click animation
document.querySelectorAll('.target-option').forEach(option => {
    option.addEventListener('click', function() {
        const checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
        
        // Visual feedback
        if (checkbox.checked) {
            this.style.background = 'rgba(0, 122, 255, 0.1)';
        } else {
            this.style.background = 'transparent';
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const confirmAlertBtn = document.getElementById('confirmAlert');
    if (confirmAlertBtn) {
        confirmAlertBtn.addEventListener('click', () => {
            const modalEl = document.getElementById('customAlertModal');
            if (!modalEl) {
                console.error('❌ customAlertModal element not found in DOM!');
                return;
            }
            let customAlertModal = bootstrap.Modal.getInstance(modalEl);
            if (!customAlertModal) {
                customAlertModal = new bootstrap.Modal(modalEl);
            }
            customAlertModal.show();
        });
    }

    document.querySelectorAll('.button-group button').forEach(button => {
        button.addEventListener('click', function () {
            const grp = this.dataset.group;
            document.querySelectorAll(`.button-group button[data-group="${grp}"]`)
                .forEach(btn => {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                });
            this.classList.remove('btn-outline-primary');
            this.classList.add('btn-primary');
        });
    });

    let disasterDataMap = {};

    // 재난 코드 미리 로드
    const disasterCodeSelect = document.getElementById('DisasterCode');
    if (disasterCodeSelect) {
        try {
            disasterDataMap = await speakerControll.populateDisasterCode(disasterCodeSelect);
        } catch (err) {
            console.error('재난코드 로드 실패', err);
        }
    }

    // 초기 스피커 리스트 조회
    await loadSpeakerList();

    // 모달 열기 전 필드 초기화
    const speakerModalEl = document.getElementById('speaker_save_modal');
    speakerModalEl.addEventListener('show.bs.modal', () => {
        clearModalFields();
    });

    // 버튼 이벤트 바인딩
    document.getElementById('alert_btn').addEventListener('click', actionAlert);
    document.getElementById('bgm_on_btn').addEventListener('click', () => actionBgm(true));
    document.getElementById('bgm_off_btn').addEventListener('click', () => actionBgm(false));
    document.getElementById('saveButton').addEventListener('click', actionSave);
    document.getElementById('deleteButton').addEventListener('click', actionDelete);
    document.getElementById('new-btn').addEventListener('click', clearModalFields);
    document.getElementById('excel-btn').addEventListener('click', exportTableToExcel);

    // 스피커 리스트 로드
    async function loadSpeakerList() {
        try {
            const res = await util.postJsonData('/equipment02/api/readSpeakerInfo', {});
            const tbody = document.getElementById('speaker-table-body');
            tbody.replaceChildren('');
            res.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="form-check-input"></td>
                    <td>${item.speakerName||''}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="d-none">${item.locationCode||''}</td>
                    <td class="d-none">${item.speakerKey||''}</td>
                    <td class="d-none">${item.speakerId||''}</td>
                `;
                tr.children[2].replaceWith(createStatusCell(item.connectStatus, 'connect'));
                tr.children[3].replaceWith(createStatusCell(item.speakerStatus, 'speaker'));
                tr.children[4].innerText = item.speakerAdr||'';
                tr.children[5].innerText = item.speakerLatitude||'';
                tr.children[6].innerText = item.speakerLongitude||'';
                tr.addEventListener('click', ev => {
                    if (ev.target.tagName !== 'INPUT') {
                        populateModalFields(item);
                        let modal = bootstrap.Modal.getInstance(speakerModalEl);
                        if (!modal) modal = new bootstrap.Modal(speakerModalEl);
                        modal.show();
                    }
                });
                tbody.append(tr);
            });
            updateBgmButtons();
        } catch (err) {
            console.error('스피커 리스트 로드 오류', err);
        }
    }

    function createStatusCell(code, type) {
        const td = document.createElement('td');
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-sm');
        const map = type === 'connect'
            ? {0:['정상','btn-success'],1:['이상','btn-danger']}
            : {0:['무응답','btn-secondary'],1:['정상','btn-success'],2:['미울림','btn-warning'],3:['발령종료','btn-info'],4:['BGM Play','btn-primary'],5:['BGM Stop','btn-danger']};
        const [text, cls] = map[code] || ['알 수 없음','btn-dark'];
        btn.innerText = text;
        btn.classList.add(cls);
        td.append(btn);
        return td;
    }

    function getSelectedSpeakerIds() {
        return [...document.querySelectorAll('#speaker-table-body input[type="checkbox"]:checked')]
            .map(cb => cb.closest('tr').querySelector('td.d-none:last-child').textContent);
    }

    async function actionAlert() {
        const ids = getSelectedSpeakerIds();
        if (!ids.length) return alert('스피커를 하나 이상 선택하세요.');
        const arg = {
            alertMode: +document.getElementById('alertMode').value,
            resultMedia: 1,
            disasterCode: document.getElementById('DisasterCode').value,
            alertKind: +document.getElementById('alertKind').value,
            alertRange: +document.getElementById('alertRange').value,
            alertPriority: +document.getElementById('alertPriority').value,
            ttsMessage: document.getElementById('TTSMessage').value
        };
        for (const id of ids) {
            try {
                await speakerControll.sendAlert(id, '41', arg, disasterDataMap);
            } catch (e) {
                console.error(`${id} 경보 전송 실패`, e);
            }
        }
        await loadSpeakerList();
    }

    async function actionBgm(on) {
        const ids = getSelectedSpeakerIds();
        if (!ids.length) return alert('스피커를 하나 이상 선택하세요.');
        const argVal = on ? '0701' : '0700';
        for (const id of ids) {
            try {
                await util.postJsonData('/equipment02/api/sendSpeak', { id, commandCode: '47', argument: argVal, speakerKey: '1' });
            } catch (e) {
                console.error(`${id} BGM 명령 실패`, e);
            }
        }
        await loadSpeakerList();
    }

    function populateModalFields(item) {
        document.getElementById('locationCode').value = item.locationCode || '';
        document.getElementById('locationName').value = item.locationName || '';
        document.getElementById('speakerKey').value = item.speakerKey || '';
        document.getElementById('speakerName').value = item.speakerName || '';
        document.getElementById('speakerId').value = item.speakerId || '';
        document.getElementById('speakerAdr').value = item.speakerAdr || '';
        document.getElementById('speakerLatitude').value = item.speakerLatitude || '';
        document.getElementById('speakerLongitude').value = item.speakerLongitude || '';
        document.getElementById('description').value = item.description || '';
        document.getElementById('speakerModalTitle').innerText = '스피커 수정/삭제';
        document.getElementById('saveButton').classList.remove('d-none');
        document.getElementById('deleteButton').classList.remove('d-none');
    }

    function clearModalFields() {
        const inputs = speakerModalEl.querySelectorAll('input, select');
        inputs.forEach(el => {
            if (el.type === 'checkbox') el.checked = false;
            else el.value = '';
        });
        document.getElementById('speakerModalTitle').innerText = '스피커 신규추가';
        document.getElementById('deleteButton').classList.add('d-none');
        document.getElementById('saveButton').classList.remove('d-none');
    }

    async function actionSave() {
        const data = {
            locationCode: document.getElementById('locationCode').value,
            speakerCode: document.getElementById('speakerKey').value,
            name: document.getElementById('speakerName').value,
            id: document.getElementById('speakerId').value,
            url: document.getElementById('speakerAdr').value,
            latitude: document.getElementById('speakerLatitude').value,
            longitude: document.getElementById('speakerLongitude').value,
            description: document.getElementById('description').value
        };
        if (!data.locationCode) {
            return Swal.fire({ icon: 'error', title: '필수값 누락', text: '지역코드는 필수입니다.' });
        }
        await util.postJsonData('/equipment02/api/saveSpeakerInfo', data);
        bootstrap.Modal.getInstance(speakerModalEl).hide();
        await loadSpeakerList();
    }

    async function actionDelete() {
        const data = {
            locationCode: document.getElementById('locationCode').value,
            speakerCode: document.getElementById('speakerKey').value
        };
        await util.postJsonData('/equipment02/api/deleteSpeakerInfo', data);
        bootstrap.Modal.getInstance(speakerModalEl).hide();
        await loadSpeakerList();
    }

    function exportTableToExcel() {
        const table = document.querySelector('.card-body table');
        const wb = XLSX.utils.table_to_book(table);
        XLSX.writeFile(wb, '카메라 정보 목록.xlsx');
    }

    function updateBgmButtons() {
        const has = getSelectedSpeakerIds().length > 0;
        document.getElementById('bgm_on_btn').disabled = !has;
        document.getElementById('bgm_off_btn').disabled = !has;
    }

    // 체크박스 변경 시 BGM 버튼 상태 갱신
    document.getElementById('speaker-table-body').addEventListener('change', e => {
        if (e.target.type === 'checkbox') updateBgmButtons();
    });
});
