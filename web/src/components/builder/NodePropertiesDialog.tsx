import { useMemo, useRef } from "react";
import type { KnowledgeBase } from "@/types";
import { useAppStore } from "@/store/appStore";
import { useBuilderStore } from "@/store/builderStore";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Variable } from "lucide-react";

interface Branch {
  id?: string;
  label?: string;
  condition?: string;
  targetNodeId?: string;
}

interface VariableDef {
  name?: string;
  value?: string;
  type?: string;
}

interface NodePropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NodePropertiesDialog = ({
  open,
  onOpenChange,
}: NodePropertiesDialogProps) => {
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);

  const selectedNode = useBuilderStore((state) => state.selectedNode);
  const nodes = useBuilderStore((state) => state.nodes);
  const edges = useBuilderStore((state) => state.edges);
  const updateNode = useBuilderStore((state) => state.updateNode);
  const knowledgeBases = useAppStore((state) => state.knowledgeBases);
  const models = useAppStore((state) => state.models);
  const currentApp = useAppStore((state) => state.currentApp);

  const availableModels = useMemo(() => {
    return models.filter(
      (model) => model.type !== "EMBEDDING" && model.enabled,
    );
  }, [models]);

  const precedingNodes = useMemo(() => {
    if (!selectedNode) return [];

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inEdges = new Map<string, string[]>();
    edges.forEach((edge) => {
      const targets = inEdges.get(edge.target) || [];
      targets.push(edge.source);
      inEdges.set(edge.target, targets);
    });

    const visited = new Set<string>();
    const result: Array<{ id: string; label: string; type: string }> = [];
    const queue = [selectedNode.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const predecessors = inEdges.get(current) || [];
      for (const predId of predecessors) {
        if (!visited.has(predId)) {
          const predNode = nodeMap.get(predId);
          if (predNode && predNode.type !== "start") {
            result.push({
              id: predNode.id,
              label: (predNode.data.label as string) || predNode.type || "",
              type: predNode.type || "",
            });
          }
          queue.push(predId);
        }
      }
    }

    return result.reverse();
  }, [selectedNode, nodes, edges]);

  const availableVariables = useMemo(() => {
    const vars: Array<{ name: string; type: string; description: string }> = [
      { name: "userInput", type: "内置", description: "用户输入内容" },
    ];

    nodes.forEach((node) => {
      if (node.type === "variableSet" && node.data.variables) {
        const variables = node.data.variables as Array<{
          name: string;
          type: string;
        }>;
        variables.forEach((v) => {
          vars.push({
            name: v.name,
            type: v.type,
            description: `变量设置节点: ${(node.data.label as string) || node.type}`,
          });
        });
      }
    });

    return vars;
  }, [nodes]);

  if (!selectedNode) return null;

  const handleUpdate = (data: Record<string, unknown>) => {
    const processedData = { ...data };

    // 处理条件分支：确保每个分支都有稳定的id
    if (selectedNode.type === "condition" && processedData.branches) {
      const branches = processedData.branches as Array<Branch>;
      processedData.branches = branches.map((branch, index) => ({
        ...branch,
        id: branch.id || `branch-${index}`,
      }));
    }

    updateNode(selectedNode.id, processedData);
  };

  const insertVariable = (
    ref:
      | React.RefObject<HTMLTextAreaElement | null>
      | React.RefObject<HTMLInputElement | null>,
    varName: string,
    field: "systemPrompt" | "prompt" | "content" | "query",
  ) => {
    if (!ref.current) return;

    const element = ref.current;
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const value = element.value || "";
    const newValue =
      value.substring(0, start) + `{{${varName}}}` + value.substring(end);

    handleUpdate({ [field]: newValue });

    setTimeout(() => {
      element.focus();
      const newPosition = start + varName.length + 4;
      if ("setSelectionRange" in element) {
        element.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const renderNodeNameInput = () => (
    <div>
      <Label className="text-sm font-medium">节点名称</Label>
      <Input
        className="mt-1"
        value={(selectedNode.data.label as string) || ""}
        onChange={(e) => handleUpdate({ label: e.target.value })}
        placeholder="自定义节点名称"
      />
      <p className="text-xs text-gray-500 mt-1">
        给节点一个有意义的名称，方便识别和引用
      </p>
    </div>
  );

  const renderVariableHelper = (
    ref:
      | React.RefObject<HTMLTextAreaElement | null>
      | React.RefObject<HTMLInputElement | null>,
    field: "systemPrompt" | "prompt" | "content" | "query",
  ) => (
    <div className="mt-3 border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-medium text-gray-600">可用变量</Label>
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">内置</p>
          <div className="flex flex-wrap gap-1">
            {availableVariables
              .filter((v) => v.type === "内置")
              .map((v) => (
                <Button
                  key={v.name}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs bg-white border hover:bg-gray-100"
                  onClick={() => insertVariable(ref, v.name, field)}
                  title={v.description}
                >
                  <Variable className="h-3 w-3 mr-1" />
                  {"{"}
                  {v.name}
                  {"}"}
                </Button>
              ))}
          </div>
        </div>

        {availableVariables.filter((v) => v.type !== "内置").length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">自定义变量</p>
            <div className="flex flex-wrap gap-1">
              {availableVariables
                .filter((v) => v.type !== "内置")
                .map((v) => (
                  <Button
                    key={v.name}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs bg-white border hover:bg-gray-100"
                    onClick={() => insertVariable(ref, v.name, field)}
                    title={v.description}
                  >
                    <Variable className="h-3 w-3 mr-1" />
                    {"{"}
                    {v.name}
                    {"}"}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {precedingNodes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">前序节点输出</p>
            <div className="flex flex-wrap gap-1">
              {precedingNodes.map((node) => {
                const refName =
                  node.label && node.label !== node.type ? node.label : node.id;
                return (
                  <Button
                    key={node.id}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs bg-white border hover:bg-gray-100"
                    onClick={() => insertVariable(ref, refName, field)}
                    title={`节点类型: ${node.type}, ID: ${node.id}`}
                  >
                    <Variable className="h-3 w-3 mr-1" />
                    {"{"}
                    {refName}
                    {"}"}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProperties = () => {
    switch (selectedNode.type) {
      case "start":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <p className="text-sm text-gray-500">开始节点无需其他配置</p>
          </div>
        );
      case "end":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">自定义输出内容</Label>
              <Textarea
                className="mt-1 min-h-[100px]"
                value={(selectedNode.data.output as string) || ""}
                onChange={(e) => handleUpdate({ output: e.target.value })}
                placeholder="留空则自动使用最后一条消息作为输出"
              />
              <p className="text-xs text-gray-500 mt-1">
                优先级：自定义输出 &gt; 最后一条消息 &gt; 最后一个节点输出
              </p>
            </div>
          </div>
        );
      case "systemPrompt":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">提示词内容</Label>
              <Textarea
                ref={contentRef}
                className="mt-1 min-h-[100px]"
                value={(selectedNode.data.content as string) || ""}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                placeholder="你是一个有用的AI助手"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持变量插值：{"{"}variable{"}"}
              </p>
              {renderVariableHelper(contentRef, "content")}
            </div>
          </div>
        );
      case "userInput":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">变量名</Label>
              <Input
                className="mt-1"
                value={(selectedNode.data.variable as string) || "user_input"}
                onChange={(e) => handleUpdate({ variable: e.target.value })}
                placeholder="user_input"
              />
              <p className="text-xs text-gray-500 mt-1">
                将用户输入保存到指定变量
              </p>
            </div>
          </div>
        );
      case "llm":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">模型</Label>
              <Select
                value={
                  (selectedNode.data.model as string) ||
                  currentApp?.defaultModel ||
                  ""
                }
                onValueChange={(value) => handleUpdate({ model: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableModels.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  请先在模型管理中添加可用的模型
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">温度 (Temperature)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                className="mt-1"
                value={(selectedNode.data.temperature as number) || 0.7}
                onChange={(e) =>
                  handleUpdate({ temperature: Number(e.target.value) })
                }
                placeholder="0.7"
              />
              <p className="text-xs text-gray-500 mt-1">
                范围：0-2，越高越随机，越低越确定
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">系统提示词</Label>
              <Textarea
                ref={systemPromptRef}
                className="mt-1 min-h-[100px]"
                value={(selectedNode.data.systemPrompt as string) || ""}
                onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
                placeholder="你是一个有用的AI助手"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持变量插值：{"{"}variable{"}"}、{"{"}userInput{"}"}
              </p>
              {renderVariableHelper(systemPromptRef, "systemPrompt")}
            </div>
            <div>
              <Label className="text-sm font-medium">提示词模板</Label>
              <Textarea
                ref={promptRef}
                className="mt-1 min-h-[100px]"
                value={(selectedNode.data.prompt as string) || ""}
                onChange={(e) => handleUpdate({ prompt: e.target.value })}
                placeholder="请描述你想要输出的内容，留空则直接使用用户输入"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持变量插值：{"{"}variable{"}"}、{"{"}userInput{"}"}、{"{"}
                nodeLabel{"}"}
              </p>
              {renderVariableHelper(promptRef, "prompt")}
            </div>
          </div>
        );
      case "knowledgeBase":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">知识库</Label>
              <Select
                value={(selectedNode.data.knowledgeBaseId as string) || ""}
                onValueChange={(value) =>
                  handleUpdate({ knowledgeBaseId: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择知识库" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeBases.map((kb: KnowledgeBase) => (
                    <SelectItem key={kb.id} value={kb.id}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">查询内容（可选）</Label>
              <Input
                ref={queryRef}
                className="mt-1"
                value={(selectedNode.data.query as string) || ""}
                onChange={(e) => handleUpdate({ query: e.target.value })}
                placeholder="留空则自动使用用户输入"
              />
              <p className="text-xs text-gray-500 mt-1">
                支持变量插值：{"{"}variable{"}"}、{"{"}userInput{"}"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs bg-gray-50 border"
                  onClick={() => insertVariable(queryRef, "userInput", "query")}
                >
                  {"{"}userInput{"}"}
                </Button>
              </div>
            </div>
          </div>
        );
      case "condition":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">分支配置</Label>
              <div className="mt-2 space-y-3">
                {(
                  (selectedNode.data.branches as Array<Branch>) || []
                ).map((branch, index) => (
                  <div
                    key={branch.id || index}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        分支 {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          const branches =
                            (selectedNode.data.branches as Array<Branch>) || [];
                          const newBranches = branches.filter(
                            (_, i) => i !== index,
                          );
                          handleUpdate({ branches: newBranches });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">标签</Label>
                      <Input
                        className="mt-1"
                        value={branch.label || ""}
                        onChange={(e) => {
                          const branches =
                            (selectedNode.data.branches as Array<Branch>) || [];
                          const newBranches = [...branches];
                          newBranches[index] = {
                            ...newBranches[index],
                            label: e.target.value,
                          };
                          handleUpdate({ branches: newBranches });
                        }}
                        placeholder="技术问题"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">条件表达式</Label>
                      <Input
                        className="mt-1"
                        value={branch.condition || ""}
                        onChange={(e) => {
                          const branches =
                            (selectedNode.data.branches as Array<Branch>) || [];
                          const newBranches = [...branches];
                          newBranches[index] = {
                            ...newBranches[index],
                            condition: e.target.value,
                          };
                          handleUpdate({ branches: newBranches });
                        }}
                        placeholder="{{userInput}} contains 技术"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">目标节点 ID（可选）</Label>
                      <Input
                        className="mt-1"
                        value={branch.targetNodeId || ""}
                        onChange={(e) => {
                          const branches =
                            (selectedNode.data.branches as Array<Branch>) || [];
                          const newBranches = [...branches];
                          newBranches[index] = {
                            ...newBranches[index],
                            targetNodeId: e.target.value,
                          };
                          handleUpdate({ branches: newBranches });
                        }}
                        placeholder="留空则按连线顺序"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const branches =
                      (selectedNode.data.branches as Array<Branch>) || [];
                    // 先确保已有的分支都有id
                    const normalizedBranches = branches.map(
                      (branch, idx) => ({
                        ...branch,
                        id: branch.id || `branch-${idx}`,
                      }),
                    );
                    // 新增的分支用下一个索引
                    const newBranch = {
                      id: `branch-${normalizedBranches.length}`,
                      label: "",
                      condition: "",
                      targetNodeId: "",
                    };
                    handleUpdate({
                      branches: [...normalizedBranches, newBranch],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加分支
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">
                默认分支目标节点 ID（可选）
              </Label>
              <Input
                className="mt-1"
                value={(selectedNode.data.defaultBranch as string) || ""}
                onChange={(e) =>
                  handleUpdate({ defaultBranch: e.target.value })
                }
                placeholder="留空则使用第一条不符合条件的连线"
              />
            </div>
          </div>
        );
      case "variableSet":
        return (
          <div className="space-y-4">
            {renderNodeNameInput()}
            <div>
              <Label className="text-sm font-medium">变量配置</Label>
              <div className="mt-2 space-y-3">
                {(
                  (selectedNode.data.variables as Array<VariableDef>) || []
                ).map((variable, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        变量 {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          const variables =
                            (selectedNode.data.variables as Array<VariableDef>) ||
                            [];
                          const newVariables = variables.filter(
                            (_, i) => i !== index,
                          );
                          handleUpdate({ variables: newVariables });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">变量名</Label>
                      <Input
                        className="mt-1"
                        value={variable.name || ""}
                        onChange={(e) => {
                          const variables =
                            (selectedNode.data.variables as Array<VariableDef>) ||
                            [];
                          const newVariables = [...variables];
                          newVariables[index] = {
                            ...newVariables[index],
                            name: e.target.value,
                          };
                          handleUpdate({ variables: newVariables });
                        }}
                        placeholder="role"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">类型</Label>
                      <Select
                        value={variable.type || "string"}
                        onValueChange={(value) => {
                          const variables =
                            (selectedNode.data.variables as Array<VariableDef>) ||
                            [];
                          const newVariables = [...variables];
                          newVariables[index] = {
                            ...newVariables[index],
                            type: value,
                          };
                          handleUpdate({ variables: newVariables });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">字符串</SelectItem>
                          <SelectItem value="number">数字</SelectItem>
                          <SelectItem value="boolean">布尔值</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">变量值</Label>
                      <Textarea
                        className="mt-1 min-h-[60px]"
                        value={variable.value || ""}
                        onChange={(e) => {
                          const variables =
                            (selectedNode.data.variables as Array<VariableDef>) ||
                            [];
                          const newVariables = [...variables];
                          newVariables[index] = {
                            ...newVariables[index],
                            value: e.target.value,
                          };
                          handleUpdate({ variables: newVariables });
                        }}
                        placeholder="变量值"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const variables =
                      (selectedNode.data.variables as Array<VariableDef>) || [];
                    const newVariable = { name: "", value: "", type: "string" };
                    handleUpdate({ variables: [...variables, newVariable] });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加变量
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return <p className="text-gray-500">未知节点类型</p>;
    }
  };

  const nodeLabel = (selectedNode.data.label as string) || selectedNode.type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>节点属性</DialogTitle>
          <DialogDescription>
            编辑 {nodeLabel} 的属性
          </DialogDescription>
        </DialogHeader>
        <DialogContentScrollable>
          <div className="py-4">{renderProperties()}</div>
        </DialogContentScrollable>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodePropertiesDialog;
