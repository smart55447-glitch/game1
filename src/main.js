/* ==========================
   DOM / 캔버스
========================== */
const stage = document.getElementById('stage');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sawEl = document.getElementById('cursorSaw');
const timeHUD = document.getElementById('timeHUD');

/* ==========================
   톱/커서 설정
   - CSS: translate(-30%,-50%) → 앵커는 (30%,50%)
========================== */
const ANCHOR_PCT_X = 0.1;  // 이모지 박스 내 앵커 X
const ANCHOR_PCT_Y = 0.50;  // 이모지 박스 내 앵커 Y

// PC(마우스) 각도: 약간 우하향
const MOUSE_ANGLE_RAD = -15 * Math.PI / 180;

// 모바일(터치) 각도: 톱날이 '위'를 향하게 -90°
const TOUCH_ANGLE_RAD = Math.PI / 2;

// 마우스에서 앵커→톱끝 길이(박스 너비 비율)
const TIP_RATIO_MOUSE = 0.8;

// 터치에서 사용자가 '손잡이'를 정확히 잡도록 할 포인트(박스 비율)
const HANDLE_PCT_X = 0.15;
const HANDLE_PCT_Y = 0.72;

// 마우스: 이모지를 커서보다 약간 아래 두어 커서가 이모지 위에 있는 느낌
const CURSOR_OFFSET_Y_MOUSE = 18;

// 터치: 점이 '톱보다 위'에 찍히도록 오프셋(px, 화면 기준 -Y)
const DOT_OFFSET_UP_TOUCH = 40;

/* 상태 */
let currentAngle = MOUSE_ANGLE_RAD;
let isCutting = false;

/* ==========================
   좌표 유틸
========================== */
function stagePosFromMouse(e) {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, r };
}
function stagePosFromTouch(e) {
    const r = stage.getBoundingClientRect();
    const t = e.touches[0];
    return { x: t.clientX - r.left, y: t.clientY - r.top, r };
}
function stageToCanvas(x, y, r) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (x - (rect.left - r.left)) * scaleX,
        y: (y - (rect.top - r.top)) * scaleY
    };
}
function rotateVec(x, y, rad) {
    const c = Math.cos(rad), s = Math.sin(rad);
    return { x: x * c - y * s, y: x * s + y * c };
}
function getSawBoxSize() {
    const rect = sawEl.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
}

/* ==========================
   이모지 배치
========================== */
// PC: 마우스 기준 배치(각도 -15°)
function setSawAtMouse(sp) {
    currentAngle = MOUSE_ANGLE_RAD;
    sawEl.style.left = sp.x + 'px';
    sawEl.style.top = (sp.y + CURSOR_OFFSET_Y_MOUSE) + 'px';
    sawEl.style.transform = `translate(-30%, -50%) rotate(${currentAngle}rad)`;
}

// 모바일: 손잡이 포인트가 손가락 위치에 정확히 오도록 배치(각도 -90°)
function setSawAtTouch(sp) {
    currentAngle = TOUCH_ANGLE_RAD;
    const { w, h } = getSawBoxSize();
    const dxLocal = (HANDLE_PCT_X - ANCHOR_PCT_X) * w;
    const dyLocal = (HANDLE_PCT_Y - ANCHOR_PCT_Y) * h;
    const v = rotateVec(dxLocal, dyLocal, currentAngle);
    const anchorX = sp.x - v.x;
    const anchorY = sp.y - v.y;
    sawEl.style.left = anchorX + 'px';
    sawEl.style.top = anchorY + 'px';
    sawEl.style.transform = `translate(-30%, -50%) rotate(${currentAngle}rad)`;
}

/* ==========================
   곰돌이 자동 스케일
   - 곰 전체(귀끝~리본 하단) 기준 반지름을 150으로 가정해 스케일링
========================== */
const BEAR_HALF_BASE = 150;       // 기본 반높이(기존 도형 기준값)
const SAFE_MARGIN_PCT = 0.08;     // 주변 여백 비율(8%) — 줄이면 더 큼
let BEAR_SCALE = 1;

/** 캔버스 크기에 맞춰 곰 스케일 계산 */
function computeBearScale() {
    const minDim = Math.min(canvas.width, canvas.height);
    const margin = Math.max(12, Math.floor(minDim * SAFE_MARGIN_PCT));   // 최소 12px 여백
    const targetHalf = (minDim - margin * 2) / 2;                        // 여백 제외 절반
    BEAR_SCALE = Math.max(0.1, targetHalf / BEAR_HALF_BASE);
}

