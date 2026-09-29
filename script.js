let search = document.querySelector(".search-box");

let searchIcon = document.querySelector('#search-icon');
if (searchIcon) {
    searchIcon.onclick = () => {
        search.classList.toggle('active');
    };
}

// Getting HTML elements
const feedbackForm = document.getElementById('feedbackForm');
const userEmailInput = document.getElementById('userEmail');
const userFeedbackInput = document.getElementById('userFeedback');
const feedbackDisplay = document.getElementById('feedbackDisplay');

// Google Apps Script Web App URL එක (Feedback සඳහා)
const FEEDBACK_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxSEmP_vlrBmBVEbuKH0diswkUiuyLqQBZ5_0CgmUn-mGaybU8fEaHZh_763zjQaKqH3g/exec";



// Page එක Load වන විට ලොග් වී ඇති පාරිභෝගිකයාගේ ඊමේල් එක Auto-fill කිරීම
document.addEventListener('DOMContentLoaded', () => {
    if (userEmailInput) {
        let loggedEmail = localStorage.getItem('loggedUserEmail') || localStorage.getItem('userEmail') || '';
        if (loggedEmail) {
            userEmailInput.value = loggedEmail;
        }
    }
});


// 2. Form submission event (Feedback සඳහා)
if (feedbackForm) {
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = userEmailInput ? userEmailInput.value.trim() : '';
        const feedback = userFeedbackInput ? userFeedbackInput.value.trim() : '';

        if (!email || !feedback) {
            alert("කරුණාකර සියලුම විස්තර පුරවන්න!");
            return;
        }

        const newFeedback = {
            email: email,
            feedback: feedback
        };

        let modal = document.getElementById('feedbackModal');
        let loadingState = document.getElementById('feedbackLoadingState');
        let successState = document.getElementById('feedbackSuccessState');

        if (modal) {
            modal.style.display = 'flex';
            if (loadingState) loadingState.style.display = 'block';
            if (successState) successState.style.display = 'none';
        }

        // Google Sheet එකට පමණක් Feedback යැවීම
        fetch(FEEDBACK_WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newFeedback)
        })
        .then(() => {
            if (loadingState) loadingState.style.display = 'none';
            if (successState) successState.style.display = 'block';

            if (userFeedbackInput) {
                userFeedbackInput.value = '';
            }
        })
        .catch(error => {
            if (modal) modal.style.display = 'none';
            console.error("දෝෂයක් ඇතිවිය:", error);
            alert('something is wrong, please try again');
        });
    });
}

