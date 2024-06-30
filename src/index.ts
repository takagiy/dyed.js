import { AsyncLocalStorage } from "node:async_hooks";

type KeyValueOf<T> = {
  [K in Extract<keyof T, string>]: T[K];
};

type ValueOf<T> = T[Extract<keyof T, string>];

export class DiContainer<T extends object> {
  private readonly context = new AsyncLocalStorage<T>();

  private constructor() {
    // biome-ignore lint/correctness/noConstructorReturn:
    return new Proxy(this, {
      get: (self: DiContainer<T>, propertyName: string) => {
        return propertyName in self
          ? self[propertyName as keyof typeof self]
          : this.get(propertyName);
      },
    });
  }

  public static create<T extends object>(): DiContainer<T> & KeyValueOf<T> {
    return new DiContainer<T>() as DiContainer<T> & KeyValueOf<T>;
  }

  public beginContext<R, F extends () => R>(injected: T, callback: F): R {
    return this.context.run(injected, callback);
  }

  private get(propertyName: string): ValueOf<T> | undefined {
    const injected = this.context.getStore();
    if (injected === undefined) {
      throw new Error(
        `DiContainer.get(${JSON.stringify(propertyName)}) called outside of DiContainer.beginContext().`,
      );
    }
    return (injected as { [key: string]: ValueOf<T> | undefined })[
      propertyName
    ];
  }
}
