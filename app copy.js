/* =========================================================
   CITY INTERNATIONAL ONLINE SCHOOL
   MAIN JAVASCRIPT
========================================================= */

"use strict";

/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    setCurrentYear();

    setupEducationLevels();

    setupModalClosing();

});


/* =========================================================
   CURRENT YEAR
========================================================= */

function setCurrentYear() {

    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {

    const menu = document.getElementById("mobileMenu");

    if (!menu) return;

    menu.classList.toggle("show");

}


function closeMobileMenu() {

    const menu = document.getElementById("mobileMenu");

    if (!menu) return;

    menu.classList.remove("show");

}


/* =========================================================
   SCROLL TO SECTION
========================================================= */

function scrollToSection(sectionId) {

    const section = document.getElementById(sectionId);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   MODAL FUNCTIONS
========================================================= */

function openModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("show");

    document.body.style.overflow = "";

}


/* =========================================================
   LOGIN
========================================================= */

function openLogin(role = "student") {

    closeModal("registerModal");

    const loginTitle = document.getElementById("loginTitle");
    const loginDescription = document.getElementById("loginDescription");
    const loginIdLabel = document.getElementById("loginIdLabel");
    const loginId = document.getElementById("loginId");
    const loginRole = document.getElementById("loginRole");

    if (!loginTitle || !loginDescription || !loginIdLabel || !loginId) {
        return;
    }


    role = String(role).toLowerCase();

    loginRole.value = role;


    if (role === "teacher") {

        loginTitle.textContent = "Teacher Login";

        loginDescription.textContent =
            "Sign in using your approved teacher account.";

        loginIdLabel.textContent =
            "Teacher Code";

        loginId.placeholder =
            "Example: CIS-TCH-48291";

    }


    else if (role === "admin") {

        loginTitle.textContent = "Administrator Login";

        loginDescription.textContent =
            "Sign in to the school administration portal.";

        loginIdLabel.textContent =
            "Administrator ID";

        loginId.placeholder =
            "Enter administrator ID";

    }


    else {

        loginTitle.textContent = "Student Login";

        loginDescription.textContent =
            "Sign in to your student account.";

        loginIdLabel.textContent =
            "Student Number";

        loginId.placeholder =
            "Example: CIS-STU-2026-00124";

    }


    openModal("loginModal");

}


function handleLogin(event) {

    event.preventDefault();


    const role =
        document.getElementById("loginRole").value;

    const loginId =
        document.getElementById("loginId").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    if (!loginId || !password) {

        showNotification(
            "Missing Information",
            "Please enter your login details.",
            "error"
        );

        return;

    }


    /*
        IMPORTANT:

        This is currently a front-end demonstration.

        It does NOT authenticate against a real database.

        Later we will connect this to a real backend
        such as Firebase or Supabase.
    */


    let roleName = "Student";

    if (role === "teacher") {
        roleName = "Teacher";
    }

    if (role === "admin") {
        roleName = "Administrator";
    }


    closeModal("loginModal");


    showNotification(
        "Login Ready",
        `${roleName} login received. Backend authentication will be connected next.`,
        "success"
    );


    console.log("Login attempt:", {
        role: role,
        loginId: loginId
    });

}


/* =========================================================
   REGISTER
========================================================= */

function openRegister() {

    closeModal("loginModal");

    selectRegisterRole("student");

    const form =
        document.getElementById("registerForm");

    if (form) {
        form.reset();
    }

    selectRegisterRole("student");

    openModal("registerModal");

}


function selectRegisterRole(role) {

    role = String(role).toLowerCase();


    const registerRole =
        document.getElementById("registerRole");

    const studentButton =
        document.getElementById("studentRoleButton");

    const teacherButton =
        document.getElementById("teacherRoleButton");

    const studentFields =
        document.getElementById("studentFields");

    const teacherFields =
        document.getElementById("teacherFields");


    if (!registerRole) return;


    registerRole.value = role;


    if (role === "teacher") {

        teacherButton.classList.add("active");

        studentButton.classList.remove("active");

        studentFields.classList.add("hidden");

        teacherFields.classList.remove("hidden");

    }

    else {

        studentButton.classList.add("active");

        teacherButton.classList.remove("active");

        studentFields.classList.remove("hidden");

        teacherFields.classList.add("hidden");

    }

}


/* =========================================================
   REGISTRATION
========================================================= */

function handleRegister(event) {

    event.preventDefault();


    const role =
        document.getElementById("registerRole").value;

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const phone =
        document.getElementById("registerPhone").value.trim();

    const password =
        document.getElementById("registerPassword").value;


    if (!name || !email || !password) {

        showNotification(
            "Missing Information",
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    if (password.length < 6) {

        showNotification(
            "Password Too Short",
            "Your password must contain at least 6 characters.",
            "error"
        );

        return;

    }


    /* ============================================
       STUDENT REGISTRATION
    ============================================ */

    if (role === "student") {

        const educationLevel =
            document.getElementById("educationLevel").value;

        const studentClass =
            document.getElementById("studentClass").value;

        const guardianName =
            document.getElementById("guardianName").value.trim();


        if (!educationLevel || !studentClass) {

            showNotification(
                "Missing Student Information",
                "Please select the education level and class.",
                "error"
            );

            return;

        }


        const studentNumber =
            generateStudentNumber();


        const studentData = {

            type: "student",

            studentNumber: studentNumber,

            fullName: name,

            email: email,

            phone: phone,

            password: password,

            educationLevel: educationLevel,

            className: studentClass,

            guardianName: guardianName,

            status: "pending",

            createdAt: new Date().toISOString()

        };


        saveRegistration(studentData);


        closeModal("registerModal");


        showNotification(
            "Registration Submitted",
            `Your student registration has been received. Student number: ${studentNumber}`,
            "success"
        );


        console.log(
            "Student registration:",
            studentData
        );

    }


    /* ============================================
       TEACHER REGISTRATION
    ============================================ */

    else if (role === "teacher") {

        const subject =
            document.getElementById("teacherSubject").value;

        const level =
            document.getElementById("teacherLevel").value;

        const qualification =
            document.getElementById("teacherQualification").value.trim();


        if (!subject) {

            showNotification(
                "Missing Subject",
                "Please select the subject you teach.",
                "error"
            );

            return;

        }


        const teacherData = {

            type: "teacher",

            teacherApplicationId:
                generateTeacherApplicationNumber(),

            fullName: name,

            email: email,

            phone: phone,

            password: password,

            subject: subject,

            teachingLevel: level,

            qualification: qualification,

            status: "pending",

            teacherCode: null,

            createdAt: new Date().toISOString()

        };


        saveRegistration(teacherData);


        closeModal("registerModal");


        showNotification(
            "Teacher Application Submitted",
            "Your application has been sent to the administrator for approval.",
            "success"
        );


        console.log(
            "Teacher registration:",
            teacherData
        );

    }

}


/* =========================================================
   GENERATE STUDENT NUMBER
========================================================= */

function generateStudentNumber() {

    const year =
        new Date().getFullYear();

    const randomNumber =
        Math.floor(10000 + Math.random() * 90000);


    return `CIS-STU-${year}-${randomNumber}`;

}


/* =========================================================
   GENERATE TEACHER APPLICATION NUMBER
========================================================= */

function generateTeacherApplicationNumber() {

    const randomNumber =
        Math.floor(10000 + Math.random() * 90000);


    return `CIS-TAPP-${randomNumber}`;

}


/* =========================================================
   SAVE REGISTRATION
========================================================= */

function saveRegistration(data) {

    let registrations = [];


    try {

        const saved =
            localStorage.getItem("cis_registrations");

        if (saved) {
            registrations = JSON.parse(saved);
        }

    }

    catch (error) {

        console.error(
            "Could not read saved registrations:",
            error
        );

        registrations = [];

    }


    registrations.push(data);


    try {

        localStorage.setItem(
            "cis_registrations",
            JSON.stringify(registrations)
        );

    }

    catch (error) {

        console.error(
            "Could not save registration:",
            error
        );

    }

}


/* =========================================================
   SUBJECT BUTTON
========================================================= */

function showLoginMessage(subject) {

    showNotification(
        "Student Login Required",
        `Please log in to access ${subject}.`,
        "success"
    );


    setTimeout(function () {

        openLogin("student");

    }, 700);

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

function showForgotPassword(event) {

    event.preventDefault();


    showNotification(
        "Password Recovery",
        "Password recovery will be connected to the school backend.",
        "success"
    );

}


/* =========================================================
   NOTIFICATION
========================================================= */

let notificationTimer = null;


function showNotification(
    title,
    message,
    type = "success"
) {

    const notification =
        document.getElementById("notification");

    const notificationTitle =
        document.getElementById("notificationTitle");

    const notificationMessage =
        document.getElementById("notificationMessage");

    const notificationIcon =
        notification.querySelector(".notification-icon");


    if (!notification) return;


    notificationTitle.textContent =
        title;

    notificationMessage.textContent =
        message;


    if (type === "error") {

        notificationIcon.textContent = "!";

        notificationIcon.style.background = "#fee2e2";

        notificationIcon.style.color = "#dc2626";

    }

    else {

        notificationIcon.textContent = "✓";

        notificationIcon.style.background = "#dcfce7";

        notificationIcon.style.color = "#16a34a";

    }


    notification.classList.add("show");


    if (notificationTimer) {

        clearTimeout(notificationTimer);

    }


    notificationTimer =
        setTimeout(function () {

            hideNotification();

        }, 6000);

}


function hideNotification() {

    const notification =
        document.getElementById("notification");

    if (!notification) return;

    notification.classList.remove("show");

}


/* =========================================================
   MODAL CLICK OUTSIDE
========================================================= */

function setupModalClosing() {

    const overlays =
        document.querySelectorAll(".modal-overlay");


    overlays.forEach(function (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                if (event.target === overlay) {

                    overlay.classList.remove("show");

                    document.body.style.overflow = "";

                }

            }
        );

    });


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                document
                    .querySelectorAll(".modal-overlay.show")
                    .forEach(function (modal) {

                        modal.classList.remove("show");

                    });

                document.body.style.overflow = "";

            }

        }
    );

}