function closeFeedbackModal() {
    let modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// --- CART FUNCTIONS ---

// Function to update price on screen when size changes
function updatePrice(priceElementId, price) {
    const priceSpan = document.getElementById(priceElementId);
    if (priceSpan) {
        priceSpan.textContent = "Rs. " + price + "/=";
    }
}

// Show price of default checked size when page loads
document.addEventListener('DOMContentLoaded', () => {
    const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
    checkedRadios.forEach(radio => {
        const price = radio.getAttribute('data-price');
        const nameAttr = radio.getAttribute('name');
        if (nameAttr) {
            const idNumber = nameAttr.replace('size', '');
            const priceSpanId = 'price' + idNumber;
            
            if (price) {
                updatePrice(priceSpanId, price);
            }
        }
    });
});

// Add to cart with dynamic price and size
function addToCartDynamic(productName, qtyId, sizeName) {
    let qtyInput = document.getElementById(qtyId);
    let quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    
    let selectedSize = 'M';
    let itemPrice = 1200;
    
    let sizeRadios = document.getElementsByName(sizeName);
    for (let radio of sizeRadios) {
        if (radio.checked) {
            selectedSize = radio.value;
            itemPrice = parseFloat(radio.getAttribute('data-price')) || 0;
            break;
        }
    }

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    let existingIndex = cartItems.findIndex(item => item.name === productName && item.size === selectedSize);

    if (existingIndex > -1) {
        cartItems[existingIndex].quantity += quantity;
    } else {
        cartItems.push({
            name: productName,
            price: itemPrice,
            quantity: quantity,
            size: selectedSize
        });
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartIcon();

    alert(`${productName} (${selectedSize}, ${quantity} qty) has been added to the cart!`);
}

// Update cart icon count
function updateCartIcon() {
    let cartCountSpan = document.getElementById('cart-count');
    if (cartCountSpan) {
        let currentCart = JSON.parse(localStorage.getItem('cartItems')) || [];
        let totalCount = currentCart.reduce((total, item) => total + item.quantity, 0);
        cartCountSpan.innerText = totalCount;
    }
}

function handleAdminLogin(event) {
    event.preventDefault(); 
    
    let passInput = document.getElementById('adminIndexPass').value;
    let errorMsg = document.getElementById('loginErrorMsg');

    if (passInput === "admin123") {
        if (errorMsg) errorMsg.innerText = "";
        alert("Login Successful!");
        window.location.href = 'admin.html';
    } else {
        if (errorMsg) errorMsg.innerText = "Incorrect password! Please try again.";
    }
}

// Render bill and show Order ID
function renderBill() {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let tableBody = document.getElementById('bill-items');
    let grandTotalSpan = document.getElementById('grand-total');
    let orderIdDisplay = document.getElementById('order-id-display');

    let currentOrderId = localStorage.getItem('currentOrderId');
    if (!currentOrderId) {
        currentOrderId = 'ORD-' + Date.now();
        localStorage.setItem('currentOrderId', currentOrderId);
    }

    if (orderIdDisplay) {
        orderIdDisplay.innerText = `Order ID: ${currentOrderId}`;
    }

    if (!tableBody || !grandTotalSpan) return;

    tableBody.innerHTML = '';

    if (cartItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No items in your cart.</td></tr>';
        grandTotalSpan.innerText = 'Rs. 0.00';
        return;
    }

    let grandTotal = 0;

    cartItems.forEach((item, index) => {
        let price = Number(item.price) || 0;
        let quantity = Number(item.quantity) || 0;
        let itemTotal = price * quantity;
        grandTotal += itemTotal;

        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name} (${item.size || 'N/A'})</td>
            <td>Rs. ${price}.00</td>
            <td>${quantity}</td>
            <td>Rs. ${itemTotal}.00</td>
            <td>
                <button onclick="decreaseQuantity(${index})" style="background: transparent; border: none; color: red; font-weight: bold; cursor: pointer;">❌</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    grandTotalSpan.innerText = `Rs. ${grandTotal}.00`;
}

// Decrease quantity by 1
function decreaseQuantity(index) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    if (cartItems[index]) {
        if (cartItems[index].quantity > 0) {
            cartItems[index].quantity -= 1;
        }
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    renderBill();
    updateCartIcon();
}

// Validate customer form fields
function validateCustomerForm() {
    let name = document.getElementById('custName') ? document.getElementById('custName').value.trim() : '';
    let phone = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : '';
    let whatsapp = document.getElementById('custWhatsapp') ? document.getElementById('custWhatsapp').value.trim() : '';
    let address = document.getElementById('custAddress') ? document.getElementById('custAddress').value.trim() : '';
    let postal = document.getElementById('custPostal') ? document.getElementById('custPostal').value.trim() : '';

    if (!name || !phone || !whatsapp || !address || !postal) {
        alert("Please fill in all customer details!");
        return false;
    }
    return true;
}

// Download PDF Invoice
function downloadPDF() {
    if (!validateCustomerForm()) return;

    const element = document.getElementById('invoice-bill');
    const opt = {
        margin:      10,
        filename:    'DC_Textile_Invoice.pdf',
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

// Process Payment & Direct Send to Google Sheet with Custom Modal Popup
function processPayment() {
    if (!validateCustomerForm()) return; 

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let allOrders = JSON.parse(localStorage.getItem('allOrders')) || [];
    let grandTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

    let currentOrderId = localStorage.getItem('currentOrderId') || ('ORD-' + Date.now());
    let orderDate = new Date().toLocaleString();

    let custName = document.getElementById('custName').value.trim();
    let custPhone = document.getElementById('custPhone').value.trim();
    let custWhatsapp = document.getElementById('custWhatsapp').value.trim();
    let custAddress = document.getElementById('custAddress').value.trim();
    let custPostal = document.getElementById('custPostal').value.trim();

    // 1. Save to Local Storage (for Admin Dashboard)
    let newOrder = {
        orderId: currentOrderId,
        date: orderDate,
        customer: {
            name: custName,
            phone: custPhone,
            whatsapp: custWhatsapp,
            address: custAddress,
            postal: custPostal
        },
        items: cartItems,
        total: grandTotal
    };

    allOrders.push(newOrder);
    localStorage.setItem('allOrders', JSON.stringify(allOrders));

    // 2. Format items into individual rows for Google Sheet
    let formattedData = [];
    cartItems.forEach((item, index) => {
        let itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
        formattedData.push({
            orderId: (index === 0) ? currentOrderId : '',
            date: (index === 0) ? orderDate : '',
            time: '',
            customerName: (index === 0) ? custName : '',
            phone: (index === 0) ? custPhone : '',
            whatsapp: (index === 0) ? custWhatsapp : '',
            address: (index === 0) ? custAddress : '',
            postal: (index === 0) ? custPostal : '',
            itemName: item.name || '',
            size: item.size || 'N/A',
            quantity: item.quantity,
            total: `Rs. ${itemTotal.toFixed(2)}`
        });
    });

    // Google Apps Script Web App URL (Order සඳහා)
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbybO6fKA-Ya4dp5ZkrkVrp7XtPtMPYS_7T2LI_iyX_JqIMKm6qGYMTT_8xSYvEMP9WN/exec";

    // 3. Show Custom Loading Modal Box (පේජ් එක මැද පෙන්වීම)
    let modal = document.getElementById('customModal');
    let loadingState = document.getElementById('modalLoadingState');
    let successState = document.getElementById('modalSuccessState');
    
    if (modal) {
        modal.style.display = 'flex';
        if (loadingState) loadingState.style.display = 'block';
        if (successState) successState.style.display = 'none';
    }

    // 4. Send data to Google Sheet using fetch
    fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData)
    })
    .then(() => {
        // 5. සේව් වී අවසන් වූ පසු Success පෙන්වීම
        if (loadingState) loadingState.style.display = 'none';
        if (successState) successState.style.display = 'block';

        localStorage.removeItem('cartItems');
        localStorage.removeItem('currentOrderId');
    })
    .catch(error => {
        if (modal) modal.style.display = 'none';
        console.error("Error:", error);
        alert('An error occurred while sending data. Please try again.');
    });
}

// Function to handle the OK button click after success
function closeSuccessAndRedirect() {
    let modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
    window.location.href = 'index.html';
}

// Page load event
document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon();
    renderBill();

    let cartContainer = document.querySelector('.cart-container');
    if (cartContainer) {
        cartContainer.style.cursor = 'pointer';
        cartContainer.addEventListener('click', () => {
            window.location.href = 'payment.html';
        });
    }
});

function openModal(imgElement) {
    let modal = document.getElementById("imageModal");
    let modalImg = document.getElementById("fullImage");
    
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = imgElement.src; 
    }
}

function closeModal() {
    let modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
    }
}




// =========================================
// MOBILE MENU
// =========================================

const menuIcon = document.getElementById("menu-icon");
const navbar = document.querySelector(".Navbar");
const menuOverlay = document.getElementById("menu-overlay");


// Open / Close menu
menuIcon.addEventListener("click", function () {

    navbar.classList.toggle("active");
    menuOverlay.classList.toggle("active");

    // Change menu icon
    if (navbar.classList.contains("active")) {
        menuIcon.classList.remove("bx-menu");
        menuIcon.classList.add("bx-x");
    } else {
        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }
});


// Close menu when overlay is clicked
menuOverlay.addEventListener("click", function () {

    navbar.classList.remove("active");
    menuOverlay.classList.remove("active");

    menuIcon.classList.remove("bx-x");
    menuIcon.classList.add("bx-menu");
});


// Close menu when a link is clicked
document.querySelectorAll(".Navbar a").forEach(function (link) {

    link.addEventListener("click", function () {

        navbar.classList.remove("active");
        menuOverlay.classList.remove("active");

        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    });

});
