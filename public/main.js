// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import { addMessage, animateGift, isPossiblyAnimatingGift, isAnimatingGiftUI } from "./dom_updates.js";
import Queue from "./queue.js";

const api = new APIWrapper(false, false, true);
const animatedGiftMessageEventsQueue = new Queue();
const normalMessageEventsQueue = new Queue();


/**
 * Listen API. API will give new message events every per 200ms.
 * Message events adding related message queues.
 */
api.setEventHandler((events) => {
  events.forEach(event => {
    if(!isDuplicateEvent(event)) {
      if((event.type === API_EVENT_TYPE.ANIMATED_GIFT)){
        animatedGiftMessageEventsQueue.enqueue(event);
      }else{
        normalMessageEventsQueue.enqueue(event);
      }
    }
  })
})

/**
 * Check the event old or new. If the event older than 20 seconds return true.
 *
 * @param event
 * @returns {boolean}
 */
function isOldEvent(event){
  let eventTimeDiffBySec = ( new Date().getTime() - event.timestamp.getTime() ) / 1000;
  return eventTimeDiffBySec > 20;
}

/**
 * Check the event is duplicate or not. If the incoming event id already have in
 * animatedGiftMessageEventsQueueIds or normalMessageEventsQueueIds return true.
 *
 * @param event
 * @returns {boolean}
 */
function isDuplicateEvent(event) {
  const animatedGiftMessageEventsQueueIds = animatedGiftMessageEventsQueue.getQueueElementsById();
  const normalMessageEventsQueueIds = normalMessageEventsQueue.getQueueElementsById();

  if(animatedGiftMessageEventsQueueIds.includes(event.id) || normalMessageEventsQueueIds.includes(event.id)) {
    return true
  }
}

/**
 * Adding a new message to screen every per 500ms, if message queues have any message
 */
setInterval(() => {
  // animatedGiftMessageEventsQueue
  if ( !animatedGiftMessageEventsQueue.isEmpty() ) {
    /**
     * There can only be at most one gift animation visible on screen at any given time.
     * If there is an ongoing gift animation, other/newer Animated Gifts should wait for it to end.
     * That's why check isAnimatingGiftUI() and isPossiblyAnimatingGift()
     */
    const animatedGiftEvent = animatedGiftMessageEventsQueue.dequeue();
    addMessage(animatedGiftEvent);
    if ( !isPossiblyAnimatingGift() && !isAnimatingGiftUI() ) {
      /**
       * Get animatedGiftEvent from animatedGiftMessageEventsQueue queue
       * Add message to screen and animate gift
       */
      animateGift(animatedGiftEvent);
    }
  }
  // normalMessageEventsQueue
  if ( !normalMessageEventsQueue.isEmpty() ) {
    /**
     * Get normalEvent from normalMessageEventsQueue queue
     * Add message to screen
     */
    let normalEvent = normalMessageEventsQueue.dequeue();
    if ( !isOldEvent(normalEvent) ) {
      addMessage(normalEvent)
    }
  }

}, 500);
