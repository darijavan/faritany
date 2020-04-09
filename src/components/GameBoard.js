import React from "react";
import { FaritanyNode } from "../core/Faritany";

class GameBoard extends React.Component {
  /**
   * @param {React.Props} props Props
   */
  constructor(props) {
    super(props);

    this.node = new FaritanyNode(props.options);
    this.state = {
      disposition: this.node.disposition,
      paths: [],
      firstPlayerScore: 0,
      secondPlayerScore: 0
    };
    this.node.on("new-path", (path, isFirstPlayer) => {
      this.setState((state) => ({ paths: [...state.paths, { path, isFirstPlayer }] }));
    });
    this.node.on("score-change", (firstPlayerScore, secondPlayerScore) => {
      this.setState({ firstPlayerScore, secondPlayerScore });
      if (props.onScoreChange)
        props.onScoreChange(firstPlayerScore, secondPlayerScore);
    });
  }

  render() {
    const styles = {
      wrapper: {
        position: 'relative'
      },
      clickOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }
    };

    const { padding, paddingLeft, paddingTop, step, row, column } = this.props.options;

    const dots = [];
    for (let i = 0; i < row * column; i++) {
      const v = this.state.disposition[i];
      if (v)
        dots.push({ isFirstPlayer: Math.abs(v) === 1, row: Math.floor(i / column), column: i % column });
    }

    return (
      <div className="GameBoard">
        <div style={styles.wrapper}>
          <Background
            step={step}
            row={row}
            column={column}
            padding={padding}
            paddingTop={paddingTop || padding}
            paddingLeft={paddingLeft || padding}
            width={(paddingLeft || padding) + column * step}
            height={(paddingTop || padding) + row * step}
            paths={this.state.paths} />
          {dots.map(dot => <Dot size={step / 4} key={dot.row * column + dot.column} data={dot} config={{ padding, paddingTop, paddingLeft, step }} />)}
          <div style={styles.clickOverlay} onClick={this._onClick.bind(this)}></div>
        </div>
      </div>
    );
  }

  /**
   * @param {React.MouseEvent<HTMLDivElement, MouseEvent>} event Mouse event parameter
   */
  _onClick(event) {
    const { padding, paddingLeft, paddingTop, step } = this.props.options;

    const x = event.nativeEvent.offsetX - (paddingLeft || padding),
      y = event.nativeEvent.offsetY - (paddingTop || padding);

    const trigger = .3; // Change this value to change click precision specification
    const row = Math.round(y / step);
    const column = Math.round(x / step);

    if (Math.abs(row - y / step) <= trigger && Math.abs(column - x / step) <= trigger) {
      if (this.node.addPoint(row, column))
        this.setState({ disposition: this.node.disposition });
    }
  }
}

function Dot(props) {
  const { row, column, isFirstPlayer } = props.data;
  const { padding, paddingLeft, paddingTop, step } = props.config;
  const { size } = props;

  const style = {
    left: (paddingLeft || padding) + column * step,
    top: (paddingTop || padding) + row * step,
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div className={`Dot ${isFirstPlayer ? "FirstPlayer" : "SecondPlayer"}`} style={style}></div>
  );
}

class Background extends React.Component {
  /**
   * Init a background element
   * @param {React.Props} props The props
   */
  constructor(props) {
    super(props);

    this.canvasRef = React.createRef();
    this.width = props.width;
    this.height = props.height;
    this.paths = props.paths;
    this.step = props.step;
    this.paddingTop = props.paddingTop || props.padding;
    this.paddingLeft = props.paddingLeft || props.padding;
    this.row = props.row;
    this.column = props.column;
  }

  render() {
    const styles = {
      wrapper: {
        backgroundColor: 'white',
        width: this.width ? `${this.width}px` : '100%',
        height: this.height ? `${this.height}px` : '100%'
      }
    };

    return (
      <div style={styles.wrapper}>
        <canvas style={{ width: "100%", height: "100%" }} ref={this.canvasRef}></canvas>
      </div>
    );
  }

  componentDidMount() {
    this._initBackground(this.canvasRef.current);
  }

  /**
   * Initialize the canvas background element
   * @param {HTMLCanvasElement} canvas The canvas
   */
  _initBackground(canvas) {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this._populateBackground(canvas);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  _populateBackground(canvas) {
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    this._drawLine(
      ctx,
      {
        x: this.paddingLeft || 30,
        y: 0
      },
      {
        x: this.paddingLeft || 30,
        y: canvas.height
      },
      {
        strokeStyle: '#cc0000'
      }
    );

    for (let i = 0; i < this.row; i++) {
      this._drawLine(
        ctx,
        {
          x: 0,
          y: (this.paddingTop || 30) + i * this.step
        },
        {
          x: canvas.offsetWidth,
          y: (this.paddingTop || 30) + i * this.step
        },
        {
          strokeStyle: '#333333'
        }
      );
      for (let j = 1; j < 5; j++) {
        this._drawLine(
          ctx,
          {
            x: 0,
            y: (this.paddingTop || 30) + i * this.step + j * (this.step / 5)
          },
          {
            x: canvas.offsetWidth,
            y: (this.paddingTop || 30) + i * this.step + j * (this.step / 5)
          },
          {
            strokeStyle: '#6f8cde'
          }
        );
      }
    }

    for (let i = 1; i < this.column; i++) {
      this._drawLine(
        ctx,
        {
          x: (this.paddingLeft || 30) + i * this.step,
          y: 0
        },
        {
          x: (this.paddingLeft || 30) + i * this.step,
          y: canvas.offsetHeight,
        },
        {
          strokeStyle: '#333333'
        }
      );
    }

    this.props.paths.forEach(pathObject => {
      ctx.beginPath();
      pathObject.path.forEach((point, index) => {
        if (!index)
          ctx.moveTo(this.paddingLeft + point.column * this.step, this.paddingTop + point.row * this.step)
        else
          ctx.lineTo(this.paddingLeft + point.column * this.step, this.paddingTop + point.row * this.step)
      });

      ctx.lineTo(this.paddingLeft + pathObject.path[0].column * this.step, this.paddingTop + pathObject.path[0].row * this.step)
      ctx.strokeStyle = pathObject.isFirstPlayer ? 'red' : 'black';
      ctx.lineWidth = 2;
      ctx.fillStyle = pathObject.isFirstPlayer ? 'rgba(255, 0, 0, .2)' : 'rgba(0, 0, 0, .2)';

      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    });
  }

  componentDidUpdate() {
    this._populateBackground(this.canvasRef.current);
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx Context
   * @param {{ x: number, y: number }} from 
   * @param {{ x: number, y: number }} to 
   * @param {{ strokeStyle: string, lineWidth: number }} options
   */
  _drawLine(ctx, from, to, options) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = options.strokeStyle || 'white';
    ctx.lineWidth = options.lineWidth || 1;
    ctx.stroke();
    ctx.closePath();
  }
}

export default GameBoard;
