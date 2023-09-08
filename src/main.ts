import { todo } from "./utils";

type ElementKind = "text" | "node";

type Element = {
  kind: ElementKind;
  type: string;
  props: {
    [key in string]: unknown;
  };
};

type TextElement = {
  kind: "text";
  type: "TEXT_ELEMENT";
  props: {
    nodeValue: string;
    children: never[];
  };
} & Element;

type NodeElement = {
  kind: "node";
  type: Capitalize<string> | keyof HTMLElementTagNameMap;
  props: {
    children: MyReactElement[];
  };
} & Element;

export type MyReactElement = TextElement | NodeElement;

export const createElement = (
  type: Capitalize<string> | keyof HTMLElementTagNameMap,
  props?: object | null,
  ...children: MyReactElement[]
): MyReactElement => ({
  kind: "node",
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === "string" ? createTextElement(child) : child
    ),
  },
});

export const createTextElement = (text: string): TextElement => ({
  kind: "text",
  type: "TEXT_ELEMENT",
  props: {
    nodeValue: text,
    children: [],
  },
});

export const render = (
  element: MyReactElement,
  container: HTMLElement | Text
) => {
  const dom =
    element.kind === "text"
      ? document.createTextNode(element.props.nodeValue)
      : document.createElement(element.type);

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      // @ts-ignore: this is safe because name is a key of props
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => render(child, dom));

  container.appendChild(dom);
};

export default {
  createElement,
  createTextElement,
  render,
};
