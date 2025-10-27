import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";


// HELPER FUNCTIONS
function getResourceModel(resourceType) {
    if (resourceType === "directory") return Directory;
    if (resourceType === "file") return File;
    throw new Error("Invalid resource type");
}

// 1. SHARE WITH SPECIFIC USER (via email)
export const shareWithUser = async (req, res, next) => {
    
}

// 2. GET LIST OF USERS WHO HAVE ACCESS
export const getSharedUsers = async (req, res, next) => {
    
}

// 3. UPDATE USER'S ACCESS LEVEL
export const updateUserAccess = async (req, res, next) => { 

};


//  4. REMOVE USER'S ACCESS
export const removeUserAccess = async (req, res, next) => {
    
}

// 5. GENERATE SHAREABLE LINK
 export const generateShareLink = async (req, res, next) => {
    
}

// 6. UPDATE SHARE LINK ROLE
 export const updateShareLinkRole = async (req, res, next) => {
    
}
 
// 7. DISABLE SHARE LINK
export const disableShareLink = async (req, res, next) => {
    
}

// 8. ACCESS RESOURCE VIA SHARE LINK (PUBLIC)
export const accessViaShareLink = async (req, res, next) => {
    
}

// 9. GET SHARED RESOURCE CONTENT (PUBLIC)

export const getSharedResource = async(req, res, next) => {

}

// 10. GET ALL RESOURCES SHARED WITH ME

export const getSharedWithMe = async (req, res, next) => {
    
}