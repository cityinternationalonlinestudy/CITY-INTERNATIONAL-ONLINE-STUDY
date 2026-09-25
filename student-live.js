/* =========================================
   CITY INTERNATIONAL ONLINE SCHOOL
   STUDENT LIVE CLASS JAVASCRIPT
========================================= */

let localStream = null;
let microphoneEnabled = true;
let cameraEnabled = true;
let classSeconds = 0;
let timerInterval = null;
let notificationTimer = null;
let liveSocket = null;


/* =========================================
   PAGE START
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    updateLiveSubject();
    loadNotes();
    setupChat();
    updateControls();

});


/* =========================================
   INITIALIZE CAMERA AFTER JOIN
========================================= */

async function startCamera() {

    const studentVideo =
        document.getElementById("studentVideo");

    const placeholder =
        document.getElementById("studentPlaceholder") ||
        document.getElementById("studentCameraOff");

    const status =
        document.getElementById("studentStatus");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        setConnectionStatus("Media unavailable", false);
        showNotification(
            window.isSecureContext
                ? "This browser does not support camera and microphone access."
                : "Camera and microphone require HTTPS or localhost. Open this page from a local web server."
        );

        return;
    }

    try {

        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
        } catch (combinedError) {
            if (["SecurityError", "InvalidStateError"].includes(combinedError.name)) {
                throw combinedError;
            }

            const results = await Promise.allSettled([
                navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
                navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            ]);
            const tracks = results
                .filter(function (result) {
                    return result.status === "fulfilled";
                })
                .flatMap(function (result) {
                    return result.value.getTracks();
                });

            if (tracks.length === 0) {
                throw results.find(function (result) {
                    return result.status === "rejected";
                })?.reason || combinedError;
            }

            localStream = new MediaStream(tracks);
        }

        const hasVideo = localStream.getVideoTracks().length > 0;
        const hasAudio = localStream.getAudioTracks().length > 0;

        if (studentVideo) {

            studentVideo.srcObject = localStream;
            studentVideo.style.display = hasVideo ? "block" : "none";

        }

        if (placeholder) {

            placeholder.style.display = hasVideo ? "none" : "flex";

        }

        if (status) {

            status.textContent = hasVideo ? "Camera On" : "Camera Off";

        }

        setConnectionStatus(
            hasVideo || hasAudio ? "Media ready" : "Media unavailable",
            hasVideo || hasAudio
        );

        if (hasVideo && hasAudio) {
            showNotification("Camera and microphone are ready.");
        } else if (hasVideo) {
            showNotification("Camera is ready, but microphone access is unavailable.");
        } else {
            showNotification("Microphone is ready, but camera access is unavailable.");
        }

    } catch (error) {

        console.error(
            "Camera or microphone error:",
            error
        );

        if (studentVideo) {

            studentVideo.style.display =
                "none";

        }

        if (placeholder) {

            placeholder.style.display =
                "flex";

        }

        if (status) {

            status.textContent =
                "Camera Off";

        }

        setConnectionStatus(
            "Camera unavailable",
            false
        );

        const message = !window.isSecureContext
            ? "Camera and microphone require HTTPS or localhost. Open this page from a local web server."
            : error.name === "NotAllowedError" || error.name === "SecurityError"
                ? "Allow camera and microphone access in your browser settings, then rejoin the class."
                : error.name === "NotFoundError"
                    ? "No camera or microphone was found. Check that a device is connected."
                    : error.name === "NotReadableError"
                        ? "The camera or microphone is busy in another app. Close it and rejoin."
                        : "Unable to access the camera or microphone. Check browser permissions and device settings.";

        showNotification(message);

    }

}


/* =========================================
   CONNECTION STATUS
========================================= */

