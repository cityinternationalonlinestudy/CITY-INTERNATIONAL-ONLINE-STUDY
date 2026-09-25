document.addEventListener("DOMContentLoaded", function () {

    setCurrentYear();

    setupEducationLevels();

    setupModalClosing();

    applySiteBranding();

    console.log(
        "CITY INTERNATIONAL ONLINE SCHOOL - JavaScript loaded successfully."
    );

});


/* =========================
   YEAR
========================= */

function setCurrentYear() {

    const year = document.getElementById("currentYear");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

}


function applySiteBranding() {

    try {
        const saved = localStorage.getItem("cis_admin_settings");
        const settings = saved ? JSON.parse(saved) : {};

        const schoolName = (settings.schoolName || "City International Online School").trim();
        const schoolIcon = settings.schoolIcon || "🎓";
        const schoolLogo = settings.schoolLogo || "";

        const logoText = document.querySelector(".logo-icon");
        const logoImage = document.querySelector(".logo-image");

        if (logoText) {
            if (schoolLogo) {
                logoText.style.display = "none";
            } else {
                logoText.textContent = schoolIcon;
                logoText.style.display = "inline-block";
            }
        }

        if (logoImage) {
            if (schoolLogo) {
                logoImage.src = schoolLogo;
                logoImage.style.display = "block";
            } else {
                logoImage.removeAttribute("src");
                logoImage.style.display = "none";
            }
        }

        const strong = document.querySelector(".logo strong");
        if (strong) {
            const upperName = schoolName.toUpperCase();
            const words = upperName.split(" ");
            strong.textContent = words.slice(0, 2).join(" ");
        }

        const small = document.querySelector(".logo small");
        if (small) {
            const upperName = schoolName.toUpperCase();
            const words = upperName.split(" ");
            const smallText = words.slice(2).join(" ");
            small.textContent = smallText || "ONLINE SCHOOL";
        }

    } catch (error) {
        console.error("Unable to apply site branding.", error);
    }

}


/* =========================
   MOBILE MENU
========================= */

function toggleMobileMenu() {

    const menu = document.getElementById("navMenu");

    if (menu) {
        menu.classList.toggle("active");
    }

}


function closeMobileMenu() {

    const menu = document.getElementById("navMenu");

    if (menu) {
        menu.classList.remove("active");
    }

}


/* =========================
   LOGIN
========================= */

function openLogin(role) {

    const modal =
        document.getElementById("loginModal");

    if (!modal) return;


    const title =
        document.getElementById("loginTitle");

    const description =
        document.getElementById("loginDescription");

    const label =
        document.getElementById("loginNumberLabel");

    const number =
        document.getElementById("loginNumber");


    modal.dataset.role = role;


    if (role === "student") {

        title.textContent = "Student Login";

        description.textContent =
            "Login using your student number and password.";

        label.textContent =
            "Student Number";

        number.placeholder =
            "CIS-STU-2026-XXXXX";

    }


    if (role === "teacher") {

        title.textContent = "Teacher Login";

        description.textContent =
            "Teacher login will be available after approval.";

        label.textContent =
            "Teacher Code";

        number.placeholder =
            "CIS-TCH-XXXXX";

    }


    if (role === "admin") {

        title.textContent =
            "Administrator Login";

        description.textContent =
            "Administrator portal.";

        label.textContent =
            "Administrator ID";

        number.placeholder =
            "Administrator ID";

    }


    modal.classList.add("active");

}


/* =========================
   LOGIN
========================= */

