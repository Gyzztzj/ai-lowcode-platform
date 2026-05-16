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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Users, AppWindow } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface UserFromApi {
  id: string;
  email: string;
  name: string;
}

interface UserQuota {
  id: string;
  email: string;
  name: string;
  dailyQuota: number;
  monthlyQuota: number;
  dailyUsed: number;
  monthlyUsed: number;
}

interface AppFromApi {
  id: string;
  name: string;
  userId: string;
  dailyQuota: number | null;
  monthlyQuota: number | null;
}

interface AppQuota {
  id: string;
  name: string;
  userId: string;
  dailyQuota: number | null;
  monthlyQuota: number | null;
}

const QuotaManagement = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'apps'>('users');
  const [users, setUsers] = useState<UserQuota[]>([]);
  const [apps, setApps] = useState<AppQuota[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserQuota | AppQuota | null>(null);
  const [formData, setFormData] = useState({
    dailyQuota: '',
    monthlyQuota: '',
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userList: UserFromApi[] = await api.get('/users');
      const usersWithQuota: UserQuota[] = await Promise.all(
        userList.map(async (user: UserFromApi) => {
          const quotaData = await api.get(`/quota/user/${user.id}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name || '未命名',
            dailyQuota: quotaData.dailyQuota,
            monthlyQuota: quotaData.monthlyQuota,
            dailyUsed: quotaData.dailyUsed,
            monthlyUsed: quotaData.monthlyUsed,
          };
        }),
      );
      setUsers(usersWithQuota);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('加载失败', { description: '无法加载用户列表' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const appList: AppFromApi[] = await api.get('/apps');
      const appsWithQuota: AppQuota[] = appList.map((app: AppFromApi) => ({
        id: app.id,
        name: app.name,
        userId: app.userId,
        dailyQuota: app.dailyQuota,
        monthlyQuota: app.monthlyQuota,
      }));
      setApps(appsWithQuota);
    } catch (error) {
      console.error('获取应用列表失败:', error);
      toast.error('加载失败', { description: '无法加载应用列表' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchApps();
    }
  }, [activeTab, fetchUsers, fetchApps]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleEdit = (item: UserQuota | AppQuota) => {
    setSelectedItem(item);
    setFormData({
      dailyQuota: String(item.dailyQuota || ''),
      monthlyQuota: String(item.monthlyQuota || ''),
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    const dailyQuota = parseInt(formData.dailyQuota) || 0;
    const monthlyQuota = parseInt(formData.monthlyQuota) || 0;

    if (dailyQuota < 0 || monthlyQuota < 0) {
      toast.error('配额值不能为负数');
      return;
    }

    setIsLoading(true);
    try {
      if ('email' in selectedItem) {
        await api.put(`/quota/user/${selectedItem.id}`, { dailyQuota, monthlyQuota });
      } else {
        await api.put(`/quota/app/${selectedItem.id}`, { dailyQuota, monthlyQuota });
      }

      toast.success('更新成功', { description: '配额已成功更新' });
      setIsEditDialogOpen(false);
      setSelectedItem(null);

      if (activeTab === 'users') {
        fetchUsers();
      } else {
        fetchApps();
      }
    } catch (error) {
      console.error('更新配额失败:', error);
      toast.error('更新失败', { description: '无法更新配额' });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateUsagePercent = (used: number, quota: number) => {
    if (quota === 0) return 0;
    return Math.min((used / quota) * 100, 100);
  };

  const getUsageStatus = (percent: number) => {
    if (percent >= 90) return { color: 'bg-red-500', label: '即将用尽' };
    if (percent >= 70) return { color: 'bg-amber-500', label: '较高' };
    if (percent >= 40) return { color: 'bg-yellow-500', label: '正常' };
    return { color: 'bg-green-500', label: '充足' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">配额管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理用户和应用的API调用配额</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          className="rounded-md"
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          用户配额
        </Button>
        <Button
          variant={activeTab === 'apps' ? 'default' : 'ghost'}
          className="rounded-md"
          onClick={() => setActiveTab('apps')}
        >
          <AppWindow className="h-4 w-4 mr-2" />
          应用配额
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'users' &&
            users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">每日配额</span>
                        <span className="font-medium">
                          {user.dailyUsed} / {user.dailyQuota}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageStatus(calculateUsagePercent(user.dailyUsed, user.dailyQuota)).color} transition-all`}
                          style={{
                            width: `${calculateUsagePercent(user.dailyUsed, user.dailyQuota)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          剩余: {Math.max(0, user.dailyQuota - user.dailyUsed)}
                        </span>
                        <span
                          className={`text-xs ${
                            calculateUsagePercent(user.dailyUsed, user.dailyQuota) >= 90
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {
                            getUsageStatus(calculateUsagePercent(user.dailyUsed, user.dailyQuota))
                              .label
                          }
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">每月配额</span>
                        <span className="font-medium">
                          {user.monthlyUsed} / {user.monthlyQuota}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageStatus(calculateUsagePercent(user.monthlyUsed, user.monthlyQuota)).color} transition-all`}
                          style={{
                            width: `${calculateUsagePercent(user.monthlyUsed, user.monthlyQuota)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          剩余: {Math.max(0, user.monthlyQuota - user.monthlyUsed)}
                        </span>
                        <span
                          className={`text-xs ${
                            calculateUsagePercent(user.monthlyUsed, user.monthlyQuota) >= 90
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {
                            getUsageStatus(
                              calculateUsagePercent(user.monthlyUsed, user.monthlyQuota),
                            ).label
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {activeTab === 'apps' &&
            apps.map((app) => (
              <Card key={app.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription>应用配额设置</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(app)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">每日配额</span>
                      <span className="font-medium">{app.dailyQuota ?? '继承用户'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">每月配额</span>
                      <span className="font-medium">{app.monthlyQuota ?? '继承用户'}</span>
                    </div>
                    {!app.dailyQuota && !app.monthlyQuota && (
                      <p className="text-xs text-gray-500">当前使用用户级配额限制</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{activeTab === 'users' ? '编辑用户配额' : '编辑应用配额'}</DialogTitle>
            <DialogDescription>
              设置{activeTab === 'users' ? '用户' : '应用'}的每日和每月API调用配额
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dailyQuota" className="block text-sm font-medium text-gray-700">
                每日配额
              </Label>
              <Input
                id="dailyQuota"
                type="number"
                value={formData.dailyQuota}
                onChange={(e) => setFormData({ ...formData, dailyQuota: e.target.value })}
                placeholder="例如: 1000"
                className="w-full"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyQuota" className="block text-sm font-medium text-gray-700">
                每月配额
              </Label>
              <Input
                id="monthlyQuota"
                type="number"
                value={formData.monthlyQuota}
                onChange={(e) => setFormData({ ...formData, monthlyQuota: e.target.value })}
                placeholder="例如: 30000"
                className="w-full"
                min="0"
              />
            </div>
            {activeTab === 'apps' && (
              <p className="text-xs text-gray-500">留空表示继承用户配额设置</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
              }}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotaManagement;
