// Logique Partagée B&L STORE : Panier, Favoris, Modales & WhatsApp
// Synchronisation multi-pages via localStorage

// État Global
let cart = [];
let wishlist = new Set();
let appliedDiscount = false;
let selectedPayment = 'wave';
let activeModalProduct = null;
let activeModalSize = null;
let activeModalQty = 1;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  updateCartUI();
  updateWishlistUI();
});

// Charger Panier et Wishlist depuis localStorage
function loadStoredData() {
  try {
    const savedCart = localStorage.getItem('bl_cart');
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  } catch (e) {
    cart = [];
  }

  try {
    const savedWishlist = localStorage.getItem('bl_wishlist');
    if (savedWishlist) {
      wishlist = new Set(JSON.parse(savedWishlist));
    }
  } catch (e) {
    wishlist = new Set();
  }
}

// Sauvegarder dans localStorage
function saveCart() {
  try {
    localStorage.setItem('bl_cart', JSON.stringify(cart));
  } catch (e) {}
}

function saveWishlist() {
  try {
    localStorage.setItem('bl_wishlist', JSON.stringify(Array.from(wishlist)));
  } catch (e) {}
}

// Générateur HTML d'une carte produit
function renderProductCardHTML(p) {
  const isWish = wishlist.has(p.id);
  const subtitle = p.note ? `<span style="font-size:12px; color:var(--text-muted); display:block; margin-top:2px;">${p.note}</span>` : '';
  const catLabel = p.cat === 'chaussures' ? 'Chaussure' : (p.cat === 'sandales' ? 'Sandale / Mule' : 'Parfum');

  return `
  <div class="product-card" onclick="openProductModal('${p.id}')">
    <div class="card-img-wrapper">
      <span class="badge-tag">${p.tag || 'B&L'}</span>
      <button class="wishlist-btn ${isWish ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="Favoris">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
      <img src="${p.image}" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-body">
      <span class="card-category">${catLabel}</span>
      <h3 class="card-title">${p.name}</h3>
      ${subtitle}
      <div class="card-price-row">
        <span class="card-price">${p.price.toLocaleString('fr-FR')} FCFA</span>
      </div>
      <div class="card-actions">
        <button class="btn-add-cart" onclick="event.stopPropagation(); quickAddToCart('${p.id}')">
          🛍️ Ajouter au panier
        </button>
      </div>
    </div>
  </div>`;
}

// Modal Détails Produit
function openProductModal(id) {
  activeModalProduct = ALL_PRODUCTS.find(p => p.id === id);
  if (!activeModalProduct) return;

  activeModalQty = 1;
  activeModalSize = activeModalProduct.sizes[0];

  const modalImgCol = document.getElementById('modalImgCol');
  if (modalImgCol) {
    modalImgCol.innerHTML = `<img src="${activeModalProduct.image}" alt="${activeModalProduct.name}">`;
  }

  const catLabel = activeModalProduct.cat === 'parfums' ? 'Parfum & Fragrance' : (activeModalProduct.cat === 'chaussures' ? 'Chaussure de Marque' : 'Sandale & Confort');
  const modalCatTag = document.getElementById('modalCatTag');
  if (modalCatTag) modalCatTag.textContent = catLabel;

  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = activeModalProduct.name;

  const modalPrice = document.getElementById('modalPrice');
  if (modalPrice) modalPrice.textContent = `${activeModalProduct.price.toLocaleString('fr-FR')} FCFA`;

  const modalQtyVal = document.getElementById('modalQtyVal');
  if (modalQtyVal) modalQtyVal.textContent = activeModalQty;

  const optLabel = document.getElementById('modalOptionLabel');
  if (optLabel) {
    optLabel.textContent = activeModalProduct.cat === 'parfums' ? 'Sélectionnez la contenance' : 'Sélectionnez la pointure';
  }

  // Rendu des boutons de taille/contenance
  const sizePicker = document.getElementById('modalSizePicker');
  if (sizePicker) {
    sizePicker.innerHTML = activeModalProduct.sizes.map(s => `
      <button class="size-btn ${s === activeModalSize ? 'active' : ''}" onclick="selectModalSize('${s}', this)">${s}</button>
    `).join('');
  }

  const modal = document.getElementById('productModal');
  if (modal) modal.classList.add('active');
}

function selectModalSize(size, el) {
  activeModalSize = size;
  document.querySelectorAll('#modalSizePicker .size-btn').forEach(btn => btn.classList.remove('active'));
  el.classList.add('active');
}

function changeQty(delta) {
  activeModalQty = Math.max(1, activeModalQty + delta);
  const qtyEl = document.getElementById('modalQtyVal');
  if (qtyEl) qtyEl.textContent = activeModalQty;
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('active');
}

// Ajout Rapide
function quickAddToCart(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  addToCart(p, p.sizes[0], 1);
}

function addModalItemToCart() {
  if (!activeModalProduct) return;
  addToCart(activeModalProduct, activeModalSize, activeModalQty);
  closeProductModal();
}

// Moteur du Panier
function addToCart(product, size, qty) {
  const existingIndex = cart.findIndex(item => item.product.id === product.id && item.size === size);
  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({ product, size, qty });
  }
  saveCart();
  updateCartUI();
  showToast(`Ajouté au panier: ${product.name} (${size}) x${qty}`);
}

