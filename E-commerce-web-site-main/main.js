// ===== DOM Elements =====
const cartBtn = document.getElementById("cart-btn");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const searchInput = document.getElementById("search-input");
const clearCartBtn = document.getElementById("clear-cart");
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
const searchPopup = document.getElementById("search-popup");
const searchResults = document.getElementById("search-results");
const closePopup = document.getElementById("close-popup");
const homeCategories = document.getElementById("home-categories");
const categoryTitle = document.getElementById("category-title");
const homeProducts = document.getElementById("home-products");
const homePagination = document.getElementById("home-pagination");
const notificationPopup = document.getElementById("notification-popup");
const closeNotification = document.getElementById("close-notification");
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.querySelector(".nav-menu");

// ===== Data =====
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = [];
let filteredProducts = [];

// Pagination
let currentPage = 1;
const itemsPerPage = 6;
const homeItemsPerPage = 10;

// Filters
let currentSort = "default";
let currentCategory = "all";

// Home Page Category
let homeCurrentCategory = "all";
let homeCurrentSort = "default";

// Base path
const basePath = window.location.pathname.includes("products")
  ? ""
  : "products/";

// Clothing categories
const clothingCategories = [
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "womens-dresses",
  "womens-bags",
  "womens-shoes",
  "womens-watches",
];

// ===== Debounce & Throttle Functions =====
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, delay = 200) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      fn(...args);
      last = now;
    }
  };
}

// ===== Fetch Products with Caching =====
async function fetchProducts() {
  try {
    // Check cache first
    const cached = localStorage.getItem("productsCache");
    const cacheTime = localStorage.getItem("productsCacheTime");
    const now = Date.now();

    if (cached && cacheTime && now - cacheTime < 3600000) {
      // 1 hour cache
      products = JSON.parse(cached);
      filteredProducts = [...products];
      currentPage = 1;
      applyFilters();
      return;
    }

    const res = await fetch("https://dummyjson.com/products?limit=100");
    const data = await res.json();
    products = data.products.filter((p) =>
      clothingCategories.includes(p.category)
    );

    // Cache the results
    localStorage.setItem("productsCache", JSON.stringify(products));
    localStorage.setItem("productsCacheTime", now.toString());

    filteredProducts = [...products];
    currentPage = 1;
    applyFilters();
  } catch (error) {
    console.error("API Error:", error);
    // Fallback to cached data if available
    const cached = localStorage.getItem("productsCache");
    if (cached) {
      products = JSON.parse(cached);
      filteredProducts = [...products];
      currentPage = 1;
      applyFilters();
    }
  }
}

// ===== Filters =====
function applyFilters() {
  let filtered = [...products];

  if (currentCategory !== "all") {
    filtered = filtered.filter((p) => p.category === currentCategory);
  }

  switch (currentSort) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "newest":
      filtered.sort((a, b) => b.id - a.id);
      break;
  }

  filteredProducts = filtered;
  currentPage = 1;
  renderProducts();
}

