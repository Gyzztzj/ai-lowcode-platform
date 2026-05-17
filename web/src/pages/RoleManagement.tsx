import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import RoleFormDialog from '@/components/roles/RoleFormDialog';
import api from '@/lib/axios';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = (await api.get('/roles')) as unknown as Role[];
      setRoles(data);
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast.error('加载失败', { description: '无法加载角色列表，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchRoles();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await api.delete(`/roles/${roleId}`);
      setRoles(roles.filter((r) => r.id !== roleId));
      toast.success('删除成功', { description: '角色已删除' });
      setIsDeleteDialogOpen(null);
    } catch (error) {
      console.error('删除角色失败:', error);
      toast.error('删除失败', {
        description: '无法删除角色，可能是系统角色或存在关联数据',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">角色管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理用户角色和权限</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加角色
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无角色</h3>
            <p className="text-gray-500 mb-4">添加您的第一个角色开始使用</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加角色
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${role.isSystem ? 'bg-blue-50' : 'bg-gray-100'}`}
                    >
                      <Shield
                        className={`h-5 w-5 ${role.isSystem ? 'text-blue-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            系统角色
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{role.permissions.length} 个权限</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      disabled={role.isSystem}
                      title={role.isSystem ? '系统角色不可编辑' : '编辑角色'}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteDialogOpen(role.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={role.isSystem}
                      title={role.isSystem ? '系统角色不可删除' : '删除角色'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {role.description && <p className="text-gray-600">{role.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {permission}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                        +{role.permissions.length - 5}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>创建时间: {formatDate(role.createdAt)}</p>
                    <p className="mt-1">更新时间: {formatDate(role.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoleFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        role={null}
        onSuccess={fetchRoles}
      />

      <RoleFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        role={selectedRole}
        onSuccess={fetchRoles}
      />

      <Dialog
        open={!!isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个角色吗？删除后将无法恢复，任何使用此角色的用户可能会受到影响。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => isDeleteDialogOpen && handleDeleteRole(isDeleteDialogOpen)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
