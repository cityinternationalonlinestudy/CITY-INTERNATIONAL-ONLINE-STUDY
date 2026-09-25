/* =========================================
   CITY INTERNATIONAL ONLINE SCHOOL
   LIVE CLASS JAVASCRIPT
========================================= */

let localStream = null;

let microphoneEnabled = true;
let cameraEnabled = true;

let classSeconds = 0;
let timerInterval = null;


/* =========================================
   PAGE START
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    startClass();

    loadNotes();

    setupChat();

});


/* =========================================
   START CLASS
========================================= */

async function startClass() {

    setConnectionStatus("Connecting...", false);

    try {

        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        const studentVideo =
            document.getElementById("studentVideo");

        studentVideo.srcObject = localStream;

        studentVideo.style.display = "block";

        document.getElementById(
            "studentPlaceholder"
        ).style.display = "none";

        document.getElementById(
            "studentStatus"
        ).textContent = "Camera On";

        setConnectionStatus("Connected", true);

        startClassTimer();

        showNotification(
            "You joined the live class."
        );

    } catch (error) {

        console.error(
            "Camera or microphone error:",
            error
        );

        setConnectionStatus("Camera unavailable", false);

        document.getElementById(
            "studentVideo"
        ).style.display = "none";

        document.getElementById(
            "studentPlaceholder"
        ).style.display = "flex";

        document.getElementById(
            "studentStatus"
        ).textContent = "Camera Off";

        showNotification(
            "Camera or microphone permission was not granted."
        );

    }

}


/* =========================================
   CONNECTION STATUS
========================================= */

function setConnectionStatus(message, connected) {

    const status =
        document.getElementById("connectionStatus");

    status.textContent =
        "● " + message;

    if (connected) {

        status.classList.remove("offline");

        status.classList.add("online");

    } else {

        status.classList.remove("online");

        status.classList.add("offline");

    }

}


/* =========================================
   MICROPHONE
========================================= */

function toggleMicrophone() {

    if (!localStream) {

        showNotification(
            "Microphone is not available."
        );

        return;
    }

    const audioTracks =
        localStream.getAudioTracks();

    if (audioTracks.length === 0) {

        showNotification(
            "No microphone was found."
        );

        return;
    }

    microphoneEnabled = !microphoneEnabled;

    audioTracks.forEach(function (track) {

        track.enabled = microphoneEnabled;

    });

    const button =
        document.getElementById("micButton");

    if (microphoneEnabled) {

        button.innerHTML = "🎤<span>Mute</span>";

        showNotification(
            "Microphone turned on."
        );

    } else {

        button.innerHTML = "🔇<span>Unmute</span>";

        showNotification(
            "Microphone muted."
        );

    }

}


/* =========================================
   CAMERA
========================================= */

function toggleCamera() {

    if (!localStream) {

        showNotification(
            "Camera is not available."
        );

        return;
    }

    const videoTracks =
        localStream.getVideoTracks();

    if (videoTracks.length === 0) {

        showNotification(
            "No camera was found."
        );

        return;
    }

    cameraEnabled = !cameraEnabled;

    videoTracks.forEach(function (track) {

        track.enabled = cameraEnabled;

    });

    const studentVideo =
        document.getElementById("studentVideo");

    const placeholder =
        document.getElementById("studentPlaceholder");

    const status =
        document.getElementById("studentStatus");

    const button =
        document.getElementById("cameraButton");


    if (cameraEnabled) {

        studentVideo.style.display = "block";

        placeholder.style.display = "none";

        status.textContent = "Camera On";

        button.innerHTML =
            "📹<span>Camera</span>";

        showNotification(
            "Camera turned on."
        );

    } else {

        studentVideo.style.display = "none";

        placeholder.style.display = "flex";

        status.textContent = "Camera Off";

        button.innerHTML =
            "📷<span>Camera</span>";

        showNotification(
            "Camera turned off."
        );

    }

}


/* =========================================
   FULLSCREEN
========================================= */

function toggleFullscreen() {

    const videoSection =
        document.querySelector(".video-section");

    if (!document.fullscreenElement) {

        videoSection.requestFullscreen()
            .catch(function (error) {

                console.error(
                    "Fullscreen error:",
                    error
                );

            });

    } else {

        document.exitFullscreen();

    }

}


