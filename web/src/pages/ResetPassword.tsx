import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, '密码至少6个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ token: string }>();

  const token = params.token;
  const tokenValid = !!token;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      setErrorMessage(null);
      setIsSubmitting(true);
      await authApi.resetPassword({ token: token!, newPassword: values.password });
      toast.success('密码重置成功', {
        description: '正在跳转到登录页面...',
      });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: unknown) {
      console.error('ResetPassword: 请求失败:', error);
      const errMsg =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : '密码重置失败，请检查链接是否有效';
      setErrorMessage(errMsg);
      toast.error('密码重置失败', {
        description: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Alert className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">链接无效</p>
            <p className="text-sm text-gray-500 mb-4">密码重置链接无效或已过期，请重新申请</p>
            <Button onClick={handleBack}>返回登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div
            className="flex items-center gap-2"
            onClick={handleBack}
            style={{ cursor: 'pointer' }}
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">返回登录</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center mt-4">重置密码</CardTitle>
          <CardDescription className="text-center">输入新密码完成重置</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
            <FieldGroup>
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">新密码</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入新密码"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirmPassword">确认密码</FieldLabel>
                    <Input
                      {...field}
                      id="confirmPassword"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="请再次输入密码"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '重置中...' : '重置密码'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            记得密码了？{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              返回登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
