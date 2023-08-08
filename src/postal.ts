import GUI from 'lil-gui'
import * as paper from 'paper'
import { CanvasCapture } from 'canvas-capture'

export interface Postal {
  canvas: HTMLCanvasElement
  preview: HTMLCanvasElement
  view: paper.View
  settings: PostalSettings
  gui: GUI,
  isRecordingRequested: boolean
  isRecording: boolean
  recordingFrames: number
  scope: paper.PaperScope
  frame: paper.Path,
  frameStroke: paper.Path,
  background: paper.Path,
  contentBackground: paper.Path
}

export interface PostalSettings {
  previewSize: paper.Size
  postalSize: paper.Size
  exportScale: number,
  postalFrameOffsetFactor: number,
  postalFrameSizeFactor: number,
  postalFrameRadius: number,
  frameColor: string,
  strokeColor: string,
  backgroundColor: string,
  strokeWidth: number,
  shadowBlur: number,
  recordingFormat: RecordingFormat,
  showSettings: boolean
  showFrame: boolean
}

export interface PostalParams {
  previewSize?: paper.Size
  postalSize?: paper.Size
  exportScale?: number
  frameColor?: string,
  strokeColor?: string,
  backgroundColor?: string,
  showSettings?: boolean,
  showFrame?: boolean
}

export enum RecordingFormat {
  GIF = 'gif',
  PNG = 'png',
  WEBM = 'webm'
}

const defaultSettings: PostalSettings = {
  previewSize: new paper.Size(810, 810),
  postalSize: new paper.Size(960, 960),
  exportScale: 2.0,
  postalFrameOffsetFactor: 0.825,
  postalFrameSizeFactor: 0.1,
  postalFrameRadius: 4.0,
  frameColor: 'white',
  strokeColor: '#000',
  backgroundColor: '#fff',
  strokeWidth: 2.75,
  shadowBlur: 8.0,
  showSettings: false,
  showFrame: true,
  recordingFormat: RecordingFormat.GIF
}

export const create = <T>(
  scope: paper.PaperScope,
  onDraw: (canvasSize: paper.Size) => T, 
  onAnimate: (content: T, frame: number) => void,
  settings?: PostalParams): Postal => {

  const finalSettings = {...defaultSettings, ...settings}
  const canvas = setupCanvas(scope, finalSettings)
  const postalElements = drawPostal(scope, onDraw, finalSettings)
  const gui = createGUI(postalElements, finalSettings)

  postalElements.frame.visible = finalSettings.showFrame
  postalElements.frameStroke.visible = finalSettings.showFrame
  gui.show(finalSettings.showSettings)

  const postal: Postal = {
    ...canvas,
    ...postalElements,
    scope: scope,
    view: scope.view,
    settings: finalSettings,
    isRecording: false,
    isRecordingRequested: false,
    recordingFrames: 0,
    gui
  }

  updateSettings(postal, finalSettings)
  scope.view.onFrame = (event: any) => {
    onAnimate(postalElements.content, event.count)
    drawPreview(canvas, finalSettings)
    checkRecording(postal, event.count)
  }

  return postal
}

export const record = (postal: Postal, frames: number) => {
  postal.isRecordingRequested = true
  postal.recordingFrames = frames
}


/**
 * 
 * Inital draw logic
 * 
 */

const setupCanvas = (scope: paper.PaperScope, settings: PostalSettings) : { preview: HTMLCanvasElement, canvas: HTMLCanvasElement } => {
  document.documentElement.style.margin = '0px'
  document.documentElement.style.width = '100%'
  document.documentElement.style.height = '100%'

  document.body.style.margin = '0px'
  document.body.style.width = '100%'
  document.body.style.height = '100%'

  const container: HTMLDivElement = document.createElement('div')
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'center'
  container.setAttribute('id', 'container')

  const preview: HTMLCanvasElement = document.createElement('canvas')
  preview.setAttribute('id', 'preview')
  container.appendChild(preview)

  const canvas: HTMLCanvasElement = document.createElement('canvas')
  canvas.setAttribute('id', 'canvas')
  canvas.style.position = 'fixed'
  canvas.style.visibility = 'hidden'
  container.appendChild(canvas)

  document.body.appendChild(container)
  
  preview.style.width = `${settings.previewSize.width}px`
  preview.style.height = `${settings.previewSize?.height}px`
  preview.width = settings.previewSize?.width * window.devicePixelRatio
  preview.height = settings.previewSize?.height * window.devicePixelRatio

  const canvasWidth = settings.postalSize.width * settings.exportScale
  const canvasHeight = settings.postalSize.height * settings.exportScale

  canvas.style.width = `${canvasWidth}px`
  canvas.style.height = `${canvasHeight}px`
  canvas.width = canvasWidth * window.devicePixelRatio
  canvas.height = canvasHeight * window.devicePixelRatio

  scope.setup(canvas)

  return {
    preview,
    canvas
  }
}

