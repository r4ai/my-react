import { todo } from "./utils";

type ElementKind = "text" | "node";

type Element = {
  kind: ElementKind;
  type: string | Function;
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
      typeof child !== "object" ? createTextElement(child) : child
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

// Hooks

export const useState = <T>(
  initial: T
): [T, (action: StateAction<T>) => void] => {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | Hook<T>
    | undefined;
  const hook: Hook<T> = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action: StateAction<T>) => {
    hook.queue.push(action);
    if (!currentRoot) throw new Error("currentRoot is undefined");
    wipRoot =
      currentRoot.kind === "node"
        ? {
            kind: "node",
            type: currentRoot.type,
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
          }
        : {
            kind: "text",
            type: "TEXT_ELEMENT",
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
          };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber?.hooks?.push(hook as Hook);
  hookIndex++;
  return [hook.state, setState];
};

// Rendering

const createDom = (fiber: Fiber) => {
  const dom =
    fiber.kind === "text"
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type);

  updateDom(dom, { children: [] }, fiber.props);

  return dom;
};

type StateAction<T> = (prev: T) => T;
type EffectTag = "PLACEMENT" | "UPDATE" | "DELETION";
type Hook<T = unknown> = { state: T; queue: StateAction<T>[] };
type Fiber = {
  dom: HTMLElement | Text | undefined;
  child?: Fiber | undefined;
  parent?: Fiber | undefined;
  sibling?: Fiber | undefined;
  alternate: Fiber | undefined; // 前のcommit faseでDOMにcommitした古いfiber
  effectTag?: EffectTag;
  hooks?: Hook[];
} & MyReactElement;

let currentRoot: Fiber | undefined = undefined; // 最後にrenderされたroot fiber
let wipRoot: Fiber | undefined = undefined;
let deletions: Fiber[] | undefined = undefined; // 削除するfiberのリスト
let nextUnitOfWork: Fiber | undefined = undefined;

const isEvent = (key: keyof MyReactElement["props"]) => key.startsWith("on");
const isProperty = (key: keyof MyReactElement["props"]) =>
  key !== "children" && !isEvent(key);
const isNew =
  (prev: MyReactElement["props"], next: MyReactElement["props"]) =>
  (key: keyof MyReactElement["props"]) =>
    prev[key] !== next[key];
const isGone =
  (prev: MyReactElement["props"], next: MyReactElement["props"]) =>
  (key: keyof MyReactElement["props"]) =>
    !(key in next);

const updateDom = (
  dom: HTMLElement | Text,
  prevProps: MyReactElement["props"],
  nextProps: MyReactElement["props"]
) => {
  // delete old or changed events
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name] as EventListener);
    });

  // delete old props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      // @ts-ignore: this is safe because name is a key of props
      dom[name] = "";
    });

  // add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name] as EventListener);
    });

  // set new props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // @ts-ignore: this is safe because name is a key of props
      dom[name] = nextProps[name];
    });
};

const commitRoot = (root: Fiber) => {
  deletions?.forEach(commitWork);
  commitWork(root.child);
  currentRoot = wipRoot;
  wipRoot = undefined;
};

const commitWork = (fiber: Fiber | undefined) => {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  while (!domParentFiber?.dom && domParentFiber?.parent) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber?.dom;
  if (!domParent) throw new Error("failed to find dom parent");

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != undefined) {
    domParent.appendChild(fiber.dom);
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != undefined &&
    fiber.alternate != undefined
  ) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    console.log("deletion");
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitDeletion = (fiber: Fiber, domParent: HTMLElement | Text) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child!, domParent);
  }
};

export const render = (element: MyReactElement, container: HTMLElement) => {
  wipRoot = {
    kind: "node",
    type: element.type,
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

const workLoop: IdleRequestCallback = (deadline) => {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot(wipRoot);
  }

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

const performUnitOfWork = (fiber: Fiber) => {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

type MyRectFC = (props: NodeElement["props"]) => MyReactElement;

let wipFiber: Fiber | undefined = undefined;
let hookIndex = 0;

const updateFunctionComponent = (fiber: Fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [
    (fiber.type as unknown as MyRectFC)(fiber.props.children[0].props),
  ];
  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber: Fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
};

const createFiber = (
  oldFiber: Fiber | undefined,
  wipFiber: Fiber,
  element: MyReactElement,
  effectTag: EffectTag
): Fiber =>
  element.kind === "text"
    ? {
        kind: "text",
        type: "TEXT_ELEMENT",
        props: element.props,
        dom: oldFiber?.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag,
      }
    : {
        kind: "node",
        type: effectTag === "UPDATE" && oldFiber ? oldFiber.type : element.type,
        props: element.props,
        dom: oldFiber?.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag,
      };

// compare old fiber to element
const reconcileChildren = (wipFiber: Fiber, elements: MyReactElement[]) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = undefined;

  while (index < elements.length || oldFiber != undefined) {
    const element = elements[index];
    let newFiber: Fiber | undefined = undefined;

    // compare oldFiber to element
    const isSameType = oldFiber && element && oldFiber.type === element.type;

    if (isSameType) {
      // if new element is same type as old fiber,
      // we can keep the DOM node and just update it with the new props
      newFiber = createFiber(oldFiber, wipFiber, element, "UPDATE");
    }
    if (element && !isSameType) {
      // if new element is different type from old fiber,
      // we need to create a new DOM node
      newFiber = createFiber(oldFiber, wipFiber, element, "PLACEMENT");
    }
    if (oldFiber && !isSameType) {
      // if new element is different type from old fiber,
      // and old fiber exists, we need to remove the old node
      oldFiber.effectTag = "DELETION";
      deletions?.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      // this is safe because prevSibling is defined only when index > 0
      prevSibling!.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

export default {
  createElement,
  createTextElement,
  render,
  useState,
};
