export class FaritanyNode {
  /**
   * Initialize a new Faritany Node
   * @param {{ row: number, column: number }} options Options
   */
  constructor(options) {
    this._rowNumber = options.row || 30;
    this._columnNumber = options.column || 30;

    this.disposition = new Array(options.column * options.row);
    for (let i = 0; i < this.disposition.length; i++)
      this.disposition[i] = 0;

    this.isFirstPlayerTurn = true;

    this.firstPlayerScore = 0;
    this.secondPlayerScore = 0;

    this._listeners = new Array(5);
  }

  /**
   * Add event listener
   * @param {"new-path" | "game-over" | "new-point" | "switch-turn" | "score-change"} event
   * @param {Function} callback
   */
  on(event, callback) {
    switch (event) {
      case "new-path":
        this._listeners[0] = callback;
        break;

      case "game-over":
        this._listeners[1] = callback;
        break;

      case "new-point":
        this._listeners[2] = callback;
        break;

      case "switch-turn":
        this._listeners[3] = callback;
        break;

      case "score-change":
        this._listeners[4] = callback;
        break;

      default:
        throw new Error("Invalid channel type");
    }
  }

  /**
   * Emit an event
   * @param {"new-path" | "game-over" | "new-point" | "switch-turn" | "score-change"} event
   * @param  {...any} params 
   */
  _emit(event, ...params) {
    switch (event) {
      case "new-path":
        if (this._listeners[0])
          this._listeners[0](...params);
        break;

      case "game-over":
        if (this._listeners[1])
          this._listeners[1](...params);
        break;

      case "new-point":
        if (this._listeners[2])
          this._listeners[2](...params);
        break;

      case "switch-turn":
        if (this._listeners[3])
          this._listeners[3](...params);
        break;

      case "score-change":
        if (this._listeners[4])
          this._listeners[4](...params);
        break;

      default:
        throw new Error("Invalid channel type");
    }
  }

  /**
   * @param {number} row 
   * @param {number} column 
   * @param {number} value
   */
  _setPoint(row, column, value) {
    if (row === undefined || column === undefined)
      throw new Error("The row and column parameters must be set");

    if (value === undefined)
      throw new Error("The value to be set must be provided");

    this.disposition[row * this._columnNumber + column] = value;
  }

  addPoint(row, column) {
    if (!this.disposition[row * this._columnNumber + column]) {
      try {
        this._setPoint(row, column, this.isFirstPlayerTurn ? 1 : 2);
      } catch (error) {
        return false;
      }
      this._checkForFaritanyFrom(row, column);
      this._emit("new-point", { row, column });
      return true;
    }
    return false;
  }

  /**
   * @param {Array<{row: number, column: number}>} path 
   * @returns {Array<{row: number, column: number}>}
   */
  _getOpponentPointsWithinFaritany(path) {
    const opponents = [];

    let mRow = 0,
      mColumn = 0;
    path.forEach(p => {
      mRow += p.row;
      mColumn += p.column;
    });
    mRow = Math.round(mRow / path.length);
    mColumn = Math.round(mColumn / path.length);
    if (path.filter(p => p.row === mRow && p.column === mColumn).length)
      return opponents;

    const queue = [{ row: mRow, column: mColumn }];
    const visited = new Array(this._columnNumber * this._rowNumber);
    for (let i = 0; i < visited.length; i++)
      visited[i] = false;

    while (queue.length) {
      const { row, column } = queue.pop();
      visited[row * this._columnNumber + column] = true;
      const value = this.getPoint(row, column);

      if (value > 0
        && value !== (this.isFirstPlayerTurn ? 1 : 2))
        opponents.push({ row, column });

      // DOWN
      if (row + 1 < this._rowNumber
        && !visited[(row + 1) * this._columnNumber + column]
        && !path.filter(p => p.row === row + 1 && p.column === column).length)
        queue.push({ row: row + 1, column });

      // UP
      if (row - 1 >= 0
        && !visited[(row - 1) * this._columnNumber + column]
        && !path.filter(p => p.row === row - 1 && p.column === column).length)
        queue.push({ row: row - 1, column });

      // RIGHT
      if (column + 1 < this._columnNumber
        && !visited[row * this._columnNumber + column + 1]
        && !path.filter(p => p.row === row && p.column === column + 1).length)
        queue.push({ row, column: column + 1 });

      // LEFT
      if (column - 1 >= 0
        && !visited[row * this._columnNumber + column - 1]
        && !path.filter(p => p.row === row && p.column === column - 1).length)
        queue.push({ row, column: column - 1 });
    }

    return opponents;
  }