// ===== Render Products =====
function renderProducts() {
  const recommended = document.getElementById("recommended-products");
  const popular = document.getElementById("popular-products");
  const allProducts = document.getElementById("all-products");
  const paginationContainer = document.getElementById("pagination");

  if (recommended) recommended.innerHTML = "";
  if (popular) popular.innerHTML = "";
  if (allProducts) allProducts.innerHTML = "";
  if (homeProducts) homeProducts.innerHTML = "";
  if (paginationContainer) paginationContainer.innerHTML = "";

  const itemsPerPageCurrent = homeProducts ? homeItemsPerPage : itemsPerPage;
  const start = (currentPage - 1) * itemsPerPageCurrent;
  const end = start + itemsPerPageCurrent;
  const productsToShow = filteredProducts.slice(start, end);

  productsToShow.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
      <div class="rating">
        ${generateStars(p.rating || 4.5)}
        <span class="rating-text">(${
          Math.floor(Math.random() * 100) + 50
        })</span>
      </div>
      <h4>${p.title}</h4>
      <a href="${basePath}productsDetials.html?id=${
      p.id
    }" class="view-details" title="View Details">
        <i class="fas fa-eye"></i>
      </a>
      <div class="price">$${p.price}</div>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
    `;
    setTimeout(() => div.classList.add("show"), i * 100);

    if (allProducts) allProducts.appendChild(div);
    else if (homeProducts) homeProducts.appendChild(div);
    else i % 2 === 0 ? recommended.appendChild(div) : popular.appendChild(div);
  });

  if (homePagination) renderHomePaginationButtons();
  else renderPaginationButtons();
}

// ===== Pagination =====
function renderPaginationButtons() {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginationContainer = document.getElementById("pagination");
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
  prevBtn.className = "pagination-btn prev-btn";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderProducts();
  };
  paginationContainer.appendChild(prevBtn);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages)
    startPage = Math.max(1, endPage - maxVisiblePages + 1);

  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.innerText = "1";
    firstBtn.className = "pagination-btn page-btn";
    firstBtn.onclick = () => {
      currentPage = 1;
      renderProducts();
    };
    paginationContainer.appendChild(firstBtn);
    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.innerText = "...";
      dots.className = "pagination-dots";
      paginationContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = `pagination-btn page-btn ${
      currentPage === i ? "active" : ""
    }`;
    btn.onclick = () => {
      currentPage = i;
      renderProducts();
    };
    paginationContainer.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.innerText = "...";
      dots.className = "pagination-dots";
      paginationContainer.appendChild(dots);
    }
    const lastBtn = document.createElement("button");
    lastBtn.innerText = totalPages;
    lastBtn.className = "pagination-btn page-btn";
    lastBtn.onclick = () => {
      currentPage = totalPages;
      renderProducts();
    };
    paginationContainer.appendChild(lastBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
  nextBtn.className = "pagination-btn next-btn";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderProducts();
  };
  paginationContainer.appendChild(nextBtn);
}

// ===== Cart Functions =====
function addToCart(id, qty = 1) {
  const product = products.find((p) => p.id === id);
  const existing = cart.find((p) => p.id === id);
  if (existing) existing.qty += parseInt(qty);
  else cart.push({ ...product, qty: parseInt(qty) });
  renderCart();
  showToast(`${product.title} added to cart!`);
}

// ===== Toast Notification =====
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== Generate Stars for Rating =====
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = "";
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  return stars;
}

// ===== Show Notification Popup =====
function showNotification() {
  notificationPopup.style.display = "flex";
}

// ===== Advanced Notification System =====
function showAdvancedNotification(
  title,
  message,
  buttonText = "Shop Now",
  duration = 5000
) {
  const notificationContent = document.querySelector(".notification-content");
  notificationContent.querySelector("h3").textContent = title;
  notificationContent.querySelector("p").textContent = message;
  notificationContent.querySelector(".notification-btn").textContent =
    buttonText;

  notificationPopup.style.display = "flex";

  // Auto-hide after duration
  setTimeout(() => {
    notificationPopup.style.display = "none";
  }, duration);
}

function renderCart() {
  cartItemsContainer.innerHTML = "";
  cart.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.title} (x${item.qty})</span>
      <div>
        <button onclick="increaseQty(${idx})">+</button>
        <button onclick="removeItem(${idx})">Remove</button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });
  cartCount.innerText = cart.reduce((sum, i) => sum + i.qty, 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

function increaseQty(idx) {
  cart[idx].qty++;
  renderCart();
}
function removeItem(idx) {
  if (cart[idx].qty > 1) {
    cart[idx].qty--;
  } else {
    cart.splice(idx, 1);
  }
  renderCart();
}

clearCartBtn.addEventListener("click", () => {
  cart = [];
  renderCart();
});

// ===== Sidebar Toggle =====
cartBtn.addEventListener("click", () => cartSidebar.classList.add("active"));
document
  .getElementById("close-cart")
  .addEventListener("click", () => cartSidebar.classList.remove("active"));

// ===== Search with Debounce =====
searchInput.addEventListener(
  "input",
  debounce(() => {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll(".product").forEach((p) => {
      p.style.display = p.innerText.toLowerCase().includes(query)
        ? "block"
        : "none";
    });
  }, 300)
);

searchInput.addEventListener(
  "keyup",
  debounce(async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) return;

    try {
      const res = await fetch(
        `https://dummyjson.com/products/search?q=${query}`
      );
      const data = await res.json();
      searchResults.innerHTML =
        data.products.length === 0
          ? "<p>No results found</p>"
          : data.products
              .map(
                (p) => `
        <div class="product-result">
          <img src="${p.thumbnail}" alt="${p.title}">
          <strong>${p.title}</strong>
          <p>${p.description}</p>
          <b>$${p.price}</b>
          <button onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
      `
              )
              .join("");
      searchPopup.style.display = "flex";
    } catch (err) {
      console.error(err);
    }
  }, 300)
);

