// ============================================================
// CITY INTERNATIONAL ONLINE SCHOOL
// app.js
// Firebase Registration + Login System
// ============================================================

import {
    ref,
    get,
    set,
    update
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {
    database
} from "./firebase-config.js";


// ============================================================
// CONFIGURATION
// ============================================================

const REGISTRATIONS_PATH = "registrations";
const CURRENT_STUDENT_KEY = "cis_current_student";
const CURRENT_TEACHER_KEY = "cis_current_teacher";
const CURRENT_ADMIN_KEY = "cis_current_admin";


// ============================================================
// STARTUP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    setCurrentYear();
    setupEducationLevels();
    setupModalClosing();
    applySiteBranding();

    console.log("CITY INTERNATIONAL ONLINE SCHOOL app.js loaded.");
});


// ============================================================
// CURRENT YEAR
// ============================================================

function setCurrentYear() {

    const yearElements = document.querySelectorAll(
        "#currentYear, .current-year"
    );

    yearElements.forEach(element => {
        element.textContent = new Date().getFullYear();
    });
}


// ============================================================
// EDUCATION LEVELS
// ============================================================

function setupEducationLevels() {

    const levelSelect = document.getElementById("educationLevel");

    if (!levelSelect) {
        return;
    }

    levelSelect.innerHTML = `
        <option value="">Select education level</option>

        <optgroup label="Primary">
            <option value="Primary 1">Primary 1</option>
            <option value="Primary 2">Primary 2</option>
            <option value="Primary 3">Primary 3</option>
            <option value="Primary 4">Primary 4</option>
            <option value="Primary 5">Primary 5</option>
            <option value="Primary 6">Primary 6</option>
            <option value="Primary 7">Primary 7</option>
        </optgroup>

        <optgroup label="Secondary">
            <option value="Senior 1">Senior 1</option>
            <option value="Senior 2">Senior 2</option>
            <option value="Senior 3">Senior 3</option>
            <option value="Senior 4">Senior 4</option>
            <option value="Senior 5">Senior 5</option>
            <option value="Senior 6">Senior 6</option>
        </optgroup>
    `;
}


// ============================================================
// SITE BRANDING
// ============================================================

function applySiteBranding() {

    try {

        const settings = JSON.parse(
            localStorage.getItem("cis_admin_settings") || "{}"
        );

        if (settings.schoolName) {

            const schoolNames =
                document.querySelectorAll(".school-name");

            schoolNames.forEach(element => {
                element.textContent = settings.schoolName;
            });
        }

    } catch (error) {

        console.warn(
            "Could not load site branding.",
            error
        );
    }
}


// ============================================================
// MODAL FUNCTIONS
// ============================================================

function setupModalClosing() {

    document.querySelectorAll(".modal").forEach(modal => {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                modal.style.display = "none";
            }

        });

    });
}


function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// OPEN LOGIN
// ============================================================

function openLogin(role = "student") {

    const modal = document.getElementById("loginModal");

    if (!modal) {
        console.error("loginModal was not found.");
        return;
    }

    modal.style.display = "flex";

    const roleInput =
        document.getElementById("loginRole");

    if (roleInput) {
        roleInput.value = role;
    }

    const title =
        document.getElementById("loginTitle");

    if (title) {

        if (role === "teacher") {
            title.textContent = "Teacher Login";
        }

        else if (role === "admin") {
            title.textContent = "Admin Login";
        }

        else {
            title.textContent = "Student Login";
        }
    }

    const identifier =
        document.getElementById("loginIdentifier");

    if (identifier) {

        if (role === "teacher") {
            identifier.placeholder =
                "Enter your Teacher Code";
        }

        else if (role === "admin") {
            identifier.placeholder =
                "Enter Admin ID";
        }

        else {
            identifier.placeholder =
                "Enter Student Number";
        }
    }
}


// ============================================================
// OPEN REGISTRATION
// ============================================================

function openRegister(role = "student") {

    const modal =
        document.getElementById("registerModal");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

    const roleInput =
        document.getElementById("registerRole");

    if (roleInput) {
        roleInput.value = role;
    }

    updateRegistrationFields(role);
}


// ============================================================
// REGISTRATION FIELD VISIBILITY
// ============================================================

function updateRegistrationFields(role) {

    const studentFields =
        document.getElementById("studentFields");

    const teacherFields =
        document.getElementById("teacherFields");

    if (studentFields) {

        studentFields.style.display =
            role === "student" ? "block" : "none";
    }

    if (teacherFields) {

        teacherFields.style.display =
            role === "teacher" ? "block" : "none";
    }
}


// ============================================================
// REGISTRATION ROLE CHANGE
// ============================================================

