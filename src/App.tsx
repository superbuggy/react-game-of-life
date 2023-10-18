import { Component } from "react";
import { map } from "./utils";
import "./App.css";

interface GameState {
  grid: Array<[]>;
  columns: number;
  rows: number;
  frequency: number;
  population: number;
}

type Grid = number[][]
export default class GameOfLife extends Component<GameState> {
  size = 16;

  maxPopIsh = 0.25 * this.size ** 2;
  minPopIsh = 0.1 * this.maxPopIsh; //0.25 * maxPopIsh;
  animationFrame = -1
  // timerId = -1

  state: GameState = {
    grid: [],
    columns: this.size,
    rows: this.size,
    frequency: 4000,
    population: 0,
  };

   make2DArray = (columns: number, rows: number): Grid => {
    return Array.from({ length: columns }, () => Array.from({ length: rows }, () => 0));
};

  countNeighbors = (grid: Array<[]>, x: number, y: number) => {
    const { columns, rows } = this.state;
    let sum = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const column = (x + i + columns) % columns;
        const row = (y + j + rows) % rows;
        if (x === column && y === row) continue;
        sum += grid[column][row];
      }
    }
    // sum -= grid[x][y];
    return sum;
  };

  randomizeGrid = (initialGrid: Grid): Grid => {
    const grid = initialGrid.map((column) => column.slice());
    const rows = initialGrid.length;
    const columns = initialGrid[0].length;
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = Math.floor(Math.random() * 2);
      }
    }
    return grid;
  };

  initGrid = () => {
    const grid = this.randomizeGrid(this.make2DArray(this.state.columns, this.state.rows));
    this.setState(() => ({ grid }));
  };

  countPopulation(grid: Grid) {
    return grid.reduce((tally, row) => tally + row.reduce((tally, cell) => tally + cell, 0), 0);
  }

  nextGridState = () => {
    this.setState(({ grid }: GameState) => {
      const nextGrid = grid.map((row, rowIndex) => {
        return row.map((cell, cellIndex) => {
          const neighbors = this.countNeighbors(grid, rowIndex, cellIndex);
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

  componentDidUpdate() {
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

  // initCycle = () => {
  //   this.timerId = setInterval(this.nextGridState, this.state.frequency)
  // }

  render() {
    const grid = this.state.grid.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        let className = "square";
        const neighbors = this.countNeighbors(this.state.grid, rowIndex, cellIndex);
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
