/**
 * Equipment Manage - Pane Switch + Sidebar (mobile) + Collapse (desktop)
 * Targets:
 *  - Sidebar buttons: .eq-nav-item[data-target]
 *  - Tab buttons:     .eq-tab-item[data-target]
 *  - Panes:           .eq-pane#<id>
 *  - Mobile sidebar toggle: #eqSidebarToggle
 *  - Overlay:              #eqOverlay
 *  - Sidebar collapse:     #eqSidebarCollapse (optional)
 */

(function () {
    const SELECTORS = {
        pane: ".eq-pane",
        sidebarBtn: ".eq-nav-item",
        tabBtn: ".eq-tab-item",
        overlay: "#eqOverlay",
        sidebar: "#eqSidebar",
        sidebarToggle: "#eqSidebarToggle",
        sidebarCollapse: "#eqSidebarCollapse",
    };

    function qs(sel, root = document) {
        return root.querySelector(sel);
    }
    function qsa(sel, root = document) {
        return Array.from(root.querySelectorAll(sel));
    }

    function setAriaSelected(btns, activeTargetId) {
        btns.forEach((b) => {
            const isActive = b?.dataset?.target === activeTargetId;
            b.classList.toggle("is-active", isActive);
            b.setAttribute("aria-selected", isActive ? "true" : "false");
        });
    }

    function activatePane(targetId, { closeMobileSidebar = true, pushState = false } = {}) {
        if (!targetId) return;

        // 1) pane show/hide
        const panes = qsa(SELECTORS.pane);
        panes.forEach((p) => p.classList.remove("is-active"));

        const pane = document.getElementById(targetId);
        if (pane) pane.classList.add("is-active");

        // 2) nav active sync (sidebar + tabs)
        setAriaSelected(qsa(SELECTORS.sidebarBtn), targetId);
        setAriaSelected(qsa(SELECTORS.tabBtn), targetId);

        // 3) optional URL param sync
        if (pushState) {
            try {
                const url = new URL(window.location.href);
                url.searchParams.set("view", viewFromTargetId(targetId));
                window.history.replaceState({}, "", url.toString());
            } catch (_) { }
        }

        // 4) close mobile sidebar if opened
        if (closeMobileSidebar) closeSidebar();
    }

    function viewFromTargetId(targetId) {
        // id -> view mapping (원하면 너 naming에 맞춰 수정)
        if (targetId.includes("speaker")) return "speaker";
        if (targetId.includes("broadcast")) return "broadcast";
        if (targetId.includes("cctv")) return "cctv";
        return "speaker";
    }

    function targetIdFromView(view) {
        switch ((view || "").toLowerCase()) {
            case "broadcast":
                return "equipment-broadcast-pane";
            case "cctv":
                return "equipment-cctv-pane";
            case "speaker":
            default:
                return "equipment-speaker-pane";
        }
    }

    function openSidebar() {
        const sidebar = qs(SELECTORS.sidebar);
        const overlay = qs(SELECTORS.overlay);
        if (sidebar) sidebar.classList.add("is-open");
        if (overlay) overlay.classList.add("is-active");
        document.body.classList.add("eq-no-scroll");
    }

    function closeSidebar() {
        const sidebar = qs(SELECTORS.sidebar);
        const overlay = qs(SELECTORS.overlay);
        if (sidebar) sidebar.classList.remove("is-open");
        if (overlay) overlay.classList.remove("is-active");
        document.body.classList.remove("eq-no-scroll");
    }

    function toggleSidebar() {
        const sidebar = qs(SELECTORS.sidebar);
        if (!sidebar) return;
        const isOpen = sidebar.classList.contains("is-open");
        if (isOpen) closeSidebar();
        else openSidebar();
    }

    function toggleSidebarCollapsed() {
        // desktop collapse: .page-equipment or .eq-layout에 상태 클래스 주는 방식이 일반적
        // CSS에서 .is-collapsed 처리하고 싶으면 아래 클래스만 맞춰주면 됨.
        const root = qs(".page-equipment");
        if (!root) return;
        root.classList.toggle("is-sidebar-collapsed");
    } eq - topbar

    function getInitialTargetId() {
        // 1) URL ?view=...
        const url = new URL(window.location.href);
        const view = url.searchParams.get("view");
        if (view) return targetIdFromView(view);

        // 2) already marked active in sidebar/tabs
        const activeSidebar = qs(`${SELECTORS.sidebarBtn}.is-active`);
        if (activeSidebar?.dataset?.target) return activeSidebar.dataset.target;

        const activeTab = qs(`${SELECTORS.tabBtn}.is-active`);
        if (activeTab?.dataset?.target) return activeTab.dataset.target;

        // 3) first sidebar button
        const firstSidebar = qs(SELECTORS.sidebarBtn);
        if (firstSidebar?.dataset?.target) return firstSidebar.dataset.target;

        // 4) first tab button
        const firstTab = qs(SELECTORS.tabBtn);
        if (firstTab?.dataset?.target) return firstTab.dataset.target;

        return "equipment-speaker-pane";
    }

    // DOM Ready
    document.addEventListener("DOMContentLoaded", () => {
        // 초기 pane 활성화 (기존 코드처럼 전체 is-active 제거 후 첫번째로 보정)
        const initialTargetId = getInitialTargetId();
        activatePane(initialTargetId, { closeMobileSidebar: false, pushState: false });

        // 모바일 sidebar 토글 버튼
        const toggleBtn = qs(SELECTORS.sidebarToggle);
        if (toggleBtn) {
            toggleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                toggleSidebar();
            });
        }

        // overlay 클릭 시 닫기
        const overlay = qs(SELECTORS.overlay);
        if (overlay) {
            overlay.addEventListener("click", () => closeSidebar());
        }

        // ESC 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeSidebar();
        });

        // (선택) desktop collapse 토글
        const collapseBtn = qs(SELECTORS.sidebarCollapse);
        if (collapseBtn) {
            const handler = (e) => {
                e.preventDefault();
                toggleSidebarCollapsed();
            };
            collapseBtn.addEventListener("click", handler);
            collapseBtn.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") handler(e);
            });
        }
    });

    // 클릭 전환: event delegation (sidebar + tabs)
    document.addEventListener("click", (e) => {
        const sidebarBtn = e.target.closest(SELECTORS.sidebarBtn);
        if (sidebarBtn) {
            const targetId = sidebarBtn.dataset.target;
            if (targetId) activatePane(targetId, { closeMobileSidebar: true, pushState: true });
            return;
        }

        const tabBtn = e.target.closest(SELECTORS.tabBtn);
        if (tabBtn) {
            const targetId = tabBtn.dataset.target;
            if (targetId) activatePane(targetId, { closeMobileSidebar: false, pushState: true });
            return;
        }
    });
})();