function handleLogin(event) {

    event.preventDefault();


    const modal =
        document.getElementById("loginModal");

    const role =
        modal.dataset.role || "student";


    const loginNumber =
        document
            .getElementById("loginNumber")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    if (!loginNumber || !password) {

        showNotification(
            "Please enter your login details.",
            "error"
        );

        return;
    }


    /* STUDENT */

    if (role === "student") {

        const registrations =
            getRegistrations();


        const student =
            registrations.find(function (user) {

                return (
                    user.role === "student" &&
                    user.studentNumber &&
                    user.studentNumber.toUpperCase() ===
                        loginNumber.toUpperCase() &&
                    user.password === password
                );

            });


        if (!student) {

            showNotification(
                "Student number or password is incorrect.",
                "error"
            );

            return;
        }


        localStorage.setItem(
            "cis_current_student",
            JSON.stringify(student)
        );


        showNotification(
            "Login successful! Opening your dashboard...",
            "success"
        );


        setTimeout(function () {

            window.location.href =
                "student-dashboard.html";

        }, 700);


        return;
    }


    /* TEACHER */

    if (role === "teacher") {

    const registrations = getRegistrations();

    const teacher = registrations.find(function (user) {

        return (
            user.role === "teacher" &&
            user.teacherCode &&
            user.teacherCode.toUpperCase() === loginNumber.toUpperCase() &&
            user.password === password
        );

    });


    if (!teacher) {

        showNotification(
            "Teacher code or password is incorrect.",
            "error"
        );

        return;
    }


    if (teacher.status === "pending") {

        showNotification(
            "Your teacher application is still waiting for administrator approval.",
            "info"
        );

        return;
    }


    if (teacher.status === "disapproved") {

        showNotification(
            "Your teacher application was not approved. Please contact the administrator.",
            "error"
        );

        return;
    }


    if (teacher.status !== "approved") {

        showNotification(
            "Your teacher account is not approved yet.",
            "info"
        );

        return;
    }


    localStorage.setItem(
        "cis_current_teacher",
        JSON.stringify(teacher)
    );


    showNotification(
        "Teacher login successful! Opening your dashboard...",
        "success"
    );


    setTimeout(function () {

        window.location.href =
            "teacher-dashboard.html";

    }, 700);


    return;
}

    /* ADMIN */

    if (role === "admin") {

    /*
        Administrator account
        ---------------------
        ID: CIS-ADMIN-001
        Password: Admin@12345
    */

    const ADMIN_ID = "CIS-ADMIN-001";
    const ADMIN_PASSWORD = "Admin@12345";


    if (
        loginNumber.toUpperCase() !== ADMIN_ID ||
        password !== ADMIN_PASSWORD
    ) {

        showNotification(
            "Administrator ID or password is incorrect.",
            "error"
        );

        return;
    }


    localStorage.setItem(
        "cis_admin_logged_in",
        "true"
    );


    localStorage.setItem(
        "cis_current_admin",
        JSON.stringify({
            id: ADMIN_ID,
            role: "admin",
            name: "School Administrator"
        })
    );


    showNotification(
        "Administrator login successful! Opening dashboard...",
        "success"
    );


    setTimeout(function () {

        window.location.href =
            "admin-dashboard.html";

    }, 700);


    return;
}


}


/* =========================
   REGISTER
========================= */

function openRegister() {

    const modal =
        document.getElementById("registerModal");

    if (!modal) return;

    modal.dataset.role = "student";

    document
        .getElementById("registerForm")
        .reset();

    selectRegisterRole("student");

    modal.classList.add("active");

}


/* =========================
   SELECT REGISTER ROLE
========================= */

function selectRegisterRole(role) {

    const modal =
        document.getElementById("registerModal");


    const studentFields =
        document.getElementById("studentRegisterFields");


    const teacherFields =
        document.getElementById("teacherRegisterFields");


    const studentButton =
        document.getElementById("studentRoleButton");


    const teacherButton =
        document.getElementById("teacherRoleButton");


    modal.dataset.role = role;


    if (role === "student") {

        studentFields.style.display =
            "block";

        teacherFields.style.display =
            "none";

        studentButton.classList.add("active");

        teacherButton.classList.remove("active");

        document
            .getElementById("educationLevel")
            .required = true;

        document
            .getElementById("studentClass")
            .required = true;

        document
            .getElementById("guardianName")
            .required = true;

        document
            .getElementById("schoolName")
            .required = true;

    }


    if (role === "teacher") {

        studentFields.style.display =
            "none";

        teacherFields.style.display =
            "block";

        studentButton.classList.remove("active");

        teacherButton.classList.add("active");

        document
            .getElementById("educationLevel")
            .required = false;

        document
            .getElementById("studentClass")
            .required = false;

        document
            .getElementById("guardianName")
            .required = false;

        document
            .getElementById("schoolName")
            .required = false;

    }

}


