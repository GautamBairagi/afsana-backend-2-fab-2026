import db from '../config/db.js';
export const getCounselorById = async(id) => {
    // console.log(id,"guiyguiiiiiiiiiiiiiiiiiiiiiiiii")
    const [results] = await db.query('SELECT full_name FROM users WHERE counselor_id = ?', [id]);
    console.log("object", results);
    return results
};

export const getCounseloraplicationById = async(id) => {
    // console.log(id)
    const [results] = await db.query('SELECT full_name FROM users WHERE counselor_id = ?', [id]);
    console.log("object", results);
    return results
};