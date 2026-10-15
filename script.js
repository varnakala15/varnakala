// =====================================================
// VARNAKALA SEARCH SYSTEM
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const searchBox = document.querySelector(".search-box");
    const searchIcon = document.querySelector("#search-icon");
    const searchInput = document.getElementById("site-search-input");

    // Open and close search box
    if (searchIcon && searchBox) {
        searchIcon.addEventListener("click", function () {
            searchBox.classList.toggle("active");

            if (searchBox.classList.contains("active") && searchInput) {
                searchInput.focus();
            }
        });
    }

    // Search from any page
    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();

                const query = searchInput.value.trim();

                if (query) {
                    window.location.href =
                        "search-results.html?q=" +
                        encodeURIComponent(query);
                }
            }
        });
    }

    // The remaining functions are needed only on the results page
    const resultsContainer =
        document.getElementById("search-product-container");

    if (!resultsContainer) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const query = (params.get("q") || "").trim().toLowerCase();

    const heading = document.getElementById("search-heading");
    const resultMessage = document.getElementById("search-message");

    if (searchInput) {
        searchInput.value = params.get("q") || "";
    }

    if (heading) {
        heading.textContent = query
            ? `Search Results for "${params.get("q")}"`
            : "Search Products";
    }

    if (!query) {
        if (resultMessage) {
            resultMessage.textContent = "Type a product name and press Enter to search.";
        }
        return;
    }

    // Add any other HTML product pages to this list when needed
    const productPages = [
        "index.html",
        "category-products.html",
        "products.html"
    ];

    async function collectProducts() {
        const products = [];
        const seenNames = new Set();

        for (const page of productPages) {
            try {
                const response = await fetch(page);

                if (!response.ok) {
                    console.warn("Could not load product page:", page);
                    continue;
                }

                const html = await response.text();
                const doc = new DOMParser().parseFromString(html, "text/html");

                doc.querySelectorAll(".product-section .box, .product-container .box")
                    .forEach(function (card) {

                        const titleElement = card.querySelector("h3");
                        const imageElement = card.querySelector("img");

                        if (!titleElement || !imageElement) {
                            return;
                        }

                        const name = titleElement.textContent.trim();
                        const key = name.toLowerCase();

                        // Avoid showing the same product twice
                        if (seenNames.has(key)) {
                            return;
                        }

                        const imageSource = imageElement.getAttribute("src");

                        if (!imageSource) {
                            return;
                        }

                        const image = new URL(imageSource, new URL(page, window.location.href)).href;

                        const section = card.closest(".category-section");

                        const category = section
                            ? section.id.replace("-section", "").replace(/-/g, " ")
                            : "Products";

                        const sizeInputs = Array.from(
                            card.querySelectorAll('.size-options input[type="radio"]')
                        );

                        const sizes = sizeInputs.map(function (radio) {
                            return {
                                size: radio.value,
                                price: Number(radio.dataset.price) || 0
                            };
                        });

                        // Reuse the existing cart product name when it is valid
                        const cartButton = card.querySelector(".cart-btn");
                        const onclickText = cartButton
                            ? cartButton.getAttribute("onclick") || ""
                            : "";

                        const nameMatch = onclickText.match(
                            /addToCartDynamic\(\s*(['"])(.*?)\1/
                        );

                        let cartName = nameMatch ? nameMatch[2] : name;

                        // Replace template placeholder names with the actual product name
                        if (/product name/i.test(cartName)) {
                            cartName = name;
                        }

                        const selectedRadio = sizeInputs.find(radio => radio.checked);
                        const defaultSize = selectedRadio
                            ? selectedRadio.value
                            : (sizes.some(item => item.size === "M") ? "M" : (sizes[0]?.size || "N/A"));

                        const defaultPrice = sizes.find(item => item.size === defaultSize)?.price
                            || sizes[0]?.price
                            || 0;

                        products.push({
                            name,
                            cartName,
                            image,
                            category,
                            sizes,
                            defaultSize,
                            defaultPrice
                        });

                        seenNames.add(key);
                    });

            } catch (error) {
                console.error("Error loading " + page, error);
            }
        }

        return products;
    }

    function createProductCard(product, index) {
        const card = document.createElement("div");
        card.className = "box";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.name;
        image.loading = "lazy";
        image.style.cursor = "pointer";
        image.addEventListener("click", function () {
            openProductDetails(card);
        });

        const title = document.createElement("h3");
        title.textContent = product.name;
        title.style.cursor = "pointer";

        title.addEventListener("click", function () {
            openProductDetails(card);
        });

        const content = document.createElement("div");
        content.className = "content";

        const priceCount = document.createElement("div");
        priceCount.className = "price-count";

        const priceId = `search-price-${index}`;
        const qtyId = `search-qty-${index}`;
        const sizeName = `search-size-${index}`;

        const priceSpan = document.createElement("span");
        priceSpan.id = priceId;
        priceSpan.textContent = `Rs. ${product.defaultPrice}/=`;
        priceCount.appendChild(priceSpan);

        const quantitySelector = document.createElement("div");
        quantitySelector.className = "quantity-selector";

        const quantityLabel = document.createElement("label");
        quantityLabel.htmlFor = qtyId;
        quantityLabel.textContent = "Qty:";

        const quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.id = qtyId;
        quantityInput.className = "qty-input";
        quantityInput.value = "1";
        quantityInput.min = "1";
        quantityInput.max = "100";

        quantitySelector.append(quantityLabel, quantityInput);
        priceCount.appendChild(quantitySelector);

        if (product.sizes.length) {
            const sizeSelector = document.createElement("div");
            sizeSelector.className = "size-selector";

            const sizeOptions = document.createElement("div");
            sizeOptions.className = "size-options";

            product.sizes.forEach(function (item) {
                const label = document.createElement("label");
                const radio = document.createElement("input");

                radio.type = "radio";
                radio.name = sizeName;
                radio.value = item.size;
                radio.dataset.price = String(item.price);
                radio.checked = item.size === product.defaultSize;

                radio.addEventListener("change", function () {
                    updatePrice(priceId, item.price);
                });

                label.append(radio, document.createTextNode(" " + item.size));
                sizeOptions.appendChild(label);
            });

            sizeSelector.appendChild(sizeOptions);
            priceCount.appendChild(sizeSelector);
        }

        const categoryText = document.createElement("p");
        categoryText.className = "search-product-category";
        categoryText.textContent = product.category;

        content.append(priceCount, categoryText);

        const button = document.createElement("button");
        button.className = "cart-btn";
        button.type = "button";
        button.textContent = "Add To Cart";

        button.addEventListener("click", function () {
            addToCartDynamic(product.cartName, qtyId, sizeName);
        });

        card.append(image, title, content, button);

        return card;
    }

    collectProducts().then(function (products) {
        const matches = products.filter(function (product) {
            return (
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query) ||
                product.sizes.some(item => item.size.toLowerCase().includes(query))
            );
        });

        resultsContainer.replaceChildren();

        if (matches.length === 0) {
            if (resultMessage) {
                resultMessage.textContent = "No matching products found.";
            }
            return;
        }

        if (resultMessage) {
            resultMessage.textContent = `${matches.length} product(s) found.`;
        }

        matches.forEach(function (product, index) {
            resultsContainer.appendChild(createProductCard(product, index));
        });

    }).catch(function (error) {
        console.error("Search error:", error);

        if (resultMessage) {
            resultMessage.textContent =
                "Could not load products. Please try again.";
        }
    });

});



