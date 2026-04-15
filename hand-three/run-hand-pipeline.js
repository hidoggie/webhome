import {handScenePipelineModule} from './hand-scene.js'

const runHandPipeline = () => {
  // Add a canvas to the document for our xr scene.
  document.body.insertAdjacentHTML('beforeend', `
    <canvas id="camerafeed" width="${window.innerWidth}" height="${window.innerHeight}"></canvas>
  `)

  XR8.HandController.configure({
    coordinates: {mirroredDisplay: false},
  })

  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),  // Draws the camera feed.
    XR8.Threejs.pipelineModule(),  // Syncs threejs renderer to camera properties.
    XR8.HandController.pipelineModule(),  // Loads 8th Wall Face Engine
    XR8.CanvasScreenshot.pipelineModule(),  // Required for photo capture
    window.LandingPage.pipelineModule(),  // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),  // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),  // Shows an error image on runtime error.
    // Custom pipeline modules
    handScenePipelineModule(),
    window.HandCoachingOverlay.pipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({
    canvas: document.getElementById('camerafeed'),
    cameraConfig: {direction: XR8.XrConfig.camera().BACK},
    allowedDevices: XR8.XrConfig.device().ANY,
  })
}

export {runHandPipeline}