/* =========================
   REGISTER ACCOUNT
========================= */

function handleRegister(event) {

    event.preventDefault();


    const modal =
        document.getElementById("registerModal");


    const role =
        modal.dataset.role || "student";


    const fullName =
        document.getElementById("registerFullName")
        .value
        .trim();


    const email =
        document.getElementById("registerEmail")
        .value
        .trim();


    const phone =
        document.getElementById("registerPhone")
        .value
        .trim();


    const password =
        document.getElementById("registerPassword")
        .value;


    if (
        !fullName ||
        !email ||
        !phone ||
        !password
    ) {

        showNotification(
            "Please complete all required fields.",
            "error"
        );

        return;
    }


    const registrations =
        getRegistrations();


    const emailExists =
        registrations.some(function (user) {

            return (
                user.email &&
                user.email.toLowerCase() ===
                    email.toLowerCase()
            );

        });


    if (emailExists) {

        showNotification(
            "This email is already registered.",
            "error"
        );

        return;
    }


    /* STUDENT */

    if (role === "student") {

        const educationLevel =
            document
                .getElementById("educationLevel")
                .value;


        const studentClass =
            document
                .getElementById("studentClass")
                .value;


        const guardianName =
            document
                .getElementById("guardianName")
                .value
                .trim();

        const schoolName =
            document
                .getElementById("schoolName")
                .value
                .trim();


        if (
            !educationLevel ||
            !studentClass ||
            !guardianName ||
            !schoolName
        ) {

            showNotification(
                "Please complete the student information.",
                "error"
            );

            return;
        }


        const studentNumber =
            generateStudentNumber();


        const student = {

            id: Date.now(),

            role: "student",

            fullName: fullName,

            email: email,

            phone: phone,

            password: password,

            educationLevel: educationLevel,

            classLevel: studentClass,

            guardianName: guardianName,

            schoolName: schoolName,

            studentNumber: studentNumber,

            status: "pending",

            createdAt:
                new Date().toISOString()

        };


        registrations.push(student);


        saveRegistrations(registrations);


        showNotification(
            "Registration successful! Your student number is " +
            studentNumber,
            "success"
        );


        setTimeout(function () {

            closeModal("registerModal");

        }, 2500);


        return;
    }


    /* TEACHER */

    if (role === "teacher") {

        const subject =
            document
                .getElementById("teachingSubject")
                .value;


        const level =
            document
                .getElementById("teachingLevel")
                .value;


        const qualification =
            document
                .getElementById("qualification")
                .value
                .trim();


        if (
            !subject ||
            !level ||
            !qualification
        ) {

            showNotification(
                "Please complete the teacher information.",
                "error"
            );

            return;
        }


        const applicationNumber =
            "CIS-TAPP-" +
            Math.floor(
                10000 +
                Math.random() * 90000
            );


        const teacher = {

            id: Date.now(),

            role: "teacher",

            fullName: fullName,

            email: email,

            phone: phone,

            password: password,

            teachingSubject: subject,

            teachingLevel: level,

            qualification: qualification,

            applicationNumber:
                applicationNumber,

            teacherCode: null,

            status: "pending",

            createdAt:
                new Date().toISOString()

        };


        registrations.push(teacher);


        saveRegistrations(registrations);


        showNotification(
            "Teacher application submitted. Application number: " +
            applicationNumber,
            "success"
        );


        setTimeout(function () {

            closeModal("registerModal");

        }, 2500);

    }

}


/* =========================
   STUDENT NUMBER
========================= */

function generateStudentNumber() {

    const year =
        new Date().getFullYear();


    const number =
        Math.floor(
            10000 +
            Math.random() * 90000
        );


    return (
        "CIS-STU-" +
        year +
        "-" +
        number
    );

}


/* =========================
   STORAGE
========================= */

function getRegistrations() {

    try {

        const saved =
            localStorage.getItem(
                "cis_registrations"
            );


        if (!saved) {
            return [];
        }


        const data =
            JSON.parse(saved);


        return Array.isArray(data)
            ? data
            : [];

    }

    catch (error) {

        console.error(error);

        return [];

    }

}


