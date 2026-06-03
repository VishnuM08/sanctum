import type {
  DatabaseRow, DatabaseProperty,
  DatabaseFilterConfig, DatabaseSortConfig, DatabaseCellValue,
} from '../types';

function matchesCondition(
  value: DatabaseCellValue,
  condition: string,
  filterValue: DatabaseCellValue,
): boolean {
  const isEmpty = value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0);

  switch (condition) {
    case 'is_empty':     return isEmpty;
    case 'is_not_empty': return !isEmpty;
    case 'is_checked':   return value === true;
    case 'is_not_checked': return value !== true;
  }

  if (isEmpty && condition !== 'equals') return false;

  const strVal    = String(value ?? '').toLowerCase();
  const strFilter = String(filterValue ?? '').toLowerCase();
  const numVal    = Number(value);
  const numFilter = Number(filterValue);

  switch (condition) {
    case 'contains':     return strVal.includes(strFilter);
    case 'not_contains': return !strVal.includes(strFilter);
    case 'equals':       return strVal === strFilter;
    case 'not_equals':   return strVal !== strFilter;
    case 'starts_with':  return strVal.startsWith(strFilter);
    case 'ends_with':    return strVal.endsWith(strFilter);
    case 'gt':  return numVal >  numFilter;
    case 'gte': return numVal >= numFilter;
    case 'lt':  return numVal <  numFilter;
    case 'lte': return numVal <= numFilter;
    case 'before': {
      try { return new Date(strVal) < new Date(strFilter); } catch { return false; }
    }
    case 'after': {
      try { return new Date(strVal) > new Date(strFilter); } catch { return false; }
    }
    default: return true;
  }
}

export function applyFiltersAndSorts(
  rows: DatabaseRow[],
  filters: DatabaseFilterConfig[],
  sorts: DatabaseSortConfig[],
  properties: DatabaseProperty[],
): DatabaseRow[] {
  let result = [...rows];

  // Filter
  if (filters.length > 0) {
    result = result.filter((row) =>
      filters.every((f) => {
        const prop = properties.find((p) => p.id === f.propertyId);
        if (!prop) return true;
        return matchesCondition(row.values[f.propertyId] ?? null, f.condition, f.value);
      }),
    );
  }

  // Sort
  if (sorts.length > 0) {
    result.sort((a, b) => {
      for (const sort of sorts) {
        const av = a.values[sort.propertyId];
        const bv = b.values[sort.propertyId];
        let cmp = 0;
        if (av == null && bv == null) cmp = 0;
        else if (av == null) cmp = 1;
        else if (bv == null) cmp = -1;
        else if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv;
        } else if (typeof av === 'boolean' && typeof bv === 'boolean') {
          cmp = (av ? 1 : 0) - (bv ? 1 : 0);
        } else {
          cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
        }
        if (sort.direction === 'desc') cmp = -cmp;
        if (cmp !== 0) return cmp;
      }
      return a.order - b.order;
    });
  } else {
    result.sort((a, b) => a.order - b.order);
  }

  return result;
}

export const FILTER_CONDITIONS: Record<string, { label: string; conditions: { value: string; label: string }[] }> = {
  text: {
    label: 'Text',
    conditions: [
      { value: 'contains',     label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
      { value: 'equals',       label: 'Is' },
      { value: 'not_equals',   label: 'Is not' },
      { value: 'starts_with',  label: 'Starts with' },
      { value: 'ends_with',    label: 'Ends with' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  title: {
    label: 'Title',
    conditions: [
      { value: 'contains',     label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
      { value: 'equals',       label: 'Is' },
      { value: 'not_equals',   label: 'Is not' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  number: {
    label: 'Number',
    conditions: [
      { value: 'equals',       label: '=' },
      { value: 'not_equals',   label: '≠' },
      { value: 'gt',           label: '>' },
      { value: 'gte',          label: '≥' },
      { value: 'lt',           label: '<' },
      { value: 'lte',          label: '≤' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  select: {
    label: 'Select',
    conditions: [
      { value: 'equals',       label: 'Is' },
      { value: 'not_equals',   label: 'Is not' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  multiSelect: {
    label: 'Multi-select',
    conditions: [
      { value: 'contains',     label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  date: {
    label: 'Date',
    conditions: [
      { value: 'equals',       label: 'Is' },
      { value: 'before',       label: 'Is before' },
      { value: 'after',        label: 'Is after' },
      { value: 'is_empty',     label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' },
    ],
  },
  checkbox: {
    label: 'Checkbox',
    conditions: [
      { value: 'is_checked',     label: 'Is checked' },
      { value: 'is_not_checked', label: 'Is not checked' },
    ],
  },
};