document.addEventListener("change", event => {

    if (event.target.id === "registerRole") {

        updateRegistrationFields(
            event.target.value
        );
    }
});


// ============================================================
// FIREBASE REGISTRATION FUNCTIONS
// ============================================================

async function getRegistrations() {

    try {

        const registrationsRef =
            ref(database, REGISTRATIONS_PATH);

        const snapshot =
            await get(registrationsRef);

        if (!snapshot.exists()) {

            return [];
        }

        const data = snapshot.val();

        return Object.keys(data).map(id => {

            return {
                id,
                ...data[id]
            };

        });

    } catch (error) {

        console.error(
            "Firebase registration read error:",
            error
        );

        // Fallback to local cache
        try {

            return JSON.parse(
                localStorage.getItem("cis_registrations") ||
                "[]"
            );

        } catch {

            return [];
        }
    }
}


// ============================================================
// SAVE ONE REGISTRATION
// ============================================================

async function saveRegistration(id, registration) {

    const registrationRef =
        ref(
            database,
            `${REGISTRATIONS_PATH}/${id}`
        );

    await set(
        registrationRef,
        registration
    );

    // Local cache
    const registrations =
        await getRegistrations();

    const filtered =
        registrations.filter(item => item.id !== id);

    filtered.push({
        id,
        ...registration
    });

    localStorage.setItem(
        "cis_registrations",
        JSON.stringify(filtered)
    );
}


// ============================================================
// UPDATE REGISTRATION
// ============================================================

async function updateRegistration(id, updates) {

    const registrationRef =
        ref(
            database,
            `${REGISTRATIONS_PATH}/${id}`
        );

    await update(
        registrationRef,
        updates
    );

    const registrations =
        await getRegistrations();

    const index =
        registrations.findIndex(
            item => item.id === id
        );

    if (index !== -1) {

        registrations[index] = {
            ...registrations[index],
            ...updates
        };

        localStorage.setItem(
            "cis_registrations",
            JSON.stringify(registrations)
        );
    }
}


// ============================================================
// GENERATE RANDOM NUMBER
// ============================================================

function randomNumber(length) {

    let result = "";

    for (let i = 0; i < length; i++) {

        result += Math.floor(
            Math.random() * 10
        );
    }

    return result;
}


// ============================================================
// STUDENT NUMBER
// ============================================================

async function generateStudentNumber() {

    const registrations =
        await getRegistrations();

    let number;

    do {

        number =
            "CIS-STU-" +
            randomNumber(6);

    } while (
        registrations.some(
            student =>
                student.studentNumber === number
        )
    );

    return number;
}


// ============================================================
// TEACHER APPLICATION NUMBER
// ============================================================

async function generateApplicationNumber() {

    const registrations =
        await getRegistrations();

    let number;

    do {

        number =
            "CIS-APP-" +
            randomNumber(6);

    } while (
        registrations.some(
            teacher =>
                teacher.applicationNumber === number
        )
    );

    return number;
}


// ============================================================
// SHOW NOTIFICATION
// ============================================================

function showNotification(
    message,
    type = "info"
) {

    const existing =
        document.querySelector(
            ".cis-notification"
        );

    if (existing) {
        existing.remove();
    }

    const notification =
        document.createElement("div");

    notification.className =
        "cis-notification";

    notification.textContent =
        message;

    notification.style.position =
        "fixed";

    notification.style.top =
        "20px";

    notification.style.right =
        "20px";

    notification.style.zIndex =
        "99999";

    notification.style.padding =
        "15px 20px";

    notification.style.borderRadius =
        "10px";

    notification.style.fontFamily =
        "Arial, sans-serif";

    notification.style.fontSize =
        "15px";

    notification.style.fontWeight =
        "bold";

    notification.style.maxWidth =
        "350px";

    notification.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.25)";

    if (type === "success") {

        notification.style.background =
            "#198754";

        notification.style.color =
            "#fff";
    }

    else if (type === "error") {

        notification.style.background =
            "#dc3545";

        notification.style.color =
            "#fff";
    }

    else {

        notification.style.background =
            "#0d6efd";

        notification.style.color =
            "#fff";
    }

    document.body.appendChild(
        notification
    );

    setTimeout(() => {

        notification.remove();

    }, 5000);
}


// ============================================================
// HANDLE REGISTRATION
// ============================================================

