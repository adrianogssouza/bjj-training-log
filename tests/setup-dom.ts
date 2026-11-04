import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://bjj.test", pretendToBeVisual: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.assign(globalThis, { self: dom.window, window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true, confirm: () => true });

import { after } from "node:test";
after(() => dom.window.close());
