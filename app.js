"use strict";

// =========================
// CONFIGURATION
// =========================
const RESTAURANT_EMAIL = "tob.swindon@gmail.com"; 

// 🔴 PASTE YOUR API KEYS HERE
const WHATSAPP_API_KEY = "7670753"; 
const MY_PHONE_NUMBER = "447553484847"; 

// 🔴 PASTE YOUR 3 GOOGLE SHEET CSV LINKS HERE
const SHEET_MENU_URL    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZbAFYD3sVnAi-f-ocPfvHFGfja5fcBMmZOhJwHhvdVefahmRCwGHBGnnPnzr-MVbDNi4pbAYAEVG-/pub?gid=0&single=true&output=csv"; 
const SHEET_OFFERS_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZbAFYD3sVnAi-f-ocPfvHFGfja5fcBMmZOhJwHhvdVefahmRCwGHBGnnPnzr-MVbDNi4pbAYAEVG-/pub?gid=739546087&single=true&output=csv"; 
const SHEET_REVIEWS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZbAFYD3sVnAi-f-ocPfvHFGfja5fcBMmZOhJwHhvdVefahmRCwGHBGnnPnzr-MVbDNi4pbAYAEVG-/pub?gid=2124700402&single=true&output=csv"; 

/* =========================================
   DATA BRIDGE & INITIALIZATION
   ========================================= */
let menuData = (typeof MENU_DATA !== 'undefined') ? MENU_DATA : [];
let specialOffers = (typeof SPECIAL_OFFERS !== 'undefined') ? SPECIAL_OFFERS : [];
let reviewsData = (typeof REVIEWS_DATA !== 'undefined') ? REVIEWS_DATA : [];
let grouped = new Map(); 

// =========================
// Utilities
// =========================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// =========================
// GOOGLE SHEETS PARSER
// =========================
async function fetchAllData() {
    console.log("📊 Fetching live data...");
    Promise.all([
        fetchSheet(SHEET_MENU_URL, 'menu'),
        fetchSheet(SHEET_OFFERS_URL, 'offers'),
        fetchSheet(SHEET_REVIEWS_URL, 'reviews')
    ]).then(() => console.log("✅ All live data sync complete."));
}

