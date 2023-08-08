# Paper-Postal

This tiny library offers a quick setup to easily create and export SVG drawings and animations 🎨👨‍🎨 

- 🖼️ Automatically setup a canvas
- 🔧 Configures Paper.js easily
- 🖌️ Easy API to draw and animate elements
- 📸 Capture your draws as SVG, PNG or JPG
- 📹 Record your animations and export them as GIF, WEBM or PNG frames
- 🔄 Export perfect loop animations quick and simple


## Installation

```shell
> npm i paper-postal
```

Import it using

```javascript
import { Postal } from 'paper-postal'
```

## Usage
```javascript
import * as paper from 'paper'
import { Postal } from 'paper-postal'

// A function to draw everything you want
const draw = (canvasSize)  => {
  const square = new paper.Shape.Rectangle({
    center: [0.0, 0.0],
    size: canvasSize.multiply(0.45),
    strokeColor: '#000',
    fillColor: 'white',
    strokeWidth: 2.5,
  })
 
 // Return elements you want to manipulate in your animation
  return {
   square
  }
}
 
// A function to animate everything you drew
const animate = (content, _frame) => {
  content.square.rotate(1.5)
}
 
// Create your Paper-Postal
const squarePostal = Postal.create(paper, draw, animate)

document.addEventListener('click', () => {
  // Record 60 frames and export it as a GIF
  Postal.record(squarePostal, 60, Postal.RecordFormat.GIF)
})

document.addEventListener('keyup', () => {
  // Captur the current frame and export it as SVG
  Postal.capture(squarePostal, Postal.CaptureFormat.SVG)
})
```

## Acknowledgments

- [paper.js](http://paperjs.org/reference/global/)
- [lil-gui](https://lil-gui.georgealways.com/)
- [canvas-capture](https://github.com/amandaghassaei/canvas-capture)