function setConnectionStatus(message, connected) {

    const status =
        document.getElementById("connectionStatus");

    if (!status) {
        return;
    }

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
   JOIN CLASS
========================================= */

async function joinClass() {

    const nameInput =
        document.getElementById("studentName");

    const name =
        nameInput ? nameInput.value.trim() : "";

    if (!name) {

        showNotification(
            "Please enter your name."
        );

        if (nameInput) {
            nameInput.focus();
        }

        return;
    }

    const joinScreen =
        document.getElementById("joinScreen");

    const classArea =
        document.getElementById("classArea");

    if (joinScreen) {
        joinScreen.classList.add("hidden");
    }

    if (classArea) {
        classArea.classList.remove("hidden");
    }

    const participantName =
        document.getElementById("participantStudentName");

    if (participantName) {
        participantName.textContent = name;
    }

    startClassTimer();
    updateControls();

    await startCamera();
    connectLiveRoom(name);

    showNotification(
        "You joined the live class."
    );

    addSystemMessage(
        name + " joined the class."
    );

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

    const tracks =
        localStream.getAudioTracks();

    if (tracks.length === 0) {

        showNotification(
            "No microphone was found."
        );

        return;
    }

    microphoneEnabled =
        !microphoneEnabled;

    tracks.forEach(function (track) {
        track.enabled = microphoneEnabled;
    });

    updateControls();

    if (microphoneEnabled) {

        showNotification(
            "Microphone turned on."
        );

    } else {

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

    const tracks =
        localStream.getVideoTracks();

    if (tracks.length === 0) {

        showNotification(
            "No camera was found."
        );

        return;
    }

    cameraEnabled =
        !cameraEnabled;

    tracks.forEach(function (track) {
        track.enabled = cameraEnabled;
    });

    const video =
        document.getElementById("studentVideo");

    const placeholder =
        document.getElementById("studentPlaceholder") ||
        document.getElementById("studentCameraOff");

    const status =
        document.getElementById("studentStatus");

    const button =
        document.getElementById("cameraButton");

    if (cameraEnabled) {

        if (video) {
            video.style.display = "block";
        }

        if (placeholder) {
            placeholder.style.display = "none";
        }

        if (status) {
            status.textContent = "Camera On";
        }

        if (button) {
            button.innerHTML = "📹<span>Camera</span>";
        }

        showNotification(
            "Camera turned on."
        );

    } else {

        if (video) {
            video.style.display = "none";
        }

        if (placeholder) {
            placeholder.style.display = "flex";
        }

        if (status) {
            status.textContent = "Camera Off";
        }

        if (button) {
            button.innerHTML = "📷<span>Camera</span>";
        }

        showNotification(
            "Camera turned off."
        );

    }

    updateControls();

}


/* =========================================
   CONTROLS
========================================= */

function updateControls() {

    const micButton =
        document.getElementById("micButton");

    const cameraButton =
        document.getElementById("cameraButton");

    if (micButton) {

        if (microphoneEnabled) {
            micButton.innerHTML = "🎤<span>Mute</span>";
            micButton.classList.remove("active");
        } else {
            micButton.innerHTML = "🔇<span>Unmute</span>";
            micButton.classList.add("active");
        }

    }

    if (cameraButton) {

        if (cameraEnabled) {
            cameraButton.innerHTML = "📹<span>Camera</span>";
            cameraButton.classList.remove("active");
        } else {
            cameraButton.innerHTML = "📷<span>Camera</span>";
            cameraButton.classList.add("active");
        }

    }

}


/* =========================================
   FULLSCREEN
========================================= */

function toggleFullscreen() {

    const videoSection =
        document.querySelector(".video-section") ||
        document.querySelector(".student-preview");

    if (!videoSection) {
        return;
    }

    if (!document.fullscreenElement) {

        videoSection.requestFullscreen().catch(function (error) {
            console.error("Fullscreen error:", error);
        });

    } else {

        document.exitFullscreen();

    }

}


/* =========================================
   TIMER
========================================= */

function startClassTimer() {

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    classSeconds = 0;

    timerInterval =
        setInterval(function () {

            classSeconds++;

            const hours =
                Math.floor(classSeconds / 3600);

            const minutes =
                Math.floor((classSeconds % 3600) / 60);

            const seconds =
                classSeconds % 60;

            const time =
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0") +
                ":" +
                String(seconds).padStart(2, "0");

            const timer =
                document.getElementById("classTimer");

            if (timer) {
                timer.textContent = time;
            }

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

    input.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();
            sendMessage();

        }

    });

}

function connectLiveRoom(displayName) {

    if (liveSocket || !window.WebSocket) {
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const roomId =
        params.get("room") || "math-primary-6";

    liveSocket = new WebSocket("ws://localhost:8080");

    liveSocket.addEventListener("open", function () {

        liveSocket.send(JSON.stringify({
            type: "join-room",
            roomId: roomId,
            role: "student",
            studentName: displayName
        }));

    });

    liveSocket.addEventListener("message", function (event) {

        let message;

        try {
            message = JSON.parse(event.data);
        } catch (error) {
            return;
        }

        if (message.type === "chat") {
            addChatMessage(message.senderName, message.message);
        }

        if (message.type === "reaction") {
            addSystemMessage(
                message.senderName + " reacted " + message.reaction
            );
        }

    });

    liveSocket.addEventListener("error", function () {
        showNotification("Classroom server is unavailable. Open this page through a local web server such as http://localhost:5500.");
    });

}

function chatKey(event) {

    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }

}

function addSystemMessage(message) {

    const messages =
        document.getElementById("chatMessages");

    if (!messages) {
        return;
    }

    const systemMessage =
        document.createElement("div");

    systemMessage.className = "system-message";

    const icon =
        document.createElement("span");

    icon.textContent = "🔔";

    const text =
        document.createElement("span");

    text.textContent = message;
    systemMessage.appendChild(icon);
    systemMessage.appendChild(text);

    messages.appendChild(systemMessage);
    messages.scrollTop = messages.scrollHeight;

}

function addChatMessage(senderName, message) {

    const messages =
        document.getElementById("chatMessages");

    if (!messages) {
        return;
    }

    const messageBox =
        document.createElement("div");

    messageBox.className = "teacher-message";

    const avatar =
        document.createElement("div");

    avatar.className = "message-avatar";
    avatar.textContent = senderName === "Teacher" ? "👨‍🏫" : "👨‍🎓";

    const body =
        document.createElement("div");

    body.className = "message-body";

    const name =
        document.createElement("strong");

    name.textContent = senderName || "Participant";

    const text =
        document.createElement("p");

    text.textContent = message;

    body.appendChild(name);
    body.appendChild(text);
    messageBox.appendChild(avatar);
    messageBox.appendChild(body);
    messages.appendChild(messageBox);
    messages.scrollTop = messages.scrollHeight;

}

function sendMessage() {

    const input =
        document.getElementById("chatInput");

    const messages =
        document.getElementById("chatMessages");

    if (!input || !messages) {
        return;
    }

    const message =
        input.value.trim();

    if (message === "") {
        return;
    }

    if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {

        liveSocket.send(JSON.stringify({
            type: "chat",
            message: message
        }));

        input.value = "";
        return;
    }

    const messageBox =
        document.createElement("div");

    messageBox.className = "teacher-message";

    const avatar =
        document.createElement("div");

    avatar.className = "message-avatar";
    avatar.textContent = "👨‍🎓";

    const body =
        document.createElement("div");

    body.className = "message-body";

    const name =
        document.createElement("strong");

    name.textContent = "You";

    const text =
        document.createElement("p");

    text.textContent = message;

    const time =
        document.createElement("small");

    time.textContent = "Now";

    body.appendChild(name);
    body.appendChild(text);
    body.appendChild(time);

    messageBox.appendChild(avatar);
    messageBox.appendChild(body);

    messages.appendChild(messageBox);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

}

function sendReaction(reaction) {

    if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {

        liveSocket.send(JSON.stringify({
            type: "reaction",
            reaction: reaction
        }));

        return;
    }

    addSystemMessage("You reacted " + reaction);

}

function clearChat() {

    const messages =
        document.getElementById("chatMessages");

    if (!messages) {
        return;
    }

    messages.innerHTML = "";
    addSystemMessage("Welcome to the live class!");

}

function toggleChat() {

    const panel =
        document.getElementById("chatPanel");

    if (!panel) {
        return;
    }

    panel.classList.toggle("show");

}


/* =========================================
   PARTICIPANTS
========================================= */

function openParticipants() {

    const modal =
        document.getElementById("participantsModal");

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("show");
    }

}

