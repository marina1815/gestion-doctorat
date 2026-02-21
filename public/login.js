document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".login-form");
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const successModal = document.getElementById("successModal");
    const closeBtn = document.getElementById("closeSuccess");

    const pwdInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    const eyeIconOff = document.getElementById("eyeIconOff");

    const generalError = document.getElementById("generalError"); // <div id="generalError"></div> (optionnel)

    const API_URL = "http://localhost:4000"; // 🔁 change si besoin
    const LOGIN_ENDPOINT = "/auth/login";    // 🔁 adapte à ton backend

    // ====== PASSWORD TOGGLE ======
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

    function showGeneralError(message) {
        if (!generalError) return;
        generalError.textContent = message;
        generalError.style.display = "block";
    }

    function clearGeneralError() {
        if (!generalError) return;
        generalError.textContent = "";
        generalError.style.display = "none";
    }

    // ====== FORM SUBMIT + API FETCH ======
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        clearGeneralError();

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

        // Optionnel : désactiver le bouton le temps de l'appel
        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Connexion...";
        }

        try {
            const response = await fetch(API_URL + LOGIN_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // 🔐 si ton backend met le JWT dans un cookie httpOnly
               // credentials: "include",
                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value.trim(),
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // Backend renvoie une erreur (401, 400, etc.)
                const message =
                    data?.message ||
                    data?.error ||
                    "Invalid username or password";

                showError(password, message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Login";
                }
                return;
            }

            // ✅ Succès : le backend a validé le login
            // Exemple : data peut contenir { user, token } ou juste { user }
            // -> ici, on ouvre ton modal
            successModal.classList.remove("is-visible");
            void successModal.offsetWidth; // pour relancer l'animation
            successModal.classList.add("is-visible");

            // 🎯 Exemple: redirection selon le rôle
            // if (data.user?.role === "ADMIN") {
            //     window.location.href = "/admin-dashboard.html";
            // } else if (data.user?.role === "CHEFDEPARTEMENT") {
            //     window.location.href = "/chef-departement.html";
            // }

        } catch (err) {
            console.error("Login error:", err);
            showGeneralError("Erreur réseau, veuillez réessayer.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Se connecter";
            }
        }
    });

   
    closeBtn.addEventListener("click", () => {
        successModal.classList.remove("is-visible");
    });

    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            successModal.classList.remove("is-visible");
        }
    });
});