const drawPostal = <T>(scope: paper.PaperScope, draw: (size: paper.Size) => T, settings: PostalSettings) => {
  const postalFrameOffset = (scope.view.size.width - scope.view.size.width * settings.postalFrameOffsetFactor) * 0.5
  const postalFrameSize = scope.view.size.subtract(postalFrameOffset * 2.0)
  const postalFramePoint = new scope.Point(postalFrameOffset, postalFrameOffset)

  const canvasOffset = postalFrameSize.width * settings.postalFrameSizeFactor * 0.5
  const point = postalFramePoint.add(canvasOffset)
  const size = postalFrameSize.subtract(canvasOffset * 2.0)
  
  /**
   * Draw background
   */

  const backgroundScope = new scope.Layer()
  const background = new scope.Path.Rectangle({
    point: [0, 0],
    size: scope.view.size.clone(),
    fillColor: settings.backgroundColor,
  })

  backgroundScope.addChild(background)


  /**
   * Draw postal frame
   */

  const frameLayer = new scope.Layer()
  const postalFrame = new scope.Path.Rectangle({
    point: postalFramePoint,
    size: postalFrameSize,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    fillColor: settings.frameColor,
    radius: settings.postalFrameRadius,
    shadowColor: '#00000026',
    shadowBlur: settings.shadowBlur,
    shadowOffset: new scope.Point(8.0, 8.0)
  })

  const postalBackground = new scope.Path.Rectangle({
    point,
    size,
    fillColor: settings.backgroundColor,
    radius: settings.postalFrameRadius
  })

  frameLayer.addChild(postalFrame)
  frameLayer.addChild(postalBackground)

  /**
   * Draw main content
   */

  const contentLayer = new scope.Layer()


  const container = new scope.Path.Rectangle({
    point: size.multiply(-0.5),
    size: size.subtract(settings.strokeWidth * 2.0 * 0.5),
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius,
  })

  contentLayer.addChild(container)

  const content = draw(size)
  contentLayer.translate(point.add(size.multiply(0.5)))
  contentLayer.clipped = true

  const strokeLayer = new scope.Layer()
  const postalFrameStroke = new scope.Path.Rectangle({
    point: point.add(settings.strokeWidth),
    size: size.subtract(settings.strokeWidth * 2.0),
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius
  })

  strokeLayer.addChild(postalFrameStroke)
  contentLayer.activate()

  return {
    background,
    content,
    frame: postalFrame,
    frameStroke: postalFrameStroke,
    contentBackground: postalBackground
  }
}

/**
 * Refresh draw preview logic 
 */
const drawPreview = ({preview, canvas}: {preview: HTMLCanvasElement, canvas: HTMLCanvasElement}, settings: PostalSettings) => { 
  const ctx = preview.getContext('2d')
  const canvasWidth = settings.postalSize.width * settings.exportScale * window.devicePixelRatio
  const canvasHeight = settings.postalSize.height * settings.exportScale * window.devicePixelRatio
  ctx?.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, settings.previewSize.width * window.devicePixelRatio, settings.previewSize.height * window.devicePixelRatio)
}

/**
 * Settings update functions 
 */
const createGUI = (postal: any, settings: PostalSettings) => {
  const gui = new GUI()
  const folder = gui.addFolder('Postal')
  folder.addColor(settings, 'backgroundColor').onChange(() => updateSettings(postal, settings))
  folder.addColor(settings, 'strokeColor').onChange(() => updateSettings(postal, settings))

  return gui
}

const updateSettings = (postal: Postal, settings: PostalSettings) => {
  const container = document.getElementById('container')
  container!.style.backgroundColor = settings.backgroundColor
  postal.background.fillColor = new paper.Color(settings.backgroundColor)
  postal.frame.strokeColor = new paper.Color(settings.strokeColor)
  postal.contentBackground.fillColor = new paper.Color(settings.backgroundColor)
  postal.frameStroke.strokeColor = new paper.Color(settings.strokeColor)
}

/**
 * Recording logic
 */
const checkRecording = (postal: Postal, frame: number) => {
  const animationFrame = frame % postal.recordingFrames

  if (postal.isRecordingRequested) {
    console.log('Recording requested!', frame)
    postal.isRecording = animationFrame === 0
    postal.isRecordingRequested = !postal.isRecording
  }

  if(postal.isRecording) {
    if (animationFrame === 0) {
      CanvasCapture.init(postal.canvas)
      CanvasCapture.setVerbose(true)
      beginRecording(postal.settings.recordingFormat)
    }
    
    if (animationFrame < postal.recordingFrames) {
      CanvasCapture.recordFrame()
    }
    
    if (animationFrame === postal.recordingFrames - 1) {
      CanvasCapture.stopRecord()
    }


    postal.isRecording = animationFrame < postal.recordingFrames - 1
  }  
}

const beginRecording = (format: RecordingFormat) => {
  switch(format) {
    case RecordingFormat.GIF:
      CanvasCapture.beginGIFRecord()
      break
    case RecordingFormat.PNG:
      CanvasCapture.beginPNGFramesRecord({ onExportProgress: (progress) => {
        console.log(`Zipping... ${Math.round(progress * 100)}% complete.`)
      }})
      break
    case RecordingFormat.WEBM:
      CanvasCapture.beginVideoRecord()
  }
}