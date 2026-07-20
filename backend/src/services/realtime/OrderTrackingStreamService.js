const { eventBus } = require('../../events/EventBus');

class OrderTrackingStreamService {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(orderId, res) {
    const key = String(orderId);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(res);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', orderId: key })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.subscribers.get(key)?.delete(res);
    });
  }

  publish(orderId, payload) {
    const key = String(orderId);
    const listeners = this.subscribers.get(key);
    if (!listeners) return;

    const data = JSON.stringify({ type: 'status_update', ...payload });
    for (const res of listeners) {
      res.write(`data: ${data}\n\n`);
    }
  }

  registerEventBridge() {
    eventBus.subscribe('order.status_changed', (event) => {
      this.publish(event.payload.orderId, event.payload);
    });
  }
}

const orderTrackingStreamService = new OrderTrackingStreamService();
orderTrackingStreamService.registerEventBridge();

module.exports = { OrderTrackingStreamService, orderTrackingStreamService };