function removeFromCart(index) {
  const item = cart[index];
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  if (item) showToast(`Article retiré: ${item.product.name}`);
}

function updateCartUI() {
  const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);

  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) cartCountEl.textContent = totalItems;

  const drawerCountEl = document.getElementById('cartDrawerCount');
  if (drawerCountEl) drawerCountEl.textContent = totalItems;

  const body = document.getElementById('cartDrawerBody');
  if (body) {
    if (cart.length === 0) {
      body.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:40px 0;">Votre panier est vide.</p>`;
    } else {
      body.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.product.image}" alt="${item.product.name}">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.product.name}</div>
            <div class="cart-item-meta">${item.product.cat === 'parfums' ? 'Contenance' : 'Pointure'}: <strong>${item.size}</strong> | Qté: <strong>${item.qty}</strong></div>
            <div class="cart-item-price">${(item.product.price * item.qty).toLocaleString('fr-FR')} FCFA</div>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart(${idx})" title="Supprimer">✕</button>
        </div>
      `).join('');
    }
  }

  // Totaux
  const subtotal = cart.reduce((acc, i) => acc + (i.product.price * i.qty), 0);
  const discount = appliedDiscount ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const subtotalEl = document.getElementById('subtotalVal');
  if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString('fr-FR')} FCFA`;

  const discountRow = document.getElementById('discountRow');
  if (discountRow) discountRow.style.display = appliedDiscount ? 'flex' : 'none';

  const discountVal = document.getElementById('discountVal');
  if (discountVal) discountVal.textContent = `-${discount.toLocaleString('fr-FR')} FCFA`;

  const totalEl = document.getElementById('totalVal');
  if (totalEl) totalEl.textContent = `${finalTotal.toLocaleString('fr-FR')} FCFA`;
}

function openCartDrawer() {
  updateCartUI();
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.add('active');
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.remove('active');
}

// Favoris (Wishlist)
function toggleWishlist(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (wishlist.has(id)) {
    wishlist.delete(id);
    showToast(`Retiré des favoris: ${p ? p.name : ''}`);
  } else {
    wishlist.add(id);
    showToast(`Ajouté aux favoris: ${p ? p.name : ''}`);
  }
  saveWishlist();
  updateWishlistUI();

  // Actualiser l'état visuel du bouton sur la page actuelle
  document.querySelectorAll(`.wishlist-btn`).forEach(btn => {
    // Si la fonction est appelée on peut re-rendre la grille de la page active
  });
  if (typeof renderCurrentPageProducts === 'function') {
    renderCurrentPageProducts();
  }
}

function updateWishlistUI() {
  const countEl = document.getElementById('wishlistCount');
  if (countEl) countEl.textContent = wishlist.size;
}

function openWishlistDrawer() {
  if (wishlist.size === 0) {
    showToast('Votre liste de favoris est vide.');
    return;
  }
  showToast(`Vous avez ${wishlist.size} article(s) dans vos favoris.`);
}

// Coupons
function applyCoupon() {
  const input = document.getElementById('couponInput');
  if (!input) return;
  const val = input.value.trim().toUpperCase();
  if (val === 'BL10') {
    appliedDiscount = true;
    updateCartUI();
    showToast('🎉 Code BL10 appliqué : -10% de réduction !');
  } else {
    showToast('❌ Code promo invalide.');
  }
}

// Tunnel de commande Checkout
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Votre panier est vide.');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('active');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('active');
}

function selectPayment(mode, el) {
  selectedPayment = mode;
  document.querySelectorAll('.payment-options .pay-option').forEach(opt => opt.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function submitOrder(e) {
  e.preventDefault();
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;

  const subtotal = cart.reduce((acc, i) => acc + (i.product.price * i.qty), 0);
  const discount = appliedDiscount ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const itemsSummary = cart.map(i => `• ${i.product.name} (${i.product.cat === 'parfums' ? 'Contenance' : 'Pointure'}: ${i.size}, Qté: ${i.qty}) — ${(i.product.price * i.qty).toLocaleString('fr-FR')} FCFA`).join('\n');
  const msg = `*NOUVELLE COMMANDE B&L STORE*\n\n` +
    `*Client:* ${name}\n` +
    `*Téléphone:* ${phone}\n` +
    `*Adresse de livraison:* ${address}\n` +
    `*Moyen de Paiement:* ${selectedPayment.toUpperCase()}\n\n` +
    `*Articles commandés:*\n${itemsSummary}\n\n` +
    `*Total à régler:* ${total.toLocaleString('fr-FR')} FCFA`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');

  cart = [];
  appliedDiscount = false;
  saveCart();
  updateCartUI();
  closeCheckoutModal();
  showToast('🎉 Merci ! Votre commande a été transmise sur WhatsApp.');
}

function subscribeNewsletter() {
  const input = document.getElementById('newsletterEmail');
  if (input && input.value) {
    showToast('Merci pour votre inscription à la newsletter B&L !');
    input.value = '';
  }
}

// Système de Toast
function showToast(msg) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✨ ${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
