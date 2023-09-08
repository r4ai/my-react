export {};

declare global {
  declare namespace JSX {
    type Element = MyReactElement;
    interface IntrinsicElements {
      [key: string]: {
        [key: string]: unknown;
      };
    }
  }
}
