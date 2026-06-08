import { autoAssignLead } from './src/service/autoAssign.service.js';

autoAssignLead(8321).then(res => {
    console.log('Result:', res);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
