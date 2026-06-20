import React from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 1. استيراد خطاف الترجمة

export default function OAuth() {
    const { t, i18n } = useTranslation(); // 2. تفعيل الترجام وإدارة اللغات
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleClick = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);

            const result = await signInWithPopup(auth, provider);

            // تذكر إضافة الـ Slash المائل '/' قبل الـ endpoint لتجنب مشاكل الـ Relative Paths
            const res = await fetch(`${window.API_BASE_URL}/api/auth/google`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    photo: result.user.photoURL
                }),
            });
            const data = await res.json();
            dispatch(signInSuccess(data));
            navigate('/');

        } catch (error) {
            console.log('Could not sign in with google', error);
        }
    };

    return (
        <button  
            onClick={handleGoogleClick}
            type='button'
            /* 3. تطبيق uppercase ديناميكياً بناءً على اللغة لضمان مظهر متناسق */
            className={`bg-red-700 text-white p-3 rounded-lg hover:opacity-95 transition-opacity ${
                i18n.language === 'en' ? 'uppercase' : ''
            }`}
        >
            {t('oauth.googleBtn', 'Continue with Google')}
        </button>
    );
}