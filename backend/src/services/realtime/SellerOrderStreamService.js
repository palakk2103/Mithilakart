const { eventBus } = require('../../events/EventBus');
const { OrderItemRepository } = require('../../repositories/OrderItemRepository');

class SellerOrderStreamService {
  constructor() {
    this.subscribers = new Map();
    this.orderItemRepository = new OrderItemRepository();
  }

  subscribe(sellerId, res) {
    const key = String(sellerId);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(res);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', sellerId: key })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.subscribers.get(key)?.delete(res);
    });
  }

  publish(sellerId, payload) {
    const listeners = this.subscribers.get(String(sellerId));
    if (!listeners?.size) return;

    const data = JSON.stringify(payload);
    for (const res of listeners) {
      res.write(`data: ${data}\n\n`);
    }
  }

  registerEventBridge() {
    eventBus.subscribe('order.placed', (event) => {
      const { sellerId, orderId, orderNumber } = event.payload || {};
      if (!sellerId) return;
      this.publish(sellerId, { type: 'new_order', orderId, orderNumber });
    });

    eventBus.subscribe('order.status_changed', async (event) => {
      const { orderId, status, orderNumber } = event.payload || {};
      if (!orderId) return;

      const items = await this.orderItemRepository.find({ orderId, deletedAt: null });
      const sellerIds = [...new Set(items.map((item) => String(item.sellerId)))];

      for (const sellerId of sellerIds) {
        this.publish(sellerId, { type: 'status_update', orderId, status, orderNumber });
      }
    });
  }
}

const sellerOrderStreamService = new SellerOrderStreamService();
sellerOrderStreamService.registerEventBridge();

module.exports = { SellerOrderStreamService, sellerOrderStreamService };
