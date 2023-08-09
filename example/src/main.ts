import './style.css'
import * as paper from 'paper'
import { Postal } from 'paper-postal'

interface Content {
  size: paper.Size,
  rectangles: Array<paper.Shape.Rectangle>
}

const draw = (canvasSize: paper.Size): Content => {
  const rectangles = []
  const startX = canvasSize.height * -0.5

  for (let index = 0; index < 4.0; index++) {
    rectangles.push(new paper.Shape.Rectangle({
      center: [0.0, startX + canvasSize.multiply(0.45).width * index],
      size: canvasSize.multiply(0.45),
      strokeColor: '#000',
      fillColor: 'white',
      strokeWidth: 2.5,
    }))
  }
 
 
  return {
    size: canvasSize,
    rectangles
 }
}
 
const animate = (content: Content, _frame: number) => {
  content.rectangles.forEach(r => {
    r.position.y += 2.0

    if (r.position.y >= (r.size.height * 4.0 * 0.5)) {
      r.position.y = r.size.height * 4.0 * -0.5
    }
  })
}

const squarePostal = Postal.create(paper, draw, animate)

document.addEventListener('click', () => {
  Postal.record(squarePostal, 60)
})

document.addEventListener('keyup', () => {
  Postal.capture(squarePostal, Postal.CaptureFormat.SVG)
})
 