/* ==========================
   배경/곰/타이머
========================== */
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

function drawBackground() {
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** 스케일 반영한 곰돌이 드로잉 */
function drawBear() {
    const s = BEAR_SCALE;
    const cx = centerX;
    const cy = centerY;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.min(2, Math.max(0.5, 0.5 * s)); // 선 두께도 스케일 반영

    // 귀
    ctx.beginPath(); ctx.arc(cx - 90 * s, cy - 110 * s, 40 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 90 * s, cy - 110 * s, 40 * s, 0, Math.PI * 2); ctx.stroke();

    // 얼굴
    ctx.beginPath(); ctx.arc(cx, cy, 100 * s, 0, Math.PI * 2); ctx.stroke();

    // 눈
    ctx.beginPath(); ctx.arc(cx - 35 * s, cy - 30 * s, 10 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 35 * s, cy - 30 * s, 10 * s, 0, Math.PI * 2); ctx.stroke();

    // 코
    ctx.beginPath(); ctx.arc(cx, cy + 10 * s, 12 * s, 0, Math.PI * 2); ctx.stroke();

    // 입
    ctx.beginPath();
    ctx.moveTo(cx - 20 * s, cy + 30 * s);
    ctx.quadraticCurveTo(cx, cy + 50 * s, cx + 20 * s, cy + 30 * s);
    ctx.stroke();

    // 리본 중앙
    ctx.beginPath(); ctx.arc(cx, cy + 120 * s, 10 * s, 0, Math.PI * 2); ctx.stroke();

    // 리본 좌
    ctx.beginPath();
    ctx.moveTo(cx - 10 * s, cy + 120 * s);
    ctx.lineTo(cx - 40 * s, cy + 110 * s);
    ctx.lineTo(cx - 30 * s, cy + 140 * s);
    ctx.closePath(); ctx.stroke();

    // 리본 우
    ctx.beginPath();
    ctx.moveTo(cx + 10 * s, cy + 120 * s);
    ctx.lineTo(cx + 40 * s, cy + 110 * s);
    ctx.lineTo(cx + 30 * s, cy + 140 * s);
    ctx.closePath(); ctx.stroke();
}

/** 스케일 반영한 윤곽 거리 기반 색상 */
function colorByDistance(x, y) {
    const s = BEAR_SCALE;
    function dCircle(px, py, ox, oy, r) {
        return Math.abs(
            Math.hypot(px - (centerX + ox * s), py - (centerY + oy * s)) - r * s
        );
    }
    const d = Math.min(
        dCircle(x, y, -90, -110, 40),  // 왼귀
        dCircle(x, y, 90, -110, 40),  // 오른귀
        dCircle(x, y, 0, 0, 100), // 얼굴
        dCircle(x, y, 0, 10, 12),  // 코
        dCircle(x, y, -35, -30, 10),  // 왼눈
        dCircle(x, y, 35, -30, 10),  // 오른눈
        dCircle(x, y, 0, 120, 10),  // 리본 중앙
        dCircle(x, y, -35, 125, 20),  // 리본 좌 날개 근사
        dCircle(x, y, 35, 125, 20)   // 리본 우 날개 근사
    );

    if (d < 15 * s) return '#00ff66';
    if (d < 40 * s) return '#ffcc00';
    return '#ff6600';
}

const totalTime = 60;
let timeLeft = totalTime;
function drawTimerBar() {
    const w = canvas.width * (timeLeft / totalTime);
    ctx.fillStyle = '#333'; ctx.fillRect(0, 10, canvas.width, 15);
    ctx.fillStyle = 'red'; ctx.fillRect(0, 10, w, 15);
    if (timeHUD) timeHUD.textContent = `TIME ${timeLeft}`;
}

/* ==========================
   컷팅(점만)
========================== */
const dotRadius = 3.0;
const cutPoints = [];
let shaking = false;

function startCutting() { isCutting = true; }
function endCutting() { isCutting = false; }

function cutAtStageXY(stageX, stageY) {
    if (!isCutting) return;

    // 흔들림 (stage와 canvas 둘 다 시도)
    if (!shaking) {
        shaking = true;
        stage.classList.add('shake');
        canvas.classList.add('shake');
        setTimeout(() => {
            stage.classList.remove('shake');
            canvas.classList.remove('shake');
            shaking = false;
        }, 150);
    }

    const c = stageToCanvas(stageX, stageY, stage.getBoundingClientRect());
    const color = colorByDistance(c.x, c.y);

    ctx.beginPath();
    ctx.arc(c.x, c.y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    cutPoints.push({ x: c.x, y: c.y, color });
}

/* ==========================
   입력 핸들러
========================== */
// PC
function handleMoveMouse(sp) {
    setSawAtMouse(sp);
    if (isCutting) {
        const tip = getMouseTipStagePos();     // PC는 '톱끝'에서 찍기
        cutAtStageXY(tip.x, tip.y);
    }
}
canvas.addEventListener('mousedown', e => {
    startCutting();
    handleMoveMouse(stagePosFromMouse(e));
});
canvas.addEventListener('mouseup', endCutting);
canvas.addEventListener('mouseleave', endCutting);
canvas.addEventListener('mousemove', e => handleMoveMouse(stagePosFromMouse(e)));

// 모바일
function handleMoveTouch(sp) {
    setSawAtTouch(sp);                        // 손잡이를 직접 잡음
    if (isCutting) {
        const dot = getTouchDotStagePos();     // 톱보다 '위'에서 찍기
        cutAtStageXY(dot.x, dot.y);
    }
}
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    startCutting();
    handleMoveTouch(stagePosFromTouch(e));
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    endCutting();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    handleMoveTouch(stagePosFromTouch(e));
}, { passive: false });