function closeParticipants() {

    const modal =
        document.getElementById("participantsModal");

    if (modal) {
        modal.classList.remove("show");
        modal.classList.add("hidden");
    }

}


/* =========================================
   NOTES
========================================= */

function saveNotes() {

    const notes =
        document.getElementById("classNotes");

    if (!notes) {
        return;
    }

    localStorage.setItem(
        "citySchoolStudentNotes",
        notes.value
    );

    const message =
        document.getElementById("notesMessage");

    if (message) {

        message.textContent =
            "Notes saved successfully.";

        clearTimeout(notificationTimer);
        notificationTimer = setTimeout(function () {
            message.textContent = "";
        }, 2500);

    }

}

function loadNotes() {

    const notes =
        document.getElementById("classNotes");

    if (!notes) {
        return;
    }

    const saved =
        localStorage.getItem("citySchoolStudentNotes");

    if (saved !== null) {
        notes.value = saved;
    }

}


/* =========================================
   LEAVE CLASS
========================================= */

function leaveClass() {

    const modal =
        document.getElementById("leaveModal");

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("show");
    }

}

function closeLeaveModal() {

    const modal =
        document.getElementById("leaveModal");

    if (modal) {
        modal.classList.remove("show");
        modal.classList.add("hidden");
    }

}

