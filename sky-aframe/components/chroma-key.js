const chromaKeyShader = {
  schema: {
    src: {type: 'selector'},           // ✅ FIX 1: 'map' → 'selector' (실제 <video> DOM 엘리먼트를 받아야 함)
    color: {default: {x: 0.1, y: 0.9, z: 0.2}, type: 'vec3', is: 'uniform'},
    opacity: {default: 1.0, type: 'number', is: 'uniform'},
    transparent: {default: true},
  },
  init(data) {
    const videoEl = data.src

    // ✅ FIX 2: 비디오 재생 보장 — 브라우저 정책상 muted + play() 명시 호출 필요
    if (videoEl) {
      videoEl.muted = true
      videoEl.playsInline = true
      const playPromise = videoEl.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // autoplay 차단 시 사용자 터치 이후 재생
          document.addEventListener('click', () => videoEl.play(), {once: true})
          document.addEventListener('touchstart', () => videoEl.play(), {once: true})
        })
      }
    }

    const videoTexture = new THREE.VideoTexture(videoEl)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.format = THREE.RGBAFormat     // ✅ FIX 3: 포맷 명시

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: {
          type: 'c',
          value: new THREE.Vector3(data.color.x, data.color.y, data.color.z),
        },
        myTexture: {
          type: 't',
          value: videoTexture,
        },
        opacity: {
          type: 'f',
          value: data.opacity,
        },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,       // ✅ FIX 4: ShaderMaterial에 transparent 반드시 명시
      depthWrite: false,        // ✅ FIX 5: 투명 오브젝트 렌더링 순서 문제 방지
      side: THREE.DoubleSide,   // ✅ FIX 6: 양면 렌더링
    })
  },
  update(data) {
    if (!this.material) return
    this.material.transparent = true
    this.material.uniforms.opacity.value = data.opacity
    this.material.uniformsNeedUpdate = true
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main(void)',
    '{',
    '  vUv = uv;',
    '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
    '  gl_Position = projectionMatrix * mvPosition;',
    '}',
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D myTexture;',
    'uniform vec3 color;',
    'uniform float opacity;',
    'varying vec2 vUv;',
    'void main(void)',
    '{',
    '  vec4 texColor = texture2D( myTexture, vUv );',
    '  vec3 tColor = texColor.rgb;',
    // ✅ FIX 7: 알파 계산 개선 — 기존 공식은 너무 단순해서 경계가 거칠었음
    '  float colorDist = length(tColor - color);',
    '  float a = smoothstep(0.2, 0.4, colorDist);',  // smoothstep으로 부드러운 경계
    '  gl_FragColor = vec4(tColor, a * opacity);',
    '}',
  ].join('\n'),
}
export {chromaKeyShader}
