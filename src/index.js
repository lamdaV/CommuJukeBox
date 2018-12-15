import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

const ioHost = process.env.REACT_APP_IO_HOST;
const ioPort = process.env.REACT_APP_IO_PORT;
const ioAddr = `${ioHost}:${ioPort}`;
ReactDOM.render(<App ioAddr={ioAddr}/>, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
