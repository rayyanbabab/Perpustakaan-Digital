export async function backupFirestoreData() {
  const response = await fetch('/api/settings/backup', {
    headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
  });
  if (!response.ok) throw new Error('Failed to fetch backup');
  const data = await response.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
