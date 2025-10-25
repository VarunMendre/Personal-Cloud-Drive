export const getEditableRoles = (role) => {
    switch (role) {
        case "Owner":
            return ["Admin", "Manager", "User"];
        case "Admin":
            return ["Manager", "User"];
        case "Manager":
            return ["User"];
        default:
            return [];
    }
};