// =====================================================
// FEEDBACK SYSTEM
// =====================================================

const feedbackForm = document.getElementById("feedbackForm");
const userEmailInput = document.getElementById("userEmail");
const userFeedbackInput = document.getElementById("userFeedback");
const feedbackDisplay = document.getElementById("feedbackDisplay");

// Google Apps Script Web App URL - Feedback
const FEEDBACK_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxSEmP_vlrBmBVEbuKH0diswkUiuyLqQBZ5_0CgmUn-mGaybU8fEaHZh_763zjQaKqH3g/exec";


// Auto-fill logged user email
document.addEventListener("DOMContentLoaded", () => {

    if (userEmailInput) {

        let loggedEmail =
            localStorage.getItem("loggedUserEmail") ||
            localStorage.getItem("userEmail") ||
            "";

        if (loggedEmail) {
            userEmailInput.value = loggedEmail;
        }
    }
});


// Feedback form submit
if (feedbackForm) {

    feedbackForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = userEmailInput
            ? userEmailInput.value.trim()
            : "";

        const feedback = userFeedbackInput
            ? userFeedbackInput.value.trim()
            : "";

        if (!email || !feedback) {

            alert("කරුණාකර සියලුම විස්තර පුරවන්න!");
            return;
        }

        const newFeedback = {
            email: email,
            feedback: feedback
        };

        let modal = document.getElementById("feedbackModal");
        let loadingState =
            document.getElementById("feedbackLoadingState");
        let successState =
            document.getElementById("feedbackSuccessState");

        if (modal) {

            modal.style.display = "flex";

            if (loadingState) {
                loadingState.style.display = "block";
            }

            if (successState) {
                successState.style.display = "none";
            }
        }

        fetch(FEEDBACK_WEB_APP_URL, {

            method: "POST",
            mode: "no-cors",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(newFeedback)

        })

        .then(() => {

            if (loadingState) {
                loadingState.style.display = "none";
            }

            if (successState) {
                successState.style.display = "block";
            }

            if (userFeedbackInput) {
                userFeedbackInput.value = "";
            }

        })

        .catch(error => {

            if (modal) {
                modal.style.display = "none";
            }

            console.error("Feedback Error:", error);

            alert("Something is wrong. Please try again.");

        });
    });
}


