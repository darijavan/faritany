import React from "react";

const styles = {
  wrapper: {
    position: "relative"
  }
};

function GameBoard(props) {
  return (
    <div
      style={{
        ...props.style,
        ...styles.wrapper,
        width: props.width || 400,
        height: props.height || 500,
        backgroundColor: "white"
      }}
    >
      {props.children}
    </div>
  );
}

export default GameBoard;
