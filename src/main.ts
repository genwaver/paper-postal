import './style.css'
import * as paper from 'paper'
import * as Postal from './postal'

interface MainContent extends Postal.PostalContent {
  group: paper.Group
  rectangle: paper.Path
}

const draw = (point: paper.Point, size: paper.Size): MainContent => {
  const group = new paper.Group()
  const rectangle = new paper.Path.Rectangle({
    point: point.add(size.multiply(0.5)).subtract(250.0), 
    size: [500, 500],
    strokeColor: '#b338ff',
    fillColor: 'white',
    strokeWidth: 2.5,
    radius: 8.0
  })

  group.addChild(rectangle)

  return {
    group,
    rectangle
  }
}

const animate = (content: MainContent) => {
  content.rectangle.rotate(1.0)
}

Postal.create<MainContent>(draw, animate)