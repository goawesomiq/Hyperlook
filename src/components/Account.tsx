import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, CreditCard, ShieldCheck, LogOut, ChevronRight, Settings, Bell, HelpCircle, Check, X } from "lucide-react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, orderBy, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Crown, Clock } from "lucide-react";

export default function Account({ onNavigate, onShowPricing, credits }: { onNavigate: (page: any) => void, onShowPricing: () => void, credits: number }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showPolicies, setShowPolicies] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [activePlan, setActivePlan] = useState<string>("Free Plan");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchPaymentHistory(currentUser.uid);
        fetchUserDetails(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserDetails = async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastPlan) {
          setActivePlan(data.lastPlan.charAt(0).toUpperCase() + data.lastPlan.slice(1) + " Plan");
        }
      }
    } catch (e) {
      console.error("Failed to fetch user details", e);
    }
  };

  const fetchPaymentHistory = async (uid: string) => {
    setLoadingPayments(true);
    try {
      const q = query(
        collection(db, "payments"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const p = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(p);
    } catch (e) {
      console.error("Failed to fetch payments", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Save user to Firestore if not exist
      if (result.user) {
        const userRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Grant 5 free coins to newly registered users
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            createdAt: serverTimestamp(),
            credits: 5,
            lastPlan: "Starter (Free)"
          });
        } else {
          // Just update profile data on successive logins without touching coins
          await setDoc(userRef, {
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const plans = [
    { name: "Basic", credits: 40, price: "₹799", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    { name: "Plus", credits: 100, price: "₹1749", color: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300", popular: true },
    { name: "Pro", credits: 250, price: "₹3499", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  ];

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-24 pt-8 text-center">
        <div className="w-20 h-20 bg-brand-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Welcome to Hyperlook Ai</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">Sign in to save your generated photoshoots and access your history across devices.</p>
        <button 
          onClick={handleLogin}
          className="px-6 py-3 bg-brand-600 text-white rounded-full font-bold text-sm shadow-lg hover:bg-brand-700 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* User Info */}
      <section className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-700">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                alt="Profile"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
            <Settings className="w-3 h-3" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.displayName || "User"}</h2>
          <div className="flex items-center gap-3 mt-1 text-[11px] font-bold">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Crown className="w-3 h-3" />
              {user.email === "goawesomiq@gmail.com" ? "Unlimited ∞" : `${credits} Coins`}
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              {user.email === "goawesomiq@gmail.com" ? "Platinum" : activePlan}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider">{user.email}</p>
        </div>
        <button 
          onClick={onShowPricing}
          className="px-3 py-1.5 bg-brand-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
        >
          Top Up
        </button>
      </section>

      {/* Payment History */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-2 uppercase tracking-wider flex items-center justify-between">
          <span>Transaction History</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
          {loadingPayments ? (
            <div className="p-8 text-center text-slate-400">Loading history...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {new Date(p.timestamp?.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.creditsAdded} Coins Added
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="capitalize font-bold text-slate-700 dark:text-slate-300">
                          {p.planId}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{p.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-2 uppercase tracking-wider">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-center ${plan.popular ? 'ring-2 ring-brand-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Popular
                </div>
              )}
              <div className="flex flex-row md:flex-col items-center justify-between md:justify-center">
                <div className="text-left md:text-center">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <div className={`text-xl font-black ${plan.color.split(' ')[1]}`}>{plan.credits}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Coins</div>
                  </div>
                </div>
                <button 
                  onClick={onShowPricing}
                  className={`px-6 py-2 md:w-full md:py-1.5 rounded-full text-xs font-bold ${plan.color} mt-0 md:mt-3`}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Menu Sections */}
      <section className="grid grid-cols-2 gap-3">
        {user.email === "goawesomiq@gmail.com" && (
          <button
            onClick={() => onNavigate("admin")}
            className="col-span-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-200 dark:border-purple-900/50 flex items-center justify-between group hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-sm">Admin Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
          </button>
        )}
        <button className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm">Notifications</span>
        </button>
        <button className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 hover:shadow-md transition-all">
          <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm">Help Center</span>
        </button>
        <button 
          onClick={() => setShowPolicies(true)}
          className="col-span-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-sm">Legal & Policies</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
        </button>
      </section>

      {/* Logout */}
      <section className="pt-2">
        <button 
          onClick={handleLogout}
          className="w-full p-3 text-red-500 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors text-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </section>

      {/* Version Info */}
      <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-medium">
        Hyperlook Ai v1.2.4 • Made with ❤️ in India
      </div>

      {/* Legal Policies Modal */}
      <AnimatePresence>
        {showPolicies && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Legal & Policies
                </h3>
                <button 
                  onClick={() => setShowPolicies(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base">Terms of Service</h4>
                  <p className="mb-2">By using Hyperlook Ai, you agree to these terms. We provide an AI-powered image generation service for fashion and apparel.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You must own the rights to the images you upload.</li>
                    <li>Generated images are for your commercial or personal use.</li>
                    <li>We do not guarantee the exact accuracy of AI generations.</li>
                    <li>Credits are consumed upon successful generation.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base">Privacy Policy</h4>
                  <p className="mb-2">We value your privacy and are committed to protecting your data.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We collect email and basic profile info for account management.</li>
                    <li>Uploaded images are processed securely and not shared publicly.</li>
                    <li>We use cookies to maintain your session.</li>
                    <li>You can request account deletion at any time.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-base">Refund Policy</h4>
                  <p>Subscription payments are non-refundable. You may cancel your subscription at any time, and you will retain access to your credits until the end of your billing cycle.</p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                <button 
                  onClick={() => setShowPolicies(false)}
                  className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
