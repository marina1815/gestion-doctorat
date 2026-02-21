document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".login-form");
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const successModal = document.getElementById("successModal");
    const closeBtn = document.getElementById("closeSuccess");

    const pwdInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    const eyeIconOff = document.getElementById("eyeIconOff");

    eyeIcon.addEventListener("click", () => {
        pwdInput.type = "text";
        eyeIcon.style.display = "none";
        eyeIconOff.style.display = "block";
    });

    eyeIconOff.addEventListener("click", () => {
        pwdInput.type = "password";
        eyeIconOff.style.display = "none";
        eyeIcon.style.display = "block";
    });

    // ====== ERROR HANDLING ======
    function showError(input, message) {
        let error = input.parentElement.querySelector(".error-text");

        if (!error) {
            error = document.createElement("div");
            error.classList.add("error-text");
            input.parentElement.appendChild(error);
        }

        error.textContent = message;
        error.style.display = "block";
        input.style.borderBottomColor = "red";
    }

    function clearError(input) {
        let error = input.parentElement.querySelector(".error-text");
        if (error) error.style.display = "none";

        input.style.borderBottomColor = "";
    }

    // ====== FORM VALIDATION ======
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        let valid = true;

        if (username.value.trim() === "") {
            showError(username, "Please enter your username");
            valid = false;
        } else {
            clearError(username);
        }

        if (password.value.trim() === "") {
            showError(password, "Please enter your password");
            valid = false;
        } else {
            clearError(password);
        }

        if (!valid) return;

        successModal.classList.remove("is-visible");
        void successModal.offsetWidth;
        successModal.classList.add("is-visible");
    });

    // ====== MODAL CLOSE ======
    closeBtn.addEventListener("click", () => {
        successModal.classList.remove("is-visible");
    });

    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            successModal.classList.remove("is-visible");
        }
    });
});