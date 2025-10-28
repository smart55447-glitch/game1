const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")
/* ✨ 3️⃣ 왜 “2d”라고 써?

"2d"는 “2차원 그림” 모드야.
(왼쪽↔오른쪽, 위↔아래 평면 위에 그림)

3D 그래픽을 할 때는 "webgl"을 쓰기도 해.

const ctx = canvas.getContext("webgl");


→ 그건 입체 그래픽용 (게임 엔진 수준).*/

/*이게 바로 “그림 그릴 도구 상자”를 꺼내는 코드야.
이 상자 안에는 이런 것들이 들어 있어 👇

기능	코드	설명
색 정하기	ctx.fillStyle = "red"	붓 색 바꾸기
네모 칠하기	ctx.fillRect(x, y, w, h)	색칠한 사각형
선 그리기	ctx.moveTo(), ctx.lineTo()	펜으로 그리기
원 그리기	ctx.arc(x, y, r, 0, Math.PI * 2)	동그라미 그리기
다 칠하기	ctx.fill()	도형 안을 색칠
테두리만	ctx.stroke()	선만 남기기 */
/* 🧠 정리 한 줄

canvas는 종이,
getContext("2d")는 붓 상자,
ctx는 붓을 잡은 손이다.*/

function drawBackground() {
    ctx.fillStyle = "#888888"// 색 정하기
    ctx.fillRect(0, 0, canvas.width, canvas.height)// 배경을 꽉 칠함 html 에서 설정한  width="600" height="600"
}

const centerX = canvas.width / 2
const centerY = canvas.height / 2 // 도화지의 가운데 좌표 계산

ctx.strokeStyle = "black" // 기본 선 스타일 색상 스타일이 색이랑 관련있군
ctx.lineWidth = 0.5// 두께 

function drawBear() {
    //왼쪽 귀
    ctx.beginPath()//비긴 페쓰를 안쓰면 전의 선이랑 이어짐 요소를 하나하나 분리하는데에 사용
    ctx.arc(centerX - 90, centerY - 110, 40, 0, Math.PI * 2)
    ctx.stroke()//이제 실제로 화면에 선을 보여줘
    //오른쪽 귀
    ctx.beginPath()
    ctx.arc(centerX + 90, centerY - 110, 40, 0, Math.PI * 2)
    ctx.stroke()
    // 얼굴
    ctx.beginPath()
    ctx.arc(centerX, centerY, 100, 0, Math.PI * 2)
    ctx.stroke()
    //왼쪽 눈
    ctx.beginPath();
    ctx.arc(centerX - 35, centerY - 30, 10, 0, Math.PI * 2)
    ctx.stroke()
    //오른쪽 눈
    ctx.beginPath()
    ctx.arc(centerX + 35, centerY - 30, 10, 0, Math.PI * 2)
    ctx.stroke()
    //코
    ctx.beginPath()
    ctx.arc(centerX, centerY + 10, 12, 0, Math.PI * 2)
    ctx.stroke()
    //입 빙그레
    ctx.beginPath()
    ctx.moveTo(centerX - 20, centerY + 30);//시작하는 지점 설정
    ctx.quadraticCurveTo(centerX, centerY + 50, centerX + 20, centerY + 30)

    /*🧠 설명 moveTo(50, 200) → 곡선이 시작되는 위치
    150, 50 → 중간에서 곡선이 ‘당겨지는’ 지점 (제어점)
    250, 200 → 곡선이 끝나는 지점
    즉 👇 시작점 (50,200)
     ↖
      \    ← (150,50) 쪽으로 당겨진 곡선
       \
        ↘
         끝점 (250,200)

🎨 결과: 완만하게 휘어진 한 번 꺾인 곡선 */
    ctx.stroke()
    // 리본 가운데
    ctx.beginPath();
    ctx.arc(centerX, centerY + 120, 10, 0, Math.PI * 2)
    ctx.stroke();
    //리본 왼
    ctx.beginPath()
    ctx.moveTo(centerX - 10, centerY + 120);//시작하는 지점 설정
    ctx.lineTo(centerX - 40, centerY + 110)
    ctx.lineTo(centerX - 30, centerY + 140)
    ctx.closePath()// 세번째 점에서 다시 첫번째 점으로 자동으로 연결해줌
    ctx.stroke()
    //리본 오
    ctx.beginPath()
    ctx.moveTo(centerX + 10, centerY + 120)
    ctx.lineTo(centerX + 40, centerY + 110)
    ctx.lineTo(centerX + 30, centerY + 140)
    ctx.closePath()
    ctx.stroke()
}
//타이머 바
const totalTime = 60
let timeLeft = totalTime//??

