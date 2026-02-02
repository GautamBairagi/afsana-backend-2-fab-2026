import db from '../config/db.js';

export const handleSocketConnection = (io) => {
    io.on('connection', (socket) => {
        console.log('🟢 Socket connected:', socket.id);

        // ✅ Step 1: User joins their private room (ID based)
        socket.on('join', (userId) => {
            socket.join(String(userId));
            console.log(`✅ User joined room: ${userId}`);
        });

        // ✅ Step 2: Send Message Handler
        socket.on('send_message', async ({ group_id, receiver_id, message, sender_id, type }) => {
            console.log(`📨 send_message → sender: ${sender_id}, receiver: ${receiver_id}, group: ${group_id}, message: ${message}`);

            try {
                const [result] = await db.query(
                    `INSERT INTO chats (group_id, message, sender_id, type, receiver_id) VALUES (?, ?, ?, ?, ?)`,
                    [group_id, message, sender_id, type, receiver_id]
                );

                if (result.affectedRows > 0) {
                    const [savedMessage] = await db.query(`SELECT * FROM chats WHERE id = ?`, [result.insertId]);
                    const messageData = savedMessage[0];

                    // ✅ Send to sender and receiver rooms only
                    if (group_id) {
                        io.to(String(group_id)).emit('new_message', messageData); // group room
                    } else {
                        io.to(String(sender_id)).emit('new_message', messageData);
                        io.to(String(receiver_id)).emit('new_message', messageData);
                    }
                } else {
                    socket.emit('message_error', { error: 'Failed to send message' });
                }
            } catch (err) {
                console.error('❌ send_message error:', err);
                socket.emit('message_error', { error: 'Message failed', details: err.message });
            }
        });

        // ✅ Step 3: Get Messages
        socket.on('get_messages', async ({ sender_id, receiver_id, group_id }) => {
            console.log(`📥 get_messages → sender: ${sender_id}, receiver: ${receiver_id}, group: ${group_id}`);
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
                } else if (sender_id && receiver_id) {
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
                    `, [sender_id, receiver_id, receiver_id, sender_id]);

                    messages = rows;
                } else {
                    return socket.emit('message_error', { error: "Invalid query parameters" });
                }

                socket.emit('messages', messages);
            } catch (err) {
                console.error('❌ get_messages error:', err);
                socket.emit('message_error', { error: "Failed to fetch messages", details: err.message });
            }
        });

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
