const { EventEmitter } = require('events');

const EVENT_TYPES = {
  SYSTEM: {
    STARTUP: 'system.startup',
    SHUTDOWN: 'system.shutdown',
    HEALTH_CHECK: 'system.health_check',
  },
};

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(eventType, payload = {}, metadata = {}) {
    this.emit(eventType, {
      type: eventType,
      payload,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  subscribe(eventType, handler) {
    this.on(eventType, handler);
    return () => this.off(eventType, handler);
  }
}

const eventBus = new EventBus();

module.exports = {
  EventBus,
  eventBus,
  EVENT_TYPES,
};
