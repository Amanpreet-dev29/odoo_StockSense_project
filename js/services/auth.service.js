import { supabase } from "../config/supabase.js";

export const authService = {
  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Enter your email address and password.");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async signUp(email, password, fullName) {
    if (!email || !password) {
      throw new Error("Enter your email address and password.");
    }

    if (!fullName) {
      throw new Error("Enter your name.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error(
        "Account created. Please check your email to confirm your account."
      );
    }
  },

  async sendPasswordResetCode(email) {
    if (!email) {
      throw new Error("Enter your email address.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async setNewPassword(resetCode, newPassword) {
    if (!resetCode || !newPassword) {
      throw new Error("Enter the reset code and your new password.");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
  }
};