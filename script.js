// =====================================================
// SEARCH
// =====================================================

let search = document.querySelector(".search-box");

let searchIcon = document.querySelector("#search-icon");

if (searchIcon && search) {
    searchIcon.onclick = () => {
        search.classList.toggle("active");
    };
}


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

function addToCartDynamic(
    productName,
    qtyId,
    sizeName
) {

    let qtyInput =
        document.getElementById(qtyId);

    let quantity =
        qtyInput
            ? (parseInt(qtyInput.value) || 1)
            : 1;

    let selectedSize = "M";
    let itemPrice = 1200;

    let sizeRadios =
        document.getElementsByName(sizeName);

    for (let radio of sizeRadios) {

        if (radio.checked) {

            selectedSize = radio.value;

            itemPrice =
                parseFloat(
                    radio.getAttribute("data-price")
                ) || 0;

            break;
        }
    }

    let cartItems =
        JSON.parse(
            localStorage.getItem("cartItems")
        ) || [];

    let existingIndex =
        cartItems.findIndex(
            item =>
                item.name === productName &&
                item.size === selectedSize
        );

    if (existingIndex > -1) {

        cartItems[existingIndex].quantity +=
            quantity;

    } else {

        cartItems.push({

            name: productName,
            price: itemPrice,
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

        selectedSizes.forEach(function(item, index) {

            cartItems.push({

                name: fileName,

                price: 0,

                quantity: item.quantity,

                size: item.size,

                description: description,

                customProduct: true,

                // Actual design file
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
        JSON.parse(
            localStorage.getItem("cartItems")
        ) || [];

    let tableBody =
        document.getElementById("bill-items");

    let grandTotalSpan =
        document.getElementById("grand-total");

    let orderIdDisplay =
        document.getElementById("order-id-display");


    let currentOrderId =
        localStorage.getItem("currentOrderId");


    if (!currentOrderId) {

        currentOrderId =
            "ORD-" + Date.now();

        localStorage.setItem(
            "currentOrderId",
            currentOrderId
        );
    }


    if (orderIdDisplay) {

        orderIdDisplay.innerText =
            `Order ID: ${currentOrderId}`;
    }


    if (!tableBody || !grandTotalSpan) {
        return;
    }


    tableBody.innerHTML = "";


    if (cartItems.length === 0) {

        tableBody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;">No items in your cart.</td></tr>';

        grandTotalSpan.innerText =
            "Rs. 0.00";

        return;
    }


    let grandTotal = 0;


    cartItems.forEach((item, index) => {

        let price =
            Number(item.price) || 0;

        let quantity =
            Number(item.quantity) || 0;

        let itemTotal =
            price * quantity;

        grandTotal += itemTotal;


        let row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${item.name}
                (${item.size || "N/A"})
            </td>

            <td>
                Rs. ${price.toFixed(2)}
            </td>

            <td>
                ${quantity}
            </td>

            <td>
                Rs. ${itemTotal.toFixed(2)}
            </td>

            <td>

                <button
                    onclick="decreaseQuantity(${index})"
                    style="
                        background: transparent;
                        border: none;
                        color: red;
                        font-weight: bold;
                        cursor: pointer;
                    "
                >
                    ❌
                </button>

            </td>
        `;


        tableBody.appendChild(row);
    });


    grandTotalSpan.innerText =
        `Rs. ${grandTotal.toFixed(2)}`;
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


    // Grand total
    let grandTotal =
        cartItems.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price) *
                    Number(item.quantity)
                ),
            0
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

            let itemTotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);


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
                total:
                    `Rs. ${itemTotal.toFixed(2)}`,

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

const menuIcon =
    document.getElementById(
        "menu-icon"
    );

const navbar =
    document.querySelector(
        ".Navbar"
    );

const menuOverlay =
    document.getElementById(
        "menu-overlay"
    );


if (
    menuIcon &&
    navbar &&
    menuOverlay
) {

    // Open / Close menu
    menuIcon.addEventListener(
        "click",
        function () {

            navbar.classList.toggle(
                "active"
            );

            menuOverlay.classList.toggle(
                "active"
            );


            if (
                navbar.classList.contains(
                    "active"
                )
            ) {

                menuIcon.classList.remove(
                    "bx-menu"
                );

                menuIcon.classList.add(
                    "bx-x"
                );

            } else {

                menuIcon.classList.remove(
                    "bx-x"
                );

                menuIcon.classList.add(
                    "bx-menu"
                );
            }
        }
    );


    // Close when overlay clicked
    menuOverlay.addEventListener(
        "click",
        function () {

            navbar.classList.remove(
                "active"
            );

            menuOverlay.classList.remove(
                "active"
            );

            menuIcon.classList.remove(
                "bx-x"
            );

            menuIcon.classList.add(
                "bx-menu"
            );
        }
    );


    // Close when link clicked
    document
        .querySelectorAll(
            ".Navbar a"
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navbar.classList.remove(
                            "active"
                        );

                        menuOverlay.classList.remove(
                            "active"
                        );

                        menuIcon.classList.remove(
                            "bx-x"
                        );

                        menuIcon.classList.add(
                            "bx-menu"
                        );
                    }
                );
            }
        );
}