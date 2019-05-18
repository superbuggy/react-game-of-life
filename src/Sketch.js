import React, { Component } from 'react'
import p5 from 'p5'
import createSketch from './p5-sketch'

export default class Sketch extends Component {

  state = {
    p5Instance: null
  }

  componentDidMount() {
    const p5Main = createSketch(this.props.width, this.props.height)
    const p5Instance = new p5(p5Main, this.props.canvasId)
    this.setState({p5Instance})
  }
  
  render() {

    const style = {
      minHeight:`${this.props.height}px`,
      maxHeight:`${this.props.height}px`,
      minWidth:`${this.props.width}px`,
      maxWidth:`${this.props.width}px`,
    }
    return (
      <div id={this.props.canvasId} style={style}>

      </div>
   )
}
}
