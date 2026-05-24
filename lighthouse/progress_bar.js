// 1. 변수 설정 
// (나중에 서버/데이터베이스 API에서 이 변수들에 값을 할당해주면 됩니다)
let totalStamps = 10;     // 전체 스탬프 목표 개수 (상황에 따라 변경 가능)
let currentStamps = 2;    // 유저가 현재까지 획득한 스탬프 개수

// 2. 프로그레스 바 UI를 업데이트 하는 함수
function updateStampProgress() {
    // HTML에서 숫자와 게이지바 요소를 찾아옵니다.
    const currentText = document.getElementById('current-stamps');
    const totalText = document.getElementById('total-stamps');
    const progressFill = document.getElementById('progress-fill');
    const progressThumb = document.getElementById('progress-thumb');

    // 텍스트 업데이트 (화면에 숫자 표시)
    currentText.textContent = currentStamps;
    totalText.textContent = totalStamps;

    // 퍼센티지 계산 (현재 획득량 / 전체 목표량 * 100)
    let percentage = (currentStamps / totalStamps) * 100;
    
    // 에러 방지: 퍼센트는 0% 보다 작거나 100% 보다 클 수 없음
    percentage = Math.max(0, Math.min(percentage, 100));

    // 바(Bar)의 채워진 너비와, 캐릭터(Thumb)의 위치를 CSS로 조작하여 이동시킵니다.
    progressFill.style.width = percentage + '%';
    progressThumb.style.left = percentage + '%';
}

// 3. 페이지 로드 시 최초 실행
window.onload = function() {
    updateStampProgress();
};

/* 테스트용 코드입니다! (주석을 풀고 화면 빈 공간을 클릭해보세요) */
document.querySelector('.mobile-container').addEventListener('click', function() {
    if (currentStamps < totalStamps) {
        currentStamps++;
        updateStampProgress();
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const toggleHeader = document.getElementById('toggle-progress');
    const progressCard = document.getElementById('progress-card');

    // 한 줄 바를 클릭하면 expanded 클래스를 붙였다 뗐다 합니다.
    toggleHeader.addEventListener('click', function() {
        progressCard.classList.toggle('expanded');
    });
});