function closeFeedbackModal() {

    let modal = document.getElementById("feedbackModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// =====================================================
// CART FUNCTIONS
// =====================================================


// Update product price
function updatePrice(priceElementId, price) {

    const priceSpan =
        document.getElementById(priceElementId);

    if (priceSpan) {

        priceSpan.textContent =
            "Rs. " + price + "/=";
    }
}


// Show default selected size price
document.addEventListener("DOMContentLoaded", () => {

    const checkedRadios =
        document.querySelectorAll(
            'input[type="radio"]:checked'
        );

    checkedRadios.forEach(radio => {

        const price =
            radio.getAttribute("data-price");

        const nameAttr =
            radio.getAttribute("name");

        if (nameAttr) {

            const idNumber =
                nameAttr.replace("size", "");

            const priceSpanId =
                "price" + idNumber;

            if (price) {
                updatePrice(
                    priceSpanId,
                    price
                );
            }
        }
    });
});


// =====================================================
// ADD TO CART
// =====================================================


function addToCartDynamic(productName, qtyId, sizeName) {
    const qtyInput = document.getElementById(qtyId);

    if (!qtyInput) {
        alert("Quantity input not found.");
        return;
    }

    // Read the minimum and maximum from the HTML input
    const minQty = Number(qtyInput.min) || 1;
    const maxQty = Number(qtyInput.max) || 100;

    const rawQty = qtyInput.value.trim();
    const quantity = Number(rawQty);

    // Validate quantity
    if (
        rawQty === "" ||
        !Number.isInteger(quantity) ||
        quantity < minQty ||
        quantity > maxQty
    ) {
        alert(
            `Please enter a whole-number quantity between ${minQty} and ${maxQty}.`
        );
        qtyInput.focus();
        return;
    }

    let selectedSize = "N/A";
    let itemPrice = 0;

    const sizeRadios = document.getElementsByName(sizeName);

    for (const radio of sizeRadios) {
        if (radio.checked) {
            selectedSize = radio.value;

            const rawPrice = radio.getAttribute("data-price");
            const parsedPrice = Number(rawPrice);

            // Empty or invalid prices are treated as price pending
            itemPrice =
                rawPrice !== null &&
                rawPrice.trim() !== "" &&
                Number.isFinite(parsedPrice) &&
                parsedPrice > 0
                    ? parsedPrice
                    : 0;

            break;
        }
    }

    // Mark the price as pending when no valid price exists
    const pricePending = itemPrice <= 0;

    let cartItems = [];

    try {
        cartItems = JSON.parse(
            localStorage.getItem("cartItems")
        ) || [];
    } catch (error) {
        cartItems = [];
    }

    const existingIndex = cartItems.findIndex(
        item =>
            item.name === productName &&
            item.size === selectedSize
    );

    if (existingIndex > -1) {
        const existingItem = cartItems[existingIndex];
        const newQuantity = Number(existingItem.quantity || 0) + quantity;

        if (newQuantity > maxQty) {
            alert(
                `The total quantity for this item cannot exceed ${maxQty}.`
            );
            return;
        }

        existingItem.quantity = newQuantity;
        existingItem.price = itemPrice;
        existingItem.priceOnRequest = pricePending;

    } else {
        cartItems.push({
            name: productName,
            price: itemPrice,
            priceOnRequest: pricePending,
            quantity: quantity,
            size: selectedSize
        });
    }

    localStorage.setItem(
        "cartItems",
        JSON.stringify(cartItems)
    );

    updateCartIcon();

    alert(
        `${productName} (${selectedSize}, ${quantity} qty) has been added to the cart!`
    );
}



// =====================================================
// UPDATE CART ICON
// =====================================================

function updateCartIcon() {

    let cartCountSpan =
        document.getElementById("cart-count");

    if (cartCountSpan) {

        let currentCart =
            JSON.parse(
                localStorage.getItem("cartItems")
            ) || [];

        let totalCount =
            currentCart.reduce(
                (total, item) =>
                    total + Number(item.quantity || 0),
                0
            );

        cartCountSpan.innerText =
            totalCount;
    }
}

// =====================================================
// ADD CUSTOM PRODUCT TO CART
// =====================================================

function addCustomProduct(button) {

    const product = button.closest(".custom-product");

    if (!product) {
        return;
    }

    const fileInput = product.querySelector(".custom-file-input");

    // Check file
    if (!fileInput || !fileInput.files.length) {
        alert("Please choose your design file.");
        return;
    }

    const file = fileInput.files[0];

    // Maximum file size = 4 MB
    const maxFileSize = 8 * 1024 * 1024;

    if (file.size > maxFileSize) {
        alert("Please choose a file smaller than 4 MB.");
        return;
    }

    const fileName = file.name;
    const fileType = file.type;

    const descriptionInput =
        product.querySelector(".custom-description");

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";

    // Get quantities
    const quantityInputs =
        product.querySelectorAll(".custom-size-quantity");

    let selectedSizes = [];

    quantityInputs.forEach(function(input) {

        const quantity =
            parseInt(input.value) || 0;

        const size =
            input.getAttribute("data-size");

        if (quantity > 0) {

            selectedSizes.push({
                size: size,
                quantity: quantity
            });

        }

    });


    // Check quantity
    if (selectedSizes.length === 0) {

        alert(
            "Please enter quantity for at least one size."
        );

        return;
    }


    // ==========================================
    // READ ACTUAL FILE
    // ==========================================

    const reader = new FileReader();

    reader.onload = function(event) {

        const fileData = event.target.result;

        let cartItems =
            JSON.parse(
                localStorage.getItem("cartItems")
            ) || [];


        // ==========================================
        // ADD EACH SELECTED SIZE TO CART
        // ==========================================

        
        selectedSizes.forEach(function(item) {

            cartItems.push({
                name: fileName,
                price: 0,
                priceOnRequest: true,
                quantity: item.quantity,
                size: item.size,
                description: description,
                customProduct: true,
                fileName: fileName,
                fileType: fileType,
                fileData: fileData
            });

        });



        // ==========================================
        // SAVE CART
        // ==========================================

        localStorage.setItem(
            "cartItems",
            JSON.stringify(cartItems)
        );


        updateCartIcon();


        alert(
            fileName +
            " has been added to the cart successfully!"
        );


        // ==========================================
        // CLOSE FORM
        // ==========================================

        const form =
            product.querySelector(".custom-form");

        const plusButton =
            product.querySelector(".custom-plus-button");


        if (form) {

            form.classList.remove("open");

        }


        if (plusButton) {

            plusButton.style.display = "block";

        }


        // ==========================================
        // RESET FORM
        // ==========================================

        fileInput.value = "";


        if (descriptionInput) {

            descriptionInput.value = "";

        }


        quantityInputs.forEach(function(input) {

            input.value = 0;

        });

    };


    // ==========================================
    // START READING FILE
    // ==========================================

    reader.readAsDataURL(file);

}




// =====================================================
// ADMIN LOGIN
// =====================================================

function handleAdminLogin(event) {

    event.preventDefault();

    let passInput =
        document.getElementById("adminIndexPass");

    let errorMsg =
        document.getElementById("loginErrorMsg");

    if (!passInput) return;

    if (passInput.value === "admin123") {

        if (errorMsg) {
            errorMsg.innerText = "";
        }

        alert("Login Successful!");

        window.location.href =
            "admin.html";

    } else {

        if (errorMsg) {

            errorMsg.innerText =
                "Incorrect password! Please try again.";
        }
    }
}


// =====================================================
// RENDER BILL
// =====================================================


function renderBill() {
    let cartItems =
        JSON.parse(localStorage.getItem("cartItems")) || [];

    let tableBody = document.getElementById("bill-items");
    let grandTotalSpan = document.getElementById("grand-total");
    let orderIdDisplay = document.getElementById("order-id-display");

    let currentOrderId = localStorage.getItem("currentOrderId");

    if (!currentOrderId) {
        currentOrderId = "ORD-" + Date.now();
        localStorage.setItem("currentOrderId", currentOrderId);
    }

    if (orderIdDisplay) {
        orderIdDisplay.innerText = `Order ID: ${currentOrderId}`;
    }

    if (!tableBody || !grandTotalSpan) {
        return;
    }

    tableBody.innerHTML = "";

    if (cartItems.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No items in your cart.</td></tr>';

        grandTotalSpan.innerText = "Rs. 0.00";
        return;
    }

    let grandTotal = 0;
    let hasPendingPrice = false;

    cartItems.forEach((item, index) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity) || 0;

        const pricePending =
            item.customProduct === true ||
            item.priceOnRequest === true ||
            !Number.isFinite(price) ||
            price <= 0;

        const itemTotal = pricePending ? 0 : price * quantity;

        if (pricePending) {
            hasPendingPrice = true;
            item.priceOnRequest = true;
        } else {
            grandTotal += itemTotal;
        }

        const priceText = pricePending
            ? "—"
            : `Rs. ${price.toFixed(2)}`;

        const itemTotalText = pricePending
            ? "—"
            : `Rs. ${itemTotal.toFixed(2)}`;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name} (${item.size || "N/A"})</td>
            <td>${priceText}</td>
            <td>${quantity}</td>
            <td>${itemTotalText}</td>
            <td>
                <button
                    type="button"
                    onclick="decreaseQuantity(${index})"
                    style="
                        background: transparent;
                        border: none;
                        color: red;
                        font-weight: bold;
                        cursor: pointer;
                    "
                    aria-label="Remove one quantity"
                >
                    ❌
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Preserve pending-price flags in the cart
    localStorage.setItem("cartItems", JSON.stringify(cartItems));

    grandTotalSpan.innerText = hasPendingPrice
        ? `Rs. ${grandTotal.toFixed(2)} + Price Pending`
        : `Rs. ${grandTotal.toFixed(2)}`;
}



// =====================================================
// DECREASE QUANTITY
// =====================================================

function decreaseQuantity(index) {

    let cartItems =
        JSON.parse(
            localStorage.getItem("cartItems")
        ) || [];


    if (cartItems[index]) {

        if (cartItems[index].quantity > 1) {

            cartItems[index].quantity -= 1;

        } else {

            cartItems.splice(index, 1);
        }
    }


    localStorage.setItem(
        "cartItems",
        JSON.stringify(cartItems)
    );


    renderBill();
    updateCartIcon();
}


// =====================================================
// CUSTOMER FORM VALIDATION
// =====================================================

function validateCustomerForm() {

    let nameInput =
        document.getElementById("custName");

    let emailInput =
        document.getElementById("custEmail");

    let phoneInput =
        document.getElementById("custPhone");

    let whatsappInput =
        document.getElementById("custWhatsapp");

    let addressInput =
        document.getElementById("custAddress");

    let postalInput =
        document.getElementById("custPostal");


    let name =
        nameInput
            ? nameInput.value.trim()
            : "";

    let email =
        emailInput
            ? emailInput.value.trim()
            : "";

    let phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";

    let whatsapp =
        whatsappInput
            ? whatsappInput.value.trim()
            : "";

    let address =
        addressInput
            ? addressInput.value.trim()
            : "";

    let postal =
        postalInput
            ? postalInput.value.trim()
            : "";


    // Required fields
    if (
        !name ||
        !email ||
        !phone ||
        !whatsapp ||
        !address ||
        !postal
    ) {

        alert(
            "Please fill in all customer details!"
        );

        return false;
    }


    // Email validation
    let emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );


    if (!emailValid) {

        alert(
            "Please enter a valid email address!"
        );

        if (emailInput) {
            emailInput.focus();
        }

        return false;
    }


    // Phone validation
    let phoneValid =
        /^[0-9]{10}$/.test(phone);


    if (!phoneValid) {

        if (phoneInput) {

            phoneInput.classList.add(
                "invalid"
            );

            phoneInput.classList.remove(
                "valid"
            );

            phoneInput.focus();
        }


        let phoneError =
            document.getElementById(
                "phoneError"
            );

        if (phoneError) {
            phoneError.classList.add("show");
        }

        return false;
    }


    // WhatsApp validation
    let whatsappValid =
        /^[0-9]{10}$/.test(whatsapp);


    if (!whatsappValid) {

        if (whatsappInput) {

            whatsappInput.classList.add(
                "invalid"
            );

            whatsappInput.classList.remove(
                "valid"
            );

            whatsappInput.focus();
        }


        let whatsappError =
            document.getElementById(
                "whatsappError"
            );

        if (whatsappError) {
            whatsappError.classList.add("show");
        }

        return false;
    }


    // Valid state
    if (phoneInput) {

        phoneInput.classList.remove(
            "invalid"
        );

        phoneInput.classList.add(
            "valid"
        );
    }


    if (whatsappInput) {

        whatsappInput.classList.remove(
            "invalid"
        );

        whatsappInput.classList.add(
            "valid"
        );
    }


    let phoneError =
        document.getElementById(
            "phoneError"
        );

    let whatsappError =
        document.getElementById(
            "whatsappError"
        );


    if (phoneError) {
        phoneError.classList.remove("show");
    }


    if (whatsappError) {
        whatsappError.classList.remove("show");
    }


    return true;
}


