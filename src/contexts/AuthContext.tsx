/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { User } from '@/types';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';

/**
 * Authentication context type definition
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yenilendiğinde oturumun açık kalıp kalmadığını kontrol eder
  const checkAuthState = async () => {
    try {
      const cognitoUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      setUser({
        id: cognitoUser.userId,
        email: userAttributes.email || cognitoUser.signInDetails?.loginId || "",
        name: userAttributes.name || cognitoUser.username,
        role: 'user', // Varsayılan rol
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log('User is not signed in', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Uygulama ilk açıldığında çalışır
  useEffect(() => {
    checkAuthState();
  }, []);

  // GİRİŞ YAPMA (LOGIN)
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      
      if (isSignedIn) {
        // If login is successful, fetch user info and update state
        await checkAuthState();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ÇIKIŞ YAPMA (LOGOUT)
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // KAYIT OLMA (SIGN UP)
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name, // Cognito'da 'name' attribute'u açık olmalı
          },
        },
      });
      // Note: We don't auto-login after signup, email verification may be required.
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // EMAIL DOĞRULAMA (CONFIRM SIGN UP)
  const confirmSignUp = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code
      });
    } catch (error) {
      console.error('Confirm signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // API İÇİN TOKEN ALMA
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Error fetching auth token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    confirmSignUp,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}