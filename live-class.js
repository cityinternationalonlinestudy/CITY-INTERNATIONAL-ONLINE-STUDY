/* =========================================================
   CITY INTERNATIONAL ONLINE SCHOOL
   REAL LIVE CLASSROOM
   Firebase Realtime Database + WebRTC
   ========================================================= */

import {
    ref,
    set,
    push,
    onValue,
    onChildAdded,
    onDisconnect,
    remove,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import { database } from "./firebase-config.js";


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let localStream = null;
let peerConnection = null;

let microphoneEnabled = true;
let cameraEnabled = true;

let classSeconds = 0;
let timerInterval = null;

let roomId = null;
let participantId = null;
let participantRole = null;

let roomRef = null;
let participantRef = null;
let chatRef = null;
let offerRef = null;
let answerRef = null;
let teacherCandidatesRef = null;
let studentCandidatesRef = null;

let remoteStream = null;

let connectedToOtherPerson = false;
let leavingClass = false;


/* =========================================================
   WEBRTC CONFIGURATION
   ========================================================= */

const rtcConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        },
        {
            urls: "stun:stun1.l.google.com:19302"
        }
    ]
};


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeLiveClass();

});


/* =========================================================
   INITIALIZE LIVE CLASS
   ========================================================= */

async function initializeLiveClass() {

    try {

        loadClassInformation();

        determineParticipant();

        determineRoom();

        setupFirebaseReferences();

        setupChat();

        setupRealtimeClass();

        loadNotes();

        await startLocalMedia();

        await registerParticipant();

        if (participantRole === "teacher") {

            await startTeacher();

        } else {

            await startStudent();

        }

        startClassTimer();

        setupKeyboardShortcuts();

    } catch (error) {

        console.error(
            "Live class initialization error:",
            error
        );

        setConnectionStatus(
            "Connection error",
            false
        );

        showNotification(
            "Could not start the live classroom."
        );

    }

}


/* =========================================================
   LOAD CLASS INFORMATION
   ========================================================= */

function loadClassInformation() {

    const subjectElement =
        document.getElementById("subjectName");

    const teacherElement =
        document.getElementById("teacherName");

    const savedSubject =
        localStorage.getItem("cis_live_subject");

    const savedTeacher =
        localStorage.getItem("cis_live_teacher");

    if (subjectElement && savedSubject) {

        subjectElement.textContent =
            savedSubject;

    }

    if (teacherElement && savedTeacher) {

        teacherElement.textContent =
            savedTeacher;

    }

}


/* =========================================================
   DETERMINE PARTICIPANT
   ========================================================= */

function determineParticipant() {

    const currentTeacher =
        localStorage.getItem("cis_current_teacher");

    const currentStudent =
        localStorage.getItem("cis_current_student");


    /*
       Teacher has priority if teacher session exists.
    */

    if (currentTeacher) {

        participantRole = "teacher";

    } else if (currentStudent) {

        participantRole = "student";

    } else {

        /*
           For testing, allow student mode if there
           is no login session.
        */

        participantRole = "student";

    }


    participantId =
        participantRole +
        "_" +
        createRandomId();


    console.log(
        "Participant role:",
        participantRole
    );

}


/* =========================================================
   DETERMINE ROOM
   ========================================================= */

function determineRoom() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const urlRoom =
        urlParams.get("room");

    const savedRoom =
        localStorage.getItem(
            "cis_live_room_id"
        );


    if (urlRoom) {

        roomId = sanitizeRoomId(urlRoom);

    } else if (savedRoom) {

        roomId = sanitizeRoomId(savedRoom);

    } else {

        /*
           Default testing room.

           Teacher and student must use the
           same room.
        */

        roomId = "city-school-main-class";

    }


    console.log(
        "Live class room:",
        roomId
    );

}


/* =========================================================
   SANITIZE ROOM ID
   ========================================================= */

function sanitizeRoomId(value) {

    return String(value)
        .replace(/[.#$[\]/]/g, "-")
        .substring(0, 100);

}


/* =========================================================
   RANDOM ID
   ========================================================= */

function createRandomId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID()
            .replace(/-/g, "");

    }

    return Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 12);

}