  /**
   * @param {number} row 
   * @param {number} column 
   */
  _checkForFaritanyFrom(row, column) {
    const paths = this._traverse({ row, column });
    if (!paths.length)
      this._switchTurn();
    else {
      let hasFaritany = false;
      paths.forEach(path => {
        let opponents = this._getOpponentPointsWithinFaritany(path);
        if (opponents.length) {
          if (this.isFirstPlayerTurn)
            this.firstPlayerScore += opponents.length;
          else
            this.secondPlayerScore += opponents.length;

          opponents.forEach(p => {
            this._setPoint(p.row, p.column, -this.getPoint(p.row, p.column));
          });
          this._emit("new-path", path, this.isFirstPlayerTurn);
          this._emit("score-change", this.firstPlayerScore, this.secondPlayerScore);
          hasFaritany = true;
        }
      });
      if (!hasFaritany)
        this._switchTurn();
    }
  }

  /**
   * 
   * @param {{row: number, column: number}} root 
   */
  _traverse(root) {
    const path = [];
    const paths = [];

    const visited = new Array(this._columnNumber * this._rowNumber);
    for (let i = 0; i < visited.length; i++)
      visited[i] = false;

    this._traverseFromRecursive(root, root, paths, visited, path);
    return paths.sort((a, b) => a.length - b.length);
  }

  // /**
  //  * @param {number} row 
  //  * @param {number} column 
  //  */
  // _traverseFrom(row, column) {
  //   const paths = [];
  //   const visited = new Array(this._rowNumber * this._columnNumber);
  //   for (let i = 0; i < visited.length; i++)
  //     visited[i] = false;

  //   let path = [];
  //   path.push({ row, column });
  //   visited[row * this._columnNumber + column] = true;

  //   let queue = this._neighbours(row, column);
  //   while (queue.length) {
  //     const point = queue.pop();
  //     path.push({ row: point.row, column: point.column });

  //     if (visited[point.row * this._columnNumber + point.column])
  //       continue;

  //     visited[point.row * this._columnNumber + point.column] = true;

  //     let neighbours = this._neighbours(point.row, point.column);
  //     if (path.length >= 4
  //       && neighbours.filter(p => p.row === row && p.column === column).length === 1
  //     ) {
  //       paths.push([...path]);
  //     }

  //     neighbours = neighbours.filter(p => !visited[p.row * this._columnNumber + p.column]);
  //     if (!neighbours.length)
  //       path.pop();
  //     else
  //       queue = [...queue, ...neighbours];
  //   }
  //   return paths.sort((a, b) => a.length - b.length);
  // }

  _traverseFromRecursive(root, point, paths = [], visited = [], path = []) {
    const { row, column } = point;
    path.push(point);

    const neighbours = this._neighbours(row, column);

    if (path.length >= 4
      && neighbours.filter(p => p.row === root.row && p.column === root.column).length === 1)
      paths.push([...path]);

    visited[row * this._columnNumber + column] = true;

    neighbours.filter(p => !visited[p.row * this._columnNumber + p.column]).forEach(p => this._traverseFromRecursive(root, p, paths, visited, path))

    visited[row * this._columnNumber + column] = false;
    path.pop();
  }

  _switchTurn() {
    this.isFirstPlayerTurn = !this.isFirstPlayerTurn;
  }

  /**
   * @param {number} row 
   * @param {number} column 
   * @returns {number}
   */
  getPoint(row, column) {
    return this.disposition[row * this._columnNumber + column];
  }

  /**
   * @param {number} row 
   * @param {number} column 
   * @returns {Array<{row: number, column: number}>}
   */
  _neighbours(row, column) {
    let neighbours = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if ((i !== 0 || j !== 0)
          && column - i >= 0
          && column - i < this._columnNumber
          && row - j >= 0
          && row - j < this._rowNumber
          && this.getPoint(row - j, column - i) === this.getPoint(row, column))
          neighbours.push({ row: row - j, column: column - i })
      }
    }
    return neighbours;
  }
}