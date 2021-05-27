// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import { addMessage, animateGift, isAnimatingGiftUI } from "./dom_updates.js";
import Queue from "./queue.js";

const api = new APIWrapper(false, false, true);
const animatedGiftEvents = new Queue();
const normalMessages = new Queue();


/**
 * Listen API. API will give new message events every per 200ms.
 * Message events adding related message queues.
 */
api.setEventHandler((messages) => {
  messages.forEach(message => {
    if((message.type === API_EVENT_TYPE.ANIMATED_GIFT)){
      animatedGiftEvents.enqueue(message);
    }else{
      normalMessages.enqueue(message);
    }
  })
})

/**
 * Check message old or new. If the message older than 20 seconds return true.
 *
 * @param msg
 * @returns {boolean}
 */
function oldMessageValidation(msg){
  let msgTimeDiffBySec = ( new Date().getTime() - msg.timestamp.getTime() ) / 1000;
  return msgTimeDiffBySec > 20;
}

/**
 * Adding a new message to screen every per 500ms, if message queues have any message
 */
setInterval(() => {
  // animatedGiftEvents
  if ( !animatedGiftEvents.isEmpty() ) {
    /**
     * There can only be at most one gift animation visible on screen at any given time.
     * If there is an ongoing gift animation, other/newer Animated Gifts should wait for it to end.
     * That's why check isAnimatingGiftUI()
     */
    const animatedGiftMessage = animatedGiftEvents.dequeue();
    addMessage(animatedGiftMessage);
    if ( !isAnimatingGiftUI() ) {
      /**
       * Get animatedGiftMessage from animatedGiftEvents queue
       * Add message to screen and animate gift
       */
      animateGift(animatedGiftMessage);
    }
  }
  // normalMessages
  if ( !normalMessages.isEmpty() ) {
    /**
     * Get normalMessage from normalMessages queue
     * Add message to screen
     */
    let normalMessage = normalMessages.dequeue();
    if ( !oldMessageValidation(normalMessage) ) {
      addMessage(normalMessage)
    }
  }

}, 500);
