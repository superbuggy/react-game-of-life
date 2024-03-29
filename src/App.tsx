import * as Tone from "tone";
import { useEffect, useState, useRef, FC } from "react";
import { map, make2DArray, centsOff, noteHz } from "./utils";
import "./App.css";

type Grid = number[][];
interface GameState {
  grid: Grid;
  columns: number;
  rows: number;
  frequency: number;
  population: number;
  generation: number;
  hasStarted: boolean;
}

const countNeighbors = (grid: Grid, x: number, y: number) => {
  const [columns, rows] = [grid[0].length, grid.length];
  let sum = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      // The % operator treats opposing edges as being connected,
      // like a sphere or a wrap-around plane...
      const column = (x + i + columns) % columns;
      const row = (y + j + rows) % rows;
      if (x === column && y === row) continue;
      sum += grid[column][row];
    }
  }
  return sum;
};

const GameOfLife: FC = () => {
  const size: number = 7;
  const maxPopIsh: number = 0.5 * size ** 2;
  const [state, setState] = useState<GameState>({
    grid: make2DArray(size, size),
    columns: size,
    rows: size,
    frequency: 1000, //TODO: link to tempo/bpm
    population: 0,
    generation: 1,
    hasStarted: false,
  });

  // Refs
  const synths = useRef<object[]>([]);
  const filter = useRef(new Tone.Filter(4000, "lowpass", -24).toDestination());
  const playingEventId = useRef<number>(-1);

  const randomizeGrid = (initialGrid: Grid): Grid => {
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

  const initializeGrid = () => {
    const grid = randomizeGrid(make2DArray(state.columns, state.rows));
    const population = countPopulation(grid);
    setState((priorState) => ({ ...priorState, grid, population }));
  };

  const countPopulation = (grid: Grid) => {
    return grid.reduce(
      (tally, row) => tally + row.reduce((tally, cell) => tally + cell, 0),
      0
    );
  };

  // Setup
  useEffect(() => {
    const nextGridState = () => {
      const nextGrid = (grid: Grid) =>
        grid.map((row, rowIndex) => {
          return row.map((cell, cellIndex) => {
            const neighbors = countNeighbors(grid, rowIndex, cellIndex);
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
      setState(({ grid: currentGrid, generation, ...prevState }: GameState) => {
        const newGrid = nextGrid(currentGrid);
        const population = countPopulation(newGrid);

        return {
          ...prevState,
          grid: newGrid,
          population,
          generation: generation + 1,
        };
      });
    };

    playingEventId.current = Tone.Transport.scheduleRepeat(
      () => {
        nextGridState();
      },
      "1m",
      "1m"
    );
    return () => {
      Tone.Transport.clear(playingEventId.current);
    };
  }, []);

  // Handle extinction
  useEffect(() => {
    if (state.hasStarted && state.population === 0) {
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
        type: "square",
        frequency: 50,
        volume: -20,
      });

      explosionSynth.toDestination();
      boomOscillator.toDestination();

      const now = Tone.now();

      boomOscillator.start(now).stop(now + 0.4);
      boomOscillator.frequency.rampTo(20, 0.4);
      explosionSynth.triggerAttackRelease("4n", now);

      Tone.Transport.stop();
      setState((priorState) => ({ ...priorState, hasStarted: false }));
      Tone.Transport.clear(playingEventId.current);
    }
  }, [state.population, state.hasStarted]);

  const start = () => {
    Tone.start();
    initializeGrid();
    Tone.Transport.start();
    setState((priorState) => ({ ...priorState, hasStarted: true }));
  };

  const makeToneLattice = (grid: number[][]): number[][] => {
    const baseFrequency = 110;
    return grid.map((row: number[], rowIndex: number) => {
      const baseRowFrequency = baseFrequency * (3 / 2) ** rowIndex;
      return row.map(
        (_, columnIndex: number) => baseRowFrequency * (5 / 4) ** columnIndex
      );
    });
  };
  const toneLattice: Grid = makeToneLattice(make2DArray(size, size));

  useEffect(() => {
    const playTones = (frequencies: number[]) => {
      const synth: Tone.PolySynth = new Tone.PolySynth(); //.toDestination();
      synth.connect(filter.current);
      synths.current.push({ synth, generation: state.generation });
      console.log(synths);
      if (synths.current.length === 3) {
        const freedSynth = synths.current.shift();
        // @ts-ignore
        if (freedSynth !== synth) freedSynth?.synth.dispose(); 
      }
      synth.volume.value = -24; //map(1, maxPopIsh, -21, -24, state.population);
      const velocity = map(0, 1, 0.3, 1, 1 / frequencies.length);
      const duration = `${map(1, maxPopIsh, 1, 0.333, frequencies.length)}m`;
      const sequence = new Tone.Sequence(
        (time, note) => {
          console.log(synth)          
          // @ts-ignore
          if (!synth._wasDisposed) synth.triggerAttackRelease(note, duration, time, velocity);
        },
        frequencies,
        `${frequencies.length}n`
      );
      sequence.loop = false;
      return sequence.start();
    };

    const playGrid = (grid: Grid) => {
      const notesToPlay: number[] = [];
      grid.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          if (cell === 1) notesToPlay.push(toneLattice[rowIndex][cellIndex]);
        });
      });
      return playTones(notesToPlay);
    };
    playGrid(state.grid);
  }, [state.grid, maxPopIsh, state.population, toneLattice]);

  const cellLabel = (rowIndex: number, cellIndex: number) => {
    const note = noteHz(toneLattice[rowIndex]?.[cellIndex]);
    const nextNoteHigher = noteHz(
      toneLattice[rowIndex]?.[cellIndex] * 2 ** (1 / 12)
    );
    const cents = centsOff(toneLattice[rowIndex]?.[cellIndex]);
    return {
      note: cents <= -50 ? nextNoteHigher : note,
      cents: cents === 0 ? "" : cents < 0 ? cents : `+${cents}`,
    };
  };

  const gridElements = state.grid.map((row, rowIndex) => {
    return row.map((cell, cellIndex) => {
      let className = "square";
      const neighbors = countNeighbors(state.grid, rowIndex, cellIndex);
      if (cell === 0 && neighbors === 3) {
        className += " being-born";
      } else if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
        className += " dying";
      } else if (cell) {
        className += " alive";
      }
      return (
        <div key={`${rowIndex} ${cellIndex}`} className={className}>
          <span>
            {cellLabel(rowIndex, cellIndex).note}
            <sup>{cellLabel(rowIndex, cellIndex).cents}</sup>
          </span>
        </div>
      );
    });
  });

  const buttonElement = (
    <div className="start-button" onClick={start}>
      <span>Start</span>
    </div>
  );

  return (
    <>
      <div className={"cells-container"}>
        {state.hasStarted ? gridElements : buttonElement}
      </div>
    </>
  );
};

export default GameOfLife;
