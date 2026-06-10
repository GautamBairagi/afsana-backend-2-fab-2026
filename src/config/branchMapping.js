/**
 * Meta WhatsApp Cloud API - Branch Mapping
 * Map the official WhatsApp Phone Number IDs to your CRM Branches.
 * This allows the system to auto-assign incoming leads to the correct branch.
 */

export const branchMapping = {
    // Replace with the actual Phone Number IDs and Branch Names
    "1065141470025332": "Dhaka",      // Client's first number (+880 1898-833032)
    "dummy_id_2": "Banani",           // Placeholder for second number
    "dummy_id_3": "Farmgate",         // Placeholder for third number
    "dummy_id_4": "Uttara"            // Placeholder for fourth number
};

/**
 * Helper function to get branch name by phone number ID
 */
export const getBranchByPhoneId = (phoneNumberId) => {
    return branchMapping[phoneNumberId] || "Main Branch"; // Default fallback
};

/**
 * Helper function to get phone number ID by branch name
 * Used for outbound drip campaigns and reminders
 */
export const getPhoneIdByBranch = (branchName) => {
    for (const [id, name] of Object.entries(branchMapping)) {
        if (name === branchName) return id;
    }
    // Fallback to the first available ID if branch not found
    return Object.keys(branchMapping)[0] || "1065141470025332";
};
