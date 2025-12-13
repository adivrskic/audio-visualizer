import React from "react";
import { Waves, SlidersHorizontal, Music } from "lucide-react";

const DraggablePanel = ({
  children,
  position,
  isDragging,
  onMouseDown,
  panelRef,
  isExpanded,
  onToggleExpand,
  onTogglePresets,
  showPresets,
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

        <div className="header-actions">
          {/* Disc/Music icon for preset tracks */}
          <button
            className={`header-action-btn ${showPresets ? "active" : ""}`}
            onClick={onTogglePresets}
            aria-label="Preset tracks"
            title="Preset tracks"
          >
            <Music size={12} />
          </button>

          {/* Filter icon for wave settings */}
          <button
            className={`expand-toggle ${isExpanded ? "active" : ""}`}
            onClick={onToggleExpand}
            aria-label={
              isExpanded ? "Hide wave settings" : "Show wave settings"
            }
            title="Wave settings"
          >
            <SlidersHorizontal size={12} />
          </button>
        </div>
      </div>

      <div className="panel-body">{children}</div>
    </div>
  );
};

export default DraggablePanel;
