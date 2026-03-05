document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".login-form");
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const successModal = document.getElementById("successModal");
    const closeBtn = document.getElementById("closeSuccess");

    const pwdInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    const eyeIconOff = document.getElementById("eyeIconOff");

    const generalError = document.getElementById("generalError");

    const API_URL = "http://localhost:4000";
    const LOGIN_ENDPOINT = "/auth/login";

    let loggedUser = null;

    // ======================
    //  SHOW / HIDE PASSWORD
    // ======================
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

    // ======================
    //  ERROR HANDLING
    // ======================
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

    // ======================
    //   REDIRECTION PAR ROLE
    // ======================
    function redirectByRole() {
        const user = JSON.parse(localStorage.getItem("dg-user"));

        if (!user) {
            window.location.href = "/login.html";
            return;
        }

        const role = user.role;

        switch (role) {
            case "ADMIN":
                window.location.href = "/admin-dashb.html";
                break;
            case "CHEFDEPARTEMENT":
                window.location.href = "/chef-home.html";
                break;
            case "DOYEN":
                window.location.href = "/doyen-dashboard.html";
                break;
            case "CELLULE_ANONYMAT":
                window.location.href = "/cellule-accueil.html";
                break;
            case "RECTEUR":
                window.location.href = "/recteur.html";
                break;
            case "VICEDOYEN":
                window.location.href = "/vice-doyen.html";
                break;
            default:
                window.location.href = "/login.html";
        }
    }

    // ======================
    //         LOGIN
    // ======================
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

                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value.trim(),
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
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


            loggedUser = data?.user || null;
            console.log("Login success:", loggedUser);


            localStorage.setItem("dg-user", JSON.stringify(loggedUser));


            successModal.classList.remove("is-visible");
            void successModal.offsetWidth;
            successModal.classList.add("is-visible");

            setTimeout(() => {
                redirectByRole();
            }, 1500);

        } catch (err) {
            console.error("Login error:", err);
            showGeneralError("Erreur réseau, veuillez réessayer.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }
        }
    });


    closeBtn.addEventListener("click", () => {
        successModal.classList.remove("is-visible");
        redirectByRole();
    });

    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            successModal.classList.remove("is-visible");
            redirectByRole();
        }
    });
});