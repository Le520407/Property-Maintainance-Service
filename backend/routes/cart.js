const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { authenticateToken } = require('../middleware/auth');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({
        userId: req.user._id,
        items: []
      });
      await cart.save();
    }
    
    res.json({
      success: true,
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, name, type, price, quantity = 1, description, category, image, metadata } = req.body;
    
    if (!productId || !name || !type || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productId, name, type, price'
      });
    }
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: []
      });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        name,
        type,
        price,
        quantity,
        description,
        category,
        image,
        metadata
      });
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart',
      error: error.message
    });
  }
});

// Update item quantity in cart
router.put('/update/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity provided'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
});

// Sync cart from localStorage (for when user logs in)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { items: localItems } = req.body;
    
    if (!Array.isArray(localItems)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items format'
      });
    }
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: []
      });
    }
    
    // Merge local cart items with database cart
    for (const localItem of localItems) {
      const existingItemIndex = cart.items.findIndex(item => item.productId === localItem.id);
      
      if (existingItemIndex > -1) {
        // Update quantity if item exists (take the higher quantity)
        cart.items[existingItemIndex].quantity = Math.max(
          cart.items[existingItemIndex].quantity,
          localItem.quantity || 1
        );
      } else {
        // Add new item from local storage
        cart.items.push({
          productId: localItem.id,
          name: localItem.name,
          type: localItem.type,
          price: localItem.price,
          quantity: localItem.quantity || 1,
          description: localItem.description,
          category: localItem.category,
          image: localItem.image,
          metadata: localItem.metadata
        });
      }
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart synced successfully',
      cart: {
        id: cart._id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing cart',
      error: error.message
    });
  }
});

module.exports = router;
