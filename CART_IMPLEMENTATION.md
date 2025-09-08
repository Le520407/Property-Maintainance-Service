# Cart Database Storage Implementation

This implementation provides a robust cart system that stores cart items in the database tied to the user, with localStorage fallback for non-authenticated users.

## Features

### ✅ Implemented
- **Database Storage**: Cart items are stored in MongoDB tied to the user's ID
- **User Authentication**: Cart data is automatically associated with the logged-in user
- **localStorage Fallback**: Non-authenticated users can still use the cart with localStorage
- **Automatic Sync**: When a user logs in, their localStorage cart is automatically synced with the database
- **Real-time Updates**: All cart operations (add, remove, update, clear) are synchronized with the backend
- **Conflict Resolution**: When syncing, the system takes the higher quantity for existing items

### Backend Components

#### 1. Cart Model (`backend/models/Cart.js`)
```javascript
const cartSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});
```

#### 2. Cart API Routes (`backend/routes/cart.js`)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:productId` - Update item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart
- `POST /api/cart/sync` - Sync cart from localStorage (for login)

#### 3. API Integration (`src/services/api.js`)
Cart API methods added to the existing API service:
```javascript
api.cart.get()           // Get cart
api.cart.add(item)       // Add item
api.cart.updateQuantity(productId, quantity)
api.cart.remove(productId)
api.cart.clear()
api.cart.sync(items)     // Sync from localStorage
```

### Frontend Components

#### 1. Updated CartContext (`src/contexts/CartContext.js`)
- **Automatic Backend Sync**: All cart operations sync with backend when user is authenticated
- **Smart Loading**: Loads from backend for authenticated users, localStorage for others
- **Login Sync**: Automatically syncs localStorage cart when user logs in
- **Error Handling**: Falls back to localStorage if backend operations fail

#### 2. Enhanced Cart Operations
```javascript
const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, syncing } = useCart();

// All operations work the same way but now sync with backend automatically
await addToCart(product, quantity);
await updateQuantity(productId, newQuantity);
await removeFromCart(productId);
await clearCart();
```

## Usage Examples

### For Authenticated Users
1. **Login**: Cart automatically loads from database
2. **Add Items**: Items are saved to database and localStorage
3. **Sync**: If localStorage has items when logging in, they're merged with database cart
4. **Persistence**: Cart persists across devices and sessions

### For Non-Authenticated Users
1. **localStorage**: Cart works normally with localStorage
2. **Login**: Upon login, localStorage cart is automatically synced to database
3. **No Loss**: No cart items are lost during authentication process

### Backend Cart Data Structure
```javascript
{
  "userId": "60d5ecb74eb1b3b1b8a1b2c3",
  "items": [
    {
      "productId": "service-123",
      "name": "Plumbing Service",
      "type": "service",
      "price": 50.00,
      "quantity": 1,
      "description": "Emergency plumbing repair",
      "category": "plumbing-services"
    }
  ],
  "totalAmount": 50.00,
  "totalItems": 1,
  "lastUpdated": "2024-09-08T10:30:00.000Z"
}
```

## Migration Notes

### Existing Users
- Existing localStorage carts will be automatically migrated to the database when users log in
- No manual intervention required
- No data loss during migration

### Backward Compatibility
- The cart still works for non-authenticated users
- All existing cart functionality remains unchanged
- Frontend components don't need modifications

## Database Indexes
- `userId`: For fast user cart lookups
- `items.productId`: For efficient item operations within carts

## Error Handling
- Backend errors fall back to localStorage operations
- Network failures don't break cart functionality
- Graceful degradation for offline scenarios

## Testing the Implementation

1. **Start Backend**: `npm start` in backend directory
2. **Test Unauthenticated**: Add items to cart without login
3. **Test Login Sync**: Login and verify localStorage cart merges with database
4. **Test Cross-Device**: Login from different device to see cart persistence
5. **Test Real-time Sync**: All cart operations should immediately sync with backend

## Security Features
- All cart operations require authentication for database access
- Cart data is tied to user ID, preventing unauthorized access
- JWT token validation for all cart API endpoints
- Input validation and sanitization for all cart data

This implementation provides a seamless, robust cart experience that scales from guest users to authenticated users without losing any functionality or data.
