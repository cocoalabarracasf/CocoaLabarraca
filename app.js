// ================== CONFIG ==================
// 1) Reemplace por su número en formato internacional SIN +, sin 0 y sin espacios.
// Argentina ejemplo: 5493512345678
const WHATSAPP_NUMBER = "5493426273926";

// 2) Nombre del negocio (sale en el mensaje)
const STORE_NAME = "CocoaLabarraca";

// 3) Moneda
const CURRENCY = "ARS";

// ================== PRODUCTOS ==================
// Para ropa conviene: id, nombre, precio, categoría, código, y opcional imagen.
// Imágenes: URLs públicas o subidas al repo (ver Paso 6).
const PRODUCTS = [
  {
    id: "r1",
    name: "Remera Oversize Negra",
    price: 18000,
    category: "Remeras",
    code: "REM-001",
    image: "https://picsum.photos/seed/remera1/800/600",
  },
  {
    id: "r2",
    name: "Buzo Canguro Gris",
    price: 32000,
    category: "Buzos",
    code: "BUZ-014",
    image: "https://picsum.photos/seed/buzo1/800/600",
  },
  {
    id: "r3",
    name: "Jean Slim Azul",
    price: 45000,
    category: "Pantalones",
    code: "PAN-021",
    image: "https://picsum.photos/seed/jean1/800/600",
  }
];

// ================== HELPERS ==================
const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

const qs = (sel) => document.querySelector(sel);

function loadCart(){
  try { return JSON.parse(localStorage.getItem("cart") || "{}"); }
  catch { return {}; }
}
function saveCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
}
function cartCount(cart){
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
function cartTotal(cart){
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

// ================== RENDER PRODUCTOS ==================
const productGrid = qs("#productGrid");
const categorySelect = qs("#categorySelect");
const searchInput = qs("#searchInput");

function initCategories(){
  const cats = Array.from(new Set(PRODUCTS.map(p => p.category))).sort();
  for(const c of cats){
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }
}

function renderProducts(){
  const q = (searchInput.value || "").trim().toLowerCase();
  const cat = categorySelect.value;

  const filtered = PRODUCTS.filter(p => {
    const matchesQ = !q || p.name.toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q);
    const matchesCat = (cat === "all") || (p.category === cat);
    return matchesQ && matchesCat;
  });

  productGrid.innerHTML = "";
  for(const p of filtered){
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image || ""}" alt="${p.name}" loading="lazy" />
      <div class="row">
        <h3>${p.name}</h3>
        <div class="price">${fmtMoney(p.price)}</div>
      </div>
      <div class="meta">
        <span>${p.category}</span>
        ${p.code ? `<span>Cód: ${p.code}</span>` : ``}
      </div>
      <button class="primary" data-add="${p.id}">Agregar</button>
    `;
    productGrid.appendChild(card);
  }

  productGrid.querySelectorAll("button[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
}

// ================== CARRITO ==================
const cartDrawer = qs("#cartDrawer");
const backdrop = qs("#backdrop");
const cartItems = qs("#cartItems");
const cartCountEl = qs("#cartCount");
const cartTotalEl = qs("#cartTotal");
const customerNote = qs("#customerNote");

qs("#openCartBtn").addEventListener("click", openCart);
qs("#closeCartBtn").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);

function openCart(){
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  renderCart();
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
}

function syncCartBadge(){
  const cart = loadCart();
  cartCountEl.textContent = String(cartCount(cart));
}

function addToCart(productId){
  const cart = loadCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  syncCartBadge();
}

function changeQty(productId, delta){
  const cart = loadCart();
  const next = (cart[productId] || 0) + delta;
  if(next <= 0) delete cart[productId];
  else cart[productId] = next;
  saveCart(cart);
  syncCartBadge();
  renderCart();
}

function removeItem(productId){
  const cart = loadCart();
  delete cart[productId];
  saveCart(cart);
  syncCartBadge();
  renderCart();
}

function renderCart(){
  const cart = loadCart();
  const entries = Object.entries(cart);

  cartItems.innerHTML = "";
  if(entries.length === 0){
    cartItems.innerHTML = `<p class="meta">Su carrito está vacío.</p>`;
  } else {
    for(const [id, qty] of entries){
      const p = PRODUCTS.find(x => x.id === id);
      if(!p) continue;

      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <img src="${p.image || ""}" alt="${p.name}" loading="lazy" />
        <div style="flex:1">
          <div class="row">
            <h4>${p.name}</h4>
            <div style="font-weight:800">${fmtMoney(p.price * qty)}</div>
          </div>
          <div class="meta">${p.category}${p.code ? ` · Cód ${p.code}` : ``}</div>
          <div class="qty">
            <button aria-label="Restar" data-dec="${id}">-</button>
            <div>${qty}</div>
            <button aria-label="Sumar" data-inc="${id}">+</button>
            <button class="remove" data-rm="${id}">Quitar</button>
          </div>
        </div>
      `;
      cartItems.appendChild(item);
    }

    cartItems.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    cartItems.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, +1)));
    cartItems.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => removeItem(b.dataset.rm)));
  }

  cartTotalEl.textContent = fmtMoney(cartTotal(cart));
}

// ================== CHECKOUT WHATSAPP ==================
qs("#checkoutBtn").addEventListener("click", () => {
  const cart = loadCart();
  const entries = Object.entries(cart);

  if(entries.length === 0){
    alert("El carrito está vacío.");
    return;
  }

  const lines = [];
  lines.push(`Hola, quiero comprar en ${STORE_NAME}.`);
  lines.push("");
  lines.push("Pedido:");

  for(const [id, qty] of entries){
    const p = PRODUCTS.find(x => x.id === id);
    if(!p) continue;
    lines.push(`- ${p.name}${p.code ? ` (${p.code})` : ""} x${qty} = ${fmtMoney(p.price * qty)}`);
  }

  lines.push("");
  lines.push(`Total: ${fmtMoney(cartTotal(cart))}`);

  const note = (customerNote.value || "").trim();
  if(note){
    lines.push("");
    lines.push(`Nota: ${note}`);
  }

  const text = encodeURIComponent(lines.join("\n"));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url, "_blank");
});

// ================== INIT ==================
initCategories();
renderProducts();
syncCartBadge();

searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);
