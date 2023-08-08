import './style.css'
import * as paper from 'paper'
import * as Postal from 'paper-postal'

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
 
Postal.create(paper, draw, animate)