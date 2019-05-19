import React, { Component } from 'react'

export default class GameOfLife extends Component {

  constructor (props) {
    super(props)
    const RESOLUTION = 40
    this.state = {
      grid: [],
      columns: RESOLUTION,
      rows: RESOLUTION,
    }
  }

  make2DArray = (columns, rows) => Array
  .from({ length: columns })
  .map( column => Array.from({ length: rows }).fill(0) )


  countNeighbors = (grid, x, y) => {
    const { columns, rows } = this.state
    let sum = 0;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        let col = (x + i + columns) % columns;
        let row = (y + j + rows) % rows;
        sum += grid[col][row];
      }
    }
    sum -= grid[x][y];
    return sum;
  }

  randomizeGrid = _grid => {
    const grid = _grid.slice().map(col => col.slice())
    const { rows, columns } = this.state
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = Math.floor(Math.random() * 2);
      }
    }
    return grid
  }

  initGrid = nextGridState => {
     const grid = nextGridState 
      ? nextGridState
      : this.randomizeGrid(this.make2DArray(this.state.columns, this.state.rows))
    this.setState( prevState => ({ grid }) )
  }

  nextGridState = () => {
    this.setState( ({ rows, columns, grid }) => ({
      grid: grid.map( (row, rowIndex) => {
        return row.map( (cell, cellIndex) => {
          let neighbors = this.countNeighbors(grid, rowIndex, cellIndex)
          if (cell === 0 && neighbors === 3) {
            return 1;
          } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
            return 0;
          } else {
            return cell;
          }
        })
      })
    }))

  }


  componentDidMount() {
    this.initGrid()
  }

  render() {

    const grid = this.state.grid.map( (row, rowIndex) => {
      return row.map( (cell, cellIndex) => {
        let className = 'square'
        let neighbors = this.countNeighbors(this.state.grid, rowIndex, cellIndex)
        if (cell === 0 && neighbors === 3) {
          className += ' on-deck'
        } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
          className += ' dying'
        } else if (cell) {
          className += ' active'
        }
        return <div key={`${rowIndex} ${cellIndex}`} className={className} />
      })
    })

    return (
      <div>
        <button onClick={this.nextGridState}>+</button>
      <div className={'cells-container'}>
        {grid}
      </div>
      </div>
   )
}
}
