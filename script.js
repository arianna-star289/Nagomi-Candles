/* ==========================================================
   NAGOMI CANDLES — script.js
   Catálogo de velas + filtros + carrito + control de presupuesto
   ========================================================== */

// ---------- 1. CATÁLOGO ----------
const CANDLES = [
  {
    id: "luna-lavanda",
    name: "Luna de Lavanda",
    scent: "lavanda",
    scentLabel: "Lavanda",
    desc: "Lavanda francesa y un toque de manzanilla, para las noches de episodio final y sueño profundo.",
    price: 18,
    wax: "#DCCBF3",
    jar: "#F1ECFB",
  },
  {
    id: "vainilla-astillero",
    name: "Vainilla del Astillero",
    scent: "vainilla",
    scentLabel: "Vainilla",
    desc: "Vainilla cálida con madera de sándalo, como el aroma de una cabaña de pescadores al atardecer.",
    price: 16,
    wax: "#FBE3B8",
    jar: "#FFF6E6",
  },
  {
    id: "sol-de-verano",
    name: "Sol de Verano",
    scent: "citrico",
    scentLabel: "Cítrico",
    desc: "Naranja, yuzu y un toque de jengibre: la energía de un festival de verano en la costa.",
    price: 15,
    wax: "#FFDA8E",
    jar: "#FFF3D9",
  },
  {
    id: "brisa-kaiju",
    name: "Brisa de Kaijū",
    scent: "oceano",
    scentLabel: "Océano",
    desc: "Sal marina, algas y un fondo de ozono fresco, inspirada en la niebla que cubre la bahía al amanecer.",
    price: 19,
    wax: "#A9DADD",
    jar: "#E6F5F5",
  },
  {
    id: "sakura-atardecer",
    name: "Sakura al Atardecer",
    scent: "floral",
    scentLabel: "Floral",
    desc: "Flor de cerezo y peonía suave, para esa escena rosa donde todo se siente posible.",
    price: 17,
    wax: "#F6C9DC",
    jar: "#FDEEF4",
  },
  {
    id: "matcha-zen",
    name: "Matcha Zen",
    scent: "matcha",
    scentLabel: "Té verde",
    desc: "Té verde ceremonial y bambú, un ritual de calma antes de empezar el día.",
    price: 16,
    wax: "#C7E7C0",
    jar: "#EDF7EA",
  },
  {
    id: "niebla-lunar",
    name: "Niebla Lunar",
    scent: "lavanda",
    scentLabel: "Lavanda",
    desc: "Lavanda, almizcle blanco y una gota de vainilla, como flotar entre nubes antes de dormir.",
    price: 20,
    wax: "#CBB9E9",
    jar: "#EFE7FB",
  },
  {
    id: "coral-susurrante",
    name: "Coral Susurrante",
    scent: "oceano",
    scentLabel: "Océano",
    desc: "Higo marino, sal y flor de loto: el fondo del mar contado como cuento de buenas noches.",
    price: 20,
    wax: "#8FCBCF",
    jar: "#E1F2F2",
  },
];

// ---------- 2. ESTADO ----------
let cart = loadCart();
let budget = loadBudget();

// ---------- 3. RENDER DE VELAS ----------
const grid = document.getElementById("candleGrid");

