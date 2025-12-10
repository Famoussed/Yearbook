const token = localStorage.getItem('userToken');
const userDataString = localStorage.getItem('userData');
const signinButton = document.getElementById("signinButton");
const registerButton = document.getElementById("registerButton");
const navbarItems = document.getElementById("navbarItems");

if (token && userDataString) {

    if (signinButton) signinButton.style.display = 'none';
    if (registerButton) registerButton.style.display = 'none';
    if (navbarItems) navbarItems.style.margin = "0 auto";

}