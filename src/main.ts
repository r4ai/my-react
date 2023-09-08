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

// Rendering

const createDom = (fiber: Fiber) => {
  const dom =
    fiber.kind === "text"
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      // @ts-ignore: this is safe because name is a key of props
      dom[name] = fiber.props[name];
    });

  return dom;
};

type Fiber = {
  dom: HTMLElement | Text | undefined;
  child?: Fiber | undefined;
  parent?: Fiber | undefined;
  sibling?: Fiber | undefined;
} & MyReactElement;

let nextUnitOfWork: Fiber | undefined = undefined;

export const render = (element: MyReactElement, container: HTMLElement) => {
  nextUnitOfWork = {
    kind: "node",
    type: element.type,
    dom: container,
    props: {
      children: [element],
    },
  };
};

const workLoop: IdleRequestCallback = (deadline) => {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const performUnitOfWork = (fiber: Fiber) => {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  fiber.parent?.dom?.appendChild(fiber.dom);

  // create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: Fiber | undefined = undefined;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber: Fiber =
      element.kind === "text"
        ? {
            kind: "text",
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: undefined,
          }
        : {
            kind: "node",
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: undefined,
          };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      // because we are iterating over the children, we can assume that the previous sibling exists
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  // search for next unit of work
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent!;
  }
};

export default {
  createElement,
  createTextElement,
  render,
};
