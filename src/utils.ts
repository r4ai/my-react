export const todo = (msg: string = "todo!!"): never => {
  throw new Error(`todo: ${msg}`);
};