/* =========================================
   CLASS TIMER
========================================= */

function startClassTimer() {

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    classSeconds = 0;

    timerInterval = setInterval(function () {

        classSeconds++;

        const hours =
            Math.floor(classSeconds / 3600);

        const minutes =
            Math.floor(
                (classSeconds % 3600) / 60
            );

        const seconds =
            classSeconds % 60;

        const timeString =
            String(hours).padStart(2, "0") +
            ":" +
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

        document.getElementById(
            "classTimer"
        ).textContent = timeString;

    }, 1000);

}


/* =========================================
   CHAT
========================================= */

function setupChat() {

    const input =
        document.getElementById("chatInput");

    if (!input) {
        return;
    }

    input.addEventListener(
        "keydown",
        handleChatKey
    );

}


function handleChatKey(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }

}


function sendMessage() {

    const input =
        document.getElementById("chatInput");

    const message =
        input.value.trim();

    if (message === "") {
        return;
    }

    const messages =
        document.getElementById("chatMessages");

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "chat-message";

    const name =
        document.createElement("strong");

    name.textContent = "You";

    const text =
        document.createElement("p");

    text.textContent = message;

    messageElement.appendChild(name);

    messageElement.appendChild(text);

    messages.appendChild(messageElement);

    input.value = "";

    messages.scrollTop =
        messages.scrollHeight;

}


/* =========================================
   CHAT PANEL
========================================= */

function toggleChat() {

    const chatPanel =
        document.getElementById("chatPanel");

    chatPanel.classList.toggle("show");

}


/* =========================================
   PARTICIPANTS
========================================= */

function openParticipants() {

    const modal =
        document.getElementById(
            "participantsModal"
        );

    modal.classList.add("show");

}


function closeParticipants() {

    const modal =
        document.getElementById(
            "participantsModal"
        );

    modal.classList.remove("show");

}


/* =========================================
   NOTES
========================================= */

function saveNotes() {

    const notes =
        document.getElementById("notes").value;

    localStorage.setItem(
        "citySchoolLiveClassNotes",
        notes
    );

    const message =
        document.getElementById("notesMessage");

    message.textContent =
        "Notes saved successfully.";

    setTimeout(function () {

        message.textContent = "";

    }, 2500);

}


function loadNotes() {

    const savedNotes =
        localStorage.getItem(
            "citySchoolLiveClassNotes"
        );

    if (savedNotes !== null) {

        document.getElementById(
            "notes"
        ).value = savedNotes;

    }

}


/* =========================================
   LEAVE CLASS
========================================= */

function leaveClass() {

    const modal =
        document.getElementById("leaveModal");

    modal.classList.add("show");

}


function closeLeaveModal() {

    const modal =
        document.getElementById("leaveModal");

    modal.classList.remove("show");

}


function confirmLeave() {

    stopLocalMedia();

    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;

    }

    window.location.href =
        "../index.html";

}


/* =========================================
   STOP CAMERA AND MICROPHONE
========================================= */

function stopLocalMedia() {

    if (!localStream) {
        return;
    }

    localStream.getTracks().forEach(
        function (track) {

            track.stop();

        }
    );

    localStream = null;

}


/* =========================================
   BACK BUTTON
========================================= */

function goBack() {

    stopLocalMedia();

    if (timerInterval) {

        clearInterval(timerInterval);

        timerInterval = null;

    }

    window.history.back();

}


/* =========================================
   NOTIFICATIONS
========================================= */

function showNotification(message) {

    const notification =
        document.getElementById(
            "notification"
        );

    notification.textContent = message;

    notification.classList.add("show");

    setTimeout(function () {

        notification.classList.remove(
            "show"
        );

    }, 3000);

}


/* =========================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================= */

window.addEventListener(
    "click",
    function (event) {

        const participantsModal =
            document.getElementById(
                "participantsModal"
            );

        const leaveModal =
            document.getElementById(
                "leaveModal"
            );

        if (event.target === participantsModal) {

            closeParticipants();

        }

        if (event.target === leaveModal) {

            closeLeaveModal();

        }

    }
);