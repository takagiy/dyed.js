import { AsyncLocalStorage } from "node:async_hooks";

type KeyValueOf<T> = {
  [K in Extract<keyof T, string>]: T[K];
};

export class DiContainer<T extends object> {
  private readonly context = new AsyncLocalStorage<T>();
  private initialized = false;

  private constructor() {}

  public static create<T extends object>(): DiContainer<T> & KeyValueOf<T> {
    return new DiContainer<T>() as DiContainer<T> & KeyValueOf<T>;
  }

  public beginContext<R, F extends () => R>(injected: T, callback: F): R {
    this.initialize(injected);

    return this.context.run(injected, callback);
  }

  private get<K extends keyof T>(propertyName: K): T[K] {
    const injected = this.context.getStore();
    if (injected === undefined) {
      throw new Error(
        `DiContainer.get(${JSON.stringify(propertyName)}) called outside of DiContainer.beginContext().`,
      );
    }
    return injected[propertyName];
  }

  private initialize(injected: T) {
    if (this.initialized) {
      return;
    }

    for (const propertyName in injected) {
      Object.defineProperty(this, propertyName, {
        get: () => this.get(propertyName),
      });
    }

    this.initialized = true;
  }
}
