// ============================================
// Blazion Forms - Core Type Definitions
// ============================================

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'number'
  | 'phone'
  | 'url'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'rating'
  | 'scale'
  | 'heading'
  | 'paragraph'
  | 'divider';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  pageNumber: number;
  orderIndex: number;
  properties: {
    options?: FieldOption[];
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    maxRating?: number;
    scaleMin?: number;
    scaleMax?: number;
    scaleMinLabel?: string;
    scaleMaxLabel?: string;
  };
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  questionSpacing: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'closed';
  fields: FormField[];
  theme: FormTheme;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
  responseCount: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, string | string[] | number>;
  submittedAt: string;
  isCompleted: boolean;
}

// Field palette metadata
export interface FieldPaletteItem {
  type: FieldType;
  label: string;
  icon: string;
  category: 'input' | 'choice' | 'media' | 'layout';
}

export const FIELD_PALETTE: FieldPaletteItem[] = [
  { type: 'short_text', label: 'Short Text', icon: 'Type', category: 'input' },
  { type: 'long_text', label: 'Long Text', icon: 'AlignLeft', category: 'input' },
  { type: 'email', label: 'Email', icon: 'Mail', category: 'input' },
  { type: 'number', label: 'Number', icon: 'Hash', category: 'input' },
  { type: 'phone', label: 'Phone', icon: 'Phone', category: 'input' },
  { type: 'url', label: 'URL', icon: 'Link', category: 'input' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: 'CircleDot', category: 'choice' },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare', category: 'choice' },
  { type: 'dropdown', label: 'Dropdown', icon: 'ChevronDown', category: 'choice' },
  { type: 'date', label: 'Date', icon: 'Calendar', category: 'input' },
  { type: 'time', label: 'Time', icon: 'Clock', category: 'input' },
  { type: 'file_upload', label: 'File Upload', icon: 'Upload', category: 'media' },
  { type: 'rating', label: 'Rating', icon: 'Star', category: 'choice' },
  { type: 'scale', label: 'Scale', icon: 'Sliders', category: 'choice' },
  { type: 'heading', label: 'Heading', icon: 'Heading', category: 'layout' },
  { type: 'paragraph', label: 'Paragraph', icon: 'Text', category: 'layout' },
  { type: 'divider', label: 'Divider', icon: 'Minus', category: 'layout' },
];

export const DEFAULT_THEME: FormTheme = {
  primaryColor: '#7c3aed',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter',
  borderRadius: '12px',
  questionSpacing: '24px',
};
