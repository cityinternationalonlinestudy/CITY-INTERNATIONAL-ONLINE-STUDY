/* =========================================================
   CITY INTERNATIONAL ONLINE SCHOOL
   TEACHER LIVE CLASSROOM
   CAMERA + MICROPHONE + SCREEN SHARING
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const teacherVideo =
        document.getElementById("teacherVideo");

    const teacherPlaceholder =
        document.getElementById("teacherPlaceholder");

    const screenVideo =
        document.getElementById("screenVideo");

    const screenPlaceholder =
        document.getElementById("screenPlaceholder");

    const screenBadge =
        document.getElementById("screenBadge");

    const connectionStatus =
        document.getElementById("connectionStatus");

    const teacherStatus =
        document.getElementById("teacherStatus");

    const screenStatus =
        document.getElementById("screenStatus");

    const classStatus =
        document.getElementById("classStatus");

    const startButton =
        document.getElementById("startButton");

    const endButton =
        document.getElementById("endButton");

    const micButton =
        document.getElementById("micButton");

    const cameraButton =
        document.getElementById("cameraButton");

    const shareScreenButton =
        document.getElementById("shareScreenButton");

    const fullscreenButton =
        document.getElementById("fullscreenButton");

    const studentsButton =
        document.getElementById("studentsButton");

    const chatButton =
        document.getElementById("chatButton");

    const notesButton =
        document.getElementById("notesButton");

    const leaveButton =
        document.getElementById("leaveButton");

    const classTimer =
        document.getElementById("classTimer");

    const chatPanel =
        document.getElementById("chatPanel");

    const chatInput =
        document.getElementById("chatInput");

    const chatMessages =
        document.getElementById("chatMessages");

    const sendChatButton =
        document.getElementById("sendChatButton");

    const notes =
        document.getElementById("notes");

    const notesMessage =
        document.getElementById("notesMessage");

    const studentsModal =
        document.getElementById("studentsModal");

    const endClassModal =
        document.getElementById("endClassModal");

    const notification =
        document.getElementById("notification");


    /* =====================================================
       VARIABLES
       ===================================================== */

    let teacherStream = null;

    let screenStream = null;

    let microphoneOn = true;

    let cameraOn = true;

    let classStarted = false;

    let classTime = 0;

    let timer = null;

    let notificationTimer = null;

    let liveSocket = null;


    /* =====================================================
       CAMERA
       ===================================================== */

    async function openTeacherCamera() {

        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                showNotification(
                    "Camera access is not supported by this browser."
                );

                return;
            }


            teacherStream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });


            teacherVideo.srcObject =
                teacherStream;

            teacherVideo.muted =
                true;

            teacherVideo.autoplay =
                true;

            teacherVideo.playsInline =
                true;


            teacherVideo.style.display =
                "block";


            teacherPlaceholder.style.display =
                "none";


            microphoneOn = true;

            cameraOn = true;


            updateMicrophoneButton();

            updateCameraButton();


            setTeacherStatus(
                "Camera and microphone ready"
            );


            setConnectionStatus(
                "Camera Ready",
                true
            );


            showNotification(
                "Camera and microphone are ready."
            );


        } catch (error) {

            console.error(
                "Camera error:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                showNotification(
                    "Please allow camera and microphone permission."
                );

            } else if (
                error.name ===
                "NotFoundError"
            ) {

                showNotification(
                    "No camera or microphone was found."
                );

            } else {

                showNotification(
                    "Could not open the camera."
                );

            }


            teacherPlaceholder.style.display =
                "flex";


            setTeacherStatus(
                "Camera unavailable"
            );


            setConnectionStatus(
                "Camera Unavailable",
                false
            );

        }

    }


    /* =====================================================
       START CLASS
       ===================================================== */

    function startClass() {

        if (classStarted) {
            return;
        }


        if (!teacherStream) {

            showNotification(
                "Please turn on your camera first."
            );

            openTeacherCamera();

            return;
        }


        classStarted = true;

        classTime = 0;


        startTimer();


        setClassStatus(
            "🔴 LIVE • Class in progress"
        );


        setConnectionStatus(
            "🟢 Live",
            true
        );


        setTeacherStatus(
            "You are live with your students"
        );


        startButton.disabled =
            true;


        endButton.disabled =
            false;


        showNotification(
            "Your live class has started!"
        );


        addChatMessage(
            "System",
            "The teacher has started the live class."
        );

    }


    /* =====================================================
       END CLASS
       ===================================================== */

    function askEndClass() {

        if (!classStarted) {

            showNotification(
                "The class has not started."
            );

            return;
        }


        endClassModal.style.display =
            "flex";

        endClassModal.classList.add(
            "show"
        );

    }


    function finishClass() {

        classStarted = false;


        stopTimer();


        stopScreenShare();


        setClassStatus(
            "Class ended"
        );


        setConnectionStatus(
            "Class Ended",
            false
        );


        setTeacherStatus(
            "The live class has ended"
        );


        startButton.disabled =
            false;


        endButton.disabled =
            true;


        closeEndClassModal();


        addChatMessage(
            "System",
            "The teacher has ended the live class."
        );


        showNotification(
            "The live class has ended."
        );

    }


    function closeEndClassModal() {

        endClassModal.style.display =
            "none";

        endClassModal.classList.remove(
            "show"
        );

    }


    /* =====================================================
       TIMER
       ===================================================== */

    function startTimer() {

        stopTimer();


        updateTimer();


        timer =
            setInterval(function () {

                if (!classStarted) {
                    return;
                }


                classTime++;


                updateTimer();

            }, 1000);

    }


    function stopTimer() {

        if (timer !== null) {

            clearInterval(timer);

            timer = null;
        }

    }


    function updateTimer() {

        const hours =
            Math.floor(
                classTime / 3600
            );


        const minutes =
            Math.floor(
                (classTime % 3600) / 60
            );


        const seconds =
            classTime % 60;


        classTimer.textContent =
            formatTime(hours) +
            ":" +
            formatTime(minutes) +
            ":" +
            formatTime(seconds);

    }


    function formatTime(number) {

        return String(number)
            .padStart(2, "0");

    }


    /* =====================================================
       MICROPHONE
       ===================================================== */

    function toggleMicrophone() {

        if (!teacherStream) {

            showNotification(
                "Camera is not active."
            );

            return;
        }


        const audioTracks =
            teacherStream.getAudioTracks();


        if (audioTracks.length === 0) {

            showNotification(
                "No microphone was found."
            );

            return;
        }


        microphoneOn =
            !microphoneOn;


        audioTracks.forEach(
            function (track) {

                track.enabled =
                    microphoneOn;

            }
        );


        updateMicrophoneButton();


        if (microphoneOn) {

            setTeacherStatus(
                "Microphone is on"
            );

        } else {

            setTeacherStatus(
                "Microphone is muted"
            );

        }

    }


    function updateMicrophoneButton() {

        if (microphoneOn) {

            micButton.innerHTML =
                "🎤 Mute";

            micButton.classList.remove(
                "muted"
            );

        } else {

            micButton.innerHTML =
                "🔇 Unmute";

            micButton.classList.add(
                "muted"
            );

        }

    }


    /* =====================================================
       CAMERA ON / OFF
       ===================================================== */

    function toggleCamera() {

        if (!teacherStream) {

            showNotification(
                "Camera is not active."
            );

            return;
        }


        const videoTracks =
            teacherStream.getVideoTracks();


        if (videoTracks.length === 0) {

            showNotification(
                "No camera was found."
            );

            return;
        }


        cameraOn =
            !cameraOn;


        videoTracks.forEach(
            function (track) {

                track.enabled =
                    cameraOn;

            }
        );


        updateCameraButton();


        if (cameraOn) {

            teacherPlaceholder.style.display =
                "none";

            setTeacherStatus(
                "Camera is on"
            );

        } else {

            teacherPlaceholder.style.display =
                "flex";

            setTeacherStatus(
                "Camera is off"
            );

        }

    }


    function updateCameraButton() {

        if (cameraOn) {

            cameraButton.innerHTML =
                "📹 Camera";

            cameraButton.classList.remove(
                "camera-off"
            );

        } else {

            cameraButton.innerHTML =
                "📷 Camera Off";

            cameraButton.classList.add(
                "camera-off"
            );

        }

    }


    /* =====================================================
       SCREEN SHARING
       ===================================================== */

    async function toggleScreenShare() {

        if (screenStream) {

            stopScreenShare();

            return;
        }


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getDisplayMedia
        ) {

            showNotification(
                "Screen sharing is not supported by this browser."
            );

            return;
        }


        try {

            screenStream =
                await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always"
                    },
                    audio: false
                });


            screenVideo.srcObject =
                screenStream;


            screenVideo.style.display =
                "block";


            screenPlaceholder.style.display =
                "none";


            screenBadge.classList.add(
                "active"
            );


            shareScreenButton.classList.add(
                "sharing"
            );


            shareScreenButton.innerHTML =
                "⏹ Stop Sharing";


            screenStatus.textContent =
                "🟢 Screen is being shared";


            screenStatus.style.background =
                "#ecfdf3";

            screenStatus.style.color =
                "#15803d";


            showNotification(
                "Your screen is now being shared."
            );


            setTeacherStatus(
                "Teaching screen is being shared"
            );


            const videoTrack =
                screenStream.getVideoTracks()[0];


            if (videoTrack) {

                videoTrack.addEventListener(
                    "ended",
                    function () {

                        stopScreenShare();

                    }
                );

            }


        } catch (error) {

            console.error(
                "Screen sharing error:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                showNotification(
                    "Screen sharing was cancelled."
                );

            } else {

                showNotification(
                    "Could not start screen sharing."
                );

            }

        }

    }


    function stopScreenShare() {

        if (!screenStream) {
            return;
        }


        screenStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        screenStream =
            null;


        screenVideo.srcObject =
            null;


        screenVideo.style.display =
            "none";


        screenPlaceholder.style.display =
            "flex";


        screenBadge.classList.remove(
            "active"
        );


        shareScreenButton.classList.remove(
            "sharing"
        );


        shareScreenButton.innerHTML =
            "🖥️ Share Screen";


        screenStatus.textContent =
            "🖥️ Screen not shared";


        screenStatus.style.background =
            "#eff6ff";

        screenStatus.style.color =
            "#1d4ed8";


        if (classStarted) {

            setTeacherStatus(
                "You are live with your students"
            );

        }

    }


    /* =====================================================
       FULLSCREEN
       ===================================================== */

    async function toggleFullscreen() {

        const videoSection =
            document.querySelector(
                ".video-section"
            );


        try {

            if (!document.fullscreenElement) {

                await videoSection.requestFullscreen();

            } else {

                await document.exitFullscreen();

            }

        } catch (error) {

            console.error(
                error
            );

            showNotification(
                "Fullscreen could not be opened."
            );

        }

    }


    /* =====================================================
       STUDENTS
       ===================================================== */

    function openStudents() {

        studentsModal.style.display =
            "flex";

        studentsModal.classList.add(
            "show"
        );

    }


    function closeStudents() {

        studentsModal.style.display =
            "none";

        studentsModal.classList.remove(
            "show"
        );

    }


    /* =====================================================
       CHAT
       ===================================================== */

    function toggleChat() {

        if (
            chatPanel.style.display ===
            "none"
        ) {

            chatPanel.style.display =
                "flex";

            chatInput.focus();

        } else {

            chatPanel.style.display =
                "none";

        }

    }


    function sendChatMessage() {

        const message =
            chatInput.value.trim();


        if (message === "") {
            return;
        }

        if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {

            liveSocket.send(JSON.stringify({
                type: "chat",
                message: message
            }));

            chatInput.value = "";
            chatInput.focus();
            return;
        }


        addChatMessage(
            "Teacher",
            message
        );


        chatInput.value =
            "";


        chatInput.focus();

    }


    function addRemoteChatMessage(sender, message) {

        addChatMessage(
            sender || "Participant",
            message
        );

    }


    window.sendLiveReaction = function (reaction) {

        if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {

            liveSocket.send(JSON.stringify({
                type: "reaction",
                reaction: reaction
            }));

            return;
        }

        addChatMessage(
            "You",
            "reacted " + reaction
        );

    };


    function connectTeacherLiveRoom() {

        if (!window.WebSocket) {
            return;
        }

        const params =
            new URLSearchParams(window.location.search);

        const roomId =
            params.get("room") || "math-primary-6";

        liveSocket =
            new WebSocket("ws://localhost:8080");

        liveSocket.addEventListener("open", function () {

            liveSocket.send(JSON.stringify({
                type: "join-room",
                roomId: roomId,
                role: "teacher"
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
                addRemoteChatMessage(message.senderName, message.message);
            }

            if (message.type === "reaction") {
                addChatMessage(
                    message.senderName,
                    "reacted " + message.reaction
                );
            }

        });

        liveSocket.addEventListener("error", function () {
            showNotification("Live chat server is unavailable.");
        });

    }


    function addChatMessage(
        sender,
        message
    ) {

        const messageBox =
            document.createElement(
                "div"
            );


        messageBox.className =
            "chat-message";


        const name =
            document.createElement(
                "strong"
            );


        name.textContent =
            sender;


        const text =
            document.createElement(
                "span"
            );


        text.textContent =
            message;


        messageBox.appendChild(
            name
        );


        messageBox.appendChild(
            text
        );


        chatMessages.appendChild(
            messageBox
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    /* =====================================================
       NOTES
       ===================================================== */

    function saveNotes() {

        localStorage.setItem(
            "cityInternationalTeacherNotes",
            notes.value
        );


        notesMessage.textContent =
            "✓ Notes saved successfully.";


        notesMessage.style.color =
            "#16a34a";


        showNotification(
            "Your class notes have been saved."
        );


        setTimeout(
            function () {

                notesMessage.textContent =
                    "";

            },
            2500
        );

    }


    function loadNotes() {

        const saved =
            localStorage.getItem(
                "cityInternationalTeacherNotes"
            );


        if (saved !== null) {

            notes.value =
                saved;

        }

    }


    /* =====================================================
       LEAVE
       ===================================================== */

    function leaveClass() {

        if (classStarted) {

            const answer =
                window.confirm(
                    "Your live class is still running. Are you sure you want to leave?"
                );


            if (!answer) {
                return;
            }

        }


        stopScreenShare();

        stopTeacherCamera();

        stopTimer();


        window.location.href =
            "../index.html";

    }


    function stopTeacherCamera() {

        if (!teacherStream) {
            return;
        }


        teacherStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        teacherStream =
            null;


        teacherVideo.srcObject =
            null;

    }


    /* =====================================================
       STATUS
       ===================================================== */

    function setConnectionStatus(
        message,
        connected
    ) {

        connectionStatus.textContent =
            message;


        connectionStatus.dataset.connected =
            connected
                ? "true"
                : "false";

    }


    function setTeacherStatus(
        message
    ) {

        teacherStatus.textContent =
            message;

    }


    function setClassStatus(
        message
    ) {

        classStatus.textContent =
            message;

    }


    /* =====================================================
       NOTIFICATION
       ===================================================== */

    function showNotification(
        message
    ) {

        notification.textContent =
            message;


        notification.classList.add(
            "show"
        );


        clearTimeout(
            notificationTimer
        );


        notificationTimer =
            setTimeout(
                function () {

                    notification.classList.remove(
                        "show"
                    );

                },
                3500
            );

    }


    /* =====================================================
       BUTTON EVENTS
       ===================================================== */

     connectTeacherLiveRoom();

    startButton.addEventListener(
        "click",
        startClass
    );


    endButton.addEventListener(
        "click",
        askEndClass
    );


    micButton.addEventListener(
        "click",
        toggleMicrophone
    );


    cameraButton.addEventListener(
        "click",
        toggleCamera
    );


    shareScreenButton.addEventListener(
        "click",
        toggleScreenShare
    );


    fullscreenButton.addEventListener(
        "click",
        toggleFullscreen
    );


    studentsButton.addEventListener(
        "click",
        openStudents
    );


    chatButton.addEventListener(
        "click",
        toggleChat
    );


    notesButton.addEventListener(
        "click",
        function () {

            notes.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            notes.focus();

        }
    );


    leaveButton.addEventListener(
        "click",
        leaveClass
    );


    sendChatButton.addEventListener(
        "click",
        sendChatMessage
    );


    document
        .getElementById("saveNotesButton")
        .addEventListener(
            "click",
            saveNotes
        );


    document
        .getElementById("confirmEndButton")
        .addEventListener(
            "click",
            finishClass
        );


    document
        .getElementById("cancelEndButton")
        .addEventListener(
            "click",
            closeEndClassModal
        );


    /* =====================================================
       ENTER KEY FOR CHAT
       ===================================================== */

    chatInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendChatMessage();

            }

        }
    );


    /* =====================================================
       MODAL CLOSE
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-close-modal]"
                );


            if (!button) {
                return;
            }


            const modalId =
                button.getAttribute(
                    "data-close-modal"
                );


            const modal =
                document.getElementById(
                    modalId
                );


            if (modal) {

                modal.style.display =
                    "none";

                modal.classList.remove(
                    "show"
                );

            }

        }
    );


    window.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                studentsModal
            ) {

                closeStudents();

            }


            if (
                event.target ===
                endClassModal
            ) {

                closeEndClassModal();

            }

        }
    );


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeStudents();

                closeEndClassModal();

            }

        }
    );


    /* =====================================================
       CLEANUP
       ===================================================== */

    window.addEventListener(
        "beforeunload",
        function () {

            stopScreenShare();

            stopTeacherCamera();

            stopTimer();

        }
    );


    /* =====================================================
       INITIALIZE
       ===================================================== */

    loadNotes();

    updateMicrophoneButton();

    updateCameraButton();

    updateTimer();


    setClassStatus(
        "Class not started"
    );


    setConnectionStatus(
        "Waiting for class",
        false
    );


    setTeacherStatus(
        "Starting camera..."
    );


    screenStatus.textContent =
        "🖥️ Screen not shared";


    openTeacherCamera();


    setTimeout(
        function () {

            showNotification(
                "Welcome, Teacher! Your live classroom is ready."
            );

        },
        1000
    );

});