closePopup.addEventListener(
  "click",
  () => (searchPopup.style.display = "none")
);
window.onclick = (e) => {
  if (e.target === searchPopup) searchPopup.style.display = "none";
};

// ===== Notification Popup Events =====
if (closeNotification) {
  closeNotification.addEventListener("click", () => {
    notificationPopup.style.display = "none";
  });
}

if (notificationPopup) {
  notificationPopup.addEventListener("click", (e) => {
    if (e.target === notificationPopup) {
      notificationPopup.style.display = "none";
    }
  });
}

// ===== Scroll to Top with Throttle =====
window.addEventListener(
  "scroll",
  throttle(() => {
    scrollToTopBtn.style.display = window.scrollY > 100 ? "flex" : "none";
  }, 200)
);
scrollToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// ===== Year =====
document.getElementById("year").innerText = new Date().getFullYear();

// ===== Categories =====
async function loadCategories() {
  try {
    const res = await fetch("https://dummyjson.com/products/categories");
    const categories = await res.json();
    const menu = document.getElementById("categories-menu");
    menu.innerHTML =
      "<li onclick=\"setCategoryFilter('all')\">All Categories</li>";

    categories.forEach((cat) => {
      const name = cat.slug || cat.name || cat;
      if (clothingCategories.includes(name)) {
        const li = document.createElement("li");
        li.textContent =
          name.charAt(0).toUpperCase() + name.slice(1).replace("-", " ");
        li.onclick = () => {
          fetchProductsByCategory(name);
          menu.style.display = "none";
        };
        menu.appendChild(li);
      }
    });
  } catch (e) {
    console.error("Error loading categories", e);
  }
}

async function fetchProductsByCategory(category) {
  try {
    const res = await fetch(
      `https://dummyjson.com/products/category/${encodeURIComponent(category)}`
    );
    const data = await res.json();
    products = data.products.filter((p) =>
      clothingCategories.includes(p.category)
    );
    filteredProducts = [...products];
    currentCategory = category;
    currentPage = 1;
    applyFilters();
  } catch (e) {
    console.error(e);
  }
}

// ===== Sort & Filter =====
function setSort(sortType) {
  currentSort = sortType;
  applyFilters();
}
function setCategoryFilter(category) {
  currentCategory = category;
  applyFilters();
}

// ===== Dropdowns =====
document.addEventListener("DOMContentLoaded", function () {
  const categoriesBtn = document.getElementById("categories-btn");
  const sortBtn = document.getElementById("sort-btn");

  if (categoriesBtn) {
    categoriesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = categoriesBtn.parentElement;
      document.querySelectorAll(".dropdown").forEach((d) => {
        if (d !== dropdown) d.classList.remove("active");
      });
      dropdown.classList.toggle("active");
    });
  }

  if (sortBtn) {
    sortBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = sortBtn.parentElement;
      document.querySelectorAll(".dropdown").forEach((d) => {
        if (d !== dropdown) d.classList.remove("active");
      });
      dropdown.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown"))
      document
        .querySelectorAll(".dropdown")
        .forEach((d) => d.classList.remove("active"));
    if (e.target.closest(".dropdown-menu li"))
      document
        .querySelectorAll(".dropdown")
        .forEach((d) => d.classList.remove("active"));
  });
});

