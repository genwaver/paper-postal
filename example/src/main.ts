import './style.css'
import * as paper from 'paper'
import * as Postal from 'paper-postal'
import GUI from 'lil-gui'

interface MainContent {
  rectangle: paper.Shape
}

let content: MainContent | undefined = undefined

const draw = (_point: paper.Point, size: paper.Size) => {
  const rectangle = new paper.Shape.Rectangle({
    center: [0.0, 0.0],
    size: [500, 500],
    strokeColor: '#b338ff',
    fillColor: 'white',
    strokeWidth: 2.5,
    radius: 8.0
  })


  content = {
    rectangle
  }
}

const animate = (_event: number) => {
  if (content) {
    content.rectangle.rotate(1.0)
  }
}

const postal = Postal.create(paper, draw, animate)

const settings = {
  record: () => {
    console.log('Record')
    Postal.record(postal, 30)
  }
}
const gui = new GUI()
gui.add(settings, 'record')