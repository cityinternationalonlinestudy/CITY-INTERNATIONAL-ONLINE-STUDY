const SIGNALING_URL = window.LIVE_SIGNALING_URL || window.location.origin;
const params = new URLSearchParams(window.location.search);
const role = params.get("role") === "teacher" ? "teacher" : "student";
const roomId = params.get("room") || "math-primary-6";
const savedUser = JSON.parse(localStorage.getItem(role === "teacher" ? "cis_current_teacher" : "cis_current_student") || "null");
const displayName = (savedUser && savedUser.fullName) || (role === "teacher" ? "Teacher" : "Student");

let socket;
let localStream;
let screenStream;
let teacherPeer;
const peers = new Map();
const remoteVideos = new Map();

const elements = {
    localVideo: document.getElementById("localVideo"),
    remoteVideos: document.getElementById("remoteVideos"),
    chatMessages: document.getElementById("chatMessages"),
    chatInput: document.getElementById("chatInput"),
    roomLabel: document.getElementById("roomLabel"),
    connectionStatus: document.getElementById("connectionStatus"),
    error: document.getElementById("liveError"),
    participants: document.getElementById("participants")
};

elements.roomLabel.textContent = "Room: " + roomId;

document.getElementById("pageTitle").textContent = role === "teacher" ? "Teacher Live Class" : "Student Live Class";

document.getElementById("micButton").addEventListener("click", toggleMicrophone);
document.getElementById("cameraButton").addEventListener("click", toggleCamera);
document.getElementById("screenButton").addEventListener("click", shareScreen);
document.getElementById("endButton").addEventListener("click", endClass);
document.getElementById("chatForm").addEventListener("submit", function (event) {
    event.preventDefault();
    sendChatMessage();
});

function showError(message) {
    elements.error.textContent = message;
}

function setStatus(message) {
    elements.connectionStatus.textContent = message;
}

async function startMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        elements.localVideo.srcObject = localStream;
        document.getElementById("micButton").classList.add("active");
        document.getElementById("cameraButton").classList.add("active");
    } catch (error) {
        showError("Camera or microphone permission was not granted. You can still join the class to watch and chat.");
        console.error(error);
    }
}

function createPeerConnection(peerId, peerName) {
    const connection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    if (localStream) {
        localStream.getTracks().forEach(function (track) {
            connection.addTrack(track, localStream);
        });
    } else {
        connection.addTransceiver("audio", { direction: "recvonly" });
        connection.addTransceiver("video", { direction: "recvonly" });
    }

    connection.onicecandidate = function (event) {
        if (event.candidate) {
            sendSignal(peerId, "ice-candidate", event.candidate);
        }
    };

    connection.ontrack = function (event) {
        const stream = event.streams[0];
        if (!stream) return;
        renderRemoteVideo(peerId, peerName || "Participant", stream);
    };

    connection.onconnectionstatechange = function () {
        if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
            removePeer(peerId);
        }
    };

    return connection;
}

function sendSignal(target, type, data) {
    socket.emit("signal", { target: target, type: type, data: data });
}

async function createOfferForStudent(student) {
    const connection = createPeerConnection(student.id, student.name);
    peers.set(student.id, connection);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    sendSignal(student.id, "offer", offer);
}

function renderRemoteVideo(peerId, name, stream) {
    let card = remoteVideos.get(peerId);
    if (!card) {
        card = document.createElement("div");
        card.className = "video-card";
        card.innerHTML = '<video autoplay playsinline></video><div class="video-label"></div>';
        elements.remoteVideos.appendChild(card);
        remoteVideos.set(peerId, card);
    }

    card.querySelector("video").srcObject = stream;
    card.querySelector(".video-label").textContent = name;
}

function removePeer(peerId) {
    const connection = peers.get(peerId);
    if (connection) connection.close();
    peers.delete(peerId);

    const card = remoteVideos.get(peerId);
    if (card) card.remove();
    remoteVideos.delete(peerId);

    const participant = document.querySelector('[data-participant="' + peerId + '"]');
    if (participant) participant.remove();
}

function addParticipant(id, name) {
    if (document.querySelector('[data-participant="' + id + '"]')) return;
    const item = document.createElement("div");
    item.dataset.participant = id;
    item.textContent = name;
    elements.participants.appendChild(item);
}

