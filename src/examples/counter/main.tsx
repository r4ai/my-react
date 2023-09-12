import MyReact, { render, useState } from "../../main";

interface Props {
  name: string;
}
const App = (props: Props) => {
  const [count, setCount] = useState(0);
  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);
  return (
    <div>
      <h1>Hello, {props.name}</h1>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};

const element = <App name="Function Component" />;
console.log(element);
const container = document.getElementById("root")!;
render(element, container);
