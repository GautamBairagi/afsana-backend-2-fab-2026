import db from '../config/db.js';

export const handleSocketConnection = (io) => {
    io.on('connection', (socket) => {
        console.log('🟢 Socket connected:', socket.id);

        // ✅ Step 1: User joins their private room (ID based)
        socket.on('join', (userId) => {
            socket.join(String(userId));
            console.log(`✅ User joined room: ${userId}`);
        });

        socket.on('registerUser', (userId) => {
            socket.join(String(userId));
            console.log(`✅ User registered/joined room: ${userId}`);
        });

        socket.on('joinRoom', ({ user_id, other_user_id }) => {
            const roomId = [user_id, other_user_id].sort((a, b) => a - b).join('_');
            socket.join(roomId);
            console.log(`✅ User ${user_id} joined chat room: ${roomId}`);
        });

        // ✅ Step 2: Send Message Handler
        const handleSendMessage = async ({ group_id, receiver_id, message, sender_id, type }) => {
            console.log(`📨 send_message → sender: ${sender_id}, receiver: ${receiver_id}, group: ${group_id}, message: ${message}`);

            try {
                const [result] = await db.query(
                    `INSERT INTO chats (group_id, message, sender_id, type, receiver_id) VALUES (?, ?, ?, ?, ?)`,
                    [group_id, message, sender_id, type, receiver_id]
                );

                if (result.affectedRows > 0) {
                    const [savedMessage] = await db.query(`SELECT * FROM chats WHERE id = ?`, [result.insertId]);
                    const messageData = savedMessage[0];

                    // ✅ Send to rooms (Single standardized event)
                    if (group_id) {
                        io.to(String(group_id)).emit('receive_message', messageData); 
                    } else {
                        const roomId = [sender_id, receiver_id].sort((a, b) => a - b).join('_');
                        io.to(roomId).emit('receive_message', messageData);
                        // Also notify receiver's private room for global notifications
                        io.to(String(receiver_id)).emit('receive_message', messageData); 
                    }

                    // ✅ Dashboard Notification Logic (Existing)
                    try {
                        const [receiverUser] = await db.query(`SELECT id, role, counselor_id, student_id, staff_id FROM users WHERE id = ?`, [receiver_id]);
                        if (receiverUser.length > 0) {
                            const user = receiverUser[0];
                            let query = "";
                            let values = [];
                            const msg = `New message from ${sender_id}`;

                            if (user.role === 'counselor') {
                                query = `INSERT INTO dashboard_notifications (counselor_id, cNotification, message) VALUES (?, 1, ?)`;
                                values = [user.counselor_id, msg];
                            } else if (user.role === 'student') {
                                query = `INSERT INTO dashboard_notifications (student_id, sNotification, message) VALUES (?, 1, ?)`;
                                values = [user.student_id, msg];
                            } else if (user.role === 'admin') {
                                query = `INSERT INTO dashboard_notifications (user_id, aNotification, message) VALUES (?, 1, ?)`;
                                values = [user.id, msg];
                            } else if (user.role === 'processor' || user.role === 'processors') {
                                query = `INSERT INTO dashboard_notifications (processor_id, pNotification, message) VALUES (?, 1, ?)`;
                                values = [user.id, msg];
                            }

                            if (query) {
                                await db.query(query, values);
                                io.emit("dashboardUpdated", {
                                    student_id: user.student_id,
                                    counselor_id: user.counselor_id,
                                    processor_id: user.processor_id,
                                    user_id: user.id
                                });
                            }
                        }
                    } catch (notifyErr) {
                        console.error('❌ Notification error:', notifyErr);
                    }
                } else {
                    socket.emit('message_error', { error: 'Failed to send message' });
                }
            } catch (err) {
                console.error('❌ send_message error:', err);
                socket.emit('message_error', { error: 'Message failed', details: err.message });
            }
        };

        socket.on('send_message', handleSendMessage);
        // Deprecated 'sendMessage' removed to prevent duplicates

        // ✅ Step 3: Get Messages
        const handleGetMessages = async ({ sender_id, receiver_id, group_id, chatId }) => {
            let s_id = sender_id;
            let r_id = receiver_id;
            
            if (chatId && !s_id && !r_id) {
                const parts = chatId.split('_');
                if (parts.length === 2) {
                   s_id = parts[0];
                   r_id = parts[1];
                }
            }

            console.log(`📥 get_messages → sender: ${s_id}, receiver: ${r_id}, group: ${group_id}, chatId: ${chatId}`);
            try {
                let messages = [];

                if (group_id) {
                    const [rows] = await db.query(`
                        SELECT 
                            c.*, 
                            u.full_name AS sender_name
                        FROM chats c
                        LEFT JOIN users u ON c.sender_id = u.id
                        WHERE c.group_id = ?
                        ORDER BY c.created_at ASC
                    `, [group_id]);

                    messages = rows;
                } else if (s_id && r_id) {
                    const [rows] = await db.query(`
                        SELECT 
                            c.*, 
                            s.full_name AS sender_name, 
                            IFNULL(r.full_name, CONCAT('User-', c.receiver_id)) AS receiver_name
                        FROM chats c
                        LEFT JOIN users s ON c.sender_id = s.id
                        LEFT JOIN users r ON c.receiver_id = r.id
                        WHERE (
                            (c.sender_id = ? AND c.receiver_id = ?) OR 
                            (c.sender_id = ? AND c.receiver_id = ?)
                        )
                        AND c.group_id IS NULL
                        ORDER BY c.created_at ASC
                    `, [s_id, r_id, r_id, s_id]);

                    messages = rows;
                } else {
                    return socket.emit('message_error', { error: "Invalid query parameters" });
                }

                socket.emit('chat_history', { messages }); 
            } catch (err) {
                console.error('❌ get_messages error:', err);
                socket.emit('message_error', { error: "Failed to fetch messages", details: err.message });
            }
        };

        socket.on('get_chat_history', handleGetMessages);

        // ✅ Disconnect
        socket.on('disconnect', () => {
            console.log('🔴 Socket disconnected:', socket.id);
        });

        /////////////////////////////////////        Dashbaord API        /////////////////////////////////////////////////////////

       socket.on("getDashboardData", async ({ student_id, counselor_id, processor_id, staff_id }) => {
  try {
    let query;
    let values = [];

    console.log("📥 Incoming getDashboardData payload:", {
      student_id,
      counselor_id,
      processor_id,
      staff_id
    });

    if (student_id) {
      query =
        "SELECT * FROM dashboard_notifications WHERE student_id = ? AND sNotification = 1";
      values = [student_id];
    } else if (counselor_id) {
      query =
        "SELECT * FROM dashboard_notifications WHERE counselor_id = ? AND cNotification = 1";
      values = [counselor_id];
    } else if (staff_id) {
      console.log("⚙️ staff mode with ID:", staff_id);
      query =
        "SELECT * FROM dashboard_notifications WHERE staff_id = ? AND staffNotification = 1";
      values = [staff_id];
      console.log("🧑‍💼 Staff Query:", query, "Values:", values);
    }
    
    else if (processor_id) {
      console.log("⚙️ Processor mode with ID:", processor_id);
      query =
        "SELECT * FROM dashboard_notifications WHERE processor_id = ? AND pNotification = 1";
      values = [processor_id];
    } else{
      query =
             "SELECT * FROM dashboard_notifications WHERE aNotification = 1";
    }

    // "SELECT * FROM dashboard_notifications WHERE aNotification = 1";

    console.log("📝 Final SQL Query:", query);
    console.log("🔢 Values:", values);

    const [result] = await db.query(query, values);

    console.log("✅ Query executed successfully, rows found:", result.length);
    console.log("📊 Result data:", result);

    // Send data back to client
    socket.emit("dashboardDataResponse", {
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Socket Error fetching dashboard data:", error);
    socket.emit("dashboardDataResponse", {
      success: false,
      message: "Internal Server Error",
    });
  }
});


        socket.on("updateDashboardNotification", async ({ student_id, counselor_id, sNotification, cNotification, aNotification, pNotification,processor_id, user_id }) => {
            try {
                let query = "";
                let values = [];

                if (student_id) {
                    // Student clear
                    query = "UPDATE dashboard_notifications SET sNotification = ? WHERE student_id = ?";
                    values = [sNotification, student_id];
                } else if (counselor_id) {
                    // Counselor clear
                    console.log("counselor_id", counselor_id);

                    query = "UPDATE dashboard_notifications SET cNotification = ? WHERE counselor_id = ?";
                    values = [cNotification, counselor_id];
                } else if (processor_id) {
                    // Counselor clear
                    console.log("processor_id", processor_id);

                    query = "UPDATE dashboard_notifications SET pNotification = ? WHERE processor_id = ?";
                    values = [pNotification, processor_id];
                }else{
                    // Admin clear
                    query = "UPDATE dashboard_notifications SET aNotification = ? WHERE user_id = ?";
                    values = [aNotification, user_id];
                }

                const [result] = await db.query(query, values);
                console.log("result", result);

                if (result.affectedRows > 0) {
                    socket.emit("updateDashboardResponse", {
                        success: true,
                        message: "Notification updated successfully",
                    });

                    // 📢 Broadcast update for real-time refresh
                    io.emit("dashboardUpdated", {
                        student_id,
                        counselor_id,
                        sNotification,
                        cNotification,
                        aNotification,
                    });
                } else {
                    socket.emit("updateDashboardResponse", {
                        success: false,
                        message: "No matching record found",
                    });
                }
            } catch (error) {
                console.error("Socket Error updating notification:", error);
                socket.emit("updateDashboardResponse", {
                    success: false,
                    message: "Internal Server Error",
                });
            }
        });

    });
};
