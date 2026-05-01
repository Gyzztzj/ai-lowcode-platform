import { useRef, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useBuilderStore } from "@/store/builderStore";

interface EdgeContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export const EdgeContextMenu = ({ position, onClose }: EdgeContextMenuProps) => {
  const selectedEdge = useBuilderStore((state) => state.selectedEdge);
  const deleteEdge = useBuilderStore((state) => state.deleteEdge);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = useCallback(() => {
    if (selectedEdge) {
      deleteEdge(selectedEdge.id);
    }
    onClose();
  }, [selectedEdge, deleteEdge, onClose]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (position) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [position, handleClickOutside]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <DropdownMenu open={true} onOpenChange={onClose}>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={handleDelete}
          >
            断开连接
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
