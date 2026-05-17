import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, '知识库名称不能为空').max(50, '知识库名称最多50个字符'),
  description: z.string().max(200, '描述最多200个字符').optional(),
});

type CreateKnowledgeBaseValues = z.infer<typeof createKnowledgeBaseSchema>;

const Knowledge = () => {
  const { knowledgeBases, fetchKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase } =
    useAppStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [knowledgeBaseToDelete, setKnowledgeBaseToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<CreateKnowledgeBaseValues>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  const handleCreate = async (values: CreateKnowledgeBaseValues) => {
    setIsCreating(true);
    try {
      await createKnowledgeBase(values.name, values.description || '');
      setIsCreateDialogOpen(false);
      form.reset();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">知识库管理</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建知识库
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建知识库</DialogTitle>
                <DialogDescription>创建一个新的知识库，用于存储和检索文档</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreate)}>
                <div className="space-y-4 py-4">
                  <FieldGroup className="px-4">
                    <Controller
                      name="name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="name">知识库名称</FieldLabel>
                          <Input
                            {...field}
                            id="name"
                            aria-invalid={fieldState.invalid}
                            placeholder="输入知识库名称"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="description"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="description">描述</FieldLabel>
                          <Textarea
                            {...field}
                            id="description"
                            aria-invalid={fieldState.invalid}
                            placeholder="输入知识库描述"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      form.reset();
                    }}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? '创建中...' : '创建'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {knowledgeBases.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <h3 className="text-lg font-medium mb-2">暂无知识库</h3>
            <p className="mb-4">创建您的第一个知识库开始使用RAG功能</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建知识库
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBases.map((kb) => (
              <Card key={kb.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle
                    className="text-lg cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/knowledge/${kb.id}`)}
                  >
                    {kb.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {kb.description || '暂无描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    <p>文档数量: {kb._count?.documents ?? 0}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => {
                      setKnowledgeBaseToDelete(kb.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="删除知识库"
        description="确定要删除这个知识库吗？所有文档和向量都将被删除"
        onConfirm={() => {
          if (knowledgeBaseToDelete) {
            deleteKnowledgeBase(knowledgeBaseToDelete);
          }
        }}
      />
    </>
  );
};

export default Knowledge;