function drawTimerBar() {
    const barWidth = canvas.width * (timeLeft / totalTime)//전체 * 비율(남은시간/전체시간)
    const barHeight = 15// 막대의 두께 15px
    const barY = 10// 금속판 기준 위에서 10PX아래로 이동

    ctx.fillStyle = "#333"
    ctx.fillRect(0, barY, canvas.width, barHeight)//바탕 회색

    ctx.fillStyle = "red"
    ctx.fillRect(0, barY, barWidth, barHeight)//안에 바
    /*“왜 두 번 그려(회색, 그다음 빨강)?” → 빨강만 그리면 이전 길이가 남아있어.
    먼저 회색으로 전부 깔고, 그 위에 현재 길이만 빨강으로 표시하는 게 깔끔함. */
}


//이제 게임 시작! 게임 작동에 대한 함수

// 일단 먼저 그려줌
function resetGame() {
    drawBackground()
    drawBear()
    drawTimerBar()
}


let isCutting = false//자르냐 안자르냐
const cutRange = 5 // 커질 수록 컷팅 두께 두꺼워짐
const cutPoints = [] // 자를때마다 찍히는 좌표들을 모아두기

//게임 시작 먼저 다 그려줌
resetGame()

function startCutting() {
    isCutting = true//누르기 시작// 이거 안쓰면 cutAt가 발생해서 변수 발생
}

function endCutting() {
    isCutting = false//누르기 끝
}

function cutAt(x, y) {// 누르는 중//금속판을 긋고 있음
    if (!isCutting) return//자르는 중이 아니면 꺼져

    canvas.classList.add("shake")
    setTimeout(function () {
        canvas.classList.remove("shake")
    }, 150)// 자르는 동안 진동

    //곰돌이의 각 부위에 좌표 저장 기준점 만들기
    const earLeft = { x: centerX - 90, y: centerY - 110, r: 40 }
    const earRight = { x: centerX + 90, y: centerY - 110, r: 40 }
    const face = { x: centerX, y: centerY, r: 100 }
    const nose = { x: centerX, y: centerY + 10, r: 12 }
    const eyeLeft = { x: centerX - 35, y: centerY - 30, r: 10 }
    const eyeRight = { x: centerX + 35, y: centerY - 30, r: 10 }
    const ribbonCenter = { x: centerX, y: centerY + 120, r: 10 }
    const ribbonLeft = { x: centerX - 35, y: centerY + 125, r: 20 }
    const ribbonRight = { x: centerX + 35, y: centerY + 125, r: 20 }

    //거리 계산 함수 와 진짜 뭐라는 건지 하나도 모르겠음 ㅜㅜㅜㅜㅜㅜㅜㅜ 피타고라스 공식까지 나옴 //
    function circleDist(px, py, cx, cy, r) {
        const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        return Math.abs(d - r)
    }

    const dEarLeft = circleDist(x, y, earLeft.x, earLeft.y, earLeft.r)
    const dEarRight = circleDist(x, y, earRight.x, earRight.y, earRight.r)
    const dFace = circleDist(x, y, face.x, face.y, face.r)
    const dNose = circleDist(x, y, nose.x, nose.y, nose.r)
    const dEyeLeft = circleDist(x, y, eyeLeft.x, eyeLeft.y, eyeLeft.r)
    const dEyeRight = circleDist(x, y, eyeRight.x, eyeRight.y, eyeRight.r)
    const dRibbonCenter = circleDist(x, y, ribbonCenter.x, ribbonCenter.y, ribbonCenter.r);
    const dRibbonLeft = circleDist(x, y, ribbonLeft.x, ribbonLeft.y, ribbonLeft.r)
    const dRibbonRight = circleDist(x, y, ribbonRight.x, ribbonRight.y, ribbonRight.r)

    // 그중에서 가장 가까운 거리 찾기
    const dist = Math.min(
        dEarLeft, dEarRight, dFace, dNose,
        dEyeLeft, dEyeRight,
        dRibbonCenter, dRibbonLeft, dRibbonRight
    )
    // 거리에 따라 색을 다르게 설정
    let color
    if (dist < 15) color = "#00ff66"
    else if (dist < 40) color = "#ffcc00"
    else color = "#ff6600"
    //화면에 앞에 만들어준 점으로 찍기
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = color// 위에서 정한 색으로 칠하기
    ctx.fill()// 화면에 점을 실제로 그리기

    cutPoints.push({ x, y, dist })// 점수 계산용 데이터 저장
    /*나중에 calculateScore() 함수에서 이걸 이용해서
    얼마나 정확하게 잘랐는지 계산해. */
}

