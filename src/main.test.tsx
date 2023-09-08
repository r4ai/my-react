import { describe, expect, test } from "vitest";
import { createElement, createTextElement, type MyReactElement } from "./main";
import MyReact from "./main";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

describe("createElement", () => {
  test("<div></div>", () => {
    const actual = createElement("div");
    const expected: MyReactElement = {
      kind: "node",
      type: "div",
      props: {
        children: [],
      },
    };
    expect(actual).toEqual(expected);
  });

  test("<div>hello</div>", () => {
    const actual = createElement("div", null, createTextElement("hello"));
    const expected: MyReactElement = {
      kind: "node",
      type: "div",
      props: {
        children: [
          {
            kind: "text",
            type: "TEXT_ELEMENT",
            props: {
              nodeValue: "hello",
              children: [],
            },
          },
        ],
      },
    };
    expect(actual).toEqual(expected);
  });

  test('<div id="foo"><a>bar</a><b></b></div>', () => {
    const actual = createElement(
      "div",
      { id: "foo" },
      createElement("a", null, createTextElement("bar")),
      createElement("b")
    );
    const expected: MyReactElement = {
      kind: "node",
      type: "div",
      props: {
        id: "foo",
        children: [
          {
            kind: "node",
            type: "a",
            props: {
              children: [
                {
                  kind: "text",
                  type: "TEXT_ELEMENT",
                  props: {
                    nodeValue: "bar",
                    children: [],
                  },
                },
              ],
            },
          },
          { kind: "node", type: "b", props: { children: [] } },
        ],
      },
    };
    expect(actual).toEqual(expected);
  });

  test('<div id="foo"><a>bar</a><b></b></div> (jsx version)', () => {
    const actual = (
      <div id="foo">
        <a>bar</a>
        <b />
      </div>
    );

    const expected: MyReactElement = {
      kind: "node",
      type: "div",
      props: {
        id: "foo",
        children: [
          {
            kind: "node",
            type: "a",
            props: {
              children: [
                {
                  kind: "text",
                  type: "TEXT_ELEMENT",
                  props: {
                    nodeValue: "bar",
                    children: [],
                  },
                },
              ],
            },
          },
          { kind: "node", type: "b", props: { children: [] } },
        ],
      },
    };
    expect(actual).toEqual(expected);
  });
});
