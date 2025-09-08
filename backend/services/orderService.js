class OrderService {
  constructor() {
    // Service for handling order-related business logic
  }

  /**
   * Validate order items before processing
   */
  validateOrderItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    for (const item of items) {
      if (!item.serviceId) {
        throw new Error('Each item must have a serviceId');
      }
      if (!item.serviceName || typeof item.serviceName !== 'string') {
        throw new Error('Each item must have a valid serviceName');
      }
      if (!item.price || item.price <= 0) {
        throw new Error('Each item must have a valid price greater than 0');
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Each item must have a valid quantity greater than 0');
      }
    }

    return true;
  }

  /**
   * Validate shipping address
   */
  validateShippingAddress(address) {
    const requiredFields = ['fullName', 'street', 'city', 'state', 'postalCode', 'country'];
    
    for (const field of requiredFields) {
      if (!address[field] || typeof address[field] !== 'string' || address[field].trim() === '') {
        throw new Error(`Shipping address must include a valid ${field}`);
      }
    }

    // Basic postal code validation for Singapore
    if (address.country === 'Singapore' && !/^\d{6}$/.test(address.postalCode)) {
      throw new Error('Invalid Singapore postal code. Must be 6 digits.');
    }

    return true;
  }

  /**
   * Calculate order totals
   */
  calculateOrderTotals(items, shippingCost = 10) {
    const processedItems = items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity
    }));

    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + shippingCost;

    return {
      processedItems,
      subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
      shippingCost,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * Determine shipping cost based on items and location
   */
  calculateShippingCost(items, shippingAddress) {
    // Basic shipping calculation
    const baseShippingCost = 10; // Base shipping cost in SGD
    
    // Add extra cost for multiple items
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const extraItemCost = Math.max(0, (itemCount - 1) * 2); // $2 per additional item
    
    // International shipping (if not Singapore)
    const internationalSurcharge = shippingAddress.country !== 'Singapore' ? 20 : 0;
    
    return baseShippingCost + extraItemCost + internationalSurcharge;
  }

  /**
   * Format order summary for display
   */
  formatOrderSummary(order) {
    return {
      orderNumber: order.orderNumber,
      customer: order.customer,
      items: order.items.map(item => ({
        serviceName: item.serviceName,
        quantity: item.quantity,
        price: `$${item.price.toFixed(2)}`,
        subtotal: `$${item.subtotal.toFixed(2)}`
      })),
      subtotal: `$${order.subtotal.toFixed(2)}`,
      shippingCost: `$${order.shippingCost.toFixed(2)}`,
      total: `$${order.total.toFixed(2)}`,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order) {
    // Only allow cancellation if payment is pending and order isn't shipped
    return order.paymentStatus === 'pending' && 
           !['shipped', 'delivered', 'completed'].includes(order.status);
  }

  /**
   * Check if order can be modified
   */
  canModifyOrder(order) {
    // Only allow modification if payment is pending and order is still pending
    return order.paymentStatus === 'pending' && order.status === 'pending';
  }

  /**
   * Generate payment description for HitPay
   */
  generatePaymentDescription(order) {
    const itemCount = order.items.length;
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (itemCount === 1) {
      return `${order.items[0].serviceName} (${order.items[0].quantity}x)`;
    }
    
    return `${itemCount} services (${totalQuantity} items total)`;
  }

  /**
   * Validate order status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': ['completed'],
      'cancelled': [], // Cannot transition from cancelled
      'completed': [] // Cannot transition from completed
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    return true;
  }
}

module.exports = OrderService;
