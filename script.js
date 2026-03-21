function getCart() {
    const cart = localStorage.getItem('burgerCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('burgerCart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(id, name, price) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    saveCart(cart);
    showNotification(`${name} added to cart! 🍔`);
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        if (el) el.textContent = totalItems;
    });
}

function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    location.reload();
}

function updateQuantity(id, change) {
    let cart = getCart();
    const item = cart.find(item => item.id === id);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart(cart);
        location.reload();
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function displayCart() {
    const cart = getCart();
    const cartBody = document.getElementById('cartBody');
    const totalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartBody) return;
    
    if (cart.length === 0) {
        cartBody.innerHTML = '<tr><td colspan="5" class="empty-cart">Your cart is empty. Add some delicious burgers! 🍔</td></tr>';
        if (totalElement) totalElement.textContent = '0';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    cartBody.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td><button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button></td>
        `;
        cartBody.appendChild(row);
    });
    
    if (totalElement) totalElement.textContent = total.toFixed(2);
    if (checkoutBtn) checkoutBtn.disabled = false;
}

function setCheckoutTotal() {
    const total = getCartTotal();
    const amountElement = document.getElementById('amount');
    if (amountElement) {
        amountElement.textContent = total.toFixed(2);
    }
    
    const bdtAmount = total * 120;
    const bdtElement = document.getElementById('bdtAmount');
    if (bdtElement) {
        bdtElement.textContent = bdtAmount.toFixed(0);
    }
    
    const hiddenAmount = document.getElementById('totalAmount');
    if (hiddenAmount) {
        hiddenAmount.value = total;
    }
}

function processBkashPayment(event) {
    event.preventDefault();
    
    const bkashNumber = document.getElementById('bkashNumber').value;
    const bkashPin = document.getElementById('bkashPin').value;
    const total = getCartTotal();
    
    if (!bkashNumber || !bkashPin) {
        showNotification('❌ Please fill all fields!', '#e74c3c');
        return;
    }
    
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(bkashNumber)) {
        showNotification('❌ Invalid bKash number! Must be 01XXXXXXXXX (11 digits)', '#e74c3c');
        return;
    }
    
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(bkashPin)) {
        showNotification('❌ Invalid PIN! Must be 4 digits', '#e74c3c');
        return;
    }
    
    if (total === 0) {
        showNotification('❌ Your cart is empty!', '#e74c3c');
        return;
    }
    
    showNotification('💚 Processing bKash payment...', '#2ecc71');
    
    setTimeout(() => {
        localStorage.removeItem('burgerCart');
        
        const orderDetails = {
            orderId: 'ORD' + Date.now(),
            total: total,
            bkashNumber: bkashNumber,
            date: new Date().toLocaleString()
        };
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
        
        window.location.href = 'success.html';
    }, 1500);
}

function displayOrderDetails() {
    const orderDetails = localStorage.getItem('lastOrder');
    if (orderDetails) {
        const order = JSON.parse(orderDetails);
        document.getElementById('orderId').textContent = order.orderId;
        document.getElementById('orderTotal').textContent = order.total;
        document.getElementById('orderTotalBDT').textContent = (order.total * 120).toFixed(0);
        document.getElementById('orderDate').textContent = order.date;
        document.getElementById('bkashNumberDisplay').textContent = order.bkashNumber;
    }
}

function showNotification(message, bgColor = '#2ecc71') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.backgroundColor = bgColor;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    if (document.getElementById('cartBody')) {
        displayCart();
    }
    
    if (document.getElementById('bkashForm')) {
        setCheckoutTotal();
        document.getElementById('bkashForm').addEventListener('submit', processBkashPayment);
    }
    
    if (document.getElementById('orderDetails')) {
        displayOrderDetails();
    }
    
    // Initialize rating system for all 6 burgers
    for (let i = 1; i <= 6; i++) {
        if (document.getElementById(`reviews-${i}`)) {
            displayReviews(i);
            updateRatingDisplay(i);
            setupStarRating(i);
        }
    }

    // ========== RATING & REVIEWS SYSTEM ==========

// Get reviews from localStorage
function getReviews(productId) {
    const reviews = localStorage.getItem(`reviews_${productId}`);
    return reviews ? JSON.parse(reviews) : [];
}

// Save reviews to localStorage
function saveReviews(productId, reviews) {
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(reviews));
}

// Add a new review
function addReview(productId, name, rating, comment) {
    const reviews = getReviews(productId);
    const newReview = {
        id: Date.now(),
        name: name || 'Anonymous',
        rating: rating,
        comment: comment,
        date: new Date().toLocaleDateString()
    };
    reviews.push(newReview);
    saveReviews(productId, reviews);
    return reviews;
}

// Calculate average rating
function getAverageRating(productId) {
    const reviews = getReviews(productId);
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
}

// Display stars HTML for average rating
function displayAverageStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<span class="star-static">★</span>';
    }
    if (hasHalf) {
        starsHtml += '<span class="star-static">½</span>';
    }
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) {
        starsHtml += '<span class="star-static gray">★</span>';
    }
    return starsHtml;
}

// Display all reviews for a product
function displayReviews(productId) {
    const reviews = getReviews(productId);
    const container = document.getElementById(`reviews-${productId}`);
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = '<div class="no-reviews">⭐ No reviews yet. Be the first to review!</div>';
        return;
    }
    
    container.innerHTML = '';
    reviews.reverse().forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        
        let starsHtml = '';
        for (let i = 0; i < review.rating; i++) {
            starsHtml += '<span class="star-small">★</span>';
        }
        for (let i = review.rating; i < 5; i++) {
            starsHtml += '<span class="star-small" style="color: #ddd;">★</span>';
        }
        
        reviewDiv.innerHTML = `
            <div class="review-header">
                <span class="review-name">${escapeHtml(review.name)}</span>
                <span class="review-date">${review.date}</span>
            </div>
            <div class="review-stars">${starsHtml}</div>
            <div class="review-comment">${escapeHtml(review.comment)}</div>
        `;
        container.appendChild(reviewDiv);
    });
}

// Simple HTML escape to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update rating display for a product
function updateRatingDisplay(productId) {
    const avgRating = getAverageRating(productId);
    const avgStarsContainer = document.getElementById(`avg-stars-${productId}`);
    const ratingCountContainer = document.getElementById(`rating-count-${productId}`);
    
    if (avgStarsContainer) {
        avgStarsContainer.innerHTML = displayAverageStars(avgRating);
    }
    if (ratingCountContainer) {
        const count = getReviews(productId).length;
        ratingCountContainer.textContent = `(${count} ${count === 1 ? 'review' : 'reviews'})`;
    }
    
    // Update star rating input if exists
    const starInputs = document.querySelectorAll(`.star-input-${productId}`);
    if (starInputs.length > 0) {
        // Reset stars
        starInputs.forEach((star, index) => {
            star.classList.remove('active');
        });
    }
}

// Setup star rating input for a product
function setupStarRating(productId) {
    const stars = document.querySelectorAll(`.star-${productId}`);
    let selectedRating = 0;
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
        
        star.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Store selected rating for form submission
    window[`selectedRating_${productId}`] = () => selectedRating;
}
// Submit review function
function submitReview(productId) {
    // Get selected rating
    let selectedRating = 0;
    const stars = document.querySelectorAll(`.star-${productId}`);
    stars.forEach((star, index) => {
        if (star.classList.contains('active')) {
            selectedRating = index + 1;
        }
    });
    
    // Get name and comment
    const name = document.getElementById(`name-${productId}`).value.trim();
    const comment = document.getElementById(`comment-${productId}`).value.trim();
    
    // Validation
    if (selectedRating === 0) {
        showNotification('⭐ Please select a star rating!', '#ff6b35');
        return;
    }
    
    if (!comment) {
        showNotification('📝 Please write a review comment!', '#ff6b35');
        return;
    }
    
    // Add review
    addReview(productId, name, selectedRating, comment);
    
    // Clear form
    document.getElementById(`name-${productId}`).value = '';
    document.getElementById(`comment-${productId}`).value = '';
    stars.forEach(star => star.classList.remove('active'));
    
    // Update display
    displayReviews(productId);
    updateRatingDisplay(productId);
    
    showNotification('⭐ Thank you for your review!', '#2ecc71');
}
}); 