/* =========================================================
   FIREBASE REFERENCES
   ========================================================= */

function setupFirebaseReferences() {

    roomRef =
        ref(
            database,
            "liveClasses/" + roomId
        );


    participantRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/participants/" +
            participantId
        );


    chatRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/chat"
        );


    offerRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/signaling/offer"
        );


    answerRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/signaling/answer"
        );


    teacherCandidatesRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/signaling/teacherCandidates"
        );


    studentCandidatesRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/signaling/studentCandidates"
        );

}


/* =========================================================
   START LOCAL MEDIA
   ========================================================= */

async function startLocalMedia() {

    setConnectionStatus(
        "Requesting camera...",
        false
    );


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        throw new Error(
            "Camera and microphone are not supported."
        );

    }


    try {

        localStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    },

                    facingMode: "user"
                },

                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }

            });


        const studentVideo =
            document.getElementById(
                "studentVideo"
            );


        if (studentVideo) {

            studentVideo.srcObject =
                localStream;

            studentVideo.style.display =
                "block";

            studentVideo.muted = true;

            studentVideo.playsInline = true;

        }


        const studentPlaceholder =
            document.getElementById(
                "studentPlaceholder"
            );


        if (studentPlaceholder) {

            studentPlaceholder.style.display =
                "none";

        }


        const studentStatus =
            document.getElementById(
                "studentStatus"
            );


        if (studentStatus) {

            studentStatus.textContent =
                "Camera On";

        }


        microphoneEnabled = true;

        cameraEnabled = true;


        updateMicrophoneButton();

        updateCameraButton();


        setConnectionStatus(
            "Camera ready",
            true
        );


        showNotification(
            "Camera and microphone are ready."
        );


    } catch (error) {

        console.error(
            "Media error:",
            error
        );


        const studentVideo =
            document.getElementById(
                "studentVideo"
            );


        const studentPlaceholder =
            document.getElementById(
                "studentPlaceholder"
            );


        const studentStatus =
            document.getElementById(
                "studentStatus"
            );


        if (studentVideo) {

            studentVideo.style.display =
                "none";

        }


        if (studentPlaceholder) {

            studentPlaceholder.style.display =
                "flex";

        }


        if (studentStatus) {

            studentStatus.textContent =
                "Camera Off";

        }


        if (error.name === "NotAllowedError") {

            showNotification(
                "Please allow camera and microphone access."
            );

        } else if (
            error.name === "NotFoundError"
        ) {

            showNotification(
                "Camera or microphone was not found."
            );

        } else {

            showNotification(
                "Camera could not be started."
            );

        }


        /*
           We do not stop the classroom completely.
           A participant can still use chat.
        */

        setConnectionStatus(
            "Camera unavailable",
            false
        );

    }

}


/* =========================================================
   REGISTER PARTICIPANT
   ========================================================= */

async function registerParticipant() {

    const name =
        getParticipantName();


    const participantData = {

        id: participantId,

        role: participantRole,

        name: name,

        online: true,

        camera: cameraEnabled,

        microphone: microphoneEnabled,

        joinedAt: Date.now()

    };


    await set(
        participantRef,
        participantData
    );


    /*
       Automatically remove participant when
       their connection disappears.
    */

    onDisconnect(participantRef)
        .remove();


    updateParticipantList();

}


/* =========================================================
   GET PARTICIPANT NAME
   ========================================================= */

function getParticipantName() {

    if (participantRole === "teacher") {

        try {

            const teacher =
                JSON.parse(
                    localStorage.getItem(
                        "cis_current_teacher"
                    ) || "{}"
                );


            return (
                teacher.fullName ||
                teacher.name ||
                teacher.teacherName ||
                "Teacher"
            );

        } catch (error) {

            return "Teacher";

        }

    }


    try {

        const student =
            JSON.parse(
                localStorage.getItem(
                    "cis_current_student"
                ) || "{}"
            );


        return (
            student.fullName ||
            student.name ||
            student.studentName ||
            "Student"
        );

    } catch (error) {

        return "Student";

    }

}


