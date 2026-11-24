import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: {
    'nav.dashboard': 'Dashboard', 'nav.requests': 'My Requests', 'nav.newRequest': 'New Request',
    'nav.appointments': 'Appointments', 'nav.documents': 'Documents', 'nav.payments': 'Payments & receipts',
    'nav.profile': 'Profile & settings', 'nav.help': 'Help & support', 'nav.services': 'Browse Services',
    'nav.overview': 'Overview', 'nav.allRequests': 'All Requests', 'nav.serviceAdmin': 'Services',
    'nav.users': 'Users', 'nav.feedback': 'Feedback', 'nav.exports': 'Data exports',
    'ui.welcome': 'Welcome back', 'ui.notifications': 'Notifications',
    'ui.lightTheme': 'Switch to light theme', 'ui.darkTheme': 'Switch to dark theme', 'ui.language': 'Language',
  } },
  hi: { translation: {
    'nav.dashboard': 'डैशबोर्ड', 'nav.requests': 'मेरे आवेदन', 'nav.newRequest': 'नया आवेदन',
    'nav.appointments': 'अपॉइंटमेंट', 'nav.documents': 'दस्तावेज़', 'nav.payments': 'भुगतान और रसीदें',
    'nav.profile': 'प्रोफ़ाइल और सेटिंग', 'nav.help': 'सहायता', 'nav.services': 'सेवाएँ देखें',
    'nav.overview': 'अवलोकन', 'nav.allRequests': 'सभी आवेदन', 'nav.serviceAdmin': 'सेवाएँ',
    'nav.users': 'उपयोगकर्ता', 'nav.feedback': 'प्रतिक्रिया', 'nav.exports': 'डेटा निर्यात',
    'ui.welcome': 'वापस स्वागत है', 'ui.notifications': 'सूचनाएँ',
    'ui.lightTheme': 'लाइट थीम चुनें', 'ui.darkTheme': 'डार्क थीम चुनें', 'ui.language': 'भाषा',
  } },
  mr: { translation: {
    'nav.dashboard': 'डॅशबोर्ड', 'nav.requests': 'माझे अर्ज', 'nav.newRequest': 'नवीन अर्ज',
    'nav.appointments': 'भेटी', 'nav.documents': 'कागदपत्रे', 'nav.payments': 'पेमेंट आणि पावत्या',
    'nav.profile': 'प्रोफाइल आणि सेटिंग्ज', 'nav.help': 'मदत आणि सहाय्य', 'nav.services': 'सेवा पाहा',
    'nav.overview': 'आढावा', 'nav.allRequests': 'सर्व अर्ज', 'nav.serviceAdmin': 'सेवा',
    'nav.users': 'वापरकर्ते', 'nav.feedback': 'अभिप्राय', 'nav.exports': 'डेटा निर्यात',
    'ui.welcome': 'पुन्हा स्वागत आहे', 'ui.notifications': 'सूचना',
    'ui.lightTheme': 'लाइट थीम निवडा', 'ui.darkTheme': 'डार्क थीम निवडा', 'ui.language': 'भाषा',
  } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: (() => { try { return localStorage.getItem('sevasaathi-language') || 'en'; } catch { return 'en'; } })(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