/* ==========================
   톱끝/점 위치 계산
========================== */
// PC: 앵커→각도 방향으로 TIP_RATIO 만큼 나간 '톱끝'
function getMouseTipStagePos() {
    const stageRect = stage.getBoundingClientRect();
    const rect = sawEl.getBoundingClientRect();
    const anchorX = rect.left - stageRect.left + rect.width * ANCHOR_PCT_X;
    const anchorY = rect.top - stageRect.top + rect.height * ANCHOR_PCT_Y;
    const len = rect.width * TIP_RATIO_MOUSE;
    return {
        x: anchorX + Math.cos(currentAngle) * len,
        y: anchorY + Math.sin(currentAngle) * len
    };
}

// 모바일: 톱보다 '위'(화면 -Y)에서 찍기
function getTouchDotStagePos() {
    const stageRect = stage.getBoundingClientRect();
    const rect = sawEl.getBoundingClientRect();
    const anchorX = rect.left - stageRect.left + rect.width * ANCHOR_PCT_X;
    const anchorY = rect.top - stageRect.top + rect.height * ANCHOR_PCT_Y;
    return { x: anchorX, y: anchorY - DOT_OFFSET_UP_TOUCH };
}

/* ==========================
   타이머/스코어
========================== */
function calculateScore() {
    let score = 0;
    for (const p of cutPoints) {
        if (p.color === '#00ff66') score += 5;
        else if (p.color === '#ffcc00') score += 3;
        else if (p.color === '#ff6600') score += 1;
    }
    const max = cutPoints.length * 5;
    let percent = max ? Math.round((score / max) * 100) : 0;
    percent = Math.min(100, percent);

    if (percent >= 70) {
        localStorage.setItem('mc:chap1', 'cleared');
        alert(`정확도: ${percent}% 🎉 승리!`);
        location.href = "./ch.html";
    }
    else alert(`정확도: ${percent}% 💀 패배...`);

    setTimeout(() => location.reload(), 1200);
}

const totalTimerMs = 1000;
const timer = setInterval(() => {
    timeLeft--;
    drawTimerBar();
    document.title = `TIME ${timeLeft}`;
    if (timeLeft <= 0) {
        clearInterval(timer);
        isCutting = false;
        calculateScore();
    }
}, totalTimerMs);

/* ==========================
   초기 렌더
========================== */
function reset() {
    computeBearScale();   // ✅ 먼저 스케일 산출
    drawBackground();
    drawBear();
    drawTimerBar();
}
reset();

/* (선택) 기기 회전 등으로 캔버스 내부 해상도를 바꿀 때, 아래처럼 다시 호출
window.addEventListener('orientationchange', () => {
  computeBearScale();
  drawBackground();
  drawBear();
  drawTimerBar();
});
*/