// ===== Home Page Category Functions =====
async function setHomeCategory(category) {
  homeCurrentCategory = category;
  document
    .querySelectorAll("#home-categories li")
    .forEach((li) => li.classList.remove("active"));
  document
    .querySelectorAll("#mobile-home-categories li")
    .forEach((li) => li.classList.remove("active"));
  event.target.classList.add("active");
  categoryTitle.textContent =
    category === "all"
      ? "All Products"
      : category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ");
  await fetchHomeProductsByCategory(category);
  // Do not call applyHomeFilters here, as renderProducts is called in fetchHomeProductsByCategory
}

async function fetchHomeProductsByCategory(category) {
  try {
    if (category === "all") {
      await fetchProducts();
    } else {
      const res = await fetch(
        `https://dummyjson.com/products/category/${encodeURIComponent(
          category
        )}`
      );
      const data = await res.json();
      products = data.products.filter((p) =>
        clothingCategories.includes(p.category)
      );
      filteredProducts = [...products];
    }
    currentPage = 1;
    renderProducts(); // Render immediately after fetching
  } catch (e) {
    console.error("Error loading home category products", e);
  }
}

function setHomeSort(sortType) {
  homeCurrentSort = sortType;
  document
    .querySelectorAll("#home-sort li")
    .forEach((li) => li.classList.remove("active"));
  document
    .querySelectorAll("#mobile-home-sort li")
    .forEach((li) => li.classList.remove("active"));
  event.target.classList.add("active");
  applyHomeFilters();
  closeMobileSidebar();
}

function applyHomeFilters() {
  let filtered = [...products];
  if (homeCurrentCategory !== "all") {
    filtered = filtered.filter((p) => p.category === homeCurrentCategory);
  }

  switch (homeCurrentSort) {
    case "price-low":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "newest":
      filtered.sort((a, b) => b.id - a.id);
      break;
    default:
      break;
  }

  filteredProducts = filtered;
  currentPage = 1;
  renderProducts();
}

function renderHomePaginationButtons() {
  const totalPages = Math.ceil(filteredProducts.length / homeItemsPerPage);
  const paginationContainer = document.getElementById("home-pagination");
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.className = "pagination-btn next-btn";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderProducts();
  };
  paginationContainer.appendChild(nextBtn);
}

// ===== Load Home Categories =====
async function loadHomeCategories() {
  try {
    const res = await fetch("https://dummyjson.com/products/categories");
    const categories = await res.json();
    homeCategories.innerHTML =
      '<li onclick="setHomeCategory(\'all\')" class="active">All Categories</li>';
    const mobileHomeCategories = document.getElementById(
      "mobile-home-categories"
    );
    mobileHomeCategories.innerHTML =
      '<li onclick="setHomeCategory(\'all\')" class="active">All Categories</li>';

    categories.forEach((cat) => {
      const name = cat.slug || cat.name || cat;
      if (clothingCategories.includes(name)) {
        const li = document.createElement("li");
        li.textContent =
          name.charAt(0).toUpperCase() + name.slice(1).replace("-", " ");
        li.onclick = () => setHomeCategory(name);
        homeCategories.appendChild(li);

        const mobileLi = li.cloneNode(true);
        mobileLi.onclick = () => {
          setHomeCategory(name);
          closeMobileSidebar();
        };
        mobileHomeCategories.appendChild(mobileLi);
      }
    });
  } catch (e) {
    console.error("Error loading home categories", e);
  }
}

