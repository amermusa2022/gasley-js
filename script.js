const navToggle = document.querySelector('.nav-toggle');
const navItems = document.querySelector('.nav-items');
const phoneSearch = document.querySelector('#phone-search');
const phoneCards = [...document.querySelectorAll('.phones .phone')];
const noResults = document.querySelector('#no-results');
const browseAllPhones = document.querySelector('#browse-all-phones');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const savedTheme = localStorage.getItem('gasley-theme');
const quickView = document.querySelector('.quick-view');
const quickViewImage = quickView.querySelector('.quick-view-image');
const quickViewTitle = quickView.querySelector('#quick-view-title');
const quickViewPrice = quickView.querySelector('.quick-view-price');
const quickViewClose = quickView.querySelector('.quick-view-close');
const quickViewAdd = quickView.querySelector('.quick-view-add');
const cartToggle = document.querySelector('.cart-toggle');
const cartCount = cartToggle.querySelector('.cart-count');
const cartDialog = document.querySelector('.cart-dialog');
const cartClose = cartDialog.querySelector('.cart-close');
const cartItems = cartDialog.querySelector('.cart-items');
const cartEmpty = cartDialog.querySelector('.cart-empty');
const copyrightYear = document.querySelector('#copyright-year');
const footerCartLink = document.querySelector('#footer-cart-link');
const cart = new Map(readSavedCart().map(({ productIndex, quantity }) => [productIndex, quantity]));

copyrightYear.textContent = String(new Date().getFullYear());
document.documentElement.classList.toggle('dark-mode', savedTheme === 'dark');
updateThemeToggle();
renderCart();

themeToggle.addEventListener('click', () => {
    const isDarkMode = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('gasley-theme', isDarkMode ? 'dark' : 'light');
    updateThemeToggle();
});

function updateThemeToggle() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
    themeIcon.classList.toggle('fa-moon', !isDarkMode);
    themeIcon.classList.toggle('fa-sun', isDarkMode);
}

navToggle.addEventListener('click', () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navToggle.setAttribute('aria-label', isExpanded ? 'Open navigation menu' : 'Close navigation menu');
    navItems.classList.toggle('active', !isExpanded);
});

navItems.addEventListener('click', (event) => {
    if (event.target.closest('.nav-link')) {
        navItems.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open navigation menu');
    }
});

phoneSearch.addEventListener('input', () => {
    const query = phoneSearch.value.trim().toLocaleLowerCase();
    let matchingPhones = 0;

    phoneCards.forEach((phone) => {
        const matches = phone.textContent.toLocaleLowerCase().includes(query);
        phone.hidden = !matches;
        if (matches) matchingPhones += 1;
    });

    noResults.hidden = matchingPhones > 0;
});

browseAllPhones.addEventListener('click', () => {
    phoneSearch.value = '';
    phoneSearch.dispatchEvent(new Event('input'));
});

phoneCards.forEach((phone, productIndex) => {
    phone.querySelector('.quick-view-trigger').addEventListener('click', () => {
        const image = phone.querySelector('img');
        quickViewImage.src = image.src;
        quickViewImage.alt = image.alt;
        quickViewTitle.textContent = phone.querySelector('h3').textContent;
        quickViewPrice.textContent = phone.querySelector('.phone-price').textContent;
        quickViewAdd.dataset.productIndex = String(productIndex);
        quickView.showModal();
    });

    phone.querySelector('.add-to-cart').addEventListener('click', () => {
        addToCart(productIndex);
    });
});

cartToggle.addEventListener('click', () => {
    renderCart();
    cartDialog.showModal();
});

footerCartLink.addEventListener('click', (event) => {
    event.preventDefault();
    renderCart();
    cartDialog.showModal();
});

cartClose.addEventListener('click', () => {
    cartDialog.close();
});

cartDialog.addEventListener('click', (event) => {
    if (event.target === cartDialog) {
        cartDialog.close();
        return;
    }

    const actionButton = event.target.closest('[data-cart-action]');
    if (!actionButton) return;

    const productIndex = Number(actionButton.dataset.productIndex);
    const quantity = cart.get(productIndex);
    if (!Number.isInteger(productIndex) || quantity === undefined) return;

    if (actionButton.dataset.cartAction === 'increase') {
        cart.set(productIndex, quantity + 1);
    } else if (actionButton.dataset.cartAction === 'decrease') {
        if (quantity === 1) cart.delete(productIndex);
        else cart.set(productIndex, quantity - 1);
    } else if (actionButton.dataset.cartAction === 'remove') {
        cart.delete(productIndex);
    }

    saveCart();
    renderCart();
});

cartDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        cartDialog.close();
    }
});

quickViewAdd.addEventListener('click', () => {
    addToCart(Number(quickViewAdd.dataset.productIndex));
    quickView.close();
});

quickViewClose.addEventListener('click', () => {
    quickView.close();
});

quickView.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        quickView.close();
    }
});

quickView.addEventListener('click', (event) => {
    if (event.target === quickView) {
        quickView.close();
    }
});

function readSavedCart() {
    const savedCart = localStorage.getItem('gasley-cart');
    if (!savedCart) return [];

    let items;
    try {
        items = JSON.parse(savedCart);
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        console.error('Saved shopping cart data is invalid; starting with an empty cart.', error);
        localStorage.removeItem('gasley-cart');
        return [];
    }

    if (!Array.isArray(items)) {
        console.error('Saved shopping cart data has an invalid format; starting with an empty cart.');
        localStorage.removeItem('gasley-cart');
        return [];
    }

    return items.filter((item) =>
        item &&
        Number.isInteger(item.productIndex) &&
        item.productIndex >= 0 &&
        item.productIndex < phoneCards.length &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
}

function addToCart(productIndex) {
    if (!Number.isInteger(productIndex) || !phoneCards[productIndex]) return;
    cart.set(productIndex, (cart.get(productIndex) || 0) + 1);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('gasley-cart', JSON.stringify(
        [...cart].map(([productIndex, quantity]) => ({ productIndex, quantity }))
    ));
}

function renderCart() {
    const itemCount = [...cart.values()].reduce((total, quantity) => total + quantity, 0);
    cartCount.textContent = String(itemCount);
    cartToggle.setAttribute(
        'aria-label',
        `Shopping cart: ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
    );
    cartEmpty.hidden = cart.size > 0;
    cartItems.replaceChildren();

    cart.forEach((quantity, productIndex) => {
        const phone = phoneCards[productIndex];
        if (!phone) return;

        const row = document.createElement('li');
        row.className = 'cart-item';

        const image = document.createElement('img');
        image.src = phone.querySelector('img').src;
        image.alt = '';

        const details = document.createElement('div');
        details.className = 'cart-item-details';
        const title = document.createElement('h3');
        title.textContent = phone.querySelector('h3').textContent;
        const quantityLabel = document.createElement('p');
        quantityLabel.textContent = `Quantity: ${quantity}`;
        const priceLabel = document.createElement('p');
        priceLabel.textContent = phone.querySelector('.phone-price').textContent;
        details.append(title, quantityLabel, priceLabel);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';
        controls.append(
            createCartAction('decrease', productIndex, 'Decrease quantity'),
            createCartAction('increase', productIndex, 'Increase quantity'),
            createCartAction('remove', productIndex, 'Remove item')
        );

        row.append(image, details, controls);
        cartItems.append(row);
    });
}

function createCartAction(action, productIndex, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cartAction = action;
    button.dataset.productIndex = String(productIndex);
    button.setAttribute('aria-label', label);
    button.textContent = action === 'increase' ? '+' : action === 'decrease' ? '−' : 'Remove';
    return button;
}