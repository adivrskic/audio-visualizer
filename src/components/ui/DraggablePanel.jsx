import React from "react";
import { Waves, ChevronDown, ChevronUp } from "lucide-react";

const DraggablePanel = ({
  children,
  position,
  isDragging,
  onMouseDown,
  panelRef,
  isExpanded,
  onToggleExpand,
  deviceType,
  className = "",
}) => {
  return (
    <div
      ref={panelRef}
      className={`draggable-panel ${isDragging ? "dragging" : ""} ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="panel-header draggable-handle" onMouseDown={onMouseDown}>
        <div className="header-content">
          <Waves size={14} />
          <span className="panel-title">WAVE</span>
          <span className="device-tag">{deviceType}</span>
        </div>
        <button
          className="expand-toggle"
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
        >
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <div className="panel-body">{children}</div>
    </div>
  );
};

export default DraggablePanel;