// =====================================================
// PHONE / WHATSAPP INPUT VALIDATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const phoneInput =
            document.getElementById(
                "custPhone"
            );

        const whatsappInput =
            document.getElementById(
                "custWhatsapp"
            );


        // Phone
        if (phoneInput) {

            phoneInput.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value.replace(
                            /[^0-9]/g,
                            ""
                        );

                    this.value =
                        this.value.slice(
                            0,
                            10
                        );


                    const error =
                        document.getElementById(
                            "phoneError"
                        );


                    if (
                        this.value.length ===
                        10
                    ) {

                        this.classList.remove(
                            "invalid"
                        );

                        this.classList.add(
                            "valid"
                        );

                        if (error) {
                            error.classList.remove(
                                "show"
                            );
                        }

                    } else {

                        this.classList.remove(
                            "valid"
                        );


                        if (
                            this.value.length >
                            0
                        ) {

                            this.classList.add(
                                "invalid"
                            );

                            if (error) {
                                error.classList.add(
                                    "show"
                                );
                            }

                        } else {

                            this.classList.remove(
                                "invalid"
                            );

                            if (error) {
                                error.classList.remove(
                                    "show"
                                );
                            }
                        }
                    }
                }
            );
        }


        // WhatsApp
        if (whatsappInput) {

            whatsappInput.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value.replace(
                            /[^0-9]/g,
                            ""
                        );

                    this.value =
                        this.value.slice(
                            0,
                            10
                        );


                    const error =
                        document.getElementById(
                            "whatsappError"
                        );


                    if (
                        this.value.length ===
                        10
                    ) {

                        this.classList.remove(
                            "invalid"
                        );

                        this.classList.add(
                            "valid"
                        );

                        if (error) {
                            error.classList.remove(
                                "show"
                            );
                        }

                    } else {

                        this.classList.remove(
                            "valid"
                        );


                        if (
                            this.value.length >
                            0
                        ) {

                            this.classList.add(
                                "invalid"
                            );

                            if (error) {
                                error.classList.add(
                                    "show"
                                );
                            }

                        } else {

                            this.classList.remove(
                                "invalid"
                            );

                            if (error) {
                                error.classList.remove(
                                    "show"
                                );
                            }
                        }
                    }
                }
            );
        }

    }
);


