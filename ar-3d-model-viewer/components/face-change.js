const changeFaceTextureComponent = {
  init() {
    this.modelLoaded = false;
    const captureUi = document.getElementById('capture-ui');
    const video = document.getElementById('video-feed');
    const captureBtn = document.getElementById('capture-btn');

    // 1. 전면 카메라 실행
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        video.srcObject = stream;
      })
      .catch(err => console.error("카메라 접근 에러:", err));

    // 2. 모델 로드 완료 대기
    this.el.addEventListener('model-loaded', () => {
      this.modelLoaded = true;
    });

    // 3. 캡처 버튼 클릭 이벤트
    captureBtn.addEventListener('click', () => {
      if (!this.modelLoaded) {
        alert("3D 모델이 아직 로드되지 않았습니다. 잠시만 기다려주세요.");
        return;
      }

      // 캔버스를 생성하여 비디오의 현재 프레임을 그림
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // (옵션) 얼굴 아웃라인 부분만 크롭하는 로직을 이곳에 추가할 수 있습니다.
      
      // 이미지를 Base64 형태로 추출
      const imageUrl = canvas.toDataURL('image/jpeg');

      // 텍스처 로드 및 3D 모델에 적용
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(imageUrl, (texture) => {
        texture.flipY = false; // GLTF 모델의 경우 종종 필요합니다.

        // 'face_change_01' 메쉬를 찾아 텍스처 적용
        const modelMesh = this.el.getObject3D('mesh').getObjectByName('face_change_01');
        if (modelMesh) {
          modelMesh.traverse((node) => {
            if (node.isMesh) {
              node.material.map = texture;
              node.material.color = new THREE.Color('#ffffff'); // 기본 색상 초기화
              node.material.needsUpdate = true;
            }
          });
        }
        
        // 캡처가 완료되면 UI 숨기기 및 카메라 스트림 종료
        captureUi.style.display = 'none';
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      });
    });
  }
}

export { changeFaceTextureComponent }