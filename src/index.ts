import { AsyncLocalStorage } from "node:async_hooks";

type KeyValueOf<T> = {
  readonly [K in Extract<keyof T, string | symbol>]: T[K];
};

type ValueOf<T> = T[Extract<keyof T, string | symbol>];

class BaseDiContainer<T extends object> {
  private readonly context = new AsyncLocalStorage<T>();

  private constructor() {}

  public static create<T extends object>(): DiContainer<T> {
    return new Proxy(new BaseDiContainer<T>(), {
      get: (self, propertyName) => {
        return propertyName in self
          ? self[propertyName as keyof typeof self]
          : self.get(propertyName);
      },
    }) as DiContainer<T>;
  }

  public beginContext<R, F extends () => R>(injected: T, callback: F): R {
    return this.context.run(injected, callback);
  }

  private get(propertyName: string | symbol): ValueOf<T> | undefined {
    const injected = this.context.getStore();
    if (injected === undefined) {
      throw new Error(
        `DiContainer.get(${JSON.stringify(propertyName)}) called outside of DiContainer.beginContext().`,
      );
    }
    return (injected as { [key: string | symbol]: ValueOf<T> | undefined })[
      propertyName
    ];
  }
}

type DiContainerConstructor = { new <T extends object>(): DiContainer<T> };

export type DiContainer<T extends object> = BaseDiContainer<T> & KeyValueOf<T>;
export const DiContainer: DiContainerConstructor = function DiContainer<
  T extends object,
>(): DiContainer<T> {
  return BaseDiContainer.create<T>();
} as unknown as DiContainerConstructor;