// =====================================================
// DOWNLOAD PDF
// =====================================================

function downloadPDF() {

    if (!validateCustomerForm()) {
        return;
    }


    const element =
        document.getElementById(
            "invoice-bill"
        );


    if (!element) {
        alert("Invoice section not found!");
        return;
    }


    const opt = {

        margin: 10,

        filename:
            "VarnaKala_Invoice.pdf",

        image: {
            type: "jpeg",
            quality: 0.98
        },

        html2canvas: {
            scale: 2
        },

        jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
        }
    };


    html2pdf()
        .set(opt)
        .from(element)
        .save();
}


// =====================================================
// PROCESS ORDER
// =====================================================

function processPayment() {

    // Validate customer details
    if (!validateCustomerForm()) {
        return;
    }


    // Get cart
    let cartItems =
        JSON.parse(
            localStorage.getItem("cartItems")
        ) || [];


    if (cartItems.length === 0) {

        alert(
            "Your cart is empty!"
        );

        return;
    }


    // Existing orders
    let allOrders =
        JSON.parse(
            localStorage.getItem("allOrders")
        ) || [];



    // Grand Total: only include products with confirmed prices
    let grandTotal = cartItems.reduce((sum, item) => {
        const price = Number(item.price);

        const pricePending =
            item.customProduct === true ||
            item.priceOnRequest === true ||
            !Number.isFinite(price) ||
            price <= 0;

        if (pricePending) {
            item.priceOnRequest = true;
            return sum;
        }

        return sum + price * (Number(item.quantity) || 0);
    }, 0);

    // Save pending-price flags before recording the order
    localStorage.setItem("cartItems", JSON.stringify(cartItems));

    const hasPendingPrice = cartItems.some(item =>
        item.customProduct === true ||
        item.priceOnRequest === true ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) <= 0
    );


    // Order ID
    let currentOrderId =
        localStorage.getItem(
            "currentOrderId"
        );


    if (!currentOrderId) {

        currentOrderId =
            "ORD-" + Date.now();

        localStorage.setItem(
            "currentOrderId",
            currentOrderId
        );
    }


    // Date and time
    let now = new Date();

    let orderDate =
        now.toLocaleDateString();

    let orderTime =
        now.toLocaleTimeString();


    // Customer details
    let custName =
        document.getElementById(
            "custName"
        ).value.trim();


    let custEmail =
        document.getElementById(
            "custEmail"
        ).value.trim();


    let custPhone =
        document.getElementById(
            "custPhone"
        ).value.trim();


    let custWhatsapp =
        document.getElementById(
            "custWhatsapp"
        ).value.trim();


    let custAddress =
        document.getElementById(
            "custAddress"
        ).value.trim();


    let custPostal =
        document.getElementById(
            "custPostal"
        ).value.trim();


    // =================================================
    // SAVE ORDER TO LOCAL STORAGE
    // =================================================

    let newOrder = {

        orderId: currentOrderId,

        date: orderDate,

        time: orderTime,

        customer: {

            name: custName,

            email: custEmail,

            phone: custPhone,

            whatsapp: custWhatsapp,

            address: custAddress,

            postal: custPostal
        },

        items: cartItems,

        total: grandTotal
    };


    allOrders.push(newOrder);


    localStorage.setItem(
        "allOrders",
        JSON.stringify(allOrders)
    );

    // =================================================
