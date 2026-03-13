import { create } from 'zustand';
import { Form, FormField, FormTheme, DEFAULT_THEME, FieldType, FieldOption } from '@/types/form';

// ============================================
// Blazion Forms - Zustand State Store
// ============================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function generateOption(index: number): FieldOption {
  return { id: generateId(), label: `Option ${index + 1}`, value: `option_${index + 1}` };
}

function createDefaultField(type: FieldType, orderIndex: number, pageNumber: number): FormField {
  const defaultLabels: Record<FieldType, string> = {
    short_text: 'Short Text Question',
    long_text: 'Long Text Question',
    email: 'Email Address',
    number: 'Number Question',
    phone: 'Phone Number',
    url: 'Website URL',
    multiple_choice: 'Multiple Choice',
    checkbox: 'Checkbox Selection',
    dropdown: 'Dropdown Selection',
    date: 'Date Picker',
    time: 'Time Picker',
    file_upload: 'File Upload',
    rating: 'Rating',
    scale: 'Linear Scale',
    heading: 'Section Heading',
    paragraph: 'Description Text',
    divider: '',
  };

  const field: FormField = {
    id: generateId(),
    type,
    label: defaultLabels[type],
    description: '',
    placeholder: '',
    required: false,
    pageNumber,
    orderIndex,
    properties: {},
  };

  // Set default properties based on field type
  if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
    field.properties.options = [generateOption(0), generateOption(1), generateOption(2)];
  }
  if (type === 'rating') {
    field.properties.maxRating = 5;
  }
  if (type === 'scale') {
    field.properties.scaleMin = 1;
    field.properties.scaleMax = 10;
    field.properties.scaleMinLabel = 'Not at all';
    field.properties.scaleMaxLabel = 'Absolutely';
  }

  return field;
}

// ============================================
// Sample forms for the dashboard
// ============================================
export const SAMPLE_FORMS: Form[] = [
  {
    id: 'form_1',
    title: 'Customer Feedback Survey',
    description: 'Gather insights from your customers about their experience.',
    status: 'published',
    fields: [],
    theme: DEFAULT_THEME,
    totalPages: 1,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-11T14:30:00Z',
    responseCount: 142,
  },
  {
    id: 'form_2',
    title: 'Job Application Form',
    description: 'Collect resumes and candidate details for open positions.',
    status: 'published',
    fields: [],
    theme: { ...DEFAULT_THEME, primaryColor: '#059669' },
    totalPages: 3,
    createdAt: '2026-03-08T09:00:00Z',
    updatedAt: '2026-03-11T16:45:00Z',
    responseCount: 56,
  },
  {
    id: 'form_3',
    title: 'Event Registration',
    description: 'Registration form for the upcoming developer conference.',
    status: 'draft',
    fields: [],
    theme: { ...DEFAULT_THEME, primaryColor: '#dc2626' },
    totalPages: 2,
    createdAt: '2026-03-11T12:00:00Z',
    updatedAt: '2026-03-11T12:00:00Z',
    responseCount: 0,
  },
];

// ============================================
// Builder Store
// ============================================
interface FormBuilderState {
  // Current form being edited
  currentForm: Form | null;
  // Selected field in the builder
  selectedFieldId: string | null;
  // Current page in the builder
  currentPage: number;
  // View mode
  viewMode: 'edit' | 'preview';
  // All forms (for dashboard)
  forms: Form[];
  // Drag state
  draggedFieldType: FieldType | null;

  // Actions
  createNewForm: (title: string, description?: string) => void;
  loadForm: (formId: string) => void;
  setCurrentForm: (form: Form) => void;
  addField: (type: FieldType) => void;
  removeField: (fieldId: string) => void;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  selectField: (fieldId: string | null) => void;
  moveField: (fieldId: string, direction: 'up' | 'down') => void;
  duplicateField: (fieldId: string) => void;
  setCurrentPage: (page: number) => void;
  addPage: () => void;
  removePage: (page: number) => void;
  setViewMode: (mode: 'edit' | 'preview') => void;
  updateFormTitle: (title: string) => void;
  updateFormDescription: (description: string) => void;
  updateTheme: (updates: Partial<FormTheme>) => void;
  setDraggedFieldType: (type: FieldType | null) => void;
  addFieldOption: (fieldId: string) => void;
  removeFieldOption: (fieldId: string, optionId: string) => void;
  updateFieldOption: (fieldId: string, optionId: string, updates: Partial<FieldOption>) => void;
  deleteForm: (formId: string) => void;
  publishForm: (formId: string) => void;
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  currentForm: null,
  selectedFieldId: null,
  currentPage: 1,
  viewMode: 'edit',
  forms: SAMPLE_FORMS,
  draggedFieldType: null,

  createNewForm: (title, description) => {
    const newForm: Form = {
      id: generateId(),
      title,
      description,
      status: 'draft',
      fields: [],
      theme: { ...DEFAULT_THEME },
      totalPages: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseCount: 0,
    };
    set((s) => ({ forms: [...s.forms, newForm], currentForm: newForm, selectedFieldId: null, currentPage: 1 }));
  },

  loadForm: (formId) => {
    const form = get().forms.find((f) => f.id === formId);
    if (form) {
      set({ currentForm: { ...form }, selectedFieldId: null, currentPage: 1, viewMode: 'edit' });
    }
  },