function confirmLeave() {

    stopMedia();

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    window.location.href = "student-dashboard.html";

}


/* =========================================
   STOP MEDIA
========================================= */

function stopMedia() {

    if (!localStream) {
        return;
    }

    localStream.getTracks().forEach(function (track) {
        track.stop();
    });

    localStream = null;

}


/* =========================================
   BACK AND DASHBOARD BUTTONS
========================================= */

function goBack() {

    stopMedia();

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    window.history.back();

}

function goDashboard() {

    stopMedia();
    window.location.href = "student-dashboard.html";

}


/* =========================================
   NOTIFICATION
========================================= */

function showNotification(message) {

    const notification =
        document.getElementById("notification");

    if (!notification) {
        return;
    }

    const textNode =
        document.getElementById("notificationText");

    if (textNode) {
        textNode.textContent = message;
    }

    const iconNode =
        document.getElementById("notificationIcon");

    if (iconNode) {
        iconNode.textContent = "✓";
    }

    notification.classList.add("show");

    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(function () {
        notification.classList.remove("show");
    }, 3000);

}


/* =========================================
   CLOSE MODALS
========================================= */

window.addEventListener("click", function (event) {

    const participantsModal =
        document.getElementById("participantsModal");

    const leaveModal =
        document.getElementById("leaveModal");

    if (participantsModal && event.target === participantsModal) {
        closeParticipants();
    }

    if (leaveModal && event.target === leaveModal) {
        closeLeaveModal();
    }

});


/* =========================================
   CLEAN UP
========================================= */

window.addEventListener("beforeunload", function () {

    stopMedia();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

});


function updateLiveSubject() {

    const params =
        new URLSearchParams(window.location.search);

    const subject =
        params.get("subject");

    if (!subject) {
        return;
    }

    const title =
        document.getElementById("classTitle");

    const subjectText =
        document.getElementById("subjectText");

    if (title) {
        title.textContent = subject + " Live Class";
    }

    if (subjectText) {
        subjectText.textContent = subject;
    }

}