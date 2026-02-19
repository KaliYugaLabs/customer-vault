import { Injectable, signal, effect } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, sendPasswordResetEmail, updateProfile } from '@angular/fire/auth';
import { doc, setDoc, Firestore, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  isLoading = signal(true);
  
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);
      this.isLoading.set(false);
    });
  }
  
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }
  
  async register(email: string, password: string, displayName: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update user profile
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
        email,
        displayName,
        createdAt: serverTimestamp(),
        role: 'user'
      });
      
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }
  
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }
  
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }
  
  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    return user ? await user.getIdToken() : null;
  }
  
  private handleAuthError(error: any): Error {
    let message = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Invalid email or password';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/email-already-in-use':
        message = 'Email is already registered';
        break;
      case 'auth/weak-password':
        message = 'Password must be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later.';
        break;
      default:
        message = error.message || 'Authentication failed';
    }
    
    return new Error(message);
  }
}
