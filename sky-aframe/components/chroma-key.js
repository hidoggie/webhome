const chromaKeyShader = {
  schema: {
    src:        { type: 'selector' },
    color:      { default: {x: 0.1, y: 0.9, z: 0.2}, type: 'vec3', is: 'uniform' },
    opacity:    { default: 1.0,  type: 'number', is: 'uniform' },
    threshold:  { default: 0.35, type: 'number', is: 'uniform' }, // 제거 강도 (낮을수록 더 제거)
    smoothness: { default: 0.08, type: 'number', is: 'uniform' }, // 경계 부드러움
    spill:      { default: 1.0,  type: 'number', is: 'uniform' }, // 초록 번짐 제거 (0~1)
    transparent: { default: true },
  },

  init(data) {
    const videoEl = data.src

    if (videoEl) {
      videoEl.muted = true
      videoEl.playsInline = true
      const playPromise = videoEl.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          document.addEventListener('click',      () => videoEl.play(), { once: true })
          document.addEventListener('touchstart', () => videoEl.play(), { once: true })
        })
      }
    }

    const videoTexture = new THREE.VideoTexture(videoEl)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.format    = THREE.RGBAFormat

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        myTexture:  { type: 't',  value: videoTexture },
        color:      { type: 'v3', value: new THREE.Vector3(data.color.x, data.color.y, data.color.z) },
        opacity:    { type: 'f',  value: data.opacity },
        threshold:  { type: 'f',  value: data.threshold },
        smoothness: { type: 'f',  value: data.smoothness },
        spill:      { type: 'f',  value: data.spill },
      },
      vertexShader:   this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.DoubleSide,
    })
  },

  update(data) {
    if (!this.material) return
    this.material.uniforms.opacity.value    = data.opacity
    this.material.uniforms.threshold.value  = data.threshold
    this.material.uniforms.smoothness.value = data.smoothness
    this.material.uniforms.spill.value      = data.spill
    this.material.uniformsNeedUpdate = true
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D myTexture;
    uniform vec3  color;
    uniform float opacity;
    uniform float threshold;
    uniform float smoothness;
    uniform float spill;

    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(myTexture, vUv);
      vec3 c = texColor.rgb;

      // ── 1) 색상 거리 기반 알파 계산 ──────────────────────────
      //   threshold를 낮추면 더 공격적으로 초록을 제거
      float dist = length(c - color);
      float a = smoothstep(threshold - smoothness, threshold + smoothness, dist);

      // ── 2) Green Spill Suppression ─────────────────────────────
      //   경계 부근 초록 번짐(haloing) 억제
      //   초록 채널이 R·B보다 얼마나 강한지 계산 후 차감
      vec3 outColor = c;
      float greenExcess = c.g - max(c.r, c.b);
      if (greenExcess > 0.0) {
        // a가 낮을수록(초록에 가까울수록) 더 많이 억제
        outColor.g -= greenExcess * spill * (1.0 - a);
      }

      gl_FragColor = vec4(outColor, a * opacity);
    }
  `,
}

export { chromaKeyShader }
