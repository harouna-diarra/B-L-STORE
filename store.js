// Logique Partagée B&L STORE : Panier, Favoris, Modales & WhatsApp
// Synchronisation multi-pages via localStorage

// Configuration WhatsApp B&L STORE
const WHATSAPP_NUMBER = '221761706978';
const WHATSAPP_DISPLAY = '+221 76 170 69 78';

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
  injectWhatsAppFloatingWidget();
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

// Commande directe WhatsApp pour une carte produit
function quickOrderWhatsApp(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const catOption = p.cat === 'parfums' ? 'Contenance standard' : (p.sizes && p.sizes.length ? `Pointure: ${p.sizes[0]}` : '');
  const msg = `*COMMANDE B&L STORE*\n\n` +
    `Bonjour B&L STORE, je souhaite commander cet article :\n` +
    `• *Produit:* ${p.name}\n` +
    `• *Prix:* ${p.price.toLocaleString('fr-FR')} FCFA\n` +
    (catOption ? `• *Option:* ${catOption}\n\n` : '\n') +
    `Pouvez-vous me confirmer la disponibilité et planifier la livraison svp ?`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Ouverture de WhatsApp pour commander...');
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

// Commande directe WhatsApp depuis la modale produit
function orderModalItemDirectWhatsApp() {
  if (!activeModalProduct) return;
  const sizeLabel = activeModalProduct.cat === 'parfums' ? 'Contenance' : 'Pointure';
  const totalPrice = (activeModalProduct.price * activeModalQty).toLocaleString('fr-FR');
  const msg = `*COMMANDE DIRECTE B&L STORE*\n\n` +
    `Bonjour B&L STORE, je souhaite commander cet article :\n` +
    `• *Article:* ${activeModalProduct.name}\n` +
    `• *${sizeLabel}:* ${activeModalSize}\n` +
    `• *Quantité:* ${activeModalQty}\n` +
    `• *Prix total:* ${totalPrice} FCFA\n\n` +
    `Pouvez-vous me confirmer la disponibilité et planifier la livraison à mon adresse svp ?`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeProductModal();
  showToast('Redirection vers WhatsApp pour valider votre commande...');
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

// Envoi direct du panier vers WhatsApp
function directCartWhatsAppOrder() {
  if (cart.length === 0) {
    showToast('Votre panier est vide.');
    return;
  }
  const subtotal = cart.reduce((acc, i) => acc + (i.product.price * i.qty), 0);
  const discount = appliedDiscount ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const itemsSummary = cart.map(i => `• ${i.product.name} (${i.product.cat === 'parfums' ? 'Contenance' : 'Pointure'}: ${i.size}, Qté: ${i.qty}) — ${(i.product.price * i.qty).toLocaleString('fr-FR')} FCFA`).join('\n');
  const promoText = appliedDiscount ? `\n*Code promo BL10 appliqué:* -${discount.toLocaleString('fr-FR')} FCFA` : '';

  const msg = `*COMMANDE PANIER B&L STORE*\n\n` +
    `Bonjour B&L STORE, je souhaite valider les articles de mon panier :\n\n` +
    `${itemsSummary}${promoText}\n\n` +
    `*Total estimé:* ${total.toLocaleString('fr-FR')} FCFA\n\n` +
    `Pouvez-vous prendre en charge ma commande et me donner les modalités de livraison svp ?`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Transmission de votre panier vers WhatsApp...');
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
  const promoText = appliedDiscount ? `\n*Réduction Code BL10 (-10%):* -${discount.toLocaleString('fr-FR')} FCFA` : '';

  const msg = `*NOUVELLE COMMANDE B&L STORE* 🛍️\n\n` +
    `*Client:* ${name}\n` +
    `*Téléphone:* ${phone}\n` +
    `*Adresse de livraison:* ${address}\n` +
    `*Moyen de Paiement:* ${selectedPayment.toUpperCase()}\n\n` +
    `*Articles commandés:*\n${itemsSummary}${promoText}\n\n` +
    `*Total à régler:* ${total.toLocaleString('fr-FR')} FCFA\n\n` +
    `Merci de me confirmer la commande et le délai de livraison !`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

  cart = [];
  appliedDiscount = false;
  saveCart();
  updateCartUI();
  closeCheckoutModal();
  showToast(`🎉 Redirection vers WhatsApp (${WHATSAPP_DISPLAY}) !`);
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

// Widget Flottant WhatsApp interactif
function injectWhatsAppFloatingWidget() {
  if (document.getElementById('blFloatingWhatsApp')) return;
  const widget = document.createElement('a');
  widget.id = 'blFloatingWhatsApp';
  widget.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour B&L STORE, je souhaite passer une commande ou avoir des renseignements.")}`;
  widget.target = '_blank';
  widget.className = 'floating-wa-btn';
  widget.setAttribute('aria-label', `Commander sur WhatsApp ${WHATSAPP_DISPLAY}`);
  widget.innerHTML = `
    <div class="floating-wa-content">
      <span class="floating-wa-icon">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.03C9.36 7.03 9.09 7.09 8.87 7.33C8.65 7.57 8.02 8.16 8.02 9.36C8.02 10.56 8.9 11.72 9.02 11.89C9.14 12.05 10.73 14.5 13.17 15.56C13.75 15.81 14.2 15.96 14.56 16.07C15.14 16.26 15.67 16.23 16.09 16.17C16.55 16.1 17.52 15.58 17.72 15.01C17.93 14.44 17.93 13.96 17.87 13.86C17.81 13.76 17.65 13.7 17.41 13.58C17.17 13.46 15.99 12.88 15.77 12.8C15.55 12.72 15.39 12.68 15.23 12.92C15.07 13.16 14.6 13.7 14.46 13.86C14.32 14.02 14.18 14.04 13.94 13.92C13.7 13.8 12.69 13.47 11.49 12.4C10.56 11.57 9.93 10.55 9.81 10.35C9.69 10.15 9.8 10.04 9.92 9.92C10.03 9.81 10.17 9.62 10.29 9.48C10.41 9.34 10.45 9.24 10.53 9.08C10.61 8.92 10.57 8.78 10.51 8.66C10.45 8.54 9.98 7.37 9.78 6.9C9.59 6.43 9.39 6.5 9.24 6.5C9.1 6.5 8.94 6.5 8.78 6.5L9.53 7.03Z"/>
        </svg>
      </span>
      <span class="floating-wa-badge"></span>
      <span class="floating-wa-label">Commander sur WhatsApp</span>
    </div>
  `;
  document.body.appendChild(widget);
}

