import React, { Component } from "react";
import { map } from "./utils";
import './App.css'

export default class GameOfLife extends Component {
  constructor(props) {
    super(props);

    const RESOLUTION = 64;
    const maxPopIsh = 0.25 * RESOLUTION ** 2;
    const minPopIsh = 0.1 * maxPopIsh; //0.25 * maxPopIsh

    this.state = {
      grid: [],
      columns: RESOLUTION,
      rows: RESOLUTION,
      timerId: null,
      freqeuncy: 1000 / 60,
      population: 0,
    };

    this.maxPopIsh = maxPopIsh;
    this.minPopIsh = minPopIsh;
  }

  make2DArray = (columns, rows) =>
    Array.from({ length: columns }).map((column) => Array.from({ length: rows }).fill(0));

  countNeighbors = (grid, x, y) => {
    const { columns, rows } = this.state;
    let sum = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let col = (x + i + columns) % columns;
        let row = (y + j + rows) % rows;
        if (x === col && y === row) continue;
        sum += grid[col][row];
      }
    }
    // sum -= grid[x][y];
    return sum;
  };

  randomizeGrid = (_grid) => {
    const grid = _grid.slice().map((col) => col.slice());
    const { rows, columns } = this.state;
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = Math.floor(Math.random() * 2);
      }
    }
    return grid;
  };

  initGrid = () => {
    const grid = this.randomizeGrid(this.make2DArray(this.state.columns, this.state.rows));
    this.setState((prevState) => ({ grid }));
  };

  countPopulation(grid) {
    return grid.reduce((tally, row) => tally + row.reduce((tally, cell) => tally + cell, 0), 0);
  }

  nextGridState = () => {
    this.setState(({ rows, columns, grid }) => {
      const nextGrid = grid.map((row, rowIndex) => {
        return row.map((cell, cellIndex) => {
          let neighbors = this.countNeighbors(grid, rowIndex, cellIndex);
          if (cell === 0 && neighbors === 3) {
            return 1;
          } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
            return 0;
          } else {
            const NEGATIVE_ENTROPY = Math.floor(Math.random() * 1.0002);
            return cell || NEGATIVE_ENTROPY;
          }
        });
      });

      const population = this.countPopulation(nextGrid);

      return {
        grid: nextGrid,
        population,
      };
    });
  };

  componentDidMount() {
    this.initGrid();
    // this.initCycle()
    this.initAnimation();
    this.updateCSS();
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateCSS();
  }

  updateCSS = () => {
    document.documentElement.style.setProperty("--cell-size", `${100 / this.state.rows}%`);
    const hue = map(this.minPopIsh, this.maxPopIsh * 0.7, 268 * 1.3, 154, this.state.population);
    const light = map(this.minPopIsh, this.maxPopIsh, 15, 35, this.state.population);
    document.documentElement.style.setProperty("--background-color", `hsl(${hue}, 78%, ${light}%)`);
  };

  initAnimation = () => {
    this.animationFrame = requestAnimationFrame(this.initAnimation);
    this.nextGridState();
  };

  initCycle = () => {
    this.setState((prevState) => ({
      timerId: setInterval(this.nextGridState, prevState.freqeuncy),
    }));
  };

  render() {
    const grid = this.state.grid.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        let className = "square";
        let neighbors = this.countNeighbors(this.state.grid, rowIndex, cellIndex);
        if (cell === 0 && neighbors === 3) {
          className += " on-deck";
        } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
          className += " dying";
        } else if (cell) {
          className += " active";
        }
        return <div key={`${rowIndex} ${cellIndex}`} className={className} />;
      });
    });

    return (
      <div>
        <div className={"cells-container"} onClick={this.initGrid}>
          {grid}
        </div>
      </div>
    );
  }
}