/* =========================================================
   REALTIME CLASS
   ========================================================= */

function setupRealtimeClass() {

    setConnectionStatus(
        "Connecting...",
        false
    );


    /*
       Listen to participants.
    */

    const participantsRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/participants"
        );


    onValue(
        participantsRef,
        function (snapshot) {

            const participants =
                snapshot.val() || {};


            const participantArray =
                Object.values(
                    participants
                );


            updateParticipantsUI(
                participantArray
            );


            /*
               If we have another participant,
               update connection message.
            */

            const otherParticipants =
                participantArray.filter(
                    function (person) {

                        return (
                            person.id !==
                            participantId
                        );

                    }
                );


            if (
                otherParticipants.length > 0 &&
                connectedToOtherPerson
            ) {

                setConnectionStatus(
                    "Live connection",
                    true
                );

            }

        }
    );


    /*
       Watch online status.
    */

    const connectedRef =
        ref(
            database,
            ".info/connected"
        );


    onValue(
        connectedRef,
        function (snapshot) {

            if (snapshot.val() === true) {

                setConnectionStatus(
                    "Firebase connected",
                    true
                );

            } else {

                setConnectionStatus(
                    "Offline",
                    false
                );

            }

        }
    );

}


/* =========================================================
   TEACHER START
   ========================================================= */

async function startTeacher() {

    console.log(
        "Starting teacher signaling..."
    );


    await createPeerConnection();


    /*
       Teacher creates the WebRTC offer.
    */

    const offer =
        await peerConnection.createOffer({

            offerToReceiveAudio: true,

            offerToReceiveVideo: true

        });


    await peerConnection.setLocalDescription(
        offer
    );


    await set(
        offerRef,
        {
            type: offer.type,

            sdp: offer.sdp,

            createdAt: Date.now()

        }
    );


    /*
       Listen for student's answer.
    */

    onValue(
        answerRef,
        async function (snapshot) {

            const answer =
                snapshot.val();


            if (!answer) {
                return;
            }


            if (
                !peerConnection ||
                peerConnection.currentRemoteDescription
            ) {

                return;

            }


            try {

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription({
                        type: answer.type,
                        sdp: answer.sdp
                    })
                );


                console.log(
                    "Student answer received."
                );

            } catch (error) {

                console.error(
                    "Could not set student answer:",
                    error
                );

            }

        }
    );


    /*
       Receive ICE candidates from student.
    */

    listenForIceCandidates(
        studentCandidatesRef
    );


    showNotification(
        "Waiting for a student to join..."
    );

}


/* =========================================================
   STUDENT START
   ========================================================= */

async function startStudent() {

    console.log(
        "Starting student signaling..."
    );


    await createPeerConnection();


    /*
       Wait for teacher's offer.
    */

    onValue(
        offerRef,
        async function (snapshot) {

            const offer =
                snapshot.val();


            if (!offer) {

                setConnectionStatus(
                    "Waiting for teacher...",
                    false
                );

                return;

            }


            try {

                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription({

                        type: offer.type,

                        sdp: offer.sdp

                    })
                );


                const answer =
                    await peerConnection.createAnswer();


                await peerConnection.setLocalDescription(
                    answer
                );


                await set(
                    answerRef,
                    {

                        type: answer.type,

                        sdp: answer.sdp,

                        createdAt: Date.now()

                    }
                );


                console.log(
                    "Answer sent to teacher."
                );


            } catch (error) {

                console.error(
                    "Student signaling error:",
                    error
                );

                showNotification(
                    "Could not connect to teacher."
                );

            }

        }
    );


    /*
       Send ICE candidates to teacher.
    */

    listenForIceCandidates(
        teacherCandidatesRef
    );

}


/* =========================================================
   CREATE PEER CONNECTION
   ========================================================= */

