
document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // GOOGLE APPS SCRIPT WEB APP URL
    // ==========================================

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAJggIbkVKk9uhMkgyGnCuVZ6PzpRtTIOC-av0jwTza0thEMjX-IZ__eU_KpkBEg_-eg/exec";


    // ==========================================
    // FORM ELEMENTS
    // ==========================================

    const form = document.getElementById("registration-form");
    const step1 = document.getElementById("step-1");
    const step2 = document.getElementById("step-2");

    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");

    const message = document.getElementById("form-message");
    const indicator = document.getElementById("step-indicator");
    const progressFill = document.getElementById("progress-fill");

    const submitBtn = form.querySelector('[type="submit"]');


    // ==========================================
    // POPUP ELEMENTS
    // ==========================================

    const overlay = document.getElementById("registrationOverlay");

    const loadingSection = document.getElementById("registrationLoading");
    const successSection = document.getElementById("registrationSuccess");
    const errorSection = document.getElementById("registrationError");

    const registrationIdDisplay =
        document.getElementById("successRegistrationId");

    const errorMessage =
        document.getElementById("registrationErrorMessage");

    const continueBtn =
        document.getElementById("registrationContinue");

    const retryBtn =
        document.getElementById("registrationRetry");

    let isSubmitting = false;


    // ==========================================
    // CURRENT YEAR
    // ==========================================

    document.getElementById("current-year").textContent =
        new Date().getFullYear();


    // ==========================================
    // STEP NAVIGATION
    // ==========================================

    function showStep(number) {

        step1.classList.toggle("active", number === 1);
        step2.classList.toggle("active", number === 2);

        indicator.textContent = `Step ${number} of 2`;

        progressFill.style.width =
            number === 1 ? "50%" : "100%";

        message.textContent = "";

        document.getElementById("register").scrollIntoView({
            behavior: "smooth"
        });
    }


    // ==========================================
    // VALIDATION ERROR DISPLAY
    // ==========================================

    function showError(input, text) {

        input.classList.add("invalid");

        let error = document.querySelector(
            `[data-error="${input.id}"]`
        );

        if (!error) {

            error = document.createElement("div");

            error.className = "field-error";
            error.dataset.error = input.id;

            input.insertAdjacentElement("afterend", error);
        }

        error.textContent = text;
    }


    function clearError(input) {

        input.classList.remove("invalid");

        const error = document.querySelector(
            `[data-error="${input.id}"]`
        );

        if (error) {
            error.remove();
        }
    }


    // ==========================================
    // FIELD VALIDATION
    // ==========================================

    function validate(input) {

        const value = input.value.trim();

        if (!value) {

            showError(input, "This field is required.");

            return false;
        }


        // Phone and WhatsApp
        if (
            input.id === "phone" ||
            input.id === "whatsapp"
        ) {

            if (!/^0\d{9}$/.test(value)) {

                showError(
                    input,
                    "Enter exactly 10 digits starting with 0."
                );

                return false;
            }
        }


        // Email
        if (input.id === "email") {

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(value) ||
                value.includes("..")
            ) {

                showError(
                    input,
                    "Enter a valid email address."
                );

                return false;
            }
        }


        // Facebook Profile URL
        if (input.id === "facebook") {

            try {

                const url = new URL(value);

                const allowedDomains = [
                    "facebook.com",
                    "www.facebook.com",
                    "fb.com",
                    "www.fb.com"
                ];

                if (
                    !["https:", "http:"].includes(url.protocol) ||
                    !allowedDomains.includes(url.hostname.toLowerCase())
                ) {

                    showError(
                        input,
                        "Enter a valid Facebook profile URL."
                    );

                    return false;
                }

            } catch {

                showError(
                    input,
                    "Enter a valid Facebook profile URL."
                );

                return false;
            }
        }


        // Bank Account Number
        if (
            input.id === "accountNumber" &&
            !/^\d+$/.test(value)
        ) {

            showError(
                input,
                "Account number must contain digits only."
            );

            return false;
        }


        clearError(input);

        return true;
    }


    // ==========================================
    // STEP VALIDATION
    // ==========================================

    function validateStep(step) {

        let valid = true;

        const inputs = step.querySelectorAll(
            "input:not([type='checkbox']), textarea, select"
        );

        inputs.forEach(input => {

            if (!validate(input)) {
                valid = false;
            }

        });

        return valid;
    }


    // ==========================================
    // PHONE NUMBER INPUT
    // ==========================================

    ["phone", "whatsapp"].forEach(id => {

        const input = document.getElementById(id);

        input.addEventListener("input", function () {

            input.value = input.value
                .replace(/\D/g, "")
                .slice(0, 10);

        });

    });


    // ==========================================
    // CLEAR VALIDATION ERRORS WHEN EDITING
    // ==========================================

    form.querySelectorAll("input, textarea, select").forEach(input => {

        input.addEventListener("input", function () {

            if (input.classList.contains("invalid")) {
                validate(input);
            }

        });

        input.addEventListener("change", function () {

            if (input.classList.contains("invalid")) {
                validate(input);
            }

        });

    });


    // ==========================================
    // NEXT BUTTON
    // ==========================================

    nextBtn.addEventListener("click", function () {

        if (validateStep(step1)) {

            showStep(2);

        } else {

            message.textContent =
                "Please correct the highlighted fields.";

            message.style.color = "#dc3545";
        }

    });


    // ==========================================
    // BACK BUTTON
    // ==========================================

    backBtn.addEventListener("click", function () {

        showStep(1);

    });


    // ==========================================
    // POPUP FUNCTIONS
    // ==========================================

    function showPopup(section) {

        loadingSection.style.display = "none";
        successSection.style.display = "none";
        errorSection.style.display = "none";

        section.style.display = "block";

        overlay.classList.add("active");
    }


    function showLoading() {

        showPopup(loadingSection);

    }


    function showSuccess(registrationId) {

        registrationIdDisplay.textContent = registrationId;

        showPopup(successSection);

    }


    function showSubmissionError(text) {

        errorMessage.textContent = text;

        showPopup(errorSection);

    }


    function hidePopup() {

        overlay.classList.remove("active");

    }


    // ==========================================
    // FORM SUBMISSION
    // ==========================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) {
            return;
        }


        // Validate both steps
        const validStep1 = validateStep(step1);
        const validStep2 = validateStep(step2);

        const terms = document.getElementById("terms");


        if (!validStep1) {

            showStep(1);

            message.textContent =
                "Please complete your personal information.";

            message.style.color = "#dc3545";

            return;
        }


        if (!validStep2) {

            showStep(2);

            message.textContent =
                "Please complete your bank details.";

            message.style.color = "#dc3545";

            return;
        }


        if (!terms.checked) {

            message.textContent =
                "Please accept the Terms & Conditions.";

            message.style.color = "#dc3545";

            return;
        }


        // Check backend URL
        if (!SCRIPT_URL.includes("/exec")) {

            message.textContent =
                "Registration service is not configured.";

            message.style.color = "#dc3545";

            return;
        }


        // ======================================
        // PREPARE REGISTRATION DATA
        // ======================================

        const registrationData = {

            fullName: document.getElementById("fullName").value.trim(),

            phone: document.getElementById("phone").value.trim(),

            whatsapp: document.getElementById("whatsapp").value.trim(),

            address: document.getElementById("address").value.trim(),

            district: document.getElementById("district").value.trim(),

            email: document.getElementById("email").value.trim(),

            facebook: document.getElementById("facebook").value.trim(),

            bankName: document.getElementById("bankName").value.trim(),

            accountHolder: document.getElementById("accountHolder").value.trim(),

            accountNumber: document.getElementById("accountNumber").value.trim(),

            termsAccepted: terms.checked

        };


        // ======================================
        // START SUBMISSION
        // ======================================

        isSubmitting = true;

        submitBtn.disabled = true;

        submitBtn.style.opacity = "0.6";
        submitBtn.style.cursor = "not-allowed";

        message.textContent = "";

        showLoading();


        try {

            const response = await fetch(SCRIPT_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },

                body: JSON.stringify(registrationData),

                redirect: "follow"

            });


            if (!response.ok) {

                throw new Error(
                    "Unable to communicate with the registration server."
                );
            }


            const result = await response.json();


            // Check Apps Script response
            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Registration could not be completed."
                );
            }


            // Verify Registration ID
            if (!result.registrationId) {

                throw new Error(
                    "Registration confirmation was not received."
                );
            }


            // ==================================
            // REGISTRATION SUCCESS
            // ==================================

            showSuccess(result.registrationId);


        } catch (error) {

            console.error("Registration Error:", error);

            showSubmissionError(
                error.message ||
                "Something went wrong. Please try again."
            );

            isSubmitting = false;

            submitBtn.disabled = false;

            submitBtn.style.opacity = "";
            submitBtn.style.cursor = "";

        }

    });


    // ==========================================
    // CONTINUE BUTTON
    // ==========================================

    continueBtn.addEventListener("click", function () {

        hidePopup();

        form.reset();

        form.querySelectorAll(".invalid").forEach(input => {

            clearError(input);

        });

        showStep(1);

        isSubmitting = false;

        submitBtn.disabled = false;

        submitBtn.style.opacity = "";
        submitBtn.style.cursor = "";

    });


    // ==========================================
    // RETRY BUTTON
    // ==========================================

    retryBtn.addEventListener("click", function () {

        hidePopup();

        isSubmitting = false;

        submitBtn.disabled = false;

        submitBtn.style.opacity = "";
        submitBtn.style.cursor = "";

    });


});
