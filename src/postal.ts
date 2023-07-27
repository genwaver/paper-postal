import * as paper from 'paper'
import GUI from 'lil-gui'

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
  gui: GUI
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
  shadowBlur: number
}

export interface PostalParams {
  previewSize?: paper.Size
  postalSize?: paper.Size
  exportScale?: number
  frameColor?: string,
  strokeColor?: string,
  backgroundColor?: string
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
  shadowBlur: 8.0
}

export const create = <T extends PostalContent>(
  onDraw: (point: paper.Point, size: paper.Size) => T, 
  onAnimate: (content: T) => void,
  settings?: PostalParams): Postal<T> => {

  const finalSettings = {...defaultSettings, ...settings}
  const canvas = setupCanvas(finalSettings)
  const postalElements = drawPostal<T>(paper.view, onDraw, finalSettings)
  const gui = createGUI(finalSettings)

  const postal: Postal<T> = {
    ...canvas,
    ...postalElements,
    view: paper.view,
    settings: finalSettings,
    gui
  }

  paper.view.onFrame = (event: any) => {
    updateSettings(postal)
    onAnimate(postal.content.postalContent)
    drawPreview(canvas, finalSettings)
  }

  return postal
}

const updateSettings = <T extends PostalContent>(postal: Postal<T>) => {
  const container = document.getElementById('container')
  container!.style.backgroundColor = postal.settings.backgroundColor
  postal.background.fillColor = new paper.Color(postal.settings.backgroundColor)
  postal.frame.strokeColor = new paper.Color(postal.settings.strokeColor)
  postal.content.background.fillColor = new paper.Color(postal.settings.backgroundColor)
  postal.content.strokeBackground.strokeColor = new paper.Color(postal.settings.strokeColor)
}

const drawPostal = <T extends PostalContent>(view: paper.View, draw: (point: paper.Point, size: paper.Size) => T, settings: PostalSettings) => {
  const background = new paper.Path.Rectangle({
    point: [0, 0],
    size: view.size.clone(),
    fillColor: settings.backgroundColor,
  })

  const postalFrameOffset = (view.size.width - view.size.width * settings.postalFrameOffsetFactor) * 0.5
  const postalFrameSize = view.size.subtract(postalFrameOffset * 2.0)
  const postalFramePoint = new paper.Point(postalFrameOffset, postalFrameOffset)

  const postalFrame = new paper.Path.Rectangle({
    point: postalFramePoint,
    size: postalFrameSize,
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    fillColor: settings.frameColor,
    radius: settings.postalFrameRadius,
    shadowColor: '#00000026',
    shadowBlur: settings.shadowBlur,
    shadowOffset: new paper.Point(8.0, 8.0)
  })

  const canvasOffset = postalFrameSize.width * settings.postalFrameSizeFactor * 0.5
  const point = postalFramePoint.add(canvasOffset)
  const size = postalFrameSize.subtract(canvasOffset * 2.0)

  const postalCanvas = new paper.Path.Rectangle({
    point: point.add(settings.strokeWidth * 0.5),
    size: size.subtract(settings.strokeWidth * 2.0 * 0.5),
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius
  })

  postalCanvas.clipMask = true

  const postalBackground = new paper.Path.Rectangle({
    point,
    size,
    fillColor: settings.backgroundColor,
    radius: settings.postalFrameRadius
  })

  const postalStrokeBackground = new paper.Path.Rectangle({
    point: point.add(settings.strokeWidth),
    size: size.subtract(settings.strokeWidth * 2.0),
    strokeColor: settings.strokeColor,
    strokeWidth: settings.strokeWidth,
    radius: settings.postalFrameRadius
  })


  background.sendToBack()

  const content = draw(point, size)
  const canvasGroup = new paper.Group()

  canvasGroup.addChild(postalCanvas)
  canvasGroup.addChild(postalBackground)
  canvasGroup.addChild(content.group)
  canvasGroup.addChild(postalStrokeBackground)

  const group = new paper.Group()
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

const drawPreview = ({preview, canvas}: {preview: HTMLCanvasElement, canvas: HTMLCanvasElement}, settings: PostalSettings) => { 
  const ctx = preview.getContext('2d')
  const canvasWidth = settings.postalSize.width * settings.exportScale * window.devicePixelRatio
  const canvasHeight = settings.postalSize.height * settings.exportScale * window.devicePixelRatio
  ctx?.drawImage(canvas, 0, 0, canvasWidth, canvasHeight, 0, 0, settings.previewSize.width * window.devicePixelRatio, settings.previewSize.height * window.devicePixelRatio)
}

const setupCanvas = (settings: PostalSettings) : { preview: HTMLCanvasElement, canvas: HTMLCanvasElement } => {
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

  paper.setup(canvas)

  return {
    preview,
    canvas
  }
}

const createGUI = (settings: PostalSettings) => {
  const gui = new GUI()
  const folder = gui.addFolder('Postal')
  folder.addColor(settings, 'backgroundColor')
  folder.addColor(settings, 'strokeColor')

  return gui
}
