const myThreejsModule = customThreejsPipelineModule()

const onxrloaded = () => {
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    myThreejsModule, // Custom three.js pipeline module. Replaces XR8.Threejs.pipelineModule()
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Other custom pipeline modules.
    myScenePipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }