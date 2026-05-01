import { useEffect, useRef, useState } from "react";
import type { Node as ReactFlowNode } from "reactflow";
import { Settings, Copy, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import { v4 as uuidv4 } from "uuid";

interface NodeContextMenuProps {
  node: ReactFlowNode | null;
  position: { x: number; y: number };
  onClose: () => void;
  onEditProperties: () => void;
}

const NodeContextMenu = ({
  node,
  position,
  onClose,
  onEditProperties,
}: NodeContextMenuProps) => {
  const { deleteNode, addNode } = useBuilderStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
        onClose();
      }
    };

    const handleScroll = () => onClose();
    const handleResize = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + menuWidth > windowWidth) {
        x = windowWidth - menuWidth - 10;
      }
      if (y + menuHeight > windowHeight) {
        y = windowHeight - menuHeight - 10;
      }

      setMenuPosition({ x, y });
    }
  }, [position]);

  if (!node) return null;

  const handleCopy = () => {
    const newNode = {
      ...node,
      id: uuidv4(),
      position: {
        x: node.position.x + 200,
        y: node.position.y + 100,
      },
    };
    addNode(newNode);
    onClose();
  };

  const handleDelete = () => {
    deleteNode(node.id);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
      style={{ left: menuPosition.x, top: menuPosition.y }}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100"
        onClick={onEditProperties}
      >
        <Settings className="w-4 h-4" />
        编辑属性
      </button>
      {node.type !== "start" && node.type !== "end" && (
        <>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" />
            复制节点
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            删除节点
          </button>
        </>
      )}
    </div>
  );
};

export default NodeContextMenu;
