import test from "ava";
import { DiContainer } from "../src";

type Injected = {
  foo: string;
};

test("call getter outside of beginContext", (t) => {
  const di = new DiContainer<Injected>();
  t.throws(() => di.foo);
});

test("inject value", (t) => {
  const di = new DiContainer<Injected>();
  di.beginContext({ foo: "foo" }, () => {
    t.is(di.foo, "foo");
  });
  di.beginContext({ foo: "bar" }, () => {
    t.is(di.foo, "bar");
  });
  t.throws(() => di.foo);
});
