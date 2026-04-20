// /js/page/situation/situation_view.js
// - 상황발생이력: 현재 입력된 시간/구역 값으로 검색
(function () {
  'use strict';

  const pageSize = 1000; // 페이지네이션 제거로 인해 한 번에 많이 가져오도록 수정
  let currentPage = 1;
  let totalCount = 0;

  // ====== datetime-local 표시용 기본값(오늘) ======
  function pad2(n) { return String(n).padStart(2, '0'); }

  function setTodayRangeInputsIfEmpty() {
    const startEl = document.getElementById('startDateTime');
    const endEl = document.getElementById('endDateTime');
    if (!startEl || !endEl) return;

    // 이미 값이 있으면 건드리지 않음
    if ((startEl.value && startEl.value.trim()) || (endEl.value && endEl.value.trim())) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());

    startEl.value = `${y}-${m}-${d}T00:00`;
    endEl.value = `${y}-${m}-${d}T23:59`;
  }

  // ====== 공백/미선택이면 null ======
  function getTrimValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const raw = el.value;
    if (raw == null) return null;
    const t = String(raw).trim();
    return t.length ? t : null;
  }

  // ====== 필터 읽기: "현재 입력된 값" 그대로 사용 ======
  function getFilters() {
    const startRaw = getTrimValue('startDateTime'); // "YYYY-MM-DDTHH:mm"
    const endRaw = getTrimValue('endDateTime');
    const boundaryNum = getTrimValue('boundaryFilter'); // ""이면 null

    // parseInputDateTime / toLocalDateTimeParam 은 situation_common.js의 유틸 사용 가정
    const startDt = startRaw ? window.SituationCommon.parseInputDateTime(startRaw) : null;
    const endDt = endRaw ? window.SituationCommon.parseInputDateTime(endRaw) : null;

    // 둘 다 비면 날짜조건 제외
    if (!startDt && !endDt) {
      return { from: '', to: '', boundaryNum: boundaryNum || '' };
    }

    let fromDt = startDt;
    let toDt = endDt;

    // 시작만 있으면 종료 자동 보정(시작 + 1일)
    if (fromDt && !toDt) {
      toDt = new Date(fromDt.getTime() + 24 * 60 * 60 * 1000);
    }

    // 종료만 있으면 시작 자동 보정(종료 - 1일)
    if (!fromDt && toDt) {
      fromDt = new Date(toDt.getTime() - 24 * 60 * 60 * 1000);
    }

    // from > to면 스왑
    if (fromDt && toDt && fromDt.getTime() > toDt.getTime()) {
      const tmp = fromDt; fromDt = toDt; toDt = tmp;
    }

    // from == to면 to를 +1분 보정
    if (fromDt && toDt && fromDt.getTime() === toDt.getTime()) {
      toDt = new Date(toDt.getTime() + 60 * 1000);
    }

    const from = fromDt ? window.SituationCommon.toLocalDateTimeParam(fromDt) : '';
    const to = toDt ? window.SituationCommon.toLocalDateTimeParam(toDt) : '';

    return { from, to, boundaryNum: boundaryNum || '' };
  }

  // ====== API 호출 ======
  async function fetchEmergencyList(page) {
    const f = getFilters();

    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });

    // 선택(입력)된 항목만 전송 (미선택은 제외)
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);
    if (f.boundaryNum) params.set('boundaryNum', f.boundaryNum);

    const url = `/menu/situation/emergency/search?${params.toString()}`;
    console.log('[situation_view] fetch url =', url);

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  }

  function getCctvDisplayName(item) {
    const directName = item?.cctvName ?? item?.name ?? item?.cameraName ?? item?.cctvNm;
    if (directName != null && String(directName).trim()) {
      return String(directName).trim();
    }

    const code = item?.cctvCode;
    if (code != null && typeof window.getCameraNameByCode === 'function') {
      const mapped = window.getCameraNameByCode(code);
      if (mapped != null && String(mapped).trim()) {
        return String(mapped).trim();
      }
    }

    return String(code ?? '-');
  }

  function getAlertMeta(alertCode) {
    const code = String(alertCode ?? '').trim();
    const mapping = {
      '001': { label: 'CCTV 연결', className: 'status-info' },
      '002': { label: 'CCTV 연결 끊김', className: 'status-warning' },
      '003': { label: '출입알림', className: 'status-error' },
    };

    return mapping[code] ?? {
      label: code || '알 수 없음',
      className: 'status-info',
    };
  }

  function getBoundaryMeta(boundaryNum) {
    const zone = Number(boundaryNum);
    const mapping = {
      1: { label: '1번 구역', className: 'status-zone-1' },
      2: { label: '2번 구역', className: 'status-zone-2' },
      3: { label: '3번 구역', className: 'status-zone-3' },
      4: { label: '4번 구역', className: 'status-zone-4' },
    };

    return mapping[zone] ?? {
      label: '-',
      className: 'status-info',
    };
  }

  // ====== 테이블 렌더 ======
  function renderRows(items, page) {
    const tbody = document.getElementById('situationList');
    const timeline = document.getElementById('situationTimeline');
    if (!tbody || !timeline) return;

    const cols = 5;
    const list = Array.isArray(items) ? items : [];

    if (list.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="${cols}" class="text-center text-white-50 py-5">
            조회된 상황 발생 이력이 없습니다.
          </td>
        </tr>
      `;
      tbody.innerHTML = emptyHtml;
      timeline.innerHTML = `
        <div class="situation-timeline-empty">
          조회된 상황 발생 이력이 없습니다.
        </div>
      `;
      return;
    }

    const rows = list.map((it) => {
      const cctvName = window.SituationCommon.escapeHtml(getCctvDisplayName(it));
      const alertMeta = getAlertMeta(it.alertCode);
      const alertLabel = window.SituationCommon.escapeHtml(alertMeta.label);
      const alertClassName = window.SituationCommon.escapeHtml(alertMeta.className);
      const boundaryMeta = getBoundaryMeta(it.boundaryNum);
      const boundaryText = window.SituationCommon.escapeHtml(boundaryMeta.label);
      const boundaryClassName = window.SituationCommon.escapeHtml(boundaryMeta.className);
      const log = window.SituationCommon.escapeHtml(it.log ?? '-');
      const inpDttm = window.SituationCommon.escapeHtml(it.inpDttm ?? '-');

      return `
        <tr>
          <td class="situation-col-time">${inpDttm}</td>
          <td><span class="status-badge ${alertClassName}">${alertLabel}</span></td>
          <td class="text-center"><span class="status-badge ${boundaryClassName}">${boundaryText}</span></td>
          <td class="situation-col-cctv" title="${cctvName}">${cctvName}</td>
          <td class="situation-col-log" title="${log}">${log}</td>
        </tr>
      `;
    }).join('');

    const timelineItems = list.map((it) => {
      const cctvName = window.SituationCommon.escapeHtml(getCctvDisplayName(it));
      const alertMeta = getAlertMeta(it.alertCode);
      const alertLabel = window.SituationCommon.escapeHtml(alertMeta.label);
      const alertClassName = window.SituationCommon.escapeHtml(alertMeta.className);
      const boundaryMeta = getBoundaryMeta(it.boundaryNum);
      const boundaryText = window.SituationCommon.escapeHtml(boundaryMeta.label);
      const boundaryClassName = window.SituationCommon.escapeHtml(boundaryMeta.className);
      const log = window.SituationCommon.escapeHtml(it.log ?? '-');
      const inpDttm = window.SituationCommon.escapeHtml(it.inpDttm ?? '-');

      return `
        <article class="situation-timeline-item">
          <div class="situation-timeline-dot"></div>
          <div class="situation-timeline-content">
            <div class="situation-timeline-top">
              <time class="situation-timeline-time">${inpDttm}</time>
            </div>
            <div class="situation-timeline-meta">
              <span class="status-badge ${alertClassName}">${alertLabel}</span>
              <span class="status-badge ${boundaryClassName}">${boundaryText}</span>
            </div>
            <div class="situation-timeline-cctv">${cctvName}</div>
            <p class="situation-timeline-log">${log}</p>
          </div>
        </article>
      `;
    }).join('');

    tbody.innerHTML = rows;
    timeline.innerHTML = timelineItems;
  }

  function renderCount() {
    const countEl = document.getElementById('situationCount');
    if (!countEl) return;

    const f = getFilters();
    const boundaryLabel = f.boundaryNum ? `${f.boundaryNum}번 구역` : '전체 구역';
    const dateLabel = (f.from || f.to) ? '조건검색' : '전체기간';

    countEl.innerText = `${dateLabel} / ${boundaryLabel} / 총 ${totalCount}건 | 상황 발생 이력을 관리하세요`;
  }

  function renderPagination() {
    // 페이지네이션 부분 임시 주석 처리
    /*
    window.SituationCommon.safeRenderPagination(
      'situationPagination',
      currentPage,
      totalCount,
      pageSize,
      (newPage) => {
        currentPage = newPage;
        loadPage().catch(console.error);
      }
    );
    */
  }

  async function loadPage() {
    try {
      const data = await fetchEmergencyList(currentPage);
      totalCount = data.totalCount ?? 0;

      renderRows(data.items ?? [], currentPage);
      renderCount();
      renderPagination();
    } catch (e) {
      console.error('[situation_view] loadPage failed:', e);
      totalCount = 0;

      renderRows([], currentPage);
      renderCount();
      renderPagination();
    }
  }

  // ====== 검색 버튼(onclick="situationSearch()") ======
  window.situationSearch = function () {
    currentPage = 1;
    loadPage().catch(console.error);
  };

  // ====================================================================
  // 통계 그래프
  // ====================================================================
  const CHART_COLORS = {
    blue: 'rgba(59,130,246,0.85)',
    green: 'rgba(34,197,94,0.85)',
    amber: 'rgba(245,158,11,0.85)',
    red: 'rgba(239,68,68,0.85)',
    pink: 'rgba(236,72,153,0.88)',
    cyan: 'rgba(6,182,212,0.85)',
  };
  const CHART_GRID = 'rgba(255,255,255,0.06)';
  const CHART_TICK = 'rgba(232,236,244,0.45)';

  const chartCommonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a2130',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        titleColor: '#e8ecf4',
        bodyColor: 'rgba(232,236,244,0.75)',
        padding: 10,
      },
    },
  };

  const axisStyle = {
    grid: { color: CHART_GRID },
    ticks: { color: CHART_TICK, font: { size: 11 } },
    border: { color: 'rgba(255,255,255,0.08)' },
  };

  let chartInstances = {};
  let statsPeriod = 'weekly';
  let statsCctvCode = '';

  function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
  }

  function destroyAllCharts() {
    Object.keys(chartInstances).forEach(destroyChart);
  }

  function isStatsCollapsed() {
    return document.getElementById('sitStatsBody')?.classList.contains('is-collapsed') ?? false;
  }

  let latestStatsData = {
    daily: [],
    trend: [],
    byZone: [],
  };

  function renderDailyChart(daily) {
    destroyChart('dailyChart');
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    chartInstances['dailyChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: daily.map(d => d.date),
        datasets: [{
          label: '발생 건수',
          data: daily.map(d => d.count),
          backgroundColor: CHART_COLORS.blue,
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        ...chartCommonOptions,
        scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, stepSize: 1 } } },
      },
    });
  }

  function renderTrendChart(trend, isMonthly) {
    destroyChart('trendChart');
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    chartInstances['trendChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.map(d => d.label),
        datasets: [{
          label: isMonthly ? '월별 발생' : '주별 발생',
          data: trend.map(d => d.count),
          borderColor: 'rgba(6,182,212,1)',
          backgroundColor: 'rgba(6,182,212,0.12)',
          pointBackgroundColor: 'rgba(6,182,212,1)',
          pointBorderColor: '#0d1117',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
        }],
      },
      options: {
        ...chartCommonOptions,
        scales: { x: axisStyle, y: { ...axisStyle, beginAtZero: true, ticks: { ...axisStyle.ticks, stepSize: 1 } } },
      },
    });
  }

  function renderZoneChart(byZone) {
    destroyChart('zoneChart');
    const ctx = document.getElementById('zoneChart');
    if (!ctx) return;

    // 중앙 텍스트 플러그인 (총 발생 건수 표시)
    const centerTextPlugin = {
      id: 'zoneCenterText',
      afterDraw(chart) {
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;
        const total = chart.data.datasets[0].data.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold 22px "Pretendard", "Noto Sans KR", sans-serif';
        c.fillStyle = '#e8ecf4';
        c.fillText(total > 0 ? total : '-', cx, cy - 9);
        c.font = '11px "Pretendard", "Noto Sans KR", sans-serif';
        c.fillStyle = 'rgba(232,236,244,0.45)';
        c.fillText('총 발생', cx, cy + 11);
        c.restore();
      },
    };

    // 구역 번호 → 고정 색상 (1:파랑, 2:초록, 3:빨강, 4:핑크)
    const ZONE_COLOR_MAP = {
      1: 'rgba(99,179,237,0.92)',
      2: 'rgba(72,187,120,0.92)',
      3: 'rgba(239,68,68,0.92)',
      4: 'rgba(236,72,153,0.90)',
    };
    const ZONE_COLOR_DEFAULT = 'rgba(255,255,255,0.25)';
    function zoneColor(label) {
      const m = label.match(/^(\d+)번 구역$/);
      return m ? (ZONE_COLOR_MAP[parseInt(m[1], 10)] || ZONE_COLOR_DEFAULT) : ZONE_COLOR_DEFAULT;
    }

    const hasData = byZone && byZone.some(z => z.count > 0);
    if (!hasData) {
      chartInstances['zoneChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['데이터 없음'],
          datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.06)'], borderWidth: 0, hoverBackgroundColor: ['rgba(255,255,255,0.06)'] }],
        },
        options: {
          ...chartCommonOptions,
          plugins: {
            ...chartCommonOptions.plugins,
            legend: { display: false },
            tooltip: { enabled: false },
          },
          cutout: '68%',
        },
        plugins: [centerTextPlugin],
      });
      return;
    }

    const total = byZone.reduce((s, z) => s + z.count, 0);
    chartInstances['zoneChart'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: byZone.map(z => z.label),
        datasets: [{
          data: byZone.map(z => z.count),
          backgroundColor: byZone.map(z => zoneColor(z.label)),
          borderColor: 'rgba(13,17,23,0.9)',
          borderWidth: 3,
          hoverOffset: 10,
          hoverBorderWidth: 0,
        }],
      },
      options: {
        ...chartCommonOptions,
        cutout: '68%',
        plugins: {
          ...chartCommonOptions.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: CHART_TICK,
              font: { size: 11 },
              padding: 14,
              usePointStyle: false,
              useBorderRadius: true,
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 999,
              generateLabels(chart) {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}  ${data.datasets[0].data[i]}건`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
          tooltip: {
            ...chartCommonOptions.plugins.tooltip,
            callbacks: {
              label(context) {
                const val = context.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return `  ${context.label}: ${val}건 (${pct}%)`;
              },
            },
          },
        },
      },
      plugins: [centerTextPlugin],
    });
  }

  function updateCctvOptions(byCctv) {
    const menu = document.getElementById('statsCctvFilterMenu');
    const button = document.getElementById('statsCctvFilterButton');
    const label = document.getElementById('statsCctvFilterLabel');
    if (!menu || !button || !label) return;

    const current = statsCctvCode || '';
    const items = [{ cctvCode: '', cctvName: '전체 카메라', count: null }, ...(byCctv || [])];
    menu.innerHTML = items.map((c) => {
      const code = c.cctvCode || '';
      const itemLabel = code ? `${c.cctvName} (${c.count}건)` : c.cctvName;
      const selected = code === current ? ' selected' : '';
      return `<div class="dropdown-item${selected}" data-cctv-code="${window.SituationCommon.escapeHtml(code)}"><span>${window.SituationCommon.escapeHtml(itemLabel)}</span></div>`;
    }).join('');

    const selected = items.find((c) => (c.cctvCode || '') === current);
    label.textContent = selected
      ? (selected.cctvCode ? `${selected.cctvName} (${selected.count}건)` : selected.cctvName)
      : '전체 카메라';
  }

  function updateLabels(isMonthly) {
    const dailyLbl = document.getElementById('statsDailyLabel');
    const trendLbl = document.getElementById('statsTrendLabel');
    if (dailyLbl) dailyLbl.textContent = isMonthly ? '일자별 발생 건수 (최근 30일)' : '일자별 발생 건수 (최근 7일)';
    if (trendLbl) trendLbl.textContent = isMonthly ? '월간 추이 (최근 12개월)' : '주간 추이 (최근 8주)';
  }

  function resizeStatsCharts() {
    Object.values(chartInstances).forEach((chart) => {
      if (chart) chart.resize();
    });
  }

  function renderStatsCharts() {
    const isMonthly = statsPeriod === 'monthly';
    updateLabels(isMonthly);
    renderDailyChart(latestStatsData.daily || []);
    renderTrendChart(latestStatsData.trend || [], isMonthly);
    renderZoneChart(latestStatsData.byZone || []);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resizeStatsCharts();
      });
    });
  }

  async function loadStats() {
    try {
      const params = new URLSearchParams({ period: statsPeriod });
      if (statsCctvCode) params.set('cctvCode', statsCctvCode);
      const res = await fetch(`/menu/situation/emergency/stats?${params}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Stats API error: ${res.status}`);
      const data = await res.json();

      latestStatsData = {
        daily: data.daily || [],
        trend: data.trend || [],
        byZone: data.byZone || [],
      };
      updateCctvOptions(data.byCctv || []);

      if (isStatsCollapsed()) {
        destroyAllCharts();
        updateLabels(statsPeriod === 'monthly');
        return;
      }

      renderStatsCharts();
    } catch (e) {
      console.error('[situation_view] loadStats failed:', e);
    }
  }

  function initStatsControls() {
    // 주간/월간 토글
    const toggle = document.getElementById('statsPeriodToggle');
    if (toggle) {
      toggle.addEventListener('click', e => {
        const btn = e.target.closest('button[data-period]');
        if (!btn) return;
        toggle.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        statsPeriod = btn.dataset.period;
        loadStats().catch(console.error);
      });
    }

    // 카메라 선택
    const cctvDropdown = document.getElementById('statsCctvFilter');
    const cctvButton = document.getElementById('statsCctvFilterButton');
    const cctvMenu = document.getElementById('statsCctvFilterMenu');
    if (cctvDropdown && cctvButton && cctvMenu) {
      const closeDropdown = () => {
        cctvButton.classList.remove('active');
        cctvButton.setAttribute('aria-expanded', 'false');
        cctvMenu.classList.remove('show');
      };

      cctvButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = cctvMenu.classList.contains('show');
        closeDropdown();
        if (!isOpen) {
          cctvButton.classList.add('active');
          cctvButton.setAttribute('aria-expanded', 'true');
          cctvMenu.classList.add('show');
        }
      });

      cctvMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item[data-cctv-code]');
        if (!item) return;
        statsCctvCode = item.dataset.cctvCode || '';
        closeDropdown();
        loadStats().catch(console.error);
      });

      document.addEventListener('click', (e) => {
        if (!cctvDropdown.contains(e.target)) {
          closeDropdown();
        }
      });
    }

    // 접기/펼치기
    const collapseBtn = document.getElementById('statsCollapseBtn');
    const statsBody = document.getElementById('sitStatsBody');
    if (collapseBtn && statsBody) {
      collapseBtn.addEventListener('click', () => {
        const collapsed = statsBody.classList.toggle('is-collapsed');
        collapseBtn.querySelector('i').className = collapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up';
        if (collapsed) {
          destroyAllCharts();
          return;
        }
        renderStatsCharts();
      });
    }

    window.addEventListener('resize', () => {
      if (!isStatsCollapsed()) {
        resizeStatsCharts();
      }
    });
  }

  // ====== 최초 로딩 ======
  document.addEventListener('DOMContentLoaded', () => {
    if (window.currentView && window.currentView !== 'situation') return;

    // 입력값이 비어있으면 오늘 기본값 세팅(원치 않으면 이 줄을 제거)
    setTodayRangeInputsIfEmpty();

    // ✅ 최초 로딩도 "현재 입력된 값"으로 조회
    loadPage().catch(console.error);

    // 통계 그래프
    initStatsControls();
    loadStats().catch(console.error);
  });

})();
