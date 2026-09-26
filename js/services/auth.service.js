import { isSupabaseConfigured } from "../config/supabase.js";

/**
 * Stop authentication actions until Supabase has been configured.
 */
function requireSupabaseSetup() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Authentication is not available yet. Add your Supabase project URL and anon key first."
    );
  }

  throw new Error(
    "Supabase Auth client setup is the next step before using authentication."
  );
}

export const authService = {
  /**
   * Sign in with an email address and password.
   */
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Enter your email address and password.");
    }

    requireSupabaseSetup();
  },

  /**
   * Create an account with an email address and password.
   */
  async signUp(email, password, fullName) {
    if (!email || !password) {
      throw new Error("Enter your email address and password.");
    }

    if (!fullName) {
      throw new Error("Enter your name.");
    }

    requireSupabaseSetup();
  },

  /**
   * Request a password reset code for the supplied email address.
   */
  async sendPasswordResetCode(email) {
    if (!email) {
      throw new Error("Enter your email address.");
    }

    requireSupabaseSetup();
  },

  /**
   * Set a new password after the user has verified their reset code.
   */
  async setNewPassword(resetCode, newPassword) {
    if (!resetCode || !newPassword) {
      throw new Error("Enter the reset code and your new password.");
    }

    requireSupabaseSetup();
  }
};