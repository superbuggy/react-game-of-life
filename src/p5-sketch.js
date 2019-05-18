export default function createP5Main (width, height, props) {
  return function p5Main ($p5) {
    const lines = () => {
      const DEGREE = 1 / 12
      const LINES = 12
      const HORIZON_Y = $p5.windowHeight * 2 / 3
      
      $p5.stroke(255, 0, 0)
      
      for (let i = 0; i < LINES; ++i) {
        let y = HORIZON_Y + i * $p5.windowHeight / 3 / LINES
        for (let x = 0; x < $p5.windowWidth; ++x) {
          y += $p5.sin($p5.random(x * $p5.PI / 12))
          $p5.point(x, y)
        }
      } 
    }
    $p5.props = props
    $p5.setup = () => {
      $p5.createCanvas(window.innerWidth, window.innerHeight)
      $p5.background(0, 0, 0)
    }
    $p5.draw = () => {
      $p5.push()
      $p5.background(0, 0, 0, $p5.random(12, 30))
      lines()
      $p5.pop()
    }
    
  }
} 