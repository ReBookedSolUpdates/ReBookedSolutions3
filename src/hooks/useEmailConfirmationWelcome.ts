import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const EMAIL_CONFIRMATION_WELCOME_KEY = 'email_confirmation_welcome_shown';

export const useEmailConfirmationWelcome = () => {
  const { user, isAuthenticated } = useAuth();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Function to mark that user came from email confirmation
  const markEmailConfirmation = () => {
    localStorage.setItem(EMAIL_CONFIRMATION_WELCOME_KEY, 'true');
  };

  // Function to clear the welcome flag
  const clearWelcomeFlag = () => {
    localStorage.removeItem(EMAIL_CONFIRMATION_WELCOME_KEY);
    setHasShownWelcome(true);
  };

  // Show welcome message when user is authenticated and came from email confirmation
  useEffect(() => {
    if (!isAuthenticated || !user || hasShownWelcome) {
      return;
    }

    const shouldShowWelcome = localStorage.getItem(EMAIL_CONFIRMATION_WELCOME_KEY) === 'true';
    
    if (shouldShowWelcome) {
      // Show welcome toast with custom styling for top-right positioning
      toast.success("Welcome to ReBooked Solutions! 🎉", {
        description: "Your email has been verified and you're now logged in.",
        duration: 6000,
        className: "welcome-toast",
        style: {
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: 'white',
          border: '1px solid #10b981',
          fontWeight: '500',
        },
        action: {
          label: "Got it!",
          onClick: () => clearWelcomeFlag(),
        },
      });

      // Clear the flag after showing
      clearWelcomeFlag();
    }
  }, [isAuthenticated, user, hasShownWelcome]);

  return {
    markEmailConfirmation,
    clearWelcomeFlag,
  };
};
