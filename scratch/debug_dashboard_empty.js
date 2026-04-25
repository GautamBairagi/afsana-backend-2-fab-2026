import mysql from 'mysql2/promise';

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finaltestiingafsana'
  });

  try {
    // 1. Find counselor info
    const [users] = await connection.execute('SELECT * FROM users WHERE full_name LIKE ?', ['%ram%']);
    console.log('Users matching ram:', users.map(u => ({ id: u.id, full_name: u.full_name, role: u.role, counselor_id: u.counselor_id })));

    if (users.length > 0) {
      const ramUser = users.find(u => u.role === 'counselor') || users[0];
      const counselor_id = ramUser.counselor_id || ramUser.id;
      console.log(`Using counselor_id: ${counselor_id} for ${ramUser.full_name}`);

      // 2. Check inquiries (leads) - NOTE: dashboard.controller.js uses WHERE counselor_id = ?
      // BUT some queries use inquiries.counselor or inquiries.counselor_id.
      
      const [leads] = await connection.execute('SELECT count(*) as count FROM inquiries WHERE counselor_id = ?', [counselor_id]);
      console.log('Leads (inquiries) for counselor_id:', leads[0].count);

      // 3. Check students
      const [students] = await connection.execute('SELECT count(*) as count FROM students WHERE counselor_id = ?', [counselor_id]);
      console.log('Students for counselor_id:', students[0].count);

      // 4. Check tasks
      const [tasks] = await connection.execute('SELECT * FROM tasks WHERE counselor_id = ?', [counselor_id]);
      console.log('Tasks assigned to counselor:', tasks.length);
      
      if (tasks.length > 0) {
          console.log('Sample task image field:', tasks[0].image);
          console.log('Sample task attachment field:', tasks[0].attachment);
      }

      // Check students assigned to this counselor in students table
      const [assignedStudents] = await connection.execute('SELECT id, full_name FROM students WHERE counselor_id = ?', [counselor_id]);
      console.log('Assigned students:', assignedStudents);

    }

  } catch (err) {
    console.error('Database check failed:', err);
  } finally {
    await connection.end();
  }
}

checkData();