// FORMAT DATA FOR GOOGLE SHEET + DESIGN FILE
// =================================================

    let formattedData = [];

    cartItems.forEach(
        (item, index) => {

    const itemPrice = Number(item.price);

    const pricePending =
        item.customProduct === true ||
        item.priceOnRequest === true ||
        !Number.isFinite(itemPrice) ||
        itemPrice <= 0;

    const itemTotal = pricePending
        ? null
        : itemPrice * (Number(item.quantity) || 0);


            formattedData.push({

                // A
                orderId:
                    index === 0
                        ? currentOrderId
                        : "",

                // B
                date:
                    index === 0
                        ? orderDate
                        : "",

                // C
                time:
                    index === 0
                        ? orderTime
                        : "",

                // D
                customerName:
                    index === 0
                        ? custName
                        : "",

                // E
                email:
                    index === 0
                        ? custEmail
                        : "",

                // F
                phone:
                    index === 0
                        ? custPhone
                        : "",

                // G
                whatsapp:
                    index === 0
                        ? custWhatsapp
                        : "",

                // H
                address:
                    index === 0
                        ? custAddress
                        : "",

                // I
                postal:
                    index === 0
                        ? custPostal
                        : "",

                // J
                itemName:
                    item.name || "",

                // K
                size:
                    item.size || "N/A",

                // L
                quantity:
                    item.quantity,

                // M
                total: pricePending
                    ? "—"
                    : `Rs. ${itemTotal.toFixed(2)}`,

                // N
                description:
                    item.description || "",

                // Custom product information
                customProduct:
                    item.customProduct || false,

                fileName:
                    item.fileName || "",

                fileType:
                    item.fileType || "",

                fileData:
                    item.fileData || ""

            });

        }
    );





    // =================================================
    // GOOGLE APPS SCRIPT WEB APP URL
    // =================================================

    const WEB_APP_URL =
        "https://script.google.com/macros/s/AKfycbx7vHITuAk-tRsNs5_E05FdqDrLlV8O2UdCHKpjJRVa-gVhKdr8i4rGy1ti3rmDIiRH/exec";


    // =================================================
    // SHOW LOADING MODAL
    // =================================================

    let modal =
        document.getElementById(
            "customModal"
        );

    let loadingState =
        document.getElementById(
            "modalLoadingState"
        );

    let successState =
        document.getElementById(
            "modalSuccessState"
        );


    if (modal) {

        modal.style.display =
            "flex";


        if (loadingState) {

            loadingState.style.display =
                "block";
        }


        if (successState) {

            successState.style.display =
                "none";
        }
    }


    // =================================================
    // SEND DATA TO GOOGLE SHEET
    // =================================================

    fetch(
        WEB_APP_URL,
        {

            method: "POST",

            mode: "no-cors",

            headers: {

                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(
                    formattedData
                )
        }
    )

    .then(() => {

        // Show success
        if (loadingState) {

            loadingState.style.display =
                "none";
        }


        if (successState) {

            successState.style.display =
                "block";
        }


        // Clear cart
        localStorage.removeItem(
            "cartItems"
        );

        localStorage.removeItem(
            "currentOrderId"
        );

    })

    .catch(error => {

        if (modal) {

            modal.style.display =
                "none";
        }


        console.error(
            "Order Error:",
            error
        );


        alert(
            "An error occurred while sending data. Please try again."
        );
    });
}


