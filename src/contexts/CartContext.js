import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, apiUtils } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { user } = useAuth();

  // Load cart data from localStorage or backend
  useEffect(() => {
    const loadCartData = async () => {
      setLoading(true);
      
      try {
        if (user && apiUtils.getToken()) {
          // User is authenticated, load from backend
          await loadFromBackend();
        } else {
          // User not authenticated, load from localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to localStorage
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    loadCartData();
  }, [user]);

  const loadFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCartItems([]);
    }
  };

  const loadFromBackend = async () => {
    try {
      const response = await api.cart.get();
      if (response.success && response.cart) {
        // Convert backend format to frontend format
        const backendItems = response.cart.items.map(item => ({
          id: item.productId,
          name: item.name,
          type: item.type,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
          category: item.category,
          image: item.image,
          metadata: item.metadata
        }));
        
        setCartItems(backendItems);
        
        // Sync with localStorage
        localStorage.setItem('cart', JSON.stringify(backendItems));
      }
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      throw error;
    }
  };

  const syncWithBackend = async (items = cartItems) => {
    if (!user || !apiUtils.getToken() || syncing) return;
    
    setSyncing(true);
    try {
      await api.cart.sync(items);
    } catch (error) {
      console.error('Error syncing cart with backend:', error);
    } finally {
      setSyncing(false);
    }
  };

  const saveToLocalStorage = (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const newItems = [...cartItems];
    const existingItemIndex = newItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
      // If product already exists, increase quantity
      newItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new product
      newItems.push({ ...product, quantity });
    }
    
    setCartItems(newItems);
    saveToLocalStorage(newItems);
    
    // Sync with backend if user is authenticated
    if (user && apiUtils.getToken()) {
      try {
        await api.cart.add({
          productId: product.id,
          name: product.name,
          type: product.type,
          price: product.price,
          quantity: quantity,
          description: product.description,
          category: product.category,
          image: product.image,
          metadata: product.metadata
        });
      } catch (error) {
        console.error('Error adding item to backend cart:', error);
        // Continue with local operation
      }
    }
  };

  const removeFromCart = async (productId) => {
    const newItems = cartItems.filter(item => item.id !== productId);
    setCartItems(newItems);
    saveToLocalStorage(newItems);
    
    // Sync with backend if user is authenticated
    if (user && apiUtils.getToken()) {
      try {
        await api.cart.remove(productId);
      } catch (error) {
        console.error('Error removing item from backend cart:', error);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const newItems = cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    
    setCartItems(newItems);
    saveToLocalStorage(newItems);
    
    // Sync with backend if user is authenticated
    if (user && apiUtils.getToken()) {
      try {
        await api.cart.updateQuantity(productId, quantity);
      } catch (error) {
        console.error('Error updating quantity in backend cart:', error);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    saveToLocalStorage([]);
    
    // Sync with backend if user is authenticated
    if (user && apiUtils.getToken()) {
      try {
        await api.cart.clear();
      } catch (error) {
        console.error('Error clearing backend cart:', error);
      }
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItems = () => {
    return cartItems;
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  // Sync cart when user logs in - only when user changes, ignore cartItems.length
  useEffect(() => {
    const syncCartOnLogin = async () => {
      if (user && apiUtils.getToken()) {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (localCart.length > 0) {
          // User just logged in and has items in localStorage, sync them
          await syncWithBackend(localCart);
        }
      }
    };

    syncCartOnLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user changes

  const value = {
    cartItems,
    loading,
    syncing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartItems,
    isInCart,
    syncWithBackend
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 