async function fetchSheet(url, type) {
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sheet ${type} not found`);
    const text = await res.text();
    const rows = text.split('\n').slice(1);
    const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : "";

    const data = rows.map(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (type === 'menu') {
            if (cols.length < 4) return null;
            return {
                category: clean(cols[0]),
                name: clean(cols[1]),
                desc: clean(cols[2]),
                price: clean(cols[3]).includes('£') ? clean(cols[3]) : `£${clean(cols[3])}`,
                codes: clean(cols[4]) ? clean(cols[4]).split('|') : []
            };
        } else if (type === 'offers') {
            if (cols.length < 2) return null;
            return { title: clean(cols[0]), description: clean(cols[1]) };
        } else if (type === 'reviews') {
            if (cols.length < 3) return null;
            return {
                author: clean(cols[0]),
                rating: parseInt(clean(cols[1])) || 5,
                text: clean(cols[2]),
                time: clean(cols[3])
            };
        }
    }).filter(item => item !== null);

    if (data.length > 0) {
        if (type === 'menu') { menuData = data.filter(i => i.name); refreshApp(); } 
        else if (type === 'offers') { specialOffers = data; renderOffers(); } 
        else if (type === 'reviews') { reviewsData = data; loadStaticReviews(); }
    }
  } catch (err) { console.warn(`⚠️ Failed to load ${type}.`, err); }
}

// =========================
// CORE APP LOGIC
// =========================
function refreshApp() {
  grouped = new Map();
  for (const item of menuData) {
    const cat = item.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(item);
  }
  renderCategories();
  renderMenu();
}

function renderOffers() {
  const grid = document.getElementById('offersGrid');
  if(!grid || specialOffers.length === 0) return;
  grid.innerHTML = specialOffers.map(offer => `
    <div class="offer"><b>${offer.title}</b><span>${offer.description}</span></div>
  `).join('');
}

function loadStaticReviews() {
  const listEl = $("#googleReviews");
  if(!listEl || reviewsData.length === 0) return;
  const frag = document.createDocumentFragment();
  reviewsData.forEach(rv => {
      const div = document.createElement("div");
      div.className = "review";
      div.innerHTML = `<strong>${rv.author}</strong><div style="color:var(--color-accent);margin-top:.25rem">${"⭐".repeat(rv.rating)}</div><p>${rv.text}</p><small>${rv.time}</small>`;
      frag.appendChild(div);
  });
  listEl.style.opacity = '0';
  setTimeout(() => { listEl.innerHTML = ""; listEl.appendChild(frag); listEl.style.opacity = '1'; }, 200);
}

// =========================
// MENU & UI LOGIC
// =========================
const mobileMenu = $("#mobileMenu");
const hamburger = $("#hamburger");
const closeMenu = $("#closeMenu");

function setMenu(open) {
  mobileMenu.classList.toggle("active", open);
  mobileMenu.setAttribute("aria-hidden", String(!open));
  hamburger.setAttribute("aria-expanded", String(open));
  if (open) closeMenu.focus(); else hamburger.focus();
}
if(hamburger) hamburger.addEventListener("click", () => setMenu(true));
if(closeMenu) closeMenu.addEventListener("click", () => setMenu(false));
$$(".mLink").forEach(a => a.addEventListener("click", () => setMenu(false)));

const categoryList = $("#categoryList");
const menuGrid = $("#menuGrid");
const searchInput = $("#menuSearch");
let activeCategory = "Non-Veg Starters"; 
let activeFilters = new Set();
let menuExpanded = false; 

function renderCategories() {
  const categories = Array.from(grouped.keys());
  if (!grouped.has(activeCategory) && categories.length > 0) activeCategory = categories[0];
  
  const frag = document.createDocumentFragment();
  categoryList.innerHTML = "";
  for (const cat of categories) {
    const b = document.createElement("button");
    b.className = "cat" + (cat === activeCategory ? " active" : "");
    b.textContent = cat;
    b.addEventListener("click", () => {
      activeCategory = cat;
      menuExpanded = false; 
      searchInput.value = "";
      renderCategories();
      renderMenu();
      if (window.innerWidth < 900) menuGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    frag.appendChild(b);
  }
  categoryList.appendChild(frag);
}

function renderMenu() {
  const q = searchInput.value.trim().toLowerCase();
  menuGrid.innerHTML = "";
  
  if (q) {
    const list = menuData.filter(it => (it.name + " " + (it.desc || "")).toLowerCase().includes(q));
    if (!list.length) {
      menuGrid.innerHTML = '<div style="color:var(--text-muted);font-weight:800;grid-column:1/-1;text-align:center;">No items found.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(item => frag.appendChild(createCard(item)));
    menuGrid.appendChild(frag);
    return;
  }

  const list = grouped.get(activeCategory) || [];
  const initialDisplayCount = 6;
  const itemsToShow = menuExpanded ? list : list.slice(0, initialDisplayCount);

  const sectionTitle = document.createElement("div");
  sectionTitle.style.gridColumn = "1 / -1";
  sectionTitle.style.marginTop = "0.5rem";
  sectionTitle.style.marginBottom = "0.5rem";
  sectionTitle.innerHTML = `<h4 style="color:var(--color-accent); border-bottom:1px solid #eee; padding-bottom:5px;">${activeCategory}</h4>`;
  menuGrid.appendChild(sectionTitle);

  const frag = document.createDocumentFragment();
  itemsToShow.forEach(item => frag.appendChild(createCard(item)));
  menuGrid.appendChild(frag);

  if (list.length > initialDisplayCount && !menuExpanded) {
    const btnContainer = document.createElement("div");
    btnContainer.className = "view-more-container";
    const btn = document.createElement("button");
    btn.className = "btn-view-more";
    btn.innerHTML = `View All ${activeCategory} (${list.length}) <span>↓</span>`;
    btn.onclick = () => { menuExpanded = true; renderMenu(); };
    btnContainer.appendChild(btn);
    menuGrid.appendChild(btnContainer);
  }
}

function createCard(item) {
  const dim = activeFilters.size > 0 && item.codes && item.codes.some(c => activeFilters.has(c));
  const idx = menuData.indexOf(item); 
  const card = document.createElement("div");
  card.className = "card" + (dim ? " dim" : "");
  let tagHtml = item.codes && item.codes.length ? `<div class="tags">${item.codes.map(c => `[${c}]`).join(" ")}</div>` : "";

  card.innerHTML = `
    <div style="flex-grow:1;">
      <div class="card-head"><div class="name">${item.name}</div><div class="price">${item.price}</div></div>
      <div class="desc">${item.desc || ""}</div>
      ${tagHtml}
    </div>
    <button class="add" type="button" onclick="addToCart(${idx})">+ Add to Order</button>
  `;
  return card;
}

$$(".fbtn").forEach(b => {
  b.addEventListener("click", () => {
    const f = b.getAttribute("data-filter");
    if (activeFilters.has(f)) activeFilters.delete(f); else activeFilters.add(f);
    renderMenu();
  });
});
searchInput.addEventListener("input", () => renderMenu());

// =========================
// SPIN & WIN
// =========================
const codeKeys = ["MASALA", "ROGAN", "KORMA", "BALTI", "MADRAS", "VINDALOO", "TANDOORI"];
let spinCount = 0;
const today = new Date();
const todaysCode = codeKeys[(today.getDay() === 0 ? 6 : today.getDay() - 1)] + today.getDate();
const savedCode = localStorage.getItem('tob_discount');

if (savedCode && savedCode !== todaysCode) localStorage.removeItem('tob_discount');

if (localStorage.getItem('tob_discount') === todaysCode) {
  const msg = $("#spinMessage");
  if(msg) {
      msg.innerHTML = `🎉 DISCOUNT UNLOCKED! Use Code: <strong>${todaysCode}</strong><br><span style="font-size:.9rem;color:#666;font-weight:800">Call to order & quote this code!</span>`;
      msg.classList.add("unlocked");
      $("#spinBtn").disabled = true;
      $("#spinBtn").textContent = "You've already won!";
  }
}

function spinDinner() {
  const slots = [$("#slotStarter"), $("#slotMain"), $("#slotSide")];
  if(!slots[0]) return;
  slots.forEach(slot => { slot.classList.remove("spin-placeholder"); slot.innerHTML = ""; });

  const pools = [
    menuData.filter(i => ["Snack Bites", "Tandoori Khazana", "Non-Veg Starters"].includes(i.category)),
    menuData.filter(i => ["Veg Curries", "Non-Veg Curries", "Biryanis", "Combo Meals"].includes(i.category)),
    menuData.filter(i => ["Tandoor Breads", "Sides"].includes(i.category))
  ];
  let ticks = 0;
  const timer = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      if (pools[i].length) slots[i].textContent = pools[i][Math.floor(Math.random() * pools[i].length)].name;
    }
    ticks++;
    if (ticks > 14) {
      clearInterval(timer);
      spinCount++;
      $("#spinCount").textContent = String(spinCount);
      if (spinCount >= 3 && !localStorage.getItem('tob_discount')) {
        localStorage.setItem('tob_discount', todaysCode);
        const msg = $("#spinMessage");
        msg.innerHTML = `🎉 DISCOUNT UNLOCKED! Use Code: <strong>${todaysCode}</strong>`;
        msg.classList.add("unlocked");
        $("#spinBtn").disabled = true;
        $("#spinBtn").textContent = "You've already won!";
      }
    }
  }, 90);
}
if($("#spinBtn")) $("#spinBtn").addEventListener("click", spinDinner);

const pairSelect = $("#pairingSelect");
if(pairSelect) {
    pairSelect.addEventListener("change", () => {
      const main = pairSelect.value;
      if (!main) { $("#pairingResult").classList.remove("active"); return; }
      $("#sugSide").textContent = "Garlic Naan";
      $("#sugStart").textContent = "Onion Bhaji";
      $("#pairingResult").classList.add("active");
    });
}

// =========================
// CART & ORDER LOGIC
// =========================
let cart = [];
try { cart = JSON.parse(localStorage.getItem("tob_cart") || "[]"); } catch (e) { cart = []; }
const cartFloat = $("#cartFloat");
const cartModal = $("#cartModal");
const cartItemsList = $("#cartItemsList");
const cartTotalDisplay = $("#cartTotalDisplay");
const cartCount = $("#cartCount");
const toast = $("#toast");

function saveCart() { localStorage.setItem("tob_cart", JSON.stringify(cart)); }
function showToast() { toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }

function addToCart(index) {
  const itemToAdd = menuData[index];
  const existingItem = cart.find(i => i.name === itemToAdd.name);
  if (existingItem) existingItem.qty = (existingItem.qty || 1) + 1;
  else cart.push({ ...itemToAdd, qty: 1 });
  saveCart(); updateCartUI(); showToast();
}
window.addToCart = addToCart;

function removeFromCart(index) {
  if (cart[index].qty > 1) cart[index].qty--;
  else cart.splice(index, 1);
  saveCart(); updateCartUI();
  if (cart.length === 0) { cartFloat.style.display = "none"; closeCart(); }
}
window.removeFromCart = removeFromCart;

function incrementItem(index) {
  cart[index].qty++; saveCart(); updateCartUI();
}
window.incrementItem = incrementItem;

function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  cartCount.textContent = String(totalQty);
  cartItemsList.innerHTML = "";

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<div style="text-align:center;padding:2rem 0;color:#888;"><p style="font-size:3rem;margin-bottom:.5rem;">🍛</p><p>Cart empty</p><button onclick="closeCart()" style="margin-top:1rem;color:var(--color-accent);background:none;border:none;font-weight:700;cursor:pointer;">Browse Menu</button></div>`;
    $("#cartTotalDisplay").style.display = 'none';
    $("#cartForm").style.display = 'none';
    cartFloat.style.display = "none";
    return;
  }

  $("#cartTotalDisplay").style.display = 'block';
  $("#cartForm").style.display = 'block';
  cartFloat.style.display = "flex";

  let total = 0;
  const frag = document.createDocumentFragment();
  cart.forEach((item, i) => {
    const p = parseFloat(String(item.price).replace("£", "")) || 0;
    const q = item.qty || 1;
    total += p * q;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div style="flex:1"><strong style="display:block;font-size:.95rem">${item.name}</strong><span style="color:#666;font-size:.85rem;font-weight:700">£${p.toFixed(2)}</span></div>
      <div style="display:flex;align-items:center;gap:12px;background:#f3f3f3;padding:4px 10px;border-radius:20px;">
        <button onclick="removeFromCart(${i})" style="border:none;background:transparent;color:#D9772B;font-weight:900;cursor:pointer;font-size:1.1rem;line-height:1;">−</button>
        <span style="font-weight:700;font-size:0.9rem;min-width:15px;text-align:center;">${q}</span>
        <button onclick="incrementItem(${i})" style="border:none;background:transparent;color:#D9772B;font-weight:900;cursor:pointer;font-size:1.1rem;line-height:1;">+</button>
      </div>`;
    frag.appendChild(row);
  });
  cartItemsList.appendChild(frag);
  cartTotalDisplay.textContent = `Total: £${total.toFixed(2)}`;
}

function openCart() { cartModal.classList.add("open"); cartModal.setAttribute("aria-hidden", "false"); }
function closeCart() { cartModal.classList.remove("open"); cartModal.setAttribute("aria-hidden", "true"); }
window.closeCart = closeCart;

if($("#closeCart")) $("#closeCart").addEventListener("click", closeCart);
if(cartFloat) cartFloat.addEventListener("click", openCart);

function sendSilentWhatsApp(message) {
  const text = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${MY_PHONE_NUMBER}&text=${text}&apikey=${WHATSAPP_API_KEY}`;
  fetch(url, { mode: 'no-cors' }).catch(e => console.error("WhatsApp failed", e));
}

const cartForm = $("#cartForm");
if(cartForm) {
    cartForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = cartForm.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.textContent = "Sending...";
      btn.disabled = true;

      const formData = new FormData(cartForm);
      const type = formData.get("service_type");
      const name = formData.get("name");
      const phone = formData.get("phone");
      const time = formData.get("time");

      let total = 0;
      const itemsStr = cart.map(i => {
        const p = parseFloat(i.price.replace("£", ""));
        const q = i.qty || 1;
        total += p * q;
        return `${q}x ${i.name} (£${(p * q).toFixed(2)})`;
      }).join("\n");

      const fullOrderText = `NEW ORDER 🍛\nType: ${type}\nName: ${name}\nPhone: ${phone}\nTime: ${time}\n\nITEMS:\n${itemsStr}\n\nTOTAL: £${total.toFixed(2)}`;
      formData.append("_captcha", "false");
      formData.append("_subject", `New Order (${type}) - ${name}`);
      formData.append("order_details", fullOrderText);

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${RESTAURANT_EMAIL}`, {
          method: "POST", body: formData, headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          sendSilentWhatsApp(fullOrderText);
          cartForm.style.display = "none";
          cartItemsList.style.display = "none";
          cartTotalDisplay.style.display = "none";
          $("#cartSuccess").style.display = "block";
          cart = [];
          saveCart();
          cartFloat.style.display = "none";
        } else {
          throw new Error("Email failed");
        }
      } catch (err) {
        alert("Error sending order. Please call the restaurant.");
        btn.textContent = txt;
        btn.disabled = false;
      }
    });
}

const bookingForm = $("#bookingForm");
if(bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = bookingForm.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.textContent = "Sending...";
      btn.disabled = true;
      
      const formData = new FormData(bookingForm);
      const name = formData.get("name");
      const date = formData.get("date");
      const time = formData.get("time");
      const guests = formData.get("guests");
      const phone = formData.get("phone");
      
      const bookingText = `NEW BOOKING 📅\nName: ${name}\nPhone: ${phone}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}`;
      formData.append("_captcha", "false");
      formData.append("_subject", "New Table Reservation");

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${RESTAURANT_EMAIL}`, {
          method: "POST", body: formData, headers: { "Accept": "application/json" }
        });
        
        if (res.ok) {
            sendSilentWhatsApp(bookingText);
            $("#formContainer").style.display = "none";
            $("#successMessage").style.display = "block";
        } else {
            throw new Error("Email failed");
        }
      } catch (err) {
        alert("Error sending booking. Please call us.");
        btn.textContent = txt;
        btn.disabled = false;
      }
    });
}
if($("#bookAnother")) $("#bookAnother").addEventListener("click", () => location.reload());
if($("#closeSuccess")) $("#closeSuccess").addEventListener("click", () => location.reload());