async function createPeerConnection() {

    peerConnection =
        new RTCPeerConnection(
            rtcConfiguration
        );


    /*
       Add our camera and microphone.
    */

    if (localStream) {

        localStream
            .getTracks()
            .forEach(
                function (track) {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                }
            );

    }


    /*
       Receive remote stream.
    */

    peerConnection.ontrack =
        function (event) {

            console.log(
                "Remote media received."
            );


            if (!remoteStream) {

                remoteStream =
                    new MediaStream();

            }


            event.streams[0]
                .getTracks()
                .forEach(
                    function (track) {

                        const alreadyAdded =
                            remoteStream
                                .getTracks()
                                .some(
                                    function (
                                        existingTrack
                                    ) {

                                        return (
                                            existingTrack.id ===
                                            track.id
                                        );

                                    }
                                );


                        if (!alreadyAdded) {

                            remoteStream.addTrack(
                                track
                            );

                        }

                    }
                );


            displayRemoteStream();

        };


    /*
       ICE candidates.
    */

    peerConnection.onicecandidate =
        async function (event) {

            if (!event.candidate) {
                return;
            }


            const candidatesRef =
                participantRole === "teacher"
                    ? teacherCandidatesRef
                    : studentCandidatesRef;


            const candidateRef =
                push(candidatesRef);


            await set(
                candidateRef,
                event.candidate.toJSON()
            );

        };


    /*
       Connection state.
    */

    peerConnection.onconnectionstatechange =
        function () {

            const state =
                peerConnection.connectionState;


            console.log(
                "WebRTC connection:",
                state
            );


            if (state === "connected") {

                connectedToOtherPerson =
                    true;


                setConnectionStatus(
                    "Live connection",
                    true
                );


                showNotification(
                    "Teacher and student are connected."
                );


            } else if (
                state === "connecting"
            ) {

                setConnectionStatus(
                    "Connecting...",
                    false
                );


            } else if (
                state === "disconnected"
            ) {

                connectedToOtherPerson =
                    false;


                setConnectionStatus(
                    "Connection interrupted",
                    false
                );


            } else if (
                state === "failed"
            ) {

                connectedToOtherPerson =
                    false;


                setConnectionStatus(
                    "Connection failed",
                    false
                );


                showNotification(
                    "The video connection failed."
                );


            } else if (
                state === "closed"
            ) {

                connectedToOtherPerson =
                    false;

            }

        };


    /*
       ICE connection state.
    */

    peerConnection.oniceconnectionstatechange =
        function () {

            console.log(
                "ICE state:",
                peerConnection.iceConnectionState
            );

        };

}


/* =========================================================
   LISTEN FOR ICE CANDIDATES
   ========================================================= */

