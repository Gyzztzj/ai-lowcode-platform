import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogContentScrollable,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSuccess?: () => void;
}

const ALL_PERMISSIONS = [
  { key: 'read:users', label: '读取用户', category: '用户管理' },
  { key: 'write:users', label: '创建/编辑用户', category: '用户管理' },
  { key: 'delete:users', label: '删除用户', category: '用户管理' },
  { key: 'read:apps', label: '读取应用', category: '应用管理' },
  { key: 'write:apps', label: '创建/编辑应用', category: '应用管理' },
  { key: 'delete:apps', label: '删除应用', category: '应用管理' },
  { key: 'execute:apps', label: '执行应用', category: '应用管理' },
  { key: 'read:knowledge', label: '读取知识库', category: '知识库' },
  { key: 'write:knowledge', label: '创建/编辑知识库', category: '知识库' },
  { key: 'delete:knowledge', label: '删除知识库', category: '知识库' },
  { key: 'read:audit', label: '读取审计日志', category: '系统' },
  { key: 'manage:api_keys', label: '管理API密钥', category: '系统' },
  { key: 'manage:settings', label: '管理设置', category: '系统' },
  { key: 'manage:quotas', label: '管理配额', category: '系统' },
  { key: 'read:models', label: '读取模型', category: '模型管理' },
  { key: 'write:models', label: '创建/编辑模型', category: '模型管理' },
  { key: 'delete:models', label: '删除模型', category: '模型管理' },
  { key: 'manage:roles', label: '管理角色', category: '权限管理' },
  { key: 'admin', label: '超级管理员', category: '权限管理' },
];

const RoleFormDialog = ({ open, onOpenChange, role, onSuccess }: RoleFormDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: [],
  });

  const updateFormData = useCallback((roleData: Role | null) => {
    if (roleData) {
      setFormData({
        name: roleData.name,
        description: roleData.description || '',
        permissions: [...roleData.permissions],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    updateFormData(role);
  }, [role, updateFormData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isSystemRole = role?.isSystem;

  const togglePermission = (permissionKey: string) => {
    if (isSystemRole) return;
    setFormData((prev) => {
      const hasPermission = prev.permissions.includes(permissionKey);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((p) => p !== permissionKey)
          : [...prev.permissions, permissionKey],
      };
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('请填写角色名称');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissions: formData.permissions,
      };

      if (role) {
        await api.patch(`/roles/${role.id}`, requestData);
      } else {
        await api.post('/roles', requestData);
      }

      toast.success(role ? '更新成功' : '创建成功', {
        description: role ? '角色已成功更新' : '角色已成功创建',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(role ? '更新失败' : '创建失败', {
        description: role ? '无法更新角色' : '无法创建角色',
      });
    } finally {
      setIsLoading(false);
    }
  }, [role, formData, onOpenChange, onSuccess]);

  const groupedPermissions = ALL_PERMISSIONS.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, typeof ALL_PERMISSIONS>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{role ? '编辑角色' : '创建角色'}</DialogTitle>
          <DialogDescription>
            {role
              ? isSystemRole
                ? '系统角色配置信息（不可修改）'
                : '编辑角色的名称和权限'
              : '创建一个新的角色并配置其权限'}
          </DialogDescription>
        </DialogHeader>

        <DialogContentScrollable>
          {isSystemRole && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2 mt-4">
              <p className="text-amber-700 text-sm">这是系统角色，您无法修改其配置。</p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="roleName">角色名称 *</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: 管理员、编辑、访客"
                className="mt-1"
                disabled={isSystemRole}
              />
            </div>

            <div>
              <Label htmlFor="description">描述 (可选)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="添加关于此角色的描述"
                className="mt-1"
                rows={3}
                disabled={isSystemRole}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                权限列表
                <span className="text-xs text-gray-400 font-normal">
                  ({formData.permissions.length} 已选)
                </span>
              </Label>
              <div className="mt-4 space-y-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((permission) => (
                        <label
                          key={permission.key}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            formData.permissions.includes(permission.key)
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          } ${isSystemRole ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <Checkbox
                            checked={formData.permissions.includes(permission.key)}
                            onChange={() => togglePermission(permission.key)}
                            disabled={isSystemRole}
                          />
                          <span className="text-sm text-gray-700">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContentScrollable>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '处理中...' : role ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleFormDialog;
