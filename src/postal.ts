import GUI from 'lil-gui'
import * as paper from 'paper'
import { CanvasCapture } from 'canvas-capture'

export interface PostalContent {
  group: paper.Group
}

export interface CanvasContent<T extends PostalContent> {
  group: paper.Group
  point: paper.Point,
  size: paper.Size,
  background: paper.Path
  strokeBackground: paper.Path
  postalContent: T
}

export interface Postal<T extends PostalContent> {
  canvas: HTMLCanvasElement
  preview: HTMLCanvasElement
  view: paper.View
  settings: PostalSettings
  group: paper.Group,
  background: paper.Path,
  content: CanvasContent<T>
  frame: paper.Path,
  gui: GUI,
  isRecordingRequested: boolean
  isRecording: boolean
  recordingFrames: number
  scope: paper.PaperScope
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
  recordingFormat: RecordingFormat
}

export interface PostalParams {
  previewSize?: paper.Size
  postalSize?: paper.Size
  exportScale?: number
  frameColor?: string,
  strokeColor?: string,
  backgroundColor?: string
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
  strokeColor: '#b338ff',
  backgroundColor: '#fff0f8',
  strokeWidth: 2.75,
  shadowBlur: 8.0,
  recordingFormat: RecordingFormat.GIF
}

export const create = <T extends PostalContent>(
  scope: paper.PaperScope,
  onDraw: (point: paper.Point, size: paper.Size) => T, 
  onAnimate: (content: T, frame: number) => void,
  settings?: PostalParams): Postal<T> => {

  const finalSettings = {...defaultSettings, ...settings}
  const canvas = setupCanvas(scope, finalSettings)
  const postalElements = drawPostal<T>(scope, onDraw, finalSettings)
  const gui = createGUI(finalSettings)

  const postal: Postal<T> = {
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

  scope.view.onFrame = (event: any) => {
    updateSettings(postal)
    onAnimate(postal.content.postalContent, event.count)
    drawPreview(canvas, finalSettings)
    checkRecording(postal, event.count)
  }

  return postal
}

export const record = <T extends PostalContent>(postal: Postal<T>, frames: number) => {
  postal.isRecordingRequested = true
  postal.recordingFrames = frames
}


/**
 * 
 * Inital draw logic
 * 
 */

const setupCanvas = (scope: paper.PaperScope, settings: PostalSettings) : { preview: HTMLCanvasElement, canvas: HTMLCanvasElement } => {
  const previewElement: HTMLElement | null = document.getElementById('preview')
  const canvasElement: HTMLElement | null = document.getElementById('canvas')

  if (previewElement === null || canvasElement === null)
    throw(new Error('Missing preview and canvas HTMLCanvasElement. You must add them in your HTML index'))
  else if (previewElement.nodeName !== 'CANVAS'  || canvasElement.nodeName !== 'CANVAS')
    throw(new Error('Invalid tag type for preview and canvas html elements. They must be <canvas>'))

  const preview: HTMLCanvasElement = previewElement as HTMLCanvasElement
  const canvas: HTMLCanvasElement = canvasElement as HTMLCanvasElement
  
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

const drawPostal = <T extends PostalContent>(scope: paper.PaperScope, draw: (point: paper.Point, size: paper.Size) => T, settings: PostalSettings) => {
  const background = new scope.Path.Rectangle({
    point: [0, 0],
    size: scope.view.size.clone(),
    fillColor: settings.backgroundColor,
  })

  const postalFrameOffset = (scope.view.size.width - scope.view.size.width * settings.postalFrameOffsetFactor) * 0.5
  const postalFrameSize = scope.view.size.subtract(postalFrameOffset * 2.0)
  const postalFramePoint = new scope.Point(postalFrameOffset, postalFrameOffset)

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

  const canvasOffset = postalFrameSize.width * settings.postalFrameSizeFactor * 0.5
  const point = postalFramePoint.add(canvasOffset)
  const size = postalFrameSize.subtract(canvasOffset * 2.0)

  const postalCanvas = new scope.Path.Rectangle({
    point: point.add(settings.strokeWidth * 0.5),
    size: size.subtract(settings.strokeWidth * 2.0 * 0.5),
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius
  })

  postalCanvas.clipMask = true

  const postalBackground = new scope.Path.Rectangle({
    point,
    size,
    fillColor: settings.backgroundColor,
    radius: settings.postalFrameRadius
  })

  const postalStrokeBackground = new scope.Path.Rectangle({
    point: point.add(settings.strokeWidth),
    size: size.subtract(settings.strokeWidth * 2.0),
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius
  })


  background.sendToBack()

  const content = draw(point, size)
  const canvasGroup = new scope.Group()

  canvasGroup.addChild(postalCanvas)
  canvasGroup.addChild(postalBackground)
  canvasGroup.addChild(content.group)
  canvasGroup.addChild(postalStrokeBackground)

  const group = new scope.Group()
  group.addChild(background)
  group.addChild(postalFrame)
  group.addChild(canvasGroup)

  return {
    group,
    background,
    frame: postalFrame,
    content: {
      point,
      size,
      group: canvasGroup,
      background: postalBackground,
      strokeBackground: postalStrokeBackground,
      postalContent: content
    }
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
const createGUI = (settings: PostalSettings) => {
  const gui = new GUI()
  const folder = gui.addFolder('Postal')
  folder.addColor(settings, 'backgroundColor')
  folder.addColor(settings, 'strokeColor')

  return gui
}

const updateSettings = <T extends PostalContent>(postal: Postal<T>) => {
  const container = document.getElementById('container')
  container!.style.backgroundColor = postal.settings.backgroundColor
  postal.background.fillColor = new paper.Color(postal.settings.backgroundColor)
  postal.frame.strokeColor = new paper.Color(postal.settings.strokeColor)
  postal.content.background.fillColor = new paper.Color(postal.settings.backgroundColor)
  postal.content.strokeBackground.strokeColor = new paper.Color(postal.settings.strokeColor)
}

/**
 * Recording logic
 */
const checkRecording = <T extends PostalContent>(postal: Postal<T>, frame: number) => {
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