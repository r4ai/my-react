import MyReact, { render } from "../../main";

interface Props {
  name: string;
}
const App = (props: Props) => {
  return (
    <div>
      <h1>Hello, {props.name}</h1>
      <p>My react.</p>
    </div>
  );
};

const element = <App name="Function Component" />;
console.log(element);
const container = document.getElementById("root")!;
render(element, container);
