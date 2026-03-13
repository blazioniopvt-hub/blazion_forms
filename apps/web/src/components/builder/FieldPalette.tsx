'use client';

import { FIELD_PALETTE, FieldType } from '@/types/form';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import {
  Type, AlignLeft, Mail, Hash, Phone, Link, CircleDot,
  CheckSquare, ChevronDown, Calendar, Clock, Upload,
  Star, Sliders, Heading, Text, Minus
} from 'lucide-react';
import React from 'react';

// ============================================
// Icon Map
// ============================================
const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type size={16} />,
  AlignLeft: <AlignLeft size={16} />,
  Mail: <Mail size={16} />,
  Hash: <Hash size={16} />,
  Phone: <Phone size={16} />,
  Link: <Link size={16} />,
  CircleDot: <CircleDot size={16} />,
  CheckSquare: <CheckSquare size={16} />,
  ChevronDown: <ChevronDown size={16} />,
  Calendar: <Calendar size={16} />,
  Clock: <Clock size={16} />,
  Upload: <Upload size={16} />,
  Star: <Star size={16} />,
  Sliders: <Sliders size={16} />,
  Heading: <Heading size={16} />,
  Text: <Text size={16} />,
  Minus: <Minus size={16} />,
};

// ============================================
// Field Palette Sidebar – click to add
// ============================================
export default function FieldPalette() {
  const { addField } = useFormBuilderStore();
  const categories = [
    { key: 'input', label: 'Input Fields' },
    { key: 'choice', label: 'Choice Fields' },
    { key: 'media', label: 'Media' },
    { key: 'layout', label: 'Layout' },
  ] as const;

  return (
    <div className="builder-sidebar">
      <div className="builder-sidebar-header">Add Fields</div>
      {categories.map((cat) => {
        const items = FIELD_PALETTE.filter((f) => f.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="field-palette-group">
            <div className="field-palette-group-title">{cat.label}</div>
            {items.map((item) => (
              <div
                key={item.type}
                className="field-palette-item"
                onClick={() => addField(item.type)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('fieldType', item.type);
                }}
              >
                <div className="field-icon">{ICON_MAP[item.icon]}</div>
                {item.label}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
