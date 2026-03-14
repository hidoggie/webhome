const chromaKeyShader = {
  schema: {
    src: {type: 'selector'},
    color: {default: {x: 0.1, y: 0.9, z: 0.2}, type: 'vec3', is: 'uniform'},
    opacity: {default: 1.0},
    transparent: {default: true, is: 'uniform'},
  },
  init(data) {
    const videoTexture = new THREE.VideoTexture(data.src)
    videoTexture.minFilter = THREE.LinearFilter
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: {
          type: 'c',
          value: data.color,
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
    })
    this.material.opacity = data.opacity
  },
  update(data) {
    this.material.color = data.color
    this.material.src = data.src
    this.material.transparent = data.transparent
    this.material.opacity = data.opacity
    this.material.uniforms.opacity.value = data.opacity
    this.material.uniformsNeedUpdate = true
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main(void)',
    '{',
    'vUv = uv;',
    'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
    'gl_Position = projectionMatrix * mvPosition;',
    '}',
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D myTexture;',
    'uniform vec3 color;',
    'uniform float opacity;',
    'varying vec2 vUv;',
    'void main(void)',
    '{',
    'vec3 tColor = texture2D( myTexture, vUv ).rgb;',
    'float a = (length(tColor - color) - 0.5) * 7.0;',
    'gl_FragColor = vec4(tColor, a * opacity);',
    '}',
  ].join('\n'),
}
export {chromaKeyShader}