const backToTopBtn = document.getElementById("backToTop");
if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) backToTopBtn.classList.add("visible");
    else backToTopBtn.classList.remove("visible");
  });
  backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// =========================
// SMART DATE & TIME LOGIC
// =========================
function checkRestaurantStatus() {
  const now = new Date();
  const day = now.getDay(); 
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour + (minute / 60);
  const badge = document.getElementById("statusBadge");
  const text = document.getElementById("statusText");

 let isOpen = false;
  if (day === 1) { // Monday
    isOpen = false;
  } else if (day >= 2 && day <= 4) { // Tue - Thu
    if (currentTime >= 17 && currentTime < 22) isOpen = true;
  } else { // Fri (5), Sat (6), Sun (0)
    if ((currentTime >= 12 && currentTime < 15) || (currentTime >= 17 && currentTime < 22)) isOpen = true;
  }

  if(badge && text) {
      badge.classList.remove("loading", "open", "closed");
      if (isOpen) { badge.classList.add("open"); text.textContent = "Open Now"; } 
      else { badge.classList.add("closed"); text.textContent = "Closed"; }
  }
}

function generateTimeSlots(dateInput) {
  let dateObj;
  // Create date object (ensure it parses correctly)
  // We add T12:00:00 to avoid timezone issues shifting the day
  if (dateInput) {
      dateObj = new Date(dateInput + "T12:00:00");
  } else {
      dateObj = new Date();
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return [];

  const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const slots = [];

// 1. Lunch Slots (Fri, Sat & Sun) - Now includes Friday (5)
  if (day === 0 || day === 6 || day === 5) {
      const lunchSlots = ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45"];
      slots.push(...lunchSlots);
  }

  // 2. Dinner (All days except Monday)
  if (day !== 1) { 
      for (let h = 17; h < 22; h++) {
        for (let m = 0; m < 60; m += 15) {
          slots.push(`${h}:${m === 0 ? '00' : m}`);
        }
      }
  }
  return slots;
}

function updateDropdown(selectElement, dateValue) {
    if (!selectElement) return;

    const timeOptions = generateTimeSlots(dateValue);
    
    // Clear old options
    selectElement.innerHTML = '<option value="" disabled selected>Select Time</option>';
    
    if (timeOptions.length === 0) {
         const opt = document.createElement("option");
         opt.textContent = "Closed on this day";
         opt.disabled = true;
         selectElement.appendChild(opt);
    } else {
        timeOptions.forEach(time => {
            const opt = document.createElement("option");
            opt.value = time;
            opt.textContent = time;
            selectElement.appendChild(opt);
        });
    }
}

/* =========================================
   Feature: FOMO Social Proof (Smart Open/Closed Logic)
   ========================================= */

function startFomo() {
    if (typeof menuData === 'undefined' || menuData.length === 0) return;
    const toast = document.getElementById('fomo-toast');
    if (!toast) return;

    const locations = [
        "Swindon", "Rodbourne", "Old Town", "Stratton", 
        "West Swindon", "Cirencester", "Royal Wootton Bassett"
    ];

    const openActions = ["just ordered", "is checking out with", "added to cart:", "is viewing the"];
    const closedActions = ["recently ordered", "rated 5 stars:", "recommends the", "loved the"];

    function isRestaurantOpen() {
        const now = new Date();
        const day = now.getDay(); 
        const hour = now.getHours();
        const minute = now.getMinutes();
        const time = hour + (minute / 60);

        if (day === 1) return false; 
        if (day >= 2 && day <= 5) { return (time >= 17 && time < 22); }
        if (day === 6 || day === 0) { return (time >= 12 && time < 14) || (time >= 17 && time < 22); }
        return false;
    }

    function showNotification() {
        const isOpen = isRestaurantOpen();
        const randomItem = menuData[Math.floor(Math.random() * menuData.length)];
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        
        let action, timeText;

        if (isOpen) {
            action = openActions[Math.floor(Math.random() * openActions.length)];
            const mins = Math.floor(Math.random() * 9) + 1;
            timeText = `${mins} mins ago`;
        } else {
            action = closedActions[Math.floor(Math.random() * closedActions.length)];
            const pastOptions = ["Yesterday", "Last night", "2 days ago"];
            timeText = pastOptions[Math.floor(Math.random() * pastOptions.length)];
        }

        toast.innerHTML = `
            <div class="fomo-icon">TB</div>
            <div>
                <strong>Someone in ${randomLoc}</strong>
                <span>${action} <b>${randomItem.name}</b> <br>
                <small style="color:#888; font-size:10px;">${timeText}</small></span>
            </div>
        `;

        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 500); 
        }, 5000);
    }

    let count = 0; 
    const MAX_SHOWS = 3;

    function runSequence() {
        if (count >= MAX_SHOWS) return; 
        showNotification();
        count++;
    }

    setTimeout(() => {
        runSequence();
        setInterval(runSequence, 60000); 
    }, 10000);
}

