import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Clock,
  Star,
  Zap,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  statsApi,
  type TokenUsageStats,
  type CostStats,
  type ApplicationEffectSummary,
  type DailyCostStats,
  type ModelCostStats,
} from '@/lib/api-client';

const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendUp,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string | number;
  trend?: string;
  trendUp?: boolean;
}) => (
  <Card className="transition-all duration-300 hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-blue-50">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        {trend && (
          <Badge variant={trendUp ? 'default' : 'destructive'} className="text-xs">
            {trendUp ? '↑' : '↓'} {trend}
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
      </div>
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </CardContent>
  </Card>
);

interface ChartItem {
  [key: string]: string | number;
}

const SimpleChart = ({
  data,
  labelKey,
  valueKey,
  color,
}: {
  data: ChartItem[];
  labelKey: string;
  valueKey: string;
  color: string;
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">暂无数据</div>;
  }

  const maxValue = Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.slice(-7).map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col items-center justify-end h-24">
            <div
              className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
              style={{
                backgroundColor: color,
                height: `${(item[valueKey] / maxValue) * 100}%`,
                minHeight: item[valueKey] > 0 ? '4px' : '0',
              }}
            />
          </div>
          <span className="text-xs text-gray-500 truncate w-full text-center">
            {item[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Statistics() {
  const [tokenStats, setTokenStats] = useState<TokenUsageStats | null>(null);
  const [costStats, setCostStats] = useState<CostStats | null>(null);
  const [effectSummary, setEffectSummary] = useState<ApplicationEffectSummary | null>(null);
  const [dailyCostStats, setDailyCostStats] = useState<DailyCostStats[]>([]);
  const [modelCostStats, setModelCostStats] = useState<ModelCostStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [token, cost, effect, dailyCost, modelCost] = await Promise.all([
          statsApi.getTokenStats(),
          statsApi.getCostStats(),
          statsApi.getApplicationEffectSummary(),
          statsApi.getDailyCostStats({ days: '14' }),
          statsApi.getModelCostStats(),
        ]);
        setTokenStats(token);
        setCostStats(cost);
        setEffectSummary(effect);
        setDailyCostStats(dailyCost);
        setModelCostStats(modelCost);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据分析面板</h1>
        <Badge variant="outline" className="text-sm">
          实时更新
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="cost">成本核算</TabsTrigger>
          <TabsTrigger value="effect">效果分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BarChart3}
              label="总令牌消耗"
              value={tokenStats?.totalTokens.toLocaleString() || 0}
              subValue={`Prompt: ${tokenStats?.promptTokens.toLocaleString() || 0}`}
              trend="12%"
              trendUp
            />
            <StatCard
              icon={MessageSquare}
              label="请求次数"
              value={tokenStats?.requestCount.toLocaleString() || 0}
              subValue={`Completion: ${tokenStats?.completionTokens.toLocaleString() || 0}`}
              trend="8%"
              trendUp
            />
            <StatCard
              icon={DollarSign}
              label="累计花费"
              value={`$${costStats?.totalCost.toFixed(4) || '0.00'}`}
              subValue={`本月: $${costStats?.totalCost.toFixed(4) || '0.00'}`}
              trend="5%"
              trendUp={false}
            />
            <StatCard
              icon={Activity}
              label="活跃应用"
              value={effectSummary?.overview.appCount || 0}
              subValue={`对话数: ${effectSummary?.overview.totalConversations || 0}`}
              trend="3%"
              trendUp
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  近7日令牌消耗趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={dailyCostStats}
                  labelKey="date"
                  valueKey="totalTokens"
                  color="#3B82F6"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  近7日成本趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={dailyCostStats}
                  labelKey="date"
                  valueKey="totalCost"
                  color="#10B981"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                模型消耗排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelCostStats.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-8 text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{item.model || '未知模型'}</span>
                        <span className="text-sm text-gray-500">${item.totalCost.toFixed(4)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{
                            width: `${(item.totalCost / Math.max(...modelCostStats.map((m) => m.totalCost), 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="总花费"
              value={`$${costStats?.totalCost.toFixed(4) || '0.00'}`}
              subValue="累计支出"
            />
            <StatCard
              icon={BarChart3}
              label="Prompt花费"
              value={`$${costStats?.promptCost.toFixed(4) || '0.00'}`}
              subValue={`${costStats ? ((costStats.promptCost / costStats.totalCost) * 100).toFixed(1) : 0}% 占比`}
            />
            <StatCard
              icon={MessageSquare}
              label="Completion花费"
              value={`$${costStats?.completionCost.toFixed(4) || '0.00'}`}
              subValue={`${costStats ? ((costStats.completionCost / costStats.totalCost) * 100).toFixed(1) : 0}% 占比`}
            />
            <StatCard
              icon={Activity}
              label="每千令牌成本"
              value={`$${costStats ? (costStats.totalCost / (costStats.totalTokens / 1000)).toFixed(4) : '0.00'}`}
              subValue="平均单价"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  近14日每日成本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyCostStats.map((item) => (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-gray-500">{item.date.slice(5)}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(item.totalCost / Math.max(...dailyCostStats.map((d) => d.totalCost), 1)) * 100}%`,
                          }}
                        >
                          {item.totalCost > 0 && (
                            <span className="text-xs text-white font-medium">
                              ${item.totalCost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  各模型成本分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelCostStats.map((item) => (
                    <div key={item.model || 'unknown'} className="flex items-center gap-4">
                      <div className="w-16 text-sm">
                        {item.model?.length > 12
                          ? item.model.slice(0, 12) + '...'
                          : item.model || '未知'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">
                            {item.totalTokens.toLocaleString()} tokens
                          </span>
                          <span className="font-medium">${item.totalCost.toFixed(4)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{
                              width: `${(item.totalCost / Math.max(...modelCostStats.map((m) => m.totalCost), 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="effect" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={MessageSquare}
              label="总对话数"
              value={effectSummary?.overview.totalConversations.toLocaleString() || 0}
              subValue="累计对话"
            />
            <StatCard
              icon={Star}
              label="平均评分"
              value={effectSummary?.rating.avgRating.toFixed(2) || '0.00'}
              subValue={`${effectSummary?.rating.ratedCount || 0} 次评价`}
            />
            <StatCard
              icon={Clock}
              label="平均响应时间"
              value={`${effectSummary?.latency.avgLatency.toFixed(0) || 0}ms`}
              subValue={`最大: ${effectSummary?.latency.maxLatency.toFixed(0) || 0}ms`}
            />
            <StatCard
              icon={Activity}
              label="消息总数"
              value={effectSummary?.overview.totalMessages.toLocaleString() || 0}
              subValue="所有对话"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  评分分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {effectSummary?.rating.positiveCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">好评</div>
                    <div className="text-xs text-green-600 mt-1">
                      {effectSummary?.rating.positiveRate}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">
                      {effectSummary?.rating.ratedCount -
                        (effectSummary?.rating.positiveCount || 0) -
                        (effectSummary?.rating.negativeCount || 0) || 0}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">中评</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {effectSummary?.rating.negativeCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">差评</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  响应时间统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">平均延迟</span>
                    <span className="font-bold text-blue-600">
                      {effectSummary?.latency.avgLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最小延迟</span>
                    <span className="font-bold text-green-600">
                      {effectSummary?.latency.minLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最大延迟</span>
                    <span className="font-bold text-orange-600">
                      {effectSummary?.latency.maxLatency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">统计样本</span>
                    <span className="font-bold text-gray-900">
                      {effectSummary?.latency.count} 次
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                应用对话统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">应用ID</th>
                      <th className="text-right py-3 px-4 font-medium">对话数</th>
                      <th className="text-right py-3 px-4 font-medium">消息数</th>
                      <th className="text-right py-3 px-4 font-medium">平均消息数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectSummary?.apps.map((app) => (
                      <tr key={app.appId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-600">
                          {app.appId?.slice(0, 8)}...
                        </td>
                        <td className="text-right py-3 px-4">
                          {app.conversationCount.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          {app.messageCount.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-500">
                          {(app.messageCount / Math.max(app.conversationCount, 1)).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