canvas.addEventListener("mousedown", startCutting)
canvas.addEventListener("mouseup", endCutting);
canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cutAt(x, y)
});

canvas.addEventListener("touchstart", function (e) {
    e.preventDefault()
    startCutting()
});

canvas.addEventListener("touchend", function (e) {
    e.preventDefault()
    endCutting()
});

canvas.addEventListener("touchmove", function (e) {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    cutAt(x, y)
});

//1초마다 안의 코드가 실행된다
const timer = setInterval(function () {
    timeLeft--;// 1을 빼라
    document.title = "남은 시간: " + timeLeft + "초"
    drawTimerBar()//빨간 타이머 막대기도 다시 그려짐 달라진 타임레프트 시간에 따라

    if (timeLeft <= 0) {
        clearInterval(timer);// setInterval 멈추는 함수 안그러면 음수됨
        isCutting = false
        calculateScore()//점수계산 함수 발동
    }
}, 1000)

function calculateScore() {
    let score = 0;
    // 점수 바구니 0으로 시작
    for (let i = 0; i < cutPoints.length; i++) {
        const p = cutPoints[i];// 위에서 재가 자를 때마다 저장해둔 점들 목록
        const dist = p.dist;// 가장가까운 곰돌이 테두리와 떨어진 거리 숫자가 작을 수록 정확하게

        if (dist <= 12) {
            score += 5;
        } else if (dist <= 25) {
            score += 3;
        } else if (dist <= 40) {
            score += 1;
        }
    }

    const maxScore = cutPoints.length * 5; // 최대로 받을 수 있는 점 수 = 5점 이론상 최고점
    let percent = maxScore === 0 ? 0 : (score / maxScore) * 100;
    //점수가 하나도 없는 게 참이면 0점 아니면 최대로 받을 수 있는 점수 분의 점수 곱하기 백 = 백분율 정확도
    if (percent > 100) percent = 100;
    //정화도가 100을 넘기지 않게 막는 코드 100을 넘으면 100점으로 깍아
    percent = Math.round(percent)

    if (percent >= 70) {
        alert("정확도: " + percent + "% 🎉 승리! 너.. 금속공예를 해라..");
    } else {
        alert("정확도: " + percent + "% 💀 패배... 하던거 열심히 해보자");
    }

    setTimeout(function () {
        location.reload();
    }, 1500);
}