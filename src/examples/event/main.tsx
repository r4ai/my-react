import MyReact, { render } from "../../main";

const container = document.getElementById("root")!;

const updateValue = (e: InputEvent) => {
  rerender((e.target as HTMLInputElement).value);
};

const rerender = (value: string) => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  );
  console.log(element);
  MyReact.render(element, container);
};

rerender("World");
