import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, CreditCard, ShieldCheck, LogOut, ChevronRight, Settings, Bell, HelpCircle, Check, X, History as HistoryIcon, Image as ImageIcon, Phone, Loader2 } from "lucide-react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, orderBy, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Coins, Clock } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Account({ onNavigate, onShowPricing, credits, onNewUser }: { onNavigate: (page: any) => void, onShowPricing: () => void, credits: number, onNewUser?: () => void }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showPolicies, setShowPolicies] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [activePlan, setActivePlan] = useState<string>("Free Plan");
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');

  const [phoneMode, setPhoneMode] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [personalName, setPersonalName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

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
        if (data.personalName) setPersonalName(data.personalName);
        if (data.businessName) setBusinessName(data.businessName);
        if (data.city) setCity(data.city);
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        personalName,
        businessName,
        city
      }, { merge: true });
      setIsEditingProfile(false);
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSavingProfile(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setPhoneLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || t("Failed to send OTP. Check phone format.", "Failed to send OTP. Check phone format."));
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setPhoneLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      
      if (result.user) {
        const userRef = doc(db, "users", result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: result.user.uid,
            phoneNumber: result.user.phoneNumber,
            createdAt: serverTimestamp(),
            credits: 10,
            lastPlan: "Starter (Free)"
          });
          if (onNewUser) onNewUser();
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || t("Invalid OTP code.", "Invalid OTP code."));
    } finally {
      setPhoneLoading(false);
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
      <div className="max-w-md mx-auto space-y-8 pb-24 pt-8 text-center px-4">
        <div className="w-20 h-20 bg-brand-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t("Welcome to Hyperlook Ai", "Welcome to Hyperlook Ai")}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t("Sign in to save your generated photoshoots and access your history across devices.", "Sign in to save your generated photoshoots and access your history across devices.")}</p>
        
        <div className="space-y-4 pt-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-left"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t("Phone Verification", "Phone Verification")}</h3>
            
            {errorMsg && (
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
                {errorMsg}
              </div>
            )}
            
            <div id="recaptcha-container"></div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("Phone Number", "Phone Number")}</label>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={phoneLoading || !phoneNumber}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("Send OTP", "Send OTP")}
                </button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                  {t("Please check your SMS inbox for the OTP. We recommend using your WhatsApp number for a better experience and updates.", "Please check your SMS inbox for the OTP. We recommend using your WhatsApp number for a better experience and updates.")}
                </p>
              </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("Enter OTP", "Enter OTP")}</label>
                    <input 
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 tracking-widest text-center text-lg rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={phoneLoading || otp.length < 6}
                    className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-700 transition-colors"
                  >
                    {phoneLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("Verify", "Verify")}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setErrorMsg(""); }}
                    className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white mt-2"
                  >
                    {t("Change Phone Number", "Change Phone Number")}
                  </button>
                </form>
              )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* User Info */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full -z-10" />
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 rounded-full border-2 border-white dark:border-slate-700 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-700">
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
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {personalName || user.displayName || "User"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5 truncate">
              {user.phoneNumber}
            </p>
            
            <div className="flex items-center flex-wrap gap-2 mt-2 text-[11px] font-bold">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <Coins className="w-3 h-3" />
                <span>
                  {user.phoneNumber === "+918888039433" ? "∞" : credits}
                </span>
              </div>
              <div className="px-2 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg uppercase tracking-widest">
                {user.phoneNumber === "+918888039433" ? "Platinum" : activePlan}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={onShowPricing}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
            >
              Top Up
            </button>
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isEditingProfile && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">{t("Personal Name", "Personal Name")}</label>
                    <input 
                      type="text" 
                      value={personalName} 
                      onChange={e => setPersonalName(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">{t("Business Name", "Business Name")}</label>
                    <input 
                      type="text" 
                      value={businessName} 
                      onChange={e => setBusinessName(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="My Studio"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">{t("City", "City")}</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Mumbai"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-6 py-2 bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md hover:bg-brand-700 transition-colors flex items-center gap-2"
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("Save Changes", "Save Changes")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full overflow-hidden">
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'billing' 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Billing & Plans
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'history' 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          Gallery History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'billing' ? (
          <motion.div 
            key="billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
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
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">High-Res Delivery Center</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Your generated images and 4K upscaler history are being migrated here. Soon, you will be able to retrieve all your High-Res Google Cloud Storage links from this dashboard.
            </p>
            <button 
              onClick={() => onNavigate('studio')}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Go to Workspace
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Sections */}
      <section className="grid grid-cols-2 gap-3">
        {user.phoneNumber === "+918888039433" && (
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
