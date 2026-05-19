import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import { authApi } from "@/lib/api-client";
import { Mail, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setErrorMessage(null);
      setIsSubmitting(true);
      await authApi.requestPasswordReset({ email: values.email });
      setSuccessMessage("密码重置链接已发送到您的邮箱，请查收邮件");
      toast.success("邮件已发送", {
        description: "请检查您的邮箱获取密码重置链接",
      });
    } catch (error: unknown) {
      console.error("ForgotPassword: 请求失败:", error);
      const errMsg =
        (error && typeof error === "object" && "response" in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string")
          ? (error as { response: { data: { message: string } } }).response.data.message
          : "请求失败，请稍后重试";
      setErrorMessage(errMsg);
      toast.error("请求失败", {
        description: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2" onClick={handleBack} style={{ cursor: 'pointer' }}>
            <ArrowLeft className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">返回登录</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center mt-4">找回密码</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱地址，我们将发送密码重置链接
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">{successMessage}</p>
              <p className="text-sm text-gray-500 mt-2">
                如果没有收到邮件，请检查垃圾邮件文件夹
              </p>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">{errorMessage}</Alert>
              )}
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">邮箱</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        aria-invalid={fieldState.invalid}
                        placeholder="admin@example.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "发送中..." : "发送重置链接"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            记得密码了？{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              返回登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;