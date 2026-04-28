"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

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
         coins: 0,
         photoURL: "https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff" 
       });
      setLoading(false);
      return;
    }

    let unsubscribeDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeDoc(); // Limpa o listener anterior se existir

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: currentUser.uid, email: currentUser.email, ...docSnap.data() });
          } else {
            const userData = {
              uid: currentUser.uid, email: currentUser.email,
              status: "pending_creation", role: "desbravador",
              xp: 0, coins: 0, level: 1
            };
            setDoc(userDocRef, userData);
            setUser(userData);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginCounselor = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerUser = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);
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
    <AuthContext.Provider value={{ user, loginWithGoogle, loginCounselor, registerUser, loginAsAdmin, logout, loading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