  setCurrentForm: (form) => set({ currentForm: form }),

  addField: (type) => {
    const { currentForm, currentPage } = get();
    if (!currentForm) return;
    const fieldsOnPage = currentForm.fields.filter((f) => f.pageNumber === currentPage);
    const newField = createDefaultField(type, fieldsOnPage.length, currentPage);
    const updatedForm = {
      ...currentForm,
      fields: [...currentForm.fields, newField],
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      currentForm: updatedForm,
      selectedFieldId: newField.id,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  removeField: (fieldId) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedFields = currentForm.fields.filter((f) => f.id !== fieldId);
    const updatedForm = { ...currentForm, fields: updatedFields, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      selectedFieldId: s.selectedFieldId === fieldId ? null : s.selectedFieldId,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  updateField: (fieldId, updates) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedFields = currentForm.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f));
    const updatedForm = { ...currentForm, fields: updatedFields, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  moveField: (fieldId, direction) => {
    const { currentForm, currentPage } = get();
    if (!currentForm) return;
    const pageFields = currentForm.fields
      .filter((f) => f.pageNumber === currentPage)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const index = pageFields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pageFields.length - 1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = pageFields[index].orderIndex;
    pageFields[index].orderIndex = pageFields[swapIndex].orderIndex;
    pageFields[swapIndex].orderIndex = tempOrder;
    const otherFields = currentForm.fields.filter((f) => f.pageNumber !== currentPage);
    const updatedForm = { ...currentForm, fields: [...otherFields, ...pageFields], updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  duplicateField: (fieldId) => {
    const { currentForm, currentPage } = get();
    if (!currentForm) return;
    const field = currentForm.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const fieldsOnPage = currentForm.fields.filter((f) => f.pageNumber === currentPage);
    const newField: FormField = {
      ...JSON.parse(JSON.stringify(field)),
      id: generateId(),
      label: field.label + ' (Copy)',
      orderIndex: fieldsOnPage.length,
    };
    const updatedForm = {
      ...currentForm,
      fields: [...currentForm.fields, newField],
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      currentForm: updatedForm,
      selectedFieldId: newField.id,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  setCurrentPage: (page) => set({ currentPage: page, selectedFieldId: null }),

  addPage: () => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedForm = { ...currentForm, totalPages: currentForm.totalPages + 1, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      currentPage: updatedForm.totalPages,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  removePage: (page) => {
    const { currentForm } = get();
    if (!currentForm || currentForm.totalPages <= 1) return;
    const updatedFields = currentForm.fields
      .filter((f) => f.pageNumber !== page)
      .map((f) => (f.pageNumber > page ? { ...f, pageNumber: f.pageNumber - 1 } : f));
    const updatedForm = {
      ...currentForm,
      fields: updatedFields,
      totalPages: currentForm.totalPages - 1,
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      currentForm: updatedForm,
      currentPage: Math.min(s.currentPage, updatedForm.totalPages),
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  updateFormTitle: (title) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedForm = { ...currentForm, title, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  updateFormDescription: (description) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedForm = { ...currentForm, description, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  updateTheme: (updates) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedForm = { ...currentForm, theme: { ...currentForm.theme, ...updates }, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  setDraggedFieldType: (type) => set({ draggedFieldType: type }),
  addFieldOption: (fieldId) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const field = currentForm.fields.find((f) => f.id === fieldId);
    if (!field || !field.properties.options) return;
    const newOption = generateOption(field.properties.options.length);
    const updatedFields = currentForm.fields.map((f) =>
      f.id === fieldId ? { ...f, properties: { ...f.properties, options: [...(f.properties.options || []), newOption] } } : f
    );
    const updatedForm = { ...currentForm, fields: updatedFields, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  removeFieldOption: (fieldId, optionId) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedFields = currentForm.fields.map((f) =>
      f.id === fieldId
        ? { ...f, properties: { ...f.properties, options: (f.properties.options || []).filter((o) => o.id !== optionId) } }
        : f
    );
    const updatedForm = { ...currentForm, fields: updatedFields, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  updateFieldOption: (fieldId, optionId, updates) => {
    const { currentForm } = get();
    if (!currentForm) return;
    const updatedFields = currentForm.fields.map((f) =>
      f.id === fieldId
        ? {
            ...f,
            properties: {
              ...f.properties,
              options: (f.properties.options || []).map((o) => (o.id === optionId ? { ...o, ...updates } : o)),
            },
          }
        : f
    );
    const updatedForm = { ...currentForm, fields: updatedFields, updatedAt: new Date().toISOString() };
    set((s) => ({
      currentForm: updatedForm,
      forms: s.forms.map((f) => (f.id === updatedForm.id ? updatedForm : f)),
    }));
  },
  deleteForm: (formId) => {
    set((s) => ({
      forms: s.forms.filter((f) => f.id !== formId),
      currentForm: s.currentForm?.id === formId ? null : s.currentForm,
    }));
  },
  publishForm: (formId) => {
    set((s) => ({
      forms: s.forms.map((f) => (f.id === formId ? { ...f, status: 'published' as const } : f)),
      currentForm: s.currentForm?.id === formId ? { ...s.currentForm, status: 'published' as const } : s.currentForm,
    }));
  },
}));