function listenForIceCandidates(
    candidatesRef
) {

    onChildAdded(
        candidatesRef,
        async function (snapshot) {

            const candidate =
                snapshot.val();


            if (!candidate) {
                return;
            }


            if (!peerConnection) {
                return;
            }


            try {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );


            } catch (error) {

                /*
                   Some candidates can arrive before
                   remote description is ready.

                   Ignore those temporary errors.
                */

                console.warn(
                    "ICE candidate not added:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   DISPLAY REMOTE VIDEO
   ========================================================= */

function displayRemoteStream() {

    const teacherVideo =
        document.getElementById(
            "teacherVideo"
        );


    const teacherPlaceholder =
        document.getElementById(
            "teacherPlaceholder"
        );


    if (!teacherVideo) {
        return;
    }


    teacherVideo.srcObject =
        remoteStream;


    teacherVideo.autoplay = true;

    teacherVideo.playsInline = true;

    teacherVideo.style.display =
        "block";


    if (teacherPlaceholder) {

        teacherPlaceholder.style.display =
            "none";

    }


    teacherVideo.play()
        .catch(
            function (error) {

                console.warn(
                    "Remote video autoplay:",
                    error
                );

            }
        );

}


/* =========================================================
   MICROPHONE
   ========================================================= */

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


    microphoneEnabled =
        !microphoneEnabled;


    audioTracks.forEach(
        function (track) {

            track.enabled =
                microphoneEnabled;

        }
    );


    updateMicrophoneButton();

    updateParticipantMediaState();


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


/* =========================================================
   UPDATE MICROPHONE BUTTON
   ========================================================= */

function updateMicrophoneButton() {

    const button =
        document.getElementById(
            "micButton"
        );


    if (!button) {
        return;
    }


    if (microphoneEnabled) {

        button.innerHTML =
            "🎤<span>Mute</span>";

    } else {

        button.innerHTML =
            "🔇<span>Unmute</span>";

    }

}


/* =========================================================
   CAMERA
   ========================================================= */

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


    cameraEnabled =
        !cameraEnabled;


    videoTracks.forEach(
        function (track) {

            track.enabled =
                cameraEnabled;

        }
    );


    const studentVideo =
        document.getElementById(
            "studentVideo"
        );


    const placeholder =
        document.getElementById(
            "studentPlaceholder"
        );


    const status =
        document.getElementById(
            "studentStatus"
        );


    if (cameraEnabled) {

        if (studentVideo) {

            studentVideo.style.display =
                "block";

        }


        if (placeholder) {

            placeholder.style.display =
                "none";

        }


        if (status) {

            status.textContent =
                "Camera On";

        }


    } else {

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

    }


    updateCameraButton();

    updateParticipantMediaState();


    showNotification(
        cameraEnabled
            ? "Camera turned on."
            : "Camera turned off."
    );

}


/* =========================================================
   UPDATE CAMERA BUTTON
   ========================================================= */

function updateCameraButton() {

    const button =
        document.getElementById(
            "cameraButton"
        );


    if (!button) {
        return;
    }


    if (cameraEnabled) {

        button.innerHTML =
            "📹<span>Camera</span>";

    } else {

        button.innerHTML =
            "📷<span>Camera</span>";

    }

}


/* =========================================================
   UPDATE PARTICIPANT MEDIA STATE
   ========================================================= */

async function updateParticipantMediaState() {

    if (!participantRef) {
        return;
    }


    try {

        await update(
            participantRef,
            {

                camera: cameraEnabled,

                microphone: microphoneEnabled

            }
        );

    } catch (error) {

        console.warn(
            "Could not update participant state:",
            error
        );

    }

}


/* =========================================================
   CHAT SETUP
   ========================================================= */

function setupChat() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    /*
       Listen for messages from Firebase.
    */

    onChildAdded(
        chatRef,
        function (snapshot) {

            const message =
                snapshot.val();


            if (!message) {
                return;
            }


            displayChatMessage(
                message
            );

        }
    );

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (message === "") {
        return;
    }


    const messageReference =
        push(chatRef);


    const messageData = {

        senderId:
            participantId,

        senderRole:
            participantRole,

        senderName:
            getParticipantName(),

        text:
            message,

        timestamp:
            Date.now()

    };


    try {

        await set(
            messageReference,
            messageData
        );


        input.value = "";


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        showNotification(
            "Message could not be sent."
        );

    }

}


/* =========================================================
   DISPLAY CHAT MESSAGE
   ========================================================= */

function displayChatMessage(message) {

    const messages =
        document.getElementById(
            "chatMessages"
        );


    if (!messages) {
        return;
    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "chat-message";


    if (
        message.senderId ===
        participantId
    ) {

        messageElement.classList.add(
            "own-message"
        );

    }


    const name =
        document.createElement(
            "strong"
        );


    name.textContent =
        message.senderName ||
        (
            message.senderRole ===
            "teacher"
                ? "Teacher"
                : "Student"
        );


    const text =
        document.createElement(
            "p"
        );


    text.textContent =
        message.text || "";


    messageElement.appendChild(
        name
    );


    messageElement.appendChild(
        text
    );


    messages.appendChild(
        messageElement
    );


    messages.scrollTop =
        messages.scrollHeight;

}


/* =========================================================
   CHAT PANEL
   ========================================================= */

function toggleChat() {

    const chatPanel =
        document.getElementById(
            "chatPanel"
        );


    if (!chatPanel) {
        return;
    }


    chatPanel.classList.toggle(
        "show"
    );

}


/* =========================================================
   PARTICIPANTS
   ========================================================= */

function openParticipants() {

    const modal =
        document.getElementById(
            "participantsModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closeParticipants() {

    const modal =
        document.getElementById(
            "participantsModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   UPDATE PARTICIPANTS UI
   ========================================================= */

function updateParticipantsUI(
    participants
) {

    /*
       Try several possible IDs because your existing
       HTML may have a different participants container.
    */

    const container =
        document.getElementById(
            "participantsList"
        );


    if (!container) {
        updateParticipantCount(
            participants.length
        );

        return;
    }


    container.innerHTML = "";


    participants.forEach(
        function (person) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "participant-item";


            const name =
                document.createElement(
                    "strong"
                );


            name.textContent =
                person.name ||
                (
                    person.role ===
                    "teacher"
                        ? "Teacher"
                        : "Student"
                );


            const status =
                document.createElement(
                    "span"
                );


            status.textContent =
                person.online
                    ? " 🟢 Online"
                    : " ⚪ Offline";


            item.appendChild(
                name
            );


            item.appendChild(
                status
            );


            container.appendChild(
                item
            );

        }
    );


    updateParticipantCount(
        participants.length
    );

}


/* =========================================================
   PARTICIPANT COUNT
   ========================================================= */

function updateParticipantCount(
    count
) {

    const possibleElements = [

        document.getElementById(
            "participantCount"
        ),

        document.querySelector(
            ".participant-count"
        )

    ];


    possibleElements.forEach(
        function (element) {

            if (element) {

                element.textContent =
                    count;

            }

        }
    );

}


/* =========================================================
   UPDATE PARTICIPANT LIST
   ========================================================= */

function updateParticipantList() {

    const participantsRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/participants"
        );


    onValue(
        participantsRef,
        function (snapshot) {

            const data =
                snapshot.val() || {};


            updateParticipantsUI(
                Object.values(data)
            );

        },
        {
            onlyOnce: false
        }
    );

}


/* =========================================================
   NOTES
   ========================================================= */

function saveNotes() {

    const notesElement =
        document.getElementById(
            "notes"
        );


    if (!notesElement) {
        return;
    }


    const notes =
        notesElement.value;


    /*
       Save locally.
    */

    localStorage.setItem(
        "citySchoolLiveClassNotes",
        notes
    );


    /*
       Also save to Firebase for this room.
    */

    const notesRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/notes"
        );


    set(
        notesRef,
        {

            text: notes,

            savedBy:
                participantRole,

            updatedAt:
                Date.now()

        }
    )
    .then(
        function () {

            const message =
                document.getElementById(
                    "notesMessage"
                );


            if (message) {

                message.textContent =
                    "Notes saved successfully.";

                setTimeout(
                    function () {

                        message.textContent =
                            "";

                    },
                    2500
                );

            }

        }
    )
    .catch(
        function (error) {

            console.error(
                "Notes error:",
                error
            );

        }
    );

}


/* =========================================================
   LOAD NOTES
   ========================================================= */

function loadNotes() {

    const notesElement =
        document.getElementById(
            "notes"
        );


    /*
       Load local notes first.
    */

    const localNotes =
        localStorage.getItem(
            "citySchoolLiveClassNotes"
        );


    if (
        notesElement &&
        localNotes !== null
    ) {

        notesElement.value =
            localNotes;

    }


    /*
       Then listen to Firebase notes.
    */

    const notesRef =
        ref(
            database,
            "liveClasses/" +
            roomId +
            "/notes"
        );


    onValue(
        notesRef,
        function (snapshot) {

            const data =
                snapshot.val();


            if (
                data &&
                notesElement &&
                data.text !== undefined
            ) {

                notesElement.value =
                    data.text;

            }

        }
    );

}


/* =========================================================
   CLASS TIMER
   ========================================================= */

function startClassTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    classSeconds = 0;


    timerInterval =
        setInterval(
            function () {

                classSeconds++;


                const hours =
                    Math.floor(
                        classSeconds / 3600
                    );


                const minutes =
                    Math.floor(
                        (
                            classSeconds %
                            3600
                        ) / 60
                    );


                const seconds =
                    classSeconds % 60;


                const timeString =
                    String(hours)
                        .padStart(2, "0") +
                    ":" +
                    String(minutes)
                        .padStart(2, "0") +
                    ":" +
                    String(seconds)
                        .padStart(2, "0");


                const timer =
                    document.getElementById(
                        "classTimer"
                    );


                if (timer) {

                    timer.textContent =
                        timeString;

                }

            },
            1000
        );

}


/* =========================================================
   FULLSCREEN
   ========================================================= */

function toggleFullscreen() {

    const videoSection =
        document.querySelector(
            ".video-section"
        );


    if (!videoSection) {
        return;
    }


    if (!document.fullscreenElement) {

        if (
            videoSection.requestFullscreen
        ) {

            videoSection
                .requestFullscreen()
                .catch(
                    function (error) {

                        console.error(
                            "Fullscreen error:",
                            error
                        );

                    }
                );

        }

    } else {

        document.exitFullscreen();

    }

}


/* =========================================================
   LEAVE CLASS
   ========================================================= */

function leaveClass() {

    const modal =
        document.getElementById(
            "leaveModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


/* =========================================================
   CLOSE LEAVE MODAL
   ========================================================= */

function closeLeaveModal() {

    const modal =
        document.getElementById(
            "leaveModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   CONFIRM LEAVE
   ========================================================= */

async function confirmLeave() {

    if (leavingClass) {
        return;
    }


    leavingClass = true;


    try {

        if (participantRef) {

            await remove(
                participantRef
            );

        }

    } catch (error) {

        console.warn(
            "Could not remove participant:",
            error
        );

    }


    stopLocalMedia();


    if (peerConnection) {

        peerConnection.close();

        peerConnection = null;

    }


    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    /*
       Go back to the previous page.
    */

    window.history.back();

}


/* =========================================================
   STOP LOCAL MEDIA
   ========================================================= */

function stopLocalMedia() {

    if (!localStream) {
        return;
    }


    localStream
        .getTracks()
        .forEach(
            function (track) {

                track.stop();

            }
        );


    localStream = null;


    const studentVideo =
        document.getElementById(
            "studentVideo"
        );


    if (studentVideo) {

        studentVideo.srcObject =
            null;

    }

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function goBack() {

    confirmLeave();

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message
) {

    const notification =
        document.getElementById(
            "notification"
        );


    if (!notification) {
        return;
    }


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    setTimeout(
        function () {

            notification.classList.remove(
                "show"
            );

        },
        3000
    );

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnectionStatus(
    message,
    connected
) {

    const status =
        document.getElementById(
            "connectionStatus"
        );


    if (!status) {
        return;
    }


    status.textContent =
        "● " + message;


    if (connected) {

        status.classList.remove(
            "offline"
        );


        status.classList.add(
            "online"
        );

    } else {

        status.classList.remove(
            "online"
        );


        status.classList.add(
            "offline"
        );

    }

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        function (event) {

            /*
               M = microphone
            */

            if (
                event.key.toLowerCase() ===
                "m" &&
                event.target.tagName !==
                "INPUT" &&
                event.target.tagName !==
                "TEXTAREA"
            ) {

                toggleMicrophone();

            }


            /*
               C = camera
            */

            if (
                event.key.toLowerCase() ===
                "c" &&
                event.target.tagName !==
                "INPUT" &&
                event.target.tagName !==
                "TEXTAREA"
            ) {

                toggleCamera();

            }

        }
    );

}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
   ========================================================= */

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


        if (
            participantsModal &&
            event.target ===
            participantsModal
        ) {

            closeParticipants();

        }


        if (
            leaveModal &&
            event.target ===
            leaveModal
        ) {

            closeLeaveModal();

        }

    }
);


/* =========================================================
   MAKE HTML ONCLICK FUNCTIONS GLOBAL
   ========================================================= */

window.toggleMicrophone =
    toggleMicrophone;

window.toggleCamera =
    toggleCamera;

window.toggleFullscreen =
    toggleFullscreen;

window.toggleChat =
    toggleChat;

window.openParticipants =
    openParticipants;

window.closeParticipants =
    closeParticipants;

window.saveNotes =
    saveNotes;

window.leaveClass =
    leaveClass;

window.closeLeaveModal =
    closeLeaveModal;

window.confirmLeave =
    confirmLeave;

window.goBack =
    goBack;

window.sendMessage =
    sendMessage;