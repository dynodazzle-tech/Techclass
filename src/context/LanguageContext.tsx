import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Brand & Nav
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.courses': 'Courses',
    'nav.tests': 'Mock Tests',
    'nav.library': 'Digital Library',
    'nav.pricing': 'Annual Pass',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin Portal',
    'nav.login': 'Login',
    'nav.register': 'Register Free',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'brand.tagline': 'Your Digital Classroom for Government Exam Preparation',
    'brand.supporting': 'Learn. Practice. Revise. Improve.',

    // Hero
    'hero.title': 'Your Digital Classroom for Government Exam Preparation',
    'hero.subtitle': 'Learn, practice and revise with structured courses, full-length mock tests and digital study material in Hindi, Marathi and English.',
    'hero.cta.free': 'Start Free',
    'hero.cta.courses': 'Explore Courses',
    'hero.annual_offer': 'TechClass Annual Pass — ₹2,999/year with full exam library',

    // Key Benefits
    'benefit.gov': 'Government Exam Focused',
    'benefit.mock': 'Real Exam Pattern Mock Tests',
    'benefit.pyq': 'Previous-Year Solved Papers',
    'benefit.pdf': 'Digital Library & E-Ink Reader',
    'benefit.multi': 'Hindi / Marathi / English',
    'benefit.mobile': 'Mobile-First Responsive Learning',
    'benefit.analytics': 'AI-Ready Performance Analytics',

    // Common
    'common.free': 'Free',
    'common.premium': 'Annual Pass',
    'common.view': 'View',
    'common.explore': 'Explore',
    'common.upgrade': 'Upgrade Now',
    'common.search': 'Search courses, tests, and PDFs...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.whatsapp_support': 'WhatsApp Support',
    'common.licensed_to': 'Licensed to',
    'common.student_id': 'Student ID',

    // Test Engine
    'test.start': 'Start Test',
    'test.resume': 'Resume Test',
    'test.submit': 'Submit Test',
    'test.time_left': 'Time Remaining',
    'test.question': 'Question',
    'test.of': 'of',
    'test.next': 'Next Question',
    'test.prev': 'Previous Question',
    'test.mark_review': 'Mark for Review',
    'test.clear_response': 'Clear Response',
    'test.answered': 'Answered',
    'test.not_answered': 'Not Answered',
    'test.marked': 'Marked for Review',
    'test.not_visited': 'Not Visited',
    'test.switch_lang': 'Question Language',
    'test.explanation': 'Detailed Explanation & Reference',

    // Reader & Protection
    'reader.eink': 'E-Ink Paper Mode',
    'reader.standard': 'Standard Mode',
    'reader.night': 'Night Mode',
    'reader.eye_comfort': 'Eye Comfort Mode',
    'reader.protected_notice': 'Protected TechClass Content • Unlicensed distribution is strictly prohibited',
    'reader.zoom_in': 'Zoom In',
    'reader.zoom_out': 'Zoom Out',
    'reader.bookmark_page': 'Bookmark Page',

    // Pricing & UPI
    'pricing.title': 'TechClass Annual Pass',
    'pricing.price': '₹2,999 / year',
    'pricing.upi_desc': 'Pay directly via Any UPI App (GPay, PhonePe, Paytm, BHIM) and submit your UTR reference for instant verification.',
    'pricing.submit_utr': 'Submit UTR Reference',
    'pricing.utr_placeholder': 'Enter 12-digit UTR number from bank SMS or app'
  },
  hi: {
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.courses': 'कोर्स',
    'nav.tests': 'मॉक टेस्ट',
    'nav.library': 'डिजिटल लाइब्रेरी',
    'nav.pricing': 'एनुअल पास',
    'nav.contact': 'संपर्क',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.admin': 'एडमिन पोर्टल',
    'nav.login': 'लॉगिन',
    'nav.register': 'निःशुल्क रजिस्टर करें',
    'nav.logout': 'लॉगआउट',
    'nav.profile': 'मेरी प्रोफाइल',
    'brand.tagline': 'सरकारी परीक्षा तैयारी के लिए आपकी डिजिटल कक्षा',
    'brand.supporting': 'सीखें। अभ्यास करें। दोहराएं। सुधारें।',

    'hero.title': 'सरकारी परीक्षा की तैयारी के लिए आपकी डिजिटल कक्षा',
    'hero.subtitle': 'हिंदी, मराठी और अंग्रेजी में पाठ्यक्रमों, मॉक टेस्ट और डिजिटल अध्ययन सामग्री के साथ सीखें, अभ्यास करें और सफल हों।',
    'hero.cta.free': 'निःशुल्क शुरू करें',
    'hero.cta.courses': 'कोर्स देखें',
    'hero.annual_offer': 'टेकक्लास एनुअल पास — ₹2,999/वर्ष संपूर्ण सामग्री के साथ',

    'benefit.gov': 'सरकारी परीक्षा उन्मुख तैयारी',
    'benefit.mock': 'वास्तविक परीक्षा पैटर्न मॉक टेस्ट',
    'benefit.pyq': 'पिछले वर्षों के हल प्रश्नपत्र',
    'benefit.pdf': 'डिजिटल लाइब्रेरी और ई-इंक रीडर',
    'benefit.multi': 'हिंदी / मराठी / अंग्रेजी माध्यम',
    'benefit.mobile': 'मोबाइल अनुकूल अध्ययन',
    'benefit.analytics': 'सटीक प्रदर्शन विश्लेषण',

    'common.free': 'मुफ्त',
    'common.premium': 'प्रीमियम पास',
    'common.view': 'देखें',
    'common.explore': 'विस्तार से देखें',
    'common.upgrade': 'अभी अपग्रेड करें',
    'common.search': 'कोर्स, टेस्ट और पीडीएफ खोजें...',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.submit': 'जमा करें',
    'common.loading': 'लोड हो रहा है...',
    'common.whatsapp_support': 'व्हाट्सएप सहायता',
    'common.licensed_to': 'अधिकृत छात्र',
    'common.student_id': 'स्टूडेंट आईडी',

    'test.start': 'टेस्ट शुरू करें',
    'test.resume': 'टेस्ट जारी रखें',
    'test.submit': 'टेस्ट सबमिट करें',
    'test.time_left': 'शेष समय',
    'test.question': 'प्रश्न',
    'test.of': 'का',
    'test.next': 'अगला प्रश्न',
    'test.prev': 'पिछला प्रश्न',
    'test.mark_review': 'समीक्षा के लिए चिन्हित करें',
    'test.clear_response': 'उत्तर हटाएं',
    'test.answered': 'उत्तर दिया',
    'test.not_answered': 'उत्तर नहीं दिया',
    'test.marked': 'समीक्षा हेतु चिन्हित',
    'test.not_visited': 'नहीं देखा',
    'test.switch_lang': 'प्रश्न भाषा',
    'test.explanation': 'विस्तृत समाधान व व्याख्या',

    'reader.eink': 'ई-इंक रीडिंग मोड',
    'reader.standard': 'सामान्य मोड',
    'reader.night': 'डार्क मोड',
    'reader.eye_comfort': 'आई-केयर मोड',
    'reader.protected_notice': 'सुरक्षित टेकक्लास सामग्री • अनधिकृत प्रतिलिपि या वितरण प्रतिबंधित है',
    'reader.zoom_in': 'बड़ा करें',
    'reader.zoom_out': 'छोटा करें',
    'reader.bookmark_page': 'पेज बुकमार्क करें',

    'pricing.title': 'टेकक्लास एनुअल पास',
    'pricing.price': '₹2,999 / वर्ष',
    'pricing.upi_desc': 'किसी भी यूपीआई ऐप (GPay, PhonePe, Paytm, BHIM) से भुगतान करें और त्वरित सत्यापन के लिए यूटीआर दर्ज करें।',
    'pricing.submit_utr': 'यूटीआर (UTR) दर्ज करें',
    'pricing.utr_placeholder': 'बैंक एसएमएस या ऐप से 12-अंकीय यूटीआर नंबर दर्ज करें'
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.about': 'आमच्याबद्दल',
    'nav.courses': 'कोर्सेस',
    'nav.tests': 'मॉक टेस्ट्स',
    'nav.library': 'डिजिटल लायब्ररी',
    'nav.pricing': 'अॅन्युअल पास',
    'nav.contact': 'संपर्क',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.admin': 'अॅडमिन पोर्टल',
    'nav.login': 'लॉगिन',
    'nav.register': 'मोफत नोंदणी',
    'nav.logout': 'बाहेर पडा',
    'nav.profile': 'माझे प्रोफाईल',
    'brand.tagline': 'शासकीय स्पर्धा परीक्षा तयारीसाठी तुमचा डिजिटल क्लासरूम',
    'brand.supporting': 'शिका. सराव करा. उजळणी करा. यशस्वी व्हा.',

    'hero.title': 'शासकीय स्पर्धा परीक्षा तयारीसाठी तुमचा डिजिटल क्लासरूम',
    'hero.subtitle': 'मराठी, हिंदी व इंग्रजी भाषेत परिपूर्ण अभ्यासक्रम, सर्वंकष मॉक टेस्ट्स आणि ई-इंक डिजिटल लायब्ररीसह यश निश्चित करा.',
    'hero.cta.free': 'मोफत सुरुवात करा',
    'hero.cta.courses': 'कोर्सेस पहा',
    'hero.annual_offer': 'टेकक्लास अॅन्युअल पास — ₹२,९९९/वर्ष संपूर्ण परीक्षेसाठी',

    'benefit.gov': 'एमपीएससी व शासकीय परीक्षा विशेष',
    'benefit.mock': 'अचूक परीक्षा पद्धती मॉक टेस्ट्स',
    'benefit.pyq': 'मागील वर्षांचे स्पष्टीकरणासह पेपर्स',
    'benefit.pdf': 'डिजिटल लायब्ररी व ई-इंक वाचन',
    'benefit.multi': 'मराठी / इंग्रजी / हिंदी माध्यम',
    'benefit.mobile': 'स्मार्टफोनवर सहज अभ्यास',
    'benefit.analytics': 'परफॉर्मन्स व रँक ट्रॅकिंग',

    'common.free': 'मोफत',
    'common.premium': 'अॅन्युअल पास',
    'common.view': 'पहा',
    'common.explore': 'तपशील',
    'common.upgrade': 'अपग्रेड करा',
    'common.search': 'कोर्स, टेस्ट आणि पीडीएफ शोधा...',
    'common.save': 'जतन करा',
    'common.cancel': 'रद्द करा',
    'common.submit': 'सबमिट करा',
    'common.loading': 'लोड होत आहे...',
    'common.whatsapp_support': 'व्हॉट्सअॅप सपोर्ट',
    'common.licensed_to': 'अधिकृत विद्यार्थी',
    'common.student_id': 'विद्यार्थी आयडी',

    'test.start': 'टेस्ट सुरू करा',
    'test.resume': 'टेस्ट सुरू ठेवा',
    'test.submit': 'टेस्ट सबमिट करा',
    'test.time_left': 'शिल्लक वेळ',
    'test.question': 'प्रश्न',
    'test.of': 'पैकी',
    'test.next': 'पुढील प्रश्न',
    'test.prev': 'मागील प्रश्न',
    'test.mark_review': 'पुनरावलोकनासाठी मार्क करा',
    'test.clear_response': 'उत्तर पुसा',
    'test.answered': 'उत्तर दिले',
    'test.not_answered': 'उत्तर दिले नाही',
    'test.marked': 'मार्क केलेले',
    'test.not_visited': 'न पाहिलेले',
    'test.switch_lang': 'प्रश्नाची भाषा',
    'test.explanation': 'सविस्तर स्पष्टीकरण व संदर्भ',

    'reader.eink': 'ई-इंक वाचन मोड',
    'reader.standard': 'सामान्य मोड',
    'reader.night': 'नाईट मोड',
    'reader.eye_comfort': 'आय कम्फर्ट मोड',
    'reader.protected_notice': 'संरक्षित टेकक्लास अभ्यास साहित्य • अनधिकृत वितरण व कॉपी करणे कायद्याने गुन्हा आहे',
    'reader.zoom_in': 'मोठे करा',
    'reader.zoom_out': 'लहान करा',
    'reader.bookmark_page': 'पान बुकमार्क करा',

    'pricing.title': 'टेकक्लास अॅन्युअल पास',
    'pricing.price': '₹२,९९९ / वर्ष',
    'pricing.upi_desc': 'कोणत्याही यूपीआय अॅपने (GPay, PhonePe, Paytm, BHIM) पैसे पाठवा आणि तात्काळ मंजुरीसाठी यूटीआर नंबर सबमिट करा.',
    'pricing.submit_utr': 'यूटीआर (UTR) नंबर सबमिट करा',
    'pricing.utr_placeholder': 'बँकेच्या मेसेजमधील १२ अंकी यूटीआर नंबर टाका'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('techclass_lang');
    return (saved as SupportedLanguage) || 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLangState(lang);
    localStorage.setItem('techclass_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
