// login.js (전체 새 버전)

(function () {
    // ----------------------------
    // 공용: 에러 영역 출력/숨김
    // ----------------------------
    function ensureErrorBox(formSelector, id) {
      let el = document.getElementById(id);
      if (el) return el;
  
      // 없으면 자동 생성해서 폼/컨테이너 하단에 붙임
      const form = document.querySelector(formSelector);
      if (!form) return null;
  
      el = document.createElement("div");
      el.id = id;
      el.className = "error-message";
      el.style.display = "none";
      form.appendChild(el);
      return el;
    }
  
    function showError(id, msg) {
      const el =
        document.getElementById(id) ||
        ensureErrorBox(id === "loginError" ? ".signin-form" : ".signup-form", id);
  
      if (!el) {
        alert(msg);
        return;
      }
  
      el.style.display = "block";
      el.innerHTML = `<div class="alert">${msg}</div>`;
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  
    function hideError(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "none";
      el.innerHTML = "";
    }

    // ----------------------------
    // 공용: 폼 입력/상태 초기화
    // ----------------------------
    function resetForm(formEl) {
      if (!formEl) return;

      // 1) 기본 입력 초기화
      if (typeof formEl.reset === "function") formEl.reset();

      // 2) 혹시 reset으로 안 지워지는 값(커스텀/hidden/readonly 등)이 있으면 보완
      formEl.querySelectorAll("input, textarea, select").forEach((el) => {
        const type = (el.getAttribute("type") || "").toLowerCase();

        // checkbox/radio는 reset으로 보통 처리되지만, 안전하게 보완 가능
        if (type === "checkbox" || type === "radio") {
          el.checked = false;
          return;
        }

        // file input
        if (type === "file") {
          el.value = "";
          return;
        }

        // 나머지 입력
        // (disabled는 건드릴 필요 없지만, 원하면 제외 처리 가능)
        el.value = "";
      });

      // 3) 로딩 상태 제거
      formEl.querySelectorAll(".loading").forEach((el) => el.classList.remove("loading"));
    }
  
    // ----------------------------
    // 폼 전환 (전역 필요)
    // ----------------------------
    window.toggleForms = function toggleForms() {
      const signinForm = document.querySelector(".signin-form");
      const signupForm = document.querySelector(".signup-form");
      if (!signinForm || !signupForm) return;
    
      // 전환 시 에러 숨김
      hideError("loginError");
      hideError("signupError");
    
      const isSigninActive = signinForm.classList.contains("active");
    
      if (isSigninActive) {
        // 로그인 -> 회원가입으로 갈 때: 로그인 폼 초기화
        resetForm(signinForm);
    
        signinForm.classList.remove("active");
        signinForm.style.display = "none";
    
        signupForm.classList.add("active");
        signupForm.style.display = "block";
      } else {
        // 회원가입 -> 로그인으로 갈 때: 회원가입 폼 초기화
        resetForm(signupForm);
    
        signupForm.classList.remove("active");
        signupForm.style.display = "none";
    
        signinForm.classList.add("active");
        signinForm.style.display = "block";
      }
    };
  
    // ----------------------------
    // DOM Ready
    // ----------------------------
    document.addEventListener("DOMContentLoaded", () => {
      // ===== 로그인 =====
      const loginForm =
        document.getElementById("signinForm") || document.querySelector(".signin-form");
      const loginButton =
        document.getElementById("loginButton") || loginForm?.querySelector('button[type="submit"]');
  
      // login input id가 예전(id/pw)일 수도 있어서 둘 다 지원
      const getLoginId = () =>
        document.getElementById("login_id")?.value?.trim() ??
        document.getElementById("id")?.value?.trim() ??
        "";
      const getLoginPw = () =>
        document.getElementById("login_pw")?.value ??
        document.getElementById("pw")?.value ??
        "";
  
      async function doLogin() {
        hideError("loginError");
  
        const loginId = getLoginId();
        const loginPw = getLoginPw();
  
        if (!loginId || !loginPw) {
          showError("loginError", "아이디와 비밀번호를 입력해 주세요.");
          return;
        }
  
        try {
          loginButton?.classList.add("loading");
  
          // form action 우선 사용 (th:action="/loginProc" 그대로 OK)
          const action = loginForm?.getAttribute("action") || "/loginProc";
          const formData = new FormData(loginForm);
  
          const res = await fetch(action, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
  
          // 스프링 시큐리티 로그인 성공 시 redirect 발생하는 경우가 많음
          if (res.redirected) {
            window.location.href = res.url;
            return;
          }
  
          if (res.ok) {
            window.location.href = "/";
            return;
          }
  
          showError("loginError", "로그인 실패: 아이디/비밀번호를 확인해 주세요.");
        } catch (e) {
          console.error(e);
          showError("loginError", "서버 연결에 실패했습니다.");
        } finally {
          loginButton?.classList.remove("loading");
        }
      }
  
      if (loginButton) {
        loginButton.addEventListener("click", (e) => {
          // type="submit"이면 submit이 또 발생할 수 있으니 막고 doLogin만 실행
          e.preventDefault();
          doLogin();
        });
      }
  
      if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
          e.preventDefault();
          doLogin();
        });
      }
  
      // ===== 회원가입 =====
      const signupBtn = document.getElementById("signupBtn");
  
      // 회원가입 입력
      const getVal = (id) => document.getElementById(id)?.value?.trim() ?? "";
      const getRaw = (id) => document.getElementById(id)?.value ?? "";
  
      async function doSignup() {
        hideError("signupError");
  
        const id = getVal("su_id");
        const name = getVal("su_name");
        const pw = getRaw("su_pw");
        const pwConfirm = getRaw("su_pwConfirm");
        const email = getVal("su_email");
        const phnNo = getVal("su_phnNo");
  
        if (!id || !name || !pw || !pwConfirm) {
          showError("signupError", "필수 항목을 입력해 주세요.");
          return;
        }
        if (pw !== pwConfirm) {
          showError("signupError", "비밀번호가 일치하지 않습니다.");
          return;
        }
  
        try {
          signupBtn?.classList.add("loading");

          const res = await fetch("/api/users/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id, pw, pwConfirm, name, email, phnNo }),
          });
  
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            showError("signupError", `회원가입 실패 (${res.status})`);
            return;
          }
  
          alert("회원가입이 완료되었습니다. 로그인 해주세요.");
  
          // 입력 초기화
          ["su_id", "su_name", "su_pw", "su_pwConfirm", "su_email", "su_phnNo"].forEach((k) => {
            const el = document.getElementById(k);
            if (el) el.value = "";
          });
  
          // 로그인 화면으로 전환
          window.toggleForms();
        } catch (e) {
          console.error(e);
          showError("signupError", "서버 연결에 실패했습니다.");
        } finally {
          signupBtn?.classList.remove("loading");
        }
      }
  
      if (signupBtn) {
        signupBtn.addEventListener("click", (e) => {
          e.preventDefault();
          doSignup();
        });
      }
    });

    // ===== particles 생성 =====
    const particlesHost = document.querySelector(".particles");
    if (particlesHost) {
      const COUNT = 70;

      // 기존 파티클이 있으면 중복 생성 방지
      if (particlesHost.querySelectorAll(".particle").length === 0) {
        for (let i = 0; i < COUNT; i++) {
          const p = document.createElement("span");
          p.className = "particle";

          // CSS에서 쓰는 --i (animation-delay 계산용)
          p.style.setProperty("--i", String(i));

          // 위치/속도 랜덤화
          p.style.left = Math.random() * 100 + "%";
          p.style.top = Math.random() * 100 + "%";
          p.style.animationDuration = (15 + Math.random() * 25) + "s";
          p.style.animationDelay = (-Math.random() * 25) + "s";

          particlesHost.appendChild(p);
        }
      }
    }

  })();
  