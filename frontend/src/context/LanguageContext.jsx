import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'nexcart_lang';

export const LANGUAGES = [
  { code: 'EN', label: 'English', flag: '🇺🇸', locale: 'en' },
  { code: 'HI', label: 'हिन्दी', flag: '🇮🇳', locale: 'hi' },
  { code: 'TA', label: 'தமிழ்', flag: '🇮🇳', locale: 'ta' },
  { code: 'TE', label: 'తెలుగు', flag: '🇮🇳', locale: 'te' },
];

const TRANSLATIONS = {
  EN: {
    deliverTo: 'Deliver to',
    searchPlaceholder: 'Search NexCart…',
    language: 'Language',
    currentLocation: 'Current location:',
    detectMyLocation: 'Detect My Location',
    detecting: 'Detecting…',
    todaysDeals: 'Today\'s Deals',
    returns: 'Returns',
    account: 'Account',
    cart: 'Cart',
    newSeason: 'New Season',
    fashionThatDefinesYou: 'Fashion That Defines You',
    curatedCollections: 'Curated collections from global brands delivered right to your door.',
    shopFashion: 'Shop Fashion',
    newArrivals: 'New Arrivals',
    seeAllDeals: 'See All Deals →',
    freeDelivery: 'Free Delivery',
    securePayment: 'Secure Payment',
    easyReturns: 'Easy Returns',
    fastDelivery: 'Fast Delivery',
    shopByCategory: 'Shop by Category',
    availableOffers: 'Available Offers',
    inStock: 'In Stock',
    currentlyUnavailable: 'Currently Unavailable',
    outOfStock: 'Out of Stock',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    useCurrentLocation: 'Use My Current Location',
    deliveryAddress: 'Delivery Address',
    fullName: 'Full Name',
    phone: 'Phone',
    address: 'Address',
    cityDistrict: 'City / District',
    pinCode: 'PIN Code',
    state: 'State',
    country: 'Country',
    saveAddress: 'Save Address & Continue',
    browse: 'Browse',
  },
  HI: {
    deliverTo: 'भेजें',
    searchPlaceholder: 'NexCart में खोजें…',
    language: 'भाषा',
    currentLocation: 'वर्तमान स्थान:',
    detectMyLocation: 'मेरा स्थान पता करें',
    detecting: 'पता लगाया जा रहा है…',
    todaysDeals: 'आज के ऑफ़र',
    returns: 'वापसी',
    account: 'खाता',
    cart: 'कार्ट',
    newSeason: 'नया सीज़न',
    fashionThatDefinesYou: 'फैशन जो आपको परिभाषित करता है',
    curatedCollections: 'वैश्विक ब्रांडों के चुने हुए कलेक्शन सीधे आपके दरवाज़े तक।',
    shopFashion: 'फैशन खरीदें',
    newArrivals: 'नई लॉन्च',
    seeAllDeals: 'सभी ऑफ़र देखें →',
    freeDelivery: 'मुफ़्त डिलीवरी',
    securePayment: 'सुरक्षित भुगतान',
    easyReturns: 'आसान रिटर्न',
    fastDelivery: 'तेज़ डिलीवरी',
    shopByCategory: 'श्रेणी के अनुसार खरीदें',
    availableOffers: 'उपलब्ध ऑफ़र',
    inStock: 'स्टॉक में उपलब्ध',
    currentlyUnavailable: 'अभी उपलब्ध नहीं',
    outOfStock: 'स्टॉक समाप्त',
    addToCart: 'कार्ट में जोड़ें',
    buyNow: 'अभी खरीदें',
    useCurrentLocation: 'मेरा वर्तमान स्थान उपयोग करें',
    deliveryAddress: 'डिलीवरी पता',
    fullName: 'पूरा नाम',
    phone: 'फ़ोन',
    address: 'पता',
    cityDistrict: 'शहर / ज़िला',
    pinCode: 'पिन कोड',
    state: 'राज्य',
    country: 'देश',
    saveAddress: 'पता सहेजें और जारी रखें',
    browse: 'ब्राउज़',
  },
  TA: {
    deliverTo: 'வழங்க வேண்டியது',
    searchPlaceholder: 'NexCart-இல் தேடவும்…',
    language: 'மொழி',
    currentLocation: 'தற்போதைய இடம்:',
    detectMyLocation: 'என் இருப்பிடத்தை கண்டறி',
    detecting: 'கண்டறிகிறது…',
    todaysDeals: 'இன்றைய சலுகைகள்',
    returns: 'திருப்பி அனுப்பு',
    account: 'கணக்கு',
    cart: 'வண்டி',
    newSeason: 'புதிய பருவம்',
    fashionThatDefinesYou: 'உங்களை வரையறுக்கும் ஃபாஷன்',
    curatedCollections: 'உலகளாவிய பிராண்டுகளின் தேர்ந்தெடுக்கப்பட்ட சேகரிப்புகள் உங்கள் வீட்டுக்கே.',
    shopFashion: 'ஃபாஷனை வாங்கவும்',
    newArrivals: 'புதிய வரவுகள்',
    seeAllDeals: 'அனைத்து சலுகைகளையும் பார்க்க →',
    freeDelivery: 'இலவச டெலிவரி',
    securePayment: 'பாதுகாப்பான கட்டணம்',
    easyReturns: 'எளிய திருப்பி அனுப்பு',
    fastDelivery: 'விரைவு டெலிவரி',
    shopByCategory: 'வகை வாரியாக வாங்கவும்',
    availableOffers: 'கிடைக்கும் சலுகைகள்',
    inStock: 'கையிருப்பில் உள்ளது',
    currentlyUnavailable: 'தற்சமயம் கிடைக்கவில்லை',
    outOfStock: 'கையிருப்பு இல்லை',
    addToCart: 'வண்டியில் சேர்',
    buyNow: 'இப்போதே வாங்கவும்',
    useCurrentLocation: 'என் தற்போதைய இருப்பிடத்தை பயன்படுத்து',
    deliveryAddress: 'விநியோக முகவரி',
    fullName: 'முழுப் பெயர்',
    phone: 'தொலைபேசி',
    address: 'முகவரி',
    cityDistrict: 'நகரம் / மாவட்டம்',
    pinCode: 'அஞ்சல் குறியீடு',
    state: 'மாநிலம்',
    country: 'நாடு',
    saveAddress: 'முகவரியைச் சேமித்து தொடரவும்',
    browse: 'உலாவு',
  },
  TE: {
    deliverTo: 'వితరణ',
    searchPlaceholder: 'NexCart‌లో వెతకండి…',
    language: 'భాష',
    currentLocation: 'ప్రస్తుత స్థానం:',
    detectMyLocation: 'నా స్థలాన్ని గుర్తించు',
    detecting: 'గుర్తిస్తోంది…',
    todaysDeals: 'ఈ రోజు ఆఫర్లు',
    returns: 'రిటర్న్స్',
    account: 'ఖాతా',
    cart: 'కార్ట్',
    newSeason: 'కొత్త సీజన్',
    fashionThatDefinesYou: 'మీని నిర్వచించే ఫ్యాషన్',
    curatedCollections: 'ప్రపంచ బ్రాండ్ల ప్రత్యేక సేకరణలు నేరుగా మీ ఇంటికే.',
    shopFashion: 'ఫ్యాషన్ కొనండి',
    newArrivals: 'కొత్త రాకలు',
    seeAllDeals: 'అన్ని డీల్స్ చూడండి →',
    freeDelivery: 'ఉచిత డెలివరీ',
    securePayment: 'సురక్షిత చెల్లింపు',
    easyReturns: 'సులభమైన రిటర్న్స్',
    fastDelivery: 'వేగవంతమైన డెలివరీ',
    shopByCategory: 'వర్గం ప్రకారం కొనండి',
    availableOffers: 'అందుబాటులో ఉన్న ఆఫర్లు',
    inStock: 'స్టాక్‌లో ఉంది',
    currentlyUnavailable: 'ప్రస్తుతం అందుబాటులో లేదు',
    outOfStock: 'స్టాక్ లేదు',
    addToCart: 'కార్ట్‌లో చేర్చు',
    buyNow: 'ఇప్పుడే కొనండి',
    useCurrentLocation: 'నా ప్రస్తుత స్థానాన్ని ఉపయోగించు',
    deliveryAddress: 'డెలివరీ చిరునామా',
    fullName: 'పూర్తి పేరు',
    phone: 'ఫోన్',
    address: 'చిరునామా',
    cityDistrict: 'నగరం / జిల్లా',
    pinCode: 'పిన్ కోడ్',
    state: 'రాష్ట్రం',
    country: 'దేశం',
    saveAddress: 'చిరునామా సేవ్ చేసి కొనసాగించండి',
    browse: 'బ్రౌజ్',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'EN');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    const locale = LANGUAGES.find((item) => item.code === language)?.locale || 'en';
    document.documentElement.lang = locale;
    api.defaults.headers.common['Accept-Language'] = locale;
  }, [language]);

  const value = useMemo(() => {
    const t = (key, fallback = key) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.EN[key] || fallback;
    return {
      language,
      setLanguage: setLanguageState,
      languages: LANGUAGES,
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