async function handleRegister(event) {

    event.preventDefault();

    const form =
        event.target;

    const roleElement =
        document.getElementById("registerRole");

    const role =
        roleElement
            ? roleElement.value
            : "student";

    const fullName =
        document.getElementById("fullName")?.value.trim();

    const email =
        document.getElementById("email")?.value.trim();

    const phone =
        document.getElementById("phone")?.value.trim();

    const password =
        document.getElementById("password")?.value;

    if (!fullName ||
        !email ||
        !phone ||
        !password) {

        showNotification(
            "Please fill in all required fields.",
            "error"
        );

        return;
    }


    // ========================================================
    // STUDENT
    // ========================================================

    if (role === "student") {

        const educationLevel =
            document.getElementById(
                "educationLevel"
            )?.value || "";

        const studentClass =
            document.getElementById(
                "studentClass"
            )?.value.trim() || "";

        const guardian =
            document.getElementById(
                "guardian"
            )?.value.trim() || "";

        const school =
            document.getElementById(
                "school"
            )?.value.trim() || "";

        if (!educationLevel) {

            showNotification(
                "Please select your education level.",
                "error"
            );

            return;
        }

        try {

            const studentNumber =
                await generateStudentNumber();

            const id =
                "student_" +
                Date.now();

            const student = {

                role: "student",

                fullName,

                email,

                phone,

                password,

                studentNumber,

                educationLevel,

                studentClass,

                guardian,

                school,

                status: "approved",

                createdAt:
                    new Date().toISOString()
            };

            await saveRegistration(
                id,
                student
            );

            localStorage.setItem(
                CURRENT_STUDENT_KEY,
                JSON.stringify({
                    id,
                    ...student
                })
            );

            showNotification(
                `Registration successful! Your Student Number is ${studentNumber}`,
                "success"
            );

            form.reset();

            closeModal(
                "registerModal"
            );

            setTimeout(() => {

                window.location.href =
                    "student-dashboard.html";

            }, 1500);

        }

        catch (error) {

            console.error(
                error
            );

            showNotification(
                "Registration failed. Please try again.",
                "error"
            );
        }

        return;
    }


    // ========================================================
    // TEACHER
    // ========================================================

    if (role === "teacher") {

        const subject =
            document.getElementById(
                "teacherSubject"
            )?.value.trim() || "";

        const level =
            document.getElementById(
                "teacherLevel"
            )?.value.trim() || "";

        const qualification =
            document.getElementById(
                "qualification"
            )?.value.trim() || "";

        if (!subject ||
            !level ||
            !qualification) {

            showNotification(
                "Please complete all teacher information.",
                "error"
            );

            return;
        }

        try {

            const applicationNumber =
                await generateApplicationNumber();

            const id =
                "teacher_" +
                Date.now();

            const teacher = {

                role: "teacher",

                fullName,

                email,

                phone,

                password,

                applicationNumber,

                teacherCode: null,

                subject,

                level,

                qualification,

                status: "pending",

                createdAt:
                    new Date().toISOString()
            };

            await saveRegistration(
                id,
                teacher
            );

            showNotification(
                `Teacher application submitted! Your application number is ${applicationNumber}. Wait for administrator approval.`,
                "success"
            );

            form.reset();

            closeModal(
                "registerModal"
            );

        }

        catch (error) {

            console.error(
                error
            );

            showNotification(
                "Teacher registration failed. Please try again.",
                "error"
            );
        }
    }
}


// ============================================================
// HANDLE LOGIN
// ============================================================

