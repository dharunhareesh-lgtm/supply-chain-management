import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";

/*
  Client-side cart / wishlist / compare state.

  This is intentionally backend-free: it persists to localStorage only,
  so it does not require any new API endpoints. Real orders are still
  created through the existing POST /orders call (see CartPage.jsx),
  which keeps the original backend contract untouched.

  Data is namespaced per logged-in username so two different customers
  on the same browser don't see each other's cart/wishlist.
*/

const CartContext = createContext(null);

function keyFor(base) {
  const username = localStorage.getItem("username") || "guest";
  return `dravix:${base}:${username}`;
}

function readList(base) {
  try {
    const raw = localStorage.getItem(keyFor(base));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readList("cart"));
  const [wishlistItems, setWishlistItems] = useState(() => readList("wishlist"));
  const [compareItems, setCompareItems] = useState(() => readList("compare"));

  useEffect(() => {
    localStorage.setItem(keyFor("cart"), JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(keyFor("wishlist"), JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    localStorage.setItem(keyFor("compare"), JSON.stringify(compareItems));
  }, [compareItems]);

  /* ---------------- Cart ---------------- */

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.productId
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock,
          quantity
        }
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const isInCart = useCallback(
    (productId) => cartItems.some((item) => item.productId === productId),
    [cartItems]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  /* ---------------- Wishlist ---------------- */

  const toggleWishlist = useCallback((product) => {
    setWishlistItems((prev) => {
      const exists = prev.some(
        (item) => item.productId === product.productId
      );

      if (exists) {
        return prev.filter((item) => item.productId !== product.productId);
      }

      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          stock: product.stock
        }
      ];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  }, []);

  const isInWishlist = useCallback(
    (productId) =>
      wishlistItems.some((item) => item.productId === productId),
    [wishlistItems]
  );

  /* ---------------- Compare (max 4) ---------------- */

  const toggleCompare = useCallback((product) => {
    setCompareItems((prev) => {
      const exists = prev.some(
        (item) => item.productId === product.productId
      );

      if (exists) {
        return prev.filter((item) => item.productId !== product.productId);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          price: product.price,
          category: product.category,
          stock: product.stock,
          supplierId: product.supplierId,
          imageUrl: product.imageUrl
        }
      ];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setCompareItems((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  }, []);

  const isInCompare = useCallback(
    (productId) =>
      compareItems.some((item) => item.productId === productId),
    [compareItems]
  );

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isInCart,
    cartCount,
    cartTotal,

    wishlistItems,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistCount: wishlistItems.length,

    compareItems,
    toggleCompare,
    removeFromCompare,
    isInCompare,
    compareCount: compareItems.length
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used inside a <CartProvider>");
  }

  return ctx;
}
