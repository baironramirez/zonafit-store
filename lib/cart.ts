export function getCart() {
  const cart = localStorage.getItem("cart");

  if (!cart) return [];

  return JSON.parse(cart);
}
export function saveCart(cart: any) {
  localStorage.setItem("cart", JSON.stringify(cart));
}
export function addToCart(product: any) {
  const cart = getCart();

  const existing = cart.find((p: any) => p.id === product.id);

  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({
      ...product,
      cantidad: 1,
    });
  }

  saveCart(cart);
}
