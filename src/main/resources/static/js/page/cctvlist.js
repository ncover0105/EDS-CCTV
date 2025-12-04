document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("cctvTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        const checkbox = row.querySelector("input.cctv-checkbox");

        // 체크박스가 없는 경우(SERVER EMPTY ROW) 무시
        if (!checkbox) return;

        // 체크박스를 직접 클릭한 경우 → row click 동작 중복 방지
        if (event.target === checkbox) {
            row.classList.toggle("table-active", checkbox.checked);
            return;
        }

        // 행 클릭 → 체크박스 토글
        checkbox.checked = !checkbox.checked;

        // 행 강조 표시
        row.classList.toggle("table-active", checkbox.checked);
    });
});

function settingInsert() {
    const modalEl = document.getElementById('addCctvModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// 모달에서 폼 제출
function submitAddCctv() {
    const code = document.getElementById('cctvCode').value.trim();
    const name = document.getElementById('cctvName').value.trim();
    const url = document.getElementById('cctvUrl').value.trim();
    const lat = parseFloat(document.getElementById('cctvLat').value) || null;
    const lng = parseFloat(document.getElementById('cctvLng').value) || null;

    if (!code || !name) {
        alert("CCTV 코드와 이름은 필수입니다.");
        return;
    }

    const newCctv = { code, name, url, latitude: lat, longitude: lng };

    fetch('/api/cctv/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCctv)
    })
    .then(res => res.json())
    .then(data => {
        // 성공 시 모달 닫기
        const modalEl = document.getElementById('addCctvModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // 테이블 갱신
        loadCctvList(); // 서버에서 CCTV 목록 다시 가져오기
    })
    .catch(err => {
        console.error(err);
        alert("CCTV 추가 중 오류가 발생했습니다.");
    });
}

// 예시: CCTV 목록 다시 렌더링
function loadCctvList() {
    fetch('/api/cctv/list')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('cctvTableBody');
            tbody.innerHTML = '';
            data.forEach((cctv, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx+1}</td>
                    <td>${cctv.name}</td>
                    <td>${cctv.url || '-'}</td>
                    <td>${cctv.statusCam === '1' ? '<span class="status-badge status-success">정상</span>' : cctv.statusCam === '0' ? '<span class="status-badge status-error">신호없음</span>' : '-'}</td>
                    <td>${cctv.latitude || '-'}</td>
                    <td>${cctv.longitude || '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm">수정</button>
                        <button class="btn btn-danger btn-sm">삭제</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function getSelectedCctvs() {
    const selected = [];
    document.querySelectorAll('.cctv-checkbox:checked').forEach(cb => {
        selected.push(cb.value);
    });
    console.log('선택된 CCTV 코드:', selected);
    return selected;
}