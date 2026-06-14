import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next"; // 1. استيراد خطاف الترجمة
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";

function Footer() {
  const { t, i18n } = useTranslation(); // 2. تفعيل الترجام وإدارة اللغات

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* القسم الرئيسي: شبكة الروابط والـ Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        
        {/* العمود 1: عن الشركة واللوجو */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Link
            to="/"
            className="text-2xl font-extrabold text-white tracking-tight"
          >
            Sahand<span className="text-blue-500">Estate</span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            {t(
              "footer.aboutDesc",
              "The leading marketplace to find your next perfect place to live. We make buying, renting, and selling real estate simple, transparent, and seamless."
            )}
          </p>
          {/* أيقونات التواصل الاجتماعي */}
          <div className="flex gap-3 mt-2">
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white text-slate-400 transition-all duration-300"
            >
              <FaFacebookF size={14} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white text-slate-400 transition-all duration-300"
            >
              <FaInstagram size={14} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white text-slate-400 transition-all duration-300"
            >
              <FaTwitter size={14} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white text-slate-400 transition-all duration-300"
            >
              <FaLinkedinIn size={14} />
            </a>
          </div>
        </div>

        {/* العمود 2: روابط سريعة */}
        <div className="flex flex-col gap-4">
          <h4 className={`text-sm font-bold text-white ${i18n.language === "en" ? "uppercase tracking-wider" : ""}`}>
            {t("footer.quickLinks", "Quick Links")}
          </h4>
          <ul className="flex flex-col gap-2.5 text-sm font-medium">
            <li>
              <Link to="/" className="hover:text-blue-400 transition-colors">
                {t("footer.home", "Home")}
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="hover:text-blue-400 transition-colors"
              >
                {t("footer.aboutUs", "About Us")}
              </Link>
            </li>
            <li>
              <Link
                to="/search"
                className="hover:text-blue-400 transition-colors"
              >
                {t("footer.findProperties", "Find Properties")}
              </Link>
            </li>
            <li>
              <Link
                to="/search?offer=true"
                className="hover:text-blue-400 transition-colors"
              >
                {t("footer.latestOffers", "Latest Offers")}
              </Link>
            </li>
          </ul>
        </div>

        {/* العمود 3: معلومات التواصل */}
        <div className="flex flex-col gap-4">
          <h4 className={`text-sm font-bold text-white ${i18n.language === "en" ? "uppercase tracking-wider" : ""}`}>
            {t("footer.contactUs", "Contact Us")}
          </h4>
          <ul className="flex flex-col gap-3 text-sm text-slate-400 font-medium">
            <li className="flex items-start gap-2.5">
              <MdLocationOn
                className="text-blue-500 mt-0.5 flex-shrink-0"
                size={18}
              />
              <span dir="ltr">{t("footer.addressValue", "123 Real Estate Ave, Riyadh, Saudi Arabia")}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FaPhoneAlt className="text-blue-500 flex-shrink-0" size={14} />
              <span dir="ltr">+1 (234) 567-890</span>
            </li>
            <li className="flex items-center gap-2.5">
              <FaEnvelope className="text-blue-500 flex-shrink-0" size={14} />
              <span>support@sahandestate.com</span>
            </li>
          </ul>
        </div>

        {/* العمود 4: صندوق الاشتراك المطور */}
        <div className="flex flex-col gap-4">
          <h4 className={`text-sm font-bold text-white ${i18n.language === "en" ? "uppercase tracking-wider" : ""}`}>
            {t("footer.newsletter", "Newsletter")}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t("footer.newsletterDesc", "Subscribe to receive our latest property updates and market trends.")}
          </p>
          <form
            className="flex flex-col gap-2 mt-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder={t("footer.emailPlaceholder", "Your email address")}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10">
              {t("footer.subscribeBtn", "Subscribe Now")}
            </button>
          </form>
        </div>
      </div>

      {/* القسم السفلي: حقوق الملكية */}
      <div className="border-t border-slate-800 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>
            {t("footer.copyrights", {
              year: new Date().getFullYear(),
              defaultValue: `© ${new Date().getFullYear()} Sahand Estate. All rights reserved.`,
            })}
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">
              {t("footer.privacyPolicy", "Privacy Policy")}
            </a>
            <a href="#" className="hover:text-slate-400 transition-colors">
              {t("footer.termsOfService", "Terms of Service")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;