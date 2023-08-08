import './style.css'
import * as paper from 'paper'
import { Postal } from 'paper-postal'

interface Content {
  rectangle: paper.Shape.Rectangle
}

const draw = (canvasSize: paper.Size): Content => {
 const rectangle = new paper.Shape.Rectangle({
   center: [0.0, 0.0],
   size: canvasSize.multiply(0.45),
   strokeColor: '#000',
   fillColor: 'white',
   strokeWidth: 2.5,
 })
 
 
  return {
   rectangle
 }
}
 
const animate = (content: Content, _frame: number) => {
  content.rectangle.rotate(1.5)
}

const squarePostal = Postal.create(paper, draw, animate)

document.addEventListener('click', () => {
  Postal.record(squarePostal, 60)
})

document.addEventListener('keyup', () => {
  Postal.capture(squarePostal, Postal.CaptureFormat.SVG)
})
 