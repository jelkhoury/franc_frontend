import { get } from './httpServices';
import { getStoredToken, decodeToken } from './tokenUtils';
import { USER_ENDPOINTS, USER_ACTION_TYPES } from '../services/apiService';

/**
 * Check if user can perform a specific action
 * @param {string} actionType - The action type (USER_ACTION_TYPES.MOCK_INTERVIEW, etc.)
 * @param {Function} setCheckingStatus - Setter for checking status (optional)
 * @param {Function} setCanPerform - Setter for canPerform state (optional)
 * @param {Function} toast - Toast function from Chakra UI (optional)
 * @returns {Promise<boolean>} - Returns true if user can perform the action, false otherwise
 */
export const checkUserActionPermission = async (
  actionType,
  setCheckingStatus = null,
  setCanPerform = null,
  toast = null
) => {
  try {
    if (setCheckingStatus) setCheckingStatus(true);
    
    const token = getStoredToken();
    if (!token) {
      throw new Error("User not authenticated");
    }
    
    const decoded = decodeToken(token);
    if (!decoded) {
      throw new Error("Invalid token");
    }
    
    const userId = parseInt(
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    );
    
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const data = await get(USER_ENDPOINTS.CAN_USER_PERFORM_ACTION(userId, actionType), {
      token,
    });
    
    // Backend returns { userId, canDoMock: canDo } for all action types
    const canPerform = data.canDoMock === true;
    
    if (setCanPerform) {
      setCanPerform(canPerform);
    }
    
    if (!canPerform && toast) {
      const actionMessages = {
        [USER_ACTION_TYPES.MOCK_INTERVIEW]: {
          title: "Cannot Start Interview",
          description: "You cannot do another interview right now. Please try again later.",
        },
        [USER_ACTION_TYPES.SDS]: {
          title: "Cannot Start SDS Test",
          description: "You cannot start the SDS test right now. Please try again later.",
        },
        [USER_ACTION_TYPES.RESUME]: {
          title: "Cannot Evaluate Resume",
          description: "You cannot evaluate a resume right now. Please try again later.",
        },
        [USER_ACTION_TYPES.COVER_LETTER]: {
          title: "Cannot Evaluate Cover Letter",
          description: "You cannot evaluate a cover letter right now. Please try again later.",
        },
      };
      
      const message = actionMessages[actionType] || {
        title: "Action Not Allowed",
        description: "You cannot perform this action right now. Please try again later.",
      };
      
      toast({
        title: message.title,
        description: message.description,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
    
    return canPerform;
  } catch (err) {
    console.error("Error checking user action permission:", err);
    
    if (setCanPerform) {
      setCanPerform(false);
    }
    
    if (toast) {
      toast({
        title: "Error",
        description: err.message || "Failed to check permissions",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    
    return false;
  } finally {
    if (setCheckingStatus) setCheckingStatus(false);
  }
};

