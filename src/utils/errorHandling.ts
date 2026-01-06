/**
 * Error handling utilities
 */

/**
 * Handles API errors and logs them
 *
 * TODO: Integrate with a proper toast notification library
 * Recommended: react-hot-toast or react-toastify
 *
 * Installation: npm install react-hot-toast
 * Usage: import toast from 'react-hot-toast';
 *        toast.error(message);
 */
export function handleApiError(error: unknown): void {
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Just log the error, no alert
  console.error('API Error:', message, error);
}

/**
 * Shows a success message to the user
 *
 * TODO: Replace with toast.success(message)
 */
export function showSuccess(message: string): void {
  console.log('Success:', message);
}
