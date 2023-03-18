export function centre(str: string, len: number) {
  const pad = Math.ceil((len - str.length) / 2);
  return (''.padStart(pad, ' ') + str + ''.padStart(pad, ' ')).substring(0, len);
}

export function watts(w: number, suffix = 'W', lpad = 0, rpad = 0) {
  return (w.toString() + ' ' + suffix).padStart(lpad, ' ').padEnd(rpad, ' ');
}