async function handleSignal(message) {
    if (role === "teacher" && message.type === "answer") {
        const connection = peers.get(message.from);
        if (connection) await connection.setRemoteDescription(message.data);
        return;
    }

    if (role === "student" && message.type === "offer") {
        teacherPeer = createPeerConnection(message.from, "Teacher");
        const answer = await teacherPeer.createAnswer();
        await teacherPeer.setRemoteDescription(message.data);
        await teacherPeer.setLocalDescription(answer);
        sendSignal(message.from, "answer", answer);
        return;
    }

    const connection = role === "teacher" ? peers.get(message.from) : teacherPeer;
    if (connection && message.type === "ice-candidate") {
        await connection.addIceCandidate(message.data);
    }
}

function connectToRoom() {
    if (typeof io !== "function") {
        showError("The classroom server is unavailable. Open the app through http://localhost:5500/student-live.html instead of a raw file or VS Code preview.");
        return;
    }

    socket = io(SIGNALING_URL);

    socket.on("connect", function () {
        setStatus("Connected");
        socket.emit("join-room", { roomId: roomId, role: role, name: displayName }, function (result) {
            if (!result.ok) {
                showError(result.error);
                return;
            }
            setStatus(role === "teacher" ? "Teaching live" : "Watching live");
        });
    });

    socket.on("connect_error", function () {
        setStatus("Offline");
        showError("Could not connect to the live classroom server.");
    });

    socket.on("room-users", function (users) {
        users.forEach(function (user) {
            addParticipant(user.id, user.name);
            createOfferForStudent(user);
        });
    });

    socket.on("student-joined", function (student) {
        addParticipant(student.id, student.name);
        createOfferForStudent(student);
    });

    socket.on("student-left", function (student) {
        removePeer(student.id);
    });

    socket.on("teacher-available", function () {
        setStatus("Teacher connected");
    });

    socket.on("waiting-for-teacher", function () {
        setStatus("Waiting for teacher");
    });

    socket.on("signal", handleSignal);

    socket.on("chat-message", function (message) {
        addChatMessage(message.name, message.text);
    });

    socket.on("class-ended", function () {
        setStatus("Class ended");
        showError("The teacher has ended this live class.");
        stopStreams();
    });
}

function toggleMicrophone() {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    document.getElementById("micButton").classList.toggle("active", track.enabled);
    document.getElementById("micButton").classList.toggle("danger", !track.enabled);
}

function toggleCamera() {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    document.getElementById("cameraButton").classList.toggle("active", track.enabled);
    document.getElementById("cameraButton").classList.toggle("danger", !track.enabled);
}

async function shareScreen() {
    if (role !== "teacher") return;
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        peers.forEach(function (connection) {
            const sender = connection.getSenders().find(function (item) {
                return item.track && item.track.kind === "video";
            });
            if (sender) sender.replaceTrack(screenTrack);
        });
        elements.localVideo.srcObject = screenStream;
        screenTrack.onended = function () {
            const cameraTrack = localStream && localStream.getVideoTracks()[0];
            peers.forEach(function (connection) {
                const sender = connection.getSenders().find(function (item) {
                    return item.track && item.track.kind === "video";
                });
                if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
            });
            elements.localVideo.srcObject = localStream;
        };
    } catch (error) {
        console.log("Screen sharing cancelled.");
    }
}

function addChatMessage(name, text) {
    const item = document.createElement("div");
    item.className = "chat-message";
    item.innerHTML = "<strong></strong><span></span>";
    item.querySelector("strong").textContent = name;
    item.querySelector("span").textContent = text;
    elements.chatMessages.appendChild(item);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function sendChatMessage() {
    const text = elements.chatInput.value.trim();
    if (!text || !socket) return;
    socket.emit("chat-message", text);
    elements.chatInput.value = "";
}

function stopStreams() {
    [localStream, screenStream].forEach(function (stream) {
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
    });
}

function endClass() {
    if (!confirm(role === "teacher" ? "End this live class for everyone?" : "Leave this live class?")) return;
    if (role === "teacher" && socket) socket.emit("end-class");
    stopStreams();
    window.location.href = role === "teacher" ? "teacher-dashboard.html" : "student-dashboard.html";
}

startMedia().finally(connectToRoom);
