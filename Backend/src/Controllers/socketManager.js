


// import { Server } from "socket.io";

// let connections = {};
// let messages = {};
// let timeOnline = {};

// export const connectToSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       method : ["GET","POST"],
//       allowedHeaders : ["*"],
//       credentials : true
//     }
//   });

//   io.on("connection", (socket) => {

//     // 🔹 JOIN CALL
//     socket.on("join-call", (path) => {
//       if (!connections[path]) {
//         connections[path] = [];
//       }

//       connections[path].push(socket.id);
//       timeOnline[socket.id] = new Date();

//       // Notify all users in room
//       for (let a = 0; a < connections[path].length; a++) {
//         io.to(connections[path][a]).emit(
//           "user-joined",
//           socket.id,
//           connections[path]
//         );
//       }

//       // Send old messages to new user
//       if (messages[path]) {
//         for (let i = 0; i < messages[path].length; i++) {
//           io.to(socket.id).emit(
//             "chat-message",
//             messages[path][i].data,
//             messages[path][i].sender,
//             messages[path][i]["socket-id-sender"]
//           );
//         }
//       }
//     });

//     // 🔹 SIGNAL (WebRTC)
//     socket.on("signal", (toId, message) => {
//       io.to(toId).emit("signal", socket.id, message);
//     });

//     // 🔹 CHAT MESSAGE
//     socket.on("chat-message", (data, sender) => {

//       const [matchingRoom, found] = Object.entries(connections).reduce(
//         ([room, isFound], [roomKey, roomUsers]) => {
//           if (!isFound && roomUsers.includes(socket.id)) {
//             return [roomKey, true];
//           }
//           return [room, isFound];
//         },
//         ["", false]
//       );

//       if (found) {
//         if (!messages[matchingRoom]) {
//           messages[matchingRoom] = [];
//         }

//         messages[matchingRoom].push({
//           sender: sender,
//           data: data,
//           "socket-id-sender": socket.id,
//         });

//         console.log("message", matchingRoom, ":", sender, data);

//         connections[matchingRoom].forEach((id) => {
//           io.to(id).emit("chat-message", data, sender, socket.id);
//         });
//       }
//     });

//     // 🔹 DISCONNECT
//     socket.on("disconnect", () => {
//       const diffTime = Math.abs(timeOnline[socket.id] - new Date());

//       let key;

//       for (const [roomKey, users] of Object.entries(connections)) {
//         for (let i = 0; i < users.length; i++) {
//           if (users[i] === socket.id) {
//             key = roomKey;

//             // notify others
//             connections[key].forEach((id) => {
//               io.to(id).emit("user-left", socket.id);
//             });

//             // remove user
//             const index = connections[key].indexOf(socket.id);
//             connections[key].splice(index, 1);

//             // delete empty room
//             if (connections[key].length === 0) {
//               delete connections[key];
//             }
//           }
//         }
//       }

//       delete timeOnline[socket.id];
//     });

//   });

//   return io;
// };


import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // 🔹 JOIN CALL
    socket.on("join-call", (path) => {
      console.log(`📍 User ${socket.id} joining room: ${path}`);
      
      // Join socket.io room for broadcasting
      socket.join(path);

      // Initialize room if doesn't exist
      if (!connections[path]) {
        connections[path] = [];
      }

      // Avoid duplicate users
      if (!connections[path].includes(socket.id)) {
        connections[path].push(socket.id);
      }

      timeOnline[socket.id] = new Date();

      console.log(`📊 Room ${path} now has ${connections[path].length} users:`, connections[path]);

      // 🔥 FIX 1: NOTIFY ONLY OTHER USERS (NOT SELF)
      // Broadcast to all others in room that a new user joined
      socket.to(path).emit("user-joined", socket.id);

      // 🔹 SEND OLD MESSAGES TO NEW USER
      if (messages[path]) {
        console.log(`💬 Sending ${messages[path].length} old messages to ${socket.id}`);
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    // 🔹 SIGNAL (WebRTC Offer/Answer/ICE)
    socket.on("signal", (toId, message) => {
      console.log(`📡 Forwarding signal from ${socket.id} to ${toId}`);
      
      // Forward signal to specific user
      io.to(toId).emit("signal", socket.id, message);
    });

    // 🔹 CHAT MESSAGE
    socket.on("chat-message", (data, sender) => {
      console.log(`💬 Chat from ${sender} (${socket.id}): ${data}`);

      // Find which room this user is in
      const [room, found] = Object.entries(connections).reduce(
        ([roomKey, isFound], [key, users]) => {
          if (!isFound && users.includes(socket.id)) {
            return [key, true];
          }
          return [roomKey, isFound];
        },
        ["", false]
      );

      if (found) {
        // Store message
        if (!messages[room]) {
          messages[room] = [];
        }

        messages[room].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        // Broadcast to all users in room
        connections[room].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // 🔹 DISCONNECT
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      const diffTime = Math.abs(timeOnline[socket.id] - new Date());

      let roomToRemove = null;

      // Find which room this user was in
      for (const [room, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          roomToRemove = room;

          // 🔥 FIX 2: NOTIFY OTHERS THAT USER LEFT
          socket.to(room).emit("user-left", socket.id);

          // Remove user from room
          connections[room] = users.filter((id) => id !== socket.id);

          console.log(`📊 Room ${room} now has ${connections[room].length} users`);

          // Delete empty room
          if (connections[room].length === 0) {
            delete connections[room];
            console.log(`🗑️  Room ${room} deleted (empty)`);
          }

          break;
        }
      }

      delete timeOnline[socket.id];
    });

    // 🔹 ERROR HANDLING
    socket.on("error", (error) => {
      console.error(`⚠️  Socket error for ${socket.id}:`, error);
    });
  });

  console.log("🚀 WebRTC signaling server initialized");
  return io;
};