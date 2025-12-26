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
        signinForm.classList.remove("active");
        signinForm.style.display = "none";
  
        signupForm.classList.add("active");
        signupForm.style.display = "block";
      } else {
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
  })();
  