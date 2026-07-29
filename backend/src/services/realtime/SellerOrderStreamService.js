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
    eventBus.subscribe('order.placed', async (event) => {
      const { sellerId, orderId, orderNumber } = event.payload || {};
      if (!sellerId || !orderId) return;

      let orderDetails = null;
      try {
        const { OrderRepository } = require('../../repositories/OrderRepository');
        const orderRepo = new OrderRepository();
        const order = await orderRepo.findById(orderId);
        if (order) {
          const subOrder = (order.sellerSubOrders || []).find((s) => String(s.sellerId) === String(sellerId));
          const subItems = (order.items || []).filter((i) => String(i.sellerId) === String(sellerId));
          orderDetails = {
            id: order._id,
            orderNumber: order.orderNumber,
            total: subOrder?.total ?? order.total,
            items: subItems.map((i) => ({
              title: i.title || i.name || 'Product',
              quantity: i.quantity || 1,
              price: i.unitPrice ?? i.price ?? 0,
              image: i.image || i.imageUrl || null,
            })),
            customerName: order.address?.name || 'Customer',
            customerPhone: order.address?.phone || '',
            address: [order.address?.address, order.address?.city, order.address?.pincode].filter(Boolean).join(', '),
            commerceFlow: order.commerceFlow,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
          };
        }
      } catch (err) {
        console.error('Failed to attach order details to stream:', err);
      }

      this.publish(sellerId, {
        type: 'new_order',
        orderId,
        orderNumber,
        order: orderDetails,
      });
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
