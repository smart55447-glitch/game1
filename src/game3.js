(function () {
    /* ===== 스크롤 잠금 ===== */
    const stop = e => e.preventDefault();
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('wheel', stop, { passive: false });

    /* ===== DOM ===== */
    const workspace = document.getElementById('workspace');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const hudTime = document.getElementById('hudTime');
    const hudPct = document.getElementById('hudPct');

    /* ===== 상태/상수 ===== */
    const TOTAL_TIME = 30;
    let timeLeft = TOTAL_TIME;
    let ended = false;
    let timerId = null;

    // 지우개(덜 닦이게 설정)
    const ERASE_R = 16;        // 브러시 반경
    const CENTER_ALPHA = 0.33; // 중심 제거 강도
    const MID_ALPHA = 0.15;

    // 이미지 고정 경로
    const metal = new Image();
    metal.crossOrigin = 'anonymous';
    metal.src = './img/teapot.png';

    // 그을림 전용 캔버스
    const sootCanvas = document.createElement('canvas');
    const sootCtx = sootCanvas.getContext('2d');

    // 주전자를 그릴 사각형(캔버스 내에서 주전자 이미지의 위치/크기)
    let drawRect = { dx: 0, dy: 0, dw: canvas.width, dh: canvas.height };

    // 진행률 계산용: "주전자 영역의" 총 픽셀 수
    let totalOpaque = 1; // 0 방지

    /* ===== 타이머 ===== */
    function startTimer() {
        if (timerId) return;
        hudTime.textContent = `⏱ ${timeLeft}`;
        timerId = setInterval(() => {
            if (ended) return;
            timeLeft = Math.max(0, timeLeft - 1);
            hudTime.textContent = `⏱ ${timeLeft}`;
            if (timeLeft <= 10) hudTime.classList.add('danger'); else hudTime.classList.remove('danger');

            if (timeLeft === 0) {
                const p = calcProgress();
                if (p >= 100) win(); else lose();
            }
        }, 1000);
    }
    startTimer(); // 입장 즉시 시작

    /* ===== 주전자 비율 맞춰 배치(cover-fit) ===== */
    function fitImageCover(img, boxW, boxH) {
        const iw = img.width, ih = img.height;
        const scale = Math.min(boxW / iw, boxH / ih);
        const dw = Math.round(iw * scale);
        const dh = Math.round(ih * scale);
        const dx = Math.round((boxW - dw) / 2);
        const dy = Math.round((boxH - dh) / 2);
        return { dx, dy, dw, dh };
    }

    /* ===== 그을림을 "주전자 모양"으로만 남기기 =====
       1) soot에 전체 검정 채우기
       2) composite = destination-in
       3) 주전자를 같은 위치로 그리기 → 알파가 있는 부분만 남음
    */
    function initSootMaskedByKettle() {
        sootCanvas.width = canvas.width;
        sootCanvas.height = canvas.height;

        // 1) 검정 칠
        sootCtx.globalCompositeOperation = 'source-over';
        sootCtx.clearRect(0, 0, sootCanvas.width, sootCanvas.height);
        sootCtx.fillStyle = '#000';
        sootCtx.fillRect(0, 0, sootCanvas.width, sootCanvas.height);

        // 2) 마스크 연산
        sootCtx.globalCompositeOperation = 'destination-in';
        sootCtx.drawImage(metal, drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);


        // 진행률 분모: "그을림이 실제로 존재하는(=주전자 영역) 픽셀 수"
        const img = sootCtx.getImageData(0, 0, sootCanvas.width, sootCanvas.height).data;
        let opaque = 0;
        for (let i = 3; i < img.length; i += 4) { if (img[i] > 5) opaque++; }
        totalOpaque = Math.max(1, opaque);
    }

    /* ===== 부드러운 지우개(주전자 영역만 닦임) ===== */
    function eraseAt(x, y) {
        // 주전자 영역 안에서만 동작하도록 클리핑
        sootCtx.save();
        sootCtx.beginPath();
        sootCtx.rect(drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
        sootCtx.clip();

        // 부드러운 라디얼 지우개
        const r = ERASE_R;
        const grad = sootCtx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0.00, `rgba(0,0,0,${CENTER_ALPHA})`);
        grad.addColorStop(0.60, `rgba(0,0,0,${MID_ALPHA})`);
        grad.addColorStop(1.00, 'rgba(0,0,0,0)');

        sootCtx.globalCompositeOperation = 'destination-out';
        sootCtx.fillStyle = grad;
        sootCtx.beginPath(); sootCtx.arc(x, y, r, 0, Math.PI * 2); sootCtx.fill();
        sootCtx.restore();

        if ('vibrate' in navigator) navigator.vibrate(10);
    }

    /* ===== 좌표 변환 ===== */
    function getPos(evt) {
        const rect = canvas.getBoundingClientRect();
        let cx, cy;
        if (evt.touches && evt.touches[0]) { cx = evt.touches[0].clientX; cy = evt.touches[0].clientY; }
        else { cx = evt.clientX; cy = evt.clientY; }
        const x = (cx - rect.left) / rect.width * canvas.width;
        const y = (cy - rect.top) / rect.height * canvas.height;
        return { x, y };
    }

    /* ===== 진행률(주전자 영역만 기준) ===== */
    function calcProgress() {
        const data = sootCtx.getImageData(0, 0, sootCanvas.width, sootCanvas.height).data;
        let remain = 0;
        for (let i = 3; i < data.length; i += 4) { if (data[i] > 5) remain++; }
        const cleaned = 1 - (remain / totalOpaque);
        return Math.max(0, Math.min(100, Math.round(cleaned * 100)));
    }
    function updateProgress() {
        const p = calcProgress();
        hudPct.textContent = `${p}%`;
        if (p >= 95 && p < 100) workspace.classList.add('shine');
        else workspace.classList.remove('shine');
        if (p >= 100 && timeLeft > 0) win();
    }

    /* ===== 입력 처리 ===== */
    let rubbing = false, lastX = null, lastY = null;
    function startRub(e) {
        e.preventDefault();
        if (ended) return;
        rubbing = true; workspace.classList.add('shake');
        const { x, y } = getPos(e); lastX = x; lastY = y;
        eraseAt(x, y); updateProgress();
    }
    function moveRub(e) {
        if (!rubbing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        const dx = x - lastX, dy = y - lastY;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (ERASE_R * 0.55)));
        for (let i = 1; i <= steps; i++) {
            eraseAt(lastX + dx * i / steps, lastY + dy * i / steps);
        }
        lastX = x; lastY = y;
        updateProgress();
    }
    function endRub(e) {
        e && e.preventDefault();
        rubbing = false; lastX = lastY = null; workspace.classList.remove('shake');
    }

    canvas.addEventListener('touchstart', startRub, { passive: false });
    canvas.addEventListener('touchmove', moveRub, { passive: false });
    canvas.addEventListener('touchend', endRub, { passive: false });
    canvas.addEventListener('mousedown', startRub);
    window.addEventListener('mousemove', moveRub);
    window.addEventListener('mouseup', endRub);

    /* ===== 승패 ===== */
    function win() {
        if (ended) return; ended = true;
        clearInterval(timerId);
        workspace.classList.remove('shake');
        workspace.classList.add('shine');
        alert('✨ 사포질 완료! CH3 클리어!');
        localStorage.setItem('mc:chap3', 'cleared');
        window.location.href = './clear.html';
    }
    function lose() {
        if (ended) return; ended = true;
        clearInterval(timerId);
        alert('💀 사포질 실패! 넌 여기서 빠져나갈 수 없을거야!');
        setTimeout(() => window.location.reload(), 120);
    }

    /* ===== 렌더 루프 ===== */
    function render() {
        // 바닥: 주전자 이미지
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(metal, drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh);
        // 그을림(주전자 모양에만 존재)
        ctx.drawImage(sootCanvas, 0, 0);

        if (!ended) requestAnimationFrame(render);
    }

    /* ===== 부팅(이미지 로드 후 마스크 생성) ===== */
    metal.onload = () => {
        // 캔버스 내 주전자 배치 사각형 계산
        drawRect = fitImageCover(metal, canvas.width, canvas.height);

        // 주전자 알파로 그을림을 마스킹
        initSootMaskedByKettle();

        // 타이머는 이미 시작, 렌더 시작
        render();
    };
    metal.onerror = () => {
        console.error('❌ ./img/teapot.png 로드 실패. 경로/파일명 확인 필요');
        // 그래도 플레이 가능하도록 간이 플레이스홀더
        ctx.fillStyle = '#ccc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333'; ctx.font = 'bold 20px system-ui';
        ctx.fillText('teapot.png 필요!', 20, 40);
        // 그을림은 없음 → 즉시 승리 방지 위해 totalOpaque=1
        totalOpaque = 1;
        render();
    };
})();