import * as Tone from "tone";
import { useEffect, Component } from "react";
import { map, truncate } from "./utils";
import "./App.css";

interface GameState {
  grid: Array<[]>;
  columns: number;
  rows: number;
  frequency: number;
  population: number;
  hasStarted: boolean;
}

type Grid = number[][];
export default class GameOfLife extends Component {
  size = 7;
  maxPopIsh = 0.25 * this.size ** 2;
  minPopIsh = 0.1 * this.maxPopIsh; //0.25 * maxPopIsh;
  toneLattice = [[0]];
  timerIds: number[] = [];
  synth = new Tone.PolySynth().toDestination();
  state: GameState = {
    grid: [],
    columns: this.size,
    rows: this.size,
    frequency: 1000,
    population: 0,
    hasStarted: false,
  };

  make2DArray = (columns: number, rows: number): Grid => {
    return Array.from({ length: columns }, () => Array.from({ length: rows }, () => 0));
  };

  makeToneLattice = (grid: number[][]): number[][] => {
    const baseFrequency = 110;
    return grid.map((row: number[], rowIndex: number) => {
      const baseRowFrequency = baseFrequency * (3 / 2) ** rowIndex;
      return row.map((_, columnIndex: number) => baseRowFrequency * (5 / 4) ** columnIndex);
    });
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
    const population = this.countPopulation(grid);
    this.toneLattice = this.makeToneLattice(grid);
    this.setState(() => ({ grid, population }));
    // this.setState({ grid });
  };

  countPopulation(grid: Grid) {
    return grid.reduce((tally, row) => tally + row.reduce((tally, cell) => tally + cell, 0), 0);
  }

  playTones = (frequencies: number[]) => {
    const synth = this.synth;
    // const synth = new Tone.PolySynth().toDestination();

    synth.volume.value = map(this.state.population, this.maxPopIsh, -24, -6, this.state.population);
    // synth.triggerAttackRelease(frequencies, '1m');
    const sequence = new Tone.Sequence(
      (time, note) => {
        console.log("beep");

        synth.triggerAttackRelease(note, ".95m", time);
      },
      frequencies,
      `${frequencies.length}n`
    );
    sequence.loop = false;

    // Prevents notes from getting dropped in a sequence
    const now = Tone.now();

    console.log(frequencies, sequence.state);
    return sequence.start(now);

    // synth.triggerRelease(frequencies, now + this.state.frequency / 1000);
    // synth.releaseAll(now + this.state.frequency / 1000);
  };

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
            const negativeEntropy = Math.floor(Math.random() * 1.0002);
            return cell || negativeEntropy;
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
  die() {
    console.log("dying");
    const explosionSynth = new Tone.NoiseSynth({
      volume: -20,
      envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0,
        release: 0.2,
      },
    });

    // Create an instance of Oscillator for the "boom" sound
    const boomOscillator = new Tone.Oscillator({
      type: "square", // Adjust the waveform as needed (sine for a smooth boom)
      frequency: 50, // Adjust the frequency to control the "boom" pitch
      volume: -20, // Adjust the volume as needed
    });

    // Connect the synth and oscillator to the master output
    explosionSynth.toDestination();
    boomOscillator.toDestination();

    // Trigger the explosion sound
    explosionSynth.triggerAttackRelease("4n"); // Adjust the duration as needed
    const now = Tone.now();

    // Trigger the "boom" sound (you can adjust the timing)
    boomOscillator.start(now).stop(now + 0.4); // Adjust the timing as needed
    boomOscillator.frequency.rampTo(20, 0.4);

    // Connect the synth to the master output
    explosionSynth.toDestination();

    // Trigger the explosion sound
    explosionSynth.triggerAttackRelease("4n"); // Adjust the duration as needed
  }

  start() {
    Tone.start();
    this.initGrid();
    Tone.Transport.start();

    // Create an instance of NoiseSynth

    // Create an instance of NoiseSynth for the initial explosion
  }

  stop() {
    Tone.Transport.stop();
  }
  componentDidMount(): void {
    console.log(Tone.Frequency(220).toNotation());
    console.log(Tone.Frequency("C3"));
    const playingEventId = Tone.Transport.scheduleRepeat(() => {
      console.log(this.state.population);
      this.nextGridState();
    }, "1m");

    const animatingEventId = Tone.Transport.scheduleRepeat(() => {
      console.log(this.state.population);
    }, "1m");
    this.timerIds = [playingEventId, animatingEventId];
    this.updateCSS();
  }

  componentWillUnmount(): void {
    this.timerIds.forEach((id) => Tone.Transport.clear(id));
  }

  componentDidUpdate(): void {
    if (this.state.population === 0) {
      this.die();
    }
  }

  playGrid(grid: Grid) {
    const notesToPlay: number[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell === 1) notesToPlay.push(this.toneLattice[rowIndex][cellIndex]);
      });
    });
    return this.playTones(notesToPlay);
  }

  updateCSS = () => {
    document.documentElement.style.setProperty("--cell-size", `${100 / this.state.rows}%`);
    // const hue = map(this.minPopIsh, this.maxPopIsh * 0.7, 268 * 1.3, 154, this.state.population);
    // const light = map(this.minPopIsh, this.maxPopIsh, 15, 35, this.state.population);
    // document.documentElement.style.setProperty("--background-color", `hsl(${hue}, 78%, ${light}%)`);
  };

  togglePlay = () => {
    this.setState(
      ({ hasStarted }: GameState) => ({ hasStarted: !hasStarted }),
      () => {
        if (this.state.hasStarted) this.start();
      }
    );
  };

  render() {
    const grid = this.state.grid.map((row, rowIndex) => {
      return row.map((cell, cellIndex) => {
        let className = "square";
        const neighbors = this.countNeighbors(this.state.grid, rowIndex, cellIndex);
        if (cell === 0 && neighbors === 3) {
          className += " being-born";
        } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
          className += " dying";
        } else if (cell) {
          className += " alive";
        }
        return (
          <div key={`${rowIndex} ${cellIndex}`} className={className}>
            {truncate(this.toneLattice[rowIndex]?.[cellIndex])}
          </div>
        );
      });
    });

    const button = (
      <div className="start-button" onClick={this.togglePlay}>
        <span>Start</span>
      </div>
    );

    return (
      <>
        <div className={"cells-container"}>{this.state.hasStarted ? grid : button}</div>
        <p>{this.state.population}</p>
      </>
    );
  }
}
