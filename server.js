const WebSocket = require("ws");

const PORT = 8080;

const wss = new WebSocket.Server({
    port: PORT
});

const rooms = new Map();

console.log(`🚀 City International Online School server running on port ${PORT}`);

function send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

function broadcast(roomId, message, exclude = null) {
    const room = rooms.get(roomId);

    if (!room) return;

    for (const client of room.clients) {
        if (client !== exclude) {
            send(client, message);
        }
    }
}

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            teacher: null,
            clients: new Set()
        });
    }

    return rooms.get(roomId);
}

wss.on("connection", (ws) => {

    console.log("🔌 New connection");

    ws.roomId = null;
    ws.role = null;
    ws.studentName = null;

    send(ws, {
        type: "connected",
        message: "Connected to classroom server"
    });

    ws.on("message", (rawMessage) => {

        let message;

        try {
            message = JSON.parse(rawMessage.toString());
        } catch (error) {
            send(ws, {
                type: "error",
                message: "Invalid message format"
            });

            return;
        }

        /*
        ========================================
        JOIN ROOM
        ========================================
        */

        if (message.type === "join-room") {

            const roomId = String(message.roomId || "").trim();
            const role = message.role;

            if (!roomId) {
                send(ws, {
                    type: "error",
                    message: "Room ID is required"
                });

                return;
            }

            if (role !== "teacher" && role !== "student") {
                send(ws, {
                    type: "error",
                    message: "Invalid role"
                });

                return;
            }

            const room = getRoom(roomId);

            ws.roomId = roomId;
            ws.role = role;

            /*
            -------------------------------
            TEACHER JOINED
            -------------------------------
            */

            if (role === "teacher") {

                if (room.teacher && room.teacher !== ws) {

                    send(ws, {
                        type: "error",
                        message: "A teacher is already using this classroom."
                    });

                    return;
                }

                room.teacher = ws;

                console.log(`👨‍🏫 Teacher joined room: ${roomId}`);

                send(ws, {
                    type: "room-joined",
                    role: "teacher",
                    roomId: roomId,
                    studentCount: room.clients.size
                });

                /*
                Tell existing students that teacher is online.
                */

                for (const client of room.clients) {

                    send(client, {
                        type: "teacher-online"
                    });

                    send(ws, {
                        type: "student-already-here",
                        studentId: client.studentId,
                        studentName: client.studentName || "Student"
                    });
                }

                return;
            }

            /*
            -------------------------------
            STUDENT JOINED
            -------------------------------
            */

            if (role === "student") {

                if (room.clients.size >= 100) {

                    send(ws, {
                        type: "error",
                        message: "This classroom is full."
                    });

                    return;
                }

                ws.studentId =
                    "student-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8);

                ws.studentName =
                    String(message.studentName || "Student").trim();

                room.clients.add(ws);

                console.log(
                    `👨‍🎓 Student joined room ${roomId}: ${ws.studentName}`
                );

                send(ws, {
                    type: "room-joined",
                    role: "student",
                    roomId: roomId,
                    studentId: ws.studentId,
                    studentName: ws.studentName
                });

                /*
                Tell teacher about the new student.
                */

                if (room.teacher) {

                    send(room.teacher, {
                        type: "student-joined",
                        studentId: ws.studentId,
                        studentName: ws.studentName
                    });

                    /*
                    Tell student that teacher is already online.
                    */

                    send(ws, {
                        type: "teacher-online"
                    });
                }

                return;
            }
        }

        /*
        ========================================
        WEBRTC SIGNALING
        ========================================
        */

        if (message.type === "offer") {

            const room = rooms.get(ws.roomId);

            if (!room) return;

            /*
            Teacher sends offer to a specific student.
            */

            if (ws.role === "teacher") {

                const student = [...room.clients].find(
                    client =>
                        client.studentId === message.studentId
                );

                if (student) {

                    send(student, {
                        type: "offer",
                        offer: message.offer,
                        studentId: message.studentId
                    });
                }
            }

            return;
        }

        if (message.type === "answer") {

            const room = rooms.get(ws.roomId);

            if (!room || !room.teacher) return;

            /*
            Student sends answer to teacher.
            */

            send(room.teacher, {
                type: "answer",
                answer: message.answer,
                studentId: ws.studentId
            });

            return;
        }

        /*
        ========================================
        ICE CANDIDATES
        ========================================
        */

        if (message.type === "ice-candidate") {

            const room = rooms.get(ws.roomId);

            if (!room) return;

            /*
            Teacher -> Student
            */

            if (ws.role === "teacher") {

                const student = [...room.clients].find(
                    client =>
                        client.studentId === message.studentId
                );

                if (student) {

                    send(student, {
                        type: "ice-candidate",
                        candidate: message.candidate
                    });
                }
            }

            /*
            Student -> Teacher
            */

            else if (ws.role === "student") {

                if (room.teacher) {

                    send(room.teacher, {
                        type: "ice-candidate",
                        candidate: message.candidate,
                        studentId: ws.studentId
                    });
                }
            }

            return;
        }

        /*
        ========================================
        CHAT MESSAGE
        ========================================
        */

        if (message.type === "chat") {

            const room = rooms.get(ws.roomId);

            if (!room) return;

            const chatMessage = {
                type: "chat",
                senderId: ws.studentId || "teacher",
                senderName:
                    ws.role === "teacher"
                        ? "Teacher"
                        : ws.studentName || "Student",
                message: String(message.message || ""),
                timestamp: Date.now()
            };

            /*
            Send to everyone in the classroom.
            */

            broadcast(
                ws.roomId,
                chatMessage
            );

            if (room.teacher) {
                send(room.teacher, chatMessage);
            }

            return;
        }

        /*
        ========================================
        LIVE REACTIONS
        ========================================
        */

        if (message.type === "reaction") {

            const room = rooms.get(ws.roomId);

            if (!room) return;

            const reaction = String(message.reaction || "").trim();

            if (!reaction || reaction.length > 8) {
                return;
            }

            broadcast(
                ws.roomId,
                {
                    type: "reaction",
                    senderId: ws.studentId || "teacher",
                    senderName:
                        ws.role === "teacher"
                            ? "Teacher"
                            : ws.studentName || "Student",
                    reaction: reaction,
                    timestamp: Date.now()
                }
            );

            if (room.teacher) {
                send(room.teacher, {
                    type: "reaction",
                    senderId: ws.studentId || "teacher",
                    senderName:
                        ws.role === "teacher"
                            ? "Teacher"
                            : ws.studentName || "Student",
                    reaction: reaction,
                    timestamp: Date.now()
                });
            }

            return;
        }

        /*
        ========================================
        TEACHER CLASS STATUS
        ========================================
        */

        if (message.type === "class-status") {

            const room = rooms.get(ws.roomId);

            if (!room || ws.role !== "teacher") {
                return;
            }

            broadcast(
                ws.roomId,
                {
                    type: "class-status",
                    status: message.status
                },
                ws
            );

            return;
        }

        /*
        ========================================
        SCREEN SHARE STATUS
        ========================================
        */

        if (message.type === "screen-status") {

            const room = rooms.get(ws.roomId);

            if (!room || ws.role !== "teacher") {
                return;
            }

            broadcast(
                ws.roomId,
                {
                    type: "screen-status",
                    sharing: Boolean(message.sharing)
                },
                ws
            );

            return;
        }
    });

    /*
    ========================================
    CONNECTION CLOSED
    ========================================
    */

    ws.on("close", () => {

        const roomId = ws.roomId;

        if (!roomId) {
            console.log("🔌 Connection closed");
            return;
        }

        const room = rooms.get(roomId);

        if (!room) return;

        /*
        TEACHER LEFT
        */

        if (
            ws.role === "teacher" &&
            room.teacher === ws
        ) {

            room.teacher = null;

            console.log(
                `👨‍🏫 Teacher left room: ${roomId}`
            );

            broadcast(roomId, {
                type: "teacher-left"
            });
        }

        /*
        STUDENT LEFT
        */

        if (ws.role === "student") {

            room.clients.delete(ws);

            console.log(
                `👨‍🎓 Student left room: ${ws.studentName}`
            );

            if (room.teacher) {

                send(room.teacher, {
                    type: "student-left",
                    studentId: ws.studentId,
                    studentName: ws.studentName
                });
            }
        }

        /*
        DELETE EMPTY ROOM
        */

        if (
            !room.teacher &&
            room.clients.size === 0
        ) {

            rooms.delete(roomId);

            console.log(
                `🗑️ Room deleted: ${roomId}`
            );
        }
    });

    ws.on("error", (error) => {

        console.error(
            "WebSocket error:",
            error.message
        );
    });
});