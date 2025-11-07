(function () {
    // 스크롤 금지(2차 안전장치)
    function lockScroll() {
        const stop = e => { e.preventDefault(); };
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.addEventListener('touchmove', stop, { passive: false });
        document.addEventListener('wheel', stop, { passive: false });
        document.addEventListener('scroll', () => window.scrollTo(0, 0), { passive: false });
    }
    lockScroll();

    const stage = document.getElementById('stage');
    const track = document.getElementById('track');
    const needlePos = document.getElementById('needlePos'); // 바늘(탭 대상)
    const fireFx = document.getElementById('fireFx');
    const hudTime = document.getElementById('hudTime');
    const hudPct = document.getElementById('hudPct');
    const weldFill = document.getElementById('weldFill');

    let progress = 0;         // 0~100 (%)
    let heat = 0;             // 0~1 (시각효과)
    let timeLeft = 60;        // 초
    let ended = false;        // 승/패 종료 플래그
    let timerId = null;       // 타이머 id

    // ingot 크기 맵(작은 정사각 → 얇은 선)
    const START_W = 14, END_W = 88;  // 폭(%)
    const START_H = 14, END_H = 4;   // 높이(%)

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    /* 바늘 왕복(항상 동작) */
    function animate() {
        if (ended) return; // 종료 시 애니메이션 정지
        const speed = 0.002; // 느리게: 0.0016
        const t = performance.now() * speed;
        const p = (Math.sin(t * Math.PI * 2) + 1) / 2; // 0~1
        needlePos.style.left = (p * 100) + '%';
        requestAnimationFrame(animate);
    }

    /* 중앙 판정(±2.8% 폭) */
    function isCentered() {
        const r = needlePos.getBoundingClientRect();
        const b = track.getBoundingClientRect();
        const center = b.left + b.width / 2;
        const dist = Math.abs(center - r.left);
        const thresh = Math.max(14, b.width * 0.028);
        return dist <= thresh;
    }

    /* 시각 갱신 */
    function applyVisuals() {
        // 하얀 금속 형태 변화
        const w = START_W + (END_W - START_W) * (progress / 100);
        const h = START_H - (START_H - END_H) * (progress / 100);
        stage.style.setProperty('--ingotW', w.toFixed(2));
        stage.style.setProperty('--ingotH', h.toFixed(2));

        // 열감: 진행률/최근 가열 중 큰 값 사용 → 시뻘겋게
        const heatVis = Math.max(heat, progress / 100);
        stage.style.setProperty('--heat', heatVis.toFixed(3));

        // ✅ 금속판 어둡게(진행/열 기반). 0~1 범위를 --darken에 전달.
        stage.style.setProperty('--darken', heatVis.toFixed(3));

        // HUD & 진행바
        hudPct.textContent = `${progress}%`;
        weldFill.style.width = `${progress}%`;

        // 문서 타이틀도 함께 갱신
        document.title = `TIME ${timeLeft} • ${progress}%`;
    }

    /* 통합 종료 처리 */
    function endGame(result) {
        if (ended) return;
        ended = true;
        if (timerId) { clearInterval(timerId); timerId = null; }
        applyVisuals();

        if (result === 'win') {
            alert('통과! 🎉 CH3가 해금되었습니다.');
            localStorage.setItem('mc:chap2', 'cleared');
            localStorage.setItem('mc:chap3', 'unlocked');
            window.location.href = './ch.html';
        } else {
            alert('실패! 💀 시간 안에 완료하지 못했습니다.');
            // ✅ 실패 시 자동 재시작
            setTimeout(() => window.location.reload(), 80);
        }
    }

    /* 히트(바늘 직접 탭) */
    function onHit() {
        if (ended) return;

        if (!isCentered()) {
            heat = clamp(heat + 0.08, 0, 1); // 빗맞아도 열감 살짝
            applyVisuals();
            return;
        }

        // 성공: 진행 +10%, 강가열
        progress = clamp(progress + 10, 0, 100);
        heat = clamp(heat + 0.25, 0, 1);
        fireFx.classList.add('on');
        setTimeout(() => fireFx.classList.remove('on'), 140);
        applyVisuals();

        // ★ 통과 조건: "60초 안에" 100% 달성
        if (progress >= 100 && timeLeft > 0) {
            endGame('win');
        }
    }

    /* 타이머 */
    function startTimer() {
        hudTime.textContent = `⏱ ${timeLeft}`;
        timerId = setInterval(() => {
            if (ended) { clearInterval(timerId); timerId = null; return; }

            timeLeft = Math.max(0, timeLeft - 1); // 음수 방지
            hudTime.textContent = `⏱ ${timeLeft}`;

            // 서서히 식기(바닥열은 진행율/100 유지)
            const base = progress / 100;
            heat = Math.max(base, heat - 0.02);
            applyVisuals();

            // ⏱ 0초가 되는 순간 100% 미만이면 무조건 실패
            if (timeLeft === 0 && progress < 100) {
                endGame('lose');
            }
        }, 1000);
    }

    // 입력(바늘을 직접 탭해야 히트)
    const tap = e => { e.preventDefault(); onHit(); };
    needlePos.addEventListener('touchstart', tap, { passive: false });
    needlePos.addEventListener('mousedown', tap);

    // 시작
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(animate);
            startTimer();
            applyVisuals();
        });
    } else {
        requestAnimationFrame(animate);
        startTimer();
        applyVisuals();
    }
})();