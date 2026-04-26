"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Checagem do Admin Hardcoded
    if (typeof window !== 'undefined' && localStorage.getItem("admin_session") === "true") {
      setUser({ 
        uid: "admin-hardcoded", 
        displayName: "Mestre Supremo", 
        role: "admin", 
        status: "active", 
        xp: 9999, 
        level: 99,
        unidade: "Administração", 
        photoURL: "https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff" 
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData = {
          uid: currentUser.uid,
          email: currentUser.email,
        };

        if (userDoc.exists()) {
          userData = { ...userData, ...userDoc.data() };
        } else {
          // Documento novo, status "pending_creation"
          userData.status = "pending_creation";
          userData.role = "desbravador"; // default, conselheiros serão setados manualmente no banco pelo admin depois
          userData.xp = 0;
          userData.level = 1;
          
          await setDoc(userDocRef, userData);
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginCounselor = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginAsAdmin = (username, password) => {
    if (username === "admin" && password === "lunna") {
      localStorage.setItem("admin_session", "true");
      setUser({ 
        uid: "admin-hardcoded", 
        displayName: "Mestre Supremo", 
        role: "admin", 
        status: "active", 
        xp: 9999, 
        level: 99, 
        unidade: "Administração",
        photoURL: "https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff" 
      });
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (user?.uid === "admin-hardcoded") {
      localStorage.removeItem("admin_session");
      setUser(null);
    } else {
      await signOut(auth);
    }
  };

  // Função para atualizar o usuário após a criação de personagem
  const updateUserData = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginCounselor, loginAsAdmin, logout, loading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
