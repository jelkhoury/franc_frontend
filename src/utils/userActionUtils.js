import { get } from './httpServices';
import { captureError } from './sentryUtils';
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
  toast = null,
  setRestrictionMessage = null
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
    
    const data = await get(
      USER_ENDPOINTS.CAN_USER_PERFORM_ACTION(userId, actionType),
      { token }
    );
    
    // Backend returns { userId, canDoMock: canDo } for all action types
    let canPerform = data.canDoMock === true;
    let mockAttempts = null;

    // Special handling for Mock Interview:
    // - If user has no attempts => "not enough attempts"
    // - If user has attempts but canDoMock is false => "pending evaluation by CCD"
    if (actionType === USER_ACTION_TYPES.MOCK_INTERVIEW) {
      const userInfo = await get(USER_ENDPOINTS.GET_USER_INFO, { token });
      mockAttempts = userInfo?.mockAttempts ?? 0;

      const hasAttempts = Number(mockAttempts) > 0;
      if (!hasAttempts) {
        canPerform = false;
        if (setRestrictionMessage) {
          setRestrictionMessage(
            "You dont have enough attempts to start another interview. Please try again later."
          );
        }
      } else if (!canPerform) {
        canPerform = false;
        if (setRestrictionMessage) {
          setRestrictionMessage(
            "Please wait till CCD Department evaluate your pending mock interview submitted"
          );
        }
      } else if (setRestrictionMessage) {
        setRestrictionMessage(null);
      }

      console.log("[MockInterview permission]", {
        userId,
        mockAttempts,
        canDoMock: data?.canDoMock,
        canPerform,
      });
    }
    
    if (setCanPerform) {
      setCanPerform(canPerform);
    }
    
    if (!canPerform && toast) {
      const actionMessages = {
        [USER_ACTION_TYPES.MOCK_INTERVIEW]: {
          title: "Cannot Start Interview",
          description: "You dont have enough attempts to do another interview. Please try again later.",
        },
        [USER_ACTION_TYPES.SDS]: {
          title: "Cannot Start SDS Test",
          description: "You cannot start the SDS test right now. Please try again later.",
        },
        [USER_ACTION_TYPES.RESUME]: {
          title: "Cannot Evaluate Resume",
          description: "You dont have enough attempts to evaluate a resume. Please try again later.",
        },
        [USER_ACTION_TYPES.COVER_LETTER]: {
          title: "Cannot Evaluate Cover Letter",
          description: "You dont have enough attempts to evaluate a cover letter. Please try again later.",
        },
      };
      
      // Override message for mock interview using mockAttempts + canDoMock
      if (actionType === USER_ACTION_TYPES.MOCK_INTERVIEW) {
        const hasAttempts = Number(mockAttempts) > 0;
        toast({
          title: "Cannot Start Interview",
          description: hasAttempts
            ? "Please wait till CCD Department evaluate your pending mock interview submitted"
            : "You dont have enough attempts to do another interview. Please try again later.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return canPerform;
      }

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
    captureError(err);
    console.error("Error checking user action permission:", err);
    
    if (setCanPerform) {
      setCanPerform(false);
    }
    if (setRestrictionMessage) setRestrictionMessage(null);
    
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