// =====================================================
// SUCCESS MODAL OK BUTTON
// =====================================================

function closeSuccessAndRedirect() {

    let modal =
        document.getElementById(
            "customModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    window.location.href =
        "index.html";
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCartIcon();

        renderBill();


        let cartContainer =
            document.querySelector(
                ".cart-container"
            );


        if (cartContainer) {

            cartContainer.style.cursor =
                "pointer";


            cartContainer.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "payment.html";
                }
            );
        }
    }
);


// =====================================================
// IMAGE MODAL
// =====================================================

function openModal(imgElement) {

    let modal =
        document.getElementById(
            "imageModal"
        );

    let modalImg =
        document.getElementById(
            "fullImage"
        );


    if (modal && modalImg) {

        modal.style.display =
            "block";

        modalImg.src =
            imgElement.src;
    }
}


function closeModal() {

    let modal =
        document.getElementById(
            "imageModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}




 // =====================================================
// MOBILE MENU
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const menuIcon = document.getElementById("menu-icon");
    const navbar = document.querySelector(".Navbar");
    const menuOverlay = document.getElementById("menu-overlay");

    if (!menuIcon || !navbar) {
        return;
    }

    function closeMenu() {
        navbar.classList.remove("active");

        if (menuOverlay) {
            menuOverlay.classList.remove("active");
        }

        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }

    menuIcon.addEventListener("click", function () {

        const isOpen = navbar.classList.toggle("active");

        if (menuOverlay) {
            menuOverlay.classList.toggle("active", isOpen);
        }

        menuIcon.classList.toggle("bx-menu", !isOpen);
        menuIcon.classList.toggle("bx-x", isOpen);
    });

    if (menuOverlay) {
        menuOverlay.addEventListener("click", closeMenu);
    }

    navbar.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

});





 // ======================================
