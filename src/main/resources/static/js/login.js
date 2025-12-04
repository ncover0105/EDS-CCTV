
// document.addEventListener('DOMContentLoaded', function() {
//     createParticles();

//     const loginButtons = document.querySelectorAll('.login-btn');
//     loginButtons.forEach(button => {
//         button.addEventListener('click', function(e) {
//             if (this.type === 'submit') {
//                 this.classList.add('loading');
//                 this.textContent = '';
//             }
//         });
//     });
// });

// document.querySelectorAll('.form-input').forEach(input => {
//     input.addEventListener('focus', function() {
//         this.parentElement.style.transform = 'translateY(-2px)';
//     });
    
//     input.addEventListener('blur', function() {
//         this.parentElement.style.transform = 'translateY(0)';
//     });
// });

function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        particlesContainer.appendChild(particle);
    }
}

// function toggleForms() {
//     const signinForm = document.querySelector('.signin-form');
//     const signupForm = document.querySelector('.signup-form');
    
//     if (signinForm.classList.contains('active')) {
//         signinForm.classList.remove('active');
//         signinForm.style.display = 'none';
//         signupForm.classList.add('active');
//         signupForm.style.display = 'block';
//     } else {
//         signupForm.classList.remove('active');
//         signupForm.style.display = 'none';
//         signinForm.classList.add('active');
//         signinForm.style.display = 'block';
//     }
// }

document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    const signinForm = document.querySelector('.signin-form');
    const loginButton = signinForm.querySelector('.login-btn');
    const idInput = signinForm.querySelector('#id');
    const pwInput = signinForm.querySelector('#pw');

    loginButton.addEventListener('click', function(e) {
        e.preventDefault();

        const id = idInput.value.trim();
        const pw = pwInput.value.trim();

        if (id === '' || pw === '') {
            showError('아이디와 비밀번호를 모두 입력해 주세요.');
            return;
        }

        this.classList.add('loading');
        this.textContent = '';

        handleLogin(signinForm, loginButton, id, pw);
    });

    signinForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginButton.click();
    });
});

/* 로그인 요청 */
async function handleLogin(form, button, id, pw) {
    try {
        const response = await fetch(form.getAttribute('action'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            credentials: 'include',  // 세션 쿠키 유지 (중요)
            body: new URLSearchParams({
                id: id,
                pw: pw
            })
        });

        if (response.redirected) {
            // 로그인 성공 → redirect된 페이지로 이동
            window.location.href = response.url;
            return;
        }

        if (response.status === 401) {
            showError('인증 실패: 아이디 또는 비밀번호를 확인해 주세요.');
        } else {
            showError('로그인 요청 실패 (' + response.status + ')');
        }
    } catch (err) {
        console.error(err);
        showError('서버 연결에 실패했습니다.');
    } finally {
        removeLoadingState(button);
    }
}

function removeLoadingState(button) {
    button.classList.remove('loading');
    button.textContent = '로그인';
}

function showError(message) {
    let errorBox = document.querySelector('.error-message');
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.className = 'error-message';
        document.querySelector('.signin-form').appendChild(errorBox);
    }
    errorBox.innerHTML = `<div class="alert">${message}</div>`;
}
