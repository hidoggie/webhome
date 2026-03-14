const chromaKeyShader = {
  schema: {
    src:        { type: 'selector' },
    color:      { default: {x: 0.1, y: 0.9, z: 0.2}, type: 'vec3', is: 'uniform' },
    opacity:    { default: 1.0,  type: 'number', is: 'uniform' },
    threshold:  { default: 0.35, type: 'number', is: 'uniform' },
    smoothness: { default: 0.08, type: 'number', is: 'uniform' },
    spill:      { default: 1.0,  type: 'number', is: 'uniform' },
    transparent: { default: true },
  },

  init(data) {
    const videoEl = data.src

    if (videoEl) {
      videoEl.muted = true
      videoEl.playsInline = true
      const p = videoEl.play()
      if (p !== undefined) {
        p.catch(() => {
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

      // ✅ KEY FIX: xrlayerscene 은 premultiplied alpha 합성을 사용
      //    → blending을 Custom으로 설정해 직접 제어
      //    → src: ONE (이미 셰이더에서 RGB에 알파 곱함)
      //    → dst: ONE_MINUS_SRC_ALPHA (뒤 레이어와 정확히 합성)
      blending:         THREE.CustomBlending,
      blendEquation:    THREE.AddEquation,
      blendSrc:         THREE.OneFactor,               // src RGB는 이미 premultiply됨
      blendDst:         THREE.OneMinusSrcAlphaFactor,  // 뒤 배경을 알파만큼 줄임
      blendSrcAlpha:    THREE.OneFactor,
      blendDstAlpha:    THREE.OneMinusSrcAlphaFactor,
      premultipliedAlpha: true,

      depthWrite: false,
      side:       THREE.DoubleSide,
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

      // 1) 색상 거리 기반 알파 계산
      float dist = length(c - color);
      float a = smoothstep(threshold - smoothness, threshold + smoothness, dist);
      a *= opacity;

      // 2) Green Spill Suppression
      vec3 outColor = c;
      float greenExcess = c.g - max(c.r, c.b);
      if (greenExcess > 0.0) {
        outColor.g -= greenExcess * spill * (1.0 - a);
      }

      // ✅ KEY FIX: xrlayerscene 은 premultiplied alpha 출력을 기대함
      //    RGB에 알파를 미리 곱해서 출력해야 밝은 하늘에서도 정확하게 합성됨
      //    (곱하지 않으면 → 밝은 배경에서 씻겨나가 희미하게 보임)
      gl_FragColor = vec4(outColor * a, a);
    }
  `,
}

export { chromaKeyShader }
