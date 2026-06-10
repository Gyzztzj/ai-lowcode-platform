import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'cookie-consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(COOKIE_CONSENT_KEY);
  });

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="hidden sm:flex p-2 rounded-lg bg-amber-50 shrink-0">
            <Cookie className="h-6 w-6 text-amber-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-relaxed">
              本网站使用必要的 Cookie 来维持登录会话和偏好设置，以确保服务的正常运行。
              我们不会将 Cookie 用于广告追踪或行为分析。
              继续使用即表示您同意我们的
              <Link
                to="/privacy-policy"
                className="text-blue-600 hover:underline mx-1"
                onClick={() => setVisible(false)}
              >
                隐私政策
              </Link>
              。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="text-gray-500"
            >
              <X className="h-4 w-4 mr-1" />
              拒绝
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
            >
              接受
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;