/* =========================================
   Feature: Airbnb-Style Guest Counter
   ========================================= */
const GUEST_AVATARS = ["👨", "👩", "🧑", "👧", "👦", "👵", "👴", "👱", "👲", "🧕", "👮", "👷", "💂"];

function initGuestWidget() {
    console.log("👥 Initializing Guest Widget...");
    const visualContainer = document.getElementById('guest-visuals');
    const displayNum = document.getElementById('guestCountDisplay');
    const hiddenInput = document.getElementById('guestsInput');
    const btnPlus = document.getElementById('guestPlus');
    const btnMinus = document.getElementById('guestMinus');
    
    if(!visualContainer || !displayNum || !btnPlus || !btnMinus) {
        console.warn("⚠️ Guest widget elements not found.");
        return;
    }

    let currentCount = 2; 
    const MIN_GUESTS = 1;
    const MAX_GUESTS = 20;

    function updateDisplay() {
        displayNum.textContent = currentCount;
        hiddenInput.value = currentCount;
        visualContainer.innerHTML = ''; 
        for (let i = 0; i < currentCount; i++) {
            const span = document.createElement('span');
            span.className = 'guest-char';
            const avatarIndex = i % GUEST_AVATARS.length;
            span.textContent = GUEST_AVATARS[avatarIndex];
            span.style.animationDelay = `${i * 0.05}s`;
            visualContainer.appendChild(span);
        }
        btnMinus.disabled = (currentCount <= MIN_GUESTS);
        btnPlus.disabled = (currentCount >= MAX_GUESTS);
    }

    btnPlus.addEventListener('click', () => {
        if (currentCount < MAX_GUESTS) { currentCount++; updateDisplay(); }
    });

    btnMinus.addEventListener('click', () => {
        if (currentCount > MIN_GUESTS) { currentCount--; updateDisplay(); }
    });

    updateDisplay();
}