/* =========================================================
   EDUCATION LEVEL / CLASS
========================================================= */

function setupEducationLevels() {

    const educationLevel =
        document.getElementById("educationLevel");

    const studentClass =
        document.getElementById("studentClass");


    if (!educationLevel || !studentClass) {
        return;
    }


    educationLevel.addEventListener(
        "change",
        function () {

            const selected =
                educationLevel.value;


            studentClass.innerHTML = "";


            const defaultOption =
                document.createElement("option");

            defaultOption.value = "";

            defaultOption.textContent =
                "Select class";

            studentClass.appendChild(
                defaultOption
            );


            if (selected === "primary") {

                for (let i = 1; i <= 7; i++) {

                    const option =
                        document.createElement("option");

                    option.value =
                        `Primary ${i}`;

                    option.textContent =
                        `Primary ${i}`;

                    studentClass.appendChild(
                        option
                    );

                }

            }


            else if (selected === "secondary") {

                for (let i = 1; i <= 6; i++) {

                    const option =
                        document.createElement("option");

                    option.value =
                        `Senior ${i}`;

                    option.textContent =
                        `Senior ${i}`;

                    studentClass.appendChild(
                        option
                    );

                }

            }

        }
    );

}


/* =========================================================
   PREVENT EMPTY HASH LINKS
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest('a[href="#"]');


        if (!link) return;


        const onclick =
            link.getAttribute("onclick");


        if (!onclick) {

            event.preventDefault();

        }

    }
);


/* =========================================================
   DEBUG INFORMATION
========================================================= */

console.log(
    "CITY INTERNATIONAL ONLINE SCHOOL loaded successfully."
);
