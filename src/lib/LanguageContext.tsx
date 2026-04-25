import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    "Home": "होम",
    "Workspace": "वर्कस्पेस",
    "How it Works": "ये कैसे काम करता है",
    "Account": "अकाउंट",
    "Photoshoot Workflow": "फोटोशूट का तरीका",
    "Follow the steps below to create your masterpiece": "नीचे दिए गए स्टेप्स से अपनी फोटो बनाएं",
    "Upload Source Image": "फोटो अपलोड करें",
    "Select Model & Scene": "मॉडल और सीन चुनें",
    "Loading...": "लोड हो रहा है...",
    "Back": "पीछे",
    "Next": "आगे",
    "Generate Photoshoot": "फोटोशूट बनाएं",
    "Generating...": "बन रहा है...",
    "Workspace is Empty": "वर्कस्पेस खाली है",
    "Your generated images will appear here": "आपकी बनाई हुई फोटो यहाँ दिखेंगी",
    "Go to Home": "होम पर जाएं",
    "Welcome Bonus!": "वेलकम बोनस!",
    "You just received": "आपको मिले हैं",
    "free coins worth ₹250!": "फ्री कॉइन्स (₹250 के)!",
    "Let's Go Create": "चलिए बनाना शुरू करें",
    "Unlimited ∞": "अनलिमिटेड ∞",
    "Get more coins": "और कॉइन लें",
    "No credits left": "कोई कॉइन नहीं बचा",
    "Please get more credits to generate images": "फोटो बनाने के लिए और कॉइन लें",
    "Add more variations": "और वेरिएशन बनाएं",
    "Try different settings": "दूसरी सेटिंग्स आज़माएं",
    "Download All": "सब डाउनलोड करें",
    "High Res": "हाई रेज़",
    "Success": "बढ़िया!",
    "Inspiration Details": "डिज़ाइन की डिटेल्स",
    "Use as Base for Generation": "इसे रेफ़रेन्स के लिए इस्तेमाल करें",
    "Select Garment": "कपड़े चुनें",
    "Choose the type of clothing you want to feature": "चुने कि आप किस तरह के कपड़े दिखाना चाहते हैं",
    "T-Shirts": "टी-शर्ट",
    "Dresses": "ड्रेसेस",
    "Pants": "पैंट्स",
    "Generate Design": "डिज़ाइन बनाएं",
    "Style & Vibe": "स्टाइल और लुक",
    "Background": "बैकग्राउंड",
    "Welcome to Studio": "स्टूडियो में आपका स्वागत है!",
    "You don't have any ongoing or completed AI processes. Please start by choosing a studio.": "आपका कोई एआई प्रोजेक्ट चालू नहीं है। कृपया कोई स्टूडियो चुनें।",
    "Choose Studio": "स्टूडियो चुनें",
  },
  gu: {
    "Home": "હોમ",
    "Workspace": "વર્કસ્પેસ",
    "How it Works": "આ કેવી રીતે કામ કરે છે",
    "Account": "એકાઉન્ટ",
    "Photoshoot Workflow": "ફોટોશૂટ પ્રોસેસ",
    "Follow the steps below to create your masterpiece": "તમારો ફોટો બનાવવા નીચેના સ્ટેપ્સ ફોલો કરો",
    "Upload Source Image": "ફોટો અપલોડ કરો",
    "Select Model & Scene": "મોડલ અને સીન પસંદ કરો",
    "Loading...": "લોડ થઈ રહ્યું છે...",
    "Back": "પાછળ",
    "Next": "આગળ",
    "Generate Photoshoot": "ફોટોશૂટ બનાવો",
    "Generating...": "બની રહ્યું છે...",
    "Workspace is Empty": "વર્કસ્પેસ ખાલી છે",
    "Your generated images will appear here": "તમારી બનાવેલી ફોટો અહિયાં દેખાશે",
    "Go to Home": "હોમ પર જાઓ",
    "Welcome Bonus!": "વેલકમ બોનસ!",
    "You just received": "તમને મળ્યા છે",
    "free coins worth ₹250!": "ફ્રી કોઈન્સ (₹250 ના)!",
    "Let's Go Create": "ચાલો બનાવવાનું શરૂ કરીએ",
    "Unlimited ∞": "અનલિમિટેડ ∞",
    "Get more coins": "વધુ કોઈન મેળવો",
    "No credits left": "કોઈન ખતમ થઈ ગયા",
    "Please get more credits to generate images": "ફોટો બનાવવા માટે વધુ કોઈન મેળવો",
    "Add more variations": "વધુ વેરીએશન ઉમેરો",
    "Try different settings": "બીજી સેટિંગ્સ ટ્રાય કરો",
    "Download All": "બધું ડાઉનલોડ કરો",
    "High Res": "હાઈ રેઝ",
    "Success": "સરસ!",
    "Inspiration Details": "ડિઝાઇન વિશે",
    "Use as Base for Generation": "આને રેફરેન્સ માટે વાપરો",
    "Select Garment": "કપડાં પસંદ કરો",
    "Choose the type of clothing you want to feature": "પસંદ કરો કેવા કપડાં બતાવવા છે",
    "T-Shirts": "ટી-શર્ટ",
    "Dresses": "ડ્રેસ",
    "Pants": "પેન્ટ",
    "Generate Design": "ડિઝાઇન બનાવો",
    "Style & Vibe": "સ્ટાઈલ અને લુક",
    "Background": "બેકગ્રાઉન્ડ",
    "Welcome to Studio": "સ્ટુડિયો માં તમારું સ્વાગત છે!",
    "You don't have any ongoing or completed AI processes. Please start by choosing a studio.": "તમારું કોઈ AI પ્રોજેક્ટ ચાલુ નથી. કૃપા કરીને કોઈ સ્ટુડિયો પસંદ કરો.",
    "Choose Studio": "સ્ટુડિયો પસંદ કરો",
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string, defaultText?: string) => {
    const text = translations[language]?.[key] || defaultText || key;
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
