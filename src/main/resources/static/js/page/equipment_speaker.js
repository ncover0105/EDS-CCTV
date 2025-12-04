/* ================================
 * equipment_speaker.js (수정완료)
 * 스피커 테이블, 상세정보, 조작
 * ================================ */

/* ------------------------------
    스피커 목록 테이블 렌더링
------------------------------ */
function renderSpeakerTable() {
    const tbody = document.getElementById('speakerTableBody');
    tbody.innerHTML = '';

    speakerList.forEach(item => {
        const row = document.createElement('tr');

        const statusBadgeClass = item.connStat === '01' ? 'status-success' : 'status-error';
        const statusBadgeText = item.connStat === '01'
            ? `<i class="bi bi-check-circle-fill me-1"></i>연결`
            : `<i class="bi bi-exclamation-triangle-fill me-1"></i>이상`;

        const badgeClass = item.useInfo === 1 ? 'status-success' : 'status-primary';
        const badgeText = item.useInfo === 1 ? '사용' : '미사용';

        row.innerHTML = `
            <td>
                <input type="checkbox"
                    name="selectedIds"
                    value="${App.utils.safeValue(item.speakerCode)}"
                    data-location="${item.locationCode}"
                    data-name="${item.speakerName}"
                    data-adr="${item.speakerAdr}">
            </td>
            <td>${App.utils.safeValue(item.id)}</td>
            <td>${App.utils.safeValue(item.speakerName)}</td>
            <td><span class="status-badge ${statusBadgeClass} bg-transparent">${statusBadgeText}</span></td>
            <td>${App.utils.safeValue(item.recvTime)}</td>
            <td>${App.utils.safeValue(item.phone)}</td>
            <td>${App.utils.safeValue(item.speakerAdr)}</td>
            <td>${App.utils.safeValue(item.lat)}</td>
            <td>${App.utils.safeValue(item.lng)}</td>
            <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        `;

        row.addEventListener('click', event => {
            const checkbox = row.querySelector('input[type="checkbox"]');

            // 체크박스 클릭이면 다른 선택 해제만 처리
            if (event.target.type === 'checkbox') {
                document.querySelectorAll('input[name="selectedIds"]').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
                return;
            }

            const isChecked = checkbox.checked;
            document.querySelectorAll('input[name="selectedIds"]').forEach(cb => cb.checked = false);
            checkbox.checked = !isChecked;

            if (!checkbox.checked) {
                resetDetail();
            }
        });

        tbody.appendChild(row);
    });

    document.getElementById('speakerCount').innerText = `총 ${speakerList.length}개`;
}

/* ------------------------------
    스피커 상세 패널 업데이트
------------------------------ */
function renderDetail(item, speakerName, speakerAdr) {
    console.log("renderDetail:", item);

    // 기본 정보
    document.getElementById('selectedSpeakerTitle').innerText =
        App.utils.safeValue(speakerName);
    document.getElementById('selectedSpeakeraddress').innerText =
        App.utils.safeValue(speakerAdr);
    
    const now = App.utils.formatDateTime();
    document.getElementById('selectedSpeakerLastUpdate').innerText = now;

    const connEl = document.getElementById('connectionStatus');
    const isOnline = item.connStat === '01';

    connEl.innerText = isOnline ? '연결' : '미연결';
    connEl.classList.remove("text-success", "text-danger");
    connEl.classList.add(isOnline ? "text-success" : "text-danger");
    connEl.classList.add("fw-semibold");

    const batteryEl = document.getElementById('batteryStatus');
    const batteryVal = parseInt(item.battery);

    batteryEl.innerText = App.utils.safeValue(item.battery, true, '%', 0);
    batteryEl.classList.remove("text-success", "text-warning", "text-danger", "text-muted");

    document.getElementById('acStatus').innerText =
        item.acStat === '1' ? 'ON' : 'OFF';

    document.getElementById('dcStatus').innerText =
        item.dcStat === '1' ? 'ON' : 'OFF';

    if (isNaN(batteryVal) || batteryVal < 0) {
        batteryEl.classList.add("text-muted");
    } else if (batteryVal <= 20) {
        batteryEl.classList.add("text-danger");
    } else if (batteryVal <= 60) {
        batteryEl.classList.add("text-warning");
    } else {
        batteryEl.classList.add("text-success");
    }

    document.getElementById('solarChargerStatus').innerText =
        item.solar === '1' ? 'ON' : 'OFF';

    document.getElementById('lteAntennaStatus').innerText =
        item.lte === '1' ? 'ON' : 'OFF';

    document.getElementById('cpuTemperature').innerText =
        App.utils.safeValue(item.cpuTemp, true, '°C', 0);

    document.getElementById('mcuVersion').innerText =
        App.utils.safeValue(item.mcuVer);

    App.utils.showGlobalAlert("스피커 정보 요청이 완료되었습니다.", "success");
}

/* ------------------------------
    스피커 정보 초기화
------------------------------ */
function resetDetail() {

    document.getElementById('selectedSpeakerTitle').innerText = '스피커를 선택하세요';
    document.getElementById('selectedSpeakeraddress').innerText = '-';
    document.getElementById('selectedSpeakerLastUpdate').innerText = '-';

    const fields = [
        'connectionStatus', 'acStatus', 'dcStatus', 'batteryStatus',
        'solarChargerStatus', 'lteAntennaStatus', 'cpuTemperature', 'mcuVersion'
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);
        el.innerText = '-';

        // 🔥 모든 색상 제거
        el.classList.remove(
            "text-success", "text-danger", "text-warning", "text-muted", "text-primary"
        );

        // 🔥 강조 제거
        el.classList.remove("fw-semibold");
    });

}



/* ------------------------------
    버튼 클릭 처리
------------------------------ */
function handleButtonClick(button, actionFn) {
    const checked = document.querySelector('input[name="selectedIds"]:checked');
    if (!checked) {
        resetDetail();
        App.utils.showGlobalAlert("스피커를 선택해주세요.", "warning");
        return;
    }
    actionFn(checked);
}

/* ------------------------------
    서버로 상태요청
------------------------------ */
function requestStatus(selectedCheckbox) {
    const speakerCode = selectedCheckbox.value;
    const locationCode = selectedCheckbox.dataset.location;
    const speakerName = selectedCheckbox.dataset.name;
    const speakerAdr = selectedCheckbox.dataset.adr;

    fetch(`/menu/speaker/detail?locationCode=${locationCode}&speakerCode=${speakerCode}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                renderDetail(data[0], speakerName, speakerAdr);
            } else {
                resetDetail();
                App.utils.showGlobalAlert("해당 스피커 상세 정보 없음.", "info");
            }
        })
        .catch(err => {
            console.error(err);
            resetDetail();
            App.utils.showGlobalAlert("스피커 정보 요청 실패", "danger");
        });
}
