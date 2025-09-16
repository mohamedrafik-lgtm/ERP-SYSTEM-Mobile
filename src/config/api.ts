/**
 * API Configuration
 * Contains the base URLs and endpoints for the application
 * Updated to support multiple branches with dynamic endpoint selection
 */

import BranchService from '../services/BranchService';

// Default API Base URL (Mansoura Branch)
export const DEFAULT_API_BASE_URL = 'https://erpproductionbackend-production.up.railway.app';

// Branch-specific API Base URLs
export const BRANCH_API_URLS = {
  mansoura: 'https://erpproductionbackend-production.up.railway.app',
  zagazig: 'https://betaerpv1backend-production.up.railway.app',
};

/**
 * Get current API base URL based on selected branch
 */
export const getCurrentApiBaseUrl = async (): Promise<string> => {
  try {
    return await BranchService.getCurrentApiEndpoint();
  } catch (error) {
    console.error('Error getting current API base URL:', error);
    return DEFAULT_API_BASE_URL;
  }
};

/**
 * Get API config with current branch endpoint
 */
export const getApiConfig = async () => {
  const baseUrl = await getCurrentApiBaseUrl();
  
  return {
    BASE_URL: baseUrl,
    
    // Authentication endpoints
    AUTH: {
      VALIDATE: `${baseUrl}/api/auth/validate`,
      LOGOUT: `${baseUrl}/api/auth/logout`,
    },
    
    // Programs endpoints
    PROGRAMS: `${baseUrl}/api/programs`,
    
    // Trainees endpoints  
    TRAINEES: `${baseUrl}/api/trainees`,
    
    // Users endpoints
    USERS: `${baseUrl}/api/users`,
    
    // Training content endpoints
    TRAINING_CONTENT: `${baseUrl}/api/training-content`,
    TRAINING_CONTENTS: `${baseUrl}/api/training-contents`,
    
    // Questions endpoints
    QUESTIONS: `${baseUrl}/api/questions`,
    
    // Finances endpoints
    FINANCES: {
      SAFES: `${baseUrl}/api/finances/safes`,
      TRAINEE_PAYMENTS: `${baseUrl}/api/finances/trainee-payments`,
      AUTO_PAYMENT: `${baseUrl}/api/finances/auto-payment`,
      TRANSACTIONS: `${baseUrl}/api/finances/transactions`,
      TRAINEE_FEES: `${baseUrl}/api/finances/trainee-fees`,
    },
    
    // Permissions endpoints
    PERMISSIONS: {
      ROLES: `${baseUrl}/api/permissions/roles`,
      USERS: `${baseUrl}/api/permissions/users`,
    },
    
    // Marketing endpoints
    MARKETING: {
      EMPLOYEES: `${baseUrl}/api/marketing/employees`,
      TARGETS: `${baseUrl}/api/marketing/targets`,
      TRAINEES: `${baseUrl}/api/marketing/trainees`,
      STATS: `${baseUrl}/api/marketing/stats`,
    },
    
    // WhatsApp endpoints
    WHATSAPP: {
      QR_CODE: `${baseUrl}/api/whatsapp/qr-code`,
      STATUS: `${baseUrl}/api/whatsapp/status`,
      SEND_MESSAGE: `${baseUrl}/api/whatsapp/send-message`,
      LOGOUT: `${baseUrl}/api/whatsapp/logout`,
      SEND_PAYMENT_CONFIRMATION: `${baseUrl}/api/whatsapp/send-payment-confirmation`,
    },
  };
};

// Legacy API_CONFIG for backward compatibility (uses default URL)
export const API_CONFIG = {
  BASE_URL: DEFAULT_API_BASE_URL,
  
  // Authentication endpoints
  AUTH: {
    VALIDATE: `${DEFAULT_API_BASE_URL}/api/auth/validate`,
    LOGOUT: `${DEFAULT_API_BASE_URL}/api/auth/logout`,
  },
  
  // Programs endpoints
  PROGRAMS: `${DEFAULT_API_BASE_URL}/api/programs`,
  
  // Trainees endpoints  
  TRAINEES: `${DEFAULT_API_BASE_URL}/api/trainees`,
  
  // Users endpoints
  USERS: `${DEFAULT_API_BASE_URL}/api/users`,
  
  // Training content endpoints
  TRAINING_CONTENT: `${DEFAULT_API_BASE_URL}/api/training-content`,
  TRAINING_CONTENTS: `${DEFAULT_API_BASE_URL}/api/training-contents`,
  
  // Questions endpoints
  QUESTIONS: `${DEFAULT_API_BASE_URL}/api/questions`,
  
  // Finances endpoints
  FINANCES: {
    SAFES: `${DEFAULT_API_BASE_URL}/api/finances/safes`,
    TRAINEE_PAYMENTS: `${DEFAULT_API_BASE_URL}/api/finances/trainee-payments`,
    AUTO_PAYMENT: `${DEFAULT_API_BASE_URL}/api/finances/auto-payment`,
    TRANSACTIONS: `${DEFAULT_API_BASE_URL}/api/finances/transactions`,
    TRAINEE_FEES: `${DEFAULT_API_BASE_URL}/api/finances/trainee-fees`,
  },
  
  // Permissions endpoints
  PERMISSIONS: {
    ROLES: `${DEFAULT_API_BASE_URL}/api/permissions/roles`,
    USERS: `${DEFAULT_API_BASE_URL}/api/permissions/users`,
  },
  
  // Marketing endpoints
  MARKETING: {
    EMPLOYEES: `${DEFAULT_API_BASE_URL}/api/marketing/employees`,
    TARGETS: `${DEFAULT_API_BASE_URL}/api/marketing/targets`,
    TRAINEES: `${DEFAULT_API_BASE_URL}/api/marketing/trainees`,
    STATS: `${DEFAULT_API_BASE_URL}/api/marketing/stats`,
  },
  
  // WhatsApp endpoints
  WHATSAPP: {
    QR_CODE: `${DEFAULT_API_BASE_URL}/api/whatsapp/qr-code`,
    STATUS: `${DEFAULT_API_BASE_URL}/api/whatsapp/status`,
    SEND_MESSAGE: `${DEFAULT_API_BASE_URL}/api/whatsapp/send-message`,
    LOGOUT: `${DEFAULT_API_BASE_URL}/api/whatsapp/logout`,
    SEND_PAYMENT_CONFIRMATION: `${DEFAULT_API_BASE_URL}/api/whatsapp/send-payment-confirmation`,
  },
};

export default API_CONFIG;