const isVersionLower = (current: string, latest: string) => {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }

  return false;
};

export { isVersionLower };