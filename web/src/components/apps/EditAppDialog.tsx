import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { App } from "@/types";
import { useAppStore } from "@/store/appStore";
import {
  Dialog,
  DialogContent,
  DialogContentScrollable,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const appSchema = z.object({
  name: z.string().min(2, "名称至少2个字符").max(50, "名称最多50个字符"),
  description: z.string().max(200, "描述最多200个字符").optional(),
  systemPrompt: z.string().max(1000, "系统提示最多1000个字符").optional(),
  defaultModel: z.string(),
  embeddingModel: z.string(),
});

type AppFormValues = z.infer<typeof appSchema>;

interface EditAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: App | null;
}

const EditAppDialog = ({ open, onOpenChange, app }: EditAppDialogProps) => {
  const createApp = useAppStore((state) => state.createApp);
  const updateApp = useAppStore((state) => state.updateApp);
  const models = useAppStore((state) => state.models);

  // 筛选模型并缓存
  const chatModels = useMemo(() => {
    return models.filter(
      (model) => model.type !== "EMBEDDING" && model.enabled,
    );
  }, [models]);

  const embeddingModels = useMemo(() => {
    return models.filter(
      (model) => model.type === "EMBEDDING" && model.enabled,
    );
  }, [models]);

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "你是一个有用的AI助手",
      defaultModel: chatModels[0]?.id || "",
      embeddingModel: "none",
    },
  });

  // 只在 app, chatModels 变化时重置，form 不要放在依赖里
  useEffect(() => {
    if (!open) return;

    if (app) {
      form.reset({
        name: app.name,
        description: app.description || "",
        systemPrompt: app.systemPrompt,
        defaultModel: app.defaultModel,
        embeddingModel: app.embeddingModel || "none",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        systemPrompt: "你是一个有用的AI助手",
        defaultModel: chatModels[0]?.id || "",
        embeddingModel: "none",
      });
    }
  }, [app, open, form, chatModels]);

  const onSubmit = async (values: AppFormValues) => {
    try {
      if (app) {
        await updateApp(app.id, values);
        toast.success("更新成功", {
          description: "应用信息已更新",
        });
      } else {
        await createApp(values);
        toast.success("创建成功", {
          description: "新应用已创建",
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("保存应用失败:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{app ? "编辑应用" : "创建应用"}</DialogTitle>
          <DialogDescription>
            {app ? "修改应用的基本信息" : "创建一个新的AI应用"}
          </DialogDescription>
        </DialogHeader>

        <DialogContentScrollable>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">应用名称</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={fieldState.invalid}
                      placeholder="输入应用名称"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">应用描述</FieldLabel>
                    <Input
                      {...field}
                      id="description"
                      aria-invalid={fieldState.invalid}
                      placeholder="输入应用描述"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="systemPrompt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="systemPrompt">系统提示词</FieldLabel>
                    <Textarea
                      {...field}
                      id="systemPrompt"
                      aria-invalid={fieldState.invalid}
                      placeholder="定义AI助手的角色和行为"
                      className="min-h-[100px]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="defaultModel"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="defaultModel">默认模型</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="defaultModel"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="选择默认模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {chatModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name} ({model.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                    {chatModels.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        请先在模型管理中添加可用的模型
                      </p>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="embeddingModel"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="embeddingModel">向量模型</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="embeddingModel"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="不使用向量模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不使用向量模型</SelectItem>
                        {embeddingModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                    {embeddingModels.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        如需使用知识库检索，请先在模型管理中添加向量模型
                      </p>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </DialogContentScrollable>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {app ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppDialog;
