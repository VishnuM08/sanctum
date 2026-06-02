export function exportData() {
  const data = {
    notes: localStorage.getItem('notes') || '[]',
    vault: localStorage.getItem('vault') || '[]',
    reminders: localStorage.getItem('reminders') || '[]',
    settings: localStorage.getItem('settings') || '{}',
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personal-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.notes) localStorage.setItem('notes', data.notes);
        if (data.vault) localStorage.setItem('vault', data.vault);
        if (data.reminders) localStorage.setItem('reminders', data.reminders);
        if (data.settings) localStorage.setItem('settings', data.settings);

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
