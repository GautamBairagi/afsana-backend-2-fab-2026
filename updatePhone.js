import db from './src/config/db.js';

db.execute("UPDATE counselors SET phone = '8801898383124' WHERE id = 38")
    .then(() => {
        console.log('Phone updated successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
