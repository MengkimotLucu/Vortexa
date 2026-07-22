interface Window {
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  updateClauseField?: (idx: number, field: string, value: string) => void;
  deleteClause?: (idx: number) => void;
  updateItemField?: (idx: number, field: string, value: string) => void;
  deleteItem?: (idx: number) => void;
}

declare function showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info'): void;
