import React from "react";
import "./App.css";
import GameBoard from "./components/GameBoard";

function App() {
  return (
    <div className="App">
      <GameBoard style={{ margin: "20px auto" }}>Hello World!</GameBoard>
    </div>
  );
}

export default App;
