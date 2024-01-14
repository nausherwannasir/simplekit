/**
 * SimpleKit Canvas Mode
 */

// events
export * from "./events";
// functions
export {
  startSimpleKit,
  setSKDrawCallback,
  setSKEventListener,
  setSKAnimationCallback,
  addSKEventTranslator,
};

//  - - - - - - - - - - - - - - - - - - - - - - -

import {
  FundamentalEvent,
  createWindowingSystem,
  coalesceEvents,
} from "./windowing-system";

// simple simulated UI Kit events
import { SKEvent } from "./events";

import {
  EventTranslator,
  fundamentalTranslator,
  clickTranslator,
  keypressTranslator,
  dblclickTranslator,
  dragTranslator,
} from "./events";

import { checkHtml, setupCanvas } from "./common-mode";

/**
 * The SimpleKit toolkit run loop (for canvas mode)
 * @param eventQueue fundamental events from simulated winodwing system
 * @param time the windowing system frame time
 */
function runloop(eventQueue: FundamentalEvent[], time: number) {
  // fundamental event queue coalescing
  coalesceEvents(eventQueue);

  // list of translated events to dispatch
  let events: SKEvent[] = [];

  // if no fundamental events, send a null event with time for
  // translators that trigger events based on time
  if (eventQueue.length == 0) {
    const nullEvent = {
      type: "null",
      timeStamp: time,
    } as FundamentalEvent;
    translators.forEach((t) => {
      const translatedEvent = t.update(nullEvent);
      if (translatedEvent) {
        events.push(translatedEvent);
      }
    });
  }
  // use fundamental events to generate SKEvents
  while (eventQueue.length > 0) {
    const fundamentalEvent = eventQueue.shift();
    if (!fundamentalEvent) continue;
    translators.forEach((t) => {
      const translatedEvent = t.update(fundamentalEvent);
      if (translatedEvent) {
        events.push(translatedEvent);
      }
    });
  }

  // dispatch events
  events.forEach((e) => {
    // global app dispatch
    if (eventListener) eventListener(e);
  });

  // update animations
  if (animateCallback) animateCallback(time);

  // draw on canvas
  if (drawCallback) drawCallback(gc);
}

// the single canvas rendering context
let gc: CanvasRenderingContext2D;

// standard fundamental event translators
const translators: EventTranslator[] = [
  fundamentalTranslator,
  keypressTranslator,
  clickTranslator,
  dblclickTranslator,
  dragTranslator,
];

/**
 * Adds an fundamental event translator to the list of translators
 * @param translator the translator to add
 */
function addSKEventTranslator(translator: EventTranslator) {
  translators.push(translator);
  console.log(`added event translator, now ${translators.length} translators`);
}

/**
 * Sets a global event listener
 * @param listener the event listener callback
 */
function setSKEventListener(listener: EventListener) {
  eventListener = listener;
}
type EventListener = (e: SKEvent) => void;
let eventListener: EventListener;

/**
 * Sets function to draw graphics each frame
 * @param draw the draw callback
 */
function setSKDrawCallback(draw: DrawCallback) {
  drawCallback = draw;
}
type DrawCallback = (gc: CanvasRenderingContext2D) => void;
let drawCallback: DrawCallback;

/**
 * Sets function to update animations each frame
 * @param animate the animation callback
 */
function setSKAnimationCallback(animate: AnimationCallback) {
  animateCallback = animate;
}
type AnimationCallback = (time: number) => void;
let animateCallback: AnimationCallback;

/**
 * Must be called to once to start the SimpleKit run loop. It adds a
 * single canvas to the body for drawing and creates
 * the simulated windowing system to call the SimpleKit run loop
 * @returns true if successful, false otherwise
 */
function startSimpleKit(): boolean {
  console.info(`🧰 SimpleKit *Canvas Mode* startup`);

  // check the HTML document hosting SimpleKit
  if (!checkHtml()) return false;

  // setup canvas and
  let canvas = setupCanvas();

  // save graphics context to local module variable
  const graphicsContext = canvas.getContext("2d");
  // this should never happen, but we need to check
  if (!graphicsContext) {
    console.error("Unable to get graphics context from canvas");
    return false;
  }
  gc = graphicsContext;

  // start the toolkit run loop
  createWindowingSystem(runloop);

  return true;
}