import MyReact, { render } from "../../main";

const element = (
  <div>
    <h1>Hello, World</h1>
    <p>Hi, I'm MyReact</p>
  </div>
);

console.log(element);

const container = document.getElementById("root")!;
render(element, container);
