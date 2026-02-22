const fragmentShaders = [  // Define some simple shaders to apply to the camera feed.
  ` precision mediump float;  // Just the camera feed.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() { gl_FragColor = texture2D(sampler, texUv); }`,
  ` precision mediump float;  // Color boost.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float u = dot(c.rgb, vec3(-.159, -.331, .5)) * 6.0;
      float v = dot(c.rgb, vec3(.5, -.419, -.081)) * 3.0;
      gl_FragColor = vec4(y + 1.4 * v, y - .343 * u - .711 * v, y + 1.765 * u, c.a);
    }`,
  ` precision mediump float;  // Vignette.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      float x = texUv.x - .5;
      float y = texUv.y - .5;
      float v = 1.5 - sqrt(x * x + y * y) * 2.5;
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor = vec4(c.rgb * (v > 1.0 ? 1.0 : v), c.a);
    }`,
  ` precision mediump float;  // Black and white.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor = vec4(vec3(dot(c.rgb, vec3(0.299, 0.587, 0.114))), c.a);
    }`,
  ` precision mediump float;  // Sepia.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      gl_FragColor.r = dot(c.rgb, vec3(.393, .769, .189));
      gl_FragColor.g = dot(c.rgb, vec3(.349, .686, .168));
      gl_FragColor.b = dot(c.rgb, vec3(.272, .534, .131));
      gl_FragColor.a = c.a;
    }`,
  ` precision mediump float;  // Purple.
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main() {
      vec4 c = texture2D(sampler, texUv);
      float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      vec3 p = vec3(.463, .067, .712);
      vec3 rgb = y < .25 ? (y * 4.0) * p : ((y - .25) * 1.333) * (vec3(1.0, 1.0, 1.0) - p) + p;
      gl_FragColor = vec4(rgb, c.a);
    }`,
  ` precision mediump float;  // Shader with time variable
    uniform float time;
    varying vec2 texUv;
    uniform sampler2D sampler;
    void main( void ) {
      vec2 position = texUv;
      float color = 0.0;
      color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );
      color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );
      color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );
      color *= sin( time / 10.0 ) * 0.5;
      gl_FragColor = texture2D(sampler, texUv) + vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );
    }`,
]

const cameraShaderComponent = {
  init() {
    let idx = 0
    let uniforms
    let videoViewport
    let cameraFeedRenderer

    const onxrloaded = () => {
      XR8.addCameraPipelineModule({
        name: 'camera-shader',
        onStart: ({GLctx, videoWidth, videoHeight, canvasWidth, canvasHeight}) => {
          videoViewport = XR8.GlTextureRenderer.fillTextureViewport(videoWidth, videoHeight, canvasWidth, canvasHeight)

          const nextShader = () => {
            if (cameraFeedRenderer) {
              cameraFeedRenderer.destroy()
            }
            cameraFeedRenderer = XR8.GlTextureRenderer.create({
              GLctx,
              fragmentSource: fragmentShaders[idx],
            })
            idx = (idx + 1) % fragmentShaders.length
          }

          nextShader()

          window.addEventListener('click', nextShader)

          uniforms = 1.0
        },
        onUpdate: ({frameStartResult, processCpuResult, processGpuResult}) => {
          const {reality, facecontroller, handcontroller, layerscontroller} = processCpuResult

          const realityTexture =
        (reality && reality.realityTexture) ||
        (facecontroller && facecontroller.cameraFeedTexture) ||
        (handcontroller && handcontroller.cameraFeedTexture) ||
        (layerscontroller && layerscontroller.cameraFeedTexture)

          cameraFeedRenderer.render({
            renderTexture: realityTexture,
            viewport: videoViewport,
          })

          const shader = cameraFeedRenderer.shader()
          const {GLctx} = frameStartResult

          const timeLoc = GLctx.getUniformLocation(shader, 'time')
          if (timeLoc) {
            const p = XR8.GlTextureRenderer.getGLctxParameters(GLctx)
            GLctx.useProgram(shader)
            GLctx.uniform1f(timeLoc, uniforms)
            XR8.GlTextureRenderer.setGLctxParameters(GLctx, p)
            uniforms += 0.1
          }
        },
      })
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
  },
}
export {cameraShaderComponent}