// VARNakala PRODUCT DETAILS - NEW TAB
// ======================================

function openProductDetails(element) {

    // Find the clicked product card
    const card = element.closest(".box");

    if (!card) {
        alert("Product card not found.");
        return;
    }

    const titleElement = card.querySelector("h3");
    const imageElement = card.querySelector("img");

    if (!titleElement || !imageElement) {
        alert("Product information could not be found.");
        return;
    }

    // Use the real product name, not only the product code
    const productName =
        card.dataset.name || titleElement.textContent.trim();

    const productCode =
        card.dataset.code || titleElement.textContent.trim();

    // Read sizes and prices
    const sizeRadios = card.querySelectorAll(
        '.size-options input[type="radio"]'
    );

    const sizes = Array.from(sizeRadios).map(function (radio) {
        return {
            size: radio.value,
            price: Number(radio.dataset.price)
        };
    });


    const validSizes = sizes.filter(function (item) {
        return item.size;
    });

    if (validSizes.length === 0) {
        alert("This product's sizes are missing.");
        return;
    }

    const hasPrices = validSizes.every(function (item) {
        return Number.isFinite(item.price) && item.price > 0;
    });


    // Save the selected product for product-details.html

    const qtyInput = card.querySelector(".qty-input");

    const selectedProduct = {
        name: productName,
        code: productCode,
        image: imageElement.getAttribute("src"),
        description: card.dataset.description || "Explore this product from VarnaKala.",
        about: card.dataset.about || "Product details will be updated soon.",
        quality: card.dataset.quality || "Refer to the confirmed product specifications.",
        design: card.dataset.design || "Refer to the product images.",
        care: card.dataset.care || "Follow the garment's care label.",
        sizes: validSizes,
        priceOnRequest: !hasPrices,

        minQuantity: qtyInput ? Number(qtyInput.min) || 1 : 1,
        maxQuantity: qtyInput ? Number(qtyInput.max) || 1000 : 1000,
        quantity: qtyInput ? Number(qtyInput.value) || 1 : 1
    };


    localStorage.setItem(
        "varnakalaSelectedProduct",
        JSON.stringify(selectedProduct)
    );

    window.location.href = "product-details.html";

}
