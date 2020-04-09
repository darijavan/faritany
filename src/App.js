import React, { useState } from "react";
import "./App.css";
import GameBoard from "./components/GameBoard";

function App() {
  const [step] = useState(40);

  return (
    <div className="App">
      <GameBoard options={{ row: 30, column: 30, step, padding: 160, paddingTop: 120 }} onScoreChange={(first, second) => console.log(first, second)} />
    </div>
  );
}

export default App;