function saveRegistrations(data) {

    localStorage.setItem(
        "cis_registrations",
        JSON.stringify(data)
    );

}


/* =========================
   EDUCATION LEVEL
========================= */

function setupEducationLevels() {

    const education =
        document.getElementById(
            "educationLevel"
        );


    const classSelect =
        document.getElementById(
            "studentClass"
        );


    if (!education || !classSelect) {
        return;
    }


    education.addEventListener(
        "change",
        function () {

            classSelect.innerHTML =
                '<option value="">Select Class</option>';


            if (
                education.value === "Primary"
            ) {

                for (
                    let i = 1;
                    i <= 7;
                    i++
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        "Primary " + i;

                    option.textContent =
                        "Primary " + i;

                    classSelect.appendChild(
                        option
                    );

                }

            }


            if (
                education.value === "Secondary"
            ) {

                for (
                    let i = 1;
                    i <= 6;
                    i++
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        "Senior " + i;

                    option.textContent =
                        "Senior " + i;

                    classSelect.appendChild(
                        option
                    );

                }

            }

        }
    );

}


/* =========================
   SUBJECT MESSAGE
========================= */

function showSubjectMessage(subject) {

    showNotification(
        subject +
        " will be available from your student dashboard after login.",
        "info"
    );

}


/* =========================
   FORGOT PASSWORD
========================= */

function showForgotPassword(event) {

    if (event) {
        event.preventDefault();
    }

    const modal =
        document.getElementById("loginModal");

    const currentRole =
        modal ? (modal.dataset.role || "student") : "student";

    if (currentRole !== "student") {
        showNotification(
            "Password recovery is available for student accounts only.",
            "info"
        );

        return;
    }

    const guardianName =
        window.prompt(
            "Enter the guardian name used during registration:"
        );

    if (guardianName === null) {
        return;
    }

    const trimmedGuardianName =
        guardianName.trim();

    if (!trimmedGuardianName) {
        showNotification(
            "Guardian name is required to recover your password.",
            "error"
        );

        return;
    }

    const schoolName =
        window.prompt(
            "Enter the name of your school:"
        );

    if (schoolName === null) {
        return;
    }

    const trimmedSchoolName =
        schoolName.trim();

    if (!trimmedSchoolName) {
        showNotification(
            "School name is required to recover your password.",
            "error"
        );

        return;
    }

    const registrations =
        getRegistrations();

    const student =
        registrations.find(function (user) {
            return (
                user.role === "student" &&
                user.guardianName &&
                user.schoolName &&
                user.guardianName.trim().toLowerCase() ===
                    trimmedGuardianName.toLowerCase() &&
                user.schoolName.trim().toLowerCase() ===
                    trimmedSchoolName.toLowerCase()
            );
        });

    if (!student) {
        showNotification(
            "No student record matches that guardian name and school name.",
            "error"
        );

        return;
    }

    alert(
        "Password match found for " +
        student.fullName +
        ". Your password is: " +
        student.password +
        ". Please keep it secure."
    );

    showNotification(
        "Password recovery completed successfully.",
        "success"
    );

}


/* =========================
   MODALS
========================= */

function closeModal(id) {

    const modal =
        document.getElementById(id);


    if (modal) {
        modal.classList.remove("active");
    }

}


function setupModalClosing() {

    document.addEventListener(
        "click",
        function (event) {

            if (
                event.target.classList.contains(
                    "modal"
                )
            ) {

                event.target.classList.remove(
                    "active"
                );

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                document
                    .querySelectorAll(
                        ".modal.active"
                    )
                    .forEach(function (modal) {

                        modal.classList.remove(
                            "active"
                        );

                    });

            }

        }
    );

}


/* =========================
   NOTIFICATION
========================= */

function showNotification(
    message,
    type
) {

    const notification =
        document.getElementById(
            "notification"
        );


    if (!notification) {

        alert(message);

        return;
    }


    notification.textContent =
        message;


    notification.className =
        "notification show " +
        (type || "info");


    setTimeout(function () {

        notification.classList.remove(
            "show"
        );

    }, 5000);

}