async function handleLogin(event) {

    event.preventDefault();

    const role =
        document.getElementById(
            "loginRole"
        )?.value || "student";

    const identifier =
        document.getElementById(
            "loginIdentifier"
        )?.value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        )?.value;

    if (!identifier || !password) {

        showNotification(
            "Please enter your login details.",
            "error"
        );

        return;
    }


    // ========================================================
    // ADMIN LOGIN
    // ========================================================

    if (role === "admin") {

        /*
         * Temporary administrator login.
         *
         * For security, this should eventually be moved
         * to Firebase Authentication.
         */

        const ADMIN_ID =
            "CIS-ADMIN-001";

        const ADMIN_PASSWORD =
            "CHANGE_THIS_ADMIN_PASSWORD";

        if (
            identifier === ADMIN_ID &&
            password === ADMIN_PASSWORD
        ) {

            const admin = {

                id: ADMIN_ID,

                role: "admin",

                loggedInAt:
                    new Date().toISOString()
            };

            localStorage.setItem(
                CURRENT_ADMIN_KEY,
                JSON.stringify(admin)
            );

            showNotification(
                "Administrator login successful.",
                "success"
            );

            setTimeout(() => {

                window.location.href =
                    "admin-dashboard.html";

            }, 700);

        }

        else {

            showNotification(
                "Invalid administrator login.",
                "error"
            );
        }

        return;
    }


    // ========================================================
    // FIREBASE USER LOGIN
    // ========================================================

    try {

        const registrations =
            await getRegistrations();

        let user = null;


        // ----------------------------------------------------
        // STUDENT
        // ----------------------------------------------------

        if (role === "student") {

            user =
                registrations.find(
                    item =>
                        item.role === "student" &&
                        item.studentNumber === identifier
                );

            if (!user) {

                showNotification(
                    "Student number was not found.",
                    "error"
                );

                return;
            }

            if (
                user.password !== password
            ) {

                showNotification(
                    "Incorrect password.",
                    "error"
                );

                return;
            }

            localStorage.setItem(
                CURRENT_STUDENT_KEY,
                JSON.stringify(user)
            );

            showNotification(
                "Student login successful.",
                "success"
            );

            setTimeout(() => {

                window.location.href =
                    "student-dashboard.html";

            }, 700);

            return;
        }


        // ----------------------------------------------------
        // TEACHER
        // ----------------------------------------------------

        if (role === "teacher") {

            user =
                registrations.find(
                    item =>
                        item.role === "teacher" &&
                        item.teacherCode === identifier
                );

            if (!user) {

                showNotification(
                    "Teacher code was not found or has not been issued yet.",
                    "error"
                );

                return;
            }

            if (
                user.password !== password
            ) {

                showNotification(
                    "Incorrect password.",
                    "error"
                );

                return;
            }

            if (
                user.status === "pending"
            ) {

                showNotification(
                    "Your teacher application is still waiting for administrator approval.",
                    "error"
                );

                return;
            }

            if (
                user.status === "disapproved"
            ) {

                showNotification(
                    "Your teacher application was not approved.",
                    "error"
                );

                return;
            }

            if (
                user.status !== "approved"
            ) {

                showNotification(
                    "Your teacher account is not active.",
                    "error"
                );

                return;
            }

            localStorage.setItem(
                CURRENT_TEACHER_KEY,
                JSON.stringify(user)
            );

            showNotification(
                "Teacher login successful.",
                "success"
            );

            setTimeout(() => {

                window.location.href =
                    "teacher-dashboard.html";

            }, 700);

            return;
        }

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        showNotification(
            "Could not connect to the school database. Please try again.",
            "error"
        );
    }
}


// ============================================================
// LOGOUT
// ============================================================

function logoutStudent() {

    localStorage.removeItem(
        CURRENT_STUDENT_KEY
    );

    window.location.href =
        "index.html";
}


function logoutTeacher() {

    localStorage.removeItem(
        CURRENT_TEACHER_KEY
    );

    window.location.href =
        "index.html";
}


function logoutAdmin() {

    localStorage.removeItem(
        CURRENT_ADMIN_KEY
    );

    window.location.href =
        "index.html";
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

async function showForgotPassword() {

    const identifier =
        prompt(
            "Enter your Student Number or Teacher Code:"
        );

    if (!identifier) {
        return;
    }

    try {

        const registrations =
            await getRegistrations();

        const user =
            registrations.find(
                item =>
                    item.studentNumber === identifier ||
                    item.teacherCode === identifier
            );

        if (!user) {

            showNotification(
                "Account not found.",
                "error"
            );

            return;
        }

        /*
         * Temporary system.
         *
         * Passwords should eventually be handled by
         * Firebase Authentication instead of stored directly.
         */

        alert(
            "Your registered password is: " +
            user.password
        );

    }

    catch (error) {

        console.error(
            error
        );

        showNotification(
            "Unable to retrieve account information.",
            "error"
        );
    }
}


// ============================================================
// NAVIGATION HELPERS
// ============================================================

function scrollToSection(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}


function goHome() {

    window.location.href =
        "index.html";
}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================
//
// Because app.js is now a MODULE, functions are not automatically
// available to onclick="..." in HTML.
//
// Therefore we explicitly attach them to window.
//

window.openLogin =
    openLogin;

window.openRegister =
    openRegister;

window.closeModal =
    closeModal;

window.handleLogin =
    handleLogin;

window.handleRegister =
    handleRegister;

window.showForgotPassword =
    showForgotPassword;

window.logoutStudent =
    logoutStudent;

window.logoutTeacher =
    logoutTeacher;

window.logoutAdmin =
    logoutAdmin;

window.scrollToSection =
    scrollToSection;

window.goHome =
    goHome;


// ============================================================
// OPTIONAL FIREBASE API
// ============================================================

window.CISFirebase = {

    getRegistrations,

    saveRegistration,

    updateRegistration,

    generateStudentNumber,

    generateApplicationNumber
};


// ============================================================
// END OF app.js
// ============================================================