// ===== Mobile Sidebar Functions =====
const mobileFilterToggle = document.getElementById("mobile-filter-toggle");
const mobileCategorySidebar = document.getElementById("mobile-category-sidebar");
const closeSidebar = document.getElementById("close-sidebar");

function closeMobileSidebar() {
  mobileCategorySidebar.classList.remove("active");
}

if (mobileFilterToggle && mobileCategorySidebar) {
  mobileFilterToggle.addEventListener("click", () => {
    mobileCategorySidebar.classList.add("active");
  });

  closeSidebar.addEventListener("click", closeMobileSidebar);

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (!mobileCategorySidebar.contains(e.target) && !mobileFilterToggle.contains(e.target)) {
      closeMobileSidebar();
    }
  });
}

// ===== Initialize =====
loadCategories();
loadHomeCategories();
fetchProducts();
renderCart();

// Show welcome notification after 3 seconds
setTimeout(() => {
  showAdvancedNotification(
    " Welcome to halazStyle!",
    "Discover amazing products with great deals. Get 20% off on your first purchase!",
    "Start Shopping"
  );
}, 3000);

// Show special offer notification after 10 seconds
setTimeout(() => {
  showAdvancedNotification(
    " Special Offer!",
    "Flash sale: 30% off on all watches! Limited time only.",
    "Shop Now"
  );
}, 10000);

// ===== Mobile Menu Toggle =====
if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  });

  // Close menu when clicking on a link
  navMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navMenu.classList.remove("active");
    }
  });
}

// ===== Mobile Search Toggle =====
const searchToggle = document.getElementById("search-toggle");
const searchBox = document.querySelector(".search-box");

if (searchToggle && searchBox) {
  searchToggle.addEventListener("click", () => {
    searchBox.classList.toggle("active");
    if (searchBox.classList.contains("active")) {
      searchInput.focus();
    }
  });

  // Close search when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchToggle.contains(e.target) && !searchBox.contains(e.target)) {
      searchBox.classList.remove("active");
    }
  });
}

// ===== Touch Events for Mobile =====
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const swipeDistance = touchEndX - touchStartX;

  if (Math.abs(swipeDistance) > swipeThreshold) {
    if (swipeDistance > 0) {
      // Swipe right - close cart if open
      if (cartSidebar.classList.contains("active")) {
        cartSidebar.classList.remove("active");
      }
    } else {
      // Swipe left - open cart
      cartSidebar.classList.add("active");
    }
  }
}

// ===== Responsive Image Loading =====
function loadResponsiveImages() {
  const productImages = document.querySelectorAll(".product img");
  productImages.forEach((img) => {
    if (window.innerWidth <= 480) {
      img.style.height = "120px";
    } else if (window.innerWidth <= 768) {
      img.style.height = "150px";
    } else {
      img.style.height = "200px";
    }
  });
}

// Load responsive images on page load and resize
window.addEventListener("load", loadResponsiveImages);
window.addEventListener("resize", loadResponsiveImages);

// ===== Improved Scroll Performance =====
let scrollTimeout;
window.addEventListener("scroll", () => {
  if (!scrollTimeout) {
    scrollTimeout = setTimeout(() => {
      // Show/hide scroll to top button
      if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = "flex";
      } else {
        scrollToTopBtn.style.display = "none";
      }
      scrollTimeout = null;
    }, 16); // ~60fps
  }
});

// ===== Keyboard Navigation =====
document.addEventListener("keydown", (e) => {
  // ESC to close modals
  if (e.key === "Escape") {
    if (cartSidebar.classList.contains("active")) {
      cartSidebar.classList.remove("active");
    }
    if (searchPopup.style.display === "flex") {
      searchPopup.style.display = "none";
    }
    if (notificationPopup.style.display === "flex") {
      notificationPopup.style.display = "none";
    }
  }

  // Ctrl+K to focus search
  if (e.ctrlKey && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
  }
});