// =========================
// INITIALIZATION (Robust)
// =========================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 App Initialized");

    // 1. Setup Booking Form Date/Time Logic
    // We use querySelector to find the input even if ID is missing
    const bookingDateInput = document.getElementById("bookingDate") || document.querySelector('input[name="date"]');
    const bookingTimeSelect = document.getElementById("bookingTime") || document.querySelector('select[name="time"]');

    if (bookingDateInput && bookingTimeSelect) {
        console.log("✅ Booking form inputs found");
        
        // Set default date to TODAY
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayISO = `${yyyy}-${mm}-${dd}`; 

        bookingDateInput.value = todayISO;
        bookingDateInput.min = todayISO; // Disable past dates
        
        // Populate immediately
        updateDropdown(bookingTimeSelect, todayISO);

        // Update when user changes date
        bookingDateInput.addEventListener("change", (e) => {
            console.log("📅 Date changed to:", e.target.value);
            updateDropdown(bookingTimeSelect, e.target.value);
        });
    } else {
        console.warn("⚠️ Could not find Booking Date/Time inputs. Check index.html IDs.");
    }

    // 2. Setup Order Form Time Logic
    const orderTimeSelect = document.getElementById("orderTime");
    if(orderTimeSelect) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        updateDropdown(orderTimeSelect, `${yyyy}-${mm}-${dd}`);
    }

    // 3. Start Features
    renderOffers();
    refreshApp(); 
    loadStaticReviews();
    if (typeof cart !== 'undefined' && cart.length) updateCartUI();
    const yearEl = document.getElementById("year");
    if(yearEl) yearEl.textContent = String(new Date().getFullYear());
    
    checkRestaurantStatus();
    setInterval(checkRestaurantStatus, 60000);
    
    // Trigger Data Fetch
    fetchAllData();
    
    // Start FOMO & Guest Widget
    startFomo();
    initGuestWidget();
});
