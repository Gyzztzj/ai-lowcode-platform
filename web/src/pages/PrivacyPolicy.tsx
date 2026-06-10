import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">隐私政策</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">最后更新日期：2026年6月9日</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 信息收集</h2>
            <p className="text-gray-600 leading-relaxed">
              我们仅收集提供 AI 低代码平台服务所必需的信息，包括：
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>账户信息：邮箱地址、用户名（用于账户创建和认证）</li>
              <li>使用数据：应用配置、对话记录、API 调用日志（用于提供和改进服务）</li>
              <li>技术数据：IP 地址、浏览器类型、设备信息（用于安全防护和性能优化）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 信息使用</h2>
            <p className="text-gray-600 leading-relaxed mb-2">我们使用收集的信息用于以下目的：</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>提供、维护和改进 AI 低代码平台服务</li>
              <li>处理用户请求并发送服务相关通知</li>
              <li>监控服务使用情况，检测和防止安全威胁</li>
              <li>遵守法律法规要求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 数据存储与安全</h2>
            <p className="text-gray-600 leading-relaxed">
              我们采用行业标准的安全措施保护您的数据。用户密码使用 bcrypt 加密存储，API 密钥使用安全随机生成。
              数据传输使用 HTTPS 加密。我们仅在提供服务所需的最短期限内保留您的数据。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cookie 使用</h2>
            <p className="text-gray-600 leading-relaxed">
              我们使用必要的 Cookie 来维持您的登录会话和偏好设置。这些 Cookie 对于服务的正常运行是必需的。
              我们不会使用 Cookie 进行广告跟踪或行为分析。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 第三方服务</h2>
            <p className="text-gray-600 leading-relaxed">
              本平台集成了 AI 模型提供商的 API（如 OpenAI、豆包等），您在创建应用时使用的第三方模型将遵循对应
              服务商的隐私政策。我们建议您查阅相关服务商的隐私政策以了解其数据处理方式。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 用户权利</h2>
            <p className="text-gray-600 leading-relaxed mb-2">您对您的个人数据享有以下权利：</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>访问和导出您的数据</li>
              <li>更正不准确的信息</li>
              <li>删除您的账户和相关数据</li>
              <li>撤回同意（不影响撤回前基于同意的处理合法性）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. 联系我们</h2>
            <p className="text-gray-600 leading-relaxed">
              如果您对本隐私政策有任何疑问或建议，请通过平台内联系方式与我们联系。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;