function candleSVG(candle){
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vela ${candle.name}">
    <ellipse cx="60" cy="104" rx="30" ry="6" fill="${candle.wax}" opacity="0.35"/>
    <rect x="32" y="46" width="56" height="56" rx="14" fill="${candle.jar}" stroke="rgba(59,53,80,0.12)" stroke-width="1.5"/>
    <rect x="32" y="46" width="56" height="18" rx="9" fill="${candle.wax}"/>
    <rect x="58" y="20" width="4" height="28" rx="2" fill="#C9A97E"/>
    <path class="flame" d="M60 6 C 52 16, 52 26, 60 32 C 68 26, 68 16, 60 6 Z" fill="#FFD897"/>
    <path class="flame" d="M60 14 C 56 20, 56 25, 60 28 C 64 25, 64 20, 60 14 Z" fill="#FFF3D6"/>
    <circle cx="40" cy="90" r="2" fill="#fff" opacity="0.5"/>
    <circle cx="80" cy="80" r="1.6" fill="#fff" opacity="0.4"/>
  </svg>`;
}

function renderCandles(filter = "todos"){
  const list = filter === "todos" ? CANDLES : CANDLES.filter(c => c.scent === filter);
  grid.innerHTML = list.map(candle => `
    <article class="candle-card" data-id="${candle.id}">
      <div class="candle-art">${candleSVG(candle)}</div>
      <span class="candle-tag tag-${candle.scent}">${candle.scentLabel}</span>
      <h3 class="candle-name">${candle.name}</h3>
      <p class="candle-desc">${candle.desc}</p>
      <div class="candle-footer">
        <span class="candle-price">$${candle.price}</span>
        <button class="add-btn" data-id="${candle.id}">Añadir</button>
      </div>
    </article>
  `).join("");
}

renderCandles();

// delegación de eventos para "Añadir"
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if(!btn) return;
  const candle = CANDLES.find(c => c.id === btn.dataset.id);
  addToCart(candle);
  btn.textContent = "Añadida ♡";
  btn.classList.add("added");
  setTimeout(() => { btn.textContent = "Añadir"; btn.classList.remove("added"); }, 900);
});

// ---------- 4. FILTROS ----------
const filtersEl = document.getElementById("filters");
filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if(!btn) return;
  filtersEl.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  renderCandles(btn.dataset.filter);
});

// ---------- 5. CARRITO ----------
function addToCart(candle){
  const existing = cart.find(item => item.id === candle.id);
  if(existing){
    existing.qty += 1;
  } else {
    cart.push({ id: candle.id, name: candle.name, price: candle.price, wax: candle.wax, qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`${candle.name} se añadió al carrito 🕯️`);
}

function changeQty(id, delta){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function cartTotal(){
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartCountTotal(){
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");

function renderCart(){
  cartCountEl.textContent = cartCountTotal();

  if(cart.length === 0){
    cartItemsEl.innerHTML = `<p class="cart-empty" id="cartEmpty">Tu carrito está tan tranquilo como el mar en calma. Aún no hay velas aquí 🌊</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-swatch" style="background:${item.wax}"></div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">$${item.price} c/u</p>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Quitar una unidad">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Añadir una unidad">+</button>
        </div>
        <button class="remove-btn" data-action="remove" data-id="${item.id}">Quitar</button>
      </div>
    `).join("");
  }

  const total = cartTotal();
  cartTotalEl.textContent = `$${total.toFixed(0)}`;
  updateBudgetUI(total);
}

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const id = btn.dataset.id;
  if(btn.dataset.action === "inc") changeQty(id, 1);
  if(btn.dataset.action === "dec") changeQty(id, -1);
  if(btn.dataset.action === "remove") removeFromCart(id);
});

// ---------- 6. PRESUPUESTO (marea) ----------
const budgetInput = document.getElementById("budgetInput");
const tideFill = document.getElementById("tideFill");
const budgetStatus = document.getElementById("budgetStatus");

budgetInput.value = budget || "";

budgetInput.addEventListener("input", () => {
  budget = parseFloat(budgetInput.value) || 0;
  saveBudget();
  updateBudgetUI(cartTotal());
});

function updateBudgetUI(total){
  tideFill.classList.remove("is-warning", "is-over");
  budgetStatus.classList.remove("is-warning", "is-over");

  if(!budget || budget <= 0){
    tideFill.style.width = "0%";
    budgetStatus.textContent = "Ingresa un presupuesto para ver cuánto te queda.";
    return;
  }

  const pct = Math.min((total / budget) * 100, 100);
  tideFill.style.width = `${pct}%`;

  const remaining = budget - total;

  if(total > budget){
    tideFill.classList.add("is-over");
    budgetStatus.classList.add("is-over");
    budgetStatus.textContent = `Te pasaste por $${(total - budget).toFixed(0)}. Quizá sea hora de soltar una vela 🌙`;
  } else if(pct >= 80){
    tideFill.classList.add("is-warning");
    budgetStatus.classList.add("is-warning");
    budgetStatus.textContent = `Cuidado, te quedan solo $${remaining.toFixed(0)} de presupuesto.`;
  } else {
    budgetStatus.textContent = `Te quedan $${remaining.toFixed(0)} para seguir explorando aromas.`;
  }
}

// ---------- 7. DRAWER ----------
const cartToggle = document.getElementById("cartToggle");
const cartDrawer = document.getElementById("cartDrawer");
const cartClose = document.getElementById("cartClose");
const drawerOverlay = document.getElementById("drawerOverlay");

function openCart(){
  cartDrawer.classList.add("is-open");
  drawerOverlay.classList.add("is-open");
}
function closeCart(){
  cartDrawer.classList.remove("is-open");
  drawerOverlay.classList.remove("is-open");
}

cartToggle.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
drawerOverlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeCart(); });

// ---------- 8. CHECKOUT ----------
document.getElementById("checkoutBtn").addEventListener("click", () => {
  if(cart.length === 0){
    showToast("Tu carrito está vacío todavía 🌊");
    return;
  }
  const total = cartTotal();
  if(budget && total > budget){
    showToast("Vas a pasarte del presupuesto. ¡Revisa tu carrito!");
    return;
  }
  showToast(`¡Gracias por tu compra de $${total.toFixed(0)}! Tus velas llegarán pronto 🕯️`);
  cart = [];
  saveCart();
  renderCart();
  closeCart();
});

// ---------- 9. TOAST ----------
let toastTimer;
function showToast(msg){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

// ---------- 10. PERSISTENCIA (localStorage) ----------
function loadCart(){
  try{
    return JSON.parse(localStorage.getItem("nagomi_cart")) || [];
  }catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem("nagomi_cart", JSON.stringify(cart));
}
function loadBudget(){
  const val = parseFloat(localStorage.getItem("nagomi_budget"));
  return isNaN(val) ? 0 : val;
}
function saveBudget(){
  localStorage.setItem("nagomi_budget", String(budget));
}

// ---------- 11. INICIALIZAR CARRITO EN PANTALLA ----------
renderCart();
