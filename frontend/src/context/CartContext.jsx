import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, totalCents: 0, moneda: "MXN" });
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!token) {
      setCart({ items: [], total: 0, totalCents: 0, moneda: "MXN" });
      return;
    }

    setLoading(true);

    try {
      const payload = await apiFetch("/cart", { token });
      setCart(payload);
      return payload;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart().catch(() => {
        setCart({ items: [], total: 0, totalCents: 0, moneda: "MXN" });
      });
    } else {
      setCart({ items: [], total: 0, totalCents: 0, moneda: "MXN" });
    }
  }, [isAuthenticated, token]);

  const addToCart = async (productId, cantidad = 1) => {
    if (!token) {
      throw new Error("Inicia sesion para usar el carrito.");
    }

    const currentItem = cart.items.find((item) => item.productoId === productId);
    const payload = await apiFetch("/cart/items", {
      method: "POST",
      token,
      body: {
        productId,
        cantidad: (currentItem?.cantidad || 0) + cantidad
      }
    });

    setCart(payload);
    return payload;
  };

  const updateQuantity = async (productId, cantidad) => {
    const payload = await apiFetch(`/cart/items/${productId}`, {
      method: "PATCH",
      token,
      body: { cantidad }
    });

    setCart(payload);
    return payload;
  };

  const removeItem = async (productId) => {
    const payload = await apiFetch(`/cart/items/${productId}`, {
      method: "DELETE",
      token
    });

    setCart(payload);
    return payload;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        itemCount: cart.items.reduce((sum, item) => sum + item.cantidad, 0)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }

  return context;
}
